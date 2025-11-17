import express from "express";
import { getMilestones, acknowledgeMilestone } from "../lib/milestones";

const router = express.Router();

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
router.get("/", async (req, res) => {
  try {
    // Check if we should use mocks
    const useMocks =
      process.env.USE_MOCKS === "true" ||
      process.env.NODE_ENV === "development";

    if (useMocks) {
      return res.json(MOCK_MILESTONES);
    }

    // TODO: Get workspaceId from authenticated session
    const workspaceId =
      (req.headers["x-workspace-id"] as string) || "default-workspace";

    const milestones = await getMilestones(workspaceId);
    res.json(milestones);
  } catch (err) {
    console.error("[Milestone] Failed to fetch milestones:", err);
    // Graceful fallback: return empty array instead of error
    res.json({ items: [], total: 0 });
  }
});

/**
 * POST /api/milestones/:key/ack
 * Acknowledge a milestone (user has seen it)
 */
router.post("/:key/ack", async (req, res) => {
  try {
    const { key } = req.params;
    // TODO: Get workspaceId from authenticated session
    const workspaceId =
      (req.headers["x-workspace-id"] as string) || "default-workspace";

    await acknowledgeMilestone(workspaceId, key as any);
    res.json({ success: true });
  } catch (err) {
    console.error("[API] Failed to acknowledge milestone:", err);
    res.status(500).json({ error: "Failed to acknowledge milestone" });
  }
});

export default router;
