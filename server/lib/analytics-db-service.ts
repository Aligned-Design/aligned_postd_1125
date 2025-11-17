/**
 * Analytics Database Service
 * Handles all database operations for analytics metrics and insights
 */

import { supabase } from "./supabase";
import { analyticsCache, AnalyticsCache } from "./analytics-cache";

export interface AnalyticsMetrics {
  reach?: number;
  engagement?: number;
  followers?: number;
  engagementRate?: number;
  impressions?: number;
  [key: string]: unknown;
}

export interface AnalyticsMetricRecord {
  id: string;
  brand_id: string;
  tenant_id: string;
  platform: string;
  post_id?: string;
  date: string;
  metrics: AnalyticsMetrics;
  metadata: unknown;
  created_at: string;
  updated_at: string;
}

export interface SyncLogRecord {
  id: string;
  brand_id: string;
  tenant_id: string;
  platform: string;
  sync_type: string;
  status: string;
  items_synced: number;
  items_failed: number;
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
  error_message?: string;
  error_details?: unknown;
  created_at: string;
}

export class AnalyticsDBService {
  /**
   * Get metrics for a brand within a date range
   */
  async getMetricsByDateRange(
    brandId: string,
    platform?: string,
    startDate?: string,
    endDate?: string,
    limit: number = 1000,
  ): Promise<AnalyticsMetricRecord[]> {
    let query = supabase
      .from("analytics_metrics")
      .select("*")
      .eq("brand_id", brandId)
      .order("date", { ascending: false })
      .limit(limit);

    if (platform) {
      query = query.eq("platform", platform);
    }

    if (startDate) {
      query = query.gte("date", startDate);
    }

    if (endDate) {
      query = query.lte("date", endDate);
    }

    const { data, error } = await query;

    if (error) throw new Error(`Failed to fetch metrics: ${error.message}`);
    return data as AnalyticsMetricRecord[];
  }

  /**
   * Get latest metrics for each platform
   */
  async getLatestMetrics(
    brandId: string,
  ): Promise<Record<string, AnalyticsMetricRecord>> {
    const { data, error } = await supabase
      .from("analytics_metrics")
      .select("*")
      .eq("brand_id", brandId)
      .order("date", { ascending: false });

    if (error)
      throw new Error(`Failed to fetch latest metrics: ${error.message}`);

    // Get latest for each platform
    const latest: Record<string, AnalyticsMetricRecord> = {};
    (data as AnalyticsMetricRecord[]).forEach((metric) => {
      if (!latest[metric.platform]) {
        latest[metric.platform] = metric;
      }
    });

    return latest;
  }

  /**
   * Get aggregated metrics summary for a brand
   * Uses caching for performance
   */
  async getMetricsSummary(
    brandId: string,
    days: number = 30,
  ): Promise<{
    totalReach: number;
    totalEngagement: number;
    averageEngagementRate: number;
    totalFollowers: number;
    topPlatform: string;
    platformBreakdown: Record<string, unknown>;
  }> {
    // Check cache first
    const cacheKey = AnalyticsCache.key("metrics_summary", brandId, days);
    const cached = analyticsCache.get<{
      totalReach: number;
      totalEngagement: number;
      averageEngagementRate: number;
      totalFollowers: number;
      topPlatform: string;
      platformBreakdown: Record<string, unknown>;
    }>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split("T")[0];

    const metrics = await this.getMetricsByDateRange(
      brandId,
      undefined,
      startDateStr,
    );

    const summary = {
      totalReach: 0,
      totalEngagement: 0,
      totalFollowers: 0,
      averageEngagementRate: 0,
      topPlatform: "",
      platformBreakdown: {} as Record<
        string,
        { reach: number; engagement: number; posts: number }
      >,
    };

    let engagementRateSum = 0;
    let engagementRateCount = 0;

    metrics.forEach((metric) => {
      const m = metric.metrics || {};
      const reach = typeof m.reach === "number" ? m.reach : 0;
      const engagement = typeof m.engagement === "number" ? m.engagement : 0;
      const followers = typeof m.followers === "number" ? m.followers : 0;
      const engagementRate =
        typeof m.engagementRate === "number" ? m.engagementRate : undefined;

      summary.totalReach += reach;
      summary.totalEngagement += engagement;
      summary.totalFollowers = Math.max(summary.totalFollowers, followers);

      if (engagementRate !== undefined) {
        engagementRateSum += engagementRate;
        engagementRateCount++;
      }

      // Platform breakdown
      if (!summary.platformBreakdown[metric.platform]) {
        summary.platformBreakdown[metric.platform] = {
          reach: 0,
          engagement: 0,
          posts: 0,
        };
      }

      summary.platformBreakdown[metric.platform].reach += reach;
      summary.platformBreakdown[metric.platform].engagement += engagement;
      summary.platformBreakdown[metric.platform].posts += 1;
    });

    if (engagementRateCount > 0) {
      summary.averageEngagementRate = engagementRateSum / engagementRateCount;
    }

    // Find top platform by engagement
    let maxEngagement = 0;
    Object.entries(summary.platformBreakdown).forEach(
      ([platform, data]: [string, any]) => {
        if (data.engagement > maxEngagement) {
          maxEngagement = data.engagement;
          summary.topPlatform = platform;
        }
      },
    );

    // Cache the result
    analyticsCache.set(cacheKey, summary);

    return summary;
  }

  /**
   * Get platform-specific statistics
   * Uses caching for performance
   */
  async getPlatformStats(
    brandId: string,
    platform: string,
    days: number = 30,
  ): Promise<{
    totalReach: number;
    totalEngagement: number;
    averageEngagementRate: number;
    posts: number;
    topPost?: AnalyticsMetricRecord;
  }> {
    // Check cache first
    const cacheKey = AnalyticsCache.key("platform_stats", brandId, platform, days);
    const cached = analyticsCache.get<{
      totalReach: number;
      totalEngagement: number;
      averageEngagementRate: number;
      posts: number;
      topPost?: AnalyticsMetricRecord;
    }>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split("T")[0];

    const metrics = await this.getMetricsByDateRange(
      brandId,
      platform,
      startDateStr,
    );

    let topPost: AnalyticsMetricRecord | undefined;
    let maxEngagement = 0;

    const stats = {
      totalReach: 0,
      totalEngagement: 0,
      averageEngagementRate: 0,
      posts: metrics.length,
      topPost,
    };

    let engagementRateSum = 0;

    metrics.forEach((metric) => {
      const m = metric.metrics || {};
      const reach = typeof m.reach === "number" ? m.reach : 0;
      const engagement = typeof m.engagement === "number" ? m.engagement : 0;
      const engagementRate =
        typeof m.engagementRate === "number" ? m.engagementRate : undefined;

      stats.totalReach += reach;
      stats.totalEngagement += engagement;

      if (engagementRate !== undefined) {
        engagementRateSum += engagementRate;
      }

      if (engagement > maxEngagement) {
        maxEngagement = engagement;
        topPost = metric;
      }
    });

    if (metrics.length > 0) {
      stats.averageEngagementRate = engagementRateSum / metrics.length;
    }

    stats.topPost = topPost;

    // Cache the result
    analyticsCache.set(cacheKey, stats);

    return stats;
  }

  /**
   * Log analytics sync
   */
  async logSync(
    brandId: string,
    tenantId: string,
    platform: string,
    syncType: string,
    status: string,
    itemsSynced: number,
    itemsFailed: number,
    startTime: Date,
    endTime?: Date,
    error?: { message: string; details: unknown },
  ): Promise<SyncLogRecord> {
    const { data, error: dbError } = await supabase
      .from("analytics_sync_logs")
      .insert({
        brand_id: brandId,
        tenant_id: tenantId,
        platform,
        sync_type: syncType,
        status,
        items_synced: itemsSynced,
        items_failed: itemsFailed,
        started_at: startTime.toISOString(),
        completed_at: endTime?.toISOString(),
        duration_ms: endTime
          ? endTime.getTime() - startTime.getTime()
          : undefined,
        error_message: error?.message,
        error_details: error?.details,
      })
      .select()
      .single();

    if (dbError) throw new Error(`Failed to log sync: ${dbError.message}`);
    return data as SyncLogRecord;
  }

  /**
   * Get recent sync logs for a brand
   */
  async getSyncLogs(
    brandId: string,
    limit: number = 50,
  ): Promise<SyncLogRecord[]> {
    const { data, error } = await supabase
      .from("analytics_sync_logs")
      .select("*")
      .eq("brand_id", brandId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw new Error(`Failed to fetch sync logs: ${error.message}`);
    return data as SyncLogRecord[];
  }

  /**
   * Create or update an analytics goal
   */
  async upsertGoal(
    brandId: string,
    tenantId: string,
    metric: string,
    target: number,
    deadline: Date,
    notes?: string,
  ): Promise<unknown> {
    const { data, error } = await supabase
      .from("analytics_goals")
      .upsert(
        {
          brand_id: brandId,
          tenant_id: tenantId,
          metric,
          target,
          deadline: deadline.toISOString(),
          notes,
          status: "active",
        },
        { onConflict: "brand_id,metric" },
      )
      .select()
      .single();

    if (error) throw new Error(`Failed to upsert goal: ${error.message}`);
    return data;
  }

  /**
   * Get goals for a brand
   */
  async getGoals(brandId: string): Promise<unknown[]> {
    const { data, error } = await supabase
      .from("analytics_goals")
      .select("*")
      .eq("brand_id", brandId)
      .eq("status", "active");

    if (error) throw new Error(`Failed to fetch goals: ${error.message}`);
    return data || [];
  }

  /**
   * Update goal progress
   */
  async updateGoalProgress(
    goalId: string,
    current: number,
    status?: string,
  ): Promise<unknown> {
    const { data, error } = await supabase
      .from("analytics_goals")
      .update({
        current,
        status: status || "in_progress",
      })
      .eq("id", goalId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update goal: ${error.message}`);
    return data;
  }

  /**
   * Log advisor feedback for learning system
   */
  async logFeedback(
    brandId: string,
    tenantId: string,
    insightId: string,
    category: string,
    type: string,
    feedback: "accepted" | "rejected" | "implemented",
    previousWeight: number,
    newWeight: number,
  ): Promise<unknown> {
    const { data, error } = await supabase
      .from("advisor_feedback")
      .insert({
        brand_id: brandId,
        tenant_id: tenantId,
        insight_id: insightId,
        category,
        type,
        feedback,
        previous_weight: previousWeight,
        new_weight: newWeight,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to log feedback: ${error.message}`);
    return data;
  }

  /**
   * Get average weights for insights (for learning)
   */
  async getAverageWeights(brandId: string): Promise<Record<string, number>> {
    const { data, error } = await supabase
      .from("advisor_feedback")
      .select("category, type, new_weight")
      .eq("brand_id", brandId);

    if (error) throw new Error(`Failed to fetch weights: ${error.message}`);

    const weights: Record<string, number> = {};
    (data || []).forEach((row: any) => {
      const key = `${row.category}_${row.type}`;
      weights[key] = row.new_weight;
    });

    return weights;
  }
}

export const analyticsDB = new AnalyticsDBService();
