/**
 * Content Plan API Routes
 * 
 * Handles requests for:
 * - Generating content plans
 * - Fetching 7-day content plans
 * - Getting content for calendar/studio
 */

import { Router, RequestHandler } from "express";
import { generateContentPlan } from "../lib/content-planning-service";
import { assertBrandAccess } from "../lib/brand-access";
import { AppError } from "../lib/error-middleware";
import { ErrorCode, HTTP_STATUS } from "../lib/error-responses";
import { supabase } from "../lib/supabase";
import { authenticateUser } from "../middleware/security";
import { requireScope } from "../middleware/requireScope";

const contentPlanRouter = Router();

/**
 * GET /api/content-plan/:brandId
 * Get the 7-day content plan for a brand
 */
contentPlanRouter.get(
  "/:brandId",
  authenticateUser,
  requireScope("content:view"),
  (async (req, res, next) => {
    try {
      const { brandId } = req.params;

      // Verify brand access
      await assertBrandAccess(req, brandId, true, true);

      // Get content items for the next 7 days
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 7);

      const { data: contentItems, error } = await supabase
        .from("content_items")
        .select("*")
        .eq("brand_id", brandId)
        .gte("scheduled_for", startDate.toISOString())
        .lte("scheduled_for", endDate.toISOString())
        .order("scheduled_for", { ascending: true });

      if (error) {
        throw new AppError(
          ErrorCode.DATABASE_ERROR,
          "Failed to fetch content plan",
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
          "error",
          { originalError: error.message }
        );
      }

      // Get advisor recommendations from brand_kit
      const { data: brand } = await supabase
        .from("brands")
        .select("brand_kit")
        .eq("id", brandId)
        .single();

      const brandKit = (brand?.brand_kit as any) || {};
      const advisorRecommendations = brandKit.advisorRecommendations || [];

      (res as any).json({
        success: true,
        contentPlan: {
          brandId,
          items: (contentItems || []).map((item: any) => ({
            id: item.id,
            title: item.title,
            contentType: item.content_type,
            platform: item.platform,
            content: item.body,
            scheduledDate: item.scheduled_for ? new Date(item.scheduled_for).toISOString().split("T")[0] : null,
            scheduledTime: item.scheduled_for ? new Date(item.scheduled_for).toTimeString().slice(0, 5) : null,
            imageUrl: item.media_urls?.[0] || null,
            status: item.status,
          })),
          advisorRecommendations,
          generatedAt: brandKit.contentPlanGeneratedAt || null,
        },
      });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler
);

/**
 * POST /api/content-plan/:brandId/generate
 * Generate a new content plan for a brand
 */
contentPlanRouter.post(
  "/:brandId/generate",
  authenticateUser,
  requireScope("ai:generate"),
  (async (req, res, next) => {
    try {
      const { brandId } = req.params;

      // Verify brand access
      await assertBrandAccess(req, brandId, true, true);

      // Get tenantId from user or brand
      const user = (req as any).user;
      const tenantId = user?.workspaceId || user?.tenantId;

      // Generate content plan
      const contentPlan = await generateContentPlan(brandId, tenantId);

      // Store advisor recommendations in brand_kit
      const { data: brand } = await supabase
        .from("brands")
        .select("brand_kit")
        .eq("id", brandId)
        .single();

      const brandKit = (brand?.brand_kit as any) || {};
      brandKit.advisorRecommendations = contentPlan.advisorRecommendations;
      brandKit.contentPlanGeneratedAt = contentPlan.generatedAt;

      await supabase
        .from("brands")
        .update({
          brand_kit: brandKit,
          updated_at: new Date().toISOString(),
        })
        .eq("id", brandId);

      (res as any).json({
        success: true,
        contentPlan,
        message: "Content plan generated successfully",
      });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler
);

export default contentPlanRouter;

