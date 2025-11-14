-- ============================================================================
-- COMPLETE INITIAL SCHEMA FOR ADS ROUTEHUB
-- ============================================================================
-- This migration creates the entire database from scratch including:
-- 1. Core tables (buyers, leads, deliveries, campaigns, refunds)
-- 2. Auth tables (buyer_users, user_roles)
-- 3. Geographic expansion tables (cities, city_distances)
-- 4. Routing tables (lead_queue, unroutable_leads, routing_audit)
-- 5. Helper functions
-- 6. Seed data (Ontario cities, distances, service aliases)
-- ============================================================================

-- ============================================================================
-- PART 1: CORE TABLES
-- ============================================================================

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  service_type text NOT NULL,
  city text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Buyers table
CREATE TABLE IF NOT EXISTS buyers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name text NOT NULL,
  contact_name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text NOT NULL,
  city text NOT NULL,
  service_types text[] NOT NULL DEFAULT '{}',
  daily_cap integer NOT NULL DEFAULT 10,
  max_budget numeric(10, 2) NOT NULL DEFAULT 1000.00,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  
  -- Geographic expansion fields
  willing_to_travel_km integer DEFAULT 25 CHECK (willing_to_travel_km >= 0 AND willing_to_travel_km <= 500),
  max_travel_time_minutes integer DEFAULT 45,
  avoid_toll_routes boolean DEFAULT false,
  service_cities text[] DEFAULT '{}', -- Manual override for specific cities
  
  -- Premium/routing fields
  accept_any_lead boolean DEFAULT false, -- Accept leads even over cap
  premium_tier boolean DEFAULT false, -- Priority routing
  conversion_rate decimal(5, 2) DEFAULT 0, -- 0-100%
  avg_response_time_minutes integer DEFAULT 60,
  
  -- Metadata
  service_radius_updated_at timestamptz,
  geographic_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Leads table
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  service_type text NOT NULL,
  city text NOT NULL,
  budget_raw text,
  notes text,
  campaign_id uuid REFERENCES campaigns(id) ON DELETE SET NULL,
  
  -- Routing metadata
  routing_tier integer CHECK (routing_tier BETWEEN 1 AND 6), -- Which tier routed this lead
  routing_attempts integer DEFAULT 0,
  last_routing_attempt timestamptz,
  routing_metadata jsonb, -- Full routing details
  
  created_at timestamptz DEFAULT now()
);

-- Deliveries table
CREATE TABLE IF NOT EXISTS deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES campaigns(id) ON DELETE SET NULL,
  charge_amount numeric(10, 2) NOT NULL,
  won boolean DEFAULT false,
  refunded boolean DEFAULT false,
  unlocked boolean DEFAULT false,
  exclusive boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Refund requests table
CREATE TABLE IF NOT EXISTS refund_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id uuid NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes text,
  handled_ts timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Buyer users (auth mapping)
CREATE TABLE IF NOT EXISTS buyer_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- User roles
CREATE TABLE IF NOT EXISTS user_roles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'buyer')),
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- PART 2: GEOGRAPHIC EXPANSION TABLES
-- ============================================================================

-- Cities table
CREATE TABLE IF NOT EXISTS cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  name_normalized text NOT NULL UNIQUE,
  province text NOT NULL DEFAULT 'Ontario',
  population integer,
  latitude decimal(10, 8) NOT NULL,
  longitude decimal(11, 8) NOT NULL,
  region text NOT NULL,
  is_major boolean DEFAULT false,
  timezone text DEFAULT 'America/Toronto',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- City distances
CREATE TABLE IF NOT EXISTS city_distances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_a text NOT NULL,
  city_b text NOT NULL,
  distance_km decimal(6, 2) NOT NULL,
  travel_time_minutes integer NOT NULL,
  highway_route text,
  traffic_factor decimal(3, 2) DEFAULT 1.0,
  is_toll_route boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT city_distances_order CHECK (city_a < city_b),
  CONSTRAINT city_distances_unique UNIQUE (city_a, city_b)
);

-- Service type aliases
CREATE TABLE IF NOT EXISTS service_type_aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_service text NOT NULL,
  alias_service text NOT NULL,
  similarity_score decimal(3, 2) NOT NULL DEFAULT 1.0 CHECK (similarity_score BETWEEN 0.5 AND 1.0),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT service_type_aliases_unique UNIQUE (primary_service, alias_service)
);

-- Lead queue (for parking leads)
CREATE TABLE IF NOT EXISTS lead_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  retry_count integer DEFAULT 0,
  last_retry_at timestamptz,
  next_retry_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'routed', 'failed')),
  failure_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Unroutable leads
CREATE TABLE IF NOT EXISTS unroutable_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  reason text NOT NULL,
  suggested_action text,
  admin_notified_at timestamptz,
  resolved_at timestamptz,
  resolution_notes text,
  created_at timestamptz DEFAULT now()
);

-- Routing audit (for analytics)
CREATE TABLE IF NOT EXISTS routing_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  tier_used integer NOT NULL CHECK (tier_used BETWEEN 1 AND 6),
  tier_name text NOT NULL,
  execution_time_ms integer,
  candidates_found integer,
  buyers_matched integer,
  success boolean NOT NULL,
  failure_reason text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- PART 3: INDEXES
-- ============================================================================

-- Core table indexes
CREATE INDEX IF NOT EXISTS idx_buyers_status ON buyers(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_buyers_city ON buyers(city);
CREATE INDEX IF NOT EXISTS idx_buyers_service_types ON buyers USING GIN(service_types);
CREATE INDEX IF NOT EXISTS idx_buyers_travel_km ON buyers(willing_to_travel_km);
CREATE INDEX IF NOT EXISTS idx_buyers_conversion ON buyers(conversion_rate DESC);
CREATE INDEX IF NOT EXISTS idx_buyers_service_cities ON buyers USING GIN(service_cities);

CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_city ON leads(city);
CREATE INDEX IF NOT EXISTS idx_leads_service_type ON leads(service_type);
CREATE INDEX IF NOT EXISTS idx_leads_routing_tier ON leads(routing_tier);
CREATE INDEX IF NOT EXISTS idx_leads_campaign ON leads(campaign_id);

CREATE INDEX IF NOT EXISTS idx_deliveries_buyer_created ON deliveries(buyer_id, created_at);
CREATE INDEX IF NOT EXISTS idx_deliveries_created ON deliveries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deliveries_won_refunded ON deliveries(won, refunded) WHERE won = true;
CREATE INDEX IF NOT EXISTS idx_deliveries_buyer ON deliveries(buyer_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_lead ON deliveries(lead_id);

CREATE INDEX IF NOT EXISTS idx_refund_requests_status ON refund_requests(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_refund_requests_buyer ON refund_requests(buyer_id);

-- Geographic table indexes
CREATE INDEX IF NOT EXISTS idx_cities_name_normalized ON cities(name_normalized);
CREATE INDEX IF NOT EXISTS idx_cities_region ON cities(region);
CREATE INDEX IF NOT EXISTS idx_cities_major ON cities(is_major) WHERE is_major = true;

CREATE INDEX IF NOT EXISTS idx_city_distances_cities ON city_distances(city_a, city_b);
CREATE INDEX IF NOT EXISTS idx_city_distances_distance ON city_distances(distance_km);

CREATE INDEX IF NOT EXISTS idx_service_aliases_primary ON service_type_aliases(primary_service);
CREATE INDEX IF NOT EXISTS idx_service_aliases_score ON service_type_aliases(similarity_score DESC);

CREATE INDEX IF NOT EXISTS idx_lead_queue_status ON lead_queue(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_lead_queue_next_retry ON lead_queue(next_retry_at);

CREATE INDEX IF NOT EXISTS idx_routing_audit_lead ON routing_audit(lead_id);
CREATE INDEX IF NOT EXISTS idx_routing_audit_tier ON routing_audit(tier_used);
CREATE INDEX IF NOT EXISTS idx_routing_audit_created ON routing_audit(created_at DESC);

-- ============================================================================
-- PART 4: HELPER FUNCTIONS
-- ============================================================================

-- Auto-normalize city names
CREATE OR REPLACE FUNCTION normalize_city_name()
RETURNS TRIGGER AS $$
BEGIN
  NEW.name_normalized := lower(trim(regexp_replace(NEW.name, '\s+', '', 'g')));
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_normalize_city_name
  BEFORE INSERT OR UPDATE ON cities
  FOR EACH ROW
  EXECUTE FUNCTION normalize_city_name();

-- Get distance between two cities
CREATE OR REPLACE FUNCTION get_city_distance(city_a_name text, city_b_name text)
RETURNS TABLE(distance_km decimal, travel_time_minutes integer, highway_route text) AS $$
BEGIN
  -- Normalize city names
  city_a_name := lower(trim(city_a_name));
  city_b_name := lower(trim(city_b_name));
  
  -- Return 0 if same city
  IF city_a_name = city_b_name THEN
    RETURN QUERY SELECT 0::decimal, 0::integer, ''::text;
    RETURN;
  END IF;
  
  -- Order cities alphabetically for lookup
  IF city_a_name > city_b_name THEN
    city_a_name := city_b_name;
    city_b_name := city_a_name;
  END IF;
  
  -- Look up distance
  RETURN QUERY
  SELECT cd.distance_km, cd.travel_time_minutes, cd.highway_route
  FROM city_distances cd
  WHERE lower(cd.city_a) = city_a_name AND lower(cd.city_b) = city_b_name;
END;
$$ LANGUAGE plpgsql;

-- Get cities within radius
CREATE OR REPLACE FUNCTION get_cities_within_radius(origin_city text, radius_km integer)
RETURNS TABLE(city_name text, distance_km decimal, travel_time_minutes integer, highway_route text) AS $$
DECLARE
  normalized_origin text;
BEGIN
  normalized_origin := lower(trim(origin_city));
  
  RETURN QUERY
  SELECT 
    CASE 
      WHEN lower(cd.city_a) = normalized_origin THEN cd.city_b
      ELSE cd.city_a
    END as city_name,
    cd.distance_km,
    cd.travel_time_minutes,
    cd.highway_route
  FROM city_distances cd
  WHERE 
    (lower(cd.city_a) = normalized_origin OR lower(cd.city_b) = normalized_origin)
    AND cd.distance_km <= radius_km
  ORDER BY cd.distance_km ASC;
END;
$$ LANGUAGE plpgsql;

-- Get buyers for a city (considering travel preferences)
CREATE OR REPLACE FUNCTION get_buyers_for_city(target_city text, service_type_filter text DEFAULT NULL)
RETURNS TABLE(
  buyer_id uuid,
  business_name text,
  home_city text,
  distance_km decimal,
  conversion_rate decimal,
  avg_response_time_minutes integer
) AS $$
DECLARE
  normalized_city text;
BEGIN
  normalized_city := lower(trim(target_city));
  
  RETURN QUERY
  WITH city_pairs AS (
    -- Get all cities and distances
    SELECT 
      CASE 
        WHEN lower(cd.city_a) = normalized_city THEN cd.city_b
        ELSE cd.city_a
      END as buyer_city,
      cd.distance_km
    FROM city_distances cd
    WHERE lower(cd.city_a) = normalized_city OR lower(cd.city_b) = normalized_city
    
    UNION ALL
    
    -- Include same city (0 distance)
    SELECT normalized_city as buyer_city, 0::decimal as distance_km
  )
  SELECT 
    b.id as buyer_id,
    b.business_name,
    b.city as home_city,
    COALESCE(cp.distance_km, 0) as distance_km,
    b.conversion_rate,
    b.avg_response_time_minutes
  FROM buyers b
  LEFT JOIN city_pairs cp ON lower(b.city) = cp.buyer_city
  WHERE 
    b.status = 'active'
    AND (cp.distance_km IS NULL OR cp.distance_km <= b.willing_to_travel_km)
    AND (service_type_filter IS NULL OR service_type_filter = ANY(b.service_types))
  ORDER BY 
    cp.distance_km ASC,
    b.conversion_rate DESC,
    b.avg_response_time_minutes ASC;
END;
$$ LANGUAGE plpgsql;

-- Haversine distance calculation (fallback)
CREATE OR REPLACE FUNCTION calculate_haversine_distance(
  lat1 decimal, lon1 decimal, lat2 decimal, lon2 decimal
)
RETURNS decimal AS $$
DECLARE
  earth_radius constant decimal := 6371; -- km
  dlat decimal;
  dlon decimal;
  a decimal;
  c decimal;
BEGIN
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);
  
  a := sin(dlat/2) * sin(dlat/2) + 
       cos(radians(lat1)) * cos(radians(lat2)) * 
       sin(dlon/2) * sin(dlon/2);
  
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  
  RETURN earth_radius * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- SCHEMA SETUP COMPLETE
-- ============================================================================
-- Next: Run seed data migration (002_seed_ontario_cities.sql)
-- ============================================================================

