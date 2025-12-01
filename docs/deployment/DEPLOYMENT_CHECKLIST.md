# PHASE 3 Deployment Checklist

## ✅ What's Ready (All Completed)

### Code Enhancements
- [x] File upload progress tracking (`client/lib/fileUpload.ts`)
- [x] Brand intake form improvements (`client/pages/BrandIntake.tsx`)
- [x] Crawler retry logic (`server/workers/brand-crawler.ts`)
- [x] Edge function Deno compatibility (`supabase/functions/process-brand-intake/index.ts`)
- [x] Form validation and errors

### Infrastructure & Tools
- [x] Playwright chromium binary installed
- [x] Supabase CLI installed (v2.54.11)
- [x] Database migrations ready (6 migration files)
- [x] Edge function prepared

### Documentation
- [x] `DEPLOYMENT_QUICKSTART.md` - 3-step guide
- [x] `DEPLOYMENT_GUIDE.md` - Detailed instructions
- [x] `PHASE3_DEPLOYMENT_SUMMARY.md` - Technical overview
- [x] `scripts/deploy.sh` - Automated deployment script
- [x] This checklist

---

## ⏳ What You Need to Do

### Before Deployment
- [ ] Create/access Supabase account at https://app.supabase.com
- [ ] Create/access OpenAI account at https://platform.openai.com
- [ ] Have admin access to your Supabase project

### Step 1: Gather Credentials
**Location**: Supabase Dashboard → Your Project → Settings → API

- [ ] Copy `Project URL`
  ```
  https://[PROJECT-REF].supabase.co
  ```

- [ ] Copy `anon public` key
  ```
  eyJ0eXAi...
  ```

- [ ] Copy `service_role secret` key
  ```
  eyJ0eXAi...
  ```

**Location**: OpenAI Dashboard → API Keys

- [ ] Copy OpenAI API Key
  ```
  sk-proj-...
  ```

### Step 2: Update Environment Variables
**File**: `/Users/krisfoust/Downloads/Aligned-20ai.posted/.env`

- [ ] Update `VITE_SUPABASE_URL`
- [ ] Update `VITE_SUPABASE_ANON_KEY`
- [ ] Update `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Update `OPENAI_API_KEY`

**Verify** (should NOT contain dummy values):
```bash
grep -E "dummy|test-key|xyz" .env
```
(Should return nothing if all values are real)

### Step 3: Run Deployment Script
```bash
cd /Users/krisfoust/Documents/Aligned-20ai
bash scripts/deploy.sh
```

During script execution:
- [ ] Validates environment variables
- [ ] Links to your Supabase project
- [ ] Deploys database migrations
- [ ] Deploys edge function
- [ ] Sets function secrets
- [ ] Creates storage bucket

### Step 4: Verify Deployment
**In Supabase Dashboard**:

- [ ] Check **Storage** → Verify `brand-assets` bucket exists and is public
- [ ] Check **Functions** → Verify `process-brand-intake` is deployed
- [ ] Check **SQL Editor** → Run `SELECT COUNT(*) FROM brand_embeddings;`
  (Should not error, table exists)

**In Terminal**:
```bash
cd /Users/krisfoust/Documents/Aligned-20ai
pnpm dev
```

- [ ] Development server starts without errors
- [ ] Can navigate to http://localhost:5173/brands
- [ ] Can create a new brand

**In Browser** (http://localhost:5173):

- [ ] Navigate to `/brands`
- [ ] Click "Create Brand" button
- [ ] Fill in brand basics (name, website URL)
- [ ] Click "Import from Website" button
- [ ] Wait for process to complete
- [ ] See imported colors and data
- [ ] Upload some files
- [ ] See file upload progress
- [ ] Submit form successfully

---

## 📋 Files Modified/Created

### Modified Files
```
✏️  client/lib/fileUpload.ts
    - Added progress callbacks
    - Enhanced error handling

✏️  client/pages/BrandIntake.tsx
    - Added upload progress display
    - Added duplicate prevention
    - Added progress indicator

✏️  server/workers/brand-crawler.ts
    - Added retry logic with exponential backoff
    - Added timeout protection
    - Improved error recovery

✏️  supabase/functions/process-brand-intake/index.ts
    - Fixed Deno compatibility
    - Added fallback generation
```

### New Files Created
```
📄 DEPLOYMENT_QUICKSTART.md
   └─ Quick 3-step deployment guide

📄 DEPLOYMENT_GUIDE.md
   └─ Detailed step-by-step instructions

📄 PHASE3_DEPLOYMENT_SUMMARY.md
   └─ Complete technical overview

📄 DEPLOYMENT_CHECKLIST.md
   └─ This file

📁 scripts/
   └─ deploy.sh (executable)
      └─ Automated deployment script
```

---

## 🎯 Success Criteria

✅ All checks below should pass after deployment:

### Database
- [ ] `pgvector` extension is enabled
- [ ] `brand_embeddings` table exists
- [ ] RLS policies are enforced
- [ ] Vector search function works

### Edge Function
- [ ] Function is deployed
- [ ] Function endpoint is accessible
- [ ] OpenAI secret is set

### Storage
- [ ] `brand-assets` bucket exists
- [ ] Bucket is public (can list/read)
- [ ] Upload permissions work

### Application
- [ ] Brand intake form works
- [ ] File uploads show progress
- [ ] Duplicate prevention works
- [ ] Auto-save works (every 5 seconds)
- [ ] Error messages display properly

---

## 📞 Support

### If deployment fails:
1. Check `.env` file has real values (no "dummy" or "test-key")
2. Verify Supabase project is active and accessible
3. Check internet connection
4. Review `DEPLOYMENT_GUIDE.md` troubleshooting section

### If script says "command not found":
```bash
# Make deploy.sh executable
chmod +x scripts/deploy.sh

# Try again
bash scripts/deploy.sh
```

### If Supabase link fails:
```bash
# Manual link with your project reference
supabase link --project-ref your-project-ref

# Then run script
bash scripts/deploy.sh
```

---

## 📊 Estimated Timeline

| Step | Duration | Task |
|------|----------|------|
| 1 | 5 min | Gather credentials |
| 2 | 2 min | Update .env file |
| 3 | 3 min | Run deployment script |
| 4 | 5 min | Verify deployment |
| **Total** | **~15 min** | **End-to-end deployment** |

---

## 🎉 What's Next After Deployment

### Immediately Available
- ✅ Brand intake form (34 fields, 6 sections)
- ✅ Auto-save (every 5 seconds)
- ✅ File uploads with progress tracking
- ✅ Duplicate brand prevention
- ✅ Website crawler (with retries)
- ✅ AI brand summaries

### Soon (PHASE 4)
- ⏳ Doc Agent (document generation)
- ⏳ Design Agent (visual generation)
- ⏳ Advisor Agent (strategic guidance)
- ⏳ Content generation workflows
- ⏳ Approval workflows

---

## Last Deployment

- **Date**: November 4, 2025
- **Status**: Ready for User Deployment
- **All Code**: Tested and Verified
- **Documentation**: Complete

---

**You're all set! Follow the 3 steps above to go live. 🚀**
