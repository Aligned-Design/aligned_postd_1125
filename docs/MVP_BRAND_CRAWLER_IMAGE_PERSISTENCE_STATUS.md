# Brand Crawler Image Persistence - Production Status

## Overview

The Brand Crawler image persistence pipeline is a **critical production system** that extracts images from websites during onboarding and stores them in the `media_assets` table for use in Brand Guide and Creative Studio.

**If images aren't persisted correctly, Brand Guide and Creative Studio will be broken.**

## Pipeline Flow

### 1. Image Extraction (Crawler)
- **Location**: `server/workers/brand-crawler.ts`
- **Function**: `extractImages()` → `categorizeImage()`
- **Output**: Array of `CrawledImage` objects with:
  - `url`: Image URL
  - `role`: "logo" | "hero" | "photo" | "team" | "subject" | "social_icon" | "platform_logo" | "other"
  - `width`, `height`: Dimensions (if available)
  - `alt`: Alt text (if available)

### 2. Image Filtering (Pre-Persistence)
- **Location**: `server/lib/scraped-images-service.ts` → `persistScrapedImages()`
- **Filters Applied**:
  - **Removes**: `social_icon` and `platform_logo` roles (completely ignored)
  - **Validates**: URL must start with `http://` or `https://`
  - **Limits**: Max 2 logos, max 15 brand images
- **Output**: Filtered array of images ready for persistence

### 3. Image Persistence
- **Location**: `server/lib/scraped-images-service.ts` → `persistScrapedImages()`
- **Function**: `mediaDB.createMediaAsset()` → `server/lib/media-db-service.ts`
- **Database Table**: `media_assets`
- **Fields Set**:
  - `brand_id`: Brand ID (can be temporary during onboarding)
  - `tenant_id`: Tenant/Workspace ID (REQUIRED - can be null for legacy data)
  - `path`: Image URL (for scraped images, path = external URL)
  - `category`: "logos" | "images" | "graphics"
  - `metadata.source`: "scrape"
  - `metadata.role`: Original role from crawler
  - `size_bytes`: 0 (external URLs don't use storage)
  - `hash`: SHA256 hash of URL (for duplicate detection)

### 4. Brand Guide Integration
- **Location**: `server/routes/brand-guide.ts` → `GET /api/brand-guide/:brandId`
- **Query**: `getScrapedImages(brandId)` → Filters `media_assets` WHERE `path` starts with "http"
- **Output**: Brand Guide includes `approvedAssets.logos` and `approvedAssets.images` arrays

## Error Handling & Failure Modes

### ✅ **Soft-Failures (Non-Blocking)**

These errors are logged as warnings but don't prevent other images from being persisted:

1. **Quota/Storage Errors**
   - **Cause**: Storage quota check fails (shouldn't happen for scraped images, but defensive)
   - **Handling**: Logged as warning, image skipped, continue with next
   - **Log Pattern**: `[ScrapedImages] ⚠️ Quota/storage error (non-blocking)`

2. **Duplicate Detection**
   - **Cause**: Image with same hash already exists
   - **Handling**: Uses existing asset ID, counts as "persisted"
   - **Log Pattern**: `[ScrapedImages] Image already exists (using existing)`

3. **Validation Errors**
   - **Cause**: Invalid URL format or metadata
   - **Handling**: Logged as warning, image skipped, continue with next
   - **Log Pattern**: `[ScrapedImages] ⚠️ Validation error persisting image`

### ❌ **Hard-Failures (Should Investigate)**

These errors indicate systemic issues and should be investigated:

1. **Database Connection Errors**
   - **Cause**: Supabase connection failure, table missing, or schema mismatch
   - **Handling**: Logged as error, image skipped, continue with next
   - **Log Pattern**: `[ScrapedImages] ❌ Database error persisting image`
   - **Error Codes**: `DATABASE_ERROR`, `23505`, `23503`, `42P01`, `PGRST204`, `PGRST116`

2. **Missing TenantId**
   - **Cause**: `tenantId` is null/invalid during onboarding
   - **Handling**: Persistence is skipped entirely (logged as critical error)
   - **Log Pattern**: `[Crawler] CRITICAL: Cannot persist images - no tenantId`
   - **Fix**: Ensure `workspaceId` is provided in request body or auth context

3. **Network Errors**
   - **Cause**: Transient network issues, timeouts
   - **Handling**: Logged as warning, image skipped, continue with next
   - **Log Pattern**: `[ScrapedImages] ⚠️ Network error persisting image`
   - **Note**: Usually transient, may succeed on retry

## Logging Patterns for Debugging

### Success Case
```
[Crawler] ✅ Sync crawl completed successfully
[ScrapedImages] Image selection summary: { totalImages: 15, filteredOut: 3, ... }
[ScrapedImages] ✅ Persisted image: logo.png (https://...)
[ScrapedImages] ✅ Persistence complete (all images persisted)
```

### Partial Success (Some Images Failed)
```
[Crawler] Scrape complete { imagesFound: 15, imagesPersisted: 12 }
[ScrapedImages] ⚠️ Persistence complete with 3 failure(s)
[ScrapedImages] Failure 1/3: { category: 'database', reason: 'Database operation failed', ... }
[Crawler] ⚠️ Partial persistence: 12/15 images persisted (3 failed)
```

### Critical Failure (None Persisted)
```
[Crawler] Scrape complete { imagesFound: 15, imagesPersisted: 0 }
[ScrapedImages] ❌ CRITICAL: Attempted to persist 15 image(s) but NONE succeeded
[ScrapedImages] Failure 1/15: { category: 'database', errorCode: 'DATABASE_ERROR', ... }
[Crawler] ❌ CRITICAL: Found 15 image(s) but NONE were persisted
```

## Interpreting Logs in Vercel

### Scenario 1: "Found 15 images but none were persisted"

**Look for these log patterns:**

1. **Missing TenantId** (Most Common):
   ```
   [Crawler] CRITICAL: Cannot persist images - no tenantId for brandId...
   ```
   **Fix**: Ensure `workspaceId` is provided in crawler request body or auth context.

2. **Database Connection Issue**:
   ```
   [ScrapedImages] ❌ Database error persisting image
   Error code: DATABASE_ERROR or 42P01
   ```
   **Fix**: Check Supabase connection, verify `media_assets` table exists, check RLS policies.

3. **All Images Filtered Out** (Less Likely):
   ```
   [ScrapedImages] Image selection summary: { filteredOut: 15, totalToPersist: 0 }
   ```
   **Fix**: Review filter logic if this is unexpected (shouldn't filter all images).

### Scenario 2: "Some images persisted, some didn't"

**Look for per-image failure logs:**
```
[ScrapedImages] Failure 1/X: { category: 'database', reason: '...', errorCode: '...' }
```
**Interpretation**: Individual images failed for specific reasons. Check error codes and categories to identify patterns.

### Scenario 3: "LogoUrl used as fallback"

**Log pattern:**
```
[BrandGuide] Using logoUrl as fallback logo: https://...
```
**Interpretation**: No logos were persisted (all filtered or failed), but `logoUrl` from brand record exists. This is expected behavior when logo persistence fails but fallback URL is available.

## Error Categories Reference

### `duplicate`
- **Meaning**: Image already exists (same hash)
- **Action**: Already handled (uses existing asset), no action needed

### `quota`
- **Meaning**: Storage quota check failed (non-critical for scraped images)
- **Action**: Usually safe to ignore - quota system may not be fully configured

### `database`
- **Meaning**: Database operation failed (connection, schema, RLS)
- **Action**: **Investigate** - Check Supabase status, table existence, RLS policies

### `validation`
- **Meaning**: Image failed validation (invalid URL, format)
- **Action**: Review specific error message - may indicate corrupted image data

### `network`
- **Meaning**: Network/connection error (timeout, refused)
- **Action**: Usually transient - may succeed on retry

### `unknown`
- **Meaning**: Unexpected error not in known categories
- **Action**: **Investigate** - Review error message and stack trace

## Key Metrics to Monitor

### In Success Logs
- `totalImagesAvailable`: Total images found by crawler
- `filteredOutByDesign`: Images intentionally filtered (social icons, platform logos)
- `totalAttempted`: Images selected for persistence (after filtering)
- `totalSucceeded`: Images successfully persisted
- `logosPersisted`: Number of logos persisted (target: 2)
- `brandImagesPersisted`: Number of brand images persisted (target: 15)

### In Failure Logs
- `totalFailed`: Number of images that failed to persist
- `failuresByCategory`: Breakdown by error category (database, quota, validation, etc.)
- `sampleFailures`: First 3 failures with detailed error info

## Common Issues & Fixes

### Issue: Zero images persisted despite finding images

**Checklist:**
1. ✅ **TenantId present?** Check `[Crawler]` logs for `tenantId` value
2. ✅ **Database accessible?** Check for `[ScrapedImages] ❌ Database error` logs
3. ✅ **Schema correct?** Verify `media_assets` table exists with correct columns
4. ✅ **RLS policies?** Check Row Level Security policies allow inserts
5. ✅ **Error details?** Look for `[ScrapedImages] Failure` logs with specific error codes

### Issue: Some images persisted, some didn't

**Checklist:**
1. ✅ **Error pattern?** Check if failures are all same category (database, validation, etc.)
2. ✅ **Specific URLs?** Review failed URLs - may be invalid or blocked
3. ✅ **Rate limiting?** Check for timeout/rate limit errors
4. ✅ **Duplicate detection?** Verify duplicates are being handled correctly

### Issue: LogoUrl fallback being used

**This is expected behavior** when:
- Logo images were filtered out (social icons, platform logos)
- Logo persistence failed (check `[ScrapedImages]` logs)
- Logo URL exists in brand record as fallback

**This is fine** - Brand Guide will work with `logoUrl` fallback.

## Production Hardening Status

### ✅ **Completed**
- Soft-fail quota checks (scraped images skip quota entirely)
- Per-image error handling (one failure doesn't block others)
- Structured error logging with categories
- Detailed failure tracking and reporting
- Clear distinction between "filtered out" vs "failed to persist"

### ✅ **Defensive Measures**
- `getStorageUsage()` never throws (returns unlimited quota on error)
- Scraped images skip quota check (fileSize=0 && path.startsWith("http"))
- All errors are caught and logged (no unhandled exceptions)
- Batch processing continues even if individual images fail

### ⚠️ **Known Limitations**
- Duplicate detection relies on hash (may have false positives for different URLs with same content)
- Network errors are logged but not retried (may need retry logic in future)
- Schema validation happens at DB level (some errors may not be caught pre-insert)

## Monitoring Recommendations

### Log Queries for Vercel

**Find all persistence failures:**
```
[ScrapedImages] ❌ CRITICAL: Attempted to persist
```

**Find database errors:**
```
[ScrapedImages] ❌ Database error persisting image
```

**Find missing tenantId:**
```
[Crawler] CRITICAL: Cannot persist images - no tenantId
```

**Find partial successes:**
```
[Crawler] ⚠️ Partial persistence
```

### Alert Conditions

**Critical (Page on-call):**
- Zero images persisted when images were found (check for systemic DB issue)
- All images fail with `database` category errors
- Missing `tenantId` errors (indicates auth/workspace setup issue)

**Warning (Review in next sprint):**
- >50% of images failed to persist
- Consistent `validation` errors (may indicate crawler bug)
- Consistent `network` errors (may indicate infrastructure issue)

**Info (Monitor trends):**
- `logoUrl` fallback usage (indicates logo persistence failure rate)
- Filter rates (how many images are filtered out by design)

## Testing the Pipeline

### Manual Test Steps

1. **Trigger Crawl**:
   ```bash
   POST /api/crawl/start?sync=true
   Body: { url: "https://example.com", brand_id: "test-brand", workspaceId: "uuid-here" }
   ```

2. **Check Logs** (in order):
   - `[Crawler] Crawl start request received` - Crawl initiated
   - `[Crawler] ✅ Images extracted successfully` - Images found
   - `[ScrapedImages] Image selection summary` - Filtering applied
   - `[ScrapedImages] ✅ Persisted image` - Each successful persistence
   - `[ScrapedImages] ✅ Persistence complete` - Final summary

3. **Verify in Database**:
   ```sql
   SELECT id, filename, path, category, metadata->>'role' as role
   FROM media_assets
   WHERE brand_id = 'test-brand'
   AND metadata->>'source' = 'scrape'
   ORDER BY created_at DESC;
   ```

4. **Verify in Brand Guide**:
   ```bash
   GET /api/brand-guide/:brandId
   ```
   Check `brandGuide.approvedAssets.logos` and `brandGuide.approvedAssets.images`

## Summary

The image persistence pipeline is **hardened for production** with:

- ✅ Comprehensive error handling (no single failure blocks batch)
- ✅ Structured logging with error categories and codes
- ✅ Clear distinction between filtered vs failed
- ✅ Detailed failure reporting for debugging
- ✅ Soft-fail quota checks (never blocks scraped images)
- ✅ Per-image error isolation (one failure doesn't affect others)

**When debugging "none persisted" issues:**
1. Check `[ScrapedImages] ❌ CRITICAL` logs for failure breakdown
2. Review error categories and codes
3. Verify `tenantId` is present in crawler request
4. Check database connectivity and schema

