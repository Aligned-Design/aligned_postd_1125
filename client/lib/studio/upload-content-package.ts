/**
 * Upload to ContentPackage Conversion
 * 
 * Creates ContentPackage from uploaded content for agent collaboration.
 */

import type { ContentPackage } from "@shared/collaboration-artifacts";
import { createContentPackage } from "@shared/collaboration-artifacts";

/**
 * Create ContentPackage from uploaded image
 */
export function createContentPackageFromUpload(
  imageUrl: string,
  imageName: string,
  brandId: string,
  format?: string
): ContentPackage {
  // Extract any text from image name (basic extraction)
  const extractedText = imageName.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");

  const contentPackage = createContentPackage({
    brandId,
    contentId: `upload-${Date.now()}`,
    requestId: `upload-${Date.now()}`,
    platform: "instagram", // Default, could be detected from format
    copy: {
      headline: extractedText || "Uploaded Image",
      body: `Image: ${imageName}`,
      callToAction: "",
      tone: "professional",
      keywords: [],
      estimatedReadTime: 0,
    },
    designContext: {
      suggestedLayout: format || "feed",
      componentPrecedence: ["image", "text"],
      colorTheme: "brand-primary",
      motionConsiderations: [],
      accessibilityNotes: [],
    },
    visuals: [
      {
        id: `visual-upload-${Date.now()}`,
        type: "image" as const,
        format: (format as any) || "feed",
        imagePrompt: `Uploaded image: ${imageName}`,
        metadata: {
          format: format || "feed",
          colorUsage: [],
          typeStructure: {},
          emotion: "neutral",
          layoutStyle: "centered",
          aspectRatio: "1:1", // Default, could be detected from image
        },
      },
    ],
    status: "draft",
    collaborationLog: [
      {
        agent: "creative",
        action: "content_uploaded",
        timestamp: new Date().toISOString(),
        notes: `Image ${imageName} uploaded and converted to ContentPackage`,
      },
    ],
    createdBy: "user",
  });

  return contentPackage;
}

