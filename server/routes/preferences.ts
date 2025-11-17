import { RequestHandler } from "express";
import { UserPreferences } from "@shared/preferences";
import { preferencesDB } from "../lib/preferences-db-service";
import { AppError } from "../lib/error-middleware";
import { ErrorCode, HTTP_STATUS } from "../lib/error-responses";

interface _PreferencesUpdateRequest {
  [key: string]: unknown;
}

interface PreferencesResponse {
  success: boolean;
  preferences?: UserPreferences;
  error?: string;
}

export const getPreferences: RequestHandler = async (req, res, next) => {
  try {
    // Get userId from authentication context (from Issue #6)
    const userId = (req as any).user?.id || (req as any).userId;
    const { brandId } = req.query;

    if (!userId) {
      throw new AppError(
        ErrorCode.UNAUTHORIZED,
        "User ID is required",
        HTTP_STATUS.UNAUTHORIZED,
        "warning"
      );
    }

    if (!brandId) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "brandId is required",
        HTTP_STATUS.BAD_REQUEST,
        "warning"
      );
    }

    // Fetch preferences from database
    const preferences = await preferencesDB.getPreferences(userId, brandId as string);

    const response: PreferencesResponse = {
      success: true,
      preferences: (preferences || {}) as unknown as UserPreferences,
    };

    (res as any).json(response);
  } catch (error) {
    next(error);
  }
};

export const updatePreferences: RequestHandler = async (req, res, next) => {
  try {
    // Get userId from authentication context (from Issue #6)
    const userId = (req as any).user?.id || (req as any).userId;
    const { brandId, ...updateData } = req.body;

    if (!userId) {
      throw new AppError(
        ErrorCode.UNAUTHORIZED,
        "User ID is required",
        HTTP_STATUS.UNAUTHORIZED,
        "warning"
      );
    }

    if (!brandId) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "brandId is required",
        HTTP_STATUS.BAD_REQUEST,
        "warning"
      );
    }

    if (!updateData || Object.keys(updateData).length === 0) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "At least one preference field is required",
        HTTP_STATUS.BAD_REQUEST,
        "warning"
      );
    }

    // Update preferences in database
    const updatedPreferences = await preferencesDB.updatePreferences(
      userId,
      brandId,
      updateData
    );

    const response: PreferencesResponse = {
      success: true,
      preferences: (updatedPreferences || {}) as unknown as UserPreferences,
    };

    (res as any).json(response);
  } catch (error) {
    next(error);
  }
};

export const exportPreferences: RequestHandler = async (req, res, next) => {
  try {
    // Get userId from authentication context (from Issue #6)
    const userId = (req as any).user?.id || (req as any).userId;
    const { brandId } = req.query;

    if (!userId) {
      throw new AppError(
        ErrorCode.UNAUTHORIZED,
        "User ID is required",
        HTTP_STATUS.UNAUTHORIZED,
        "warning"
      );
    }

    if (!brandId) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "brandId is required",
        HTTP_STATUS.BAD_REQUEST,
        "warning"
      );
    }

    // Fetch preferences from database for export
    const exportData = await preferencesDB.exportPreferences(
      userId,
      brandId as string
    );

    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=preferences-${brandId}-${new Date().toISOString().split('T')[0]}.json`,
    );
    (res as any).json(exportData);
  } catch (error) {
    next(error);
  }
};
