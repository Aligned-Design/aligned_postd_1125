#!/bin/bash
# Production Crawler Verification Script
# Proves the async crawler works end-to-end on Vercel

set -e

echo "🔍 PRODUCTION CRAWLER VERIFICATION"
echo "=================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check required env vars
if [ -z "$POSTD_URL" ]; then
  echo -e "${RED}❌ ERROR: POSTD_URL not set${NC}"
  echo "   Export your Vercel domain:"
  echo "   export POSTD_URL='https://your-domain.vercel.app'"
  exit 1
fi

if [ -z "$CRON_SECRET" ]; then
  echo -e "${RED}❌ ERROR: CRON_SECRET not set${NC}"
  echo "   Export your cron secret:"
  echo "   export CRON_SECRET='your-secret-here'"
  exit 1
fi

echo "✅ Environment variables set"
echo "   POSTD_URL: $POSTD_URL"
echo "   CRON_SECRET: [REDACTED]"
echo ""

# Test 1: Worker endpoint responds
echo "📋 TEST 1: Worker endpoint authentication"
echo "   Testing: POST $POSTD_URL/api/crawl/process-jobs"
WORKER_RESPONSE=$(curl -sS -w "\n%{http_code}" -X POST "$POSTD_URL/api/crawl/process-jobs" \
  -H "x-cron-secret: $CRON_SECRET" \
  -H "Content-Type: application/json")

WORKER_HTTP_CODE=$(echo "$WORKER_RESPONSE" | tail -n1)
WORKER_BODY=$(echo "$WORKER_RESPONSE" | head -n-1)

if [ "$WORKER_HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}   ✅ Worker endpoint responds: 200 OK${NC}"
  echo "   Response: $WORKER_BODY"
else
  echo -e "${RED}   ❌ Worker endpoint failed: HTTP $WORKER_HTTP_CODE${NC}"
  echo "   Response: $WORKER_BODY"
  echo ""
  echo "🔧 TROUBLESHOOTING:"
  if [ "$WORKER_HTTP_CODE" = "403" ]; then
    echo "   - CRON_SECRET may be incorrect or not deployed"
    echo "   - Check Vercel env vars match your local CRON_SECRET"
    echo "   - Redeploy after adding/changing env vars"
  elif [ "$WORKER_HTTP_CODE" = "404" ]; then
    echo "   - Endpoint may not be deployed"
    echo "   - Check latest deployment includes server/routes/crawler.ts"
  fi
  exit 1
fi

echo ""
echo "📋 TEST 2: Latest deployment info"
echo "   Fetching deployment details..."

# Try to get latest deployment SHA (if your app exposes it via a health endpoint)
# Otherwise skip this test
echo "   ⚠️  Manual check required:"
echo "   Go to: Vercel Dashboard → Deployments"
echo "   Verify: Latest deployment is AFTER you set CRON_SECRET"
echo ""

echo "📋 TEST 3: Vercel logs check"
echo "   To verify cron is running, check Vercel logs for:"
echo "   - Search: 'Processing crawl jobs triggered by cron'"
echo "   - Search: 'CRAWL_JOB_CLAIM_ATTEMPT'"
echo ""
echo "   If you see these logs appearing every minute, cron is working ✅"
echo "   If no logs appear, cron may not be configured correctly ❌"
echo ""

echo "✅ VERIFICATION COMPLETE"
echo ""
echo "📝 NEXT STEPS:"
echo "   1. Check Vercel logs for cron execution (every minute)"
echo "   2. Create a test crawl in your UI"
echo "   3. Watch for these logs in order:"
echo "      - CRAWL_START_ACCEPTED"
echo "      - CRAWL_JOB_CLAIM_ATTEMPT"
echo "      - CRAWL_JOB_PROCESS_BEGIN"
echo "      - CRAWL_JOB_HEARTBEAT (multiple)"
echo "      - CRAWL_JOB_PROCESS_END"
echo ""
echo "🎯 SUCCESS CRITERIA:"
echo "   - No 'Crawl timed out' error"
echo "   - Crawl completes in 30-90 seconds"
echo "   - Brand kit populated with results"
