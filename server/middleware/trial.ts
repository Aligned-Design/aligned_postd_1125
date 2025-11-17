import { Request, Response, NextFunction } from "express";
import { AppError } from "../lib/error-middleware";

/**
 * Trial Middleware - Enforces trial limitations
 */

export interface TrialUser {
  id: string;
  plan: "trial" | "base" | "agency";
  trial_published_count: number;
  trial_expires_at: string | null;
}

const TRIAL_POST_LIMIT = 2;

/**
 * Check if user has exceeded trial publish limit
 */
export async function checkTrialLimit(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = req.user as TrialUser | undefined;

    if (!user) {
      return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));
    }

    // Only apply limits to trial users
    if (user.plan !== "trial") {
      return next();
    }

    // Check if trial has expired
    if (user.trial_expires_at) {
      const expiresAt = new Date(user.trial_expires_at);
      if (expiresAt < new Date()) {
        return res.status(403).json({
          error: "Trial period has expired",
          code: "TRIAL_EXPIRED",
          message: "Your 7-day trial has ended. Please upgrade to continue.",
        });
      }
    }

    // Check publish limit
    if (user.trial_published_count >= TRIAL_POST_LIMIT) {
      return res.status(403).json({
        error: "Trial publish limit reached",
        code: "TRIAL_LIMIT_REACHED",
        message: `Trial users can publish up to ${TRIAL_POST_LIMIT} posts. Please upgrade to continue.`,
        trialUsed: user.trial_published_count,
        trialMax: TRIAL_POST_LIMIT,
      });
    }

    // User is within trial limits
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Get trial status for user
 */
export function getTrialStatus(user: TrialUser) {
  if (user.plan !== "trial") {
    return {
      isTrial: false,
      publishedCount: 0,
      maxPosts: 0,
      remainingPosts: 0,
      daysRemaining: null,
      isExpired: false,
    };
  }

  const publishedCount = user.trial_published_count || 0;
  const remainingPosts = Math.max(0, TRIAL_POST_LIMIT - publishedCount);

  let daysRemaining = null;
  let isExpired = false;

  if (user.trial_expires_at) {
    const expiresAt = new Date(user.trial_expires_at);
    const now = new Date();
    const diffMs = expiresAt.getTime() - now.getTime();
    daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    isExpired = expiresAt < now;
  }

  return {
    isTrial: true,
    publishedCount,
    maxPosts: TRIAL_POST_LIMIT,
    remainingPosts,
    daysRemaining,
    isExpired,
    canPublish: publishedCount < TRIAL_POST_LIMIT && !isExpired,
  };
}

/**
 * Increment trial publish count
 */
export async function incrementTrialCount(
  userId: string,
  db: any,
): Promise<void> {
  await db
    .from("users")
    .update({
      trial_published_count: db.raw("trial_published_count + 1"),
    })
    .eq("id", userId);
}
