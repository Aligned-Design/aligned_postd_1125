/**
 * Image Sourcing Service
 * 
 * Provides prioritized image sourcing for AI content generation:
 * 1. Brand assets (from brand_assets or media_assets table)
 * 2. Approved stock images (from stock images assigned to brand)
 * 3. Generic fallback (placeholder or default)
 */

import { supabase } from "./supabase";
import { AppError } from "./error-middleware";
import { ErrorCode, HTTP_STATUS } from "./error-responses";

export interface ImageSource {
  url: string;
  source: "brand_asset" | "stock_image" | "generic";
  assetId?: string;
  metadata?: {
    width?: number;
    height?: number;
    alt?: string;
    attribution?: string;
  };
}

/**
 * Get prioritized image for content generation
 * 
 * Priority:
 * 1. Brand assets (logos, uploaded images, brand-specific graphics)
 * 2. Approved stock images (from brand's stock image library)
 * 3. Generic fallback (placeholder or brand snapshot images)
 * 
 * @param brandId - Brand ID for scoping
 * @param category - Optional category filter (e.g., "logo", "image", "graphics")
 * @returns Image source with URL and metadata
 */
export async function getPrioritizedImage(
  brandId: string,
  category?: "logo" | "image" | "graphics" | "video"
): Promise<ImageSource | null> {
  try {
    // Priority 1: Brand assets from media_assets table
    const brandAsset = await getBrandAsset(brandId, category);
    if (brandAsset) {
      return {
        url: brandAsset.url,
        source: "brand_asset",
        assetId: brandAsset.id,
        metadata: {
          width: brandAsset.metadata?.width as number | undefined,
          height: brandAsset.metadata?.height as number | undefined,
          alt: brandAsset.filename,
        },
      };
    }

    // Priority 2: Approved stock images (from brand's stock image assignments)
    const stockImage = await getApprovedStockImage(brandId);
    if (stockImage) {
      return {
        url: stockImage.fullImageUrl || stockImage.previewUrl,
        source: "stock_image",
        assetId: stockImage.id,
        metadata: {
          width: stockImage.width,
          height: stockImage.height,
          alt: stockImage.title,
          attribution: stockImage.attributionText,
        },
      };
    }

    // Priority 3: Generic fallback (return null, caller should handle)
    return null;
  } catch (error) {
    console.error("[ImageSourcing] Error getting prioritized image:", error);
    return null;
  }
}

/**
 * Get brand asset from media_assets or brand_assets table
 */
async function getBrandAsset(
  brandId: string,
  category?: string
): Promise<{
  id: string;
  url: string;
  filename: string;
  metadata?: Record<string, unknown>;
} | null> {
  try {
    // Try media_assets table first (newer structure)
    let query = supabase
      .from("media_assets")
      .select("id, url, filename, metadata")
      .eq("brand_id", brandId)
      .eq("status", "active")
      .order("usage_count", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1);

    if (category) {
      // Map category to media_assets category
      const categoryMap: Record<string, string> = {
        logo: "logos",
        image: "images",
        graphics: "graphics",
        video: "videos",
      };
      query = query.eq("category", categoryMap[category] || category);
    }

    const { data: mediaAsset, error: mediaError } = await query;

    if (!mediaError && mediaAsset && mediaAsset.length > 0) {
      return {
        id: mediaAsset[0].id,
        url: mediaAsset[0].url,
        filename: mediaAsset[0].filename,
        metadata: mediaAsset[0].metadata as Record<string, unknown> | undefined,
      };
    }

    // Fallback to brand_assets table (legacy structure)
    let brandQuery = supabase
      .from("brand_assets")
      .select("id, file_path, file_name")
      .eq("brand_id", brandId)
      .limit(1);

    if (category) {
      brandQuery = brandQuery.eq("asset_type", category);
    }

    const { data: brandAsset, error: brandError } = await brandQuery;

    if (!brandError && brandAsset && brandAsset.length > 0) {
      // Construct URL from file_path (assuming Supabase Storage)
      const url = brandAsset[0].file_path.startsWith("http")
        ? brandAsset[0].file_path
        : `${process.env.SUPABASE_URL}/storage/v1/object/public/brand-assets/${brandAsset[0].file_path}`;

      return {
        id: brandAsset[0].id,
        url,
        filename: brandAsset[0].file_name,
      };
    }

    return null;
  } catch (error) {
    console.error("[ImageSourcing] Error getting brand asset:", error);
    return null;
  }
}

/**
 * Get approved stock image from brand's stock image library
 * 
 * Priority: Check metadata for source="stock" flag, or check if asset has stock-related tags.
 * Stock images are distinguished from brand uploads by:
 * - metadata.source === "stock" OR
 * - metadata.provider (Unsplash, Pexels, Pixabay) OR
 * - tags include "stock" or provider name
 */
async function getApprovedStockImage(
  brandId: string
): Promise<{
  id: string;
  fullImageUrl: string;
  previewUrl: string;
  title: string;
  width: number;
  height: number;
  attributionText: string;
} | null> {
  try {
    // First, try media_assets table (newer structure) with stock source flag
    const { data: mediaStockAssets, error: mediaError } = await supabase
      .from("media_assets")
      .select("id, url, filename, metadata")
      .eq("brand_id", brandId)
      .eq("status", "active")
      .eq("category", "images")
      .or("metadata->>source.eq.stock,metadata->>provider.not.is.null")
      .order("usage_count", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1);

    if (!mediaError && mediaStockAssets && mediaStockAssets.length > 0) {
      const asset = mediaStockAssets[0];
      const metadata = (asset.metadata as Record<string, unknown>) || {};
      
      return {
        id: asset.id,
        fullImageUrl: asset.url,
        previewUrl: asset.thumbnail_url || asset.url,
        title: asset.filename,
        width: (metadata.width as number) || 1080,
        height: (metadata.height as number) || 1080,
        attributionText: (metadata.attribution as string) || (metadata.attributionText as string) || "",
      };
    }

    // Fallback: Check brand_assets table for stock images
    // Look for assets with metadata indicating stock source
    const { data: brandStockAssets, error: brandError } = await supabase
      .from("brand_assets")
      .select("id, file_path, file_name, metadata")
      .eq("brand_id", brandId)
      .eq("asset_type", "image")
      .or("metadata->>source.eq.stock,metadata->>provider.not.is.null")
      .limit(1);

    if (brandError || !brandStockAssets || brandStockAssets.length === 0) {
      return null;
    }

    const asset = brandStockAssets[0];
    const metadata = (asset.metadata as Record<string, unknown>) || {};

    // Construct URL
    const url = asset.file_path.startsWith("http")
      ? asset.file_path
      : `${process.env.SUPABASE_URL}/storage/v1/object/public/brand-assets/${asset.file_path}`;

    return {
      id: asset.id,
      fullImageUrl: url,
      previewUrl: url,
      title: asset.file_name,
      width: (metadata.width as number) || 1080,
      height: (metadata.height as number) || 1080,
      attributionText: (metadata.attribution as string) || (metadata.attributionText as string) || "",
    };
  } catch (error) {
    console.error("[ImageSourcing] Error getting approved stock image:", error);
    return null;
  }
}

/**
 * Get multiple images for content package (e.g., 7-day content)
 * 
 * Returns array of images following priority order.
 */
export async function getPrioritizedImages(
  brandId: string,
  count: number = 7
): Promise<ImageSource[]> {
  const images: ImageSource[] = [];

  // Get brand assets first
  const brandAssets = await getBrandAssets(brandId, count);
  images.push(...brandAssets.map((asset) => ({
    url: asset.url,
    source: "brand_asset" as const,
    assetId: asset.id,
    metadata: {
      width: asset.metadata?.width as number | undefined,
      height: asset.metadata?.height as number | undefined,
      alt: asset.filename,
    },
  })));

  // Fill remaining slots with stock images
  if (images.length < count) {
    const stockImages = await getApprovedStockImages(brandId, count - images.length);
    images.push(...stockImages.map((img) => ({
      url: img.fullImageUrl || img.previewUrl,
      source: "stock_image" as const,
      assetId: img.id,
      metadata: {
        width: img.width,
        height: img.height,
        alt: img.title,
        attribution: img.attributionText,
      },
    })));
  }

  // If still not enough, return what we have (caller can handle fallback)
  return images.slice(0, count);
}

/**
 * Get multiple brand assets
 */
async function getBrandAssets(
  brandId: string,
  limit: number
): Promise<Array<{
  id: string;
  url: string;
  filename: string;
  metadata?: Record<string, unknown>;
}>> {
  try {
    const { data, error } = await supabase
      .from("media_assets")
      .select("id, url, filename, metadata")
      .eq("brand_id", brandId)
      .eq("status", "active")
      .in("category", ["images", "graphics", "logos"])
      .order("usage_count", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);

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
    console.error("[ImageSourcing] Error getting brand assets:", error);
    return [];
  }
}

/**
 * Get multiple approved stock images
 * 
 * Prioritizes images with source="stock" or provider metadata
 */
async function getApprovedStockImages(
  brandId: string,
  limit: number
): Promise<Array<{
  id: string;
  fullImageUrl: string;
  previewUrl: string;
  title: string;
  width: number;
  height: number;
  attributionText: string;
}>> {
  try {
    // First, try media_assets table (newer structure)
    const { data: mediaStockAssets, error: mediaError } = await supabase
      .from("media_assets")
      .select("id, url, filename, metadata, thumbnail_url")
      .eq("brand_id", brandId)
      .eq("status", "active")
      .eq("category", "images")
      .or("metadata->>source.eq.stock,metadata->>provider.not.is.null")
      .order("usage_count", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (!mediaError && mediaStockAssets && mediaStockAssets.length > 0) {
      return mediaStockAssets.map((asset) => {
        const metadata = (asset.metadata as Record<string, unknown>) || {};
        return {
          id: asset.id,
          fullImageUrl: asset.url,
          previewUrl: asset.thumbnail_url || asset.url,
          title: asset.filename,
          width: (metadata.width as number) || 1080,
          height: (metadata.height as number) || 1080,
          attributionText: (metadata.attribution as string) || (metadata.attributionText as string) || "",
        };
      });
    }

    // Fallback: Check brand_assets table
    const { data: brandStockAssets, error: brandError } = await supabase
      .from("brand_assets")
      .select("id, file_path, file_name, metadata")
      .eq("brand_id", brandId)
      .eq("asset_type", "image")
      .or("metadata->>source.eq.stock,metadata->>provider.not.is.null")
      .limit(limit);

    if (brandError || !brandStockAssets) {
      return [];
    }

    return brandStockAssets.map((asset) => {
      const metadata = (asset.metadata as Record<string, unknown>) || {};
      const url = asset.file_path.startsWith("http")
        ? asset.file_path
        : `${process.env.SUPABASE_URL}/storage/v1/object/public/brand-assets/${asset.file_path}`;

      return {
        id: asset.id,
        fullImageUrl: url,
        previewUrl: url,
        title: asset.file_name,
        width: (metadata.width as number) || 1080,
        height: (metadata.height as number) || 1080,
        attributionText: (metadata.attribution as string) || (metadata.attributionText as string) || "",
      };
    });
  } catch (error) {
    console.error("[ImageSourcing] Error getting approved stock images:", error);
    return [];
  }
}

