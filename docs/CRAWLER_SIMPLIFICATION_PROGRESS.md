# Crawler Simplification Progress (Vercel-Friendly)

**Date**: 2025-12-17  
**Status**: 🚧 IN PROGRESS - Phase 1 Complete  
**Goal**: Make crawler work within Vercel's 60-second timeout

---

## 🎯 **Problem Statement**

**Original Issue**: Async crawler hitting Vercel 60s timeout  
**Root Cause**: Single job tries to do everything (crawl + colors + AI) in one 55+ second execution  
**Evidence**: `2025-12-17 22:13:02 [error] [Vercel] Request timeout after 55s`

**Timeline from Failed Job**:
```
22:12:09 - Job claimed
22:12:32 - Crawl complete (23s)
22:12:47 - Color extraction done (16s)
22:13:01 - OpenAI call failed (14s)
22:13:02 - Vercel timeout (55s total)  ← KILLED
```

**Why It Failed**:
- Crawled 80+ pages from Stripe sitemap (including all locale routes)
- Browser errors when Vercel killed the function mid-execution
- OpenAI → Claude fallback chain added latency
- No single step budgets

---

## ✅ **Phase 1: Infrastructure (COMPLETE)**

### **Files Created**

1. **`supabase/migrations/20241217_crawl_steps.sql`**
   - Added `step` column: `fetch | render | generate | completed | failed`
   - Added `step_attempt` counter for retries
   - Added `next_run_at` for backoff scheduling
   - Added `raw_data`, `rendered_data`, `step_timings` JSONB columns
   - Created indexes for efficient step queries

2. **`server/lib/crawl-error-codes.ts`**
   - Canonical error codes (FETCH_FAILED, RENDER_TIMEOUT, AI_EMPTY, etc.)
   - User-friendly messages for each code
   - Retryability checks

3. **`server/workers/crawl-steps.ts`**
   - **Step A**: Fast HTTP fetch (10s timeout, no browser)
     - Extracts: title, meta, favicon, og:image, logos, hero text, links
     - Detects if browser needed (JS-heavy signals)
     - MAX_LINKS = 30, skips locale routes
   - **Step B**: Browser render (20s timeout, optional)
     - Only runs if Step A is "thin"
     - Extracts rendered logos, bg images, visible content
   - **Step C**: AI generation (15s timeout, isolated)
     - No fallback chain (fail fast)
     - Clear error codes

4. **`server/lib/crawler-step-processor.ts`**
   - "Dumb and predictable" job runner
   - Process ONE job, ONE step per invocation
   - Atomic job claiming
   - Step advancement logic
   - Retry with backoff (0s, 1min, 5min)
   - Stale job reaper

---

## 🚧 **Phase 2: Integration (IN PROGRESS)**

### **TODO: Update Existing Files**

- [ ] Update `server/lib/crawler-job-service.ts`:
  - `createCrawlJob()` → set `step: 'fetch'`
  - Keep existing `getCrawlJobStatus()` (no changes needed)

- [ ] Update `server/routes/crawler.ts`:
  - `POST /api/crawl/process-jobs` → use `crawler-step-processor.processPendingJobs()`
  - Replace old processor import

- [ ] Run migration:
  - Apply `20241217_crawl_steps.sql` to production Supabase

---

## 📋 **Phase 3: Testing & Verification (PENDING)**

### **Verification Checklist**

- [ ] TypeScript compiles (`pnpm typecheck`)
- [ ] Build succeeds (`pnpm build`)
- [ ] Run local test:
  ```bash
  node scripts/test-async-crawler-e2e.mjs
  # Should now show step progression: fetch → generate → completed
  ```
- [ ] Deploy to Vercel
- [ ] Test with stripe.com:
  - Should complete in < 60s
  - Should only crawl 2 pages max (not 80+)
  - Should show clear progress: "Fetching → Generating"
- [ ] Check Vercel logs for step transitions:
  ```
  [StepProcessor] Job claimed → step=fetch
  [StepA] Fetch complete → 1200ms
  [StepProcessor] Advanced to next step → step=generate
  [StepC] Generation complete → 8900ms
  [StepProcessor] Job completed
  ```

---

## 🎯 **Expected Improvements**

| Metric | Before | After |
|--------|--------|-------|
| Pages crawled | 80+ | 2 max |
| Timeout risk | HIGH (55s+) | LOW (<60s) |
| Single step duration | N/A | <25s each |
| Browser usage | Always | Optional (rare) |
| Error clarity | "Crawl timed out" | Clear codes (AI_TIMEOUT, etc.) |
| Retry logic | None | Backoff per step |

---

## 📝 **Next Steps** (After Phase 2)

1. **Phase 4**: Reduce surface area further
   - Implement MAX_PAGES = 2 in Step A
   - Skip locale routes in link extraction
   - Skip /sitemap, /blog, /newsroom, /jobs

2. **Phase 5**: Simplify image strategy
   - Prefer: og:image, favicon, header SVG
   - Treat "images" as bonus, not requirement
   - Skip heavy role classification

3. **Phase 6**: Client-side improvements
   - Display `error_code` + `message` on failure
   - Show "Retry" button for retryable errors
   - Update progress messages: "Fetching... → Generating..."

---

## 🚀 **Deployment Plan**

1. **Run migration** in Supabase SQL Editor
2. **Deploy code** to Vercel
3. **Test with real site** (stripe.com or sdirawealth.com)
4. **Monitor Vercel logs** for step progression
5. **Verify DB** shows `step` transitions

---

**Status**: Core infrastructure complete, integration in progress.  
**Next**: Update `crawler-job-service.ts` and `routes/crawler.ts` to use new processor.

