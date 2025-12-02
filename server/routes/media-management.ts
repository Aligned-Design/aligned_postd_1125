/**
 * PHASE 6: Media Management API Routes
 * Real implementation with Supabase, AI tagging, and duplicate detection
 */

import { Router, Request, Response } from 'express';
import { mediaService } from '../lib/media-service';
import { supabase } from '../lib/supabase';
import multer from 'multer';
import { AppError } from '../lib/error-middleware';
import { ErrorCode, HTTP_STATUS } from '../lib/error-responses';

const router = Router();

// Configure multer for file uploads (in-memory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
    files: 20
  },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/', 'video/', 'application/pdf'];
    const isAllowed = allowed.some(type => file.mimetype.startsWith(type));

    if (isAllowed) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`));
    }
  }
});

/**
 * POST /api/media/upload
 * Upload single or multiple files with progress tracking
 */
router.post('/upload', upload.array('files', 20), async (req: Request, res: Response) => {
  try {
    const { brandId, category } = (req as any).body;
    const tenantId = (req as any).query.tenantId as string;

    if (!brandId || !tenantId || !category) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        'Missing required fields: brandId, tenantId, category',
        HTTP_STATUS.BAD_REQUEST,
        'warning'
      );
    }

    const files = (req as any).files as any[];
    if (!files || files.length === 0) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        'No files provided',
        HTTP_STATUS.BAD_REQUEST,
        'warning'
      );
    }

    // Verify brand belongs to tenant
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .select('id')
      .eq('id', brandId)
      .eq('tenant_id', tenantId)
      .limit(1);

    if (brandError || !brand || brand.length === 0) {
      throw new AppError(
        ErrorCode.FORBIDDEN,
        'Unauthorized: Brand not found',
        HTTP_STATUS.FORBIDDEN,
        'warning'
      );
    }

    const uploadedAssets = [];
    const errors = [];

    // Upload each file
    for (let i = 0; i < files.length; i++) {
      try {
        const file = files[i];
        const asset = await mediaService.uploadMedia(
          file.buffer,
          file.originalname,
          file.mimetype,
          brandId,
          tenantId,
          category as any,
          (progress) => {
            // Emit progress via SSE if needed
            console.log(`Upload progress: ${progress.percentComplete}% - ${progress.currentFile}`);
          }
        );

        uploadedAssets.push(asset);
      } catch (error) {
        errors.push({
          file: files[i].originalname,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    (res as any).json({
      success: errors.length === 0,
      uploadedCount: uploadedAssets.length,
      totalCount: files.length,
      assets: uploadedAssets,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Upload error:', error);
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      'Upload failed',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'error',
      error instanceof Error ? { originalError: error.message } : undefined,
      'Please try again later or contact support'
    );
  }
});

/**
 * GET /api/media/list
 * List assets with filtering, search, and pagination
 */
router.get('/list', async (req: Request, res: Response) => {
  try {
    const { brandId } = (req as any).query;
    const category = (req as any).query.category as string | undefined;
    const search = (req as any).query.search as string | undefined;
    const tags = (req as any).query.tags ? ((req as any).query.tags as string).split(',') : undefined;
    const limit = (req as any).query.limit ? parseInt((req as any).query.limit as string) : 50;
    const offset = (req as any).query.offset ? parseInt((req as any).query.offset as string) : 0;
    const sortBy = ((req as any).query.sortBy as 'created' | 'name' | 'size' | 'usage') || 'created';
    const sortOrder = ((req as any).query.sortOrder as 'asc' | 'desc') || 'desc';

    if (!brandId) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        'Missing required field: brandId',
        HTTP_STATUS.BAD_REQUEST,
        'warning'
      );
    }

    const { assets, total } = await mediaService.listAssets(brandId as string, {
      category: category as any,
      search,
      tags,
      limit,
      offset,
      sortBy,
      sortOrder
    });

    (res as any).json({
      success: true,
      assets,
      pagination: {
        total,
        limit,
        offset,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('List error:', error);
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      'Failed to list assets',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'error',
      error instanceof Error ? { originalError: error.message } : undefined,
      'Please try again later or contact support'
    );
  }
});

/**
 * GET /api/media/search
 * Full-text search with tag filtering
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { brandId, q, tags } = (req as any).query;
    const limit = (req as any).query.limit ? parseInt((req as any).query.limit as string) : 50;

    if (!brandId) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        'Missing required field: brandId',
        HTTP_STATUS.BAD_REQUEST,
        'warning'
      );
    }

    // Search by tags if provided
    if (tags) {
      const tagArray = (tags as string).split(',');
      const results = await mediaService.searchByTag(
        brandId as string,
        tagArray,
        limit
      );

      return (res as any).json({
        success: true,
        assets: results,
        count: results.length
      });
    }

    // Otherwise use list with search
    const { assets, total } = await mediaService.listAssets(brandId as string, {
      search: q as string,
      limit
    });

    (res as any).json({
      success: true,
      assets,
      count: total
    });
  } catch (error) {
    console.error('Search error:', error);
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      'Search failed',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'error',
      error instanceof Error ? { originalError: error.message } : undefined,
      'Please try again later or contact support'
    );
  }
});

/**
 * GET /api/media/storage/:brandId
 * Get storage usage and quota information
 */
router.get('/storage/:brandId', async (req: Request, res: Response) => {
  try {
    const { brandId } = req.params;

    const usage = await mediaService.getStorageUsage(brandId);

    (res as any).json({
      success: true,
      ...usage
    });
  } catch (error) {
    console.error('Storage usage error:', error);
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      'Failed to get storage usage',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'error',
      error instanceof Error ? { originalError: error.message } : undefined,
      'Please try again later or contact support'
    );
  }
});

/**
 * GET /api/media/:assetId
 * Get single asset details
 */
router.get('/:assetId', async (req: Request, res: Response) => {
  try {
    const { assetId } = req.params;
    const { brandId } = req.query;

    if (!brandId) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        'Missing required field: brandId',
        HTTP_STATUS.BAD_REQUEST,
        'warning'
      );
    }

    // ✅ FIX: Explicitly select only columns that exist (exclude thumbnail_url and url)
    const { data, error } = await supabase
      .from('media_assets')
      .select('id, brand_id, tenant_id, category, filename, path, hash, mime_type, size_bytes, used_in, usage_count, metadata, created_at, updated_at, status')
      .eq('id', assetId)
      .eq('brand_id', brandId)
      .limit(1);

    if (error || !data || data.length === 0) {
      throw new AppError(
        ErrorCode.NOT_FOUND,
        'Asset not found',
        HTTP_STATUS.NOT_FOUND,
        'info'
      );
    }

    // ✅ SOURCE FIELD: Include source in response
    const asset = data[0] as any;
    const metadata = (asset.metadata as Record<string, unknown>) || {};
    const source = (metadata.source as string) || "upload";
    
    (res as any).json({
      success: true,
      asset: {
        ...asset,
        source: (source === "scrape" || source === "stock" || source === "upload") 
          ? source as "scrape" | "stock" | "upload" 
          : "upload",
      }
    });
  } catch (error) {
    console.error('Get asset error:', error);
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      'Failed to get asset',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'error',
      error instanceof Error ? { originalError: error.message } : undefined,
      'Please try again later or contact support'
    );
  }
});

/**
 * POST /api/media/:assetId/delete
 * Delete asset with cleanup
 */
router.post('/:assetId/delete', async (req: Request, res: Response) => {
  try {
    const { assetId } = req.params;
    const { brandId } = req.body;

    if (!brandId) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        'Missing required field: brandId',
        HTTP_STATUS.BAD_REQUEST,
        'warning'
      );
    }

    await mediaService.deleteAsset(assetId, brandId);

    (res as any).json({
      success: true,
      message: 'Asset deleted successfully'
    });
  } catch (error) {
    console.error('Delete error:', error);
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      'Failed to delete asset',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'error',
      error instanceof Error ? { originalError: error.message } : undefined,
      'Please try again later or contact support'
    );
  }
});

/**
 * POST /api/media/:assetId/track-usage
 * Track asset usage in posts/campaigns
 */
router.post('/:assetId/track-usage', async (req: Request, res: Response) => {
  try {
    const { assetId } = req.params;
    const { brandId, usedIn } = req.body;

    if (!brandId || !usedIn) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        'Missing required fields: brandId, usedIn',
        HTTP_STATUS.BAD_REQUEST,
        'warning'
      );
    }

    await mediaService.trackAssetUsage(assetId, usedIn, brandId);

    (res as any).json({
      success: true,
      message: 'Asset usage tracked'
    });
  } catch (error) {
    console.error('Track usage error:', error);
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      'Failed to track usage',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'error',
      error instanceof Error ? { originalError: error.message } : undefined,
      'Please try again later or contact support'
    );
  }
});

/**
 * POST /api/media/bulk-delete
 * Delete multiple assets
 */
router.post('/bulk-delete', async (req: Request, res: Response) => {
  try {
    const { assetIds, brandId } = req.body;

    if (!assetIds || !Array.isArray(assetIds) || !brandId) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        'Missing required fields: assetIds (array), brandId',
        HTTP_STATUS.BAD_REQUEST,
        'warning'
      );
    }

    const results = {
      deleted: 0,
      failed: 0,
      errors: [] as unknown[]
    };

    for (const assetId of assetIds) {
      try {
        await mediaService.deleteAsset(assetId, brandId);
        results.deleted++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          assetId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    (res as any).json({
      success: results.failed === 0,
      ...results
    });
  } catch (error) {
    console.error('Bulk delete error:', error);
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      'Bulk delete failed',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'error',
      error instanceof Error ? { originalError: error.message } : undefined,
      'Please try again later or contact support'
    );
  }
});

/**
 * POST /api/media/organize
 * Reorganize assets into different categories
 */
router.post('/organize', async (req: Request, res: Response) => {
  try {
    const { assetIds, newCategory, brandId } = req.body;

    if (!assetIds || !Array.isArray(assetIds) || !newCategory || !brandId) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        'Missing required fields: assetIds, newCategory, brandId',
        HTTP_STATUS.BAD_REQUEST,
        'warning'
      );
    }

    const { error } = await supabase
      .from('media_assets')
      .update({ category: newCategory })
      .in('id', assetIds)
      .eq('brand_id', brandId);

    if (error) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        error.message,
        HTTP_STATUS.BAD_REQUEST,
        'warning'
      );
    }

    (res as any).json({
      success: true,
      message: `${assetIds.length} assets moved to ${newCategory}`,
      count: assetIds.length
    });
  } catch (error) {
    console.error('Organize error:', error);
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      'Failed to organize assets',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'error',
      error instanceof Error ? { originalError: error.message } : undefined,
      'Please try again later or contact support'
    );
  }
});

export default router;
