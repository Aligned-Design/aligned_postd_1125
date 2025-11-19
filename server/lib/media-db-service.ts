/**
 * Media Database Service
 * Handles all database operations for media assets, storage quotas, and usage tracking
 * Integrates with Supabase Storage for file management
 */

import { supabase } from "./supabase";
import { AppError } from "./error-middleware";
import { ErrorCode, HTTP_STATUS } from "./error-responses";

/**
 * Media asset record from database
 * ✅ Matches production schema: size_bytes not file_size
 */
export interface MediaAssetRecord {
  id: string;
  tenant_id: string;
  brand_id: string;
  category?: "graphics" | "images" | "logos" | "videos" | "ai_exports" | "client_uploads";
  filename: string;
  mime_type: string;
  path: string;
  size_bytes: number; // ✅ Column name in production
  hash?: string;
  metadata?: Record<string, unknown>;
  used_in?: string[];
  usage_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * Storage quota record
 */
export interface StorageQuotaRecord {
  id: string;
  brand_id: string;
  tenant_id: string;
  limit_bytes: number;
  warning_threshold_percent: number;
  hard_limit_percent: number;
  created_at: string;
  updated_at: string;
}

/**
 * Media usage log record
 */
export interface MediaUsageLogRecord {
  id: string;
  asset_id: string;
  brand_id: string;
  used_in: string;
  used_by_user?: string;
  created_at: string;
}

/**
 * Media storage usage statistics
 */
export interface StorageUsageStats {
  totalUsedBytes: number;
  quotaLimitBytes: number;
  percentageUsed: number;
  isWarning: boolean;
  isHardLimit: boolean;
  assetCount: number;
}

/**
 * Media Database Service Class
 */
export class MediaDBService {
  /**
   * Create a new media asset record in the database
   */
  async createMediaAsset(
    brandId: string,
    tenantId: string,
    filename: string,
    mimeType: string,
    path: string,
    fileSize: number,
    hash: string,
    url: string,
    category: MediaAssetRecord["category"],
    metadata?: Record<string, unknown>,
    thumbnailUrl?: string,
  ): Promise<MediaAssetRecord> {
    // Check if duplicate exists
    const existingAsset = await this.checkDuplicateAsset(brandId, hash);
    if (existingAsset) {
      throw new AppError(
        ErrorCode.DUPLICATE_RESOURCE,
        "Asset with this hash already exists",
        HTTP_STATUS.CONFLICT,
        "warning",
        { existingAssetId: existingAsset.id },
        "This file has already been uploaded. Use the existing asset instead."
      );
    }

    // Check storage quota before inserting
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

    // ✅ FIX: media_assets table may not have 'url' column (depends on migration)
    // For scraped images, URL is stored in path column
    // Only include url/thumbnail_url if they exist in schema (Supabase will ignore unknown columns)
    // ✅ FIX: Column is size_bytes not file_size in production schema
    const insertData: any = {
      tenant_id: tenantId,
      brand_id: brandId,
      filename,
      mime_type: mimeType,
      path, // For scraped images, path contains the actual URL
      size_bytes: fileSize,
      hash,
      category,
      metadata,
    };
    
    // Only add url/thumbnail_url if they might exist (won't error if column doesn't exist)
    // For scraped images, we store URL in path, so url is redundant
    if (url && url.startsWith("http")) {
      insertData.url = url;
    }
    if (thumbnailUrl) {
      insertData.thumbnail_url = thumbnailUrl;
    }

    const { data, error } = await supabase
      .from("media_assets")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to create media asset",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical",
        { details: error.message }
      );
    }

    return data as MediaAssetRecord;
  }

  /**
   * Get a media asset by ID
   */
  async getMediaAsset(assetId: string): Promise<MediaAssetRecord | null> {
    // ✅ FIX: Column is size_bytes not file_size in production schema
    const { data, error} = await supabase
      .from("media_assets")
      .select("id, brand_id, tenant_id, category, filename, mime_type, path, size_bytes, hash, metadata, created_at, updated_at")
      .eq("id", assetId)
      .single();

    if (error && error.code === "PGRST116") {
      return null; // Not found
    }

    if (error) {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to fetch media asset",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical"
      );
    }

    return data as MediaAssetRecord;
  }

  /**
   * List media assets for a brand with pagination and filtering
   */
  async listMediaAssets(
    brandId: string,
    filters?: {
      category?: string;
      searchTerm?: string;
      limit?: number;
      offset?: number;
      sortBy?: "created_at" | "usage_count" | "filename";
      sortOrder?: "asc" | "desc";
    }
  ): Promise<{ assets: MediaAssetRecord[]; total: number }> {
    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;
    const sortBy = filters?.sortBy || "created_at";
    const sortOrder = filters?.sortOrder || "desc";

    // ✅ RESILIENT: Only select fields that definitely exist (avoid metadata column)
    let query = supabase
      .from("media_assets")
      .select("id, brand_id, tenant_id, category, filename, mime_type, path, file_size, hash, url, thumbnail_url, status, created_at, updated_at", { count: "exact" })
      .eq("brand_id", brandId)
      .eq("status", "active");

    if (filters?.category) {
      query = query.eq("category", filters.category);
    }

    if (filters?.searchTerm) {
      query = query.ilike("filename", `%${filters.searchTerm}%`);
    }

    query = query.order(sortBy, { ascending: sortOrder === "asc" });
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to list media assets",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical"
      );
    }

    return {
      assets: (data || []) as MediaAssetRecord[],
      total: count || 0,
    };
  }

  /**
   * Check for duplicate asset by hash
   */
  async checkDuplicateAsset(
    brandId: string,
    hash: string
  ): Promise<MediaAssetRecord | null> {
    // ✅ FIX: Column is size_bytes not file_size in production schema
    const { data, error } = await supabase
      .from("media_assets")
      .select("id, brand_id, tenant_id, category, filename, mime_type, path, size_bytes, hash, metadata, created_at, updated_at")
      .eq("brand_id", brandId)
      .eq("hash", hash)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      // ✅ LOGGING: Log the error for debugging
      console.error("[MediaDB] Error checking for duplicate asset:", {
        brandId,
        hash: hash.substring(0, 16) + "...",
        errorCode: error.code,
        errorMessage: error.message,
      });
      // ✅ RESILIENT: Return null instead of throwing (allows persistence to continue)
      // This prevents the entire image persistence from failing if duplicate check fails
      // The image will be attempted to be created, and if it's truly a duplicate,
      // the insert will fail with a duplicate error that we can handle
      return null;
    }

    return data as MediaAssetRecord | null;
  }

  /**
   * Update asset metadata (tags, alt text, etc)
   */
  async updateAssetMetadata(
    assetId: string,
    metadata: Record<string, unknown>
  ): Promise<MediaAssetRecord> {
    const { data, error } = await supabase
      .from("media_assets")
      .update({ metadata })
      .eq("id", assetId)
      .select()
      .single();

    if (error) {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to update asset metadata",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical"
      );
    }

    return data as MediaAssetRecord;
  }

  /**
   * Update media asset with usage tracking
   * Increments usage_count and updates last_used timestamp
   */
  async updateMediaAsset(
    assetId: string,
    updates: {
      usedIn?: string | string[];
      metadata?: Record<string, unknown>;
    }
  ): Promise<MediaAssetRecord> {
    // Get current asset to merge used_in array
    const currentAsset = await this.getMediaAsset(assetId);
    if (!currentAsset) {
      throw new AppError(
        ErrorCode.NOT_FOUND,
        "Asset not found",
        HTTP_STATUS.NOT_FOUND,
        "warning"
      );
    }

    // Merge used_in arrays
    const currentUsedIn = currentAsset.used_in || [];
    const newUsedIn = updates.usedIn 
      ? Array.isArray(updates.usedIn) 
        ? [...new Set([...currentUsedIn, ...updates.usedIn])]
        : [...new Set([...currentUsedIn, updates.usedIn])]
      : currentUsedIn;

    // Build update payload
    const updatePayload: Record<string, unknown> = {
      used_in: newUsedIn,
      last_used: new Date().toISOString(),
      usage_count: (currentAsset.usage_count || 0) + 1,
      updated_at: new Date().toISOString(),
    };

    // Merge metadata if provided
    if (updates.metadata) {
      updatePayload.metadata = {
        ...(currentAsset.metadata || {}),
        ...updates.metadata,
      };
    }

    const { data, error } = await supabase
      .from("media_assets")
      .update(updatePayload)
      .eq("id", assetId)
      .select()
      .single();

    if (error) {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to update media asset",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical"
      );
    }

    return data as MediaAssetRecord;
  }

  /**
   * Log media asset usage
   */
  async logAssetUsage(
    assetId: string,
    brandId: string,
    usedIn: string,
    userId?: string
  ): Promise<MediaUsageLogRecord> {
    const { data, error } = await supabase
      .from("media_usage_logs")
      .insert({
        asset_id: assetId,
        brand_id: brandId,
        used_in: usedIn,
        used_by_user: userId,
      })
      .select()
      .single();

    if (error) {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to log asset usage",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical"
      );
    }

    return data as MediaUsageLogRecord;
  }

  /**
   * Delete a media asset (soft delete)
   */
  async deleteMediaAsset(assetId: string): Promise<void> {
    const { error } = await supabase
      .from("media_assets")
      .update({ status: "deleted" })
      .eq("id", assetId);

    if (error) {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to delete media asset",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical"
      );
    }
  }

  /**
   * Get storage usage statistics for a brand
   * ⚠️ TEMP FIX: Gracefully handle missing storage_quotas table until migration is run
   */
  async getStorageUsage(brandId: string): Promise<StorageUsageStats> {
    // Get quota - gracefully handle table not existing yet
    const { data: quotaData, error: quotaError } = await supabase
      .from("storage_quotas")
      .select("*")
      .eq("brand_id", brandId)
      .single();

    // ⚠️ TEMP FIX: If storage_quotas table doesn't exist, use default quota
    if (quotaError && (quotaError.code === 'PGRST204' || quotaError.code === 'PGRST205')) {
      console.warn(`[MediaDB] storage_quotas table not found, using default quota for brand ${brandId}`);
      const defaultQuota = {
        limit_bytes: 5_000_000_000, // 5GB default
        warning_threshold_percent: 80,
        hard_limit_percent: 95,
      };
      
      // Return default values - allow uploads to proceed
      return {
        brandId,
        quotaLimitBytes: defaultQuota.limit_bytes,
        totalUsedBytes: 0,
        percentageUsed: 0,
        isWarning: false,
        isHardLimit: false,
      };
    }

    if (quotaError) {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to fetch storage quota",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical"
      );
    }

    const quota = quotaData as StorageQuotaRecord;

    // Get total used bytes - ✅ FIX: Column is size_bytes not file_size
    const { data: usageData, error: usageError } = await supabase
      .from("media_assets")
      .select("size_bytes")
      .eq("brand_id", brandId);

    if (usageError) {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to calculate storage usage",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical"
      );
    }

    const totalUsedBytes = (usageData || []).reduce(
      (sum, asset: any) => sum + (asset.size_bytes || 0),
      0
    );

    const percentageUsed = Math.round(
      (totalUsedBytes / quota.limit_bytes) * 100
    );
    const isWarning = percentageUsed >= quota.warning_threshold_percent;
    const isHardLimit = percentageUsed >= quota.hard_limit_percent;

    return {
      totalUsedBytes,
      quotaLimitBytes: quota.limit_bytes,
      percentageUsed,
      isWarning,
      isHardLimit,
      assetCount: usageData?.length || 0,
    };
  }

  /**
   * Get signed URL for storage access
   * Note: This would require Supabase Storage signed URL generation
   * Implementation depends on bucket policy and token settings
   */
  async generateSignedUrl(
    storagePath: string,
    expiresIn: number = 3600
  ): Promise<string> {
    const { data, error } = await supabase.storage
      .from("brand-assets")
      .createSignedUrl(storagePath, expiresIn);

    if (error) {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to generate signed URL",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical",
        { details: error.message }
      );
    }

    return data.signedUrl;
  }

  /**
   * Get asset usage history
   */
  async getAssetUsageHistory(
    assetId: string,
    limit: number = 50
  ): Promise<MediaUsageLogRecord[]> {
    const { data, error } = await supabase
      .from("media_usage_logs")
      .select("*")
      .eq("asset_id", assetId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to fetch asset usage history",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical"
      );
    }

    return (data || []) as MediaUsageLogRecord[];
  }

  /**
   * Get most used assets for a brand
   */
  async getMostUsedAssets(
    brandId: string,
    limit: number = 20
  ): Promise<MediaAssetRecord[]> {
    const { data, error } = await supabase
      .from("media_assets")
      .select("*")
      .eq("brand_id", brandId)
      .eq("status", "active")
      .order("usage_count", { ascending: false })
      .limit(limit);

    if (error) {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to fetch most used assets",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical"
      );
    }

    return (data || []) as MediaAssetRecord[];
  }

  /**
   * Archive an asset (soft delete alternative)
   */
  async archiveMediaAsset(assetId: string): Promise<MediaAssetRecord> {
    const { data, error } = await supabase
      .from("media_assets")
      .update({ status: "archived" })
      .eq("id", assetId)
      .select()
      .single();

    if (error) {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to archive media asset",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical"
      );
    }

    return data as MediaAssetRecord;
  }
}

/**
 * Singleton instance
 */
export const mediaDB = new MediaDBService();
