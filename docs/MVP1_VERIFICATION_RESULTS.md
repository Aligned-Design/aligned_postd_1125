# MVP1 Verification Results: Scraped Images Persistence

**Date:** 2025-01-XX  
**Status:** ✅ **CODE VERIFIED - READY FOR MANUAL TESTING**

---

## Summary

The storage quota fix has been implemented and code paths verified. Scraped images should now persist correctly without quota errors blocking the process.

---

## Code Verification

### ✅ Fix 1: `getStorageUsage()` Non-Blocking

**File:** `server/lib/media-db-service.ts:444-477`

**Status:** ✅ **VERIFIED**

- Returns unlimited quota (`Number.MAX_SAFE_INTEGER`) on ANY error
- Handles all error codes (PGRST204, PGRST205, 42P01, etc.)
- Logs warning instead of throwing error
- **Result:** Quota lookup failures no longer block image persistence

### ✅ Fix 2: Skip Quota Check for Scraped Images

**File:** `server/lib/media-db-service.ts:103-138`

**Status:** ✅ **VERIFIED**

- Detects scraped images: `fileSize === 0 && path.startsWith("http")`
- Skips quota check entirely for scraped images
- Only checks quota for uploaded files (non-scraped images)
- **Result:** Scraped images bypass quota system entirely

### ✅ Fix 3: Metadata Included in Queries

**File:** `server/lib/scraped-images-service.ts:337-344`

**Status:** ✅ **VERIFIED**

- `getScrapedImages()` now selects `metadata` column
- Handles gracefully if metadata column doesn't exist (retries without it)
- Includes `metadata.role` for logo filtering in Step 5
- **Result:** Step 5 can filter logos vs other images correctly

---

## API Flow Verification

### Step 5 Image Fetching Flow

**Status:** ✅ **VERIFIED**

1. **Client:** `Screen5BrandSummaryReview.tsx:75`
   - Calls `GET /api/brand-guide/:brandId`
   - Uses `apiGet()` with authentication

2. **Server:** `server/routes/brand-guide.ts:79`
   - Calls `getScrapedImages(brandId)`
   - Maps results to `approvedAssets.uploadedPhotos` with `source='scrape'`

3. **Service:** `server/lib/scraped-images-service.ts:324-414`
   - Queries `media_assets` WHERE `brand_id = :brandId` AND `path LIKE 'http%'`
   - Returns images with metadata (including `role`)

4. **Client:** `Screen5BrandSummaryReview.tsx:112-131`
   - Filters by `source === "scrape"` and `metadata.role === "logo"`
   - Separates logos from other images
   - Displays in UI

**Code References:**
- ✅ `client/pages/onboarding/Screen5BrandSummaryReview.tsx:46-173` - Image fetching
- ✅ `server/routes/brand-guide.ts:75-129` - Brand Guide API with scraped images
- ✅ `server/lib/scraped-images-service.ts:324-414` - Scraped images query

---

## Migration Status

### `storage_quotas` Table

**Migration:** `supabase/migrations/001_bootstrap_schema.sql` (line 608)

**Table Definition:**
```sql
CREATE TABLE IF NOT EXISTS storage_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  limit_bytes BIGINT NOT NULL DEFAULT 5368709120, -- 5GB default
  used_bytes BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (brand_id)
);
```

**Status:** ✅ **EXISTS IN MIGRATION**

**Action Required:**
- ⏳ **Verify migration is applied** to Supabase project
- Check via Supabase Dashboard → SQL Editor:
  ```sql
  SELECT * FROM storage_quotas LIMIT 1;
  ```
- If table doesn't exist, apply migration:
  - **Dashboard:** Copy `001_bootstrap_schema.sql` → SQL Editor → Run
  - **CLI:** `supabase link --project-ref <ref>` then `supabase db push`

**Note:** Code handles missing table gracefully (unlimited quota), but migration should be applied for production.

---

## Verification Script

**File:** `scripts/verify-scraped-images.ts`

**Usage:**
```bash
# Verify scraped images for a brand
tsx scripts/verify-scraped-images.ts <brandId>

# Or with env var
BRAND_ID=<uuid> tsx scripts/verify-scraped-images.ts
```

**What it checks:**
1. ✅ `storage_quotas` table existence
2. ✅ Scraped images in `media_assets` table
3. ✅ Image structure (HTTP URLs, source='scrape', role)
4. ✅ Brand kit image references

**Expected Output:**
```
🔍 Verifying scraped images for brand: <uuid>

1️⃣ Checking storage_quotas table...
   ✅ storage_quotas table exists (or warning if not)

2️⃣ Querying scraped images from media_assets...
   ✅ Found 15 scraped images

3️⃣ Verifying image structure...
   ✅ 15 valid scraped images
      - Logos: 2
      - Other: 13

4️⃣ Sample scraped images:
   [Shows first 5 images with URLs and roles]

📊 VERIFICATION SUMMARY
✅ SUCCESS: Scraped images are being persisted correctly!
```

---

## Manual Testing Checklist

### Pre-Test Setup

- [ ] Verify `001_bootstrap_schema.sql` migration is applied
  - Run: `SELECT * FROM storage_quotas LIMIT 1;` in Supabase SQL Editor
  - If error, apply migration via Dashboard or CLI

- [ ] Verify environment variables:
  - `VITE_SUPABASE_URL` or `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

- [ ] Start dev server:
  ```bash
  pnpm dev
  ```

### Test 1: Run Crawler

**Steps:**
1. Navigate to Brand Intake page or Onboarding flow
2. Enter a website URL (e.g., `https://example.com`)
3. Click "Import from Website" or proceed through onboarding
4. Wait for crawl to complete (30-60 seconds)

**Expected Logs:**
- ✅ `[MediaDB] Skipping quota check for scraped image`
- ✅ `[ScrapedImages] ✅ Persisted image: ...`
- ✅ `[ScrapedImages] Persistence complete` with `persistedCount: 15`
- ❌ Should NOT see: `DATABASE_ERROR: Failed to fetch storage quota`

### Test 2: Verify Database

**Query:**
```sql
SELECT id, brand_id, path, filename, metadata 
FROM media_assets 
WHERE brand_id = '<TEST_BRAND_ID>' 
AND path LIKE 'http%' 
ORDER BY created_at DESC 
LIMIT 20;
```

**Expected Results:**
- ✅ 10-15 rows returned
- ✅ All `path` values are HTTP URLs (start with `http://` or `https://`)
- ✅ All `metadata->>'source'` = `'scrape'`
- ✅ Some images have `metadata->>'role'` = `'logo'`

### Test 3: Verify Step 5 UI

**Steps:**
1. Navigate to Step 5 (Brand Summary Review) in onboarding
2. Check "Brand Logo" section
3. Check "Brand Images" section

**Expected Results:**
- ✅ Logos displayed in "Brand Logo" section (not "No logos found")
- ✅ Images displayed in "Brand Images" section (not "No images found")
- ✅ Images are clickable/viewable
- ✅ No console errors related to media assets

**Browser DevTools Check:**
- Open Network tab
- Filter: `brand-guide`
- Check response: `approvedAssets.uploadedPhotos` should have items with `source='scrape'`

### Test 4: Verify Quota Behavior

**For Scraped Images:**
- ✅ Logs show: `[MediaDB] Skipping quota check for scraped image`
- ✅ No quota errors in logs

**For Uploaded Files (if testing):**
- ✅ `getStorageUsage()` runs
- ✅ If quota row missing, logs warning but allows persistence
- ✅ No thrown errors

---

## Known Issues / Limitations

### Issue 1: Metadata Column May Not Exist

**Status:** ✅ **HANDLED**

- `getScrapedImages()` tries to select `metadata` column
- If column doesn't exist, retries without it
- Step 5 may not be able to filter logos if metadata is missing

**Workaround:**
- Ensure `001_bootstrap_schema.sql` migration is applied (includes `metadata` column)

### Issue 2: Step 5 Logo Filtering

**Status:** ✅ **VERIFIED IN CODE**

- Step 5 filters by `metadata.role === "logo"`
- If metadata is missing, all images go to "other images"
- Logos may not be separated correctly

**Fix Applied:**
- `getScrapedImages()` now includes metadata in query
- `persistScrapedImages()` sets `metadata.role` correctly

---

## Next Steps

1. ✅ **Code Fixed** - All fixes applied and verified
2. ⏳ **Migration Verification** - Verify `001_bootstrap_schema.sql` is applied
3. ⏳ **Manual Testing** - Run crawler and verify images persist
4. ⏳ **Step 5 Verification** - Confirm UI shows scraped images

---

## Troubleshooting

### Images Still Not Persisting

**Check:**
1. **TenantId Missing:**
   - Look for: `[Crawler] CRITICAL: Cannot persist images - no tenantId`
   - Fix: Ensure `workspaceId` is in request body

2. **Migration Not Applied:**
   - Check: `SELECT * FROM storage_quotas LIMIT 1;`
   - Fix: Apply `001_bootstrap_schema.sql` migration

3. **Service Role Key:**
   - Verify: `SUPABASE_SERVICE_ROLE_KEY` is set
   - Check: Server logs for authentication errors

### Step 5 Shows "No logos found"

**Check:**
1. **Images in Database:**
   - Run verification script: `tsx scripts/verify-scraped-images.ts <brandId>`
   - Check: Are images in `media_assets` table?

2. **API Response:**
   - Check: Browser DevTools → Network → `/api/brand-guide/:brandId`
   - Look for: `approvedAssets.uploadedPhotos` array

3. **Metadata Role:**
   - Check: `SELECT metadata FROM media_assets WHERE brand_id = '...' LIMIT 1;`
   - Verify: `metadata->>'role'` is set correctly

---

**Verification Complete** ✅  
**Ready for Manual Testing** ⏳

