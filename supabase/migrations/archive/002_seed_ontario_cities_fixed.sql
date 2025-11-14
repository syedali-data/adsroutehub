-- ============================================================================
-- Seed Data: Ontario Cities & Distances (FIXED VERSION)
-- Description: Populates cities and city_distances with Ontario data
-- Version: 1.1
-- Date: 2024-11-13
-- ============================================================================

-- ============================================================================
-- 1. INSERT ONTARIO CITIES (75 cities)
-- ============================================================================

-- Greater Toronto Area (GTA) - 15 major cities
INSERT INTO cities (name, province, population, latitude, longitude, region, is_major) VALUES
  ('Toronto', 'Ontario', 2930000, 43.6532, -79.3832, 'GTA', true),
  ('Mississauga', 'Ontario', 721000, 43.5890, -79.6441, 'GTA', true),
  ('Brampton', 'Ontario', 656000, 43.7315, -79.7624, 'GTA', true),
  ('Markham', 'Ontario', 338000, 43.8561, -79.3370, 'GTA', true),
  ('Vaughan', 'Ontario', 323000, 43.8361, -79.4983, 'GTA', true),
  ('Richmond Hill', 'Ontario', 195000, 43.8828, -79.4403, 'GTA', true),
  ('Oakville', 'Ontario', 194000, 43.4675, -79.6877, 'GTA', true),
  ('Burlington', 'Ontario', 186000, 43.3255, -79.7990, 'GTA', true),
  ('Oshawa', 'Ontario', 166000, 43.8971, -78.8658, 'GTA', true),
  ('Pickering', 'Ontario', 99000, 43.8384, -79.0868, 'GTA', false),
  ('Ajax', 'Ontario', 126000, 43.8509, -79.0204, 'GTA', true),
  ('Whitby', 'Ontario', 139000, 43.8975, -78.9429, 'GTA', true),
  ('Milton', 'Ontario', 110000, 43.5183, -79.8774, 'GTA', true),
  ('Newmarket', 'Ontario', 87000, 44.0592, -79.4613, 'GTA', false),
  ('Aurora', 'Ontario', 62000, 44.0065, -79.4504, 'GTA', false)
ON CONFLICT (name) DO NOTHING;

-- Golden Horseshoe - Hamilton & Niagara Region
INSERT INTO cities (name, province, population, latitude, longitude, region, is_major) VALUES
  ('Hamilton', 'Ontario', 569000, 43.2557, -79.8711, 'Golden Horseshoe', true),
  ('St. Catharines', 'Ontario', 133000, 43.1594, -79.2469, 'Golden Horseshoe', true),
  ('Niagara Falls', 'Ontario', 94000, 43.0896, -79.0849, 'Golden Horseshoe', false),
  ('Welland', 'Ontario', 55000, 42.9924, -79.2484, 'Golden Horseshoe', false),
  ('Grimsby', 'Ontario', 28000, 43.1948, -79.5565, 'Golden Horseshoe', false),
  ('Fort Erie', 'Ontario', 31000, 42.9086, -78.9331, 'Golden Horseshoe', false)
ON CONFLICT (name) DO NOTHING;

-- Southwestern Ontario - London Region & Windsor Corridor
INSERT INTO cities (name, province, population, latitude, longitude, region, is_major) VALUES
  ('London', 'Ontario', 422000, 42.9849, -81.2453, 'Southwestern', true),
  ('Windsor', 'Ontario', 229000, 42.3149, -83.0364, 'Southwestern', true),
  ('Kitchener', 'Ontario', 256000, 43.4516, -80.4925, 'Southwestern', true),
  ('Cambridge', 'Ontario', 138000, 43.3616, -80.3144, 'Southwestern', true),
  ('Waterloo', 'Ontario', 121000, 43.4643, -80.5204, 'Southwestern', true),
  ('Guelph', 'Ontario', 132000, 43.5448, -80.2482, 'Southwestern', true),
  ('Brantford', 'Ontario', 104000, 43.1394, -80.2644, 'Southwestern', true),
  ('Sarnia', 'Ontario', 72000, 42.9746, -82.4066, 'Southwestern', false),
  ('Chatham', 'Ontario', 45000, 42.4048, -82.1910, 'Southwestern', false),
  ('Stratford', 'Ontario', 33000, 43.3701, -80.9822, 'Southwestern', false),
  ('Woodstock', 'Ontario', 41000, 43.1315, -80.7467, 'Southwestern', false),
  ('St. Thomas', 'Ontario', 42000, 42.7782, -81.1754, 'Southwestern', false),
  ('Leamington', 'Ontario', 28000, 42.0532, -82.5998, 'Southwestern', false),
  ('Tillsonburg', 'Ontario', 16000, 42.8631, -80.7295, 'Southwestern', false)
ON CONFLICT (name) DO NOTHING;

-- Eastern Ontario - Ottawa Region
INSERT INTO cities (name, province, population, latitude, longitude, region, is_major) VALUES
  ('Ottawa', 'Ontario', 1020000, 45.4215, -75.6972, 'Eastern', true),
  ('Kingston', 'Ontario', 132000, 44.2312, -76.4860, 'Eastern', true),
  ('Cornwall', 'Ontario', 47000, 45.0275, -74.7400, 'Eastern', false),
  ('Pembroke', 'Ontario', 13000, 45.8269, -77.1100, 'Eastern', false),
  ('Brockville', 'Ontario', 22000, 44.5895, -75.6838, 'Eastern', false),
  ('Belleville', 'Ontario', 55000, 44.1628, -77.3832, 'Eastern', false),
  ('Smiths Falls', 'Ontario', 9000, 44.9048, -76.0234, 'Eastern', false)
ON CONFLICT (name) DO NOTHING;

-- Central Ontario - Barrie & Simcoe County
INSERT INTO cities (name, province, population, latitude, longitude, region, is_major) VALUES
  ('Barrie', 'Ontario', 156000, 44.3894, -79.6903, 'Central', true),
  ('Orillia', 'Ontario', 33000, 44.6084, -79.4199, 'Central', false),
  ('Midland', 'Ontario', 17000, 44.7494, -79.8858, 'Central', false),
  ('Collingwood', 'Ontario', 22000, 44.5008, -80.2167, 'Central', false),
  ('Peterborough', 'Ontario', 83000, 44.3048, -78.3199, 'Central', false),
  ('Lindsay', 'Ontario', 21000, 44.3501, -78.7362, 'Central', false),
  ('Cobourg', 'Ontario', 19000, 43.9596, -78.1675, 'Central', false)
ON CONFLICT (name) DO NOTHING;

-- Northern Ontario - Mining & Forestry Regions
INSERT INTO cities (name, province, population, latitude, longitude, region, is_major) VALUES
  ('Sudbury', 'Ontario', 166000, 46.4917, -80.9930, 'Northern', true),
  ('Thunder Bay', 'Ontario', 121000, 48.3809, -89.2477, 'Northern', true),
  ('Sault Ste. Marie', 'Ontario', 73000, 46.5333, -84.3497, 'Northern', false),
  ('North Bay', 'Ontario', 53000, 46.3091, -79.4608, 'Northern', false),
  ('Timmins', 'Ontario', 42000, 48.4758, -81.3304, 'Northern', false),
  ('Kenora', 'Ontario', 15000, 49.7669, -94.4894, 'Northern', false)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 2. INSERT GTA CITY DISTANCES
-- ============================================================================

INSERT INTO city_distances (city_a, city_b, distance_km, travel_time_minutes, highway_route) VALUES
  -- Toronto connections
  ('ajax', 'toronto', 35, 30, '401'),
  ('aurora', 'toronto', 50, 45, '404'),
  ('brampton', 'toronto', 35, 40, '401/427'),
  ('burlington', 'toronto', 50, 45, 'QEW'),
  ('markham', 'toronto', 28, 32, '404'),
  ('milton', 'toronto', 55, 50, '401'),
  ('mississauga', 'toronto', 25, 30, '427/QEW'),
  ('newmarket', 'toronto', 55, 50, '404'),
  ('oakville', 'toronto', 40, 35, 'QEW'),
  ('oshawa', 'toronto', 60, 55, '401'),
  ('pickering', 'toronto', 38, 35, '401'),
  ('richmond hill', 'toronto', 30, 35, '404'),
  ('toronto', 'vaughan', 30, 35, '400/407'),
  ('toronto', 'whitby', 55, 50, '401'),
  
  -- Mississauga connections
  ('brampton', 'mississauga', 18, 22, 'local'),
  ('burlington', 'mississauga', 28, 25, 'QEW'),
  ('milton', 'mississauga', 32, 28, '401'),
  ('mississauga', 'oakville', 18, 20, 'QEW'),
  ('mississauga', 'vaughan', 35, 38, '427/407'),
  
  -- Brampton connections
  ('brampton', 'milton', 40, 35, '401'),
  ('brampton', 'vaughan', 22, 25, '427/407'),
  
  -- Markham connections
  ('ajax', 'markham', 20, 22, 'local'),
  ('markham', 'pickering', 15, 18, 'local'),
  ('markham', 'richmond hill', 12, 15, '404'),
  ('markham', 'vaughan', 25, 28, '407'),
  ('markham', 'whitby', 35, 32, '401/407'),
  
  -- Richmond Hill connections
  ('aurora', 'richmond hill', 18, 20, '404'),
  ('newmarket', 'richmond hill', 25, 25, '404'),
  ('richmond hill', 'vaughan', 15, 18, '407'),
  
  -- Ajax/Pickering/Whitby/Oshawa (Durham Region)
  ('ajax', 'pickering', 8, 10, 'local'),
  ('ajax', 'whitby', 12, 15, '401'),
  ('ajax', 'oshawa', 20, 22, '401'),
  ('oshawa', 'pickering', 28, 28, '401'),
  ('oshawa', 'whitby', 10, 12, '401'),
  ('pickering', 'whitby', 15, 18, '401'),
  
  -- Burlington/Oakville
  ('burlington', 'oakville', 12, 15, 'QEW'),
  ('burlington', 'milton', 25, 25, '407'),
  
  -- Milton connections
  ('milton', 'oakville', 25, 22, '407'),
  
  -- Aurora/Newmarket
  ('aurora', 'newmarket', 10, 12, 'local'),
  ('aurora', 'vaughan', 32, 30, '404'),
  ('newmarket', 'vaughan', 35, 32, '404')
ON CONFLICT (city_a, city_b) DO NOTHING;

-- ============================================================================
-- 3. INSERT REGIONAL HUB DISTANCES
-- ============================================================================

INSERT INTO city_distances (city_a, city_b, distance_km, travel_time_minutes, highway_route) VALUES
  -- GTA to Golden Horseshoe
  ('hamilton', 'toronto', 68, 55, 'QEW'),
  ('hamilton', 'mississauga', 45, 40, 'QEW'),
  ('burlington', 'hamilton', 15, 18, 'QEW'),
  ('hamilton', 'oakville', 30, 28, 'QEW'),
  ('grimsby', 'hamilton', 28, 25, 'QEW'),
  ('niagara falls', 'st. catharines', 18, 20, 'QEW'),
  ('hamilton', 'st. catharines', 50, 45, 'QEW'),
  ('st. catharines', 'toronto', 120, 85, 'QEW'),
  
  -- Southwestern Ontario
  ('cambridge', 'kitchener', 15, 18, 'local'),
  ('cambridge', 'waterloo', 18, 20, 'local'),
  ('guelph', 'kitchener', 28, 25, '401'),
  ('guelph', 'waterloo', 32, 30, '401'),
  ('guelph', 'toronto', 95, 75, '401'),
  ('kitchener', 'london', 115, 85, '401'),
  ('kitchener', 'toronto', 110, 80, '401'),
  ('kitchener', 'waterloo', 10, 15, 'local'),
  ('london', 'st. thomas', 32, 28, '401'),
  ('london', 'stratford', 60, 50, '401'),
  ('london', 'toronto', 200, 135, '401'),
  ('london', 'windsor', 195, 130, '401'),
  ('london', 'woodstock', 50, 40, '401'),
  ('sarnia', 'windsor', 105, 80, '401'),
  ('leamington', 'windsor', 50, 45, '401'),
  ('brantford', 'woodstock', 55, 45, '403'),
  
  -- Central Ontario
  ('barrie', 'newmarket', 45, 40, '404'),
  ('barrie', 'orillia', 40, 35, 'local'),
  ('barrie', 'toronto', 105, 75, '400'),
  ('barrie', 'collingwood', 45, 40, 'local'),
  ('barrie', 'midland', 42, 38, 'local'),
  ('midland', 'orillia', 35, 30, 'local'),
  ('cobourg', 'peterborough', 48, 45, '401'),
  ('peterborough', 'toronto', 140, 105, '115/401'),
  
  -- Eastern Ontario
  ('belleville', 'kingston', 85, 70, '401'),
  ('belleville', 'ottawa', 220, 150, '401/416'),
  ('belleville', 'peterborough', 100, 80, '401'),
  ('brockville', 'kingston', 80, 65, '401'),
  ('brockville', 'ottawa', 95, 75, '401/416'),
  ('cornwall', 'ottawa', 110, 80, '417'),
  ('kingston', 'ottawa', 195, 135, '401/416'),
  ('kingston', 'toronto', 265, 175, '401'),
  ('ottawa', 'toronto', 450, 280, '401/416'),
  
  -- Northern Ontario (major connections only)
  ('north bay', 'sudbury', 130, 105, '17'),
  ('north bay', 'toronto', 355, 240, '11/400'),
  ('sault ste. marie', 'sudbury', 300, 210, '17'),
  ('sudbury', 'toronto', 400, 270, '69/400'),
  ('sault ste. marie', 'thunder bay', 700, 480, '17')
ON CONFLICT (city_a, city_b) DO NOTHING;

-- ============================================================================
-- 4. INSERT SERVICE TYPE ALIASES (Common Services in Ontario)
-- ============================================================================

INSERT INTO service_type_aliases (primary_service, alias_service, similarity_score) VALUES
  -- HVAC Services
  ('hvac', 'heating', 0.90),
  ('hvac', 'cooling', 0.90),
  ('hvac', 'air conditioning', 0.90),
  ('hvac', 'ac repair', 0.90),
  ('hvac', 'furnace', 0.85),
  ('hvac', 'furnace repair', 0.85),
  ('hvac', 'furnace installation', 0.85),
  ('hvac', 'heat pump', 0.80),
  ('hvac', 'central air', 0.85),
  ('hvac', 'ductwork', 0.75),
  
  -- Plumbing Services
  ('plumbing', 'drain cleaning', 0.90),
  ('plumbing', 'drain service', 0.90),
  ('plumbing', 'water heater', 0.85),
  ('plumbing', 'hot water heater', 0.85),
  ('plumbing', 'sewer', 0.85),
  ('plumbing', 'toilet repair', 0.90),
  ('plumbing', 'leak repair', 0.90),
  ('plumbing', 'pipe repair', 0.90),
  ('plumbing', 'faucet repair', 0.85),
  ('plumbing', 'sink repair', 0.85),
  
  -- Roofing Services
  ('roofing', 'roof repair', 1.00),
  ('roofing', 'roof replacement', 1.00),
  ('roofing', 'roof installation', 1.00),
  ('roofing', 'shingles', 0.95),
  ('roofing', 'shingle repair', 0.95),
  ('roofing', 'flat roof', 0.90),
  ('roofing', 'metal roof', 0.90),
  ('roofing', 'roof leak', 0.95),
  ('roofing', 'gutter', 0.70),
  ('roofing', 'gutter cleaning', 0.70),
  
  -- Electrical Services
  ('electrical', 'electrician', 1.00),
  ('electrical', 'wiring', 0.95),
  ('electrical', 'panel upgrade', 0.95),
  ('electrical', 'circuit breaker', 0.90),
  ('electrical', 'outlet repair', 0.90),
  ('electrical', 'lighting', 0.85),
  ('electrical', 'generator', 0.80),
  
  -- Flooring Services
  ('flooring', 'hardwood', 0.95),
  ('flooring', 'hardwood floor', 0.95),
  ('flooring', 'laminate', 0.90),
  ('flooring', 'tile', 0.90),
  ('flooring', 'carpet', 0.90),
  ('flooring', 'vinyl', 0.90),
  ('flooring', 'floor installation', 1.00),
  ('flooring', 'floor refinishing', 0.95),
  
  -- General Contractor Services
  ('general contractor', 'home renovation', 0.95),
  ('general contractor', 'renovation', 0.95),
  ('general contractor', 'remodeling', 0.95),
  ('general contractor', 'addition', 0.90),
  ('general contractor', 'basement', 0.85),
  ('general contractor', 'kitchen', 0.80),
  ('general contractor', 'bathroom', 0.80),
  
  -- Landscaping Services
  ('landscaping', 'lawn care', 0.90),
  ('landscaping', 'lawn service', 0.90),
  ('landscaping', 'tree removal', 0.85),
  ('landscaping', 'tree service', 0.85),
  ('landscaping', 'snow removal', 0.75),
  ('landscaping', 'hardscaping', 0.90),
  ('landscaping', 'gardening', 0.85),
  
  -- Painting Services
  ('painting', 'interior painting', 1.00),
  ('painting', 'exterior painting', 1.00),
  ('painting', 'house painting', 1.00),
  ('painting', 'drywall', 0.70),
  ('painting', 'wallpaper', 0.75)
ON CONFLICT (primary_service, alias_service) DO NOTHING;

-- ============================================================================
-- VERIFICATION & SUCCESS MESSAGE
-- ============================================================================

DO $$
DECLARE
  city_count integer;
  distance_count integer;
  alias_count integer;
BEGIN
  SELECT COUNT(*) INTO city_count FROM cities;
  SELECT COUNT(*) INTO distance_count FROM city_distances;
  SELECT COUNT(*) INTO alias_count FROM service_type_aliases;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Ontario Cities Seed Complete!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Inserted % Ontario cities', city_count;
  RAISE NOTICE 'Inserted % city distance pairs', distance_count;
  RAISE NOTICE 'Inserted % service type aliases', alias_count;
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Geographic expansion data ready!';
  RAISE NOTICE 'Next: Test with get_buyers_for_city()';
  RAISE NOTICE '========================================';
END $$;

