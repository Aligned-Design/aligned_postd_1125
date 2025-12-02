# Storage Quota Fix - Verification & Testing Guide

**Date**: 2025-01-20  
**Status**: ✅ Code Fixed - Ready for Testing

> **See Also**: `docs/STORAGE_QUOTA_END_TO_END_VERIFICATION.md` for comprehensive verification report

---

## Quick Verification Checklist

- [ ] Migration `001_bootstrap_schema.sql` is applied to Supabase project
- [ ] `storage_quotas` table exists in database
- [ ] Code changes are deployed (scraped images skip quota check)
- [ ] Crawler can be run for a brand
- [ ] Images persist to `media_assets` table
- [ ] Step 5 (Brand Summary Review) shows logos/images

---

## Step 1: Verify Migration is Applied

### Option A: Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Database** → **Tables**
3. Search for `storage_quotas`
4. ✅ **Expected**: Table exists with columns:
   - `id` (UUID)
   - `brand_id` (UUID)
   - `tenant_id` (UUID, nullable)
   - `limit_bytes` (BIGINT)
   - `used_bytes` (BIGINT)
   - `created_at` (TIMESTAMPTZ)
   - `updated_at` (TIMESTAMPTZ)

### Option B: SQL Query

Run this in Supabase SQL Editor:

```sql
-- Check if storage_quotas table exists
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'storage_quotas'
ORDER BY ordinal_position;
```

**Expected Result**: Should return 7 rows (one per column)

**If table doesn't exist**: Apply migration `001_bootstrap_schema.sql` via Supabase Dashboard or CLI

---

## Step 2: Verify Code Changes

### Check `getStorageUsage()` Method

**File**: `server/lib/media-db-service.ts` (line 443)

**Expected Behavior**:
- Returns unlimited quota (`Number.MAX_SAFE_INTEGER`) if quota lookup fails
- Logs warning instead of throwing error
- Code should look like:
  ```typescript
  if (quotaError) {
    console.warn(`[MediaDB] storage_quotas table/row not found...`);
    return {
      quotaLimitBytes: Number.MAX_SAFE_INTEGER, // Unlimited
      // ...
    };
  }
  ```

### Check `createMediaAsset()` Method

**File**: `server/lib/media-db-service.ts` (line 103)

**Expected Behavior**:
- Detects scraped images: `fileSize === 0 && path.startsWith("http")`
- Skips quota check for scraped images
- Code should look like:
  ```typescript
  const isScrapedImage = fileSize === 0 && path.startsWith("http");
  if (isScrapedImage) {
    console.log(`[MediaDB] Skipping quota check for scraped image...`);
  }
  ```

---

## Step 3: Re-run Crawler for ABD

### Option A: Via API

```bash
# Replace with your actual values
curl -X POST "http://localhost:8080/api/crawl/start?sync=true" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "url": "https://alignedtx.com",
    "brand_id": "YOUR_BRAND_UUID",
    "workspaceId": "YOUR_WORKSPACE_ID"
  }'
```

### Option B: Via UI

1. Navigate to Brand Intake or Crawler page
2. Enter URL: `https://alignedtx.com` (or your test URL)
3. Select the brand (ABD)
4. Click "Start Crawl" or equivalent button
5. Wait for crawl to complete

### Expected Logs

You should see:
```
[MediaDB] Skipping quota check for scraped image (external URL, no storage used)
[ScrapedImages] ✅ Persisted image: https://...
```

You should **NOT** see:
```
DATABASE_ERROR: Failed to fetch storage quota
Error: Storage quota exceeded
```

---

## Step 4: Sanity-Check the Database

### Query 1: Check if Images Were Saved

```sql
-- Replace 'YOUR_BRAND_UUID' with actual ABD brand UUID
SELECT 
  id,
  path,
  filename,
  category,
  size_bytes,
  metadata->>'source' as source,
  created_at
FROM media_assets
WHERE brand_id = 'YOUR_BRAND_UUID'
  AND path LIKE 'http%'  -- Scraped images have HTTP URLs in path
ORDER BY created_at DESC
LIMIT 20;
```

**Expected Result**: 
- Should return rows with:
  - `path` containing full URLs (e.g., `https://alignedtx.com/logo.png`)
  - `size_bytes` = 0 (scraped images don't have file size)
  - `metadata->>'source'` = `'scrape'` (or similar)
  - `category` = `'logos'` or `'images'`

### Query 2: Count Scraped Images by Category

```sql
SELECT 
  category,
  COUNT(*) as count,
  COUNT(CASE WHEN path LIKE 'http%' THEN 1 END) as scraped_count
FROM media_assets
WHERE brand_id = 'YOUR_BRAND_UUID'
GROUP BY category;
```

**Expected Result**:
- `logos`: Should have scraped_count > 0
- `images`: Should have scraped_count > 0

### Query 3: Check Storage Quota Status

```sql
-- Check if quota row exists for this brand
SELECT 
  brand_id,
  limit_bytes,
  used_bytes,
  (used_bytes::float / limit_bytes * 100) as percent_used
FROM storage_quotas
WHERE brand_id = 'YOUR_BRAND_UUID';
```

**Expected Result**:
- If row exists: Shows quota info
- If no row: Returns 0 rows (this is OK - code handles it gracefully)

---

## Step 5: Reload Onboarding Step 5

### Steps

1. **Hard refresh the app**:
   - Chrome/Edge: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
   - Or restart dev server: `pnpm dev`

2. **Navigate to Step 5**:
   - Go through onboarding flow
   - Or directly navigate to: `/onboarding/brand-summary` (or equivalent route)

3. **Check "Logos/Brand Images" section**:
   - Should show thumbnails of scraped images
   - Should **NOT** show "No logos found" or "No images found"

### Expected UI State

- ✅ **Logos section**: Shows logo thumbnails from scraped images
- ✅ **Brand Images section**: Shows image thumbnails from scraped images
- ✅ Images are clickable/viewable
- ✅ No error messages about missing images

---

## Troubleshooting

### Issue: No Images Saved

**Check**:
1. Crawler logs - did it find images?
2. Server logs - any errors during `createMediaAsset()`?
3. Database - run Query 1 above to verify no rows exist

**Possible Causes**:
- Migration not applied (storage_quotas table missing)
- Brand UUID mismatch
- Crawler didn't find images
- Network issues during crawl

**Fix**:
- Apply migration if missing
- Re-run crawler
- Check server logs for errors

### Issue: Images Saved but Not Showing in UI

**Check**:
1. Database - verify images exist (Query 1)
2. Frontend - check browser console for errors
3. API - verify `/api/media/assets/:brandId` returns images

**Possible Causes**:
- Frontend filtering out scraped images
- API not returning scraped images
- Cache issues

**Fix**:
- Hard refresh browser
- Check API response includes scraped images
- Verify frontend code handles `path` with HTTP URLs

### Issue: Console Errors (401/400)

**About**:
- `api/auth/me → 401`: User not authenticated (normal if not logged in)
- `api/auth/signup → 400`: User already exists (normal if user already created)

**Impact**: These are auth-flow errors, **not** image-persistence errors. They shouldn't block scraped images as long as you're logged in through proper auth path.

**Fix** (optional, for cleaner console):
- Fix auth flow to avoid unnecessary signup calls
- Handle 401 gracefully in frontend
- These are low priority - images should still work

---

## Success Criteria

✅ **Migration Applied**: `storage_quotas` table exists  
✅ **Code Deployed**: Scraped images skip quota check  
✅ **Crawler Runs**: No errors during crawl  
✅ **Images Persist**: Rows exist in `media_assets` table  
✅ **UI Shows Images**: Step 5 displays logos/images  
✅ **No Quota Errors**: Logs show "Skipping quota check" instead of errors  

---

## Next Steps After Verification

1. ✅ **If all checks pass**: Scraped images are working correctly
2. ⏳ **If issues persist**: Check server logs and database state
3. ⏳ **Optional**: Clean up auth console errors (low priority)

---

**Ready for Testing** ✅

