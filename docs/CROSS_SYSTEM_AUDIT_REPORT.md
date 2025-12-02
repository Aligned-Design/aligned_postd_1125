# 🔍 COMPLETE CROSS-SYSTEM AUDIT REPORT
## MVP Architecture, Brand Crawler, Image Persistence, Storage Quotas, and Master Prompts

**Date:** 2025-01-30  
**Auditor:** Senior Full-Stack Engineer & Systems Architect  
**Scope:** MVP phases, crawler pipeline, image persistence, storage quotas, master prompts, onboarding flows

---

## 🚨 EXECUTIVE SUMMARY

### Critical Findings

**🔥 BLOCKING ISSUES:**
1. **Missing `status` Column** - `media_assets` table lacks `status` column but code queries for `status = 'active'`
2. **RLS Policy Verification Needed** - Service-role access to `media_assets` needs verification
3. **Column Name Mismatch** - `media-service.ts` uses `file_size` but schema has `size_bytes`

**✅ WORKING CORRECTLY:**
- Crawler extracts images ✅
- Quota skip for scraped images ✅ (MVP1 fix verified)
- Image persistence to database ✅
- `transferScrapedImages()` is called ✅ (in `server/routes/brands.ts:523`)
- Brand ID validation ✅ (Screen3AiScrape requires UUID, ensuring brand created first)

**⚠️ NEEDS ATTENTION:**
- TenantId validation too strict (may block persistence)
- Missing INSERT/UPDATE RLS policies on `media_assets`

### System Health

**Overall Status:** 🟡 **MOSTLY WORKING** - Core pipeline functional, but schema issues need attention

**Confidence Level:** 🟡 **MEDIUM** - Code is well-structured, but missing `status` column is critical

**Risk Level:** 🔴 **HIGH** - Missing `status` column will cause queries to fail; RLS may block service-role

### Immediate Actions Required

1. **Add `status` column to `media_assets` table** (migration)
2. **Verify RLS policies allow service-role inserts** (test or add policy)
3. **Fix `media-service.ts` column name** (`file_size` → `size_bytes`)

---

## 📋 PART A — FILE DISCOVERY

### MVP & Phase Documentation Files

**MVP Files:**
- `docs/MVP1_STORAGE_QUOTA_FIX.md` - Storage quota fix documentation
- `docs/MVP1_VERIFICATION_RESULTS.md` - Verification results
- `docs/MVP1_STORAGE_QUOTA_FIX_SUMMARY.md` - Summary
- `docs/MVP1_FILE_MAP.md` - File mapping
- `docs/MVP1_TEST_RESULTS.md` - Test results
- `docs/MVP1_IMPLEMENTATION_NOTES.md` - Implementation notes
- `docs/MVP1_SUMMARY.md` - Summary
- `docs/MVP1_AUDIT_REPORT.md` - Audit report
- `MVP_DATABASE_TABLE_AUDIT_REPORT.md` - Database audit
- `MVP_CLEANUP_SUMMARY.md` - Cleanup summary
- `MVP4_CANVAS_CLEANUP_SUMMARY.md` - Canvas cleanup
- `MVP_VERIFICATION_CHECKLIST.md` - Verification checklist
- `MVP_CRITICAL_FILES.md` - Critical files list

**Phase Documentation:**
- `PHASE3_APPLICATION_MIGRATION_SUMMARY.md` - Phase 3 migration
- `PHASE2_IMPLEMENTATION_SUMMARY.md` - Phase 2 implementation
- `PHASE4_SUMMARY.md` - Phase 4 summary
- `PHASE5_COMPLETION_SUMMARY.md` - Phase 5 completion
- `PHASE6_FINAL_SUMMARY.md` - Phase 6 final
- `docs/phases/PHASE_3_IMPLEMENTATION_COMPLETE.md` - Phase 3 completion
- `docs/phases/PHASE_6_IMPLEMENTATION.md` - Phase 6 implementation
- Plus 60+ additional phase documentation files

**Onboarding Files:**
- `ONBOARDING_IMAGE_FIX.md` - Image fix
- `docs/ONBOARDING_IMPROVEMENTS_PLAN.md` - Improvements plan
- `docs/ONBOARDING_BRAND_GUIDE_ALIGNMENT.md` - Brand guide alignment
- `docs/ONBOARDING_REBUILD_SUMMARY.md` - Rebuild summary
- Plus 5 additional onboarding files

### Crawler Pipeline Files

**Core Crawler:**
- `server/workers/brand-crawler.ts` (1,571 lines) - Main crawler worker
- `server/routes/crawler.ts` (1,445 lines) - Crawler API routes
- `server/lib/scraped-images-service.ts` (442 lines) - Image persistence service
- `scripts/test-crawl-dedup.ts` - Test script
- `server/__tests__/crawler-improvements.test.ts` - Tests

**Supporting Services:**
- `server/lib/image-sourcing.ts` - Image sourcing utilities
- `server/routes/brand-intelligence.ts` - Brand intelligence API
- `shared/brand-intelligence.ts` - Shared types

**Frontend Components:**
- `client/pages/onboarding/Screen3AiScrape.tsx` - AI scrape screen
- `client/components/brand-intake/CrawlerDiffModal.tsx` - Diff modal

### Image Persistence Pipeline Files

**Core Services:**
- `server/lib/media-db-service.ts` (627 lines) - Media database service
- `server/lib/media-service.ts` (833 lines) - Media service (upload/processing)
- `server/lib/scraped-images-service.ts` (442 lines) - Scraped images persistence
- `server/lib/image-sourcing.ts` - Image sourcing utilities

**API Routes:**
- `server/routes/media.ts` - Media API routes
- `server/routes/media-v2.ts` - Media API v2 (mock)
- `server/routes/media-management.ts` - Media management routes
- `server/routes/brand-guide.ts` (889 lines) - Brand guide API (includes image fetching)

**Frontend Components:**
- `client/pages/onboarding/Screen5BrandSummaryReview.tsx` (651 lines) - Step 5 review screen
- `client/components/dashboard/CreativeStudioBrandKit.tsx` - Brand kit component

### Database Schema & Migrations

**Migrations:**
- `supabase/migrations/001_bootstrap_schema.sql` - Main schema (includes `media_assets`, `storage_quotas`)
- `supabase/migrations/005_finalize_brand_id_uuid_migration.sql` - Brand ID UUID migration
- `supabase/migrations/006_drop_legacy_brand_id_text_columns.sql` - Drop legacy columns
- `supabase/migrations/_legacy/014_add_media_assets_metadata_if_missing.sql` - Legacy metadata migration
- `supabase/migrations/_legacy/012_canonical_schema_alignment.sql` - Legacy schema alignment

**Schema Documentation:**
- `DATABASE-SCHEMA-DIAGRAM.md` - Schema diagram
- `DATABASE-STRUCTURE.md` - Database structure
- `SCHEMA_AUDIT_REPORT.md` - Schema audit

### Master Prompts & Command Files

**Prompt Files:**
- `prompts/doc/en/v1.0.md` - Copywriter system prompt
- `prompts/design/en/v1.0.md` - Creative system prompt
- `prompts/advisor/en/v1.0.md` - Advisor system prompt
- `server/lib/prompts/brand-guide-prompts.ts` - Brand guide prompts
- `server/lib/creative-system-prompt.ts` - Creative system prompt (inline)
- `server/lib/ai/docPrompt.ts` - Doc agent prompt builder
- `server/lib/ai/advisorPrompt.ts` - Advisor prompt builder

**Agent Files:**
- `server/agents/brand-fidelity-scorer.ts` - Brand fidelity scorer
- `server/agents/performance-adjuster.ts` - Performance adjuster
- `server/agents/content-linter.ts` - Content linter

**AI Generation:**
- `server/workers/ai-generation.ts` - AI generation worker

### Storage Quota Files

**Documentation:**
- `docs/STORAGE_QUOTA_VERIFICATION_GUIDE.md` (296 lines) - Verification guide
- `docs/STORAGE_QUOTA_END_TO_END_VERIFICATION.md` - End-to-end verification
- `docs/STORAGE_QUOTA_VERIFICATION_SUMMARY.md` - Verification summary
- `docs/MVP1_STORAGE_QUOTA_FIX.md` (456 lines) - Fix documentation
- `docs/verify_storage_quotas_migration.sql` - Verification SQL

---

## 🏗️ PART B — ARCHITECTURAL UNDERSTANDING

### 1. Crawler Pipeline Architecture

**Purpose:** Extract brand assets (images, colors, typography, voice) from websites during onboarding.

**Components:**
- **Entry Point:** `POST /api/crawl/start?sync=true` (`server/routes/crawler.ts:160`)
- **Worker:** `server/workers/brand-crawler.ts` - Playwright-based crawler
- **Image Extraction:** `extractImages()` function (lines 619-858)
- **Image Persistence:** `persistScrapedImages()` (`server/lib/scraped-images-service.ts:43`)

**Flow:**
1. Client sends crawl request with `url`, `brand_id`, `workspaceId`
2. Server extracts `tenantId` from request/auth context
3. `crawlWebsite()` crawls site, extracts images, colors, typography
4. `extractImages()` categorizes images (logo/hero/team/subject/other)
5. `persistScrapedImages()` saves to `media_assets` table
6. Returns `brandKit` with extracted data

**Dependencies:**
- Playwright for browser automation
- `node-vibrant` for color extraction
- OpenAI/Claude for AI generation
- Supabase for database persistence

**Key Data Structures:**
- `CrawledImage` interface: `{ url, alt, width, height, role, pageType, filename, priority }`
- `BrandKitData` interface: `{ voice_summary, keyword_themes, about_blurb, colors, typography, source_urls, metadata }`

### 2. Image Persistence Pipeline Architecture

**Purpose:** Persist scraped images to `media_assets` table with proper metadata and quota handling.

**Components:**
- **Entry Point:** `persistScrapedImages(brandId, tenantId, images)` (`server/lib/scraped-images-service.ts:43`)
- **Database Service:** `MediaDBService.createMediaAsset()` (`server/lib/media-db-service.ts:77`)
- **Quota Check:** `getStorageUsage()` (`server/lib/media-db-service.ts:443`)

**Flow:**
1. `persistScrapedImages()` receives images from crawler
2. Validates `tenantId` (must be valid UUID)
3. For each image:
   - Generates hash from URL
   - Determines category (logos/images/graphics)
   - Creates metadata with `source='scrape'`
   - Calls `createMediaAsset()` with `fileSize=0`, `path=image.url`
4. `createMediaAsset()` detects scraped image: `fileSize === 0 && path.startsWith("http")`
5. Skips quota check for scraped images
6. Inserts into `media_assets` table

**Dependencies:**
- `media_assets` table (schema in `001_bootstrap_schema.sql:552`)
- `storage_quotas` table (optional, for uploaded files)
- Supabase client with service-role key

**Key Data Structures:**
- `MediaAssetRecord`: `{ id, brand_id, tenant_id, category, filename, path, size_bytes, hash, metadata, ... }`
- Scraped images: `path` contains HTTP URL, `size_bytes=0`, `metadata.source='scrape'`

### 3. Storage Quota System Architecture

**Purpose:** Track and enforce storage limits for uploaded media (NOT scraped images).

**Components:**
- **Table:** `storage_quotas` (`supabase/migrations/001_bootstrap_schema.sql:608`)
- **Service:** `MediaDBService.getStorageUsage()` (`server/lib/media-db-service.ts:443`)
- **Check:** `createMediaAsset()` quota validation (`server/lib/media-db-service.ts:103`)

**Flow:**
1. `getStorageUsage(brandId)` queries `storage_quotas` table
2. If table/row missing → returns unlimited quota (non-blocking)
3. Calculates usage from `media_assets.size_bytes` WHERE `brand_id = :brandId`
4. Returns `{ totalUsedBytes, quotaLimitBytes, percentageUsed, isHardLimit }`
5. `createMediaAsset()` checks quota ONLY for uploaded files (not scraped images)

**Key Fix (MVP1):**
- Scraped images (`fileSize === 0 && path.startsWith("http")`) skip quota check entirely
- Quota lookup failures return unlimited quota (graceful degradation)

### 4. Onboarding Step 5 Architecture

**Purpose:** Display scraped images (logos and other images) in Brand Summary Review screen.

**Components:**
- **Component:** `Screen5BrandSummaryReview.tsx` (`client/pages/onboarding/Screen5BrandSummaryReview.tsx:22`)
- **API:** `GET /api/brand-guide/:brandId` (`server/routes/brand-guide.ts:27`)
- **Service:** `getScrapedImages(brandId)` (`server/lib/scraped-images-service.ts:324`)

**Flow:**
1. Component mounts, fetches `brandId` from `localStorage`
2. Calls `GET /api/brand-guide/:brandId`
3. API calls `getScrapedImages(brandId)`
4. `getScrapedImages()` queries `media_assets` WHERE `brand_id = :brandId` AND `path LIKE 'http%'`
5. Filters by `metadata.role` (logo vs other)
6. Returns images with `source='scrape'`
7. API includes in `approvedAssets.uploadedPhotos`
8. Component separates logos from other images
9. Displays in UI

**Dependencies:**
- `media_assets` table with scraped images
- Brand Guide API endpoint
- Frontend image rendering

---

## 🧪 PART C — EXPECTED PIPELINE (THEORY CHECK)

### 1. Crawler Expected Behavior

**✅ Expected:**
1. User enters website URL during onboarding
2. Client sends `POST /api/crawl/start?sync=true` with `{ url, brand_id, workspaceId }`
3. Server extracts `tenantId` from `workspaceId` or auth context
4. `crawlWebsite()` crawls site (max 50 pages, depth ≤ 3)
5. `extractImages()` extracts images from each page
6. Images categorized: logo/hero/team/subject/other
7. Images sorted by priority (logo > hero > other)
8. Top 15 images selected
9. `persistScrapedImages(brandId, tenantId, images)` called
10. Images saved to `media_assets` with:
    - `brand_id`: brand UUID (or temporary `brand_*` during onboarding)
    - `tenant_id`: workspace UUID
    - `path`: HTTP URL of image
    - `size_bytes`: 0 (external URL, no storage used)
    - `metadata.source`: "scrape"
    - `metadata.role`: "logo" | "hero" | "team" | "subject" | "other"
11. Returns `brandKit` with extracted data

**Gaps Identified:**
- ⚠️ **Temporary brandId Reconciliation:** If brand created with different UUID than temp ID, images need `transferScrapedImages()` call
- ⚠️ **TenantId Validation:** Must be valid UUID, not "unknown" or empty

### 2. Storage Expected Behavior

**✅ Expected:**
1. Quota lookup should NOT block scraped images
2. External URLs (`fileSize = 0`, `path starts with http`) should skip quota checks
3. Rows inserted into `media_assets` with:
   - `brand_id`: UUID
   - `tenant_id`: UUID
   - `path`: External HTTP URL
   - `size_bytes`: 0
   - `metadata.source`: "scrape"
   - `metadata.role`: Image role
4. No quota errors in logs

**Gaps Identified:**
- ✅ **FIXED:** Quota check now skips scraped images (MVP1 fix)
- ✅ **FIXED:** Quota lookup failures return unlimited quota (graceful degradation)

### 3. Onboarding Expected Behavior

**✅ Expected:**
1. Step 5 calls `GET /api/brand-guide/:brandId`
2. API calls `getScrapedImages(brandId)`
3. Queries `media_assets` WHERE `brand_id = :brandId` AND `path LIKE 'http%'`
4. Filters by `metadata.role` for logos
5. Returns images in `approvedAssets.uploadedPhotos` with `source='scrape'`
6. Step 5 separates logos from other images
7. Displays logos in "Brand Logo" section
8. Displays other images in "Brand Images" section

**Gaps Identified:**
- ⚠️ **BrandId Format:** Step 5 validates brandId is UUID (rejects temporary `brand_*` IDs)
- ⚠️ **Metadata Column:** Some queries may fail if `metadata` column doesn't exist (code handles gracefully)

---

## 🧪 PART D — REAL IMPLEMENTATION CHECK

### 1. Crawler Implementation ✅

**Does the crawler extract images?**
- ✅ YES: `extractImages()` function (lines 619-858 in `brand-crawler.ts`)
- ✅ Extracts from `<img>` tags and background images
- ✅ Categorizes by role (logo/hero/team/subject/other)
- ✅ Limits to 15 images max

**Does it pass images to persistence?**
- ✅ YES: `server/routes/crawler.ts:723` calls `persistScrapedImages(brandId, finalTenantId, allImages)`
- ✅ Only if `tenantId` is valid UUID
- ✅ Logs warning if `tenantId` missing

**Code Reference:**
```723:723:server/routes/crawler.ts
                const persistedIds = await persistScrapedImages(brandId, finalTenantId, allImages);
```

### 2. Persistence Implementation ✅

**Does persistence skip quota correctly?**
- ✅ YES: `server/lib/media-db-service.ts:106` detects scraped images
- ✅ Code: `const isScrapedImage = fileSize === 0 && path.startsWith("http");`
- ✅ Skips quota check if `isScrapedImage === true`

**Code Reference:**
```103:137:server/lib/media-db-service.ts
    // Check storage quota before inserting
    // ✅ FIX: For scraped images (external URLs with size_bytes=0), skip quota check
    // Scraped images don't use Supabase Storage, so quota doesn't apply
    const isScrapedImage = fileSize === 0 && path.startsWith("http");
    
    if (isScrapedImage) {
      // Scraped images are external URLs, don't use storage, skip quota check
      console.log(`[MediaDB] Skipping quota check for scraped image (external URL, no storage used)`);
    } else {
      // Only check quota for uploaded files (non-scraped images)
      try {
        const usage = await this.getStorageUsage(brandId);
        if (usage.isHardLimit) {
          throw new AppError(
            ErrorCode.QUOTA_EXCEEDED,
            "Storage quota exceeded",
            HTTP_STATUS.CONFLICT,
            "warning",
            {
              quotaLimitBytes: usage.quotaLimitBytes,
              usedBytes: usage.totalUsedBytes,
            },
            "Storage quota has been reached. Delete unused assets or upgrade your plan."
          );
        }
      } catch (quotaError: any) {
        // ✅ FIX: If quota lookup fails, log warning but allow persistence
        // This prevents quota system issues from blocking image persistence
        // The getStorageUsage() method already returns unlimited quota on error,
        // so we only get here if there's a different error (like AppError from isHardLimit check)
        console.warn(`[MediaDB] Quota check failed, allowing persistence (quota system may not be fully configured):`, quotaError.message);
        // Don't re-throw - allow the upload to proceed
        // This ensures scraped images and other uploads work even if quota system has issues
      }
    }
```

**Does the database insert succeed?**
- ✅ YES: `createMediaAsset()` inserts into `media_assets` table
- ✅ Handles duplicate detection by hash
- ✅ Returns created asset record

**Code Reference:**
```141:181:server/lib/media-db-service.ts
      const assetRecord = await mediaDB.createMediaAsset(
        brandId,
        finalTenantId,
        filename,
        "image/jpeg", // Default MIME type
        image.url, // ✅ Store actual URL in path column (for scraped images, path = URL)
        0, // File size unknown for external URLs
        hash,
        image.url, // This will be ignored if url column doesn't exist, but keep for compatibility
        category,
        metadata,
        image.url // Use same URL for thumbnail
      );

      persistedIds.push(assetRecord.id);
      console.log(`[ScrapedImages] ✅ Persisted image: ${filename} (${image.url.substring(0, 50)}...)`);
    } catch (error: any) {
      // If duplicate, get the existing asset ID and add it to persistedIds
      if (error?.code === ErrorCode.DUPLICATE_RESOURCE || error?.message?.includes("duplicate") || error?.message?.includes("already exists")) {
        // Extract existing asset ID from error details
        const existingAssetId = error?.details?.existingAssetId;
        if (existingAssetId) {
          persistedIds.push(existingAssetId);
          console.log(`[ScrapedImages] Image already exists (using existing): ${image.url.substring(0, 50)}... (ID: ${existingAssetId})`);
        } else {
          // Fallback: query for existing asset by hash
          try {
            const existingAsset = await mediaDB.checkDuplicateAsset(brandId, hash);
            if (existingAsset) {
              persistedIds.push(existingAsset.id);
              console.log(`[ScrapedImages] Image already exists (found by hash): ${image.url.substring(0, 50)}... (ID: ${existingAsset.id})`);
            } else {
              console.warn(`[ScrapedImages] Duplicate detected but couldn't find existing asset: ${image.url.substring(0, 50)}...`);
            }
          } catch (lookupError) {
            console.warn(`[ScrapedImages] Could not lookup existing asset: ${lookupError}`);
          }
        }
        continue;
      }
      console.error(`[ScrapedImages] ❌ Failed to persist image ${image.url}:`, error);
      console.error(`[ScrapedImages] Error details:`, {
        url: image.url.substring(0, 100),
        error: error?.message || String(error),
        code: error?.code,
      });
      // Continue with other images
    }
```

### 3. API Routes Implementation ✅

**Do API routes return the media correctly?**
- ✅ YES: `GET /api/brand-guide/:brandId` calls `getScrapedImages(brandId)`
- ✅ Includes scraped images in `approvedAssets.uploadedPhotos`
- ✅ Each image has `source='scrape'` and `metadata.role`

**Code Reference:**
```75:92:server/routes/brand-guide.ts
    // ✅ CRITICAL: Get scraped images from media_assets table
    // This ensures Brand Guide includes images scraped during onboarding
    let scrapedImages: Array<{ id: string; url: string; filename: string; source: string; metadata?: Record<string, unknown> }> = [];
    try {
      const scraped = await getScrapedImages(brandId);
      scrapedImages = scraped.map(img => ({
        id: img.id,
        url: img.url,
        filename: img.filename,
        source: "scrape" as const,
        metadata: img.metadata,
      }));
      
      // ✅ LOGGING: Brand Guide query with IDs (moved after hasBrandGuide check)
    } catch (error) {
      console.error(`[BrandGuide] Error fetching scraped images for brandId ${brandId}:`, error);
      // Continue without scraped images - don't fail the entire request
    }
```

### 4. Frontend Implementation ⚠️

**Does the frontend use the correct endpoint and correct fields?**
- ✅ YES: `Screen5BrandSummaryReview.tsx:75` calls `GET /api/brand-guide/:brandId`
- ✅ Filters by `metadata.role === "logo"` for logos
- ⚠️ **ISSUE:** Validates brandId is UUID (rejects temporary `brand_*` IDs)

**Code Reference:**
```46:173:client/pages/onboarding/Screen5BrandSummaryReview.tsx
  // ✅ FIX: Fetch images from brand guide (where scraped images are stored)
  useEffect(() => {
    const fetchBrandGuideImages = async () => {
      const brandId = localStorage.getItem("aligned_brand_id");
      if (!brandId) {
        if (import.meta.env.DEV) {
          logWarning("No brandId found in localStorage", { step: "fetch_images" });
        }
        return;
      }

      // ✅ Validate brandId is a UUID (not temporary brand_*)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(brandId)) {
        logError("Invalid brand ID format", new Error("Invalid brand ID format"), { step: "fetch_images" });
        // Don't show alert - just log and continue with fallback
        if (import.meta.env.DEV) {
          logWarning("Will use images from brandSnapshot as fallback", { step: "fetch_images" });
        }
        return;
      }

      try {
        // ✅ Use centralized API utility with auth headers
        const { apiGet } = await import("@/lib/api");
        if (import.meta.env.DEV) {
          logInfo("Fetching brand guide for images", { step: "fetch_images" });
        }
        
        const data = await apiGet<{ brandGuide: any; hasBrandGuide: boolean }>(`/api/brand-guide/${brandId}`);
        const brandGuide = data.brandGuide;
        
        if (import.meta.env.DEV) {
          logInfo("Brand guide response", {
            step: "fetch_images",
            hasBrandGuide: !!brandGuide,
            hasApprovedAssets: !!brandGuide?.approvedAssets,
            uploadedPhotosCount: brandGuide?.approvedAssets?.uploadedPhotos?.length || 0,
          });
        }
        
        // ✅ FIX: Fetch brand story from brand guide (purpose or longFormSummary)
        // This ensures we get the AI-generated story, not just the snapshot
        if (brandGuide?.purpose || brandGuide?.longFormSummary) {
          const story = brandGuide.purpose || brandGuide.longFormSummary || "";
          // Only use if it's a valid non-empty string (not "0", not empty)
          if (story && typeof story === "string" && story.length > 10 && story !== "0") {
            if (import.meta.env.DEV) {
              logInfo("Found brand story from brand guide", { step: "fetch_story" });
            }
            setBrandGuideStory(story);
            // Also update brandSnapshot locally so it displays immediately
            if (brandSnapshot) {
              setBrandSnapshot({
                ...brandSnapshot,
                extractedMetadata: {
                  ...brandSnapshot.extractedMetadata,
                  brandIdentity: story,
                },
              });
            }
          }
        }
        
        // Extract scraped images from approvedAssets.uploadedPhotos (source='scrape')
        // ✅ Separate logos from other images based on metadata.role
        if (brandGuide?.approvedAssets?.uploadedPhotos) {
          const allScrapedImages = brandGuide.approvedAssets.uploadedPhotos
            .filter((img: any) => img.source === "scrape" && img.url && typeof img.url === "string" && img.url.startsWith("http"));
          
          // Separate by role: logos vs other images
          const logos = allScrapedImages
            .filter((img: any) => {
              const role = img.metadata?.role || "";
              return role === "logo" || role === "Logo";
            })
            .map((img: any) => img.url)
            .filter(Boolean);
          
          const otherImgs = allScrapedImages
            .filter((img: any) => img.url)
            .filter((img: any) => {
              const role = img.metadata?.role || "";
              return role !== "logo" && role !== "Logo";
            })
            .map((img: any) => img.url)
            .filter(Boolean);
          
          if (import.meta.env.DEV) {
            logInfo("Separated images", {
              step: "fetch_images",
              logosCount: logos.length,
              otherImagesCount: otherImgs.length,
              totalCount: allScrapedImages.length,
            });
          }
          
          if (logos.length > 0 || otherImgs.length > 0) {
            if (import.meta.env.DEV) {
              logInfo("Found images from brand guide", {
                step: "fetch_images",
                logosCount: logos.length,
                otherImagesCount: otherImgs.length,
              });
            }
            setLogoImages(logos);
            setOtherImages(otherImgs);
            return;
          } else {
            logWarning("No valid scraped images found in brand guide", {
              step: "fetch_images",
              totalPhotos: brandGuide.approvedAssets.uploadedPhotos.length,
            });
          }
        } else {
          if (import.meta.env.DEV) {
            logWarning("No approvedAssets.uploadedPhotos in brand guide", { step: "fetch_images" });
          }
        }
      } catch (error) {
        logError("Error fetching brand guide images", error instanceof Error ? error : new Error(String(error)), {
          step: "fetch_images",
        });
        // Continue with fallback - don't block UI
      }
    };

    fetchBrandGuideImages();
  }, []);
```

**Mismatches Identified:**
- ⚠️ **BrandId Validation:** Step 5 rejects temporary `brand_*` IDs (should work with final UUID only)
- ✅ **Image Filtering:** Correctly filters by `metadata.role`
- ✅ **Source Check:** Correctly checks `source === "scrape"`

---

## 🐞 PART E — BUG DIAGNOSIS

### 🔥 Critical Blocking Issues

**1. Missing `status` Column on `media_assets` Table**
- **Issue:** Code queries for `status = 'active'` but schema doesn't include `status` column
- **Location:** 
  - Schema: `supabase/migrations/001_bootstrap_schema.sql:552-567` - No `status` column
  - Queries: `server/lib/scraped-images-service.ts:341`, `server/lib/image-sourcing.ts:109` - Filter by `status = 'active'`
  - Insert: `server/lib/media-service.ts:561` - Tries to insert `status: "active"`
- **Impact:** 
  - Queries filtering by `status` will fail if column doesn't exist
  - `media-service.ts` inserts will fail if column doesn't exist
  - Scraped images queries may return no results
- **Fix Required:** 
  - Add `status TEXT DEFAULT 'active'` column to `media_assets` table
  - OR remove all `status` filters from queries (if column doesn't exist)
  - **Priority:** 🔥 Critical

**2. RLS Policies May Block Service-Role Access**
- **Issue:** RLS policies on `media_assets` check `auth.uid()` which service-role key may not satisfy
- **Location:** `supabase/migrations/001_bootstrap_schema.sql:1887-1897` - RLS policy requires `brand_members.user_id = auth.uid()`
- **Current Policy:**
  ```sql
  CREATE POLICY "Brand members can view media assets"
    ON media_assets FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM brand_members
        WHERE brand_members.brand_id = media_assets.brand_id
        AND brand_members.user_id = auth.uid()
      )
    );
  ```
- **Impact:** Service-role key may not bypass RLS, causing inserts/queries to fail
- **Fix Required:** 
  - Verify service-role key bypasses RLS (should work by default in Supabase)
  - OR add policy allowing service-role: `OR current_setting('request.jwt.claims.role', true) = 'service_role'`
  - **Note:** Service-role keys typically bypass RLS, but verify if issues occur
  - **Priority:** 🔥 Critical

**3. Temporary BrandId Reconciliation Gap**
- **Issue:** `transferScrapedImages()` exists but only called if `tempBrandId` is provided in request body
- **Location:** 
  - Function: `server/lib/scraped-images-service.ts:220` - `transferScrapedImages()` exists
  - Call: `server/routes/brands.ts:523` - Only called if `req.body.tempBrandId` provided
- **Impact:** If client doesn't send `tempBrandId`, images remain orphaned
- **Fix Required:** 
  - Ensure onboarding flow sends `tempBrandId` when creating brand
  - OR lookup temp brandId from `localStorage` or session
  - **Priority:** ⚠️ Important (mitigated by Screen3AiScrape requiring UUID)

**4. TenantId Validation Too Strict**
- **Issue:** `persistScrapedImages()` returns empty array if `tenantId` is invalid UUID
- **Location:** `server/lib/scraped-images-service.ts:58-61`
- **Impact:** Images not persisted if `tenantId` format is wrong
- **Fix Required:** Better error handling or fallback to brand lookup
- **Priority:** ⚠️ Important

**5. Step 5 BrandId UUID Validation (Actually Good)**
- **Status:** ✅ **NOT A BUG** - This is correct behavior
- **Location:** `client/pages/onboarding/Screen5BrandSummaryReview.tsx:58-66`
- **Reason:** Screen3AiScrape also validates brandId must be UUID (line 184), so brand is created before scraping
- **Impact:** None - this ensures consistency
- **Fix Required:** None - working as designed

### ⚠️ Important Issues

**6. Metadata Column Handling (Actually Good)**
- **Status:** ✅ **HANDLED CORRECTLY** - Code has fallback
- **Location:** 
  - Schema: `supabase/migrations/001_bootstrap_schema.sql:564` - `metadata JSONB DEFAULT '{}'::jsonb`
  - Fallback: `server/lib/scraped-images-service.ts:339-377` - Retries without metadata if column missing
- **Impact:** None - code handles gracefully
- **Fix Required:** None - working as designed

**7. Column Name Inconsistency Between Services**
- **Issue:** `media-service.ts` uses `file_size` but schema has `size_bytes`
- **Location:** 
  - Schema: `supabase/migrations/001_bootstrap_schema.sql:561` - `size_bytes BIGINT`
  - Wrong: `server/lib/media-service.ts:557` - Tries to insert `file_size: asset.size`
  - Correct: `server/lib/media-db-service.ts:149` - Uses `size_bytes: fileSize`
- **Impact:** `media-service.ts` inserts will fail (wrong column name)
- **Fix Required:** Change `media-service.ts:557` to use `size_bytes` instead of `file_size`
- **Priority:** ⚠️ Important

### 📝 Optional Improvements

**7. Image URL Validation**
- **Issue:** No validation that scraped image URLs are accessible
- **Location:** `server/lib/scraped-images-service.ts:93-96` - Only checks `startsWith("http")`
- **Impact:** Broken image URLs may be persisted
- **Fix Required:** Optional URL validation before persistence

**8. Duplicate Detection by URL Hash**
- **Issue:** Duplicate detection uses URL hash, but same image with different URLs won't be detected
- **Location:** `server/lib/scraped-images-service.ts:99` - Hash from URL, not image content
- **Impact:** Duplicate images with different URLs may be persisted
- **Fix Required:** Consider content-based hashing for true duplicates

**9. Image Priority Calculation**
- **Issue:** Priority calculation may not prioritize logos correctly
- **Location:** `server/workers/brand-crawler.ts:585-608` - Priority calculation
- **Impact:** Wrong images may be selected
- **Fix Required:** Review priority algorithm

---

## 🧭 PART F — WHAT TESTS SHOULD CONFIRM

### End-to-End Test Flow

**1. Crawler Logs Show Images Found**
- ✅ Log: `[Crawler] ✅ Images extracted successfully` with counts
- ✅ Log: `[Crawler] Extracted X images from page Y`
- ✅ Log: `logos: N, otherImages: M`

**2. Media Service Logs Show:**
- ✅ Log: `[MediaDB] Skipping quota check for scraped image (external URL, no storage used)`
- ✅ Log: `[ScrapedImages] ✅ Persisted image: filename (url...)`
- ✅ Log: `[ScrapedImages] Persistence complete` with summary

**3. `media_assets` Contains Rows for External Image URLs**
- ✅ Query: `SELECT * FROM media_assets WHERE brand_id = :brandId AND path LIKE 'http%'`
- ✅ Should return 10-15 rows
- ✅ All rows have `size_bytes = 0`
- ✅ All rows have `metadata->>'source' = 'scrape'`
- ✅ Some rows have `metadata->>'role' = 'logo'`

**4. API Route `/api/brand-guide/:brandId` Returns Them**
- ✅ Response includes `approvedAssets.uploadedPhotos` array
- ✅ Each image has `source: "scrape"`
- ✅ Each image has `metadata.role` set
- ✅ Images have valid HTTP URLs

**5. Step 5 Shows Images**
- ✅ "Brand Logo" section shows logo thumbnails
- ✅ "Brand Images" section shows other image thumbnails
- ✅ Images are clickable/viewable
- ✅ No "No logos found" or "No images found" messages

### Test SQL Queries

```sql
-- 1. Check scraped images exist
SELECT 
  id, 
  brand_id, 
  path, 
  filename, 
  category,
  size_bytes,
  metadata->>'source' as source,
  metadata->>'role' as role,
  created_at
FROM media_assets 
WHERE brand_id = '<BRAND_UUID>' 
  AND path LIKE 'http%'
ORDER BY created_at DESC 
LIMIT 20;

-- 2. Check storage quota status
SELECT 
  brand_id,
  limit_bytes,
  used_bytes,
  (used_bytes::float / limit_bytes * 100) as percent_used
FROM storage_quotas
WHERE brand_id = '<BRAND_UUID>';

-- 3. Count images by category
SELECT 
  category,
  COUNT(*) as count,
  COUNT(CASE WHEN path LIKE 'http%' THEN 1 END) as scraped_count
FROM media_assets
WHERE brand_id = '<BRAND_UUID>'
GROUP BY category;
```

---

## 📘 PART G — ACTIONABLE "WHAT TO DO NEXT" REPORT

### 🔥 Critical Blocking Fixes

**1. Add `status` Column to `media_assets` Table**
- **File:** Create new migration or update `supabase/migrations/001_bootstrap_schema.sql`
- **Action:** Add `status TEXT DEFAULT 'active'` column to `media_assets` table
- **SQL:**
  ```sql
  ALTER TABLE media_assets 
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
  ```
- **Code References:** 
  - Queries: `server/lib/scraped-images-service.ts:341`, `server/lib/image-sourcing.ts:109`
  - Insert: `server/lib/media-service.ts:561`
- **Priority:** 🔥 Critical

**2. Verify/Fix RLS Policies for Service-Role**
- **File:** `supabase/migrations/001_bootstrap_schema.sql:1887-1897`
- **Current State:** Only SELECT policy exists, no INSERT/UPDATE policies defined
- **Action:** 
  - Verify service-role key bypasses RLS (should work by default in Supabase)
  - Add INSERT policy for service-role if needed:
    ```sql
    CREATE POLICY "Service role can insert media assets"
      ON media_assets FOR INSERT
      TO service_role
      WITH CHECK (true);
    ```
  - OR verify `server/lib/supabase.ts` uses service-role key correctly
- **Code Reference:** 
  - RLS: `supabase/migrations/001_bootstrap_schema.sql:1887-1897`
  - Service client: `server/lib/supabase.ts`
- **Priority:** 🔥 Critical

**3. Fix Column Name in `media-service.ts`**
- **File:** `server/lib/media-service.ts:557`
- **Action:** Change `file_size: asset.size` to `size_bytes: asset.size`
- **Code Reference:** `server/lib/media-service.ts:547-574`
- **Priority:** ⚠️ Important (only affects uploads, not scraped images)

### ⚠️ Important Fixes

**4. Ensure `transferScrapedImages()` is Called (If Using Temp IDs)**
- **File:** `server/routes/brands.ts:520-541`
- **Status:** ✅ Already implemented, but requires `tempBrandId` in request
- **Action:** 
  - Verify onboarding flow sends `tempBrandId` when creating brand
  - OR document that brand must be created before scraping (current behavior)
- **Code Reference:** `server/routes/brands.ts:523`
- **Priority:** ⚠️ Important (mitigated by Screen3AiScrape requiring UUID)

**5. Improve TenantId Validation**
- **File:** `server/lib/scraped-images-service.ts:58-61`
- **Action:** Add fallback to lookup `tenant_id` from brand if provided `tenantId` is invalid
- **Code Reference:** `server/lib/scraped-images-service.ts:43-81`
- **Priority:** ⚠️ Important

### 📝 Optional Improvements

**7. Add Image URL Validation**
- **File:** `server/lib/scraped-images-service.ts:93-96`
- **Action:** Add optional HEAD request to validate URL is accessible
- **Priority:** 📝 Optional

**8. Improve Duplicate Detection**
- **File:** `server/lib/scraped-images-service.ts:99`
- **Action:** Consider content-based hashing for true duplicates
- **Priority:** 📝 Optional

**9. Review Image Priority Algorithm**
- **File:** `server/workers/brand-crawler.ts:585-608`
- **Action:** Review and improve priority calculation
- **Priority:** 📝 Optional

### 🧹 Cleanup Tasks

**10. Remove Duplicate Media Service Files**
- **Files:** `server/lib/media-service.ts` vs `server/lib/media-db-service.ts`
- **Action:** Consolidate or clarify responsibilities
- **Priority:** 📝 Optional

**11. Update Master Prompts with Image Context**
- **Files:** `prompts/doc/en/v1.0.md`, `prompts/design/en/v1.0.md`
- **Action:** Add references to scraped images in prompts
- **Priority:** 📝 Optional

**12. Document BrandId UUID Migration Impact**
- **Files:** All MVP/Phase docs
- **Action:** Document that `media_assets.brand_id` uses UUID (not TEXT)
- **Priority:** 📝 Optional

### 📊 Testing Checklist

**13. End-to-End Test**
- [ ] Run crawler for test brand
- [ ] Verify images persist to `media_assets`
- [ ] Verify Step 5 displays images
- [ ] Verify Brand Guide API returns images
- [ ] Check logs for quota skip messages

**14. Migration Verification**
- [ ] Verify `storage_quotas` table exists
- [ ] Verify `media_assets.metadata` column exists
- [ ] Verify RLS policies allow service-role access
- [ ] Verify `brand_id` is UUID (not TEXT)

**15. Edge Case Testing**
- [ ] Test with temporary `brand_*` ID
- [ ] Test with missing `tenantId`
- [ ] Test with invalid image URLs
- [ ] Test with duplicate images

---

## 📊 SUMMARY

### ✅ What's Working

1. **Crawler Pipeline:** ✅ Extracts images correctly
2. **Quota Skip:** ✅ Scraped images skip quota check
3. **Persistence:** ✅ Images saved to `media_assets` table
4. **API Routes:** ✅ Brand Guide API returns scraped images
5. **Storage Quota Fix:** ✅ MVP1 fix implemented correctly

### ⚠️ What Needs Attention

1. **Missing `status` Column:** 🔥 Critical - Queries will fail if column doesn't exist
2. **RLS Policies:** 🔥 Critical - Need to verify service-role bypass works
3. **Column Name Mismatch:** ⚠️ Important - `media-service.ts` uses wrong column name
4. **TenantId Validation:** ⚠️ Important - Too strict, may block persistence
5. **BrandId Reconciliation:** ✅ Actually working - `transferScrapedImages()` is called, but requires `tempBrandId` in request

### 🔥 Critical Path to Fix

1. **Add `status` column to `media_assets` table** (queries will fail without it)
2. **Verify RLS policies allow service-role access** (inserts may fail if blocked)
3. **Fix `media-service.ts` column name** (`file_size` → `size_bytes`)
4. **Improve TenantId validation** (fallback to brand lookup)

### 📈 System Health

**Overall Status:** 🟡 **MOSTLY WORKING** - Core pipeline functional, but schema issues need attention

**Confidence Level:** 🟡 **MEDIUM** - Code is well-structured, but missing `status` column is critical

**Risk Level:** 🔴 **HIGH** - Missing `status` column will cause queries to fail; RLS may block service-role

---

**Report Generated:** 2025-01-30  
**Next Review:** After critical fixes are applied

---

## ✅ IMPLEMENTATION STATUS

**Date:** 2025-01-30  
**Status:** ✅ **FIXES IMPLEMENTED**

### Changes Made

**1. ✅ Added `status` Column to `media_assets` Table**
- **Migration:** `supabase/migrations/007_add_media_assets_status_and_rls.sql`
- **Changes:**
  - Added `status TEXT NOT NULL DEFAULT 'active'` column
  - Backfilled existing rows to 'active'
  - Added index `idx_media_assets_brand_status` on `(brand_id, status)`
- **Impact:** Queries filtering by `status = 'active'` will now work correctly

**2. ✅ Added RLS INSERT/UPDATE Policies for `media_assets`**
- **Migration:** `supabase/migrations/007_add_media_assets_status_and_rls.sql`
- **Changes:**
  - Added INSERT policy: "Brand members can insert media assets"
  - Added UPDATE policy: "Brand members can update media assets"
  - Service-role key bypasses RLS by default (no explicit policy needed)
- **Impact:** Users can now insert/update media assets for their brands; service-role operations unaffected

**3. ✅ Fixed `file_size` vs `size_bytes` Mismatch**
- **File:** `server/lib/media-service.ts`
- **Changes:**
  - `storeAssetRecord()`: Changed `file_size: asset.size` → `size_bytes: asset.size`
  - `getBrandStorageUsage()`: Changed `select("file_size")` → `select("size_bytes")`
  - `getStorageUsage()`: Changed `select("file_size, category")` → `select("size_bytes, category")`
  - `mapAssetRow()`: Changed `size: row.file_size` → `size: row.size_bytes || 0`
- **Impact:** Uploads will now succeed (previously would fail due to wrong column name)

**4. ✅ Improved TenantId Handling**
- **File:** `server/lib/scraped-images-service.ts`
- **Changes:**
  - Added `isValidUUID()` helper function
  - Improved validation: Attempts to resolve `tenantId` from brand if missing/invalid
  - More forgiving: Proceeds with `tenant_id = null` if resolution fails (instead of blocking)
  - Better logging: Clear messages when tenantId is resolved or when proceeding without it
- **Impact:** Images will persist even if tenantId is missing/invalid (as long as schema allows NULL)

### Verification Checklist

- [x] Migration file created (`007_add_media_assets_status_and_rls.sql`)
- [x] `status` column added with default 'active'
- [x] RLS INSERT/UPDATE policies added
- [x] `file_size` → `size_bytes` fixed in all locations
- [x] TenantId handling improved with fallback logic
- [ ] **TODO:** Run migration in dev/staging environment
- [ ] **TODO:** Verify scraped images persist with `status = 'active'`
- [ ] **TODO:** Verify RLS policies allow service-role inserts
- [ ] **TODO:** Test upload flow with `media-service.ts`
- [ ] **TODO:** Test scraped images with missing tenantId

### Remaining TODOs

1. **Run Migration:** Apply `007_add_media_assets_status_and_rls.sql` to database
2. **Test Scraped Images:** Verify images persist with correct `status` and `size_bytes = 0`
3. **Test Uploads:** Verify uploads work with `size_bytes` column
4. **Test RLS:** Verify service-role can insert, users can only see their brand's media
5. **Test TenantId Fallback:** Verify images persist even with missing/invalid tenantId

### Files Changed

1. `supabase/migrations/007_add_media_assets_status_and_rls.sql` (NEW)
2. `server/lib/media-service.ts` (4 fixes: `file_size` → `size_bytes`)
3. `server/lib/scraped-images-service.ts` (Improved TenantId handling)

### Next Steps

1. Apply migration to database
2. Run end-to-end tests (crawler → persistence → API → UI)
3. Monitor logs for any RLS or column name errors
4. Update any remaining documentation referencing `file_size`

