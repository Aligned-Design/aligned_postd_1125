/**
 * Brands API Routes
 * 
 * Handles brand creation and automatically triggers onboarding workflow.
 */

import { Router, RequestHandler } from "express";
import { z } from "zod";
import { supabase } from "../lib/supabase";
import { AppError } from "../lib/error-middleware";
import { ErrorCode, HTTP_STATUS } from "../lib/error-responses";
import { authenticateUser } from "../middleware/security";
import { requireScope } from "../middleware/requireScope";
import { assertBrandAccess } from "../lib/brand-access";
import { logger } from "../lib/logger";
import { runOnboardingWorkflow } from "../lib/onboarding-orchestrator";
import { reconcileTemporaryBrandAssets } from "../lib/brand-reconciliation";

const router = Router();

// ✅ VALIDATION: Zod schema for brand creation
const CreateBrandSchema = z.object({
  name: z.string().min(1, "Brand name is required").max(200, "Brand name must be 200 characters or less"),
  slug: z.string().regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens").optional(),
  website_url: z.string().url("Invalid website URL format").optional().or(z.literal("")),
  industry: z.string().max(100).optional(),
  description: z.string().max(1000).optional(),
  tenant_id: z.string().uuid("Invalid tenant ID format").optional(),
  workspace_id: z.string().uuid("Invalid workspace ID format").optional(),
  autoRunOnboarding: z.boolean().optional().default(true),
}).strict();

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
    logger.warn("Error checking slug availability, proceeding with base slug", {
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
      logger.warn("Error checking candidate slug, trying next", {
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
      logger.warn("Reached max iterations, using timestamp-based slug", {
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

      // @supabase-scope-ok Uses .eq("user_id", userId) - scoped to authenticated user
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
        return res.status(HTTP_STATUS.OK).json({
          success: true,
          brands: [],
          total: 0,
        });
      }

      // @supabase-scope-ok Uses .in("id", brandIds) - scoped to user's authorized brands
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

      return res.status(HTTP_STATUS.OK).json({
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
      // ✅ VALIDATION: Validate request body with Zod
      let validatedBody: z.infer<typeof CreateBrandSchema>;
      try {
        validatedBody = CreateBrandSchema.parse(req.body);
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          throw new AppError(
            ErrorCode.VALIDATION_ERROR,
            "Invalid request parameters",
            HTTP_STATUS.BAD_REQUEST,
            "warning",
            { validationErrors: validationError.errors },
            "Please check your request and try again"
          );
        }
        throw validationError;
      }

      const {
        name,
        slug,
        website_url,
        industry,
        description,
        tenant_id,
        workspace_id,
        autoRunOnboarding = true,
      } = validatedBody;

      // Get user's workspace/tenant ID from auth context if not provided
      const finalTenantId = tenant_id || workspace_id || user?.workspaceId || user?.tenantId;
      
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
      logger.info("Verifying tenant exists", {
        tenantId: finalTenantId,
        userId: user?.id,
      });

      const { data: existingTenant, error: tenantCheckError } = await supabase
        .from("tenants")
        .select("id, name")
        .eq("id", finalTenantId)
        .single();

      if (tenantCheckError || !existingTenant) {
        logger.warn("Tenant not found in database, creating", {
          tenantId: finalTenantId,
          error: tenantCheckError?.message,
          code: tenantCheckError?.code,
          userId: user?.id,
        });

        // ✅ CREATE TENANT ON THE FLY if it doesn't exist
        // This handles edge cases where tenant wasn't created during signup

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
          logger.error("Failed to create tenant", tenantCreateError ? new Error(tenantCreateError.message) : new Error("Unknown error"), {
            tenantId: finalTenantId,
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

        logger.info("Tenant created successfully", {
          tenantId: newTenant.id,
          tenantName: newTenant.name,
          plan: newTenant.plan,
        });
      } else {
        logger.info("Tenant verified", {
          tenantId: existingTenant.id,
          tenantName: existingTenant.name,
        });
      }

      // ✅ LOGGING: Brand creation start with IDs
      logger.info("Creating new brand", {
        requestId,
        userId: user?.id,
        workspaceId: finalTenantId,
        tenantId: finalTenantId,
        name,
        website_url,
        hasUser: !!user,
        userRole: user?.role,
        tenantExists: !!existingTenant,
      });

      // ✅ Generate unique slug before insert to prevent duplicate key errors
      const baseSlug = slug || name.toLowerCase().replace(/\s+/g, "-");
      let uniqueSlug = await generateUniqueSlug(baseSlug, finalTenantId);
      
      logger.debug("Generated unique slug", {
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
        logger.debug("Inserting brand data", {
          attempt: retryCount + 1,
          slug: brandInsertData.slug,
          tenantId: finalTenantId,
          userId: user?.id,
        });

        // @supabase-scope-ok INSERT creates new brand - no scoping needed
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
            logger.warn("Duplicate slug detected, generating new slug", {
              attempt: retryCount,
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
        logger.error("Supabase insert error", new Error(brandError.message), {
          code: brandError.code,
          details: brandError.details,
          hint: brandError.hint,
          insertData: brandInsertData,
        });
        
        // Check for duplicate slug error and provide user-friendly message
        const isDuplicateSlug = brandError.code === "23505" || 
          brandError.message?.includes("duplicate key") ||
          brandError.message?.includes("brands_slug");
        
        const errorMessage = isDuplicateSlug
          ? "Brand name already in use. We've automatically added a number to make it unique."
          : `Failed to create brand: ${brandError.message || "Database error"}`;
        
        throw new AppError(
          ErrorCode.DATABASE_ERROR,
          errorMessage,
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
        logger.error("No brand data returned from insert", new Error("Insert succeeded but no data returned"), {
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

      logger.info("Brand created successfully", {
        brandId: brandData.id,
        brandName: brandData.name,
        tenantId: brandData.tenant_id || brandData.workspace_id,
      });

      // @supabase-scope-ok INSERT includes brand_id in payload
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
      logger.info("Brand creation complete", {
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

      // ✅ P0 FIX: Reconcile temporary brand assets to final brand UUID
      // Check if request includes temporary brandId from onboarding
      const tempBrandId = req.body.tempBrandId || req.body.onboardingBrandId;
      if (tempBrandId && tempBrandId.startsWith("brand_") && tempBrandId !== brandData.id) {
        try {
          const reconciliation = await reconcileTemporaryBrandAssets(tempBrandId, brandData.id);
          if (reconciliation.transferredImages > 0) {
            logger.info("Reconciled temporary brand assets", {
              requestId,
              fromBrandId: tempBrandId,
              toBrandId: brandData.id,
              transferredImages: reconciliation.transferredImages,
              success: reconciliation.success,
            });
          }
          if (reconciliation.errors.length > 0) {
            logger.warn("Brand reconciliation completed with errors", {
              requestId,
              fromBrandId: tempBrandId,
              toBrandId: brandData.id,
              errors: reconciliation.errors,
            });
            // Don't fail brand creation if reconciliation has errors, but log them
          }
        } catch (reconciliationError) {
          logger.error(
            "Failed to reconcile temporary brand assets",
            reconciliationError instanceof Error ? reconciliationError : new Error(String(reconciliationError)),
            {
              requestId,
              fromBrandId: tempBrandId,
              toBrandId: brandData.id,
            }
          );
          // Don't fail brand creation if reconciliation fails, but log the error
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


