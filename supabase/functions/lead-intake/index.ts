import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

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

    if (settingsMap['USE_N8N_ROUTER'] === 'true') {
      // Call n8n webhook
      await fetch(settingsMap['N8N_ROUTER_WEBHOOK_URL'], {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: lead.id, ...lead }),
      });
    } else {
      // Internal routing logic
      // Internal routing logic - find eligible buyers
      const { data: buyers } = await supabase
        .from('buyers')
        .select('*')
        .eq('status', 'active')
        .ilike('services_csv', `%${service_type}%`)
        .eq('city', city.toLowerCase());

      // Filter buyers under daily cap
      let eligibleBuyers = buyers?.filter(b => b.daily_sent < b.daily_cap) || [];

      // For shared leads, also enforce shared_cap per lead
      if (exclusivity === 'shared' && eligibleBuyers.length > 0) {
        const buyerIds = eligibleBuyers.map(b => b.id);
        
        // Count existing deliveries per buyer for this lead
        const { data: existingDeliveries } = await supabase
          .from('deliveries')
          .select('buyer_id')
          .eq('lead_id', lead.id)
          .in('buyer_id', buyerIds);
        
        const deliveryCountByBuyer: Record<string, number> = {};
        existingDeliveries?.forEach(d => {
          deliveryCountByBuyer[d.buyer_id] = (deliveryCountByBuyer[d.buyer_id] || 0) + 1;
        });
        
        // Filter out buyers who have reached shared_cap for this lead
        eligibleBuyers = eligibleBuyers.filter(b => {
          const deliveryCount = deliveryCountByBuyer[b.id] || 0;
          return deliveryCount < b.shared_cap;
        });
      }

      // Sort by response_rate and take top N
      const selectedBuyers = eligibleBuyers
        .sort((a, b) => b.response_rate - a.response_rate)
        .slice(0, exclusivity === 'exclusive' ? 1 : 3);

      // Create deliveries
      const createdDeliveries: Array<{ buyer: any; chargeAmount: number }> = [];
      
      for (const buyer of selectedBuyers) {
        // Determine charge amount based on free leads
        let chargeAmount: number;
        let newFreeLeadsLeft = buyer.free_leads_left;
        
        if (buyer.free_leads_left > 0) {
          // Use free lead credit
          chargeAmount = 0;
          newFreeLeadsLeft = buyer.free_leads_left - 1;
        } else {
          // Normal pricing
          chargeAmount = exclusivity === 'exclusive' ? buyer.price_exclusive : buyer.price_shared;
        }
        
        // Insert delivery
        await supabase.from('deliveries').insert({
          lead_id: lead.id,
          buyer_id: buyer.id,
          campaign_id: campaign?.id,
          charge_amount: chargeAmount,
          source: 'internal',
        });

        // Update buyer: increment daily_sent and decrement free_leads_left
        await supabase
          .from('buyers')
          .update({ 
            daily_sent: buyer.daily_sent + 1,
            free_leads_left: newFreeLeadsLeft
          })
          .eq('id', buyer.id);
        
        // Track for SMS sending
        createdDeliveries.push({ buyer, chargeAmount });
      }

      // Send SMS notifications after all deliveries are created
      const smsEnabled = settingsMap['ENABLE_SMS_DELIVERY'] === 'true';
      const twilioSid = settingsMap['TWILIO_ACCOUNT_SID'];
      const twilioToken = settingsMap['TWILIO_AUTH_TOKEN'];
      const twilioFrom = settingsMap['TWILIO_FROM_NUMBER'];

      if (smsEnabled && twilioSid && twilioToken && twilioFrom) {
        console.log('[Lead Intake] SMS delivery enabled, processing notifications...');
        
        for (const { buyer, chargeAmount } of createdDeliveries) {
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
          const smsBody = `New lead: ${lead.name}, ${lead.city}, ${lead.service_type}. Phone: ${lead.phone}. Price: $${chargeAmount}.`;

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

    return new Response(
      JSON.stringify({ success: true, lead_id: lead.id }),
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