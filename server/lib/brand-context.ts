/**
 * Brand Context Service
 * 
 * Fetches brand context data from Supabase and maps it to BrandContext interface
 * for use in AI agents (Advisor, Doc, Design).
 */

import { supabase } from "./supabase";
import type { BrandContext } from "@shared/advisor";

interface BrandKitData {
  wordsToAvoid?: string;
  requiredDisclaimers?: string;
  toneKeywords?: string[];
  brandPersonality?: string[];
  primaryAudience?: string;
  writingStyle?: string;
  commonPhrases?: string;
}

interface VoiceSummaryData {
  tone?: string | string[];
  audience?: string;
  personality?: string[];
  writing_style?: string;
  avoid?: string[];
}

/**
 * Get brand context from database
 * 
 * Reads from the full Brand Guide structure (brand_kit, voice_summary, visual_summary)
 * to provide complete brand context for AI agents.
 */
export async function getBrandContext(brandId: string): Promise<BrandContext> {
  try {
    // Fetch brand data from Supabase (full Brand Guide structure)
    const { data: brand, error } = await supabase
      .from("brands")
      .select(
        "id, name, tone_keywords, compliance_rules, brand_kit, voice_summary, visual_summary"
      )
      .eq("id", brandId)
      .single();

    if (error) {
      console.error(`[BrandContext] Error fetching brand ${brandId}:`, error);
      // Return default context on error
      return getDefaultBrandContext();
    }

    if (!brand) {
      console.warn(`[BrandContext] Brand ${brandId} not found`);
      return getDefaultBrandContext();
    }

    // Extract data from Brand Guide JSONB fields
    const brandKit = (brand.brand_kit as any) || {};
    const voiceSummary = (brand.voice_summary as any) || {};
    const visualSummary = (brand.visual_summary as any) || {};

    // Map Brand Guide fields to BrandContext interface
    // Priority: voice_summary > brand_kit > tone_keywords (for backward compatibility)
    
    // Tone: from voice_summary.tone (array) or brand_kit.tone (array) or tone_keywords
    let tone: string;
    if (Array.isArray(voiceSummary.tone) && voiceSummary.tone.length > 0) {
      tone = voiceSummary.tone.join(", ");
    } else if (typeof voiceSummary.tone === "string") {
      tone = voiceSummary.tone;
    } else if (Array.isArray(brandKit.tone) && brandKit.tone.length > 0) {
      tone = brandKit.tone.join(", ");
    } else if (Array.isArray(brandKit.toneKeywords) && brandKit.toneKeywords.length > 0) {
      tone = brandKit.toneKeywords.join(", ");
    } else if (brand.tone_keywords && brand.tone_keywords.length > 0) {
      tone = brand.tone_keywords.join(", ");
    } else if (brandKit.writingStyle) {
      tone = brandKit.writingStyle;
    } else {
      tone = "professional";
    }

    // Values: from brand_kit.values (new field) or voice_summary.personality or brand_kit.brandPersonality
    let values: string[] = [];
    if (Array.isArray(brandKit.values) && brandKit.values.length > 0) {
      values = brandKit.values;
    } else if (Array.isArray(brandKit.coreValues) && brandKit.coreValues.length > 0) {
      values = brandKit.coreValues;
    } else if (Array.isArray(voiceSummary.personality) && voiceSummary.personality.length > 0) {
      values = voiceSummary.personality;
    } else if (typeof voiceSummary.personality === "string") {
      values = [voiceSummary.personality];
    } else if (Array.isArray(brandKit.brandPersonality) && brandKit.brandPersonality.length > 0) {
      values = brandKit.brandPersonality;
    }

    // Target Audience: from brand_kit.targetAudience (new field) or brand_kit.primaryAudience or voice_summary.audience
    const targetAudience = 
      brandKit.targetAudience ||
      brandKit.primaryAudience || 
      voiceSummary.audience || 
      "general";

    // Forbidden Phrases: from guardrails or brand_kit.wordsToAvoid
    let forbiddenPhrases: string[] = [];
    
    // Check guardrails first (from Brand Guide)
    if (Array.isArray(brandKit.guardrails)) {
      const toneGuardrails = brandKit.guardrails
        .filter((g: any) => g.category === "tone" || g.category === "messaging")
        .filter((g: any) => g.isActive)
        .map((g: any) => g.description || g.title)
        .filter(Boolean);
      forbiddenPhrases = [...forbiddenPhrases, ...toneGuardrails];
    }
    
    // Also check wordsToAvoid (legacy field)
    if (brandKit.wordsToAvoid) {
      const words = typeof brandKit.wordsToAvoid === "string"
        ? brandKit.wordsToAvoid.split(",").map((p: string) => p.trim()).filter(Boolean)
        : Array.isArray(brandKit.wordsToAvoid) ? brandKit.wordsToAvoid : [];
      forbiddenPhrases = [...forbiddenPhrases, ...words];
    }
    
    // Check voice_summary.avoid
    if (Array.isArray(voiceSummary.avoid)) {
      forbiddenPhrases = [...forbiddenPhrases, ...voiceSummary.avoid];
    }

    // Remove duplicates
    forbiddenPhrases = [...new Set(forbiddenPhrases)];

    // Required Disclaimers: from guardrails or brand_kit.requiredDisclaimers
    let requiredDisclaimers: string[] = [];
    
    // Check guardrails
    if (Array.isArray(brandKit.guardrails)) {
      const complianceGuardrails = brandKit.guardrails
        .filter((g: any) => g.category === "compliance" || g.title?.toLowerCase().includes("disclaimer"))
        .filter((g: any) => g.isActive)
        .map((g: any) => g.description || g.title)
        .filter(Boolean);
      requiredDisclaimers = [...requiredDisclaimers, ...complianceGuardrails];
    }
    
    // Also check requiredDisclaimers (legacy field)
    if (brandKit.requiredDisclaimers) {
      const disclaimers = typeof brandKit.requiredDisclaimers === "string"
        ? brandKit.requiredDisclaimers.split("\n").map((d: string) => d.trim()).filter(Boolean)
        : Array.isArray(brandKit.requiredDisclaimers) ? brandKit.requiredDisclaimers : [];
      requiredDisclaimers = [...requiredDisclaimers, ...disclaimers];
    }
    
    // Check compliance_rules
    if (brand.compliance_rules) {
      requiredDisclaimers.push(brand.compliance_rules);
    }

    // Remove duplicates
    requiredDisclaimers = [...new Set(requiredDisclaimers)];

    // Allowed Tone Descriptors: from voice_summary.tone or brand_kit.tone or tone_keywords
    let allowedToneDescriptors: string[] = [];
    if (Array.isArray(voiceSummary.tone) && voiceSummary.tone.length > 0) {
      allowedToneDescriptors = voiceSummary.tone;
    } else if (Array.isArray(brandKit.tone) && brandKit.tone.length > 0) {
      allowedToneDescriptors = brandKit.tone;
    } else if (Array.isArray(brandKit.toneKeywords) && brandKit.toneKeywords.length > 0) {
      allowedToneDescriptors = brandKit.toneKeywords;
    } else if (brand.tone_keywords && brand.tone_keywords.length > 0) {
      allowedToneDescriptors = brand.tone_keywords;
    } else {
      allowedToneDescriptors = ["professional", "helpful", "clear"];
    }

    const context: BrandContext = {
      name: brand.name || brandKit.brandName || "Brand",
      tone,
      values,
      targetAudience,
      forbiddenPhrases,
      requiredDisclaimers,
      allowedToneDescriptors,
    };

    return context;
  } catch (error) {
    console.error(`[BrandContext] Unexpected error fetching brand ${brandId}:`, error);
    return getDefaultBrandContext();
  }
}

/**
 * Get default brand context (fallback)
 */
function getDefaultBrandContext(): BrandContext {
  return {
    name: "Brand",
    tone: "professional",
    values: [],
    targetAudience: "general",
    forbiddenPhrases: ["guaranteed ROI", "100% success", "get rich quick"],
    requiredDisclaimers: [],
    allowedToneDescriptors: ["professional", "helpful", "clear"],
  };
}

// Note: Legacy getBrandProfile and BrandProfile have been removed
// Use getBrandContext and BrandContext directly

