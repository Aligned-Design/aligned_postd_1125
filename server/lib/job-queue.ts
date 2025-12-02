/**
 * Job Queue Service
 * 
 * Core support for scheduled content posting with retries and dead-letter handling.
 * Uses publishing_jobs table for persistence.
 */

import { supabase } from "./supabase";
import { publishingDBService } from "./publishing-db-service";
import type { PublishingJobRecord } from "./publishing-db-service";

export interface ScheduledJob {
  id: string;
  brandId: string;
  tenantId: string;
  content: any;
  platforms: string[];
  scheduledAt: Date;
  status: "scheduled" | "pending" | "processing" | "published" | "failed" | "cancelled";
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface JobQueueConfig {
  maxRetries?: number;
  retryDelayMs?: number;
  deadLetterAfterRetries?: number;
}

class JobQueueService {
  private config: Required<JobQueueConfig>;
  private processingInterval: NodeJS.Timeout | null = null;

  constructor(config: JobQueueConfig = {}) {
    this.config = {
      maxRetries: config.maxRetries || 3,
      retryDelayMs: config.retryDelayMs || 60000, // 1 minute
      deadLetterAfterRetries: config.deadLetterAfterRetries || 5,
    };
  }

  /**
   * Schedule content for posting at a specific time
   */
  async scheduleContent(
    brandId: string,
    tenantId: string,
    content: any,
    platforms: string[],
    scheduledAt: Date,
    userId?: string
  ): Promise<string> {
    const job = await publishingDBService.createPublishingJob(
      brandId,
      tenantId,
      content,
      platforms,
      scheduledAt,
      userId
    );

    console.log(`[JobQueue] Scheduled job ${job.id} for ${scheduledAt.toISOString()}`);
    return job.id;
  }

  /**
   * Get jobs that are ready to process (scheduledAt <= now)
   */
  async getReadyJobs(limit: number = 10): Promise<ScheduledJob[]> {
    const now = new Date().toISOString();
    
    const { data: jobs, error } = await supabase
      .from("publishing_jobs")
      .select("*")
      .eq("status", "scheduled")
      .lte("scheduled_at", now)
      .order("scheduled_at", { ascending: true })
      .limit(limit);

    if (error) {
      console.error("[JobQueue] Error fetching ready jobs:", error);
      return [];
    }

    return (jobs || []).map(this.mapJobRecord);
  }

  /**
   * Process a job (mark as processing, then publish)
   */
  async processJob(jobId: string, brandId?: string): Promise<void> {
    try {
      // Update status to processing
      await publishingDBService.updateJobStatus(jobId, "processing", {});

      // Get job details
      const job = await publishingDBService.getPublishingJob(jobId, brandId || "");
      if (!job) {
        throw new Error(`Job ${jobId} not found`);
      }

      // Import publishing queue to use existing platform publishing logic
      const { publishingQueue } = await import("./publishing-queue");
      
      // Convert database job to PublishingJob format
      const publishingJob = {
        id: job.id,
        brandId: job.brand_id,
        tenantId: job.tenant_id,
        postId: job.id,
        platform: job.platforms[0] || "unknown",
        connectionId: `${job.platforms[0]}-${job.brand_id}`,
        status: "processing" as const,
        scheduledAt: job.scheduled_at,
        content: job.content as any,
        validationResults: job.validation_results as any[] || [],
        retryCount: job.retry_count || 0,
        maxRetries: job.max_retries || this.config.maxRetries,
        createdAt: job.created_at,
        updatedAt: job.updated_at,
      };

      // Process via existing publishing queue (handles platform APIs)
      await publishingQueue.processJob(jobId);

      console.log(`[JobQueue] Processed job ${jobId}`);
    } catch (error: any) {
      console.error(`[JobQueue] Error processing job ${jobId}:`, error);
      
      // Increment retry count
      await publishingDBService.incrementRetryCount(jobId);
      
      const job = await publishingDBService.getPublishingJob(jobId, brandId || "");
      if (job && job.retry_count >= this.config.maxRetries) {
        // Move to dead letter (failed status)
        await publishingDBService.markJobFailed(jobId, error.message, { maxRetriesExceeded: true });
        console.error(`[JobQueue] Job ${jobId} moved to dead letter after ${job.retry_count} retries`);
        
        // Emit notification for failed job
        const { notificationService } = await import("./notification-service");
        await notificationService.emit({
          type: "job.failed",
          brandId: job.brand_id,
          resourceId: jobId,
          resourceType: "publishing_job",
          metadata: { error: error.message, retryCount: job.retry_count },
          severity: "error",
        });
      }
    }
  }

  /**
   * Retry a failed job
   */
  async retryJob(jobId: string): Promise<void> {
    const job = await publishingDBService.getPublishingJob(jobId, "");
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    if (job.retry_count >= this.config.deadLetterAfterRetries) {
      throw new Error(`Job ${jobId} has exceeded max retries and is in dead letter`);
    }

    // Reset status to pending for retry
    await publishingDBService.updateJobStatus(jobId, "pending", {
      retry_count: job.retry_count + 1,
    });

    console.log(`[JobQueue] Retrying job ${jobId} (attempt ${job.retry_count + 1})`);
  }

  /**
   * Cancel a scheduled job
   */
  async cancelJob(jobId: string): Promise<void> {
    await publishingDBService.updateJobStatus(jobId, "cancelled", {});
    console.log(`[JobQueue] Cancelled job ${jobId}`);
  }

  /**
   * Start the job processor (runs every minute)
   */
  startProcessor(intervalMs: number = 60000): void {
    if (this.processingInterval) {
      console.warn("[JobQueue] Processor already running");
      return;
    }

    console.log("[JobQueue] Starting job processor");
    this.processingInterval = setInterval(async () => {
      try {
        const readyJobs = await this.getReadyJobs(10);
        for (const job of readyJobs) {
          await this.processJob(job.id);
        }
      } catch (error) {
        console.error("[JobQueue] Error in processor loop:", error);
      }
    }, intervalMs);
  }

  /**
   * Stop the job processor
   */
  stopProcessor(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
      console.log("[JobQueue] Stopped job processor");
    }
  }

  /**
   * Map database record to ScheduledJob
   */
  private mapJobRecord(record: any): ScheduledJob {
    return {
      id: record.id,
      brandId: record.brand_id,
      tenantId: record.tenant_id,
      content: record.content,
      platforms: record.platforms || [],
      scheduledAt: new Date(record.scheduled_at),
      status: record.status,
      retryCount: record.retry_count || 0,
      maxRetries: record.max_retries || this.config.maxRetries,
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
    };
  }
}

export const jobQueue = new JobQueueService();

