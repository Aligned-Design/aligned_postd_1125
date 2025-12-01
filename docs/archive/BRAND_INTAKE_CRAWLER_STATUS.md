> **SUPERSEDED:** This document is historical. For the latest brand intake and crawler documentation, see [`docs/CRAWLER_AND_BRAND_SUMMARY.md`](docs/CRAWLER_AND_BRAND_SUMMARY.md).  
> **Archived per Phase 5 documentation cleanup (2025-01-20)**

---

# Brand Intake Crawler Implementation Status

## ❌ NOT FULLY IMPLEMENTED

### Current State

1. **Edge Function** (`supabase/functions/process-brand-intake/index.ts`):
   - ✅ Exists and is called by frontend
   - ❌ **ONLY uses fallback data** - does NOT call real crawler
   - Comment in code: "For now, generate fallback brand kit. In the future, call to separate crawler service or use a different approach"

2. **Backend Crawler** (`server/workers/brand-crawler.ts`):
   - ✅ Fully implemented with:
     - `crawlWebsite()` - Uses Playwright to crawl up to 50 pages
     - `extractColors()` - Uses node-vibrant to extract color palette
     - `generateBrandKit()` - Uses OpenAI or fallback to generate brand kit
     - `processBrandIntake()` - Orchestrates the full process
   - ✅ Has retry logic, timeout handling, error handling
   - ✅ Respects robots.txt, same-domain only, depth limits
   - ❌ **NOT being called by Edge Function**

3. **Backend API** (`server/routes/crawler.ts`):
   - ✅ Has `/api/crawl/start` endpoint
   - ❌ Different use case (for updating existing brand kits, not initial intake)

## What Needs to Be Done

### Option 1: Edge Function → Backend API (Recommended)

1. **Create a new backend endpoint** for brand intake:
   ```typescript
   POST /api/brand-intake/process
   Body: { brandId, websiteUrl }
   Returns: { brandKit, success }
   ```

2. **Update Edge Function** to call backend API:
   ```typescript
   const backendUrl = Deno.env.get("BACKEND_API_URL") || "http://localhost:8080";
   const response = await fetch(`${backendUrl}/api/brand-intake/process`, {
     method: "POST",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify({ brandId, websiteUrl }),
   });
   const brandKit = await response.json();
   ```

3. **Add fallback** if backend is unavailable:
   ```typescript
   try {
     brandKit = await callBackendAPI();
   } catch (error) {
     console.warn("Backend unavailable, using fallback");
     brandKit = generateBrandKitFallback(websiteUrl);
   }
   ```

### Option 2: Direct Integration (Not Recommended)

- Refactor crawler to work in Deno (requires Deno-compatible Playwright)
- More complex, less maintainable

## Implementation Checklist

- [ ] Create `/api/brand-intake/process` endpoint in `server/routes/`
- [ ] Wire endpoint to `processBrandIntake()` from `brand-crawler.ts`
- [ ] Update Edge Function to call backend API
- [ ] Add proper error handling and fallback
- [ ] Test with 3-5 real websites:
  - [ ] Successful scrape (simple HTML site)
  - [ ] Partial scrape with fallback (JS-heavy site)
  - [ ] Full fallback on failure (blocked site)
- [ ] Verify colors update in brand snapshot
- [ ] Verify logo/hero image capture (if available)
- [ ] Verify headline/about text extraction
- [ ] Verify brand kit populates correctly in snapshot screen

## Current Limitations

1. **No Real Scraping**: Edge Function returns hardcoded fallback data
2. **No Color Extraction**: Colors are always `#8B5CF6`, `#F0F7F7`, `#EC4899`
3. **No Logo/Image Capture**: Not implemented
4. **No Headline/About Extraction**: Uses generic fallback text
5. **No Real-World Testing**: Cannot confirm it works with actual websites

## Fields Currently Extracted (Fallback Only)

- ❌ Colors: Hardcoded fallback
- ❌ Logo: Not captured
- ❌ Hero Image: Not captured
- ❌ Headline: Generic fallback
- ❌ About Text: Generic fallback
- ✅ Voice Summary: Generic fallback (professional, trustworthy)
- ✅ Keyword Themes: Domain name only

## Fields That Would Be Extracted (If Implemented)

- ✅ Colors: Extracted via node-vibrant from screenshots
- ✅ Logo: Could be extracted from `<img>` tags or meta tags
- ✅ Hero Image: Could be extracted from hero sections
- ✅ Headline: Extracted from `<h1>` tags
- ✅ About Text: Extracted from meta description or first paragraph
- ✅ Voice Summary: Generated via OpenAI from crawled content
- ✅ Keyword Themes: Extracted from content frequency analysis

## Follow-Up Tasks

1. **Immediate**: Implement Option 1 (Edge Function → Backend API)
2. **Short-term**: Add logo/hero image extraction to crawler
3. **Short-term**: Test with 3-5 real websites
4. **Medium-term**: Add image download/storage for logos and hero images
5. **Medium-term**: Improve fallback logic for JS-heavy sites
6. **Long-term**: Consider using a headless browser service (Puppeteer Cloud, Browserless) for better JS support

