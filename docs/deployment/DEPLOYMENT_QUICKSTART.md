# PHASE 3 Deployment - Quick Start (10 minutes)

## ✅ What's Already Done

1. ✅ Playwright installed (`pnpm exec playwright install chromium --with-deps`)
2. ✅ Supabase CLI installed (`brew install supabase/tap/supabase`)
3. ✅ Code enhancements completed (progress tracking, duplicate prevention, retry logic)
4. ✅ Edge function fixed for Deno environment
5. ✅ Automated deployment script created

---

## 🚀 3 Steps to Deploy

### STEP 1: Gather Your Credentials (5 minutes)

**Get from Supabase** (https://app.supabase.com):
1. Click your project name
2. Settings → API
3. Copy these THREE values:
   - `Project URL` → Put in `.env` as `VITE_SUPABASE_URL`
   - `anon public` key → Put in `.env` as `VITE_SUPABASE_ANON_KEY`
   - `service_role secret` → Put in `.env` as `SUPABASE_SERVICE_ROLE_KEY`

**Get from OpenAI** (https://platform.openai.com/account/api-keys):
1. Click "Create new secret key" (or copy existing)
2. Copy the key (starts with `sk-proj-` or `sk-`)
3. Put in `.env` as `OPENAI_API_KEY`

---

### STEP 2: Update .env File (2 minutes)

**Edit**: `vim /Users/krisfoust/Documents/Aligned-20ai/.env`

**Replace these dummy values** with your real credentials:

```bash
# Before:
VITE_SUPABASE_URL=https://dummy-project.supabase.co
VITE_SUPABASE_ANON_KEY=dummy-anon-key
SUPABASE_SERVICE_ROLE_KEY=dummy-service-role-key-for-testing
OPENAI_API_KEY=sk-test-key-for-development-testing-only

# After:
VITE_SUPABASE_URL=https://xyz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ0eXAiOi...
SUPABASE_SERVICE_ROLE_KEY=eyJ0eXAiOi...
OPENAI_API_KEY=sk-proj-abc123...
```

---

### STEP 3: Run Deployment Script (3 minutes)

```bash
cd /Users/krisfoust/Documents/Aligned-20ai
bash scripts/deploy.sh
```

**The script will**:
- ✓ Validate your credentials
- ✓ Link to your Supabase project
- ✓ Deploy database migrations
- ✓ Deploy edge function
- ✓ Create storage bucket

**You'll see**:
```
🚀 PHASE 3 Deployment Script
✅ VITE_SUPABASE_URL is set
✅ VITE_SUPABASE_ANON_KEY is set
✅ SUPABASE_SERVICE_ROLE_KEY is set
✅ OPENAI_API_KEY is set

📡 Linking to Supabase project...
✅ Linked

📊 Deploying database migrations...
✅ Migrations deployed successfully

⚡ Deploying edge function...
✅ Edge function deployed successfully

✅ PHASE 3 Deployment Complete!
```

---

## ✅ That's It!

After the script completes, PHASE 3 is live. Here's what you can now do:

### Test in Browser
```bash
pnpm dev
```
Open http://localhost:5173/brands → Create Brand → Fill intake form

### Test Features
1. **File Upload Progress** - Upload multiple files, see progress bar
2. **Duplicate Prevention** - Try creating brand with same website
3. **Crawler** - Click "Import from Website" button
4. **Auto-save** - Watch "Saved 2s ago" indicator

---

## 📚 Documentation

- **DEPLOYMENT_GUIDE.md** - Detailed step-by-step with troubleshooting
- **PHASE3_DEPLOYMENT_SUMMARY.md** - Complete technical overview
- **scripts/deploy.sh** - Automated deployment script (executable)

---

## ⚠️ Troubleshooting

### "VITE_SUPABASE_URL is not set"
Your .env file doesn't have real credentials. Replace dummy values.

### "Failed to deploy edge function"
Make sure you:
1. Have valid Supabase credentials in .env
2. Have internet connection
3. Account has permission to deploy functions

### "Bucket already exists"
This is fine! The script will detect it and continue.

---

## Next Steps

After PHASE 3 deployment:
- ✅ Brand intake form is fully operational
- ✅ Website crawler and AI summaries work
- ✅ File uploads with progress tracking
- ✅ Duplicate prevention active
- ⏳ Ready for PHASE 4 (AI Agents)

---

**Estimated Time**: 10 minutes
**Difficulty**: Easy
**Prerequisites**: Supabase account + OpenAI account
