# PHASE 3 Deployment Guide

## ✅ Completed Steps

### 1. ✅ Playwright Installation
**Status**: COMPLETE
```bash
pnpm exec playwright install chromium --with-deps
```
The Chromium binary is now available for website crawling.

### 2. ✅ Supabase CLI Installation
**Status**: COMPLETE
```bash
brew install supabase/tap/supabase
```
Supabase CLI (v2.54.11) is now installed and ready to use.

---

## ⏳ Remaining Steps (To Complete)

### Step 3: Configure Environment Variables

You need to update your `.env` file with your actual Supabase credentials. Replace the dummy values with your real project credentials.

**Location**: `/Users/krisfoust/Documents/Aligned-20ai/.env`

**Required Variables**:
```bash
# Supabase Configuration (REQUIRED - Get from https://app.supabase.com)
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-actual-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key

# OpenAI Configuration (REQUIRED for AI features)
OPENAI_API_KEY=sk-your-actual-openai-key

# Optional
ANTHROPIC_API_KEY=sk-ant-your-key-if-using-anthropic
```

**How to Get Your Credentials**:

1. **Supabase Project URL & Anon Key**:
   - Go to https://app.supabase.com
   - Select your project
   - Go to Settings → API
   - Copy: `Project URL` → `VITE_SUPABASE_URL`
   - Copy: `anon public` key → `VITE_SUPABASE_ANON_KEY`

2. **Supabase Service Role Key**:
   - Same location (Settings → API)
   - Copy: `service_role secret` → `SUPABASE_SERVICE_ROLE_KEY`
   - ⚠️ Keep this SECRET! Don't commit to git.

3. **OpenAI API Key**:
   - Go to https://platform.openai.com/account/api-keys
   - Create or copy existing key
   - Use: `sk-...` format

---

### Step 4: Deploy Supabase Migrations

Migrations enable pgvector and create necessary tables.

**Run**:
```bash
cd /Users/krisfoust/Documents/Aligned-20ai
supabase link --project-ref your-project-ref
supabase db push
```

**What it does**:
- Enables `pgvector` extension (vector embeddings)
- Creates `brand_embeddings` table
- Sets up RLS (Row Level Security) policies
- Creates vector similarity search function

**Expected Output**:
```
Linked to project your-project-ref
Pushing to branch main
✓ db.migrations.20250115_create_brand_embeddings.sql
✓ db.migrations.20250116_create_brand_kit_history.sql
✓ db.migrations.20250117_create_agent_safety_tables.sql
✓ db.migrations.20250118_create_content_calendar_tables.sql
✓ db.migrations.20250119_create_integrations_tables.sql
✓ db.migrations.20250120_create_dashboard_client_portal_tables.sql
```

---

### Step 5: Deploy Edge Function

The edge function processes brand intake asynchronously.

**Run**:
```bash
# First, link to your project (if not already done)
supabase link --project-ref your-project-ref

# Deploy the function
supabase functions deploy process-brand-intake

# Set the OPENAI_API_KEY secret for the function
supabase secrets set OPENAI_API_KEY=sk-your-actual-openai-key
```

**What it does**:
- Deploys function to `https://your-project-ref.functions.supabase.co/process-brand-intake`
- Crawls brand website
- Extracts colors and content
- Generates AI-powered brand summaries
- Creates vector embeddings for AI context

**Expected Output**:
```
✓ Deployed function process-brand-intake at
  https://your-project-ref.functions.supabase.co/process-brand-intake
✓ Set secret OPENAI_API_KEY
```

---

### Step 6: Create Public Storage Bucket

Create the `brand-assets` bucket for file storage.

**Option A: Via Supabase CLI**:
```bash
supabase buckets create brand-assets --public
```

**Option B: Via Supabase Dashboard** (if CLI doesn't support it):
1. Go to https://app.supabase.com
2. Select your project
3. Go to Storage → Buckets
4. Click "New Bucket"
5. Name: `brand-assets`
6. Make it PUBLIC (toggle on)
7. Create

**What it stores**:
- Brand logos
- Brand imagery
- Text references (PDFs, docs)
- Visual references
- Previous content samples

---

## Complete Deployment Checklist

```
[ ] Step 1: Playwright Installation ✅
[ ] Step 2: Supabase CLI Installation ✅
[ ] Step 3: Configure Environment Variables
    [ ] Get VITE_SUPABASE_URL from Supabase dashboard
    [ ] Get VITE_SUPABASE_ANON_KEY from Supabase dashboard
    [ ] Get SUPABASE_SERVICE_ROLE_KEY from Supabase dashboard
    [ ] Get OPENAI_API_KEY from OpenAI
    [ ] Update .env file with real credentials
[ ] Step 4: Deploy Supabase Migrations
    [ ] Run: supabase link --project-ref your-project-ref
    [ ] Run: supabase db push
    [ ] Verify all migrations succeeded
[ ] Step 5: Deploy Edge Function
    [ ] Run: supabase functions deploy process-brand-intake
    [ ] Run: supabase secrets set OPENAI_API_KEY=sk-...
[ ] Step 6: Create Storage Bucket
    [ ] Run: supabase buckets create brand-assets --public
    [ ] Or create via Supabase dashboard
```

---

## Verification Checklist

After completing all steps, verify everything works:

### Test 1: Database Access
```bash
# Check if pgvector is enabled
supabase db remote info
```
Should show vector extension listed.

### Test 2: Edge Function
```bash
# Test the function
curl -X POST https://your-project-ref.functions.supabase.co/process-brand-intake \
  -H "Authorization: Bearer your-anon-key" \
  -H "Content-Type: application/json" \
  -d '{
    "brandId": "test-brand-id",
    "websiteUrl": "https://example.com"
  }'
```

### Test 3: Storage Bucket
Go to Supabase Dashboard → Storage and verify `brand-assets` bucket exists and is public.

### Test 4: Application Test
1. Start the development server: `pnpm dev`
2. Navigate to `/brands`
3. Create a new brand
4. Fill in brand intake form
5. Click "Import from Website" (tests crawler)
6. Upload files (tests storage bucket)
7. Submit (tests edge function)

---

## Troubleshooting

### Error: "pgvector not available"
**Solution**: Make sure migration ran successfully with `supabase db push`

### Error: "OPENAI_API_KEY not found"
**Solution**: Set edge function secret:
```bash
supabase secrets set OPENAI_API_KEY=sk-your-key
```

### Error: "Storage bucket not found"
**Solution**: Create bucket:
```bash
supabase buckets create brand-assets --public
```

### Error: "Supabase credentials invalid"
**Solution**: Check `.env` file has correct values from dashboard

### Playwright timeout during crawl
**Solution**: Increase timeout in `.env`:
```bash
CRAWL_TIMEOUT_MS=60000  # 60 seconds instead of 30
```

---

## Next Steps After Deployment

Once PHASE 3 is deployed and working:

1. **Test the intake form** end-to-end
2. **Verify embeddings** are being created in database
3. **Test file uploads** with various file sizes
4. **Review crawler output** for accuracy
5. **Proceed to PHASE 4** - AI Agent implementation

---

## Support

If you encounter issues:

1. Check logs in Supabase Dashboard → Edge Functions
2. Review error messages in browser console
3. Check `.env` file has all required values
4. Verify Supabase project is active and accessible
5. Make sure OpenAI key is valid

---

**Last Updated**: November 4, 2025
**Status**: Ready for deployment
