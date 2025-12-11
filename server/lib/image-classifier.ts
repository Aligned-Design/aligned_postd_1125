/**
 * Image Classifier
 * 
 * Unified classification layer for crawled images.
 * Determines whether an image is a logo, brand image, or icon based on
 * multiple signals: size, aspect ratio, color distribution, HTML context, filenames, alt text.
 * 
 * This module centralizes classification logic that was previously scattered across:
 * - server/workers/brand-crawler.ts (categorizeImage, isLogo)
 * - server/lib/scraped-images-service.ts (filter logic)
 * 
 * @see shared/image-classification.ts for type definitions
 * @see docs/POSTD_PRODUCT_DEFINITION_AND_GUARDRAILS.md
 */

import {
  ImageRole,
  ImageCategory,
  ImageSourceType,
  ClassificationSignals,
  ClassifiedImage,
  CLASSIFICATION_THRESHOLDS,
  ICON_PACK_PATTERNS,
  GENERIC_ICON_PATTERNS,
  SOCIAL_PLATFORM_PATTERNS,
  PLATFORM_VENDOR_PATTERNS,
  PARTNER_SECTION_PATTERNS,
  EXCLUDED_ROLES,
  roleToCategory,
  shouldDisplayInBrandGuide,
} from "@shared/image-classification";

/**
 * Input for image classification
 */
export interface ImageClassificationInput {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
  
  // Context from page
  inHeaderOrNav?: boolean;
  inFooter?: boolean;
  inHeroOrAboveFold?: boolean;
  inAffiliateOrPartnerSection?: boolean;
  offsetTop?: number;
  
  // Source info
  sourceType?: ImageSourceType;
  parentClasses?: string[];
  parentIds?: string[];
  
  // Brand context
  brandName?: string;
  pageType?: "main" | "team" | "about" | "other";
  
  // Legacy role (from existing crawler)
  legacyRole?: string;
}

/**
 * Classification result with detailed breakdown
 */
export interface ClassificationResult extends ClassifiedImage {
  debugInfo?: {
    matchedPatterns: string[];
    sizeCategory: "tiny" | "small" | "medium" | "large" | "hero";
    locationScore: number;
    contentScore: number;
    negativeSignals: string[];
  };
}

/**
 * Check if URL/filename/alt matches any pattern in the list
 */
function matchesPatterns(
  input: { url?: string; filename?: string; alt?: string },
  patterns: string[]
): string[] {
  const matches: string[] = [];
  const urlLower = input.url?.toLowerCase() || "";
  const filenameLower = input.filename?.toLowerCase() || "";
  const altLower = input.alt?.toLowerCase() || "";
  
  for (const pattern of patterns) {
    if (
      urlLower.includes(pattern) ||
      filenameLower.includes(pattern) ||
      altLower.includes(pattern)
    ) {
      matches.push(pattern);
    }
  }
  
  return matches;
}

/**
 * Extract filename from URL
 */
function extractFilename(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const filename = pathname.split("/").pop() || "";
    return filename.toLowerCase();
  } catch {
    return "";
  }
}

/**
 * Calculate brand name match score
 * Returns 0-2 based on how well the image matches the brand name
 */
function calculateBrandMatchScore(
  input: ImageClassificationInput,
  brandName?: string
): number {
  if (!brandName) return 0;
  
  const brandNameLower = brandName.toLowerCase();
  const brandNameNoSpaces = brandNameLower.replace(/\s+/g, "");
  const brandNameHyphenated = brandNameLower.replace(/\s+/g, "-");
  
  const altLower = input.alt?.toLowerCase() || "";
  const filename = extractFilename(input.url);
  const urlLower = input.url.toLowerCase();
  
  let score = 0;
  
  // +1 if alt text contains brand name
  if (
    altLower.includes(brandNameLower) ||
    altLower.includes(brandNameNoSpaces) ||
    altLower.includes(brandNameHyphenated)
  ) {
    score += 1;
  }
  
  // +1 if filename/path contains brand name
  if (
    filename.includes(brandNameLower) ||
    filename.includes(brandNameNoSpaces) ||
    filename.includes(brandNameHyphenated) ||
    urlLower.includes(brandNameLower) ||
    urlLower.includes(brandNameNoSpaces) ||
    urlLower.includes(brandNameHyphenated)
  ) {
    score += 1;
  }
  
  return score;
}

/**
 * Categorize image size
 */
function categorizeSizeCategory(
  width?: number,
  height?: number
): "tiny" | "small" | "medium" | "large" | "hero" {
  if (!width || !height) return "medium"; // Unknown size, assume medium
  
  const area = width * height;
  const maxDim = Math.max(width, height);
  
  if (area < CLASSIFICATION_THRESHOLDS.MAX_ICON_AREA) return "tiny";
  if (maxDim < CLASSIFICATION_THRESHOLDS.MIN_BRAND_IMAGE_SIZE) return "small";
  if (area < CLASSIFICATION_THRESHOLDS.MIN_HERO_AREA) return "medium";
  if (maxDim >= CLASSIFICATION_THRESHOLDS.MIN_HERO_SIZE) return "hero";
  return "large";
}

/**
 * Check if image looks like a UI icon
 */
function isLikelyIcon(input: ImageClassificationInput): {
  isIcon: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];
  const filename = extractFilename(input.url);
  
  // Check size - tiny images are likely icons
  const sizeCategory = categorizeSizeCategory(input.width, input.height);
  if (sizeCategory === "tiny") {
    reasons.push("tiny_size");
  }
  
  // Check if in icon pack path
  const iconPackMatches = matchesPatterns(
    { url: input.url },
    ICON_PACK_PATTERNS
  );
  if (iconPackMatches.length > 0) {
    reasons.push(`icon_path:${iconPackMatches[0]}`);
  }
  
  // Check for generic icon patterns in filename/alt
  const genericMatches = matchesPatterns(
    { filename, alt: input.alt },
    GENERIC_ICON_PATTERNS
  );
  if (genericMatches.length > 0 && sizeCategory !== "large" && sizeCategory !== "hero") {
    reasons.push(`icon_pattern:${genericMatches[0]}`);
  }
  
  // Small square images are often icons (unless they're logos)
  if (
    input.width &&
    input.height &&
    input.width === input.height &&
    input.width < 100
  ) {
    const hasLogoIndicator = 
      filename.includes("logo") || 
      (input.alt?.toLowerCase() || "").includes("logo");
    
    if (!hasLogoIndicator) {
      reasons.push("small_square");
    }
  }
  
  return {
    isIcon: reasons.length > 0,
    reasons,
  };
}

/**
 * Check if image looks like a social icon
 */
function isLikelySocialIcon(input: ImageClassificationInput): boolean {
  const filename = extractFilename(input.url);
  const matches = matchesPatterns(
    { url: input.url, filename, alt: input.alt },
    SOCIAL_PLATFORM_PATTERNS
  );
  return matches.length > 0;
}

/**
 * Check if image looks like a platform logo (e.g., "Powered by Squarespace")
 */
function isLikelyPlatformLogo(input: ImageClassificationInput): boolean {
  const filename = extractFilename(input.url);
  
  // Check for vendor patterns
  const vendorMatches = matchesPatterns(
    { url: input.url, filename, alt: input.alt },
    PLATFORM_VENDOR_PATTERNS
  );
  
  if (vendorMatches.length === 0) return false;
  
  // Also need logoish pattern (logo, badge, icon, powered-by)
  const logoishPatterns = [
    "logo", "logotype", "brandmark", "mark", "badge", "icon",
    "favicon", "powered-by", "powered_by", "footer-logo", "header-logo",
  ];
  
  const logoishMatches = matchesPatterns(
    { url: input.url, filename, alt: input.alt },
    logoishPatterns
  );
  
  // Only classify as platform_logo if BOTH vendor AND logoish patterns present
  // AND image is small (large images are likely legitimate brand images)
  if (logoishMatches.length > 0) {
    const isLarge = 
      input.width && input.height && 
      (input.width > 300 || input.height > 300);
    
    return !isLarge; // Only platform_logo if not large
  }
  
  return false;
}

/**
 * Check if image looks like a partner/affiliate logo
 */
function isLikelyPartnerLogo(input: ImageClassificationInput): boolean {
  // Explicit location signal is strongest
  if (input.inAffiliateOrPartnerSection) return true;
  
  const filename = extractFilename(input.url);
  const matches = matchesPatterns(
    { url: input.url, filename, alt: input.alt },
    PARTNER_SECTION_PATTERNS
  );
  
  // Small images with partner indicators are likely partner logos
  if (matches.length > 0) {
    const isSmall = 
      input.width && input.height && 
      Math.max(input.width, input.height) < 120;
    
    return isSmall;
  }
  
  return false;
}

/**
 * Check if image looks like a primary brand logo
 */
function isLikelyLogo(input: ImageClassificationInput): {
  isLogo: boolean;
  confidence: number;
  reasons: string[];
} {
  const reasons: string[] = [];
  let confidence = 0;
  const filename = extractFilename(input.url);
  const altLower = input.alt?.toLowerCase() || "";
  const urlLower = input.url.toLowerCase();
  
  // Check for "logo" in filename/alt/url - explicit "logo" keyword is strong signal
  if (filename.includes("logo")) {
    reasons.push("filename_logo");
    confidence += 0.5;  // Strong signal - explicit "logo" in filename
  }
  if (altLower.includes("logo")) {
    reasons.push("alt_logo");
    confidence += 0.5;  // Strong signal - explicit "logo" in alt text
  }
  if (urlLower.includes("/logo")) {
    reasons.push("path_logo");
    confidence += 0.3;
  }
  
  // Check for brand name in filename/alt
  if (input.brandName) {
    const brandScore = calculateBrandMatchScore(input, input.brandName);
    if (brandScore >= 1) {
      reasons.push("brand_match");
      confidence += 0.2 * brandScore;
    }
  }
  
  // Location signals
  if (input.inHeaderOrNav) {
    reasons.push("in_header_nav");
    confidence += 0.3;
  }
  
  // Size check - logos should be reasonable size
  if (input.width && input.height) {
    const maxDim = Math.max(input.width, input.height);
    
    // Too small = icon, too large = brand image
    if (maxDim >= CLASSIFICATION_THRESHOLDS.MIN_LOGO_SIZE && 
        maxDim <= CLASSIFICATION_THRESHOLDS.MAX_LOGO_SIZE) {
      reasons.push("logo_size_range");
      confidence += 0.1;
    }
    
    // Oversized "logo" should be reclassified
    if (maxDim > CLASSIFICATION_THRESHOLDS.MAX_LOGO_SIZE) {
      confidence -= 0.3;
      reasons.push("oversized");
    }
  }
  
  // Brand-related keywords
  const logoKeywords = ["brand", "brandmark", "logotype", "wordmark", "symbol", "sig", "signature"];
  const keywordMatches = matchesPatterns({ filename, alt: input.alt }, logoKeywords);
  if (keywordMatches.length > 0) {
    reasons.push(`keyword:${keywordMatches[0]}`);
    confidence += 0.15;
  }
  
  // Source type bonus
  if (input.sourceType === "svg") {
    reasons.push("svg_source");
    confidence += 0.1;
  }
  
  return {
    isLogo: confidence >= 0.3,
    confidence: Math.min(confidence, 1),
    reasons,
  };
}

/**
 * Check if image looks like a hero/banner image
 */
function isLikelyHero(input: ImageClassificationInput): boolean {
  if (!input.width || !input.height) return false;
  
  const area = input.width * input.height;
  
  // Large images near top of page
  if (area >= CLASSIFICATION_THRESHOLDS.MIN_HERO_AREA) {
    return true;
  }
  
  // Wide banner format
  if (input.width >= CLASSIFICATION_THRESHOLDS.MIN_HERO_WIDTH) {
    return true;
  }
  
  // Explicit hero location
  if (input.inHeroOrAboveFold) {
    return true;
  }
  
  return false;
}

/**
 * Main classification function
 * 
 * Classifies an image into one of the defined roles based on multiple signals.
 * This is the single source of truth for image classification in POSTD.
 */
export function classifyImage(input: ImageClassificationInput): ClassificationResult {
  const filename = extractFilename(input.url);
  const sizeCategory = categorizeSizeCategory(input.width, input.height);
  const brandMatchScore = calculateBrandMatchScore(input, input.brandName);
  
  const signals: ClassificationSignals = {
    width: input.width,
    height: input.height,
    area: input.width && input.height ? input.width * input.height : undefined,
    aspectRatio: input.width && input.height ? input.width / input.height : undefined,
    inHeaderOrNav: input.inHeaderOrNav,
    inFooter: input.inFooter,
    inHeroOrAboveFold: input.inHeroOrAboveFold,
    inAffiliateOrPartnerSection: input.inAffiliateOrPartnerSection,
    offsetTop: input.offsetTop,
    alt: input.alt,
    filename,
    url: input.url,
    brandMatchScore,
    sourceType: input.sourceType,
    parentClasses: input.parentClasses,
    parentIds: input.parentIds,
  };
  
  const matchedPatterns: string[] = [];
  const negativeSignals: string[] = [];
  let role: ImageRole = "other";
  let confidence = 0.5;
  
  // === EXCLUSION CHECKS FIRST ===
  
  // 1. Social icons (always excluded)
  if (isLikelySocialIcon(input)) {
    return buildResult(input, "social_icon", 0.9, signals, sizeCategory, matchedPatterns, negativeSignals);
  }
  
  // 2. Platform logos (always excluded)
  if (isLikelyPlatformLogo(input)) {
    return buildResult(input, "platform_logo", 0.8, signals, sizeCategory, matchedPatterns, negativeSignals);
  }
  
  // 3. Partner/affiliate logos (excluded from primary brand imagery)
  if (isLikelyPartnerLogo(input)) {
    return buildResult(input, "partner_logo", 0.8, signals, sizeCategory, matchedPatterns, negativeSignals);
  }
  
  // 4. UI icons (excluded from Brand Guide)
  const iconCheck = isLikelyIcon(input);
  if (iconCheck.isIcon) {
    matchedPatterns.push(...iconCheck.reasons);
    
    // Only classify as icon if no strong logo signals
    const logoCheck = isLikelyLogo(input);
    if (!logoCheck.isLogo || logoCheck.confidence < 0.5) {
      return buildResult(input, "icon", 0.7, signals, sizeCategory, matchedPatterns, negativeSignals);
    } else {
      // Has icon patterns but also logo signals - continue to logo check
      negativeSignals.push("icon_but_logo_signals");
    }
  }
  
  // === POSITIVE CLASSIFICATION ===
  
  // 5. Logo detection
  const logoCheck = isLikelyLogo(input);
  if (logoCheck.isLogo) {
    matchedPatterns.push(...logoCheck.reasons);
    
    // Validate size - oversized logos should be brand images
    if (input.width && input.height) {
      const maxDim = Math.max(input.width, input.height);
      const area = input.width * input.height;
      
      if (maxDim > CLASSIFICATION_THRESHOLDS.MAX_LOGO_SIZE || 
          area > CLASSIFICATION_THRESHOLDS.MAX_LOGO_AREA) {
        // Oversized - reclassify as hero or brand_image
        negativeSignals.push("oversized_for_logo");
        if (isLikelyHero(input)) {
          return buildResult(input, "hero", 0.7, signals, sizeCategory, matchedPatterns, negativeSignals);
        }
        return buildResult(input, "brand_image", 0.6, signals, sizeCategory, matchedPatterns, negativeSignals);
      }
    }
    
    // Valid logo size range
    return buildResult(input, "logo", logoCheck.confidence, signals, sizeCategory, matchedPatterns, negativeSignals);
  }
  
  // 6. Hero images
  if (isLikelyHero(input)) {
    matchedPatterns.push("hero_size");
    return buildResult(input, "hero", 0.7, signals, sizeCategory, matchedPatterns, negativeSignals);
  }
  
  // 7. Team photos (based on page type and content)
  if (input.pageType === "team" || input.pageType === "about") {
    const altLower = input.alt?.toLowerCase() || "";
    const teamPatterns = ["team", "staff", "member", "founder", "ceo", "director", "employee", "people"];
    const teamMatches = teamPatterns.filter(p => altLower.includes(p) || filename.includes(p));
    
    if (teamMatches.length > 0) {
      matchedPatterns.push(`team:${teamMatches[0]}`);
      return buildResult(input, "team", 0.7, signals, sizeCategory, matchedPatterns, negativeSignals);
    }
  }
  
  // 8. Product/subject images
  const productPatterns = ["product", "service", "feature", "offering"];
  const productMatches = matchesPatterns({ filename, alt: input.alt }, productPatterns);
  if (productMatches.length > 0) {
    matchedPatterns.push(`product:${productMatches[0]}`);
    return buildResult(input, "product", 0.6, signals, sizeCategory, matchedPatterns, negativeSignals);
  }
  
  // 9. Default to brand_image for medium+ sized images
  if (sizeCategory === "medium" || sizeCategory === "large" || sizeCategory === "hero") {
    return buildResult(input, "brand_image", 0.5, signals, sizeCategory, matchedPatterns, negativeSignals);
  }
  
  // 10. Small images default to "other"
  return buildResult(input, "other", 0.4, signals, sizeCategory, matchedPatterns, negativeSignals);
}

/**
 * Build classification result object
 */
function buildResult(
  input: ImageClassificationInput,
  role: ImageRole,
  confidence: number,
  signals: ClassificationSignals,
  sizeCategory: "tiny" | "small" | "medium" | "large" | "hero",
  matchedPatterns: string[],
  negativeSignals: string[]
): ClassificationResult {
  const category = roleToCategory(role);
  const shouldDisplay = shouldDisplayInBrandGuide(role);
  
  // Calculate display priority
  let displayPriority = 0;
  if (role === "logo") displayPriority = 1000;
  else if (role === "hero") displayPriority = 800;
  else if (role === "team") displayPriority = 700;
  else if (role === "product") displayPriority = 600;
  else if (role === "brand_image") displayPriority = 500;
  else if (role === "background") displayPriority = 200;
  else if (role === "other") displayPriority = 100;
  
  // Adjust priority based on size
  if (input.width && input.height) {
    const area = input.width * input.height;
    displayPriority += Math.min(area / 10000, 50); // Up to +50 for large images
  }
  
  // Adjust priority based on location
  if (input.inHeaderOrNav) displayPriority += 100;
  if (input.inHeroOrAboveFold) displayPriority += 50;
  
  return {
    url: input.url,
    role,
    category,
    confidence,
    signals,
    shouldDisplay,
    displayPriority,
    alt: input.alt,
    width: input.width,
    height: input.height,
    filename: extractFilename(input.url),
    sourceType: input.sourceType,
    debugInfo: {
      matchedPatterns,
      sizeCategory,
      locationScore: (input.inHeaderOrNav ? 4 : 0) + (input.inHeroOrAboveFold ? 2 : 0),
      contentScore: (signals.brandMatchScore || 0) + (matchedPatterns.length > 0 ? 1 : 0),
      negativeSignals,
    },
  };
}

/**
 * Classify multiple images and sort by display priority
 */
export function classifyImages(inputs: ImageClassificationInput[]): ClassificationResult[] {
  return inputs
    .map(classifyImage)
    .sort((a, b) => b.displayPriority - a.displayPriority);
}

/**
 * Separate classified images into logos and brand images
 * This is the primary function used by the Brand Guide API
 */
export function separateLogosAndBrandImages(
  classifiedImages: ClassificationResult[],
  options: { maxLogos?: number; maxBrandImages?: number } = {}
): {
  logos: ClassificationResult[];
  brandImages: ClassificationResult[];
  icons: ClassificationResult[];
  excluded: ClassificationResult[];
} {
  const { maxLogos = 2, maxBrandImages = 15 } = options;
  
  const logos: ClassificationResult[] = [];
  const brandImages: ClassificationResult[] = [];
  const icons: ClassificationResult[] = [];
  const excluded: ClassificationResult[] = [];
  
  for (const img of classifiedImages) {
    if (img.role === "logo") {
      if (logos.length < maxLogos) {
        logos.push(img);
      } else {
        // Extra logos go to brand images
        brandImages.push(img);
      }
    } else if (img.role === "icon" || img.role === "social_icon" || img.role === "platform_logo" || img.role === "partner_logo") {
      if (img.role === "icon") {
        icons.push(img);
      }
      excluded.push(img);
    } else {
      // hero, team, product, brand_image, background, other
      if (brandImages.length < maxBrandImages) {
        brandImages.push(img);
      }
    }
  }
  
  return { logos, brandImages, icons, excluded };
}

/**
 * Debug logging for classification
 */
export function logClassification(result: ClassificationResult): void {
  if (process.env.DEBUG_IMAGE_CLASSIFICATION !== "true") return;
  
  console.log(`[ImageClassifier] ${result.url.substring(0, 60)}...`, {
    role: result.role,
    category: result.category,
    confidence: result.confidence.toFixed(2),
    shouldDisplay: result.shouldDisplay,
    displayPriority: result.displayPriority,
    size: result.width && result.height ? `${result.width}x${result.height}` : "unknown",
    matchedPatterns: result.debugInfo?.matchedPatterns || [],
    negativeSignals: result.debugInfo?.negativeSignals || [],
  });
}

