/**
 * ============================================================================
 * ADS RouteHub - 6-Tier Fallback Routing System
 * ============================================================================
 * 
 * Version: 2.0
 * Purpose: Zero-waste lead routing with intelligent fallback tiers
 * 
 * Tier 1: Perfect Match (exact city + service + capacity)
 * Tier 2: Geographic Expansion (nearby cities within travel radius)
 * Tier 3: Service Flexibility (related service types via aliases)
 * Tier 4: Capacity Expansion (time-based, multi-day caps)
 * Tier 5: Lead Parking (queue for 24h retry)
 * Tier 6: Admin Alerts (flag as unroutable, notify admin)
 * 
 * ============================================================================
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface Lead {
  id?: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  service_type: string;
  exclusivity: 'shared' | 'exclusive';
  campaign_id?: string;
  budget_raw?: string;
  notes?: string;
}

export interface Buyer {
  id: string;
  business_name: string;
  email: string;
  city: string;
  services_csv: string;
  status: string;
  daily_cap: number;
  daily_sent: number;
  shared_cap: number;
  response_rate: number;
  price_exclusive: number;
  price_shared: number;
  free_leads_left: number;
  sms_enabled: boolean;
  sms_phone: string | null;
  willing_to_travel_km?: number;
  max_travel_time_minutes?: number;
  avoid_toll_routes?: boolean;
  conversion_rate?: number;
  avg_response_time_minutes?: number;
}

export interface RoutingCandidate {
  buyer: Buyer;
  would_receive: boolean;
  reason: string;
  using_free_lead: boolean;
  calculated_charge_amount: number;
  tier?: number;
  distance_km?: number;
  travel_time_minutes?: number;
  service_match_score?: number;
}

export interface RoutingResult {
  candidates: RoutingCandidate[];
  selected: RoutingCandidate[];
  deliveries?: Array<{ id: string; buyer_id: string }>;
  tier_used: number;
  execution_time_ms: number;
  metadata: {
    tier_attempts: number[];
    total_candidates: number;
    selected_count: number;
    reasons: string[];
  };
}

/**
 * Main routing function with 6-tier fallback
 */
export async function routeLeadV2(
  supabase: SupabaseClient,
  lead: Lead,
  dryRun = false
): Promise<RoutingResult> {
  const startTime = performance.now();
  console.log(`[Router V2] Starting routing for lead ${lead.id || '(new)'}`);
  console.log(`[Router V2] City: ${lead.city}, Service: ${lead.service_type}, Exclusivity: ${lead.exclusivity}`);

  let candidates: RoutingCandidate[] = [];
  let selected: RoutingCandidate[] = [];
  let tierUsed = 0;
  const tierAttempts: number[] = [];

  // ========================================================================
  // TIER 1: PERFECT MATCH
  // ========================================================================
  console.log('[Router V2] 🎯 TIER 1: Perfect Match - Starting...');
  tierAttempts.push(1);
  
  const tier1Result = await tier1PerfectMatch(supabase, lead);
  candidates.push(...tier1Result.candidates);
  
  if (tier1Result.selected.length > 0) {
    console.log(`[Router V2] ✅ TIER 1: Success! Found ${tier1Result.selected.length} buyers`);
    selected = tier1Result.selected;
    tierUsed = 1;
  } else {
    console.log('[Router V2] ❌ TIER 1: No buyers found, moving to Tier 2');
  }

  // ========================================================================
  // TIER 2: GEOGRAPHIC EXPANSION
  // ========================================================================
  if (selected.length === 0) {
    console.log('[Router V2] 🌍 TIER 2: Geographic Expansion - Starting...');
    tierAttempts.push(2);
    
    const tier2Result = await tier2GeographicExpansion(supabase, lead);
    candidates.push(...tier2Result.candidates);
    
    if (tier2Result.selected.length > 0) {
      console.log(`[Router V2] ✅ TIER 2: Success! Found ${tier2Result.selected.length} buyers from nearby cities`);
      selected = tier2Result.selected;
      tierUsed = 2;
    } else {
      console.log('[Router V2] ❌ TIER 2: No buyers found, moving to Tier 3');
    }
  }

  // ========================================================================
  // TIER 3: SERVICE FLEXIBILITY
  // ========================================================================
  if (selected.length === 0) {
    console.log('[Router V2] 🔧 TIER 3: Service Flexibility - Starting...');
    tierAttempts.push(3);
    
    const tier3Result = await tier3ServiceFlexibility(supabase, lead);
    candidates.push(...tier3Result.candidates);
    
    if (tier3Result.selected.length > 0) {
      console.log(`[Router V2] ✅ TIER 3: Success! Found ${tier3Result.selected.length} buyers with related services`);
      selected = tier3Result.selected;
      tierUsed = 3;
    } else {
      console.log('[Router V2] ❌ TIER 3: No buyers found, moving to Tier 4');
    }
  }

  // ========================================================================
  // TIER 4: CAPACITY EXPANSION
  // ========================================================================
  if (selected.length === 0) {
    console.log('[Router V2] ⏰ TIER 4: Capacity Expansion - Starting...');
    tierAttempts.push(4);
    
    const tier4Result = await tier4CapacityExpansion(supabase, lead);
    candidates.push(...tier4Result.candidates);
    
    if (tier4Result.selected.length > 0) {
      console.log(`[Router V2] ✅ TIER 4: Success! Found ${tier4Result.selected.length} buyers with time-based availability`);
      selected = tier4Result.selected;
      tierUsed = 4;
    } else {
      console.log('[Router V2] ❌ TIER 4: No buyers found, moving to Tier 5');
    }
  }

  // ========================================================================
  // TIER 5: LEAD PARKING
  // ========================================================================
  if (selected.length === 0) {
    console.log('[Router V2] 🅿️ TIER 5: Lead Parking - Queuing lead for retry...');
    tierAttempts.push(5);
    
    if (!dryRun && lead.id) {
      await tier5LeadParking(supabase, lead);
      console.log('[Router V2] ✅ TIER 5: Lead parked successfully');
      tierUsed = 5;
    } else {
      console.log('[Router V2] TIER 5: Dry run or no lead ID, skipping parking');
    }
  }

  // ========================================================================
  // TIER 6: ADMIN ALERTS
  // ========================================================================
  if (selected.length === 0 && tierUsed !== 5) {
    console.log('[Router V2] 🚨 TIER 6: Admin Alerts - Flagging as unroutable...');
    tierAttempts.push(6);
    
    if (!dryRun && lead.id) {
      await tier6AdminAlerts(supabase, lead, candidates);
      console.log('[Router V2] ✅ TIER 6: Admin alert created');
      tierUsed = 6;
    } else {
      console.log('[Router V2] TIER 6: Dry run or no lead ID, skipping alert');
    }
  }

  // ========================================================================
  // CREATE DELIVERIES (if not dry run and buyers selected)
  // ========================================================================
  const createdDeliveries: Array<{ id: string; buyer_id: string }> = [];
  
  if (!dryRun && lead.id && selected.length > 0) {
    console.log(`[Router V2] Creating ${selected.length} deliveries for lead ${lead.id}`);
    
    for (const candidate of selected) {
      try {
        const delivery = await createDelivery(supabase, lead, candidate);
        createdDeliveries.push({ id: delivery.id, buyer_id: candidate.buyer.id });
        
        // Update buyer counters
        await updateBuyerCounters(supabase, candidate);
      } catch (error) {
        console.error(`[Router V2] Failed to create delivery for buyer ${candidate.buyer.id}:`, error);
      }
    }
  }

  // ========================================================================
  // LOG TO ROUTING AUDIT
  // ========================================================================
  const executionTime = performance.now() - startTime;
  
  if (!dryRun && lead.id) {
    await logRoutingAudit(supabase, {
      lead_id: lead.id,
      tier_used: tierUsed,
      buyers_matched: candidates.filter(c => c.reason.includes('Eligible')).length,
      buyers_selected: selected.length,
      execution_time_ms: Math.round(executionTime),
      success: selected.length > 0 || tierUsed === 5 || tierUsed === 6,
      metadata: {
        tier_attempts: tierAttempts,
        candidates: candidates.map(c => ({
          buyer_id: c.buyer.id,
          business_name: c.buyer.business_name,
          tier: c.tier,
          reason: c.reason,
          would_receive: c.would_receive,
          distance_km: c.distance_km,
          service_match_score: c.service_match_score,
        })),
        city: lead.city,
        service_type: lead.service_type,
        exclusivity: lead.exclusivity,
      },
    });
  }

  console.log(`[Router V2] Routing complete in ${executionTime.toFixed(0)}ms`);
  console.log(`[Router V2] Tier used: ${tierUsed}, Selected: ${selected.length} buyers`);

  return {
    candidates,
    selected,
    deliveries: createdDeliveries.length > 0 ? createdDeliveries : undefined,
    tier_used: tierUsed,
    execution_time_ms: Math.round(executionTime),
    metadata: {
      tier_attempts: tierAttempts,
      total_candidates: candidates.length,
      selected_count: selected.length,
      reasons: [...new Set(candidates.map(c => c.reason))],
    },
  };
}

/**
 * TIER 1: Perfect Match
 * Exact city + service + capacity available
 */
async function tier1PerfectMatch(
  supabase: SupabaseClient,
  lead: Lead
): Promise<{ candidates: RoutingCandidate[]; selected: RoutingCandidate[] }> {
  const { city, service_type, exclusivity } = lead;
  
  // Fetch buyers matching exact city and service
  const { data: buyers } = await supabase
    .from('buyers')
    .select('*')
    .eq('status', 'active')
    .ilike('services_csv', `%${service_type}%`)
    .eq('city', city.toLowerCase());

  const allBuyers = (buyers || []) as Buyer[];
  const candidates: RoutingCandidate[] = [];

  for (const buyer of allBuyers) {
    // Check daily cap
    if (buyer.daily_sent >= buyer.daily_cap) {
      candidates.push({
        buyer,
        would_receive: false,
        reason: `Tier 1: Daily cap reached (${buyer.daily_sent}/${buyer.daily_cap})`,
        using_free_lead: false,
        calculated_charge_amount: 0,
        tier: 1,
      });
      continue;
    }

    // Calculate charge
    const usingFreeLead = buyer.free_leads_left > 0;
    const chargeAmount = usingFreeLead 
      ? 0 
      : (exclusivity === 'exclusive' ? buyer.price_exclusive : buyer.price_shared);

    candidates.push({
      buyer,
      would_receive: false,
      reason: 'Tier 1: Eligible (perfect match)',
      using_free_lead: usingFreeLead,
      calculated_charge_amount: chargeAmount,
      tier: 1,
    });
  }

  // Select best buyers
  const eligibleCandidates = candidates.filter(c => c.reason === 'Tier 1: Eligible (perfect match)');
  const selected = selectBestBuyers(eligibleCandidates, exclusivity);
  
  // Mark selected
  for (const candidate of selected) {
    candidate.would_receive = true;
  }

  return { candidates, selected };
}

/**
 * TIER 2: Geographic Expansion
 * Nearby cities within buyer's travel radius
 */
async function tier2GeographicExpansion(
  supabase: SupabaseClient,
  lead: Lead
): Promise<{ candidates: RoutingCandidate[]; selected: RoutingCandidate[] }> {
  const { city, service_type, exclusivity } = lead;
  
  console.log(`[Tier 2] Looking for buyers willing to travel to ${city}`);
  
  // Use the get_buyers_for_city function
  const { data: nearbyBuyers, error } = await supabase.rpc('get_buyers_for_city', {
    p_city_name: city.toLowerCase(),
    p_service_type: service_type.toLowerCase(),
  });

  if (error) {
    console.error('[Tier 2] Error fetching nearby buyers:', error);
    return { candidates: [], selected: [] };
  }

  const candidates: RoutingCandidate[] = [];

  for (const buyerData of (nearbyBuyers || [])) {
    // Fetch full buyer details
    const { data: buyer } = await supabase
      .from('buyers')
      .select('*')
      .eq('id', buyerData.buyer_id)
      .single();

    if (!buyer || buyer.status !== 'active') continue;

    // Check daily cap
    if (buyer.daily_sent >= buyer.daily_cap) {
      candidates.push({
        buyer: buyer as Buyer,
        would_receive: false,
        reason: `Tier 2: Daily cap reached (${buyer.daily_sent}/${buyer.daily_cap})`,
        using_free_lead: false,
        calculated_charge_amount: 0,
        tier: 2,
        distance_km: buyerData.distance_km,
        travel_time_minutes: buyerData.travel_time_minutes,
      });
      continue;
    }

    // Calculate charge (SAME PRICE as local)
    const usingFreeLead = buyer.free_leads_left > 0;
    const chargeAmount = usingFreeLead 
      ? 0 
      : (exclusivity === 'exclusive' ? buyer.price_exclusive : buyer.price_shared);

    candidates.push({
      buyer: buyer as Buyer,
      would_receive: false,
      reason: `Tier 2: Eligible (${buyerData.distance_km}km away)`,
      using_free_lead: usingFreeLead,
      calculated_charge_amount: chargeAmount,
      tier: 2,
      distance_km: buyerData.distance_km,
      travel_time_minutes: buyerData.travel_time_minutes,
    });
  }

  // Select best buyers (prioritize by distance and conversion rate)
  const eligibleCandidates = candidates.filter(c => c.reason.includes('Eligible'));
  eligibleCandidates.sort((a, b) => {
    // Sort by: distance (closer is better), then conversion rate (higher is better)
    const distanceDiff = (a.distance_km || 0) - (b.distance_km || 0);
    if (distanceDiff !== 0) return distanceDiff;
    return (b.buyer.conversion_rate || 0) - (a.buyer.conversion_rate || 0);
  });

  const maxBuyers = exclusivity === 'exclusive' ? 1 : 3;
  const selected = eligibleCandidates.slice(0, maxBuyers);
  
  for (const candidate of selected) {
    candidate.would_receive = true;
  }

  console.log(`[Tier 2] Found ${candidates.length} candidates, selected ${selected.length}`);

  return { candidates, selected };
}

/**
 * TIER 3: Service Flexibility
 * Related service types via aliases
 */
async function tier3ServiceFlexibility(
  supabase: SupabaseClient,
  lead: Lead
): Promise<{ candidates: RoutingCandidate[]; selected: RoutingCandidate[] }> {
  const { city, service_type, exclusivity } = lead;
  
  console.log(`[Tier 3] Looking for related services to ${service_type}`);
  
  // Find related services
  const { data: aliases } = await supabase
    .from('service_type_aliases')
    .select('canonical_service, match_score')
    .or(`alias.ilike.%${service_type}%,canonical_service.ilike.%${service_type}%`)
    .eq('is_active', true);

  if (!aliases || aliases.length === 0) {
    console.log('[Tier 3] No service aliases found');
    return { candidates: [], selected: [] };
  }

  // Get all related service types
  const relatedServices = [...new Set(aliases.map(a => a.canonical_service))];
  console.log(`[Tier 3] Related services:`, relatedServices);

  const candidates: RoutingCandidate[] = [];

  // Try exact city first with related services
  for (const relatedService of relatedServices) {
    const { data: buyers } = await supabase
      .from('buyers')
      .select('*')
      .eq('status', 'active')
      .ilike('services_csv', `%${relatedService}%`)
      .eq('city', city.toLowerCase());

    const matchScore = aliases.find(a => a.canonical_service === relatedService)?.match_score || 0.5;

    for (const buyer of (buyers || []) as Buyer[]) {
      if (buyer.daily_sent >= buyer.daily_cap) {
        candidates.push({
          buyer,
          would_receive: false,
          reason: `Tier 3: Daily cap reached`,
          using_free_lead: false,
          calculated_charge_amount: 0,
          tier: 3,
          service_match_score: matchScore,
        });
        continue;
      }

      const usingFreeLead = buyer.free_leads_left > 0;
      const chargeAmount = usingFreeLead 
        ? 0 
        : (exclusivity === 'exclusive' ? buyer.price_exclusive : buyer.price_shared);

      candidates.push({
        buyer,
        would_receive: false,
        reason: `Tier 3: Eligible (related service: ${relatedService})`,
        using_free_lead: usingFreeLead,
        calculated_charge_amount: chargeAmount,
        tier: 3,
        service_match_score: matchScore,
      });
    }
  }

  // Then try nearby cities with related services
  const { data: nearbyBuyers } = await supabase.rpc('get_buyers_for_city', {
    p_city_name: city.toLowerCase(),
    p_service_type: null, // Get all services
  });

  for (const buyerData of (nearbyBuyers || [])) {
    const { data: buyer } = await supabase
      .from('buyers')
      .select('*')
      .eq('id', buyerData.buyer_id)
      .single();

    if (!buyer || buyer.status !== 'active') continue;

    // Check if buyer has any related services
    const hasRelatedService = relatedServices.some(s => 
      buyer.services_csv?.toLowerCase().includes(s.toLowerCase())
    );

    if (!hasRelatedService) continue;

    if (buyer.daily_sent >= buyer.daily_cap) continue;

    const matchingService = relatedServices.find(s => 
      buyer.services_csv?.toLowerCase().includes(s.toLowerCase())
    );
    const matchScore = aliases.find(a => a.canonical_service === matchingService)?.match_score || 0.5;

    const usingFreeLead = buyer.free_leads_left > 0;
    const chargeAmount = usingFreeLead 
      ? 0 
      : (exclusivity === 'exclusive' ? buyer.price_exclusive : buyer.price_shared);

    candidates.push({
      buyer: buyer as Buyer,
      would_receive: false,
      reason: `Tier 3: Eligible (related service + nearby: ${matchingService})`,
      using_free_lead: usingFreeLead,
      calculated_charge_amount: chargeAmount,
      tier: 3,
      distance_km: buyerData.distance_km,
      travel_time_minutes: buyerData.travel_time_minutes,
      service_match_score: matchScore,
    });
  }

  // Select best buyers (prioritize by match score, then distance)
  const eligibleCandidates = candidates.filter(c => c.reason.includes('Eligible'));
  eligibleCandidates.sort((a, b) => {
    // Sort by: match score (higher is better), then distance (closer is better)
    const scoreDiff = (b.service_match_score || 0) - (a.service_match_score || 0);
    if (Math.abs(scoreDiff) > 0.1) return scoreDiff;
    return (a.distance_km || 0) - (b.distance_km || 0);
  });

  const maxBuyers = exclusivity === 'exclusive' ? 1 : 3;
  const selected = eligibleCandidates.slice(0, maxBuyers);
  
  for (const candidate of selected) {
    candidate.would_receive = true;
  }

  console.log(`[Tier 3] Found ${candidates.length} candidates, selected ${selected.length}`);

  return { candidates, selected };
}

/**
 * TIER 4: Capacity Expansion
 * Time-based availability (off-peak, weekend, future capacity)
 */
async function tier4CapacityExpansion(
  supabase: SupabaseClient,
  lead: Lead
): Promise<{ candidates: RoutingCandidate[]; selected: RoutingCandidate[] }> {
  const { city, service_type, exclusivity } = lead;
  
  console.log(`[Tier 4] Checking time-based capacity expansion`);
  
  // For now, implement basic time-based logic:
  // - Check if it's weekend (buyers might have more capacity)
  // - Check if it's after business hours (might accept more)
  // - Look 24 hours ahead for buyers who will have capacity tomorrow
  
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
  const hour = now.getHours();
  
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const isOffPeak = hour < 8 || hour >= 18;
  
  console.log(`[Tier 4] Current time: ${now.toISOString()}, Weekend: ${isWeekend}, Off-peak: ${isOffPeak}`);
  
  // If it's off-peak or weekend, we could potentially offer to buyers
  // who are at capacity but might accept leads for next day
  
  // Get ALL buyers for this city/service (including those at capacity)
  const { data: buyers } = await supabase
    .from('buyers')
    .select('*')
    .eq('status', 'active')
    .ilike('services_csv', `%${service_type}%`)
    .eq('city', city.toLowerCase());

  const candidates: RoutingCandidate[] = [];

  for (const buyer of (buyers || []) as Buyer[]) {
    // Even if at daily cap, they might want it for tomorrow
    if (buyer.daily_sent >= buyer.daily_cap) {
      // Only offer if off-peak or weekend
      if (isOffPeak || isWeekend) {
        const usingFreeLead = buyer.free_leads_left > 0;
        const chargeAmount = usingFreeLead 
          ? 0 
          : (exclusivity === 'exclusive' ? buyer.price_exclusive : buyer.price_shared);

        candidates.push({
          buyer,
          would_receive: false,
          reason: `Tier 4: Eligible (${isWeekend ? 'weekend' : 'off-peak'} capacity)`,
          using_free_lead: usingFreeLead,
          calculated_charge_amount: chargeAmount,
          tier: 4,
        });
      }
    }
  }

  // Also check nearby buyers
  const { data: nearbyBuyers } = await supabase.rpc('get_buyers_for_city', {
    p_city_name: city.toLowerCase(),
    p_service_type: service_type.toLowerCase(),
  });

  for (const buyerData of (nearbyBuyers || [])) {
    const { data: buyer } = await supabase
      .from('buyers')
      .select('*')
      .eq('id', buyerData.buyer_id)
      .single();

    if (!buyer || buyer.status !== 'active') continue;

    if (buyer.daily_sent >= buyer.daily_cap && (isOffPeak || isWeekend)) {
      const usingFreeLead = buyer.free_leads_left > 0;
      const chargeAmount = usingFreeLead 
        ? 0 
        : (exclusivity === 'exclusive' ? buyer.price_exclusive : buyer.price_shared);

      candidates.push({
        buyer: buyer as Buyer,
        would_receive: false,
        reason: `Tier 4: Eligible (${isWeekend ? 'weekend' : 'off-peak'} + ${buyerData.distance_km}km)`,
        using_free_lead: usingFreeLead,
        calculated_charge_amount: chargeAmount,
        tier: 4,
        distance_km: buyerData.distance_km,
        travel_time_minutes: buyerData.travel_time_minutes,
      });
    }
  }

  const eligibleCandidates = candidates.filter(c => c.reason.includes('Eligible'));
  const selected = selectBestBuyers(eligibleCandidates, exclusivity);
  
  for (const candidate of selected) {
    candidate.would_receive = true;
  }

  console.log(`[Tier 4] Found ${candidates.length} candidates, selected ${selected.length}`);

  return { candidates, selected };
}

/**
 * TIER 5: Lead Parking
 * Queue lead for 24h retry
 */
async function tier5LeadParking(
  supabase: SupabaseClient,
  lead: Lead
): Promise<void> {
  console.log(`[Tier 5] Parking lead ${lead.id} for future retry`);
  
  const { error } = await supabase.from('lead_queue').insert({
    lead_id: lead.id,
    status: 'parked',
    tier_attempted: 4,
    retry_count: 0,
    next_retry_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    metadata: {
      city: lead.city,
      service_type: lead.service_type,
      exclusivity: lead.exclusivity,
      parked_at: new Date().toISOString(),
      reason: 'No buyers available in Tiers 1-4',
    },
  });

  if (error) {
    console.error('[Tier 5] Error parking lead:', error);
    throw error;
  }

  // Update lead table
  await supabase
    .from('leads')
    .update({
      routing_tier: 5,
      routing_attempts: 1,
      last_routing_attempt: new Date().toISOString(),
      routing_metadata: {
        status: 'parked',
        parked_at: new Date().toISOString(),
      },
    })
    .eq('id', lead.id);

  console.log(`[Tier 5] Lead ${lead.id} parked successfully, will retry in 24 hours`);
}

/**
 * TIER 6: Admin Alerts
 * Flag as unroutable and notify admin
 */
async function tier6AdminAlerts(
  supabase: SupabaseClient,
  lead: Lead,
  candidates: RoutingCandidate[]
): Promise<void> {
  console.log(`[Tier 6] Creating admin alert for unroutable lead ${lead.id}`);
  
  // Analyze why lead couldn't be routed
  const reasons = [];
  
  if (candidates.length === 0) {
    reasons.push('No buyers found for this city/service combination');
  } else {
    const atCapacity = candidates.filter(c => c.reason.includes('cap reached')).length;
    if (atCapacity > 0) {
      reasons.push(`${atCapacity} buyers at capacity`);
    }
  }

  const suggestedActions = [];
  suggestedActions.push(`Add buyer in ${lead.city} for ${lead.service_type}`);
  suggestedActions.push('Expand service coverage to nearby cities');
  suggestedActions.push('Increase buyer daily caps');

  const { error } = await supabase.from('unroutable_leads').insert({
    lead_id: lead.id,
    city: lead.city,
    service_type: lead.service_type,
    reason: reasons.join('; '),
    suggested_actions: suggestedActions,
    admin_notified_at: null, // Will be set when admin actually notified
    resolved: false,
  });

  if (error) {
    console.error('[Tier 6] Error creating admin alert:', error);
    throw error;
  }

  // Update lead table
  await supabase
    .from('leads')
    .update({
      routing_tier: 6,
      routing_attempts: 1,
      last_routing_attempt: new Date().toISOString(),
      routing_metadata: {
        status: 'unroutable',
        reasons,
        suggested_actions: suggestedActions,
      },
    })
    .eq('id', lead.id);

  console.log(`[Tier 6] Admin alert created for lead ${lead.id}`);
  
  // TODO: Send actual admin notification (email/Slack)
}

/**
 * Helper: Select best buyers from eligible candidates
 */
function selectBestBuyers(
  eligible: RoutingCandidate[],
  exclusivity: 'shared' | 'exclusive'
): RoutingCandidate[] {
  if (eligible.length === 0) return [];

  // Sort by conversion rate, response rate, and response time
  eligible.sort((a, b) => {
    const scoreA = calculateBuyerScore(a.buyer);
    const scoreB = calculateBuyerScore(b.buyer);
    return scoreB - scoreA;
  });

  const maxBuyers = exclusivity === 'exclusive' ? 1 : 3;
  return eligible.slice(0, maxBuyers);
}

/**
 * Helper: Calculate buyer quality score
 */
function calculateBuyerScore(buyer: Buyer): number {
  const conversionRate = buyer.conversion_rate || 0;
  const responseRate = buyer.response_rate || 0;
  const responseTime = buyer.avg_response_time_minutes || 120;
  
  // Normalize response time (lower is better, 0-240 minutes scale)
  const normalizedResponseTime = Math.max(0, 1 - (responseTime / 240));
  
  // Weighted score
  return (conversionRate * 0.5) + (responseRate * 0.3) + (normalizedResponseTime * 0.2);
}

/**
 * Helper: Create delivery record
 */
async function createDelivery(
  supabase: SupabaseClient,
  lead: Lead,
  candidate: RoutingCandidate
): Promise<{ id: string }> {
  const { data: delivery, error } = await supabase
    .from('deliveries')
    .insert({
      lead_id: lead.id,
      buyer_id: candidate.buyer.id,
      campaign_id: lead.campaign_id,
      charge_amount: candidate.calculated_charge_amount,
      source: 'internal',
      claim_status: 'new',
      claimed: false,
      won: false,
      refunded: false,
      unlocked: false,
    })
    .select()
    .single();

  if (error) throw error;
  
  console.log(`[Router V2] Created delivery ${delivery.id} for buyer ${candidate.buyer.business_name}`);
  
  return delivery;
}

/**
 * Helper: Update buyer counters after delivery
 */
async function updateBuyerCounters(
  supabase: SupabaseClient,
  candidate: RoutingCandidate
): Promise<void> {
  const { buyer, using_free_lead } = candidate;
  
  const { error } = await supabase
    .from('buyers')
    .update({
      daily_sent: buyer.daily_sent + 1,
      free_leads_left: using_free_lead ? Math.max(0, buyer.free_leads_left - 1) : buyer.free_leads_left,
    })
    .eq('id', buyer.id);

  if (error) {
    console.error(`[Router V2] Error updating buyer ${buyer.id}:`, error);
    throw error;
  }

  console.log(`[Router V2] Updated buyer ${buyer.business_name}: daily_sent=${buyer.daily_sent + 1}`);
}

/**
 * Helper: Log routing attempt to audit table
 */
async function logRoutingAudit(
  supabase: SupabaseClient,
  auditData: {
    lead_id: string;
    tier_used: number;
    buyers_matched: number;
    buyers_selected: number;
    execution_time_ms: number;
    success: boolean;
    metadata: any;
  }
): Promise<void> {
  const { error } = await supabase.from('routing_audit').insert({
    lead_id: auditData.lead_id,
    tier_used: auditData.tier_used,
    buyers_matched: auditData.buyers_matched,
    buyers_selected: auditData.buyers_selected,
    execution_time_ms: auditData.execution_time_ms,
    success: auditData.success,
    metadata: auditData.metadata,
  });

  if (error) {
    console.error('[Router V2] Error logging audit:', error);
    // Don't throw - audit logging failure shouldn't stop the routing
  }
}

