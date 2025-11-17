# Website Scraper Integration Status

**Date**: 2025-01-16  
**Status**: ⚠️ **PARTIALLY IMPLEMENTED** - Real crawler exists but NOT connected to onboarding flow

---

## Current State

### ❌ **NOT FULLY IMPLEMENTED**

The website scraper infrastructure exists, but **the real crawler is NOT being called during onboarding**. The Edge Function currently only returns fallback data.

---

## 1. Edge Function (process-brand-intake)

### Current Implementation
**File**: `supabase/functions/process-brand-intake/index.ts`

**Status**: ❌ **USING FALLBACK ONLY**

```typescript
// Line 85: Currently ONLY uses fallback
const brandKit = generateBrandKitFallback(websiteUrl);
```

**Issues**:
- ❌ Fallback logic is **NOT** replaced with real crawler output
- ❌ Real crawler is **NOT** called from Edge Function
- ❌ Returns **hardcoded fallback data** (not scraped)

**What it returns**:
- Hardcoded colors: `#8B5CF6`, `#F0F7F7`, `#EC4899`
- Generic tone: `["professional", "trustworthy"]`
- Generic about blurb: `"Brand from {domain}. Please complete intake form for more details."`
- No real logo, images, or scraped content

---

## 2. Crawler Integration

### Crawler Exists But Not Connected
**File**: `server/workers/brand-crawler.ts`

**Status**: ✅ **IMPLEMENTED** but ❌ **NOT CALLED**

**What exists**:
- ✅ `crawlWebsite(url)` - Crawls website using Playwright
- ✅ `extractColors(url)` - Extracts color palette using node-vibrant
- ✅ `processBrandIntake()` - Main orchestrator function
- ✅ Proper timeout, error handling, retry logic

**The Problem**:
- ❌ Edge Function runs in **Deno** (Supabase Edge Functions)
- ❌ Crawler uses **Playwright** (Node.js-only, requires Chromium)
- ❌ **Cannot run Playwright in Deno Edge Functions**

**Alternative Route**:
- ✅ `/api/crawl/start` exists in `server/routes/crawler.ts`
- ✅ This route **DOES** call `crawlWebsite()` and `extractColors()`
- ❌ But this route is **NOT** called during onboarding
- ⚠️ This route is designed for **updating existing brand kits**, not initial onboarding

---

## 3. Brand Snapshot Output

### Current Behavior
**File**: `client/pages/onboarding/Screen3AiScrape.tsx`

**What happens**:
1. Frontend calls Edge Function: `/functions/v1/process-brand-intake`
2. Edge Function returns **fallback data only**
3. Frontend transforms fallback data into Brand Snapshot format
4. User sees **generic, non-scraped data**

**Result**:
- ❌ Colors do **NOT** update with real website colors
- ❌ Logo/hero image is **NOT** captured
- ❌ Headline/about text is **NOT** extracted
- ❌ Brand kit is **NOT** populated with real scraped data

---

## 4. Fallback Behavior

### Current Implementation
**Status**: ✅ **WORKS** (but it's the only thing working)

- ✅ Gracefully returns fallback data
- ✅ Onboarding succeeds without blocking
- ⚠️ But it's **always** fallback - never real data

---

## 5. Real-World Testing

### Status: ❌ **NOT TESTED**

**Reason**: The real crawler is not being called, so testing would only verify fallback behavior.

**What would need to be tested** (once integrated):
- Successful scrape (simple HTML sites)
- Partial scrape with fallback (JS-heavy sites)
- Full fallback on failure (blocked sites, timeouts)

---

## Root Cause

### The Deno/Node.js Incompatibility

**Edge Function** (Deno):
- Runs in Supabase Edge Functions runtime
- Cannot use Node.js packages like Playwright
- Cannot run Chromium browser

**Crawler** (Node.js):
- Requires Playwright (Node.js-only)
- Requires Chromium browser
- Must run in Node.js/Express backend

**Solution Options**:
1. **Call backend crawler from Edge Function** (HTTP request to Express server)
2. **Call backend crawler directly from frontend** (bypass Edge Function)
3. **Migrate crawler to Deno-compatible solution** (not feasible - no Playwright for Deno)

---

## Recommended Solution

### Option 1: Call Backend Crawler from Frontend (RECOMMENDED)

**Changes needed**:

1. **Update `Screen3AiScrape.tsx`**:
   ```typescript
   // Instead of calling Edge Function:
   // const response = await fetch(`${supabaseUrl}/functions/v1/process-brand-intake`, ...);
   
   // Call backend crawler endpoint:
   const response = await fetch(`/api/crawl/start`, {
     method: "POST",
     body: JSON.stringify({
       brand_id: brandId,
       url: user.website,
     }),
   });
   
   // Poll for results
   const jobId = response.json().job_id;
   // Poll /api/crawl/result/:jobId until status === "completed"
   ```

2. **Update `server/routes/crawler.ts`**:
   - Ensure it returns data in format expected by onboarding
   - Add timeout handling for onboarding context
   - Return structured Brand Kit data

**Pros**:
- ✅ Uses existing crawler infrastructure
- ✅ No Edge Function changes needed
- ✅ Can handle timeouts gracefully
- ✅ Real scraped data flows to onboarding

**Cons**:
- ⚠️ Requires Express server to be running
- ⚠️ Adds polling complexity to frontend

### Option 2: Call Backend from Edge Function (ALTERNATIVE)

**Changes needed**:

1. **Update Edge Function**:
   ```typescript
   // In Edge Function, make HTTP request to Express backend
   const backendUrl = Deno.env.get("BACKEND_URL") || "http://localhost:8080";
   const crawlResponse = await fetch(`${backendUrl}/api/crawl/start`, {
     method: "POST",
     body: JSON.stringify({ brand_id: brandId, url: websiteUrl }),
   });
   // Poll for results...
   ```

**Pros**:
- ✅ Keeps onboarding flow unchanged
- ✅ Centralized scraping logic

**Cons**:
- ⚠️ Requires backend URL configuration
- ⚠️ Adds latency (Edge Function → Backend → Crawler)
- ⚠️ More complex error handling

---

## Implementation Plan

### Phase 1: Connect Crawler to Onboarding (HIGH PRIORITY)

1. **Update `Screen3AiScrape.tsx`**:
   - Replace Edge Function call with `/api/crawl/start`
   - Add polling logic for crawl results
   - Handle timeout/error gracefully

2. **Update `server/routes/crawler.ts`**:
   - Ensure response format matches onboarding expectations
   - Add timeout (30s max for onboarding)
   - Return structured Brand Kit data

3. **Test with real websites**:
   - Simple HTML site (should work)
   - JS-heavy site (may need fallback)
   - Blocked/timeout site (should fallback gracefully)

### Phase 2: Enhance Crawler Output (MEDIUM PRIORITY)

1. **Extract logo/hero image**:
   - Add logo detection to crawler
   - Extract hero/featured images
   - Return image URLs in Brand Kit

2. **Extract headlines**:
   - Parse H1/H2 tags
   - Extract meta descriptions
   - Return in Brand Kit

3. **Improve color extraction**:
   - Use multiple methods (CSS, images, favicon)
   - Return confidence scores
   - Provide fallback palette

### Phase 3: Error Handling & Fallbacks (LOW PRIORITY)

1. **Robust error handling**:
   - Timeout detection
   - Network error handling
   - JS-heavy site detection

2. **Smart fallbacks**:
   - Use domain-based defaults
   - Infer from URL structure
   - Provide helpful error messages

---

## Summary

### Current State
- ❌ **Real crawler NOT connected to onboarding**
- ❌ **Edge Function only returns fallback data**
- ✅ **Crawler infrastructure exists but unused**
- ✅ **Fallback behavior works correctly**

### What's Needed
1. Connect frontend to `/api/crawl/start` instead of Edge Function
2. Add polling logic for crawl results
3. Test with real websites
4. Handle timeouts/errors gracefully

### Estimated Effort
- **Phase 1** (Connect crawler): 2-3 hours
- **Phase 2** (Enhance output): 4-6 hours
- **Phase 3** (Error handling): 2-3 hours
- **Total**: ~8-12 hours

---

## Next Steps

1. ✅ **Confirm with user**: Proceed with Option 1 (frontend → backend crawler)?
2. ⏳ **Implement**: Update `Screen3AiScrape.tsx` to call `/api/crawl/start`
3. ⏳ **Test**: Verify with 3-5 real websites
4. ⏳ **Document**: Update onboarding flow documentation

