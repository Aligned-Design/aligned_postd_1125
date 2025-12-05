/**
 * Brand ID Validation Middleware
 * 
 * Ensures brand_id is valid UUID format (or temporary format during onboarding)
 * and validates user has access to the brand.
 * 
 * Usage:
 *   router.get("/:brandId", validateBrandId, handler);
 *   router.post("/:brandId", validateBrandId, handler);
 */

import { Request, Response, NextFunction } from "express";
import { AppError } from "../lib/error-middleware";
import { ErrorCode, HTTP_STATUS } from "../lib/error-responses";
import { assertBrandAccess } from "../lib/brand-access";

/**
 * UUID validation regex
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Temporary brand ID format (used during onboarding)
 * Format: brand_${timestamp}
 */
const TEMP_BRAND_ID_REGEX = /^brand_\d+$/;

/**
 * Validate brand_id format and access
 * 
 * Checks:
 * 1. brand_id exists in params, query, or body
 * 2. brand_id is valid UUID or temporary format
 * 3. User has access to the brand (if UUID format)
 * 
 * For temporary brand IDs (during onboarding), access check is skipped
 */
export function validateBrandId(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    // Extract brand_id from params, query, or body
    const brandId = 
      (req.params as Record<string, string>).brandId ||
      (req.query as Record<string, string>).brandId ||
      (req.body as Record<string, string>)?.brandId ||
      (req.body as Record<string, string>)?.brand_id;

    if (!brandId) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "Brand ID is required",
        HTTP_STATUS.BAD_REQUEST,
        "warning",
        undefined,
        "Please provide brandId in URL params, query, or request body"
      );
    }

    // Validate format: UUID or temporary format
    const isUUID = UUID_REGEX.test(brandId);
    const isTemp = TEMP_BRAND_ID_REGEX.test(brandId);

    if (!isUUID && !isTemp) {
      throw new AppError(
        ErrorCode.INVALID_FORMAT,
        "Invalid brand ID format",
        HTTP_STATUS.BAD_REQUEST,
        "warning",
        { brandId },
        "Brand ID must be a valid UUID or temporary format (brand_<timestamp>)"
      );
    }

    // For UUID format, verify user has access to the brand
    // For temporary format (onboarding), skip access check
    if (isUUID) {
      // Use assertBrandAccess to verify user has access
      // This will throw if user doesn't have access
      assertBrandAccess(req, brandId, true, true)
        .then(() => {
          // Attach validated brand_id to request
          (req as any).validatedBrandId = brandId;
          next();
        })
        .catch((error) => {
          // assertBrandAccess throws AppError, pass it through
          next(error);
        });
    } else {
      // Temporary brand ID (onboarding) - skip access check
      (req as any).validatedBrandId = brandId;
      next();
    }
  } catch (error) {
    // Pass through AppError, wrap others
    if (error instanceof AppError) {
      next(error);
    } else {
      next(
        new AppError(
          ErrorCode.INTERNAL_ERROR,
          "Brand ID validation failed",
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
          "error",
          { error: error instanceof Error ? error.message : String(error) }
        )
      );
    }
  }
}

/**
 * Validate brand_id format only (no access check)
 * Useful for routes that need format validation but handle access differently
 */
export function validateBrandIdFormat(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const brandId = 
      (req.params as Record<string, string>).brandId ||
      (req.query as Record<string, string>).brandId ||
      (req.body as Record<string, string>)?.brandId ||
      (req.body as Record<string, string>)?.brand_id;

    if (!brandId) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "Brand ID is required",
        HTTP_STATUS.BAD_REQUEST,
        "warning",
        undefined,
        "Please provide brandId in URL params, query, or request body"
      );
    }

    const isUUID = UUID_REGEX.test(brandId);
    const isTemp = TEMP_BRAND_ID_REGEX.test(brandId);

    if (!isUUID && !isTemp) {
      throw new AppError(
        ErrorCode.INVALID_FORMAT,
        "Invalid brand ID format",
        HTTP_STATUS.BAD_REQUEST,
        "warning",
        { brandId },
        "Brand ID must be a valid UUID or temporary format (brand_<timestamp>)"
      );
    }

    (req as any).validatedBrandId = brandId;
    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(
        new AppError(
          ErrorCode.INTERNAL_ERROR,
          "Brand ID format validation failed",
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
          "error",
          { error: error instanceof Error ? error.message : String(error) }
        )
      );
    }
  }
}

