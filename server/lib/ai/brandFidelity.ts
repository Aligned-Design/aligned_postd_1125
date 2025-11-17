/**
 * Brand Fidelity Utilities
 * 
 * Shared utilities for calculating Brand Fidelity Score (BFS) and compliance tags
 * for any text content (advisor insights, doc content, design prompts, etc.).
 */

import type { BrandProfile } from "@shared/advisor";

export interface BrandFidelityResult {
  brandFidelityScore: number; // 0-1
  complianceTags: string[];
}

/**
 * Calculate Brand Fidelity Score for any text content
 */
export function calculateBrandFidelityScore(
  text: string,
  brand: BrandProfile
): BrandFidelityResult {
  let score = 1.0;
  const complianceTags: string[] = [];

  const lowerText = text.toLowerCase();

  // Check for banned phrases
  if (brand.forbiddenPhrases && brand.forbiddenPhrases.length > 0) {
    const foundPhrases: string[] = [];
    for (const phrase of brand.forbiddenPhrases) {
      if (lowerText.includes(phrase.toLowerCase())) {
        foundPhrases.push(phrase);
        score -= 0.3; // Heavy penalty for banned phrases
        complianceTags.push(`banned_phrase:${phrase}`);
      }
    }
    if (foundPhrases.length > 0) {
      complianceTags.push("contains_banned_phrases");
    }
  }

  // Check tone alignment
  if (brand.allowedToneDescriptors && brand.allowedToneDescriptors.length > 0) {
    const toneMatches = brand.allowedToneDescriptors.filter(tone =>
      lowerText.includes(tone.toLowerCase())
    );
    
    if (toneMatches.length === 0 && brand.allowedToneDescriptors.length > 0) {
      score -= 0.1;
      complianceTags.push("tone_mismatch");
    }
  }

  // Check for required disclaimers (if content mentions financial/regulated topics)
  if (brand.requiredDisclaimers && brand.requiredDisclaimers.length > 0) {
    const financialKeywords = ["roi", "return", "investment", "guarantee", "profit", "revenue", "earn", "money", "earnings", "income"];
    const mentionsFinancial = financialKeywords.some(keyword => lowerText.includes(keyword));
    
    if (mentionsFinancial) {
      const missingDisclaimers: string[] = [];
      for (const disclaimer of brand.requiredDisclaimers) {
        if (!lowerText.includes(disclaimer.toLowerCase())) {
          missingDisclaimers.push(disclaimer);
        }
      }
      
      if (missingDisclaimers.length > 0) {
        score -= 0.2;
        complianceTags.push("financial_disclaimer_missing");
        missingDisclaimers.forEach(d => complianceTags.push(`missing_disclaimer:${d}`));
      }
    }
  }

  // Check for overly promissory language
  const promissoryPhrases = ["guaranteed", "100%", "always works", "never fails", "guaranteed results"];
  const hasPromissory = promissoryPhrases.some(phrase => lowerText.includes(phrase));
  if (hasPromissory) {
    score -= 0.15;
    complianceTags.push("too_promissory");
  }

  // Ensure score doesn't go below 0
  score = Math.max(0, score);

  return {
    brandFidelityScore: score,
    complianceTags,
  };
}

/**
 * Get compliance tags for text content
 */
export function getComplianceTags(
  text: string,
  brand: BrandProfile
): string[] {
  const result = calculateBrandFidelityScore(text, brand);
  return result.complianceTags;
}

