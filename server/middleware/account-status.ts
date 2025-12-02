import { Request, Response, NextFunction } from "express";
import { AppError } from "../lib/error-middleware";
import { ErrorCode, HTTP_STATUS } from "../lib/error-responses";
import {
  canPerformAction,
  getAccountPermissions,
} from "../lib/account-status-service";

/**
 * Account Status Middleware
 * Enforces restrictions based on payment status
 */

export interface AccountUser {
  id: string;
  plan_status: "active" | "trial" | "past_due" | "archived" | "deleted";
  past_due_since?: string | null;
}

/**
 * Check if user can publish content
 */
export async function checkCanPublish(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = req.user as AccountUser | undefined;

    if (!user) {
      return next(new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", HTTP_STATUS.UNAUTHORIZED, "warning"));
    }

    const daysPastDue = calculateDaysPastDue(user.past_due_since);
    const canPublish = canPerformAction(
      user.plan_status,
      "canPublish",
      daysPastDue,
    );

    if (!canPublish) {
      return res.status(403).json({
        error: "Publishing is disabled",
        code: "PUBLISHING_DISABLED",
        message:
          "Your account publishing has been paused due to payment issues. Please update your billing information to continue.",
        accountStatus: user.plan_status,
        daysPastDue,
        action: "Update payment at /billing",
      });
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Check if user can approve content
 */
export async function checkCanApprove(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = req.user as AccountUser | undefined;

    if (!user) {
      return next(new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", HTTP_STATUS.UNAUTHORIZED, "warning"));
    }

    const daysPastDue = calculateDaysPastDue(user.past_due_since);
    const canApprove = canPerformAction(
      user.plan_status,
      "canApprove",
      daysPastDue,
    );

    if (!canApprove) {
      return res.status(403).json({
        error: "Approvals are disabled",
        code: "APPROVALS_DISABLED",
        message:
          "Approval workflows have been paused. Update your payment method to restore access.",
        accountStatus: user.plan_status,
        daysPastDue,
      });
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Check if user can generate AI content
 */
export async function checkCanGenerateContent(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = req.user as AccountUser | undefined;

    if (!user) {
      return next(new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", HTTP_STATUS.UNAUTHORIZED, "warning"));
    }

    const daysPastDue = calculateDaysPastDue(user.past_due_since);
    const permissions = getAccountPermissions(user.plan_status, daysPastDue);

    if (!permissions.canGenerateContent) {
      return res.status(403).json({
        error: "Content generation is disabled",
        code: "CONTENT_GENERATION_DISABLED",
        message:
          "AI content generation is not available for archived accounts.",
        accountStatus: user.plan_status,
      });
    }

    // Check daily limit for restricted accounts
    if (
      permissions.maxDailyAIGenerations !== null &&
      permissions.maxDailyAIGenerations > 0
    ) {
      // Check user's daily generation count
      // const todayCount = await getTodayGenerationCount(user.id);
      const todayCount = 0; // Mock

      if (todayCount >= permissions.maxDailyAIGenerations) {
        return res.status(429).json({
          error: "Daily generation limit reached",
          code: "DAILY_LIMIT_REACHED",
          message: `You've reached your daily limit of ${permissions.maxDailyAIGenerations} AI generations. Update your payment to unlock unlimited access.`,
          limit: permissions.maxDailyAIGenerations,
          used: todayCount,
        });
      }
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Check if user can manage brands
 */
export async function checkCanManageBrands(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = req.user as AccountUser | undefined;

    if (!user) {
      return next(new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", HTTP_STATUS.UNAUTHORIZED, "warning"));
    }

    const daysPastDue = calculateDaysPastDue(user.past_due_since);
    const canManageBrands = canPerformAction(
      user.plan_status,
      "canManageBrands",
      daysPastDue,
    );

    if (!canManageBrands) {
      return res.status(403).json({
        error: "Brand management is disabled",
        code: "BRAND_MANAGEMENT_DISABLED",
        message:
          "You cannot add or modify brands while your account has payment issues. Please update your billing information.",
        accountStatus: user.plan_status,
      });
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Attach account status to request
 */
export async function attachAccountStatus(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = req.user as AccountUser | undefined;

    if (user) {
      const daysPastDue = calculateDaysPastDue(user.past_due_since);
      const permissions = getAccountPermissions(user.plan_status, daysPastDue);

      // Attach to request for downstream use
      (req as any).accountStatus = {
        planStatus: user.plan_status,
        daysPastDue,
        permissions,
      };
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Helper function to calculate days past due
 */
function calculateDaysPastDue(pastDueSince?: string | null): number {
  if (!pastDueSince) return 0;

  const pastDueDate = new Date(pastDueSince);
  const now = new Date();
  const diffMs = now.getTime() - pastDueDate.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}
