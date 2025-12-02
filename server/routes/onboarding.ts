/**
 * Onboarding API Routes
 * 
 * POST /api/onboarding/generate-week - Generate 7-day content plan
 * GET /api/onboarding/brand-summary - Get brand summary from scrape
 */

import { Router, RequestHandler } from "express";
import { supabase } from "../lib/supabase";
import { AppError } from "../lib/error-middleware";
import { ErrorCode, HTTP_STATUS } from "../lib/error-responses";
import { generateWeeklyContentPackage } from "../lib/onboarding-content-generator";

const router = Router();

/**
 * POST /api/onboarding/generate-week
 * Generate 7 days of multi-channel content based on brand snapshot and weekly focus
 */
router.post("/generate-week", async (req, res, next) => {
  try {
    const { brandId, weeklyFocus, brandSnapshot } = req.body;

    if (!brandId || !weeklyFocus || !brandSnapshot) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "brandId, weeklyFocus, and brandSnapshot are required",
        HTTP_STATUS.BAD_REQUEST,
        "warning"
      );
    }

    // Generate 7-day content package using AI
    const contentPackage = await generateWeeklyContentPackage(
      brandId,
      weeklyFocus,
      brandSnapshot
    );

    // Save to Supabase content_packages table
    // Use brand_id_uuid (UUID) instead of brand_id (TEXT) - migration 005
    const { error: dbError } = await supabase
      .from("content_packages")
      .insert({
        brand_id_uuid: brandId, // UUID - primary identifier (migration 005)
        content_id: contentPackage.id,
        request_id: `onboarding-${Date.now()}`,
        cycle_id: `onboarding-cycle-${Date.now()}`,
        copy: {
          items: contentPackage.items.map(item => ({
            id: item.id,
            title: item.title,
            platform: item.platform,
            type: item.type,
            content: item.content,
            scheduledDate: item.scheduledDate,
            scheduledTime: item.scheduledTime,
            imageUrl: item.imageUrl, // ✅ Include imageUrl from scraped/prioritized images
            brandFidelityScore: item.brandFidelityScore,
          })),
          weeklyFocus,
          generatedAt: contentPackage.generatedAt,
        },
        design_context: brandSnapshot?.images ? { images: brandSnapshot.images } : null,
        collaboration_log: {
          generated: true,
          source: "onboarding",
          brandSnapshot: brandSnapshot ? {
            colors: brandSnapshot.colors,
            tone: brandSnapshot.tone,
            keywords: brandSnapshot.keywords,
            brandIdentity: brandSnapshot.brandIdentity,
          } : null,
        },
        status: "draft",
        requires_approval: true,
      });

    if (dbError) {
      console.error("[Onboarding] Error saving content package to database:", dbError);
      // Continue anyway - we'll return the package even if DB save fails
    }

    (res as any).json({
      success: true,
      contentPackage,
      message: "7-day content plan generated successfully",
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/onboarding/content-package/:brandId
 * Get the most recent content package for a brand (for calendar preview)
 */
router.get("/content-package/:brandId", async (req, res, next) => {
  try {
    const { brandId } = req.params;

    // Get most recent content package from database
    // Use brand_id_uuid (UUID) instead of brand_id (TEXT) - migration 005
    const { data: packages, error } = await supabase
      .from("content_packages")
      .select("*")
      .eq("brand_id_uuid", brandId) // UUID - primary identifier (migration 005)
      .eq("status", "draft")
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        "Failed to fetch content package",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "error"
      );
    }

    // If no package found, return empty structure (frontend will use fallback)
    if (!packages || packages.length === 0) {
      return (res as any).json({
        success: true,
        contentPackage: {
          id: `empty-${brandId}`,
          brandId,
          weeklyFocus: "",
          generatedAt: new Date().toISOString(),
          items: [],
        },
        message: "No content package found - using fallback",
      });
    }

    const packageData = packages[0];
    const copyData = packageData.copy as any;

    // Transform to frontend format
    // Prefer brand_id_uuid over brand_id (deprecated) - migration 005
    const contentPackage = {
      id: packageData.content_id,
      brandId: packageData.brand_id_uuid || packageData.brand_id, // Prefer UUID, fallback to TEXT for backward compatibility
      weeklyFocus: copyData.weeklyFocus || "",
      generatedAt: copyData.generatedAt || packageData.created_at,
      items: (copyData.items || []).map((item: any) => ({
        ...item,
        imageUrl: item.imageUrl, // ✅ Ensure imageUrl is included in response
      })),
    };

    (res as any).json({
      success: true,
      contentPackage,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/onboarding/regenerate-week
 * Regenerate the 7-day content package (same as generate-week but with regenerate flag)
 */
router.post("/regenerate-week", async (req, res, next) => {
  try {
    const { brandId, weeklyFocus, brandSnapshot } = req.body;

    if (!brandId || !weeklyFocus || !brandSnapshot) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "brandId, weeklyFocus, and brandSnapshot are required",
        HTTP_STATUS.BAD_REQUEST,
        "warning"
      );
    }

    // Generate new content package (same logic as generate-week)
    const contentPackage = await generateWeeklyContentPackage(
      brandId,
      weeklyFocus,
      brandSnapshot
    );

    // Save to Supabase (will create new record)
    // Use brand_id_uuid (UUID) instead of brand_id (TEXT) - migration 005
    const { error: dbError } = await supabase
      .from("content_packages")
      .insert({
        brand_id_uuid: brandId, // UUID - primary identifier (migration 005)
        content_id: contentPackage.id,
        request_id: `onboarding-regenerate-${Date.now()}`,
        cycle_id: `onboarding-cycle-${Date.now()}`,
        copy: {
          items: contentPackage.items.map(item => ({
            id: item.id,
            title: item.title,
            platform: item.platform,
            type: item.type,
            content: item.content,
            scheduledDate: item.scheduledDate,
            scheduledTime: item.scheduledTime,
            imageUrl: item.imageUrl, // ✅ Include imageUrl from scraped/prioritized images
            brandFidelityScore: item.brandFidelityScore,
          })),
          weeklyFocus,
          generatedAt: contentPackage.generatedAt,
        },
        design_context: brandSnapshot?.images ? { images: brandSnapshot.images } : null,
        collaboration_log: {
          generated: true,
          source: "onboarding-regenerate",
          brandSnapshot: brandSnapshot ? {
            colors: brandSnapshot.colors,
            tone: brandSnapshot.tone,
            keywords: brandSnapshot.keywords,
            brandIdentity: brandSnapshot.brandIdentity,
          } : null,
        },
        status: "draft",
        requires_approval: true,
      });

    if (dbError) {
      console.error("[Onboarding] Error saving regenerated content package:", dbError);
    }

    (res as any).json({
      success: true,
      contentPackage,
      message: "7-day content plan regenerated successfully",
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/onboarding/brand-summary/:brandId
 * Get brand summary from scrape results
 */
router.get("/brand-summary/:brandId", async (req, res, next) => {
  try {
    const { brandId } = req.params;

    // Get brand from database
    const { data: brand, error } = await supabase
      .from("brands")
      .select("brand_kit, voice_summary, visual_summary")
      .eq("id", brandId)
      .single();

    if (error || !brand) {
      throw new AppError(
        ErrorCode.NOT_FOUND,
        "Brand not found",
        HTTP_STATUS.NOT_FOUND,
        "info"
      );
    }

    // Transform to brand summary format
    const brandSummary = {
      colors: brand.visual_summary?.colors || [],
      images: brand.brand_kit?.images || [],
      tone: brand.voice_summary?.tone || [],
      keywords: brand.brand_kit?.keyword_themes || [],
      brandIdentity: brand.brand_kit?.about_blurb || "",
    };

    (res as any).json({
      success: true,
      brandSummary,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

