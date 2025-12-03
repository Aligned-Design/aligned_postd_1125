/**
 * Milestones API Routes
 * 
 * Handles milestone tracking and acknowledgments.
 */

import express, { RequestHandler } from "express";
import { z } from "zod";
import { getMilestones, acknowledgeMilestone } from "../lib/milestones";
import { AppError } from "../lib/error-middleware";
import { ErrorCode, HTTP_STATUS } from "../lib/error-responses";
import { validateParams } from "../lib/validation-middleware";

const router = express.Router();

// ✅ VALIDATION: Zod schemas for milestones routes
const MilestoneKeyParamSchema = z.object({
  key: z.string().min(1, 'Milestone key is required'),
}).strict();

// ✅ REMOVED: MOCK_MILESTONES - always use real database
// Mock data moved to test fixtures if needed for testing

/**
 * GET /api/milestones
 * Fetch all milestones for the current workspace
 * 
 * Purpose: Retrieve milestone tracking data for the authenticated workspace
 * 
 * Response Schema:
 * Success (200):
 * - { success: true, milestones: [...], total?: number }
 * 
 * Error (4xx/5xx):
 * - { error: { code: string, message: string, severity: string, timestamp: string } }
 */
router.get("/", (async (req, res, next) => {
  try {
    // ✅ REMOVED: USE_MOCKS check - always use real database in production
    // Get workspaceId from authenticated session or header fallback
    // Future work: Extract from req.user.workspaceId when available
    const workspaceId =
      (req as any).user?.workspaceId ||
      (req.headers["x-workspace-id"] as string) ||
      "default-workspace";

    try {
      const milestones = await getMilestones(workspaceId);
      return res.status(HTTP_STATUS.OK).json({ 
        success: true, 
        milestones: milestones || [],
        total: milestones?.length || 0,
      });
    } catch (dbError) {
      // ✅ LOG ERROR: Database errors should be logged
      console.error("[Milestone] Failed to fetch milestones from database:", {
        error: dbError instanceof Error ? dbError.message : String(dbError),
        workspaceId,
        requestId: (req as any).id,
      });
      
      // ✅ GRACEFUL FALLBACK: Return empty array instead of error
      // This prevents UI failures when milestones service is unavailable
      return res.status(HTTP_STATUS.OK).json({ 
        success: true, 
        milestones: [], 
        total: 0,
      });
    }
  } catch (err) {
    // ✅ LOG ERROR: Unexpected errors should be logged
    console.error("[Milestone] Unexpected error in milestones route:", {
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      requestId: (req as any).id,
    });
    
    // ✅ RESPONSE: Pass to error middleware for consistent error handling
    if (err instanceof AppError) {
      return next(err);
    }
    
    // Wrap unknown errors
    return next(
      new AppError(
        ErrorCode.INTERNAL_ERROR,
        err instanceof Error ? err.message : "Failed to fetch milestones",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "error",
        { originalError: err instanceof Error ? err.message : String(err) },
        "Please try again later"
      )
    );
  }
}) as RequestHandler);

/**
 * POST /api/milestones/:key/ack
 * Acknowledge a milestone (user has seen it)
 */
router.post("/:key/ack", validateParams(MilestoneKeyParamSchema), (async (req, res, next) => {
  try {
    // ✅ VALIDATION: Params are already validated by middleware
    const { key } = req.params as z.infer<typeof MilestoneKeyParamSchema>;
    // Get workspaceId from authenticated session or header fallback
    // Future work: Extract from req.user.workspaceId when available
    const workspaceId =
      (req as any).user?.workspaceId ||
      (req.headers["x-workspace-id"] as string) ||
      "default-workspace";

    await acknowledgeMilestone(workspaceId, key as any);
    (res as any).json({ success: true });
  } catch (err) {
    console.error("[API] Failed to acknowledge milestone:", err);
    if (err instanceof AppError) {
      next(err);
    } else {
      next(new AppError(
        ErrorCode.INTERNAL_ERROR,
        "Failed to acknowledge milestone",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "error",
        err instanceof Error ? { originalError: err.message } : undefined
      ));
    }
  }
}) as RequestHandler);

export default router;
