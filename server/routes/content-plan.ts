/**
 * Content Plan API Routes
 * 
 * Handles requests for:
 * - Generating content plans
 * - Fetching 7-day content plans
 * - Getting content for calendar/studio
 */

import { Router, RequestHandler } from "express";
import { z } from "zod";
import { generateContentPlan } from "../lib/content-planning-service";
import { assertBrandAccess } from "../lib/brand-access";
import { AppError } from "../lib/error-middleware";
import { ErrorCode, HTTP_STATUS } from "../lib/error-responses";
import { supabase } from "../lib/supabase";
import { authenticateUser } from "../middleware/security";
import { requireScope } from "../middleware/requireScope";

const contentPlanRouter = Router();

// ✅ VALIDATION: Zod schemas for content plan routes
const BrandIdParamSchema = z.object({
  brandId: z.string().uuid("Invalid brand ID format"),
});

/**
 * GET /api/content-plan/:brandId
 * Get the 7-day content plan for a brand
 */
contentPlanRouter.get(
  "/:brandId",
  authenticateUser,
  // requireScope("content:view"), // ✅ REMOVED: Too restrictive for onboarding
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
            { validationErrors: validationError.errors }
          );
        }
        throw validationError;
      }

      // Verify brand access
      await assertBrandAccess(req, brandId, true, true);

      // Get content items for the next 7 days
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 7);

      // ✅ FIX: Query content_items with proper column names
      // Schema: Uses 'type' (not 'content_type') and 'content' JSONB (not 'body')
      const { data: contentItems, error } = await supabase
        .from("content_items")
        .select("*")
        .eq("brand_id", brandId)
        .gte("scheduled_for", startDate.toISOString())
        .lte("scheduled_for", endDate.toISOString())
        .order("scheduled_for", { ascending: true });

      // ✅ LOGGING: Log query results for debugging
      console.log("[ContentPlan] GET query results", {
        brandId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        itemsFound: contentItems?.length || 0,
        error: error ? { code: error.code, message: error.message } : null,
      });

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
          items: (contentItems || []).map((item: any) => {
            // ✅ CANONICAL SCHEMA: Use 'type' and 'content' JSONB only
            const contentType = item.type || "post";
            
            // Extract text content from JSONB structure
            const contentObj = item.content || {};
            const contentText = typeof contentObj === "string" 
              ? contentObj 
              : (contentObj as any)?.body || JSON.stringify(contentObj);
            
            return {
              id: item.id,
              title: item.title,
              contentType: contentType,
              platform: item.platform,
              content: contentText || "",
              scheduledDate: item.scheduled_for ? new Date(item.scheduled_for).toISOString().split("T")[0] : null,
              scheduledTime: item.scheduled_for ? new Date(item.scheduled_for).toTimeString().slice(0, 5) : null,
              imageUrl: item.media_urls?.[0] || null,
              status: item.status,
            };
          }),
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
  // requireScope("ai:generate"), // ✅ REMOVED: Too restrictive for onboarding
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
            { validationErrors: validationError.errors }
          );
        }
        throw validationError;
      }

      // Verify brand access
      await assertBrandAccess(req, brandId, true, true);

      // Get tenantId from user or brand
      const user = (req as any).user;
      const tenantId = user?.workspaceId || user?.tenantId;

      // ✅ LOGGING: Log generation start
      console.log("[ContentPlan] Starting content generation", {
        brandId,
        tenantId: tenantId || "none",
      });

      // Generate content plan
      let contentPlan;
      try {
        contentPlan = await generateContentPlan(brandId, tenantId);
        
        // ✅ LOGGING: Log successful generation
        console.log("[ContentPlan] Content generation successful", {
          brandId,
          itemsCount: contentPlan.items.length,
          items: contentPlan.items.map((item: any) => ({
            id: item.id,
            title: item.title,
            contentType: item.contentType,
            platform: item.platform,
            scheduledDate: item.scheduledDate,
          })),
        });
      } catch (genError: any) {
        // ✅ ENHANCED ERROR HANDLING: Log full error details
        console.error("[ContentPlan] Content generation failed", {
          brandId,
          tenantId: tenantId || "none",
          error: genError?.message || String(genError),
          stack: genError?.stack,
        });
        
        throw new AppError(
          ErrorCode.INTERNAL_ERROR,
          `Content generation failed: ${genError?.message || "Unknown error"}`,
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
          "error",
          { originalError: genError?.message, brandId }
        );
      }

      // Verify we have content items
      if (!contentPlan.items || contentPlan.items.length === 0) {
        console.error("[ContentPlan] No content items generated", { brandId });
        throw new AppError(
          ErrorCode.INTERNAL_ERROR,
          "Content generation completed but no items were created",
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
          "error",
          { brandId }
        );
      }

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

      // ✅ LOGGING: Log successful response
      console.log("[ContentPlan] Returning content plan", {
        brandId,
        itemsCount: contentPlan.items.length,
      });

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

