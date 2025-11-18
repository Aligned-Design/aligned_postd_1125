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

  // Get tenant_id from brand if not provided
  let finalTenantId = tenantId;
  if (!finalTenantId) {
    const { data: brand } = await supabase
      .from("brands")
      .select("tenant_id")
      .eq("id", brandId)
      .single();
    
    if (brand && (brand as any).tenant_id) {
      finalTenantId = (brand as any).tenant_id;
    } else {
      // Fallback: use a default tenant or skip persistence
      console.warn(`[ScrapedImages] No tenant_id found for brand ${brandId}, skipping persistence`);
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

    if (error || !data) {
      return [];
    }

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

