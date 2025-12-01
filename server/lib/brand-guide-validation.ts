/**
 * Brand Guide Validation
 * 
 * Validates Brand Guide data and provides fallback defaults for missing fields.
 */

import type { BrandGuide } from "@shared/brand-guide";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate Brand Guide has all required fields
 */
export function validateBrandGuide(brandGuide: BrandGuide | null): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!brandGuide) {
    return {
      isValid: false,
      errors: ["Brand Guide is null or undefined"],
      warnings: [],
    };
  }

  // Required: Identity
  if (!brandGuide.identity?.name) {
    errors.push("Identity name is required");
  }

  // Required: Voice & Tone
  if (!brandGuide.voiceAndTone?.tone || brandGuide.voiceAndTone.tone.length === 0) {
    warnings.push("No tone keywords defined. Defaulting to 'Professional'");
  }
  if (brandGuide.voiceAndTone.friendlinessLevel === undefined) {
    warnings.push("Friendliness level not set. Defaulting to 50");
  }
  if (brandGuide.voiceAndTone.formalityLevel === undefined) {
    warnings.push("Formality level not set. Defaulting to 50");
  }
  if (brandGuide.voiceAndTone.confidenceLevel === undefined) {
    warnings.push("Confidence level not set. Defaulting to 50");
  }

  // Required: Visual Identity
  if (!brandGuide.visualIdentity?.colors || brandGuide.visualIdentity.colors.length === 0) {
    warnings.push("No colors defined. Brand Guide may be incomplete.");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Apply fallback defaults to Brand Guide
 */
export function applyBrandGuideDefaults(brandGuide: Partial<BrandGuide>): BrandGuide {
  return {
    id: brandGuide.id || "unknown",
    brandId: brandGuide.brandId || brandGuide.id || "unknown",
    brandName: brandGuide.brandName || "Untitled Brand",
    
    identity: {
      name: brandGuide.identity?.name || brandGuide.brandName || "Untitled Brand",
      businessType: brandGuide.identity?.businessType,
      industry: brandGuide.identity?.industry,
      industryKeywords: brandGuide.identity?.industryKeywords || [],
      competitors: brandGuide.identity?.competitors || [],
      sampleHeadlines: brandGuide.identity?.sampleHeadlines || [],
      values: brandGuide.identity?.values || [],
      targetAudience: brandGuide.identity?.targetAudience,
      painPoints: brandGuide.identity?.painPoints || [],
    },

    voiceAndTone: {
      tone: brandGuide.voiceAndTone?.tone || ["Professional"],
      friendlinessLevel: brandGuide.voiceAndTone?.friendlinessLevel ?? 50,
      formalityLevel: brandGuide.voiceAndTone?.formalityLevel ?? 50,
      confidenceLevel: brandGuide.voiceAndTone?.confidenceLevel ?? 50,
      voiceDescription: brandGuide.voiceAndTone?.voiceDescription || "",
      writingRules: brandGuide.voiceAndTone?.writingRules || [],
      avoidPhrases: brandGuide.voiceAndTone?.avoidPhrases || [],
    },

    visualIdentity: {
      colors: brandGuide.visualIdentity?.colors || [],
      typography: {
        heading: brandGuide.visualIdentity?.typography?.heading || "Inter",
        body: brandGuide.visualIdentity?.typography?.body || "Inter",
        source: brandGuide.visualIdentity?.typography?.source || "google",
        customUrl: brandGuide.visualIdentity?.typography?.customUrl,
      },
      photographyStyle: {
        mustInclude: brandGuide.visualIdentity?.photographyStyle?.mustInclude || [],
        mustAvoid: brandGuide.visualIdentity?.photographyStyle?.mustAvoid || [],
      },
      logoUrl: brandGuide.visualIdentity?.logoUrl,
      visualNotes: brandGuide.visualIdentity?.visualNotes,
    },

    contentRules: {
      platformGuidelines: brandGuide.contentRules?.platformGuidelines || {},
      preferredPlatforms: brandGuide.contentRules?.preferredPlatforms || [],
      preferredPostTypes: brandGuide.contentRules?.preferredPostTypes || [],
      brandPhrases: brandGuide.contentRules?.brandPhrases || [],
      formalityLevel: brandGuide.contentRules?.formalityLevel,
      contentPillars: brandGuide.contentRules?.contentPillars || [],
      neverDo: brandGuide.contentRules?.neverDo || [],
      guardrails: brandGuide.contentRules?.guardrails || [],
    },

    approvedAssets: brandGuide.approvedAssets || {
      uploadedPhotos: [],
      uploadedGraphics: [],
      uploadedTemplates: [],
      approvedStockImages: [],
      productsServices: [],
    },

    performanceInsights: brandGuide.performanceInsights || {
      visualPatterns: [],
      copyPatterns: [],
    },

    personas: brandGuide.personas || [],
    goals: brandGuide.goals || [],
    purpose: brandGuide.purpose,
    mission: brandGuide.mission,
    vision: brandGuide.vision,

    createdAt: brandGuide.createdAt || new Date().toISOString(),
    updatedAt: brandGuide.updatedAt || new Date().toISOString(),
    version: brandGuide.version || 1,
    setupMethod: brandGuide.setupMethod || "detailed",
  };
}

