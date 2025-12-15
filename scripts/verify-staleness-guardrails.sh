#!/bin/bash
# Runtime verification script for crawler staleness guardrails
# Run this locally in dev to verify all guardrails work correctly

set -e

echo "🔍 Crawler Staleness Guardrails - Runtime Verification"
echo "========================================================"
echo ""

# Check token is set
if [ -z "$REALITY_CHECK_TOKEN" ]; then
  echo "❌ ERROR: REALITY_CHECK_TOKEN not set in .env"
  echo "   Add: REALITY_CHECK_TOKEN=your-secret-token-here"
  exit 1
fi

BASE_URL="${BASE_URL:-http://localhost:3000}"

echo "✓ Token found in environment"
echo "✓ Base URL: $BASE_URL"
echo ""

# Test 1: Fingerprint without token (should fail)
echo "Test 1: Fingerprint endpoint without token (should fail)"
echo "--------------------------------------------------------"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/__debug/fingerprint")
if [ "$HTTP_CODE" -eq 401 ] || [ "$HTTP_CODE" -eq 403 ]; then
  echo "✅ PASS: Rejected without token (HTTP $HTTP_CODE)"
else
  echo "❌ FAIL: Expected 401/403, got HTTP $HTTP_CODE"
  exit 1
fi
echo ""

# Test 2: Fingerprint with token (should succeed)
echo "Test 2: Fingerprint endpoint with token (should succeed)"
echo "--------------------------------------------------------"
RESPONSE=$(curl -s -H "x-reality-check-token: $REALITY_CHECK_TOKEN" "$BASE_URL/__debug/fingerprint")
GIT_SHA=$(echo "$RESPONSE" | jq -r '.gitSha')
NODE_ENV=$(echo "$RESPONSE" | jq -r '.nodeEnv')
ENTRY_FILE=$(echo "$RESPONSE" | jq -r '.entryFile')

if [ "$GIT_SHA" = "unknown" ]; then
  echo "❌ FAIL: Git SHA is 'unknown'"
  exit 1
fi

# Validate SHA is hex format
if ! echo "$GIT_SHA" | grep -qE '^[0-9a-f]{7,40}$'; then
  echo "❌ FAIL: Git SHA is not hex format: $GIT_SHA"
  exit 1
fi

echo "✅ PASS: Fingerprint retrieved successfully"
echo "   Git SHA: ${GIT_SHA:0:7}"
echo "   Node ENV: $NODE_ENV"
echo "   Entry File: $(basename "$ENTRY_FILE")"
echo ""

# Test 3: Reality check script (should succeed)
echo "Test 3: Reality check script (should succeed)"
echo "--------------------------------------------------------"
if pnpm tsx scripts/crawler-reality-check.ts; then
  EXIT_CODE=$?
  echo "✅ PASS: Reality check script succeeded (exit code $EXIT_CODE)"
else
  EXIT_CODE=$?
  echo "❌ FAIL: Reality check script failed (exit code $EXIT_CODE)"
  exit 1
fi
echo ""

# Test 4: Crawl decision logs (optional - requires manual inspection)
echo "Test 4: Crawl decision logs (manual inspection)"
echo "--------------------------------------------------------"
echo "To verify CRAWL_DECISION logs:"
echo ""
echo "1. Run two crawls back-to-back with same brand_id + url:"
echo "   curl -X POST \"$BASE_URL/api/crawl/start?sync=true\" \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -H \"x-reality-check-token: \$REALITY_CHECK_TOKEN\" \\"
echo "     -d '{\"url\": \"https://example.com\", \"brand_id\": \"test_$(date +%s)\", \"cacheMode\": \"default\"}'"
echo ""
echo "2. Check server console for CRAWL_DECISION logs:"
echo "   - First run: PROCEED_ASSET_EXTRACTION (no assets)"
echo "   - Second run: SKIP_ASSET_EXTRACTION (assets exist)"
echo ""
echo "   - First run: PROCEED_IMAGE_PERSISTENCE (no assets)"
echo "   - Second run: SKIP_IMAGE_PERSISTENCE (assets exist)"
echo ""
echo "   - First run: PROCEED_BRANDKIT_UPDATE (fields missing)"
echo "   - Second run: SKIP_BRANDKIT_UPDATE (fields populated)"
echo ""

echo "========================================================"
echo "✅ All automated tests PASSED"
echo "   Manual inspection of CRAWL_DECISION logs recommended"
echo "========================================================"

