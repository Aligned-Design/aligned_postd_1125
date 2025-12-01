# POSTD UI Smoke Test Checklist

This document provides a comprehensive checklist for verifying POSTD's UI functionality after seeding minimal data.

## Prerequisites

- ✅ Supabase smoke test passed (both clients working)
- ✅ Minimal data seeded (`tsx scripts/seed-minimal-postd.ts`)
- ✅ Seed verification passed (`tsx scripts/verify-postd-seed.ts`)
- ✅ Auth user UUID and email available

---

## 1. Local App Smoke Test

### 1.1 Start Development Server

```bash
pnpm dev
```

**Expected:**
- Server starts on port 8080 (or configured port)
- No startup errors
- Both client and server compile successfully

**Check:**
- [ ] Server starts without errors
- [ ] Console shows "Server running on port XXXX"
- [ ] No TypeScript compilation errors

---

### 1.2 Authentication Test

**Steps:**
1. Navigate to `http://localhost:8080` (or your configured port)
2. Log in using the seeded auth user credentials

**Expected:**
- Login page loads
- Authentication succeeds
- User is redirected to dashboard

**Check:**
- [ ] Login page is accessible
- [ ] Can authenticate with seeded user
- [ ] Redirect to dashboard after login
- [ ] No authentication errors in console

---

### 1.3 Dashboard Load Test

**Steps:**
1. After login, verify dashboard loads
2. Check browser console for errors

**Expected:**
- Dashboard renders completely
- No RLS (Row Level Security) errors
- No PostgREST errors
- Brand selector visible

**Check:**
- [ ] Dashboard page loads
- [ ] No console errors (RLS, PostgREST, or other)
- [ ] Brand selector component visible
- [ ] Brand selector shows "Aligned by Design"

---

### 1.4 Brand Selector Verification

**Steps:**
1. Locate brand selector in UI (typically in top navigation)
2. Verify it displays the seeded brand

**Expected:**
- Brand selector dropdown/component visible
- Shows "Aligned by Design" as available brand
- Can select the brand

**Check:**
- [ ] Brand selector is visible
- [ ] Shows "Aligned by Design"
- [ ] Can interact with brand selector
- [ ] No errors when selecting brand

---

### 1.5 Navigation Tests

Navigate to each of the following pages and verify they load without errors:

#### A. Brand Guide

**Steps:**
1. Navigate to Brand Guide page
2. Check console for errors

**Expected:**
- Brand Guide page loads
- No RLS errors
- Content displays correctly

**Check:**
- [ ] Brand Guide page accessible
- [ ] Page renders without errors
- [ ] No RLS errors in console
- [ ] No PostgREST errors

#### B. Campaigns

**Steps:**
1. Navigate to Campaigns page
2. Check console for errors

**Expected:**
- Campaigns page loads
- No RLS errors
- List/table displays (may be empty)

**Check:**
- [ ] Campaigns page accessible
- [ ] Page renders without errors
- [ ] No RLS errors in console
- [ ] No PostgREST errors

#### C. Content Queue

**Steps:**
1. Navigate to Content Queue page
2. Check console for errors

**Expected:**
- Content Queue page loads
- No RLS errors
- Queue displays (may be empty)

**Check:**
- [ ] Content Queue page accessible
- [ ] Page renders without errors
- [ ] No RLS errors in console
- [ ] No PostgREST errors

#### D. Creative Studio

**Steps:**
1. Navigate to Creative Studio page
2. Check console for errors

**Expected:**
- Creative Studio page loads
- No RLS errors
- Studio interface displays

**Check:**
- [ ] Creative Studio page accessible
- [ ] Page renders without errors
- [ ] No RLS errors in console
- [ ] No PostgREST errors

---

### 1.6 Console Error Check

**Steps:**
1. Open browser DevTools (F12)
2. Navigate through all pages
3. Check Console tab for errors

**Expected:**
- No RLS policy violations
- No PostgREST 401/403 errors
- No authentication errors
- No network errors (except expected 404s for missing resources)

**Check:**
- [ ] No RLS errors
- [ ] No PostgREST errors
- [ ] No authentication errors
- [ ] No critical JavaScript errors

---

## 2. Vercel Smoke Test

### 2.1 Environment Variables Check

**Steps:**
1. Access Vercel dashboard
2. Navigate to project settings → Environment Variables
3. Compare with local `.env` files

**Expected:**
- All required environment variables present
- Values match local environment
- No placeholder values

**Required Variables:**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_URL` (if used by server)
- `SUPABASE_SERVICE_ROLE_KEY` (if used by server)

**Check:**
- [ ] All required variables present
- [ ] Values match local environment
- [ ] No placeholder/example values
- [ ] Production environment variables set

---

### 2.2 Deploy to Vercel

**Steps:**
1. Push changes to repository
2. Trigger Vercel deployment (or auto-deploy)
3. Monitor deployment logs

**Expected:**
- Build succeeds
- No compilation errors
- Deployment completes successfully

**Check:**
- [ ] Build completes successfully
- [ ] No TypeScript errors
- [ ] No build warnings (or acceptable warnings)
- [ ] Deployment URL accessible

---

### 2.3 Production Authentication Test

**Steps:**
1. Navigate to production URL
2. Log in using seeded auth user
3. Verify authentication works

**Expected:**
- Login page loads
- Authentication succeeds
- Redirect to dashboard

**Check:**
- [ ] Production login page accessible
- [ ] Can authenticate with seeded user
- [ ] Redirect to dashboard after login
- [ ] No authentication errors

---

### 2.4 Production Navigation Tests

**Steps:**
1. After login, navigate through all pages
2. Check browser console for errors

**Pages to Test:**
- Dashboard
- Brand Guide
- Campaigns
- Content Queue
- Creative Studio

**Expected:**
- All pages load
- No RLS errors
- No PostgREST errors
- No network errors

**Check:**
- [ ] Dashboard loads
- [ ] Brand Guide loads
- [ ] Campaigns loads
- [ ] Content Queue loads
- [ ] Creative Studio loads
- [ ] No RLS errors in console
- [ ] No PostgREST errors in console

---

### 2.5 Production Console Error Check

**Steps:**
1. Open browser DevTools on production site
2. Navigate through all pages
3. Check Console tab for errors

**Expected:**
- No RLS policy violations
- No PostgREST 401/403 errors
- No authentication errors
- No critical JavaScript errors

**Check:**
- [ ] No RLS errors
- [ ] No PostgREST errors
- [ ] No authentication errors
- [ ] No critical JavaScript errors

---

## 3. Common Issues & Troubleshooting

### Issue: RLS Errors

**Symptoms:**
- Console shows "new row violates row-level security policy"
- Pages fail to load data
- 403 errors from PostgREST

**Solutions:**
1. Verify user is authenticated
2. Check `brand_members` table has correct user_id and brand_id
3. Verify RLS policies are enabled and correct
4. Check user has correct role in `brand_members`

---

### Issue: Brand Selector Not Showing

**Symptoms:**
- Brand selector empty or missing
- "No brands available" message

**Solutions:**
1. Run seed verification: `tsx scripts/verify-postd-seed.ts`
2. Verify `brand_members` table has entry for user
3. Check user is authenticated
4. Verify brand exists in `brands` table

---

### Issue: Authentication Fails

**Symptoms:**
- Cannot log in
- "Invalid credentials" error
- Redirect loops

**Solutions:**
1. Verify auth user exists in Supabase Auth
2. Check `user_profiles` table has matching UUID
3. Verify environment variables are correct
4. Check Supabase project URL matches environment

---

### Issue: PostgREST Errors

**Symptoms:**
- 401 Unauthorized errors
- 403 Forbidden errors
- 500 Internal Server errors

**Solutions:**
1. Verify `VITE_SUPABASE_ANON_KEY` is correct
2. Check Supabase URL is correct
3. Verify RLS policies allow access
4. Check service role key if server-side operations fail

---

## 4. Success Criteria

All smoke tests pass when:

- ✅ Local app starts without errors
- ✅ Can authenticate with seeded user
- ✅ Dashboard loads and shows brand selector
- ✅ All navigation pages load without errors
- ✅ No RLS errors in console
- ✅ No PostgREST errors in console
- ✅ Vercel deployment succeeds
- ✅ Production site works identically to local
- ✅ No console errors in production

---

## 5. Next Steps After Smoke Tests Pass

Once all smoke tests pass:

1. **Document any issues found** and their resolutions
2. **Update environment variables** if any were missing
3. **Verify RLS policies** are working as expected
4. **Test with additional users** if needed
5. **Prepare for production launch**

---

## Notes

- This checklist assumes minimal seeded data exists
- Some pages may show empty states (no campaigns, content, etc.) - this is expected
- Focus on verifying no errors occur, not on data completeness
- RLS errors are the most critical to catch early

---

**Last Updated:** 2025-01-XX  
**Maintained By:** POSTD Supabase Integration Team

