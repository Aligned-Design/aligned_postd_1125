/**
 * Brand Guide Sync Service
 * 
 * Helper functions to sync Brand Guide data between onboarding and Brand Guide page.
 * Ensures all fields are properly saved to Supabase brands table.
 */

import { supabase } from "./supabase";
import type { BrandGuide } from "@shared/brand-guide"; // ✅ Fixed import path
import { generateBFSBaseline, shouldRegenerateBaseline } from "./bfs-baseline-generator";
import { createVersionHistory } from "./brand-guide-version-history";
import { normalizeBrandGuide } from "@shared/brand-guide";
import { validateBrandGuide, applyBrandGuideDefaults } from "./brand-guide-validation";
import { logger } from "./logger";

/**
 * Extract pain points from personas array
 */
function extractPainPointsFromPersonas(personas: any[]): string[] {
  if (!Array.isArray(personas)) return [];
  const allPainPoints: string[] = [];
  personas.forEach((persona) => {
    if (persona.painPoints && Array.isArray(persona.painPoints)) {
      allPainPoints.push(...persona.painPoints);
    }
  });
  return [...new Set(allPainPoints)]; // Remove duplicates
}

/**
 * Convert Brand Snapshot (onboarding format) to Brand Guide format
 */
export function brandSnapshotToBrandGuide(
  brandSnapshot: any,
  brandId: string,
  brandName: string
): Partial<BrandGuide> {
  // Extract photography style rules from onboarding (if provided)
  const mustInclude: string[] = [];
  const mustAvoid: string[] = [];
  
  // Check for image rules in brandSnapshot (e.g., "Only use poured coffee, no espresso shots")
  if (brandSnapshot.imageRules) {
    if (Array.isArray(brandSnapshot.imageRules.mustInclude)) {
      mustInclude.push(...brandSnapshot.imageRules.mustInclude);
    }
    if (Array.isArray(brandSnapshot.imageRules.mustAvoid)) {
      mustAvoid.push(...brandSnapshot.imageRules.mustAvoid);
    }
  }
  
  // Also check extractedMetadata.donts for visual rules
  const donts = brandSnapshot.extractedMetadata?.donts || [];
  donts.forEach((dont: string) => {
    if (dont.toLowerCase().includes("image") || dont.toLowerCase().includes("photo") || dont.toLowerCase().includes("visual")) {
      mustAvoid.push(dont);
    }
  });

  return {
    id: brandId,
    brandId,
    brandName,
    
    // Identity
    identity: {
      name: brandName,
      businessType: brandSnapshot.industry || brandSnapshot.businessType,
      industry: brandSnapshot.industry || brandSnapshot.businessType, // Explicit industry field
      industryKeywords: brandSnapshot.extractedMetadata?.keywords || [],
      competitors: brandSnapshot.competitors || [],
      // ✅ MVP2: Prepend heroHeadline as first sample headline
      sampleHeadlines: [
        brandSnapshot.extractedMetadata?.heroHeadline,
        ...(brandSnapshot.extractedMetadata?.headlines || [])
      ].filter((h): h is string => !!h && h.length > 0),
      values: brandSnapshot.values || brandSnapshot.coreValues || [],
      targetAudience: brandSnapshot.audience || brandSnapshot.targetAudience || "",
      painPoints: extractPainPointsFromPersonas(brandSnapshot.personas) || [],
    },

    // Voice & Tone
    voiceAndTone: {
      tone: Array.isArray(brandSnapshot.tone) ? brandSnapshot.tone : [brandSnapshot.tone || "Professional"],
      friendlinessLevel: 50,
      formalityLevel: 50,
      confidenceLevel: 50,
      voiceDescription: brandSnapshot.voice || "",
      writingRules: brandSnapshot.extractedMetadata?.dos || [],
      avoidPhrases: brandSnapshot.extractedMetadata?.donts || [],
    },

    // Visual Identity
    visualIdentity: {
      colors: brandSnapshot.colors || [],
      typography: {
        heading: brandSnapshot.fontFamily || "",
        body: brandSnapshot.fontFamily || "",
        source: "google",
        customUrl: "",
      },
      photographyStyle: {
        mustInclude,
        mustAvoid,
      },
      logoUrl: brandSnapshot.logo || "",
      visualNotes: brandSnapshot.visualNotes || "",
    },

    // Content Rules
    contentRules: {
      platformGuidelines: {},
      preferredPlatforms: brandSnapshot.preferredPlatforms || [],
      preferredPostTypes: brandSnapshot.preferredPostTypes || [],
      brandPhrases: brandSnapshot.brandPhrases || [],
      formalityLevel: brandSnapshot.formalityLevel,
      // ✅ MVP2: Use services as content pillars if none exist
      contentPillars: brandSnapshot.contentPillars || brandSnapshot.messagingPillars || 
        (brandSnapshot.extractedMetadata?.services?.slice(0, 5) || []),
      neverDo: brandSnapshot.extractedMetadata?.donts || [],
      guardrails: (brandSnapshot.extractedMetadata?.donts || []).map((dont: string, idx: number) => ({
        id: `guardrail-${idx}`,
        title: `Avoid: ${dont}`,
        description: dont,
        category: "messaging" as const,
        isActive: true,
      })),
    },

    // Approved Assets
    approvedAssets: {
      uploadedPhotos: [],
      uploadedGraphics: [],
      uploadedTemplates: [],
      approvedStockImages: brandSnapshot.approvedStockImages || [],
      // ✅ MVP2: Include scraped services as products/services
      productsServices: (brandSnapshot.extractedMetadata?.services || []).map((name: string, idx: number) => ({
        id: `svc-${idx}`,
        name,
        description: "",
      })),
    },

    // Legacy fields (for backward compatibility)
    // ✅ MVP2: Use aboutText as fallback if brandIdentity is weak
    purpose: (() => {
      const brandIdentity = brandSnapshot.extractedMetadata?.brandIdentity;
      const aboutText = brandSnapshot.extractedMetadata?.aboutText;
      
      // Prefer AI-generated brandIdentity if valid
      if (brandIdentity && typeof brandIdentity === "string" && brandIdentity.trim().length > 10) {
        return brandIdentity.trim();
      }
      
      // Fall back to raw aboutText
      if (aboutText && typeof aboutText === "string" && aboutText.trim().length > 50) {
        return aboutText.trim();
      }
      
      return brandSnapshot.goal || "";
    })(),
    mission: brandSnapshot.goal || "",
    vision: "",
    personas: [],
    goals: [],

    // Metadata
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
    setupMethod: "ai_generated",
  };
}

/**
 * Save Brand Guide to Supabase from onboarding
 * This ensures onboarding and Brand Guide page use the same data source
 */
export async function saveBrandGuideFromOnboarding(
  brandId: string,
  brandSnapshot: any,
  brandName: string
): Promise<void> {
  try {
    // Convert snapshot to Brand Guide format
    const brandGuide = brandSnapshotToBrandGuide(brandSnapshot, brandId, brandName);

    // ✅ VALIDATION: Validate Brand Guide before saving
    const validation = validateBrandGuide(brandGuide as any);
    if (!validation.isValid && validation.errors.length > 0) {
      // Log errors but don't block onboarding (non-critical)
      logger.warn("Brand Guide validation errors during onboarding", {
        brandId,
        brandName,
        errorCount: validation.errors.length,
        errors: validation.errors,
      });
    }
    // Apply defaults for missing fields
    const validatedGuide = applyBrandGuideDefaults(brandGuide);

    // Map to Supabase structure using new BrandGuide format
    const brandKit: any = {
      brandName: validatedGuide.brandName,
      // ✅ CRITICAL: Save both purpose and about_blurb for compatibility
      // Brand guide uses 'purpose', crawler uses 'about_blurb'
      purpose: validatedGuide.purpose,
      about_blurb: validatedGuide.purpose || "", // Map purpose to about_blurb for crawler compatibility
      longFormSummary: validatedGuide.longFormSummary || validatedGuide.purpose || "",
      mission: validatedGuide.mission,
      vision: validatedGuide.vision,
      businessType: validatedGuide.identity?.businessType,
      industry: validatedGuide.identity?.industry,
      keywords: validatedGuide.identity?.industryKeywords || [],
      industryKeywords: validatedGuide.identity?.industryKeywords || [],
      competitors: validatedGuide.identity?.competitors || [],
      values: validatedGuide.identity?.values || [],
      coreValues: validatedGuide.identity?.values || [], // Legacy alias
      targetAudience: validatedGuide.identity?.targetAudience,
      primaryAudience: validatedGuide.identity?.targetAudience, // Legacy alias
      painPoints: validatedGuide.identity?.painPoints || [],
      toneKeywords: validatedGuide.voiceAndTone?.tone || [],
      friendlinessLevel: validatedGuide.voiceAndTone?.friendlinessLevel,
      formalityLevel: validatedGuide.voiceAndTone?.formalityLevel,
      confidenceLevel: validatedGuide.voiceAndTone?.confidenceLevel,
      voiceDescription: validatedGuide.voiceAndTone?.voiceDescription,
      writingRules: validatedGuide.voiceAndTone?.writingRules || [],
      wordsToAvoid: validatedGuide.voiceAndTone?.avoidPhrases || [],
      avoidPhrases: validatedGuide.voiceAndTone?.avoidPhrases || [],
      fontFamily: validatedGuide.visualIdentity?.typography?.heading,
      bodyFont: validatedGuide.visualIdentity?.typography?.body,
      fontSource: validatedGuide.visualIdentity?.typography?.source,
      customFontUrl: validatedGuide.visualIdentity?.typography?.customUrl,
      primaryColors: validatedGuide.visualIdentity?.colors || [],
      logoUrl: validatedGuide.visualIdentity?.logoUrl,
      photographyStyle: {
        mustInclude: validatedGuide.visualIdentity?.photographyStyle?.mustInclude || [],
        mustAvoid: validatedGuide.visualIdentity?.photographyStyle?.mustAvoid || [],
      },
      platformGuidelines: validatedGuide.contentRules?.platformGuidelines || {},
      preferredPlatforms: validatedGuide.contentRules?.preferredPlatforms || [],
      preferredPostTypes: validatedGuide.contentRules?.preferredPostTypes || [],
      brandPhrases: validatedGuide.contentRules?.brandPhrases || [],
      contentFormalityLevel: validatedGuide.contentRules?.formalityLevel, // ✅ Renamed to avoid duplicate with voiceAndTone.formalityLevel
      contentPillars: validatedGuide.contentRules?.contentPillars || [],
      messagingPillars: validatedGuide.contentRules?.contentPillars || [], // Legacy alias
      neverDo: validatedGuide.contentRules?.neverDo || [],
      guardrails: validatedGuide.contentRules?.guardrails || [],
      approvedAssets: validatedGuide.approvedAssets || {
        uploadedPhotos: [],
        uploadedGraphics: [],
        uploadedTemplates: [],
        approvedStockImages: [],
        productsServices: [],
      },
      personas: validatedGuide.personas || [],
      goals: validatedGuide.goals || [],
      performanceInsights: validatedGuide.performanceInsights || {},
      version: validatedGuide.version || 1,
      setupMethod: validatedGuide.setupMethod || "ai_generated",
      // Additional onboarding fields
      images: brandSnapshot.extractedMetadata?.images || [],
      // Note: about_blurb is already set on line 142 for crawler compatibility
    };

    const voiceSummary: any = {
      tone: validatedGuide.voiceAndTone?.tone || [],
      friendlinessLevel: validatedGuide.voiceAndTone?.friendlinessLevel,
      formalityLevel: validatedGuide.voiceAndTone?.formalityLevel,
      confidenceLevel: validatedGuide.voiceAndTone?.confidenceLevel,
      voiceDescription: validatedGuide.voiceAndTone?.voiceDescription,
      writingRules: validatedGuide.voiceAndTone?.writingRules || [],
      avoid: validatedGuide.voiceAndTone?.avoidPhrases || [],
      audience: brandSnapshot.audience || "",
    };

    const visualSummary: any = {
      colors: validatedGuide.visualIdentity?.colors || [],
      fonts: [
        validatedGuide.visualIdentity?.typography?.heading,
        validatedGuide.visualIdentity?.typography?.body,
      ].filter(Boolean),
      photographyStyle: {
        mustInclude: validatedGuide.visualIdentity?.photographyStyle?.mustInclude || [],
        mustAvoid: validatedGuide.visualIdentity?.photographyStyle?.mustAvoid || [],
      },
      logo_urls: validatedGuide.visualIdentity?.logoUrl ? [validatedGuide.visualIdentity.logoUrl] : [],
      visualNotes: validatedGuide.visualIdentity?.visualNotes,
      images: brandSnapshot.extractedMetadata?.images || [],
    };

    // Check if brand exists
    const { data: existingBrand } = await supabase
      .from("brands")
      .select("id")
      .eq("id", brandId)
      .single();

    if (existingBrand) {
      // @supabase-scope-ok Brand lookup by its own primary key
      // Update existing brand
      const { error } = await supabase
        .from("brands")
        .update({
          name: validatedGuide.brandName,
          brand_kit: brandKit,
          voice_summary: voiceSummary,
          visual_summary: visualSummary,
          tone_keywords: (validatedGuide as any).tone || validatedGuide.voiceAndTone?.tone || [],
          updated_at: new Date().toISOString(),
        })
        .eq("id", brandId);

      if (error) {
        logger.error("Error updating brand from onboarding", new Error(error.message), {
          brandId,
          brandName,
          errorCode: error.code,
        });
        throw error;
      }
      
      // Log brand guide completeness metrics
      const hasColors = (validatedGuide.visualIdentity?.colors?.length || 0) > 0;
      const hasLogo = !!validatedGuide.visualIdentity?.logoUrl;
      const hasTone = (validatedGuide.voiceAndTone?.tone?.length || 0) > 0;
      const hasAudience = !!validatedGuide.identity?.targetAudience;
      const hasContentPillars = (validatedGuide.contentRules?.contentPillars?.length || 0) > 0;
      
      logger.info("Brand Guide saved from onboarding", {
        brandId,
        brandName,
        completeness: {
          hasColors,
          hasLogo,
          hasTone,
          hasAudience,
          hasContentPillars,
        },
        colorCount: validatedGuide.visualIdentity?.colors?.length || 0,
        toneCount: validatedGuide.voiceAndTone?.tone?.length || 0,
      });

      // Generate BFS baseline for new/updated Brand Guide
      try {
        const normalizedGuide = normalizeBrandGuide({
          id: brandId,
          brandId,
          name: brandGuide.brandName,
          brand_kit: brandKit,
          voice_summary: voiceSummary,
          visual_summary: visualSummary,
        } as any);

        // Check if baseline needs generation
        if (shouldRegenerateBaseline(normalizedGuide)) {
          const baseline = await generateBFSBaseline(normalizedGuide);
          // Update brand_kit with baseline
          const updatedBrandKit = {
            ...brandKit,
            performanceInsights: {
              ...brandKit.performanceInsights,
              bfsBaseline: baseline,
            },
          };
          // @supabase-scope-ok Brand lookup by its own primary key
          await supabase
            .from("brands")
            .update({ brand_kit: updatedBrandKit })
            .eq("id", brandId);
        }

        // Create version history entry
        await createVersionHistory(brandId, normalizedGuide, null, undefined, "Onboarding sync");
      } catch (baselineError) {
        logger.error(
          "Error generating BFS baseline or version history",
          baselineError instanceof Error ? baselineError : new Error(String(baselineError)),
          { brandId, brandName }
        );
        // Non-critical, continue
      }
    } else {
      // @supabase-scope-ok INSERT includes brand id in payload
      // Create new brand (shouldn't happen in onboarding, but handle gracefully)
      const { error } = await supabase
        .from("brands")
        .insert({
          id: brandId,
          name: validatedGuide.brandName,
          brand_kit: brandKit,
          voice_summary: voiceSummary,
          visual_summary: visualSummary,
          tone_keywords: (validatedGuide as any).tone || validatedGuide.voiceAndTone?.tone || [],
        });

      if (error) {
        logger.error("Error creating brand from onboarding", new Error(error.message), {
          brandId,
          brandName,
          errorCode: error.code,
        });
        throw error;
      }

      // Generate BFS baseline for new Brand Guide
      try {
        const normalizedGuide = normalizeBrandGuide({
          id: brandId,
          brandId,
          name: brandGuide.brandName,
          brand_kit: brandKit,
          voice_summary: voiceSummary,
          visual_summary: visualSummary,
        } as any);

        const baseline = await generateBFSBaseline(normalizedGuide);
        // Update brand_kit with baseline
        const updatedBrandKit = {
          ...brandKit,
          performanceInsights: {
            ...brandKit.performanceInsights,
            bfsBaseline: baseline,
          },
        };
        // @supabase-scope-ok Brand lookup by its own primary key
        await supabase
          .from("brands")
          .update({ brand_kit: updatedBrandKit })
          .eq("id", brandId);

        // Create version history entry
        await createVersionHistory(brandId, normalizedGuide, null, undefined, "Initial creation");
      } catch (baselineError) {
        logger.error(
          "Error generating BFS baseline or version history",
          baselineError instanceof Error ? baselineError : new Error(String(baselineError)),
          { brandId, brandName }
        );
        // Non-critical, continue
      }
    }
  } catch (error) {
    logger.error(
      "Failed to save Brand Guide from onboarding",
      error instanceof Error ? error : new Error(String(error)),
      { brandId, brandName }
    );
    throw error;
  }
}

