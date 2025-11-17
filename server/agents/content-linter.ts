/**
 * Content Linter & Moderation Pipeline
 *
 * Runs pre/post-generation checks:
 * - Profanity/toxicity detection
 * - Banned phrases/claims
 * - Missing disclaimers/hashtags
 * - Platform limit violations
 * - PII detection
 * - Competitor mentions
 *
 * Auto-fixes where possible, blocks if unsafe
 */

import {
  LinterResult,
  PlatformViolation,
  BrandSafetyConfig,
  PLATFORM_LIMITS,
  COMPLIANCE_PACKS,
} from "../../client/types/agent-config";

interface ContentToLint {
  body: string;
  headline?: string;
  cta?: string;
  hashtags?: string[];
  platform: string;
}

/**
 * Run comprehensive linter checks on generated content
 */
export async function lintContent(
  content: ContentToLint,
  safetyConfig: BrandSafetyConfig,
): Promise<LinterResult> {
  const __issues: string[] = [];
  const fixes: string[] = [];

  // 1. Profanity & Toxicity Check
  const profanityDetected = checkProfanity(content);
  const toxicityScore = await checkToxicity(content);

  // 2. Banned Phrases Check
  const bannedPhrasesFound = checkBannedPhrases(content, safetyConfig);

  // 3. Banned Claims Check (compliance pack)
  const bannedClaimsFound = checkBannedClaims(content, safetyConfig);

  // 4. Required Disclaimers Check
  const missingDisclaimers = checkMissingDisclaimers(content, safetyConfig);

  // 5. Required Hashtags Check
  const missingHashtags = checkMissingHashtags(content, safetyConfig);

  // 6. Platform Limit Violations
  const platformViolations = checkPlatformLimits(content);

  // 7. PII Detection
  const piiDetected = detectPII(content);

  // 8. Competitor Mentions
  const competitorMentions = checkCompetitorMentions(content, safetyConfig);

  // Determine if content should be blocked
  const blocked =
    profanityDetected ||
    toxicityScore > 0.7 ||
    bannedPhrasesFound.length > 0 ||
    bannedClaimsFound.length > 0 ||
    piiDetected.length > 0;

  // Determine if needs human review
  const needsHumanReview =
    (missingDisclaimers.length > 0 &&
      safetyConfig.compliance_pack !== "none") ||
    competitorMentions.length > 0 ||
    toxicityScore > 0.5;

  const passed = !blocked && !needsHumanReview;

  return {
    passed,
    profanity_detected: profanityDetected,
    toxicity_score: toxicityScore,
    banned_phrases_found: bannedPhrasesFound,
    banned_claims_found: bannedClaimsFound,
    missing_disclaimers: missingDisclaimers,
    missing_hashtags: missingHashtags,
    platform_violations: platformViolations,
    pii_detected: piiDetected,
    competitor_mentions: competitorMentions,
    fixes_applied: fixes,
    blocked,
    needs_human_review: needsHumanReview,
  };
}

/**
 * Check for profanity/explicit language
 */
function checkProfanity(content: ContentToLint): boolean {
  const combinedText =
    `${content.headline || ""} ${content.body} ${content.cta || ""}`.toLowerCase();

  // Basic profanity list (expand as needed)
  const profanityList = [
    "fuck",
    "shit",
    "damn",
    "bitch",
    "ass",
    "bastard",
    "crap",
    "piss",
    "cock",
    "dick",
    "pussy",
    "cunt",
    "whore",
    "slut",
  ];

  return profanityList.some((word) => {
    const regex = new RegExp(`\\b${word}\\b`, "i");
    return regex.test(combinedText);
  });
}

/**
 * Check toxicity score using simple heuristics
 * (In production, use Perspective API or similar)
 */
async function checkToxicity(content: ContentToLint): Promise<number> {
  const combinedText =
    `${content.headline || ""} ${content.body} ${content.cta || ""}`.toLowerCase();

  // Toxic keywords (simplified - use ML model in production)
  const toxicKeywords = [
    "hate",
    "kill",
    "die",
    "stupid",
    "idiot",
    "moron",
    "loser",
    "ugly",
    "attack",
    "destroy",
    "terrible",
    "awful",
    "sucks",
    "worst",
    "pathetic",
  ];

  const matches = toxicKeywords.filter((keyword) =>
    combinedText.includes(keyword),
  );

  // Simple scoring: count / total keywords
  const score = Math.min(matches.length / 10, 1.0);

  return score;
}

/**
 * Check for banned phrases specific to brand
 */
function checkBannedPhrases(
  content: ContentToLint,
  safetyConfig: BrandSafetyConfig,
): string[] {
  const combinedText =
    `${content.headline || ""} ${content.body} ${content.cta || ""}`.toLowerCase();
  const found: string[] = [];

  for (const phrase of safetyConfig.banned_phrases) {
    if (combinedText.includes(phrase.toLowerCase())) {
      found.push(phrase);
    }
  }

  return found;
}

/**
 * Check for banned claims based on compliance pack
 */
function checkBannedClaims(
  content: ContentToLint,
  safetyConfig: BrandSafetyConfig,
): string[] {
  const combinedText =
    `${content.headline || ""} ${content.body} ${content.cta || ""}`.toLowerCase();
  const found: string[] = [];

  // Get compliance pack rules
  const compliancePack = COMPLIANCE_PACKS[safetyConfig.compliance_pack];
  if (!compliancePack) return found;

  // Check against banned claims
  for (const claim of compliancePack.banned_claims) {
    if (combinedText.includes(claim.toLowerCase())) {
      found.push(claim);
    }
  }

  // Also check custom claims from safety config
  for (const claim of safetyConfig.claims) {
    if (combinedText.includes(claim.toLowerCase())) {
      found.push(claim);
    }
  }

  return found;
}

/**
 * Check for missing required disclaimers
 */
function checkMissingDisclaimers(
  content: ContentToLint,
  safetyConfig: BrandSafetyConfig,
): string[] {
  const combinedText = `${content.headline || ""} ${content.body} ${content.cta || ""}`;
  const missing: string[] = [];

  // Check brand-specific required disclaimers
  for (const disclaimer of safetyConfig.required_disclaimers) {
    if (!combinedText.includes(disclaimer)) {
      missing.push(disclaimer);
    }
  }

  // Check compliance pack disclaimers
  const compliancePack = COMPLIANCE_PACKS[safetyConfig.compliance_pack];
  if (compliancePack) {
    // Only require if content contains review keywords
    const containsReviewKeyword = compliancePack.review_keywords.some(
      (keyword) => combinedText.toLowerCase().includes(keyword.toLowerCase()),
    );

    if (containsReviewKeyword) {
      for (const disclaimer of compliancePack.required_disclaimers) {
        if (!combinedText.includes(disclaimer)) {
          missing.push(disclaimer);
        }
      }
    }
  }

  return missing;
}

/**
 * Check for missing required hashtags
 */
function checkMissingHashtags(
  content: ContentToLint,
  safetyConfig: BrandSafetyConfig,
): string[] {
  const contentHashtags = content.hashtags || [];
  const missing: string[] = [];

  for (const requiredHashtag of safetyConfig.required_hashtags) {
    if (!contentHashtags.includes(requiredHashtag)) {
      missing.push(requiredHashtag);
    }
  }

  return missing;
}

/**
 * Check platform-specific limits
 */
function checkPlatformLimits(content: ContentToLint): PlatformViolation[] {
  const violations: PlatformViolation[] = [];
  const platform = content.platform.toLowerCase();
  const limits = PLATFORM_LIMITS[platform as keyof typeof PLATFORM_LIMITS];

  if (!limits) return violations;

  const bodyLength = content.body.length;
  const hashtagCount = content.hashtags?.length || 0;

  // Check character limits
  if ("caption" in limits && bodyLength > limits.caption) {
    violations.push({
      platform,
      issue: "char_limit",
      current: bodyLength,
      limit: limits.caption,
      suggestion: `Shorten to ${limits.caption} characters`,
    });
  }

  if ("post" in limits && bodyLength > limits.post) {
    violations.push({
      platform,
      issue: "char_limit",
      current: bodyLength,
      limit: limits.post,
      suggestion: `Shorten to ${limits.post} characters`,
    });
  }

  // Check hashtag limits
  if ("hashtags" in limits && hashtagCount > limits.hashtags) {
    violations.push({
      platform,
      issue: "hashtag_limit",
      current: hashtagCount,
      limit: limits.hashtags,
      suggestion: `Remove ${hashtagCount - limits.hashtags} hashtags`,
    });
  }

  return violations;
}

/**
 * Detect PII (emails, phone numbers)
 */
function detectPII(content: ContentToLint): string[] {
  const combinedText = `${content.headline || ""} ${content.body} ${content.cta || ""}`;
  const detected: string[] = [];

  // Email regex
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const emails = combinedText.match(emailRegex);
  if (emails) {
    detected.push(...emails);
  }

  // Phone regex (simple US format)
  const phoneRegex = /\b(\+?1[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}\b/g;
  const phones = combinedText.match(phoneRegex);
  if (phones) {
    detected.push(...phones);
  }

  return detected;
}

/**
 * Check for competitor mentions
 */
function checkCompetitorMentions(
  content: ContentToLint,
  safetyConfig: BrandSafetyConfig,
): string[] {
  const combinedText =
    `${content.headline || ""} ${content.body} ${content.cta || ""}`.toLowerCase();
  const found: string[] = [];

  for (const competitor of safetyConfig.competitor_names) {
    if (combinedText.includes(competitor.toLowerCase())) {
      found.push(competitor);
    }
  }

  return found;
}

/**
 * Auto-fix content issues where possible
 */
export function autoFixContent(
  content: ContentToLint,
  linterResult: LinterResult,
  safetyConfig: BrandSafetyConfig,
): { content: ContentToLint; fixes: string[] } {
  const fixedContent = { ...content };
  const fixes: string[] = [];

  // Auto-insert missing disclaimers
  if (linterResult.missing_disclaimers.length > 0) {
    const disclaimers = linterResult.missing_disclaimers.join(" ");
    fixedContent.body = `${fixedContent.body}\n\n${disclaimers}`;
    fixes.push(
      `Auto-inserted ${linterResult.missing_disclaimers.length} disclaimer(s)`,
    );
  }

  // Auto-insert missing hashtags
  if (linterResult.missing_hashtags.length > 0) {
    fixedContent.hashtags = [
      ...(fixedContent.hashtags || []),
      ...linterResult.missing_hashtags,
    ];
    fixes.push(
      `Auto-inserted ${linterResult.missing_hashtags.length} required hashtag(s)`,
    );
  }

  // Auto-shorten if over platform limits
  if (linterResult.platform_violations.length > 0) {
    for (const violation of linterResult.platform_violations) {
      if (violation.issue === "char_limit") {
        const maxLength = violation.limit - 50; // Leave room for disclaimers
        if (fixedContent.body.length > maxLength) {
          fixedContent.body = fixedContent.body.substring(0, maxLength) + "...";
          fixes.push(`Auto-shortened to ${maxLength} characters`);
        }
      }

      if (violation.issue === "hashtag_limit") {
        const toRemove = violation.current - violation.limit;
        fixedContent.hashtags = fixedContent.hashtags?.slice(
          0,
          violation.limit,
        );
        fixes.push(`Removed ${toRemove} excess hashtag(s)`);
      }
    }
  }

  // Strip PII if detected
  if (linterResult.pii_detected.length > 0) {
    for (const pii of linterResult.pii_detected) {
      fixedContent.body = fixedContent.body.replace(pii, "[REDACTED]");
      if (fixedContent.headline) {
        fixedContent.headline = fixedContent.headline.replace(
          pii,
          "[REDACTED]",
        );
      }
      if (fixedContent.cta) {
        fixedContent.cta = fixedContent.cta.replace(pii, "[REDACTED]");
      }
    }
    fixes.push(`Removed ${linterResult.pii_detected.length} PII instance(s)`);
  }

  return { content: fixedContent, fixes };
}
