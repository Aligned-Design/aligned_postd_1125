/**
 * Doc Agent Prompt Builder
 * 
 * Constructs prompts for the AI Doc Agent (copywriter) based on brand context and requirements.
 */

import type { BrandProfile } from "@shared/advisor";
import type { AiDocGenerationRequest } from "@shared/aiContent";
import type { StrategyBrief } from "@shared/collaboration-artifacts";
import type { BrandGuide } from "@shared/brand-guide";

export interface DocPromptContext {
  brand: BrandProfile;
  brandGuide?: BrandGuide | null;
  request: AiDocGenerationRequest;
  strategyBrief?: StrategyBrief | null;
  availableImages?: Array<{
    url: string;
    source: "brand_asset" | "stock_image" | "generic";
    title?: string;
    alt?: string;
  }>;
}

/**
 * Builds the system prompt for the doc agent
 */
export function buildDocSystemPrompt(): string {
  return `You are The Copywriter for Postd. Your role is to create on-brand, engaging content for various platforms and content types.

**CRITICAL**: You MUST load and obey the Brand Guide for this brand. The Brand Guide is the source of truth for brand voice, tone, writing rules, and content guardrails.

Guidelines:
- Stay strictly on-brand based on the Brand Guide (tone, voice, values, audience, industry keywords)
- NEVER use phrases listed in Brand Guide's avoidPhrases or contentRules.neverDo
- Respect Brand Guide's photographyStyle.mustInclude and mustAvoid rules (e.g., "poured coffee only, no espresso shots")
- Never use banned phrases or language that violates brand guidelines
- Include required disclaimers when discussing financial or regulated topics
- Do NOT invent fake metrics or make unsubstantiated claims (no "guaranteed results," "100% success," etc.)
- Create multiple distinct variants (typically 3) with different approaches
- Match the requested platform's best practices and character limits
- Respect the requested length (short/medium/long)
- Include the call-to-action if provided

Output format: Return content as a JSON array with this structure:
[
  {
    "label": "Option A",
    "content": "Full content text here...",
    "tone": "professional",
    "wordCount": 150
  },
  {
    "label": "Option B",
    "content": "Alternative approach...",
    "tone": "conversational",
    "wordCount": 145
  },
  {
    "label": "Option C",
    "content": "Third variant...",
    "tone": "friendly",
    "wordCount": 160
  }
]`;
}

/**
 * Builds the user prompt with brand and request context
 */
export function buildDocUserPrompt(context: DocPromptContext): string {
  const { brand, brandGuide, request, strategyBrief } = context;
  
  let prompt = `Create ${request.contentType} content for ${request.platform}.\n\n`;

  // ✅ BRAND GUIDE (Source of Truth) - Include first, as it's the primary authority
  if (brandGuide) {
    prompt += `## Brand Guide (Source of Truth)\n`;
    prompt += `Brand Name: ${brandGuide.brandName}\n`;
    
    if (brandGuide.identity) {
      prompt += `Business Type: ${brandGuide.identity.businessType || "Not specified"}\n`;
      if (brandGuide.identity.industryKeywords && brandGuide.identity.industryKeywords.length > 0) {
        prompt += `Industry Keywords: ${brandGuide.identity.industryKeywords.join(", ")}\n`;
      }
    }
    
    if (brandGuide.voiceAndTone) {
      prompt += `\n### Voice & Tone\n`;
      if (brandGuide.voiceAndTone.tone && brandGuide.voiceAndTone.tone.length > 0) {
        prompt += `Tone: ${brandGuide.voiceAndTone.tone.join(", ")}\n`;
      }
      if (brandGuide.voiceAndTone.voiceDescription) {
        prompt += `Voice Description: ${brandGuide.voiceAndTone.voiceDescription}\n`;
      }
      if (brandGuide.voiceAndTone.writingRules && brandGuide.voiceAndTone.writingRules.length > 0) {
        prompt += `Writing Rules: ${brandGuide.voiceAndTone.writingRules.join(", ")}\n`;
      }
      if (brandGuide.voiceAndTone.avoidPhrases && brandGuide.voiceAndTone.avoidPhrases.length > 0) {
        prompt += `FORBIDDEN PHRASES (DO NOT USE): ${brandGuide.voiceAndTone.avoidPhrases.join(", ")}\n`;
      }
    }
    
    if (brandGuide.visualIdentity?.photographyStyle) {
      prompt += `\n### Photography Style Rules\n`;
      if (brandGuide.visualIdentity.photographyStyle.mustInclude && brandGuide.visualIdentity.photographyStyle.mustInclude.length > 0) {
        prompt += `MUST INCLUDE: ${brandGuide.visualIdentity.photographyStyle.mustInclude.join(", ")}\n`;
      }
      if (brandGuide.visualIdentity.photographyStyle.mustAvoid && brandGuide.visualIdentity.photographyStyle.mustAvoid.length > 0) {
        prompt += `MUST AVOID: ${brandGuide.visualIdentity.photographyStyle.mustAvoid.join(", ")}\n`;
      }
    }
    
    if (brandGuide.contentRules) {
      prompt += `\n### Content Rules\n`;
      if (brandGuide.contentRules.neverDo && brandGuide.contentRules.neverDo.length > 0) {
        prompt += `NEVER DO: ${brandGuide.contentRules.neverDo.join(", ")}\n`;
      }
      if (brandGuide.contentRules.guardrails && brandGuide.contentRules.guardrails.length > 0) {
        const activeGuardrails = brandGuide.contentRules.guardrails.filter(g => g.isActive);
        if (activeGuardrails.length > 0) {
          prompt += `Active Guardrails: ${activeGuardrails.map(g => g.title).join(", ")}\n`;
        }
      }
    }
    prompt += `\n`;
  }

  // ✅ COLLABORATION: Include StrategyBrief if available
  if (strategyBrief) {
    prompt += `## Strategy Brief (from The Advisor)\n`;
    prompt += `Tagline: ${strategyBrief.positioning.tagline}\n`;
    prompt += `Mission: ${strategyBrief.positioning.missionStatement}\n`;
    prompt += `Target Audience: ${strategyBrief.positioning.targetAudience.demographics}\n`;
    if (strategyBrief.voice.keyMessages && strategyBrief.voice.keyMessages.length > 0) {
      prompt += `Key Messages: ${strategyBrief.voice.keyMessages.join(", ")}\n`;
    }
    prompt += `Tone: ${strategyBrief.voice.tone}\n`;
    if (strategyBrief.voice.avoidPhrases && strategyBrief.voice.avoidPhrases.length > 0) {
      prompt += `Avoid Phrases: ${strategyBrief.voice.avoidPhrases.join(", ")}\n`;
    }
    prompt += `\n`;
  }

  // Brand context (fallback if BrandGuide not available)
  if (!brandGuide) {
    prompt += `## Brand Profile\n`;
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
      prompt += `FORBIDDEN PHRASES (DO NOT USE): ${brand.forbiddenPhrases.join(", ")}\n`;
    }
    if (brand.requiredDisclaimers && brand.requiredDisclaimers.length > 0) {
      prompt += `Required Disclaimers (include if discussing financial topics): ${brand.requiredDisclaimers.join(", ")}\n`;
    }
  }

  // Request context
  prompt += `\n## Content Requirements\n`;
  prompt += `Topic: ${request.topic}\n`;
  prompt += `Platform: ${request.platform}\n`;
  prompt += `Content Type: ${request.contentType}\n`;
  if (request.tone) {
    prompt += `Requested Tone: ${request.tone}\n`;
  }
  if (request.length) {
    prompt += `Length: ${request.length}\n`;
    // Add character/word guidance
    if (request.length === "short") {
      prompt += `(Aim for 50-100 words for captions, 100-200 for emails)\n`;
    } else if (request.length === "medium") {
      prompt += `(Aim for 150-300 words)\n`;
    } else if (request.length === "long") {
      prompt += `(Aim for 400+ words for blogs, 300+ for detailed emails)\n`;
    }
  }
  if (request.callToAction) {
    prompt += `Call-to-Action: ${request.callToAction}\n`;
  }
  if (request.additionalContext) {
    prompt += `\nAdditional Context:\n${request.additionalContext}\n`;
  }

  // Image context (if available images are provided)
  if (context.availableImages && context.availableImages.length > 0) {
    prompt += `\n## Available Visual Assets\n`;
    const brandAssets = context.availableImages.filter(img => img.source === "brand_asset");
    const stockImages = context.availableImages.filter(img => img.source === "stock_image");
    
    if (brandAssets.length > 0) {
      prompt += `Brand-owned images available: ${brandAssets.length}\n`;
      brandAssets.slice(0, 3).forEach((img, idx) => {
        prompt += `- ${img.title || img.alt || `Image ${idx + 1}`}\n`;
      });
    }
    if (stockImages.length > 0) {
      prompt += `Approved stock images available: ${stockImages.length}\n`;
    }
    prompt += `When creating content, reference or align with these visual assets when relevant.\n`;
  }

  prompt += `\nGenerate 3 distinct variants that are on-brand, engaging, and appropriate for ${request.platform}.`;
  
  return prompt;
}

/**
 * Builds a retry prompt with stricter brand compliance emphasis
 */
export function buildDocRetryPrompt(context: DocPromptContext, previousContent: string): string {
  const basePrompt = buildDocUserPrompt(context);
  
  return `${basePrompt}

IMPORTANT: The previous response did not fully align with brand guidelines. Please review and regenerate content with STRICT adherence to:
- Brand tone: ${context.brand.tone || "professional"}
- FORBIDDEN phrases: ${context.brand.forbiddenPhrases?.join(", ") || "none specified"} - DO NOT USE THESE
- Required disclaimers: ${context.brand.requiredDisclaimers?.join(", ") || "none specified"}

Previous response (for reference only - regenerate completely):
${previousContent}

Generate new content variants that strictly comply with all brand guidelines.`;
}

