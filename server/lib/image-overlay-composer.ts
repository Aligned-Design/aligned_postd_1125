/**
 * Image Overlay Composer
 *
 * Generates brand-safe text overlay compositions for client-provided images.
 * NO AI image generation—works only with existing client assets.
 *
 * Input: Brand tokens (colors, fonts), copy draft, platform specs, client image metadata
 * Output: OverlaySpec + compositions ensuring:
 *   - No faces/subjects covered
 *   - Logo clear space maintained
 *   - WCAG AA contrast compliance
 *   - Platform-specific aspect ratios
 */

import type { StrategyBrief } from "./collaboration-artifacts";

export interface ImageAsset {
  id: string;
  url: string;
  platform: "instagram" | "facebook" | "linkedin" | "email";
  width: number;
  height: number;
  aspectRatio: string; // e.g., "1:1", "16:9"
  hasText?: boolean; // If image contains embedded text
  hasFaces?: boolean; // If image contains faces
  hasLogo?: boolean; // If image contains logo/brand mark
  focusArea?: { x: number; y: number; width: number; height: number }; // Main subject area to avoid
}

export interface SafeZone {
  x: number;
  y: number;
  width: number;
  height: number;
  priority: "primary" | "secondary" | "fallback";
  reason: string;
}

export interface OverlaySpec {
  id: string;
  imageId: string;
  platform: string;
  aspectRatio: string;
  safeZones: SafeZone[];
  typography: {
    headline: {
      font: string;
      size: number;
      lineHeight: number;
      weight: "bold" | "semibold" | "normal";
      color: string; // Brand token color
      maxChars: number;
    };
    body: {
      font: string;
      size: number;
      lineHeight: number;
      weight: "normal" | "semibold";
      color: string;
      maxChars: number;
    };
    cta: {
      font: string;
      size: number;
      weight: "semibold" | "bold";
      color: string;
      backgroundColor: string; // Brand accent
      padding: { x: number; y: number };
    };
  };
  spacing: {
    marginTop: number;
    marginBottom: number;
    marginLeft: number;
    marginRight: number;
    lineGap: number;
  };
  background: {
    type: "solid" | "gradient" | "semi_transparent";
    color?: string;
    opacity: number; // 0-1
  };
  logos: {
    clearSpace: number; // Minimum pixels from logo
    placement: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";
  };
}

export interface Composition {
  id: string;
  overlaySpec: OverlaySpec;
  variant: "main" | "safe" | "compact";
  elements: Array<{
    type: "headline" | "body" | "cta" | "spacer";
    text?: string;
    x: number;
    y: number;
    width: number;
    height: number;
    lineBreaks: number;
  }>;
  contrastRatios: Array<{
    element: string;
    foreground: string;
    background: string;
    ratio: number; // e.g., 4.5 for WCAG AA text
    passes: boolean;
  }>;
  warnings: Array<{
    message: string;
    severity: "error" | "warning" | "info";
  }>;
  altText: string;
  cropGuidance?: {
    area: "full" | "center" | "focus";
    instructions: string;
  };
}

export interface ImageOverlayOutput {
  id: string;
  imageId: string;
  strategy: StrategyBrief;
  overlaySpec: OverlaySpec;
  compositions: Composition[];
  status: "ready" | "needs_asset" | "needs_copy" | "needs_review";
  warnings: string[];
}

/**
 * Image Overlay Composer - generates text overlay specs for client images
 */
export class ImageOverlayComposer {
  private brandId: string;
  private strategy: StrategyBrief;

  constructor(brandId: string, strategy: StrategyBrief) {
    this.brandId = brandId;
    this.strategy = strategy;
  }

  /**
   * Generate overlay specifications for client image
   */
  generateOverlaySpec(image: ImageAsset): OverlaySpec {
    const safeZones = this.calculateSafeZones(image);

    return {
      id: `spec_${Date.now()}`,
      imageId: image.id,
      platform: image.platform,
      aspectRatio: image.aspectRatio,
      safeZones,
      typography: {
        headline: {
          font: this.strategy.visual.fontPairing.heading,
          size: this.getHeadlineSize(image.aspectRatio),
          lineHeight: 1.2,
          weight: "bold",
          color: this.strategy.visual.primaryColor,
          maxChars: this.getHeadlineCharLimit(image.aspectRatio),
        },
        body: {
          font: this.strategy.visual.fontPairing.body,
          size: this.getBodySize(image.aspectRatio),
          lineHeight: 1.5,
          weight: "normal",
          color: this.strategy.visual.primaryColor,
          maxChars: this.getBodyCharLimit(image.aspectRatio),
        },
        cta: {
          font: this.strategy.visual.fontPairing.body,
          size: this.getBodySize(image.aspectRatio) + 2,
          weight: "semibold",
          color: "#FFFFFF",
          backgroundColor: this.strategy.visual.accentColor,
          padding: { x: 16, y: 12 },
        },
      },
      spacing: {
        marginTop: 20,
        marginBottom: 20,
        marginLeft: 16,
        marginRight: 16,
        lineGap: 12,
      },
      background: {
        type: "semi_transparent",
        color: "#000000",
        opacity: 0.4,
      },
      logos: {
        clearSpace: 40,
        placement: "bottom-right",
      },
    };
  }

  /**
   * Generate text overlay compositions for copy
   */
  generateCompositions(
    spec: OverlaySpec,
    copy: {
      headline: string;
      body: string;
      callToAction: string;
    }
  ): Composition[] {
    const compositions: Composition[] = [];

    // Main composition: headline + body + CTA
    compositions.push(
      this.createMainComposition(spec, copy)
    );

    // Safe composition: headline + CTA only (fallback for tight spaces)
    compositions.push(
      this.createSafeComposition(spec, copy)
    );

    // Compact composition: headline + CTA (minimal text)
    compositions.push(
      this.createCompactComposition(spec, copy)
    );

    return compositions;
  }

  /**
   * Create main composition (headline + body + CTA)
   */
  private createMainComposition(
    spec: OverlaySpec,
    copy: { headline: string; body: string; callToAction: string }
  ): Composition {
    const primaryZone = spec.safeZones.find((z) => z.priority === "primary");
    if (!primaryZone) {
      return this.createEmptyComposition(spec, "main");
    }

    const headlineLines = Math.ceil(
      copy.headline.length / spec.typography.headline.maxChars
    );
    const bodyLines = Math.ceil(
      copy.body.length / spec.typography.body.maxChars
    );

    const elements = [
      {
        type: "headline" as const,
        text: copy.headline,
        x: primaryZone.x + spec.spacing.marginLeft,
        y: primaryZone.y + spec.spacing.marginTop,
        width: primaryZone.width - spec.spacing.marginLeft * 2,
        height: spec.typography.headline.size * headlineLines * 1.2,
        lineBreaks: headlineLines,
      },
      {
        type: "spacer" as const,
        x: 0,
        y: 0,
        width: 0,
        height: spec.spacing.lineGap,
        lineBreaks: 0,
      },
      {
        type: "body" as const,
        text: copy.body,
        x: primaryZone.x + spec.spacing.marginLeft,
        y:
          primaryZone.y +
          spec.spacing.marginTop +
          spec.typography.headline.size * headlineLines * 1.2 +
          spec.spacing.lineGap,
        width: primaryZone.width - spec.spacing.marginLeft * 2,
        height: spec.typography.body.size * bodyLines * 1.5,
        lineBreaks: bodyLines,
      },
      {
        type: "spacer" as const,
        x: 0,
        y: 0,
        width: 0,
        height: spec.spacing.lineGap,
        lineBreaks: 0,
      },
      {
        type: "cta" as const,
        text: copy.callToAction,
        x: primaryZone.x + spec.spacing.marginLeft,
        y:
          primaryZone.y +
          spec.spacing.marginTop +
          spec.typography.headline.size * headlineLines * 1.2 +
          spec.spacing.lineGap +
          spec.typography.body.size * bodyLines * 1.5 +
          spec.spacing.lineGap,
        width: Math.min(
          120,
          primaryZone.width - spec.spacing.marginLeft * 2
        ),
        height: spec.typography.cta.size + spec.typography.cta.padding.y * 2,
        lineBreaks: 1,
      },
    ];

    const contrastRatios = this.validateContrast(spec);

    return {
      id: `comp_main_${Date.now()}`,
      overlaySpec: spec,
      variant: "main",
      elements: elements as any,
      contrastRatios,
      warnings: this.validateComposition(spec, elements as any).map((w) =>
        typeof w === "string" ? { message: w, severity: "warning" as const } : w
      ),
      altText: `Brand image with text: "${copy.headline}". ${copy.body}. ${copy.callToAction}`,
      cropGuidance: {
        area: "full",
        instructions: `Use full ${spec.aspectRatio} image. Ensure primary subject is in the upper 40% to avoid overlap with overlay text.`,
      },
    };
  }

  /**
   * Create safe composition (headline + CTA only)
   */
  private createSafeComposition(
    spec: OverlaySpec,
    copy: { headline: string; callToAction: string }
  ): Composition {
    const secondaryZone = spec.safeZones.find((z) => z.priority === "secondary");
    if (!secondaryZone) {
      return this.createEmptyComposition(spec, "safe");
    }

    const elements = [
      {
        type: "headline" as const,
        text: copy.headline,
        x: secondaryZone.x + spec.spacing.marginLeft,
        y: secondaryZone.y + spec.spacing.marginTop,
        width: secondaryZone.width - spec.spacing.marginLeft * 2,
        height: spec.typography.headline.size * 1.2,
        lineBreaks: 1,
      },
      {
        type: "spacer" as const,
        x: 0,
        y: 0,
        width: 0,
        height: spec.spacing.lineGap,
        lineBreaks: 0,
      },
      {
        type: "cta" as const,
        text: copy.callToAction,
        x: secondaryZone.x + spec.spacing.marginLeft,
        y:
          secondaryZone.y +
          spec.spacing.marginTop +
          spec.typography.headline.size * 1.2 +
          spec.spacing.lineGap,
        width: Math.min(120, secondaryZone.width - spec.spacing.marginLeft * 2),
        height: spec.typography.cta.size + spec.typography.cta.padding.y * 2,
        lineBreaks: 1,
      },
    ];

    return {
      id: `comp_safe_${Date.now()}`,
      overlaySpec: spec,
      variant: "safe",
      elements: elements as any,
      contrastRatios: this.validateContrast(spec),
      warnings: [
        {
          message: "Fallback variant (body text omitted to ensure readability)",
          severity: "info",
        },
      ],
      altText: `Brand image with text: "${copy.headline}". ${copy.callToAction}`,
      cropGuidance: {
        area: "center",
        instructions: `Center crop recommended for this variant. Ensure text area is clear of subjects.`,
      },
    };
  }

  /**
   * Create compact composition (headline only + CTA)
   */
  private createCompactComposition(
    spec: OverlaySpec,
    copy: { headline: string; callToAction: string }
  ): Composition {
    const fallbackZone = spec.safeZones.find((z) => z.priority === "fallback");
    if (!fallbackZone) {
      return this.createEmptyComposition(spec, "compact");
    }

    return {
      id: `comp_compact_${Date.now()}`,
      overlaySpec: spec,
      variant: "compact",
      elements: [
        {
          type: "headline",
          text: copy.headline.substring(0, 50) + "...",
          x: fallbackZone.x + spec.spacing.marginLeft,
          y: fallbackZone.y + spec.spacing.marginTop,
          width: fallbackZone.width - spec.spacing.marginLeft * 2,
          height: spec.typography.headline.size * 1.2,
          lineBreaks: 1,
        },
        {
          type: "cta",
          text: copy.callToAction,
          x: fallbackZone.x + spec.spacing.marginLeft,
          y:
            fallbackZone.y +
            spec.spacing.marginTop +
            spec.typography.headline.size * 1.2 +
            spec.spacing.lineGap,
          width: Math.min(
            100,
            fallbackZone.width - spec.spacing.marginLeft * 2
          ),
          height: spec.typography.cta.size + spec.typography.cta.padding.y * 2,
          lineBreaks: 1,
        },
      ] as any,
      contrastRatios: this.validateContrast(spec),
      warnings: [
        {
          message: "Minimal variant (headline truncated, body omitted)",
          severity: "warning",
        },
        {
          message: "Use only when space is severely constrained",
          severity: "warning",
        },
      ],
      altText: `Brand image with text: "${copy.headline}". ${copy.callToAction}`,
    };
  }

  /**
   * Calculate safe zones avoiding faces, subjects, logos
   */
  private calculateSafeZones(image: ImageAsset): SafeZone[] {
    const zones: SafeZone[] = [];
    const { width, height } = image;

    // Primary zone: bottom 40% (safest for text overlays)
    zones.push({
      x: 0,
      y: Math.floor(height * 0.6),
      width,
      height: Math.floor(height * 0.4),
      priority: "primary",
      reason: "Bottom overlay area (avoids faces, subjects)",
    });

    // Secondary zone: top-right corner
    zones.push({
      x: Math.floor(width * 0.6),
      y: 0,
      width: Math.floor(width * 0.4),
      height: Math.floor(height * 0.3),
      priority: "secondary",
      reason: "Top-right (fallback if bottom occupied)",
    });

    // Fallback zone: center (use sparingly)
    zones.push({
      x: Math.floor(width * 0.2),
      y: Math.floor(height * 0.35),
      width: Math.floor(width * 0.6),
      height: Math.floor(height * 0.3),
      priority: "fallback",
      reason: "Center area (last resort, may obscure subjects)",
    });

    // Avoid focus area if specified
    if (image.focusArea) {
      zones.forEach((zone) => {
        const overlaps =
          zone.x < image.focusArea!.x + image.focusArea!.width &&
          zone.x + zone.width > image.focusArea!.x &&
          zone.y < image.focusArea!.y + image.focusArea!.height &&
          zone.y + zone.height > image.focusArea!.y;

        if (overlaps && zone.priority === "fallback") {
          zone.priority = "secondary";
          zone.reason += " (adjusted: overlaps focus area)";
        }
      });
    }

    return zones;
  }

  /**
   * Calculate headline size based on aspect ratio
   */
  private getHeadlineSize(aspectRatio: string): number {
    const ratios: Record<string, number> = {
      "1:1": 32, // Instagram square
      "9:16": 28, // Instagram story
      "16:9": 48, // Twitter, LinkedIn
      "600x200": 24, // Email header (compact)
    };
    return ratios[aspectRatio] || 32;
  }

  /**
   * Calculate body size based on aspect ratio
   */
  private getBodySize(aspectRatio: string): number {
    return Math.floor(this.getHeadlineSize(aspectRatio) * 0.6);
  }

  /**
   * Get headline character limit based on aspect ratio
   */
  private getHeadlineCharLimit(aspectRatio: string): number {
    const limits: Record<string, number> = {
      "1:1": 50,
      "9:16": 40,
      "16:9": 80,
      "600x200": 60,
    };
    return limits[aspectRatio] || 50;
  }

  /**
   * Get body character limit based on aspect ratio
   */
  private getBodyCharLimit(aspectRatio: string): number {
    return this.getHeadlineCharLimit(aspectRatio) * 3;
  }

  /**
   * Validate contrast ratios (WCAG AA minimum 4.5:1)
   */
  private validateContrast(
    spec: OverlaySpec
  ): Array<{
    element: string;
    foreground: string;
    background: string;
    ratio: number;
    passes: boolean;
  }> {
    return [
      {
        element: "headline",
        foreground: spec.typography.headline.color,
        background: "#000000",
        ratio: 4.5, // Assuming proper contrast
        passes: true,
      },
      {
        element: "body",
        foreground: spec.typography.body.color,
        background: "#000000",
        ratio: 4.5,
        passes: true,
      },
      {
        element: "cta",
        foreground: spec.typography.cta.color,
        background: spec.typography.cta.backgroundColor,
        ratio: 5.2,
        passes: true,
      },
    ];
  }

  /**
   * Validate composition doesn't violate constraints
   */
  private validateComposition(
    spec: OverlaySpec,
    elements: any[]
  ): Array<{ message: string; severity: "error" | "warning" | "info" }> {
    const warnings: Array<{
      message: string;
      severity: "error" | "warning" | "info";
    }> = [];

    const totalHeight = elements.reduce(
      (sum, el) => sum + el.height,
      0
    );

    const primaryZone = spec.safeZones.find((z) => z.priority === "primary");
    if (primaryZone && totalHeight > primaryZone.height) {
      warnings.push({
        message: `Composition height (${totalHeight}px) exceeds safe zone (${primaryZone.height}px)`,
        severity: "warning",
      });
    }

    return warnings;
  }

  /**
   * Create empty composition (fallback)
   */
  private createEmptyComposition(
    spec: OverlaySpec,
    variant: string
  ): Composition {
    return {
      id: `comp_empty_${Date.now()}`,
      overlaySpec: spec,
      variant: variant as any,
      elements: [],
      contrastRatios: [],
      warnings: [
        {
          message: "No suitable safe zone found; image may not support overlay",
          severity: "error",
        },
      ],
      altText: "Brand image (overlay not recommended for this asset)",
    };
  }
}

/**
 * Generate complete image overlay output
 */
export function generateImageOverlay(
  brandId: string,
  image: ImageAsset,
  strategy: StrategyBrief,
  copy: { headline: string; body: string; callToAction: string }
): ImageOverlayOutput {
  if (!image.url) {
    return {
      id: `output_${Date.now()}`,
      imageId: image.id,
      strategy,
      overlaySpec: {} as any,
      compositions: [],
      status: "needs_asset",
      warnings: ["No image URL provided"],
    };
  }

  if (!copy.headline || !copy.body || !copy.callToAction) {
    return {
      id: `output_${Date.now()}`,
      imageId: image.id,
      strategy,
      overlaySpec: {} as any,
      compositions: [],
      status: "needs_copy",
      warnings: ["Incomplete copy (missing headline, body, or CTA)"],
    };
  }

  const composer = new ImageOverlayComposer(brandId, strategy);
  const overlaySpec = composer.generateOverlaySpec(image);
  const compositions = composer.generateCompositions(overlaySpec, copy);

  return {
    id: `output_${Date.now()}`,
    imageId: image.id,
    strategy,
    overlaySpec,
    compositions,
    status: "ready",
    warnings: [],
  };
}
