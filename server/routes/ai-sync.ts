/**
 * AI Sync Route
 * 
 * Provides coordination endpoint for multi-agent collaboration.
 * Returns current collaboration state (StrategyBrief, ContentPackage, etc.)
 */

import { RequestHandler } from "express";
import { z } from "zod";
import { StrategyBriefStorage, ContentPackageStorage } from "../lib/collaboration-storage";
import { assertBrandAccess } from "../lib/brand-access";
import { AppError } from "../lib/error-middleware";
import { ErrorCode, HTTP_STATUS } from "../lib/error-responses";

const SyncRequestSchema = z.object({
  brandId: z.string().uuid("Invalid brand ID"),
  requestId: z.string().optional().describe("Request ID to fetch collaboration state"),
});

/**
 * POST /api/ai/sync
 * Get current collaboration state for a brand/request
 */
export const getSyncState: RequestHandler = async (req, res, next) => {
  try {
    const requestBody = SyncRequestSchema.parse(req.body);
    const { brandId, requestId } = requestBody;

    // Verify brand access
    assertBrandAccess(req, brandId);

    // Get latest StrategyBrief
    const strategyBrief = await StrategyBriefStorage.getLatest(brandId);

    // Get ContentPackage by requestId if provided, otherwise null
    let contentPackage = null;
    if (requestId) {
      contentPackage = await ContentPackageStorage.getByRequestId(requestId);
    }

    // Extract advisor feedback from ContentPackage collaboration log
    const advisorFeedback = contentPackage?.collaborationLog
      ?.filter(log => log.agent === "advisor")
      .map(log => ({
        action: log.action,
        notes: log.notes,
        timestamp: log.timestamp,
      })) || [];

    // Determine status
    let status: "planning" | "creating" | "reviewing" | "complete" = "planning";
    if (contentPackage) {
      if (contentPackage.designContext) {
        status = "complete";
      } else if (contentPackage.copy.body) {
        status = "creating";
      }
    } else if (strategyBrief) {
      status = "creating";
    }

    const response = {
      brandId,
      requestId: requestId || null,
      strategyBrief,
      contentPackage,
      advisorFeedback,
      status,
      timestamp: new Date().toISOString(),
    };

    (res as any).json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        "Request validation failed",
        HTTP_STATUS.BAD_REQUEST,
        "warning",
        {
          validationErrors: error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
            code: err.code,
          })),
        }
      );
    }
    next(error);
  }
};

