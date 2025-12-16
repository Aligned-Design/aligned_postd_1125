/**
 * Crawler Job Service - Async Job Management
 * 
 * Manages crawler jobs outside HTTP request lifecycle to avoid Vercel 504 timeouts.
 * Jobs are queued in crawl_runs table and processed by background worker.
 */

import { supabase } from "./supabase";
import { logger } from "./logger";
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

export interface CrawlRunStatus {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
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
      status: "pending",
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
export async function getCrawlJobStatus(runId: string): Promise<CrawlRunStatus | null> {
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
 * Process all pending crawl jobs
 * Called by background worker or Vercel Cron
 */
export async function processPendingJobs(): Promise<void> {
  // Get pending jobs (oldest first, limit to avoid overload)
  const { data: jobs, error } = await supabase
    .from("crawl_runs")
    .select("*")
    .eq("status", "pending")
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
 * Process a single crawl job
 */
async function processCrawlJob(runId: string): Promise<void> {
  // Mark as processing
  const { data: job, error: fetchError } = await supabase
    .from("crawl_runs")
    .update({ status: "processing", started_at: new Date().toISOString(), progress: 10 })
    .eq("id", runId)
    .eq("status", "pending") // Optimistic lock
    .select()
    .single();

  if (fetchError || !job) {
    logger.warn("Failed to lock crawl job", { runId, error: fetchError?.message });
    return; // Another worker might have picked it up
  }

  const crawlRunId = generateCrawlRunId();
  const startTime = Date.now();

  try {
    logger.info("CRAWL_RUN_PROGRESS", { runId, brandId: job.brand_id, url: job.url, progress: 10 });

    // Update progress: starting crawl
    await updateJobProgress(runId, 20, "Crawling website...");

    // Run the actual crawl (only takes URL, no options)
    const crawlResults = await crawlWebsite(job.url);

    await updateJobProgress(runId, 50, "Extracting brand assets...");

    // Extract colors from URL
    const colors = await extractColors(job.url);
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

    // Mark job as completed
    await supabase
      .from("crawl_runs")
      .update({
        status: "completed",
        progress: 100,
        finished_at: new Date().toISOString(),
        brand_kit: brandKit,
        runtime_info: {
          duration_ms: durationMs,
          pages_crawled: crawlResults.length,
          runtime_fingerprint: getRuntimeFingerprint(),
        },
      })
      .eq("id", runId);

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

    logger.error("CRAWL_RUN_END", new Error(errorMessage), {
      runId,
      brandId: job.brand_id,
      url: job.url,
      status: "failed",
      durationMs,
      error: errorMessage,
    });

    // Mark job as failed
    await supabase
      .from("crawl_runs")
      .update({
        status: "failed",
        finished_at: new Date().toISOString(),
        error_message: errorMessage,
        error_code: "CRAWL_ERROR",
        runtime_info: {
          duration_ms: durationMs,
          runtime_fingerprint: getRuntimeFingerprint(),
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
 * Update job progress
 */
async function updateJobProgress(runId: string, progress: number, message?: string): Promise<void> {
  await supabase
    .from("crawl_runs")
    .update({ progress })
    .eq("id", runId);

  logger.info("CRAWL_RUN_PROGRESS", { runId, progress, message });
}

