/**
 * Onboarding Brand Sync
 * 
 * Helper functions to sync Brand Guide data from onboarding to Supabase.
 * Ensures onboarding and Brand Guide page use the same data source.
 */

import type { BrandGuide } from "@/types/brandGuide";

/**
 * Convert Brand Snapshot (onboarding format) to Brand Guide format
 * Uses the new nested Brand Guide structure to ensure alignment
 */
export function brandSnapshotToBrandGuide(
  brandSnapshot: any,
  brandId: string,
  brandName: string
): BrandGuide {
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

  // Infer voice levels from tone keywords if possible
  const tone = Array.isArray(brandSnapshot.tone) ? brandSnapshot.tone : [brandSnapshot.tone || "Professional"];
  const friendlinessLevel = inferFriendlinessLevel(tone);
  const formalityLevel = inferFormalityLevel(tone);
  const confidenceLevel = inferConfidenceLevel(tone);

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
      sampleHeadlines: brandSnapshot.extractedMetadata?.headlines || [],
    },

    // Voice & Tone
    voiceAndTone: {
      tone,
      friendlinessLevel,
      formalityLevel,
      confidenceLevel,
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
      logoUrl: brandSnapshot.logo || brandSnapshot.extractedMetadata?.images?.[0] || "",
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
      uploadedPhotos: (brandSnapshot.extractedMetadata?.images || []).map((url: string, idx: number) => ({
        id: `img-${idx}`,
        url,
        category: "website_scrape",
      })),
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

    // Legacy flat fields (for Creative Studio compatibility)
    primaryColor: brandSnapshot.colors?.[0],
    secondaryColor: brandSnapshot.colors?.[1],
    colorPalette: brandSnapshot.colors || [],
    secondaryColors: brandSnapshot.colors?.slice(1) || [],
    fontFamily: brandSnapshot.fontFamily || "",
    logoUrl: brandSnapshot.logo || "",
    tone: tone, // Legacy alias
    friendlinessLevel, // Legacy alias
    formalityLevel, // Legacy alias
    confidenceLevel, // Legacy alias
    primaryColors: brandSnapshot.colors || [], // Legacy alias
    guardrails: (brandSnapshot.extractedMetadata?.donts || []).map((dont: string, idx: number) => ({
      id: `guardrail-${idx}`,
      title: `Avoid: ${dont}`,
      description: dont,
      category: "messaging" as const,
      isActive: true,
    })), // Legacy alias
    voiceDescription: brandSnapshot.voice || "", // Legacy alias
    fontSource: "google", // Legacy alias
    visualNotes: brandSnapshot.visualNotes || "", // Legacy alias
    summaryReviewedByAI: true,
    aiToneSuggestions: [],
    completionPercentage: 0,

    // Metadata
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
    setupMethod: "ai_generated",
  };
}

/**
 * Infer friendliness level (0-100) from tone keywords
 */
function inferFriendlinessLevel(tone: string[]): number {
  const friendlyKeywords = ["friendly", "warm", "approachable", "welcoming", "casual", "conversational", "empathetic"];
  const unfriendlyKeywords = ["formal", "professional", "authoritative", "serious", "corporate"];
  
  const friendlyCount = tone.filter(t => friendlyKeywords.some(k => t.toLowerCase().includes(k))).length;
  const unfriendlyCount = tone.filter(t => unfriendlyKeywords.some(k => t.toLowerCase().includes(k))).length;
  
  if (friendlyCount > unfriendlyCount) return 70;
  if (unfriendlyCount > friendlyCount) return 30;
  return 50; // Default
}

/**
 * Infer formality level (0-100) from tone keywords
 */
function inferFormalityLevel(tone: string[]): number {
  const formalKeywords = ["formal", "professional", "corporate", "authoritative", "serious"];
  const casualKeywords = ["casual", "conversational", "friendly", "relaxed", "playful"];
  
  const formalCount = tone.filter(t => formalKeywords.some(k => t.toLowerCase().includes(k))).length;
  const casualCount = tone.filter(t => casualKeywords.some(k => t.toLowerCase().includes(k))).length;
  
  if (formalCount > casualCount) return 70;
  if (casualCount > formalCount) return 30;
  return 50; // Default
}

/**
 * Infer confidence level (0-100) from tone keywords
 */
function inferConfidenceLevel(tone: string[]): number {
  const confidentKeywords = ["confident", "bold", "authoritative", "assertive", "strong"];
  const tentativeKeywords = ["tentative", "humble", "modest", "gentle", "soft"];
  
  const confidentCount = tone.filter(t => confidentKeywords.some(k => t.toLowerCase().includes(k))).length;
  const tentativeCount = tone.filter(t => tentativeKeywords.some(k => t.toLowerCase().includes(k))).length;
  
  if (confidentCount > tentativeCount) return 75;
  if (tentativeCount > confidentCount) return 40;
  return 60; // Default (slightly confident)
}

/**
 * Save Brand Guide to Supabase from onboarding
 * Uses the new Brand Guide generation endpoint to ensure proper structure
 */
export async function saveBrandGuideFromOnboarding(
  brandId: string,
  brandSnapshot: any,
  brandName: string
): Promise<void> {
  try {
    // Convert to Brand Guide format
    const brandGuide = brandSnapshotToBrandGuide(brandSnapshot, brandId, brandName);

    // ✅ Use centralized API utility with auth headers
    // Use PUT to save the full brand guide
    const { apiPut } = await import("@/lib/api");
    
    console.log("[OnboardingBrandSync] Saving brand guide", {
      brandId,
      brandName,
      hasSnapshot: !!brandSnapshot,
    });
    
    const response = await apiPut(`/api/brand-guide/${brandId}`, brandGuide);

    console.log("[OnboardingBrandSync] Brand Guide saved to Supabase:", brandId);
  } catch (error) {
    console.error("[OnboardingBrandSync] Error saving Brand Guide:", error);
    // Don't throw - onboarding should continue even if save fails
  }
}

/**
 * Update Brand Guide from brand summary review edits
 */
export async function updateBrandGuideFromSummary(
  brandId: string,
  updates: Partial<BrandGuide>
): Promise<void> {
  try {
    const response = await fetch(`/api/brand-guide/${brandId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to update Brand Guide" }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    console.log("[OnboardingBrandSync] Brand Guide updated:", brandId);
  } catch (error) {
    console.error("[OnboardingBrandSync] Error updating Brand Guide:", error);
    // Don't throw - onboarding should continue
  }
}

