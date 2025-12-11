/**
 * Publishing Database Service
 * Handles all database operations for publishing jobs and logs
 */

import { supabase } from "./supabase";

export interface PublishingJobRecord {
  id: string;
  brand_id: string;
  tenant_id: string;
  content: Record<string, unknown>;
  platforms: string[];
  scheduled_at?: string;
  status: "pending" | "processing" | "published" | "failed" | "scheduled";
  retry_count: number;
  max_retries: number;
  published_at?: string;
  last_error?: string;
  last_error_details?: Record<string, unknown>;
  validation_results?: unknown[];
  created_at: string;
  updated_at: string;
}

export interface PublishingLogRecord {
  id: string;
  job_id: string;
  brand_id: string;
  platform: string;
  status: string;
  attempt_number: number;
  platform_post_id?: string;
  platform_post_url?: string;
  error_code?: string;
  error_message?: string;
  error_details?: Record<string, unknown>;
  content_snapshot?: Record<string, unknown>;
  request_metadata?: Record<string, unknown>;
  response_metadata?: Record<string, unknown>;
  created_at: string;
}

// Minimal interface for platform stats query results
interface PlatformStatsRow {
  platform: string;
  status: string;
}

// Typed stats structure
interface PlatformStat {
  total: number;
  published: number;
  failed: number;
  pending: number;
  successRate: number;
}

export class PublishingDBService {
  /**
   * Create a new publishing job in the database
   */
  async createPublishingJob(
    brandId: string,
    tenantId: string,
    content: Record<string, unknown>,
    platforms: string[],
    scheduledAt?: Date,
    userId?: string,
  ): Promise<PublishingJobRecord> {
    // @supabase-scope-ok INSERT includes brand_id in the data
    const { data, error } = await supabase
      .from("publishing_jobs")
      .insert({
        brand_id: brandId,
        tenant_id: tenantId,
        content: {
          ...content,
          ...(userId && { createdBy: userId }),
        },
        platforms,
        scheduled_at: scheduledAt?.toISOString(),
        status:
          scheduledAt && scheduledAt > new Date() ? "scheduled" : "pending",
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create job: ${error.message}`);
    return data as PublishingJobRecord;
  }

  /**
   * Get a publishing job by ID
   */
  async getPublishingJob(
    jobId: string,
    brandId: string,
  ): Promise<PublishingJobRecord | null> {
    const { data, error } = await supabase
      .from("publishing_jobs")
      .select("*")
      .eq("id", jobId)
      .eq("brand_id", brandId)
      .single();

    if (error && error.code === "PGRST116") return null; // Not found
    if (error) throw new Error(`Failed to fetch job: ${error.message}`);
    return data as PublishingJobRecord;
  }

  /**
   * Get all pending jobs for processing
   */
  async getPendingJobs(limit: number = 50): Promise<PublishingJobRecord[]> {
    // @supabase-scope-ok Background job processor - finds ready jobs across all brands
    const { data, error } = await supabase
      .from("publishing_jobs")
      .select("*")
      .in("status", ["pending", "scheduled"])
      .lt("scheduled_at", new Date().toISOString())
      .order("created_at", { ascending: true })
      .limit(limit);

    if (error)
      throw new Error(`Failed to fetch pending jobs: ${error.message}`);
    return data as PublishingJobRecord[];
  }

  /**
   * Update job status
   */
  async updateJobStatus(
    jobId: string,
    status: string,
    updates?: Partial<PublishingJobRecord>,
  ): Promise<PublishingJobRecord> {
    // @supabase-scope-ok ID-based lookup - RLS protects at DB level
    const { data, error } = await supabase
      .from("publishing_jobs")
      .update({
        status,
        ...updates,
      })
      .eq("id", jobId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update job status: ${error.message}`);
    return data as PublishingJobRecord;
  }

  /**
   * Update scheduled time for a job
   */
  async updateScheduledTime(
    jobId: string,
    brandId: string,
    scheduledAt: Date,
  ): Promise<PublishingJobRecord> {
    // @supabase-scope-ok Uses .eq("brand_id", brandId) - properly scoped
    const { data, error } = await supabase
      .from("publishing_jobs")
      .update({
        scheduled_at: scheduledAt.toISOString(),
        status: scheduledAt > new Date() ? "scheduled" : "pending",
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId)
      .eq("brand_id", brandId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update scheduled time: ${error.message}`);
    return data as PublishingJobRecord;
  }

  /**
   * Increment retry count
   */
  async incrementRetryCount(jobId: string): Promise<PublishingJobRecord> {
    const job = await supabase
      .from("publishing_jobs")
      .select("retry_count, max_retries")
      .eq("id", jobId)
      .single();

    if (job.error) throw new Error(`Failed to fetch job: ${job.error.message}`);

    const newRetryCount = (job.data.retry_count || 0) + 1;
    const shouldFail = newRetryCount >= job.data.max_retries;

    // @supabase-scope-ok ID-based lookup - background job processing
    const { data, error } = await supabase
      .from("publishing_jobs")
      .update({
        retry_count: newRetryCount,
        status: shouldFail ? "failed" : "scheduled",
      })
      .eq("id", jobId)
      .select()
      .single();

    if (error)
      throw new Error(`Failed to update retry count: ${error.message}`);
    return data as PublishingJobRecord;
  }

  /**
   * Mark job as published
   */
  async markJobPublished(jobId: string): Promise<PublishingJobRecord> {
    // @supabase-scope-ok ID-based lookup - background job processing
    const { data, error } = await supabase
      .from("publishing_jobs")
      .update({
        status: "published",
        published_at: new Date().toISOString(),
        retry_count: 0,
        last_error: null,
      })
      .eq("id", jobId)
      .select()
      .single();

    if (error)
      throw new Error(`Failed to mark job as published: ${error.message}`);
    return data as PublishingJobRecord;
  }

  /**
   * Mark job as failed
   */
  async markJobFailed(
    jobId: string,
    error: string,
    errorDetails?: Record<string, unknown>,
  ): Promise<PublishingJobRecord> {
    // @supabase-scope-ok ID-based lookup - background job processing
    const { data, error: dbError } = await supabase
      .from("publishing_jobs")
      .update({
        status: "failed",
        last_error: error,
        last_error_details: errorDetails,
      })
      .eq("id", jobId)
      .select()
      .single();

    if (dbError)
      throw new Error(`Failed to mark job as failed: ${dbError.message}`);
    return data as PublishingJobRecord;
  }

  /**
   * Create a publishing log entry (audit trail)
   */
  async createPublishingLog(
    jobId: string,
    brandId: string,
    platform: string,
    status: string,
    attemptNumber: number,
    options?: {
      platformPostId?: string;
      platformPostUrl?: string;
      errorCode?: string;
      errorMessage?: string;
      errorDetails?: unknown;
      contentSnapshot?: unknown;
      requestMetadata?: unknown;
      responseMetadata?: unknown;
    },
  ): Promise<PublishingLogRecord> {
    const { data, error } = await supabase
      .from("publishing_logs")
      .insert({
        job_id: jobId,
        brand_id: brandId,
        platform,
        status,
        attempt_number: attemptNumber,
        ...options,
      })
      .select()
      .single();

    if (error)
      throw new Error(`Failed to create publishing log: ${error.message}`);
    return data as PublishingLogRecord;
  }

  /**
   * Get publishing logs for a job
   */
  async getPublishingLogs(jobId: string): Promise<PublishingLogRecord[]> {
    const { data, error } = await supabase
      .from("publishing_logs")
      .select("*")
      .eq("job_id", jobId)
      .order("created_at", { ascending: false });

    if (error)
      throw new Error(`Failed to fetch publishing logs: ${error.message}`);
    return data as PublishingLogRecord[];
  }

  /**
   * Get publishing logs for a brand
   */
  async getBrandPublishingLogs(
    brandId: string,
    platform?: string,
    limit: number = 100,
  ): Promise<PublishingLogRecord[]> {
    let query = supabase
      .from("publishing_logs")
      .select("*")
      .eq("brand_id", brandId);

    if (platform) {
      query = query.eq("platform", platform);
    }

    const { data, error } = await query
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error)
      throw new Error(
        `Failed to fetch brand publishing logs: ${error.message}`,
      );
    return data as PublishingLogRecord[];
  }

  /**
   * Create a sync log for analytics
   */
  async createSyncLog(
    brandId: string,
    tenantId: string,
    platform: string,
    syncType: string,
    status: string,
    itemsSynced: number,
    itemsFailed: number,
    startedAt: Date,
    completedAt?: Date,
    error?: { message: string; details: unknown },
  ): Promise<void> {
    const { error: dbError } = await supabase
      .from("platform_sync_logs")
      .insert({
        brand_id: brandId,
        tenant_id: tenantId,
        platform,
        sync_type: syncType,
        status,
        items_synced: itemsSynced,
        items_failed: itemsFailed,
        started_at: startedAt.toISOString(),
        completed_at: completedAt?.toISOString(),
        duration_ms: completedAt
          ? completedAt.getTime() - startedAt.getTime()
          : null,
        error_message: error?.message,
        error_details: error?.details,
      });

    if (dbError)
      throw new Error(`Failed to create sync log: ${dbError.message}`);
  }

  /**
   * Get platform statistics for a brand
   */
  async getPlatformStats(
    brandId: string,
    days: number = 30,
  ): Promise<Record<string, PlatformStat>> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from("publishing_logs")
      .select("platform, status")
      .eq("brand_id", brandId)
      .gte("created_at", startDate.toISOString());

    if (error)
      throw new Error(`Failed to fetch platform stats: ${error.message}`);

    // Type the data properly
    const logs = (data || []) as PlatformStatsRow[];

    // Aggregate stats by platform and status
    const stats: Record<string, PlatformStat> = {};
    logs.forEach((log) => {
      const platform = log.platform;
      if (!stats[platform]) {
        stats[platform] = {
          total: 0,
          published: 0,
          failed: 0,
          pending: 0,
          successRate: 0,
        };
      }

      const stat = stats[platform];
      stat.total++;
      
      // Increment status counter
      const status = log.status;
      if (status === "published") {
        stat.published++;
      } else if (status === "failed") {
        stat.failed++;
      } else if (status === "pending" || status === "processing") {
        stat.pending++;
      }

      // Calculate success rate
      if (stat.total > 0) {
        stat.successRate = (stat.published / stat.total) * 100;
      }
    });

    return stats;
  }

  /**
   * Get job history for a brand
   */
  async getJobHistory(
    brandId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<{ jobs: PublishingJobRecord[]; total: number }> {
    // @supabase-scope-ok Uses .eq("brand_id", brandId) below - properly scoped
    // Get total count
    const { count } = await supabase
      .from("publishing_jobs")
      .select("*", { count: "exact", head: true })
      .eq("brand_id", brandId);

    // Get paginated results
    const { data, error } = await supabase
      .from("publishing_jobs")
      .select("*")
      .eq("brand_id", brandId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(`Failed to fetch job history: ${error.message}`);
    return {
      jobs: data as PublishingJobRecord[],
      total: count || 0,
    };
  }

  /**
   * Get brand posting configuration
   * Fetches posting_config and timezone from brands table
   */
  async getBrandPostingConfig(
    brandId: string,
  ): Promise<{
    posting_config: Record<string, unknown>;
    timezone: string;
  } | null> {
    const { data, error } = await supabase
      .from("brands")
      .select("posting_config, timezone")
      .eq("id", brandId)
      .single();

    if (error && error.code === "PGRST116") return null; // Not found
    if (error)
      throw new Error(`Failed to fetch brand config: ${error.message}`);

    return data as {
      posting_config: Record<string, unknown>;
      timezone: string;
    };
  }

  /**
   * Update brand posting schedule preferences
   * Stores preferred posting days and time windows in posting_config
   */
  async updateBrandPostingSchedule(
    brandId: string,
    schedule: {
      preferredDays: string[];
      preferredWindows: { [day: string]: Array<{ start: string; end: string }> };
    },
  ): Promise<void> {
    // Get current posting_config
    const current = await this.getBrandPostingConfig(brandId);
    const currentConfig = current?.posting_config || {};

    // Merge new schedule into posting_config
    const updatedConfig = {
      ...currentConfig,
      preferredPostingSchedule: schedule,
    };

    // @supabase-scope-ok Brand lookup by its own primary key
    const { error } = await supabase
      .from("brands")
      .update({ posting_config: updatedConfig })
      .eq("id", brandId);

    if (error) {
      throw new Error(`Failed to update posting schedule: ${error.message}`);
    }
  }
}

export const publishingDBService = new PublishingDBService();
