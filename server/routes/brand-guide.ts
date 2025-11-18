/**
 * Brand Guide API Routes
 * 
 * CRUD operations for Brand Guide data synced to Supabase.
 * Maps BrandGuide TypeScript interface to brands table (brand_kit, voice_summary, visual_summary JSONB fields).
 */

import { Router, RequestHandler } from "express";
import { supabase } from "../lib/supabase";
import { AppError } from "../lib/error-middleware";
import { ErrorCode, HTTP_STATUS } from "../lib/error-responses";
import { authenticateUser } from "../middleware/security";
import { assertBrandAccess } from "../lib/brand-access";
import { getScrapedImages } from "../lib/scraped-images-service";

const router = Router();

/**
 * GET /api/brand-guide/:brandId
 * Get Brand Guide data for a brand
 */
router.get("/:brandId", authenticateUser, async (req, res, next) => {
  try {
    const { brandId } = req.params;

    // Validate brandId is a UUID (not "default-brand" or other placeholder)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(brandId)) {
      throw new AppError(
        ErrorCode.INVALID_FORMAT,
        "Invalid brand ID format",
        HTTP_STATUS.BAD_REQUEST,
        "warning",
        undefined,
        "Brand ID must be a valid UUID"
      );
    }

    // ✅ SECURITY: Verify user has access to this brand and workspace
    await assertBrandAccess(req, brandId, true, true);

    // Fetch brand from Supabase
    const { data: brand, error } = await supabase
      .from("brands")
      .select("*")
      .eq("id", brandId)
      .single();

    if (error || !brand) {
      throw new AppError(
        ErrorCode.NOT_FOUND,
        "Brand not found",
        HTTP_STATUS.NOT_FOUND,
        "info",
        { brandId },
        "The requested brand does not exist or you don't have access to it"
      );
    }

    // Map Supabase brand to BrandGuide interface
    const brandKit = (brand.brand_kit as any) || {};
    const voiceSummary = (brand.voice_summary as any) || {};
    const visualSummary = (brand.visual_summary as any) || {};

    // ✅ Get tenantId from user context for logging
    const user = (req as any).user;
    const auth = (req as any).auth;
    const tenantId = user?.workspaceId || user?.tenantId || auth?.workspaceId || auth?.tenantId || (brand as any)?.tenant_id || "unknown";

    // ✅ CRITICAL: Get scraped images from media_assets table
    // This ensures Brand Guide includes images scraped during onboarding
    let scrapedImages: Array<{ id: string; url: string; filename: string; source: string; metadata?: Record<string, unknown> }> = [];
    try {
      const scraped = await getScrapedImages(brandId);
      scrapedImages = scraped.map(img => ({
        id: img.id,
        url: img.url,
        filename: img.filename,
        source: "scrape" as const,
        metadata: img.metadata,
      }));
      
      // ✅ LOGGING: Brand Guide query with IDs (moved after hasBrandGuide check)
    } catch (error) {
      console.error(`[BrandGuide] Error fetching scraped images for brandId ${brandId}:`, error);
      // Continue without scraped images - don't fail the entire request
    }

    // Check if brand guide has meaningful content (not just empty defaults)
    const hasBrandGuide = !!(
      brandKit.purpose ||
      brandKit.mission ||
      brandKit.vision ||
      (brandKit.toneKeywords && brandKit.toneKeywords.length > 0) ||
      brandKit.voiceDescription ||
      brandKit.primaryColor ||
      brandKit.fontFamily ||
      brandKit.logoUrl ||
      (brandKit.personas && brandKit.personas.length > 0) ||
      scrapedImages.length > 0 || // Include scraped images in hasBrandGuide check
      brandKit.longFormSummary // Include long-form summary in hasBrandGuide check
    );

    // ✅ LOGGING: Brand Guide query with IDs (after hasBrandGuide calculation)
    console.log("[BrandGuide] Query complete", {
      tenantId: tenantId,
      brandId: brandId,
      assetsCount: scrapedImages.length,
      hasBrandKit: hasBrandGuide,
    });

    // Build approvedAssets with scraped images
    const approvedAssets = brandKit.approvedAssets || {
      uploadedPhotos: [],
      uploadedGraphics: [],
      uploadedTemplates: [],
      approvedStockImages: [],
      productsServices: [],
    };

    // ✅ CRITICAL: Include scraped images in approvedAssets.uploadedPhotos
    // This ensures Brand Guide UI shows scraped images
    const uploadedPhotos = [
      ...(approvedAssets.uploadedPhotos || []),
      ...scrapedImages.map(img => ({
        id: img.id,
        url: img.url,
        filename: img.filename,
        source: "scrape" as const,
        metadata: img.metadata,
      })),
    ];

    const brandGuide = {
      id: brand.id,
      brandName: brand.name || brandKit.brandName || "Untitled Brand",
      brandId: brand.id,
      
      // Summary
      purpose: brandKit.purpose || "",
      mission: brandKit.mission || "",
      vision: brandKit.vision || "",
      summaryReviewedByAI: brandKit.summaryReviewedByAI || false,
      longFormSummary: brandKit.longFormSummary || "", // 8-10 paragraph narrative summary generated by Doc Agent

      // Voice & Tone
      tone: voiceSummary.tone || brandKit.toneKeywords || brand.tone_keywords || [],
      friendlinessLevel: voiceSummary.friendlinessLevel || brandKit.friendlinessLevel || 50,
      formalityLevel: voiceSummary.formalityLevel || brandKit.formalityLevel || 50,
      confidenceLevel: voiceSummary.confidenceLevel || brandKit.confidenceLevel || 50,
      voiceDescription: voiceSummary.voiceDescription || brandKit.voiceDescription || "",
      aiToneSuggestions: voiceSummary.aiToneSuggestions || brandKit.aiToneSuggestions || [],

      // Visual Identity
      logoUrl: brand.logo_url || brandKit.logoUrl || visualSummary.logo_urls?.[0] || "",
      fontFamily: visualSummary.fonts?.[0] || brandKit.fontFamily || "",
      fontSource: brandKit.fontSource || "google",
      customFontUrl: brandKit.customFontUrl || "",
      primaryColors: visualSummary.colors || brandKit.primaryColors || brandKit.colorPalette || [],
      primaryColor: brandKit.primaryColor || visualSummary.colors?.[0] || brand.primary_color || "",
      secondaryColor: brandKit.secondaryColor || visualSummary.colors?.[1] || "",
      colorPalette: visualSummary.colors || brandKit.colorPalette || [],
      secondaryColors: visualSummary.colors?.slice(1) || brandKit.secondaryColors || [],
      visualNotes: visualSummary.style || brandKit.visualNotes || "",

      // Personas
      personas: brandKit.personas || [],

      // Goals
      goals: brandKit.goals || [],

      // Guardrails
      guardrails: brandKit.guardrails || [],

      // ✅ CRITICAL: Approved Assets (includes scraped images)
      approvedAssets: {
        ...approvedAssets,
        uploadedPhotos: uploadedPhotos, // Includes scraped images with source='scrape'
        uploadedGraphics: approvedAssets.uploadedGraphics || [],
        uploadedTemplates: approvedAssets.uploadedTemplates || [],
        approvedStockImages: approvedAssets.approvedStockImages || [],
        productsServices: approvedAssets.productsServices || [],
      },

      // Metadata
      createdAt: brand.created_at || new Date().toISOString(),
      updatedAt: brand.updated_at || new Date().toISOString(),
      completionPercentage: brandKit.completionPercentage || 0,
      setupMethod: brandKit.setupMethod || "detailed",
      version: brandKit.version || 1,
    };

    // Return 200 with hasBrandGuide flag (never 404 if brand exists)
    (res as any).json({
      success: true,
      brandGuide,
      hasBrandGuide,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/brand-guide/:brandId
 * Update entire Brand Guide (full replace)
 */
router.put("/:brandId", authenticateUser, async (req, res, next) => {
  try {
    const { brandId } = req.params;
    const brandGuide = req.body;

    // ✅ SECURITY: Verify user has access to this brand and workspace
    await assertBrandAccess(req, brandId, true, true);

    if (!brandGuide) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "Brand Guide data is required",
        HTTP_STATUS.BAD_REQUEST,
        "warning"
      );
    }

    // Map BrandGuide interface to Supabase structure
    const brandKit: any = {
      brandName: brandGuide.brandName,
      purpose: brandGuide.purpose,
      mission: brandGuide.mission,
      vision: brandGuide.vision,
      summaryReviewedByAI: brandGuide.summaryReviewedByAI,
      toneKeywords: brandGuide.tone,
      friendlinessLevel: brandGuide.friendlinessLevel,
      formalityLevel: brandGuide.formalityLevel,
      confidenceLevel: brandGuide.confidenceLevel,
      voiceDescription: brandGuide.voiceDescription,
      aiToneSuggestions: brandGuide.aiToneSuggestions,
      logoUrl: brandGuide.logoUrl,
      fontFamily: brandGuide.fontFamily,
      fontSource: brandGuide.fontSource,
      customFontUrl: brandGuide.customFontUrl,
      primaryColors: brandGuide.primaryColors,
      primaryColor: brandGuide.primaryColor,
      secondaryColor: brandGuide.secondaryColor,
      colorPalette: brandGuide.colorPalette,
      secondaryColors: brandGuide.secondaryColors,
      visualNotes: brandGuide.visualNotes,
      personas: brandGuide.personas || [],
      goals: brandGuide.goals || [],
      guardrails: brandGuide.guardrails || [],
      completionPercentage: brandGuide.completionPercentage || 0,
      setupMethod: brandGuide.setupMethod || "detailed",
      version: (brandGuide.version || 1) + 1, // Increment version
    };

    const voiceSummary: any = {
      tone: brandGuide.tone || [],
      friendlinessLevel: brandGuide.friendlinessLevel,
      formalityLevel: brandGuide.formalityLevel,
      confidenceLevel: brandGuide.confidenceLevel,
      voiceDescription: brandGuide.voiceDescription,
      aiToneSuggestions: brandGuide.aiToneSuggestions,
    };

    const visualSummary: any = {
      colors: brandGuide.primaryColors || brandGuide.colorPalette || [],
      fonts: brandGuide.fontFamily ? [brandGuide.fontFamily] : [],
      style: brandGuide.visualNotes,
      logo_urls: brandGuide.logoUrl ? [brandGuide.logoUrl] : [],
    };

    // Update brand in Supabase
    const { data: updatedBrand, error } = await supabase
      .from("brands")
      .update({
        name: brandGuide.brandName,
        brand_kit: brandKit,
        voice_summary: voiceSummary,
        visual_summary: visualSummary,
        tone_keywords: brandGuide.tone || [],
        updated_at: new Date().toISOString(),
      })
      .eq("id", brandId)
      .select()
      .single();

    if (error) {
      console.error("[BrandGuide] Error updating brand:", error);
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        "Failed to update Brand Guide",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "error"
      );
    }

    (res as any).json({
      success: true,
      brandGuide: {
        ...brandGuide,
        updatedAt: updatedBrand.updated_at,
      },
      message: "Brand Guide updated successfully",
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/brand-guide/:brandId
 * Partial update of Brand Guide (update specific fields only)
 */
router.patch("/:brandId", authenticateUser, async (req, res, next) => {
  try {
    const { brandId } = req.params;
    const updates = req.body;

    // ✅ SECURITY: Verify user has access to this brand and workspace
    await assertBrandAccess(req, brandId, true, true);

    if (!updates || Object.keys(updates).length === 0) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "Update data is required",
        HTTP_STATUS.BAD_REQUEST,
        "warning"
      );
    }

    // Get current brand data
    const { data: currentBrand, error: fetchError } = await supabase
      .from("brands")
      .select("*")
      .eq("id", brandId)
      .single();

    if (fetchError || !currentBrand) {
      throw new AppError(
        ErrorCode.NOT_FOUND,
        "Brand not found",
        HTTP_STATUS.NOT_FOUND,
        "info",
        { brandId },
        "The requested brand does not exist or you don't have access to it"
      );
    }

    // Merge updates into existing brand_kit, voice_summary, visual_summary
    const currentBrandKit = (currentBrand.brand_kit as any) || {};
    const currentVoiceSummary = (currentBrand.voice_summary as any) || {};
    const currentVisualSummary = (currentBrand.visual_summary as any) || {};

    // Map updates to appropriate JSONB fields
    const brandKitUpdates: any = {};
    const voiceSummaryUpdates: any = {};
    const visualSummaryUpdates: any = {};
    let nameUpdate: string | undefined;

    // Summary fields → brand_kit
    if (updates.purpose !== undefined) brandKitUpdates.purpose = updates.purpose;
    if (updates.mission !== undefined) brandKitUpdates.mission = updates.mission;
    if (updates.vision !== undefined) brandKitUpdates.vision = updates.vision;
    if (updates.summaryReviewedByAI !== undefined) brandKitUpdates.summaryReviewedByAI = updates.summaryReviewedByAI;

    // Voice & Tone → voice_summary + brand_kit
    if (updates.tone !== undefined) {
      voiceSummaryUpdates.tone = updates.tone;
      brandKitUpdates.toneKeywords = updates.tone;
    }
    if (updates.friendlinessLevel !== undefined) {
      voiceSummaryUpdates.friendlinessLevel = updates.friendlinessLevel;
      brandKitUpdates.friendlinessLevel = updates.friendlinessLevel;
    }
    if (updates.formalityLevel !== undefined) {
      voiceSummaryUpdates.formalityLevel = updates.formalityLevel;
      brandKitUpdates.formalityLevel = updates.formalityLevel;
    }
    if (updates.confidenceLevel !== undefined) {
      voiceSummaryUpdates.confidenceLevel = updates.confidenceLevel;
      brandKitUpdates.confidenceLevel = updates.confidenceLevel;
    }
    if (updates.voiceDescription !== undefined) {
      voiceSummaryUpdates.voiceDescription = updates.voiceDescription;
      brandKitUpdates.voiceDescription = updates.voiceDescription;
    }
    if (updates.aiToneSuggestions !== undefined) {
      voiceSummaryUpdates.aiToneSuggestions = updates.aiToneSuggestions;
      brandKitUpdates.aiToneSuggestions = updates.aiToneSuggestions;
    }

    // Visual Identity → visual_summary + brand_kit
    if (updates.logoUrl !== undefined) {
      visualSummaryUpdates.logo_urls = [updates.logoUrl];
      brandKitUpdates.logoUrl = updates.logoUrl;
    }
    if (updates.fontFamily !== undefined) {
      visualSummaryUpdates.fonts = [updates.fontFamily];
      brandKitUpdates.fontFamily = updates.fontFamily;
    }
    if (updates.fontSource !== undefined) brandKitUpdates.fontSource = updates.fontSource;
    if (updates.customFontUrl !== undefined) brandKitUpdates.customFontUrl = updates.customFontUrl;
    if (updates.primaryColors !== undefined) {
      visualSummaryUpdates.colors = updates.primaryColors;
      brandKitUpdates.primaryColors = updates.primaryColors;
      brandKitUpdates.colorPalette = updates.primaryColors;
    }
    if (updates.primaryColor !== undefined) brandKitUpdates.primaryColor = updates.primaryColor;
    if (updates.secondaryColor !== undefined) brandKitUpdates.secondaryColor = updates.secondaryColor;
    if (updates.secondaryColors !== undefined) brandKitUpdates.secondaryColors = updates.secondaryColors;
    if (updates.colorPalette !== undefined) {
      visualSummaryUpdates.colors = updates.colorPalette;
      brandKitUpdates.colorPalette = updates.colorPalette;
    }
    if (updates.visualNotes !== undefined) {
      visualSummaryUpdates.style = updates.visualNotes;
      brandKitUpdates.visualNotes = updates.visualNotes;
    }

    // Personas, Goals, Guardrails → brand_kit
    if (updates.personas !== undefined) brandKitUpdates.personas = updates.personas;
    if (updates.goals !== undefined) brandKitUpdates.goals = updates.goals;
    if (updates.guardrails !== undefined) brandKitUpdates.guardrails = updates.guardrails;

    // Keywords (from onboarding)
    if (updates.keywords !== undefined) brandKitUpdates.keywords = updates.keywords;
    if (updates.keyword_themes !== undefined) brandKitUpdates.keyword_themes = updates.keyword_themes;

    // Metadata
    if (updates.completionPercentage !== undefined) brandKitUpdates.completionPercentage = updates.completionPercentage;
    if (updates.setupMethod !== undefined) brandKitUpdates.setupMethod = updates.setupMethod;
    if (updates.brandName !== undefined) {
      nameUpdate = updates.brandName;
      brandKitUpdates.brandName = updates.brandName;
    }

    // Increment version
    brandKitUpdates.version = (currentBrandKit.version || 1) + 1;

    // Merge with existing data
    const updatedBrandKit = { ...currentBrandKit, ...brandKitUpdates };
    const updatedVoiceSummary = { ...currentVoiceSummary, ...voiceSummaryUpdates };
    const updatedVisualSummary = { ...currentVisualSummary, ...visualSummaryUpdates };

    // Update in Supabase
    const updateData: any = {
      brand_kit: updatedBrandKit,
      voice_summary: updatedVoiceSummary,
      visual_summary: updatedVisualSummary,
      updated_at: new Date().toISOString(),
    };

    if (nameUpdate) {
      updateData.name = nameUpdate;
    }

    // Update tone_keywords if tone was updated
    if (updates.tone !== undefined) {
      updateData.tone_keywords = Array.isArray(updates.tone) ? updates.tone : [];
    }

    const { data: updatedBrand, error } = await supabase
      .from("brands")
      .update(updateData)
      .eq("id", brandId)
      .select()
      .single();

    if (error) {
      console.error("[BrandGuide] Error updating brand:", error);
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        "Failed to update Brand Guide",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "error"
      );
    }

    (res as any).json({
      success: true,
      message: "Brand Guide updated successfully",
      updatedAt: updatedBrand.updated_at,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

