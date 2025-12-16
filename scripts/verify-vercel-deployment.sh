#!/bin/bash
# Verify Vercel Deployment - GPT-5 Fix
# Run this script to check if the fix is deployed

set -e

echo "═══════════════════════════════════════════════════════════"
echo "  Vercel GPT-5 Fix Verification"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Expected SHA
EXPECTED_SHA="6ab4f857821f232fb1d7799e8787009a2fd5d875"
EXPECTED_SHORT="6ab4f85"

# Check local SHA
echo "📍 Local Repository SHA:"
LOCAL_SHA=$(git rev-parse HEAD)
LOCAL_SHORT=$(git rev-parse --short HEAD)
echo "   Full:  $LOCAL_SHA"
echo "   Short: $LOCAL_SHORT"
echo ""

if [ "$LOCAL_SHA" = "$EXPECTED_SHA" ]; then
  echo "   ✅ Local matches expected SHA"
else
  echo "   ⚠️  Local SHA doesn't match expected"
  echo "   Expected: $EXPECTED_SHA"
fi
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
  echo "❌ Vercel CLI not installed"
  echo ""
  echo "Install with: npm i -g vercel"
  echo "Then run: vercel login"
  echo ""
  echo "OR check manually at: https://vercel.com"
  exit 1
fi

echo "🔍 Checking Vercel deployments..."
echo ""

# Get latest deployment
LATEST=$(vercel ls --json 2>/dev/null | head -1)

if [ -z "$LATEST" ]; then
  echo "❌ Could not get Vercel deployments"
  echo ""
  echo "Try: vercel login"
  echo "Or check manually at: https://vercel.com"
  exit 1
fi

# Parse deployment info (requires jq)
if command -v jq &> /dev/null; then
  DEPLOY_URL=$(echo "$LATEST" | jq -r '.url')
  DEPLOY_STATE=$(echo "$LATEST" | jq -r '.state')
  
  echo "📦 Latest Deployment:"
  echo "   URL:   $DEPLOY_URL"
  echo "   State: $DEPLOY_STATE"
  echo ""
  
  echo "⚠️  Note: Vercel CLI doesn't show commit SHA in list"
  echo "   Check dashboard manually: https://vercel.com"
else
  echo "⚠️  jq not installed (optional)"
  echo "   Install for better output: brew install jq"
fi

echo ""
echo "───────────────────────────────────────────────────────────"
echo ""
echo "📋 MANUAL VERIFICATION STEPS:"
echo ""
echo "1️⃣  Check Vercel SHA:"
echo "   → https://vercel.com/[your-project]/deployments"
echo "   → Click latest deployment → Check 'Source' section"
echo "   → Should show: $EXPECTED_SHORT"
echo ""
echo "2️⃣  Check Logs:"
echo "   → Same deployment page → Click 'Logs' tab"
echo "   → Filter for: OPENAI_PAYLOAD_PROOF"
echo "   → Trigger a brand kit generation in UI"
echo "   → Verify gpt-5-mini shows:"
echo "      hasPresencePenalty: false"
echo "      hasFrequencyPenalty: false"
echo "      hasTemperature: false"
echo ""
echo "3️⃣  Search for Old Errors (should be ZERO):"
echo "   → Filter for: \"presence_penalty is not supported\""
echo ""
echo "═══════════════════════════════════════════════════════════"

