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
 * Generate a unique slug for a brand within a tenant
 * If the slug already exists, appends -1, -2, etc. until finding a unique value
 * 
 * @param baseSlug - The base slug to use (e.g., "aligned-bydesign")
 * @param tenantId - The tenant ID to scope the uniqueness check
 * @returns A unique slug for the tenant
 */
async function generateUniqueSlug(baseSlug: string, tenantId: string): Promise<string> {
  // Normalize the base slug
  const normalizedSlug = baseSlug.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  
  // Check if the base slug is available
  const { data: existingBrand, error: checkError } = await supabase
    .from("brands")
    .select("slug")
    .eq("tenant_id", tenantId)
    .eq("slug", normalizedSlug)
    .maybeSingle(); // Use maybeSingle() to handle no results gracefully
  
  // If error occurred (not just "not found"), log it but continue
  if (checkError && checkError.code !== "PGRST116") {
    console.warn("[Brands] Error checking slug availability, proceeding with base slug", {
      error: checkError.message,
      code: checkError.code,
      slug: normalizedSlug,
    });
  }
  
  // If no existing brand found, base slug is available
  if (!existingBrand) {
    return normalizedSlug;
  }
  
  // Slug exists, try with suffix
  let counter = 1;
  let candidateSlug = `${normalizedSlug}-${counter}`;
  
  // Keep checking until we find an available slug
  while (true) {
    const { data: existing, error: candidateError } = await supabase
      .from("brands")
      .select("slug")
      .eq("tenant_id", tenantId)
      .eq("slug", candidateSlug)
      .maybeSingle();
    
    // If error occurred (not just "not found"), log it but continue
    if (candidateError && candidateError.code !== "PGRST116") {
      console.warn("[Brands] Error checking candidate slug, trying next", {
        error: candidateError.message,
        code: candidateError.code,
        slug: candidateSlug,
      });
    }
    
    // If no existing brand found, this slug is available
    if (!existing) {
      return candidateSlug;
    }
    
    counter++;
    candidateSlug = `${normalizedSlug}-${counter}`;
    
    // Safety limit to prevent infinite loops
    if (counter > 1000) {
      // Fallback to timestamp-based slug
      const fallbackSlug = `${normalizedSlug}-${Date.now()}`;
      console.warn("[Brands] Reached max iterations, using timestamp-based slug", {
        baseSlug: normalizedSlug,
        fallbackSlug,
      });
      return fallbackSlug;
    }
  }
}

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
      let finalTenantId = tenant_id || workspace_id || user?.workspaceId || user?.tenantId;
      
      // ✅ CRITICAL: Verify tenant exists in tenants table before creating brand
      // This prevents foreign key constraint violations
      if (!finalTenantId) {
        throw new AppError(
          ErrorCode.MISSING_REQUIRED_FIELD,
          "tenant_id or workspace_id is required",
          HTTP_STATUS.BAD_REQUEST,
          "warning"
        );
      }

      // ✅ VERIFY: Check if tenant exists in database
      console.log("[Brands] 🔍 Verifying tenant exists", {
        tenantId: finalTenantId,
        userId: user?.id,
      });

      const { data: existingTenant, error: tenantCheckError } = await supabase
        .from("tenants")
        .select("id, name")
        .eq("id", finalTenantId)
        .single();

      if (tenantCheckError || !existingTenant) {
        console.error("[Brands] ❌ Tenant not found in database", {
          tenantId: finalTenantId,
          error: tenantCheckError?.message,
          code: tenantCheckError?.code,
        });

        // ✅ CREATE TENANT ON THE FLY if it doesn't exist
        // This handles edge cases where tenant wasn't created during signup
        console.log("[Brands] 🏢 Creating missing tenant", {
          tenantId: finalTenantId,
          userId: user?.id,
        });

        const tenantName = user?.email?.split("@")[0] || `Workspace ${finalTenantId.substring(0, 8)}`;
        const { data: newTenant, error: tenantCreateError } = await supabase
          .from("tenants")
          .insert([
            {
              id: finalTenantId,
              name: tenantName,
              plan: "free",
            },
          ])
          .select()
          .single();

        if (tenantCreateError || !newTenant) {
          console.error("[Brands] ❌ Failed to create tenant", {
            error: tenantCreateError?.message,
            code: tenantCreateError?.code,
          });
          throw new AppError(
            ErrorCode.DATABASE_ERROR,
            `Tenant not found and could not be created: ${tenantCreateError?.message || "Unknown error"}`,
            HTTP_STATUS.INTERNAL_SERVER_ERROR,
            "error",
            {
              tenantId: finalTenantId,
              details: tenantCreateError?.message,
            }
          );
        }

        console.log("[Tenants] ✅ Tenant created successfully", {
          tenantId: newTenant.id,
          tenantName: newTenant.name,
          plan: newTenant.plan,
          createdAt: newTenant.created_at,
        });
        console.log("[Tenants] Using tenantId:", newTenant.id);
      } else {
      console.log("[Tenants] ✅ Tenant verified", {
        tenantId: existingTenant.id,
        tenantName: existingTenant.name,
      });
      console.log("[Tenants] Using tenantId:", existingTenant.id);
      }

      // ✅ LOGGING: Brand creation start with IDs
      console.log("[Brands] Creating brand", {
        userId: user?.id,
        tenantId: finalTenantId,
        brandName: name,
        website_url,
        hasUser: !!user,
        userRole: user?.role,
        tenantExists: !!existingTenant,
      });
      
      logger.info("Creating new brand", {
        requestId,
        userId: user?.id,
        workspaceId: finalTenantId,
        tenantId: finalTenantId,
        name,
        website_url,
      });

      // ✅ Generate unique slug before insert to prevent duplicate key errors
      const baseSlug = slug || name.toLowerCase().replace(/\s+/g, "-");
      let uniqueSlug = await generateUniqueSlug(baseSlug, finalTenantId);
      
      console.log("[Brands] Generated unique slug", {
        baseSlug,
        uniqueSlug,
        tenantId: finalTenantId,
      });

      // ✅ Prepare brand data for insert
      let brandInsertData = {
        name,
        slug: uniqueSlug,
        website_url: website_url || null,
        industry: industry || null,
        description: description || null,
        tenant_id: finalTenantId,
        workspace_id: finalTenantId,
        created_by: user?.id,
      };

      // ✅ Retry logic with exponential backoff for race conditions
      let brandData;
      let brandError;
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount <= maxRetries) {
        console.log("[Brands] Inserting brand data (attempt " + (retryCount + 1) + ")", {
          ...brandInsertData,
          slugLength: brandInsertData.slug?.length,
          tenantIdType: typeof finalTenantId,
          tenantIdLength: finalTenantId?.length,
          userIdType: typeof user?.id,
          userIdLength: user?.id?.length,
        });

        const result = await supabase
          .from("brands")
          .insert([brandInsertData])
          .select()
          .single();

        brandData = result.data;
        brandError = result.error;

        // If duplicate slug error, generate new slug and retry
        if (brandError && (
          brandError.code === "23505" || // Unique violation
          brandError.message?.includes("duplicate key") ||
          brandError.message?.includes("brands_slug")
        )) {
          retryCount++;
          if (retryCount <= maxRetries) {
            console.warn("[Brands] Duplicate slug detected, generating new slug (attempt " + retryCount + ")", {
              previousSlug: uniqueSlug,
              error: brandError.message,
            });
            // Add a small random component to avoid collisions in race conditions
            const randomSuffix = Math.floor(Math.random() * 10000);
            const retryBaseSlug = `${baseSlug}-${retryCount}-${randomSuffix}`;
            // Generate new slug - this will check and append -1, -2, etc. if needed
            uniqueSlug = await generateUniqueSlug(retryBaseSlug, finalTenantId);
            brandInsertData = { ...brandInsertData, slug: uniqueSlug };
            // Exponential backoff
            await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, retryCount)));
            continue;
          }
        } else {
          // Success or non-duplicate error, break
          break;
        }
      }

      // ✅ CRITICAL: Log detailed error information
      if (brandError) {
        console.error("[Brands] ❌ Supabase insert error", {
          message: brandError.message,
          code: brandError.code,
          details: brandError.details,
          hint: brandError.hint,
          fullError: JSON.stringify(brandError, null, 2),
          insertData: brandInsertData,
        });
        
        throw new AppError(
          ErrorCode.DATABASE_ERROR,
          `Failed to create brand: ${brandError.message || "Database error"}`,
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
          "error",
          { 
            details: brandError.message,
            code: brandError.code,
            hint: brandError.hint,
            insertData: brandInsertData,
          }
        );
      }

      if (!brandData) {
        console.error("[Brands] ❌ No brand data returned from insert", {
          hasError: !!brandError,
          insertData: brandInsertData,
        });
        
        throw new AppError(
          ErrorCode.DATABASE_ERROR,
          "Failed to create brand: No data returned",
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
          "error",
          { insertData: brandInsertData }
        );
      }

      console.log("[Brands] ✅ Brand created successfully", {
        brandId: brandData.id,
        brandName: brandData.name,
        tenantId: brandData.tenant_id || brandData.workspace_id,
      });

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

