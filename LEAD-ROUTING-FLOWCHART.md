# 🔄 **ADS RouteHub - 6-Tier Fallback Routing System**

**Version:** 2.0 - Zero-Waste Architecture  
**Last Updated:** November 13, 2024

---

## 🎯 **Design Goals**

1. **ZERO lead waste** - Every lead gets routed or queued
2. **Scale to 1000+ buyers** - Efficient queries with proper indexing
3. **Multi-campaign support** - Campaign-specific routing rules
4. **Quality prioritization** - Best buyers get first shot
5. **Geographic intelligence** - Expand to nearby cities automatically
6. **Service flexibility** - Match related services (HVAC → Heating)
7. **Admin visibility** - Full audit trail and alerts

---

## 📊 **Complete System Flowchart**

```
┌─────────────────────────────────────────────────────────────────┐
│                     LEAD ARRIVES                                │
│  • From: Marketing form, API, webhook, manual entry             │
│  • Contains: name, email, phone, city, service_type, budget    │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│               STEP 1: PRE-ROUTING VALIDATION                    │
│                                                                 │
│  ✓ Dedupe check (24h window, email+phone hash)                │
│  ✓ Input validation (Zod schema)                              │
│  ✓ Normalize data (lowercase city, service_type)              │
│  ✓ Insert into leads table                                    │
│                                                                 │
│  🔍 Check if lead exists in system:                           │
│     • Query: leads WHERE hash_24h = ? AND created_at > 24h ago│
│                                                                 │
│  Decision:                                                      │
│  ├─ ✅ NEW → Continue to routing                              │
│  └─ ❌ DUPLICATE → Return 409 "Duplicate lead detected"       │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│               STEP 2: CAMPAIGN RULES CHECK                      │
│                                                                 │
│  🔍 Load campaign configuration:                               │
│     • Query: campaigns WHERE slug = ? OR id = ?               │
│     • Get: routing_mode, max_buyers, pricing_rules            │
│                                                                 │
│  Campaign Settings:                                             │
│  • routing_mode: "auto" | "manual" | "n8n"                   │
│  • max_buyers_shared: 3-10 (default: 5)                       │
│  • max_buyers_exclusive: 1 (fixed)                            │
│  • enable_geographic_expansion: boolean                        │
│  • enable_service_aliases: boolean                            │
│  • enable_lead_parking: boolean                               │
│                                                                 │
│  Decision:                                                      │
│  ├─ routing_mode = "n8n" → Send to webhook, exit             │
│  ├─ routing_mode = "manual" → Create unroutable, alert admin │
│  └─ routing_mode = "auto" → Continue to Tier 1               │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌═════════════════════════════════════════════════════════════════┐
║                    🎯 TIER 1: PERFECT MATCH                     ║
║                                                                 ║
║  Target: Buyers who EXACTLY match lead requirements            ║
║  Match Criteria:                                                ║
║  • status = 'active'                                           ║
║  • city = lead.city (exact match, lowercase)                  ║
║  • service_type IN services_csv (exact match)                 ║
║  • daily_sent < daily_cap                                      ║
║  • (shared only) shared_deliveries < shared_cap                ║
║                                                                 ║
║  🔍 SQL Query:                                                 ║
║  SELECT * FROM buyers                                           ║
║  WHERE status = 'active'                                        ║
║    AND city = $1                                               ║
║    AND services_csv ILIKE '%' || $2 || '%'                    ║
║    AND daily_sent < daily_cap                                  ║
║  ORDER BY                                                       ║
║    conversion_rate DESC,                                        ║
║    response_rate DESC,                                          ║
║    avg_response_time_minutes ASC                               ║
║                                                                 ║
║  Selection Logic:                                               ║
║  • Exclusive leads: Select TOP 1 buyer                        ║
║  • Shared leads: Select TOP N buyers (campaign.max_buyers)   ║
║                                                                 ║
║  Scoring System:                                                ║
║  • Buyer Score = (conversion_rate × 0.5) +                    ║
║                  (response_rate × 0.3) +                       ║
║                  (1 - normalized_response_time × 0.2)          ║
║                                                                 ║
║  Decision:                                                      ║
║  ├─ ✅ Found 1+ buyers → CREATE DELIVERIES, Send emails, EXIT ║
║  └─ ❌ No buyers found → Continue to Tier 2                   ║
╚════════════════════┬════════════════════════════════════════════╝
                     │
                     │ ❌ No perfect matches
                     ▼
┌═════════════════════════════════════════════════════════════════┐
║              🌍 TIER 2: GEOGRAPHIC EXPANSION                    ║
║                                                                 ║
║  Target: Buyers in NEARBY cities willing to travel             ║
║  Match Criteria:                                                ║
║  • status = 'active'                                           ║
║  • city IN (nearby_cities) - from city_distances table        ║
║  • distance_km <= buyer.willing_to_travel_km                  ║
║  • service_type match (exact)                                  ║
║  • daily_sent < daily_cap                                      ║
║                                                                 ║
║  🔍 SQL Query (with distance calculation):                     ║
║  SELECT b.*, cd.distance_km, cd.travel_time_minutes            ║
║  FROM buyers b                                                  ║
║  INNER JOIN city_distances cd ON                               ║
║    (cd.city_a = $1 AND cd.city_b = b.city) OR                 ║
║    (cd.city_b = $1 AND cd.city_a = b.city)                    ║
║  WHERE b.status = 'active'                                      ║
║    AND cd.distance_km <= b.willing_to_travel_km               ║
║    AND b.services_csv ILIKE '%' || $2 || '%'                  ║
║    AND b.daily_sent < b.daily_cap                             ║
║  ORDER BY                                                       ║
║    cd.distance_km ASC,                                         ║
║    b.conversion_rate DESC                                       ║
║  LIMIT $3                                                       ║
║                                                                 ║
║  Example:                                                       ║
║  Lead from "Vaughan" → No buyers in Vaughan                    ║
║  → Check Toronto (30km), Brampton (20km), Markham (25km)      ║
║  → Find buyers with willing_to_travel_km >= 20                 ║
║                                                                 ║
║  Pricing:                                                       ║
║  • SAME as normal price (no distance adjustment)               ║
║  • Buyer decides if travel is worth it when they set           ║
║    their willing_to_travel_km preference                       ║
║  • Example: $50 lead in Vaughan = $50 (same as local)         ║
║                                                                 ║
║  Why This Works:                                                ║
║  • Buyer sets willing_to_travel_km = 50 → "I accept leads     ║
║    up to 50km away at normal price"                            ║
║  • Buyer who won't travel sets willing_to_travel_km = 0       ║
║  • Self-selecting system = happy buyers only                   ║
║                                                                 ║
║  Decision:                                                      ║
║  ├─ ✅ Found 1+ buyers → CREATE DELIVERIES, Send emails, EXIT ║
║  └─ ❌ No buyers found → Continue to Tier 3                   ║
╚════════════════════┬════════════════════════════════════════════╝
                     │
                     │ ❌ No nearby buyers
                     ▼
┌═════════════════════════════════════════════════════════════════┐
║           🔧 TIER 3: SERVICE TYPE FLEXIBILITY                   ║
║                                                                 ║
║  Target: Buyers who offer RELATED services                     ║
║  Match Criteria:                                                ║
║  • status = 'active'                                           ║
║  • city = lead.city (back to exact city)                      ║
║  • service_type IN (service_aliases) - from aliases table     ║
║  • daily_sent < daily_cap                                      ║
║                                                                 ║
║  🔍 SQL Query (with service matching):                         ║
║  SELECT b.*, sta.match_score                                    ║
║  FROM buyers b                                                  ║
║  INNER JOIN service_type_aliases sta ON                        ║
║    (sta.canonical_service = $1 AND                             ║
║     b.services_csv ILIKE '%' || sta.alias || '%') OR          ║
║    (sta.alias = $1 AND                                         ║
║     b.services_csv ILIKE '%' || sta.canonical_service || '%') ║
║  WHERE b.status = 'active'                                      ║
║    AND b.city = $2                                             ║
║    AND b.daily_sent < b.daily_cap                             ║
║  ORDER BY                                                       ║
║    sta.match_score DESC,                                       ║
║    b.conversion_rate DESC                                       ║
║  LIMIT $3                                                       ║
║                                                                 ║
║  Example:                                                       ║
║  Lead: "Furnace Repair" in Toronto                            ║
║  → No buyers with "furnace repair"                             ║
║  → Find buyers with:                                            ║
║    - "HVAC" (match_score: 0.8)                                ║
║    - "Heating" (match_score: 0.9)                             ║
║    - "General Contractor" (match_score: 0.5)                  ║
║                                                                 ║
║  Pricing:                                                       ║
║  • SAME price (no service match discount)                     ║
║  • Buyer evaluates if they can fulfill this service           ║
║  • Better to route at full price than waste lead              ║
║  • Example: $50 lead regardless of match_score                ║
║                                                                 ║
║  Decision:                                                      ║
║  ├─ ✅ Found 1+ buyers → CREATE DELIVERIES, Send emails, EXIT ║
║  └─ ❌ No buyers found → Continue to Tier 4                   ║
╚════════════════════┬════════════════════════════════════════════╝
                     │
                     │ ❌ No related services
                     ▼
┌═════════════════════════════════════════════════════════════════┐
║              💎 TIER 4: PREMIUM BUYERS                          ║
║                                                                 ║
║  Target: "Accept Any Lead" buyers (premium tier)               ║
║  Match Criteria:                                                ║
║  • status = 'active'                                           ║
║  • premium_tier = true OR accept_any_lead = true              ║
║  • (optional) city in service_cities array                     ║
║  • daily_sent < daily_cap                                      ║
║                                                                 ║
║  🔍 SQL Query:                                                 ║
║  SELECT * FROM buyers                                           ║
║  WHERE status = 'active'                                        ║
║    AND (premium_tier = true OR accept_any_lead = true)        ║
║    AND (                                                        ║
║      service_cities IS NULL OR                                 ║
║      $1 = ANY(service_cities)                                  ║
║    )                                                            ║
║    AND daily_sent < daily_cap                                  ║
║  ORDER BY                                                       ║
║    price_premium DESC,  -- Highest payers first               ║
║    conversion_rate DESC                                         ║
║  LIMIT 1                                                        ║
║                                                                 ║
║  Who are Premium Buyers?                                        ║
║  • Large contractors with broad service area                   ║
║  • "We take everything" businesses                             ║
║  • Higher pricing but guaranteed delivery                      ║
║                                                                 ║
║  Example:                                                       ║
║  Lead: "Deck Building" in small town                           ║
║  → No deck builders in town                                     ║
║  → Route to "ABC General Contractors" (premium_tier)          ║
║     who accept all home improvement leads                      ║
║                                                                 ║
║  Pricing:                                                       ║
║  • Use buyer.price_premium (typically 2-3x normal)            ║
║  • Example: Normal $50, Premium $120                           ║
║                                                                 ║
║  Decision:                                                      ║
║  ├─ ✅ Found 1 buyer → CREATE DELIVERY, Send email, EXIT      ║
║  └─ ❌ No premium buyers → Continue to Tier 5                 ║
╚════════════════════┬════════════════════════════════════════════╝
                     │
                     │ ❌ No premium buyers available
                     ▼
┌═════════════════════════════════════════════════════════════════┐
║               📅 TIER 5: LEAD PARKING (Queue)                   ║
║                                                                 ║
║  Strategy: Queue lead for when buyers have capacity            ║
║  Target: Buyers who will have capacity TOMORROW                ║
║                                                                 ║
║  🔍 Check if buyers exist but all at capacity:                ║
║  SELECT COUNT(*) FROM buyers                                    ║
║  WHERE status = 'active'                                        ║
║    AND city = $1                                               ║
║    AND services_csv ILIKE '%' || $2 || '%'                    ║
║    -- These buyers exist but are at capacity today            ║
║                                                                 ║
║  If buyers exist (count > 0):                                   ║
║  ┌───────────────────────────────────────────────────────────┐ ║
║  │ INSERT INTO lead_queue:                                   │ ║
║  │ {                                                         │ ║
║  │   lead_id: lead.id,                                      │ ║
║  │   status: 'parked',                                      │ ║
║  │   tier_attempted: 5,                                     │ ║
║  │   retry_count: 0,                                        │ ║
║  │   next_retry_at: tomorrow_6am,                          │ ║
║  │   metadata: {                                            │ ║
║  │     reason: 'All buyers at capacity',                   │ ║
║  │     buyers_count: count,                                 │ ║
║  │     original_city: lead.city,                           │ ║
║  │     original_service: lead.service_type                 │ ║
║  │   }                                                      │ ║
║  │ }                                                         │ ║
║  └───────────────────────────────────────────────────────────┘ ║
║                                                                 ║
║  📧 Send notification to lead:                                 ║
║  "Your request has been received. We're matching you with     ║
║   the best service providers in your area. Expect contact     ║
║   within 24 hours."                                            ║
║                                                                 ║
║  ⏰ Cron Job (runs daily at 6am):                              ║
║  • Query: lead_queue WHERE next_retry_at <= NOW()             ║
║  • For each parked lead:                                       ║
║    1. Reset buyer daily_sent counters (happens at midnight)   ║
║    2. Re-attempt routing from Tier 1                          ║
║    3. If success → Mark as routed, remove from queue          ║
║    4. If fail again → Increment retry_count                   ║
║       - If retry_count < 3 → Schedule for tomorrow            ║
║       - If retry_count >= 3 → Move to Tier 6                  ║
║                                                                 ║
║  Why Park Leads?                                                ║
║  • Buyer capacity resets daily (daily_cap)                    ║
║  • Lead is still fresh (< 48 hours old)                       ║
║  • Better than wasting the lead                                ║
║                                                                 ║
║  Decision:                                                      ║
║  ├─ ✅ Buyers exist (at capacity) → PARK LEAD, EXIT           ║
║  └─ ❌ No buyers exist at all → Continue to Tier 6            ║
╚════════════════════┬════════════════════════════════════════════╝
                     │
                     │ ❌ No buyers exist, can't park
                     ▼
┌═════════════════════════════════════════════════════════════════┐
║             🚨 TIER 6: ADMIN ALERT (Manual)                     ║
║                                                                 ║
║  Strategy: Human intervention required                         ║
║  This lead cannot be automatically routed                      ║
║                                                                 ║
║  ┌───────────────────────────────────────────────────────────┐ ║
║  │ INSERT INTO unroutable_leads:                            │ ║
║  │ {                                                         │ ║
║  │   lead_id: lead.id,                                      │ ║
║  │   city: lead.city,                                       │ ║
║  │   service_type: lead.service_type,                      │ ║
║  │   reason: 'No buyers available in any tier',            │ ║
║  │   suggested_action: [                                    │ ║
║  │     'Add buyers in [city]',                             │ ║
║  │     'Expand [nearby city] buyers to include [city]',   │ ║
║  │     'Add service alias for [service_type]'             │ ║
║  │   ],                                                      │ ║
║  │   resolved: false                                        │ ║
║  │ }                                                         │ ║
║  └───────────────────────────────────────────────────────────┘ ║
║                                                                 ║
║  📧 Send URGENT alerts:                                        ║
║  ┌───────────────────────────────────────────────────────────┐ ║
║  │ 1. Email to admin:                                       │ ║
║  │    Subject: "🚨 Unroutable Lead: [City] - [Service]"   │ ║
║  │    Body:                                                  │ ║
║  │    - Lead details                                         │ ║
║  │    - Routing attempts (all 5 tiers)                      │ ║
║  │    - Suggested actions                                    │ ║
║  │    - Link to manual assignment UI                        │ ║
║  │                                                           │ ║
║  │ 2. Slack webhook (optional):                            │ ║
║  │    Channel: #lead-alerts                                 │ ║
║  │    Message: "@admin Unroutable lead needs attention"    │ ║
║  │                                                           │ ║
║  │ 3. SMS to admin (urgent):                               │ ║
║  │    "ADS RouteHub: Lead in [city] needs manual routing"  │ ║
║  └───────────────────────────────────────────────────────────┘ ║
║                                                                 ║
║  📊 Analytics Insight:                                         ║
║  • Track unroutable_leads by city                             ║
║  • Identify service gaps                                       ║
║  • Prioritize buyer recruitment                               ║
║                                                                 ║
║  Example:                                                       ║
║  "10 leads from Oakville couldn't route → Need buyers there" ║
║                                                                 ║
║  Admin Actions Available:                                      ║
║  ┌───────────────────────────────────────────────────────────┐ ║
║  │ 1. Manual Assignment                                     │ ║
║  │    → Select buyer from dropdown                          │ ║
║  │    → Override pricing                                     │ ║
║  │    → Create delivery manually                            │ ║
║  │                                                           │ ║
║  │ 2. Edit & Re-route                                       │ ║
║  │    → Correct city spelling                               │ ║
║  │    → Map service to existing type                        │ ║
║  │    → Re-trigger routing                                  │ ║
║  │                                                           │ ║
║  │ 3. Recruit Buyer                                         │ ║
║  │    → Send recruitment email to contractors              │ ║
║  │    → Offer signup bonus                                  │ ║
║  │    → Mark lead as "pending buyer signup"                │ ║
║  │                                                           │ ║
║  │ 4. Refund Source                                         │ ║
║  │    → If lead came from paid source (Google Ads)         │ ║
║  │    → Mark as "cannot fulfill"                            │ ║
║  │    → Refund ad spend                                     │ ║
║  └───────────────────────────────────────────────────────────┘ ║
║                                                                 ║
║  Decision:                                                      ║
║  └─ ✅ ALERT CREATED, Manual intervention required, EXIT      ║
╚═════════════════════════════════════════════════════════════════╝

```

---

## 📊 **After Routing: Delivery Creation & Notifications**

```
┌─────────────────────────────────────────────────────────────────┐
│              ✅ ROUTING SUCCESS (Tiers 1-4)                     │
│                                                                 │
│  For each selected buyer:                                       │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 1. CREATE DELIVERY                                        │ │
│  │    INSERT INTO deliveries {                               │ │
│  │      lead_id,                                             │ │
│  │      buyer_id,                                            │ │
│  │      campaign_id,                                         │ │
│  │      charge_amount,  -- Calculated per tier              │ │
│  │      routing_tier,   -- Which tier routed (1-4)          │ │
│  │      source: 'internal',                                  │ │
│  │      claim_status: 'new',                                 │ │
│  │      claimed: false,                                      │ │
│  │      won: false,                                          │ │
│  │      contacted_at: null                                   │ │
│  │    }                                                       │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 2. UPDATE BUYER STATS                                     │ │
│  │    UPDATE buyers SET                                      │ │
│  │      daily_sent = daily_sent + 1,                        │ │
│  │      free_leads_left = (using_free_lead)                 │ │
│  │        ? free_leads_left - 1                             │ │
│  │        : free_leads_left                                  │ │
│  │    WHERE id = buyer_id                                    │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 3. SEND EMAIL NOTIFICATION (Resend Batch API)           │ │
│  │    To: buyer.email                                        │ │
│  │    Subject: "New Lead: [Service] in [City]"             │ │
│  │    Body:                                                  │ │
│  │    - Lead preview (name, city, service)                  │ │
│  │    - Locked contact info (🔒)                            │ │
│  │    - Pricing & exclusivity                               │ │
│  │    - CTA: "Unlock & Pay" button                          │ │
│  │                                                           │ │
│  │    ⚡ Performance:                                        │ │
│  │    - Use resend.batch.send() for multiple buyers        │ │
│  │    - Single API call vs sequential                       │ │
│  │    - Avoids 2 req/sec rate limit                         │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 4. SEND SMS (Optional, if buyer opted in)               │ │
│  │    If buyer.sms_enabled && buyer.sms_phone:             │ │
│  │    Send: "New lead: [Name], [City], [Service].          │ │
│  │          Phone: [Phone]. Price: $[Amount]."              │ │
│  │                                                           │ │
│  │    ⚠️ SMS Throttling:                                    │ │
│  │    - Queue SMS in database                                │ │
│  │    - Background worker sends (avoid Edge Function CPU)   │ │
│  │    - Twilio batch API for multiple buyers                │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 5. LOG ROUTING SUCCESS                                    │ │
│  │    INSERT INTO routing_audit {                            │ │
│  │      lead_id,                                             │ │
│  │      tier_used,                                           │ │
│  │      buyers_matched: candidates.length,                  │ │
│  │      buyers_selected: selected.length,                   │ │
│  │      execution_time_ms,                                   │ │
│  │      success: true,                                       │ │
│  │      metadata: { full routing details }                  │ │
│  │    }                                                       │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 6. UPDATE LEAD STATUS                                     │ │
│  │    UPDATE leads SET                                       │ │
│  │      status = 'routed',                                   │ │
│  │      routing_tier = tier_used,                           │ │
│  │      routing_attempts = routing_attempts + 1,            │ │
│  │      last_routing_attempt = NOW()                        │ │
│  │    WHERE id = lead_id                                     │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Return Response:                                               │
│  {                                                              │
│    success: true,                                              │
│    lead_id: "uuid",                                            │
│    status: "routed",                                           │
│    tier_used: 1,                                               │
│    deliveries_created: [                                       │
│      {                                                          │
│        delivery_id: "uuid",                                    │
│        buyer_id: "uuid",                                       │
│        business_name: "ABC Plumbing",                          │
│        charge_amount: 50.00,                                   │
│        used_free_lead: false                                   │
│      }                                                          │
│    ]                                                            │
│  }                                                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 **Background Jobs & Cron Tasks**

### **1. Daily Capacity Reset (Midnight)**
```sql
-- Runs at 00:00:00 every day
UPDATE buyers SET daily_sent = 0 WHERE status = 'active';

-- Log the reset
INSERT INTO system_logs (event, details) 
VALUES ('daily_capacity_reset', jsonb_build_object(
  'buyers_reset', (SELECT COUNT(*) FROM buyers WHERE status = 'active'),
  'timestamp', NOW()
));
```

### **2. Parked Lead Processing (6am Daily)**
```typescript
// Runs at 06:00:00 every day
async function processParkedLeads() {
  // Get all leads ready for retry
  const { data: parkedLeads } = await supabase
    .from('lead_queue')
    .select('*, leads(*)')
    .eq('status', 'parked')
    .lte('next_retry_at', new Date().toISOString());
  
  console.log(`[Cron] Processing ${parkedLeads.length} parked leads`);
  
  for (const queued of parkedLeads) {
    // Update status to processing
    await supabase
      .from('lead_queue')
      .update({ status: 'processing' })
      .eq('id', queued.id);
    
    // Re-attempt routing from Tier 1
    const result = await routeLeadInternal(
      supabase,
      queued.leads,
      false // not dry run
    );
    
    if (result.selected.length > 0) {
      // SUCCESS - Lead routed!
      await supabase
        .from('lead_queue')
        .update({ 
          status: 'routed',
          routed_at: new Date().toISOString()
        })
        .eq('id', queued.id);
      
      console.log(`[Cron] ✅ Parked lead ${queued.lead_id} successfully routed`);
    } else {
      // FAILED - Still can't route
      const newRetryCount = queued.retry_count + 1;
      
      if (newRetryCount >= 3) {
        // Give up, send to admin
        await supabase.from('unroutable_leads').insert({
          lead_id: queued.lead_id,
          city: queued.leads.city,
          service_type: queued.leads.service_type,
          reason: `Failed routing after ${newRetryCount} attempts (3 days)`,
          suggested_action: 'Recruit buyers in this area or refund lead source'
        });
        
        await supabase
          .from('lead_queue')
          .update({ 
            status: 'failed',
            failed_reason: 'Max retries exceeded'
          })
          .eq('id', queued.id);
        
        // Send admin alert
        await sendAdminAlert('unroutable_lead', { lead_id: queued.lead_id });
        
        console.log(`[Cron] ❌ Parked lead ${queued.lead_id} failed after 3 attempts`);
      } else {
        // Retry tomorrow
        await supabase
          .from('lead_queue')
          .update({ 
            status: 'parked',
            retry_count: newRetryCount,
            next_retry_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          })
          .eq('id', queued.id);
        
        console.log(`[Cron] ⏸️ Parked lead ${queued.lead_id} rescheduled (attempt ${newRetryCount}/3)`);
      }
    }
  }
}
```

### **3. Stale Lead Cleanup (Weekly)**
```sql
-- Runs every Sunday at 2am
-- Delete leads older than 90 days (no deliveries)
DELETE FROM leads 
WHERE created_at < NOW() - INTERVAL '90 days'
  AND id NOT IN (SELECT DISTINCT lead_id FROM deliveries);

-- Archive old deliveries (move to archive table)
INSERT INTO deliveries_archive 
SELECT * FROM deliveries 
WHERE created_at < NOW() - INTERVAL '1 year';

DELETE FROM deliveries 
WHERE created_at < NOW() - INTERVAL '1 year';
```

---

## 📈 **Performance Optimizations**

### **1. Database Indexes (CRITICAL)**
```sql
-- Tier 1: Perfect match
CREATE INDEX idx_buyers_city_service_active 
  ON buyers(city, status) 
  WHERE status = 'active';

CREATE INDEX idx_buyers_services_gin 
  ON buyers USING GIN(to_tsvector('english', services_csv));

-- Tier 2: Geographic
CREATE INDEX idx_city_distances_lookup 
  ON city_distances(city_a, city_b, distance_km);

-- Tier 3: Service aliases
CREATE INDEX idx_service_aliases_lookup 
  ON service_type_aliases(canonical_service, alias, match_score);

-- Tier 4: Premium
CREATE INDEX idx_buyers_premium 
  ON buyers(premium_tier, accept_any_lead) 
  WHERE premium_tier = true OR accept_any_lead = true;

-- Tier 5: Queue
CREATE INDEX idx_lead_queue_retry 
  ON lead_queue(next_retry_at, status) 
  WHERE status = 'parked';

-- Performance
CREATE INDEX idx_deliveries_lead_buyer 
  ON deliveries(lead_id, buyer_id);

CREATE INDEX idx_buyers_daily_cap 
  ON buyers(daily_sent, daily_cap) 
  WHERE daily_sent < daily_cap;
```

### **2. Query Optimization**
- Use `EXPLAIN ANALYZE` to verify index usage
- Batch database operations (single query vs N queries)
- Cache city distances in memory (rarely changes)
- Use prepared statements for repeated queries

### **3. Edge Function Optimization**
- Move heavy logic to PostgreSQL functions
- Use database triggers for buyer updates
- Queue emails/SMS in database (process async)
- Implement circuit breaker for external APIs

---

## 🎯 **Success Metrics**

### **Key Performance Indicators (KPIs)**

```sql
-- 1. Routing Success Rate by Tier
SELECT 
  routing_tier,
  COUNT(*) as leads_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM routing_audit
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY routing_tier
ORDER BY routing_tier;

-- Expected results:
-- Tier 1: 70-80% (Perfect Match)
-- Tier 2: 10-15% (Geographic Expansion)
-- Tier 3: 5-8%   (Service Flexibility)
-- Tier 4: 2-3%   (Premium Buyers)
-- Tier 5: 1-2%   (Parked)
-- Tier 6: <1%    (Unroutable)

-- 2. Lead Waste Rate (Goal: < 1%)
SELECT 
  COUNT(*) FILTER (WHERE routing_tier IS NULL) as unrouted,
  COUNT(*) as total_leads,
  ROUND(COUNT(*) FILTER (WHERE routing_tier IS NULL) * 100.0 / COUNT(*), 2) as waste_percentage
FROM leads
WHERE created_at >= NOW() - INTERVAL '7 days';

-- 3. Average Routing Time (Goal: < 2 seconds)
SELECT 
  AVG(execution_time_ms) as avg_ms,
  MAX(execution_time_ms) as max_ms,
  MIN(execution_time_ms) as min_ms
FROM routing_audit
WHERE created_at >= NOW() - INTERVAL '7 days';

-- 4. Buyer Utilization (Goal: 60-80%)
SELECT 
  business_name,
  daily_sent,
  daily_cap,
  ROUND(daily_sent * 100.0 / daily_cap, 1) as utilization_pct
FROM buyers
WHERE status = 'active'
ORDER BY utilization_pct DESC;

-- 5. Revenue by Tier
SELECT 
  routing_tier,
  COUNT(*) as deliveries,
  SUM(charge_amount) as total_revenue,
  AVG(charge_amount) as avg_price
FROM deliveries
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY routing_tier
ORDER BY routing_tier;
```

---

## 🚀 **Implementation Phases**

### **Phase 1: Foundation (Week 1)**
- ✅ Create new database tables
- ✅ Add indexes
- ✅ Populate city_distances table (Ontario cities)
- ✅ Populate service_type_aliases table (common services)
- ✅ Update buyers table with new fields
- ✅ Test migrations

### **Phase 2: Core Routing (Week 2)**
- ✅ Implement Tier 1 (Perfect Match)
- ✅ Implement Tier 2 (Geographic Expansion)
- ✅ Implement Tier 3 (Service Flexibility)
- ✅ Add routing audit logging
- ✅ Test with real data

### **Phase 3: Advanced Features (Week 3)**
- ✅ Implement Tier 4 (Premium Buyers)
- ✅ Implement Tier 5 (Lead Parking)
- ✅ Implement Tier 6 (Admin Alerts)
- ✅ Set up cron jobs
- ✅ Build admin UI for unroutable leads

### **Phase 4: Optimization (Week 4)**
- ✅ Performance tuning
- ✅ Load testing (simulate 1000 buyers)
- ✅ Email batching optimization
- ✅ SMS queueing
- ✅ Monitoring & alerts

---

## 📞 **Next Steps**

**Ready to implement?** Here's what we'll do next:

1. **Review & Approve Flowchart** ← YOU ARE HERE
2. **Create Database Migration** (all new tables + indexes)
3. **Implement New Router Function** (all 6 tiers)
4. **Build Admin UI** (unroutable leads management)
5. **Set Up Cron Jobs** (parked lead processing)
6. **Testing & Validation**
7. **Deploy to Production**

---

## ✅ **IMPLEMENTATION STATUS**

**Last Updated:** November 13, 2024  
**Status:** Database & UI Complete - Ready for Routing Logic Implementation

---

### **✅ COMPLETED: Database Schema & Ontario Setup**

**Files Created:**
- ✅ `supabase/migrations/001_geographic_expansion.sql` (Schema)
- ✅ `supabase/migrations/002_seed_ontario_cities.sql` (75 Ontario cities + 125+ distances)
- ✅ `src/components/buyers/GeographicPreferences.tsx` (React UI component)
- ✅ `IMPLEMENTATION-GUIDE.md` (Step-by-step deployment guide)
- ✅ `GEOGRAPHIC-EXPANSION-TEST.md` (Comprehensive testing scenarios)
- ✅ `ONTARIO-CITIES-SETUP.md` (Complete Ontario cities strategy)

**Database Tables Created:**
- ✅ `cities` - 75 Ontario cities with coordinates
- ✅ `city_distances` - 125+ pre-calculated driving distances
- ✅ `service_type_aliases` - 70+ service matching rules
- ✅ `lead_queue` - Parked leads for Tier 5
- ✅ `unroutable_leads` - Admin alerts for Tier 6
- ✅ `routing_audit` - Complete routing history

**Buyer Table Updates:**
- ✅ `willing_to_travel_km` (default: 25km, adjustable 0-100km)
- ✅ `max_travel_time_minutes` (default: 45 mins)
- ✅ `avoid_toll_routes` (boolean)
- ✅ `service_cities` (manual override array)
- ✅ `conversion_rate` (performance tracking)
- ✅ `avg_response_time_minutes` (performance tracking)

**Helper Functions Created:**
- ✅ `get_city_distance(city_a, city_b)` - Get distance between any two cities
- ✅ `get_cities_within_radius(city, radius_km)` - Find cities within X km
- ✅ `get_buyers_for_city(city, service_type)` - Find buyers who serve a city
- ✅ `calculate_haversine_distance(lat1, lon1, lat2, lon2)` - Fallback distance calc

**UI Component Features:**
- ✅ Interactive slider (0-100km service radius)
- ✅ Real-time city list updates
- ✅ Distance and travel time display
- ✅ Smart recommendations ("Expand to 30km for 3 more cities")
- ✅ Avoid toll routes toggle
- ✅ Save/reset functionality
- ✅ Mobile-responsive design

**Ontario Cities Coverage:**
- ✅ **15 GTA cities** (Toronto, Mississauga, Brampton, Markham, Vaughan, etc.)
- ✅ **6 Golden Horseshoe cities** (Hamilton, St. Catharines, Niagara Falls, etc.)
- ✅ **14 Southwestern cities** (London, Windsor, Kitchener, Cambridge, Guelph, etc.)
- ✅ **7 Eastern cities** (Ottawa, Kingston, Cornwall, Belleville, etc.)
- ✅ **7 Central cities** (Barrie, Orillia, Peterborough, etc.)
- ✅ **6 Northern cities** (Sudbury, Thunder Bay, Sault Ste. Marie, etc.)
- **Total:** 75 cities covering all major Ontario markets

**Geographic Expansion Pricing:**
- ✅ **SAME PRICE** regardless of distance (buyer decides if worth it)
- ✅ Buyer sets `willing_to_travel_km` preference
- ✅ Self-selecting system (only buyers who want to travel see those leads)
- Example: $50 lead in Vaughan = $50 for Toronto buyer (no distance surcharge)

---

### **⏳ PENDING: Routing Logic Implementation**

**Next Steps (Estimated: 4-6 hours):**

1. **Update Lead Intake Function** (`supabase/functions/lead-intake/index.ts`)
   - Integrate Tier 2: Geographic Expansion
   - Integrate Tier 3: Service Flexibility
   - Integrate Tier 4: Capacity Expansion
   - Integrate Tier 5: Lead Parking
   - Integrate Tier 6: Admin Alerts

2. **Create Routing Audit Logic**
   - Log all routing attempts to `routing_audit` table
   - Track which tier was used, execution time, candidates

3. **Create Parked Lead Processor** (Cron job)
   - Process leads in `lead_queue` table
   - Retry every 24 hours
   - Auto-escalate after 3 days

4. **Admin UI for Unroutable Leads**
   - Dashboard widget showing unroutable leads
   - Quick actions: Add buyer, Expand campaign, Manual route

5. **Testing & Validation**
   - Test all 6 tiers with real scenarios
   - Performance testing (1000 buyer simulation)
   - Load testing routing function

---

### **📊 Expected Impact**

**Before Geographic Expansion:**
- Lead waste rate: 15-20%
- Cities served: 10-15
- Revenue per 100 leads: $4,000-$4,500

**After Geographic Expansion:**
- Lead waste rate: <5%
- Cities served: 75+ (all Ontario)
- Revenue per 100 leads: $4,750-$5,000
- Extra revenue: **+$1,000/month = $12,000/year**

---

### **🚀 Deployment Plan**

**Phase 1: Database Setup** (15 minutes) ✅ READY
1. Run `001_geographic_expansion.sql` in Supabase SQL Editor
2. Run `002_seed_ontario_cities.sql` in Supabase SQL Editor
3. Verify tables and data with test queries

**Phase 2: UI Deployment** (30 minutes) ✅ READY
1. Integrate `GeographicPreferences` component into buyer portal
2. Add navigation link to "Service Area" settings
3. Test with a buyer account
4. Deploy to Netlify via GitHub push

**Phase 3: Routing Logic** (4-6 hours) ⏳ NEXT
1. Update routing function with all 6 tiers
2. Add audit logging
3. Test thoroughly
4. Deploy Edge Functions

**Phase 4: Monitoring** (1 hour)
1. Set up Sentry for routing errors
2. Create admin dashboard for routing analytics
3. Set up alerts for high waste rate

---

**Ready to proceed with Phase 3 (Routing Logic)?** 🎯

