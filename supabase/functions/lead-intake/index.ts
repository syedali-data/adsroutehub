import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { routeLeadInternal } from "../_shared/router.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

// Company information for emails
const COMPANY_INFO = {
  productName: 'ADS RouteHub',
  companyName: 'Analyticals Data Services (ADS)',
  supportEmail: 'support@analyticals.ca',
  addressLines: [
    'Analyticals Data Services (ADS)',
    '1061-Eagletrace Drive',
    'London, Ontario N6G0T3',
    'Canada',
  ],
  appBaseUrl: 'https://adsroutehub.com',
};

/**
 * Build email content for buyer lead notification
 */
function buildBuyerLeadEmail(
  buyer: { business_name: string | null; email: string | null },
  lead: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    city: string | null;
    service_type: string | null;
    notes?: string | null;
    budget_raw?: string | null;
  },
  chargeAmount: number,
  exclusivity: 'shared' | 'exclusive'
): { subject: string; html: string; text: string } {
  // Format charge amount
  const priceFormatted = `$${chargeAmount.toFixed(2)}`;
  
  // Build subject line
  const serviceText = lead.service_type || 'lead';
  const cityText = lead.city || '';
  const subjectPrefix = exclusivity === 'exclusive' ? 'Exclusive lead' : 'New lead';
  const subject = cityText 
    ? `${subjectPrefix} from ${COMPANY_INFO.productName} – ${serviceText} in ${cityText}`
    : `${subjectPrefix} from ${COMPANY_INFO.productName}`;

  // Build HTML email
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; }
    .header h1 { margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; }
    .header p { margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px; }
    .content { padding: 30px; }
    .intro { margin: 0 0 24px 0; font-size: 16px; line-height: 1.5; color: #333333; }
    .intro strong { color: #667eea; }
    .lead-card { background-color: #f8f9fa; border: 2px solid #667eea; border-radius: 8px; padding: 20px; margin: 24px 0; }
    .lead-card h2 { margin: 0 0 16px 0; font-size: 20px; color: #333333; }
    .lead-summary { display: table; width: 100%; margin-bottom: 16px; }
    .lead-summary-row { display: table-row; }
    .lead-summary-label { display: table-cell; padding: 6px 0; font-weight: 600; color: #666666; width: 30%; }
    .lead-summary-value { display: table-cell; padding: 6px 0; color: #333333; }
    .lead-type { display: inline-block; padding: 4px 12px; background-color: ${exclusivity === 'exclusive' ? '#10b981' : '#3b82f6'}; color: #ffffff; border-radius: 4px; font-size: 13px; font-weight: 600; margin-right: 8px; }
    .price { display: inline-block; font-size: 18px; font-weight: 700; color: #667eea; }
    .details-list { list-style: none; padding: 0; margin: 0; }
    .details-list li { padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-size: 15px; color: #333333; }
    .details-list li:last-child { border-bottom: none; }
    .details-list strong { color: #666666; font-weight: 600; min-width: 100px; display: inline-block; }
    .cta { text-align: center; margin: 32px 0; }
    .cta-button { display: inline-block; padding: 16px 32px; background-color: #667eea; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; }
    .cta-button:hover { background-color: #5568d3; }
    .secondary-text { text-align: center; margin: 16px 0; font-size: 14px; color: #666666; line-height: 1.5; }
    .footer { background-color: #f8f9fa; padding: 24px 30px; border-top: 1px solid #e5e7eb; }
    .footer p { margin: 8px 0; font-size: 13px; color: #666666; line-height: 1.6; }
    .footer a { color: #667eea; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${COMPANY_INFO.productName}</h1>
      <p>Lead Alert</p>
    </div>
    
    <div class="content">
      <p class="intro">
        You have a <strong>new lead</strong> from ${COMPANY_INFO.productName}. 
        <strong>Respond within 5–10 minutes</strong> for the best chance of winning this job.
      </p>
      
      <div class="lead-card">
        <h2>${lead.name || 'New Lead'}</h2>
        <div class="lead-summary">
          <div class="lead-summary-row">
            <div class="lead-summary-label">City:</div>
            <div class="lead-summary-value">${lead.city || 'N/A'}</div>
          </div>
          <div class="lead-summary-row">
            <div class="lead-summary-label">Service:</div>
            <div class="lead-summary-value">${lead.service_type || 'N/A'}</div>
          </div>
          <div class="lead-summary-row">
            <div class="lead-summary-label">Lead Type:</div>
            <div class="lead-summary-value">
              <span class="lead-type">${exclusivity === 'exclusive' ? 'Exclusive' : 'Shared'}</span>
              <span class="price">${priceFormatted}</span>
            </div>
          </div>
        </div>
      </div>
      
      <ul class="details-list">
        <li><strong>Name:</strong> ${lead.name || 'N/A'}</li>
        <li><strong>Phone:</strong> ${lead.phone || 'N/A'} ${lead.phone ? '(call ASAP)' : ''}</li>
        <li><strong>Email:</strong> ${lead.email || 'N/A'}</li>
        <li><strong>City:</strong> ${lead.city || 'N/A'}</li>
        <li><strong>Service:</strong> ${lead.service_type || 'N/A'}</li>
        ${lead.budget_raw ? `<li><strong>Budget:</strong> ${lead.budget_raw}</li>` : ''}
        ${lead.notes ? `<li><strong>Notes:</strong> ${lead.notes}</li>` : ''}
      </ul>
      
      <div class="cta">
        <a href="${COMPANY_INFO.appBaseUrl}/buyer" class="cta-button">View this lead in your buyer dashboard</a>
      </div>
      
      <p class="secondary-text">
        From your buyer dashboard you can adjust lead caps, pause your account, and review your recent leads.
      </p>
    </div>
    
    <div class="footer">
      <p>You're receiving this email because your business is configured to receive leads from ${COMPANY_INFO.productName}.</p>
      <p>To stop receiving new lead alerts, update your notification preferences in your <a href="${COMPANY_INFO.appBaseUrl}/buyer">buyer portal</a> or contact us at <a href="mailto:${COMPANY_INFO.supportEmail}">${COMPANY_INFO.supportEmail}</a>.</p>
      <p>${COMPANY_INFO.productName} is a product of ${COMPANY_INFO.companyName}.</p>
      <p style="margin-top: 16px;">
        ${COMPANY_INFO.addressLines.join('<br>')}
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();

  // Build plain text version
  const text = `
${subject}

You have a new lead from ${COMPANY_INFO.productName}. Respond within 5–10 minutes for the best chance of winning this job.

LEAD SUMMARY
Name: ${lead.name || 'N/A'}
City: ${lead.city || 'N/A'}
Service: ${lead.service_type || 'N/A'}
Lead Type: ${exclusivity === 'exclusive' ? 'Exclusive' : 'Shared'}
Price: ${priceFormatted}

LEAD DETAILS
Name: ${lead.name || 'N/A'}
Phone: ${lead.phone || 'N/A'}${lead.phone ? ' (call ASAP)' : ''}
Email: ${lead.email || 'N/A'}
City: ${lead.city || 'N/A'}
Service: ${lead.service_type || 'N/A'}
${lead.budget_raw ? `Budget: ${lead.budget_raw}` : ''}
${lead.notes ? `Notes: ${lead.notes}` : ''}

VIEW IN BUYER DASHBOARD
${COMPANY_INFO.appBaseUrl}/buyer

From your buyer dashboard you can adjust lead caps, pause your account, and review your recent leads.

---

You're receiving this email because your business is configured to receive leads from ${COMPANY_INFO.productName}.

To stop receiving new lead alerts, update your notification preferences in your buyer portal or contact us at ${COMPANY_INFO.supportEmail}.

${COMPANY_INFO.productName} is a product of ${COMPANY_INFO.companyName}.

${COMPANY_INFO.addressLines.join('\n')}
  `.trim();

  return { subject, html, text };
}

/**
 * Send buyer lead notification email
 * Does not throw errors - logs and continues if email fails
 */
async function sendBuyerLeadEmail(args: {
  buyer: {
    id: string;
    business_name: string | null;
    email: string | null;
  };
  lead: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    city: string | null;
    service_type: string | null;
    notes?: string | null;
    budget_raw?: string | null;
    source?: string | null;
  };
  chargeAmount: number;
  exclusivity: 'shared' | 'exclusive';
}): Promise<void> {
  const { buyer, lead, chargeAmount, exclusivity } = args;

  // Skip if buyer has no email
  if (!buyer.email || buyer.email.trim() === '') {
    console.log(`[Lead Email] Buyer ${buyer.id} has no email configured, skipping`);
    return;
  }

  // Skip test/simulator leads
  if (lead.source === 'routing-test' || lead.source === 'test') {
    console.log(`[Lead Email] Skipping email for test lead ${lead.id}`);
    return;
  }

  try {
    console.log(`[Lead Email] Sending buyer lead email for lead ${lead.id} to buyer ${buyer.id} (${buyer.email})`);

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('[Lead Email] RESEND_API_KEY not configured, skipping email');
      return;
    }

    const resend = new Resend(resendApiKey);
    const { subject, html, text } = buildBuyerLeadEmail(buyer, lead, chargeAmount, exclusivity);

    const emailResponse = await resend.emails.send({
      from: `${COMPANY_INFO.productName} <onboarding@resend.dev>`, // TODO: Update to custom domain
      to: [buyer.email],
      subject,
      html,
      text,
    });

    if (emailResponse.error) {
      console.error('[Lead Email] Resend API error:', emailResponse.error);
    } else {
      console.log(`[Lead Email] Email sent successfully to buyer ${buyer.id} at ${buyer.email}`);
    }
  } catch (error) {
    console.error('[Lead Email] Failed to send buyer lead email', {
      leadId: lead.id,
      buyerId: buyer.id,
      error: error instanceof Error ? error.message : String(error),
    });
    // Do not throw - allow lead routing to continue even if email fails
  }
}

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

      // Send email notifications to buyers
      console.log('[Lead Intake] Sending email notifications to buyers...');
      for (const { buyer, calculated_charge_amount } of routingResult.selected) {
        await sendBuyerLeadEmail({
          buyer: {
            id: buyer.id,
            business_name: buyer.business_name,
            email: buyer.email,
          },
          lead: {
            id: lead.id,
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            city: lead.city,
            service_type: lead.service_type,
            notes: lead.notes,
            budget_raw: lead.budget_raw,
            source: undefined, // Real leads don't have 'routing-test' source
          },
          chargeAmount: calculated_charge_amount,
          exclusivity: exclusivity || 'shared',
        });
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