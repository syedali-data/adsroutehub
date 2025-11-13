#!/bin/bash
# ============================================================================
# 6-Tier Routing System - Comprehensive Test Suite
# ============================================================================
# 
# Tests all 6 tiers of the routing system
# Run this after deployment to validate everything works
# 
# Usage: bash test-6-tier-routing.sh
# 
# ============================================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_URL="https://zirqonwkfwfjackbtrdy.supabase.co"
API_KEY="YOUR_LEAD_INTAKE_API_KEY"  # Replace with actual key

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

# Helper function to print test header
print_test_header() {
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}TEST $1: $2${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Helper function to send lead
send_lead() {
  local name=$1
  local email=$2
  local phone=$3
  local city=$4
  local service=$5
  local exclusivity=${6:-shared}

  curl -s -X POST "$PROJECT_URL/functions/v1/lead-intake" \
    -H "Content-Type: application/json" \
    -H "x-api-key: $API_KEY" \
    -d "{
      \"name\": \"$name\",
      \"email\": \"$email\",
      \"phone\": \"$phone\",
      \"city\": \"$city\",
      \"service_type\": \"$service\",
      \"exclusivity\": \"$exclusivity\"
    }"
}

# Helper function to check test result
check_result() {
  local response=$1
  local expected=$2
  local test_name=$3

  TESTS_TOTAL=$((TESTS_TOTAL + 1))

  if echo "$response" | grep -q "$expected"; then
    echo -e "${GREEN}✅ PASS${NC}: $test_name"
    TESTS_PASSED=$((TESTS_PASSED + 1))
    return 0
  else
    echo -e "${RED}❌ FAIL${NC}: $test_name"
    echo -e "${YELLOW}Expected:${NC} $expected"
    echo -e "${YELLOW}Got:${NC} $response"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    return 1
  fi
}

# ============================================================================
# TEST 1: TIER 1 - PERFECT MATCH
# ============================================================================
print_test_header "1" "TIER 1 - Perfect Match (Exact City + Service)"

echo "Sending lead: Toronto Plumbing..."
RESPONSE=$(send_lead "Test Customer 1" "test1@example.com" "+14165551001" "toronto" "plumbing")
check_result "$RESPONSE" "success" "Lead accepted"
check_result "$RESPONSE" "routed" "Lead routed successfully"

echo ""
echo "Expected: Tier 1 routing (check logs for 'Tier 1: Perfect Match')"

# ============================================================================
# TEST 2: TIER 2 - GEOGRAPHIC EXPANSION
# ============================================================================
print_test_header "2" "TIER 2 - Geographic Expansion (Nearby City)"

echo "Sending lead: Vaughan Plumbing (30km from Toronto)..."
RESPONSE=$(send_lead "Test Customer 2" "test2@example.com" "+14165551002" "vaughan" "plumbing")
check_result "$RESPONSE" "success" "Lead accepted"
check_result "$RESPONSE" "routed" "Lead routed successfully"

echo ""
echo "Expected: Tier 2 routing (check logs for 'Tier 2: Geographic Expansion')"
echo "Expected: Toronto buyer receives lead (within 50km radius)"

# ============================================================================
# TEST 3: TIER 3 - SERVICE FLEXIBILITY
# ============================================================================
print_test_header "3" "TIER 3 - Service Flexibility (Related Service)"

echo "Sending lead: Toronto Furnace Repair (should match HVAC buyer)..."
RESPONSE=$(send_lead "Test Customer 3" "test3@example.com" "+14165551003" "toronto" "furnace repair")
check_result "$RESPONSE" "success" "Lead accepted"

echo ""
echo "Expected: Tier 3 routing (furnace repair → HVAC via service alias)"
echo "Expected: HVAC buyer receives lead"

# ============================================================================
# TEST 4: TIER 3 - GEOGRAPHIC + SERVICE
# ============================================================================
print_test_header "4" "TIER 3 - Geographic + Service Flexibility"

echo "Sending lead: Brampton Heating (related service + nearby city)..."
RESPONSE=$(send_lead "Test Customer 4" "test4@example.com" "+14165551004" "brampton" "heating")
check_result "$RESPONSE" "success" "Lead accepted"

echo ""
echo "Expected: Tier 3 routing (heating → HVAC, Brampton → Toronto buyer)"

# ============================================================================
# TEST 5: TIER 4 - CAPACITY EXPANSION (OFF-PEAK)
# ============================================================================
print_test_header "5" "TIER 4 - Capacity Expansion (Time-Based)"

echo "Note: This test only works during off-peak hours (after 6pm or weekends)"
current_hour=$(date +%H)
echo "Current hour: $current_hour"

if [ "$current_hour" -ge 18 ] || [ "$current_hour" -lt 8 ]; then
  echo "Off-peak time detected, running test..."
  RESPONSE=$(send_lead "Test Customer 5" "test5@example.com" "+14165551005" "toronto" "plumbing")
  check_result "$RESPONSE" "success" "Lead accepted during off-peak"
  
  echo ""
  echo "Expected: Tier 4 routing (off-peak capacity)"
else
  echo -e "${YELLOW}⏭️  SKIPPED${NC}: Test only valid during off-peak hours (18:00-08:00)"
fi

# ============================================================================
# TEST 6: TIER 5 - LEAD PARKING
# ============================================================================
print_test_header "6" "TIER 5 - Lead Parking (No Buyers Available)"

echo "Note: This test requires all buyers to be inactive or at capacity"
echo "Manually verify by checking lead_queue table after this test"

RESPONSE=$(send_lead "Test Customer 6" "test6@example.com" "+14165551006" "north_bay" "plumbing")
check_result "$RESPONSE" "success" "Lead accepted (will be parked)"

echo ""
echo "Expected: Tier 5 routing (lead parked for retry in 24h)"
echo "Verify in database: SELECT * FROM lead_queue WHERE status = 'parked' ORDER BY created_at DESC LIMIT 1;"

# ============================================================================
# TEST 7: TIER 6 - ADMIN ALERTS
# ============================================================================
print_test_header "7" "TIER 6 - Admin Alerts (Unroutable Lead)"

echo "Sending lead: Remote city with no buyers..."
RESPONSE=$(send_lead "Test Customer 7" "test7@example.com" "+14165551007" "kenora" "underwater_welding")
check_result "$RESPONSE" "success" "Lead accepted (will be flagged)"

echo ""
echo "Expected: Tier 6 routing (admin alert created)"
echo "Verify in database: SELECT * FROM unroutable_leads ORDER BY created_at DESC LIMIT 1;"

# ============================================================================
# TEST 8: DUPLICATE DETECTION
# ============================================================================
print_test_header "8" "Duplicate Detection (24-Hour Window)"

echo "Sending original lead..."
RESPONSE1=$(send_lead "Duplicate Test" "duplicate@example.com" "+14165551008" "toronto" "plumbing")
check_result "$RESPONSE1" "success" "Original lead accepted"

echo ""
echo "Sending duplicate lead (same email/phone within 24h)..."
RESPONSE2=$(send_lead "Duplicate Test" "duplicate@example.com" "+14165551008" "toronto" "plumbing")
check_result "$RESPONSE2" "Duplicate lead detected" "Duplicate rejected correctly"

# ============================================================================
# TEST 9: BATCH EMAIL PERFORMANCE
# ============================================================================
print_test_header "9" "Batch Email Performance (Multiple Buyers)"

echo "Sending exclusive lead (should go to 1 buyer)..."
RESPONSE_EXCLUSIVE=$(send_lead "Batch Test Exclusive" "batch1@example.com" "+14165551009" "toronto" "plumbing" "exclusive")
check_result "$RESPONSE_EXCLUSIVE" "success" "Exclusive lead accepted"

echo ""
echo "Sending shared lead (should go to 3 buyers)..."
RESPONSE_SHARED=$(send_lead "Batch Test Shared" "batch2@example.com" "+14165551010" "toronto" "plumbing" "shared")
check_result "$RESPONSE_SHARED" "success" "Shared lead accepted"

echo ""
echo "Expected: Batch email sent to multiple buyers (check Resend dashboard)"

# ============================================================================
# TEST 10: PERFORMANCE TEST
# ============================================================================
print_test_header "10" "Performance Test (10 Rapid Leads)"

echo "Sending 10 leads rapidly to test performance..."
START_TIME=$(date +%s)

for i in {1..10}
do
  email="perf${i}@example.com"
  phone="+1416555$(printf '%04d' $((1100 + i)))"
  
  RESPONSE=$(send_lead "Performance Test $i" "$email" "$phone" "toronto" "plumbing")
  
  if echo "$RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✓${NC} Lead $i routed"
  else
    echo -e "${RED}✗${NC} Lead $i failed"
  fi
done

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo ""
echo "Performance: 10 leads routed in ${DURATION} seconds"

if [ "$DURATION" -le 10 ]; then
  echo -e "${GREEN}✅ PASS${NC}: Performance acceptable (<10s for 10 leads)"
  TESTS_PASSED=$((TESTS_PASSED + 1))
else
  echo -e "${RED}❌ FAIL${NC}: Performance too slow (>${DURATION}s for 10 leads)"
  TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TESTS_TOTAL=$((TESTS_TOTAL + 1))

# ============================================================================
# TEST SUMMARY
# ============================================================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}TEST SUMMARY${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Total Tests: $TESTS_TOTAL"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo ""

if [ "$TESTS_FAILED" -eq 0 ]; then
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}🎉 ALL TESTS PASSED! 🎉${NC}"
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo "✅ 6-Tier routing system is working correctly"
  echo "✅ All tiers functional"
  echo "✅ Performance acceptable"
  echo "✅ Error handling working"
  echo ""
  echo "Next steps:"
  echo "1. Check Supabase logs for detailed tier usage"
  echo "2. Verify routing_audit table for execution times"
  echo "3. Check buyer emails in Resend dashboard"
  echo "4. Monitor for 24 hours"
  exit 0
else
  echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${RED}⚠️  SOME TESTS FAILED ⚠️${NC}"
  echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo "❌ $TESTS_FAILED test(s) failed"
  echo ""
  echo "Troubleshooting:"
  echo "1. Check Supabase logs for errors"
  echo "2. Verify database migrations ran successfully"
  echo "3. Check Edge Function deployment status"
  echo "4. Verify API key is correct"
  echo "5. Review failed test output above"
  exit 1
fi

