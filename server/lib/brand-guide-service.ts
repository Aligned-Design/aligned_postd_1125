/**
 * Brand Guide Service
 *
 * Central service for loading and saving Brand Guide data.
 * The Brand Guide is the "source of truth" for each brand.
 */

import { supabase } from "./supabase";
import type { BrandGuide } from "@shared/brand-guide";
import { normalizeBrandGuide } from "@shared/brand-guide";

/**
 * Get current Brand Guide for a brand
 */
export async function getCurrentBrandGuide(brandId: string): Promise<BrandGuide | null> {
  try {
    const { data: brand, error } = await supabase
      .from("brands")
      .select("*")
      .eq("id", brandId)
      .single();

    if (error || !brand) {
      console.warn(`[BrandGuideService] Brand ${brandId} not found`);
      return null;
    }

    // Normalize to shared BrandGuide format
    return normalizeBrandGuide(brand);
  } catch (error) {
    console.error(`[BrandGuideService] Error fetching brand guide:`, error);
    return null;
  }
}

/**
 * Save Brand Guide to Supabase
 */
export async function saveBrandGuide(brandId: string, guide: Partial<BrandGuide>): Promise<void> {
  try {
    // Map BrandGuide to Supabase structure
    const brandKit: any = {
      brandName: guide.brandName,
      purpose: guide.purpose,
      mission: guide.mission,
      vision: guide.vision,
      businessType: guide.identity?.businessType,
      industry: guide.identity?.industry,
      keywords: guide.identity?.industryKeywords || [],
      industryKeywords: guide.identity?.industryKeywords || [],
      competitors: guide.identity?.competitors || [],
      sampleHeadlines: guide.identity?.sampleHeadlines || [],
      values: guide.identity?.values || [],
      coreValues: guide.identity?.values || [], // Legacy alias
      targetAudience: guide.identity?.targetAudience,
      primaryAudience: guide.identity?.targetAudience, // Legacy alias
      painPoints: guide.identity?.painPoints || [],
      toneKeywords: guide.voiceAndTone?.tone || [],
      friendlinessLevel: guide.voiceAndTone?.friendlinessLevel,
      formalityLevel: guide.voiceAndTone?.formalityLevel,
      confidenceLevel: guide.voiceAndTone?.confidenceLevel,
      voiceDescription: guide.voiceAndTone?.voiceDescription,
      writingRules: guide.voiceAndTone?.writingRules || [],
      wordsToAvoid: guide.voiceAndTone?.avoidPhrases || [],
      avoidPhrases: guide.voiceAndTone?.avoidPhrases || [],
      fontFamily: guide.visualIdentity?.typography?.heading,
      bodyFont: guide.visualIdentity?.typography?.body,
      fontSource: guide.visualIdentity?.typography?.source,
      customFontUrl: guide.visualIdentity?.typography?.customUrl,
      primaryColors: guide.visualIdentity?.colors || [],
      logoUrl: guide.visualIdentity?.logoUrl,
      photographyStyle: {
        mustInclude: guide.visualIdentity?.photographyStyle?.mustInclude || [],
        mustAvoid: guide.visualIdentity?.photographyStyle?.mustAvoid || [],
      },
      platformGuidelines: guide.contentRules?.platformGuidelines || {},
      preferredPlatforms: guide.contentRules?.preferredPlatforms || [],
      preferredPostTypes: guide.contentRules?.preferredPostTypes || [],
      brandPhrases: guide.contentRules?.brandPhrases || [],
      contentFormalityLevel: guide.contentRules?.formalityLevel, // String enum, different from voiceAndTone.formalityLevel (number)
      contentPillars: guide.contentRules?.contentPillars || [],
      messagingPillars: guide.contentRules?.contentPillars || [], // Legacy alias
      neverDo: guide.contentRules?.neverDo || [],
      guardrails: guide.contentRules?.guardrails || [],
      approvedAssets: guide.approvedAssets || {
        uploadedPhotos: [],
        uploadedGraphics: [],
        uploadedTemplates: [],
        approvedStockImages: [],
        productsServices: [],
      },
      personas: guide.personas || [],
      goals: guide.goals || [],
      performanceInsights: guide.performanceInsights || {
        visualPatterns: [],
        copyPatterns: [],
        bfsBaseline: guide.performanceInsights?.bfsBaseline,
      },
      version: guide.version || 1,
      setupMethod: guide.setupMethod || "detailed",
    };

    const voiceSummary: any = {
      tone: guide.voiceAndTone?.tone || [],
      friendlinessLevel: guide.voiceAndTone?.friendlinessLevel,
      formalityLevel: guide.voiceAndTone?.formalityLevel,
      confidenceLevel: guide.voiceAndTone?.confidenceLevel,
      voiceDescription: guide.voiceAndTone?.voiceDescription,
      writingRules: guide.voiceAndTone?.writingRules || [],
      avoid: guide.voiceAndTone?.avoidPhrases || [],
    };

    const visualSummary: any = {
      colors: guide.visualIdentity?.colors || [],
      fonts: [
        guide.visualIdentity?.typography?.heading,
        guide.visualIdentity?.typography?.body,
      ].filter(Boolean),
      photographyStyle: {
        mustInclude: guide.visualIdentity?.photographyStyle?.mustInclude || [],
        mustAvoid: guide.visualIdentity?.photographyStyle?.mustAvoid || [],
      },
      logo_urls: guide.visualIdentity?.logoUrl ? [guide.visualIdentity.logoUrl] : [],
      visualNotes: guide.visualIdentity?.visualNotes,
    };

    // ✅ ROOT FIX: Handle temporary brandIds during onboarding
    // Check if brand exists first
    const { data: existingBrand } = await supabase
      .from("brands")
      .select("id")
      .eq("id", brandId)
      .single();

    if (!existingBrand) {
      // Brand doesn't exist - this is a temporary brandId during onboarding
      // For now, we'll skip saving to database (brand guide will be saved when brand is created)
      // The brand guide data is still returned to the frontend
      console.log(`[BrandGuideService] Brand ${brandId} does not exist yet (onboarding). Brand guide will be saved when brand is created.`);
      return; // Skip save for temporary brandIds
    }

    // Brand exists - update it
    const { error } = await supabase
      .from("brands")
      .update({
        brand_kit: brandKit,
        voice_summary: voiceSummary,
        visual_summary: visualSummary,
        updated_at: new Date().toISOString(),
      })
      .eq("id", brandId);

    if (error) {
      throw new Error(`Failed to save brand guide: ${error.message}`);
    }

    console.log(`[BrandGuideService] Saved brand guide for ${brandId}`);
  } catch (error) {
    console.error(`[BrandGuideService] Error saving brand guide:`, error);
    throw error;
  }
}

