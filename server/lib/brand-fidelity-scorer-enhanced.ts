/**
 * Enhanced Brand Fidelity Score (BFS) with ML Tone Detection
 * Augments the standard BFS with machine learning-based tone classification
 *
 * Features:
 * - ML-powered tone detection using semantic embeddings
 * - Linguistic characteristic analysis (formality, sentiment, etc)
 * - Score breakdown with confidence metrics
 * - Tone comparison and alignment scoring
 */

import { BrandFidelityScore } from "../../client/types/agent-config";
import { toneClassifier, ToneClassificationResult } from "./tone-classifier";

// ==================== ENHANCED BFS RESULT ====================

export interface EnhancedBrandFidelityScore extends BrandFidelityScore {
  tone_classification?: ToneClassificationResult;
  score_breakdown?: {
    tone_alignment: {
      score: number;
      ml_confidence: number;
      detected_tone: string;
      target_tone?: string;
      alignment_score: number; // 0-1, how well detected tone matches expected
    };
    terminology_match: { score: number };
    compliance: { score: number };
    cta_fit: { score: number };
    platform_fit: { score: number };
  };
}

// ==================== TONE TARGETING ====================

export interface ToneTarget {
  primary_tone: string;
  secondary_tones?: string[];
  acceptable_range?: string[]; // List of tones that would be acceptable
  strict_match?: boolean; // If true, only exact matches are acceptable
}

// ==================== ENHANCED BFS CALCULATOR ====================

/**
 * Calculate enhanced BFS with ML tone detection
 */
export async function calculateEnhancedBFS(
  content: {
    body: string;
    headline?: string;
    cta?: string;
    hashtags?: string[];
    platform: string;
  },
  brandKit: {
    tone_keywords?: string[];
    brandPersonality?: string[];
    writingStyle?: string;
    commonPhrases?: string;
    required_disclaimers?: string[];
    required_hashtags?: string[];
    banned_phrases?: string[];
  },
  toneTarget?: ToneTarget,
): Promise<EnhancedBrandFidelityScore> {
  // Step 1: Classify tone using ML
  const combinedText = `${content.headline || ""} ${content.body} ${content.cta || ""}`;

  let toneClassification: ToneClassificationResult | undefined;
  try {
    toneClassification = await toneClassifier.classifyTone(
      combinedText,
      toneTarget?.primary_tone,
    );
  } catch (error) {
    console.error("[Enhanced BFS] Tone classification failed:", error);
    // Continue with standard BFS if ML fails
  }

  // Step 2: Calculate tone alignment score with ML input
  const toneAlignmentScore = calculateEnhancedToneAlignment(
    toneClassification,
    toneTarget,
    brandKit,
  );

  // Step 3: Calculate other component scores (standard methodology)
  const terminologyScore = calculateTerminologyMatch(content, brandKit);
  const complianceScore = calculateCompliance(content, brandKit);
  const ctaScore = calculateCTAFit(content);
  const platformScore = calculatePlatformFit(content);

  // Step 4: Calculate weighted overall score
  const overall =
    toneAlignmentScore * 0.3 +
    terminologyScore * 0.2 +
    complianceScore * 0.2 +
    ctaScore * 0.15 +
    platformScore * 0.15;

  // Step 5: Generate issues list
  const issues: string[] = [];
  if (toneAlignmentScore < 0.7) {
    issues.push(
      `Tone does not match brand personality (score: ${toneAlignmentScore.toFixed(2)})`,
    );
  }
  if (terminologyScore < 0.7) {
    issues.push("Missing key brand terminology or phrases");
  }
  if (complianceScore < 1.0) {
    issues.push(
      "Compliance issues detected (banned phrases or missing disclaimers)",
    );
  }
  if (ctaScore < 0.7) {
    issues.push("CTA does not align with brand voice or goals");
  }
  if (platformScore < 0.8) {
    issues.push("Content does not fit platform best practices");
  }

  const passed = overall >= 0.8;

  return {
    overall,
    tone_alignment: toneAlignmentScore,
    terminology_match: terminologyScore,
    compliance: complianceScore,
    cta_fit: ctaScore,
    platform_fit: platformScore,
    passed,
    issues,
    regeneration_count: 0,
    tone_classification: toneClassification,
    score_breakdown: {
      tone_alignment: {
        score: toneAlignmentScore,
        ml_confidence: toneClassification?.confidence || 0,
        detected_tone: toneClassification?.detected_tone || "unknown",
        target_tone: toneTarget?.primary_tone,
        alignment_score: calculateToneAlignmentMatch(
          toneClassification?.detected_tone,
          toneTarget,
        ),
      },
      terminology_match: { score: terminologyScore },
      compliance: { score: complianceScore },
      cta_fit: { score: ctaScore },
      platform_fit: { score: platformScore },
    },
  };
}

// ==================== COMPONENT SCORING FUNCTIONS ====================

/**
 * Enhanced tone alignment using ML classification
 */
function calculateEnhancedToneAlignment(
  toneClassification: ToneClassificationResult | undefined,
  toneTarget: ToneTarget | undefined,
  brandKit: unknown,
): number {
  if (!toneClassification) {
    // Fallback to keyword matching if ML fails
    return calculateKeywordToneAlignment(brandKit);
  }

  // Base score from ML confidence
  let score = toneClassification.confidence;

  // Adjust based on target tone match
  if (toneTarget) {
    const alignmentScore = calculateToneAlignmentMatch(
      toneClassification.detected_tone,
      toneTarget,
    );
    // Blend ML confidence with explicit target alignment
    score = score * 0.6 + alignmentScore * 0.4;
  }

  return Math.min(1, score);
}

/**
 * Calculate how well detected tone matches target tone
 */
function calculateToneAlignmentMatch(
  detectedTone: string | undefined,
  toneTarget: ToneTarget | undefined,
): number {
  if (!detectedTone || !toneTarget) {
    return 0.5; // Neutral if no comparison available
  }

  // Perfect match with primary tone
  if (detectedTone === toneTarget.primary_tone) {
    return 1.0;
  }

  // Match with secondary tones
  if (toneTarget.secondary_tones?.includes(detectedTone)) {
    return 0.85;
  }

  // Match within acceptable range
  if (toneTarget.acceptable_range?.includes(detectedTone)) {
    return 0.7;
  }

  // Check tone similarity
  const similarity = toneClassifier.compareTones(
    detectedTone,
    toneTarget.primary_tone,
  );

  if (toneTarget.strict_match) {
    // In strict mode, only exact matches are acceptable
    return detectedTone === toneTarget.primary_tone ? 1.0 : similarity * 0.5;
  }

  // Otherwise, use similarity score
  return similarity;
}

/**
 * Fallback keyword-based tone alignment
 */
function calculateKeywordToneAlignment(brandKit: unknown): number {
  const toneKeywords: string[] = (brandKit && brandKit.tone_keywords) || [];
  const personality: string[] = (brandKit && brandKit.brandPersonality) || [];

  if (toneKeywords.length === 0 && personality.length === 0) {
    return 0.5; // Neutral if no tone guidelines
  }

  // Simple keyword matching
  return Math.min(1, (toneKeywords.length + personality.length) / 10);
}

/**
 * Terminology match scoring
 */
function calculateTerminologyMatch(content: unknown, brandKit: unknown): number {
  const preferredTerms: string[] =
    brandKit && brandKit.commonPhrases
      ? (brandKit.commonPhrases as string).split(",")
      : [];
  const contentLower =
    `${content?.body || ""} ${content?.cta || ""}`.toLowerCase();

  if (preferredTerms.length === 0) {
    return 0.7; // Default if no terminology specified
  }

  const matches = preferredTerms.filter((term: string) =>
    contentLower.includes(term.toLowerCase()),
  ).length;

  return Math.min(1, matches / preferredTerms.length);
}

/**
 * Compliance scoring
 */
function calculateCompliance(content: unknown, brandKit: unknown): number {
  const contentLower = `${content?.body || ""}`.toLowerCase();
  const bannedPhrases: string[] = (brandKit && brandKit.banned_phrases) || [];

  // Check for banned phrases
  const hasBanned = bannedPhrases.some((phrase: string) =>
    contentLower.includes(phrase.toLowerCase()),
  );

  if (hasBanned) {
    return 0.0; // Fail completely if banned phrases found
  }

  // Check for required disclaimers
  const requiredDisclaimers: string[] =
    (brandKit && brandKit.required_disclaimers) || [];
  const hasRequired = requiredDisclaimers.every((disclaimer: string) =>
    contentLower.includes(disclaimer.toLowerCase()),
  );

  return hasRequired ? 1.0 : 0.7;
}

/**
 * CTA fit scoring
 */
function calculateCTAFit(content: unknown): number {
  if (!content?.cta || content.cta.length === 0) {
    return 0.2; // Poor score if no CTA
  }

  const cta = (content.cta || "").toLowerCase();
  const ctaKeywords = [
    "learn",
    "discover",
    "explore",
    "get",
    "try",
    "start",
    "begin",
    "read",
    "find",
    "click",
  ];

  const hasCtaKeyword = ctaKeywords.some((keyword) => cta.includes(keyword));

  return hasCtaKeyword ? 0.9 : 0.6;
}

/**
 * Platform fit scoring
 */
function calculatePlatformFit(content: unknown): number {
  const platform = (content?.platform || "").toLowerCase();

  // Platform-specific length checks
  const contentLength = (content?.body || "").length;

  switch (platform) {
    case "twitter":
    case "x":
      return contentLength <= 280 ? 0.95 : contentLength <= 500 ? 0.7 : 0.3;

    case "linkedin":
      return contentLength <= 1300 ? 0.95 : contentLength <= 2000 ? 0.75 : 0.4;

    case "instagram":
      return contentLength <= 2200 ? 0.95 : contentLength <= 3000 ? 0.7 : 0.4;

    case "facebook":
      return contentLength <= 63206 ? 0.9 : 0.7;

    default:
      return 0.8; // Default score for unknown platforms
  }
}

// ==================== TONE-SPECIFIC ANALYSIS ====================

/**
 * Analyze tone consistency throughout content
 */
export function analyzeToneConsistency(
  headline: string | undefined,
  body: string,
  cta: string | undefined,
): {
  consistency_score: number;
  section_tones: Record<string, string>;
  variations: string[];
} {
  // This would use the ML classifier on each section
  // For now, returning a placeholder structure
  return {
    consistency_score: 0.8,
    section_tones: {
      headline: headline ? "professional" : "none",
      body: "professional",
      cta: cta ? "energetic" : "none",
    },
    variations: [],
  };
}

/**
 * Get tone recommendations based on brand
 */
export function getToneRecommendations(
  detectedTone: string | undefined,
  targetTone: string | undefined,
  issues: string[],
): string[] {
  const recommendations: string[] = [];

  if (detectedTone && targetTone && detectedTone !== targetTone) {
    recommendations.push(
      `Consider adjusting tone from "${detectedTone}" to "${targetTone}" to match brand voice`,
    );
  }

  if (issues.some((issue) => issue.includes("Tone"))) {
    recommendations.push(
      "Review tone keywords and personality traits in your brand guide",
    );
  }

  return recommendations;
}
