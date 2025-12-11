/**
 * Brand Fidelity Score (BFS) Calculator
 *
 * Evaluates AI-generated content against brand guidelines
 * Minimum score: 0.80 required to move to review
 *
 * Rubric (weighted):
 * - Tone alignment: 30%
 * - Terminology match: 20%
 * - Compliance: 20%
 * - CTA fit: 15%
 * - Platform fit: 15%
 */

import { BrandFidelityScore } from "../../client/types/agent-config";
import {
  DEFAULT_EMBEDDING_MODEL,
  generateEmbedding,
  isOpenAIConfigured,
} from "../lib/openai-client";

import type { BrandGuide } from "@shared/brand-guide";

// Support both BrandGuide and legacy BrandKit interface
type BrandKitInput = BrandGuide | {
  tone_keywords?: string[];
  brandPersonality?: string[];
  writingStyle?: string;
  commonPhrases?: string;
  required_disclaimers?: string[];
  required_hashtags?: string[];
  banned_phrases?: string[];
};

interface GeneratedContent {
  body: string;
  headline?: string;
  cta?: string;
  hashtags?: string[];
  platform: string;
}

/**
 * Calculate Brand Fidelity Score for generated content
 */
export async function calculateBFS(
  content: GeneratedContent,
  brandKit: BrandKitInput,
  brandEmbedding?: number[],
): Promise<BrandFidelityScore> {
  // Normalize BrandGuide to BrandKit format for scoring
  const normalizedKit = normalizeBrandKitForBFS(brandKit);
  const scores = {
    tone_alignment: 0,
    terminology_match: 0,
    compliance: 0,
    cta_fit: 0,
    platform_fit: 0,
  };

  const issues: string[] = [];
  const regeneration_count = 0;

  // 1. Tone Alignment (30% weight)
  scores.tone_alignment = await scoreToneAlignment(
    content,
    normalizedKit,
    brandEmbedding,
  );
  if (scores.tone_alignment < 0.7) {
    issues.push("Tone does not match brand personality");
  }

  // 2. Terminology Match (20% weight)
  scores.terminology_match = scoreTerminologyMatch(content, normalizedKit);
  if (scores.terminology_match < 0.7) {
    issues.push("Missing key brand terminology or phrases");
  }

  // 3. Compliance (20% weight)
  scores.compliance = scoreCompliance(content, normalizedKit);
  if (scores.compliance < 1.0) {
    issues.push(
      "Compliance issues detected (banned phrases or missing disclaimers)",
    );
  }

  // 4. CTA Fit (15% weight)
  scores.cta_fit = scoreCTAFit(content, normalizedKit);
  if (scores.cta_fit < 0.7) {
    issues.push("CTA does not align with brand voice or goals");
  }

  // 5. Platform Fit (15% weight)
  scores.platform_fit = scorePlatformFit(content);
  if (scores.platform_fit < 0.8) {
    issues.push("Content does not fit platform best practices");
  }

  // Calculate weighted overall score
  const overall =
    scores.tone_alignment * 0.3 +
    scores.terminology_match * 0.2 +
    scores.compliance * 0.2 +
    scores.cta_fit * 0.15 +
    scores.platform_fit * 0.15;

  const passed = overall >= 0.8;

  return {
    overall,
    tone_alignment: scores.tone_alignment,
    terminology_match: scores.terminology_match,
    compliance: scores.compliance,
    cta_fit: scores.cta_fit,
    platform_fit: scores.platform_fit,
    passed,
    issues,
    regeneration_count,
  };
}

/**
 * Normalize BrandGuide to BrandKit format for BFS calculation
 */
export function normalizeBrandKitForBFS(brandKit: BrandKitInput): {
  tone_keywords: string[];
  brandPersonality: string[];
  writingStyle: string;
  commonPhrases: string;
  required_disclaimers: string[];
  required_hashtags: string[];
  banned_phrases: string[];
} {
  // If it's already a legacy BrandKit, return as-is
  if (!("identity" in brandKit)) {
    return {
      tone_keywords: brandKit.tone_keywords || [],
      brandPersonality: brandKit.brandPersonality || [],
      writingStyle: brandKit.writingStyle || "",
      commonPhrases: brandKit.commonPhrases || "",
      required_disclaimers: brandKit.required_disclaimers || [],
      required_hashtags: brandKit.required_hashtags || [],
      banned_phrases: brandKit.banned_phrases || [],
    };
  }

  // Convert BrandGuide to BrandKit format
  const guide = brandKit as BrandGuide;
  return {
    tone_keywords: guide.voiceAndTone?.tone || [],
    brandPersonality: guide.identity?.values || [],
    writingStyle: guide.voiceAndTone?.voiceDescription || "",
    commonPhrases: guide.contentRules?.brandPhrases?.join(", ") || "",
    required_disclaimers: [], // Disclaimers extracted from brand guardrails if available
    required_hashtags: [], // Hashtags extracted from platform guidelines if available
    banned_phrases: guide.voiceAndTone?.avoidPhrases || [],
  };
}

/**
 * Score 1: Tone Alignment (30%)
 * Uses embedding similarity if available, otherwise keyword matching
 */
async function scoreToneAlignment(
  content: GeneratedContent,
  brandKit: ReturnType<typeof normalizeBrandKitForBFS>,
  brandEmbedding?: number[],
): Promise<number> {
  const combinedText = `${content.headline || ""} ${content.body} ${content.cta || ""}`;

  // If we have brand embedding, use semantic similarity
  if (brandEmbedding && isOpenAIConfigured()) {
    try {
      const contentEmbedding = await generateEmbedding(combinedText, {
        model: DEFAULT_EMBEDDING_MODEL,
      });

      const similarity = cosineSimilarity(brandEmbedding, contentEmbedding);

      // Map similarity (0-1) to score
      return similarity;
    } catch (error) {
      console.error(
        "Embedding similarity failed, falling back to keyword matching:",
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  // Fallback: Keyword matching
  const toneKeywords = brandKit.tone_keywords || [];
  const personality = brandKit.brandPersonality || [];
  const allKeywords = [...toneKeywords, ...personality].map((k) =>
    k.toLowerCase(),
  );

  if (allKeywords.length === 0) return 0.8; // No keywords defined, assume neutral

  const textLower = combinedText.toLowerCase();
  const matchCount = allKeywords.filter((keyword) =>
    textLower.includes(keyword),
  ).length;

  const matchRate = matchCount / Math.max(allKeywords.length, 1);

  // Normalize to 0-1 range
  return Math.min(matchRate * 2, 1.0);
}

/**
 * Score 2: Terminology Match (20%)
 * Checks for brand-specific phrases and vocabulary
 */
function scoreTerminologyMatch(
  content: GeneratedContent,
  brandKit: ReturnType<typeof normalizeBrandKitForBFS>,
): number {
  const combinedText = `${content.headline || ""} ${content.body} ${content.cta || ""}`;
  const textLower = combinedText.toLowerCase();

  let score = 0.5; // Base score

  // Check for common phrases
  if (brandKit.commonPhrases) {
    const phrases = brandKit.commonPhrases
      .split(",")
      .map((p) => p.trim().toLowerCase());
    const phrasesFound = phrases.filter((phrase) => textLower.includes(phrase));
    score += (phrasesFound.length / Math.max(phrases.length, 1)) * 0.3;
  }

  // Check writing style adherence
  if (brandKit.writingStyle) {
    const style = brandKit.writingStyle.toLowerCase();

    // Conversational: short sentences, contractions, questions
    if (style.includes("conversational")) {
      const hasContractions = /\b(don't|can't|won't|it's|you're|we're)\b/.test(
        textLower,
      );
      const hasQuestions = combinedText.includes("?");
      const avgSentenceLength =
        combinedText
          .split(/[.!?]/)
          .reduce((sum, s) => sum + s.trim().split(" ").length, 0) /
        Math.max(combinedText.split(/[.!?]/).length, 1);

      if (hasContractions) score += 0.1;
      if (hasQuestions) score += 0.05;
      if (avgSentenceLength < 20) score += 0.05;
    }

    // Formal: no contractions, longer sentences, professional tone
    if (style.includes("formal")) {
      const hasNoContractions =
        !/\b(don't|can't|won't|it's|you're|we're)\b/.test(textLower);
      const noProfanity = !/\b(damn|hell|crap)\b/.test(textLower);

      if (hasNoContractions) score += 0.1;
      if (noProfanity) score += 0.1;
    }
  }

  return Math.min(score, 1.0);
}

/**
 * Score 3: Compliance (20%)
 * Checks for banned phrases and required disclaimers
 */
function scoreCompliance(
  content: GeneratedContent,
  brandKit: ReturnType<typeof normalizeBrandKitForBFS>,
): number {
  const combinedText = `${content.headline || ""} ${content.body} ${content.cta || ""}`;
  const textLower = combinedText.toLowerCase();

  let violations = 0;
  let requirements = 0;
  let met = 0;

  // Check banned phrases
  const bannedPhrases = brandKit.banned_phrases || [];
  for (const phrase of bannedPhrases) {
    if (textLower.includes(phrase.toLowerCase())) {
      violations++;
    }
  }

  // Check required disclaimers
  const requiredDisclaimers = brandKit.required_disclaimers || [];
  requirements += requiredDisclaimers.length;
  for (const disclaimer of requiredDisclaimers) {
    if (combinedText.includes(disclaimer)) {
      met++;
    }
  }

  // Check required hashtags
  const requiredHashtags = brandKit.required_hashtags || [];
  requirements += requiredHashtags.length;
  const contentHashtags = content.hashtags || [];
  for (const hashtag of requiredHashtags) {
    if (contentHashtags.includes(hashtag)) {
      met++;
    }
  }

  // Hard fail if any banned phrases
  if (violations > 0) return 0.0;

  // Score based on requirements met
  if (requirements === 0) return 1.0; // No requirements

  const complianceRate = met / requirements;
  return complianceRate;
}

/**
 * Score 4: CTA Fit (15%)
 * Evaluates call-to-action quality and alignment
 */
function scoreCTAFit(content: GeneratedContent, brandKit: ReturnType<typeof normalizeBrandKitForBFS>): number {
  const cta = content.cta || "";

  if (!cta || cta.trim().length === 0) return 0.3; // Missing CTA

  let score = 0.5; // Base score for having a CTA

  // Check CTA clarity (action verbs)
  const actionVerbs = [
    "click",
    "visit",
    "learn",
    "discover",
    "explore",
    "get",
    "join",
    "start",
    "try",
    "shop",
    "book",
    "download",
    "subscribe",
    "follow",
    "share",
    "comment",
    "dm",
  ];
  const ctaLower = cta.toLowerCase();
  const hasActionVerb = actionVerbs.some((verb) => ctaLower.includes(verb));

  if (hasActionVerb) score += 0.3;

  // Check CTA brevity (under 10 words is ideal)
  const wordCount = cta.trim().split(/\s+/).length;
  if (wordCount <= 10) score += 0.1;

  // Check tone alignment with brand
  const toneKeywords = brandKit.tone_keywords || [];
  if (toneKeywords.length > 0) {
    const matchesFound = toneKeywords.filter((k) =>
      ctaLower.includes(k.toLowerCase()),
    );
    if (matchesFound.length > 0) score += 0.1;
  }

  return Math.min(score, 1.0);
}

/**
 * Score 5: Platform Fit (15%)
 * Checks if content fits platform best practices
 */
function scorePlatformFit(content: GeneratedContent): number {
  const platform = content.platform.toLowerCase();
  const bodyLength = content.body.length;
  const hashtagCount = content.hashtags?.length || 0;

  let score = 0.5; // Base score

  // Platform-specific scoring
  switch (platform) {
    case "instagram":
      // Instagram: 125-150 chars ideal, 5-10 hashtags
      if (bodyLength >= 125 && bodyLength <= 2200) score += 0.2;
      if (hashtagCount >= 5 && hashtagCount <= 10) score += 0.2;
      if (content.headline && content.headline.length <= 60) score += 0.1;
      break;

    case "linkedin":
      // LinkedIn: 150-300 chars for engagement, minimal hashtags
      if (bodyLength >= 150 && bodyLength <= 3000) score += 0.2;
      if (hashtagCount <= 5) score += 0.2;
      if (!content.body.match(/[!]{2,}/)) score += 0.1; // No excessive punctuation
      break;

    case "facebook":
      // Facebook: 80-120 chars ideal
      if (bodyLength >= 80 && bodyLength <= 300) score += 0.3;
      if (hashtagCount <= 3) score += 0.2;
      break;

    case "twitter":
      // Twitter: Under 280 chars, minimal hashtags
      if (bodyLength <= 280) score += 0.3;
      if (hashtagCount <= 2) score += 0.2;
      break;

    default:
      score += 0.2; // Unknown platform, give benefit of doubt
  }

  return Math.min(score, 1.0);
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error("Vectors must have same length");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] ** 2;
    normB += vecB[i] ** 2;
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);

  if (denominator === 0) return 0;

  return dotProduct / denominator;
}
