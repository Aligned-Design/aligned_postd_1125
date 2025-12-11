# MVP1 File Map: Website Scraper → Brand Intake → Auto-Populate Pipeline

**Date:** 2025-01-XX  
**Last Updated:** 2025-12-11  
**Purpose:** Complete file inventory for the POSTD Website Scraper → Brand Intake → Auto-Populate pipeline (V1 MVP)

---

## Overview

This document maps all files related to the website scraper, brand ingestion, and auto-population pipeline. This is Step 1 for every new brand, and all other automation depends on it.

---

## Host-Aware Scraping (Updated 2025-12-11)

### Current Host Detection Status: ✅ **IMPLEMENTED (Extraction Phase Only)**

The scraper now has **explicit host detection** implemented in `brand-crawler.ts`:

**What's Implemented:**
- ✅ `detectHost()` function - detects CMS via domain, meta tags, CSS classes, CDN patterns
- ✅ `getHostExtractionConfig()` - returns host-specific extraction settings
- ✅ Host-aware image extraction - uses `data-src`, `data-image` for Squarespace, `data-lazy-src` for WordPress
- ✅ Scroll-before-extract - triggers lazy loading on JS-heavy platforms
- ✅ Platform logo filtering - filters out Squarespace/Wix/Shopify platform badges

**Integration Status (MVP1-MVP3 Complete):**
- ✅ Host info persisted to `brands.brand_kit.metadata.host`
- ✅ Host metadata flows to Brand Brain via `BrandContextPack.host`
- ✅ AI agents (doc, design, advisor) receive host-aware prompts
- ⚠️ Brand Intake UI does NOT display host info (observability only, not user-facing)

### Host Detection Flow (Complete E2E)

```
Crawler: extractImages() + extractPageContent()
  ├── detectHost(page, url)          → DetectedHost { name, confidence, signals }
  ├── getHostExtractionConfig(host)  → HostConfig { dataAttributes, selectors, scrollBeforeExtract }
  └── Returns brandKit.metadata.host → Persisted to DB

Database: brands.brand_kit
  └── metadata.host: { name, confidence, detectionMethod, signals }

Brand Brain: getBrandContextPack()
  ├── getHostMetadata(brandId)       → Reads from brands.brand_kit.metadata.host
  └── Returns BrandContextPack.host  → { type, confidence }

AI Agents: doc-agent, design-agent, advisor
  ├── getBrandContextPack(brandId)   → Gets host from Brand Brain
  └── buildHostAwarePromptSection()  → Injects platform-specific style hints
```

### Host-Specific Behavior

| Host/CMS | Detection | Image Extraction | Copy Extraction | AI Prompts |
|----------|-----------|------------------|-----------------|------------|
| Squarespace | ✅ meta/classes/CDN | ✅ data-src, data-image | ✅ Host-aware selectors | ✅ "Modern, clean, editorial" |
| WordPress | ✅ meta/scripts | ✅ data-lazy-src | ✅ Host-aware selectors | ✅ "Content-rich, SEO-friendly" |
| Wix | ✅ meta/scripts | ✅ data-src | ✅ Host-aware selectors | ✅ "Versatile, adaptable" |
| Shopify | ✅ meta/CDN | ✅ data-src | ✅ Host-aware selectors | ✅ "Product-focused, conversion-friendly" |
| Webflow | ✅ meta/badge | ✅ Standard | ✅ Host-aware selectors | ✅ "Design-conscious, polished" |
| Unknown | ✅ Fallback | ✅ Generic | ✅ Generic selectors | ✅ Neutral (no special hints) |

### Files with Host-Aware Logic

| File | Host-Aware Features | Status |
|------|---------------------|--------|
| `server/workers/brand-crawler.ts` | `detectHost()`, `getHostExtractionConfig()`, host-aware extraction | ✅ Complete |
| `server/routes/crawler.ts` | Persists host to `brand_kit.metadata.host` | ✅ Complete |
| `server/lib/brand-brain-service.ts` | `getHostMetadata()`, `BrandContextPack.host` | ✅ Complete |
| `server/lib/prompts/brand-guide-prompts.ts` | `buildHostAwarePromptSection()` | ✅ Complete |
| `server/routes/doc-agent.ts` | Passes host to `buildDocUserPrompt()` | ✅ Complete |
| `server/routes/design-agent.ts` | Passes host to `buildDesignUserPrompt()` | ✅ Complete |
| `server/routes/advisor.ts` | Passes host to `buildAdvisorUserPrompt()` | ✅ Complete |
| `server/__tests__/brand-crawler-host-aware.test.ts` | 55 unit tests for host detection | ✅ Complete |
| `server/__tests__/brand-brain-host-aware.test.ts` | 28 tests for host-aware prompts | ✅ Complete |

---

## Core Scraper Implementation

### 1. Brand Crawler Worker
**File:** `server/workers/brand-crawler.ts`  
**Lines:** ~3,059 lines  
**Layer:** Server Worker (Express)  
**Purpose:** Main crawler implementation using Playwright

**Crawling Configuration:**
- Max pages: 50 (local) / 10 (Vercel)
- Max depth: 3 (local) / 2 (Vercel)
- Timeout: 60s (local) / 15s per page (Vercel)
- Delay: 1s (local) / 500ms (Vercel)
- User agent: `POSTDBot/1.0`

**Key Functions:**
| Function | Purpose | Lines |
|----------|---------|-------|
| `crawlWebsite()` | Main crawler with retry logic, robots.txt | ~100-380 |
| `extractImages()` | Multi-source image extraction (HTML, CSS, SVG, favicon, OG) | ~1571-2024 |
| `extractColors()` | Color palette extraction using node-vibrant | ~2361-2560 |
| `extractOpenGraphMetadata()` | Open Graph tag extraction | ~2165-2256 |
| `extractTypography()` | Font detection from computed styles | ~2262-2355 |
| `generateBrandKit()` | AI-powered brand kit generation | (uses ai-generation.ts) |
| `processBrandIntake()` | Main orchestrator | ~204-260 |
| `categorizeImage()` | Image classification (logo/hero/photo/social_icon/etc.) | ~681-981 |
| `isLogo()` | Logo detection with negative weights for icons | ~556-659 |
| `extractCssLogos()` | CSS background-image logo extraction | ~1126-1270 |
| `extractSvgLogos()` | Inline SVG logo extraction | ~1276-1387 |
| `extractFaviconLogos()` | Favicon as fallback logo | ~1392-1466 |
| `extractOgLogo()` | OG image as fallback logo | ~1471-1495 |
| `mergeLogoCandidates()` | Merge logos from all sources with priority | ~1501-1559 |
| `selectBrandLogos()` | Select best 1-2 logos for Brand Guide | ~1051-1120 |

**Platform-Aware Logic (Lines 786-847):**
- Detects: `squarespace`, `wix`, `godaddy`, `canva`, `shopify`, `wordpress`
- Filters: platform logos, social icons, UI icons
- Preserves: Large images from platform CDNs (> 300x300)

### 2. Crawler API Routes
**File:** `server/routes/crawler.ts`  
**Purpose:** HTTP endpoints for crawler operations
- `POST /api/crawl/start` - Start crawl (sync/async modes)
- `GET /api/crawl/result/:jobId` - Get crawl results
- `POST /api/crawl/reconcile-images` - Transfer images from temp to final brandId
- **Key Functions:**
  - `runCrawlJobSync()` - Sync crawl for onboarding (returns results immediately)
  - `runCrawlJob()` - Async crawl job (background processing)

---

## Brand Intake UI Components

### 3. Brand Intake Page (Main)
**File:** `client/app/(postd)/brand-intake/page.tsx`  
**Purpose:** Main Brand Intake form with multi-step sections
- 6 sections: Brand Basics, Voice & Messaging, Visual Identity, Content Preferences, Operational, AI Training
- Auto-save functionality
- **Key Features:**
  - `handleImportFromWebsite()` - Calls real crawler API (`/api/crawl/start?sync=true`)
  - Updates form data with scraped colors, tone, keywords, description
  - File upload handling for logos, imagery, references

### 4. Brand Intake Section Components
**Files:**
- `client/components/brand-intake/Section1BrandBasics.tsx` - Brand name, website URL, industry
- `client/components/brand-intake/Section2VoiceMessaging.tsx` - Tone, personality, voice
- `client/components/brand-intake/Section3VisualIdentity.tsx` - Colors, typography, logo
- `client/components/brand-intake/Section4ContentPreferences.tsx` - Content types, platforms
- `client/components/brand-intake/Section5Operational.tsx` - Workflow, approval
- `client/components/brand-intake/Section6AITraining.tsx` - AI training data

### 5. Onboarding Scraper Screen
**File:** `client/pages/onboarding/Screen3AiScrape.tsx`  
**Purpose:** Onboarding flow screen that shows scraping progress
- Animated progress steps (explore, images, colors, voice, offerings, generate)
- Calls crawler API in sync mode
- Transforms result into BrandSnapshot format
- Saves Brand Guide via `saveBrandGuideFromOnboarding()`

---

## Database Persistence

### 6. Scraped Images Service
**File:** `server/lib/scraped-images-service.ts`  
**Lines:** ~1,393 lines  
**Layer:** Server Library  
**Purpose:** Persist scraped images to `media_assets` table

**Key Functions:**
| Function | Purpose | Lines |
|----------|---------|-------|
| `persistScrapedImages()` | Save images with `source='scrape'` metadata | 106-990 |
| `transferScrapedImages()` | Transfer images from temp brandId to final UUID | 1007-1106 |
| `getScrapedImages()` | Query scraped images for a brand | 1111-1258 |
| `excludeAsset()` | Soft delete an asset (excluded=true) | 1268-1292 |
| `restoreAsset()` | Un-exclude an asset | 1300-1322 |
| `updateAssetRole()` | Update asset role/category | 1337-1392 |

**Image Filtering Logic (Lines 153-396):**
- Filters out: `social_icon`, `platform_logo`, `ui_icon`
- Detects solid color placeholders, UI icons, icon pack graphics
- Separates logos (max 2) from brand images (max 15)
- Sorts logos by: PNG preferred, larger resolution, brand name in filename
- Sorts brand images by: hero first, then larger photos

**Fallback Selection (Lines 477-573):**
- Engages when all images are filtered out
- Uses conservative filtering to preserve legitimate brand assets
- Marks fallback images with `fallbackSelected: true`

**Critical:** Requires `tenantId` (UUID) for persistence

### 7. Media Database Service
**File:** `server/lib/media-db-service.ts`  
**Purpose:** Low-level media asset database operations
- `createMediaAsset()` - Insert into `media_assets` table
- `checkDuplicateAsset()` - Duplicate detection by hash
- Handles both scraped (HTTP URLs in `path`) and uploaded (Supabase storage paths)

### 8. Brand Guide Sync (Server)
**File:** `server/lib/brand-guide-sync.ts`  
**Purpose:** Server-side Brand Guide conversion utilities
- `brandSnapshotToBrandGuide()` - Convert onboarding format to Brand Guide format

### 9. Brand Guide Sync (Client)
**File:** `client/lib/onboarding-brand-sync.ts`  
**Purpose:** Client-side Brand Guide sync from onboarding
- `brandSnapshotToBrandGuide()` - Convert BrandSnapshot to BrandGuide
- `saveBrandGuideFromOnboarding()` - Save to Supabase via API
- `updateBrandGuideFromSummary()` - Update from summary review edits

---

## Brand Snapshot & Brand Guide

### 10. Brand Snapshot Page
**File:** `client/app/(postd)/brand-snapshot/page.tsx`  
**Purpose:** Display brand snapshot after intake completion
- Reads from `brands.brand_kit` JSONB field
- Displays voice, visual identity, content preferences

### 11. Brand Guide Page
**File:** `client/app/(postd)/brand-guide/page.tsx`  
**Purpose:** Main Brand Guide editor/viewer
- Reads from `brands.brand_kit` and `media_assets` (scraped images)
- Auto-populates from scraped data
- Uses `useBrandGuide()` hook for data fetching

### 12. Brand Guide API Route
**File:** `server/routes/brand-guide.ts`  
**Purpose:** API endpoints for Brand Guide operations
- `GET /api/brand-guide/:brandId` - Fetch Brand Guide with scraped images
- Queries `media_assets` WHERE `brand_id = :brandId` AND `metadata->>'source' = 'scrape'`

---

## Edge Functions (Legacy - Should NOT Be Used)

### 13. Process Brand Intake Edge Function
**File:** `supabase/functions/process-brand-intake/index.ts`  
**Purpose:** ⚠️ **LEGACY FALLBACK - SHOULD NOT BE USED**
- Contains `generateBrandKitFallback()` with mock data
- **Status:** This is a fallback that should be removed or disabled
- **Action Required:** Ensure all clients call `/api/crawl/start` instead

---

## Supporting Files

### 14. Image Sourcing
**File:** `server/lib/image-sourcing.ts`  
**Purpose:** Get brand assets for Creative Studio
- `getPrioritizedImage()` - Priority: scraped > uploaded > legacy
- `getBrandAsset()` - Query `media_assets` for brand images

### 15. Type Definitions
**Files:**
- `client/types/brand-intake.ts` - BrandIntakeFormData interface
- `client/types/brandGuide.ts` - BrandGuide interface
- `shared/brand-guide.ts` - Shared BrandGuide type

### 16. API Utilities
**File:** `client/lib/api.ts`  
**Purpose:** Centralized API client with authentication
- `apiPost()`, `apiGet()`, `apiPut()` - Authenticated fetch wrappers

---

## Database Tables

### 17. `brands` Table
**Schema:** `supabase/migrations/001_bootstrap_schema.sql`  
**Fields Used:**
- `id` (UUID) - Brand ID
- `brand_kit` (JSONB) - Complete brand kit data (colors, voice, typography, etc.)
- `voice_summary` (JSONB) - Voice/tone summary
- `visual_summary` (JSONB) - Visual identity summary
- `tenant_id` (UUID) - Workspace/tenant ID

### 18. `media_assets` Table
**Schema:** `supabase/migrations/001_bootstrap_schema.sql`  
**Fields Used:**
- `id` (UUID) - Asset ID
- `brand_id` (UUID) - Brand ID
- `tenant_id` (UUID) - Workspace ID
- `category` (text) - "logos" | "images" | "graphics"
- `path` (text) - For scraped images: HTTP URL; for uploaded: Supabase storage path
- `filename` (text) - Filename
- `metadata` (JSONB) - `{ source: "scrape", role: "logo" | "hero" | "other", ... }`
- `status` (text) - "active" | "archived"

### 19. `brand_ingestion_jobs` Table
**Status:** ⚠️ **NOT FOUND IN CODEBASE**
- May not exist yet, or may be planned for future async job tracking
- Current implementation uses sync mode for onboarding

---

## Data Flow Diagram

```
1. User enters URL in Brand Intake
   ↓
2. Client: handleImportFromWebsite()
   ↓
3. POST /api/crawl/start?sync=true
   Body: { url, brand_id, workspaceId, sync: true }
   ↓
4. Server: runCrawlJobSync()
   ↓
5. Crawler: crawlWebsite() → extractImages() → extractColors()
   ↓
6. AI: generateBrandKit() → AI-generated about_blurb, tone, keywords
   ↓
7. Persist: persistScrapedImages() → media_assets table
   ↓
8. Save: Update brands.brand_kit JSONB with scraped data
   ↓
9. Response: Return brandKit to client
   ↓
10. Client: Update formData with scraped values
   ↓
11. Brand Snapshot: Auto-populated from brands.brand_kit
   ↓
12. Brand Guide: Auto-populated from brands.brand_kit + media_assets
```

---

## Image Extraction Pipeline (Detailed)

```
extractImages(page, baseUrl, brandName)
   ├── Wait for images to load (networkidle + 1s)
   ├── Get page context (title, og:site_name, mainH1)
   │
   ├── HTML <img> extraction
   │   ├── Normalize URLs (relative → absolute)
   │   ├── Get dimensions (naturalWidth/Height → width/height → clientWidth/Height)
   │   ├── Detect context:
   │   │   ├── inHeaderOrNav (header, nav, .header, .navbar, etc.)
   │   │   ├── inFooter (footer, .site-footer, etc.)
   │   │   ├── inAffiliateOrPartnerSection (partner, sponsor, association, etc.)
   │   │   └── inHeroOrAboveFold (within 1.5x viewport height, .hero, .banner, etc.)
   │   └── Initial role assignment (logo if small + in header/nav)
   │
   ├── CSS background-image extraction (extractCssLogos)
   │   └── Selectors: .header-logo, .site-logo, header [class*='logo'], etc.
   │
   ├── Inline SVG extraction (extractSvgLogos)
   │   └── Selectors: svg.logo, header svg, .logo svg, etc.
   │
   ├── Favicon extraction (extractFaviconLogos) - fallback only
   │   └── Selectors: link[rel="icon"], link[rel="mask-icon"], etc.
   │
   ├── OG image extraction (extractOgLogo) - fallback only
   │   └── meta[property="og:image"], meta[name="twitter:image"]
   │
   ├── Merge logo candidates (mergeLogoCandidates)
   │   └── Priority: SVG > CSS > HTML <img> > OG > Favicon
   │
   ├── Calculate brand match scores (calculateBrandMatchScore)
   │
   ├── Categorize all images (categorizeImage)
   │   ├── Filter: social_icon, platform_logo, ui_icon
   │   ├── Classify: logo, hero, photo, team, subject, partner_logo, other
   │   └── Size checks: Oversized "logos" → hero/photo
   │
   ├── Calculate priority scores (calculateImagePriority)
   │
   ├── Filter: Skip data URIs, placeholders, tiny icons (<50x50)
   │
   └── Limit to 15 images max
```

---

## Debug Environment Variables

| Variable | Purpose | Usage |
|----------|---------|-------|
| `DEBUG_LOGO_DETECT=true` | Log logo detection details | Logo classification debugging |
| `DEBUG_SQUARESPACE_IMAGES=true` | Log Squarespace CDN image handling | Platform-specific debugging |
| `DEBUG_IMAGE_CLASSIFICATION=true` | Log image categorization | All image classification |
| `CRAWL_MAX_PAGES` | Override max pages (default: 50 local, 10 Vercel) | Performance tuning |
| `CRAWL_TIMEOUT_MS` | Override page timeout (default: 60000 local, 15000 Vercel) | Slow site handling |
| `CRAWL_USER_AGENT` | Override user agent (default: POSTDBot/1.0) | Custom identification |

---

## Key Integration Points

1. **Brand Intake → Crawler:** `client/app/(postd)/brand-intake/page.tsx` → `server/routes/crawler.ts`
2. **Crawler → Images:** `server/routes/crawler.ts` → `server/lib/scraped-images-service.ts`
3. **Crawler → Brand Kit:** `server/routes/crawler.ts` → `server/workers/brand-crawler.ts` → `brands.brand_kit`
4. **Onboarding → Brand Guide:** `client/pages/onboarding/Screen3AiScrape.tsx` → `client/lib/onboarding-brand-sync.ts` → `server/routes/brand-guide.ts`
5. **Brand Guide → Images:** `server/routes/brand-guide.ts` → `server/lib/scraped-images-service.ts` → `media_assets`

---

## Files to Audit

1. ✅ `server/workers/brand-crawler.ts` - Core crawler logic
2. ✅ `server/routes/crawler.ts` - API endpoints
3. ✅ `client/app/(postd)/brand-intake/page.tsx` - Brand Intake UI
4. ✅ `client/pages/onboarding/Screen3AiScrape.tsx` - Onboarding scraper
5. ✅ `server/lib/scraped-images-service.ts` - Image persistence
6. ✅ `client/lib/onboarding-brand-sync.ts` - Brand Guide sync
7. ⚠️ `supabase/functions/process-brand-intake/index.ts` - **LEGACY FALLBACK - REMOVE**

---

## Copy Extraction Pipeline

### Current State: ⚠️ **NOT HOST-AWARE**

Unlike image extraction, copy extraction does NOT use `detectedHost` — it relies entirely on generic heuristics.

### Copy Extraction Flow

```
1. extractPageContent(page, url)
   ├── page.title() → title
   ├── $eval('meta[name="description"]') → metaDescription
   ├── $$eval('h1/h2/h3') → h1[], h2[], h3[]
   └── page.evaluate() → bodyText (excludes nav/footer/script/style)

2. generateBrandKit(crawlResults, colors, url)
   ├── Combine text from all pages
   ├── generateBrandKitWithAI(combinedText) → AI extracts tone, style, audience, personality, keywords, about_blurb
   └── generateBrandSummaryWithAI() → AI creates about_blurb + longFormSummary

3. Fallback (if AI unavailable)
   ├── extractToneFromText() → keyword matching for friendly/professional/casual/confident
   ├── extractStyleFromText() → based on text length
   └── extractKeywords() → word frequency analysis
```

### Copy Extraction Files

| File | Function | Host-Aware? | Responsibility |
|------|----------|-------------|----------------|
| `server/workers/brand-crawler.ts` | `extractPageContent()` | ❌ No | Extracts title, meta, h1/h2/h3, bodyText using generic selectors |
| `server/workers/brand-crawler.ts` | `extractHeadlines()` | ❌ No | Collects H1/H2/H3 into array, limits to 5 |
| `server/workers/brand-crawler.ts` | `generateBrandKitWithAI()` | ❌ No | AI-powered tone/style/audience/personality/keywords/about extraction |
| `server/workers/brand-crawler.ts` | `generateBrandSummaryWithAI()` | ❌ No | AI-powered about_blurb and longFormSummary generation |
| `server/workers/brand-crawler.ts` | `generateBrandKitFallback()` | ❌ No | Rule-based fallback when AI unavailable |
| `server/routes/crawler.ts` | `extractToneFromText()` | ❌ No | Simple keyword matching for tone detection |
| `server/routes/crawler.ts` | `extractStyleFromText()` | ❌ No | Text-length-based style detection |
| `server/routes/crawler.ts` | `extractKeywords()` | ❌ No | Word frequency analysis for keywords |

### Host-Specific Copy Challenges

| CMS | Copy Challenge | Current Handling |
|-----|----------------|------------------|
| Squarespace | Content in nested divs with `.sqs-block` classes | ❌ Generic bodyText extraction |
| Squarespace | About sections use `.sqs-block-content` | ❌ Not detected |
| WordPress | Content in `.entry-content`, `.wp-block` | ❌ Generic bodyText extraction |
| Wix | Content dynamically loaded, in `[data-testid]` elements | ❌ Generic bodyText extraction |
| Shopify | Product descriptions in specific meta/structured data | ❌ Generic bodyText extraction |
| Webflow | Rich text in `.w-richtext` containers | ❌ Generic bodyText extraction |

### Copy → Brand Kit Mapping

| Extracted Field | Brand Kit Field | Storage Location |
|-----------------|-----------------|------------------|
| `title` | `metadata.title` | `brands.brand_kit` JSONB |
| `metaDescription` | `about_blurb` (fallback) | `brands.brand_kit` JSONB |
| `h1[0]` | Hero headline | `brands.brand_kit.headlines` |
| `h2/h3` | Subheadings | `brands.brand_kit.headlines` |
| AI-extracted tone | `voice_summary.tone` | `brands.brand_kit` JSONB |
| AI-extracted style | `voice_summary.style` | `brands.brand_kit` JSONB |
| AI-extracted audience | `voice_summary.audience` | `brands.brand_kit` JSONB |
| AI-extracted about | `about_blurb` | `brands.brand_kit` JSONB |
| Keywords | `keyword_themes` | `brands.brand_kit` JSONB |

---

## Notes

- All scraped images are stored in `media_assets` with `metadata.source = 'scrape'`
- Scraped images have HTTP URLs in `path` column (not Supabase storage paths)
- Brand Kit data is stored in `brands.brand_kit` JSONB field
- Open Graph metadata is extracted and stored in `brand_kit.metadata.openGraph`
- 6-color palette structure: `colors.allColors` (max 6), `colors.primaryColors` (3), `colors.secondaryColors` (3)

