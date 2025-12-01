/**
 * Template to ContentPackage Conversion
 * 
 * Creates ContentPackage from template Design for agent collaboration.
 */

import type { Design, CanvasItem } from "@/types/creativeStudio";
import type { ContentPackage } from "@shared/collaboration-artifacts";
import { createContentPackage } from "@shared/collaboration-artifacts";

/**
 * Extract text content from template design items
 */
function extractTextFromTemplate(design: Design): {
  headline: string;
  body: string;
  callToAction: string;
} {
  const textItems = design.items.filter((item) => item.type === "text") as Array<
    CanvasItem & { text: string }
  >;

  // Find headline (usually largest text or first text item)
  const headlineItem =
    textItems.find((item) => item.fontSize && item.fontSize >= 40) ||
    textItems.find((item) => item.fontWeight === "bold") ||
    textItems[0];

  // Find body text (medium-sized text)
  const bodyItem =
    textItems.find(
      (item) => item.fontSize && item.fontSize >= 24 && item.fontSize < 40
    ) || textItems[1] || textItems[0];

  // Find CTA (usually contains action words or is in a button-like shape)
  const ctaItem =
    textItems.find((item) =>
      item.text?.toLowerCase().match(/shop|buy|learn|get|start|click|visit|join/i)
    ) ||
    textItems.find((item) => item.fontWeight === "bold" && item.fontSize && item.fontSize >= 28) ||
    textItems[textItems.length - 1];

  return {
    headline: headlineItem?.text || "Template Headline",
    body: bodyItem?.text || "Template body text",
    callToAction: ctaItem?.text || "Learn More",
  };
}

/**
 * Map design format to platform string
 */
function mapFormatToPlatform(format: Design["format"]): string {
  const formatMap: Record<string, string> = {
    social_square: "instagram",
    story_portrait: "instagram",
    blog_featured: "linkedin",
    email_header: "email",
    custom: "general",
  };
  return formatMap[format] || "general";
}

/**
 * Create ContentPackage from template Design
 */
export function createContentPackageFromTemplate(
  design: Design,
  brandId: string,
  templateId?: string
): ContentPackage {
  const textContent = extractTextFromTemplate(design);

  // Extract tone from design (if available in metadata)
  const tone = "professional"; // Default, could be extracted from design metadata

  // Create ContentPackage
  const contentPackage = createContentPackage({
    brandId,
    contentId: design.id,
    requestId: `template-${templateId || design.id}-${Date.now()}`,
    platform: mapFormatToPlatform(design.format),
    copy: {
      headline: textContent.headline,
      body: textContent.body,
      callToAction: textContent.callToAction,
      tone,
      keywords: [],
      estimatedReadTime: Math.ceil(textContent.body.length / 200), // ~200 words per minute
    },
    designContext: {
      suggestedLayout: design.format,
      componentPrecedence: design.items
        .sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0))
        .slice(0, 5)
        .map((item) => item.type),
      colorTheme: "brand-primary",
      motionConsiderations: [],
      accessibilityNotes: [],
    },
    visuals: [
      {
        id: `visual-${design.id}`,
        type: "template" as const,
        format: mapFormatToVisualFormat(design.format),
        templateRef: templateId || design.id,
        metadata: {
          format: design.format,
          colorUsage: extractColorsFromDesign(design),
          typeStructure: {
            headingFont: extractFontFromDesign(design, "heading"),
            bodyFont: extractFontFromDesign(design, "body"),
          },
          emotion: tone,
          layoutStyle: "centered", // Could be extracted from design structure
          aspectRatio: `${design.width}:${design.height}`,
        },
      },
    ],
    status: "draft",
    collaborationLog: [
      {
        agent: "creative",
        action: "template_selected",
        timestamp: new Date().toISOString(),
        notes: `Template ${templateId || design.id} selected and converted to ContentPackage`,
      },
    ],
    createdBy: "user",
  });

  return contentPackage;
}

/**
 * Map design format to visual format type
 */
function mapFormatToVisualFormat(
  format: Design["format"]
): ContentPackage["visuals"][0]["format"] {
  const formatMap: Record<string, ContentPackage["visuals"][0]["format"]> = {
    social_square: "ig_post",
    story_portrait: "story",
    blog_featured: "linkedin_post",
    email_header: "other",
    custom: "other",
  };
  return formatMap[format] || "other";
}

/**
 * Extract colors from design items
 */
function extractColorsFromDesign(design: Design): string[] {
  const colors = new Set<string>();

  design.items.forEach((item) => {
    if (item.type === "text" && item.fontColor) {
      colors.add(item.fontColor);
    }
    if (item.type === "shape" && item.fill) {
      colors.add(item.fill);
    }
    if (item.type === "background") {
      if (item.backgroundColor) colors.add(item.backgroundColor);
      if (item.gradientFrom) colors.add(item.gradientFrom);
      if (item.gradientTo) colors.add(item.gradientTo);
    }
  });

  return Array.from(colors).slice(0, 5); // Limit to 5 colors
}

/**
 * Extract font from design items
 */
function extractFontFromDesign(
  design: Design,
  type: "heading" | "body"
): string {
  const textItems = design.items.filter(
    (item) => item.type === "text"
  ) as Array<CanvasItem & { fontFamily?: string; fontSize?: number }>;

  if (type === "heading") {
    const headingItem = textItems.find(
      (item) => item.fontSize && item.fontSize >= 40
    );
    return headingItem?.fontFamily || "Arial";
  } else {
    const bodyItem = textItems.find(
      (item) => item.fontSize && item.fontSize < 40
    );
    return bodyItem?.fontFamily || "Arial";
  }
}

