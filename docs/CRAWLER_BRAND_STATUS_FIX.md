# Crawler Brand Status Fix

**Date**: December 15, 2025  
**Issue**: brands.scraper_status not updated after crawl completion  
**Fix**: Added `markBrandCrawlFinished()` function to update brand status

---

## Root Cause

When the crawler completed successfully (or failed), it logged `CRAWL_RUN_END` but **never updated the `brands` table**:

```
CRAWL_RUN_END runId=crawl_XXX status=ok durationMs=75396
```

**Database Before Fix**:
```sql
SELECT scraper_status, scraped_at FROM brands WHERE id = '...';
-- scraper_status | scraped_at
-- never_run      | null
```

This meant the UI could NOT distinguish:
- Never crawled
- Crawled successfully with 0 assets (example.com case)
- Failed crawl

---

## Files Changed

###human 1. **New File**: `server/lib/brand-status-updater.ts`
Created helper functions to update brand crawl status:

```typescript
export async function markBrandCrawlFinished(
  brandId: string,
  data: CrawlCompletionData
): Promise<void>
```

**What it does**:
- Updates `brands.scraper_status` to `'ok'` or `'error'`
- Sets `brands.scraped_at` to current timestamp
- Sets `brands.updated_at` to current timestamp
- Logs structured info (duration, pages scraped, assets extracted)

### 2. **Modified**: `server/routes/crawler.ts`
Integrated brand status updates at all 3 `logCrawlRunEnd()` call sites:

**Location 1** (cached result):
```typescript
// Line ~739
await markBrandCrawlFinished(brandId, {
  status: "ok",
  runId: crawlRunId,
  durationMs: crawlDurationMs,
  // ...
});
```

**Location 2** (successful crawl):
```typescript
// Line ~1211
await markBrandCrawlFinished(brandId, {
  status: "ok",
  runId: crawlRunId,
  durationMs: crawlDurationMs,
  pagesScraped: crawlResults?.length || 0,
  imagesExtracted: brandKit.images?.length || 0,
  colorsExtracted: brandKit.colors?.allColors?.length || 0,
  url,
});
```

**Location 3** (failed crawl):
```typescript
// Line ~1243
await markBrandCrawlFinished(brandId, {
  status: "error",
  runId: crawlRunId,
  durationMs: crawlDurationMs,
  error: errorMessage,
  url,
});
```

### 3. **New Test**: `server/__tests__/crawler-brand-status.test.ts`
Comprehensive test suite (5 tests, all passing):

1. ✅ Updates status to `'ok'` after successful crawl with assets
2. ✅ Updates status to `'ok'` even with 0 assets extracted (example.com case) **CRITICAL TEST**
3. ✅ Updates status to `'error'` after failed crawl
4. ✅ Handles multiple crawl runs (idempotency)
5. ✅ Doesn't crash with temporary brand IDs (`brand_xxx`)

---

## How to Verify

### Automated Verification (Tests)
```bash
pnpm vitest run server/__tests__/crawler-brand-status.test.ts
```

**Expected Output**:
```
✓ server/__tests__/crawler-brand-status.test.ts (5 tests)
  ✓ should update brand status to 'ok' after successful crawl with assets
  ✓ should update brand status to 'ok' even when 0 assets extracted
  ✓ should update brand status to 'error' after failed crawl
  ✓ should handle multiple crawl runs (idempotency)
  ✓ should not crash when brand_id is temporary

Test Files  1 passed (1)
Tests  5 passed (5)
```

### Runtime Verification (Live System)

1. **Start dev server**:
   ```bash
   pnpm dev
   ```

2. **Create a brand and trigger crawl** (via UI onboarding or API)

3. **Check brand status**:
   ```bash
   node scripts/check-brand-scrape-status.mjs <BRAND_ID>
   ```

   **Expected Output** (for example.com with 0 assets):
   ```
   🏢 Brand Info:
      Name: Example
      Website: https://example.com

   📊 Crawl Status:
      Scraper Status: ok        ← ✅ No longer 'never_run'!
      Scraped At: 2025-12-15T... ← ✅ Timestamp is set!
      Updated At: 2025-12-15T...

   📁 Media Assets: 0

   💡 Interpretation:
      ✅ Crawler completed successfully but found 0 assets
         (This is expected for sites like example.com)
   ```

4. **Check server logs**:
   ```bash
   tail -f /tmp/postd-fixed-dev.log | grep "Brand crawl status"
   ```

   **Expected Log Entry**:
   ```json
   {
     "level":"info",
     "message":"Brand crawl status updated",
     "context":{
       "brandId":"...",
       "runId":"crawl_...",
       "status":"ok",
       "scraped_at":"2025-12-15T...",
       "durationMs":75396,
       "pagesScraped":1,
       "imagesExtracted":0,  ← 0 assets, but status is 'ok'
       "colorsExtracted":0,
       "error":null
     }
   }
   ```

---

## Example.com Expected Result

**Before Fix** (BUG):
- scraper_status: `'never_run'` ❌
- scraped_at: `null` ❌
- **Problem**: UI can't tell if crawler never ran or found nothing

**After Fix** (CORRECT):
- scraper_status: `'ok'` ✅
- scraped_at: `'2025-12-15T18:26:28.195Z'` ✅
- media_assets count: `0` ✅
- **UI can now show**: "Brand scanned on Dec 15, no assets found"

---

## Technical Details

### Status Values
- `'ok'`: Crawl completed successfully (even if 0 assets found)
- `'error'`: Crawl failed with error
- `'running'`: Crawl in progress (optional, not currently used)
- `'never_run'` or `null`: Crawler never attempted

### Edge Cases Handled
1. **Temporary brand IDs** (`brand_xxx`): Skipped gracefully (logs error, doesn't throw)
2. **Cached results**: Status still updated (marked as `cached: true`)
3. **Multiple crawl runs**: Each run updates status (idempotent)
4. **Missing columns**: Doesn't set `scraper_error` column (doesn't exist in schema)

### Why This Matters
Without this fix:
- UI blank state is ambiguous
- Can't distinguish "never scanned" from "scanned but empty"
- Users don't know if onboarding succeeded or failed
- QA/debugging is harder (no timestamp of last crawl attempt)

With this fix:
- UI can show meaningful messages
- Timestamp proves crawl completed
- Error states are trackable
- User confidence improves

---

## Rollout Notes

- **Breaking Changes**: None
- **Migration Required**: No (uses existing columns)
- **Backward Compatible**: Yes (doesn't break existing crawls)
- **Performance Impact**: Negligible (single DB update per crawl)
- **Monitoring**: Watch for "Failed to update brand crawl status" error logs

---

## Related Documents
- `docs/CRAWLER_BRAND_STATUS_BUG.md` - Original bug report
- `docs/FIRST_RUN_UI_VERIFICATION_REPORT.md` - UI test findings
- `scripts/check-brand-scrape-status.mjs` - Verification tool
- `server/__tests__/crawler-brand-status.test.ts` - Test suite

