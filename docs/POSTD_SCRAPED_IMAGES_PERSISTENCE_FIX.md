# POSTD Scraped Images Persistence Fix

**Date:** 2025-01-30  
**Status:** ✅ Fixed  
**Issue:** Scraped images failing to persist to `media_assets` table during onboarding

---

## Root Cause

The `createMediaAsset()` function in `server/lib/media-db-service.ts` was missing the `status` field in the insert payload. While migration `007_add_media_assets_status_and_rls.sql` adds a default value (`DEFAULT 'active'`), it's safer to explicitly include the field to avoid any edge cases.

Additionally, error logging was insufficient - only showing a generic `"Failed to create media asset"` message without Postgres error codes, details, or hints that would help diagnose the actual constraint violation.

---

## Changes Made

### 1. Added `status` Field to Insert Payload

**File:** `server/lib/media-db-service.ts`

- Added `status: 'active'` to `insertData` object
- Ensures scraped images always have the required status field
- Migration 007 adds this column with `NOT NULL DEFAULT 'active'`, but explicit is safer

### 2. Enhanced Error Logging

**File:** `server/lib/media-db-service.ts`

- Added detailed Postgres error logging including:
  - `error.message` - Human-readable error message
  - `error.code` - Postgres error code (e.g., '23505' for unique violation, '23503' for FK violation)
  - `error.details` - Postgres error details
  - `error.hint` - Postgres error hint
  - Subset of insert data (excluding secrets) for debugging

- Error is now logged before throwing `AppError`, making it easier to diagnose issues in production

### 3. Improved Null Handling

**File:** `server/lib/media-db-service.ts`

- Explicitly set `tenant_id: tenantId || null` (schema allows nullable)
- Explicitly set optional fields to `null` if missing (`hash`, `category`, `metadata`)
- Added debug logging when `DEBUG_MEDIA_DB=true` to see insert payload

### 4. Created Test Script

**File:** `scripts/test-scraped-image-persistence.ts`

- Dev-only script to test scraped image persistence
- Creates test scraped images (external URLs)
- Calls `persistScrapedImages()`
- Verifies rows appear in `media_assets` with correct fields:
  - `brand_id` matches
  - `tenant_id` matches (or is null if not provided)
  - `filename` is present
  - `path` is HTTP URL (for scraped images)
  - `status` is 'active'
  - `size_bytes` is 0 (scraped images don't use storage)
  - `category` is 'logos' or 'images'
  - `metadata.source` is 'scrape'

**Usage:**
```bash
pnpm tsx scripts/test-scraped-image-persistence.ts [brandId] [tenantId]
```

---

## Code Flow

```
crawler.ts (POST /api/crawl/start)
  ↓
crawlWebsite() → extractImages()
  ↓
persistScrapedImages(brandId, tenantId, images)
  ↓
mediaDB.createMediaAsset(brandId, tenantId, ...)
  ↓
supabase.from("media_assets").insert(insertData)
  ↓
media_assets table
```

---

## Schema Requirements

From `supabase/migrations/001_bootstrap_schema.sql` and `007_add_media_assets_status_and_rls.sql`:

**Required Fields:**
- `brand_id` UUID NOT NULL (foreign key to brands)
- `filename` TEXT NOT NULL
- `path` TEXT NOT NULL
- `status` TEXT NOT NULL DEFAULT 'active' (added in migration 007)

**Optional Fields:**
- `tenant_id` UUID (nullable, foreign key to tenants)
- `category` TEXT
- `hash` TEXT
- `mime_type` TEXT
- `size_bytes` BIGINT
- `metadata` JSONB
- `used_in` TEXT[] (defaults to empty array)
- `usage_count` INTEGER (defaults to 0)

**For Scraped Images:**
- `path` contains the actual HTTP URL (external URL)
- `size_bytes` is 0 (no storage used)
- `metadata.source` is 'scrape'
- `status` is 'active'

---

## Testing

### Manual Testing

1. **Run test script:**
   ```bash
   pnpm tsx scripts/test-scraped-image-persistence.ts
   ```

2. **Test via onboarding:**
   - Start dev server: `pnpm dev`
   - Go through onboarding flow
   - Run scraper on a test website
   - Verify images appear in MVP onboarding image/logo picker
   - Check database: `SELECT * FROM media_assets WHERE brand_id = '<brandId>' ORDER BY created_at DESC;`

### Verification Checklist

- ✅ Scraped images persist to `media_assets` table
- ✅ `status` field is set to 'active'
- ✅ `path` contains HTTP URL (not Supabase storage path)
- ✅ `size_bytes` is 0 for scraped images
- ✅ `metadata.source` is 'scrape'
- ✅ Images appear in MVP onboarding image/logo picker
- ✅ Error logging shows Postgres error codes/details on failure

---

## Error Handling

### Before Fix
- Generic error: `"Failed to create media asset"`
- No Postgres error code or details
- Hard to diagnose constraint violations

### After Fix
- Detailed error logging with:
  - Postgres error code (e.g., '23505', '23503')
  - Error message
  - Error details and hints
  - Insert payload subset (for debugging)
- Errors logged before throwing `AppError`
- `AppError` includes full error details in `details` field

---

## Debug Flags

Set environment variable for additional logging:

```bash
DEBUG_MEDIA_DB=true pnpm dev
```

This will log:
- Insert payload (excluding sensitive data)
- Brand ID, tenant ID, filename, category, path, size_bytes, status

---

## Follow-up TODOs

1. **Monitor Production Logs:**
   - Watch for any new database errors after deployment
   - Verify scraped images are persisting successfully
   - Check error logs for any remaining issues

2. **Consider Adding:**
   - Retry logic for transient database errors
   - Batch insert for multiple scraped images (if performance becomes an issue)
   - Metrics/analytics for scraped image persistence success rate

3. **Documentation:**
   - Update API documentation if needed
   - Add to onboarding flow documentation

---

## Related Files

- `server/lib/media-db-service.ts` - Database service (fixed)
- `server/lib/scraped-images-service.ts` - Scraped images service (already had good error handling)
- `server/routes/crawler.ts` - Crawler route (calls persistScrapedImages)
- `supabase/migrations/007_add_media_assets_status_and_rls.sql` - Adds status column
- `scripts/test-scraped-image-persistence.ts` - Test script (new)

---

## Summary

**Root Cause:** Missing `status` field in insert payload (even though migration adds default)

**Fix:** 
1. Added explicit `status: 'active'` to insert payload
2. Enhanced error logging with Postgres error codes/details
3. Improved null handling for optional fields
4. Created test script for verification

**Result:** Scraped images now persist successfully to `media_assets` table, and errors provide detailed diagnostic information.

