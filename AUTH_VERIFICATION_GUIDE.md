# Auth Verification Guide

## Current Status

**ISSUE**: Signup is not creating real users in Supabase Auth.

## Root Cause Analysis

1. **Environment Variables**: ⚠️ **KEYS ARE SWAPPED** in `.env` file
   - `SUPABASE_URL=https://nsrlgwimixkgwlqrpbxq.supabase.co` ✅
   - `VITE_SUPABASE_ANON_KEY` = **SERVICE_ROLE key** ❌ WRONG (should be anon key)
   - `SUPABASE_SERVICE_ROLE_KEY` = **ANON key** ❌ WRONG (should be service_role key)
   
   **FIX REQUIRED**: Swap the keys - see `FIX_SUPABASE_KEYS.md`

2. **Supabase Client**: Using service role key (correct for server-side)
   - Location: `server/lib/supabase.ts`
   - Initialized with: `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`

3. **Auth Implementation**: 
   - ✅ Using `supabase.auth.admin.createUser()` for signup (correct for service role)
   - ✅ Using `supabase.auth.signInWithPassword()` for login (should work)
   - ✅ Auto-confirming email with `email_confirm: true`

## Verification Steps

### Step 1: Check Environment Variables in Vercel

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Verify these are set:
   - `SUPABASE_URL` or `VITE_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. If missing, add them from your Supabase project:
   - Supabase Dashboard → Settings → API
   - Copy "Project URL" → `SUPABASE_URL`
   - Copy "service_role" key → `SUPABASE_SERVICE_ROLE_KEY`

### Step 2: Test Supabase Connection

Visit: `GET /api/auth/diagnostics` (only in dev/staging)

This will show:
- Environment variable status
- Database connection test
- Auth service availability
- Recommendations

### Step 3: Check Supabase Project Status

1. Go to https://app.supabase.com
2. Select project: `nsrlgwimixkgwlqrpbxq`
3. Check:
   - Project is active (not paused)
   - Auth is enabled (Settings → Authentication)
   - Email confirmation setting (Settings → Authentication → Email Auth)

### Step 4: Check Email Confirmation Setting

**CRITICAL**: If "Confirm email" is enabled in Supabase:
- Users won't appear in Auth → Users until they confirm
- Solution: Either disable email confirmation OR use auto-confirm (already implemented)

To disable:
1. Supabase Dashboard → Authentication → Settings → Email Auth
2. Toggle OFF "Confirm email"
3. Save

### Step 5: Test Signup Flow

1. Sign up with a test email
2. Check server logs for:
   - `[Auth] Attempting signup` - shows env vars status
   - `[Auth] ✅ User created in Supabase Auth` - confirms user creation
   - `[Auth] Signup complete` - shows userId and tenantId
3. Check Supabase Dashboard → Authentication → Users
4. User should appear immediately (if email confirmation is disabled)

## Common Issues & Fixes

### Issue 1: Environment Variables Not Set in Vercel
**Symptom**: Signup fails with "Database connection not configured"
**Fix**: Add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to Vercel environment variables

### Issue 2: Email Confirmation Enabled
**Symptom**: User created but doesn't appear in Auth → Users
**Fix**: Disable email confirmation OR wait for email confirmation (auto-confirm is implemented)

### Issue 3: Wrong Supabase Project
**Symptom**: Connection fails or wrong data
**Fix**: Verify `SUPABASE_URL` matches your project URL

### Issue 4: Service Role Key Invalid
**Symptom**: Auth operations fail with 401/403
**Fix**: Regenerate service role key in Supabase Dashboard → Settings → API

## Implementation Details

### Signup Flow (POST /api/auth/signup)
1. Validates email/password
2. Creates user via `supabase.auth.admin.createUser()` (service role)
3. Auto-confirms email (`email_confirm: true`)
4. Creates user profile in `user_profiles` table
5. Sets tenantId = userId (1:1 for now)
6. Stores tenantId in user metadata
7. Generates JWT tokens with tenantId
8. Returns user + tokens

### Login Flow (POST /api/auth/login)
1. Authenticates via `supabase.auth.signInWithPassword()`
2. Retrieves tenantId from user metadata
3. Gets user's brands
4. Generates JWT tokens with tenantId
5. Returns user + tokens

### ID Consistency
- **tenantId**: Stored in user metadata, included in JWT, used throughout system
- **brandId**: Created with tenantId, scraped images use tenantId
- **Logging**: All operations log tenantId for traceability

## Next Steps

1. ✅ Verify environment variables in Vercel
2. ✅ Test signup and check Supabase Dashboard
3. ✅ Verify user appears in Auth → Users
4. ✅ Test login with created user
5. ✅ Verify tenantId is consistent across operations
6. ✅ Test crawler with real user/brand
7. ✅ Verify scraped images appear in Brand Guide/Creative Studio

