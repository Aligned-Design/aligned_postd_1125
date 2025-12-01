import { PublishingJob, JobStatusUpdate } from "@shared/publishing";
import { validatePostContent } from "./platform-validators";
import { connectionsDB } from "./connections-db-service";
import { publishingDBService } from "./publishing-db-service";
import { getPlatformAPI } from "./platform-apis";
// Weekend posting logic removed - replaced with flexible Preferred Posting Schedule
import {
  broadcastJobCreated,
  broadcastJobApproved,
  broadcastJobPublishing,
  broadcastJobCompleted,
  broadcastJobFailed,
  broadcastJobRetry,
} from "./event-broadcaster";

interface PublishResult {
  success: boolean;
  platformPostId?: string;
  platformUrl?: string;
  error?: string;
  errorDetails?: unknown;
}

export class PublishingQueue {
  private jobs = new Map<string, PublishingJob>();
  private processing = new Set<string>();

  async addJob(job: PublishingJob): Promise<void> {
    // Validate content before adding to queue
    const validationResults = validatePostContent(job.platform, job.content);
    const hasErrors = validationResults.some((r) => r.status === "error");

    if (hasErrors) {
      job.status = "failed";
      job.lastError = "Content validation failed";
      job.validationResults = validationResults;
    }

    this.jobs.set(job.id, job);

    // Broadcast job created event
    try {
      broadcastJobCreated(job.id, {
        brandId: job.brandId,
        platforms: [job.platform],
        scheduledAt: job.scheduledAt,
      });
    } catch (error) {
      // Non-critical: event broadcast failure doesn't affect job creation
      const logger = (await import("./logger")).logger;
      logger.warn(
        "Failed to broadcast job created event",
        {
          jobId: job.id,
          brandId: job.brandId,
          platform: job.platform,
          error: error instanceof Error ? error.message : String(error),
        }
      );
    }

    if (job.status === "pending") {
      this.processJob(job.id);
    }
  }

  async processJob(jobId: string): Promise<void> {
    if (this.processing.has(jobId)) {
      return; // Already processing
    }

    const job = this.jobs.get(jobId);
    if (!job || job.status !== "pending") {
      return;
    }

    this.processing.add(jobId);

    try {
      // Update status to processing
      await this.updateJobStatus(jobId, { status: "processing" });

      // Check if scheduled for future
      if (job.scheduledAt && new Date(job.scheduledAt) > new Date()) {
        // Schedule for later processing
        const delay = new Date(job.scheduledAt).getTime() - Date.now();
        setTimeout(() => this.processJob(jobId), delay);
        this.processing.delete(jobId);
        return;
      }

      // Weekend posting restrictions removed - scheduling is now always allowed
      // Preferred posting schedule is used for suggestions only, not blocking

      // Publish to platform
      const result = await this.publishToPlatform(job);

      if (result.success) {
        await this.updateJobStatus(jobId, {
          status: "published",
          platformPostId: result.platformPostId,
          platformUrl: result.platformUrl,
          publishedAt: new Date().toISOString(),
        });

        // Emit notification for successful publish
        const { notificationService } = await import("./notification-service");
        await notificationService.emit({
          type: "content.published",
          brandId: job.brandId,
          resourceId: jobId,
          resourceType: "publishing_job",
          metadata: {
            platform: job.platform,
            platformPostId: result.platformPostId,
            platformUrl: result.platformUrl,
          },
          severity: "success",
        });
      } else {
        await this.handleJobFailure(
          jobId,
          result.error || "Unknown error",
          result.errorDetails,
        );

        // Emit notification for failed publish
        const { notificationService } = await import("./notification-service");
        await notificationService.emit({
          type: "content.failed_to_post",
          brandId: job.brandId,
          resourceId: jobId,
          resourceType: "publishing_job",
          metadata: {
            platform: job.platform,
            error: result.error,
          },
          severity: "error",
        });
      }
    } catch (error) {
      await this.handleJobFailure(
        jobId,
        error instanceof Error ? error.message : "Processing error",
      );
    } finally {
      this.processing.delete(jobId);
    }
  }

  private async publishToPlatform(job: PublishingJob): Promise<PublishResult> {
    try {
      switch (job.platform) {
        case "instagram":
          return await this.publishToInstagram(job);
        case "facebook":
          return await this.publishToFacebook(job);
        case "linkedin":
          return await this.publishToLinkedIn(job);
        case "twitter":
          return await this.publishToTwitter(job);
        case "google_business":
          return await this.publishToGoogleBusiness(job);
        default:
          throw new Error(`Unsupported platform: ${job.platform}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Publishing failed",
        errorDetails: error,
      };
    }
  }

  private async publishToInstagram(job: PublishingJob): Promise<PublishResult> {
    try {
      // Get connection from database
      const connection = await connectionsDB.getConnection(
        job.brandId,
        "instagram",
      );
      if (!connection) {
        throw new Error("Instagram account not connected");
      }

      if (connection.status !== "connected") {
        throw new Error(`Instagram connection status: ${connection.status}`);
      }

      // Get Instagram API client
      const instagramAPI = getPlatformAPI(
        "instagram",
        connection.access_token,
        connection.account_id,
      );

      // Publish to Instagram
      const result = await instagramAPI.publishPost(job.content);

      if (result.success) {
        // Create audit log entry
        await publishingDBService.createPublishingLog(
          job.id,
          job.brandId,
          "instagram",
          "published",
          1,
          {
            platformPostId: result.platformPostId,
            platformPostUrl: result.platformUrl,
            contentSnapshot: job.content,
          },
        );

        return result;
      } else {
        // Log failure
        await publishingDBService.createPublishingLog(
          job.id,
          job.brandId,
          "instagram",
          "failed",
          1,
          {
            errorCode: result.errorCode,
            errorMessage: result.error,
            contentSnapshot: job.content,
          },
        );

        throw new Error(result.error || "Instagram publish failed");
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Instagram publishing failed",
        errorDetails: error,
      };
    }
  }

  private async publishToFacebook(job: PublishingJob): Promise<PublishResult> {
    try {
      // Get connection from database
      const connection = await connectionsDB.getConnection(
        job.brandId,
        "facebook",
      );
      if (!connection) {
        throw new Error("Facebook account not connected");
      }

      if (connection.status !== "connected") {
        throw new Error(`Facebook connection status: ${connection.status}`);
      }

      // Get Facebook API client
      const facebookAPI = getPlatformAPI(
        "facebook",
        connection.access_token,
        connection.account_id,
      );

      // Publish to Facebook
      const result = await facebookAPI.publishPost(job.content);

      if (result.success) {
        // Create audit log entry
        await publishingDBService.createPublishingLog(
          job.id,
          job.brandId,
          "facebook",
          "published",
          1,
          {
            platformPostId: result.platformPostId,
            platformPostUrl: result.platformUrl,
            contentSnapshot: job.content,
          },
        );

        return result;
      } else {
        // Log failure
        await publishingDBService.createPublishingLog(
          job.id,
          job.brandId,
          "facebook",
          "failed",
          1,
          {
            errorCode: result.errorCode,
            errorMessage: result.error,
            contentSnapshot: job.content,
          },
        );

        throw new Error(result.error || "Facebook publish failed");
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Facebook publishing failed",
        errorDetails: error,
      };
    }
  }

  private async publishToLinkedIn(job: PublishingJob): Promise<PublishResult> {
    try {
      // Get connection from database
      const connection = await connectionsDB.getConnection(
        job.brandId,
        "linkedin",
      );
      if (!connection) {
        throw new Error("LinkedIn account not connected");
      }

      if (connection.status !== "connected") {
        throw new Error(`LinkedIn connection status: ${connection.status}`);
      }

      // Get LinkedIn API client
      const linkedinAPI = getPlatformAPI(
        "linkedin",
        connection.access_token,
        connection.account_id,
      );

      // Publish to LinkedIn
      const result = await linkedinAPI.publishPost(job.content);

      if (result.success) {
        // Create audit log entry
        await publishingDBService.createPublishingLog(
          job.id,
          job.brandId,
          "linkedin",
          "published",
          1,
          {
            platformPostId: result.platformPostId,
            platformPostUrl: result.platformUrl,
            contentSnapshot: job.content,
          },
        );

        return result;
      } else {
        // Log failure
        await publishingDBService.createPublishingLog(
          job.id,
          job.brandId,
          "linkedin",
          "failed",
          1,
          {
            errorCode: result.errorCode,
            errorMessage: result.error,
            contentSnapshot: job.content,
          },
        );

        throw new Error(result.error || "LinkedIn publish failed");
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "LinkedIn publishing failed",
        errorDetails: error,
      };
    }
  }

  private async publishToTwitter(job: PublishingJob): Promise<PublishResult> {
    try {
      // Get connection from database
      const connection = await connectionsDB.getConnection(
        job.brandId,
        "twitter",
      );
      if (!connection) {
        throw new Error("Twitter account not connected");
      }

      if (connection.status !== "connected") {
        throw new Error(`Twitter connection status: ${connection.status}`);
      }

      // Get Twitter API client
      const twitterAPI = getPlatformAPI(
        "twitter",
        connection.access_token,
        connection.account_id,
      );

      // Publish to Twitter
      const result = await twitterAPI.publishPost(job.content);

      if (result.success) {
        // Create audit log entry
        await publishingDBService.createPublishingLog(
          job.id,
          job.brandId,
          "twitter",
          "published",
          1,
          {
            platformPostId: result.platformPostId,
            platformPostUrl: result.platformUrl,
            contentSnapshot: job.content,
          },
        );

        return result;
      } else {
        // Log failure
        await publishingDBService.createPublishingLog(
          job.id,
          job.brandId,
          "twitter",
          "failed",
          1,
          {
            errorCode: result.errorCode,
            errorMessage: result.error,
            contentSnapshot: job.content,
          },
        );

        throw new Error(result.error || "Twitter publish failed");
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Twitter publishing failed",
        errorDetails: error,
      };
    }
  }

  private async publishToGoogleBusiness(
    job: PublishingJob,
  ): Promise<PublishResult> {
    try {
      // Get connection from database
      const connection = await connectionsDB.getConnection(
        job.brandId,
        "google_business",
      );
      if (!connection) {
        throw new Error("Google Business Profile not connected");
      }

      if (connection.status !== "connected") {
        throw new Error(
          `Google Business connection status: ${connection.status}`,
        );
      }

      // Get Google Business API client
      const googleAPI = getPlatformAPI(
        "google_business",
        connection.access_token,
        connection.account_id,
      );

      // Publish to Google Business
      const result = await googleAPI.publishPost(job.content);

      if (result.success) {
        // Create audit log entry
        await publishingDBService.createPublishingLog(
          job.id,
          job.brandId,
          "google_business",
          "published",
          1,
          {
            platformPostId: result.platformPostId,
            platformPostUrl: result.platformUrl,
            contentSnapshot: job.content,
          },
        );

        return result;
      } else {
        // Log failure
        await publishingDBService.createPublishingLog(
          job.id,
          job.brandId,
          "google_business",
          "failed",
          1,
          {
            errorCode: result.errorCode,
            errorMessage: result.error,
            contentSnapshot: job.content,
          },
        );

        throw new Error(result.error || "Google Business publish failed");
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Google Business publishing failed",
        errorDetails: error,
      };
    }
  }

  private async handleJobFailure(
    jobId: string,
    error: string,
    errorDetails?: unknown,
  ): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.retryCount++;
    job.lastError = error;
    job.errorDetails = errorDetails as Record<string, unknown> | undefined;

    if (job.retryCount < job.maxRetries) {
      // Schedule retry with exponential backoff
      const retryDelay = Math.min(1000 * Math.pow(2, job.retryCount), 30000); // Max 30 seconds
      const nextAttemptAt = new Date(Date.now() + retryDelay).toISOString();

      // Broadcast retry event
      try {
        broadcastJobRetry(jobId, {
          brandId: job.brandId,
          retryCount: job.retryCount,
          nextAttemptAt,
        });
      } catch (broadcastError) {
        // Non-critical: event broadcast failure doesn't affect retry
        const logger = (await import("./logger")).logger;
        logger.warn(
          "Failed to broadcast retry event",
          {
            jobId,
            brandId: job.brandId,
            platform: job.platform,
            retryCount: job.retryCount,
            error: broadcastError instanceof Error ? broadcastError.message : String(broadcastError),
          }
        );
      }

      setTimeout(() => {
        job.status = "pending";
        this.processJob(jobId);
      }, retryDelay);
    } else {
      job.status = "failed";
    }

    await this.updateJobStatus(jobId, {
      status: job.status,
      error: error,
    });
  }

  private async updateJobStatus(
    jobId: string,
    update: Partial<JobStatusUpdate>,
  ): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) return;

    Object.assign(job, update);
    job.updatedAt = new Date().toISOString();

    // Persist to database
    try {
      // Convert status to string for database update
      const statusString = update.status ? String(update.status) : undefined;
      if (statusString) {
        await publishingDBService.updateJobStatus(jobId, statusString as "pending" | "processing" | "published" | "failed" | "cancelled" | "scheduled");
      }
    } catch (error) {
      // Critical: log database update failure
      const logger = (await import("./logger")).logger;
      logger.error(
        "Failed to update job status in database",
        error instanceof Error ? error : new Error(String(error)),
        {
          jobId,
          brandId: job.brandId,
          platform: job.platform,
          status: String(update.status),
        }
      );
    }

    // Emit status update event
    this.emitStatusUpdate(job);
  }

  private emitStatusUpdate(job: PublishingJob): void {
    // Broadcast real-time status updates via WebSocket
    try {
      switch (job.status) {
        case "pending":
          // Job is pending - it's approved and waiting to start
          broadcastJobApproved(job.id, {
            brandId: job.brandId,
            approvedBy: "system",
          });
          break;

        case "processing":
          // Job is actively publishing
          broadcastJobPublishing(job.id, {
            brandId: job.brandId,
            currentPlatform: job.platform,
            platformIndex: 0,
            totalPlatforms: 1,
          });
          break;

        case "published":
          // Job successfully published
          broadcastJobCompleted(job.id, {
            brandId: job.brandId,
            platformsPublished: [job.platform],
            publishedUrls: job.platformUrl ? { [job.platform]: job.platformUrl } : undefined,
          });
          break;

        case "failed":
          // Job failed
          broadcastJobFailed(job.id, {
            brandId: job.brandId,
            error: job.lastError || "Unknown error",
            failedPlatforms: [job.platform],
            retryCount: job.retryCount,
          });
          break;

        case "cancelled":
          // Job was cancelled
          broadcastJobFailed(job.id, {
            brandId: job.brandId,
            error: "Job was cancelled",
            failedPlatforms: [job.platform],
          });
          break;
      }
    } catch (error) {
      // Non-critical: event emission failure doesn't affect job processing
      const logger = (await import("./logger")).logger;
      logger.warn(
        "Failed to emit status update",
        {
          jobId: job.id,
          brandId: job.brandId,
          platform: job.platform,
          status: job.status,
          error: error instanceof Error ? error.message : String(error),
        }
      );
    }
  }

  getJob(jobId: string): PublishingJob | undefined {
    return this.jobs.get(jobId);
  }

  getJobsByBrand(brandId: string): PublishingJob[] {
    return Array.from(this.jobs.values()).filter(
      (job) => job.brandId === brandId,
    );
  }

  async cancelJob(jobId: string): Promise<boolean> {
    const job = this.jobs.get(jobId);
    if (!job || job.status === "published" || job.status === "processing") {
      return false;
    }

    await this.updateJobStatus(jobId, { status: "cancelled" });
    return true;
  }

  async retryJob(jobId: string): Promise<boolean> {
    const job = this.jobs.get(jobId);
    if (!job || job.status !== "failed") {
      return false;
    }

    job.retryCount = 0;
    await this.updateJobStatus(jobId, { status: "pending" });
    this.processJob(jobId);
    return true;
  }

  /**
   * Update scheduled time for a job
   * This updates both the in-memory job and ensures the queue respects the new time
   */
  /**
   * Update scheduled time for a job in the in-memory queue
   * 
   * Handles state transitions:
   * - Future → Future: Update scheduled time, keep as "scheduled"
   * - Future → Past: Change to "pending" and process immediately
   * - Past → Future: Change to "scheduled" and schedule for later
   * 
   * @param jobId - Job ID to update
   * @param scheduledAt - New scheduled time (ISO string)
   * @returns true if job was updated, false if job not found in memory
   */
  async updateScheduledTime(jobId: string, scheduledAt: string): Promise<boolean> {
    const job = this.jobs.get(jobId);
    if (!job) {
      // Job not in memory - might need to load from DB
      // This is OK - the DB update succeeded, queue will resync on next job load
      return false;
    }

    const previousScheduledAt = job.scheduledAt;
    const previousStatus = job.status;

    // Update in-memory job
    job.scheduledAt = scheduledAt;
    job.updatedAt = new Date().toISOString();

    // Determine new status based on scheduled time
    const scheduledDate = new Date(scheduledAt);
    const now = new Date();
    
    if (scheduledDate > now) {
      // Future time - mark as pending (will be checked by processJob)
      // Note: The database uses "scheduled" status, but the in-memory queue uses "pending"
      // with a future scheduledAt. The processJob method checks scheduledAt before processing.
      // We keep it as "pending" here to match the shared type, and processJob will handle the delay.
      job.status = "pending";
      // Note: processJob will check scheduledAt and delay processing if it's in the future
    } else {
      // Past or current time - mark as pending and process immediately
      job.status = "pending";
      // Only process if not already processing
      if (!this.processing.has(jobId)) {
        this.processJob(jobId);
      }
    }

    // Log state transition for observability
    if (previousScheduledAt !== scheduledAt || previousStatus !== job.status) {
      const logger = (await import("./logger")).logger;
      logger.info(
        "Job scheduled time updated in queue",
        {
          jobId,
          brandId: job.brandId,
          platform: job.platform,
          previousScheduledAt,
          newScheduledAt: scheduledAt,
          previousStatus,
          newStatus: job.status,
        }
      );
    }

    return true;
  }

  private async getBrandPostingConfig(brandId: string): Promise<unknown> {
    try {
      // Fetch brand posting config from database
      // This integrates with the brands table posting_config JSONB field
      const config = await publishingDBService.getBrandPostingConfig(brandId);
      return config;
    } catch (error) {
      // Non-critical: use default config if fetch fails
      const logger = (await import("./logger")).logger;
      logger.warn(
        "Failed to get posting config, using defaults",
        {
          brandId,
          error: error instanceof Error ? error.message : String(error),
        }
      );
      // Default config: no restrictions
      return {
        posting_config: {},
        timezone: "UTC",
      };
    }
  }
}

// Singleton instance
export const publishingQueue = new PublishingQueue();
