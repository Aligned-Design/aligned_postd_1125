/**
 * Reviews API Routes
 * Handles fetching and managing reviews from Google and Facebook
 */

import { Router, RequestHandler } from "express";
import { z } from "zod";
import { Review, ReviewListResponse, ReviewSentiment } from "@shared/reviews";
import { AppError } from "../lib/error-middleware";
import { ErrorCode, HTTP_STATUS } from "../lib/error-responses";
import { requireScope } from "../middleware/requireScope";
import { assertBrandAccess } from "../lib/brand-access";

const reviewsRouter = Router();

// ✅ VALIDATION: Zod schema for reviews routes
const BrandIdParamSchema = z.object({
  brandId: z.string().uuid("Invalid brand ID format"),
});

/**
 * Helper function to detect sentiment from rating and text
 */
function detectSentiment(rating: number, textLength: number): ReviewSentiment {
  if (rating >= 4) {
    return "positive";
  }
  if (rating === 3) {
    return textLength > 20 ? "negative" : "neutral";
  }
  return "negative";
}

/**
 * GET /api/reviews/:brandId
 * Get all reviews for a brand
 * RBAC: Requires 'content:view' scope
 */
reviewsRouter.get(
  "/:brandId",
  requireScope("content:view"),
  (async (req, res, next) => {
    try {
      // ✅ VALIDATION: Validate brandId parameter
      let brandId: string;
      try {
        const validated = BrandIdParamSchema.parse(req.params);
        brandId = validated.brandId;
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          throw new AppError(
            ErrorCode.VALIDATION_ERROR,
            "Invalid brand ID format",
            HTTP_STATUS.BAD_REQUEST,
            "warning",
            { validationErrors: validationError.errors },
            "Please provide a valid brand ID"
          );
        }
        throw validationError;
      }

      const authReq = req as any;
      const user = authReq.user || authReq.auth;
      const userScopes = user?.scopes || [];

      // Check for content:view scope
      if (!userScopes.includes("content:view")) {
        console.warn("[Reviews] Missing scope:", {
          brandId,
          userId: user?.id || user?.userId,
          userScopes,
          requiredScope: "content:view",
        });
        throw new AppError(
          ErrorCode.FORBIDDEN,
          "Missing required scope: content:view",
          HTTP_STATUS.FORBIDDEN,
          "warning",
          { brandId, userScopes, requiredScope: "content:view" },
          "You don't have permission to view content. Please contact your administrator."
        );
      }

      // ✅ SECURITY: Verify user has access to this brand using database-backed check
      await assertBrandAccess(req, brandId, true, true);

      // Future work: Replace with actual database query to content_items or reviews table
      // This feature is being built - returning empty array allows frontend to work without errors
      const reviews: Review[] = [];

      // Calculate stats
      const stats = {
        total: reviews.length,
        positive: reviews.filter((r) => r.sentiment === "positive").length,
        neutral: reviews.filter((r) => r.sentiment === "neutral").length,
        negative: reviews.filter((r) => r.sentiment === "negative").length,
        needsReply: reviews.filter((r) => r.replyStatus === "needs-reply").length,
        avgRating: reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0,
      };

      const response: ReviewListResponse = {
        reviews,
        total: reviews.length,
        stats,
      };

      (res as any).json(response);
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,
);

export default reviewsRouter;

