# Scraped vs Stock Images Implementation Summary

## Overview

This document summarizes the implementation of website scraping vs stock image flow for onboarding and brand guide generation. The system prioritizes scraped images from websites and only uses stock images as a fallback when insufficient scraped images are available.

## Flow Summary

### 1. Website Scraping During Onboarding

**Entry Point:** `POST /api/crawl/start` (sync mode for onboarding)

**Process:**
1. User enters website URL during onboarding
2. `server/routes/crawler.ts` calls `runCrawlJobSync()`
3. Playwright-based crawler (`server/workers/brand-crawler.ts`) extracts:
   - Logo images (role="logo")
   - Hero/primary images (role="hero")
   - Additional brand imagery (role="other")
4. Images are persisted to `media_assets` table via `persistScrapedImages()` with:
   - `metadata.source = "scrape"`
   - `metadata.role = "logo" | "hero" | "other"`
   - `metadata.width`, `metadata.height`, `metadata.alt`
   - `metadata.scrapedUrl`, `metadata.scrapedAt`
5. Logging: `[Crawler] Scrape result: { workspaceId, brandId, pages, images, persisted, logoFound }`

**Files:**
- `server/routes/crawler.ts` - API route handler
- `server/workers/brand-crawler.ts` - Playwright crawler
- `server/lib/scraped-images-service.ts` - Persistence service

### 2. Brand Guide Generation

**Entry Point:** `POST /api/ai/brand-guide/generate`

**Process:**
1. Get scraped images first (source='scrape'):
   - Logo: `getPrioritizedImage(brandId, "logo")` → prioritizes scraped logos
   - Hero: `getPrioritizedImage(brandId, "image")` → prioritizes scraped images
   - All scraped: `getScrapedImages(brandId)` → returns all scraped images
2. **Stock Image Fallback Logic:**
   - Threshold: `SCRAPED_IMAGE_THRESHOLD = 5`
   - Only if `scrapedImages.length < 5`, fetch stock images
   - Stock images are clearly marked with `source: "stock"`
3. Brand Guide assembly:
   - Logo: `scrapedLogo?.url || onboardingAnswers?.logo || AI-generated`
   - Hero: `scrapedHero?.url` (if available)
   - Approved Assets: Scraped images first, then onboarding images, then stock (if needed)
4. Logging: `[BrandGuide] Brand visuals: { workspaceId, brandId, scrapedImages, stockImages }`

**Files:**
- `server/routes/brand-guide-generate.ts` - Brand guide generation route
- `server/lib/image-sourcing.ts` - Image prioritization logic
- `server/lib/scraped-images-service.ts` - Scraped image retrieval

### 3. Image Selection Priority

**Priority Order (via `getPrioritizedImage()`):**
1. **Scraped images** (source='scrape') - from `media_assets` where `metadata->>source = 'scrape'`
2. **Uploaded images** (source='upload' or no source) - user-uploaded brand assets
3. **Stock images** (source='stock') - only if no scraped/uploaded images found

**For Multiple Images (via `getPrioritizedImages()`):**
1. Get all scraped images (source='scrape')
2. Get uploaded images (source='upload')
3. **Only if total < 5**, supplement with stock images (source='stock')

**Files:**
- `server/lib/image-sourcing.ts` - Core prioritization logic

### 4. API Response Source Field

All media API endpoints now include `source` field in responses:

**Endpoints:**
- `GET /api/media` - List media assets (includes `source` in each asset)
- `GET /api/media/:assetId` - Get single asset (includes `source`)
- `GET /api/media-management/:assetId` - Get asset details (includes `source`)
- `POST /api/media/upload` - Upload response (includes `source`)

**Source Values:**
- `"scrape"` - Images scraped from website
- `"stock"` - Images from Pexels/Pixabay
- `"upload"` - User-uploaded images

**Files:**
- `server/routes/media.ts` - Main media routes (uses `mapAssetRecord()`)
- `server/routes/media-management.ts` - Media management routes

## Database Schema

### `media_assets` Table

**Key Fields:**
- `brand_id` - Brand scoping
- `category` - "logos" | "images" | "graphics" | "videos" | "ai_exports" | "client_uploads"
- `metadata` (JSONB) - Contains:
  - `source: "scrape" | "stock" | "upload"`
  - `role: "logo" | "hero" | "other"` (for scraped images)
  - `width`, `height`, `alt`
  - `scrapedUrl`, `scrapedAt` (for scraped images)
  - `provider: "pexels" | "pixabay"` (for stock images)
  - `attribution`, `attributionText` (for stock images)

**Indexes:**
- `idx_media_assets_brand_id` - Brand + status
- `idx_media_assets_category` - Brand + category
- GIN index on `metadata->>'source'` (via query filters)

## Logging

### Crawler Logging
```
[Crawler] Scrape result: { workspaceId: <uuid>, brandId: <uuid>, pages: 5, images: 12, persisted: 12, logoFound: true }
```

### Brand Guide Logging
```
[BrandGuide] Brand visuals: { workspaceId: <uuid>, brandId: <uuid>, scrapedImages: 8, stockImages: 0 }
```

**Note:** Logs appear in Vercel server logs (not browser console). Check Vercel dashboard → Functions → Logs.

## Verification Queries

### Check Scraped Images for a Brand

```sql
-- Get all scraped images for a brand
SELECT 
  id,
  url,
  filename,
  category,
  metadata->>'source' as source,
  metadata->>'role' as role,
  metadata->>'width' as width,
  metadata->>'height' as height,
  created_at
FROM media_assets
WHERE brand_id = '<brand-id>'
  AND status = 'active'
  AND metadata->>'source' = 'scrape'
ORDER BY created_at DESC;
```

### Check Stock Images for a Brand

```sql
-- Get all stock images for a brand
SELECT 
  id,
  url,
  filename,
  category,
  metadata->>'source' as source,
  metadata->>'provider' as provider,
  created_at
FROM media_assets
WHERE brand_id = '<brand-id>'
  AND status = 'active'
  AND metadata->>'source' = 'stock'
ORDER BY created_at DESC;
```

### Check Image Distribution

```sql
-- Count images by source for a brand
SELECT 
  metadata->>'source' as source,
  COUNT(*) as count
FROM media_assets
WHERE brand_id = '<brand-id>'
  AND status = 'active'
GROUP BY metadata->>'source';
```

### Check Brand Guide Visuals

```sql
-- Get brand guide visual summary
SELECT 
  id,
  name,
  brand_kit->>'logoUrl' as logo_url,
  visual_summary->>'logo_urls' as logo_urls_array,
  visual_summary->>'colors' as colors
FROM brands
WHERE id = '<brand-id>';
```

## Files Changed

### Modified Files

1. **`server/routes/crawler.ts`**
   - Added logging for scrape results (workspaceId, pages, images, persisted, logoFound)
   - Already persists scraped images with source='scrape'

2. **`server/routes/brand-guide-generate.ts`**
   - Enhanced to only fetch stock images if scraped images < threshold (5)
   - Added logging for brand visuals selection
   - Stock images only added to approvedAssets if scraped images insufficient

3. **`server/routes/media.ts`**
   - `mapAssetRecord()` already includes `source` field from metadata
   - All responses include source field

4. **`server/routes/media-management.ts`**
   - Added source field extraction and inclusion in GET /api/media/:assetId response

### Verified Files (No Changes Needed)

1. **`server/lib/scraped-images-service.ts`**
   - ✅ Already stores images with `metadata.source = "scrape"`
   - ✅ Includes role, width, height, alt in metadata

2. **`server/lib/image-sourcing.ts`**
   - ✅ Already prioritizes scraped images (source='scrape') first
   - ✅ Only uses stock images as fallback
   - ✅ Threshold logic (5 images) already implemented

3. **`server/routes/stock-images.ts`**
   - ✅ Already marks all responses with `source: "stock"`
   - ✅ Only called when needed (via image-sourcing.ts)

4. **`server/workers/brand-crawler.ts`**
   - ✅ Already extracts images with role detection (logo, hero, other)
   - ✅ Returns images with width, height, alt, role

## How Scraped vs Stock Images Are Determined

### During Onboarding

1. **User enters website URL** → `POST /api/crawl/start` (sync mode)
2. **Crawler extracts images** → Playwright crawls website, extracts images with roles
3. **Images persisted** → `persistScrapedImages()` saves to `media_assets` with `source='scrape'`
4. **Brand Guide generated** → Uses scraped images first, stock only if < 5 images

### During Brand Guide Generation

1. **Fetch scraped images** → `getScrapedImages(brandId)` returns all with `source='scrape'`
2. **Check threshold** → If `scrapedImages.length < 5`, fetch stock images
3. **Assemble brand guide** → Scraped images first, then stock (if needed), all marked with source

### During Content Generation

1. **Get prioritized image** → `getPrioritizedImage(brandId, category)`
2. **Priority order:**
   - Scraped images (source='scrape') for that category
   - Uploaded images (source='upload')
   - Stock images (source='stock') - only if no scraped/uploaded found

## Testing on Vercel

### Verify Scraping is Working

1. **Check Vercel Logs:**
   - Go to Vercel Dashboard → Your Project → Functions → Logs
   - Look for: `[Crawler] Scrape result: { workspaceId: ..., pages: X, images: Y, ... }`
   - Should see `persisted: Y` if images were saved

2. **Check Database:**
   ```sql
   SELECT COUNT(*) 
   FROM media_assets 
   WHERE brand_id = '<your-brand-id>' 
     AND metadata->>'source' = 'scrape';
   ```

3. **Check Brand Guide:**
   - Call `GET /api/brand-guide/:brandId`
   - Verify `approvedAssets.uploadedPhotos` includes images with `source: "scrape"`

### Verify Stock Images Are Fallback Only

1. **With Scraped Images:**
   - If brand has ≥ 5 scraped images, stock images should NOT be fetched
   - Check logs: `[BrandGuide] Brand visuals: { ..., stockImages: 0 }`

2. **Without Scraped Images:**
   - If brand has < 5 scraped images, stock images should be fetched
   - Check logs: `[BrandGuide] Brand visuals: { ..., stockImages: X }` where X > 0

## Important Notes

1. **No Localhost References:** All production code uses environment variables (`APP_URL`, `VITE_APP_URL`, `SUPABASE_URL`) - no hardcoded localhost in critical paths.

2. **Stock Images Are Fallback:** Stock image service (`server/routes/stock-images.ts`) is only called via `getPrioritizedImages()` when scraped images are insufficient.

3. **Source Field Everywhere:** All media API responses include `source` field, allowing frontend to distinguish between scraped, stock, and uploaded images.

4. **Metadata Storage:** Scraped images store full metadata (role, dimensions, scraped URL) in `media_assets.metadata` JSONB field.

5. **Logo Detection:** Crawler uses heuristics to detect logos (alt text, parent classes, header location, size).

## Next Steps

1. **Monitor Vercel Logs:** Check that scraping is happening and images are being persisted
2. **Verify Brand Guides:** Confirm scraped images appear in brand guide `approvedAssets`
3. **Test Fallback:** Test with a brand that has < 5 scraped images to verify stock images are fetched
4. **Frontend Integration:** Ensure frontend displays source badges/labels for scraped vs stock images

