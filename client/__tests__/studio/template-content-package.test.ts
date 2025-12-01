/**
 * Unit Tests for Template ContentPackage Conversion
 * 
 * Tests the template-content-package.ts utility functions.
 */

import { describe, it, expect } from "vitest";
import { createContentPackageFromTemplate } from "@/lib/studio/template-content-package";
import type { Design } from "@/types/creativeStudio";

describe("template-content-package", () => {
  const mockBrandId = "550e8400-e29b-41d4-a716-446655440000";

  const mockTemplateDesign: Design = {
    id: "template-123",
    name: "Test Template",
    format: "social_square",
    width: 1080,
    height: 1080,
    backgroundColor: "#ffffff",
    items: [
      {
        id: "text-1",
        type: "text",
        text: "Headline Text",
        x: 100,
        y: 100,
        width: 500,
        height: 100,
        rotation: 0,
        fontSize: 48,
        fontWeight: "bold",
        fontFamily: "Arial",
        fontColor: "#000000",
        zIndex: 2,
      },
      {
        id: "text-2",
        type: "text",
        text: "Body text content here",
        x: 100,
        y: 250,
        width: 500,
        height: 200,
        rotation: 0,
        fontSize: 24,
        fontWeight: "normal",
        fontFamily: "Arial",
        fontColor: "#333333",
        zIndex: 1,
      },
      {
        id: "text-3",
        type: "text",
        text: "Shop Now",
        x: 100,
        y: 500,
        width: 200,
        height: 50,
        rotation: 0,
        fontSize: 28,
        fontWeight: "bold",
        fontFamily: "Arial",
        fontColor: "#ffffff",
        zIndex: 3,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it("should create ContentPackage from template design", () => {
    const contentPackage = createContentPackageFromTemplate(
      mockTemplateDesign,
      mockBrandId,
      "template-123"
    );

    expect(contentPackage).toBeDefined();
    expect(contentPackage.brandId).toBe(mockBrandId);
    expect(contentPackage.contentId).toBe("template-123");
    expect(contentPackage.platform).toBe("instagram");
    expect(contentPackage.status).toBe("draft");
  });

  it("should extract headline from largest text item", () => {
    const contentPackage = createContentPackageFromTemplate(
      mockTemplateDesign,
      mockBrandId
    );

    expect(contentPackage.copy.headline).toBe("Headline Text");
  });

  it("should extract body text from medium-sized text", () => {
    const contentPackage = createContentPackageFromTemplate(
      mockTemplateDesign,
      mockBrandId
    );

    expect(contentPackage.copy.body).toBe("Body text content here");
  });

  it("should extract CTA from action words or last text item", () => {
    const contentPackage = createContentPackageFromTemplate(
      mockTemplateDesign,
      mockBrandId
    );

    expect(contentPackage.copy.callToAction).toBe("Shop Now");
  });

  it("should map design format to platform", () => {
    const squareDesign = { ...mockTemplateDesign, format: "social_square" as const };
    const storyDesign = { ...mockTemplateDesign, format: "story_portrait" as const };
    const blogDesign = { ...mockTemplateDesign, format: "blog_featured" as const };

    const squarePackage = createContentPackageFromTemplate(squareDesign, mockBrandId);
    const storyPackage = createContentPackageFromTemplate(storyDesign, mockBrandId);
    const blogPackage = createContentPackageFromTemplate(blogDesign, mockBrandId);

    expect(squarePackage.platform).toBe("instagram");
    expect(storyPackage.platform).toBe("instagram");
    expect(blogPackage.platform).toBe("linkedin");
  });

  it("should include design context in ContentPackage", () => {
    const contentPackage = createContentPackageFromTemplate(
      mockTemplateDesign,
      mockBrandId
    );

    expect(contentPackage.designContext).toBeDefined();
    expect(contentPackage.designContext?.suggestedLayout).toBe("social_square");
    expect(contentPackage.designContext?.componentPrecedence).toBeDefined();
  });

  it("should include visuals array with template reference", () => {
    const contentPackage = createContentPackageFromTemplate(
      mockTemplateDesign,
      mockBrandId,
      "template-123"
    );

    expect(contentPackage.visuals).toBeDefined();
    expect(contentPackage.visuals?.length).toBeGreaterThan(0);
    expect(contentPackage.visuals?.[0]?.type).toBe("template");
    expect(contentPackage.visuals?.[0]?.templateRef).toBe("template-123");
  });

  it("should extract colors from design items", () => {
    const contentPackage = createContentPackageFromTemplate(
      mockTemplateDesign,
      mockBrandId
    );

    const visual = contentPackage.visuals?.[0];
    expect(visual?.metadata.colorUsage).toBeDefined();
    expect(Array.isArray(visual?.metadata.colorUsage)).toBe(true);
  });

  it("should extract fonts from design items", () => {
    const contentPackage = createContentPackageFromTemplate(
      mockTemplateDesign,
      mockBrandId
    );

    const visual = contentPackage.visuals?.[0];
    expect(visual?.metadata.typeStructure).toBeDefined();
    expect(visual?.metadata.typeStructure?.headingFont).toBe("Arial");
    expect(visual?.metadata.typeStructure?.bodyFont).toBe("Arial");
  });

  it("should include collaboration log entry", () => {
    const contentPackage = createContentPackageFromTemplate(
      mockTemplateDesign,
      mockBrandId
    );

    expect(contentPackage.collaborationLog).toBeDefined();
    expect(contentPackage.collaborationLog.length).toBeGreaterThan(0);
    expect(contentPackage.collaborationLog[0].agent).toBe("creative");
    expect(contentPackage.collaborationLog[0].action).toBe("template_selected");
  });

  it("should handle design without text items gracefully", () => {
    const designWithoutText: Design = {
      ...mockTemplateDesign,
      items: [],
    };

    const contentPackage = createContentPackageFromTemplate(
      designWithoutText,
      mockBrandId
    );

    expect(contentPackage.copy.headline).toBe("Template Headline");
    expect(contentPackage.copy.body).toBe("Template body text");
    expect(contentPackage.copy.callToAction).toBe("Learn More");
  });
});

