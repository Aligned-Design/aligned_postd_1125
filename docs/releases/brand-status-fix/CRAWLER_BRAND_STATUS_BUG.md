# Bug: Brand Status Not Updated After Successful Crawl

**Severity**: Medium  
**Impact**: UI cannot distinguish between "never crawled" and "crawled successfully with no assets"

---

## Problem

When the crawler completes successfully, the `brands` table fields are not updated:

```sql
-- Current state after successful crawl:
{
  scraper_status: 'never_run',  -- ❌ Should be 'completed' or 'ok'
  scraped_at: null               -- ❌ Should be timestamp
}
```

### Evidence

**Crawler Log** (successful completion):
```
CRAWL_RUN_END runId=crawl_1765822639277_4ovjydvp 
              status=ok 
              durationMs=75396 
              pagesScraped=1
```

**Database Query** (after crawl):
```sql
SELECT scraper_status, scraped_at 
FROM brands 
WHERE id = 'e6cf2c9a-3b2b-4907-8fbc-6457dd3270fe';

-- Result:
-- scraper_status | scraped_at
-- never_run      | null
```

---

## Expected Behavior

After `CRAWL_RUN_END status=ok`, the system should:

1. Update `brands.scraper_status` to indicate success:
   - `'completed'`
   - `'ok'`
   - `'success'`

2. Update `brands.scraped_at` to current timestamp

3. Optionally store metadata:
   - Number of assets extracted
   - Last error (if any)
   - Crawl duration

---

## Root Cause

The crawler service likely:
1. Completes the crawl ✅
2. Logs `CRAWL_RUN_END` ✅
3. **BUT** doesn't update the `brands` table fields ❌

### Where to Look

Check these files:
- `server/services/crawler/` - Main crawler logic
- `server/services/crawler/persistence.ts` - Asset persistence
- Look for where `CRAWL_RUN_END` is logged but missing DB update

---

## Fix Required

### Option A: Update in Crawler Service
```typescript
// After successful crawl completion
await supabase
  .from('brands')
  .update({
    scraper_status: 'completed',
    scraped_at: new Date().toISOString(),
    metadata: {
      last_crawl_run_id: runId,
      last_crawl_duration_ms: durationMs,
      last_crawl_assets_found: assetsExtracted
    }
  })
  .eq('id', brandId);
```

### Option B: Update via Brand Status Endpoint
Create/update endpoint that crawler calls:
```typescript
POST /api/brands/:id/crawl-status
{
  status: 'completed',
  run_id: 'crawl_...',
  assets_extracted: 0,
  duration_ms: 75396
}
```

---

## Impact

### Current User Experience
- User completes onboarding
- Crawler runs successfully  
- UI shows "No logos/images found" ❌ CORRECT (because example.com has none)
- BUT backend thinks crawler "never ran" ❌ INCORRECT

### With Fix
- User completes onboarding
- Crawler runs successfully
- `scraper_status = 'completed'`
- UI can show: "Brand scanned on [date], no assets found"
- Or: "Brand scanned, found X logos and Y images"

---

## Verification Steps

After fix is applied:

1. Create new brand with real website (e.g., stripe.com)
2. Trigger onboarding/crawl
3. Wait for `CRAWL_RUN_END status=ok` log
4. Query database:
   ```sql
   SELECT scraper_status, scraped_at 
   FROM brands 
   WHERE id = '<BRAND_ID>';
   ```
5. Verify:
   - `scraper_status` != `'never_run'` ✅
   - `scraped_at` is not null ✅
   - Timestamp matches crawl completion time ✅

---

## Related Files

- `server/services/crawler/index.ts`
- `server/services/crawler/persistence.ts`
- `server/routes/crawl.ts`
- `supabase/migrations/001_bootstrap_schema.sql` (brands table schema)

