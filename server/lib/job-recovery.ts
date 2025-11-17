/**
 * Job Recovery Service
 * Recovers and resumes publishing jobs from database on server startup
 */

import { createClient } from "@supabase/supabase-js";
import { publishingDBService } from "./publishing-db-service";
import { publishingQueue } from "./publishing-queue";
import { PublishingJob, Platform } from "@shared/publishing";
import { parsePublishingJobRow } from "../types/guards";

const supabaseUrl =
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "";

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Missing Supabase configuration: SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY",
  );
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Recover pending and processing jobs from database on startup
 * Handles jobs that were interrupted by server crash/restart
 */
export async function recoverPublishingJobs(): Promise<void> {
  try {
    console.log("🔄 Starting job recovery from database...");

    // Get all pending jobs (not yet processed)
    const { data: pendingJobs, error: pendingError } = await supabase
      .from("publishing_jobs")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    if (pendingError)
      throw new Error(`Failed to fetch pending jobs: ${pendingError.message}`);

    // Get all scheduled jobs that are due to run
    const { data: scheduledJobs, error: scheduledError } = await supabase
      .from("publishing_jobs")
      .select("*")
      .eq("status", "scheduled")
      .order("scheduled_at", { ascending: true });

    if (scheduledError)
      throw new Error(
        `Failed to fetch scheduled jobs: ${scheduledError.message}`,
      );

    // Get processing jobs (these crashed - need to be retried)
    const { data: processingJobs, error: processingError } = await supabase
      .from("publishing_jobs")
      .select("*")
      .eq("status", "processing")
      .order("created_at", { ascending: true });

    if (processingError)
      throw new Error(
        `Failed to fetch processing jobs: ${processingError.message}`,
      );

    const pending = Array.isArray(pendingJobs) ? pendingJobs : [];
    const scheduled = Array.isArray(scheduledJobs) ? scheduledJobs : [];
    const processing = Array.isArray(processingJobs) ? processingJobs : [];

    const totalJobs = pending.length + scheduled.length + processing.length;
    console.log(`📊 Found ${totalJobs} jobs to recover:`);
    console.log(`   - Pending: ${pending.length}`);
    console.log(`   - Scheduled: ${scheduled.length}`);
    console.log(`   - Processing (crashed): ${processing.length}`);

    // 1. Handle processing jobs (they crashed)
    for (const job of processing) {
      console.log(`🔧 Recovering crashed job ${job.id}`);
      // Mark as pending to retry
      await publishingDBService.updateJobStatus(job.id, "pending");

      // Add back to queue with conversion
      const queueJob = dbJobToQueueJob(job);
      await publishingQueue.addJob(queueJob);
    }

    // 2. Handle pending jobs
    for (const job of pending) {
      const queueJob = dbJobToQueueJob(job);
      await publishingQueue.addJob(queueJob);
    }

    // 3. Handle scheduled jobs (only if they're due now or past due)
    for (const job of scheduled) {
      if (job.scheduled_at) {
        const scheduledTime = new Date(job.scheduled_at);
        if (scheduledTime <= new Date()) {
          // Job is due, move to pending
          console.log(`⏰ Scheduled job ${job.id} is due, moving to pending`);
          await publishingDBService.updateJobStatus(job.id, "pending");
          const queueJob = dbJobToQueueJob(job);
          await publishingQueue.addJob(queueJob);
        }
      }
    }

    console.log(
      `✅ Job recovery complete. ${totalJobs} jobs restored to queue.`,
    );
  } catch (error) {
    console.error("❌ Job recovery failed:", error);
    // Don't crash the server if recovery fails, just log it
    // The jobs will still be in the database for manual recovery
  }
}

/**
 * Convert database job record to publishing queue format
 */
function dbJobToQueueJob(dbJob: unknown): PublishingJob {
  const parsed = parsePublishingJobRow(dbJob);
  const platforms = Array.isArray(parsed.platforms) ? parsed.platforms : [];
  return {
    id: parsed.id,
    brandId: parsed.brand_id,
    tenantId: parsed.tenant_id,
    postId: parsed.id, // Use same ID as job ID
    platform: (platforms[0] as Platform) || ("instagram" as Platform),
    connectionId: `${platforms[0] || "unknown"}-${parsed.brand_id}`,
    status: parsed.status as unknown,
    scheduledAt: parsed.scheduled_at,
    publishedAt: parsed.published_at,
    platformPostId: undefined,
    platformUrl: undefined,
    content: parsed.content,
    validationResults: parsed.validation_results || [],
    retryCount: parsed.retry_count || 0,
    maxRetries: parsed.max_retries || 3,
    lastError: parsed.last_error,
    errorDetails: parsed.last_error_details,
    createdAt: parsed.created_at,
    updatedAt: parsed.updated_at,
  };
}

/**
 * Verify jobs are properly synced between database and queue
 * Useful for debugging sync issues
 */
export async function verifyJobSync(brandId: string): Promise<{
  dbJobs: number;
  queueJobs: number;
  syncStatus: "healthy" | "warning" | "critical";
}> {
  try {
    const { total: dbJobCount } = await publishingDBService.getJobHistory(
      brandId,
      1000,
      0,
    );
    const queueJobs = publishingQueue.getJobsByBrand(brandId);

    const status = dbJobCount === queueJobs.length ? "healthy" : "warning";

    return {
      dbJobs: dbJobCount,
      queueJobs: queueJobs.length,
      syncStatus: status,
    };
  } catch (_error) {
    return {
      dbJobs: 0,
      queueJobs: 0,
      syncStatus: "critical",
    };
  }
}
