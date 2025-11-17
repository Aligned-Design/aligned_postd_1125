/**
 * Brand Posting Schedule Routes
 * 
 * Handles preferred posting schedule preferences for brands.
 * This is a preference system (suggestions only), not a blocking system.
 */

import { RequestHandler } from "express";
import { publishingDBService } from "../lib/publishing-db-service";
import { AppError } from "../lib/error-middleware";
import { ErrorCode, HTTP_STATUS } from "../lib/error-responses";
import { canAccessBrand } from "../lib/auth-context";

/**
 * GET /api/brands/:brandId/posting-schedule
 * Get preferred posting schedule for a brand
 */
export const getBrandPostingSchedule: RequestHandler = async (req, res, next) => {
  try {
    const { brandId } = req.params;
    const authContext = (req as any).auth || (req as any).user;

    if (!brandId) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "brandId is required",
        HTTP_STATUS.BAD_REQUEST,
        "warning"
      );
    }

    // Verify user has access to this brand
    if (authContext && !canAccessBrand(authContext, brandId)) {
      throw new AppError(
        ErrorCode.FORBIDDEN,
        "You do not have permission to access this brand",
        HTTP_STATUS.FORBIDDEN,
        "warning"
      );
    }

    // Get brand posting config
    const config = await publishingDBService.getBrandPostingConfig(brandId);

    if (!config) {
      throw new AppError(
        ErrorCode.NOT_FOUND,
        "Brand not found",
        HTTP_STATUS.NOT_FOUND,
        "warning"
      );
    }

    // Extract preferred posting schedule from posting_config
    const schedule = (config.posting_config?.preferredPostingSchedule as {
      preferredDays?: string[];
      preferredWindows?: { [day: string]: Array<{ start: string; end: string }> };
    }) || {
      preferredDays: [],
      preferredWindows: {},
    };

    (res as any).json({
      success: true,
      schedule: {
        preferredDays: schedule.preferredDays || [],
        preferredWindows: schedule.preferredWindows || {},
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/brands/:brandId/posting-schedule
 * Update preferred posting schedule for a brand
 */
export const updateBrandPostingSchedule: RequestHandler = async (req, res, next) => {
  try {
    const { brandId } = req.params;
    const { schedule } = req.body;
    const authContext = (req as any).auth || (req as any).user;

    if (!brandId) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "brandId is required",
        HTTP_STATUS.BAD_REQUEST,
        "warning"
      );
    }

    if (!schedule) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "schedule is required",
        HTTP_STATUS.BAD_REQUEST,
        "warning"
      );
    }

    // Verify user has access to this brand
    if (authContext && !canAccessBrand(authContext, brandId)) {
      throw new AppError(
        ErrorCode.FORBIDDEN,
        "You do not have permission to access this brand",
        HTTP_STATUS.FORBIDDEN,
        "warning"
      );
    }

    // Validate schedule structure
    if (!Array.isArray(schedule.preferredDays)) {
      throw new AppError(
        ErrorCode.INVALID_FORMAT,
        "preferredDays must be an array",
        HTTP_STATUS.BAD_REQUEST,
        "warning"
      );
    }

    if (typeof schedule.preferredWindows !== "object" || schedule.preferredWindows === null) {
      throw new AppError(
        ErrorCode.INVALID_FORMAT,
        "preferredWindows must be an object",
        HTTP_STATUS.BAD_REQUEST,
        "warning"
      );
    }

    // Update schedule
    await publishingDBService.updateBrandPostingSchedule(brandId, {
      preferredDays: schedule.preferredDays,
      preferredWindows: schedule.preferredWindows,
    });

    (res as any).json({
      success: true,
      message: "Posting schedule updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

