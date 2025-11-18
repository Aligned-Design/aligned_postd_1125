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
import { transferScrapedImages } from "../lib/scraped-images-service";

const router = Router();

/**
 * GET /api/brands
 * Get all brands for the current user
 * 
 * Returns brands the user is a member of via brand_members table
 */
router.get(
  "/",
  authenticateUser,
  (async (req, res, next) => {
    try {
      const user = (req as any).user;
      const userId = user?.id;

      if (!userId) {
        throw new AppError(
          ErrorCode.UNAUTHORIZED,
          "User ID is required",
          HTTP_STATUS.UNAUTHORIZED,
          "warning"
        );
      }

      // Get all brand IDs the user is a member of
      const { data: memberships, error: membershipError } = await supabase
        .from("brand_members")
        .select("brand_id, role")
        .eq("user_id", userId);

      if (membershipError) {
        throw new AppError(
          ErrorCode.DATABASE_ERROR,
          "Failed to fetch brand memberships",
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
          "error",
          { details: membershipError.message }
        );
      }

      if (!memberships || memberships.length === 0) {
        res.json({
          success: true,
          brands: [],
          total: 0,
        });
        return;
      }

      // Fetch full brand details for each brand ID
      const brandIds = memberships.map((m) => m.brand_id);
      const { data: brands, error: brandsError } = await supabase
        .from("brands")
        .select("*")
        .in("id", brandIds)
        .order("created_at", { ascending: false });

      if (brandsError) {
        throw new AppError(
          ErrorCode.DATABASE_ERROR,
          "Failed to fetch brands",
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
          "error",
          { details: brandsError.message }
        );
      }

      // Map brands with membership role
      const brandsWithRole = (brands || []).map((brand) => {
        const membership = memberships.find((m) => m.brand_id === brand.id);
        return {
          ...brand,
          userRole: membership?.role || "viewer",
        };
      });

      res.json({
        success: true,
        brands: brandsWithRole || [],
        total: brandsWithRole?.length || 0,
      });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler
);

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

      // ✅ LOGGING: Brand creation start with IDs
      console.log("[Brands] Creating brand", {
        userId: user?.id,
        tenantId: finalTenantId,
        brandName: name,
        website_url,
      });
      
      logger.info("Creating new brand", {
        requestId,
        userId: user?.id,
        workspaceId: finalTenantId,
        tenantId: finalTenantId, // ✅ Added for consistency
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

      // ✅ LOGGING: Brand creation complete with all IDs
      console.log("[Brands] Brand created", {
        userId: user?.id,
        tenantId: finalTenantId,
        brandId: brandData.id,
        brandName: name,
      });

      logger.info("Brand created successfully", {
        requestId,
        brandId: brandData.id,
        tenantId: finalTenantId, // ✅ Added for consistency
        duration: Date.now() - startTime,
      });

      // ✅ ROOT FIX: Transfer scraped images from temporary onboarding brandId to real brandId
      // Check if request includes temporary brandId from onboarding
      const tempBrandId = req.body.tempBrandId || req.body.onboardingBrandId;
      if (tempBrandId && tempBrandId.startsWith("brand_") && tempBrandId !== brandData.id) {
        try {
          const transferredCount = await transferScrapedImages(tempBrandId, brandData.id);
          if (transferredCount > 0) {
            logger.info("Transferred scraped images from onboarding", {
              requestId,
              fromBrandId: tempBrandId,
              toBrandId: brandData.id,
              imageCount: transferredCount,
            });
          }
        } catch (transferError) {
          logger.warn("Failed to transfer scraped images from onboarding", {
            requestId,
            fromBrandId: tempBrandId,
            toBrandId: brandData.id,
            error: transferError instanceof Error ? transferError.message : String(transferError),
          });
          // Don't fail brand creation if transfer fails
        }
      }

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

