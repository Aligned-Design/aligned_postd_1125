# Fix Supabase Keys - CRITICAL

## 🚨 Issue Found

Your Supabase keys are **SWAPPED** in `.env`:

- `VITE_SUPABASE_ANON_KEY` currently has the **SERVICE_ROLE** key (wrong!)
- `SUPABASE_SERVICE_ROLE_KEY` currently has the **ANON** key (wrong!)

This is why signup isn't creating users - the server is trying to use the anon key as a service role key.

## ✅ Fix Instructions

### Step 1: Get Correct Keys from Supabase

1. Go to https://app.supabase.com
2. Select your project: `nsrlgwimixkgwlqrpbxq`
3. Go to **Settings → API**
4. Copy these values:

**Project URL:**
```
https://nsrlgwimixkgwlqrpbxq.supabase.co
```

**anon/public key** (for `VITE_SUPABASE_ANON_KEY`):
- Look for the key that says "anon" or "public"
- Should have `"role":"anon"` when decoded

**service_role key** (for `SUPABASE_SERVICE_ROLE_KEY`):
- Look for the key that says "service_role" (⚠️ SECRET - never expose)
- Should have `"role":"service_role"` when decoded
- ⚠️ **Keep this secret!** Never commit to git or expose in client code

### Step 2: Update .env File

**Option A: Use the automated script** (recommended):
```bash
./scripts/fix-supabase-keys.sh
```

**Option B: Manual fix** - Open `.env` and swap these values:

**Current (WRONG):**
```bash
VITE_SUPABASE_ANON_KEY= [currently has SERVICE_ROLE key] ❌
SUPABASE_SERVICE_ROLE_KEY= [currently has ANON key] ❌
```

**Should be (CORRECT):**
```bash
# ✅ CORRECT: Anon key (public, safe for client) - currently in SUPABASE_SERVICE_ROLE_KEY
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zcmxnd2ltaXhrZ3dscXJwYnhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3Mjg2MjgsImV4cCI6MjA3ODMwNDYyOH0.IhJZgjZGtLm4OxSWiWvbLjHdnT6iXIFWNTUsHBVfL8w

# ✅ CORRECT: Service role key (SECRET, server-only) - currently in VITE_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zcmxnd2ltaXhrZ3dscXJwYnhxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjcyODYyOCwiZXhwIjoyMDc4MzA0NjI4fQ.JMBNj9TC-wEGWDsuXbHO9KFzNuihtZU0cAeEIy_plwg
```

**Quick fix**: Just swap the two values - take what's in `VITE_SUPABASE_ANON_KEY` and put it in `SUPABASE_SERVICE_ROLE_KEY`, and vice versa.

### Step 3: Verify Keys Are Correct

You can verify by decoding the JWT tokens:

1. Go to https://jwt.io
2. Paste each key
3. Check the `"role"` field in the payload:
   - `VITE_SUPABASE_ANON_KEY` should show `"role":"anon"`
   - `SUPABASE_SERVICE_ROLE_KEY` should show `"role":"service_role"`

### Step 4: Update Vercel Environment Variables

**CRITICAL**: Also update these in Vercel:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Update:
   - `VITE_SUPABASE_ANON_KEY` → Use the **anon** key from Supabase
   - `SUPABASE_SERVICE_ROLE_KEY` → Use the **service_role** key from Supabase
   - `SUPABASE_URL` → `https://nsrlgwimixkgwlqrpbxq.supabase.co`
   - `VITE_SUPABASE_URL` → `https://nsrlgwimixkgwlqrpbxq.supabase.co`

3. **Redeploy** after updating environment variables

### Step 5: Test

After fixing:

1. Restart your dev server
2. Try signing up with a test email
3. Check Supabase Dashboard → Authentication → Users
4. User should appear immediately

## Current Configuration (WRONG - needs fixing)

```
VITE_SUPABASE_ANON_KEY= [SERVICE_ROLE KEY] ❌ WRONG
SUPABASE_SERVICE_ROLE_KEY= [ANON KEY] ❌ WRONG
```

## Correct Configuration

```
VITE_SUPABASE_ANON_KEY= [ANON KEY] ✅
SUPABASE_SERVICE_ROLE_KEY= [SERVICE_ROLE KEY] ✅
```

