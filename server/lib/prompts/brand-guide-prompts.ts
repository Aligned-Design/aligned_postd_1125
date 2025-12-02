/**
 * Centralized Brand Guide Prompt Library
 * 
 * All AI agents must use these functions to build prompts from Brand Guide data.
 * This ensures consistent Brand Guide usage across all agents.
 */

import type { BrandGuide } from "@shared/brand-guide";

/**
 * Extract all Brand Guide data into a structured context object
 */
export function buildBrandGuideContext(brandGuide: BrandGuide | null): {
  identity: string;
  voiceTone: string;
  visualIdentity: string;
  contentRules: string;
  full: string;
} {
  if (!brandGuide) {
    return {
      identity: "No Brand Guide available.",
      voiceTone: "No Brand Guide available.",
      visualIdentity: "No Brand Guide available.",
      contentRules: "No Brand Guide available.",
      full: "No Brand Guide available.",
    };
  }

  const identity = buildIdentityPrompt(brandGuide);
  const voiceTone = buildVoiceTonePrompt(brandGuide);
  const visualIdentity = buildVisualIdentityPrompt(brandGuide);
  const contentRules = buildContentRulesPrompt(brandGuide);
  const full = buildFullBrandGuidePrompt(brandGuide);

  return {
    identity,
    voiceTone,
    visualIdentity,
    contentRules,
    full,
  };
}

/**
 * Build Identity section prompt
 */
export function buildIdentityPrompt(brandGuide: BrandGuide): string {
  const { identity, purpose, mission, vision } = brandGuide;

  let prompt = `## BRAND IDENTITY\n\n`;
  prompt += `Brand Name: ${brandGuide.brandName}\n`;

  if (purpose) {
    prompt += `Purpose: ${purpose}\n`;
  }
  if (mission) {
    prompt += `Mission: ${mission}\n`;
  }
  if (vision) {
    prompt += `Vision: ${vision}\n`;
  }

  if (identity.businessType) {
    prompt += `Business Type: ${identity.businessType}\n`;
  }
  if (identity.industry) {
    prompt += `Industry: ${identity.industry}\n`;
  }
  if (identity.industryKeywords && identity.industryKeywords.length > 0) {
    prompt += `Industry Keywords: ${identity.industryKeywords.join(", ")}\n`;
  }
  if (identity.values && identity.values.length > 0) {
    prompt += `Core Values: ${identity.values.join(", ")}\n`;
  }
  if (identity.targetAudience) {
    prompt += `Target Audience: ${identity.targetAudience}\n`;
  }
  if (identity.painPoints && identity.painPoints.length > 0) {
    prompt += `Pain Points: ${identity.painPoints.join(", ")}\n`;
  }
  if (identity.competitors && identity.competitors.length > 0) {
    prompt += `Competitors to Avoid: ${identity.competitors.join(", ")}\n`;
  }
  if (identity.sampleHeadlines && identity.sampleHeadlines.length > 0) {
    prompt += `Sample Headlines: ${identity.sampleHeadlines.slice(0, 5).join(" | ")}\n`;
  }

  return prompt;
}

/**
 * Build Voice & Tone section prompt
 */
export function buildVoiceTonePrompt(brandGuide: BrandGuide): string {
  const { voiceAndTone } = brandGuide;

  let prompt = `## VOICE & TONE\n\n`;

  if (voiceAndTone.tone && voiceAndTone.tone.length > 0) {
    prompt += `Tone Keywords: ${voiceAndTone.tone.join(", ")}\n`;
  }

  prompt += `Tone Profile:\n`;
  prompt += `- Friendliness: ${voiceAndTone.friendlinessLevel}/100 (0=Formal, 100=Warm & Friendly)\n`;
  prompt += `- Formality: ${voiceAndTone.formalityLevel}/100 (0=Casual, 100=Professional)\n`;
  prompt += `- Confidence: ${voiceAndTone.confidenceLevel}/100 (0=Tentative, 100=Bold & Authoritative)\n`;

  if (voiceAndTone.voiceDescription) {
    prompt += `\nVoice Description: ${voiceAndTone.voiceDescription}\n`;
  }

  if (voiceAndTone.writingRules && voiceAndTone.writingRules.length > 0) {
    prompt += `\nWriting Rules:\n`;
    voiceAndTone.writingRules.forEach((rule) => {
      prompt += `- ${rule}\n`;
    });
  }

  if (voiceAndTone.avoidPhrases && voiceAndTone.avoidPhrases.length > 0) {
    prompt += `\nPhrases to Avoid: ${voiceAndTone.avoidPhrases.join(", ")}\n`;
  }

  return prompt;
}

/**
 * Build Visual Identity section prompt
 */
export function buildVisualIdentityPrompt(brandGuide: BrandGuide): string {
  const { visualIdentity } = brandGuide;

  let prompt = `## VISUAL IDENTITY\n\n`;

  if (visualIdentity.colors && visualIdentity.colors.length > 0) {
    prompt += `Color Palette: ${visualIdentity.colors.join(", ")}\n`;
  }

  if (visualIdentity.typography.heading) {
    prompt += `Typography:\n`;
    prompt += `- Heading Font: ${visualIdentity.typography.heading}\n`;
    if (visualIdentity.typography.body) {
      prompt += `- Body Font: ${visualIdentity.typography.body}\n`;
    }
    prompt += `- Source: ${visualIdentity.typography.source || "google"}\n`;
  }

  if (visualIdentity.logoUrl) {
    prompt += `Logo: ${visualIdentity.logoUrl}\n`;
  }

  if (visualIdentity.photographyStyle.mustInclude && visualIdentity.photographyStyle.mustInclude.length > 0) {
    prompt += `\nPhotography Must Include:\n`;
    visualIdentity.photographyStyle.mustInclude.forEach((rule) => {
      prompt += `- ${rule}\n`;
    });
  }

  if (visualIdentity.photographyStyle.mustAvoid && visualIdentity.photographyStyle.mustAvoid.length > 0) {
    prompt += `\nPhotography Must Avoid:\n`;
    visualIdentity.photographyStyle.mustAvoid.forEach((rule) => {
      prompt += `- ${rule}\n`;
    });
  }

  if (visualIdentity.visualNotes) {
    prompt += `\nVisual Guidelines: ${visualIdentity.visualNotes}\n`;
  }

  return prompt;
}

/**
 * Build Content Rules section prompt
 */
export function buildContentRulesPrompt(brandGuide: BrandGuide): string {
  const { contentRules, personas, goals } = brandGuide;

  let prompt = `## CONTENT RULES\n\n`;

  if (contentRules.contentPillars && contentRules.contentPillars.length > 0) {
    prompt += `Content Pillars: ${contentRules.contentPillars.join(", ")}\n`;
  }

  if (contentRules.preferredPlatforms && contentRules.preferredPlatforms.length > 0) {
    prompt += `Preferred Platforms: ${contentRules.preferredPlatforms.join(", ")}\n`;
  }

  if (contentRules.preferredPostTypes && contentRules.preferredPostTypes.length > 0) {
    prompt += `Preferred Post Types: ${contentRules.preferredPostTypes.join(", ")}\n`;
  }

  if (contentRules.brandPhrases && contentRules.brandPhrases.length > 0) {
    prompt += `Brand Phrases to Use: ${contentRules.brandPhrases.join(", ")}\n`;
  }

  if (contentRules.formalityLevel) {
    prompt += `Content Formality Level: ${contentRules.formalityLevel}\n`;
  }

  if (contentRules.neverDo && contentRules.neverDo.length > 0) {
    prompt += `\nNever Do:\n`;
    contentRules.neverDo.forEach((rule) => {
      prompt += `- ${rule}\n`;
    });
  }

  if (contentRules.guardrails && contentRules.guardrails.length > 0) {
    const activeGuardrails = contentRules.guardrails.filter((g) => g.isActive);
    if (activeGuardrails.length > 0) {
      prompt += `\nActive Guardrails:\n`;
      activeGuardrails.forEach((guardrail) => {
        prompt += `- [${guardrail.category}] ${guardrail.title}: ${guardrail.description}\n`;
      });
    }
  }

  if (personas && personas.length > 0) {
    prompt += `\nTarget Personas:\n`;
    personas.slice(0, 3).forEach((persona) => {
      prompt += `- ${persona.name} (${persona.role}): ${persona.description}\n`;
      if (persona.painPoints && persona.painPoints.length > 0) {
        prompt += `  Pain Points: ${persona.painPoints.join(", ")}\n`;
      }
      if (persona.goals && persona.goals.length > 0) {
        prompt += `  Goals: ${persona.goals.join(", ")}\n`;
      }
    });
  }

  if (goals && goals.length > 0) {
    prompt += `\nBrand Goals:\n`;
    goals.slice(0, 3).forEach((goal) => {
      prompt += `- ${goal.title}: ${goal.description}\n`;
    });
  }

  return prompt;
}

/**
 * Build complete Brand Guide prompt (all sections)
 */
export function buildFullBrandGuidePrompt(brandGuide: BrandGuide): string {
  let prompt = `# BRAND GUIDE\n\n`;
  prompt += `**CRITICAL**: This Brand Guide is the source of truth for all content generation.\n`;
  prompt += `You MUST follow all rules, guidelines, and specifications below.\n\n`;
  prompt += `---\n\n`;

  prompt += buildIdentityPrompt(brandGuide);
  prompt += `\n---\n\n`;
  prompt += buildVoiceTonePrompt(brandGuide);
  prompt += `\n---\n\n`;
  prompt += buildVisualIdentityPrompt(brandGuide);
  prompt += `\n---\n\n`;
  prompt += buildContentRulesPrompt(brandGuide);

  return prompt;
}

/**
 * Build BFS baseline prompt (for generating baseline content)
 */
export function buildBFSBaselinePrompt(brandGuide: BrandGuide): string {
  let prompt = `Generate a sample social media post that perfectly aligns with this Brand Guide.\n\n`;
  prompt += `The post should:\n`;
  prompt += `- Match the tone and voice exactly\n`;
  prompt += `- Use brand terminology and phrases\n`;
  prompt += `- Follow all content rules and guardrails\n`;
  prompt += `- Represent the "ideal" brand-aligned content\n\n`;
  prompt += buildFullBrandGuidePrompt(brandGuide);
  prompt += `\n\nGenerate a single, perfect post that will serve as the BFS baseline.`;

  return prompt;
}

