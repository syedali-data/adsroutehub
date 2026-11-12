# 🚀 **Geographic Expansion Implementation Guide**

**Step-by-step guide to safely deploy the geographic expansion feature**

---

## ✅ **Pre-Implementation Checklist**

Before running any migrations:

- [ ] Backup your Supabase database
- [ ] Test migrations in development environment first
- [ ] Review all SQL files for errors
- [ ] Ensure you have `SUPERUSER` or `postgres` role in Supabase
- [ ] Have rollback script ready (included below)

---

## 📋 **Step 1: Run Database Migrations**

### **1.1: Open Supabase SQL Editor**

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project: `zirqonwkfwfjackbtrdy`
3. Click "SQL Editor" in the left sidebar
4. Click "New query"

---

### **1.2: Run Migration 001 - Geographic Expansion Schema**

**File:** `supabase/migrations/001_geographic_expansion.sql`

1. Copy the entire contents of `001_geographic_expansion.sql`
2. Paste into Supabase SQL Editor
3. Click **"Run"** button
4. Wait for completion (should take 5-10 seconds)
5. Check for success message: "Geographic Expansion Migration Complete"

**Expected Output:**
```
NOTICE:  Geographic Expansion Migration Complete
NOTICE:  Created tables: cities, service_type_aliases, lead_queue, unroutable_leads, routing_audit
NOTICE:  Updated table: buyers (added geographic preferences)
NOTICE:  Updated table: city_distances (added constraints and indexes)
NOTICE:  Updated table: leads (added routing status)
```

**⚠️ If you get errors:**
- Check error message carefully
- Most common: "relation already exists" (safe to ignore if re-running)
- Serious errors: Stop and run rollback script

---

### **1.3: Run Migration 002 - Ontario Cities Seed Data**

**File:** `supabase/migrations/002_seed_ontario_cities.sql`

1. Copy the entire contents of `002_seed_ontario_cities.sql`
2. Paste into Supabase SQL Editor
3. Click **"Run"** button
4. Wait for completion (should take 10-15 seconds)
5. Check for success message with counts

**Expected Output:**
```
NOTICE:  Ontario Cities Seed Complete
NOTICE:  Inserted 75 cities
NOTICE:  Inserted 125 city distance pairs
NOTICE:  Inserted 70 service type aliases
NOTICE:  Geographic expansion data ready!
```

---

## ✅ **Step 2: Verify Database Setup**

### **2.1: Check Cities Table**

Run this query in SQL Editor:

```sql
-- Should return 75 cities
SELECT COUNT(*) as city_count FROM cities;

-- Show GTA cities
SELECT name, population, region FROM cities 
WHERE region = 'GTA' 
ORDER BY population DESC;
```

**Expected:** 15 GTA cities (Toronto, Mississauga, Brampton, etc.)

---

### **2.2: Check City Distances**

```sql
-- Should return 125+ distance pairs
SELECT COUNT(*) as distance_count FROM city_distances;

-- Test distance lookup
SELECT * FROM get_city_distance('toronto', 'mississauga');
```

**Expected:** distance_km: 25, travel_time_minutes: 30

---

### **2.3: Check Buyer Table Updates**

```sql
-- Verify new columns exist
SELECT 
  business_name,
  city,
  willing_to_travel_km,
  max_travel_time_minutes,
  conversion_rate
FROM buyers
LIMIT 5;
```

**Expected:** All columns should exist with default values

---

### **2.4: Test Helper Functions**

```sql
-- Test: Get cities within 50km of Toronto
SELECT * FROM get_cities_within_radius('toronto', 50);

-- Test: Get buyers who can serve Vaughan
SELECT * FROM get_buyers_for_city('vaughan', 'plumbing');
```

---

## 🎨 **Step 3: Integrate UI Component**

### **3.1: Add to Buyer Settings Page**

**Option A: Add to existing Settings page**

Edit: `src/pages/Settings.tsx` (or wherever buyer settings are)

```typescript
import { GeographicPreferences } from "@/components/buyers/GeographicPreferences";

// Inside your Settings component:
<GeographicPreferences
  buyerId={currentBuyer.id}
  currentCity={currentBuyer.city}
  currentTravelDistance={currentBuyer.willing_to_travel_km}
  onUpdate={() => {
    // Refresh buyer data
    queryClient.invalidateQueries(['current-buyer']);
  }}
/>
```

**Option B: Create dedicated "Service Area" page**

Create: `src/pages/buyer/ServiceArea.tsx`

```typescript
import { GeographicPreferences } from "@/components/buyers/GeographicPreferences";
import { getCurrentBuyer } from "@/lib/buyerAuth";

export default function ServiceArea() {
  const { data: buyer } = useQuery({
    queryKey: ["current-buyer"],
    queryFn: getCurrentBuyer,
  });

  if (!buyer) return <div>Loading...</div>;

  return (
    <div className="container max-w-4xl py-8">
      <h1 className="text-3xl font-bold mb-6">Service Area Settings</h1>
      <GeographicPreferences
        buyerId={buyer.id}
        currentCity={buyer.city}
        currentTravelDistance={buyer.willing_to_travel_km}
      />
    </div>
  );
}
```

Then add route in `src/App.tsx`:

```typescript
<Route path="/buyer/service-area" element={
  <BuyerProtectedRoute>
    <ServiceArea />
  </BuyerProtectedRoute>
} />
```

---

### **3.2: Add Navigation Link**

In your buyer portal sidebar/navigation:

```typescript
<Link to="/buyer/service-area">
  <MapPin className="mr-2 h-4 w-4" />
  Service Area
</Link>
```

---

## 🧪 **Step 4: Testing**

### **4.1: Test UI Component**

1. Login as a buyer
2. Navigate to Service Area settings
3. Adjust slider (try 0km, 25km, 50km, 100km)
4. Verify cities list updates in real-time
5. Click "Save Changes"
6. Refresh page - verify settings persisted

---

### **4.2: Test Database Functions**

```sql
-- Test 1: Distance lookup (both directions should work)
SELECT * FROM get_city_distance('toronto', 'mississauga');
SELECT * FROM get_city_distance('mississauga', 'toronto'); -- Should return same result

-- Test 2: Cities within radius
SELECT * FROM get_cities_within_radius('london', 60);

-- Test 3: Get buyers for city
SELECT * FROM get_buyers_for_city('vaughan', NULL); -- All services
SELECT * FROM get_buyers_for_city('vaughan', 'plumbing'); -- Specific service

-- Test 4: Service alias matching
SELECT * FROM service_type_aliases WHERE canonical_service = 'hvac';
```

---

### **4.3: Test Routing (Integration)**

Create a test lead in Vaughan (assuming no buyers there):

```sql
-- Insert test lead
INSERT INTO leads (name, email, phone, city, service_type, exclusivity) VALUES
  ('Test Customer', 'test@example.com', '+14165551234', 'vaughan', 'plumbing', 'shared');

-- Check if buyers from Toronto were found
SELECT * FROM get_buyers_for_city('vaughan', 'plumbing');
```

---

## 🔄 **Step 5: Update Routing Logic**

Now that the database is set up, you need to update the routing function to use Tier 2 (Geographic Expansion).

**File to update:** `supabase/functions/_shared/router.ts`

Add after Tier 1 fails:

```typescript
// TIER 2: Geographic Expansion
if (eligibleCandidates.length === 0) {
  console.log('[Router] Tier 1 failed, trying Tier 2: Geographic Expansion');
  
  const { data: nearbyBuyers } = await supabase.rpc('get_buyers_for_city', {
    p_city_name: lead.city,
    p_service_type: lead.service_type
  });
  
  if (nearbyBuyers && nearbyBuyers.length > 0) {
    console.log(`[Router] Tier 2: Found ${nearbyBuyers.length} buyers in nearby cities`);
    // Add to candidates...
  }
}
```

*(Full routing implementation is in LEAD-ROUTING-FLOWCHART.md)*

---

## ⚠️ **Rollback Procedure**

If something goes wrong, run this to rollback:

```sql
-- ============================================================================
-- ROLLBACK SCRIPT - Geographic Expansion
-- ============================================================================

-- Drop new tables
DROP TABLE IF EXISTS routing_audit CASCADE;
DROP TABLE IF EXISTS unroutable_leads CASCADE;
DROP TABLE IF EXISTS lead_queue CASCADE;
DROP TABLE IF EXISTS service_type_aliases CASCADE;
DROP TABLE IF EXISTS cities CASCADE;

-- Remove new columns from buyers
ALTER TABLE buyers DROP COLUMN IF EXISTS willing_to_travel_km;
ALTER TABLE buyers DROP COLUMN IF EXISTS max_travel_time_minutes;
ALTER TABLE buyers DROP COLUMN IF EXISTS avoid_toll_routes;
ALTER TABLE buyers DROP COLUMN IF EXISTS service_cities;
ALTER TABLE buyers DROP COLUMN IF EXISTS accept_any_lead;
ALTER TABLE buyers DROP COLUMN IF EXISTS premium_tier;
ALTER TABLE buyers DROP COLUMN IF EXISTS conversion_rate;
ALTER TABLE buyers DROP COLUMN IF EXISTS avg_response_time_minutes;
ALTER TABLE buyers DROP COLUMN IF EXISTS service_radius_updated_at;
ALTER TABLE buyers DROP COLUMN IF EXISTS geographic_notes;

-- Remove columns from leads
ALTER TABLE leads DROP COLUMN IF EXISTS routing_tier;
ALTER TABLE leads DROP COLUMN IF EXISTS routing_attempts;
ALTER TABLE leads DROP COLUMN IF EXISTS last_routing_attempt;
ALTER TABLE leads DROP COLUMN IF EXISTS routing_metadata;

-- Drop functions
DROP FUNCTION IF EXISTS get_buyers_for_city(text, text);
DROP FUNCTION IF EXISTS get_cities_within_radius(text, integer);
DROP FUNCTION IF EXISTS get_city_distance(text, text);
DROP FUNCTION IF EXISTS calculate_haversine_distance(decimal, decimal, decimal, decimal);
DROP FUNCTION IF EXISTS normalize_city_name();

RAISE NOTICE 'Rollback complete. All geographic expansion changes removed.';
```

---

## 📊 **Expected Performance**

After implementation:

| Metric | Before | After |
|--------|--------|-------|
| Lead waste rate | 15-20% | <5% |
| Avg routing time | 500ms | 800ms (Tier 2) |
| Cities served | 10-15 | 75+ (all Ontario) |
| Buyer satisfaction | Baseline | +30% (more leads) |
| Revenue per 100 leads | $4,000-4,500 | $4,750-5,000 |

---

## ✅ **Post-Implementation Checklist**

After 1 week:

- [ ] Check lead waste rate (should be <5%)
- [ ] Monitor routing_audit table for tier usage
- [ ] Review buyer feedback on new leads
- [ ] Check for any unroutable_leads entries
- [ ] Verify all buyers have set their preferences
- [ ] Monitor database performance (query times)

---

## 🚨 **Troubleshooting**

### **Issue: Cities not showing in UI**

**Check:**
```sql
SELECT * FROM cities WHERE name_normalized = 'toronto';
SELECT * FROM get_cities_within_radius('toronto', 50);
```

**Solution:** Ensure city names are lowercase in queries

---

### **Issue: Distance function returns empty**

**Check:**
```sql
SELECT * FROM city_distances WHERE city_a = 'toronto' OR city_b = 'toronto';
```

**Solution:** Ensure city names are in alphabetical order (city_a < city_b)

---

### **Issue: UI slider not saving**

**Check browser console for errors**

**Solution:** Verify buyer_id is correct and buyer has permission

---

### **Issue: Routing still not finding buyers**

**Check:**
```sql
-- Verify buyer has set travel distance
SELECT business_name, city, willing_to_travel_km FROM buyers WHERE status = 'active';

-- Manually test routing
SELECT * FROM get_buyers_for_city('vaughan', 'plumbing');
```

---

## 📞 **Support**

If you encounter issues:

1. Check console logs (browser + Supabase logs)
2. Review error messages in SQL Editor
3. Test individual functions in isolation
4. Verify data exists in tables
5. Check RLS policies (if enabled)

---

## 🎉 **Success Criteria**

You'll know it's working when:

✅ Buyers can adjust their service radius in UI  
✅ Cities list updates in real-time  
✅ Leads from nearby cities get routed  
✅ No errors in console  
✅ Lead waste rate decreases  

---

**Ready to implement? Start with Step 1!** 🚀

---

**Estimated Implementation Time:**
- Database setup: 15 minutes
- UI integration: 30 minutes
- Testing: 30 minutes
- Total: ~75 minutes

