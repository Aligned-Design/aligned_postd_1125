#!/bin/bash

# PHASE 3 Deployment Script
# This script deploys all PHASE 3 infrastructure to Supabase

set -e

echo "🚀 PHASE 3 Deployment Script"
echo "================================"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found${NC}"
    echo "Please copy .env.example to .env and fill in your credentials"
    exit 1
fi

# Load environment variables
export $(cat .env | xargs)

# Verify required variables
check_env() {
    local var=$1
    local value=$(eval echo \$$var)
    if [ -z "$value" ] || [ "$value" = "dummy-"* ]; then
        echo -e "${RED}❌ $var is not set or contains dummy value${NC}"
        return 1
    fi
    echo -e "${GREEN}✅ $var is set${NC}"
    return 0
}

echo ""
echo "📋 Checking environment variables..."
check_env "VITE_SUPABASE_URL" || exit 1
check_env "VITE_SUPABASE_ANON_KEY" || exit 1
check_env "SUPABASE_SERVICE_ROLE_KEY" || exit 1
check_env "OPENAI_API_KEY" || exit 1

# Extract project ref from URL
PROJECT_REF=$(echo $VITE_SUPABASE_URL | sed 's/https:\/\/\(.*\)\.supabase\.co/\1/')

echo ""
echo "📦 Project Reference: $PROJECT_REF"

# Step 1: Link to project
echo ""
echo "📡 Step 1/3: Linking to Supabase project..."
supabase link --project-ref $PROJECT_REF || {
    echo -e "${YELLOW}⚠️  Project already linked${NC}"
}

# Step 2: Deploy migrations
echo ""
echo "📊 Step 2/3: Deploying database migrations..."
if supabase db push; then
    echo -e "${GREEN}✅ Migrations deployed successfully${NC}"
else
    echo -e "${RED}❌ Failed to deploy migrations${NC}"
    exit 1
fi

# Step 3: Deploy edge function
echo ""
echo "⚡ Step 3/3: Deploying edge function..."
if supabase functions deploy process-brand-intake; then
    echo -e "${GREEN}✅ Edge function deployed successfully${NC}"
else
    echo -e "${RED}❌ Failed to deploy edge function${NC}"
    exit 1
fi

# Step 4: Set secrets for edge function
echo ""
echo "🔐 Setting edge function secrets..."
if supabase secrets set OPENAI_API_KEY=$OPENAI_API_KEY; then
    echo -e "${GREEN}✅ Secrets set successfully${NC}"
else
    echo -e "${RED}❌ Failed to set secrets${NC}"
    exit 1
fi

# Step 5: Create storage bucket
echo ""
echo "🪣 Creating storage bucket..."
if supabase buckets create brand-assets --public 2>/dev/null || [ $? -eq 2 ]; then
    echo -e "${GREEN}✅ Storage bucket ready${NC}"
else
    echo -e "${YELLOW}⚠️  Bucket might already exist - check dashboard${NC}"
fi

echo ""
echo -e "${GREEN}✅ PHASE 3 Deployment Complete!${NC}"
echo ""
echo "📝 Next steps:"
echo "1. Verify storage bucket 'brand-assets' exists (public) in Supabase dashboard"
echo "2. Run 'pnpm dev' to start development server"
echo "3. Test brand intake form by creating a new brand"
echo "4. Submit brand intake to test crawler and AI generation"
echo ""
