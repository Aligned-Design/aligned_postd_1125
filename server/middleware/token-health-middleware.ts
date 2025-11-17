/**
 * Token Health Check Middleware
 *
 * Middleware to verify token health before executing actions that
 * require valid OAuth connections (scheduling, publishing, etc.)
 */

import { Request, Response, NextFunction } from "express";
import { AppError } from "../lib/error-middleware";
import { ErrorCode, HTTP_STATUS } from "../lib/error-responses";
import {
  checkTokenHealth,
  getUnhealthyAccounts,
  isChannelHealthy,
} from "../lib/token-lifecycle";

/**
 * Middleware: Require healthy token for the specified account
 *
 * Usage: app.post("/api/schedule", tokenHealthCheck, handler)
 *
 * Expects: req.body.account_id or req.query.account_id
 */
export async function tokenHealthCheck(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const accountId = req.body.account_id || req.query.account_id;

    if (!accountId) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "Missing account_id in request",
        HTTP_STATUS.BAD_REQUEST,
        "warning"
      );
    }

    const health = await checkTokenHealth(accountId);

    if (!health || !health.is_healthy) {
      const status = health?.status || "unknown";
      const daysLeft = health?.expires_in_days || "?";
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        `Account token is ${status} (expires in ${daysLeft} days). Please reconnect.`,
        HTTP_STATUS.BAD_REQUEST,
        "warning",
        { account_id: accountId, token_status: status },
        "Please reconnect your account to continue"
      );
    }

    // Attach health info to request for logging
    (req as any).tokenHealth = health;
    next();
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      error instanceof Error ? error.message : "Token health check failed",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "error"
    );
  }
}

/**
 * Middleware: Check all tokens for a brand and warn if any are unhealthy
 *
 * Usage: app.get("/api/dashboard", tokenHealthWarning, handler)
 *
 * Expects: req.body.brand_id or req.query.brand_id
 *
 * Note: Does NOT block the request, just attaches warnings
 */
export async function tokenHealthWarning(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const brandId = req.body.brand_id || req.query.brand_id;

    if (brandId) {
      const unhealthy = await getUnhealthyAccounts(brandId);
      if (unhealthy.length > 0) {
        (req as any).tokenHealthWarnings = {
          count: unhealthy.length,
          accounts: unhealthy,
          message: `${unhealthy.length} account(s) require attention`,
        };
      }
    }

    next();
  } catch (error) {
    // Log but don't block
    console.warn("Token health warning check failed:", error);
    next();
  }
}

/**
 * Endpoint: GET /api/health/tokens/:brandId
 * Get token health status for all accounts in a brand
 */
export async function getTokenHealthStatus(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { brandId } = req.params;

    const unhealthy = await getUnhealthyAccounts(brandId);

    const response = {
      brand_id: brandId,
      unhealthy_count: unhealthy.length,
      accounts: unhealthy.map((h) => ({
        account_id: h.account_id,
        platform: h.platform,
        status: h.status,
        expires_in_days: h.expires_in_days,
        action_required: !h.is_healthy,
      })),
      timestamp: new Date().toISOString(),
    };

    (res as any).json(response);
  } catch (error) {
    console.error("Failed to get token health status:", error);
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      error instanceof Error ? error.message : "Failed to check token health",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "error"
    );
  }
}
