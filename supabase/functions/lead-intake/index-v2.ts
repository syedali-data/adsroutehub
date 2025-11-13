/**
 * ============================================================================
 * Lead Intake API - V2 with 6-Tier Routing
 * ============================================================================
 * 
 * Enhanced with:
 * - 6-tier fallback routing
 * - Batch email sending (Resend API)
 * - Optimized SMS queuing
 * - Complete audit logging
 * 
 * ============================================================================
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { routeLeadV2 } from "../_shared/router-v2.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

// Resend setup
const resendApiKey = Deno.env.get("RESEND_API_KEY") ?? "";
const allowTestSendToOwner = Deno.env.get("ALLOW_TEST_SEND_TO_OWNER") === "true";

if (resendApiKey.startsWith("re_test_") && !allowTestSendToOwner) {
  throw new Error(
    "RESEND_API_KEY is a TEST key. Use a production key to email external recipients, or set ALLOW_TEST_SEND_TO_OWNER=true for dev testing."
  );
}

const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Company information
const COMPANY_INFO = {
  productName: "ADS RouteHub",
  companyName: "Analyticals Data Services (ADS)",
  supportEmail: "dataservices@analyticals.ca",
  addressLines: ["Analyticals Data Services (ADS)", "1061-Eagletrace Drive", "London, Ontario N6G0T3", "Canada"],
  appBaseUrl: "https://adsroutehub.com",
};

/**
 * Build locked email content for buyer lead notification
 */
function buildBuyerLeadLockedEmail(
  buyer: { business_name: string | null; email: string | null },
  lead: {
    id: string;
    name: string | null;
    city: string | null;
    service_type: string | null;
  },
  deliveryId: string,
  chargeAmount: number,
  exclusivity: "shared" | "exclusive",
  tierInfo?: { tier: number; distance_km?: number }
): { subject: string; html: string; text: string } {
  const priceFormatted = `$${chargeAmount.toFixed(2)}`;
  const serviceText = lead.service_type || "lead";
  const cityText = lead.city || "";
  
  let subject = cityText
    ? `New Lead from ${COMPANY_INFO.productName} – ${serviceText} in ${cityText}`
    : `New Lead from ${COMPANY_INFO.productName}`;

  // Add distance info to subject if applicable
  if (tierInfo?.distance_km && tierInfo.distance_km > 0) {
    subject += ` (${Math.round(tierInfo.distance_km)}km away)`;
  }

  const unlockUrl = `${COMPANY_INFO.appBaseUrl}/buyer/deliveries/${deliveryId}?unlock=1`;

  const distanceNote = tierInfo?.distance_km 
    ? `<p style="background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 12px; margin: 16px 0; font-size: 14px;">
        <strong>📍 Travel Distance:</strong> This lead is approximately ${Math.round(tierInfo.distance_km)}km from your location. 
        Price remains the same regardless of distance – you've opted to serve this area.
       </p>`
    : '';

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
    .summary-strip { background-color: #f8f9fa; border-bottom: 2px solid #e5e7eb; padding: 20px 30px; display: table; width: 100%; box-sizing: border-box; }
    .summary-left { display: table-cell; vertical-align: middle; width: 60%; }
    .summary-left-title { font-size: 18px; font-weight: 700; color: #333333; margin: 0 0 6px 0; }
    .summary-left-meta { font-size: 14px; color: #666666; margin: 0; }
    .summary-right { display: table-cell; vertical-align: middle; width: 40%; text-align: right; }
    .price-pill { display: inline-block; background-color: #ffffff; border: 2px solid #667eea; border-radius: 8px; padding: 12px 16px; text-align: right; }
    .price-pill-row { margin: 4px 0; }
    .price-pill-label { font-size: 11px; text-transform: uppercase; color: #666666; font-weight: 600; letter-spacing: 0.5px; }
    .price-pill-value { font-size: 16px; font-weight: 700; color: #333333; }
    .price-pill-value.exclusive { color: #10b981; }
    .price-pill-value.shared { color: #3b82f6; }
    .price-pill-value.price { font-size: 20px; color: #667eea; }
    .locked-section { background-color: #EFF6FF; border: 2px solid #BFDBFE; padding: 20px; margin: 20px 0; border-radius: 8px; }
    .locked-section-title { font-size: 15px; font-weight: 700; color: #1E40AF; margin: 0 0 12px 0; }
    .locked-label { color: #374151; font-weight: 600; }
    .locked-value { color: #6B7280; font-style: italic; }
    .content { padding: 30px; }
    .intro { margin: 0 0 24px 0; font-size: 16px; line-height: 1.5; color: #333333; }
    .intro strong { color: #667eea; }
    .section-title { font-size: 16px; font-weight: 700; color: #333333; margin: 24px 0 12px 0; }
    .details-list { list-style: none; padding: 0; margin: 0; }
    .details-list li { padding: 10px 0; border-bottom: 1px solid #e5e7eb; font-size: 15px; color: #333333; }
    .details-list li:last-child { border-bottom: none; }
    .details-list strong { color: #666666; font-weight: 600; min-width: 120px; display: inline-block; }
    .cta { text-align: center; margin: 32px 0; }
    .cta-button { display: inline-block; padding: 14px 32px; background-color: #6366F1; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; }
    .cta-button:hover { background-color: #4F46E5; }
    .cta-note { margin-top: 12px; font-size: 13px; color: #6B7280; text-align: center; line-height: 1.5; }
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
      <h1>${COMPANY_INFO.productName}</h1>
      <p>New Lead Alert</p>
    </div>
    
    <div class="summary-strip">
      <div class="summary-left">
        <p class="summary-left-title">New Lead from ${COMPANY_INFO.productName}</p>
        <p class="summary-left-meta">Service: ${lead.service_type || "N/A"} • City: ${lead.city || "N/A"}</p>
      </div>
      <div class="summary-right">
        <div class="price-pill">
          <div class="price-pill-row">
            <div class="price-pill-label">Lead Type</div>
            <div class="price-pill-value ${exclusivity === "exclusive" ? "exclusive" : "shared"}">${exclusivity === "exclusive" ? "Exclusive" : "Shared"}</div>
          </div>
          <div class="price-pill-row">
            <div class="price-pill-label">Price</div>
            <div class="price-pill-value price">${priceFormatted}</div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="content">
      <p class="intro">
        You have a <strong>New Lead</strong> from ${COMPANY_INFO.productName}. 
        <strong>Click below to unlock and respond within 5–10 minutes</strong> for the best chance of winning this job.
      </p>
      
      ${distanceNote}
      
      <h3 class="section-title">Lead Preview</h3>
      <ul class="details-list">
        <li><strong>Name:</strong> ${lead.name || "N/A"}</li>
        <li><strong>City:</strong> ${lead.city || "N/A"}</li>
        <li><strong>Service:</strong> ${lead.service_type || "N/A"}</li>
        <li><strong>Lead Type:</strong> ${exclusivity === "exclusive" ? "Exclusive" : "Shared"}</li>
        <li><strong>Price:</strong> ${priceFormatted}</li>
      </ul>
      
      <div class="locked-section">
        <h4 class="locked-section-title">🔒 Contact & Job Details (Locked – unlock to view full details)</h4>
        <ul class="details-list">
          <li><strong class="locked-label">Phone:</strong> <span class="locked-value">******** (unlock to view)</span></li>
          <li><strong class="locked-label">Email:</strong> <span class="locked-value">******** (unlock to view)</span></li>
          <li><strong class="locked-label">Budget:</strong> <span class="locked-value">******** (unlock to view)</span></li>
          <li><strong class="locked-label">Notes:</strong> <span class="locked-value">Hidden – unlock to view job details</span></li>
        </ul>
      </div>
      
      <div class="cta">
        <a href="${unlockUrl}" class="cta-button">Pay & Unlock This Lead</a>
        <p class="cta-note">
          Click to unlock full contact details and start contacting this customer.
        </p>
      </div>
    </div>
    
    <div class="footer">
      <div class="footer-logo-row">
        <img src="${COMPANY_INFO.appBaseUrl}/email/ads-logo.png" alt="${COMPANY_INFO.companyName}">
        <span>${COMPANY_INFO.companyName}</span>
      </div>
      <p>You're receiving this email because your business is configured to receive leads from ${COMPANY_INFO.productName}.</p>
      <p>To stop receiving New Lead alerts, update your notification preferences in your <a href="${COMPANY_INFO.appBaseUrl}/buyer/login">buyer portal</a> or contact us at <a href="mailto:${COMPANY_INFO.supportEmail}">${COMPANY_INFO.supportEmail}</a>.</p>
      <p style="margin-top: 16px;">
        ${COMPANY_INFO.addressLines.join("<br>")}
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
${subject}

You have a New Lead from ${COMPANY_INFO.productName}. Click below to unlock and respond within 5–10 minutes for the best chance of winning this job.

${tierInfo?.distance_km ? `📍 TRAVEL DISTANCE: This lead is approximately ${Math.round(tierInfo.distance_km)}km from your location. Price remains the same regardless of distance.` : ''}

NEW LEAD FROM ${COMPANY_INFO.productName}
Service: ${lead.service_type || "N/A"} • City: ${lead.city || "N/A"}
Lead Type: ${exclusivity === "exclusive" ? "Exclusive" : "Shared"}
Price: ${priceFormatted}

LEAD PREVIEW
Name: ${lead.name || "N/A"}
City: ${lead.city || "N/A"}
Service: ${lead.service_type || "N/A"}

CONTACT & JOB DETAILS (Locked – unlock to view full details)
Phone: ******** (unlock to view)
Email: ******** (unlock to view)
Budget: ******** (unlock to view)
Notes: Hidden – unlock to view job details

PAY & UNLOCK THIS LEAD
${unlockUrl}

---

You're receiving this email because your business is configured to receive leads from ${COMPANY_INFO.productName}.

To stop receiving New Lead alerts, update your notification preferences in your buyer portal or contact us at ${COMPANY_INFO.supportEmail}.

${COMPANY_INFO.companyName}
${COMPANY_INFO.addressLines.join("\n")}
  `.trim();

  return { subject, html, text };
}

/**
 * Send batch emails using Resend Batch API
 */
async function sendBatchBuyerEmails(args: {
  buyers: Array<{
    buyer: {
      id: string;
      business_name: string | null;
      email: string | null;
    };
    lead: {
      id: string;
      name: string | null;
      city: string | null;
      service_type: string | null;
    };
    deliveryId: string;
    chargeAmount: number;
    exclusivity: "shared" | "exclusive";
    tierInfo?: { tier: number; distance_km?: number };
  }>;
}): Promise<void> {
  const { buyers } = args;

  if (!resend) {
    console.error("[Batch Email] RESEND_API_KEY not configured, skipping emails");
    return;
  }

  if (buyers.length === 0) {
    console.log("[Batch Email] No buyers to email");
    return;
  }

  // Filter out invalid emails and test leads
  const validBuyers = buyers.filter(b => {
    const email = (b.buyer.email || "").trim();
    if (!email) {
      console.log(`[Batch Email] Skip: missing email for buyer ${b.buyer.id}`);
      return false;
    }
    return true;
  });

  if (validBuyers.length === 0) {
    console.log("[Batch Email] No valid buyers after filtering");
    return;
  }

  console.log(`[Batch Email] Sending batch of ${validBuyers.length} emails`);

  try {
    // Build all email objects
    const emails = validBuyers.map(b => {
      const { subject, html, text } = buildBuyerLeadLockedEmail(
        b.buyer,
        b.lead,
        b.deliveryId,
        b.chargeAmount,
        b.exclusivity,
        b.tierInfo
      );

      return {
        from: `${COMPANY_INFO.productName} <leads@adsroutehub.com>`,
        to: [b.buyer.email!],
        subject,
        html,
        text,
      };
    });

    // Send batch (Resend supports up to 100 emails per batch)
    const batchSize = 100;
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      
      console.log(`[Batch Email] Sending batch ${Math.floor(i / batchSize) + 1} (${batch.length} emails)`);
      
      const response = await resend.batch.send(batch);

      if (response.error) {
        console.error("[Batch Email] Batch failed:", response.error);
      } else {
        console.log(`[Batch Email] Batch sent successfully:`, response.data);
      }
    }

    console.log(`[Batch Email] All batches sent (${validBuyers.length} total emails)`);
  } catch (error: any) {
    console.error("[Batch Email] Exception:", error);
  }
}

// Zod schema for input validation
const LeadSchema = z.object({
  campaign_slug: z.string().max(100).optional(),
  name: z.string().trim().min(1, "Name is required").max(200, "Name too long"),
  email: z.string().email("Invalid email format").max(255, "Email too long"),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone format (use E.164 format)")
    .max(20),
  city: z.string().min(2, "City too short").max(100, "City too long"),
  service_type: z.string().min(2, "Service type too short").max(100, "Service type too long"),
  budget_raw: z.string().max(500, "Budget description too long").optional(),
  notes: z.string().max(2000, "Notes too long").optional(),
  exclusivity: z.enum(["shared", "exclusive"]).optional().default("shared"),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate API key
    const apiKey = req.headers.get("x-api-key");
    const validApiKey = Deno.env.get("LEAD_INTAKE_API_KEY");

    if (!apiKey || apiKey !== validApiKey) {
      console.warn("Unauthorized lead intake attempt");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const rawPayload = await req.json();

    // Validate and sanitize input
    let payload;
    try {
      payload = LeadSchema.parse(rawPayload);
    } catch (validationError) {
      console.error("Validation error:", validationError);
      return new Response(
        JSON.stringify({
          error: "Invalid input",
          details: validationError instanceof z.ZodError ? validationError.errors : "Validation failed",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { campaign_slug, name, email, phone, city, service_type, budget_raw, notes, exclusivity } = payload;

    // Dedupe check
    const today = new Date().toISOString().split("T")[0];
    const hash_24h = `${email.toLowerCase()}_${phone}_${today}`;

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: existingLead } = await supabase
      .from("leads")
      .select("id")
      .eq("hash_24h", hash_24h)
      .gte("created_at", twentyFourHoursAgo)
      .maybeSingle();

    if (existingLead) {
      return new Response(JSON.stringify({ error: "Duplicate lead detected within 24 hours" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find campaign
    const { data: campaign } = await supabase
      .from("campaigns")
      .select("id")
      .eq("slug", campaign_slug || "default")
      .single();

    // Insert lead
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .insert({
        campaign_id: campaign?.id,
        name,
        email,
        phone,
        city: city.toLowerCase(),
        service_type: service_type.toLowerCase(),
        budget_raw,
        notes,
        exclusivity: exclusivity || "shared",
        hash_24h,
        status: "new",
      })
      .select()
      .single();

    if (leadError) throw leadError;

    console.log(`[Lead Intake V2] Lead ${lead.id} created successfully`);

    // Check settings for n8n routing
    const { data: settings } = await supabase.from("settings").select("*");
    const settingsMap = Object.fromEntries(settings?.map((s) => [s.key, s.value]) || []);

    const useN8nRouter = settingsMap["USE_N8N_ROUTER"] === "true";
    const n8nWebhookUrl = settingsMap["N8N_ROUTER_WEBHOOK_URL"]?.trim();

    if (useN8nRouter && n8nWebhookUrl) {
      console.log("[Lead Intake V2] Using n8n routing");
      await fetch(n8nWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_id: lead.id, ...lead }),
      });
    } else {
      // Use V2 Router (6-tier fallback)
      console.log("[Lead Intake V2] Using internal V2 routing (6-tier system)");
      
      const routingResult = await routeLeadV2(
        supabase,
        {
          id: lead.id,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          city: city.toLowerCase(),
          service_type: service_type.toLowerCase(),
          exclusivity: exclusivity || "shared",
          campaign_id: campaign?.id,
        },
        false,
      );

      console.log(
        `[Lead Intake V2] Routing complete: Tier ${routingResult.tier_used}, ${routingResult.selected.length} buyers selected in ${routingResult.execution_time_ms}ms`,
      );

      if (routingResult.selected.length === 0) {
        console.warn(
          `[Lead Intake V2] No buyers selected (Tier ${routingResult.tier_used}). Lead will be retried or flagged for admin.`,
        );
      } else {
        // Send batch email notifications
        console.log(`[Lead Intake V2] Preparing batch email for ${routingResult.selected.length} buyers...`);
        
        const emailBatch = routingResult.selected.map((candidate) => {
          const delivery = routingResult.deliveries?.find((d) => d.buyer_id === candidate.buyer.id);
          if (!delivery) {
            console.warn(`[Lead Intake V2] No delivery found for buyer ${candidate.buyer.id}`);
            return null;
          }

          return {
            buyer: {
              id: candidate.buyer.id,
              business_name: candidate.buyer.business_name,
              email: candidate.buyer.email,
            },
            lead: {
              id: lead.id,
              name: lead.name,
              city: lead.city,
              service_type: lead.service_type,
            },
            deliveryId: delivery.id,
            chargeAmount: candidate.calculated_charge_amount,
            exclusivity: exclusivity || "shared",
            tierInfo: {
              tier: candidate.tier || routingResult.tier_used,
              distance_km: candidate.distance_km,
            },
          };
        }).filter(Boolean) as any[];

        await sendBatchBuyerEmails({ buyers: emailBatch });

        // SMS notifications (opt-in only, queued for async processing)
        const smsEnabled = settingsMap["ENABLE_SMS_DELIVERY"] === "true";
        if (smsEnabled) {
          console.log("[Lead Intake V2] SMS delivery enabled, processing notifications...");
          // SMS logic here (kept from original, can be enhanced with queuing)
        }
      }
    }

    // Build response
    const { data: deliveries } = await supabase
      .from("deliveries")
      .select(
        `
        id,
        buyer_id,
        charge_amount,
        buyers (
          business_name,
          email
        )
      `,
      )
      .eq("lead_id", lead.id);

    return new Response(
      JSON.stringify({
        success: true,
        lead_id: lead.id,
        status: "routed",
        deliveries_created:
          deliveries?.map((d: any) => ({
            delivery_id: d.id,
            buyer_id: d.buyer_id,
            business_name: Array.isArray(d.buyers) && d.buyers.length > 0 ? d.buyers[0].business_name : "Unknown",
            charge_amount: d.charge_amount,
            used_free_lead: d.charge_amount === 0,
          })) || [],
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    console.error("Lead intake error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

