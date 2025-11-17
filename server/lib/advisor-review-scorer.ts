/**
 * Advisor Review Scorer
 *
 * Calculates quality scores for Advisor reviews across 5 dimensions:
 * - Clarity (1-10): How clear and understandable is the feedback?
 * - Brand Alignment (1-10): How well does content align with brand values?
 * - Resonance (1-10): How likely is this to resonate with target audience?
 * - Actionability (1-10): How actionable and implementable are suggestions?
 * - Platform Fit (1-10): How well optimized is content for the platform?
 */

// Types defined locally to avoid circular dependencies

export interface ReviewScore {
  clarity: number; // 1-10: Clear, specific, well-articulated feedback
  brand_alignment: number; // 1-10: Alignment with brand voice/values
  resonance: number; // 1-10: Likelihood to resonate with audience
  actionability: number; // 1-10: Implementability of suggestions
  platform_fit: number; // 1-10: Platform-specific optimization
  average: number; // Unweighted average of all 5 dimensions
  weighted: number; // Weighted average (2x actionability, 1.5x alignment)
  timestamp: string;
}

export interface AdvisorReview {
  review_id: string;
  brand_id: string;
  content_id: string;
  platform: string;
  scores: ReviewScore;
  reflection_question: string;
  insights: string[];
  suggested_actions: SuggestedAction[];
  severity_level: "green" | "yellow" | "red"; // Based on weighted score
  created_at: string;
  request_id: string;
}

export interface SuggestedAction {
  type: "regenerate_caption" | "tighten_post_length" | "optimize_schedule" | "autofill_open_dates" | "queue_variant" | "request_brand_info" | "flag_reconnect" | "mark_for_review";
  label: string;
  description: string;
  estimated_impact: "high" | "medium" | "low";
  requires_user_input: boolean;
}

/**
 * Calculate comprehensive scores for a review
 */
export function calculateReviewScores(
  content: string,
  advisor_output: Record<string, unknown>,
  brand_kit: Record<string, unknown> | null,
  platform: string
): ReviewScore {
  // Calculate individual dimension scores
  const clarity = calculateClarity(advisor_output, content);
  const brand_alignment = calculateBrandAlignment(advisor_output, brand_kit, content);
  const resonance = calculateResonance(advisor_output, platform, content);
  const actionability = calculateActionability(advisor_output);
  const platform_fit = calculatePlatformFit(content, platform, advisor_output);

  // Calculate averages
  const average = (clarity + brand_alignment + resonance + actionability + platform_fit) / 5;

  // Weighted average: actionability is 2x important, alignment is 1.5x important
  const totalWeight = 1 + 1 + 1.5 + 2 + 1;
  const weighted =
    (clarity + brand_alignment * 1.5 + resonance + actionability * 2 + platform_fit) / totalWeight;

  return {
    clarity,
    brand_alignment,
    resonance,
    actionability,
    platform_fit,
    average,
    weighted,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Clarity (1-10): How clear and understandable is the feedback?
 * - Clear structure, specific examples, actionable points
 */
function calculateClarity(advisor_output: Record<string, unknown>, content: string): number {
  let score = 5; // Base score

  // Check for specific recommendations (not generic)
  const specificTerms = [
    "change",
    "update",
    "replace",
    "rewrite",
    "restructure",
    "add",
    "remove",
    "move",
  ];
  const feedback = (advisor_output.feedback as string) || "";
  const specificCount = specificTerms.filter((term) =>
    feedback.toLowerCase().includes(term)
  ).length;
  score += Math.min(specificCount, 3); // Max +3 for specificity

  // Check for structured insights (bullet points, numbered lists)
  const insights = (advisor_output.insights as unknown[]) || [];
  if (insights.length > 2) {
    score += 1;
  }

  // Check for actionable verbs in feedback
  const actionVerbs = ["should", "must", "consider", "try", "could", "would"];
  if (actionVerbs.some((verb) => feedback.toLowerCase().includes(verb))) {
    score += 1;
  }

  // Content not too short (substance check)
  if (content.length > 100) {
    score += 0.5;
  }

  return Math.min(10, Math.max(1, Math.round(score * 2) / 2)); // 0.5 increments, max 10
}

/**
 * Brand Alignment (1-10): How well does content align with brand values?
 * - Matches voice, respects safety guidelines, consistent with brand positioning
 */
function calculateBrandAlignment(
  advisor_output: Record<string, unknown>,
  brand_kit: Record<string, unknown> | null,
  content: string
): number {
  let score = 5; // Base score

  // If brand kit available, check alignment with brand voice
  if (brand_kit) {
    const voiceAttributes = (brand_kit.voice_attributes as Record<string, unknown>) || {};
    const voiceKeywords = [
      voiceAttributes.tone as string,
      voiceAttributes.style as string,
    ].filter(Boolean);

    if (voiceKeywords.length > 0) {
      const matchCount = voiceKeywords.filter((keyword) =>
        keyword && content.toLowerCase().includes(keyword.toLowerCase())
      ).length;
      score += Math.min(matchCount, 2); // Max +2 for voice match
    }
  }

  // Check for safety compliance mentions
  const feedback = (advisor_output.feedback as string) || "";
  if (feedback.toLowerCase().includes("brand") ||
      feedback.toLowerCase().includes("safe") ||
      feedback.toLowerCase().includes("comply")) {
    score += 1.5;
  }

  // Check if feedback respects brand constraints
  if (advisor_output.needs_review === false) {
    score += 1; // Content passed safety checks
  }

  // Quality of suggestions for brand consistency
  const insights = (advisor_output.insights as unknown[]) || [];
  if (insights.length > 0) {
    score += 0.5;
  }

  return Math.min(10, Math.max(1, Math.round(score * 2) / 2));
}

/**
 * Resonance (1-10): How likely is this to resonate with target audience?
 * - Emotionally engaging, relevant, authentic, compelling
 */
function calculateResonance(
  advisor_output: Record<string, unknown>,
  platform: string,
  content: string
): number {
  let score = 5; // Base score

  // Engagement-focused language check
  const engagementTerms = [
    "engage",
    "connect",
    "inspire",
    "motivate",
    "emotional",
    "story",
    "authentic",
  ];
  const feedback = (advisor_output.feedback as string) || "";
  const engagementScore = engagementTerms.filter((term) =>
    feedback.toLowerCase().includes(term)
  ).length;
  score += Math.min(engagementScore, 2); // Max +2 for engagement language

  // Platform-specific resonance
  if (platform === "tiktok" && feedback.toLowerCase().includes("trend")) {
    score += 1; // TikTok trending considerations
  } else if (platform === "linkedin" && feedback.toLowerCase().includes("professional")) {
    score += 1; // LinkedIn professional positioning
  } else if (platform === "instagram" && feedback.toLowerCase().includes("visual")) {
    score += 1; // Instagram visual appeal
  }

  // Audience-focused recommendations
  if (feedback.toLowerCase().includes("audience") ||
      feedback.toLowerCase().includes("target")) {
    score += 1.5;
  }

  // Content has emotional hooks or storytelling
  const emotionalKeywords = ["feel", "feel", "why", "because", "imagine", "picture"];
  if (emotionalKeywords.some((keyword) => content.toLowerCase().includes(keyword))) {
    score += 1;
  }

  return Math.min(10, Math.max(1, Math.round(score * 2) / 2));
}

/**
 * Actionability (1-10): How actionable and implementable are suggestions?
 * - Specific steps, realistic effort, clear outcomes, measurable results
 */
function calculateActionability(advisor_output: Record<string, unknown>): number {
  let score = 5; // Base score

  // Check for specific action items
  const suggestedActions = (advisor_output.suggested_actions as unknown[]) || [];
  if (suggestedActions.length > 0) {
    score += Math.min(suggestedActions.length, 3); // Max +3 for action count
  }

  // Check for measurable outcomes
  const measurableTerms = ["increase", "improve", "boost", "reduce", "%", "rate", "metric"];
  const feedback = (advisor_output.feedback as string) || "";
  const measurableCount = measurableTerms.filter((term) =>
    feedback.toLowerCase().includes(term)
  ).length;
  score += Math.min(measurableCount, 2); // Max +2 for measurable language

  // Effort estimation indicators (easier to implement = more actionable)
  const easyTerms = ["simple", "quick", "easy", "straightforward", "try"];
  const hardTerms = ["complex", "difficult", "requires", "major", "extensive"];
  const easyCount = easyTerms.filter((term) =>
    feedback.toLowerCase().includes(term)
  ).length;
  const hardCount = hardTerms.filter((term) =>
    feedback.toLowerCase().includes(term)
  ).length;
  score += easyCount - hardCount * 0.5;

  // Clear next steps
  if (feedback.toLowerCase().includes("next") ||
      feedback.toLowerCase().includes("then") ||
      feedback.toLowerCase().includes("after")) {
    score += 1;
  }

  return Math.min(10, Math.max(1, Math.round(score * 2) / 2));
}

/**
 * Platform Fit (1-10): How well optimized is content for the platform?
 * - Format appropriate, length optimized, features leveraged, timing considered
 */
function calculatePlatformFit(
  content: string,
  platform: string,
  advisor_output: Record<string, unknown>
): number {
  let score = 5; // Base score

  // Platform-specific length guidelines
  const contentLength = content.length;
  if (platform === "twitter" || platform === "x") {
    if (contentLength <= 280) score += 2;
    else if (contentLength <= 500) score += 1;
    else score -= 1;
  } else if (platform === "instagram") {
    if (contentLength <= 2200) score += 2; // Instagram caption limit
    else score -= 0.5;
  } else if (platform === "linkedin") {
    if (contentLength <= 3000) score += 2;
    else score -= 0.5;
  } else if (platform === "tiktok") {
    score += 1; // TikTok is video-first
  }

  // Check for platform-specific features mentioned
  const feedback = (advisor_output.feedback as string) || "";
  if (platform === "instagram" && feedback.toLowerCase().includes("#")) {
    score += 1; // Hashtag usage
  }
  if (platform === "linkedin" && feedback.toLowerCase().includes("professional")) {
    score += 1; // Professional tone
  }
  if (platform === "tiktok" && feedback.toLowerCase().includes("trend")) {
    score += 1; // Trend alignment
  }

  // Timing/posting optimization
  if (feedback.toLowerCase().includes("time") ||
      feedback.toLowerCase().includes("schedule") ||
      feedback.toLowerCase().includes("post")) {
    score += 1;
  }

  return Math.min(10, Math.max(1, Math.round(score * 2) / 2));
}

/**
 * Determine severity level based on weighted score
 */
export function getSeverityLevel(weighted_score: number): "green" | "yellow" | "red" {
  if (weighted_score >= 7.5) return "green"; // Ready to publish
  if (weighted_score >= 5.0) return "yellow"; // Needs review/revision
  return "red"; // Significant issues
}

/**
 * Get severity label
 */
export function getSeverityLabel(level: "green" | "yellow" | "red"): string {
  const labels = {
    green: "Ready to Publish",
    yellow: "Needs Revision",
    red: "Significant Issues",
  };
  return labels[level];
}
