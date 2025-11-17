/**
 * PHASE 6: Complete Media Management Service
 * Handles upload, processing, tagging, deduplication, and asset management
 */

import { supabase } from "./supabase";
import { aiMetricsService } from "./ai-metrics";
import crypto from "crypto";
import sharp from "sharp";
import Anthropic from "@anthropic-ai/sdk";
import { MediaAsset, MediaCategory, MediaVariant } from "@shared/media";

export interface UploadProgress {
  fileIndex: number;
  totalFiles: number;
  percentComplete: number;
  currentFile: string;
  status: "uploading" | "processing" | "tagging" | "complete" | "error";
  error?: string;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingAsset?: MediaAsset;
  similarity: number; // 0-1 score
  hash: string;
}

interface ProcessingMetrics {
  startTime: number;
  uploadTime: number;
  processingTime: number;
  aiTaggingTime: number;
  totalTime: number;
}

class MediaService {
  private claude = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  private assetHashes = new Map<string, string>(); // brandId:hash -> assetId for quick lookup

  /**
   * Check storage quota for brand
   */
  private async checkStorageQuota(
    brandId: string,
    fileSize: number,
  ): Promise<{ allowed: boolean; message: string; percentUsed?: number }> {
    try {
      // Get quota settings
      const { data: quota, error: quotaError } = await supabase
        .from("storage_quotas")
        .select("limit_bytes, warning_threshold_percent, hard_limit_percent")
        .eq("brand_id", brandId)
        .limit(1);

      if (quotaError || !quota || quota.length === 0) {
        // Default quota: 5GB
        const limitBytes = 5 * 1024 * 1024 * 1024;
        const currentUsage = await this.getBrandStorageUsage(brandId);
        const newTotal = currentUsage + fileSize;
        const percentUsed = (newTotal / limitBytes) * 100;

        if (percentUsed > 100) {
          return {
            allowed: false,
            message: `Storage quota exceeded. Current: ${this.formatBytes(currentUsage)}, Limit: ${this.formatBytes(limitBytes)}`,
            percentUsed,
          };
        }

        return {
          allowed: true,
          message: `Within quota. Usage: ${percentUsed.toFixed(1)}%`,
          percentUsed,
        };
      }

      const quotaEntry = quota[0];
      const limitBytes = quotaEntry.limit_bytes;
      const hardLimit = quotaEntry.hard_limit_percent || 100;

      const currentUsage = await this.getBrandStorageUsage(brandId);
      const newTotal = currentUsage + fileSize;
      const percentUsed = (newTotal / limitBytes) * 100;

      if (percentUsed > hardLimit) {
        return {
          allowed: false,
          message: `Hard storage limit exceeded (${hardLimit}%). Current: ${this.formatBytes(currentUsage)}, New total: ${this.formatBytes(newTotal)}, Limit: ${this.formatBytes(limitBytes)}`,
          percentUsed,
        };
      }

      if (percentUsed > 80) {
        console.warn(
          `⚠️ Storage warning for brand ${brandId}: ${percentUsed.toFixed(1)}% usage`,
        );
      }

      return {
        allowed: true,
        message: `Within quota. Usage: ${percentUsed.toFixed(1)}%`,
        percentUsed,
      };
    } catch (error) {
      console.warn("Quota check failed, allowing upload:", error);
      return {
        allowed: true,
        message: "Quota check unavailable, proceeding with upload",
      };
    }
  }

  /**
   * Get current storage usage for a brand
   */
  private async getBrandStorageUsage(brandId: string): Promise<number> {
    const { data, error } = await supabase
      .from("media_assets")
      .select("file_size")
      .eq("brand_id", brandId)
      .eq("status", "active");

    if (error || !data) return 0;

    return data.reduce(
      (sum: number, row: any) =>
        sum + (typeof row.file_size === "number" ? row.file_size : 0),
      0,
    );
  }

  /**
   * Format bytes to human-readable string
   */
  private formatBytes(bytes: number): string {
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  /**
   * Upload media file with automatic processing
   */
  async uploadMedia(
    file: Buffer,
    filename: string,
    mimeType: string,
    brandId: string,
    tenantId: string,
    category: MediaCategory,
    onProgress?: (progress: UploadProgress) => void,
  ): Promise<MediaAsset> {
    const startTime = Date.now();
    const uploadStartTime = Date.now();

    try {
      // 0. Check storage quota
      const quotaCheck = await this.checkStorageQuota(brandId, file.length);
      if (!quotaCheck.allowed) {
        throw new Error(`Storage quota exceeded: ${quotaCheck.message}`);
      }

      // 1. Calculate hash for duplicate detection
      const hash = crypto.createHash("sha256").update(file).digest("hex");

      // Check for exact duplicates
      const isDuplicate = await this.checkDuplicate(hash, brandId);
      if (isDuplicate.isDuplicate && isDuplicate.existingAsset) {
        return isDuplicate.existingAsset;
      }

      // 2. Upload original to Supabase
      const bucketName = `tenant-${tenantId}`;
      const assetPath = `${brandId}/${category}/${Date.now()}-${filename}`;

      onProgress?.({
        fileIndex: 0,
        totalFiles: 1,
        percentComplete: 20,
        currentFile: filename,
        status: "uploading",
      });

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(assetPath, file, {
          contentType: mimeType,
          cacheControl: "31536000", // 1 year
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      const __uploadTime = Date.now() - uploadStartTime;
      const processingStartTime = Date.now();

      // 3. Generate variants for images
      const variants: MediaVariant[] = [];
      if (mimeType.startsWith("image/")) {
        onProgress?.({
          fileIndex: 0,
          totalFiles: 1,
          percentComplete: 40,
          currentFile: filename,
          status: "processing",
        });

        variants.push(
          ...(await this.generateImageVariants(
            file,
            filename,
            brandId,
            tenantId,
            bucketName,
          )),
        );
      }

      // 4. Extract metadata
      const metadata = await this.extractMetadata(
        file,
        mimeType,
        filename,
        brandId,
      );

      const metadataObj =
        metadata && typeof metadata === "object"
          ? (metadata as Record<string, unknown>)
          : {};

      // 5. AI Auto-tagging
      onProgress?.({
        fileIndex: 0,
        totalFiles: 1,
        percentComplete: 70,
        currentFile: filename,
        status: "tagging",
      });

      const aiTaggingStartTime = Date.now();
      const aiTags = await this.generateAITags(file, mimeType, filename);
      const aiTaggingTime = Date.now() - aiTaggingStartTime;

      const __processingTime = Date.now() - processingStartTime;

      // 6. Create asset record
      const asset: MediaAsset = {
        id: crypto.randomUUID(),
        brandId,
        tenantId,
        category,
        filename,
        originalName: filename,
        mimeType,
        bucketPath: assetPath,
        size: file.length,
        hash,
        thumbnailPath: variants.find((v) => v.size === "thumbnail")?.path,
        metadata: {
          width: (typeof metadataObj.width === 'number' ? metadataObj.width : 0),
          height: (typeof metadataObj.height === 'number' ? metadataObj.height : 0),
          ...metadataObj,
          aiTags,
          usageCount: 0,
          usedIn: [],
          keywords: [],
        },
        tags: aiTags,
        variants,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // 7. Store in database
      await this.storeAssetRecord(asset);
      this.assetHashes.set(`${brandId}:${hash}`, asset.id);

      // 8. Record metrics
      const totalTime = Date.now() - startTime;
      aiMetricsService.recordMetric({
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        brandId,
        agentType: "doc",
        provider: "claude",
        totalDuration: totalTime,
        providerLatency: aiTaggingTime,
        bfsCalculationTime: 0,
        linterCheckTime: 0,
        contentLength: file.length,
        bfsScore: 1,
        linterPassed: true,
        complianceIssuesCount: 0,
        success: true,
        inputLength: filename.length,
        regenerationAttempt: 0,
      });

      onProgress?.({
        fileIndex: 0,
        totalFiles: 1,
        percentComplete: 100,
        currentFile: filename,
        status: "complete",
      });

      return asset;
    } catch (error) {
      onProgress?.({
        fileIndex: 0,
        totalFiles: 1,
        percentComplete: 0,
        currentFile: filename,
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Generate image variants (thumbnails at different sizes)
   */
  private async generateImageVariants(
    file: Buffer,
    filename: string,
    brandId: string,
    tenantId: string,
    bucketName: string,
  ): Promise<MediaVariant[]> {
    const variants: MediaVariant[] = [];
    const sizes = {
      thumbnail: { width: 150, height: 150 },
      small: { width: 400, height: 400 },
      medium: { width: 800, height: 800 },
      large: { width: 1200, height: 1200 },
    };

    const image = sharp(file);
    const __imageMetadata = await image.metadata();

    for (const [sizeName, dimensions] of Object.entries(sizes)) {
      try {
        const resized = await sharp(file)
          .resize(dimensions.width, dimensions.height, {
            fit: "inside",
            withoutEnlargement: true,
          })
          .jpeg({ quality: 85 })
          .toBuffer();

        const variantPath = `${brandId}/variants/${sizeName}/${Date.now()}-${filename}`;

        const { error } = await supabase.storage
          .from(bucketName)
          .upload(variantPath, resized, {
            contentType: "image/jpeg",
            cacheControl: "31536000",
          });

        if (!error) {
          const resizedMetadata = await sharp(resized).metadata();
          variants.push({
            size: sizeName as any,
            width: resizedMetadata.width || dimensions.width,
            height: resizedMetadata.height || dimensions.height,
            path: variantPath,
            fileSize: resized.length,
          });
        }
      } catch (err) {
        console.warn(`Failed to generate ${sizeName} variant:`, err);
      }
    }

    return variants;
  }

  /**
   * Extract metadata (EXIF, dimensions, etc) with privacy scrubbing
   */
  private async extractMetadata(
    file: Buffer,
    mimeType: string,
    filename: string,
    brandId: string,
  ): Promise<unknown> {
    try {
      if (mimeType.startsWith("image/")) {
        const metadata = await sharp(file).metadata();

        // Privacy scrubbing - remove PII from EXIF
        const safeMetadata = {
          width: metadata.width,
          height: metadata.height,
          format: metadata.format,
          colorspace: metadata.space,
          hasAlpha: metadata.hasAlpha,
          isProgressive: metadata.isProgressive,
          density: metadata.density,
          chromaSubsampling: metadata.chromaSubsampling,
          // DO NOT INCLUDE: exif with GPS, camera serial, etc
          // These are privacy risks
        };

        return safeMetadata;
      } else if (mimeType.startsWith("video/")) {
        return {
          type: "video",
          format: filename.split(".").pop(),
          size: file.length,
          // Video codec/duration would require ffprobe
        };
      }

      return { type: mimeType };
    } catch (error) {
      console.warn("Metadata extraction failed:", error);
      return {};
    }
  }

  /**
   * Generate AI tags using Claude Vision API
   */
  private async generateAITags(
    file: Buffer,
    mimeType: string,
    filename: string,
  ): Promise<string[]> {
    try {
      if (!mimeType.startsWith("image/")) {
        return ["document"];
      }

      // Convert buffer to base64 for Claude
      const base64 = file.toString("base64");

      const response = await this.claude.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 200,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mimeType as
                    | "image/jpeg"
                    | "image/png"
                    | "image/gif"
                    | "image/webp",
                  data: base64,
                },
              },
              {
                type: "text",
                text: `Analyze this image and provide a JSON array of 5-8 descriptive tags.
                Return ONLY a valid JSON array like ["tag1", "tag2", ...].
                Include: subject matter, colors, style, objects, mood.
                Do NOT include personal information or sensitive details.`,
              },
            ],
          },
        ],
      });

      const content = response.content[0];
      if (content.type === "text") {
        try {
          const tags = JSON.parse(content.text);
          return Array.isArray(tags) ? tags.slice(0, 8) : [];
        } catch {
          return [];
        }
      }

      return [];
    } catch (error) {
      console.warn("AI tagging failed:", error);
      return [];
    }
  }

  /**
   * Check for duplicate files
   */
  private async checkDuplicate(
    hash: string,
    brandId: string,
  ): Promise<DuplicateCheckResult> {
    // Quick lookup in memory cache
    const cachedId = this.assetHashes.get(`${brandId}:${hash}`);
    if (cachedId) {
      const existingAsset = await this.getAssetById(cachedId);
      return {
        isDuplicate: true,
        existingAsset: existingAsset || undefined,
        similarity: 1.0,
        hash,
      };
    }

    // Check database
    const { data, error } = await supabase
      .from("media_assets")
      .select("*")
      .eq("brandId", brandId)
      .eq("hash", hash)
      .limit(1);

    if (!error && data && data.length > 0) {
      return {
        isDuplicate: true,
        existingAsset: data[0] as MediaAsset,
        similarity: 1.0,
        hash,
      };
    }

    return {
      isDuplicate: false,
      similarity: 0,
      hash,
    };
  }

  /**
   * Store asset record in database
   */
  private async storeAssetRecord(asset: MediaAsset): Promise<void> {
    const { error } = await supabase.from("media_assets").insert([
      {
        id: asset.id,
        brand_id: asset.brandId,
        tenant_id: asset.tenantId,
        category: asset.category,
        filename: asset.filename,
        mime_type: asset.mimeType,
        path: asset.bucketPath,
        file_size: asset.size,
        hash: asset.hash,
        url: `${process.env.SUPABASE_URL}/storage/v1/object/public/tenant-${asset.tenantId}/${asset.bucketPath}`,
        thumbnail_url: asset.thumbnailPath,
        status: "active",
        metadata: asset.metadata,
        variants: asset.variants,
        used_in: asset.metadata.usedIn || [],
        usage_count: asset.metadata.usageCount || 0,
        created_at: asset.createdAt,
        updated_at: asset.updatedAt,
      },
    ]);

    if (error) {
      throw new Error(`Failed to store asset: ${error.message}`);
    }
  }

  /**
   * Get asset by ID (public for testing and internal use)
   */
  async getAssetById(assetId: string): Promise<MediaAsset | null> {
    const { data, error } = await supabase
      .from("media_assets")
      .select("*")
      .eq("id", assetId)
      .limit(1);

    if (error || !data || data.length === 0) {
      return null;
    }

    return this.mapAssetRow(data[0]);
  }

  /**
   * List assets with filtering and search
   */
  async listAssets(
    brandId: string,
    filters: {
      category?: MediaCategory;
      search?: string;
      tags?: string[];
      limit?: number;
      offset?: number;
      sortBy?: "created" | "name" | "size" | "usage";
      sortOrder?: "asc" | "desc";
    },
  ): Promise<{ assets: MediaAsset[]; total: number }> {
    let query = supabase
      .from("media_assets")
      .select("*", { count: "exact" })
      .eq("brand_id", brandId)
      .eq("status", "active");

    if (filters.category) {
      query = query.eq("category", filters.category);
    }

    if (filters.search) {
      query = query.or(
        `filename.ilike.%${filters.search}%,metadata->aiTags.cs.["${filters.search}"]`,
      );
    }

    if (filters.tags && filters.tags.length > 0) {
      // Filter by tags
      query = query.filter(
        "metadata->aiTags",
        "cs",
        JSON.stringify(filters.tags),
      );
    }

    // Sort
    const sortColumn =
      filters.sortBy === "usage"
        ? "usage_count"
        : filters.sortBy || "created_at";
    query = query.order(sortColumn, { ascending: filters.sortOrder === "asc" });

    // Pagination
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to list assets: ${error.message}`);
    }

    const assets = (data || []).map((row) => this.mapAssetRow(row));

    return {
      assets,
      total: count || 0,
    };
  }

  /**
   * Search assets by tag
   */
  async searchByTag(
    brandId: string,
    tags: string[],
    limit: number = 50,
  ): Promise<MediaAsset[]> {
    const { data, error } = await supabase
      .from("media_assets")
      .select("*")
      .eq("brand_id", brandId)
      .eq("status", "active")
      .limit(limit);

    if (error) {
      throw new Error(`Search failed: ${error.message}`);
    }

    // Filter in-memory for tag matching (until we add full-text search)
    return (data || [])
      .filter((row) => {
        const assetTags = row.metadata?.aiTags || [];
        return tags.some((tag) =>
          assetTags.some((aTag: string) =>
            aTag.toLowerCase().includes(tag.toLowerCase()),
          ),
        );
      })
      .map((row) => this.mapAssetRow(row));
  }

  /**
   * Delete asset with cleanup
   */
  async deleteAsset(assetId: string, brandId: string): Promise<void> {
    const asset = await this.getAssetById(assetId);
    if (!asset || asset.brandId !== brandId) {
      throw new Error("Asset not found");
    }

    const bucketName = `tenant-${asset.tenantId}`;

    // Delete variants
    for (const variant of asset.variants) {
      await supabase.storage.from(bucketName).remove([variant.path]);
    }

    // Delete original
    await supabase.storage.from(bucketName).remove([asset.bucketPath]);

    // Mark as deleted in database
    await supabase
      .from("media_assets")
      .update({ status: "deleted" })
      .eq("id", assetId);

    // Remove from cache
    this.assetHashes.delete(`${brandId}:${asset.hash}`);
  }

  /**
   * Get storage usage for brand
   */
  async getStorageUsage(brandId: string): Promise<{
    total: number;
    byCategory: Record<MediaCategory, number>;
    assetCount: number;
    percentUsed: number;
    limit: number;
  }> {
    const { data, error } = await supabase
      .from("media_assets")
      .select("file_size, category")
      .eq("brand_id", brandId)
      .eq("status", "active");

    if (error) {
      throw new Error(`Failed to get storage usage: ${error.message}`);
    }

    const byCategory: Record<string, number> = {};
    let total = 0;

    for (const row of data || []) {
      total += row.file_size;
      byCategory[row.category] =
        (byCategory[row.category] || 0) + row.file_size;
    }

    const limit = 5 * 1024 * 1024 * 1024; // 5GB default

    return {
      total,
      byCategory: byCategory as any,
      assetCount: data?.length || 0,
      percentUsed: (total / limit) * 100,
      limit,
    };
  }

  /**
   * Track asset usage
   */
  async trackAssetUsage(
    assetId: string,
    usedIn: string,
    brandId: string,
  ): Promise<void> {
    const asset = await this.getAssetById(assetId);
    if (!asset || asset.brandId !== brandId) {
      throw new Error("Asset not found");
    }

    const usedInArray = asset.metadata.usedIn || [];
    if (!usedInArray.includes(usedIn)) {
      usedInArray.push(usedIn);
    }

    const updatedMetadata = {
      ...asset.metadata,
      usedIn: usedInArray,
      usageCount: (asset.metadata.usageCount || 0) + 1,
    };

    await supabase
      .from("media_assets")
      .update({
        metadata: updatedMetadata,
        last_used: new Date().toISOString(),
        usage_count: updatedMetadata.usageCount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", assetId);
  }

  /**
   * Map database row to MediaAsset
   */
  private mapAssetRow(row: any): MediaAsset {
    const meta =
      row && row.metadata && typeof row.metadata === "object"
        ? row.metadata
        : {};
    return {
      id: row.id,
      brandId: row.brand_id,
      tenantId: row.tenant_id,
      category: row.category,
      filename: row.filename,
      originalName: row.filename,
      mimeType: row.mime_type,
      bucketPath: row.path,
      size: row.file_size,
      hash: row.hash,
      thumbnailPath: row.thumbnail_url,
      tags: meta.aiTags || [],
      metadata: {
        width: meta.width || 0,
        height: meta.height || 0,
        keywords: meta.keywords || [],
        aiTags: meta.aiTags || [],
        usedIn: row.used_in || [],
        usageCount: row.usage_count || 0,
        ...meta,
      },
      variants: row.variants || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const mediaService = new MediaService();
