/**
 * Brand Members API Route
 * 
 * Provides safe access to brand_members data via backend API.
 * Prevents frontend from calling Supabase directly.
 */

import { RequestHandler, Router } from "express";
import { supabase } from "../lib/supabase";
import { AppError } from "../lib/error-middleware";
import { ErrorCode, HTTP_STATUS } from "../lib/error-responses";
import { assertBrandAccess } from "../lib/brand-access";

const brandMembersRouter = Router();

/**
 * GET /api/brands/:brandId/members
 * Get all members for a brand
 * 
 * Auth: authenticateUser + requireScope("content:view")
 * Brand Access: User must have access to the brand
 */
brandMembersRouter.get(
  "/:brandId/members",
  (async (req, res, next) => {
    try {
      const { brandId } = req.params;

      // Verify user has access to this brand
      assertBrandAccess(req, brandId);

      // Fetch brand members from database
      // Using user token (anon/user) - RLS will enforce tenant isolation
      const { data, error } = await supabase
        .from("brand_members")
        .select("id, user_id, brand_id, role, created_at, updated_at")
        .eq("brand_id", brandId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[BrandMembers] Database error:", error);
        throw new AppError(
          ErrorCode.DATABASE_ERROR,
          "Failed to fetch brand members",
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
          "error",
          { originalError: error.message }
        );
      }

      (res as any).json({
        success: true,
        members: data || [],
        total: data?.length || 0,
      });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler
);

export default brandMembersRouter;

