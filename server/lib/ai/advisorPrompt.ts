/**
 * Advisor Prompt Builder
 * 
 * Constructs prompts for the AI Advisor agent based on brand context and analytics.
 */

import type { BrandContext, AdvisorRequest } from "@shared/advisor";
import type { BrandGuide } from "@shared/brand-guide";
import { buildFullBrandGuidePrompt, buildHostAwarePromptSection } from "../prompts/brand-guide-prompts";

export interface AdvisorPromptContext {
  brand: BrandContext;
  brandGuide?: BrandGuide | null;
  analytics?: AdvisorRequest["metrics"];
  timeRange?: string;
  /** MVP3: Host/CMS platform metadata for style inference */
  host?: {
    type: string;
    confidence?: string;
  };
}

/**
 * Builds the system prompt for the advisor agent
 */
export function buildAdvisorSystemPrompt(): string {
  return `You are The Advisor for Postd. Your role is to provide short, actionable insights to help users improve their content performance.

Guidelines:
- Provide concise, actionable insights (2-3 sentences max per insight)
- Base insights ONLY on the provided analytics data - do not hallucinate metrics
- Respect brand tone and constraints strictly
- Focus on practical recommendations users can implement immediately
- Use clear, professional language
- If data is insufficient, acknowledge limitations rather than making assumptions

Output format: Return insights as a JSON array with this structure:
[
  {
    "title": "Short, actionable title",
    "body": "2-3 sentence explanation with specific recommendations",
    "severity": "info" | "warning" | "critical",
    "category": "content" | "timing" | "channel" | "ads" | "engagement" | "other",
    "recommendedActions": ["action 1", "action 2"],
    "confidence": 0.85
  }
]`;
}

/**
 * Builds the user prompt with brand and analytics context
 */
export function buildAdvisorUserPrompt(context: AdvisorPromptContext): string {
  const { brand, brandGuide, analytics, timeRange, host } = context;
  
  let prompt = `Analyze the following brand and analytics data to generate marketing insights.\n\n`;

  // ✅ BRAND GUIDE (Source of Truth) - Use centralized prompt library
  if (brandGuide) {
    prompt += buildFullBrandGuidePrompt(brandGuide);
    prompt += `\n`;
  }

  // ✅ MVP3: Host-aware strategic context
  if (host?.type) {
    prompt += buildHostAwarePromptSection(host.type, "advisor");
  }

  // Brand context (fallback if BrandGuide not available)
  if (!brandGuide) {
    prompt += `## Brand Context\n`;
    prompt += `Name: ${brand.name}\n`;
    if (brand.tone) {
      prompt += `Tone: ${brand.tone}\n`;
    }
    if (brand.values && brand.values.length > 0) {
      prompt += `Values: ${brand.values.join(", ")}\n`;
    }
    if (brand.targetAudience) {
      prompt += `Target Audience: ${brand.targetAudience}\n`;
    }
    if (brand.allowedToneDescriptors && brand.allowedToneDescriptors.length > 0) {
      prompt += `Allowed Tone: ${brand.allowedToneDescriptors.join(", ")}\n`;
    }
    if (brand.forbiddenPhrases && brand.forbiddenPhrases.length > 0) {
      prompt += `Forbidden Phrases: ${brand.forbiddenPhrases.join(", ")}\n`;
    }
    if (brand.requiredDisclaimers && brand.requiredDisclaimers.length > 0) {
      prompt += `Required Disclaimers: ${brand.requiredDisclaimers.join(", ")}\n`;
    }
  }

  // Analytics context
  if (analytics) {
    prompt += `\n## Analytics Summary (${timeRange || "recent period"})\n`;
    
    if (analytics.recentAnalytics) {
      prompt += `Overall Performance:\n`;
      if (analytics.recentAnalytics.totalReach) {
        prompt += `- Total Reach: ${analytics.recentAnalytics.totalReach.toLocaleString()}\n`;
      }
      if (analytics.recentAnalytics.totalEngagement) {
        prompt += `- Total Engagement: ${analytics.recentAnalytics.totalEngagement.toLocaleString()}\n`;
      }
      if (analytics.recentAnalytics.avgEngagementRate) {
        prompt += `- Avg Engagement Rate: ${analytics.recentAnalytics.avgEngagementRate.toFixed(2)}%\n`;
      }
    }

    if (analytics.topPosts && analytics.topPosts.length > 0) {
      prompt += `\nTop Performing Posts:\n`;
      analytics.topPosts.slice(0, 5).forEach((post, idx) => {
        prompt += `${idx + 1}. ${post.title} (${post.platform}): ${post.engagement} engagements, ${post.reach.toLocaleString()} reach\n`;
      });
    }

    if (analytics.bestTimes && analytics.bestTimes.length > 0) {
      prompt += `\nBest Posting Times: ${analytics.bestTimes.join(", ")}\n`;
    }

    if (analytics.underperformingChannels && analytics.underperformingChannels.length > 0) {
      prompt += `\nUnderperforming Channels: ${analytics.underperformingChannels.join(", ")}\n`;
    }
  } else {
    prompt += `\n## Analytics Summary\n`;
    prompt += `Limited analytics data available. Provide general best practices that align with the brand context.\n`;
  }

  prompt += `\nGenerate 3-5 insights that are specific, actionable, and aligned with the brand guidelines above.`;
  
  return prompt;
}

/**
 * Builds a retry prompt with stricter brand compliance emphasis
 */
export function buildAdvisorRetryPrompt(context: AdvisorPromptContext, previousInsights: string): string {
  const basePrompt = buildAdvisorUserPrompt(context);
  
  return `${basePrompt}

IMPORTANT: The previous response did not fully align with brand guidelines. Please review and regenerate insights with STRICT adherence to:
- Brand tone: ${context.brand.tone || "professional"}
- Forbidden phrases: ${context.brand.forbiddenPhrases?.join(", ") || "none specified"}
- Required disclaimers: ${context.brand.requiredDisclaimers?.join(", ") || "none specified"}

Previous response (for reference only - regenerate completely):
${previousInsights}

Generate new insights that strictly comply with all brand guidelines.`;
}

