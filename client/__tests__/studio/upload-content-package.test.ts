/**
 * Unit Tests for Upload ContentPackage Conversion
 * 
 * Tests the upload-content-package.ts utility functions.
 */

import { describe, it, expect } from "vitest";
import { createContentPackageFromUpload } from "@/lib/studio/upload-content-package";
import type { Design } from "@/types/creativeStudio";

describe("upload-content-package", () => {
  const mockBrandId = "550e8400-e29b-41d4-a716-446655440000";

  const mockUploadDesign: Design = {
    id: "upload-123",
    name: "Uploaded Image",
    format: "social_square",
    width: 1080,
    height: 1080,
    backgroundColor: "#ffffff",
    items: [
      {
        id: "image-1",
        type: "image",
        imageUrl: "https://example.com/image.jpg",
        imageName: "uploaded-image.jpg",
        x: 0,
        y: 0,
        width: 1080,
        height: 1080,
        rotation: 0,
        zIndex: 1,
      },
      {
        id: "text-1",
        type: "text",
        text: "Uploaded Content Headline",
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
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockUploadedImages = [
    {
      url: "https://example.com/image.jpg",
      name: "uploaded-image.jpg",
    },
  ];

  it("should create ContentPackage from uploaded design", () => {
    const contentPackage = createContentPackageFromUpload(
      mockUploadDesign,
      mockBrandId,
      mockUploadedImages
    );

    expect(contentPackage).toBeDefined();
    expect(contentPackage.brandId).toBe(mockBrandId);
    expect(contentPackage.contentId).toBe("upload-123");
    expect(contentPackage.status).toBe("draft");
  });

  it("should extract text from design items", () => {
    const contentPackage = createContentPackageFromUpload(
      mockUploadDesign,
      mockBrandId,
      mockUploadedImages
    );

    expect(contentPackage.copy.headline).toBe("Uploaded Content Headline");
  });

  it("should include uploaded images in visuals array", () => {
    const contentPackage = createContentPackageFromUpload(
      mockUploadDesign,
      mockBrandId,
      mockUploadedImages
    );

    expect(contentPackage.visuals).toBeDefined();
    expect(contentPackage.visuals?.length).toBeGreaterThan(0);
    expect(contentPackage.visuals?.[0]?.type).toBe("image");
    expect(contentPackage.visuals?.[0]?.metadata.format).toBeDefined();
  });

  it("should map design format to visual format", () => {
    const contentPackage = createContentPackageFromUpload(
      mockUploadDesign,
      mockBrandId,
      mockUploadedImages
    );

    const visual = contentPackage.visuals?.[0];
    expect(visual?.format).toBe("ig_post");
  });

  it("should include image metadata in visual", () => {
    const contentPackage = createContentPackageFromUpload(
      mockUploadDesign,
      mockBrandId,
      mockUploadedImages
    );

    const visual = contentPackage.visuals?.[0];
    expect(visual?.metadata).toBeDefined();
    expect(visual?.metadata.aspectRatio).toBe("1080:1080");
  });

  it("should include collaboration log entry", () => {
    const contentPackage = createContentPackageFromUpload(
      mockUploadDesign,
      mockBrandId,
      mockUploadedImages
    );

    expect(contentPackage.collaborationLog).toBeDefined();
    expect(contentPackage.collaborationLog.length).toBeGreaterThan(0);
    expect(contentPackage.collaborationLog[0].agent).toBe("creative");
    expect(contentPackage.collaborationLog[0].action).toBe("upload_processed");
  });

  it("should handle design without text items", () => {
    const designWithoutText: Design = {
      ...mockUploadDesign,
      items: [
        {
          id: "image-1",
          type: "image",
          imageUrl: "https://example.com/image.jpg",
          imageName: "uploaded-image.jpg",
          x: 0,
          y: 0,
          width: 1080,
          height: 1080,
          rotation: 0,
          zIndex: 1,
        },
      ],
    };

    const contentPackage = createContentPackageFromUpload(
      designWithoutText,
      mockBrandId,
      mockUploadedImages
    );

    expect(contentPackage.copy.headline).toBe("Uploaded Content");
    expect(contentPackage.copy.body).toBe("Image uploaded for brand alignment");
  });

  it("should handle empty uploaded images array", () => {
    const contentPackage = createContentPackageFromUpload(
      mockUploadDesign,
      mockBrandId,
      []
    );

    expect(contentPackage.visuals).toBeDefined();
    // Should still create visual from design items
    expect(contentPackage.visuals?.length).toBeGreaterThan(0);
  });

  it("should set platform based on design format", () => {
    const contentPackage = createContentPackageFromUpload(
      mockUploadDesign,
      mockBrandId,
      mockUploadedImages
    );

    expect(contentPackage.platform).toBe("instagram");
  });
});

