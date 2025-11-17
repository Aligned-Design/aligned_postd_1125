/**
 * Platform Template Validators
 *
 * Enforces platform-specific constraints for copy, media, and compliance.
 * Used by Copy Agent and Creative Agent to validate output before publishing.
 */

import type { ContentPackage } from "./collaboration-artifacts";

export interface ValidationResult {
  valid: boolean;
  platform: string;
  errors: Array<{
    field: string;
    message: string;
    severity: "error" | "warning";
    suggestedFix?: string;
  }>;
  warnings: string[];
  score: number; // 0-100 compliance score
}

interface PlatformTemplate {
  id: string;
  name: string;
  copy: Record<string, any>;
  media: Record<string, any>;
  compliance: Record<string, any>;
  timing: Record<string, any>;
}

const templates: Record<string, PlatformTemplate> = {
  instagram: {
    id: "instagram",
    name: "Instagram",
    copy: {
      headline: { maxLength: 150 },
      body: { maxLength: 2200 },
      callToAction: { maxLength: 50, required: true },
      hashtags: { minCount: 3, maxCount: 7 },
    },
    media: {
      allowedTypes: ["image", "video", "carousel"],
      preferredRatios: { feed_post: "1:1", reel: "9:16" },
    },
    compliance: {
      restrictions: [
        "No medical claims without FDA disclaimer",
        "No guaranteed results",
      ],
      linkHandling: "Link in bio",
    },
    timing: {
      optimalPostTime: "2-4 PM EST",
      recommendedFrequency: "5-7 posts per week",
    },
  },
  twitter: {
    id: "twitter",
    name: "X (Twitter)",
    copy: {
      headline: { maxLength: 280, required: true },
      body: { maxLength: 5600 },
      callToAction: { maxLength: 40 },
      hashtags: { maxCount: 2 },
      mentions: { maxCount: 3 },
    },
    media: {
      allowedTypes: ["image", "video", "gif"],
      preferredRatios: { tweet_image: "16:9" },
    },
    compliance: {
      restrictions: [
        "No violent or hateful content",
        "Avoid link-only tweets",
      ],
      requiredDisclosures: ["#ad if promotional"],
    },
    timing: {
      optimalPostTime: "9-11 AM EST",
      recommendedFrequency: "1-3 tweets per day",
    },
  },
  linkedin: {
    id: "linkedin",
    name: "LinkedIn",
    copy: {
      headline: { maxLength: 200, required: true },
      body: { maxLength: 3000, required: true },
      callToAction: { maxLength: 50 },
      hashtags: { maxCount: 5 },
      mentions: { maxCount: 3 },
    },
    media: {
      allowedTypes: ["image", "video", "document", "carousel"],
      preferredRatios: { post_image: "1.2:1", video: "16:9" },
    },
    compliance: {
      restrictions: [
        "Professional tone required",
        "Data/sources required for claims",
      ],
      requiredDisclosures: ["Sponsored label if paid"],
    },
    timing: {
      optimalPostTime: "8-10 AM EST Tuesday-Thursday",
      recommendedFrequency: "2-4 posts per week",
    },
  },
  email: {
    id: "email",
    name: "Email",
    copy: {
      subject: { maxLength: 60, required: true },
      preheader: { maxLength: 125 },
      headline: { maxLength: 100, required: true },
      body: { maxLength: 5000, required: true },
      callToAction: { maxLength: 50, required: true },
    },
    media: {
      allowedTypes: ["image", "gif"],
      maxFileSize: "2MB",
    },
    compliance: {
      restrictions: [
        "CAN-SPAM compliant",
        "Unsubscribe link required",
      ],
      requiredDisclosures: [
        "Company name and address",
        "Unsubscribe link",
      ],
    },
    timing: {
      optimalSendTime: "10 AM - 2 PM EST Tuesday-Thursday",
      recommendedFrequency: "Weekly to bi-weekly",
    },
  },
};

/**
 * Validate content package against platform template
 */
export function validateContentPackage(
  pkg: ContentPackage
): ValidationResult {
  const platform = pkg.platform.toLowerCase();
  const template = templates[platform];

  if (!template) {
    return {
      valid: false,
      platform,
      errors: [
        {
          field: "platform",
          message: `Platform '${platform}' not supported`,
          severity: "error",
        },
      ],
      warnings: [],
      score: 0,
    };
  }

  const errors: ValidationResult["errors"] = [];
  const warnings: string[] = [];
  let scorePoints = 100;

  // Validate copy
  const copyErrors = validateCopy(pkg.copy, template);
  errors.push(...copyErrors);
  scorePoints -= copyErrors.filter((e) => e.severity === "error").length * 10;
  warnings.push(
    ...copyErrors.filter((e) => e.severity === "warning").map((e) => e.message)
  );

  // Validate media if present
  if (pkg.designContext) {
    const mediaErrors = validateMedia(pkg.designContext, template);
    errors.push(...mediaErrors);
    scorePoints -= mediaErrors.filter((e) => e.severity === "error").length * 10;
    warnings.push(
      ...mediaErrors
        .filter((e) => e.severity === "warning")
        .map((e) => e.message)
    );
  }

  // Validate compliance
  const complianceErrors = validateCompliance(pkg.copy, template);
  errors.push(...complianceErrors);
  scorePoints -= complianceErrors.filter((e) => e.severity === "error")
    .length * 5;
  warnings.push(
    ...complianceErrors
      .filter((e) => e.severity === "warning")
      .map((e) => e.message)
  );

  const score = Math.max(0, scorePoints);
  const valid = errors.filter((e) => e.severity === "error").length === 0;

  return {
    valid,
    platform,
    errors,
    warnings,
    score,
  };
}

/**
 * Validate copy fields against template
 */
function validateCopy(
  copy: any,
  template: PlatformTemplate
): ValidationResult["errors"] {
  const errors: ValidationResult["errors"] = [];
  const copyTemplate = template.copy;

  // Validate headline
  if (copyTemplate.headline?.maxLength) {
    if (!copy.headline) {
      errors.push({
        field: "headline",
        message: "Headline is required",
        severity: "error",
      });
    } else if (copy.headline.length > copyTemplate.headline.maxLength) {
      errors.push({
        field: "headline",
        message: `Headline exceeds ${copyTemplate.headline.maxLength} characters (current: ${copy.headline.length})`,
        severity: "error",
        suggestedFix: `Trim to ${copyTemplate.headline.maxLength} chars: "${copy.headline.substring(0, copyTemplate.headline.maxLength)}..."`,
      });
    }
  }

  // Validate body
  if (copyTemplate.body?.maxLength) {
    if (!copy.body) {
      errors.push({
        field: "body",
        message: "Body text is required",
        severity: "error",
      });
    } else if (copy.body.length > copyTemplate.body.maxLength) {
      errors.push({
        field: "body",
        message: `Body exceeds ${copyTemplate.body.maxLength} characters (current: ${copy.body.length})`,
        severity: "error",
        suggestedFix: `Reduce to ${copyTemplate.body.maxLength} chars`,
      });
    }
  }

  // Validate CTA
  if (copyTemplate.callToAction?.required && !copy.callToAction) {
    errors.push({
      field: "callToAction",
      message: "Call-to-action is required",
      severity: "error",
    });
  } else if (
    copyTemplate.callToAction?.maxLength &&
    copy.callToAction?.length > copyTemplate.callToAction.maxLength
  ) {
    errors.push({
      field: "callToAction",
      message: `CTA exceeds ${copyTemplate.callToAction.maxLength} characters`,
      severity: "warning",
    });
  }

  // Validate hashtags
  if (copyTemplate.hashtags?.minCount && copy.keywords?.length) {
    const hashtagCount = copy.keywords.length;
    if (hashtagCount < copyTemplate.hashtags.minCount) {
      errors.push({
        field: "hashtags",
        message: `Minimum ${copyTemplate.hashtags.minCount} hashtags required (current: ${hashtagCount})`,
        severity: "warning",
        suggestedFix: `Add ${copyTemplate.hashtags.minCount - hashtagCount} more hashtags`,
      });
    }
    if (
      copyTemplate.hashtags.maxCount &&
      hashtagCount > copyTemplate.hashtags.maxCount
    ) {
      errors.push({
        field: "hashtags",
        message: `Maximum ${copyTemplate.hashtags.maxCount} hashtags (current: ${hashtagCount})`,
        severity: "warning",
        suggestedFix: `Remove ${hashtagCount - copyTemplate.hashtags.maxCount} hashtags`,
      });
    }
  }

  return errors;
}

/**
 * Validate media attributes against template
 */
function validateMedia(
  designContext: any,
  template: PlatformTemplate
): ValidationResult["errors"] {
  const errors: ValidationResult["errors"] = [];
  const mediaTemplate = template.media;

  // Validate layout is in allowed types
  if (mediaTemplate.allowedTypes && designContext.suggestedLayout) {
    const layoutType = designContext.suggestedLayout.toLowerCase();
    if (!mediaTemplate.allowedTypes.some((t: string) => layoutType.includes(t))) {
      errors.push({
        field: "media",
        message: `Layout type '${designContext.suggestedLayout}' not optimal for ${template.name}. Suggested: ${mediaTemplate.allowedTypes.join(", ")}`,
        severity: "warning",
      });
    }
  }

  // Check for accessibility notes
  if (
    !designContext.accessibilityNotes ||
    designContext.accessibilityNotes.length === 0
  ) {
    errors.push({
      field: "accessibility",
      message: "No accessibility notes provided",
      severity: "warning",
      suggestedFix: "Add semantic markup recommendations",
    });
  }

  return errors;
}

/**
 * Validate compliance rules
 */
function validateCompliance(
  copy: any,
  template: PlatformTemplate
): ValidationResult["errors"] {
  const errors: ValidationResult["errors"] = [];
  const body = (copy.body || "").toLowerCase();
  const headline = (copy.headline || "").toLowerCase();

  // Check for restricted phrases
  if (template.compliance.restrictions) {
    const restrictedPhrases = [
      "guaranteed",
      "medical",
      "cure",
      "proven to",
      "clinically proven",
    ];

    for (const phrase of restrictedPhrases) {
      if (body.includes(phrase) || headline.includes(phrase)) {
        errors.push({
          field: "compliance",
          message: `Restricted phrase detected: '${phrase}' - may violate platform policy`,
          severity: "warning",
          suggestedFix: `Replace '${phrase}' with softer language (e.g., 'may help', 'supports')`,
        });
      }
    }
  }

  // Check for required disclosures
  if (
    template.compliance.requiredDisclosures &&
    copy.keywords?.some((k: string) => k === "sponsored")
  ) {
    const hasAdLabel = body.includes("#ad") || headline.includes("#ad");
    if (!hasAdLabel) {
      errors.push({
        field: "compliance",
        message: "Sponsored content missing required '#ad' disclosure",
        severity: "error",
        suggestedFix: "Add '#ad' to headline or body text",
      });
    }
  }

  return errors;
}

/**
 * Get recommendations for platform optimization
 */
export function getPlatformRecommendations(platform: string): string[] {
  const template = templates[platform.toLowerCase()];
  if (!template) return [];

  const recommendations: string[] = [];

  // Copy recommendations
  if (template.copy.callToAction?.required) {
    recommendations.push(
      `Include clear CTA (max ${template.copy.callToAction.maxLength} chars)`
    );
  }

  // Timing recommendations
  if (template.timing.optimalPostTime) {
    recommendations.push(
      `Post during optimal window: ${template.timing.optimalPostTime}`
    );
  }
  if (template.timing.recommendedFrequency) {
    recommendations.push(
      `Maintain posting frequency: ${template.timing.recommendedFrequency}`
    );
  }

  // Media recommendations
  if (template.media.preferredRatios) {
    const ratios = Object.entries(template.media.preferredRatios)
      .map(([type, ratio]) => `${type}: ${ratio}`)
      .join("; ");
    recommendations.push(`Use optimal aspect ratios: ${ratios}`);
  }

  return recommendations;
}

/**
 * Check if content is valid for publishing on platform
 */
export function canPublish(validation: ValidationResult): boolean {
  const criticalErrors = validation.errors.filter(
    (e) => e.severity === "error"
  );
  return criticalErrors.length === 0 && validation.score >= 70;
}

/**
 * Get human-readable validation report
 */
export function getValidationReport(
  validation: ValidationResult
): string {
  let report = `\n📋 Platform Validation Report: ${validation.platform.toUpperCase()}\n`;
  report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  report += `Compliance Score: ${validation.score}/100\n`;
  report += `Status: ${validation.valid ? "✅ VALID" : "❌ INVALID"}\n`;
  report += `Can Publish: ${canPublish(validation) ? "✅ YES" : "❌ NO"}\n\n`;

  if (validation.errors.length > 0) {
    report += `⚠️  Issues Found: ${validation.errors.length}\n`;
    validation.errors.forEach((error) => {
      const icon = error.severity === "error" ? "❌" : "⚠️ ";
      report += `  ${icon} [${error.field}] ${error.message}\n`;
      if (error.suggestedFix) {
        report += `     💡 Suggested fix: ${error.suggestedFix}\n`;
      }
    });
  } else {
    report += `✅ No issues found\n`;
  }

  if (validation.warnings.length > 0) {
    report += `\n📌 Warnings:\n`;
    validation.warnings.forEach((warning) => {
      report += `  • ${warning}\n`;
    });
  }

  return report;
}
