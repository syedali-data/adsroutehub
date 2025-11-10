import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { getSettingsMap } from "../_shared/settings.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const COMPANY_INFO = {
  productName: 'ADS RouteHub',
  companyName: 'Analyticals Data Services (ADS)',
  supportEmail: 'dataservices@analyticals.ca',
  addressLines: [
    'Analyticals Data Services (ADS)',
    '1061-Eagletrace Drive',
    'London, Ontario N6G0T3',
    'Canada',
  ],
  appBaseUrl: 'https://adsroutehub.com',
};

function buildBuyerLeadUnlockedEmail(
  buyer: { business_name: string | null; email: string | null },
  lead: {
    name: string | null;
    email: string | null;
    phone: string | null;
    city: string | null;
    service_type: string | null;
    notes: string | null;
    budget_raw: string | null;
  },
  deliveryId: string
): { subject: string; html: string; text: string } {
  const serviceText = lead.service_type || 'lead';
  const cityText = lead.city || '';
  const subject = cityText 
    ? `Lead unlocked – full details for ${serviceText} in ${cityText}`
    : `Lead unlocked – full details`;

  const dashboardUrl = `${COMPANY_INFO.appBaseUrl}/buyer/deliveries/${deliveryId}`;

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
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center; }
    .header h1 { margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; }
    .header p { margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px; }
    .content { padding: 30px; }
    .intro { margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #333333; }
    .intro strong { color: #10b981; }
    .section-title { font-size: 16px; font-weight: 700; color: #333333; margin: 24px 0 12px 0; }
    .details-list { list-style: none; padding: 0; margin: 0; }
    .details-list li { padding: 10px 0; border-bottom: 1px solid #e5e7eb; font-size: 15px; color: #333333; }
    .details-list li:last-child { border-bottom: none; }
    .details-list strong { color: #666666; font-weight: 600; min-width: 120px; display: inline-block; }
    .highlight-box { background-color: #F0FDF4; border: 2px solid #86EFAC; padding: 20px; margin: 20px 0; border-radius: 8px; }
    .cta { text-align: center; margin: 32px 0; }
    .cta-button { display: inline-block; padding: 12px 28px; background-color: #10b981; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; }
    .cta-button:hover { background-color: #059669; }
    .footer { background-color: #f8f9fa; padding: 24px 30px; border-top: 1px solid #e5e7eb; }
    .footer-logo-row { margin-bottom: 16px; display: flex; align-items: center; }
    .footer-logo-row img { height: 28px; margin-right: 8px; border-radius: 4px; }
    .footer-logo-row span { font-size: 14px; font-weight: 600; color: #333333; }
    .footer p { margin: 8px 0; font-size: 13px; color: #666666; line-height: 1.6; }
    .footer a { color: #667eea; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✓ Lead Unlocked</h1>
      <p>${COMPANY_INFO.productName}</p>
    </div>
    
    <div class="content">
      <p class="intro">
        You've unlocked this lead from ${COMPANY_INFO.productName}. <strong>Contact them as soon as possible</strong> to maximize your chances of winning the job.
      </p>
      
      <div class="highlight-box">
        <h3 class="section-title">Full Lead Details</h3>
        <ul class="details-list">
          <li><strong>Name:</strong> ${lead.name || 'N/A'}</li>
          <li><strong>Phone:</strong> ${lead.phone || 'N/A'}</li>
          <li><strong>Email:</strong> ${lead.email || 'N/A'}</li>
          <li><strong>City:</strong> ${lead.city || 'N/A'}</li>
          <li><strong>Service:</strong> ${lead.service_type || 'N/A'}</li>
          <li><strong>Budget:</strong> ${lead.budget_raw || 'Not specified'}</li>
          ${lead.notes ? `<li><strong>Notes:</strong> ${lead.notes}</li>` : ''}
        </ul>
      </div>
      
      <div class="cta">
        <a href="${dashboardUrl}" class="cta-button">View in Your Buyer Dashboard</a>
      </div>
    </div>
    
    <div class="footer">
      <div class="footer-logo-row">
        <img src="${COMPANY_INFO.appBaseUrl}/email/ads-logo.png" alt="${COMPANY_INFO.companyName}">
        <span>${COMPANY_INFO.companyName}</span>
      </div>
      <p>You're receiving this email because you unlocked a lead from ${COMPANY_INFO.productName}.</p>
      <p>For support, contact us at <a href="mailto:${COMPANY_INFO.supportEmail}">${COMPANY_INFO.supportEmail}</a>.</p>
      <p style="margin-top: 16px;">
        ${COMPANY_INFO.addressLines.join('<br>')}
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
${subject}

You've unlocked this lead from ${COMPANY_INFO.productName}. Contact them as soon as possible to maximize your chances of winning the job.

FULL LEAD DETAILS
Name: ${lead.name || 'N/A'}
Phone: ${lead.phone || 'N/A'}
Email: ${lead.email || 'N/A'}
City: ${lead.city || 'N/A'}
Service: ${lead.service_type || 'N/A'}
Budget: ${lead.budget_raw || 'Not specified'}
${lead.notes ? `Notes: ${lead.notes}` : ''}

VIEW IN YOUR BUYER DASHBOARD
${dashboardUrl}

---

You're receiving this email because you unlocked a lead from ${COMPANY_INFO.productName}.

For support, contact us at ${COMPANY_INFO.supportEmail}.

${COMPANY_INFO.companyName}
${COMPANY_INFO.addressLines.join('\n')}
  `.trim();

  return { subject, html, text };
}

async function sendBuyerLeadUnlockedEmail(args: {
  buyer: { business_name: string | null; email: string | null };
  lead: {
    name: string | null;
    email: string | null;
    phone: string | null;
    city: string | null;
    service_type: string | null;
    notes: string | null;
    budget_raw: string | null;
  };
  deliveryId: string;
}): Promise<void> {
  const { buyer, lead, deliveryId } = args;

  if (!buyer.email || buyer.email.trim() === '') {
    console.log(`[Unlock Email] Buyer has no email configured, skipping`);
    return;
  }

  try {
    console.log(`[Unlock Email] Sending unlocked lead email for delivery ${deliveryId}`);

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('[Unlock Email] RESEND_API_KEY not configured, skipping email');
      return;
    }

    const resend = new Resend(resendApiKey);
    const { subject, html, text } = buildBuyerLeadUnlockedEmail(buyer, lead, deliveryId);

    const emailResponse = await resend.emails.send({
      from: `${COMPANY_INFO.productName} <onboarding@resend.dev>`,
      to: [buyer.email],
      subject,
      html,
      text,
    });

    if (emailResponse.error) {
      console.error('[Unlock Email] Resend API error:', emailResponse.error);
    } else {
      console.log(`[Unlock Email] Unlocked email sent successfully to ${buyer.email}`);
    }
  } catch (error) {
    console.error('[Unlock Email] Failed to send unlocked email', {
      deliveryId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user session
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { deliveryId } = await req.json();

    if (!deliveryId) {
      return new Response(
        JSON.stringify({ error: 'Missing deliveryId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the delivery with buyer and lead data
    const { data: delivery, error: deliveryError } = await supabase
      .from('deliveries')
      .select(`
        id,
        unlocked,
        buyer_id,
        buyers (
          id,
          business_name,
          email
        ),
        leads (
          name,
          email,
          phone,
          city,
          service_type,
          notes,
          budget_raw
        )
      `)
      .eq('id', deliveryId)
      .single();

    if (deliveryError || !delivery) {
      return new Response(
        JSON.stringify({ error: 'Delivery not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify this user is associated with this buyer
    const { data: buyerUser } = await supabase
      .from('buyer_users')
      .select('buyer_id')
      .eq('id', user.id)
      .eq('buyer_id', delivery.buyer_id)
      .maybeSingle();

    if (!buyerUser) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - not your delivery' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if already unlocked
    if (delivery.unlocked) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Already unlocked',
          delivery: {
            id: delivery.id,
            unlocked: true
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get settings to check if Stripe is enabled
    const settingsMap = await getSettingsMap(supabase);
    const stripeEnabled = settingsMap['ENABLE_STRIPE_BILLING'] === 'true';

    // For now, both cases just unlock immediately
    // Later: if stripeEnabled, create Stripe checkout session
    console.log(`[Unlock] Unlocking delivery ${deliveryId}, Stripe enabled: ${stripeEnabled}`);

    // Update delivery to unlocked
    const { error: updateError } = await supabase
      .from('deliveries')
      .update({
        unlocked: true,
        unlocked_at: new Date().toISOString()
      })
      .eq('id', deliveryId);

    if (updateError) {
      throw updateError;
    }

    // Send unlocked email
    await sendBuyerLeadUnlockedEmail({
      buyer: delivery.buyers as any,
      lead: delivery.leads as any,
      deliveryId: delivery.id,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Lead unlocked successfully',
        delivery: {
          id: delivery.id,
          unlocked: true
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Unlock] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
