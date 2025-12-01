/**
 * Collaboration Utilities
 * 
 * Helper functions for mapping between agent responses and collaboration artifacts.
 */

import type { AiDesignVariant } from "@shared/aiContent";
import type { ContentPackage } from "@shared/collaboration-artifacts";

/**
 * Map Design Agent variant to ContentPackage visuals[] entry
 * 
 * Creates a normalized visuals entry from a Design Agent variant with all relevant metadata.
 */
export function mapVariantToVisualEntry(
  variant: AiDesignVariant,
  context: {
    source: string;
    selected?: boolean;
    designFormat?: string;
    platform?: string;
  }
): ContentPackage["visuals"][0] {
  // Map variant aspectRatio/format to visuals format enum
  const mapFormatToVisualFormat = (
    aspectRatio?: string,
    designFormat?: string
  ): ContentPackage["visuals"][0]["format"] => {
    if (aspectRatio) {
      if (aspectRatio.includes("9:16") || aspectRatio.includes("16:9")) {
        return "story";
      }
      if (aspectRatio.includes("1:1")) {
        return "ig_post";
      }
    }
    if (designFormat) {
      const formatMap: Record<string, ContentPackage["visuals"][0]["format"]> = {
        social_square: "ig_post",
        story_portrait: "story",
        blog_featured: "linkedin_post",
        email_header: "other",
        custom: "other",
      };
      return formatMap[designFormat] || "other";
    }
    return "other";
  };

  // Extract colors from variant metadata or use defaults
  const colorUsage = variant.metadata?.colorUsage || [];

  // Extract fonts from variant metadata
  const typeStructure = variant.metadata?.typeStructure || {};

  // Build normalized visuals entry
  const visual: ContentPackage["visuals"][0] = {
    id: variant.id,
    type: "layout", // Design Agent variants are layout concepts
    format: mapFormatToVisualFormat(variant.aspectRatio, context.designFormat),
    templateRef: undefined, // Not from template
    imagePrompt: variant.prompt, // Store the prompt
    metadata: {
      format: variant.description || variant.useCase || "design_agent_variant",
      colorUsage,
      typeStructure,
      emotion: variant.metadata?.emotion || "professional",
      layoutStyle: variant.metadata?.layoutStyle || "centered",
      aspectRatio: variant.aspectRatio || "1:1",
      // ✅ PHASE 4: Extended fields for variant tracking
      variantLabel: variant.label,
      brandFidelityScore: variant.brandFidelityScore,
      source: context.source,
      selected: context.selected || false,
      selectedAt: context.selected ? new Date().toISOString() : undefined,
    },
    performanceInsights: undefined, // Can be added later if variant has performance data
  };

  return visual;
}

/**
 * Mark variant as selected in ContentPackage visuals[]
 * 
 * Updates existing visuals entry if variant ID matches, or adds new entry if not found.
 */
export function markVariantAsSelected(
  contentPackage: ContentPackage,
  variant: AiDesignVariant,
  source: string
): ContentPackage {
  if (!contentPackage.visuals) {
    contentPackage.visuals = [];
  }

  // ✅ PHASE 4: Unselect any previously selected variants (only one can be selected at a time)
  contentPackage.visuals = contentPackage.visuals.map((visual) => {
    if (visual.metadata?.selected === true && visual.id !== variant.id) {
      return {
        ...visual,
        metadata: {
          ...visual.metadata,
          selected: false,
          // Keep selectedAt for history, but mark as unselected
        },
      };
    }
    return visual;
  });

  // Check if variant already exists in visuals[]
  const existingIndex = contentPackage.visuals.findIndex(
    (visual) => visual.id === variant.id
  );

  if (existingIndex >= 0) {
    // Update existing entry to mark as selected
    const existing = contentPackage.visuals[existingIndex];
    contentPackage.visuals[existingIndex] = {
      ...existing,
      metadata: {
        ...existing.metadata,
        variantLabel: variant.label,
        brandFidelityScore: variant.brandFidelityScore,
        source: source,
        selected: true,
        selectedAt: new Date().toISOString(),
      },
    };
  } else {
    // Add new visuals entry for selected variant
    const newVisual = mapVariantToVisualEntry(variant, {
      source,
      selected: true,
    });
    contentPackage.visuals.push(newVisual);
  }

  return contentPackage;
}

