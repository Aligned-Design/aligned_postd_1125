/**
 * Advisor Compliance Linter
 * 
 * Evaluates advisor insights for brand fidelity and compliance.
 */

import type { AdvisorInsight, BrandProfile, AdvisorComplianceFlags } from "@shared/advisor";

export interface ComplianceResult {
  brandFidelityScore: number; // 0-1
  compliance: AdvisorComplianceFlags;
}

/**
 * Calculate Brand Fidelity Score for advisor insights
 */
export function calculateAdvisorBFS(
  insights: AdvisorInsight[],
  brand: BrandProfile
): ComplianceResult {
  let totalScore = 0;
  const compliance: AdvisorComplianceFlags = {
    offBrand: false,
    bannedPhrases: [],
    missingDisclaimers: [],
  };

  if (insights.length === 0) {
    return {
      brandFidelityScore: 0,
      compliance,
    };
  }

  // Check each insight
  for (const insight of insights) {
    let insightScore = 1.0;

    // Check for banned phrases
    if (brand.forbiddenPhrases && brand.forbiddenPhrases.length > 0) {
      const foundPhrases: string[] = [];
      const combinedText = `${insight.title} ${insight.body}`.toLowerCase();
      
      for (const phrase of brand.forbiddenPhrases) {
        if (combinedText.includes(phrase.toLowerCase())) {
          foundPhrases.push(phrase);
          insightScore -= 0.3; // Heavy penalty for banned phrases
        }
      }
      
      if (foundPhrases.length > 0) {
        compliance.bannedPhrases = [
          ...(compliance.bannedPhrases || []),
          ...foundPhrases,
        ];
      }
    }

    // Check tone alignment (simple keyword matching)
    if (brand.allowedToneDescriptors && brand.allowedToneDescriptors.length > 0) {
      const combinedText = `${insight.title} ${insight.body}`.toLowerCase();
      const toneMatches = brand.allowedToneDescriptors.filter(tone =>
        combinedText.includes(tone.toLowerCase())
      );
      
      // If no tone matches found, apply small penalty
      if (toneMatches.length === 0 && brand.allowedToneDescriptors.length > 0) {
        insightScore -= 0.1;
      }
    }

    // Check for required disclaimers (if insight mentions financial/regulated content)
    if (brand.requiredDisclaimers && brand.requiredDisclaimers.length > 0) {
      const financialKeywords = ["roi", "return", "investment", "guarantee", "profit", "revenue", "earn", "money"];
      const combinedText = `${insight.title} ${insight.body}`.toLowerCase();
      const mentionsFinancial = financialKeywords.some(keyword => combinedText.includes(keyword));
      
      if (mentionsFinancial) {
        const missingDisclaimers: string[] = [];
        for (const disclaimer of brand.requiredDisclaimers) {
          if (!combinedText.includes(disclaimer.toLowerCase())) {
            missingDisclaimers.push(disclaimer);
          }
        }
        
        if (missingDisclaimers.length > 0) {
          compliance.missingDisclaimers = [
            ...(compliance.missingDisclaimers || []),
            ...missingDisclaimers,
          ];
          insightScore -= 0.2;
        }
      }
    }

    // Ensure score doesn't go below 0
    insightScore = Math.max(0, insightScore);
    totalScore += insightScore;
  }

  // Average score across all insights
  const brandFidelityScore = totalScore / insights.length;

  // Mark as off-brand if score is below threshold
  compliance.offBrand = brandFidelityScore < 0.8;

  return {
    brandFidelityScore,
    compliance,
  };
}

/**
 * Check if insights should trigger a retry
 */
export function shouldRetryAdvisor(complianceResult: ComplianceResult): boolean {
  return complianceResult.brandFidelityScore < 0.8;
}

