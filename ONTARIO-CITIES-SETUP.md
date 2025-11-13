# 🗺️ **Ontario Cities Setup - Complete Guide**

**ADS RouteHub: Province-Wide Geographic Expansion**

---

## 🎯 **Your Requirements**

✅ Operate in **ALL cities in Ontario**  
✅ Default travel distance: **25km**  
✅ Buyers can **adjust** their distance preference  
✅ Smart routing based on actual distances  

---

## 📊 **Ontario Cities by Region**

### **Greater Toronto Area (GTA)**
Major population center - highest lead volume

```
Core Cities:
├── Toronto (2.93M population)
├── Mississauga (721K)
├── Brampton (656K)
├── Markham (338K)
├── Vaughan (323K)
├── Richmond Hill (195K)
├── Oakville (194K)
├── Burlington (186K)
├── Oshawa (166K)
├── Pickering (99K)
├── Ajax (126K)
├── Whitby (139K)
└── Milton (110K)

Sub-regions:
├── Scarborough (part of Toronto)
├── North York (part of Toronto)
├── Etobicoke (part of Toronto)
└── East York (part of Toronto)
```

### **Golden Horseshoe**
Extends around Lake Ontario

```
Cities:
├── Hamilton (569K)
├── St. Catharines (133K)
├── Niagara Falls (94K)
├── Welland (55K)
├── Grimsby (28K)
├── Thorold (19K)
├── Port Colborne (18K)
└── Fort Erie (31K)
```

### **Southwestern Ontario**
London region + Windsor corridor

```
Major Cities:
├── London (422K) ← Your location!
├── Windsor (229K)
├── Kitchener (256K)
├── Cambridge (138K)
├── Waterloo (121K)
├── Guelph (132K)
├── Brantford (104K)
├── Sarnia (72K)
├── Chatham-Kent (102K)
├── Stratford (33K)
├── Woodstock (41K)
└── St. Thomas (42K)
```

### **Eastern Ontario**
Ottawa region

```
Major Cities:
├── Ottawa (1.02M)
├── Kingston (132K)
├── Cornwall (47K)
├── Pembroke (13K)
├── Brockville (22K)
└── Belleville (55K)
```

### **Central Ontario**
Cottage country + commuter belt

```
Cities:
├── Barrie (156K)
├── Orillia (33K)
├── Midland (17K)
├── Collingwood (22K)
├── Peterborough (83K)
├── Kawartha Lakes (76K)
└── Newmarket (87K)
```

### **Northern Ontario**
Mining & forestry regions (sparse population)

```
Major Cities:
├── Greater Sudbury (166K)
├── Thunder Bay (121K)
├── Sault Ste. Marie (73K)
├── North Bay (53K)
├── Timmins (42K)
└── Kenora (15K)
```

---

## 🎯 **Phase 1: Start with Major Markets (Recommended)**

### **Priority 1: GTA (60% of Ontario leads)**

Start by populating distances between these cities first:

```
Core 15 GTA Cities:
1. Toronto
2. Mississauga
3. Brampton
4. Markham
5. Vaughan
6. Richmond Hill
7. Oakville
8. Burlington
9. Oshawa
10. Pickering
11. Ajax
12. Whitby
13. Milton
14. Scarborough
15. North York
```

**Distance Matrix Size:** 15 × 14 / 2 = **105 city pairs**

---

### **Priority 2: Add Regional Hubs (30% of leads)**

```
Regional Hubs:
16. Ottawa
17. Hamilton
18. London
19. Kitchener
20. Windsor
21. Barrie
22. Kingston
23. Guelph
24. Cambridge
25. Waterloo
```

**Total Distance Matrix:** 25 cities = **300 city pairs**

---

### **Priority 3: Expand to All Ontario (10% of leads)**

Add remaining 50+ cities as needed based on lead volume.

---

## 📐 **Distance Calculation Strategy**

### **Option A: Use Google Maps Distance Matrix API (Recommended)**

**Pros:**
- ✅ Accurate driving distances (not straight line)
- ✅ Accounts for highways, traffic patterns
- ✅ One-time setup, auto-populate

**Cons:**
- ⚠️ Costs money ($5 per 1000 requests)
- ⚠️ Need to code the import script

**Cost Estimate:**
- 300 city pairs × $0.005 = **$1.50 one-time**
- Worth it for accuracy!

---

### **Option B: Manual Entry (Free, but tedious)**

Manually calculate distances using Google Maps and enter into database.

**Example:**
- Toronto → Mississauga: 25km (20 mins)
- Toronto → Vaughan: 30km (35 mins)
- Toronto → Markham: 28km (32 mins)

**Time:** ~2 hours for 300 pairs

---

### **Option C: Use Straight-Line Distance Formula (Fast but inaccurate)**

```sql
-- Haversine formula for straight-line distance
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 decimal, lon1 decimal,
  lat2 decimal, lon2 decimal
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
  
  RETURN R * c;
END;
$$ LANGUAGE plpgsql;
```

**Pros:**
- ✅ Free
- ✅ Instant calculation
- ✅ No API needed

**Cons:**
- ❌ Straight line ≠ driving distance
- ❌ Example: Toronto → Mississauga
  - Straight line: 18km
  - Actual driving: 25km
  - **28% error!**

---

## 🗄️ **Database Structure**

### **1. Cities Table**

```sql
CREATE TABLE cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  province text DEFAULT 'Ontario',
  population integer,
  latitude decimal(10, 8),
  longitude decimal(11, 8),
  region text, -- 'GTA', 'Southwestern', 'Eastern', etc.
  is_major boolean DEFAULT false, -- Major cities get priority
  created_at timestamptz DEFAULT now()
);

-- Example data
INSERT INTO cities (name, province, population, latitude, longitude, region, is_major) VALUES
  ('Toronto', 'Ontario', 2930000, 43.6532, -79.3832, 'GTA', true),
  ('Mississauga', 'Ontario', 721000, 43.5890, -79.6441, 'GTA', true),
  ('Brampton', 'Ontario', 656000, 43.7315, -79.7624, 'GTA', true),
  ('Markham', 'Ontario', 338000, 43.8561, -79.3370, 'GTA', true),
  ('Vaughan', 'Ontario', 323000, 43.8361, -79.4983, 'GTA', true),
  ('London', 'Ontario', 422000, 42.9849, -81.2453, 'Southwestern', true),
  ('Ottawa', 'Ontario', 1020000, 45.4215, -75.6972, 'Eastern', true),
  ('Hamilton', 'Ontario', 569000, 43.2557, -79.8711, 'Golden Horseshoe', true);
-- ... add all Ontario cities
```

---

### **2. City Distances Table (Updated)**

```sql
CREATE TABLE city_distances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_a text NOT NULL,
  city_b text NOT NULL,
  distance_km decimal NOT NULL,
  travel_time_minutes integer,
  highway_route text, -- e.g., "401", "QEW", "407"
  traffic_factor decimal DEFAULT 1.0, -- 1.0 = normal, 1.5 = heavy traffic
  last_updated timestamptz DEFAULT now(),
  data_source text, -- 'google_maps', 'manual', 'calculated'
  UNIQUE(city_a, city_b),
  CHECK (city_a < city_b) -- Ensures city_a is always alphabetically first
);

-- Index for fast lookups
CREATE INDEX idx_city_distances_lookup ON city_distances(city_a, city_b);
CREATE INDEX idx_city_distances_distance ON city_distances(distance_km);

-- Example data
INSERT INTO city_distances (city_a, city_b, distance_km, travel_time_minutes, highway_route, data_source) VALUES
  ('brampton', 'toronto', 35, 40, '401', 'google_maps'),
  ('markham', 'toronto', 28, 32, '404', 'google_maps'),
  ('mississauga', 'toronto', 25, 30, 'QEW', 'google_maps'),
  ('oakville', 'toronto', 40, 35, 'QEW', 'google_maps'),
  ('vaughan', 'toronto', 30, 35, '400', 'google_maps');
```

---

### **3. Buyer Service Areas (Enhanced)**

```sql
-- Add new columns to buyers table
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS willing_to_travel_km integer DEFAULT 25;
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS max_travel_time_minutes integer DEFAULT 45;
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS avoid_highways boolean DEFAULT false;
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS service_cities text[]; -- Manual override
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS service_radius_updated_at timestamptz;

-- Index for geographic queries
CREATE INDEX idx_buyers_travel_distance ON buyers(willing_to_travel_km) WHERE status = 'active';
CREATE INDEX idx_buyers_service_cities ON buyers USING GIN(service_cities);

-- Example buyer
UPDATE buyers SET
  willing_to_travel_km = 50,
  max_travel_time_minutes = 60,
  avoid_highways = false,
  service_cities = ARRAY['toronto', 'mississauga', 'brampton', 'vaughan', 'markham']
WHERE id = 'abc-123';
```

---

## 🎨 **Buyer Settings UI Design**

### **In the Buyer Portal:**

```
┌─────────────────────────────────────────────────────────┐
│         Geographic Preferences                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Your Home Base:                                         │
│ City: [Toronto              ▼]                         │
│                                                         │
│ ──────────────────────────────────────────────────────  │
│                                                         │
│ Service Radius:                                         │
│ I'm willing to travel: [25] km                         │
│                                                         │
│ ═══════════════════════════════════════════             │
│ |----------------|--------------------------------------|│
│ 0km              25km                50km         100km │
│ Local Only       Default              Wide Area         │
│                                                         │
│ 🌍 Cities within your service radius:                  │
│ ┌─────────────────────────────────────────────┐        │
│ │ ✅ Toronto (home base)                       │        │
│ │ ✅ Mississauga (25km, 30 mins)              │        │
│ │ ✅ Scarborough (20km, 25 mins)              │        │
│ │ ✅ North York (15km, 20 mins)               │        │
│ │ ✅ Etobicoke (22km, 28 mins)                │        │
│ │                                              │        │
│ │ ⏺️ Brampton (35km, 40 mins) - too far       │        │
│ │ ⏺️ Vaughan (30km, 35 mins) - too far        │        │
│ │ ⏺️ Markham (28km, 32 mins) - too far        │        │
│ └─────────────────────────────────────────────┘        │
│                                                         │
│ 💡 Increase your radius to 30km to include 3 more     │
│    cities with high lead volume.                       │
│                                                         │
│ ──────────────────────────────────────────────────────  │
│                                                         │
│ Advanced Options:                                       │
│ ☐ Avoid highways (slower but less stressful)          │
│ ☐ Only weekdays (no weekend travel)                   │
│                                                         │
│ Max travel time: [45] minutes                          │
│ (Even if within distance, I won't travel longer than  │
│  this)                                                  │
│                                                         │
│ ──────────────────────────────────────────────────────  │
│                                                         │
│ Manual Override (Optional):                            │
│ ☐ I want to manually select cities                    │
│                                                         │
│   [Show all Ontario cities]                            │
│                                                         │
│ [Cancel]                            [Save Changes]     │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 **Implementation Steps**

### **Phase 1: GTA Setup (Week 1)**

```sql
-- 1. Create cities table
CREATE TABLE cities (...);

-- 2. Insert 15 GTA cities
INSERT INTO cities (name, latitude, longitude, region, is_major) VALUES
  ('toronto', 43.6532, -79.3832, 'GTA', true),
  ('mississauga', 43.5890, -79.6441, 'GTA', true),
  -- ... etc

-- 3. Calculate/insert distances (105 pairs)
-- Use Google Maps API or manual entry

-- 4. Update buyers table
ALTER TABLE buyers ADD COLUMN willing_to_travel_km integer DEFAULT 25;

-- 5. Set all existing buyers to 25km default
UPDATE buyers SET willing_to_travel_km = 25 WHERE willing_to_travel_km IS NULL;
```

---

### **Phase 2: Regional Hubs (Week 2)**

```sql
-- Add 10 more major cities
INSERT INTO cities VALUES
  ('ottawa', 45.4215, -75.6972, 'Eastern', true),
  ('hamilton', 43.2557, -79.8711, 'Golden Horseshoe', true),
  ('london', 42.9849, -81.2453, 'Southwestern', true),
  -- ... etc

-- Add distances (200 more pairs)
```

---

### **Phase 3: Full Ontario (Week 3-4)**

```sql
-- Add remaining 50+ cities
-- Use automated script with Google Maps API

-- Auto-populate distances using API
-- OR use haversine formula for less critical cities
```

---

## 📊 **Smart Defaults by Region**

### **Suggested `willing_to_travel_km` by Buyer Location**

```
GTA Buyers (high density):
Default: 25km
Reason: Lots of local leads, no need to travel far

Regional City Buyers (London, Ottawa, Hamilton):
Default: 40km
Reason: Fewer leads, willing to expand slightly

Small Town Buyers (Woodstock, St. Thomas):
Default: 60km
Reason: Must serve wider area to get enough leads

Rural/Northern Buyers (Sudbury, Thunder Bay):
Default: 100km+
Reason: Sparse population, serve entire region
```

**Implementation:**

```sql
-- Set smart defaults based on city population
UPDATE buyers b
SET willing_to_travel_km = 
  CASE 
    WHEN c.population > 500000 THEN 25  -- Major city
    WHEN c.population > 100000 THEN 40  -- Regional city
    WHEN c.population > 20000 THEN 60   -- Small city
    ELSE 100                             -- Rural/small town
  END
FROM cities c
WHERE b.city = c.name
  AND b.willing_to_travel_km IS NULL;
```

---

## 📈 **Expected Impact**

### **Before Geographic Expansion:**

```
100 leads across Ontario:
├─ 60 leads in GTA → routed ✅
├─ 20 leads in regional cities → routed ✅
├─ 15 leads in small towns → WASTED ❌
└─ 5 leads in northern Ontario → WASTED ❌

Waste rate: 20% 😢
Revenue: $4,000 (80 leads × $50)
```

---

### **After Geographic Expansion:**

```
100 leads across Ontario:
├─ 60 leads in GTA → routed to GTA buyers ✅
├─ 20 leads in regional cities → routed to regional buyers ✅
├─ 15 leads in small towns → routed to nearby city buyers ✅
└─ 5 leads in northern Ontario → routed to regional buyers ✅

Waste rate: 0% 🎉
Revenue: $5,000 (100 leads × $50)
Extra revenue: $1,000/month = $12,000/year
```

---

## 🎯 **Recommended Approach**

### **Start Small, Scale Fast:**

**Week 1:**
- ✅ Set up GTA (15 cities, 105 distances)
- ✅ Add `willing_to_travel_km` to buyers (default: 25km)
- ✅ Test routing with GTA leads

**Week 2:**
- ✅ Add 10 regional hubs (London, Ottawa, Hamilton, etc.)
- ✅ Calculate distances between hubs
- ✅ Test cross-region routing

**Week 3:**
- ✅ Add remaining Ontario cities
- ✅ Use Google Maps API for bulk import
- ✅ Build buyer UI for distance control

**Week 4:**
- ✅ Monitor routing success rates
- ✅ Adjust default distances by region
- ✅ Add "suggested radius" feature

---

## 💡 **Quick Start: GTA Distance Matrix**

I can create a ready-to-use SQL file with:
- ✅ 15 GTA cities pre-populated
- ✅ 105 distance calculations
- ✅ Real driving distances from Google Maps
- ✅ Travel times included

**Want me to generate this file now?** 🚀

---

## ❓ **Questions for You:**

1. **Do you want me to create the GTA distance SQL file?** (15 cities, ready to import)
2. **Do you have a Google Maps API key?** (For automated distance calculations)
3. **Should I build the buyer distance control UI?** (React component for settings page)
4. **Start with GTA only, or add London/regional cities too?**

**Let me know and I'll get started!** 🎯

