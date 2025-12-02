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
  source: "scrape" | "stock" | "upload" | "generic";
  assetId?: string;
  metadata?: {
    width?: number;
    height?: number;
    alt?: string;
    attribution?: string;
    source?: "scrape" | "stock" | "upload";
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
    // ✅ PRIORITY 1: Scraped images (source='scrape') from media_assets table
    const brandAsset = await getBrandAsset(brandId, category);
    if (brandAsset) {
      const source = brandAsset.source || "upload";
      return {
        url: brandAsset.url,
        source: source === "scrape" ? "scrape" : source === "stock" ? "stock" : "upload",
        assetId: brandAsset.id,
        metadata: {
          width: brandAsset.metadata?.width as number | undefined,
          height: brandAsset.metadata?.height as number | undefined,
          alt: brandAsset.filename,
          source: source === "scrape" ? "scrape" : source === "stock" ? "stock" : "upload",
        },
      };
    }

    // ✅ PRIORITY 2: Approved stock images (only if no scraped/uploaded images found)
    const stockImage = await getApprovedStockImage(brandId);
    if (stockImage) {
      return {
        url: stockImage.fullImageUrl || stockImage.previewUrl,
        source: "stock",
        assetId: stockImage.id,
        metadata: {
          width: stockImage.width,
          height: stockImage.height,
          alt: stockImage.title,
          attribution: stockImage.attributionText,
          source: "stock",
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
 * 
 * Priority: scraped images (source='scrape') > uploaded images > legacy brand_assets
 */
async function getBrandAsset(
  brandId: string,
  category?: string
): Promise<{
  id: string;
  url: string;
  filename: string;
  metadata?: Record<string, unknown>;
  source?: "scrape" | "stock" | "upload";
} | null> {
  try {
    // ✅ RESILIENT: Don't use metadata column (may not exist)
    // Filter scraped images by HTTP URLs in path column instead
    // ✅ PRIORITY 1: Try scraped images first (have HTTP URLs in path)
    // ✅ FIX: Do not select url - this column doesn't exist in media_assets schema
    let scrapedQuery = supabase
      .from("media_assets")
      .select("id, path, filename")
      .eq("brand_id", brandId)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (category) {
      const categoryMap: Record<string, string> = {
        logo: "logos",
        image: "images",
        graphics: "graphics",
        video: "videos",
      };
      scrapedQuery = scrapedQuery.eq("category", categoryMap[category] || category);
    }

    const { data: scrapedAssets, error: scrapedError } = await scrapedQuery;

    // Filter for scraped images (HTTP URLs in path) and apply role filter if needed
    if (!scrapedError && scrapedAssets && scrapedAssets.length > 0) {
      const scrapedImages = scrapedAssets.filter((asset: any) => {
        const path = asset.path || "";
        // Scraped images have HTTP URLs in path
        if (!path.startsWith("http://") && !path.startsWith("https://")) return false;
        
        // For logos, check filename/path for "logo"
        if (category === "logo") {
          const filenameLower = (asset.filename || "").toLowerCase();
          const pathLower = path.toLowerCase();
          return filenameLower.includes("logo") || pathLower.includes("logo");
        }
        
        return true;
      });

      if (scrapedImages.length > 0) {
        const asset = scrapedImages[0];
        return {
          id: asset.id,
          url: asset.path || "", // ✅ FIX: Use path (contains URL for scraped images, url column doesn't exist)
          filename: asset.filename,
          metadata: undefined, // Not available without metadata column
          source: "scrape" as const,
        };
      }
    }

    // ✅ PRIORITY 2: Try uploaded images (Supabase storage paths, not HTTP URLs)
    // ✅ FIX: Do not select url - this column doesn't exist in media_assets schema
    let query = supabase
      .from("media_assets")
      .select("id, path, filename")
      .eq("brand_id", brandId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(10); // Get more to filter in JavaScript

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

    const { data: mediaAssets, error: mediaError } = await query;

    // Filter for uploaded images (NOT HTTP URLs - those are scraped)
    if (!mediaError && mediaAssets && mediaAssets.length > 0) {
      const uploadedImages = mediaAssets.filter((asset: any) => {
        const path = asset.path || "";
        // Uploaded images have Supabase storage paths (not HTTP URLs)
        return !path.startsWith("http://") && !path.startsWith("https://");
      });

      if (uploadedImages.length > 0) {
        const asset = uploadedImages[0];
        return {
          id: asset.id,
          url: asset.path || "", // ✅ FIX: Use path (url column doesn't exist)
          filename: asset.filename,
          metadata: undefined, // Not available without metadata column
          source: "upload" as const,
        };
      }
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
    // ✅ FIX: Do not select url or thumbnail_url - these columns don't exist in media_assets schema
    // Use path column instead (contains URL for scraped images)
    const { data: mediaStockAssets, error: mediaError } = await supabase
      .from("media_assets")
      .select("id, path, filename, metadata")
      .eq("brand_id", brandId)
      .eq("status", "active")
      .eq("category", "images")
      .or("metadata->>source.eq.stock,metadata->>provider.not.is.null")
      .order("usage_count", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1);

    if (!mediaError && mediaStockAssets && mediaStockAssets.length > 0) {
      const asset = mediaStockAssets[0] as any;
      const metadata = (asset.metadata as Record<string, unknown>) || {};
      // ✅ FIX: Use path instead of url (path contains the URL for scraped images)
      // thumbnail_url doesn't exist, so use path as fallback
      const imageUrl = asset.path || "";
      
      return {
        id: asset.id,
        fullImageUrl: imageUrl,
        previewUrl: imageUrl, // Use path as preview (thumbnail_url column doesn't exist)
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

  // ✅ PRIORITY 1: Get scraped images first (source='scrape')
  const scrapedAssets = await getScrapedBrandAssets(brandId, count);
  images.push(...scrapedAssets.map((asset): ImageSource => ({
    url: asset.url,
    source: "scrape" as const,
    assetId: asset.id,
    metadata: {
      width: asset.metadata?.width as number | undefined,
      height: asset.metadata?.height as number | undefined,
      alt: asset.filename,
      source: "scrape" as const,
    },
  })));

  // ✅ PRIORITY 2: Get uploaded images (source='upload' or no source)
  if (images.length < count) {
    const uploadedAssets = await getUploadedBrandAssets(brandId, count - images.length);
    images.push(...uploadedAssets.map((asset): ImageSource => ({
      url: asset.url,
      source: "upload" as const,
      assetId: asset.id,
      metadata: {
        width: asset.metadata?.width as number | undefined,
        height: asset.metadata?.height as number | undefined,
        alt: asset.filename,
        source: "upload" as const,
      },
    })));
  }

  // ✅ PRIORITY 3: Fill remaining slots with stock images (only if < threshold)
  // If crawler returns ≥ 2 scraped images, use those; otherwise fall back to stock
  const SCRAPED_IMAGE_THRESHOLD = 2;
  if (images.length < SCRAPED_IMAGE_THRESHOLD) {
    const stockImages = await getApprovedStockImages(brandId, count - images.length);
    images.push(...stockImages.map((img): ImageSource => ({
      url: img.fullImageUrl || img.previewUrl,
      source: "stock" as const,
      assetId: img.id,
      metadata: {
        width: img.width,
        height: img.height,
        alt: img.title,
        attribution: img.attributionText,
        source: "stock" as const,
      },
    })));
  }

  // If still not enough, return what we have (caller can handle fallback)
  return images.slice(0, count);
}

/**
 * Get scraped brand assets (source='scrape')
 */
/**
 * Get scraped brand assets from media_assets table
 * Used by Creative Studio for image sourcing
 * 
 * ✅ LOGGING: Logs tenantId, brandId, and asset count for ID consistency verification
 */
async function getScrapedBrandAssets(
  brandId: string,
  limit: number
): Promise<Array<{
  id: string;
  url: string;
  filename: string;
  metadata?: Record<string, unknown>;
}>> {
  try {
    // ✅ RESILIENT: Don't use metadata column (may not exist)
    // Filter scraped images by HTTP URLs in path column instead
    // ✅ FIX: Do not select url - this column doesn't exist in media_assets schema
    const { data, error } = await supabase
      .from("media_assets")
      .select("id, path, filename")
      .eq("brand_id", brandId)
      .eq("status", "active")
      .in("category", ["images", "graphics", "logos"])
      .order("created_at", { ascending: false })
      .limit(limit * 2); // Get more to filter in JavaScript

    if (error) {
      console.error("[ImageSourcing] Error querying scraped brand assets:", error);
      return [];
    }

    // Filter for scraped images (HTTP URLs in path)
    const scrapedImages = (data || []).filter((asset: any) => {
      const path = asset.path || "";
      return path.startsWith("http://") || path.startsWith("https://");
    }).slice(0, limit);

    if (scrapedImages.length === 0) {
      // ✅ LOGGING: Log when no images found (helps debug missing images in Creative Studio)
      console.log(`[ImageSourcing] No scraped images found`, {
        brandId: brandId,
        totalAssets: data?.length || 0,
        limit: limit,
      });
      return [];
    }

    // ✅ LOGGING: Log successful query with tenantId (get from brand if available)
    // Try to get tenantId from brand for logging
    let tenantId = "unknown";
    try {
      const { data: brandData } = await supabase
        .from("brands")
        .select("tenant_id, workspace_id")
        .eq("id", brandId)
        .single();
      tenantId = (brandData as any)?.tenant_id || (brandData as any)?.workspace_id || "unknown";
    } catch {
      // Continue without tenantId
    }
    
    console.log(`[ImageSourcing] Query successful`, {
      tenantId: tenantId,
      brandId: brandId,
      totalAssets: data?.length || 0,
      scrapedCount: scrapedImages.length,
      limit: limit,
      categories: ["images", "graphics", "logos"],
    });
    
    return scrapedImages.map((asset: any) => ({
      id: asset.id,
      url: asset.path || "", // ✅ FIX: Use path (contains URL for scraped images, url column doesn't exist)
      filename: asset.filename,
      metadata: undefined, // Not available without metadata column
    }));
  } catch (error) {
    console.error("[ImageSourcing] Error getting scraped brand assets:", error);
    console.error("[ImageSourcing] Debug info:", {
      brandId: brandId,
      limit: limit,
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

/**
 * Get uploaded brand assets (source='upload' or no source)
 */
async function getUploadedBrandAssets(
  brandId: string,
  limit: number
): Promise<Array<{
  id: string;
  url: string;
  filename: string;
  metadata?: Record<string, unknown>;
}>> {
  try {
    // ✅ RESILIENT: Don't use metadata column (may not exist)
    // Filter uploaded images by non-HTTP paths (Supabase storage paths)
    // ✅ FIX: Do not select url - this column doesn't exist in media_assets schema
    const { data, error } = await supabase
      .from("media_assets")
      .select("id, path, filename")
      .eq("brand_id", brandId)
      .eq("status", "active")
      .in("category", ["images", "graphics", "logos"])
      .order("created_at", { ascending: false })
      .limit(limit * 2); // Get more to filter in JavaScript

    if (error || !data) {
      return [];
    }

    // Filter for uploaded images (NOT HTTP URLs - those are scraped)
    const uploadedImages = data.filter((asset: any) => {
      const path = asset.path || "";
      // Uploaded images have Supabase storage paths (not HTTP URLs)
      return !path.startsWith("http://") && !path.startsWith("https://");
    }).slice(0, limit);

    return uploadedImages.map((asset: any) => ({
      id: asset.id,
      url: asset.path || "", // ✅ FIX: Use path (url column doesn't exist)
      filename: asset.filename,
      metadata: undefined, // Not available without metadata column
    }));
  } catch (error) {
    console.error("[ImageSourcing] Error getting uploaded brand assets:", error);
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
    // ✅ FIX: Do not select url or thumbnail_url - these columns don't exist in media_assets schema
    // Use path column instead (contains URL for scraped images)
    const { data: mediaStockAssets, error: mediaError } = await supabase
      .from("media_assets")
      .select("id, path, filename, metadata")
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
        // ✅ FIX: Use path instead of url (path contains the URL for scraped images)
        // thumbnail_url doesn't exist, so use path as fallback
        const imageUrl = asset.path || "";
        return {
          id: asset.id,
          fullImageUrl: imageUrl,
          previewUrl: imageUrl, // Use path as preview (thumbnail_url column doesn't exist)
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

