-- ============================================================================
-- Migration: Geographic Expansion System
-- Description: Adds cities, distances, and buyer travel preferences
-- Version: 1.0
-- Date: 2024-11-13
-- ============================================================================

-- ============================================================================
-- 1. CREATE CITIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  name_normalized text NOT NULL UNIQUE, -- lowercase, no spaces for matching
  province text NOT NULL DEFAULT 'Ontario',
  population integer,
  latitude decimal(10, 8) NOT NULL,
  longitude decimal(11, 8) NOT NULL,
  region text NOT NULL, -- 'GTA', 'Southwestern', 'Eastern', 'Central', 'Northern', 'Golden Horseshoe'
  is_major boolean DEFAULT false, -- Major cities (population > 100K)
  timezone text DEFAULT 'America/Toronto',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for fast city lookups
CREATE INDEX IF NOT EXISTS idx_cities_name_normalized ON cities(name_normalized);
CREATE INDEX IF NOT EXISTS idx_cities_region ON cities(region);
CREATE INDEX IF NOT EXISTS idx_cities_major ON cities(is_major) WHERE is_major = true;
CREATE INDEX IF NOT EXISTS idx_cities_province ON cities(province);

-- Function to auto-normalize city names
CREATE OR REPLACE FUNCTION normalize_city_name()
RETURNS TRIGGER AS $$
BEGIN
  NEW.name_normalized := lower(trim(regexp_replace(NEW.name, '\s+', '', 'g')));
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-normalize on insert/update
CREATE TRIGGER trigger_normalize_city_name
  BEFORE INSERT OR UPDATE ON cities
  FOR EACH ROW
  EXECUTE FUNCTION normalize_city_name();

-- ============================================================================
-- 2. CREATE/UPDATE CITY_DISTANCES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS city_distances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_a text NOT NULL,
  city_b text NOT NULL,
  distance_km decimal(6, 2) NOT NULL CHECK (distance_km > 0),
  travel_time_minutes integer CHECK (travel_time_minutes > 0),
  highway_route text, -- e.g., "401", "QEW", "407"
  traffic_factor decimal(3, 2) DEFAULT 1.0, -- 1.0 = normal, 1.5 = heavy traffic
  is_toll_route boolean DEFAULT false,
  last_updated timestamptz DEFAULT now(),
  data_source text DEFAULT 'manual', -- 'google_maps', 'manual', 'calculated'
  created_at timestamptz DEFAULT now(),
  
  -- Ensure city_a is always alphabetically before city_b (prevents duplicates)
  CONSTRAINT city_order_check CHECK (city_a < city_b),
  CONSTRAINT unique_city_pair UNIQUE(city_a, city_b)
);

-- Indexes for fast distance lookups
CREATE INDEX IF NOT EXISTS idx_city_distances_lookup ON city_distances(city_a, city_b);
CREATE INDEX IF NOT EXISTS idx_city_distances_distance ON city_distances(distance_km);
CREATE INDEX IF NOT EXISTS idx_city_distances_travel_time ON city_distances(travel_time_minutes);

-- Function to get distance between any two cities (handles order automatically)
CREATE OR REPLACE FUNCTION get_city_distance(
  p_city_a text,
  p_city_b text
) RETURNS TABLE(
  distance_km decimal,
  travel_time_minutes integer,
  highway_route text
) AS $$
BEGIN
  -- Normalize city names
  p_city_a := lower(trim(p_city_a));
  p_city_b := lower(trim(p_city_b));
  
  -- Same city = 0 distance
  IF p_city_a = p_city_b THEN
    RETURN QUERY SELECT 0::decimal, 0::integer, NULL::text;
    RETURN;
  END IF;
  
  -- Ensure correct order (alphabetically)
  IF p_city_a > p_city_b THEN
    -- Swap if needed
    RETURN QUERY
    SELECT cd.distance_km, cd.travel_time_minutes, cd.highway_route
    FROM city_distances cd
    WHERE cd.city_a = p_city_b AND cd.city_b = p_city_a;
  ELSE
    RETURN QUERY
    SELECT cd.distance_km, cd.travel_time_minutes, cd.highway_route
    FROM city_distances cd
    WHERE cd.city_a = p_city_a AND cd.city_b = p_city_b;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 3. UPDATE BUYERS TABLE - ADD GEOGRAPHIC PREFERENCES
-- ============================================================================

-- Add new columns for geographic expansion
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS willing_to_travel_km integer DEFAULT 25 CHECK (willing_to_travel_km >= 0 AND willing_to_travel_km <= 500);
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS max_travel_time_minutes integer DEFAULT 45 CHECK (max_travel_time_minutes >= 0 AND max_travel_time_minutes <= 300);
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS avoid_toll_routes boolean DEFAULT false;
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS service_cities text[]; -- Manual override: specific cities they serve
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS accept_any_lead boolean DEFAULT false; -- Premium tier: accepts any lead
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS premium_tier boolean DEFAULT false; -- Premium buyer (higher pricing)
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS conversion_rate decimal(5, 2) DEFAULT 0.0 CHECK (conversion_rate >= 0 AND conversion_rate <= 100); -- % of leads that convert
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS avg_response_time_minutes integer DEFAULT 120; -- Average time to respond to leads
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS service_radius_updated_at timestamptz;
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS geographic_notes text; -- Internal notes about service area

-- Indexes for geographic queries
CREATE INDEX IF NOT EXISTS idx_buyers_travel_distance ON buyers(willing_to_travel_km) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_buyers_service_cities ON buyers USING GIN(service_cities) WHERE service_cities IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_buyers_premium ON buyers(premium_tier) WHERE premium_tier = true;
CREATE INDEX IF NOT EXISTS idx_buyers_accept_any ON buyers(accept_any_lead) WHERE accept_any_lead = true;
CREATE INDEX IF NOT EXISTS idx_buyers_conversion_rate ON buyers(conversion_rate DESC) WHERE status = 'active';

-- Set default values for existing buyers
UPDATE buyers 
SET 
  willing_to_travel_km = 25,
  max_travel_time_minutes = 45,
  avoid_toll_routes = false,
  conversion_rate = 0.0,
  avg_response_time_minutes = 120,
  service_radius_updated_at = now()
WHERE willing_to_travel_km IS NULL;

-- ============================================================================
-- 4. CREATE SERVICE_TYPE_ALIASES TABLE (for Tier 3 routing)
-- ============================================================================

CREATE TABLE IF NOT EXISTS service_type_aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_service text NOT NULL,
  alias text NOT NULL,
  match_score decimal(3, 2) DEFAULT 1.0 CHECK (match_score > 0 AND match_score <= 1.0),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(canonical_service, alias)
);

-- Indexes for service matching
CREATE INDEX IF NOT EXISTS idx_service_aliases_canonical ON service_type_aliases(canonical_service) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_service_aliases_alias ON service_type_aliases(alias) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_service_aliases_score ON service_type_aliases(match_score DESC);

-- ============================================================================
-- 5. CREATE LEAD_QUEUE TABLE (for Tier 5 - Lead Parking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS lead_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id) NOT NULL,
  status text DEFAULT 'parked' CHECK (status IN ('parked', 'processing', 'routed', 'failed')),
  tier_attempted integer DEFAULT 1 CHECK (tier_attempted >= 1 AND tier_attempted <= 6),
  retry_count integer DEFAULT 0,
  next_retry_at timestamptz DEFAULT now() + interval '1 day',
  routed_at timestamptz,
  failed_reason text,
  metadata jsonb, -- Store routing details, candidate buyers, etc.
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for queue processing
CREATE INDEX IF NOT EXISTS idx_lead_queue_retry ON lead_queue(next_retry_at, status) WHERE status = 'parked';
CREATE INDEX IF NOT EXISTS idx_lead_queue_status ON lead_queue(status);
CREATE INDEX IF NOT EXISTS idx_lead_queue_lead_id ON lead_queue(lead_id);

-- ============================================================================
-- 6. CREATE UNROUTABLE_LEADS TABLE (for Tier 6 - Admin Alerts)
-- ============================================================================

CREATE TABLE IF NOT EXISTS unroutable_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id) NOT NULL,
  city text NOT NULL,
  service_type text NOT NULL,
  reason text NOT NULL,
  suggested_actions text[], -- Array of suggestions
  admin_notified_at timestamptz,
  resolved boolean DEFAULT false,
  resolved_at timestamptz,
  resolved_by uuid, -- References auth.users
  resolution_notes text,
  created_at timestamptz DEFAULT now()
);

-- Indexes for admin review
CREATE INDEX IF NOT EXISTS idx_unroutable_city ON unroutable_leads(city) WHERE NOT resolved;
CREATE INDEX IF NOT EXISTS idx_unroutable_service ON unroutable_leads(service_type) WHERE NOT resolved;
CREATE INDEX IF NOT EXISTS idx_unroutable_resolved ON unroutable_leads(resolved);
CREATE INDEX IF NOT EXISTS idx_unroutable_created ON unroutable_leads(created_at DESC) WHERE NOT resolved;

-- ============================================================================
-- 7. CREATE ROUTING_AUDIT TABLE (for analytics and debugging)
-- ============================================================================

CREATE TABLE IF NOT EXISTS routing_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id) NOT NULL,
  tier_used integer NOT NULL CHECK (tier_used >= 1 AND tier_used <= 6),
  buyers_matched integer NOT NULL DEFAULT 0,
  buyers_selected integer NOT NULL DEFAULT 0,
  execution_time_ms integer,
  success boolean DEFAULT true,
  metadata jsonb, -- Full routing details, all candidates, reasons, etc.
  created_at timestamptz DEFAULT now()
);

-- Indexes for analytics
CREATE INDEX IF NOT EXISTS idx_routing_audit_lead ON routing_audit(lead_id);
CREATE INDEX IF NOT EXISTS idx_routing_audit_tier ON routing_audit(tier_used);
CREATE INDEX IF NOT EXISTS idx_routing_audit_success ON routing_audit(success);
CREATE INDEX IF NOT EXISTS idx_routing_audit_created ON routing_audit(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_routing_audit_metadata ON routing_audit USING GIN(metadata);

-- ============================================================================
-- 8. UPDATE LEADS TABLE - ADD ROUTING STATUS
-- ============================================================================

ALTER TABLE leads ADD COLUMN IF NOT EXISTS routing_tier integer CHECK (routing_tier >= 1 AND routing_tier <= 6);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS routing_attempts integer DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_routing_attempt timestamptz;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS routing_metadata jsonb;

-- Index for routing analytics
CREATE INDEX IF NOT EXISTS idx_leads_routing_tier ON leads(routing_tier);
CREATE INDEX IF NOT EXISTS idx_leads_routing_attempts ON leads(routing_attempts) WHERE routing_attempts > 0;

-- ============================================================================
-- 9. CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to calculate straight-line distance (Haversine formula)
-- Used as fallback when city_distances table doesn't have the pair
CREATE OR REPLACE FUNCTION calculate_haversine_distance(
  lat1 decimal,
  lon1 decimal,
  lat2 decimal,
  lon2 decimal
) RETURNS decimal AS $$
DECLARE
  R decimal := 6371; -- Earth radius in km
  dLat decimal;
  dLon decimal;
  a decimal;
  c decimal;
BEGIN
  dLat := radians(lat2 - lat1);
  dLon := radians(lon2 - lon1);
  
  a := sin(dLat/2) * sin(dLat/2) +
       cos(radians(lat1)) * cos(radians(lat2)) *
       sin(dLon/2) * sin(dLon/2);
  
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  
  RETURN ROUND((R * c)::numeric, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get all cities within radius of a given city
CREATE OR REPLACE FUNCTION get_cities_within_radius(
  p_city_name text,
  p_radius_km integer
) RETURNS TABLE(
  city_name text,
  distance_km decimal,
  travel_time_minutes integer,
  highway_route text
) AS $$
DECLARE
  v_city_normalized text;
BEGIN
  -- Normalize city name
  v_city_normalized := lower(trim(p_city_name));
  
  -- Return cities within radius
  RETURN QUERY
  SELECT 
    CASE 
      WHEN cd.city_a = v_city_normalized THEN cd.city_b
      ELSE cd.city_a
    END as city_name,
    cd.distance_km,
    cd.travel_time_minutes,
    cd.highway_route
  FROM city_distances cd
  WHERE (cd.city_a = v_city_normalized OR cd.city_b = v_city_normalized)
    AND cd.distance_km <= p_radius_km
  ORDER BY cd.distance_km ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to get buyers who can serve a specific city
CREATE OR REPLACE FUNCTION get_buyers_for_city(
  p_city_name text,
  p_service_type text DEFAULT NULL
) RETURNS TABLE(
  buyer_id uuid,
  business_name text,
  home_city text,
  distance_km decimal,
  travel_time_minutes integer,
  willing_to_travel_km integer,
  conversion_rate decimal
) AS $$
DECLARE
  v_city_normalized text;
BEGIN
  v_city_normalized := lower(trim(p_city_name));
  
  RETURN QUERY
  WITH buyer_distances AS (
    -- Get distance from each active buyer's city to the lead city
    SELECT 
      b.id,
      b.business_name,
      b.city as home_city,
      b.willing_to_travel_km,
      b.conversion_rate,
      COALESCE(
        (SELECT distance_km FROM get_city_distance(b.city, v_city_normalized) LIMIT 1),
        0
      ) as dist_km,
      COALESCE(
        (SELECT travel_time_minutes FROM get_city_distance(b.city, v_city_normalized) LIMIT 1),
        0
      ) as travel_mins
    FROM buyers b
    WHERE b.status = 'active'
      AND (p_service_type IS NULL OR b.services_csv ILIKE '%' || p_service_type || '%')
  )
  SELECT 
    bd.id,
    bd.business_name,
    bd.home_city,
    bd.dist_km,
    bd.travel_mins,
    bd.willing_to_travel_km,
    bd.conversion_rate
  FROM buyer_distances bd
  WHERE bd.dist_km <= bd.willing_to_travel_km
  ORDER BY bd.dist_km ASC, bd.conversion_rate DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 10. ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE cities IS 'All cities in Ontario with coordinates for distance calculations';
COMMENT ON TABLE city_distances IS 'Pre-calculated driving distances between Ontario cities';
COMMENT ON TABLE service_type_aliases IS 'Maps related services (e.g., HVAC -> Heating) for flexible routing';
COMMENT ON TABLE lead_queue IS 'Parked leads waiting for buyer capacity (Tier 5 routing)';
COMMENT ON TABLE unroutable_leads IS 'Leads that could not be routed, requiring admin intervention';
COMMENT ON TABLE routing_audit IS 'Complete history of all routing attempts for analytics';

COMMENT ON COLUMN buyers.willing_to_travel_km IS 'Maximum distance buyer will travel for a lead';
COMMENT ON COLUMN buyers.max_travel_time_minutes IS 'Maximum travel time buyer accepts';
COMMENT ON COLUMN buyers.accept_any_lead IS 'Premium buyer: accepts leads regardless of service/city match';
COMMENT ON COLUMN buyers.premium_tier IS 'Premium buyer: pays higher prices for guaranteed delivery';
COMMENT ON COLUMN buyers.conversion_rate IS 'Percentage of leads that convert to jobs (0-100)';
COMMENT ON COLUMN buyers.avg_response_time_minutes IS 'Average time to respond to lead notifications';

COMMENT ON FUNCTION get_city_distance IS 'Gets distance between two cities, handling order automatically';
COMMENT ON FUNCTION get_cities_within_radius IS 'Returns all cities within X km of a given city';
COMMENT ON FUNCTION get_buyers_for_city IS 'Returns buyers who can serve a specific city based on travel preferences';
COMMENT ON FUNCTION calculate_haversine_distance IS 'Calculates straight-line distance as fallback when city_distances unavailable';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Log migration
DO $$
BEGIN
  RAISE NOTICE 'Geographic Expansion Migration Complete';
  RAISE NOTICE 'Created tables: cities, service_type_aliases, lead_queue, unroutable_leads, routing_audit';
  RAISE NOTICE 'Updated table: buyers (added geographic preferences)';
  RAISE NOTICE 'Updated table: city_distances (added constraints and indexes)';
  RAISE NOTICE 'Updated table: leads (added routing status)';
  RAISE NOTICE 'Created functions: get_city_distance, get_cities_within_radius, get_buyers_for_city, calculate_haversine_distance';
  RAISE NOTICE 'Next step: Run 002_seed_ontario_cities.sql to populate cities and distances';
END $$;

