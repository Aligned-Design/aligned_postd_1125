# MVP1 Audit Report: Website Scraper → Brand Intake → Auto-Populate Pipeline

**Date:** 2025-01-XX  
**Auditor:** AI Assistant  
**Scope:** V1 MVP Requirements vs. Current Implementation

---

## Executive Summary

This audit evaluates the POSTD Website Scraper → Brand Intake → Auto-Populate pipeline against V1 MVP requirements. The pipeline is **mostly functional** but has **critical gaps** that must be addressed before production.

### Overall Status: ⚠️ **NEEDS FIXES**

**Key Findings:**
- ✅ Real scraper is implemented and functional
- ✅ Crawler respects robots.txt, depth ≤ 3, max 50 pages, 1s delay
- ✅ Open Graph metadata extraction is implemented
- ⚠️ Edge Function fallback still exists (should be removed/disabled)
- ⚠️ Brand Snapshot auto-population needs verification
- ⚠️ Brand Guide defaults update needs verification
- ✅ Database persistence is correct (media_assets, brands.brand_kit)

---

## V1 Requirements Checklist

### 1. Trigger the REAL scraper/Edge Function (no fallbacks)

**Status:** ⚠️ **PARTIAL**

**Findings:**
- ✅ Brand Intake page (`client/app/(postd)/brand-intake/page.tsx`) calls `/api/crawl/start?sync=true` (real scraper)
- ✅ Onboarding screen (`client/pages/onboarding/Screen3AiScrape.tsx`) calls `/api/crawl/start` (real scraper)
- ⚠️ Edge Function fallback exists at `supabase/functions/process-brand-intake/index.ts` with `generateBrandKitFallback()`
- ⚠️ Edge Function is NOT called by current code, but it exists and could be accidentally used

**Action Required:**
- Remove or disable Edge Function fallback
- Add comments/documentation that Edge Function should NOT be used
- Verify no other code paths call the Edge Function

**Code References:**
- ✅ `client/app/(postd)/brand-intake/page.tsx:186` - Calls real scraper
- ✅ `client/pages/onboarding/Screen3AiScrape.tsx:215` - Calls real scraper
- ⚠️ `supabase/functions/process-brand-intake/index.ts:33` - Fallback function exists

---

### 2. Crawl safely (single domain, robots.txt, depth ≤ 3, max 50 pages, 1s delay)

**Status:** ✅ **COMPLIANT**

**Findings:**
- ✅ Single domain: `server/workers/brand-crawler.ts:244-349` - Only follows same-domain links
- ✅ robots.txt: `server/workers/brand-crawler.ts:254-256` - Checks robots.txt before crawling
- ✅ Depth ≤ 3: `server/workers/brand-crawler.ts:65` - `MAX_DEPTH = 3`
- ✅ Max 50 pages: `server/workers/brand-crawler.ts:62` - `CRAWL_MAX_PAGES = 50` (configurable via env)
- ✅ 1s delay: `server/workers/brand-crawler.ts:66` - `CRAWL_DELAY_MS = 1000`

**Code References:**
- ✅ `server/workers/brand-crawler.ts:244` - `crawlWebsite()` function
- ✅ `server/workers/brand-crawler.ts:271` - robots.txt check
- ✅ `server/workers/brand-crawler.ts:268` - Depth check
- ✅ `server/workers/brand-crawler.ts:264` - Max pages check
- ✅ `server/workers/brand-crawler.ts:327` - Crawl delay

---

### 3. Extract Required Data

#### 3.1 Hero headline, Subheadlines

**Status:** ✅ **COMPLIANT**

**Findings:**
- ✅ Extracts H1, H2, H3: `server/workers/brand-crawler.ts:902-910`
- ✅ Stores in `CrawlResult.h1`, `h2`, `h3` arrays
- ✅ Extracts headlines: `server/workers/brand-crawler.ts:863-884` - `extractHeadlines()`
- ✅ Included in brandKit: `server/routes/crawler.ts:453` - `headlines` field

**Code References:**
- ✅ `server/workers/brand-crawler.ts:902-910` - Heading extraction
- ✅ `server/workers/brand-crawler.ts:863-884` - Headlines extraction
- ✅ `server/routes/crawler.ts:572` - Headlines in brandKit

#### 3.2 About/mission statements

**Status:** ✅ **COMPLIANT**

**Findings:**
- ✅ Extracts body text: `server/workers/brand-crawler.ts:913-929`
- ✅ AI generates `about_blurb`: `server/workers/brand-crawler.ts:1279-1333` - `generateBrandSummaryWithAI()`
- ✅ Stores in `brandKit.about_blurb`: `server/routes/crawler.ts:566`
- ✅ Also generates `longFormSummary`: `server/workers/brand-crawler.ts:1318-1320`

**Code References:**
- ✅ `server/workers/brand-crawler.ts:1279-1333` - AI summary generation
- ✅ `server/routes/crawler.ts:566` - about_blurb in brandKit

#### 3.3 Services/products

**Status:** ⚠️ **PARTIAL**

**Findings:**
- ⚠️ Not explicitly extracted as structured data
- ✅ Keywords extracted: `server/workers/brand-crawler.ts:1402` - `keyword_themes` in AI prompt
- ✅ Keywords stored: `server/routes/crawler.ts:565` - `keyword_themes` in brandKit
- ⚠️ Services/products would need to be inferred from keywords or body text

**Action Required:**
- Consider adding explicit services/products extraction (optional for V1)
- Current implementation extracts keywords which may include services/products

#### 3.4 Key brand tone indicators

**Status:** ✅ **COMPLIANT**

**Findings:**
- ✅ AI extracts tone: `server/workers/brand-crawler.ts:1402` - Tone in AI prompt
- ✅ Stores in `voice_summary.tone`: `server/workers/brand-crawler.ts:1434`
- ✅ Also extracts style, avoid, audience, personality: `server/workers/brand-crawler.ts:1433-1439`

**Code References:**
- ✅ `server/workers/brand-crawler.ts:1397-1453` - AI brand kit generation
- ✅ `server/routes/crawler.ts:545-577` - voice_summary in brandKit

#### 3.5 10–15 meaningful images (deduped, filtered for size)

**Status:** ✅ **COMPLIANT**

**Findings:**
- ✅ Extracts images: `server/workers/brand-crawler.ts:619-858` - `extractImages()`
- ✅ Deduplicates by URL: `server/workers/brand-crawler.ts:786-792`
- ✅ Filters by size: `server/workers/brand-crawler.ts:822-839` - Skips tiny icons (< 50x50)
- ✅ Limits to 15: `server/workers/brand-crawler.ts:844` - `slice(0, 15)`
- ✅ Prioritizes: logo > hero > subject > other: `server/workers/brand-crawler.ts:585-608`

**Code References:**
- ✅ `server/workers/brand-crawler.ts:619-858` - Image extraction
- ✅ `server/workers/brand-crawler.ts:844` - Limit to 15 images
- ✅ `server/routes/crawler.ts:426` - Final limit to 15

#### 3.6 Brand colors (CSS + image-based palette of 6+)

**Status:** ✅ **COMPLIANT**

**Findings:**
- ✅ Extracts colors: `server/workers/brand-crawler.ts:1194-1272` - `extractColors()`
- ✅ Uses node-vibrant for image-based extraction: `server/workers/brand-crawler.ts:1209`
- ✅ 6-color palette structure: `server/workers/brand-crawler.ts:1242-1261`
  - `primaryColors` (up to 3)
  - `secondaryColors` (up to 3)
  - `allColors` (max 6)
- ✅ Stores in brandKit: `server/routes/crawler.ts:527-542`

**Code References:**
- ✅ `server/workers/brand-crawler.ts:1194-1272` - Color extraction
- ✅ `server/routes/crawler.ts:527-542` - Color palette structure

#### 3.7 Typography hints

**Status:** ✅ **COMPLIANT**

**Findings:**
- ✅ Extracts typography: `server/workers/brand-crawler.ts:1096-1189` - `extractTypography()`
- ✅ Detects heading and body fonts: `server/workers/brand-crawler.ts:1100-1157`
- ✅ Identifies Google Fonts: `server/workers/brand-crawler.ts:1170-1178`
- ✅ Stores in brandKit: `server/routes/crawler.ts:456-458`

**Code References:**
- ✅ `server/workers/brand-crawler.ts:1096-1189` - Typography extraction
- ✅ `server/routes/crawler.ts:568` - Typography in brandKit

#### 3.8 Metadata: `<title>`, `<meta name="description">`, Open Graph tags

**Status:** ✅ **COMPLIANT**

**Findings:**
- ✅ Extracts title: `server/workers/brand-crawler.ts:894`
- ✅ Extracts meta description: `server/workers/brand-crawler.ts:897-899`
- ✅ Extracts Open Graph: `server/workers/brand-crawler.ts:999-1090` - `extractOpenGraphMetadata()`
  - `og:title`, `og:description`, `og:image`, `og:url`, `og:type`, `og:site_name`
  - Twitter Card tags: `twitter:title`, `twitter:description`, `twitter:image`, `twitter:card`
- ✅ Stores in brandKit: `server/routes/crawler.ts:460-463, 554, 574`

**Code References:**
- ✅ `server/workers/brand-crawler.ts:999-1090` - Open Graph extraction
- ✅ `server/routes/crawler.ts:554, 574` - Open Graph in brandKit metadata

---

### 4. Persist all extracted data into correct Supabase tables

#### 4.1 `media_assets` table

**Status:** ✅ **COMPLIANT**

**Findings:**
- ✅ Persists images: `server/lib/scraped-images-service.ts:43-203` - `persistScrapedImages()`
- ✅ Stores with `metadata.source = 'scrape'`: `server/lib/scraped-images-service.ts:127`
- ✅ Stores URL in `path` column: `server/lib/scraped-images-service.ts:146`
- ✅ Categorizes: logos, images, graphics: `server/lib/scraped-images-service.ts:104-109`
- ✅ Requires `tenantId` (UUID): `server/lib/scraped-images-service.ts:55-81`

**Code References:**
- ✅ `server/lib/scraped-images-service.ts:43-203` - Image persistence
- ✅ `server/routes/crawler.ts:493` - Calls `persistScrapedImages()`

#### 4.2 `brands.brand_kit` JSONB field

**Status:** ✅ **COMPLIANT**

**Findings:**
- ✅ Saves brandKit: `server/routes/crawler.ts:588-625` - Direct database save
- ✅ Includes all fields: colors, voice_summary, typography, about_blurb, metadata
- ✅ Also saves to `voice_summary` and `visual_summary` columns: `server/routes/crawler.ts:604-608`

**Code References:**
- ✅ `server/routes/crawler.ts:588-625` - BrandKit database save

#### 4.3 `brands.brand_kit.colors` (6-color palette)

**Status:** ✅ **COMPLIANT**

**Findings:**
- ✅ Stores 6-color palette: `server/routes/crawler.ts:527-542`
- ✅ Structure: `primaryColors`, `secondaryColors`, `allColors`
- ✅ Also in `visual_summary.colors`: `server/routes/crawler.ts:606`

**Code References:**
- ✅ `server/routes/crawler.ts:527-542` - Color palette structure

#### 4.4 `brand_ingestion_jobs` table

**Status:** ⚠️ **NOT FOUND**

**Findings:**
- ⚠️ Table not found in codebase
- ✅ Current implementation uses sync mode (no job table needed)
- ⚠️ Async mode exists but uses in-memory `crawlJobs` Map: `server/routes/crawler.ts:99`

**Action Required:**
- Decide if `brand_ingestion_jobs` table is needed for V1
- Current sync mode doesn't require it
- If async mode is used, consider adding job table for persistence

---

### 5. Auto-generate the Brand Snapshot with scraped data

**Status:** ⚠️ **NEEDS VERIFICATION**

**Findings:**
- ✅ Brand Snapshot page exists: `client/app/(postd)/brand-snapshot/page.tsx`
- ✅ Reads from `brands.brand_kit`: `client/app/(postd)/brand-snapshot/page.tsx:99`
- ⚠️ Need to verify it displays all scraped data correctly:
  - Colors: ✅ `client/app/(postd)/brand-snapshot/page.tsx:186-200`
  - Voice/Tone: ✅ `client/app/(postd)/brand-snapshot/page.tsx:137-141`
  - Images: ⚠️ Not visible in snapshot page (may be in Brand Guide only)

**Action Required:**
- Test Brand Snapshot with real scraped data
- Verify all fields are populated correctly
- Consider adding scraped images to snapshot display

**Code References:**
- ✅ `client/app/(postd)/brand-snapshot/page.tsx` - Brand Snapshot page
- ⚠️ Images not displayed in snapshot (may be intentional)

---

### 6. Update the Brand Guide defaults with scraped data

**Status:** ⚠️ **NEEDS VERIFICATION**

**Findings:**
- ✅ Brand Guide sync exists: `client/lib/onboarding-brand-sync.ts`
- ✅ Converts BrandSnapshot to BrandGuide: `client/lib/onboarding-brand-sync.ts:15-167`
- ✅ Saves via API: `client/lib/onboarding-brand-sync.ts:218-248`
- ✅ Brand Guide page reads scraped images: `server/routes/brand-guide.ts:75-87`
- ⚠️ Need to verify Brand Guide defaults are updated correctly:
  - Colors: ✅ `client/lib/onboarding-brand-sync.ts:75`
  - Tone: ✅ `client/lib/onboarding-brand-sync.ts:64`
  - Images: ✅ `client/lib/onboarding-brand-sync.ts:109-113`

**Action Required:**
- Test Brand Guide with real scraped data
- Verify defaults are populated from scraped data
- Ensure scraped images appear in Brand Guide

**Code References:**
- ✅ `client/lib/onboarding-brand-sync.ts` - Brand Guide sync
- ✅ `server/routes/brand-guide.ts` - Brand Guide API

---

### 7. Display scraped data correctly on Brand Intake screen

**Status:** ✅ **COMPLIANT**

**Findings:**
- ✅ Brand Intake updates form data: `client/app/(postd)/brand-intake/page.tsx:212-220`
- ✅ Updates colors: `client/app/(postd)/brand-intake/page.tsx:214-216`
- ✅ Updates tone keywords: `client/app/(postd)/brand-intake/page.tsx:217`
- ✅ Updates description: `client/app/(postd)/brand-intake/page.tsx:219`
- ✅ Shows success toast with image/color counts: `client/app/(postd)/brand-intake/page.tsx:222-225`

**Code References:**
- ✅ `client/app/(postd)/brand-intake/page.tsx:162-252` - Import from website handler

---

## Critical Issues

### Issue 1: Edge Function Fallback Still Exists
**Severity:** ⚠️ **MEDIUM**  
**Location:** `supabase/functions/process-brand-intake/index.ts`  
**Impact:** Could be accidentally used, returns mock data  
**Fix:** Remove or disable Edge Function, add documentation

### Issue 2: Brand Snapshot Auto-Population Needs Verification
**Severity:** ⚠️ **MEDIUM**  
**Location:** `client/app/(postd)/brand-snapshot/page.tsx`  
**Impact:** May not display all scraped data correctly  
**Fix:** Test with real scraped data, verify all fields populate

### Issue 3: Brand Guide Defaults Update Needs Verification
**Severity:** ⚠️ **MEDIUM**  
**Location:** `client/lib/onboarding-brand-sync.ts`, `server/routes/brand-guide.ts`  
**Impact:** Brand Guide may not auto-populate correctly  
**Fix:** Test with real scraped data, verify defaults update

### Issue 4: brand_ingestion_jobs Table Not Found
**Severity:** ℹ️ **INFO**  
**Location:** N/A  
**Impact:** None for sync mode, but async mode uses in-memory storage  
**Fix:** Decide if job table is needed for V1

---

## Tenant Isolation

**Status:** ✅ **COMPLIANT**

**Findings:**
- ✅ `tenantId` required for image persistence: `server/lib/scraped-images-service.ts:55-81`
- ✅ `tenantId` validated as UUID: `server/lib/scraped-images-service.ts:58`
- ✅ Images filtered by `brand_id` and `tenant_id`: `server/lib/scraped-images-service.ts:340-341`
- ✅ Brand Guide queries respect tenant: `server/routes/brand-guide.ts:75-87`

**Code References:**
- ✅ `server/lib/scraped-images-service.ts:55-81` - Tenant validation
- ✅ `server/routes/brand-guide.ts` - Tenant-aware queries

---

## Out of Scope (Correctly Excluded)

✅ Social profile link extraction - Not implemented  
✅ Social analytics - Not implemented  
✅ Connector-based data - Not implemented  
✅ Best-time-to-post logic - Not implemented  
✅ AI Advisor insights - Not implemented

---

## Recommendations

1. **Remove Edge Function Fallback** - Delete or disable `supabase/functions/process-brand-intake/index.ts`
2. **Test Brand Snapshot** - Verify auto-population with real scraped data
3. **Test Brand Guide** - Verify defaults update correctly
4. **Add Integration Tests** - Test full pipeline with 3 real websites
5. **Document Edge Function Status** - Add comments that it should NOT be used

---

## Next Steps

1. Fix Issue 1: Remove/disable Edge Function fallback
2. Fix Issue 2: Test and verify Brand Snapshot auto-population
3. Fix Issue 3: Test and verify Brand Guide defaults update
4. Create test plan for 3 real websites
5. Document test results

---

## Appendix: Code References

### Core Scraper
- `server/workers/brand-crawler.ts` - Main crawler implementation
- `server/routes/crawler.ts` - API endpoints

### Brand Intake UI
- `client/app/(postd)/brand-intake/page.tsx` - Main Brand Intake page
- `client/pages/onboarding/Screen3AiScrape.tsx` - Onboarding scraper screen

### Database Persistence
- `server/lib/scraped-images-service.ts` - Image persistence
- `server/lib/media-db-service.ts` - Media database operations

### Brand Guide & Snapshot
- `client/lib/onboarding-brand-sync.ts` - Brand Guide sync
- `client/app/(postd)/brand-snapshot/page.tsx` - Brand Snapshot page
- `server/routes/brand-guide.ts` - Brand Guide API

### Legacy (Should Not Be Used)
- `supabase/functions/process-brand-intake/index.ts` - Edge Function fallback

