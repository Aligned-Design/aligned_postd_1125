# Onboarding Brand Images Audit Summary

**Date**: December 2025  
**Status**: ✅ Audit Complete - Ready for Improvements

---

## 1. Current Behavior Audit

### Image Scraping Flow

1. **Entry Point**: `client/pages/onboarding/Screen3AiScrape.tsx`
   - User enters website URL
   - Calls `/api/crawler/sync` endpoint
   - Shows progress indicators

2. **Backend Processing**: `server/routes/crawler.ts`
   - Crawls website with Puppeteer
   - Extracts images via `server/workers/brand-crawler.ts`
   - Classifies images (logo, hero, photo, etc.)
   - Calls `persistScrapedImages()` to save to database

3. **Image Persistence**: `server/lib/scraped-images-service.ts`
   - Persists to `media_assets` table
   - Filters by role (logo vs brand images)
   - Limits: 2 logos, 15 brand images
   - Stores metadata (role, dimensions, source='scrape')

### Image Display Flow

1. **Brand Guide API**: `server/routes/brand-guide.ts` (GET `/api/brand-guide/:brandId`)
   - ✅ Reads scraped images from `media_assets` table via `getScrapedImages()`
   - ✅ Separates into `logos` array (max 2) and `images` array (max 15)
   - ✅ Also includes in `approvedAssets.uploadedPhotos` for backward compatibility
   - Returns Brand Guide with both formats

2. **Onboarding Display**: `client/pages/onboarding/Screen5BrandSummaryReview.tsx`
   - ✅ Fetches Brand Guide API
   - ✅ Reads from `logos` and `images` arrays
   - ✅ Displays logos and brand images
   - ✅ Has fallback to `approvedAssets.uploadedPhotos`

3. **Brand Guide UI**: `client/app/(postd)/brand-guide/page.tsx`
   - Uses `VisualIdentityEditor` component
   - ⚠️ **GAP**: Only shows logo upload, doesn't display scraped brand images
   - Brand images not visible in Brand Guide editor

### What Happens to Scraped Images After Classification?

✅ **Images ARE persisted** to `media_assets` table with:
- `brand_id`: Brand identifier
- `category`: "logos" or "images"
- `status`: "active"
- `path`: External URL (scraped images use HTTP URLs)
- `metadata`: JSONB with `{ source: "scrape", role: "logo"|"hero"|"photo", ... }`

### Do They Always Get Persisted?

✅ **Yes, if:**
- Valid `tenantId` is provided
- Images pass validation filters
- Database connectivity is healthy

❌ **No, if:**
- Missing/invalid `tenantId` → Logs error but continues
- Images filtered out (logo-style, platform logos, etc.)
- Database errors (but logged)

### Current UI Messaging

**Screen3AiScrape** (Scraping State):
- Shows progress steps: "Scraping images", "Extracting colors", etc.
- Generic progress messages
- ⚠️ **GAP**: Doesn't explicitly mention "finding your brand assets"

**Screen5BrandSummaryReview** (Display State):
- Shows logos and images in a visual grid
- ⚠️ **GAP**: No messaging about automatic detection
- ⚠️ **GAP**: Doesn't explain they can add/remove images

**Brand Guide Editor** (Visual Identity Section):
- Only shows logo upload field
- ⚠️ **GAP**: Doesn't display scraped brand images at all
- ⚠️ **GAP**: No indication that images were automatically scraped

### Current Logging/Metrics

**Comprehensive Logging Exists:**

1. **Crawler Logs** (`server/routes/crawler.ts`):
   - ✅ Images found count
   - ✅ Images persisted count
   - ✅ Logo detection summary
   - ✅ Partial persistence warnings
   - ⚠️ Missing: Timing metrics (crawl time, classification time)

2. **Scraped Images Service Logs** (`server/lib/scraped-images-service.ts`):
   - ✅ Role breakdown (logos, heroes, photos, etc.)
   - ✅ Selection summary (logosSelected, brandImagesSelected)
   - ✅ Persistence success/failure counts
   - ✅ Failure categorization (duplicate, quota, database, validation, network)
   - ⚠️ Missing: File extension counts, size categories

3. **Brand Crawler Logs** (`server/workers/brand-crawler.ts`):
   - ✅ Logo detection summary
   - ✅ Role breakdown in final images
   - ⚠️ Missing: Classification timing

**Missing Metrics:**
- ⚠️ Total crawl time (start to finish)
- ⚠️ Image classification time
- ⚠️ Persistence time
- ⚠️ File extension breakdown (png/jpg/svg/webp counts)
- ⚠️ Size category breakdown (small/medium/large)
- ⚠️ Image quality indicators

---

## 2. Identified Gaps & Issues

### UX Gaps

1. ❌ **No messaging about automatic asset detection**
   - Customers don't know POSTD automatically found their images
   - Missing "magical" messaging

2. ❌ **No "done-for-you" communication**
   - Doesn't explain that images are already populated
   - Doesn't mention they can refine if needed

3. ❌ **Brand images not visible in Brand Guide editor**
   - VisualIdentityEditor only shows logo upload
   - Scraped brand images aren't displayed

4. ❌ **No loading vs completed state distinction**
   - Screen3AiScrape shows progress but not clear "we found X images"
   - Screen5 doesn't distinguish between "loading" and "ready"

### Technical Gaps

1. ⚠️ **Missing timing metrics**
   - No crawl time tracking
   - No classification time tracking
   - No persistence time tracking

2. ⚠️ **Missing file metadata metrics**
   - No file extension breakdown
   - No size category breakdown
   - No quality indicators

3. ⚠️ **Incomplete error tracking**
   - Errors logged but not aggregated
   - No success rate metrics

---

## 3. Improvements Needed

### Priority 1: UX Improvements

1. **Add magical messaging to Screen3AiScrape**
   - "We automatically detected your brand assets"
   - Show count: "Found X logos and Y brand images"

2. **Add messaging to Screen5BrandSummaryReview**
   - "We automatically pulled in your brand assets"
   - "Feel free to add or remove any images"
   - Show scraped images with "auto-detected" badge

3. **Display scraped images in Brand Guide editor**
   - Add brand images section to VisualIdentityEditor
   - Show scraped images with ability to remove
   - Add upload button for additional images

### Priority 2: Enhanced Logging

1. **Add timing metrics**
   - Crawl start/end time
   - Classification time
   - Persistence time

2. **Add file metadata metrics**
   - File extension counts
   - Size category breakdown
   - Dimension statistics

3. **Structured onboarding summary log**
   - One consolidated log at end of scraping
   - Includes all metrics in one place
   - Easy to query/monitor

### Priority 3: Image Flow Verification

1. **Ensure images flow correctly**
   - Verify media_assets → Brand Guide API → UI
   - Test with various image types
   - Verify backward compatibility

2. **Add verification logging**
   - Log when images successfully surface in Brand Guide
   - Log when images are missing (shouldn't happen)

---

## 4. Next Steps

1. ✅ Audit complete
2. 🔄 Improve UX messaging (in progress)
3. ⏳ Enhance logging/metrics
4. ⏳ Verify image flow
5. ⏳ Update documentation

---

**Status**: Ready to implement improvements

