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
  role?: "logo" | "team" | "subject" | "hero" | "other";
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

  // ✅ CRITICAL: tenantId is REQUIRED - caller must provide it
  // During onboarding, tenantId comes from user's workspace/auth
  // If brand exists, we can look it up, but during onboarding brand may not exist yet
  let finalTenantId = tenantId;
  
  // ✅ VALIDATION: Ensure tenantId is a valid UUID
  if (finalTenantId && (finalTenantId === "unknown" || !finalTenantId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i))) {
    console.error(`[ScrapedImages] CRITICAL: Invalid tenantId format: "${finalTenantId}". Cannot persist images.`);
    return [];
  }
  
  if (!finalTenantId) {
    // Try to get from brand (only works if brand already exists)
    const { data: brand } = await supabase
      .from("brands")
      .select("tenant_id")
      .eq("id", brandId)
      .single();
    
    if (brand && (brand as any).tenant_id) {
      finalTenantId = (brand as any).tenant_id;
      console.log(`[ScrapedImages] Retrieved tenantId from brand ${brandId}: ${finalTenantId}`);
    } else {
      // ✅ CRITICAL: During onboarding, brand may not exist yet
      // Caller MUST provide tenantId from user's workspace/auth
      console.error(`[ScrapedImages] CRITICAL: No tenant_id provided and brand ${brandId} not found. Images cannot be persisted. This should not happen - tenantId must be passed from request.`);
      console.error(`[ScrapedImages] Debug: { brandId: "${brandId}", tenantId: ${tenantId}, imagesCount: ${images.length} }`);
      return [];
    }
  }

  // Limit to 15 images max (10-15 range as specified)
  // Images should already be sorted and filtered by caller, but ensure limit here too
  const imagesToPersist = images.slice(0, 15);

  const persistedIds: string[] = [];

  for (const image of imagesToPersist) {
    // ✅ VALIDATION: Ensure image URL is valid
    if (!image.url || !image.url.startsWith("http")) {
      console.warn(`[ScrapedImages] Skipping invalid image URL: ${image.url}`);
      continue;
    }
    
    // Generate hash from URL for duplicate detection (outside try block for error handling)
    const hash = crypto.createHash("sha256").update(image.url).digest("hex");
    
    try {
      
      // Determine category based on role
      let category: "logos" | "images" | "graphics" = "images";
      if (image.role === "logo") {
        category = "logos";
      } else if (image.role === "hero" || image.role === "team" || image.role === "subject") {
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
  }

  // ✅ LOGGING: Summary of persistence
  console.log(`[ScrapedImages] Persistence complete`, {
    brandId: brandId,
    tenantId: finalTenantId,
    totalImages: images.length,
    persistedCount: persistedIds.length,
    failedCount: images.length - persistedIds.length,
  });

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
    // ✅ RESILIENT QUERY: Try with metadata filter first, fallback if column doesn't exist
    // For scraped images, URL is stored in path column (external URLs)
    let query = supabase
      .from("media_assets")
      .select("id, path, filename, metadata")
      .eq("brand_id", brandId)
      .eq("status", "active");

    // Try to filter by metadata->>source if metadata column exists
    // If it doesn't exist, we'll filter in JavaScript below
    try {
      query = query.eq("metadata->>source", "scrape");
      if (role) {
        query = query.eq("metadata->>role", role);
      }
    } catch (metadataError) {
      // Metadata column doesn't exist - we'll filter in JavaScript
      console.log("[ScrapedImages] Metadata column not available, will filter in JavaScript");
    }

    const { data, error } = await query
      .order("created_at", { ascending: false });

    if (error) {
      // ✅ ENHANCED ERROR DETECTION: Check for metadata column error
      const isMetadataError = 
        error.code === "42703" || 
        error.code === "42704" ||
        (typeof error.message === "string" && (
          error.message.includes("metadata") || 
          error.message.includes("does not exist") ||
          error.message.includes("column") && error.message.includes("metadata")
        ));
      
      console.log("[ScrapedImages] Query error detected", {
        code: error.code,
        message: error.message,
        isMetadataError,
      });
      
      // If error is "column metadata does not exist", try without metadata filter
      if (isMetadataError) {
        console.log("[ScrapedImages] Metadata column not found, querying without metadata filter");
        
        // Retry without metadata filter
        let fallbackQuery = supabase
          .from("media_assets")
          .select("id, path, filename")
          .eq("brand_id", brandId)
          .eq("status", "active");
        
        const { data: fallbackData, error: fallbackError } = await fallbackQuery
          .order("created_at", { ascending: false });
        
        if (fallbackError) {
          console.error("[ScrapedImages] Error querying scraped images (fallback):", fallbackError);
          return [];
        }
        
        // ✅ LOGGING: Log fallback query results
        console.log(`[ScrapedImages] Fallback query returned ${fallbackData?.length || 0} assets`, {
          brandId,
          totalAssets: fallbackData?.length || 0,
          samplePaths: fallbackData?.slice(0, 3).map((a: any) => a.path?.substring(0, 50)) || [],
        });
        
        // Filter in JavaScript: scraped images have external URLs in path column
        // (not Supabase storage paths which start with bucket names)
        const scrapedImages = (fallbackData || []).filter((asset: any) => {
          const path = asset.path || "";
          // Scraped images have full HTTP URLs in path (external URLs)
          const isScraped = path.startsWith("http://") || path.startsWith("https://");
          if (!isScraped) {
            console.log(`[ScrapedImages] Filtered out non-HTTP path: ${path.substring(0, 50)}...`);
            return false;
          }
          
          // If role filter is specified, we can't filter without metadata
          // But we can try to infer from filename or path
          if (role === "logo") {
            const filenameLower = (asset.filename || "").toLowerCase();
            const pathLower = path.toLowerCase();
            const isLogo = filenameLower.includes("logo") || pathLower.includes("logo");
            if (!isLogo) {
              console.log(`[ScrapedImages] Filtered out non-logo: ${path.substring(0, 50)}...`);
            }
            return isLogo;
          }
          
          return true;
        });
        
        console.log(`[ScrapedImages] Filtered to ${scrapedImages.length} scraped images (from ${fallbackData?.length || 0} total assets)`, {
          brandId,
          role: role || "all",
          scrapedCount: scrapedImages.length,
        });
        
        return scrapedImages.map((asset: any) => ({
          id: asset.id,
          url: asset.path || "", // For scraped images, path IS the URL
          filename: asset.filename,
          metadata: undefined, // Not available without metadata column
        }));
      }
      
      console.error("[ScrapedImages] Error querying scraped images:", error);
      return [];
    }

    if (!data || data.length === 0) {
      // ✅ LOGGING: Log when no images found (helps debug missing images)
      console.log(`[ScrapedImages] No scraped images found`, {
        brandId: brandId,
        role: role || "all",
        query: "media_assets WHERE brand_id = ? AND metadata->>'source' = 'scrape'",
      });
      return [];
    }

    // ✅ LOGGING: Log successful query
    console.log(`[ScrapedImages] Query successful`, {
      brandId: brandId,
      role: role || "all",
      count: data.length,
      imageIds: data.slice(0, 5).map(img => img.id), // Log first 5 IDs for debugging
    });
    
    // ✅ FIX: Extract URL from metadata.scrapedUrl or use path
    // For scraped images, the URL is stored in path column (since media_assets may not have url column)
    return data.map((asset: any) => {
      const metadata = asset.metadata as Record<string, unknown> | undefined;
      // Try metadata.scrapedUrl first, then path (which contains the URL for scraped images), then asset.url if it exists
      const url = (metadata?.scrapedUrl as string) || asset.path || asset.url || "";
      
      // Validate URL is actually a URL (starts with http)
      const finalUrl = url.startsWith("http") ? url : "";
      
      return {
        id: asset.id,
        url: finalUrl,
        filename: asset.filename,
        metadata: metadata,
      };
    });
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

