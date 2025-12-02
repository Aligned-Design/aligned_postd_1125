/**
 * Collaboration Storage Service
 *
 * Manages storage and retrieval of collaboration artifacts (StrategyBrief, ContentPackage, etc.)
 * Uses Supabase for persistence with in-memory cache for performance.
 */

import { supabase } from "./supabase";
import type {
  StrategyBrief,
  ContentPackage,
  BrandHistory,
  PerformanceLog,
} from "@shared/collaboration-artifacts";
import { AppError } from "./error-middleware";
import { ErrorCode, HTTP_STATUS } from "./error-responses";

// In-memory cache (TTL: 5 minutes)
const cache = new Map<string, { data: unknown; expires: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(type: string, id: string): string {
  return `${type}:${id}`;
}

function getCached<T>(key: string): T | null {
  const cached = cache.get(key);
  if (!cached) return null;
  if (Date.now() > cached.expires) {
    cache.delete(key);
    return null;
  }
  return cached.data as T;
}

function setCache(key: string, data: unknown): void {
  cache.set(key, {
    data,
    expires: Date.now() + CACHE_TTL,
  });
}

/**
 * StrategyBrief Storage
 */
export class StrategyBriefStorage {
  /**
   * Get latest StrategyBrief for a brand
   */
  static async getLatest(brandId: string): Promise<StrategyBrief | null> {
    const cacheKey = getCacheKey("strategy-brief", brandId);
    const cached = getCached<StrategyBrief>(cacheKey);
    if (cached) return cached;

    try {
      // Use brand_id_uuid (UUID) instead of brand_id (TEXT) - migration 005
      const { data, error } = await supabase
        .from("strategy_briefs")
        .select("*")
        .eq("brand_id_uuid", brandId) // UUID - primary identifier (migration 005)
        .order("updated_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") {
        throw new AppError(
          ErrorCode.DATABASE_ERROR,
          "Failed to fetch strategy brief",
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
          "error"
        );
      }

      if (!data) return null;

      // Prefer brand_id_uuid over brand_id (deprecated) - migration 005
      const brief: StrategyBrief = {
        id: data.id,
        brandId: data.brand_id_uuid || data.brand_id, // Prefer UUID, fallback to TEXT for backward compatibility
        version: data.version || "1.0.0",
        updatedAt: data.updated_at,
        positioning: data.positioning,
        voice: data.voice,
        visual: data.visual,
        competitive: data.competitive,
      };

      setCache(cacheKey, brief);
      return brief;
    } catch (error) {
      console.error("Error fetching strategy brief:", error);
      return null;
    }
  }

  /**
   * Save StrategyBrief
   */
  static async save(brief: StrategyBrief): Promise<StrategyBrief> {
    try {
      // Use brand_id_uuid (UUID) instead of brand_id (TEXT) - migration 005
      const { data, error } = await supabase
        .from("strategy_briefs")
        .upsert({
          id: brief.id,
          brand_id_uuid: brief.brandId, // UUID - primary identifier (migration 005)
          version: brief.version,
          updated_at: brief.updatedAt,
          positioning: brief.positioning,
          voice: brief.voice,
          visual: brief.visual,
          competitive: brief.competitive,
        })
        .select()
        .single();

      if (error) {
        throw new AppError(
          ErrorCode.DATABASE_ERROR,
          "Failed to save strategy brief",
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
          "error"
        );
      }

      // Prefer brand_id_uuid over brand_id (deprecated) - migration 005
      const saved: StrategyBrief = {
        id: data.id,
        brandId: data.brand_id_uuid || data.brand_id, // Prefer UUID, fallback to TEXT for backward compatibility
        version: data.version,
        updatedAt: data.updated_at,
        positioning: data.positioning,
        voice: data.voice,
        visual: data.visual,
        competitive: data.competitive,
      };

      // Update cache
      const cacheKey = getCacheKey("strategy-brief", brief.brandId);
      setCache(cacheKey, saved);

      return saved;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        "Failed to save strategy brief",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "error"
      );
    }
  }
}

/**
 * ContentPackage Storage
 */
export class ContentPackageStorage {
  /**
   * Get ContentPackage by ID
   */
  static async getById(packageId: string): Promise<ContentPackage | null> {
    const cacheKey = getCacheKey("content-package", packageId);
    const cached = getCached<ContentPackage>(cacheKey);
    if (cached) return cached;

    try {
      const { data, error } = await supabase
        .from("content_packages")
        .select("*")
        .eq("id", packageId)
        .single();

      if (error && error.code !== "PGRST116") {
        throw new AppError(
          ErrorCode.DATABASE_ERROR,
          "Failed to fetch content package",
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
          "error"
        );
      }

      if (!data) return null;

      // Prefer brand_id_uuid over brand_id (deprecated) - migration 005
      const pkg: ContentPackage = {
        id: data.id,
        brandId: data.brand_id_uuid || data.brand_id, // Prefer UUID, fallback to TEXT for backward compatibility
        contentId: data.content_id,
        platform: data.platform,
        status: data.status,
        copy: data.copy,
        designContext: data.design_context,
        collaborationLog: data.collaboration_log || [],
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        createdBy: data.created_by,
        requestId: data.request_id,
      };

      setCache(cacheKey, pkg);
      return pkg;
    } catch (error) {
      console.error("Error fetching content package:", error);
      return null;
    }
  }

  /**
   * Get ContentPackage by requestId
   */
  static async getByRequestId(requestId: string): Promise<ContentPackage | null> {
    try {
      const { data, error } = await supabase
        .from("content_packages")
        .select("*")
        .eq("request_id", requestId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") {
        throw new AppError(
          ErrorCode.DATABASE_ERROR,
          "Failed to fetch content package",
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
          "error"
        );
      }

      if (!data) return null;

      // Prefer brand_id_uuid over brand_id (deprecated) - migration 005
      const pkg: ContentPackage = {
        id: data.id,
        brandId: data.brand_id_uuid || data.brand_id, // Prefer UUID, fallback to TEXT for backward compatibility
        contentId: data.content_id,
        platform: data.platform,
        status: data.status,
        copy: data.copy,
        designContext: data.design_context,
        collaborationLog: data.collaboration_log || [],
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        createdBy: data.created_by,
        requestId: data.request_id,
      };

      return pkg;
    } catch (error) {
      console.error("Error fetching content package:", error);
      return null;
    }
  }

  /**
   * Save ContentPackage
   */
  static async save(pkg: ContentPackage): Promise<ContentPackage> {
    try {
      // Use brand_id_uuid (UUID) instead of brand_id (TEXT) - migration 005
      const { data, error } = await supabase
        .from("content_packages")
        .upsert({
          id: pkg.id,
          brand_id_uuid: pkg.brandId, // UUID - primary identifier (migration 005)
          content_id: pkg.contentId,
          platform: pkg.platform,
          status: pkg.status,
          copy: pkg.copy,
          design_context: pkg.designContext,
          visuals: pkg.visuals || [],
          collaboration_log: pkg.collaborationLog,
          created_at: pkg.createdAt,
          updated_at: pkg.updatedAt,
          created_by: pkg.createdBy,
          request_id: pkg.requestId,
        })
        .select()
        .single();

      if (error) {
        throw new AppError(
          ErrorCode.DATABASE_ERROR,
          "Failed to save content package",
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
          "error"
        );
      }

      // Prefer brand_id_uuid over brand_id (deprecated) - migration 005
      const saved: ContentPackage = {
        id: data.id,
        brandId: data.brand_id_uuid || data.brand_id, // Prefer UUID, fallback to TEXT for backward compatibility
        contentId: data.content_id,
        platform: data.platform,
        status: data.status,
        copy: data.copy,
        designContext: data.design_context,
        visuals: data.visuals || [],
        collaborationLog: data.collaboration_log || [],
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        createdBy: data.created_by,
        requestId: data.request_id,
      };

      // Update cache
      const cacheKey = getCacheKey("content-package", pkg.id);
      setCache(cacheKey, saved);

      return saved;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        "Failed to save content package",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "error"
      );
    }
  }

  /**
   * Append to collaboration log
   */
  static async appendLog(
    packageId: string,
    entry: ContentPackage["collaborationLog"][0]
  ): Promise<void> {
    const pkg = await this.getById(packageId);
    if (!pkg) {
      throw new AppError(
        ErrorCode.NOT_FOUND,
        "Content package not found",
        HTTP_STATUS.NOT_FOUND,
        "warning"
      );
    }

    pkg.collaborationLog.push(entry);
    pkg.updatedAt = new Date().toISOString();
    await this.save(pkg);
  }
}

/**
 * BrandHistory Storage
 */
export class BrandHistoryStorage {
  private static cache = new Map<string, BrandHistory>();

  static async get(brandId: string): Promise<BrandHistory | null> {
    const cacheKey = getCacheKey("brand-history", brandId);
    const cached = getCached<BrandHistory>(cacheKey);
    if (cached) return cached;

    // Try to fetch from database (if tables exist)
    // Use brand_id_uuid (UUID) instead of brand_id (TEXT) - migration 005
    try {
      const { data, error } = await supabase
        .from("brand_history")
        .select("*")
        .eq("brand_id_uuid", brandId) // UUID - primary identifier (migration 005)
        .single();

      if (error && error.code !== "PGRST116") {
        console.warn(`[BrandHistory] Error fetching from DB:`, error);
        return this.cache.get(brandId) || null;
      }

      if (data) {
        // Prefer brand_id_uuid over brand_id (deprecated) - migration 005
        const history: BrandHistory = {
          id: data.id,
          brandId: data.brand_id_uuid || data.brand_id, // Prefer UUID, fallback to TEXT for backward compatibility
          entries: data.entries || [],
          successPatterns: data.success_patterns || [],
          designFatigueAlerts: data.design_fatigue_alerts || [],
          constraints: data.constraints || [],
          lastUpdated: data.last_updated || new Date().toISOString(),
        };
        setCache(cacheKey, history);
        this.cache.set(brandId, history);
        return history;
      }
    } catch (error) {
      console.warn(`[BrandHistory] DB fetch failed, using cache:`, error);
    }

    return this.cache.get(brandId) || null;
  }

  static async save(history: BrandHistory): Promise<BrandHistory> {
    this.cache.set(history.brandId, history);
    const cacheKey = getCacheKey("brand-history", history.brandId);
    setCache(cacheKey, history);

    // Try to persist to database (if tables exist)
    // Use brand_id_uuid (UUID) instead of brand_id (TEXT) - migration 005
    try {
      const { error } = await supabase
        .from("brand_history")
        .upsert({
          id: history.id,
          brand_id_uuid: history.brandId, // UUID - primary identifier (migration 005)
          entries: history.entries,
          success_patterns: history.successPatterns,
          design_fatigue_alerts: history.designFatigueAlerts,
          constraints: history.constraints,
          last_updated: history.lastUpdated,
        });

      if (error) {
        console.warn(`[BrandHistory] Failed to persist to DB:`, error);
      }
    } catch (error) {
      console.warn(`[BrandHistory] DB save failed:`, error);
    }

    return history;
  }
}

/**
 * PerformanceLog Storage (simplified - uses cache only for now)
 */
export class PerformanceLogStorage {
  private static cache = new Map<string, PerformanceLog>();

  static async getLatest(brandId: string): Promise<PerformanceLog | null> {
    return this.cache.get(brandId) || null;
  }

  static async save(log: PerformanceLog): Promise<PerformanceLog> {
    this.cache.set(log.brandId, log);
    return log;
  }
}

