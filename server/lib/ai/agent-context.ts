import type { BrandProfile } from "@shared/advisor";
import type {
  AiAgentBrandContext,
  AiAgentBrandContextInput,
} from "@shared/aiContent";

export function mergeBrandProfileWithOverrides(
  brand: BrandProfile,
  overrides?: AiAgentBrandContextInput,
): BrandProfile {
  if (!overrides) {
    return brand;
  }

  return {
    ...brand,
    tone: overrides.tone ?? brand.tone,
    values: overrides.values ?? brand.values,
    targetAudience: overrides.targetAudience ?? brand.targetAudience,
    forbiddenPhrases: overrides.forbiddenPhrases ?? brand.forbiddenPhrases,
    requiredDisclaimers:
      overrides.requiredDisclaimers ?? brand.requiredDisclaimers,
    allowedToneDescriptors:
      overrides.allowedToneDescriptors ?? brand.allowedToneDescriptors,
  };
}

export function buildBrandContextPayload(
  brandId: string,
  brand: BrandProfile,
): AiAgentBrandContext {
  return {
    brandId,
    brandName: brand.name,
    tone: brand.tone,
    values: brand.values,
    targetAudience: brand.targetAudience,
    allowedToneDescriptors: brand.allowedToneDescriptors,
    guardrails: {
      forbiddenPhrases: brand.forbiddenPhrases,
      requiredDisclaimers: brand.requiredDisclaimers,
    },
  };
}

