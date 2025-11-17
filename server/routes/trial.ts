import { Router, Request, Response } from "express";
import { getTrialStatus, incrementTrialCount } from "../middleware/trial";
import { authenticateUser } from "../middleware/security";
import { AppError } from "../lib/error-middleware";

const router = Router();

/**
 * GET /api/trial/status
 * Get current trial status for authenticated user
 */
router.get("/status", authenticateUser, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;

    if (!user) {
      throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const status = getTrialStatus(user);

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error("Error fetching trial status:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch trial status",
    });
  }
});

/**
 * POST /api/trial/start
 * Initialize trial period for user
 */
router.post("/start", authenticateUser, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;

    if (!user) {
      throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    }

    // Check if already on paid plan
    if (user.plan !== "trial") {
      return res.status(400).json({
        success: false,
        error: "User already has a paid plan",
      });
    }

    // Check if trial already started
    if (user.trial_started_at) {
      return res.status(400).json({
        success: false,
        error: "Trial already started",
        trialStartedAt: user.trial_started_at,
      });
    }

    // Start trial (7 days from now)
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Update user in database (mock - replace with actual DB call)
    // await db.from('users').update({
    //   trial_started_at: now.toISOString(),
    //   trial_expires_at: expiresAt.toISOString(),
    // }).eq('id', user.id);

    res.json({
      success: true,
      data: {
        trialStartedAt: now.toISOString(),
        trialExpiresAt: expiresAt.toISOString(),
        daysRemaining: 7,
      },
    });
  } catch (error) {
    console.error("Error starting trial:", error);
    res.status(500).json({
      success: false,
      error: "Failed to start trial",
    });
  }
});

export default router;
