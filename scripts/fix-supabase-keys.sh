#!/bin/bash
# Fix Supabase Keys Script
# Swaps the incorrectly placed keys in .env file

echo "🔧 Fixing Supabase Keys in .env file..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
  echo "❌ .env file not found!"
  exit 1
fi

# Backup .env
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
echo "✅ Created backup: .env.backup.*"

# Read current values
CURRENT_ANON=$(grep "^VITE_SUPABASE_ANON_KEY=" .env | cut -d'=' -f2- | sed 's/^[[:space:]]*//')
CURRENT_SERVICE=$(grep "^SUPABASE_SERVICE_ROLE_KEY=" .env | cut -d'=' -f2- | sed 's/^[[:space:]]*//')

if [ -z "$CURRENT_ANON" ] || [ -z "$CURRENT_SERVICE" ]; then
  echo "❌ Could not find keys in .env file"
  exit 1
fi

echo "Current VITE_SUPABASE_ANON_KEY (first 50 chars): ${CURRENT_ANON:0:50}..."
echo "Current SUPABASE_SERVICE_ROLE_KEY (first 50 chars): ${CURRENT_SERVICE:0:50}..."
echo ""

# Swap the keys
echo "🔄 Swapping keys..."

# Escape special characters for sed
CURRENT_ANON_ESC=$(echo "$CURRENT_ANON" | sed 's/[[\.*^$()+?{|]/\\&/g')
CURRENT_SERVICE_ESC=$(echo "$CURRENT_SERVICE" | sed 's/[[\.*^$()+?{|]/\\&/g')

# Use sed to swap (works on macOS and Linux)
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  sed -i '' "s|^VITE_SUPABASE_ANON_KEY=.*|VITE_SUPABASE_ANON_KEY=$CURRENT_SERVICE_ESC|" .env
  sed -i '' "s|^SUPABASE_SERVICE_ROLE_KEY=.*|SUPABASE_SERVICE_ROLE_KEY=$CURRENT_ANON_ESC|" .env
else
  # Linux
  sed -i "s|^VITE_SUPABASE_ANON_KEY=.*|VITE_SUPABASE_ANON_KEY=$CURRENT_SERVICE_ESC|" .env
  sed -i "s|^SUPABASE_SERVICE_ROLE_KEY=.*|SUPABASE_SERVICE_ROLE_KEY=$CURRENT_ANON_ESC|" .env
fi

echo "✅ Keys swapped!"
echo ""
echo "⚠️  IMPORTANT: Verify the keys are correct:"
echo "   1. VITE_SUPABASE_ANON_KEY should have role='anon'"
echo "   2. SUPABASE_SERVICE_ROLE_KEY should have role='service_role'"
echo ""
echo "   You can verify at https://jwt.io by decoding the tokens"
echo ""
echo "✅ Done! Restart your dev server to apply changes."

