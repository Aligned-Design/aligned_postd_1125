#!/bin/bash
#
# Manual Endpoint Testing Script for First-Run Onboarding Fixes
# 
# Prerequisites:
# 1. Server must be running: pnpm dev (in another terminal)
# 2. Server should be on port 3000 (default for dev)
#
# Usage:
#   chmod +x scripts/test-onboarding-endpoints.sh
#   ./scripts/test-onboarding-endpoints.sh
#

set -e

echo "═══════════════════════════════════════════════════════════"
echo " First-Run Onboarding Endpoint Testing"
echo "═══════════════════════════════════════════════════════════"
echo ""

SERVER_URL="${SERVER_URL:-http://localhost:3000}"
echo "🌐 Testing against: $SERVER_URL"
echo ""

# Test 1: Analytics Log Endpoint
echo "📊 Test 1: POST /api/analytics/log"
echo "─────────────────────────────────────"
RESPONSE1=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$SERVER_URL/api/analytics/log" \
  -H "Content-Type: application/json" \
  -d '{"type":"telemetry","timestamp":"2025-12-15T00:00:00Z","event":"test_event","context":{"source":"manual_test"}}')

HTTP_STATUS1=$(echo "$RESPONSE1" | grep "HTTP_STATUS:" | cut -d: -f2)
BODY1=$(echo "$RESPONSE1" | sed '/HTTP_STATUS:/d')

echo "Status Code: $HTTP_STATUS1"
echo "Response Body: $BODY1"
echo ""

if [ "$HTTP_STATUS1" == "202" ] || [ "$HTTP_STATUS1" == "200" ]; then
  echo "✅ PASS: Analytics log endpoint is accessible (not 404)"
elif [ "$HTTP_STATUS1" == "404" ]; then
  echo "❌ FAIL: Analytics log endpoint returned 404"
  echo "   → Check that server is running and using index-v2.ts"
else
  echo "⚠️  WARN: Unexpected status $HTTP_STATUS1 (not 404, so route exists)"
fi
echo ""

# Test 2: Auth Signup Endpoint
echo "🔐 Test 2: POST /api/auth/signup"
echo "─────────────────────────────────────"
RESPONSE2=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$SERVER_URL/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{"email":"test-'$(date +%s)'@example.com","password":"testpass123","name":"Test User"}')

HTTP_STATUS2=$(echo "$RESPONSE2" | grep "HTTP_STATUS:" | cut -d: -f2)
BODY2=$(echo "$RESPONSE2" | sed '/HTTP_STATUS:/d')

echo "Status Code: $HTTP_STATUS2"
echo "Response Body (truncated): $(echo "$BODY2" | head -c 200)..."
echo ""

if [ "$HTTP_STATUS2" == "200" ] || [ "$HTTP_STATUS2" == "201" ]; then
  echo "✅ PASS: Auth signup endpoint is accessible and working"
elif [ "$HTTP_STATUS2" == "400" ] || [ "$HTTP_STATUS2" == "409" ]; then
  echo "✅ PASS: Auth signup endpoint exists (validation/conflict error is OK)"
elif [ "$HTTP_STATUS2" == "404" ]; then
  echo "❌ FAIL: Auth signup endpoint returned 404"
  echo "   → Check that auth router is mounted at /api/auth"
else
  echo "⚠️  WARN: Unexpected status $HTTP_STATUS2"
fi
echo ""

# Test 3: Onboarding Run-All Endpoint (Will fail without auth, but should not be 404)
echo "🚀 Test 3: POST /api/orchestration/onboarding/run-all (No Auth)"
echo "────────────────────────────────────────────────────────────"
RESPONSE3=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$SERVER_URL/api/orchestration/onboarding/run-all" \
  -H "Content-Type: application/json" \
  -d '{"brandId":"00000000-0000-0000-0000-000000000000","websiteUrl":"https://example.com"}')

HTTP_STATUS3=$(echo "$RESPONSE3" | grep "HTTP_STATUS:" | cut -d: -f2)
BODY3=$(echo "$RESPONSE3" | sed '/HTTP_STATUS:/d')

echo "Status Code: $HTTP_STATUS3"
echo "Response Body: $(echo "$BODY3" | head -c 200)..."
echo ""

if [ "$HTTP_STATUS3" == "401" ]; then
  echo "✅ PASS: Onboarding endpoint exists (401 unauthorized is expected without auth)"
elif [ "$HTTP_STATUS3" == "403" ]; then
  echo "⚠️  WARN: Got 403 Forbidden (should be 401 for missing auth)"
  echo "   → This might mean auth succeeded but permission check failed"
  echo "   → For full test, authenticate as OWNER role in the UI"
elif [ "$HTTP_STATUS3" == "404" ]; then
  echo "❌ FAIL: Onboarding endpoint returned 404"
  echo "   → Check that orchestration router is mounted at /api/orchestration"
else
  echo "⚠️  WARN: Unexpected status $HTTP_STATUS3"
fi
echo ""

# Summary
echo "═══════════════════════════════════════════════════════════"
echo " Summary"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Test 1 (Analytics):   HTTP $HTTP_STATUS1 $([ "$HTTP_STATUS1" != "404" ] && echo "✅" || echo "❌")"
echo "Test 2 (Auth Signup): HTTP $HTTP_STATUS2 $([ "$HTTP_STATUS2" != "404" ] && echo "✅" || echo "❌")"
echo "Test 3 (Onboarding):  HTTP $HTTP_STATUS3 $([ "$HTTP_STATUS3" != "404" ] && echo "✅" || echo "❌")"
echo ""

if [ "$HTTP_STATUS1" != "404" ] && [ "$HTTP_STATUS2" != "404" ] && [ "$HTTP_STATUS3" != "404" ]; then
  echo "🎉 ALL ENDPOINTS ACCESSIBLE (no 404s)"
  echo ""
  echo "Next Steps:"
  echo "1. Test full onboarding flow in UI with OWNER role user"
  echo "2. Verify /api/orchestration/onboarding/run-all returns 200 (not 403)"
  echo "3. Check database for persisted media_assets after crawl"
else
  echo "❌ SOME ENDPOINTS RETURNED 404"
  echo ""
  echo "Troubleshooting:"
  echo "1. Ensure server is running: pnpm dev"
  echo "2. Verify server is using index-v2.ts (check console output)"
  echo "3. Check for any startup errors in server logs"
  echo "4. Try: kill $(lsof -ti:3000) && pnpm dev"
fi
echo ""

