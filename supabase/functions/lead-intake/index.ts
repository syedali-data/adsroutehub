import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { routeLeadInternal } from "../_shared/router.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

// Zod schema for input validation
const LeadSchema = z.object({
  campaign_slug: z.string().max(100).optional(),
  name: z.string().trim().min(1, "Name is required").max(200, "Name too long"),
  email: z.string().email("Invalid email format").max(255, "Email too long"),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone format (use E.164 format)").max(20),
  city: z.string().min(2, "City too short").max(100, "City too long"),
  service_type: z.string().min(2, "Service type too short").max(100, "Service type too long"),
  budget_raw: z.string().max(500, "Budget description too long").optional(),
  notes: z.string().max(2000, "Notes too long").optional(),
  exclusivity: z.enum(['shared', 'exclusive']).optional().default('shared'),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate API key
    const apiKey = req.headers.get('x-api-key');
    const validApiKey = Deno.env.get('LEAD_INTAKE_API_KEY');
    
    if (!apiKey || apiKey !== validApiKey) {
      console.warn('Unauthorized lead intake attempt');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const rawPayload = await req.json();
    
    // Validate and sanitize input
    let payload;
    try {
      payload = LeadSchema.parse(rawPayload);
    } catch (validationError) {
      console.error('Validation error:', validationError);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid input', 
          details: validationError instanceof z.ZodError ? validationError.errors : 'Validation failed'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const { campaign_slug, name, email, phone, city, service_type, budget_raw, notes, exclusivity } = payload;

    // Dedupe check - date-based hash for 24h window
    const today = new Date().toISOString().split('T')[0]; // "2025-11-07"
    const hash_24h = `${email.toLowerCase()}_${phone}_${today}`;

    // Check for duplicates in last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: existingLead } = await supabase
      .from('leads')
      .select('id')
      .eq('hash_24h', hash_24h)
      .gte('created_at', twentyFourHoursAgo)
      .maybeSingle();

    if (existingLead) {
      return new Response(
        JSON.stringify({ error: 'Duplicate lead detected within 24 hours' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find campaign
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('id')
      .eq('slug', campaign_slug || 'default')
      .single();

    // Insert lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert({
        campaign_id: campaign?.id,
        name,
        email,
        phone,
        city: city.toLowerCase(),
        service_type: service_type.toLowerCase(),
        budget_raw,
        notes,
        exclusivity: exclusivity || 'shared',
        hash_24h,
        status: 'new',
      })
      .select()
      .single();

    if (leadError) throw leadError;

    // Check settings for n8n routing
    const { data: settings } = await supabase.from('settings').select('*');
    const settingsMap = Object.fromEntries(settings?.map(s => [s.key, s.value]) || []);

    // Use n8n routing ONLY if explicitly enabled AND webhook URL is configured
    const useN8nRouter = settingsMap['USE_N8N_ROUTER'] === 'true';
    const n8nWebhookUrl = settingsMap['N8N_ROUTER_WEBHOOK_URL']?.trim();

    if (useN8nRouter && n8nWebhookUrl) {
      console.log('[Lead Intake] Using n8n routing');
      // Call n8n webhook
      await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: lead.id, ...lead }),
      });
    } else {
      // Internal routing (default behavior)
      console.log('[Lead Intake] Using internal routing for lead:', {
        lead_id: lead.id,
        city: city.toLowerCase(),
        service_type: service_type.toLowerCase(),
        exclusivity: exclusivity || 'shared',
      });
      
      // Route the lead using shared routing logic
      const routingResult = await routeLeadInternal(supabase, {
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        city: city.toLowerCase(),
        service_type: service_type.toLowerCase(),
        exclusivity: exclusivity || 'shared',
        campaign_id: campaign?.id,
      }, false);

      console.log(`[Lead Intake] Routing complete: ${routingResult.selected.length} of ${routingResult.candidates.length} buyers selected`);
      
      if (routingResult.selected.length === 0) {
        console.warn('[Lead Intake] No buyers selected for lead. Candidates:', 
          routingResult.candidates.map(c => ({
            buyer: c.buyer.business_name,
            reason: c.reason
          }))
        );
      }

      // Send SMS notifications after all deliveries are created
      const smsEnabled = settingsMap['ENABLE_SMS_DELIVERY'] === 'true';
      const twilioSid = settingsMap['TWILIO_ACCOUNT_SID'];
      const twilioToken = settingsMap['TWILIO_AUTH_TOKEN'];
      const twilioFrom = settingsMap['TWILIO_FROM_NUMBER'];

      if (smsEnabled && twilioSid && twilioToken && twilioFrom) {
        console.log('[Lead Intake] SMS delivery enabled, processing notifications...');
        
        for (const { buyer, calculated_charge_amount } of routingResult.selected) {
          // Check if buyer has SMS enabled and phone configured
          if (!buyer.sms_enabled) {
            console.log(`[Lead Intake] SMS disabled for buyer ${buyer.id}, skipping`);
            continue;
          }
          
          if (!buyer.sms_phone || buyer.sms_phone.trim() === '') {
            console.log(`[Lead Intake] No SMS phone configured for buyer ${buyer.id}, skipping`);
            continue;
          }

          // Construct SMS message (keep under 160 chars)
          const smsBody = `New lead: ${lead.name}, ${lead.city}, ${lead.service_type}. Phone: ${lead.phone}. Price: $${calculated_charge_amount}.`;

          try {
            // Send SMS via Twilio REST API
            const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
            const authHeader = 'Basic ' + btoa(`${twilioSid}:${twilioToken}`);
            
            const formBody = new URLSearchParams({
              To: buyer.sms_phone,
              From: twilioFrom,
              Body: smsBody,
            });

            const smsResponse = await fetch(twilioUrl, {
              method: 'POST',
              headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: formBody.toString(),
            });

            if (!smsResponse.ok) {
              const errorText = await smsResponse.text();
              console.error(`[Lead Intake] Twilio SMS error for buyer ${buyer.id}:`, smsResponse.status, errorText);
            } else {
              console.log(`[Lead Intake] SMS sent successfully to buyer ${buyer.id} at ${buyer.sms_phone}`);
            }
          } catch (smsError) {
            console.error(`[Lead Intake] Exception sending SMS to buyer ${buyer.id}:`, smsError);
          }
        }
      } else {
        if (!smsEnabled) {
          console.log('[Lead Intake] SMS delivery globally disabled');
        } else {
          console.log('[Lead Intake] Twilio credentials not fully configured, skipping SMS');
        }
      }
    }

    // Build response with delivery details
    let response: any = { 
      success: true, 
      lead_id: lead.id,
      status: 'created'
    };

    // If we used internal routing, include routing results
    if (!useN8nRouter || !n8nWebhookUrl) {
      // We need to access the routing result from earlier
      // Re-fetch deliveries to confirm what was created
      const { data: deliveries } = await supabase
        .from('deliveries')
        .select(`
          id,
          buyer_id,
          charge_amount,
          buyers (
            business_name,
            email
          )
        `)
        .eq('lead_id', lead.id);

      response.status = 'routed';
      response.deliveries_created = deliveries?.map((d: any) => ({
        delivery_id: d.id,
        buyer_id: d.buyer_id,
        business_name: Array.isArray(d.buyers) && d.buyers.length > 0 ? d.buyers[0].business_name : 'Unknown',
        charge_amount: d.charge_amount,
        used_free_lead: d.charge_amount === 0,
      })) || [];
      
      console.log(`[Lead Intake] Response: ${response.deliveries_created.length} deliveries created for lead ${lead.id}`);
    }

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Lead intake error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});