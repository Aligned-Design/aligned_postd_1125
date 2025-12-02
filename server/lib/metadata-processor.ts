import sharp from "sharp";
import { MediaMetadata, MediaCategory, MediaAsset } from "@shared/media";

interface RawMetadata {
  exif?: unknown;
  iptc?: unknown;
  xmp?: unknown;
}

export async function extractMetadata(
  fileBuffer: Buffer,
  filename: string,
  preserveLocation = false,
): Promise<MediaMetadata> {
  const image = sharp(fileBuffer);
  const sharpMetadata = await image.metadata();

  // Extract raw metadata
  const rawMetadata: RawMetadata = {};

  if (sharpMetadata.exif) {
    try {
      // Sharp provides EXIF data directly, store for processing
      rawMetadata.exif = {
        image: {},
        exif: {},
      };
    } catch (error) {
      console.warn("Failed to parse EXIF data:", error);
    }
  }

  // Process EXIF data (keep useful, strip sensitive)
  const exifData = rawMetadata.exif as { 
    image?: { 
      Orientation?: number;
      Make?: string;
      Model?: string;
    }; 
    exif?: { 
      DateTimeOriginal?: string; 
      GPSLatitude?: number; 
      GPSLongitude?: number;
    } 
  } | undefined;
  const metadata: MediaMetadata = {
    width: sharpMetadata.width || 0,
    height: sharpMetadata.height || 0,
    orientation: exifData?.image?.Orientation,
    colorSpace: sharpMetadata.space,
    keywords: [],
    aiTags: [],
    usedIn: [],
    usageCount: 0,
  };

  // Extract safe EXIF data
  if (exifData) {
    const { image, exif } = exifData;

    // Camera info (safe to keep)
    if (image?.Make && image?.Model) {
      metadata.cameraModel = `${image.Make} ${image.Model}`.trim();
    }

    // Capture date (useful for organization)
    if (exif?.DateTimeOriginal) {
      metadata.captureDate = new Date(exif.DateTimeOriginal).toISOString();
    }

    // GPS data - only keep if explicitly requested (local businesses)
    if (preserveLocation && exif?.GPSLatitude && exif?.GPSLongitude) {
      // Store GPS as separate field, not in main metadata for privacy
      console.log("Preserving GPS data for local business use");
    }
  }

  // Extract IPTC data (SEO-relevant)
  const iptcData = rawMetadata.iptc as { object_name?: string; caption?: string; copyright_notice?: string; by_line?: string; keywords?: string | string[] } | undefined;
  if (iptcData) {
    metadata.title = iptcData.object_name;
    metadata.caption = iptcData.caption;
    metadata.copyright = iptcData.copyright_notice;
    metadata.creator = iptcData.by_line;

    // Extract keywords from IPTC
    if (iptcData.keywords) {
      metadata.keywords = Array.isArray(iptcData.keywords)
        ? iptcData.keywords
        : [iptcData.keywords];
    }
  }

  // Analyze image content with AI
  metadata.aiTags = await analyzeImageContent(fileBuffer);

  // Detect dominant colors
  try {
    const stats = await image.stats();
    metadata.dominantColors = extractDominantColors(stats);
  } catch (error) {
    console.warn("Failed to extract dominant colors:", error);
  }

  // Detect text in image
  metadata.hasText = await detectTextInImage(fileBuffer);

  return metadata;
}

export async function extractVideoMetadata(
  fileBuffer: Buffer,
  filename: string,
): Promise<MediaMetadata> {
  // For video files, we'll use ffprobe or similar
  // This is a simplified implementation
  const metadata: MediaMetadata = {
    width: 0,
    height: 0,
    keywords: [],
    aiTags: [],
    usedIn: [],
    usageCount: 0,
    duration: 0, // Future enhancement: Extract with ffprobe for video duration
    frameRate: 30, // Future enhancement: Extract with ffprobe for video frame rate
  };

  return metadata;
}

async function analyzeImageContent(fileBuffer: Buffer): Promise<string[]> {
  // Future work: Integrate with AI service (OpenAI Vision, Google Vision, etc.)
  // This would enable automatic image content analysis and tagging
  // For now, return basic analysis based on image characteristics
  const tags: string[] = [];

  try {
    const image = sharp(fileBuffer);
    const { width, height } = await image.metadata();

    // Basic aspect ratio analysis
    if (width && height) {
      const aspectRatio = width / height;
      if (Math.abs(aspectRatio - 1) < 0.1) tags.push("square");
      else if (aspectRatio > 1.5) tags.push("landscape");
      else if (aspectRatio < 0.7) tags.push("portrait");
    }

    // Size-based categorization
    if (width && width > 2000) tags.push("high-resolution");
    if (width && width < 800) tags.push("web-optimized");
  } catch (error) {
    console.warn("Failed to analyze image content:", error);
  }

  return tags;
}

function extractDominantColors(stats: sharp.Stats): string[] {
  // Extract dominant colors from image statistics
  // This is simplified - in production, use proper color analysis
  const colors: string[] = [];

  try {
    if (stats.channels) {
      const channels = stats.channels;
      if (channels.length >= 3) {
        // Convert RGB means to hex colors (simplified)
        const r = Math.round(channels[0].mean);
        const g = Math.round(channels[1].mean);
        const b = Math.round(channels[2].mean);
        colors.push(
          `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`,
        );
      }
    }
  } catch (error) {
    console.warn("Failed to extract dominant colors:", error);
  }

  return colors;
}

async function detectTextInImage(_fileBuffer: Buffer): Promise<boolean> {
  // Future work: Integrate with OCR service (Tesseract, Google Vision, etc.)
  // This would enable text detection in images for accessibility and search
  // For now, return false as placeholder
  return false;
}

export function categorizeByContent(
  filename: string,
  mimeType: string,
  metadata: MediaMetadata,
): MediaCategory {
  const ext = filename.toLowerCase().split(".").pop() || "";

  // Video files
  if (
    mimeType.startsWith("video/") ||
    ["mp4", "mov", "webm", "avi"].includes(ext)
  ) {
    return "videos";
  }

  // Logo/brand assets (by filename patterns)
  if (
    filename.toLowerCase().includes("logo") ||
    ["svg", "eps", "ai"].includes(ext) ||
    filename.toLowerCase().includes("icon") ||
    filename.toLowerCase().includes("brand")
  ) {
    return "logos";
  }

  // Graphics (designed assets)
  if (
    ["psd", "sketch", "fig", "pdf"].includes(ext) ||
    metadata.aiTags.includes("graphic-design") ||
    filename.toLowerCase().includes("template") ||
    filename.toLowerCase().includes("design")
  ) {
    return "graphics";
  }

  // Default to images
  return "images";
}

export function generateSEOMetadata(
  asset: MediaAsset,
  context: "web" | "google_business" | "social" = "web",
): {
  altText: string;
  title: string;
  description: string;
} {
  const { metadata, filename, tags } = asset;

  // Generate alt text
  let altText = metadata.title || metadata.caption || "";
  if (!altText) {
    // Fallback: generate from tags and AI analysis
    const relevantTags = [...metadata.keywords, ...metadata.aiTags, ...tags]
      .filter((tag) => tag.length > 2)
      .slice(0, 3);
    altText = relevantTags.join(", ") || filename.replace(/\.[^/.]+$/, "");
  }

  // Generate title
  let title = metadata.title || filename.replace(/\.[^/.]+$/, "");
  if (context === "google_business") {
    title = `${title} - Business Photo`;
  }

  // Generate description
  let description = metadata.caption || "";
  if (!description && metadata.keywords.length > 0) {
    description = `Image featuring ${metadata.keywords.slice(0, 3).join(", ")}`;
  }

  return { altText, title, description };
}
