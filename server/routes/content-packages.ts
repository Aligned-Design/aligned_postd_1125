/**
 * ContentPackage API Routes
 * 
 * Handles ContentPackage CRUD operations for agent collaboration.
 */

import { Router, RequestHandler } from "express";
import { ContentPackageStorage } from "../lib/collaboration-storage";
import { assertBrandAccess } from "../lib/brand-access";
import { AppError } from "../lib/error-middleware";
import { ErrorCode, HTTP_STATUS } from "../lib/error-responses";
import type { ContentPackage } from "@shared/collaboration-artifacts";
import {
  SaveContentPackageSchema,
  GetContentPackageQuerySchema,
  GetContentPackageParamsSchema,
} from "@shared/validation-schemas";

const router = Router();

/**
 * POST /api/content-packages
 * Create or update a ContentPackage
 */
export const saveContentPackage: RequestHandler = async (req, res) => {
  try {
    // ✅ VALIDATION: Validate request body with Zod schema
    const validated = SaveContentPackageSchema.parse(req.body);
    const { contentPackage, brandId } = validated;

    // ✅ SECURITY: Verify user has access to this brand
    await assertBrandAccess(req, brandId, true, true);

    // Ensure brandId matches (Zod already validated structure, but double-check brandId match)
    if (contentPackage.brandId !== brandId) {
      throw new AppError(
        ErrorCode.FORBIDDEN,
        "ContentPackage brandId must match request brandId",
        HTTP_STATUS.FORBIDDEN,
        "error"
      );
    }

    // Save ContentPackage
    const saved = await ContentPackageStorage.save(contentPackage as ContentPackage);

    res.json({
      success: true,
      contentPackageId: saved.id,
      contentPackage: saved,
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    // Zod validation errors are caught and formatted by error middleware
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "Failed to save ContentPackage",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "error",
      { originalError: error instanceof Error ? error.message : String(error) }
    );
  }
};

/**
 * GET /api/content-packages/:packageId
 * Get a ContentPackage by ID
 */
export const getContentPackage: RequestHandler = async (req, res) => {
  try {
    // ✅ VALIDATION: Validate URL params and query params with Zod schemas
    const params = GetContentPackageParamsSchema.parse(req.params);
    const query = GetContentPackageQuerySchema.parse(req.query);
    const { packageId } = params;
    const { brandId } = query;

    // Get ContentPackage
    const contentPackage = await ContentPackageStorage.getById(packageId);

    if (!contentPackage) {
      throw new AppError(
        ErrorCode.NOT_FOUND,
        "ContentPackage not found",
        HTTP_STATUS.NOT_FOUND,
        "warning"
      );
    }

    // ✅ SECURITY: Verify brand access if brandId provided
    if (brandId) {
      await assertBrandAccess(req, brandId, true, true);
      if (contentPackage.brandId !== brandId) {
        throw new AppError(
          ErrorCode.FORBIDDEN,
          "ContentPackage does not belong to this brand",
          HTTP_STATUS.FORBIDDEN,
          "error"
        );
      }
    }

    res.json({
      success: true,
      contentPackage,
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    // Zod validation errors are caught and formatted by error middleware
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "Failed to get ContentPackage",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "error",
      { originalError: error instanceof Error ? error.message : String(error) }
    );
  }
};

router.post("/", saveContentPackage);
router.get("/:packageId", getContentPackage);

export default router;

