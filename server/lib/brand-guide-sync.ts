/**
 * Brand Guide Sync Service
 * 
 * Helper functions to sync Brand Guide data between onboarding and Brand Guide page.
 * Ensures all fields are properly saved to Supabase brands table.
 */

import { supabase } from "./supabase";
import type { BrandGuide } from "@shared/brand-guide"; // ✅ Fixed import path

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
      industryKeywords: brandSnapshot.extractedMetadata?.keywords || [],
      competitors: brandSnapshot.competitors || [],
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
      productsServices: [],
    },

    // Legacy fields (for backward compatibility)
    purpose: brandSnapshot.extractedMetadata?.brandIdentity || brandSnapshot.goal || "",
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

    // Map to Supabase structure using new BrandGuide format
    const brandKit: any = {
      brandName: brandGuide.brandName,
      purpose: brandGuide.purpose,
      mission: brandGuide.mission,
      vision: brandGuide.vision,
      businessType: brandGuide.identity?.businessType,
      keywords: brandGuide.identity?.industryKeywords || [],
      industryKeywords: brandGuide.identity?.industryKeywords || [],
      competitors: brandGuide.identity?.competitors || [],
      toneKeywords: brandGuide.voiceAndTone?.tone || [],
      friendlinessLevel: brandGuide.voiceAndTone?.friendlinessLevel,
      formalityLevel: brandGuide.voiceAndTone?.formalityLevel,
      confidenceLevel: brandGuide.voiceAndTone?.confidenceLevel,
      voiceDescription: brandGuide.voiceAndTone?.voiceDescription,
      writingRules: brandGuide.voiceAndTone?.writingRules || [],
      wordsToAvoid: brandGuide.voiceAndTone?.avoidPhrases || [],
      avoidPhrases: brandGuide.voiceAndTone?.avoidPhrases || [],
      fontFamily: brandGuide.visualIdentity?.typography?.heading,
      bodyFont: brandGuide.visualIdentity?.typography?.body,
      fontSource: brandGuide.visualIdentity?.typography?.source,
      customFontUrl: brandGuide.visualIdentity?.typography?.customUrl,
      primaryColors: brandGuide.visualIdentity?.colors || [],
      logoUrl: brandGuide.visualIdentity?.logoUrl,
      photographyStyle: {
        mustInclude: brandGuide.visualIdentity?.photographyStyle?.mustInclude || [],
        mustAvoid: brandGuide.visualIdentity?.photographyStyle?.mustAvoid || [],
      },
      platformGuidelines: brandGuide.contentRules?.platformGuidelines || {},
      preferredPlatforms: brandGuide.contentRules?.preferredPlatforms || [],
      preferredPostTypes: brandGuide.contentRules?.preferredPostTypes || [],
      brandPhrases: brandGuide.contentRules?.brandPhrases || [],
      contentFormalityLevel: brandGuide.contentRules?.formalityLevel, // ✅ Renamed to avoid duplicate with voiceAndTone.formalityLevel
      neverDo: brandGuide.contentRules?.neverDo || [],
      guardrails: brandGuide.contentRules?.guardrails || [],
      approvedAssets: brandGuide.approvedAssets || {
        uploadedPhotos: [],
        uploadedGraphics: [],
        uploadedTemplates: [],
        approvedStockImages: [],
        productsServices: [],
      },
      personas: brandGuide.personas || [],
      goals: brandGuide.goals || [],
      performanceInsights: brandGuide.performanceInsights || {},
      version: brandGuide.version || 1,
      setupMethod: brandGuide.setupMethod || "ai_generated",
      // Additional onboarding fields
      images: brandSnapshot.extractedMetadata?.images || [],
    };

    const voiceSummary: any = {
      tone: brandGuide.voiceAndTone?.tone || [],
      friendlinessLevel: brandGuide.voiceAndTone?.friendlinessLevel,
      formalityLevel: brandGuide.voiceAndTone?.formalityLevel,
      confidenceLevel: brandGuide.voiceAndTone?.confidenceLevel,
      voiceDescription: brandGuide.voiceAndTone?.voiceDescription,
      writingRules: brandGuide.voiceAndTone?.writingRules || [],
      avoid: brandGuide.voiceAndTone?.avoidPhrases || [],
      audience: brandSnapshot.audience || "",
    };

    const visualSummary: any = {
      colors: brandGuide.visualIdentity?.colors || [],
      fonts: [
        brandGuide.visualIdentity?.typography?.heading,
        brandGuide.visualIdentity?.typography?.body,
      ].filter(Boolean),
      photographyStyle: {
        mustInclude: brandGuide.visualIdentity?.photographyStyle?.mustInclude || [],
        mustAvoid: brandGuide.visualIdentity?.photographyStyle?.mustAvoid || [],
      },
      logo_urls: brandGuide.visualIdentity?.logoUrl ? [brandGuide.visualIdentity.logoUrl] : [],
      visualNotes: brandGuide.visualIdentity?.visualNotes,
      images: brandSnapshot.extractedMetadata?.images || [],
    };

    // Check if brand exists
    const { data: existingBrand } = await supabase
      .from("brands")
      .select("id")
      .eq("id", brandId)
      .single();

    if (existingBrand) {
      // Update existing brand
      const { error } = await supabase
        .from("brands")
        .update({
          name: brandGuide.brandName,
          brand_kit: brandKit,
          voice_summary: voiceSummary,
          visual_summary: visualSummary,
          tone_keywords: brandGuide.tone || [],
          updated_at: new Date().toISOString(),
        })
        .eq("id", brandId);

      if (error) {
        console.error("[BrandGuideSync] Error updating brand:", error);
        throw error;
      }
    } else {
      // Create new brand (shouldn't happen in onboarding, but handle gracefully)
      const { error } = await supabase
        .from("brands")
        .insert({
          id: brandId,
          name: brandGuide.brandName,
          brand_kit: brandKit,
          voice_summary: voiceSummary,
          visual_summary: visualSummary,
          tone_keywords: brandGuide.tone || [],
        });

      if (error) {
        console.error("[BrandGuideSync] Error creating brand:", error);
        throw error;
      }
    }
  } catch (error) {
    console.error("[BrandGuideSync] Failed to save Brand Guide from onboarding:", error);
    throw error;
  }
}

