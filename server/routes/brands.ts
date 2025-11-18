/**
 * Brands API Routes
 * 
 * Handles brand creation and automatically triggers onboarding workflow.
 */

import { Router, RequestHandler } from "express";
import { supabase } from "../lib/supabase";
import { AppError } from "../lib/error-middleware";
import { ErrorCode, HTTP_STATUS } from "../lib/error-responses";
import { authenticateUser } from "../middleware/security";
import { requireScope } from "../middleware/requireScope";
import { assertBrandAccess } from "../lib/brand-access";
import { logger } from "../lib/logger";
import { runOnboardingWorkflow } from "../lib/onboarding-orchestrator";

const router = Router();

/**
 * POST /api/brands
 * Create a new brand and automatically trigger onboarding workflow
 * 
 * Body: {
 *   name: string,
 *   slug?: string,
 *   website_url?: string,
 *   industry?: string,
 *   description?: string,
 *   tenant_id?: string,
 *   workspace_id?: string,
 *   autoRunOnboarding?: boolean (default: true)
 * }
 */
router.post(
  "/",
  authenticateUser,
  requireScope("content:manage"),
  (async (req, res, next) => {
    const startTime = Date.now();
    const requestId = `brand-create-${Date.now()}`;
    const user = (req as any).user;

    try {
      const {
        name,
        slug,
        website_url,
        industry,
        description,
        tenant_id,
        workspace_id,
        autoRunOnboarding = true,
      } = req.body;

      if (!name) {
        throw new AppError(
          ErrorCode.MISSING_REQUIRED_FIELD,
          "name is required",
          HTTP_STATUS.BAD_REQUEST,
          "warning"
        );
      }

      // Get user's workspace/tenant ID from auth context if not provided
      const finalTenantId = tenant_id || workspace_id || user?.workspaceId || user?.tenantId;
      if (!finalTenantId) {
        throw new AppError(
          ErrorCode.MISSING_REQUIRED_FIELD,
          "tenant_id or workspace_id is required",
          HTTP_STATUS.BAD_REQUEST,
          "warning"
        );
      }

      logger.info("Creating new brand", {
        requestId,
        userId: user?.id,
        workspaceId: finalTenantId,
        name,
        website_url,
      });

      // Create brand in database
      const { data: brandData, error: brandError } = await supabase
        .from("brands")
        .insert([
          {
            name,
            slug: slug || name.toLowerCase().replace(/\s+/g, "-"),
            website_url,
            industry,
            description,
            tenant_id: finalTenantId,
            workspace_id: finalTenantId,
            created_by: user?.id,
          },
        ])
        .select()
        .single();

      if (brandError || !brandData) {
        throw new AppError(
          ErrorCode.DATABASE_ERROR,
          "Failed to create brand",
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
          "error",
          { details: brandError?.message }
        );
      }

      // Create brand membership
      const { error: memberError } = await supabase.from("brand_members").insert([
        {
          brand_id: brandData.id,
          user_id: user?.id,
          role: "owner",
        },
      ]);

      if (memberError) {
        logger.warn("Failed to create brand membership", {
          requestId,
          brandId: brandData.id,
          error: memberError.message,
        });
        // Continue anyway - brand is created
      }

      logger.info("Brand created successfully", {
        requestId,
        brandId: brandData.id,
        duration: Date.now() - startTime,
      });

      // Automatically trigger onboarding workflow if enabled
      if (autoRunOnboarding && website_url) {
        logger.info("Triggering automatic onboarding workflow", {
          requestId,
          brandId: brandData.id,
          websiteUrl: website_url,
        });

        // Run onboarding asynchronously (don't block response)
        runOnboardingWorkflow({
          workspaceId: finalTenantId,
          brandId: brandData.id,
          websiteUrl: website_url,
          industry,
        }).catch((error) => {
          logger.error("Onboarding workflow failed", error, {
            requestId,
            brandId: brandData.id,
          });
          // Don't fail brand creation if onboarding fails
        });
      }

      res.status(201).json({
        success: true,
        brand: brandData,
        onboardingTriggered: autoRunOnboarding && !!website_url,
        message: "Brand created successfully",
      });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler
);

export default router;

