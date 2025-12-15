/**
 * Brand Status Updater
 * 
 * Updates brands table fields after crawl completion to distinguish:
 * - never run (scraper_status = null or 'never_run')
 * - ran successfully with 0 assets (scraper_status = 'ok', scraped_at set)
 * - failed (scraper_status = 'error', scraped_at may be set, scraper_error populated)
 */

import { supabase } from "./supabase";
import { logger } from "./logger";

export interface CrawlCompletionData {
  status: "ok" | "error" | "fail";
  runId: string;
  pagesScraped?: number;
  imagesExtracted?: number;
  colorsExtracted?: number;
  durationMs: number;
  error?: string;
  url?: string;
}

/**
 * Mark brand crawl as started (optional - for tracking "in_progress" state)
 */
export async function markBrandCrawlStarted(
  brandId: string,
  runId: string,
  url?: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from("brands")
      .update({
        scraper_status: "running",
        updated_at: new Date().toISOString(),
      })
      .eq("id", brandId);

    if (error) {
      logger.error("Failed to mark brand crawl as started", error, {
        brandId,
        runId,
      });
    } else {
      logger.debug("Brand crawl marked as started", { brandId, runId, url });
    }
  } catch (err) {
    logger.error("Exception marking brand crawl as started", err, {
      brandId,
      runId,
    });
  }
}

/**
 * Mark brand crawl as finished (success or failure)
 * 
 * This MUST be called after every crawl completion to ensure the UI can
 * distinguish between "never run" and "ran but found nothing".
 */
export async function markBrandCrawlFinished(
  brandId: string,
  data: CrawlCompletionData
): Promise<void> {
  const { status, runId, error: errorMessage, durationMs, pagesScraped, imagesExtracted, colorsExtracted } = data;

  try {
    // Determine final status
    const finalStatus = status === "ok" ? "ok" : "error";
    
    // Build update payload
    const updatePayload: Record<string, any> = {
      scraper_status: finalStatus,
      scraped_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Note: Not setting scraper_error because the column doesn't exist in the schema
    // Error information is logged instead

    // Update brand record
    const { error: dbError } = await supabase
      .from("brands")
      .update(updatePayload)
      .eq("id", brandId);

    if (dbError) {
      logger.error("Failed to update brand crawl status", dbError, {
        brandId,
        runId,
        status: finalStatus,
      });
    } else {
      logger.info("Brand crawl status updated", {
        brandId,
        runId,
        status: finalStatus,
        scraped_at: updatePayload.scraped_at,
        durationMs,
        pagesScraped,
        imagesExtracted,
        colorsExtracted,
        error: errorMessage || null,
      });
    }
  } catch (err) {
    logger.error("Exception updating brand crawl status", err, {
      brandId,
      runId,
      status,
    });
  }
}

