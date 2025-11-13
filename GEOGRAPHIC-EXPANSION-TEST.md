# 🧪 **Geographic Expansion - Testing & Validation Guide**

**Comprehensive testing scenarios for the geographic expansion feature**

---

## 🎯 **Test Scenarios**

### **Scenario 1: Buyer Updates Service Radius**

**Goal:** Verify buyers can change their travel preferences

**Steps:**
1. Login as a buyer
2. Navigate to Service Area settings
3. Current radius should show (default: 25km)
4. Move slider to 50km
5. Verify cities list updates to show more cities
6. Click "Save Changes"
7. Refresh page
8. Verify radius is still 50km

**Expected Result:**
- ✅ Slider moves smoothly
- ✅ Cities list updates instantly
- ✅ Save button enables when changes made
- ✅ Success toast appears
- ✅ Settings persist after refresh

---

### **Scenario 2: Lead Routing with Geographic Expansion**

**Goal:** Verify leads route to nearby cities

**Setup:**
```sql
-- Create a buyer in Toronto who serves plumbing
INSERT INTO buyers (business_name, contact_name, email, city, service_types, daily_cap, max_budget, status, willing_to_travel_km)
VALUES ('Toronto Plumbing Co.', 'John Smith', 'john@torontoplumbing.com', 'toronto', ARRAY['plumbing'], 10, 5000, 'active', 50);

-- Create a lead in Vaughan (30km from Toronto)
INSERT INTO leads (name, email, phone, city, service_type, budget_raw, exclusivity)
VALUES ('Jane Doe', 'jane@example.com', '+14165551234', 'vaughan', 'plumbing', '$2000-$3000', 'shared');
```

**Test Query:**
```sql
-- Should return Toronto buyer
SELECT * FROM get_buyers_for_city('vaughan', 'plumbing');
```

**Expected Result:**
- ✅ Toronto buyer appears in results
- ✅ Distance shows as ~30km
- ✅ Travel time shows as ~35 minutes
- ✅ Highway route shows as "407" or "400"

---

### **Scenario 3: Distance Calculation Accuracy**

**Goal:** Verify distance lookups work correctly

**Test Cases:**

```sql
-- Test 1: Same city = 0km
SELECT * FROM get_city_distance('toronto', 'toronto');
-- Expected: distance_km = 0, travel_time_minutes = 0

-- Test 2: Adjacent cities
SELECT * FROM get_city_distance('toronto', 'mississauga');
-- Expected: distance_km = 25, travel_time_minutes = 30

-- Test 3: Order doesn't matter (both should return same result)
SELECT * FROM get_city_distance('toronto', 'mississauga');
SELECT * FROM get_city_distance('mississauga', 'toronto');

-- Test 4: Far cities
SELECT * FROM get_city_distance('toronto', 'ottawa');
-- Expected: distance_km = 450, travel_time_minutes = 280

-- Test 5: Unknown city pair (should return NULL)
SELECT * FROM get_city_distance('toronto', 'new_york');
-- Expected: 0 rows (not in database)
```

---

### **Scenario 4: Cities Within Radius**

**Goal:** Verify radius search works correctly

```sql
-- Test 1: Small radius (local only)
SELECT * FROM get_cities_within_radius('toronto', 15);
-- Expected: 0-2 cities (very close suburbs)

-- Test 2: Default radius (25km)
SELECT * FROM get_cities_within_radius('toronto', 25);
-- Expected: 3-5 cities (Mississauga, North York, Scarborough, Markham)

-- Test 3: Medium radius (50km)
SELECT * FROM get_cities_within_radius('toronto', 50);
-- Expected: 10-12 cities (most of GTA)

-- Test 4: Large radius (100km)
SELECT * FROM get_cities_within_radius('toronto', 100);
-- Expected: 15-20 cities (all GTA + some Golden Horseshoe)

-- Test 5: London, Ontario (your home market)
SELECT * FROM get_cities_within_radius('london', 60);
-- Expected: St. Thomas, Woodstock, Stratford
```

---

### **Scenario 5: Service Type Aliases**

**Goal:** Verify flexible service matching works

```sql
-- Test 1: Direct match
SELECT * FROM service_type_aliases WHERE canonical_service = 'hvac';
-- Expected: heating, cooling, air conditioning, furnace, etc.

-- Test 2: Alias to canonical lookup
SELECT canonical_service, match_score 
FROM service_type_aliases 
WHERE alias = 'furnace repair';
-- Expected: hvac, 0.85

-- Test 3: Find all plumbing-related services
SELECT alias, match_score 
FROM service_type_aliases 
WHERE canonical_service = 'plumbing' 
ORDER BY match_score DESC;
-- Expected: drain cleaning (0.90), water heater (0.85), etc.
```

---

### **Scenario 6: Buyer Eligibility with Travel Preferences**

**Goal:** Verify buyers are filtered by travel distance

**Setup:**
```sql
-- Buyer A: Toronto, 25km radius
UPDATE buyers SET willing_to_travel_km = 25 WHERE city = 'toronto' AND id = 'buyer-a-id';

-- Buyer B: Toronto, 50km radius
UPDATE buyers SET willing_to_travel_km = 50 WHERE city = 'toronto' AND id = 'buyer-b-id';

-- Lead in Brampton (35km from Toronto)
INSERT INTO leads (city, service_type) VALUES ('brampton', 'plumbing');
```

**Test:**
```sql
SELECT 
  business_name,
  willing_to_travel_km,
  (SELECT distance_km FROM get_city_distance(city, 'brampton')) as actual_distance
FROM buyers
WHERE city = 'toronto' AND service_types && ARRAY['plumbing'];
```

**Expected Result:**
- ✅ Buyer A (25km): NOT eligible (35km > 25km)
- ✅ Buyer B (50km): ELIGIBLE (35km < 50km)

---

### **Scenario 7: UI Edge Cases**

**Goal:** Verify UI handles edge cases gracefully

**Test Cases:**

1. **Zero radius (0km)**
   - Slider at 0km
   - Expected: Only home city shown, message "Local only"

2. **Maximum radius (100km)**
   - Slider at 100km
   - Expected: Many cities shown, message "Very large radius"

3. **No cities found**
   - For a city with no nearby cities in database
   - Expected: "No nearby cities found" message with helpful suggestion

4. **Loading state**
   - Slow network simulation
   - Expected: Spinner shows while fetching cities

5. **Save error**
   - Disconnect network and try to save
   - Expected: Error toast with "Retry" option

---

## 📊 **Performance Benchmarks**

### **Database Query Performance**

Run these and record times:

```sql
-- Benchmark 1: Distance lookup
EXPLAIN ANALYZE
SELECT * FROM get_city_distance('toronto', 'mississauga');
-- Expected: <5ms

-- Benchmark 2: Cities within radius
EXPLAIN ANALYZE
SELECT * FROM get_cities_within_radius('toronto', 50);
-- Expected: <20ms

-- Benchmark 3: Get buyers for city
EXPLAIN ANALYZE
SELECT * FROM get_buyers_for_city('vaughan', 'plumbing');
-- Expected: <50ms

-- Benchmark 4: Service alias lookup
EXPLAIN ANALYZE
SELECT * FROM service_type_aliases WHERE canonical_service = 'hvac';
-- Expected: <5ms
```

**If queries are slow (>100ms):**
- Check if indexes exist: `\di` in psql
- Run `ANALYZE cities;` and `ANALYZE city_distances;`
- Check for missing indexes in migration

---

## 🔍 **Validation Queries**

### **Check Data Integrity**

```sql
-- Verify all cities have coordinates
SELECT COUNT(*) as missing_coords
FROM cities
WHERE latitude IS NULL OR longitude IS NULL;
-- Expected: 0

-- Verify city_distances follow alphabetical order
SELECT COUNT(*) as order_violations
FROM city_distances
WHERE city_a >= city_b;
-- Expected: 0

-- Check for duplicate city pairs
SELECT city_a, city_b, COUNT(*)
FROM city_distances
GROUP BY city_a, city_b
HAVING COUNT(*) > 1;
-- Expected: 0 rows

-- Verify all buyers have travel preferences set
SELECT COUNT(*) as missing_prefs
FROM buyers
WHERE willing_to_travel_km IS NULL;
-- Expected: 0

-- Check distance data completeness for GTA
SELECT COUNT(*) as gta_distance_pairs
FROM city_distances
WHERE (city_a IN (SELECT name_normalized FROM cities WHERE region = 'GTA')
   OR city_b IN (SELECT name_normalized FROM cities WHERE region = 'GTA'));
-- Expected: 100+
```

---

## 🎭 **User Acceptance Testing (UAT)**

### **Buyer Persona: "Local Larry"**

**Profile:**
- Only serves his immediate city
- Not interested in traveling
- Wants high-quality local leads

**Test:**
1. Set radius to 0km
2. Verify only receives leads from home city
3. Verify no leads from nearby cities

---

### **Buyer Persona: "Regional Rita"**

**Profile:**
- Serves entire GTA
- Willing to travel up to 50km
- Wants maximum lead volume

**Test:**
1. Set radius to 50km
2. Verify receives leads from 10+ cities
3. Check lead volume increase (should be 3-5x local only)

---

### **Buyer Persona: "Selective Sam"**

**Profile:**
- Serves specific cities only
- Doesn't want random distant leads
- Wants control over service area

**Test:**
1. Set radius to 30km
2. Verify gets leads from 5-7 nearby cities
3. Adjust radius down to 20km
4. Verify cities list decreases appropriately

---

## 🚨 **Error Scenarios**

### **Test Error Handling**

1. **Database Connection Lost**
   ```sql
   -- Simulate by pausing Supabase
   ```
   - Expected: Error toast, retry option, graceful degradation

2. **Invalid City Name**
   ```sql
   SELECT * FROM get_buyers_for_city('INVALID_CITY', 'plumbing');
   ```
   - Expected: Empty result, no crash

3. **Negative Distance**
   ```sql
   UPDATE buyers SET willing_to_travel_km = -10 WHERE id = 'test-id';
   ```
   - Expected: CHECK constraint violation (prevented by database)

4. **Distance Exceeds Limit**
   ```sql
   UPDATE buyers SET willing_to_travel_km = 1000 WHERE id = 'test-id';
   ```
   - Expected: CHECK constraint violation (max 500km)

---

## ✅ **Acceptance Criteria**

Feature is ready for production when:

- [ ] All 7 test scenarios pass
- [ ] All performance benchmarks meet targets (<100ms)
- [ ] All validation queries return expected results
- [ ] All 3 buyer personas work as expected
- [ ] All error scenarios handled gracefully
- [ ] UI works on mobile, tablet, desktop
- [ ] No console errors
- [ ] No linter warnings
- [ ] Documentation complete
- [ ] Rollback script tested and works

---

## 📈 **Success Metrics (After 1 Week)**

Monitor these metrics:

```sql
-- Metric 1: Lead waste rate
SELECT 
  COUNT(CASE WHEN routing_tier IS NULL THEN 1 END)::float / COUNT(*) * 100 as waste_rate_percent
FROM leads
WHERE created_at > NOW() - INTERVAL '7 days';
-- Target: <5%

-- Metric 2: Tier 2 usage
SELECT 
  routing_tier,
  COUNT(*) as lead_count,
  COUNT(*)::float / SUM(COUNT(*)) OVER () * 100 as percentage
FROM leads
WHERE created_at > NOW() - INTERVAL '7 days'
  AND routing_tier IS NOT NULL
GROUP BY routing_tier
ORDER BY routing_tier;
-- Expected: Tier 2 should handle 15-25% of leads

-- Metric 3: Average routing time
SELECT 
  AVG(execution_time_ms) as avg_time_ms,
  MAX(execution_time_ms) as max_time_ms
FROM routing_audit
WHERE created_at > NOW() - INTERVAL '7 days';
-- Target: avg <1000ms, max <3000ms

-- Metric 4: Buyer satisfaction (lead acceptance rate)
SELECT 
  b.business_name,
  COUNT(d.id) as leads_received,
  COUNT(CASE WHEN d.won = true THEN 1 END) as leads_accepted,
  COUNT(CASE WHEN d.won = true THEN 1 END)::float / COUNT(d.id) * 100 as acceptance_rate
FROM buyers b
LEFT JOIN deliveries d ON d.buyer_id = b.id
WHERE d.created_at > NOW() - INTERVAL '7 days'
GROUP BY b.id, b.business_name
HAVING COUNT(d.id) > 0
ORDER BY acceptance_rate DESC;
-- Target: >50% acceptance rate
```

---

## 🎉 **Final Checklist**

Before marking as "COMPLETE":

- [ ] Database migrations run successfully
- [ ] All 75 cities inserted
- [ ] All 125+ distance pairs inserted
- [ ] UI component integrated into buyer portal
- [ ] Buyers can see and adjust their service radius
- [ ] Cities list updates in real-time
- [ ] Settings persist after save
- [ ] No errors in browser console
- [ ] No errors in Supabase logs
- [ ] Performance meets targets
- [ ] Documentation complete
- [ ] Team trained on new feature
- [ ] Monitoring dashboard set up

---

**Ready to ship when all boxes checked!** ✅

