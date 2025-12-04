# Brand Kit & Content Engine Pipeline Documentation

This document maps the complete pipeline for brand kit extraction, storage, and usage in POSTD.

## Overview

POSTD's Brand Kit system extracts brand assets (logos, images, colors, typography, voice) from websites during onboarding and uses them for content generation. This pipeline is critical - if it breaks, the entire platform feels fake.

---

## PHASE 1: Website Scraping

### Entry Point
- **Route**: `POST /api/crawl/start?sync=true`
- **Handler**: `server/routes/crawler.ts:160` - `router.post("/start", ...)`
- **Triggered By**: Onboarding Screen 3 (`client/pages/onboarding/Screen3AiScrape.tsx`)

### Crawler Worker
- **File**: `server/workers/brand-crawler.ts`
- **Main Function**: `crawlWebsite(url: string)` - line 256
- **Process**:
  1. Launches headless Puppeteer browser
  2. Crawls website pages (max 5 pages, depth 2)
  3. Extracts content via `extractPageContent()` - line 370
  4. Returns `CrawlResult[]` with images, text, headlines, typography

### Image Extraction
- **Function**: `extractImages()` inside `extractPageContent()` - line ~370
- **Location**: `server/workers/brand-crawler.ts`
- **Process**:
  1. Finds all `<img>` tags and CSS background images
  2. Classifies images using `categorizeImage()` - line 588:
     - `logo`: Small images in header/nav with brand indicators
     - `hero`: Large images above the fold
     - `photo`: Brand photos/lifestyle images
     - `team`: Team member photos
     - `subject`: Product/service images
     - `social_icon`: Social media icons (FILTERED OUT)
     - `platform_logo`: Platform badges (FILTERED OUT)
     - `partner_logo`: Partner badges (FILTERED OUT)
  3. Filters out social icons, platform logos, partner logos
  4. Limits to max 15 images after sorting by priority

### Logo Detection
- **Function**: `isLogo()` - line 520
- **Criteria**:
  - Filename/path contains "logo"
  - Alt text contains "logo" or brand name
  - In header/nav element
  - Small size (< 400x400)
- **Selection**: `selectBrandLogos()` - line 899
  - Filters out partner/platform logos
  - Scores by location, brand match, size
  - Selects top 1-2 logos

---

## PHASE 2: Color Extraction

### Entry Point
- **Function**: `extractColors(url: string)` - called from `runCrawlJobSync()` - line 590
- **Location**: `server/workers/brand-crawler.ts` (likely in separate color extraction module)

### Current Issues
- **Mixing/Muddy Colors**: Colors may be averaged from all images
- **No UI Preference**: Doesn't prioritize UI colors over photography colors
- **No Deduplication**: Near-identical colors not merged

### Storage
- **Location**: `brands.brand_kit.colors` (JSONB field)
- **Structure**:
  ```typescript
  {
    primary?: string;
    secondary?: string;
    accent?: string;
    confidence: number;
    primaryColors?: string[]; // Up to 3
    secondaryColors?: string[]; // Up to 3
    allColors?: string[]; // Max 6 total
  }
  ```

---

## PHASE 3: Image Persistence

### Service
- **File**: `server/lib/scraped-images-service.ts`
- **Function**: `persistScrapedImages(brandId, tenantId, images)` - line 66

### Process
1. **Filtering**:
   - Removes `social_icon` and `platform_logo` roles
   - Separates logos (max 2) from brand images (max 15)
   - Filters out logo-style images from brand images section

2. **Classification**:
   - Logos: `category = "logos"`
   - Brand images: `category = "images"`

3. **Persistence**:
   - Uses `MediaDBService.createMediaAsset()` - `server/lib/media-db-service.ts:77`
   - Stores in `media_assets` table with:
     - `brand_id`: Brand UUID (or temp ID during onboarding)
     - `tenant_id`: Workspace UUID (required)
     - `category`: "logos" | "images" | "graphics"
     - `path`: External URL (for scraped images)
     - `metadata.source`: "scrape"
     - `metadata.role`: "logo" | "hero" | "photo" | etc.

4. **Storage**:
   - Scraped images: External URLs stored in `path` column (NOT uploaded to Supabase Storage)
   - Uploaded images: Supabase Storage paths in `path` column

### Reconciliation
- **Function**: `transferScrapedImages(fromBrandId, toBrandId)` - line 794
- **Purpose**: When brand is created with final UUID, transfers images from temp brandId
- **Process**: Updates `media_assets.brand_id` and `tenant_id` in batch

---

## PHASE 4: Brand Guide UI Display

### API Endpoint
- **Route**: `GET /api/brand-guide/:brandId`
- **Handler**: `server/routes/brand-guide.ts:27`

### Image Fetching
- **Function**: `getScrapedImages(brandId)` - `server/lib/scraped-images-service.ts:898`
- **Query**:
  ```sql
  SELECT id, path, filename, metadata
  FROM media_assets
  WHERE brand_id = :brandId
    AND status = 'active'
    AND path LIKE 'http%'  -- Scraped images have HTTP URLs
  ORDER BY created_at DESC
  ```

### UI Components
- **Brand Guide Page**: `client/app/(postd)/brand-guide/page.tsx`
- **Visual Identity Editor**: `client/components/dashboard/VisualIdentityEditor.tsx`
  - **Current Issue**: Only shows `brand.logoUrl`, not scraped logos from DB
  - **Missing**: Brand images section that reads from `brand_kit.brandImages`

### Brand Guide Structure
- **Database**: `brands.brand_kit` (JSONB)
- **API Response**: Merges DB brand_kit with scraped images from `media_assets`
- **Fields**:
  - `approvedAssets.uploadedPhotos`: Includes scraped logos + brand images
  - `logoUrl`: Single logo URL (legacy)
  - **Missing**: Separate `logos[]` and `brandImages[]` arrays

---

## PHASE 5: Content Generation

### Doc Agent
- **Route**: `POST /api/ai/doc`
- **Handler**: `server/routes/agents.ts`
- **Input**: `{ brand_id, topic, platform, tone }`
- **Prompt Builder**: Uses `brand_kit` data from database

### Image Sourcing
- **File**: `server/lib/image-sourcing.ts`
- **Function**: `getPrioritizedImage(brandId, category)` - line 39
- **Priority Order**:
  1. Scraped images (source='scrape') from `media_assets`
  2. Uploaded images
  3. Stock images (fallback)

### Current Issues
- **Content Generation**: May not be receiving brand_kit properly
- **Images**: Content agents may not have access to brand images
- **Storage**: Generated content may not be saved to correct table

---

## Database Schema

### Tables Used

#### `brands`
- `id`: UUID (primary key)
- `tenant_id`: UUID (workspace)
- `brand_kit`: JSONB (stores brand guide data)
  - `colors`: Color palette object
  - `logoUrl`: Single logo URL (legacy)
  - `approvedAssets`: Legacy structure
  - **Missing**: Separate `logos[]` and `brandImages[]` arrays

#### `media_assets`
- `id`: UUID (primary key)
- `brand_id`: UUID (foreign key)
- `tenant_id`: UUID (foreign key)
- `category`: "logos" | "images" | "graphics" | "videos"
- `path`: String (URL for scraped, storage path for uploaded)
- `filename`: String
- `metadata`: JSONB
  - `source`: "scrape" | "upload" | "stock"
  - `role`: "logo" | "hero" | "photo" | etc.
- `status`: "active" | "archived"

---

## Sample/Demo Data Locations

### Known Sample Data
1. **Initial Brand Guide**: `client/types/brandGuide.ts:99` - `INITIAL_BRAND_GUIDE`
   - Contains hard-coded "Hobby Lobby" example
   - Used as default template

2. **Mock Functions**: 
   - `client/lib/seedUserBrands.ts` - Seeds demo brand IDs
   - `client/types/library.ts:238` - `generateMockAssets()`
   - `client/components/retention/BrandEvolutionVisualization.tsx:287` - `mockBrandEvolutionData`

3. **Hard-coded Brand Names**:
   - Check for "ABD Events", "Aligned Aesthetics", "Indie Investing" in components

---

## Known Issues & Fixes Needed

### Issue 1: Only 3 Logos Show Up
- **Cause**: Image filtering too aggressive OR limit in UI component
- **Fix**: Review `persistScrapedImages()` limits (max 2 logos) and UI display logic

### Issue 2: Brand Images Section Empty
- **Cause**: UI not reading from `media_assets`, only from `brand_kit.logoUrl`
- **Fix**: Update Brand Guide UI to query `media_assets` for brand images

### Issue 3: Colors Mixed/Muddy
- **Cause**: Color extraction averaging all images
- **Fix**: Prioritize UI colors, deduplicate, limit to 3-6 core colors

### Issue 4: Sample Brand Data Bleeding Through
- **Cause**: Hard-coded sample data in components
- **Fix**: Remove sample data, ensure all components read from real DB

### Issue 5: Content Not Generated
- **Cause**: Doc agent may not be receiving brand_kit properly
- **Fix**: Verify prompt builder includes brand_kit data

---

## Pipeline Flow Diagram

```
ONBOARDING FLOW:
1. User enters URL → Screen3AiScrape.tsx
2. POST /api/crawl/start?sync=true → crawler.ts
3. crawlWebsite() → brand-crawler.ts
4. extractImages() + extractColors()
5. persistScrapedImages() → scraped-images-service.ts
6. Save to media_assets table
7. Save brand_kit to brands.brand_kit (JSONB)
8. Screen5BrandSummaryReview displays results

BRAND GUIDE UI:
1. GET /api/brand-guide/:brandId → brand-guide.ts
2. Query brands.brand_kit (JSONB)
3. Query media_assets WHERE brand_id = :brandId
4. Merge scraped images into response
5. Display in VisualIdentityEditor.tsx

CONTENT GENERATION:
1. POST /api/ai/doc → agents.ts
2. Fetch brand_kit from brands table
3. getPrioritizedImage() → image-sourcing.ts
4. Query media_assets for scraped images
5. Build prompt with brand_kit + images
6. Generate content
7. Save to scheduled_content / content_items
```

---

## Next Steps

1. ✅ Map pipeline (this document)
2. Fix image scraping & storage limits
3. Fix color extraction (true HEX, no mixing)
4. Remove sample/demo data from live paths
5. Wire content generation to brand_kit
6. Add smoke test script

