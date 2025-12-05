/**
 * Brand Reconciliation Service
 * 
 * Handles reconciliation of temporary brand IDs (used during onboarding)
 * to final UUID-based brand IDs.
 * 
 * CRITICAL: This ensures scraped images and onboarding data tied to temp IDs
 * are always reconciled to the final UUID-based brand.
 */

import { supabase } from "./supabase";
import { transferScrapedImages } from "./scraped-images-service";
import { logger } from "./logger";

/**
 * Reconcile temporary brand assets to final brand UUID
 * 
 * This function updates all tables where brand_id may reference a temporary
 * brand ID (e.g., "brand_1234567890") to the final UUID brand ID.
 * 
 * Currently handles:
 * - media_assets (scraped images)
 * 
 * Future: May need to handle other tables if onboarding creates data with temp IDs
 * 
 * @param tempBrandId - Temporary brand ID (e.g., "brand_1234567890")
 * @param finalBrandId - Final brand UUID
 * @returns Reconciliation result with counts
 */
export async function reconcileTemporaryBrandAssets(
  tempBrandId: string,
  finalBrandId: string
): Promise<{
  success: boolean;
  transferredImages: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let transferredImages = 0;

  // Validate inputs
  if (!tempBrandId || !finalBrandId || tempBrandId === finalBrandId) {
    logger.info("Brand reconciliation skipped: same IDs or missing", {
      tempBrandId,
      finalBrandId,
      same: tempBrandId === finalBrandId,
    });
    return {
      success: true,
      transferredImages: 0,
      errors: [],
    };
  }

  // Validate tempBrandId format
  if (!tempBrandId.startsWith("brand_")) {
    logger.warn("Brand reconciliation skipped: tempBrandId doesn't match expected format", {
      tempBrandId,
      finalBrandId,
    });
    return {
      success: true,
      transferredImages: 0,
      errors: ["tempBrandId doesn't match expected format (should start with 'brand_')"],
    };
  }

  // Validate finalBrandId is a UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(finalBrandId)) {
    logger.error("Brand reconciliation failed: finalBrandId is not a valid UUID", undefined, {
      tempBrandId,
      finalBrandId,
    });
    return {
      success: false,
      transferredImages: 0,
      errors: ["finalBrandId is not a valid UUID"],
    };
  }

  logger.info("Starting brand reconciliation", {
    tempBrandId,
    finalBrandId,
  });

  try {
    // 1. Transfer scraped images
    try {
      transferredImages = await transferScrapedImages(tempBrandId, finalBrandId);
      logger.info("Scraped images transferred", {
        tempBrandId,
        finalBrandId,
        count: transferredImages,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("Failed to transfer scraped images", new Error(errorMessage), {
        tempBrandId,
        finalBrandId,
      });
      errors.push(`Failed to transfer scraped images: ${errorMessage}`);
    }

    // 2. Future: Transfer other onboarding data if needed
    // - brand_kit data stored with temp ID
    // - Any other tables that may reference temp brand IDs

    const success = errors.length === 0;

    logger.info("Brand reconciliation complete", {
      tempBrandId,
      finalBrandId,
      success,
      transferredImages,
      errorCount: errors.length,
    });

    return {
      success,
      transferredImages,
      errors,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Brand reconciliation failed", new Error(errorMessage), {
      tempBrandId,
      finalBrandId,
    });
    return {
      success: false,
      transferredImages,
      errors: [errorMessage],
    };
  }
}

/**
 * Check if a brand ID is temporary (onboarding format)
 */
export function isTemporaryBrandId(brandId: string | null | undefined): boolean {
  if (!brandId) return false;
  return brandId.startsWith("brand_") && !brandId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
}

