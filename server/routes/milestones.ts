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

// Mock data for development
const MOCK_MILESTONES = [
  {
    key: "first_post",
    title: "First Post Published",
    description: "You've published your first piece of content!",
    achieved: true,
    achievedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    key: "ten_posts",
    title: "10 Posts Published",
    description: "You're building momentum!",
    achieved: false,
    achievedAt: null,
  },
];

/**
 * GET /api/milestones
 * Fetch all milestones for the current workspace
 */
router.get("/", (async (req, res, next) => {
  try {
    // Check if we should use mocks
    const useMocks =
      process.env.USE_MOCKS === "true" ||
      process.env.NODE_ENV === "development";

    if (useMocks) {
      return (res as any).json({ success: true, milestones: MOCK_MILESTONES });
    }

    // Get workspaceId from authenticated session or header fallback
    // Future work: Extract from req.user.workspaceId when available
    const workspaceId =
      (req as any).user?.workspaceId ||
      (req.headers["x-workspace-id"] as string) ||
      "default-workspace";

    const milestones = await getMilestones(workspaceId);
    (res as any).json({ success: true, milestones });
  } catch (err) {
    console.error("[Milestone] Failed to fetch milestones:", err);
    // Graceful fallback: return empty array instead of error
    (res as any).json({ success: true, milestones: [], total: 0 });
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
