/**
 * Doc Agent Prompt Builder
 * 
 * Constructs prompts for the AI Doc Agent (copywriter) based on brand context and requirements.
 */

import type { BrandProfile } from "@shared/advisor";
import type { AiDocGenerationRequest } from "@shared/aiContent";
import type { StrategyBrief } from "@shared/collaboration-artifacts";
import type { BrandGuide } from "@shared/brand-guide";
import { buildFullBrandGuidePrompt } from "../prompts/brand-guide-prompts";

export interface DocPromptContext {
  brand: BrandProfile;
  brandGuide?: BrandGuide | null;
  request: AiDocGenerationRequest;
  strategyBrief?: StrategyBrief | null;
  availableImages?: Array<{
    url: string;
    source: "scrape" | "stock" | "upload" | "generic"; // ✅ Normalized to match image-sourcing.ts
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

## QUALITY REQUIREMENTS

All content MUST be:
1. **COMPLETE** - Full text, not outlines or placeholders
2. **READY TO POST** - No editing required, includes all elements
3. **PLATFORM-OPTIMIZED** - Follows platform best practices
4. **BRAND-AUTHENTIC** - Sounds like this specific brand
5. **INDUSTRY-APPROPRIATE** - Uses correct terminology for the industry

## OUTPUT FORMAT

Return content as a JSON array with exactly 3 variants:

[
  {
    "label": "Option A: [Brief descriptor]",
    "content": "Full content text here...",
    "tone": "professional|casual|friendly|bold",
    "wordCount": 150,
    "hashtags": ["#relevant", "#hashtags"],
    "cta": "Clear call-to-action",
    "rationale": "Why this approach works for this brand"
  },
  {
    "label": "Option B: [Different approach]",
    "content": "Alternative approach...",
    "tone": "conversational",
    "wordCount": 145,
    "hashtags": ["#different", "#angle"],
    "cta": "Different CTA approach",
    "rationale": "Alternative strategy explanation"
  },
  {
    "label": "Option C: [Third variant]",
    "content": "Third variant...",
    "tone": "friendly",
    "wordCount": 160,
    "hashtags": ["#third", "#option"],
    "cta": "Third CTA approach",
    "rationale": "Why this third option provides value"
  }
]

## PLATFORM-SPECIFIC REQUIREMENTS

### Instagram
- Include 5-10 relevant hashtags
- Use line breaks for readability
- Include emoji sparingly (1-2 max)
- CTA: "Learn more", "Visit link in bio", "Comment below"
- Length: 125-220 words

### LinkedIn
- Professional tone, industry insights
- Include 3-5 hashtags
- CTA: "Share your thoughts", "Connect with us", "Learn more"
- Length: 150-300 words

### Facebook
- Conversational, community-focused
- Include 3-7 hashtags
- CTA: "Join the conversation", "Share with friends", "Learn more"
- Length: 100-250 words

### Twitter/X
- Concise, punchy
- Include 1-3 hashtags
- CTA: "Read more", "Retweet if you agree", "Learn more"
- Length: 50-280 characters

### Blog Post
- Full article structure: title, intro, body (3-5 paragraphs), conclusion
- Include subheadings
- CTA at end: "Ready to get started?", "Contact us today", etc.
- Length: 500-800 words minimum

### Email
- Subject line (50 characters max)
- Greeting personalized to audience
- Body: 2-3 paragraphs
- Clear CTA button text
- Professional sign-off
- Length: 150-300 words

### Google Business Profile
- Local context (mention location if relevant)
- Business hours or services
- Clear CTA: "Call us", "Visit us", "Book now"
- Length: 100-200 words

## FORBIDDEN PRACTICES

❌ NEVER use placeholder text like "[Insert CTA here]"
❌ NEVER create outlines instead of full content
❌ NEVER use generic phrases from avoidPhrases list
❌ NEVER invent fake statistics or claims
❌ NEVER skip hashtags or CTAs
❌ NEVER create content that doesn't match the brand tone

## QUALITY CHECKLIST

Before returning content, verify:
- [ ] Content is complete and ready to post
- [ ] All required elements are included (hashtags, CTA, etc.)
- [ ] Tone matches brand guide
- [ ] Industry terminology is correct
- [ ] No forbidden phrases used
- [ ] Platform requirements met
- [ ] Word count appropriate for platform
- [ ] Content is engaging and valuable

If you cannot create high-quality content that meets all requirements, explain why and suggest an alternative approach.`;
}

/**
 * Builds the user prompt with brand and request context
 */
export function buildDocUserPrompt(context: DocPromptContext): string {
  const { brand, brandGuide, request, strategyBrief } = context;
  
  let prompt = `Create ${request.contentType} content for ${request.platform}.\n\n`;

  // ✅ BRAND GUIDE (Source of Truth) - Use centralized prompt library
  if (brandGuide) {
    prompt += buildFullBrandGuidePrompt(brandGuide);
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

  // Add example request section
  prompt += `\n## EXAMPLE REQUEST\n`;
  prompt += `If the request is: "Create a post about our new service"\n`;
  prompt += `Your response should be complete, ready-to-post content with:\n`;
  prompt += `- Engaging opening\n`;
  prompt += `- Clear value proposition\n`;
  prompt += `- Relevant hashtags\n`;
  prompt += `- Strong CTA\n`;
  prompt += `- Brand-appropriate tone\n\n`;

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
    const brandAssets = context.availableImages.filter(img => img.source === "scrape" || img.source === "upload");
    const stockImages = context.availableImages.filter(img => img.source === "stock");
    
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

