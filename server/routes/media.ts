import { RequestHandler } from "express";
import { mediaDB } from "../lib/media-db-service";
import { AppError } from "../lib/error-middleware";
import { ErrorCode, HTTP_STATUS } from "../lib/error-responses";
import { assertBrandAccess } from "../lib/brand-access";

interface MediaAsset {
  id: string;
  filename: string;
  originalName: string;
  category: string;
  mimeType: string;
  size: number;
  brandId: string;
  tenantId: string;
  bucketPath: string;
  createdAt: string;
  updatedAt: string;
  hash?: string;
  tags?: string[];
  variants?: unknown[];
  metadata?: Record<string, unknown>;
  source?: "scrape" | "stock" | "upload";
  url?: string;
}

interface MediaUploadResponse {
  success: boolean;
  asset?: MediaAsset;
  uploadId: string;
  error?: string;
  warnings?: string[];
}

interface MediaListResponse {
  assets: MediaAsset[];
  total: number;
  hasMore: boolean;
  categories: Record<string, number>;
}

interface StorageUsageResponse {
  brandId: string;
  totalSize: number;
  assetCount: number;
  bucketName: string;
  categoryBreakdown: Record<string, { count: number; size: number }>;
  lastUpdated: string;
}

interface DuplicateCheckResponse {
  isDuplicate: boolean;
  existingAsset?: MediaAsset;
  similarity: number;
}

interface SEOMetadataRequest {
  assetId: string;
  context?: string;
  targetKeywords?: string[];
}

interface SEOMetadataResponse {
  altText: string;
  title: string;
  description: string;
  keywords: string[];
  optimizedMetadata: Record<string, unknown>;
}

function generateSEOMetadata(
  asset: MediaAsset,
  _context: string,
): { altText: string; title: string; description: string } {
  return {
    altText: asset.originalName,
    title: `Image: ${asset.originalName}`,
    description: `Digital asset: ${asset.originalName}`,
  };
}

// Helper function to convert database record to API response format
function mapAssetRecord(record: unknown): MediaAsset {
  const r = record as any;
  const metadata = r.metadata as Record<string, unknown> | undefined;
  const source = (metadata?.source as string) || "upload";
  
  return {
    id: r.id,
    filename: r.filename,
    originalName: r.filename, // Use filename as originalName
    category: r.category,
    mimeType: r.mime_type,
    size: r.size_bytes || r.file_size || 0, // ✅ FIX: size_bytes in production schema
    brandId: r.brand_id,
    tenantId: r.tenant_id,
    bucketPath: r.path,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    hash: r.hash,
    tags: r.metadata?.tags || [],
    variants: r.variants,
    metadata: r.metadata,
    // ✅ SOURCE FIELD: Include source in response (scrape | stock | upload)
    source: (source === "scrape" || source === "stock" || source === "upload") 
      ? source as "scrape" | "stock" | "upload" 
      : "upload",
    url: r.url,
  };
}

// Helper to compute category breakdown from assets
function getCategoryBreakdown(
  assets: unknown[]
): Record<string, number> {
  const breakdown: Record<string, number> = {
    graphics: 0,
    images: 0,
    logos: 0,
    videos: 0,
    ai_exports: 0,
    client_uploads: 0,
  };

  for (const asset of assets) {
    const a = asset as any;
    if (a.category in breakdown) {
      breakdown[a.category]++;
    }
  }

  return breakdown;
}

export const uploadMedia: RequestHandler = async (req, res, next) => {
  try {
    const { brandId, tenantId, filename, mimeType, fileSize, hash, path, category, metadata, thumbnailUrl } = req.body;

    // Validate required fields
    if (!brandId || !tenantId || !filename || !mimeType || fileSize === undefined) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "Missing required fields: brandId, tenantId, filename, mimeType, fileSize",
        HTTP_STATUS.BAD_REQUEST,
        "warning"
      );
    }

    // Verify user has access to this brand
    assertBrandAccess(req, brandId);

    // Create media asset in database
    const assetRecord = await mediaDB.createMediaAsset(
      brandId,
      tenantId,
      filename,
      mimeType,
      path || `${tenantId}/${brandId}/${filename}`,
      fileSize,
      hash || "",
      "", // URL will be generated separately
      ((category as string) || "images") as any,
      metadata,
      thumbnailUrl
    );

    const response: MediaUploadResponse = {
      success: true,
      asset: mapAssetRecord(assetRecord),
      uploadId: assetRecord.id,
    };

    (res as any).json(response);
  } catch (error) {
    next(error);
  }
};

export const listMedia: RequestHandler = async (req, res, next) => {
  try {
    const { brandId, category, limit = 50, offset = 0 } = req.query;

    if (!brandId) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "brandId is required",
        HTTP_STATUS.BAD_REQUEST,
        "warning"
      );
    }

    // Verify user has access to this brand
    assertBrandAccess(req, brandId as string);

    // Fetch assets from database
    const { assets: assetRecords, total } = await mediaDB.listMediaAssets(
      brandId as string,
      {
        category: category as string | undefined,
        limit: parseInt(limit as string) || 50,
        offset: parseInt(offset as string) || 0,
      }
    );

    const mappedAssets = assetRecords.map(mapAssetRecord);
    const categories = getCategoryBreakdown(assetRecords);

    const response: MediaListResponse = {
      assets: mappedAssets,
      total,
      hasMore: (parseInt(offset as string) || 0) + mappedAssets.length < total,
      categories,
    };

    (res as any).json(response);
  } catch (error) {
    next(error);
  }
};

export const getStorageUsage: RequestHandler = async (req, res, next) => {
  try {
    const { brandId } = req.params;

    if (!brandId) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "brandId is required",
        HTTP_STATUS.BAD_REQUEST,
        "warning"
      );
    }

    // Verify user has access to this brand
    assertBrandAccess(req, brandId);

    // Get storage usage from database
    const usage = await mediaDB.getStorageUsage(brandId);

    // Compute category breakdown - would need separate query in production
    const categoryBreakdown: Record<string, { count: number; size: number }> = {
      graphics: { count: 0, size: 0 },
      images: { count: 0, size: 0 },
      logos: { count: 0, size: 0 },
      videos: { count: 0, size: 0 },
      ai_exports: { count: 0, size: 0 },
      client_uploads: { count: 0, size: 0 },
    };

    const response: StorageUsageResponse = {
      brandId,
      totalSize: usage.totalUsedBytes,
      assetCount: usage.assetCount,
      bucketName: `tenant-storage`,
      categoryBreakdown,
      lastUpdated: new Date().toISOString(),
    };

    (res as any).json(response);
  } catch (error) {
    next(error);
  }
};

export const getAssetUrl: RequestHandler = async (req, res, next) => {
  try {
    const { assetId } = req.params;
    const { expirationSeconds = 3600 } = req.query;

    if (!assetId) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "assetId is required",
        HTTP_STATUS.BAD_REQUEST,
        "warning"
      );
    }

    // ✅ SECURITY: Get asset and verify brand access
    const assetRecord = await mediaDB.getMediaAsset(assetId);
    const asset = assetRecord ? mapAssetRecord(assetRecord) : null;
    if (!asset) {
      throw new AppError(
        ErrorCode.NOT_FOUND,
        "Asset not found",
        HTTP_STATUS.NOT_FOUND,
        "warning"
      );
    }

    // ✅ SECURITY: Verify user has access to this asset's brand
    assertBrandAccess(req, asset.brandId);

    // Generate signed URL using asset path (generateSignedUrl expects storage path)
    const url = await mediaDB.generateSignedUrl(asset.bucketPath, parseInt(expirationSeconds as string) || 3600);

    (res as any).json({ url });
  } catch (error) {
    next(error);
  }
};

export const checkDuplicateAsset: RequestHandler = async (req, res, next) => {
  try {
    const { hash, brandId } = req.query;

    if (!hash || !brandId) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "hash and brandId are required",
        HTTP_STATUS.BAD_REQUEST,
        "warning"
      );
    }

    // Check for duplicate asset in database
    const existingAssetRecord = await mediaDB.checkDuplicateAsset(
      brandId as string,
      hash as string
    );

    const response: DuplicateCheckResponse = {
      isDuplicate: !!existingAssetRecord,
      existingAsset: existingAssetRecord ? mapAssetRecord(existingAssetRecord) : undefined,
      similarity: existingAssetRecord ? 1.0 : 0,
    };

    (res as any).json(response);
  } catch (error) {
    next(error);
  }
};

export const generateSEOMetadataRoute: RequestHandler = async (req, res, next) => {
  try {
    const {
      assetId,
      context = "web",
      targetKeywords = [],
    } = req.body as SEOMetadataRequest;

    if (!assetId) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "assetId is required",
        HTTP_STATUS.BAD_REQUEST,
        "warning"
      );
    }

    // Fetch asset from database
    const assetRecord = await mediaDB.getMediaAsset(assetId);

    if (!assetRecord) {
      throw new AppError(
        ErrorCode.NOT_FOUND,
        "Asset not found",
        HTTP_STATUS.NOT_FOUND,
        "warning"
      );
    }

    const asset = mapAssetRecord(assetRecord);
    const seoData = generateSEOMetadata(asset, context);

    const response: SEOMetadataResponse = {
      altText: seoData.altText,
      title: seoData.title,
      description: seoData.description,
      keywords: [
        ...((asset.metadata?.keywords as string[]) || []),
        ...targetKeywords,
      ],
      optimizedMetadata: asset.metadata || {},
    };

    (res as any).json(response);
  } catch (error) {
    next(error);
  }
};

export const trackAssetUsage: RequestHandler = async (req, res, next) => {
  try {
    const { assetId, usedIn } = req.body;

    if (!assetId || !usedIn) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "assetId and usedIn are required",
        HTTP_STATUS.BAD_REQUEST,
        "warning"
      );
    }

    // Verify asset exists and get brandId
    const assetRecord = await mediaDB.getMediaAsset(assetId);
    if (!assetRecord) {
      throw new AppError(
        ErrorCode.NOT_FOUND,
        "Asset not found",
        HTTP_STATUS.NOT_FOUND,
        "warning"
      );
    }

    // Get userId from request if available
    const userId = (req as any).user?.id || (req as any).auth?.userId;

    // Update asset with usage tracking
    const updatedAsset = await mediaDB.updateMediaAsset(assetId, {
      usedIn: usedIn,
      metadata: {
        lastUsedAt: new Date().toISOString(),
      },
    });

    // Also log to usage_logs table for audit trail
    try {
      await mediaDB.logAssetUsage(assetId, assetRecord.brand_id, Array.isArray(usedIn) ? usedIn.join(", ") : usedIn, userId);
    } catch (logError) {
      // Log error but don't fail the request - usage tracking is best-effort
      console.warn("[Media] Failed to log usage to audit table:", logError);
    }

    (res as any).json({
      success: true,
      asset: {
        id: updatedAsset.id,
        usageCount: updatedAsset.usage_count,
        usedIn: updatedAsset.used_in || [],
      },
    });
  } catch (error) {
    next(error);
  }
};
