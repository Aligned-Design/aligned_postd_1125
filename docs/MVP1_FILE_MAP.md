# MVP1 File Map: Website Scraper → Brand Intake → Auto-Populate Pipeline

**Date:** 2025-01-XX  
**Purpose:** Complete file inventory for the POSTD Website Scraper → Brand Intake → Auto-Populate pipeline (V1 MVP)

---

## Overview

This document maps all files related to the website scraper, brand ingestion, and auto-population pipeline. This is Step 1 for every new brand, and all other automation depends on it.

---

## Core Scraper Implementation

### 1. Brand Crawler Worker
**File:** `server/workers/brand-crawler.ts`  
**Purpose:** Main crawler implementation using Playwright
- Crawls websites (single domain, robots.txt aware, depth ≤ 3, max 50 pages, 1s delay)
- Extracts: headlines, body text, images (10-15), colors (6-color palette), typography, Open Graph metadata
- Generates AI brand kit with voice/tone/keywords
- **Key Functions:**
  - `crawlWebsite()` - Main crawler with retry logic
  - `extractColors()` - Color palette extraction using node-vibrant
  - `extractImages()` - Image extraction with smart prioritization
  - `extractOpenGraphMetadata()` - Open Graph tag extraction
  - `generateBrandKit()` - AI-powered brand kit generation
  - `processBrandIntake()` - Main orchestrator

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
**Purpose:** Persist scraped images to `media_assets` table
- **Key Functions:**
  - `persistScrapedImages()` - Save images with `source='scrape'` metadata
  - `transferScrapedImages()` - Transfer images from temp brandId to final UUID
  - `getScrapedImages()` - Query scraped images for a brand
- **Critical:** Requires `tenantId` (UUID) for persistence

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

## Notes

- All scraped images are stored in `media_assets` with `metadata.source = 'scrape'`
- Scraped images have HTTP URLs in `path` column (not Supabase storage paths)
- Brand Kit data is stored in `brands.brand_kit` JSONB field
- Open Graph metadata is extracted and stored in `brand_kit.metadata.openGraph`
- 6-color palette structure: `colors.allColors` (max 6), `colors.primaryColors` (3), `colors.secondaryColors` (3)

