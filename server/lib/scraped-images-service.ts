/**
 * Scraped Images Service
 * 
 * Handles persistence of images scraped from websites during onboarding.
 * Stores images in media_assets table with source='scrape' metadata.
 * 
 * CRITICAL: This service is part of the core crawler pipeline.
 * If images aren't persisted correctly, Brand Guide and Creative Studio will be broken.
 * 
 * ID REQUIREMENTS:
 * - brandId: Can be temporary during onboarding (e.g., "brand_1234567890")
 * - tenantId: MUST be a valid UUID from user's workspace (required)
 * 
 * RECONCILIATION:
 * - If brand is created with final UUID different from temp brandId:
 *   → Call transferScrapedImages(tempBrandId, finalBrandId)
 *   → Updates all media_assets.brand_id from temp to final UUID
 */

import { supabase } from "./supabase";
import { MediaDBService } from "./media-db-service";
import { ErrorCode } from "./error-responses";
import crypto from "crypto";

const mediaDB = new MediaDBService();

/**
 * Derive filename from image URL
 * Extracts the last path segment and strips query parameters
 * Falls back to "scraped-image" if extraction fails
 */
function deriveFilenameFromUrl(imageUrl: string): string {
  try {
    const url = new URL(imageUrl);
    const pathname = url.pathname; // e.g. "/content/v1/.../Aligned-by-design-main-logo.png"
    const lastSegment = pathname.split("/").filter(Boolean).pop() ?? "";
    const base = lastSegment.split("?")[0] || "scraped-image";
    
    // Ensure we have a valid filename (non-empty, reasonable length)
    if (base && base.length > 0 && base.length < 255) {
      return base;
    }
    
    return "scraped-image";
  } catch {
    return "scraped-image";
  }
}

/**
 * Infer MIME type from filename extension
 * Falls back to "image/jpeg" if extension is unknown
 * 
 * ✅ Added 2025-12-10: Better MIME type handling for scraped images
 */
function inferMimeType(filename: string): string {
  try {
    const ext = filename.split(".").pop()?.toLowerCase();
    if (!ext) return "image/jpeg";
    
    switch (ext) {
      case "png":
        return "image/png";
      case "webp":
        return "image/webp";
      case "svg":
        return "image/svg+xml";
      case "gif":
        return "image/gif";
      case "jpg":
      case "jpeg":
        return "image/jpeg";
      case "ico":
        return "image/x-icon";
      case "bmp":
        return "image/bmp";
      case "tiff":
      case "tif":
        return "image/tiff";
      case "avif":
        return "image/avif";
      default:
        return "image/jpeg"; // Safe fallback
    }
  } catch {
    return "image/jpeg";
  }
}

export interface CrawledImage {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
  role?: "logo" | "team" | "subject" | "hero" | "photo" | "social_icon" | "platform_logo" | "ui_icon" | "partner_logo" | "other";
}

/**
 * Persist scraped images to media_assets table
 * 
 * @param brandId - Brand ID
 * @param tenantId - Tenant/Workspace ID (optional, will be derived if not provided)
 * @param images - Array of crawled images
 * @returns Array of persisted asset IDs
 */
export async function persistScrapedImages(
  brandId: string,
  tenantId: string | null,
  images: CrawledImage[]
): Promise<string[]> {
  if (!images || images.length === 0) {
    return [];
  }

  // ✅ IMPROVED: More forgiving tenantId handling
  // Attempts to resolve tenantId from brand if missing/invalid, but doesn't block persistence
  let finalTenantId = tenantId;
  
  // Helper to validate UUID format
  const isValidUUID = (id: string | null | undefined): boolean => {
    if (!id || id === "unknown") return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  };
  
  // If tenantId is missing or invalid, try to resolve from brand
  if (!finalTenantId || !isValidUUID(finalTenantId)) {
    console.warn(`[ScrapedImages] tenantId missing or invalid (${finalTenantId}); attempting lookup from brand`);
    
    try {
      const { data: brand, error: brandError } = await supabase
        .from("brands")
        .select("tenant_id")
        .eq("id", brandId)
        .single();
      
      if (!brandError && brand && (brand as any).tenant_id && isValidUUID((brand as any).tenant_id)) {
        finalTenantId = (brand as any).tenant_id;
        console.log(`[ScrapedImages] ✅ Resolved tenantId from brand record: ${finalTenantId}`);
      } else {
        console.warn(`[ScrapedImages] Could not resolve tenantId from brand (brand may not exist yet); proceeding with null tenant_id`);
        finalTenantId = null;
      }
    } catch (err) {
      console.warn(`[ScrapedImages] Error looking up brand for tenantId resolution:`, err instanceof Error ? err.message : String(err));
      finalTenantId = null;
    }
  }
  
  // ✅ PROCEED WITH PERSISTENCE even if tenantId is null
  // The schema allows tenant_id to be nullable, so we can still persist images
  // This prevents a single validation failure from blocking all image persistence

  // ✅ CRITICAL: Filter and classify images according to hard rules
  // 1. Filter out social_icon, platform_logo, ui_icon (completely ignore)
  // 2. Filter out solid color blocks, placeholders, and tiny images
  // 3. Separate logos (max 2) from brand images (max 15)
  // 4. Sort and prioritize before persistence
  
  // ✅ FIX 2025-12-10: Helper to detect solid color placeholder images
  const isSolidColorPlaceholder = (img: CrawledImage): boolean => {
    const urlLower = img.url.toLowerCase();
    const filenameLower = (img.url.split("/").pop() || "").toLowerCase();
    
    // Check for placeholder patterns in URL
    const placeholderPatterns = [
      "placeholder", "blank", "empty", "spacer", "pixel", "1x1", "transparent",
      "dummy", "loading", "skeleton"
    ];
    
    if (placeholderPatterns.some(p => urlLower.includes(p) || filenameLower.includes(p))) {
      return true;
    }
    
    // Check for 1x1 or very small dimensions (likely tracking pixels or spacers)
    if (img.width && img.height) {
      if (img.width <= 2 && img.height <= 2) {
        return true;
      }
    }
    
    // Check for data URIs that are likely solid colors or gradients
    if (img.url.startsWith("data:image/svg+xml") && img.url.length < 500) {
      // Very short SVG data URIs are likely simple shapes/colors
      return true;
    }
    
    return false;
  };
  
  // ✅ FIX 2025-12-10: Helper to detect UI icons and icon pack graphics
  const isUiIconOrGraphic = (img: CrawledImage): boolean => {
    const urlLower = img.url.toLowerCase();
    const filenameLower = (img.url.split("/").pop() || "").toLowerCase();
    const altLower = (img.alt || "").toLowerCase();
    
    // Known icon patterns
    const iconPatterns = [
      "envelope", "mail", "email", "globe", "world", "phone", "call", "contact",
      "arrow", "chevron", "caret", "hamburger", "menu", "search", "magnify",
      "user", "person", "avatar", "profile", "account", "settings", "cog", "gear",
      "home", "house", "star", "heart", "like", "share", "download", "upload",
      "play", "pause", "stop", "next", "prev", "forward", "back", "close",
      "check", "checkmark", "tick", "cross", "plus", "minus", "add", "remove",
      "cart", "shopping", "bag", "basket", "lock", "unlock", "key", "shield",
      "bell", "notification", "alert", "warning", "info", "help", "question",
      "calendar", "clock", "time", "date", "location", "map", "pin", "marker"
    ];
    
    // Icon pack directories
    const iconPathPatterns = [
      "/icons/", "/icon/", "/assets/icons", "/img/icons", "/images/icons",
      "/iconpack/", "/icon-pack/", "/ui-icons/", "/ui/icons",
      "/fontawesome", "/feather", "/heroicons", "/lucide", "/bootstrap-icons"
    ];
    
    const hasIconPattern = iconPatterns.some(p => 
      filenameLower.includes(p) || altLower.includes(p)
    );
    
    const isInIconPath = iconPathPatterns.some(p => urlLower.includes(p));
    
    // Small images (< 150px) with icon patterns are UI icons
    if (hasIconPattern && img.width && img.height && img.width < 150 && img.height < 150) {
      // Don't filter if it has "logo" in the name
      const hasLogoIndicator = filenameLower.includes("logo") || altLower.includes("logo");
      if (!hasLogoIndicator) {
        return true;
      }
    }
    
    // Any small image in an icon pack path
    if (isInIconPath && img.width && img.height && img.width < 200 && img.height < 200) {
      return true;
    }
    
    return false;
  };
  
  const validImages = images.filter(img => {
    // ✅ FILTER: Ignore social_icon, platform_logo, and ui_icon completely
    if (img.role === "social_icon" || img.role === "platform_logo" || img.role === "ui_icon") {
      console.log(`[ScrapedImages] Filtering out ${img.role}: ${img.url.substring(0, 60)}...`);
      return false;
    }
    
    // ✅ VALIDATION: Ensure image URL is valid
    if (!img.url || !img.url.startsWith("http")) {
      console.warn(`[ScrapedImages] Skipping invalid image URL: ${img.url}`);
      return false;
    }
    
    // ✅ FIX: Filter out solid color placeholders
    if (isSolidColorPlaceholder(img)) {
      console.log(`[ScrapedImages] Filtering out placeholder/solid color: ${img.url.substring(0, 60)}...`);
      return false;
    }
    
    // ✅ FIX: Filter out UI icons and icon pack graphics
    if (isUiIconOrGraphic(img)) {
      console.log(`[ScrapedImages] Filtering out UI icon/graphic: ${img.url.substring(0, 60)}...`);
      return false;
    }
    
    return true;
  });
  
  // ✅ CRITICAL FIX: SEPARATE logos and brand images with strict filtering
  // Logos: Only images explicitly classified as "logo"
  const logoImages = validImages.filter(img => {
    // ✅ STRICT: Only include images with role === "logo"
    if (img.role === "logo") return true;
    
    // ✅ SAFETY CHECK: Also catch logo-like images that might have been misclassified
    // But be conservative - only flag obvious logos
    const urlLower = img.url.toLowerCase();
    const filenameLower = (img.url.split("/").pop() || "").toLowerCase();
    const altLower = (img.alt || "").toLowerCase();
    
    // Check for strong logo indicators
    const hasStrongLogoIndicator = 
      filenameLower.includes("logo") || 
      altLower.includes("logo") ||
      urlLower.includes("/logo/") ||
      urlLower.includes("logo-") ||
      urlLower.includes("-logo");
    
    // Check if it's a small square image (likely logo)
    const isSmallSquare = img.width && img.height && 
      img.width < 300 && img.height < 300 && 
      Math.abs((img.width / img.height) - 1) < 0.3; // Square-ish
    
    // Only include as logo if it has strong indicators AND is small/square
    // This prevents large brand images with "logo" in the name from being misclassified
    if (hasStrongLogoIndicator && isSmallSquare) {
      console.log(`[ScrapedImages] Reclassifying image as logo (strong indicators + small size): ${img.url.substring(0, 60)}...`);
      return true;
    }
    
    return false;
  });
  
  // ✅ CRITICAL FIX (2025-12-10): Balanced brand image filtering
  // RULE: Include legitimate brand photos, exclude icons and tiny images
  // Logos CAN be included - user can remove via X button
  const brandImages = validImages.filter(img => {
    // ✅ STRICT EXCLUSION: Social icons, platform logos, and UI icons (never useful as brand content)
    if (img.role === "social_icon" || img.role === "platform_logo" || img.role === "ui_icon") {
      return false;
    }
    
    // ✅ FIX: Exclude very tiny images (< 50x50 pixels) - definitely icons
    if (img.width && img.height && (img.width * img.height < 2500)) {
      console.log(`[ScrapedImages] Excluding tiny image (< 50x50): ${img.url.substring(0, 60)}...`);
      return false;
    }
    
    // ✅ FIX: Exclude small square images that are likely icons (unless they're logos)
    // Square images < 100x100 are typically icons
    if (img.width && img.height && 
        img.width === img.height && 
        img.width < 100 && 
        img.role !== "logo") {
      console.log(`[ScrapedImages] Excluding small square icon: ${img.url.substring(0, 60)}...`);
      return false;
    }
    
    // ✅ FIX: Exclude images with very small area (< 10000px, ~100x100) unless logos
    if (img.width && img.height && 
        (img.width * img.height < 10000) && 
        img.role !== "logo") {
      console.log(`[ScrapedImages] Excluding small image (area < 10000px): ${img.url.substring(0, 60)}...`);
      return false;
    }
    
    // ✅ NEW: Include logo-role images in brand images (user can decide to keep or remove)
    // Previously these were excluded, but user may want to see them
    if (img.role === "logo") {
      console.log(`[ScrapedImages] Including logo in brand images (user can remove via X): ${img.url.substring(0, 60)}...`);
      // Logo will also be in logoImages, but we include in brandImages for user control
    }
    
    // ✅ Accept legitimate brand images: hero, photo, team, subject, other
    return true;
  });
  
  // ✅ SORT LOGOS: Prioritize larger resolution, PNG, brand name in filename
  logoImages.sort((a, b) => {
    // 1. Prefer PNG (transparent)
    const aFilename = a.url.split("/").pop() || "";
    const bFilename = b.url.split("/").pop() || "";
    const aIsPng = a.url.toLowerCase().includes(".png") || aFilename.toLowerCase().endsWith(".png");
    const bIsPng = b.url.toLowerCase().includes(".png") || bFilename.toLowerCase().endsWith(".png");
    if (aIsPng && !bIsPng) return -1;
    if (!aIsPng && bIsPng) return 1;
    
    // 2. Prefer larger resolution
    const aSize = (a.width || 0) * (a.height || 0);
    const bSize = (b.width || 0) * (b.height || 0);
    if (aSize !== bSize) return bSize - aSize; // Descending
    
    // 3. Prefer brand name in filename/alt (handled by priority score if available)
    return 0;
  });
  
  // ✅ LIMIT LOGOS: Max 2 (1 primary + 1 alternate if clearly different)
  const selectedLogos = logoImages.slice(0, 2);
  
  // ✅ SORT BRAND IMAGES: Prioritize hero, then larger photos
  brandImages.sort((a, b) => {
    // 1. Prefer hero images
    if (a.role === "hero" && b.role !== "hero") return -1;
    if (b.role === "hero" && a.role !== "hero") return 1;
    
    // 2. Prefer larger resolution
    const aSize = (a.width || 0) * (a.height || 0);
    const bSize = (b.width || 0) * (b.height || 0);
    return bSize - aSize; // Descending
  });
  
  // ✅ LIMIT BRAND IMAGES: Max 15
  const selectedBrandImages = brandImages.slice(0, 15);
  
  // ✅ COMBINE: Logos first, then brand images
  // ✅ DEDUPLICATION: Remove duplicates by URL before combining
  const seenUrls = new Set<string>();
  const deduplicatedLogos = selectedLogos.filter(img => {
    if (seenUrls.has(img.url)) return false;
    seenUrls.add(img.url);
    return true;
  });
  const deduplicatedBrandImages = selectedBrandImages.filter(img => {
    if (seenUrls.has(img.url)) return false;
    seenUrls.add(img.url);
    return true;
  });
  const imagesToPersist = [...deduplicatedLogos, ...deduplicatedBrandImages];
  
  // ✅ ENHANCED: Log classification breakdown for debugging
  const roleBreakdown = images.reduce((acc, img) => {
    acc[img.role] = (acc[img.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Count logo-style images filtered from brand images
  const logoStyleFiltered = validImages.filter(img => {
    if (img.role === "logo") return false;
    if (!["hero", "photo", "team", "subject", "other"].includes(img.role || "")) return false;
    const urlLower = img.url.toLowerCase();
    const filenameLower = (img.url.split("/").pop() || "").toLowerCase();
    const altLower = (img.alt || "").toLowerCase();
    const hasLogoIndicator = filenameLower.includes("logo") || 
                             altLower.includes("logo") ||
                             urlLower.includes("/logo/") ||
                             urlLower.includes("logo-") ||
                             urlLower.includes("-logo");
    const isSmallSquare = img.width && img.height && 
      img.width < 400 && img.height < 400 && 
      Math.abs((img.width / img.height) - 1) < 0.3;
    return hasLogoIndicator && (isSmallSquare || !img.width || !img.height || img.width < 500 || img.height < 500);
  }).length;
  
  // ✅ METRICS: File extension breakdown
  const getFileExtension = (url: string): string => {
    try {
      const filename = url.split("/").pop() || "";
      const ext = filename.split(".").pop()?.toLowerCase() || "";
      return ext || "unknown";
    } catch {
      return "unknown";
    }
  };
  
  const extensionBreakdown = images.reduce((acc, img) => {
    const ext = getFileExtension(img.url);
    acc[ext] = (acc[ext] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // ✅ METRICS: Size category breakdown
  const categorizeSize = (width?: number, height?: number): string => {
    if (!width || !height) return "unknown";
    const pixels = width * height;
    if (pixels < 10000) return "tiny";
    if (pixels < 50000) return "small";
    if (pixels < 500000) return "medium";
    if (pixels < 2000000) return "large";
    return "xlarge";
  };
  
  const sizeBreakdown = images.reduce((acc, img) => {
    const sizeCategory = categorizeSize(img.width, img.height);
    acc[sizeCategory] = (acc[sizeCategory] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  console.log(`[ScrapedImages] Image selection summary:`, {
    totalImages: images.length,
    filteredOut: images.length - validImages.length,
    roleBreakdown, // Show how many images of each role were found
    logosFound: logoImages.length,
    logosSelected: selectedLogos.length,
    brandImagesFound: brandImages.length,
    logoStyleFiltered: logoStyleFiltered, // Logo-style images filtered from brand images
    brandImagesSelected: selectedBrandImages.length,
    totalToPersist: imagesToPersist.length,
    metrics: {
      fileExtensions: extensionBreakdown, // png, jpg, svg, webp counts
      sizeCategories: sizeBreakdown, // tiny, small, medium, large, xlarge
    },
  });
  
  // ✅ DEBUG: Log if all images were filtered out (indicates classification issue)
  if (images.length > 0 && imagesToPersist.length === 0) {
    console.warn(`[ScrapedImages] ⚠️ Found ${images.length} image(s) but NONE were persisted. Role breakdown:`, roleBreakdown);
    console.warn(`[ScrapedImages] This may indicate over-filtering. Check classification logic for platform_logo/social_icon detection.`);
  }
  
  // ✅ FALLBACK: If all images were filtered out but we have raw images, use conservative fallback selection
  // This ensures we don't leave brands with zero images when legitimate brand assets exist
  let finalImagesToPersist = imagesToPersist;
  let fallbackEngaged = false;
  
  if (images.length > 0 && selectedLogos.length === 0 && selectedBrandImages.length === 0) {
    console.warn(`[ScrapedImages] ⚠️ Fallback selection engaged: totalImages > 0 but no images survived filtering.`, {
      brandId: brandId,
      totalImages: images.length,
      roleBreakdown: roleBreakdown,
    });
    
    // Build fallback candidates from raw images (before platform_logo/social_icon filtering)
    // Exclude obvious junk but be more lenient than the strict filters
    const fallbackCandidates = images.filter(img => {
      // Skip data URIs and placeholders
      if (img.url.startsWith("data:") || !img.url.startsWith("http")) return false;
      
      const urlLower = img.url.toLowerCase();
      const filenameLower = (img.url.split("/").pop() || "").toLowerCase();
      
      // Exclude obvious junk files
      if (filenameLower.includes("favicon") || 
          filenameLower.includes("sprite") || 
          filenameLower.includes("pixel") ||
          filenameLower.includes("tracking") ||
          filenameLower.includes("analytics") ||
          urlLower.includes("pixel") ||
          urlLower.includes("tracking")) {
        return false;
      }
      
      // Exclude very small images (confirmed icons)
      if (img.width && img.height && img.width < 50 && img.height < 50) {
        return false;
      }
      
      // Accept all other images (even if they were classified as platform_logo/social_icon)
      // The fallback is conservative - we'd rather have some images than none
      return true;
    });
    
    // Sort by size (prefer larger images)
    fallbackCandidates.sort((a, b) => {
      const aSize = (a.width || 0) * (a.height || 0);
      const bSize = (b.width || 0) * (b.height || 0);
      return bSize - aSize; // Descending
    });
    
    // Select up to 2 as logos (if they look like logos) and up to 15 as brand images
    const fallbackLogos: CrawledImage[] = [];
    const fallbackBrandImages: CrawledImage[] = [];
    
    for (const img of fallbackCandidates) {
      // Check if it looks like a logo (small/medium size, or has "logo" in URL/filename/alt)
      const urlLower = img.url.toLowerCase();
      const filenameLower = (img.url.split("/").pop() || "").toLowerCase();
      const altLower = (img.alt || "").toLowerCase();
      const looksLikeLogo = (img.width && img.height && img.width < 400 && img.height < 400) ||
                            filenameLower.includes("logo") ||
                            altLower.includes("logo") ||
                            urlLower.includes("logo");
      
      if (looksLikeLogo && fallbackLogos.length < 2) {
        // Assign role as "logo" and mark as fallback
        fallbackLogos.push({ ...img, role: "logo" });
      } else if (fallbackBrandImages.length < 15) {
        // Assign role as "photo" if it doesn't have a role, mark as fallback
        fallbackBrandImages.push({ ...img, role: img.role || "photo" });
      }
      
      // Stop if we have enough images
      if (fallbackLogos.length >= 2 && fallbackBrandImages.length >= 15) {
        break;
      }
    }
    
    if (fallbackLogos.length > 0 || fallbackBrandImages.length > 0) {
      finalImagesToPersist = [...fallbackLogos, ...fallbackBrandImages];
      fallbackEngaged = true;
      
      console.warn(`[ScrapedImages] Fallback selection completed:`, {
        brandId: brandId,
        totalImages: images.length,
        fallbackBrandImagesSelected: fallbackBrandImages.length,
        fallbackLogosSelected: fallbackLogos.length,
        reason: "totalImages > 0 but no images survived filtering - using conservative fallback",
      });
    } else {
      console.error(`[ScrapedImages] ❌ CRITICAL: Fallback selection found no valid candidates.`, {
        brandId: brandId,
        totalImages: images.length,
        fallbackCandidatesCount: fallbackCandidates.length,
        hint: "All images may be invalid (data URIs, placeholders, or too small)",
      });
    }
  }

  // ✅ PERSIST: Try to persist all selected images (or fallback images if fallback engaged)
  const persistedIds: string[] = [];
  const persistedLogoIds: string[] = []; // Track logos separately for accurate counting
  const persistedBrandImageIds: string[] = []; // Track brand images separately
  
  // ✅ ERROR TRACKING: Track failures by category for better observability
  interface PersistenceFailure {
    url: string;
    reason: string;
    errorCode?: string;
    errorMessage?: string;
    category: 'duplicate' | 'quota' | 'database' | 'validation' | 'network' | 'unknown';
  }
  const failures: PersistenceFailure[] = [];

  // Determine logo count for fallback images
  const fallbackLogoCount = fallbackEngaged ? finalImagesToPersist.filter(img => img.role === "logo").length : selectedLogos.length;

  for (let i = 0; i < finalImagesToPersist.length; i++) {
    const image = finalImagesToPersist[i];
    if (!image) break;
    
    // ✅ CRITICAL FIX: Determine if this is a logo based on ROLE, not index
    // This ensures logos are always categorized correctly, even if there are more than 2
    const isLogo = image.role === "logo";
    
    // Generate hash from URL for duplicate detection (outside try block for error handling)
    const hash = crypto.createHash("sha256").update(image.url).digest("hex");
    
    try {
      
      // ✅ CRITICAL FIX: DETERMINE CATEGORY based on role, not index
      // Logos MUST go to category = "logos", everything else to category = "images"
      let category: "logos" | "images" | "graphics" = "images";
      if (isLogo || image.role === "logo") {
        // ✅ ENFORCE: Any image with role="logo" MUST be category="logos"
        category = "logos";
      } else if (image.role === "hero" || image.role === "photo" || image.role === "team" || image.role === "subject" || image.role === "other") {
        category = "images";
      } else {
        // ✅ SAFETY: Default to "images" for unknown roles, but log a warning
        console.warn(`[ScrapedImages] Unknown role "${image.role}" for image, defaulting to category="images"`, {
          url: image.url.substring(0, 80),
          role: image.role,
        });
        category = "images";
      }
      
      // ✅ DOUBLE-CHECK: If category is "logos" but role is not "logo", fix it
      if (category === "logos" && image.role !== "logo") {
        console.warn(`[ScrapedImages] ⚠️ Category mismatch: category="logos" but role="${image.role}", fixing role`, {
          url: image.url.substring(0, 80),
        });
        // Force role to "logo" to match category
        image.role = "logo";
      }
      
      // ✅ DOUBLE-CHECK: If role is "logo" but category is not "logos", fix it
      if (image.role === "logo" && category !== "logos") {
        console.warn(`[ScrapedImages] ⚠️ Category mismatch: role="logo" but category="${category}", fixing category`, {
          url: image.url.substring(0, 80),
        });
        category = "logos";
      }

      // ✅ FIX: Use robust filename derivation helper
      const filename = deriveFilenameFromUrl(image.url);

      // ✅ CRITICAL FIX: Create metadata with source='scrape' and category
      // Include category in metadata for easier filtering in API/frontend
      const metadata = {
        source: "scrape" as const,
        width: image.width || undefined,
        height: image.height || undefined,
        alt: image.alt || undefined,
        role: image.role || "other",
        category: category, // ✅ Include category in metadata for filtering
        scrapedUrl: image.url,
        scrapedAt: new Date().toISOString(),
        ...(fallbackEngaged ? { fallbackSelected: true } : {}), // Mark fallback images
      };

      // Use media_assets table to persist
      // Note: We're storing the external URL directly, not uploading to Supabase Storage
      // This is acceptable for scraped images as they're reference URLs
      // ✅ FIX: Store URL in path column (media_assets table doesn't have url column)
      // The path column will contain the actual image URL for scraped images
      // ✅ FIX (2025-12-10): Infer MIME type from filename instead of hardcoding "image/jpeg"
      const mimeType = inferMimeType(filename);
      const assetRecord = await mediaDB.createMediaAsset(
        brandId,
        finalTenantId,
        filename,
        mimeType, // ✅ Inferred from filename extension
        image.url, // ✅ Store actual URL in path column (for scraped images, path = URL)
        0, // File size unknown for external URLs
        hash,
        image.url, // This will be ignored if url column doesn't exist, but keep for compatibility
        category,
        metadata,
        image.url // Use same URL for thumbnail
      );

      persistedIds.push(assetRecord.id);
      // Track logos vs brand images for accurate counting
      if (isLogo) {
        persistedLogoIds.push(assetRecord.id);
      } else {
        persistedBrandImageIds.push(assetRecord.id);
      }
      console.log(`[ScrapedImages] ✅ Persisted image: ${filename} (${image.url.substring(0, 50)}...)`);
    } catch (error: any) {
      // ✅ CRITICAL FIX: Handle errors gracefully - one failure shouldn't cancel entire batch
      // ✅ ENHANCED: Categorize error for structured logging
      const errorMessage = error?.message || String(error);
      const errorCode = error?.code || 'UNKNOWN_ERROR';
      let failureCategory: PersistenceFailure['category'] = 'unknown';
      let failureReason = errorMessage;
      
      // If duplicate, get the existing asset ID and add it to persistedIds
      if (error?.code === ErrorCode.DUPLICATE_RESOURCE || error?.message?.includes("duplicate") || error?.message?.includes("already exists")) {
        failureCategory = 'duplicate';
        failureReason = 'Image already exists (duplicate hash)';
        // Extract existing asset ID from error details
        const existingAssetId = error?.details?.existingAssetId;
        if (existingAssetId) {
          persistedIds.push(existingAssetId);
          // Track logos vs brand images for duplicates too
          if (isLogo) {
            persistedLogoIds.push(existingAssetId);
          } else {
            persistedBrandImageIds.push(existingAssetId);
          }
          console.log(`[ScrapedImages] Image already exists (using existing): ${image.url.substring(0, 50)}... (ID: ${existingAssetId})`);
        } else {
          // Fallback: query for existing asset by hash
          try {
            const existingAsset = await mediaDB.checkDuplicateAsset(brandId, hash);
            if (existingAsset) {
              persistedIds.push(existingAsset.id);
              // Track logos vs brand images for duplicates too
              if (isLogo) {
                persistedLogoIds.push(existingAsset.id);
              } else {
                persistedBrandImageIds.push(existingAsset.id);
              }
              console.log(`[ScrapedImages] Image already exists (found by hash): ${image.url.substring(0, 50)}... (ID: ${existingAsset.id})`);
            } else {
              console.warn(`[ScrapedImages] ❌ Duplicate detected but couldn't find existing asset: ${image.url.substring(0, 50)}...`);
              failures.push({
                url: image.url,
                reason: 'Duplicate detected but existing asset lookup failed',
                errorCode: errorCode,
                errorMessage: errorMessage,
                category: 'duplicate',
              });
            }
          } catch (lookupError) {
            console.warn(`[ScrapedImages] ❌ Could not lookup existing asset:`, {
              url: image.url.substring(0, 60),
              lookupError: lookupError instanceof Error ? lookupError.message : String(lookupError),
            });
            failures.push({
              url: image.url,
              reason: 'Duplicate lookup failed',
              errorCode: 'DUPLICATE_LOOKUP_ERROR',
              errorMessage: lookupError instanceof Error ? lookupError.message : String(lookupError),
              category: 'duplicate',
            });
          }
        }
        continue; // Skip to next image
      }
      
      // ✅ CRITICAL FIX: Categorize and log quota/storage errors
      // These are non-critical failures that shouldn't block the crawler
      // getStorageUsage() should never throw now, but be defensive
      const isQuotaError = error?.code === ErrorCode.QUOTA_EXCEEDED ||
                          error?.code === 'QUOTA_EXCEEDED' ||
                          error?.message?.toLowerCase().includes('quota') || 
                          error?.message?.toLowerCase().includes('storage') ||
                          error?.message?.includes('Failed to fetch storage quota');
      
      if (isQuotaError) {
        failureCategory = 'quota';
        failureReason = 'Storage quota check failed (non-critical)';
        console.warn(`[ScrapedImages] ⚠️ Quota/storage error (non-blocking) for image:`, {
          url: image.url.substring(0, 80),
          role: image.role,
          errorCode: errorCode,
          errorMessage: errorMessage,
          hint: "Continuing with next image - quota system may not be fully configured",
        });
        failures.push({
          url: image.url,
          reason: failureReason,
          errorCode: errorCode,
          errorMessage: errorMessage,
          category: failureCategory,
        });
        continue; // Skip this image but continue with the rest
      }
      
      // ✅ ENHANCED: Categorize database errors
      const isDatabaseError = error?.code === ErrorCode.DATABASE_ERROR ||
                             error?.code === 'DATABASE_ERROR' ||
                             error?.code === '23505' || // PostgreSQL unique violation
                             error?.code === '23503' || // PostgreSQL foreign key violation
                             error?.code === '42P01' || // PostgreSQL relation does not exist
                             error?.code === 'PGRST204' || // PostgREST no rows
                             error?.code === 'PGRST116' || // PostgREST not found
                             errorMessage?.toLowerCase().includes('database') ||
                             errorMessage?.toLowerCase().includes('connection') ||
                             errorMessage?.toLowerCase().includes('supabase');
      
      if (isDatabaseError) {
        failureCategory = 'database';
        failureReason = 'Database operation failed';
        console.error(`[ScrapedImages] ❌ Database error persisting image:`, {
          url: image.url.substring(0, 80),
          role: image.role,
          errorCode: errorCode,
          errorMessage: errorMessage,
          brandId: brandId,
          tenantId: finalTenantId,
          hint: "This may indicate a database connectivity or schema issue",
        });
        failures.push({
          url: image.url,
          reason: failureReason,
          errorCode: errorCode,
          errorMessage: errorMessage,
          category: failureCategory,
        });
        continue; // Skip this image but continue with the rest
      }
      
      // ✅ ENHANCED: Categorize validation errors
      const isValidationError = error?.code === ErrorCode.INVALID_FORMAT ||
                               error?.code === 'INVALID_FORMAT' ||
                               errorMessage?.toLowerCase().includes('invalid') ||
                               errorMessage?.toLowerCase().includes('validation') ||
                               errorMessage?.toLowerCase().includes('format');
      
      if (isValidationError) {
        failureCategory = 'validation';
        failureReason = 'Image validation failed';
        console.warn(`[ScrapedImages] ⚠️ Validation error persisting image:`, {
          url: image.url.substring(0, 80),
          role: image.role,
          errorCode: errorCode,
          errorMessage: errorMessage,
          hint: "Image may have invalid URL or metadata format",
        });
        failures.push({
          url: image.url,
          reason: failureReason,
          errorCode: errorCode,
          errorMessage: errorMessage,
          category: failureCategory,
        });
        continue;
      }
      
      // ✅ ENHANCED: Categorize network errors
      const isNetworkError = errorMessage?.toLowerCase().includes('network') ||
                            errorMessage?.toLowerCase().includes('timeout') ||
                            errorMessage?.toLowerCase().includes('econnrefused') ||
                            errorMessage?.toLowerCase().includes('fetch');
      
      if (isNetworkError) {
        failureCategory = 'network';
        failureReason = 'Network error during persistence';
        console.warn(`[ScrapedImages] ⚠️ Network error persisting image:`, {
          url: image.url.substring(0, 80),
          role: image.role,
          errorCode: errorCode,
          errorMessage: errorMessage,
          hint: "Network connectivity issue - may be transient",
        });
        failures.push({
          url: image.url,
          reason: failureReason,
          errorCode: errorCode,
          errorMessage: errorMessage,
          category: failureCategory,
        });
        continue;
      }
      
      // ✅ DEFAULT: Unknown error category
      failureCategory = 'unknown';
      failureReason = 'Unknown error during persistence';
      console.error(`[ScrapedImages] ❌ Unknown error persisting image:`, {
        url: image.url.substring(0, 100),
        role: image.role,
        errorCode: errorCode,
        errorMessage: errorMessage,
        errorType: error?.constructor?.name || typeof error,
        stack: error?.stack?.substring(0, 200),
        hint: "Unexpected error - review error details above",
      });
      failures.push({
        url: image.url,
        reason: failureReason,
        errorCode: errorCode,
        errorMessage: errorMessage,
        category: failureCategory,
      });
      // Continue with other images
    }
  }

  // ✅ LOGGING: Summary of persistence with failure breakdown
  // Use tracked arrays for accurate counts (handles cases where some images fail to persist)
  const logosPersisted = persistedLogoIds.length;
  const brandImagesPersisted = persistedBrandImageIds.length;
  const totalAttempted = finalImagesToPersist.length;
  const totalSucceeded = persistedIds.length;
  const totalFailed = failures.length;
  
  // ✅ ENHANCED: Count failures by category
  const failuresByCategory = failures.reduce((acc, failure) => {
    acc[failure.category] = (acc[failure.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // ✅ CRITICAL: Distinguish between "filtered out by design" vs "failed to persist"
  const filteredOutByDesign = images.length - validImages.length;
  const selectedButNotPersisted = totalAttempted - totalSucceeded;
  
  // Determine actual logo/brand image counts (accounting for fallback)
  const actualLogosSelected = fallbackEngaged ? finalImagesToPersist.filter(img => img.role === "logo").length : selectedLogos.length;
  const actualBrandImagesSelected = fallbackEngaged ? finalImagesToPersist.filter(img => img.role !== "logo").length : selectedBrandImages.length;
  
  // ✅ LOGGING: Comprehensive summary with failure breakdown
  if (totalFailed > 0) {
    console.warn(`[ScrapedImages] ⚠️ Persistence complete with ${totalFailed} failure(s)`, {
      brandId: brandId,
      tenantId: finalTenantId,
      // Image counts
      totalImagesAvailable: images.length,
      filteredOutByDesign: filteredOutByDesign,
      validImagesAfterFilter: validImages.length,
      totalAttempted: totalAttempted,
      totalSucceeded: totalSucceeded,
      totalFailed: totalFailed,
      // Fallback indicator
      fallbackEngaged: fallbackEngaged,
      // Logo counts
      logosSelected: actualLogosSelected,
      logosPersisted: logosPersisted,
      logosFailed: actualLogosSelected - logosPersisted,
      // Brand image counts
      brandImagesSelected: actualBrandImagesSelected,
      brandImagesPersisted: brandImagesPersisted,
      brandImagesFailed: actualBrandImagesSelected - brandImagesPersisted,
      // Failure breakdown
      failuresByCategory: failuresByCategory,
      // Target counts
      targetLogos: 2,
      targetBrandImages: 15,
    });
    
    // ✅ ENHANCED: Log first 3 failures in detail for debugging
    const sampleFailures = failures.slice(0, 3);
    sampleFailures.forEach((failure, idx) => {
      console.error(`[ScrapedImages] Failure ${idx + 1}/${totalFailed}:`, {
        category: failure.category,
        reason: failure.reason,
        errorCode: failure.errorCode,
        errorMessage: failure.errorMessage?.substring(0, 200),
        url: failure.url.substring(0, 100),
      });
    });
    
    if (failures.length > 3) {
      console.warn(`[ScrapedImages] ... and ${failures.length - 3} more failure(s) (check logs above for details)`);
    }
  } else {
    console.log(`[ScrapedImages] ✅ Persistence complete (all images persisted)`, {
      brandId: brandId,
      tenantId: finalTenantId,
      totalImagesAvailable: images.length,
      filteredOutByDesign: filteredOutByDesign,
      totalAttempted: totalAttempted,
      totalPersisted: totalSucceeded,
      fallbackEngaged: fallbackEngaged,
      logosPersisted: logosPersisted,
      brandImagesPersisted: brandImagesPersisted,
      targetLogos: 2,
      targetBrandImages: 15,
    });
  }
  
  // ✅ CRITICAL: Log warning if zero images persisted despite having images to persist
  // This is the key indicator for "Found X images but none were persisted"
  if (totalAttempted > 0 && totalSucceeded === 0) {
    console.error(`[ScrapedImages] ❌ CRITICAL: Attempted to persist ${totalAttempted} image(s) but NONE succeeded.`, {
      brandId: brandId,
      tenantId: finalTenantId,
      totalAttempted: totalAttempted,
      totalFailed: totalFailed,
      failuresByCategory: failuresByCategory,
      sampleFailures: failures.slice(0, 2).map(f => ({
        category: f.category,
        reason: f.reason,
        errorCode: f.errorCode,
      })),
      hint: "Check failure details above. This indicates a systemic issue (DB connectivity, schema mismatch, or quota system error).",
    });
  }

  return persistedIds;
}

/**
 * Transfer scraped images from temporary brandId to real brandId
 * 
 * CRITICAL RECONCILIATION FUNCTION: This is called when a brand is created with a final UUID
 * that differs from the temporary brandId used during onboarding.
 * 
 * This is used during onboarding when:
 * 1. Images are scraped with temporary brandId (e.g., brand_1234567890)
 * 2. Real brand is created with UUID (e.g., "550e8400-e29b-41d4-a716-446655440000")
 * 3. Images need to be transferred to the real brandId
 * 
 * @param fromBrandId - Temporary brandId (source, e.g., "brand_1234567890")
 * @param toBrandId - Real brandId (destination, UUID)
 * @returns Number of images transferred
 */
export async function transferScrapedImages(
  fromBrandId: string,
  toBrandId: string
): Promise<number> {
  if (!fromBrandId || !toBrandId || fromBrandId === toBrandId) {
    console.log(`[ScrapedImages] Transfer skipped: fromBrandId=${fromBrandId}, toBrandId=${toBrandId}, same=${fromBrandId === toBrandId}`);
    return 0;
  }

  try {
    console.log(`[ScrapedImages] Starting reconciliation: ${fromBrandId} → ${toBrandId}`);
    
    // Get all scraped images from the temporary brandId
    const scrapedImages = await getScrapedImages(fromBrandId);
    
    if (scrapedImages.length === 0) {
      console.log(`[ScrapedImages] No images to transfer from ${fromBrandId} to ${toBrandId}`);
      return 0;
    }

    // Get tenantId from the destination brand
    const { data: brand } = await supabase
      .from("brands")
      .select("tenant_id")
      .eq("id", toBrandId)
      .single();

    if (!brand || !(brand as any).tenant_id) {
      console.error(`[ScrapedImages] CRITICAL: Cannot transfer - destination brand ${toBrandId} not found or has no tenant_id`);
      return 0;
    }

    const tenantId = (brand as any).tenant_id;
    let transferredCount = 0;
    let failedCount = 0;

    // Update each image's brand_id and tenant_id in a single batch update
    // Use a transaction-like approach: update all at once
    const imageIds = scrapedImages.map(img => img.id);
    
    const { data: updateResult, error: batchError } = await supabase
      .from("media_assets")
      .update({
        brand_id: toBrandId,
        tenant_id: tenantId,
        updated_at: new Date().toISOString(),
      })
      .in("id", imageIds)
      .select("id");

    if (batchError) {
      console.error(`[ScrapedImages] Batch update failed:`, batchError);
      // Fallback to individual updates
      for (const image of scrapedImages) {
        try {
          const { error } = await supabase
            .from("media_assets")
            .update({
              brand_id: toBrandId,
              tenant_id: tenantId,
              updated_at: new Date().toISOString(),
            })
            .eq("id", image.id);

          if (error) {
            console.warn(`[ScrapedImages] Failed to transfer image ${image.id}:`, error);
            failedCount++;
          } else {
            transferredCount++;
          }
        } catch (error) {
          console.warn(`[ScrapedImages] Error transferring image ${image.id}:`, error);
          failedCount++;
        }
      }
    } else {
      transferredCount = updateResult?.length || 0;
      failedCount = scrapedImages.length - transferredCount;
    }

    // ✅ LOGGING: Reconciliation summary
    console.log(`[ScrapedImages] Reconciliation complete`, {
      fromBrandId: fromBrandId,
      toBrandId: toBrandId,
      tenantId: tenantId,
      totalImages: scrapedImages.length,
      transferredCount: transferredCount,
      failedCount: failedCount,
    });

    if (failedCount > 0) {
      console.warn(`[ScrapedImages] WARNING: ${failedCount} images failed to transfer. These may be orphaned.`);
    }

    return transferredCount;
  } catch (error) {
    console.error(`[ScrapedImages] CRITICAL: Error transferring images from ${fromBrandId} to ${toBrandId}:`, error);
    return 0;
  }
}

/**
 * Get scraped images for a brand (source='scrape')
 */
export async function getScrapedImages(
  brandId: string,
  role?: "logo" | "hero" | "other",
  category?: "logos" | "images" | "graphics",
  includeExcluded?: boolean // Optional: include excluded assets (default: false)
): Promise<Array<{
  id: string;
  url: string;
  filename: string;
  metadata?: Record<string, unknown>;
  excluded?: boolean;
}>> {
  try {
    // ✅ RESILIENT QUERY: Try to select metadata, category, and excluded (may not exist in all schemas)
    // For scraped images, URL is stored in path column (external URLs)
    // We'll filter for HTTP URLs in JavaScript to identify scraped images
    const query = supabase
      .from("media_assets")
      .select("id, path, filename, metadata, category, excluded")
      .eq("brand_id", brandId)
      .eq("status", "active");
    
    // ✅ ENHANCED: Filter by category if specified
    if (category) {
      query.eq("category", category);
    }
    
    // ✅ NEW: Filter out excluded assets by default (unless includeExcluded is true)
    if (!includeExcluded) {
      // Handle both false and null/undefined (backward compatibility with old data)
      query.or("excluded.is.null,excluded.eq.false");
    }

    const { data, error } = await query
      .order("created_at", { ascending: false });

    if (error) {
      // If it's a metadata column error, retry without metadata
      if (error.code === "42703" || error.code === "42704" || error.message?.includes("metadata")) {
        console.warn("[ScrapedImages] metadata column not available, retrying without it");
        // Retry query without metadata
        const retryQuery = supabase
          .from("media_assets")
          .select("id, path, filename")
          .eq("brand_id", brandId)
          .eq("status", "active");
        
        const { data: retryData, error: retryError } = await retryQuery
          .order("created_at", { ascending: false });
        
        if (retryError) {
          console.error("[ScrapedImages] Error querying scraped images (retry):", retryError);
          return [];
        }
        
        // Use retry data (without metadata)
        const scrapedImages = (retryData || []).filter((asset: any) => {
          const path = asset.path || "";
          return path.startsWith("http://") || path.startsWith("https://");
        });
        
        return scrapedImages.map((asset: any) => ({
          id: asset.id,
          url: asset.path || "",
          filename: asset.filename,
          metadata: undefined, // Not available
        }));
      }
      
      // If it's not a metadata error, it's a real database error
      console.error("[ScrapedImages] Error querying scraped images:", error);
      return [];
    }

    if (!data || data.length === 0) {
      // ✅ LOGGING: Log when no images found (helps debug missing images)
      console.log(`[ScrapedImages] No media assets found for brand`, {
        brandId: brandId,
        role: role || "all",
      });
      return [];
    }

    // ✅ LOGGING: Log successful query
    console.log(`[ScrapedImages] Query successful, filtering for scraped images`, {
      brandId: brandId,
      role: role || "all",
      totalAssets: data.length,
      samplePaths: data.slice(0, 3).map((a: any) => a.path?.substring(0, 50)) || [],
    });
    
    // ✅ CRITICAL FIX: Filter scraped images with strict role/category checks
    // Scraped images have HTTP URLs in path column (external URLs)
    // Uploaded images have Supabase storage paths (bucket names, not HTTP URLs)
    const scrapedImages = data.filter((asset: any) => {
      const path = asset.path || "";
      // Scraped images have full HTTP URLs in path (external URLs)
      const isScraped = path.startsWith("http://") || path.startsWith("https://");
      if (!isScraped) return false;
      
      // ✅ ENHANCED: Check category from database (most reliable)
      const dbCategory = asset.category || "";
      const metadata = asset.metadata || {};
      const metadataRole = metadata.role || "";
      const metadataCategory = metadata.category || "";
      
      // ✅ STRICT: If category filter is specified, enforce it
      if (category) {
        if (dbCategory !== category && metadataCategory !== category) {
          return false;
        }
      }
      
      // ✅ STRICT: If role filter is specified, enforce it
      if (role === "logo") {
        // Must be logo by role OR category
        return metadataRole === "logo" || dbCategory === "logos" || metadataCategory === "logos";
      } else if (role) {
        // For other roles, check metadata role
        return metadataRole === role;
      }
      
      return true;
    });
    
    console.log(`[ScrapedImages] Filtered to ${scrapedImages.length} scraped images (from ${data.length} total assets)`, {
      brandId,
      role: role || "all",
      scrapedCount: scrapedImages.length,
    });
    
    return scrapedImages.map((asset: any) => ({
      id: asset.id,
      url: asset.path || "", // For scraped images, path IS the URL
      filename: asset.filename,
      metadata: asset.metadata || undefined, // Include metadata if available
      excluded: asset.excluded || false, // Include excluded flag
    }));
  } catch (error) {
    console.error("[ScrapedImages] Error getting scraped images:", error);
    console.error("[ScrapedImages] Debug info:", {
      brandId: brandId,
      role: role,
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

/**
 * Exclude an asset from the brand (soft delete)
 * Sets excluded = true for the specified asset
 * 
 * @param assetId - The asset ID to exclude
 * @param brandId - The brand ID (for validation)
 * @returns true if successful, false if failed
 */
export async function excludeAsset(
  assetId: string,
  brandId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("media_assets")
      .update({ excluded: true, updated_at: new Date().toISOString() })
      .eq("id", assetId)
      .eq("brand_id", brandId);
    
    if (error) {
      console.error("[ScrapedImages] Error excluding asset:", error);
      return false;
    }
    
    console.log(`[ScrapedImages] ✅ Asset excluded: ${assetId} for brand ${brandId}`);
    return true;
  } catch (error) {
    console.error("[ScrapedImages] Error excluding asset:", error);
    return false;
  }
}

/**
 * Restore an excluded asset (un-exclude)
 * Sets excluded = false for the specified asset
 * 
 * @param assetId - The asset ID to restore
 * @param brandId - The brand ID (for validation)
 * @returns true if successful, false if failed
 */
export async function restoreAsset(
  assetId: string,
  brandId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("media_assets")
      .update({ excluded: false, updated_at: new Date().toISOString() })
      .eq("id", assetId)
      .eq("brand_id", brandId);
    
    if (error) {
      console.error("[ScrapedImages] Error restoring asset:", error);
      return false;
    }
    
    console.log(`[ScrapedImages] ✅ Asset restored: ${assetId} for brand ${brandId}`);
    return true;
  } catch (error) {
    console.error("[ScrapedImages] Error restoring asset:", error);
    return false;
  }
}

