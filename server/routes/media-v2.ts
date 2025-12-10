/**
 * Media API Routes (v2)
 * 
 * Real implementation using media database service.
 * Replaces mock implementation with actual data access.
 */

import { Router, RequestHandler } from "express";
import { z } from "zod";
import { mediaDB } from "../lib/media-db-service";
import { AppError } from "../lib/error-middleware";
import { ErrorCode, HTTP_STATUS } from "../lib/error-responses";
import { authenticateUser } from "../middleware/security";
import { requireScope } from "../middleware/requireScope";
import { validateBrandId } from "../middleware/validate-brand-id";
import { assertBrandAccess } from "../lib/brand-access";

const router = Router();

// ✅ VALIDATION: Zod schemas for media routes
// Note: brandId validation is handled by validateBrandId middleware
const MediaQuerySchema = z.object({
  brandId: z.string().optional(), // Format validation handled by middleware
  category: z.string().optional(),
  type: z.enum(["image", "video", "document"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
  offset: z.coerce.number().int().min(0).default(0).optional(),
  search: z.string().optional(),
});

const AssetIdParamSchema = z.object({
  assetId: z.string().uuid("Invalid asset ID format"),
});

const StorageUsageQuerySchema = z.object({
  brandId: z.string(), // Format validation handled by middleware
});

/**
 * Helper function to map database record to API response format
 */
function mapAssetToResponse(asset: any, baseUrl?: string) {
  const metadata = asset.metadata as Record<string, unknown> | undefined;
  const mimeType = asset.mime_type || "";
  const isImage = mimeType.startsWith("image/");
  const isVideo = mimeType.startsWith("video/");
  
  // Determine type from mime type
  let type: "image" | "video" | "document" = "document";
  if (isImage) type = "image";
  else if (isVideo) type = "video";

  // Get URL from path (for scraped images, path contains the URL)
  const url = asset.path?.startsWith("http") ? asset.path : 
    (baseUrl ? `${baseUrl}/${asset.path}` : asset.path);

  return {
    id: asset.id,
    brandId: asset.brand_id,
    type,
    url,
    thumbnailUrl: isImage ? url : undefined, // For now, use same URL as thumbnail
    filename: asset.filename,
    size: asset.size_bytes || 0,
    width: typeof metadata?.width === "number" ? metadata.width : undefined,
    height: typeof metadata?.height === "number" ? metadata.height : undefined,
    duration: typeof metadata?.duration === "number" ? metadata.duration : undefined,
    mimeType,
    category: asset.category || "uncategorized",
    tags: Array.isArray(metadata?.tags) ? metadata.tags : [],
    uploadedBy: typeof metadata?.uploadedBy === "string" ? metadata.uploadedBy : undefined,
    uploadedAt: asset.created_at,
  };
}

/**
 * GET /api/media?brandId=...&category=...&limit=20
 * List media assets with filtering and pagination
 * 
 * **Auth:** Required (authenticateUser)
 * **Scope:** content:view
 * **Query:** brandId (UUID, optional), category (string, optional), type (image|video|document, optional), limit (1-100, default 20), offset (default 0), search (string, optional)
 */
router.get(
  "/",
  authenticateUser,
  requireScope("content:view"),
  validateBrandId, // Validates brandId format and access (if provided)
  (async (req, res, next) => {
    try {
      // ✅ Use validated brandId from middleware
      let brandId: string | undefined = (req as any).validatedBrandId ?? (req.query.brandId as string);
      let category: string | undefined;
      let type: "image" | "video" | "document" | undefined;
      let limit: number;
      let offset: number;
      let search: string | undefined;
      
      try {
        const validated = MediaQuerySchema.parse(req.query);
        brandId = brandId || validated.brandId;
        category = validated.category;
        type = validated.type;
        limit = validated.limit || 20;
        offset = validated.offset || 0;
        search = validated.search;
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          throw new AppError(
            ErrorCode.VALIDATION_ERROR,
            "Invalid query parameters",
            HTTP_STATUS.BAD_REQUEST,
            "warning",
            { validationErrors: validationError.errors }
          );
        }
        throw validationError;
      }

      // Get brandId if not provided
      if (!brandId) {
        const user = req.user || req.auth;
        if (user?.brandIds && user.brandIds.length > 0) {
          brandId = user.brandIds[0];
        } else {
          throw new AppError(
            ErrorCode.MISSING_REQUIRED_FIELD,
            "brandId is required",
            HTTP_STATUS.BAD_REQUEST,
            "warning"
          );
        }
      }

      // List media assets from database
      const { assets, total } = await mediaDB.listMediaAssets(brandId, {
        category,
        searchTerm: search,
        limit,
        offset,
        sortBy: "created_at",
        sortOrder: "desc",
      });

      // Filter by type if provided (based on mime type)
      let filteredAssets = assets;
      if (type) {
        filteredAssets = assets.filter((asset) => {
          const mimeType = asset.mime_type || "";
          if (type === "image") return mimeType.startsWith("image/");
          if (type === "video") return mimeType.startsWith("video/");
          return !mimeType.startsWith("image/") && !mimeType.startsWith("video/");
        });
      }

      // Map to response format
      const items = filteredAssets.map((asset) => mapAssetToResponse(asset));

      res.json({
        items,
        total: filteredAssets.length,
        limit,
        offset,
        hasMore: offset + limit < filteredAssets.length,
      });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler
);

/**
 * GET /api/media/:assetId
 * Get single asset details
 * 
 * **Auth:** Required (authenticateUser)
 * **Scope:** content:view
 * **Params:** assetId (UUID)
 */
router.get(
  "/:assetId",
  authenticateUser,
  requireScope("content:view"),
  (async (req, res, next) => {
    try {
      // ✅ VALIDATION: Validate assetId parameter
      let assetId: string;
      try {
        const validated = AssetIdParamSchema.parse(req.params);
        assetId = validated.assetId;
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          throw new AppError(
            ErrorCode.VALIDATION_ERROR,
            "Invalid asset ID format",
            HTTP_STATUS.BAD_REQUEST,
            "warning",
            { validationErrors: validationError.errors }
          );
        }
        throw validationError;
      }

      // Get asset from database
      const asset = await mediaDB.getMediaAsset(assetId);

      if (!asset) {
        throw new AppError(
          ErrorCode.NOT_FOUND,
          "Asset not found",
          HTTP_STATUS.NOT_FOUND,
          "info"
        );
      }

      // ✅ Verify brand access (brandId comes from asset record, not request params)
      // Note: Cannot use validateBrandId middleware here since brandId is from DB, not request
      await assertBrandAccess(req, asset.brand_id, true, true);

      // Map to response format
      const response = mapAssetToResponse(asset);

      res.json(response);
    } catch (error) {
      next(error);
    }
  }) as RequestHandler
);

/**
 * GET /api/media/storage-usage?brandId=...
 * Get storage usage stats
 * 
 * **Auth:** Required (authenticateUser)
 * **Scope:** content:view
 * **Query:** brandId (UUID, required)
 */
router.get(
  "/storage-usage",
  authenticateUser,
  requireScope("content:view"),
  validateBrandId, // Validates brandId format and access (required for this route)
  (async (req, res, next) => {
    try {
      // ✅ Use validated brandId from middleware (required for this route)
      const brandId = (req as any).validatedBrandId ?? (req.query.brandId as string);
      if (!brandId) {
        throw new AppError(
          ErrorCode.MISSING_REQUIRED_FIELD,
          "brandId is required",
          HTTP_STATUS.BAD_REQUEST,
          "warning"
        );
      }
      
      // Validate other query parameters
      try {
        StorageUsageQuerySchema.parse(req.query);
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          throw new AppError(
            ErrorCode.VALIDATION_ERROR,
            "Invalid query parameters",
            HTTP_STATUS.BAD_REQUEST,
            "warning",
            { validationErrors: validationError.errors }
          );
        }
        throw validationError;
      }

      // Get storage usage from database service
      const usage = await mediaDB.getStorageUsage(brandId);

      // Get asset counts by type
      const { assets } = await mediaDB.listMediaAssets(brandId, { limit: 1000 });
      
      const byType = {
        image: assets.filter((a) => a.mime_type?.startsWith("image/")).length,
        video: assets.filter((a) => a.mime_type?.startsWith("video/")).length,
        document: assets.filter((a) => {
          const mime = a.mime_type || "";
          return !mime.startsWith("image/") && !mime.startsWith("video/");
        }).length,
      };

      res.json({
        brandId,
        totalSize: usage.totalUsedBytes,
        totalCount: usage.assetCount,
        byType,
        limit: usage.quotaLimitBytes,
        used: usage.totalUsedBytes,
        percentUsed: parseFloat(usage.percentageUsed.toFixed(2)),
      });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler
);

/**
 * DELETE /api/media/:assetId
 * Delete an asset
 * 
 * **Auth:** Required (authenticateUser)
 * **Scope:** content:manage
 * **Params:** assetId (UUID)
 */
router.delete(
  "/:assetId",
  authenticateUser,
  requireScope("content:manage"),
  (async (req, res, next) => {
    try {
      // ✅ VALIDATION: Validate assetId parameter
      let assetId: string;
      try {
        const validated = AssetIdParamSchema.parse(req.params);
        assetId = validated.assetId;
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          throw new AppError(
            ErrorCode.VALIDATION_ERROR,
            "Invalid asset ID format",
            HTTP_STATUS.BAD_REQUEST,
            "warning",
            { validationErrors: validationError.errors }
          );
        }
        throw validationError;
      }

      // Get asset to verify brand access
      const asset = await mediaDB.getMediaAsset(assetId);

      if (!asset) {
        throw new AppError(
          ErrorCode.NOT_FOUND,
          "Asset not found",
          HTTP_STATUS.NOT_FOUND,
          "info"
        );
      }

      // ✅ Verify brand access (brandId comes from asset record, not request params)
      // Note: Cannot use validateBrandId middleware here since brandId is from DB, not request
      await assertBrandAccess(req, asset.brand_id, true, true);

      // Delete asset from database
      await mediaDB.deleteMediaAsset(assetId);

      res.json({
        assetId,
        deletedAt: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler
);

/**
 * GET /api/media/excluded
 * Get excluded (hidden) media assets for a brand
 * 
 * **Auth:** Required (authenticateUser)
 * **Scope:** content:view
 * **Query:** brandId (UUID, required)
 */
router.get(
  "/excluded",
  authenticateUser,
  requireScope("content:view"),
  validateBrandId,
  (async (req, res, next) => {
    try {
      const brandId = (req as any).validatedBrandId ?? (req.query.brandId as string);
      if (!brandId) {
        throw new AppError(
          ErrorCode.MISSING_REQUIRED_FIELD,
          "brandId is required",
          HTTP_STATUS.BAD_REQUEST,
          "warning"
        );
      }

      // Get excluded images using the scraped-images-service
      const { getScrapedImages } = await import("../lib/scraped-images-service");
      
      // Fetch ALL images including excluded, then filter to only excluded
      const allImages = await getScrapedImages(brandId, undefined, undefined, true); // includeExcluded = true
      const excludedImages = allImages.filter(img => img.excluded === true);

      res.json({
        items: excludedImages.map(img => ({
          id: img.id,
          url: img.url,
          filename: img.filename,
          metadata: img.metadata,
          excluded: true,
        })),
        total: excludedImages.length,
      });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler
);

/**
 * POST /api/media/:assetId/exclude
 * Exclude an asset from the brand (soft delete)
 * Sets excluded = true for the specified asset
 * 
 * **Auth:** Required (authenticateUser)
 * **Scope:** content:manage
 * **Params:** assetId (UUID)
 */
router.post(
  "/:assetId/exclude",
  authenticateUser,
  requireScope("content:manage"),
  (async (req, res, next) => {
    try {
      // ✅ VALIDATION: Validate assetId parameter
      let assetId: string;
      try {
        const validated = AssetIdParamSchema.parse(req.params);
        assetId = validated.assetId;
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          throw new AppError(
            ErrorCode.VALIDATION_ERROR,
            "Invalid asset ID format",
            HTTP_STATUS.BAD_REQUEST,
            "warning",
            { validationErrors: validationError.errors }
          );
        }
        throw validationError;
      }

      // Get asset to verify brand access
      const asset = await mediaDB.getMediaAsset(assetId);

      if (!asset) {
        throw new AppError(
          ErrorCode.NOT_FOUND,
          "Asset not found",
          HTTP_STATUS.NOT_FOUND,
          "info"
        );
      }

      // ✅ Verify brand access
      await assertBrandAccess(req, asset.brand_id, true, true);

      // ✅ Import and call excludeAsset from scraped-images-service
      const { excludeAsset } = await import("../lib/scraped-images-service");
      const success = await excludeAsset(assetId, asset.brand_id);

      if (!success) {
        throw new AppError(
          ErrorCode.DATABASE_ERROR,
          "Failed to exclude asset",
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
          "error"
        );
      }

      res.json({
        assetId,
        excluded: true,
        excludedAt: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler
);

/**
 * POST /api/media/:assetId/restore
 * Restore an excluded asset (un-exclude)
 * Sets excluded = false for the specified asset
 * 
 * **Auth:** Required (authenticateUser)
 * **Scope:** content:manage
 * **Params:** assetId (UUID)
 */
router.post(
  "/:assetId/restore",
  authenticateUser,
  requireScope("content:manage"),
  (async (req, res, next) => {
    try {
      // ✅ VALIDATION: Validate assetId parameter
      let assetId: string;
      try {
        const validated = AssetIdParamSchema.parse(req.params);
        assetId = validated.assetId;
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          throw new AppError(
            ErrorCode.VALIDATION_ERROR,
            "Invalid asset ID format",
            HTTP_STATUS.BAD_REQUEST,
            "warning",
            { validationErrors: validationError.errors }
          );
        }
        throw validationError;
      }

      // Get asset to verify brand access
      const asset = await mediaDB.getMediaAsset(assetId);

      if (!asset) {
        throw new AppError(
          ErrorCode.NOT_FOUND,
          "Asset not found",
          HTTP_STATUS.NOT_FOUND,
          "info"
        );
      }

      // ✅ Verify brand access
      await assertBrandAccess(req, asset.brand_id, true, true);

      // ✅ Import and call restoreAsset from scraped-images-service
      const { restoreAsset } = await import("../lib/scraped-images-service");
      const success = await restoreAsset(assetId, asset.brand_id);

      if (!success) {
        throw new AppError(
          ErrorCode.DATABASE_ERROR,
          "Failed to restore asset",
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
          "error"
        );
      }

      res.json({
        assetId,
        excluded: false,
        restoredAt: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler
);

export default router;
