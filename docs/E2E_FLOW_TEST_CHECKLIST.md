# End-to-End Flow Test Checklist

## Overview

This document provides a comprehensive checklist for testing the complete onboarding flow from signup to brand guide creation. Use this to verify all systems are working correctly.

**Last Updated**: 2025-01-20

---

## Prerequisites

- [ ] Supabase environment variables configured
- [ ] Server running (`pnpm dev`)
- [ ] Fresh browser session (or incognito)
- [ ] Network tab open in DevTools
- [ ] Console tab open in DevTools

---

## Test Flow: Signup → Brand Creation → Crawler → Brand Guide

### Step 1: User Signup

**URL**: `/onboarding/1` or `/signup`

**Actions**:
1. [ ] Enter email: `test-${Date.now()}@example.com`
2. [ ] Enter password: `TestPassword123!`
3. [ ] Click "Sign Up"

**Expected Results**:
- [ ] ✅ No console errors
- [ ] ✅ POST `/api/auth/signup` returns `200 OK`
- [ ] ✅ Response includes `{ success: true, user: { id, email, tenantId }, tokens: { accessToken, refreshToken } }`
- [ ] ✅ `localStorage` contains:
  - `aligned_access_token`
  - `aligned_refresh_token`
  - `aligned_user_id`
- [ ] ✅ Console log: `[Tenants] 🏢 Creating tenant for new user`
- [ ] ✅ Console log: `[Tenants] ✅ Tenant created successfully`
- [ ] ✅ Console log: `[Tenants] Using tenantId: <uuid>`
- [ ] ✅ User redirected to onboarding step 2

**Database Verification**:
- [ ] Check Supabase `auth.users` table - user exists
- [ ] Check Supabase `tenants` table - tenant row exists with `id = user.id`
- [ ] Check Supabase `user_profiles` table - profile exists

---

### Step 2: Business Essentials (Brand Creation)

**URL**: `/onboarding/2`

**Actions**:
1. [ ] Enter business name: "Test Brand"
2. [ ] Enter website URL: `https://alignedbydesign.co` (or any valid website)
3. [ ] Select business type: "Design Agency"
4. [ ] Enter description: "Test brand for E2E flow"
5. [ ] Click "Continue"

**Expected Results**:
- [ ] ✅ No console errors
- [ ] ✅ POST `/api/brands` returns `200 OK`
- [ ] ✅ Response includes `{ success: true, brand: { id: <uuid>, name, website_url, tenant_id, created_by } }`
- [ ] ✅ `localStorage` contains:
  - `aligned_brand_id` = `<uuid>` (real UUID, not `brand_*`)
- [ ] ✅ Console log: `[Tenants] 🔍 Verifying tenant exists`
- [ ] ✅ Console log: `[Tenants] ✅ Tenant verified` or `[Tenants] ✅ Tenant created successfully`
- [ ] ✅ Console log: `[Tenants] Using tenantId: <uuid>`
- [ ] ✅ Console log: `[Brands] Creating brand { userId, tenantId, brandName }`
- [ ] ✅ Console log: `[Brands] ✅ Brand created successfully`
- [ ] ✅ User redirected to onboarding step 3

**Database Verification**:
- [ ] Check Supabase `brands` table - brand row exists with:
  - `id` = UUID (from `localStorage`)
  - `name` = "Test Brand"
  - `website_url` = entered URL
  - `industry` = selected business type
  - `tenant_id` = user's tenant ID
  - `workspace_id` = same as `tenant_id`
  - `created_by` = user ID
- [ ] Check Supabase `brand_members` table - membership row exists:
  - `brand_id` = brand ID
  - `user_id` = user ID
  - `role` = "owner"

---

### Step 3: AI Scrape

**URL**: `/onboarding/3`

**Actions**:
1. [ ] Wait for page to load
2. [ ] Verify website URL is pre-filled from step 2
3. [ ] Click "Start Scraping" or wait for auto-scrape

**Expected Results**:
- [ ] ✅ No console errors
- [ ] ✅ POST `/api/crawl/start` returns `200 OK` (or `201` for async)
- [ ] ✅ Request body includes:
  - `url` = website URL from step 2
  - `brand_id` = real UUID (not `brand_*`)
  - `workspaceId` = tenant ID
  - `sync: true`
- [ ] ✅ Console log: `[Crawler] Starting scrape for brandId: <uuid>`
- [ ] ✅ Console log: `[Crawler] Result: { imagesFound, colorsFound, textBlocks }`
- [ ] ✅ Console log: `[Crawler] ✅ Scraped images persisted: { count, brandId, tenantId }`
- [ ] ✅ Response includes scraped data:
  - `brandKit` with colors, images, text
  - `status: "completed"`
- [ ] ✅ No fallback/mock data returned
- [ ] ✅ User redirected to onboarding step 4 or 5

**Database Verification**:
- [ ] Check Supabase `brands` table - brand row updated:
  - `scraper_status` = "completed" (or "running" if async)
  - `scraped_at` = timestamp (if completed)
- [ ] Check Supabase `media_assets` table - scraped images exist:
  - `brand_id` = brand ID
  - `tenant_id` = tenant ID
  - `category` = "images"
  - `metadata->>'source'` = "scrape" (or check `metadata` JSONB)

---

### Step 4: Brand Snapshot Review

**URL**: `/onboarding/5` (or step 4/5 depending on flow)

**Actions**:
1. [ ] Wait for brand snapshot to load
2. [ ] Verify scraped data is displayed:
   - Colors from website
   - Images from website (not stock images)
   - Text/content from website
3. [ ] Click "Continue" or "Save"

**Expected Results**:
- [ ] ✅ No console errors
- [ ] ✅ GET `/api/brand-guide/<brandId>` returns `200 OK`
- [ ] ✅ Response includes `{ success: true, brandGuide: { ... }, hasBrandGuide: true/false }`
- [ ] ✅ Console log: `[BrandSnapshot] Fetching brand guide { brandId }`
- [ ] ✅ Brand snapshot displays:
  - Real scraped colors (not fallback purple)
  - Real scraped images (not stock images)
  - Real scraped text/content
- [ ] ✅ If saving: PUT `/api/brand-guide/<brandId>` returns `200 OK`
- [ ] ✅ Console log: `[OnboardingBrandSync] Saving brand guide`
- [ ] ✅ Console log: `[OnboardingBrandSync] ✅ Brand Guide saved to Supabase`

**Database Verification**:
- [ ] Check Supabase `brands` table - brand row updated:
  - `brand_kit` JSONB contains brand guide data
  - `voice_summary` contains voice/tone data
  - `visual_summary` contains visual identity data

---

### Step 5: Content Generation (Optional)

**URL**: `/onboarding/7`

**Actions**:
1. [ ] Select weekly focus or preferences
2. [ ] Click "Generate Content"

**Expected Results**:
- [ ] ✅ No console errors
- [ ] ✅ POST `/api/onboarding/generate-week` returns `200 OK`
- [ ] ✅ Response includes content package with items
- [ ] ✅ Content uses real brand guide data (not mock)

---

### Step 6: Calendar Preview

**URL**: `/onboarding/8`

**Actions**:
1. [ ] View generated content calendar
2. [ ] Verify content items are displayed

**Expected Results**:
- [ ] ✅ No console errors
- [ ] ✅ Content items load correctly
- [ ] ✅ Uses real brand ID (not temporary)

---

## Error Scenarios to Test

### Test 1: Missing Tenant (Should Auto-Create)

**Scenario**: User signs up but tenant creation fails initially

**Expected**:
- [ ] Login flow creates tenant if missing
- [ ] Brand creation creates tenant if missing
- [ ] No foreign key violations

### Test 2: Invalid Brand ID

**Scenario**: Try to access brand guide with invalid ID

**Expected**:
- [ ] Returns `400 Bad Request` with "Invalid brand ID format"
- [ ] Clear error message to user
- [ ] No fallback to mock data

### Test 3: Crawler Failure

**Scenario**: Website URL is invalid or unreachable

**Expected**:
- [ ] Returns proper error (not fallback data)
- [ ] Error message: "Website scraping failed: ..."
- [ ] No `generateFallbackBrandKit` data returned
- [ ] User sees error, not fake data

### Test 4: Missing Auth Token

**Scenario**: Access protected endpoint without token

**Expected**:
- [ ] Returns `401 Unauthorized`
- [ ] Clear error message
- [ ] No mock data returned

---

## Health Check Test

**URL**: `GET /api/debug/health`

**Actions**:
1. [ ] Call endpoint with auth token: `Authorization: Bearer <token>`

**Expected Results**:
- [ ] ✅ Returns `200 OK` with status `"healthy"` or `"degraded"`
- [ ] ✅ All checks return `"ok"` or `"skipped"`:
  - `supabase: "ok"`
  - `auth: "ok"`
  - `tenant: "ok"`
  - `brand_create: "ok"`
  - `media_assets: "ok"`
  - `crawler: "ok"`
  - `brand_guide: "ok"`

---

## Database Verification Checklist

After completing the flow, verify in Supabase:

### `tenants` Table
- [ ] Row exists with `id` = user ID
- [ ] `name` = user's name or email prefix
- [ ] `plan` = "free"

### `brands` Table
- [ ] Row exists with `id` = brand ID from `localStorage`
- [ ] `tenant_id` = tenant ID (FK constraint satisfied)
- [ ] `workspace_id` = tenant ID (synced)
- [ ] `created_by` = user ID (FK constraint satisfied)
- [ ] `website_url` = entered URL
- [ ] `industry` = selected business type
- [ ] `scraper_status` = "completed" (after scraping)
- [ ] `scraped_at` = timestamp (after scraping)
- [ ] `brand_kit` JSONB contains brand guide data
- [ ] `voice_summary` contains voice/tone data
- [ ] `visual_summary` contains visual identity data

### `brand_members` Table
- [ ] Row exists with:
  - `brand_id` = brand ID
  - `user_id` = user ID
  - `role` = "owner"

### `media_assets` Table
- [ ] Rows exist with:
  - `brand_id` = brand ID
  - `tenant_id` = tenant ID
  - `category` = "images"
  - `metadata->>'source'` = "scrape" (or in metadata JSONB)

---

## Console Log Verification

Check browser console for these log patterns:

### Signup
- [ ] `[Tenants] 🏢 Creating tenant for new user`
- [ ] `[Tenants] ✅ Tenant created successfully`
- [ ] `[Tenants] Using tenantId: <uuid>`
- [ ] `[Auth] ✅ Signup complete`

### Brand Creation
- [ ] `[Tenants] 🔍 Verifying tenant exists`
- [ ] `[Tenants] ✅ Tenant verified` or `[Tenants] ✅ Tenant created successfully`
- [ ] `[Tenants] Using tenantId: <uuid>`
- [ ] `[Brands] Creating brand`
- [ ] `[Brands] ✅ Brand created successfully`

### Crawler
- [ ] `[Crawler] Starting scrape for brandId: <uuid>`
- [ ] `[Crawler] Result: { imagesFound, colorsFound, textBlocks }`
- [ ] `[Crawler] ✅ Scraped images persisted`

### Brand Guide
- [ ] `[BrandSnapshot] Fetching brand guide`
- [ ] `[OnboardingBrandSync] Saving brand guide`
- [ ] `[OnboardingBrandSync] ✅ Brand Guide saved to Supabase`

---

## Network Request Verification

Check Network tab for these requests:

1. **POST `/api/auth/signup`**
   - Status: `200 OK`
   - Response: `{ success: true, user: {...}, tokens: {...} }`

2. **POST `/api/brands`**
   - Status: `200 OK`
   - Request: `{ name, website_url, industry, tenant_id, workspace_id, created_by }`
   - Response: `{ success: true, brand: { id: <uuid>, ... } }`

3. **POST `/api/crawl/start`**
   - Status: `200 OK` or `201 Created`
   - Request: `{ url, brand_id: <uuid>, workspaceId: <uuid>, sync: true }`
   - Response: `{ success: true, brandKit: {...}, status: "completed" }`

4. **GET `/api/brand-guide/<brandId>`**
   - Status: `200 OK`
   - Response: `{ success: true, brandGuide: {...}, hasBrandGuide: true }`

5. **PUT `/api/brand-guide/<brandId>`**
   - Status: `200 OK`
   - Request: Full brand guide object
   - Response: `{ success: true }`

---

## Success Criteria

✅ **All tests pass if:**
- [ ] No console errors
- [ ] No 401/403/404/500 errors
- [ ] All database rows created correctly
- [ ] All foreign key constraints satisfied
- [ ] Real data used throughout (no mocks/fallbacks)
- [ ] All log patterns present
- [ ] Health check passes

---

## Known Issues / Edge Cases

### Temporary Brand IDs
- ⚠️ **Fixed**: Onboarding no longer uses `brand_${Date.now()}` IDs
- ✅ All brand IDs are real UUIDs from database

### Tenant Creation
- ⚠️ **Fixed**: Tenant always created during signup
- ✅ Tenant verified/created during login if missing
- ✅ Tenant created on-the-fly during brand creation if missing

### Fallback Data
- ⚠️ **Fixed**: Crawler no longer returns fallback data
- ✅ All failures return proper errors

---

## Next Steps After Testing

1. [ ] Document any issues found
2. [ ] Fix any broken flows
3. [ ] Re-run tests to verify fixes
4. [ ] Update this checklist with new findings

---

**Status**: Ready for testing

