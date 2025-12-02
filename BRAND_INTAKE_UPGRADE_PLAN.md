# Brand Intake Upgrade Plan - Key Files Reference

**Date:** 2025-01-14  
**Purpose:** Upgrade Brand Intake to use real crawler and add Open Graph metadata

---

## STEP 1: Key Files Located

### Core Scraper Files
- ✅ `server/workers/brand-crawler.ts` – Core crawler implementation (1,449 lines)
  - `crawlWebsite()` - Main crawling function
  - `extractPageContent()` - HTML → structured content (needs OG extraction)
  - `extractColors()` - Color palette extraction
  - `generateBrandKit()` - AI brand kit generation

- ✅ `server/routes/crawler.ts` – API routes (`/api/crawl/*`) (1,200 lines)
  - `POST /api/crawl/start` - Start crawl (supports sync mode)
  - `runCrawlJobSync()` - Synchronous crawl execution

- ✅ `server/lib/scraped-images-service.ts` – Image persistence (416 lines)
  - `persistScrapedImages()` - Save scraped images to `media_assets` table
  - `transferScrapedImages()` - Transfer images from temp to final brandId

### HTML Parsing & Content Extraction
- ✅ `server/workers/brand-crawler.ts:872-968` – `extractPageContent()`
  - Currently extracts: title, meta description, headings, body text
  - **MISSING:** Open Graph tags extraction

### Database Ingestion
- ✅ `server/routes/crawler.ts:326-639` – `runCrawlJobSync()`
  - Orchestrates crawling → extraction → persistence
  - Calls `persistScrapedImages()` to save images
  - Saves brand kit to `brands.brand_kit` JSONB

### API Routes
- ✅ `server/routes/crawler.ts` – Real crawler API
  - `/api/crawl/start?sync=true` - Synchronous crawl (used by onboarding)
  
- ⚠️ `supabase/functions/process-brand-intake/index.ts` – Edge Function (FALLBACK ONLY)
  - Currently used by Brand Intake page
  - **NEEDS:** Update to call real crawler OR Brand Intake should call `/api/crawl/start` directly

### Frontend UI Components
- ✅ `client/app/(postd)/brand-intake/page.tsx` – Brand Intake page (569 lines)
  - `handleImportFromWebsite()` - Currently calls Edge Function (line 162-235)
  - **NEEDS:** Update to call `/api/crawl/start?sync=true` instead

- ✅ `client/pages/onboarding/Screen3AiScrape.tsx` – Onboarding scraper (already uses real crawler)
  - Reference implementation for how to call crawler API

---

## Implementation Plan

### STEP 2: Wire Brand Intake to Real Crawler
**File to modify:** `client/app/(postd)/brand-intake/page.tsx`

**Changes needed:**
1. Replace Edge Function call (`/functions/v1/process-brand-intake`) with real crawler API (`/api/crawl/start?sync=true`)
2. Pass `workspaceId` from user context (similar to onboarding)
3. Update response handling to use real scraped data structure
4. Improve error handling (no silent fallback)
5. Show better loading states

### STEP 3: Add Open Graph Metadata Extraction
**File to modify:** `server/workers/brand-crawler.ts`

**Changes needed:**
1. Add OG tag extraction in `extractPageContent()` function
2. Create `OpenGraphMetadata` TypeScript type
3. Normalize relative URLs to absolute URLs
4. Add OG metadata to `CrawlResult` interface
5. Persist OG metadata to `brands.brand_kit.metadata.openGraph`
6. Update `BrandKitData` interface to include metadata

---

## Files to Modify

1. ✅ `client/app/(postd)/brand-intake/page.tsx` - Update `handleImportFromWebsite()`
2. ✅ `server/workers/brand-crawler.ts` - Add OG extraction to `extractPageContent()`
3. ✅ `server/workers/brand-crawler.ts` - Update interfaces for OG metadata
4. ✅ `server/routes/crawler.ts` - Persist OG metadata to database
5. ✅ `WEBSITE_SCRAPER_AND_BRAND_INGESTION_AUDIT.md` - Update audit doc

---

**Ready to proceed with implementation.**

