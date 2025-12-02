/**
 * Scraped Images Service
 * 
 * Handles persistence of images scraped from websites during onboarding.
 * Stores images in media_assets table with source='scrape' metadata.
 * 
 * CRITICAL: This service is part of the core crawler pipeline.
 * If images aren't persisted correctly, Brand Guide and Creative Studio will be broken.
 * 
 * ID REQUIREMENTS:
 * - brandId: Can be temporary during onboarding (e.g., "brand_1234567890")
 * - tenantId: MUST be a valid UUID from user's workspace (required)
 * 
 * RECONCILIATION:
 * - If brand is created with final UUID different from temp brandId:
 *   → Call transferScrapedImages(tempBrandId, finalBrandId)
 *   → Updates all media_assets.brand_id from temp to final UUID
 */

import { supabase } from "./supabase";
import { MediaDBService } from "./media-db-service";
import { ErrorCode } from "./error-responses";
import crypto from "crypto";

const mediaDB = new MediaDBService();

export interface CrawledImage {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
  role?: "logo" | "team" | "subject" | "hero" | "photo" | "social_icon" | "platform_logo" | "other";
}

/**
 * Persist scraped images to media_assets table
 * 
 * @param brandId - Brand ID
 * @param tenantId - Tenant/Workspace ID (optional, will be derived if not provided)
 * @param images - Array of crawled images
 * @returns Array of persisted asset IDs
 */
export async function persistScrapedImages(
  brandId: string,
  tenantId: string | null,
  images: CrawledImage[]
): Promise<string[]> {
  if (!images || images.length === 0) {
    return [];
  }

  // ✅ IMPROVED: More forgiving tenantId handling
  // Attempts to resolve tenantId from brand if missing/invalid, but doesn't block persistence
  let finalTenantId = tenantId;
  
  // Helper to validate UUID format
  const isValidUUID = (id: string | null | undefined): boolean => {
    if (!id || id === "unknown") return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  };
  
  // If tenantId is missing or invalid, try to resolve from brand
  if (!finalTenantId || !isValidUUID(finalTenantId)) {
    console.warn(`[ScrapedImages] tenantId missing or invalid (${finalTenantId}); attempting lookup from brand`);
    
    try {
      const { data: brand, error: brandError } = await supabase
        .from("brands")
        .select("tenant_id")
        .eq("id", brandId)
        .single();
      
      if (!brandError && brand && (brand as any).tenant_id && isValidUUID((brand as any).tenant_id)) {
        finalTenantId = (brand as any).tenant_id;
        console.log(`[ScrapedImages] ✅ Resolved tenantId from brand record: ${finalTenantId}`);
      } else {
        console.warn(`[ScrapedImages] Could not resolve tenantId from brand (brand may not exist yet); proceeding with null tenant_id`);
        finalTenantId = null;
      }
    } catch (err) {
      console.warn(`[ScrapedImages] Error looking up brand for tenantId resolution:`, err instanceof Error ? err.message : String(err));
      finalTenantId = null;
    }
  }
  
  // ✅ PROCEED WITH PERSISTENCE even if tenantId is null
  // The schema allows tenant_id to be nullable, so we can still persist images
  // This prevents a single validation failure from blocking all image persistence

  // ✅ CRITICAL: Filter and classify images according to hard rules
  // 1. Filter out social_icon and platform_logo (completely ignore)
  // 2. Separate logos (max 2) from brand images (max 15)
  // 3. Sort and prioritize before persistence
  
  const validImages = images.filter(img => {
    // ✅ FILTER: Ignore social_icon and platform_logo completely
    if (img.role === "social_icon" || img.role === "platform_logo") {
      console.log(`[ScrapedImages] Filtering out ${img.role}: ${img.url.substring(0, 60)}...`);
      return false;
    }
    
    // ✅ VALIDATION: Ensure image URL is valid
    if (!img.url || !img.url.startsWith("http")) {
      console.warn(`[ScrapedImages] Skipping invalid image URL: ${img.url}`);
      return false;
    }
    
    return true;
  });
  
  // ✅ SEPARATE: Split into logos and brand images
  const logoImages = validImages.filter(img => img.role === "logo");
  const brandImages = validImages.filter(img => 
    img.role !== "logo" && 
    (img.role === "hero" || img.role === "photo" || img.role === "team" || img.role === "subject" || img.role === "other")
  );
  
  // ✅ SORT LOGOS: Prioritize larger resolution, PNG, brand name in filename
  logoImages.sort((a, b) => {
    // 1. Prefer PNG (transparent)
    const aFilename = a.url.split("/").pop() || "";
    const bFilename = b.url.split("/").pop() || "";
    const aIsPng = a.url.toLowerCase().includes(".png") || aFilename.toLowerCase().endsWith(".png");
    const bIsPng = b.url.toLowerCase().includes(".png") || bFilename.toLowerCase().endsWith(".png");
    if (aIsPng && !bIsPng) return -1;
    if (!aIsPng && bIsPng) return 1;
    
    // 2. Prefer larger resolution
    const aSize = (a.width || 0) * (a.height || 0);
    const bSize = (b.width || 0) * (b.height || 0);
    if (aSize !== bSize) return bSize - aSize; // Descending
    
    // 3. Prefer brand name in filename/alt (handled by priority score if available)
    return 0;
  });
  
  // ✅ LIMIT LOGOS: Max 2 (1 primary + 1 alternate if clearly different)
  const selectedLogos = logoImages.slice(0, 2);
  
  // ✅ SORT BRAND IMAGES: Prioritize hero, then larger photos
  brandImages.sort((a, b) => {
    // 1. Prefer hero images
    if (a.role === "hero" && b.role !== "hero") return -1;
    if (b.role === "hero" && a.role !== "hero") return 1;
    
    // 2. Prefer larger resolution
    const aSize = (a.width || 0) * (a.height || 0);
    const bSize = (b.width || 0) * (b.height || 0);
    return bSize - aSize; // Descending
  });
  
  // ✅ LIMIT BRAND IMAGES: Max 15
  const selectedBrandImages = brandImages.slice(0, 15);
  
  // ✅ COMBINE: Logos first, then brand images
  const imagesToPersist = [...selectedLogos, ...selectedBrandImages];
  
  console.log(`[ScrapedImages] Image selection summary:`, {
    totalImages: images.length,
    filteredOut: images.length - validImages.length,
    logosFound: logoImages.length,
    logosSelected: selectedLogos.length,
    brandImagesFound: brandImages.length,
    brandImagesSelected: selectedBrandImages.length,
    totalToPersist: imagesToPersist.length,
  });

  // ✅ PERSIST: Try to persist all selected images
  const persistedIds: string[] = [];
  const persistedLogoIds: string[] = []; // Track logos separately for accurate counting
  const persistedBrandImageIds: string[] = []; // Track brand images separately
  
  // ✅ ERROR TRACKING: Track failures by category for better observability
  interface PersistenceFailure {
    url: string;
    reason: string;
    errorCode?: string;
    errorMessage?: string;
    category: 'duplicate' | 'quota' | 'database' | 'validation' | 'network' | 'unknown';
  }
  const failures: PersistenceFailure[] = [];

  for (let i = 0; i < imagesToPersist.length; i++) {
    const image = imagesToPersist[i];
    if (!image) break;
    
    // Track if this is a logo (logos come first in imagesToPersist)
    const isLogo = i < selectedLogos.length;
    
    // Generate hash from URL for duplicate detection (outside try block for error handling)
    const hash = crypto.createHash("sha256").update(image.url).digest("hex");
    
    try {
      
      // ✅ DETERMINE CATEGORY: Map role to media_assets category
      let category: "logos" | "images" | "graphics" = "images";
      if (image.role === "logo") {
        category = "logos";
      } else if (image.role === "hero" || image.role === "photo" || image.role === "team" || image.role === "subject" || image.role === "other") {
        category = "images";
      }

      // Extract filename from URL (with better error handling)
      let filename = `scraped-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
      try {
        const urlObj = new URL(image.url);
        const pathname = urlObj.pathname;
        const extractedFilename = pathname.split("/").pop();
        if (extractedFilename && extractedFilename.length > 0 && extractedFilename.length < 255) {
          filename = extractedFilename;
        }
      } catch (urlError) {
        // Use default filename if URL parsing fails
        console.warn(`[ScrapedImages] Could not extract filename from URL ${image.url}, using default`);
      }

      // Create metadata with source='scrape'
      const metadata = {
        source: "scrape" as const,
        width: image.width || undefined,
        height: image.height || undefined,
        alt: image.alt || undefined,
        role: image.role || "other",
        scrapedUrl: image.url,
        scrapedAt: new Date().toISOString(),
      };

      // Use media_assets table to persist
      // Note: We're storing the external URL directly, not uploading to Supabase Storage
      // This is acceptable for scraped images as they're reference URLs
      // ✅ FIX: Store URL in path column (media_assets table doesn't have url column)
      // The path column will contain the actual image URL for scraped images
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
      // Track logos vs brand images for accurate counting
      if (isLogo) {
        persistedLogoIds.push(assetRecord.id);
      } else {
        persistedBrandImageIds.push(assetRecord.id);
      }
      console.log(`[ScrapedImages] ✅ Persisted image: ${filename} (${image.url.substring(0, 50)}...)`);
    } catch (error: any) {
      // ✅ CRITICAL FIX: Handle errors gracefully - one failure shouldn't cancel entire batch
      // ✅ ENHANCED: Categorize error for structured logging
      const errorMessage = error?.message || String(error);
      const errorCode = error?.code || 'UNKNOWN_ERROR';
      let failureCategory: PersistenceFailure['category'] = 'unknown';
      let failureReason = errorMessage;
      
      // If duplicate, get the existing asset ID and add it to persistedIds
      if (error?.code === ErrorCode.DUPLICATE_RESOURCE || error?.message?.includes("duplicate") || error?.message?.includes("already exists")) {
        failureCategory = 'duplicate';
        failureReason = 'Image already exists (duplicate hash)';
        // Extract existing asset ID from error details
        const existingAssetId = error?.details?.existingAssetId;
        if (existingAssetId) {
          persistedIds.push(existingAssetId);
          // Track logos vs brand images for duplicates too
          if (isLogo) {
            persistedLogoIds.push(existingAssetId);
          } else {
            persistedBrandImageIds.push(existingAssetId);
          }
          console.log(`[ScrapedImages] Image already exists (using existing): ${image.url.substring(0, 50)}... (ID: ${existingAssetId})`);
        } else {
          // Fallback: query for existing asset by hash
          try {
            const existingAsset = await mediaDB.checkDuplicateAsset(brandId, hash);
            if (existingAsset) {
              persistedIds.push(existingAsset.id);
              // Track logos vs brand images for duplicates too
              if (isLogo) {
                persistedLogoIds.push(existingAsset.id);
              } else {
                persistedBrandImageIds.push(existingAsset.id);
              }
              console.log(`[ScrapedImages] Image already exists (found by hash): ${image.url.substring(0, 50)}... (ID: ${existingAsset.id})`);
            } else {
              console.warn(`[ScrapedImages] ❌ Duplicate detected but couldn't find existing asset: ${image.url.substring(0, 50)}...`);
              failures.push({
                url: image.url,
                reason: 'Duplicate detected but existing asset lookup failed',
                errorCode: errorCode,
                errorMessage: errorMessage,
                category: 'duplicate',
              });
            }
          } catch (lookupError) {
            console.warn(`[ScrapedImages] ❌ Could not lookup existing asset:`, {
              url: image.url.substring(0, 60),
              lookupError: lookupError instanceof Error ? lookupError.message : String(lookupError),
            });
            failures.push({
              url: image.url,
              reason: 'Duplicate lookup failed',
              errorCode: 'DUPLICATE_LOOKUP_ERROR',
              errorMessage: lookupError instanceof Error ? lookupError.message : String(lookupError),
              category: 'duplicate',
            });
          }
        }
        continue; // Skip to next image
      }
      
      // ✅ CRITICAL FIX: Categorize and log quota/storage errors
      // These are non-critical failures that shouldn't block the crawler
      // getStorageUsage() should never throw now, but be defensive
      const isQuotaError = error?.code === ErrorCode.QUOTA_EXCEEDED ||
                          error?.code === 'QUOTA_EXCEEDED' ||
                          error?.message?.toLowerCase().includes('quota') || 
                          error?.message?.toLowerCase().includes('storage') ||
                          error?.message?.includes('Failed to fetch storage quota');
      
      if (isQuotaError) {
        failureCategory = 'quota';
        failureReason = 'Storage quota check failed (non-critical)';
        console.warn(`[ScrapedImages] ⚠️ Quota/storage error (non-blocking) for image:`, {
          url: image.url.substring(0, 80),
          role: image.role,
          errorCode: errorCode,
          errorMessage: errorMessage,
          hint: "Continuing with next image - quota system may not be fully configured",
        });
        failures.push({
          url: image.url,
          reason: failureReason,
          errorCode: errorCode,
          errorMessage: errorMessage,
          category: failureCategory,
        });
        continue; // Skip this image but continue with the rest
      }
      
      // ✅ ENHANCED: Categorize database errors
      const isDatabaseError = error?.code === ErrorCode.DATABASE_ERROR ||
                             error?.code === 'DATABASE_ERROR' ||
                             error?.code === '23505' || // PostgreSQL unique violation
                             error?.code === '23503' || // PostgreSQL foreign key violation
                             error?.code === '42P01' || // PostgreSQL relation does not exist
                             error?.code === 'PGRST204' || // PostgREST no rows
                             error?.code === 'PGRST116' || // PostgREST not found
                             errorMessage?.toLowerCase().includes('database') ||
                             errorMessage?.toLowerCase().includes('connection') ||
                             errorMessage?.toLowerCase().includes('supabase');
      
      if (isDatabaseError) {
        failureCategory = 'database';
        failureReason = 'Database operation failed';
        console.error(`[ScrapedImages] ❌ Database error persisting image:`, {
          url: image.url.substring(0, 80),
          role: image.role,
          errorCode: errorCode,
          errorMessage: errorMessage,
          brandId: brandId,
          tenantId: finalTenantId,
          hint: "This may indicate a database connectivity or schema issue",
        });
        failures.push({
          url: image.url,
          reason: failureReason,
          errorCode: errorCode,
          errorMessage: errorMessage,
          category: failureCategory,
        });
        continue; // Skip this image but continue with the rest
      }
      
      // ✅ ENHANCED: Categorize validation errors
      const isValidationError = error?.code === ErrorCode.INVALID_FORMAT ||
                               error?.code === 'INVALID_FORMAT' ||
                               errorMessage?.toLowerCase().includes('invalid') ||
                               errorMessage?.toLowerCase().includes('validation') ||
                               errorMessage?.toLowerCase().includes('format');
      
      if (isValidationError) {
        failureCategory = 'validation';
        failureReason = 'Image validation failed';
        console.warn(`[ScrapedImages] ⚠️ Validation error persisting image:`, {
          url: image.url.substring(0, 80),
          role: image.role,
          errorCode: errorCode,
          errorMessage: errorMessage,
          hint: "Image may have invalid URL or metadata format",
        });
        failures.push({
          url: image.url,
          reason: failureReason,
          errorCode: errorCode,
          errorMessage: errorMessage,
          category: failureCategory,
        });
        continue;
      }
      
      // ✅ ENHANCED: Categorize network errors
      const isNetworkError = errorMessage?.toLowerCase().includes('network') ||
                            errorMessage?.toLowerCase().includes('timeout') ||
                            errorMessage?.toLowerCase().includes('econnrefused') ||
                            errorMessage?.toLowerCase().includes('fetch');
      
      if (isNetworkError) {
        failureCategory = 'network';
        failureReason = 'Network error during persistence';
        console.warn(`[ScrapedImages] ⚠️ Network error persisting image:`, {
          url: image.url.substring(0, 80),
          role: image.role,
          errorCode: errorCode,
          errorMessage: errorMessage,
          hint: "Network connectivity issue - may be transient",
        });
        failures.push({
          url: image.url,
          reason: failureReason,
          errorCode: errorCode,
          errorMessage: errorMessage,
          category: failureCategory,
        });
        continue;
      }
      
      // ✅ DEFAULT: Unknown error category
      failureCategory = 'unknown';
      failureReason = 'Unknown error during persistence';
      console.error(`[ScrapedImages] ❌ Unknown error persisting image:`, {
        url: image.url.substring(0, 100),
        role: image.role,
        errorCode: errorCode,
        errorMessage: errorMessage,
        errorType: error?.constructor?.name || typeof error,
        stack: error?.stack?.substring(0, 200),
        hint: "Unexpected error - review error details above",
      });
      failures.push({
        url: image.url,
        reason: failureReason,
        errorCode: errorCode,
        errorMessage: errorMessage,
        category: failureCategory,
      });
      // Continue with other images
    }
  }

  // ✅ LOGGING: Summary of persistence with failure breakdown
  // Use tracked arrays for accurate counts (handles cases where some images fail to persist)
  const logosPersisted = persistedLogoIds.length;
  const brandImagesPersisted = persistedBrandImageIds.length;
  const totalAttempted = imagesToPersist.length;
  const totalSucceeded = persistedIds.length;
  const totalFailed = failures.length;
  
  // ✅ ENHANCED: Count failures by category
  const failuresByCategory = failures.reduce((acc, failure) => {
    acc[failure.category] = (acc[failure.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // ✅ CRITICAL: Distinguish between "filtered out by design" vs "failed to persist"
  const filteredOutByDesign = images.length - validImages.length;
  const selectedButNotPersisted = totalAttempted - totalSucceeded;
  
  // ✅ LOGGING: Comprehensive summary with failure breakdown
  if (totalFailed > 0) {
    console.warn(`[ScrapedImages] ⚠️ Persistence complete with ${totalFailed} failure(s)`, {
      brandId: brandId,
      tenantId: finalTenantId,
      // Image counts
      totalImagesAvailable: images.length,
      filteredOutByDesign: filteredOutByDesign,
      validImagesAfterFilter: validImages.length,
      totalAttempted: totalAttempted,
      totalSucceeded: totalSucceeded,
      totalFailed: totalFailed,
      // Logo counts
      logosSelected: selectedLogos.length,
      logosPersisted: logosPersisted,
      logosFailed: selectedLogos.length - logosPersisted,
      // Brand image counts
      brandImagesSelected: selectedBrandImages.length,
      brandImagesPersisted: brandImagesPersisted,
      brandImagesFailed: selectedBrandImages.length - brandImagesPersisted,
      // Failure breakdown
      failuresByCategory: failuresByCategory,
      // Target counts
      targetLogos: 2,
      targetBrandImages: 15,
    });
    
    // ✅ ENHANCED: Log first 3 failures in detail for debugging
    const sampleFailures = failures.slice(0, 3);
    sampleFailures.forEach((failure, idx) => {
      console.error(`[ScrapedImages] Failure ${idx + 1}/${totalFailed}:`, {
        category: failure.category,
        reason: failure.reason,
        errorCode: failure.errorCode,
        errorMessage: failure.errorMessage?.substring(0, 200),
        url: failure.url.substring(0, 100),
      });
    });
    
    if (failures.length > 3) {
      console.warn(`[ScrapedImages] ... and ${failures.length - 3} more failure(s) (check logs above for details)`);
    }
  } else {
    console.log(`[ScrapedImages] ✅ Persistence complete (all images persisted)`, {
      brandId: brandId,
      tenantId: finalTenantId,
      totalImagesAvailable: images.length,
      filteredOutByDesign: filteredOutByDesign,
      totalAttempted: totalAttempted,
      totalPersisted: totalSucceeded,
      logosPersisted: logosPersisted,
      brandImagesPersisted: brandImagesPersisted,
      targetLogos: 2,
      targetBrandImages: 15,
    });
  }
  
  // ✅ CRITICAL: Log warning if zero images persisted despite having images to persist
  // This is the key indicator for "Found X images but none were persisted"
  if (totalAttempted > 0 && totalSucceeded === 0) {
    console.error(`[ScrapedImages] ❌ CRITICAL: Attempted to persist ${totalAttempted} image(s) but NONE succeeded.`, {
      brandId: brandId,
      tenantId: finalTenantId,
      totalAttempted: totalAttempted,
      totalFailed: totalFailed,
      failuresByCategory: failuresByCategory,
      sampleFailures: failures.slice(0, 2).map(f => ({
        category: f.category,
        reason: f.reason,
        errorCode: f.errorCode,
      })),
      hint: "Check failure details above. This indicates a systemic issue (DB connectivity, schema mismatch, or quota system error).",
    });
  }

  return persistedIds;
}

/**
 * Transfer scraped images from temporary brandId to real brandId
 * 
 * CRITICAL RECONCILIATION FUNCTION: This is called when a brand is created with a final UUID
 * that differs from the temporary brandId used during onboarding.
 * 
 * This is used during onboarding when:
 * 1. Images are scraped with temporary brandId (e.g., brand_1234567890)
 * 2. Real brand is created with UUID (e.g., "550e8400-e29b-41d4-a716-446655440000")
 * 3. Images need to be transferred to the real brandId
 * 
 * @param fromBrandId - Temporary brandId (source, e.g., "brand_1234567890")
 * @param toBrandId - Real brandId (destination, UUID)
 * @returns Number of images transferred
 */
export async function transferScrapedImages(
  fromBrandId: string,
  toBrandId: string
): Promise<number> {
  if (!fromBrandId || !toBrandId || fromBrandId === toBrandId) {
    console.log(`[ScrapedImages] Transfer skipped: fromBrandId=${fromBrandId}, toBrandId=${toBrandId}, same=${fromBrandId === toBrandId}`);
    return 0;
  }

  try {
    console.log(`[ScrapedImages] Starting reconciliation: ${fromBrandId} → ${toBrandId}`);
    
    // Get all scraped images from the temporary brandId
    const scrapedImages = await getScrapedImages(fromBrandId);
    
    if (scrapedImages.length === 0) {
      console.log(`[ScrapedImages] No images to transfer from ${fromBrandId} to ${toBrandId}`);
      return 0;
    }

    // Get tenantId from the destination brand
    const { data: brand } = await supabase
      .from("brands")
      .select("tenant_id")
      .eq("id", toBrandId)
      .single();

    if (!brand || !(brand as any).tenant_id) {
      console.error(`[ScrapedImages] CRITICAL: Cannot transfer - destination brand ${toBrandId} not found or has no tenant_id`);
      return 0;
    }

    const tenantId = (brand as any).tenant_id;
    let transferredCount = 0;
    let failedCount = 0;

    // Update each image's brand_id and tenant_id in a single batch update
    // Use a transaction-like approach: update all at once
    const imageIds = scrapedImages.map(img => img.id);
    
    const { data: updateResult, error: batchError } = await supabase
      .from("media_assets")
      .update({
        brand_id: toBrandId,
        tenant_id: tenantId,
        updated_at: new Date().toISOString(),
      })
      .in("id", imageIds)
      .select("id");

    if (batchError) {
      console.error(`[ScrapedImages] Batch update failed:`, batchError);
      // Fallback to individual updates
      for (const image of scrapedImages) {
        try {
          const { error } = await supabase
            .from("media_assets")
            .update({
              brand_id: toBrandId,
              tenant_id: tenantId,
              updated_at: new Date().toISOString(),
            })
            .eq("id", image.id);

          if (error) {
            console.warn(`[ScrapedImages] Failed to transfer image ${image.id}:`, error);
            failedCount++;
          } else {
            transferredCount++;
          }
        } catch (error) {
          console.warn(`[ScrapedImages] Error transferring image ${image.id}:`, error);
          failedCount++;
        }
      }
    } else {
      transferredCount = updateResult?.length || 0;
      failedCount = scrapedImages.length - transferredCount;
    }

    // ✅ LOGGING: Reconciliation summary
    console.log(`[ScrapedImages] Reconciliation complete`, {
      fromBrandId: fromBrandId,
      toBrandId: toBrandId,
      tenantId: tenantId,
      totalImages: scrapedImages.length,
      transferredCount: transferredCount,
      failedCount: failedCount,
    });

    if (failedCount > 0) {
      console.warn(`[ScrapedImages] WARNING: ${failedCount} images failed to transfer. These may be orphaned.`);
    }

    return transferredCount;
  } catch (error) {
    console.error(`[ScrapedImages] CRITICAL: Error transferring images from ${fromBrandId} to ${toBrandId}:`, error);
    return 0;
  }
}

/**
 * Get scraped images for a brand (source='scrape')
 */
export async function getScrapedImages(
  brandId: string,
  role?: "logo" | "hero" | "other"
): Promise<Array<{
  id: string;
  url: string;
  filename: string;
  metadata?: Record<string, unknown>;
}>> {
  try {
    // ✅ RESILIENT QUERY: Try to select metadata (may not exist in all schemas)
    // For scraped images, URL is stored in path column (external URLs)
    // We'll filter for HTTP URLs in JavaScript to identify scraped images
    const query = supabase
      .from("media_assets")
      .select("id, path, filename, metadata")
      .eq("brand_id", brandId)
      .eq("status", "active");

    const { data, error } = await query
      .order("created_at", { ascending: false });

    if (error) {
      // If it's a metadata column error, retry without metadata
      if (error.code === "42703" || error.code === "42704" || error.message?.includes("metadata")) {
        console.warn("[ScrapedImages] metadata column not available, retrying without it");
        // Retry query without metadata
        const retryQuery = supabase
          .from("media_assets")
          .select("id, path, filename")
          .eq("brand_id", brandId)
          .eq("status", "active");
        
        const { data: retryData, error: retryError } = await retryQuery
          .order("created_at", { ascending: false });
        
        if (retryError) {
          console.error("[ScrapedImages] Error querying scraped images (retry):", retryError);
          return [];
        }
        
        // Use retry data (without metadata)
        const scrapedImages = (retryData || []).filter((asset: any) => {
          const path = asset.path || "";
          return path.startsWith("http://") || path.startsWith("https://");
        });
        
        return scrapedImages.map((asset: any) => ({
          id: asset.id,
          url: asset.path || "",
          filename: asset.filename,
          metadata: undefined, // Not available
        }));
      }
      
      // If it's not a metadata error, it's a real database error
      console.error("[ScrapedImages] Error querying scraped images:", error);
      return [];
    }

    if (!data || data.length === 0) {
      // ✅ LOGGING: Log when no images found (helps debug missing images)
      console.log(`[ScrapedImages] No media assets found for brand`, {
        brandId: brandId,
        role: role || "all",
      });
      return [];
    }

    // ✅ LOGGING: Log successful query
    console.log(`[ScrapedImages] Query successful, filtering for scraped images`, {
      brandId: brandId,
      role: role || "all",
      totalAssets: data.length,
      samplePaths: data.slice(0, 3).map((a: any) => a.path?.substring(0, 50)) || [],
    });
    
    // ✅ FILTER: Scraped images have HTTP URLs in path column (external URLs)
    // Uploaded images have Supabase storage paths (bucket names, not HTTP URLs)
    const scrapedImages = data.filter((asset: any) => {
      const path = asset.path || "";
      // Scraped images have full HTTP URLs in path (external URLs)
      const isScraped = path.startsWith("http://") || path.startsWith("https://");
      if (!isScraped) return false;
      
      // If role filter is specified, try to infer from filename or path
      if (role === "logo") {
        const filenameLower = (asset.filename || "").toLowerCase();
        const pathLower = path.toLowerCase();
        return filenameLower.includes("logo") || pathLower.includes("logo");
      }
      
      return true;
    });
    
    console.log(`[ScrapedImages] Filtered to ${scrapedImages.length} scraped images (from ${data.length} total assets)`, {
      brandId,
      role: role || "all",
      scrapedCount: scrapedImages.length,
    });
    
    return scrapedImages.map((asset: any) => ({
      id: asset.id,
      url: asset.path || "", // For scraped images, path IS the URL
      filename: asset.filename,
      metadata: asset.metadata || undefined, // Include metadata if available
    }));
  } catch (error) {
    console.error("[ScrapedImages] Error getting scraped images:", error);
    console.error("[ScrapedImages] Debug info:", {
      brandId: brandId,
      role: role,
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

