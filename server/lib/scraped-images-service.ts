/**
 * Scraped Images Service
 * 
 * Handles persistence of images scraped from websites during onboarding.
 * Stores images in media_assets table with source='scrape' metadata.
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
  role?: "logo" | "hero" | "other";
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

  // ✅ ROOT FIX: tenantId is now required - caller must provide it
  // During onboarding, tenantId comes from user's workspace/auth
  // If brand exists, we can look it up, but during onboarding brand may not exist yet
  let finalTenantId = tenantId;
  
  if (!finalTenantId) {
    // Try to get from brand (only works if brand already exists)
    const { data: brand } = await supabase
      .from("brands")
      .select("tenant_id")
      .eq("id", brandId)
      .single();
    
    if (brand && (brand as any).tenant_id) {
      finalTenantId = (brand as any).tenant_id;
    } else {
      // ✅ CRITICAL: During onboarding, brand may not exist yet
      // Caller MUST provide tenantId from user's workspace/auth
      console.error(`[ScrapedImages] CRITICAL: No tenant_id provided and brand ${brandId} not found. Images cannot be persisted. This should not happen - tenantId must be passed from request.`);
      return [];
    }
  }

  const persistedIds: string[] = [];

  for (const image of images) {
    try {
      // Generate hash from URL for duplicate detection
      const hash = crypto.createHash("sha256").update(image.url).digest("hex");
      
      // Determine category based on role
      let category: "logos" | "images" | "graphics" = "images";
      if (image.role === "logo") {
        category = "logos";
      } else if (image.role === "hero") {
        category = "images";
      }

      // Extract filename from URL
      const urlObj = new URL(image.url);
      const filename = urlObj.pathname.split("/").pop() || `scraped-${Date.now()}.jpg`;

      // Create metadata with source='scrape'
      const metadata = {
        source: "scrape" as const,
        width: image.width,
        height: image.height,
        alt: image.alt,
        role: image.role || "other",
        scrapedUrl: image.url,
        scrapedAt: new Date().toISOString(),
      };

      // Use media_assets table to persist
      // Note: We're storing the external URL directly, not uploading to Supabase Storage
      // This is acceptable for scraped images as they're reference URLs
      const assetRecord = await mediaDB.createMediaAsset(
        brandId,
        finalTenantId,
        filename,
        "image/jpeg", // Default MIME type
        `scraped/${brandId}/${filename}`, // Virtual path
        0, // File size unknown for external URLs
        hash,
        image.url, // Store the external URL
        category,
        metadata,
        image.url // Use same URL for thumbnail
      );

      persistedIds.push(assetRecord.id);
    } catch (error: any) {
      // If duplicate, skip (already exists)
      if (error?.code === ErrorCode.DUPLICATE_RESOURCE || error?.message?.includes("duplicate") || error?.message?.includes("already exists")) {
        console.log(`[ScrapedImages] Image already exists: ${image.url}`);
        continue;
      }
      console.warn(`[ScrapedImages] Failed to persist image ${image.url}:`, error);
      // Continue with other images
    }
  }

  return persistedIds;
}

/**
 * Transfer scraped images from temporary brandId to real brandId
 * 
 * This is used during onboarding when:
 * 1. Images are scraped with temporary brandId (e.g., brand_1234567890)
 * 2. Real brand is created with UUID
 * 3. Images need to be transferred to the real brandId
 * 
 * @param fromBrandId - Temporary brandId (source)
 * @param toBrandId - Real brandId (destination)
 * @returns Number of images transferred
 */
export async function transferScrapedImages(
  fromBrandId: string,
  toBrandId: string
): Promise<number> {
  if (!fromBrandId || !toBrandId || fromBrandId === toBrandId) {
    return 0;
  }

  try {
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
      console.error(`[ScrapedImages] Cannot transfer: destination brand ${toBrandId} not found or has no tenant_id`);
      return 0;
    }

    const tenantId = (brand as any).tenant_id;
    let transferredCount = 0;

    // Update each image's brand_id
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
        } else {
          transferredCount++;
        }
      } catch (error) {
        console.warn(`[ScrapedImages] Error transferring image ${image.id}:`, error);
      }
    }

    console.log(`[ScrapedImages] Transferred ${transferredCount}/${scrapedImages.length} images from ${fromBrandId} to ${toBrandId}`);
    return transferredCount;
  } catch (error) {
    console.error(`[ScrapedImages] Error transferring images from ${fromBrandId} to ${toBrandId}:`, error);
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
    let query = supabase
      .from("media_assets")
      .select("id, url, filename, metadata")
      .eq("brand_id", brandId)
      .eq("status", "active")
      .eq("metadata->>source", "scrape");

    if (role) {
      query = query.eq("metadata->>role", role);
    }

    const { data, error } = await query
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[ScrapedImages] Error querying scraped images:", error);
      return [];
    }

    if (!data || data.length === 0) {
      console.log(`[ScrapedImages] No scraped images found for brandId: ${brandId}${role ? `, role: ${role}` : ""} (query returned empty)`);
      return [];
    }

    console.log(`[ScrapedImages] Found ${data.length} scraped images for brandId: ${brandId}${role ? `, role: ${role}` : ""}`);
    
    return data.map((asset) => ({
      id: asset.id,
      url: asset.url,
      filename: asset.filename,
      metadata: asset.metadata as Record<string, unknown> | undefined,
    }));
  } catch (error) {
    console.error("[ScrapedImages] Error getting scraped images:", error);
    return [];
  }
}

