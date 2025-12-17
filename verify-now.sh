#!/bin/bash
# Production Verification for postd-delta.vercel.app

export POSTD_URL="https://postd-delta.vercel.app"
export CRON_SECRET="wl9aI/kb7MXE7vF3TfM1heF9WhLfGAxwmx07voAuV0E="

echo "🔍 Testing Production Crawler on postd-delta.vercel.app"
echo "========================================================"
echo ""

echo "📋 Testing worker endpoint..."
RESPONSE=$(curl -sS -w "\n%{http_code}" -X POST "$POSTD_URL/api/crawl/process-jobs" \
  -H "x-cron-secret: $CRON_SECRET" \
  -H "Content-Type: application/json")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ SUCCESS! Worker endpoint responds correctly"
  echo "   Response: $BODY"
  echo ""
  echo "🎉 YOUR CRAWLER IS READY!"
  echo ""
  echo "Next steps:"
  echo "1. Go to: https://postd-delta.vercel.app"
  echo "2. Create a test brand with website: https://stripe.com"
  echo "3. Run the onboarding scrape"
  echo "4. Should complete in 30-90 seconds (no timeout!)"
  echo ""
  echo "To verify cron is running:"
  echo "- Vercel Dashboard → Logs"
  echo "- Search: 'Processing crawl jobs triggered by cron'"
  echo "- Should appear every minute"
else
  echo "❌ FAILED: HTTP $HTTP_CODE"
  echo "   Response: $BODY"
  echo ""
  if [ "$HTTP_CODE" = "403" ]; then
    echo "🔧 FIX: Redeploy to pick up CRON_SECRET"
    echo "   1. Go to: Vercel Dashboard → Deployments"
    echo "   2. Click 'Redeploy' on latest deployment"
    echo "   3. Wait for deployment to finish"
    echo "   4. Re-run this script"
  elif [ "$HTTP_CODE" = "404" ]; then
    echo "🔧 FIX: Endpoint not found"
    echo "   - Check latest deployment includes server/routes/crawler.ts"
    echo "   - Verify build succeeded"
  fi
fi
