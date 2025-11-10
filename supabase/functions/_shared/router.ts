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
}

export interface RoutingCandidate {
  buyer: Buyer;
  would_receive: boolean;
  reason: string;
  using_free_lead: boolean;
  calculated_charge_amount: number;
}

export interface RoutingResult {
  candidates: RoutingCandidate[];
  selected: RoutingCandidate[];
  deliveries?: Array<{ id: string; buyer_id: string }>; // Added for email unlock links
}

/**
 * Core internal routing logic for leads.
 * This function determines which buyers should receive a lead based on:
 * - Active status
 * - City/service matching
 * - Daily and shared caps
 * - Response rate ranking
 * - Exclusivity rules
 * - Free lead credits and pricing
 * 
 * @param supabase - Supabase client
 * @param lead - The lead to route
 * @param dryRun - If true, only calculate routing without mutations
 * @returns RoutingResult with all candidates and selected buyers
 */
export async function routeLeadInternal(
  supabase: SupabaseClient,
  lead: Lead,
  dryRun = false
): Promise<RoutingResult> {
  const { city, service_type, exclusivity } = lead;

  // Step 1: Find all active buyers matching city and service type
  const { data: buyers } = await supabase
    .from('buyers')
    .select('*')
    .eq('status', 'active')
    .ilike('services_csv', `%${service_type}%`)
    .eq('city', city.toLowerCase());

  const allBuyers = (buyers || []) as Buyer[];
  const candidates: RoutingCandidate[] = [];

  // Step 2: Evaluate each buyer against caps and constraints
  for (const buyer of allBuyers) {
    // Check daily cap
    if (buyer.daily_sent >= buyer.daily_cap) {
      candidates.push({
        buyer,
        would_receive: false,
        reason: `Daily cap reached (${buyer.daily_sent}/${buyer.daily_cap})`,
        using_free_lead: false,
        calculated_charge_amount: 0,
      });
      continue;
    }

    // For shared leads, check if buyer has already received this lead (shared_cap)
    if (exclusivity === 'shared' && lead.id && !dryRun) {
      const { data: existingDeliveries } = await supabase
        .from('deliveries')
        .select('id')
        .eq('lead_id', lead.id)
        .eq('buyer_id', buyer.id);

      const deliveryCount = existingDeliveries?.length || 0;
      if (deliveryCount >= buyer.shared_cap) {
        candidates.push({
          buyer,
          would_receive: false,
          reason: `Shared cap reached for this lead (${deliveryCount}/${buyer.shared_cap})`,
          using_free_lead: false,
          calculated_charge_amount: 0,
        });
        continue;
      }
    }

    // Calculate charge amount based on free leads
    const usingFreeLead = buyer.free_leads_left > 0;
    const chargeAmount = usingFreeLead 
      ? 0 
      : (exclusivity === 'exclusive' ? buyer.price_exclusive : buyer.price_shared);

    // Buyer passes all filters - add as eligible candidate
    // would_receive will be set to true only for final selected buyers
    candidates.push({
      buyer,
      would_receive: false,
      reason: 'Eligible (passes all caps and filters)',
      using_free_lead: usingFreeLead,
      calculated_charge_amount: chargeAmount,
    });
  }

  // Step 3: Select buyers based on response rate and exclusivity
  const eligibleCandidates = candidates.filter(c => c.reason === 'Eligible (passes all caps and filters)');
  
  // Sort by response_rate descending
  eligibleCandidates.sort((a, b) => b.buyer.response_rate - a.buyer.response_rate);

  // Apply exclusivity limits
  // For exclusive: max 1 buyer
  // For shared: max 3 buyers (configurable limit)
  const maxBuyers = exclusivity === 'exclusive' ? 1 : 3;
  const selected = eligibleCandidates.slice(0, maxBuyers);

  // Mark selected buyers as would_receive = true and update their reasons
  for (const candidate of selected) {
    candidate.would_receive = true;
    candidate.reason = 'Passes all caps and filters';
  }

  // Update reasons for non-selected eligible candidates
  for (const candidate of eligibleCandidates) {
    if (!selected.includes(candidate)) {
      candidate.would_receive = false;
      candidate.reason = exclusivity === 'exclusive' 
        ? 'Not selected (exclusive routing chooses a single buyer)'
        : 'Not selected (limited by shared lead cap or response rate ranking)';
    }
  }

  // Step 4: If not dry run, create deliveries and update buyers
  const createdDeliveries: Array<{ id: string; buyer_id: string }> = [];
  
  if (!dryRun && lead.id) {
    console.log(`[Router] Creating ${selected.length} deliveries for lead ${lead.id}`);
    
    for (const candidate of selected) {
      const { buyer, calculated_charge_amount, using_free_lead } = candidate;

      // Insert delivery with claim_status defaulting to 'new'
      const { data: delivery, error: deliveryError } = await supabase.from('deliveries').insert({
        lead_id: lead.id,
        buyer_id: buyer.id,
        campaign_id: lead.campaign_id,
        charge_amount: calculated_charge_amount,
        source: 'internal',
        claim_status: 'new',
        claimed: false,
        won: false,
        refunded: false,
        contacted_at: null,
        closed_at: null,
      }).select().single();

      if (deliveryError) {
        console.error(`[Router] Failed to create delivery for buyer ${buyer.id}:`, deliveryError);
        throw new Error(`Failed to create delivery for buyer ${buyer.business_name}: ${deliveryError.message}`);
      }

      console.log(`[Router] Created delivery ${delivery.id} for buyer ${buyer.business_name} (${buyer.id}), charge: $${calculated_charge_amount}, free: ${using_free_lead}`);
      
      // Track created delivery
      createdDeliveries.push({ id: delivery.id, buyer_id: buyer.id });

      // Update buyer: increment daily_sent and decrement free_leads_left if used
      const { error: buyerError } = await supabase
        .from('buyers')
        .update({
          daily_sent: buyer.daily_sent + 1,
          free_leads_left: using_free_lead ? buyer.free_leads_left - 1 : buyer.free_leads_left,
        })
        .eq('id', buyer.id);

      if (buyerError) {
        console.error(`[Router] Failed to update buyer ${buyer.id}:`, buyerError);
        throw new Error(`Failed to update buyer ${buyer.business_name}: ${buyerError.message}`);
      }

      console.log(`[Router] Updated buyer ${buyer.business_name}: daily_sent=${buyer.daily_sent + 1}, free_leads_left=${using_free_lead ? buyer.free_leads_left - 1 : buyer.free_leads_left}`);
    }
    
    console.log(`[Router] Successfully created ${selected.length} deliveries for lead ${lead.id}`);
  }

  return {
    candidates,
    selected,
    deliveries: createdDeliveries.length > 0 ? createdDeliveries : undefined,
  };
}
