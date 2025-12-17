/**
 * Crawler Job Service - Async Job Management
 * 
 * Manages crawler jobs outside HTTP request lifecycle to avoid Vercel 504 timeouts.
 * Jobs are queued in crawl_runs table and processed by background worker.
 * 
 * ============================================================================
 * CANONICAL JOB STATUS FLOW (enforced throughout codebase)
 * ============================================================================
 * 
 * pending → processing → completed
 *                    └→ failed
 * 
 * - createCrawlJob() sets: pending
 * - processCrawlJob() claims atomically: pending → processing
 * - success path: processing → completed
 * - error path: processing → failed
 * - reaper marks stale: processing → failed (if updated_at > 10 min old)
 * 
 * ⚠️ CRITICAL: updated_at MUST be bumped on every progress update
 * Otherwise reaper will incorrectly mark active jobs as stale!
 * 
 * ============================================================================
 */

import { supabase } from "./supabase";
import { logger } from "./logger";
import { CrawlStatus, type CrawlRunStatus, isTerminalStatus } from "./crawl-status";
import {
  crawlWebsite,
  extractColors,
  generateBrandKit,
  extractBrandNameFromUrl,
  extractIndustryFromContent,
} from "../workers/brand-crawler";
import { persistScrapedImages } from "./scraped-images-service";
import { markBrandCrawlFinished } from "./brand-status-updater";
import { generateCrawlRunId, logCrawlRunStart, logCrawlRunEnd, getRuntimeFingerprint } from "./runtimeFingerprint";

export interface CrawlJobOptions {
  url: string;
  brandId: string;
  tenantId?: string | null;
  cacheMode?: "default" | "refresh" | "force";
  workspaceId?: string;
}

export interface CrawlRunStatusResponse {
  id: string;
  status: CrawlRunStatus;
  progress: number;
  startedAt: string | null;
  finishedAt: string | null;
  brandKit: any | null;
  errorMessage: string | null;
  errorCode: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create a new crawl job
 * Returns immediately with job ID for polling
 */
export async function createCrawlJob(options: CrawlJobOptions): Promise<{ runId: string }> {
  const { url, brandId, tenantId, cacheMode = "default", workspaceId } = options;

  logger.info("CRAWL_RUN_START", {
    url,
    brandId,
    tenantId: tenantId || workspaceId || "unknown",
    cacheMode,
  });

  const { data: job, error } = await supabase
    .from("crawl_runs")
    .insert({
      brand_id: brandId,
      tenant_id: tenantId || workspaceId || null,
      url,
      status: CrawlStatus.PENDING,
      step: 'fetch', // Start with fast HTTP fetch
      progress: 0,
      crawl_options: {
        cacheMode,
      },
    })
    .select("id")
    .single();

  if (error || !job) {
    logger.error("Failed to create crawl job", error);
    throw new Error(`Failed to create crawl job: ${error?.message || "Unknown error"}`);
  }

  logger.info("Crawl job created", { runId: job.id, brandId, url });

  // Trigger background processing (if worker is running)
  // In production, this is handled by Vercel Cron or periodic polling
  setImmediate(() => {
    processPendingJobs().catch((err) => {
      logger.error("Background job processor error", err);
    });
  });

  return { runId: job.id };
}

/**
 * Get crawl job status
 */
export async function getCrawlJobStatus(runId: string): Promise<CrawlRunStatusResponse | null> {
  const { data: job, error } = await supabase
    .from("crawl_runs")
    .select("*")
    .eq("id", runId)
    .single();

  if (error || !job) {
    logger.warn("Crawl job not found", { runId, error: error?.message });
    return null;
  }

  return {
    id: job.id,
    status: job.status,
    progress: job.progress || 0,
    startedAt: job.started_at,
    finishedAt: job.finished_at,
    brandKit: job.brand_kit,
    errorMessage: job.error_message,
    errorCode: job.error_code,
    createdAt: job.created_at,
    updatedAt: job.updated_at,
  };
}

/**
 * Reap stale jobs that have been stuck in "processing" for too long
 * Prevents permanent spins from server crashes, timeouts, etc.
 */
async function reapStaleJobs(): Promise<void> {
  const staleThresholdMinutes = 10;
  
  // Find jobs stuck in processing for > 10 minutes
  const { data: staleJobs, error: fetchError } = await supabase
    .from("crawl_runs")
    .select("id, brand_id, url, updated_at")
    .eq("status", CrawlStatus.PROCESSING)
    .lt("updated_at", new Date(Date.now() - staleThresholdMinutes * 60 * 1000).toISOString());

  if (fetchError) {
    logger.error("Failed to fetch stale crawl jobs", fetchError);
    return;
  }

  if (!staleJobs || staleJobs.length === 0) {
    return; // No stale jobs
  }

  logger.warn(`Found ${staleJobs.length} stale crawl jobs - marking as failed`, {
    staleThresholdMinutes,
    jobIds: staleJobs.map(j => j.id),
  });

  // Mark all stale jobs as failed
  for (const job of staleJobs) {
    const { error: updateError } = await supabase
      .from("crawl_runs")
      .update({
        status: CrawlStatus.FAILED,
        finished_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        error_message: `Stale job timeout - no progress for ${staleThresholdMinutes} minutes`,
        error_code: "STALE_JOB_TIMEOUT",
      })
      .eq("id", job.id);

    if (updateError) {
      logger.error("Failed to mark stale job as failed", updateError, { jobId: job.id });
    } else {
      logger.info("Marked stale job as failed", {
        jobId: job.id,
        brandId: job.brand_id,
        url: job.url,
      });
    }
  }
}

/**
 * Process all pending crawl jobs
 * Called by background worker or Vercel Cron
 */
export async function processPendingJobs(): Promise<void> {
  // First, reap any stale jobs stuck in "processing"
  await reapStaleJobs();

  // Get pending jobs (oldest first, limit to avoid overload)
  const { data: jobs, error } = await supabase
    .from("crawl_runs")
    .select("*")
    .eq("status", CrawlStatus.PENDING)
    .order("created_at", { ascending: true })
    .limit(5); // Process max 5 at a time

  if (error) {
    logger.error("Failed to fetch pending crawl jobs", error);
    return;
  }

  if (!jobs || jobs.length === 0) {
    return; // No pending jobs
  }

  logger.info(`Processing ${jobs.length} pending crawl jobs`);

  // Process jobs in parallel (with concurrency limit)
  const promises = jobs.map((job) => processCrawlJob(job.id));
  await Promise.allSettled(promises);
}

/**
 * Process a single crawl job with atomic claim/lock
 */
async function processCrawlJob(runId: string): Promise<void> {
  const workerId = `worker-${process.pid || Math.random().toString(36).substring(7)}`;
  const now = new Date().toISOString();
  
  // ✅ ATOMIC CLAIM: Mark as processing with worker ID
  // This prevents double-processing if cron overlaps
  const { data: job, error: fetchError } = await supabase
    .from("crawl_runs")
    .update({
      status: CrawlStatus.PROCESSING,
      started_at: now,
      updated_at: now, // ✅ Heartbeat starts here
      progress: 10,
      // Store worker info in runtime_info for debugging
      runtime_info: {
        worker_id: workerId,
        claimed_at: now,
      },
    })
    .eq("id", runId)
    .eq("status", CrawlStatus.PENDING) // ✅ Optimistic lock - only claim if still pending
    .select()
    .single();

  if (fetchError || !job) {
    // Either doesn't exist, or another worker claimed it
    // ✅ STRUCTURED LOG: Claim attempt failed/skipped
    logger.info("CRAWL_JOB_CLAIM_ATTEMPT", {
      runId,
      result: "skipped",
      reason: fetchError?.message || "already_claimed",
      workerId,
    });
    return;
  }

  // ✅ STRUCTURED LOG: Job claimed successfully
  logger.info("CRAWL_JOB_CLAIM_ATTEMPT", {
    runId,
    result: "claimed",
    workerId,
    brandId: job.brand_id,
    url: job.url,
  });

  const crawlRunId = generateCrawlRunId();
  const startTime = Date.now();

  try {
    // ✅ STRUCTURED LOG: Processing begins
    logger.info("CRAWL_JOB_PROCESS_BEGIN", {
      runId,
      brandId: job.brand_id,
      url: job.url,
      workerId,
    });
    
    logger.info("CRAWL_RUN_PROGRESS", { runId, brandId: job.brand_id, url: job.url, progress: 10 });

    // Update progress: starting crawl
    await updateJobProgress(runId, 20, "Crawling website...");

    // Run the actual crawl (only takes URL, no options)
    const crawlResults = await crawlWebsite(job.url);

    await updateJobProgress(runId, 50, "Extracting brand assets...");

    // Extract colors from URL (non-blocking - don't fail entire crawl if this times out)
    let colors;
    try {
      colors = await extractColors(job.url);
    } catch (colorError) {
      logger.warn("Color extraction failed (non-blocking)", {
        runId,
        brandId: job.brand_id,
        url: job.url,
        error: colorError instanceof Error ? colorError.message : String(colorError),
      });
      // Use empty color palette as fallback
      colors = {
        primary: "#000000",
        secondary: "#FFFFFF",
        accent: null,
        allColors: [],
      };
    }
    
    const brandName = extractBrandNameFromUrl(job.url);
    const industry = extractIndustryFromContent(crawlResults);

    await updateJobProgress(runId, 70, "Generating brand kit...");

    // Generate brand kit (returns Promise<BrandKitData>)
    const brandKit = await generateBrandKit(crawlResults, colors, job.url);

    await updateJobProgress(runId, 85, "Persisting assets...");

    // Extract images from crawl results
    const extractedImages = crawlResults
      .flatMap((page) => page.images || [])
      .filter((img) => img && img.url);

    // Persist scraped images if tenant_id available
    if (job.tenant_id && extractedImages.length > 0) {
      try {
        await persistScrapedImages(job.brand_id, job.tenant_id, extractedImages);
        logger.info("Persisted scraped images", {
          runId,
          brandId: job.brand_id,
          count: extractedImages.length,
        });
      } catch (persistError) {
        logger.error("Failed to persist scraped images", persistError);
        // Don't fail the whole job if persistence fails
      }
    }

    await updateJobProgress(runId, 95, "Finalizing...");

    // Mark brand crawl as finished
    const durationMs = Date.now() - startTime;
    if (job.brand_id && !job.brand_id.startsWith("brand_")) {
      await markBrandCrawlFinished(job.brand_id, {
        status: "ok",
        runId,
        durationMs,
        pagesScraped: crawlResults.length,
        imagesExtracted: extractedImages.length,
        colorsExtracted: brandKit.colors?.allColors?.length || 0,
      });
    }

    // ✅ VERSIONED SAVE: Save brand kit with versioning
    try {
      const { saveBrandKit } = await import("./brand-kit-service");
      await saveBrandKit({
        brandId: job.brand_id,
        tenantId: job.tenant_id || undefined,
        brandKit,
        source: "crawler",
        crawlRunId: runId,
        changeSummary: `Crawler extracted ${extractedImages.length} images, ${brandKit.colors?.allColors?.length || 0} colors from ${crawlResults.length} pages`,
        autoValidate: false, // User should review crawler results
      });
      logger.info("Brand kit version saved", {
        brandId: job.brand_id,
        runId,
        source: "crawler",
      });
    } catch (versionError) {
      // Log but don't fail - we'll still save to crawl_runs
      logger.warn("Failed to save brand kit version", {
        error: versionError instanceof Error ? versionError.message : String(versionError),
        brandId: job.brand_id,
        runId,
      });
    }

    // Mark job as completed
    const finishedAt = new Date().toISOString();
    await supabase
      .from("crawl_runs")
      .update({
        status: CrawlStatus.COMPLETED,
        progress: 100,
        finished_at: finishedAt,
        updated_at: finishedAt, // ✅ Final heartbeat
        brand_kit: brandKit,
        runtime_info: {
          duration_ms: durationMs,
          pages_crawled: crawlResults.length,
          runtime_fingerprint: getRuntimeFingerprint(),
          worker_id: job.runtime_info?.worker_id,
        },
      })
      .eq("id", runId);

    // ✅ STRUCTURED LOG: Job processing completed successfully
    logger.info("CRAWL_JOB_PROCESS_END", {
      runId,
      status: "completed",
      durationMs,
      pagesScraped: crawlResults.length,
      imagesExtracted: extractedImages.length,
    });
    
    logger.info("CRAWL_RUN_END", {
      runId,
      brandId: job.brand_id,
      url: job.url,
      status: "completed",
      durationMs,
      pagesScraped: crawlResults.length,
      imagesExtracted: extractedImages.length,
    });

    logCrawlRunEnd(crawlRunId, {
      status: "ok",
      durationMs,
      pagesScraped: crawlResults.length,
      imagesExtracted: extractedImages.length,
    });
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = (error as any)?.code || "UNKNOWN_ERROR";

    // ✅ STRUCTURED LOG: Job processing failed
    logger.info("CRAWL_JOB_PROCESS_FAIL", {
      runId,
      errorCode,
      messageSafe: errorMessage.substring(0, 200), // Truncate for safety
      durationMs,
    });

    logger.error("CRAWL_RUN_END", new Error(errorMessage), {
      runId,
      brandId: job.brand_id,
      url: job.url,
      status: "failed",
      durationMs,
      error: errorMessage,
    });

    // Mark job as failed
    const failedAt = new Date().toISOString();
    await supabase
      .from("crawl_runs")
      .update({
        status: CrawlStatus.FAILED,
        finished_at: failedAt,
        updated_at: failedAt, // ✅ Final heartbeat
        error_message: errorMessage,
        error_code: "CRAWL_ERROR",
        runtime_info: {
          duration_ms: durationMs,
          runtime_fingerprint: getRuntimeFingerprint(),
          worker_id: job.runtime_info?.worker_id,
        },
      })
      .eq("id", runId);

    if (job.brand_id && !job.brand_id.startsWith("brand_")) {
      await markBrandCrawlFinished(job.brand_id, {
        status: "fail",
        runId,
        durationMs,
        error: errorMessage,
      });
    }

    logCrawlRunEnd(crawlRunId, {
      status: "fail",
      durationMs,
      error: errorMessage,
    });
  }
}

/**
 * Update job progress with heartbeat
 * CRITICAL: Also updates updated_at so reaper knows job is alive
 */
async function updateJobProgress(runId: string, progress: number, message?: string): Promise<void> {
  const { data, error } = await supabase
    .from("crawl_runs")
    .update({
      progress,
      updated_at: new Date().toISOString(), // ✅ Heartbeat - prevents false reaping
    })
    .eq("id", runId)
    .select("id")
    .single();

  if (error || !data) {
    // ✅ CRITICAL: Log heartbeat failure but don't crash the crawl
    logger.warn("Heartbeat write failed - reaper may mark job as stale", {
      runId,
      progress,
      error: error?.message || "No data returned",
      errorCode: error?.code,
    });
    return; // Continue crawling despite heartbeat failure
  }

  // ✅ STRUCTURED LOG: Heartbeat successful
  logger.info("CRAWL_JOB_HEARTBEAT", { runId, progress, message });
  logger.info("CRAWL_RUN_PROGRESS", { runId, progress, message });
}

