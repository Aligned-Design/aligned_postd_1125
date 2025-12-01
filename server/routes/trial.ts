/**
 * Trial API Routes
 * 
 * Handles trial status and initialization.
 */

import { Router, Request, Response, RequestHandler } from "express";
import { getTrialStatus, incrementTrialCount } from "../middleware/trial";
import { authenticateUser } from "../middleware/security";
import { AppError } from "../lib/error-middleware";
import { ErrorCode, HTTP_STATUS } from "../lib/error-responses";

const router = Router();

/**
 * GET /api/trial/status
 * Get current trial status for authenticated user
 */
router.get("/status", authenticateUser, (async (req: Request, res: Response, next) => {
  try {
    const user = (req as any).user;

    if (!user) {
      throw new AppError(
        ErrorCode.UNAUTHORIZED,
        "Authentication required",
        HTTP_STATUS.UNAUTHORIZED,
        "warning"
      );
    }

    const status = getTrialStatus(user);

    (res as any).json({
      success: true,
      data: status,
    });
  } catch (error) {
    next(error);
  }
}) as RequestHandler);

/**
 * POST /api/trial/start
 * Initialize trial period for user
 */
router.post("/start", authenticateUser, (async (req: Request, res: Response, next) => {
  try {
    const user = (req as any).user;

    if (!user) {
      throw new AppError(
        ErrorCode.UNAUTHORIZED,
        "Authentication required",
        HTTP_STATUS.UNAUTHORIZED,
        "warning"
      );
    }

    // Check if already on paid plan
    if (user.plan !== "trial") {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        "User already has a paid plan",
        HTTP_STATUS.BAD_REQUEST,
        "warning"
      );
    }

    // Check if trial already started
    if (user.trial_started_at) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        "Trial already started",
        HTTP_STATUS.BAD_REQUEST,
        "warning",
        { trialStartedAt: user.trial_started_at }
      );
    }

    // Start trial (7 days from now)
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Update user in database (mock - replace with actual DB call)
    // await db.from('users').update({
    //   trial_started_at: now.toISOString(),
    //   trial_expires_at: expiresAt.toISOString(),
    // }).eq('id', user.id);

    (res as any).json({
      success: true,
      data: {
        trialStartedAt: now.toISOString(),
        trialExpiresAt: expiresAt.toISOString(),
        daysRemaining: 7,
      },
    });
  } catch (error) {
    next(error);
  }
}) as RequestHandler);

export default router;
