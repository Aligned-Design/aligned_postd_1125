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
import { validateBrandId } from "../middleware/validate-brand-id";
import { getScrapedImages } from "../lib/scraped-images-service";
import { getCurrentBrandGuide, saveBrandGuide } from "../lib/brand-guide-service";
import { createVersionHistory, getVersionHistory, getBrandGuideVersion } from "../lib/brand-guide-version-history";
import { generateBFSBaseline, shouldRegenerateBaseline } from "../lib/bfs-baseline-generator";
import { normalizeBrandGuide, type BrandGuide } from "@shared/brand-guide";
import { validateBrandGuide, applyBrandGuideDefaults } from "../lib/brand-guide-validation";

const router = Router();

/**
 * GET /api/brand-guide/:brandId
 * Get Brand Guide data for a brand
 */
router.get("/:brandId", authenticateUser, validateBrandId, async (req, res, next) => {
  try {
    // ✅ Use validated brandId from middleware (handles params, query, body)
    const brandId = (req as any).validatedBrandId ?? req.params.brandId;

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
      // ✅ FIX: Get all scraped images (no role/category filter here - we'll filter in separation step)
      const scraped = await getScrapedImages(brandId);
      scrapedImages = scraped.map(img => ({
        id: img.id,
        url: img.url,
        filename: img.filename,
        source: "scrape" as const,
        metadata: {
          ...img.metadata,
          // ✅ ENHANCED: Include category from database if available
          category: (img.metadata as any)?.category || undefined,
        },
      }));
      
      // ✅ LOGGING: Brand Guide query with IDs (moved after hasBrandGuide check)
    } catch (error) {
      // ✅ FIX: Log as warning since this is non-critical - route continues without scraped images
      console.warn(`[BrandGuide] ⚠️ Error fetching scraped images for brandId ${brandId} (continuing without images):`, {
        error: error instanceof Error ? error.message : String(error),
        brandId,
        hint: "Brand Guide will be returned without scraped images"
      });
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

    // Build approvedAssets with scraped images
    const approvedAssets = brandKit.approvedAssets || {
      uploadedPhotos: [],
      uploadedGraphics: [],
      uploadedTemplates: [],
      approvedStockImages: [],
      productsServices: [],
    };

    // ✅ CRITICAL FIX: Separate scraped images into logos and brand images
    // This ensures Brand Guide exposes two distinct arrays for onboarding Step 5
    // ✅ ENHANCED: Also filter by category from media_assets table for extra safety
    const scrapedLogos = scrapedImages
      .filter(img => {
        const role = img.metadata?.role || "";
        // ✅ STRICT: Only include images with role="logo"
        // Also check category if available in metadata
        const category = (img.metadata as any)?.category || "";
        return (role === "logo" || role === "Logo" || category === "logos");
      })
      .slice(0, 2) // Max 2 logos
      .map(img => ({
        id: img.id,
        url: img.url,
        filename: img.filename,
        source: "scrape" as const,
        metadata: img.metadata,
      }));
    
    // ✅ UPDATED (2025-12-10): More lenient brand image filtering
    // NEW RULE: Include all images EXCEPT social_icon and platform_logo
    // Logos CAN be included - user can remove via X button if unwanted
    const scrapedBrandImages = scrapedImages
      .filter(img => {
        const role = img.metadata?.role || "";
        
        // ✅ ONLY filter social icons and platform logos (never useful as brand content)
        if (role === "social_icon" || role === "platform_logo") {
          return false;
        }
        
        // ✅ Include everything else - logos, hero, photo, team, subject, other, partner_logo, etc.
        // User can use X button to remove any unwanted images
        return true;
      })
      .slice(0, 15) // Max 15 brand images
      .map(img => ({
        id: img.id,
        url: img.url,
        filename: img.filename,
        source: "scrape" as const,
        metadata: img.metadata,
      }));
    
    // ✅ FALLBACK: If no logos persisted but logoUrl exists, use that
    const logoUrl = (brand.logo_url as string) || (brandKit.logoUrl as string) || (visualSummary.logo_urls?.[0] as string) || "";
    if (scrapedLogos.length === 0 && logoUrl && logoUrl.startsWith("http")) {
      console.log(`[BrandGuide] Using logoUrl as fallback logo: ${logoUrl}`);
      scrapedLogos.push({
        id: "fallback-logo",
        url: logoUrl,
        filename: "logo.png",
        source: "scrape" as const,
        metadata: { role: "logo", source: "scrape", fallback: true },
      });
    }
    
    // ✅ CRITICAL: Include scraped images in approvedAssets.uploadedPhotos (for backward compatibility)
    const uploadedPhotos = [
      ...(approvedAssets.uploadedPhotos || []),
      ...scrapedLogos,
      ...scrapedBrandImages,
    ];

    const brandGuide = {
      id: brand.id,
      brandName: brand.name || brandKit.brandName || "Untitled Brand",
      brandId: brand.id,
      
      // Summary
      // ✅ FIX: Check both purpose and about_blurb (crawler saves about_blurb, brand guide saves purpose)
      purpose: brandKit.purpose || brandKit.about_blurb || "",
      mission: brandKit.mission || "",
      vision: brandKit.vision || "",
      summaryReviewedByAI: brandKit.summaryReviewedByAI || false,
      longFormSummary: brandKit.longFormSummary || brandKit.about_blurb || "", // 8-10 paragraph narrative summary generated by Doc Agent

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
      primaryColors: visualSummary.colors || brandKit.primaryColors || brandKit.colorPalette || brandKit.allColors?.slice(0, 3) || [],
      primaryColor: brandKit.primaryColor || visualSummary.colors?.[0] || brand.primary_color || "",
      secondaryColor: brandKit.secondaryColor || visualSummary.colors?.[1] || "",
      colorPalette: visualSummary.colors || brandKit.colorPalette || brandKit.allColors || [],
      secondaryColors: visualSummary.colors?.slice(1) || brandKit.secondaryColors || brandKit.allColors?.slice(3, 6) || [],
      allColors: brandKit.allColors || visualSummary.colors || brandKit.colorPalette || [],
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
      
      // ✅ NEW: Separate logos and images arrays for onboarding Step 5
      // These are the primary fields Step 5 should read from
      logos: scrapedLogos, // Max 2 logos
      images: scrapedBrandImages, // Max 15 brand images
      // Alias for backward compatibility
      brandImages: scrapedBrandImages,

      // Metadata
      createdAt: brand.created_at || new Date().toISOString(),
      updatedAt: brand.updated_at || new Date().toISOString(),
      completionPercentage: brandKit.completionPercentage || 0,
      setupMethod: brandKit.setupMethod || "detailed",
      version: brandKit.version || 1,
    };

    // Return 200 with hasBrandGuide flag (never 404 if brand exists)
    return res.status(HTTP_STATUS.OK).json({
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
router.put("/:brandId", authenticateUser, validateBrandId, async (req, res, next) => {
  try {
    // ✅ Use validated brandId from middleware
    const brandId = (req as any).validatedBrandId ?? req.params.brandId;
    const brandGuide = req.body;

    if (!brandGuide) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "Brand Guide data is required",
        HTTP_STATUS.BAD_REQUEST,
        "warning"
      );
    }

    // Validate Brand Guide data
    const validation = validateBrandGuide(brandGuide as any);
    if (!validation.isValid && validation.errors.length > 0) {
      // Return validation errors and warnings in response
      throw new AppError(
        ErrorCode.INVALID_FORMAT,
        `Brand Guide validation failed: ${validation.errors.join(", ")}`,
        HTTP_STATUS.BAD_REQUEST,
        "warning",
        { validationErrors: validation.errors, validationWarnings: validation.warnings }
      );
    }

    // Apply defaults for missing fields
    const validatedBrandGuide = applyBrandGuideDefaults(brandGuide);

    // Map BrandGuide interface to Supabase structure
    const brandKit: any = {
      brandName: validatedBrandGuide.brandName,
      purpose: validatedBrandGuide.purpose,
      mission: validatedBrandGuide.mission,
      vision: validatedBrandGuide.vision,
      summaryReviewedByAI: (validatedBrandGuide as any).summaryReviewedByAI,
      businessType: validatedBrandGuide.identity?.businessType,
      industry: validatedBrandGuide.identity?.industry,
      industryKeywords: validatedBrandGuide.identity?.industryKeywords || [],
      values: validatedBrandGuide.identity?.values || [],
      coreValues: validatedBrandGuide.identity?.values || [],
      targetAudience: validatedBrandGuide.identity?.targetAudience,
      primaryAudience: validatedBrandGuide.identity?.targetAudience,
      painPoints: validatedBrandGuide.identity?.painPoints || [],
      competitors: validatedBrandGuide.identity?.competitors || [],
      toneKeywords: validatedBrandGuide.voiceAndTone?.tone || [],
      friendlinessLevel: validatedBrandGuide.voiceAndTone?.friendlinessLevel,
      formalityLevel: validatedBrandGuide.voiceAndTone?.formalityLevel,
      confidenceLevel: validatedBrandGuide.voiceAndTone?.confidenceLevel,
      voiceDescription: validatedBrandGuide.voiceAndTone?.voiceDescription,
      writingRules: validatedBrandGuide.voiceAndTone?.writingRules || [],
      avoidPhrases: validatedBrandGuide.voiceAndTone?.avoidPhrases || [],
      aiToneSuggestions: (validatedBrandGuide as any).aiToneSuggestions,
      logoUrl: validatedBrandGuide.visualIdentity?.logoUrl,
      fontFamily: validatedBrandGuide.visualIdentity?.typography?.heading,
      fontSource: validatedBrandGuide.visualIdentity?.typography?.source,
      customFontUrl: validatedBrandGuide.visualIdentity?.typography?.customUrl,
      primaryColors: validatedBrandGuide.visualIdentity?.colors || [],
      primaryColor: (validatedBrandGuide as any).primaryColor,
      secondaryColor: (validatedBrandGuide as any).secondaryColor,
      colorPalette: validatedBrandGuide.visualIdentity?.colors || [],
      secondaryColors: (validatedBrandGuide as any).secondaryColors,
      visualNotes: validatedBrandGuide.visualIdentity?.visualNotes,
      contentPillars: validatedBrandGuide.contentRules?.contentPillars || [],
      messagingPillars: validatedBrandGuide.contentRules?.contentPillars || [],
      personas: validatedBrandGuide.personas || [],
      goals: validatedBrandGuide.goals || [],
      guardrails: validatedBrandGuide.contentRules?.guardrails || [],
      completionPercentage: (validatedBrandGuide as any).completionPercentage || 0,
      setupMethod: validatedBrandGuide.setupMethod || "detailed",
      version: (validatedBrandGuide.version || 1) + 1, // Increment version
    };

    const voiceSummary: any = {
      tone: validatedBrandGuide.voiceAndTone?.tone || [],
      friendlinessLevel: validatedBrandGuide.voiceAndTone?.friendlinessLevel,
      formalityLevel: validatedBrandGuide.voiceAndTone?.formalityLevel,
      confidenceLevel: validatedBrandGuide.voiceAndTone?.confidenceLevel,
      voiceDescription: validatedBrandGuide.voiceAndTone?.voiceDescription,
      writingRules: validatedBrandGuide.voiceAndTone?.writingRules || [],
      avoid: validatedBrandGuide.voiceAndTone?.avoidPhrases || [],
      aiToneSuggestions: (validatedBrandGuide as any).aiToneSuggestions,
    };

    const visualSummary: any = {
      colors: validatedBrandGuide.visualIdentity?.colors || [],
      fonts: [
        validatedBrandGuide.visualIdentity?.typography?.heading,
        validatedBrandGuide.visualIdentity?.typography?.body,
      ].filter(Boolean),
      style: validatedBrandGuide.visualIdentity?.visualNotes,
      logo_urls: validatedBrandGuide.visualIdentity?.logoUrl ? [validatedBrandGuide.visualIdentity.logoUrl] : [],
      photographyStyle: {
        mustInclude: validatedBrandGuide.visualIdentity?.photographyStyle?.mustInclude || [],
        mustAvoid: validatedBrandGuide.visualIdentity?.photographyStyle?.mustAvoid || [],
      },
    };

    // Update brand in Supabase
    // Get previous version for version history
    const previousBrandGuide = await getCurrentBrandGuide(brandId);
    const user = (req as any).user;
    const changedBy = user?.id || user?.userId;

    const { data: updatedBrand, error } = await supabase
      .from("brands")
      .update({
        name: brandGuide.brandName,
        brand_kit: brandKit,
        voice_summary: voiceSummary,
        visual_summary: visualSummary,
        // tone_keywords column doesn't exist - store in brand_kit instead
        // tone_keywords: brandGuide.tone || [],
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

    // Create version history entry
    const updatedBrandGuide = normalizeBrandGuide(updatedBrand);
    await createVersionHistory(brandId, updatedBrandGuide, previousBrandGuide, changedBy);

    // Check if BFS baseline needs regeneration
    if (shouldRegenerateBaseline(updatedBrandGuide, previousBrandGuide?.version)) {
      try {
        const baseline = await generateBFSBaseline(updatedBrandGuide);
        // Update brand_kit with baseline
        const updatedBrandKit = {
          ...brandKit,
          performanceInsights: {
            ...brandKit.performanceInsights,
            bfsBaseline: baseline,
          },
        };
        await supabase
          .from("brands")
          .update({ brand_kit: updatedBrandKit })
          .eq("id", brandId);
      } catch (baselineError) {
        // ✅ FIX: Log as warning since this is non-critical - baseline generation failure doesn't block the update
        console.warn("[BrandGuide] ⚠️ Error generating BFS baseline (non-critical, continuing):", {
          error: baselineError instanceof Error ? baselineError.message : String(baselineError),
          hint: "Brand Guide update succeeded, baseline generation will be retried later"
        });
        // Non-critical, continue
      }
    }

    // Include warnings in response (non-blocking)
    const responseData: any = {
      success: true,
      brandGuide: {
        ...validatedBrandGuide,
        updatedAt: updatedBrand.updated_at,
      },
      message: "Brand Guide updated successfully",
    };
    
    // Always include warnings if present (warnings don't block saves)
    if (validation.warnings.length > 0) {
      responseData.validationWarnings = validation.warnings;
    }

    return res.status(HTTP_STATUS.OK).json(responseData);
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/brand-guide/:brandId
 * Partial update of Brand Guide (update specific fields only)
 */
router.patch("/:brandId", authenticateUser, validateBrandId, async (req, res, next) => {
  try {
    // ✅ Use validated brandId from middleware
    const brandId = (req as any).validatedBrandId ?? req.params.brandId;
    const updates = req.body;

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

    // Validate partial updates (merge with current to validate)
    const mergedGuide = { ...currentBrandKit, ...updates };
    const validation = validateBrandGuide(normalizeBrandGuide({
      ...currentBrand,
      brand_kit: mergedGuide,
    } as any) as any);
    if (!validation.isValid && validation.errors.length > 0) {
      // Only fail on critical errors, warnings are OK for partial updates
      const criticalErrors = validation.errors.filter(e => 
        e.includes("required") || e.includes("invalid")
      );
      if (criticalErrors.length > 0) {
        throw new AppError(
          ErrorCode.INVALID_FORMAT,
          `Brand Guide validation failed: ${criticalErrors.join(", ")}`,
          HTTP_STATUS.BAD_REQUEST,
          "warning",
          { validationErrors: validation.errors, validationWarnings: validation.warnings }
        );
      }
    }

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
    if (updates.longFormSummary !== undefined) brandKitUpdates.longFormSummary = updates.longFormSummary;
    if (updates.about_blurb !== undefined) brandKitUpdates.about_blurb = updates.about_blurb;

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
    if (updates.allColors !== undefined) {
      // allColors is the complete palette (up to 6 colors)
      visualSummaryUpdates.colors = updates.allColors;
      brandKitUpdates.allColors = updates.allColors;
      brandKitUpdates.primaryColors = updates.allColors.slice(0, 3);
      brandKitUpdates.secondaryColors = updates.allColors.slice(3, 6);
      brandKitUpdates.colorPalette = updates.allColors;
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

    // Identity fields
    if (updates.identity?.industry !== undefined) brandKitUpdates.industry = updates.identity.industry;
    if (updates.identity?.values !== undefined) {
      brandKitUpdates.values = updates.identity.values;
      brandKitUpdates.coreValues = updates.identity.values; // Legacy alias
    }
    if (updates.identity?.targetAudience !== undefined) {
      brandKitUpdates.targetAudience = updates.identity.targetAudience;
      brandKitUpdates.primaryAudience = updates.identity.targetAudience; // Legacy alias
    }
    if (updates.identity?.painPoints !== undefined) brandKitUpdates.painPoints = updates.identity.painPoints;

    // Content Rules
    if (updates.contentRules?.contentPillars !== undefined) {
      brandKitUpdates.contentPillars = updates.contentRules.contentPillars;
      brandKitUpdates.messagingPillars = updates.contentRules.contentPillars; // Legacy alias
    }

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

    // Update tone in brand_kit (not tone_keywords column - that doesn't exist)
    if (updates.tone !== undefined) {
      // Store tone in brand_kit JSONB field, not in a separate column
      brandKitUpdates.toneKeywords = Array.isArray(updates.tone) ? updates.tone : [];
    }

    // Get previous version for version history
    const previousBrandGuide = await getCurrentBrandGuide(brandId);
    const user = (req as any).user;
    const changedBy = user?.id || user?.userId;

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

    // Create version history entry
    const updatedBrandGuide = normalizeBrandGuide(updatedBrand);
    await createVersionHistory(brandId, updatedBrandGuide, previousBrandGuide, changedBy);

    // Check if BFS baseline needs regeneration
    if (shouldRegenerateBaseline(updatedBrandGuide, previousBrandGuide?.version)) {
      try {
        const baseline = await generateBFSBaseline(updatedBrandGuide);
        // Update brand_kit with baseline
        const updatedBrandKitWithBaseline = {
          ...updatedBrandKit,
          performanceInsights: {
            ...updatedBrandKit.performanceInsights,
            bfsBaseline: baseline,
          },
        };
        await supabase
          .from("brands")
          .update({ brand_kit: updatedBrandKitWithBaseline })
          .eq("id", brandId);
      } catch (baselineError) {
        // ✅ FIX: Log as warning since this is non-critical - baseline generation failure doesn't block the update
        console.warn("[BrandGuide] ⚠️ Error generating BFS baseline (non-critical, continuing):", {
          error: baselineError instanceof Error ? baselineError.message : String(baselineError),
          hint: "Brand Guide update succeeded, baseline generation will be retried later"
        });
        // Non-critical, continue
      }
    }

    // Include warnings in response (non-blocking)
    // Re-validate to get warnings for the final saved state
    const finalValidation = validateBrandGuide(updatedBrandGuide);
    const responseData: any = {
      success: true,
      message: "Brand Guide updated successfully",
      updatedAt: updatedBrand.updated_at,
    };
    
    // Always include warnings if present (warnings don't block saves)
    if (finalValidation.warnings.length > 0) {
      responseData.validationWarnings = finalValidation.warnings;
    }
    
    return res.status(HTTP_STATUS.OK).json(responseData);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/brand-guide/:brandId/versions
 * Get version history for a brand
 */
router.get("/:brandId/versions", authenticateUser, validateBrandId, async (req, res, next) => {
  try {
    // ✅ Use validated brandId from middleware
    const brandId = (req as any).validatedBrandId ?? req.params.brandId;

    const versions = await getVersionHistory(brandId);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      versions,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/brand-guide/:brandId/versions/:version
 * Get a specific version of Brand Guide
 */
router.get("/:brandId/versions/:version", authenticateUser, validateBrandId, async (req, res, next) => {
  try {
    // ✅ Use validated brandId from middleware
    const brandId = (req as any).validatedBrandId ?? req.params.brandId;
    const { version } = req.params;
    const versionNumber = parseInt(version, 10);

    if (isNaN(versionNumber)) {
      throw new AppError(
        ErrorCode.INVALID_FORMAT,
        "Invalid version number",
        HTTP_STATUS.BAD_REQUEST,
        "warning"
      );
    }

    const versionData = await getBrandGuideVersion(brandId, versionNumber);

    if (!versionData) {
      throw new AppError(
        ErrorCode.NOT_FOUND,
        "Version not found",
        HTTP_STATUS.NOT_FOUND,
        "info",
        { brandId, version: versionNumber }
      );
    }

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      version: versionData,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/brand-guide/:brandId/rollback/:version
 * Rollback Brand Guide to a specific version
 */
router.post("/:brandId/rollback/:version", authenticateUser, validateBrandId, async (req, res, next) => {
  try {
    // ✅ Use validated brandId from middleware
    const brandId = (req as any).validatedBrandId ?? req.params.brandId;
    const { version } = req.params;
    const versionNumber = parseInt(version, 10);

    if (isNaN(versionNumber)) {
      throw new AppError(
        ErrorCode.INVALID_FORMAT,
        "Invalid version number",
        HTTP_STATUS.BAD_REQUEST,
        "warning"
      );
    }

    // Get the version to rollback to
    const versionData = await getBrandGuideVersion(brandId, versionNumber);

    if (!versionData) {
      throw new AppError(
        ErrorCode.NOT_FOUND,
        "Version not found",
        HTTP_STATUS.NOT_FOUND,
        "info",
        { brandId, version: versionNumber }
      );
    }

    // Get current Brand Guide for version history
    const currentBrandGuide = await getCurrentBrandGuide(brandId);
    const user = (req as any).user;
    const changedBy = user?.id || user?.userId;

    // ✅ FIX: versionData.brandGuide is already a normalized BrandGuide structure
    // We need to reconstruct the full BrandGuide from the version snapshot
    // and then map it to Supabase structure using the service function
    const restoredBrandGuide: BrandGuide = {
      id: brandId,
      brandId,
      brandName: versionData.brandGuide.identity?.name || currentBrandGuide?.brandName || "Untitled Brand",
      identity: versionData.brandGuide.identity || currentBrandGuide?.identity || {
        name: versionData.brandGuide.identity?.name || "Untitled Brand",
        industryKeywords: [],
      },
      voiceAndTone: versionData.brandGuide.voiceAndTone || currentBrandGuide?.voiceAndTone || {
        tone: [],
        friendlinessLevel: 50,
        formalityLevel: 50,
        confidenceLevel: 50,
      },
      visualIdentity: versionData.brandGuide.visualIdentity || currentBrandGuide?.visualIdentity || {
        colors: [],
        typography: { heading: "Inter", body: "Inter", source: "google" },
        photographyStyle: { mustInclude: [], mustAvoid: [] },
      },
      contentRules: versionData.brandGuide.contentRules || currentBrandGuide?.contentRules || {
        platformGuidelines: {},
        preferredPlatforms: [],
        preferredPostTypes: [],
        brandPhrases: [],
        contentPillars: [],
        neverDo: [],
        guardrails: [],
      },
      approvedAssets: versionData.brandGuide.approvedAssets || currentBrandGuide?.approvedAssets || {
        uploadedPhotos: [],
        uploadedGraphics: [],
        uploadedTemplates: [],
        approvedStockImages: [],
        productsServices: [],
      },
      performanceInsights: versionData.brandGuide.performanceInsights || currentBrandGuide?.performanceInsights || {
        visualPatterns: [],
        copyPatterns: [],
      },
      personas: versionData.brandGuide.personas || currentBrandGuide?.personas || [],
      goals: versionData.brandGuide.goals || currentBrandGuide?.goals || [],
      purpose: versionData.brandGuide.purpose || currentBrandGuide?.purpose,
      mission: versionData.brandGuide.mission || currentBrandGuide?.mission,
      vision: versionData.brandGuide.vision || currentBrandGuide?.vision,
      createdAt: versionData.brandGuide.createdAt || currentBrandGuide?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: (currentBrandGuide?.version || 1) + 1, // Increment version for rollback
      setupMethod: versionData.brandGuide.setupMethod || currentBrandGuide?.setupMethod || "detailed",
    };

    // ✅ VALIDATION: Validate restored Brand Guide
    const validation = validateBrandGuide(restoredBrandGuide);
    if (!validation.isValid && validation.errors.length > 0) {
      console.warn("[BrandGuide] Validation errors during rollback:", validation.errors);
    }
    const validatedBrandGuide = applyBrandGuideDefaults(restoredBrandGuide);

    // ✅ FIX: Use saveBrandGuide service function to ensure correct mapping
    // This ensures consistent mapping to Supabase structure
    await saveBrandGuide(brandId, validatedBrandGuide);

    // Get updated brand to return in response
    const updatedBrandGuide = await getCurrentBrandGuide(brandId);
    if (!updatedBrandGuide) {
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        "Failed to retrieve rolled back Brand Guide",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "error"
      );
    }

    // Create version history entry for rollback
    await createVersionHistory(
      brandId,
      updatedBrandGuide,
      currentBrandGuide,
      changedBy,
      `Rollback to version ${versionNumber}`
    );

    // Regenerate BFS baseline if needed
    if (shouldRegenerateBaseline(updatedBrandGuide, currentBrandGuide?.version)) {
      try {
        const baseline = await generateBFSBaseline(updatedBrandGuide);
        const { data: brand } = await supabase
          .from("brands")
          .select("brand_kit")
          .eq("id", brandId)
          .single();
        if (brand) {
          const updatedBrandKit = {
            ...(brand.brand_kit as any),
            performanceInsights: {
              ...(brand.brand_kit as any)?.performanceInsights,
              bfsBaseline: baseline,
            },
          };
          await supabase
            .from("brands")
            .update({ brand_kit: updatedBrandKit })
            .eq("id", brandId);
        }
      } catch (baselineError) {
        // ✅ FIX: Log as warning since this is non-critical - baseline generation failure doesn't block the rollback
        console.warn("[BrandGuide] ⚠️ Error generating BFS baseline after rollback (non-critical, continuing):", {
          error: baselineError instanceof Error ? baselineError.message : String(baselineError),
          hint: "Brand Guide rollback succeeded, baseline generation will be retried later"
        });
        // Non-critical, continue
      }
    }

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: `Brand Guide rolled back to version ${versionNumber}`,
      brandGuide: updatedBrandGuide,
      updatedAt: updatedBrandGuide.updatedAt,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

