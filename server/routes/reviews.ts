/**
 * Reviews API Routes
 * Handles fetching and managing reviews from Google and Facebook
 */

import { Router, RequestHandler } from "express";
import { Review, ReviewListResponse, ReviewSentiment } from "@shared/reviews";
import { AppError } from "../lib/error-middleware";
import { ErrorCode, HTTP_STATUS } from "../lib/error-responses";
import { requireScope } from "../middleware/requireScope";

const reviewsRouter = Router();

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
      const { brandId } = req.params;
      
      // Validate brandId parameter
      if (!brandId || brandId === "undefined") {
        throw new AppError(
          ErrorCode.BAD_REQUEST,
          "Brand ID is required",
          HTTP_STATUS.BAD_REQUEST,
          "warning",
          { brandId },
          "Please provide a valid brand ID"
        );
      }

      const authReq = req as any;
      const user = authReq.user || authReq.auth;
      const userBrandIds = Array.isArray(user?.brandIds) ? user.brandIds : (user?.brandId ? [user.brandId] : []);
      const userRole = user?.role?.toUpperCase();
      const userScopes = user?.scopes || [];

      // Enhanced logging for debugging
      console.log("[Reviews] Request:", {
        brandId,
        userId: user?.id || user?.userId,
        userEmail: user?.email,
        userBrandIds,
        userRole,
        userScopes,
        hasContentViewScope: userScopes.includes("content:view"),
        hasAccess: userBrandIds.includes(brandId) || userRole === "SUPERADMIN",
      });

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

      // Verify user has access to this brand
      // Allow SUPERADMIN or users with brand access
      // In dev mode, allow access if brandIds are missing (for testing)
      const isDev = process.env.NODE_ENV !== "production";
      const isSuperAdmin = userRole === "SUPERADMIN";
      const hasBrandAccess = userBrandIds.includes(brandId);
      
      let hasAccess = hasBrandAccess || isSuperAdmin;
      
      // Dev mode: allow access if brandIds are missing (for testing)
      if (!hasAccess && isDev && !userBrandIds.length) {
        console.warn("[Reviews] Dev mode: Allowing access without brandIds for testing");
        hasAccess = true;
      }
      
      if (!hasAccess) {
        console.warn("[Reviews] Access denied:", {
          brandId,
          userId: user?.id || user?.userId,
          userBrandIds,
          userRole,
          isSuperAdmin,
          hasBrandAccess,
        });
        throw new AppError(
          ErrorCode.FORBIDDEN,
          "Not authorized for this brand",
          HTTP_STATUS.FORBIDDEN,
          "warning",
          { brandId, userBrandIds, userRole },
          "You don't have access to reviews for this brand. Please contact your administrator."
        );
      }

      // TODO: Replace with actual database query
      // For now, return empty array as placeholder
      // This allows the frontend to work without errors while the feature is being built
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

