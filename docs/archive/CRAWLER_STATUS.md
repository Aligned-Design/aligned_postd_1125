> **SUPERSEDED:** This document is historical. For the latest brand intake and crawler documentation, see [`docs/CRAWLER_AND_BRAND_SUMMARY.md`](../CRAWLER_AND_BRAND_SUMMARY.md).  
> **Archived per Phase 5 documentation cleanup (2025-01-20)**

---

# Website Crawler Status

**Date**: 2025-01-16  
**Status**: ✅ **FULLY IMPLEMENTED** - Image extraction, logo detection, and headline surfacing complete

---

## Overview

The website scraper is now fully implemented with image extraction, logo detection, and headline surfacing. During onboarding, users entering a website URL will receive a rich Brand Snapshot with:

- ✅ Real color palette extracted from website
- ✅ Keywords extracted from content
- ✅ About blurb from meta description or body text
- ✅ Inferred tone and style
- ✅ **Images extracted (logo, hero, other)**
- ✅ **Logo URL detected and stored**
- ✅ **Headlines extracted and surfaced**

---

## Extracted Fields

### 1. Colors
- **Source**: Screenshot analysis using node-vibrant
- **Fields**: `primary`, `secondary`, `accent` (with confidence score)
- **Reliability**: High

### 2. Keywords
- **Source**: Text content analysis (title, meta description, body text)
- **Fields**: `keyword_themes` (top 10 keywords)
- **Reliability**: Medium (simple extraction, could be improved with AI)

### 3. About Blurb
- **Source**: Meta description or first 160 chars of body text
- **Fields**: `about_blurb`
- **Reliability**: High

### 4. Tone & Style
- **Source**: Inferred from text content using keyword matching
- **Fields**: `voice_summary.tone`, `voice_summary.style`
- **Reliability**: Medium (simple heuristic, could be improved with AI)

### 5. Images ✅ NEW
- **Source**: `<img>` tags and background images from major sections
- **Fields**: `images[]` with metadata:
  - `url`: Absolute URL (normalized)
  - `alt`: Alt text if available
  - `width`, `height`: Image dimensions
  - `role`: "logo" | "hero" | "other"
- **Reliability**: High (for standard HTML sites)
- **Limitations**: May miss images loaded via JS after page load

### 6. Logo ✅ NEW
- **Source**: Image detection with heuristics:
  - `img[alt*="logo" i]`
  - `.logo img`
  - `header img` (small images < 400px)
- **Fields**: `logoUrl` (first image with `role="logo"`)
- **Reliability**: Medium (heuristic-based, may miss some logos)
- **Limitations**: 
  - May not detect SVG logos
  - May miss logos loaded via JS
  - May incorrectly identify non-logo images

### 7. Headlines ✅ NEW
- **Source**: H1, H2, H3 tags from crawled pages
- **Fields**: `headlines[]` (up to 5 unique headlines)
- **Reliability**: High (for standard HTML sites)
- **Limitations**: May miss headlines loaded via JS

---

## Implementation Details

### Image Extraction (`extractImages()`)

**Location**: `server/workers/brand-crawler.ts`

**Process**:
1. Extracts all `<img>` tags with `src` or `srcset`
2. Extracts background images from major sections (`section`, `main`, `[class*="hero"]`, `[class*="banner"]`)
3. Normalizes URLs to absolute URLs
4. Detects role (logo/hero/other) using heuristics
5. Returns up to 20 unique images

**Logo Detection Heuristics**:
- Alt text contains "logo" (case-insensitive)
- Parent element has class/id containing "logo"
- Image in header/nav and < 400px wide/tall

**Hero Detection Heuristics**:
- Large image (> 600px wide, > 400px tall)
- Located near top of page (offsetTop < viewport height * 1.5)

### Headline Extraction

**Location**: `server/workers/brand-crawler.ts` and `server/routes/crawler.ts`

**Process**:
1. Extracts H1, H2, H3 from each crawled page
2. Cleans whitespace and filters empty strings
3. Deduplicates by lowercase text
4. Returns up to 5 unique headlines

### Data Flow

```
Onboarding → POST /api/crawl/start { url, sync: true }
    ↓
runCrawlJobSync(url)
    ↓
crawlWebsite(url) → extractPageContent() → extractImages()
    ↓
extractColors(url)
    ↓
Extract headlines from crawlResults
    ↓
Find logo (first image with role="logo")
    ↓
Return brandKit with:
  - colors
  - keywords
  - about_blurb
  - images[] (with role metadata)
  - logoUrl
  - headlines[]
  - source: "crawler" | "fallback"
    ↓
Frontend transforms to BrandSnapshot
    ↓
Brand Guide created with all scraped data
```

---

## Error Handling & Fallbacks

### Timeout
- **Current**: 25 seconds
- **TODO**: Consider increasing to 30-45s for JS-heavy sites if needed
- **Behavior**: Returns fallback data on timeout

### Error Handling
- All new logic (image/headline extraction) wrapped in try/catch
- On error, logs non-sensitive error and returns existing fallback
- Fallback includes:
  - Generic colors
  - Generic tone
  - Domain-based about blurb
  - Empty arrays for images, headlines, logoUrl
  - `source: "fallback"` metadata

### Source Metadata
- `source: "crawler"` - Real scraped data
- `source: "fallback"` - Fallback data used
- Frontend logs warning when fallback is used

---

## Known Limitations

### 1. JavaScript-Heavy Sites
- **Issue**: Images/headlines loaded via JS after page load may be missed
- **Impact**: May return fewer images/headlines than expected
- **Mitigation**: Playwright waits for `networkidle`, but may not catch all dynamic content

### 2. Logo Detection
- **Issue**: Heuristic-based, may miss some logos or incorrectly identify non-logos
- **Impact**: `logoUrl` may be empty or incorrect
- **Mitigation**: Falls back to first image if no logo detected

### 3. SVG Logos
- **Issue**: SVG logos may not be detected if not in `<img>` tags
- **Impact**: SVG logos may be missed
- **Mitigation**: None currently (would need SVG parsing)

### 4. Background Images
- **Issue**: Only extracts background images from major sections
- **Impact**: May miss some background images
- **Mitigation**: Covers most common cases (hero sections, banners)

### 5. Timeout
- **Issue**: 25 seconds may be too short for JS-heavy sites
- **Impact**: May timeout before full extraction
- **Mitigation**: Returns partial data or fallback

---

## Testing Recommendations

### Test Cases

1. **Simple HTML Site** (e.g., `example.com`)
   - ✅ Colors extracted
   - ✅ Keywords extracted
   - ✅ About blurb populated
   - ✅ Images extracted
   - ✅ Logo detected (if present)
   - ✅ Headlines extracted

2. **JS-Heavy Site** (e.g., `vercel.com`)
   - ⚠️ May miss some images/headlines loaded via JS
   - ✅ Should still extract some data
   - ✅ Should not timeout (or timeout gracefully)

3. **Site with Logo** (e.g., `stripe.com`)
   - ✅ Logo detected and `logoUrl` populated
   - ✅ Images array includes logo

4. **Site with Hero Image** (e.g., `airbnb.com`)
   - ✅ Hero image detected (role="hero")
   - ✅ Images array includes hero

5. **Blocked/Timeout Site**
   - ✅ Fallback data returned
   - ✅ Onboarding continues
   - ✅ `source: "fallback"` in response

---

## TODOs & Future Enhancements

### High Priority
1. **AI-Powered Tone Detection**
   - Replace simple keyword matching with AI analysis
   - More accurate tone inference

2. **Better Logo Heuristics**
   - Detect SVG logos
   - Use image analysis to detect logo-like images
   - Consider favicon as fallback

3. **Image Quality Filtering**
   - Filter out very small images (< 50px)
   - Filter out low-quality images
   - Prioritize high-resolution images

### Medium Priority
4. **Increase Timeout for JS-Heavy Sites**
   - Make timeout configurable
   - Progressive timeout (try 25s, then 45s if needed)

5. **Extract More Metadata**
   - Social media links
   - Contact information
   - Services/products mentioned

6. **Cache Crawl Results**
   - Cache by URL to avoid re-crawling
   - Set TTL (e.g., 7 days)

### Low Priority
7. **Progressive Enhancement**
   - Try fast extraction first (meta tags only)
   - Fall back to full crawl if needed

8. **Image Analysis**
   - Use AI to analyze image content
   - Detect product images, team photos, etc.

---

## Code Changes Summary

### Files Modified
1. `server/workers/brand-crawler.ts`
   - Added `CrawledImage` interface
   - Updated `CrawlResult` to include `images` and `headlines`
   - Implemented `extractImages()` helper
   - Updated `extractPageContent()` to call `extractImages()`
   - Added headline extraction in `extractPageContent()`

2. `server/routes/crawler.ts`
   - Updated `runCrawlJobSync()` to extract images, logo, headlines
   - Added `extractHeadlinesFromCrawlResults()` helper
   - Updated `generateFallbackBrandKit()` to include new fields
   - Added `source` metadata to responses
   - Added TODO comment for timeout increase

3. `client/pages/onboarding/Screen3AiScrape.tsx`
   - Updated to include `logo`, `images`, `headlines` in BrandSnapshot
   - Maps image objects to URLs for display

4. `client/lib/onboarding-brand-sync.ts`
   - Updated to map `logoUrl` to `visualIdentity.logoUrl`
   - Updated to map `headlines` to `identity.sampleHeadlines`
   - Updated `approvedAssets.uploadedPhotos` to include scraped images

5. `shared/brand-guide.ts`
   - Added `sampleHeadlines?: string[]` to `identity`

6. `server/routes/brand-guide-generate.ts`
   - Updated to include `sampleHeadlines` in Brand Guide generation

7. `server/lib/brand-guide-service.ts`
   - Updated to save `sampleHeadlines` to Supabase

8. `client/pages/onboarding/Screen5BrandSummaryReview.tsx`
   - Updated to use real scraped images instead of mock data

---

## Summary

The website scraper is now **fully implemented** with:

✅ **Image Extraction**: Extracts images from `<img>` tags and background images  
✅ **Logo Detection**: Detects logos using heuristics  
✅ **Headline Extraction**: Extracts H1/H2/H3 headlines  
✅ **Error Handling**: Graceful fallbacks on errors/timeouts  
✅ **Source Metadata**: Indicates whether data is from crawler or fallback  
✅ **Brand Guide Integration**: All scraped data flows into Brand Guide  

**Next Steps**: Test with 3-5 real websites to verify extraction quality, then consider AI-powered tone detection and improved logo heuristics.

