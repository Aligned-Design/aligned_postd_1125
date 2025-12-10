/**
 * Brand Crawler Worker
 *
 * Crawls brand websites to extract:
 * - Voice/tone from content
 * - Color palette from visuals
 * - Keywords and themes
 * - AI-generated summaries and embeddings
 */

import { chromium as playwrightChromium, Browser, Page } from "playwright";
import vercelChromium from "@sparticuz/chromium";
import playwrightCore from "playwright-core";
import { Vibrant } from "node-vibrant/node";
import robotsParser from "robots-parser";
import { generateWithAI } from "./ai-generation";
import {
  DEFAULT_EMBEDDING_MODEL,
  generateEmbedding,
  isOpenAIConfigured,
} from "../lib/openai-client";
import crypto from "crypto";

// Detect if running on Vercel
const isVercel = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;

/**
 * Launch browser with Vercel-compatible setup
 */
async function launchBrowser(): Promise<Browser> {
  try {
    if (isVercel) {
      console.log("[Crawler] Launching browser on Vercel...");
      const chromiumPath = await vercelChromium.executablePath();
      console.log("[Crawler] Chromium path:", chromiumPath);
      const browser = await playwrightCore.chromium.launch({
        executablePath: chromiumPath,
        args: [...vercelChromium.args, "--no-sandbox", "--disable-setuid-sandbox"],
        headless: true,
      });
      console.log("[Crawler] Browser launched successfully on Vercel");
      return browser;
    } else {
      console.log("[Crawler] Launching browser locally...");
      const browser = await playwrightChromium.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
      console.log("[Crawler] Browser launched successfully locally");
      return browser;
    }
  } catch (error) {
    console.error("[Crawler] Failed to launch browser:", error);
    console.error("[Crawler] Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      isVercel,
      hasChromium: !!vercelChromium,
    });
    throw new Error(`Failed to launch browser: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Environment configuration
// OpenAI API key check - use isOpenAIConfigured() from shared client instead
// ✅ FIX 2025-12-10: Reduce limits on Vercel to avoid 55s timeout
// Vercel serverless functions have a hard 55-60s limit
// Local dev can use longer timeouts and more pages
const VERCEL_MAX_PAGES = 10; // Reduced from 50 to fit in Vercel timeout
const VERCEL_TIMEOUT_MS = 15000; // 15 seconds per page (max)
const VERCEL_MAX_DEPTH = 2; // Reduced from 3

const LOCAL_MAX_PAGES = parseInt(process.env.CRAWL_MAX_PAGES || "50", 10);
const LOCAL_TIMEOUT_MS = parseInt(process.env.CRAWL_TIMEOUT_MS || "60000", 10); // 60 seconds default
const LOCAL_MAX_DEPTH = 3;

// Use Vercel-safe limits on Vercel, full limits locally
const CRAWL_MAX_PAGES = isVercel ? VERCEL_MAX_PAGES : LOCAL_MAX_PAGES;
const CRAWL_TIMEOUT_MS = isVercel ? VERCEL_TIMEOUT_MS : LOCAL_TIMEOUT_MS;
const MAX_DEPTH = isVercel ? VERCEL_MAX_DEPTH : LOCAL_MAX_DEPTH;

const CRAWL_USER_AGENT = process.env.CRAWL_USER_AGENT || "POSTDBot/1.0";
const CRAWL_DELAY_MS = isVercel ? 500 : 1000; // Faster delay on Vercel
const MAX_RETRIES = isVercel ? 2 : 3; // Fewer retries on Vercel
const RETRY_DELAY_MS = isVercel ? 500 : 1000;

interface CrawledImage {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
  role: "logo" | "team" | "subject" | "hero" | "photo" | "social_icon" | "platform_logo" | "partner_logo" | "ui_icon" | "other";
  pageType?: "main" | "team" | "about" | "other";
  filename?: string;
  priority?: number; // Calculated priority score
  // ✅ NEW: Context metadata for logo selection
  inHeaderOrNav?: boolean;
  inFooter?: boolean;
  inAffiliateOrPartnerSection?: boolean;
  inHeroOrAboveFold?: boolean;
  brandMatchScore?: number;
  sourceType?: "html-img" | "css-bg" | "svg" | "og" | "favicon";
  fallbackSelected?: boolean; // True if selected as fallback when no ideal candidates
}

interface TypographyData {
  heading: string;
  body: string;
  source: "scrape" | "google" | "custom";
}

export interface OpenGraphMetadata {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  siteName?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  twitterCard?: string;
}

interface CrawlResult {
  url: string;
  title: string;
  metaDescription: string;
  h1: string[];
  h2: string[];
  h3: string[];
  bodyText: string;
  hash: string;
  images?: CrawledImage[];
  headlines?: string[];
  typography?: TypographyData;
  openGraph?: OpenGraphMetadata;
}

interface ColorPalette {
  primary?: string;
  secondary?: string;
  accent?: string;
  confidence: number;
  primaryColors?: string[]; // Up to 3 primary colors
  secondaryColors?: string[]; // Up to 3 secondary/accent colors
  allColors?: string[]; // All 6 colors combined (max 6)
}

interface VoiceSummary {
  tone: string[];
  style: string;
  avoid: string[];
  audience: string;
  personality: string[];
}

interface BrandKitData {
  voice_summary: VoiceSummary;
  keyword_themes: string[];
  about_blurb: string;
  colors: ColorPalette;
  typography?: TypographyData;
  source_urls: string[];
  metadata?: {
    openGraph?: OpenGraphMetadata;
  };
}

/**
 * Retry helper with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
  delayMs: number = RETRY_DELAY_MS,
): Promise<T> {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      console.warn(
        `[Brand Crawler] Attempt ${i + 1}/${maxRetries} failed: ${lastError.message}. Retrying in ${delayMs * Math.pow(2, i)}ms...`,
      );

      // Exponential backoff
      if (i < maxRetries - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, delayMs * Math.pow(2, i)),
        );
      }
    }
  }

  throw lastError || new Error("Max retries exceeded");
}

/**
 * Main orchestrator for brand intake processing
 */
export async function processBrandIntake(
  brandId: string,
  websiteUrl: string,
  supabase: unknown,
): Promise<BrandKitData> {
  console.log(`[Brand Crawler] Starting intake for brand ${brandId}`);

  try {
    // Step 1: Crawl website with retry logic
    const crawlResults = await retryWithBackoff(
      () => crawlWebsite(websiteUrl),
      MAX_RETRIES,
      RETRY_DELAY_MS,
    );
    console.log(
      `[Brand Crawler] Crawled ${crawlResults.length} pages (with retries)`,
    );

    // Step 2: Extract colors with retry logic
    const colors = await retryWithBackoff(
      () => extractColors(websiteUrl),
      MAX_RETRIES,
      RETRY_DELAY_MS,
    );
    console.log(`[Brand Crawler] Extracted color palette (with retries)`);

    // Step 3: Generate AI summaries (or fallback)
    // Try to get brand name and industry from website URL or crawl results
    const brandName = extractBrandNameFromUrl(websiteUrl);
    const industry = extractIndustryFromContent(crawlResults);
    const brandKit = await generateBrandKit(crawlResults, colors, websiteUrl, brandName, industry);
    console.log(`[Brand Crawler] Generated brand kit`);

    // Step 4: Create embeddings (if OpenAI available)
    if (isOpenAIConfigured()) {
      try {
        await createEmbeddings(brandId, brandKit, crawlResults, supabase);
        console.log(`[Brand Crawler] Created embeddings`);
      } catch (embeddingError) {
        console.warn(
          "[Brand Crawler] Error creating embeddings (non-critical):",
          embeddingError,
        );
        // Don't fail the entire process if embeddings fail
      }
    } else {
      console.warn(
        "[Brand Crawler] OpenAI not configured, skipping embeddings",
      );
    }

    return brandKit;
  } catch (error) {
    console.error(`[Brand Crawler] Error processing brand ${brandId}:`, error);
    throw error;
  }
}

/**
 * Crawl website with Playwright
 * - Same-domain only
 * - Max 50 pages, depth ≤ 3
 * - Respects robots.txt
 * - 1s delay between requests
 */
export async function crawlWebsite(startUrl: string): Promise<CrawlResult[]> {
  console.log("[Crawler] Starting crawlWebsite for:", startUrl);
  const baseUrl = new URL(startUrl);
  const baseDomain = baseUrl.hostname;

  const visited = new Set<string>();
  const results: CrawlResult[] = [];
  const queue: { url: string; depth: number }[] = [{ url: startUrl, depth: 0 }];

  // Check robots.txt
  const robotsTxt = await fetchRobotsTxt(startUrl);
  const robots = robotsParser(robotsTxt.url, robotsTxt.content);

  let browser: Browser | null = null;

  try {
    console.log("[Crawler] Attempting to launch browser...");
    browser = await launchBrowser();
    console.log("[Crawler] Browser launched, starting crawl...");

    while (queue.length > 0 && results.length < CRAWL_MAX_PAGES) {
      const { url, depth } = queue.shift()!;

      // Skip if already visited or too deep
      if (visited.has(url) || depth > MAX_DEPTH) continue;

      // Check if URL is allowed by robots.txt
      if (!robots.isAllowed(url, CRAWL_USER_AGENT)) {
        console.log(`[Crawler] Blocked by robots.txt: ${url}`);
        continue;
      }

      visited.add(url);

      try {
        const page = await browser.newPage({
          userAgent: CRAWL_USER_AGENT,
        });

        // Prevent bundler-generated helpers from breaking in the browser context
        await page.addInitScript(() => {
          // Some bundlers emit calls like __name(fn, "fnName") for stack traces.
          // Define a no-op helper so these calls do not throw ReferenceError.
          (window as any).__name ??= (fn: unknown, _name?: string) => fn;
        });

        // ✅ ENHANCED: Fetch page with retry logic and better error handling
        try {
          await retryWithBackoff(
            () =>
              page.goto(url, {
                timeout: CRAWL_TIMEOUT_MS,
                waitUntil: "networkidle",
              }),
            2, // Fewer retries per page (max 3 total with main retries)
            500, // Shorter delay for individual page fetches
          );
        } catch (gotoError) {
          console.warn(`[Crawler] Failed to load page ${url}:`, gotoError instanceof Error ? gotoError.message : String(gotoError));
          // Continue to next page instead of failing entire crawl
          await page.close();
          continue;
        }

        // Extract content
        const crawlData = await extractPageContent(page, url);
        results.push(crawlData);

        // Find same-domain links for next crawl
        if (depth < MAX_DEPTH) {
          const links = await page.$$eval("a[href]", (anchors) =>
            anchors.map((a) => (a as HTMLAnchorElement).href),
          );

          for (const link of links) {
            try {
              const linkUrl = new URL(link);
              // Only follow same-domain links
              if (linkUrl.hostname === baseDomain && !visited.has(link)) {
                queue.push({ url: link, depth: depth + 1 });
              }
            } catch {
              // Invalid URL, skip
            }
          }
        }

        await page.close();

        // Crawl delay
        await new Promise((resolve) => setTimeout(resolve, CRAWL_DELAY_MS));
      } catch (error) {
        console.error(`[Crawler] Error crawling ${url}:`, error);
      }
    }

    console.log(`[Crawler] Crawl complete: ${results.length} pages crawled`);
    return results;
  } catch (error) {
    console.error("[Crawler] Fatal error in crawlWebsite:", error);
    console.error("[Crawler] Error stack:", error instanceof Error ? error.stack : "No stack");
    throw error;
  } finally {
    if (browser) {
      try {
        await browser.close();
        console.log("[Crawler] Browser closed");
      } catch (closeError) {
        console.error("[Crawler] Error closing browser:", closeError);
      }
    }
  }
}

/**
 * Fetch robots.txt for the domain
 */
async function fetchRobotsTxt(
  url: string,
): Promise<{ url: string; content: string }> {
  const robotsUrl = new URL("/robots.txt", url).toString();

  try {
    const response = await fetch(robotsUrl);
    const content = response.ok ? await response.text() : "";
    return { url: robotsUrl, content };
  } catch {
    return { url: robotsUrl, content: "" };
  }
}

/**
 * Extract brand name from URL (domain name)
 */
// ✅ EXPORT: Allow crawler route to use this function
export function extractBrandNameFromUrl(url: string): string | undefined {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    // Remove www. and .com/.net/.org etc.
    const brandName = hostname
      .replace(/^www\./, "")
      .split(".")
      .slice(0, -1)
      .join(" ")
      .replace(/-/g, " ");
    return brandName || undefined;
  } catch {
    return undefined;
  }
}

/**
 * Extract industry hints from crawl results
 */
// ✅ EXPORT: Allow crawler route to use this function
export function extractIndustryFromContent(crawlResults: CrawlResult[]): string | undefined {
  // Look for common industry keywords in content
  const allText = crawlResults
    .map((r) => `${r.title} ${r.metaDescription} ${r.bodyText}`)
    .join(" ")
    .toLowerCase();
  
  const industryKeywords: Record<string, string> = {
    "restaurant": "Food & Dining",
    "cafe": "Food & Dining",
    "coffee": "Food & Dining",
    "fitness": "Health & Fitness",
    "gym": "Health & Fitness",
    "yoga": "Health & Fitness",
    "law": "Legal Services",
    "attorney": "Legal Services",
    "real estate": "Real Estate",
    "property": "Real Estate",
    "technology": "Technology",
    "software": "Technology",
    "consulting": "Business Consulting",
    "marketing": "Marketing & Advertising",
    "design": "Design & Creative",
    "healthcare": "Healthcare",
    "medical": "Healthcare",
    "education": "Education",
    "school": "Education",
  };
  
  for (const [keyword, industry] of Object.entries(industryKeywords)) {
    if (allText.includes(keyword)) {
      return industry;
    }
  }
  
  return undefined;
}

/**
 * Detect page type from URL
 */
function detectPageType(url: string): "main" | "team" | "about" | "other" {
  const urlLower = url.toLowerCase();
  const pathname = new URL(url).pathname.toLowerCase();
  
  // Main page detection
  if (pathname === "/" || pathname === "/home" || pathname === "/index" || pathname === "/index.html") {
    return "main";
  }
  
  // Team page detection
  if (pathname.includes("/team") || pathname.includes("/our-team") || pathname.includes("/staff") || pathname.includes("/people")) {
    return "team";
  }
  
  // About page detection
  if (pathname.includes("/about") || pathname.includes("/about-us") || pathname.includes("/who-we-are")) {
    return "about";
  }
  
  return "other";
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
 * ✅ NEW: Calculate brand match score for a logo candidate
 * Uses brand name from title, og:site_name, or main H1
 */
function calculateBrandMatchScore(
  img: { url: string; alt?: string; filename?: string },
  brandName?: string,
  pageTitle?: string,
  ogSiteName?: string,
  mainH1?: string
): number {
  if (!brandName) return 0;
  
  let score = 0;
  const brandNameLower = brandName.toLowerCase();
  const brandNameNoSpaces = brandNameLower.replace(/\s+/g, "");
  const brandNameHyphenated = brandNameLower.replace(/\s+/g, "-");
  
  const altLower = img.alt?.toLowerCase() || "";
  const filenameLower = img.filename?.toLowerCase() || "";
  const urlLower = img.url.toLowerCase();
  
  // Infer brand name from page context if not provided
  const inferredBrand = brandName || 
    ogSiteName?.toLowerCase() || 
    pageTitle?.toLowerCase().split("|")[0]?.trim() || 
    mainH1?.toLowerCase() || 
    "";
  
  if (!inferredBrand) return 0;
  
  // +1 if alt/title text contains brand name
  if (altLower.includes(brandNameLower) || altLower.includes(brandNameNoSpaces) || altLower.includes(brandNameHyphenated)) {
    score += 1;
  }
  
  // +1 if filename/path contains brand name
  if (filenameLower.includes(brandNameLower) || filenameLower.includes(brandNameNoSpaces) || filenameLower.includes(brandNameHyphenated) ||
      urlLower.includes(brandNameLower) || urlLower.includes(brandNameNoSpaces) || urlLower.includes(brandNameHyphenated)) {
    score += 1;
  }
  
  return score;
}

/**
 * ✅ ENHANCED: Logo detection with negative weights for icons
 * 
 * FIX 2025-12-10: Added exclusion rules for:
 * - Generic icons (envelope, globe, phone, etc.)
 * - SVG icons with thick strokes
 * - UI illustrations
 * - Icons from icon packs (typically uniform size and style)
 */
function isLogo(
  img: { url: string; alt?: string; width?: number; height?: number },
  pageUrl: string,
  brandName?: string
): boolean {
  const filename = extractFilename(img.url);
  const urlLower = img.url.toLowerCase();
  const altLower = img.alt?.toLowerCase() || "";
  let pathname = "";
  try {
    pathname = new URL(img.url).pathname.toLowerCase();
  } catch {
    pathname = urlLower;
  }
  
  // ✅ FIX: NEGATIVE INDICATORS - these are NOT logos
  const genericIconPatterns = [
    "envelope", "mail", "email", "globe", "world", "phone", "call", "contact",
    "arrow", "chevron", "caret", "hamburger", "menu", "search", "magnify",
    "user", "person", "avatar", "profile", "account", "settings", "cog", "gear",
    "home", "house", "star", "heart", "like", "share", "download", "upload",
    "play", "pause", "stop", "next", "prev", "forward", "back", "close", "x-mark",
    "check", "checkmark", "tick", "cross", "plus", "minus", "add", "remove",
    "cart", "shopping", "bag", "basket", "lock", "unlock", "key", "shield",
    "bell", "notification", "alert", "warning", "info", "help", "question",
    "calendar", "clock", "time", "date", "location", "map", "pin", "marker",
    "link", "chain", "external", "new-window", "copy", "clipboard", "edit", "pencil",
    "trash", "delete", "bin", "folder", "file", "document", "pdf", "image",
    "camera", "video", "mic", "microphone", "speaker", "volume", "mute",
    "wifi", "signal", "battery", "power", "refresh", "sync", "loading", "spinner"
  ];
  
  // Check if filename/alt/url contains generic icon patterns
  const hasGenericIconPattern = genericIconPatterns.some(pattern => 
    filename.includes(pattern) || 
    altLower.includes(pattern) || 
    urlLower.includes(pattern)
  );
  
  // ✅ FIX: Exclude if it matches generic icon patterns (unless it ALSO contains "logo")
  const hasLogoIndicator = filename.includes("logo") || 
    altLower.includes("logo") || 
    urlLower.includes("logo") ||
    pathname.includes("/logo");
  
  if (hasGenericIconPattern && !hasLogoIndicator) {
    if (process.env.DEBUG_LOGO_DETECT === "true") {
      console.log(`[LogoDetect] Excluded generic icon: ${img.url.substring(0, 80)}...`);
    }
    return false;
  }
  
  // ✅ FIX: Exclude very square icons (1:1 ratio) that are small (< 100px)
  // Real logos are rarely perfect squares at small sizes
  if (img.width && img.height && img.width === img.height && img.width < 100) {
    // Check if it's an icon path (common icon directories)
    const iconPathPatterns = ["/icons/", "/icon/", "/assets/icons", "/img/icons", "/images/icons"];
    const isInIconPath = iconPathPatterns.some(p => urlLower.includes(p));
    
    if (isInIconPath && !hasLogoIndicator) {
      if (process.env.DEBUG_LOGO_DETECT === "true") {
        console.log(`[LogoDetect] Excluded square icon from icon path: ${img.url.substring(0, 80)}...`);
      }
      return false;
    }
  }
  
  // ✅ POSITIVE INDICATORS - these ARE logos
  // Check filename for "logo" or brand name
  const brandNameLower = brandName?.toLowerCase().replace(/\s+/g, "-") || "";
  if (brandNameLower && (filename.includes(brandNameLower) || filename.includes(brandName?.toLowerCase().replace(/\s+/g, "") || ""))) {
    return true;
  }
  
  // Check filename for "logo"
  if (filename.includes("logo")) {
    return true;
  }
  
  // Check URL path for "logo" or brand name
  if (pathname.includes("/logo") || (brandNameLower && pathname.includes(brandNameLower))) {
    return true;
  }
  
  // Check alt text for "logo" or brand name
  if (altLower.includes("logo") || (brandName && altLower.includes(brandName.toLowerCase()))) {
    return true;
  }
  
  // ✅ NEW: Check for brand-related keywords that indicate a logo
  const logoKeywords = ["brand", "brandmark", "logotype", "wordmark", "symbol", "sig", "signature"];
  const hasLogoKeyword = logoKeywords.some(keyword => 
    filename.includes(keyword) || altLower.includes(keyword)
  );
  
  if (hasLogoKeyword) {
    return true;
  }
  
  // Existing checks: parent classes, header position, size
  // These are handled in the page.evaluate() function
  
  return false;
}

/**
 * Categorize image based on context
 * 
 * ✅ ENHANCED: Detects social_icon, platform_logo, and partner_logo to filter them out
 * Returns expanded role types including social_icon, platform_logo, partner_logo, and photo
 * 
 * ✅ SQUARESPACE CDN HANDLING:
 * - Large images from platform CDNs (e.g., images.squarespace-cdn.com/content/v1/...)
 *   are NOT automatically classified as platform_logo
 * - Only small icons/badges (<= 96x96) with explicit platform branding are filtered
 * - This ensures legitimate brand images (hero banners, photos) are preserved
 * 
 * ✅ FIX 2025-12-10: Added detection for:
 * - Generic UI icons (envelope, globe, phone, etc.)
 * - SVG icon pack graphics
 * - Illustrations and decorative elements
 * - Solid color backgrounds that shouldn't be saved as images
 * 
 * ✅ NEW: Uses context fields (inHeaderOrNav, inAffiliateOrPartnerSection, etc.) for better classification
 */
function categorizeImage(
  img: { 
    url: string; 
    alt?: string; 
    width?: number; 
    height?: number; 
    role?: string;
    inHeaderOrNav?: boolean;
    inFooter?: boolean;
    inAffiliateOrPartnerSection?: boolean;
    inHeroOrAboveFold?: boolean;
    brandMatchScore?: number;
  },
  pageUrl: string,
  pageType: "main" | "team" | "about" | "other",
  brandName?: string
): "logo" | "team" | "subject" | "hero" | "photo" | "social_icon" | "platform_logo" | "partner_logo" | "ui_icon" | "other" {
  const altLower = img.alt?.toLowerCase() || "";
  const urlLower = img.url.toLowerCase();
  const filenameLower = img.url.split("/").pop()?.toLowerCase() || "";
  let pathname = "";
  try {
    pathname = new URL(img.url).pathname.toLowerCase();
  } catch {
    pathname = urlLower;
  }
  
  // ✅ FIX: Detect UI icons and illustrations FIRST (before social icons)
  // These should be excluded from brand images
  const uiIconPatterns = [
    "envelope", "mail", "email", "globe", "world", "phone", "call", "contact",
    "arrow", "chevron", "caret", "hamburger", "menu", "search", "magnify",
    "user", "person", "avatar", "profile", "account", "settings", "cog", "gear",
    "home", "house", "star", "heart", "like", "share", "download", "upload",
    "play", "pause", "stop", "next", "prev", "forward", "back", "close", "x-mark",
    "check", "checkmark", "tick", "cross", "plus", "minus", "add", "remove",
    "cart", "shopping", "bag", "basket", "lock", "unlock", "key", "shield",
    "bell", "notification", "alert", "warning", "info", "help", "question",
    "calendar", "clock", "time", "date", "location", "map", "pin", "marker",
    "link", "chain", "external", "new-window", "copy", "clipboard", "edit", "pencil",
    "trash", "delete", "bin", "folder", "file", "document", "pdf",
    "camera", "video", "mic", "microphone", "speaker", "volume", "mute",
    "wifi", "signal", "battery", "power", "refresh", "sync", "loading", "spinner"
  ];
  
  // ✅ FIX: Check for UI icon patterns
  const hasUiIconPattern = uiIconPatterns.some(pattern => 
    filenameLower.includes(pattern) || 
    altLower.includes(pattern) || 
    pathname.includes(`/${pattern}`) ||
    pathname.includes(`-${pattern}`) ||
    pathname.includes(`_${pattern}`)
  );
  
  // ✅ FIX: Detect icon pack directories (common patterns)
  const iconPathPatterns = [
    "/icons/", "/icon/", "/assets/icons", "/img/icons", "/images/icons",
    "/iconpack/", "/icon-pack/", "/ui-icons/", "/ui/icons",
    "/fontawesome", "/feather", "/heroicons", "/lucide", "/bootstrap-icons"
  ];
  const isInIconPath = iconPathPatterns.some(p => urlLower.includes(p));
  
  // ✅ FIX: If it's a small image (< 150x150) in an icon path or with icon pattern, mark as ui_icon
  const isSmallIcon = img.width && img.height && img.width < 150 && img.height < 150;
  
  if ((hasUiIconPattern || isInIconPath) && isSmallIcon) {
    // Only exclude if it doesn't have strong logo indicators
    const hasLogoIndicator = filenameLower.includes("logo") || altLower.includes("logo");
    if (!hasLogoIndicator) {
      if (process.env.DEBUG_IMAGE_CLASSIFICATION === "true") {
        console.log(`[ImageCategorizer] Classified as ui_icon: ${img.url.substring(0, 80)}...`, {
          hasUiIconPattern,
          isInIconPath,
          isSmallIcon,
          dimensions: `${img.width}x${img.height}`,
        });
      }
      return "ui_icon";
    }
  }
  
  // ✅ CRITICAL: Filter out social icons and platform logos FIRST (before other categorization)
  // Social icons: facebook, instagram, linkedin, x-logo, twitter, tiktok, etc.
  const socialIconPatterns = [
    "facebook", "instagram", "linkedin", "x-logo", "twitter", "tiktok", 
    "youtube", "pinterest", "snapchat", "whatsapp", "telegram", "discord",
    "social-icon", "social_icon", "socialicon", "social-media"
  ];
  
  if (
    socialIconPatterns.some(pattern => 
      filenameLower.includes(pattern) || 
      urlLower.includes(pattern) || 
      altLower.includes(pattern) ||
      pathname.includes(pattern)
    )
  ) {
    return "social_icon";
  }
  
  // ✅ FIXED: Platform logos detection - require BOTH vendor name AND logoish patterns
  // Problem: Previous logic treated ALL Squarespace CDN images as platform_logo, even legitimate brand images
  // Solution: Only classify as platform_logo when BOTH conditions are met:
  //   1. Vendor name appears in URL/alt/filename (e.g., squarespace, wix, godaddy)
  //   2. Logoish pattern appears in URL/alt/filename (e.g., logo, icon, badge, powered-by)
  // This ensures large Squarespace CDN images (images.squarespace-cdn.com/content/v1/...) are NOT filtered out
  // 
  // Platform vendors (hosting platform names)
  const platformVendors = ["squarespace", "wix", "godaddy", "canva", "shopify", "wordpress"];
  
  // Logoish patterns (indicators of a logo/badge/icon)
  const logoishPatterns = ["logo", "logotype", "brandmark", "mark", "badge", "icon", "favicon", "powered-by", "powered_by", "footer-logo", "header-logo"];
  
  // Check if vendor name appears in URL/alt/filename
  const hasVendor = platformVendors.some(v => 
    urlLower.includes(v) || 
    altLower.includes(v) || 
    filenameLower.includes(v) ||
    pathname.includes(v)
  );
  
  // Check if logoish pattern appears in URL/alt/filename
  const isLogoish = logoishPatterns.some(p =>
    urlLower.includes(p) || 
    altLower.includes(p) || 
    filenameLower.includes(p) ||
    pathname.includes(p)
  );
  
  // ✅ CRITICAL: Only classify as platform_logo if BOTH vendor AND logoish patterns are present
  // This prevents legitimate brand images from platform CDNs (like images.squarespace-cdn.com) from being filtered
  if (hasVendor && isLogoish) {
    // ✅ ENHANCED: Prefer small images (< 200x200) for platform logos, but allow if dimensions unknown
    // If image is large (> 300x300), it's likely a legitimate brand image, not a platform logo badge
    const isLargeImage = img.width && img.height && (img.width > 300 || img.height > 300);
    
    if (isLargeImage) {
      // Large images with vendor+logoish patterns are likely false positives
      // (e.g., a brand's hero image that happens to mention "logo" in the URL)
      // Log for debugging but don't classify as platform_logo
      if (process.env.DEBUG_SQUARESPACE_IMAGES === "true") {
        console.log(`[ImageCategorizer] Large image with vendor+logoish pattern (NOT platform_logo): ${img.url.substring(0, 80)}... (${img.width}x${img.height})`);
      }
    } else {
      // Small images or images without dimensions that match vendor+logoish are likely platform logos
      if (process.env.DEBUG_SQUARESPACE_IMAGES === "true" || process.env.DEBUG_IMAGE_CLASSIFICATION === "true") {
        console.log(`[ImageCategorizer] Classified as platform_logo: ${img.url.substring(0, 80)}...`, {
          vendor: platformVendors.find(v => urlLower.includes(v) || altLower.includes(v) || filenameLower.includes(v)),
          logoishPattern: logoishPatterns.find(p => urlLower.includes(p) || altLower.includes(p) || filenameLower.includes(p)),
          dimensions: img.width && img.height ? `${img.width}x${img.height}` : "unknown",
          alt: img.alt?.substring(0, 40) || "none",
        });
      }
      return "platform_logo";
    }
  }
  
  // ✅ EXPLICIT: Large images from Squarespace CDN (and other platform CDNs) are NOT platform logos
  // These are legitimate brand assets (hero banners, lifestyle photos, etc.)
  // They should be classified as hero/photo/other based on their actual content
  if (hasVendor && !isLogoish) {
    // Has vendor but no logoish pattern - this is a legitimate brand image from a platform CDN
    // Continue to normal classification (hero/photo/etc) - don't return platform_logo
    if (process.env.DEBUG_SQUARESPACE_IMAGES === "true") {
      console.log(`[ImageCategorizer] Platform CDN image without logoish pattern (NOT platform_logo): ${img.url.substring(0, 80)}... - will classify as hero/photo/other`);
    }
  }
  
  // ✅ NEW: Partner/Vendor/Badge logo detection (before primary logo detection)
  // Check if image is in affiliate/partner section OR has partner indicators
  const partnerPatterns = [
    "partner", "association", "member", "vendor", "powered-by", "powered_by",
    "badge", "sponsor", "brokers", "advisors", "custodian", "certified"
  ];
  
  const hasPartnerIndicator = partnerPatterns.some(pattern =>
    urlLower.includes(pattern) ||
    altLower.includes(pattern) ||
    filenameLower.includes(pattern) ||
    pathname.includes(pattern)
  );
  
  // Classify as partner_logo if:
  // 1. In affiliate/partner section, OR
  // 2. Small image (< 120px) with partner indicators
  if (img.inAffiliateOrPartnerSection || (hasPartnerIndicator && img.width && img.height && Math.max(img.width, img.height) < 120)) {
    return "partner_logo";
  }

  // Logo detection (highest priority) - STRICT: Only small images in header/nav or clear logo indicators
  // ✅ IMPROVED: Strict logo criteria to prevent large brand images from being classified as logos
  const isPotentialLogo = img.role === "logo" || isLogo(img, pageUrl, brandName);
  
  if (isPotentialLogo) {
    // ✅ STRICT SIZE CHECK: Logos should be relatively small (< 400px in both dimensions)
    // Large images (> 400px) are likely hero/brand images, not logos
    const isOversized = img.width && img.height && 
      (img.width > 400 || img.height > 400 || (img.width * img.height > 200000));
    
    if (isOversized) {
      // Oversized "logo" - classify as hero or photo instead
      if (img.inHeroOrAboveFold || (img.width && img.height && img.width > 600)) {
        return "hero";
      }
      return "photo"; // Large brand image
    }
    
    // ✅ STRICT LOCATION CHECK: Primary logo should be in header/nav OR small with brand match
    const isPrimaryLogo = img.inHeaderOrNav === true || 
      (img.inHeroOrAboveFold === true && (img.brandMatchScore || 0) >= 1 && 
       img.width && img.height && img.width < 300 && img.height < 300);
    
    // If it's a logo but not a primary logo candidate, it might be a partner logo
    if (!isPrimaryLogo && img.inAffiliateOrPartnerSection) {
      return "partner_logo";
    }
    
    // ✅ VALIDATION: Only return "logo" if it meets strict criteria (small, in header/nav, or clear logo indicators)
    if (isPrimaryLogo || (img.inHeaderOrNav === true) || 
        (img.width && img.height && img.width < 300 && img.height < 300 && 
         (img.brandMatchScore || 0) >= 1)) {
      return "logo";
    }
    
    // If doesn't meet strict logo criteria but has logo indicators, classify as photo/hero
    // This prevents false positives from images that just happen to have "logo" in filename
    if (img.inHeroOrAboveFold) {
      return "hero";
    }
    return "photo"; // Brand image, not a logo
  }
  
  // Hero images: large images near top of page - use existing role if already detected
  if (img.role === "hero") {
    return "hero";
  }
  
  // Team images: from team/about pages, or images with faces (detected by alt text or context)
  if (pageType === "team" || pageType === "about") {
    if (
      altLower.includes("team") ||
      altLower.includes("staff") ||
      altLower.includes("member") ||
      altLower.includes("founder") ||
      altLower.includes("ceo") ||
      altLower.includes("director") ||
      altLower.includes("employee") ||
      altLower.includes("people") ||
      urlLower.includes("team") ||
      urlLower.includes("staff") ||
      urlLower.includes("people") ||
      filenameLower.includes("team") ||
      filenameLower.includes("staff")
    ) {
      return "team";
    }
  }
  
  // Subject matter: product/service images
  if (
    altLower.includes("product") ||
    altLower.includes("service") ||
    altLower.includes("feature") ||
    altLower.includes("offering") ||
    urlLower.includes("product") ||
    urlLower.includes("service") ||
    urlLower.includes("feature") ||
    filenameLower.includes("product") ||
    filenameLower.includes("service")
  ) {
    return "subject";
  }
  
  // ✅ NEW: Photo/content - real photos that depict brand, people, product, or environment
  // Prefer larger images that aren't icons or graphics
  // ✅ FIXED: This now correctly handles large Squarespace CDN images that were previously misclassified
  if (img.width && img.height) {
    const isLarge = img.width > 300 && img.height > 300;
    const isMedium = img.width > 200 && img.height > 200;
    const isNotIcon = !filenameLower.includes("icon") && !altLower.includes("icon");
    const isNotGraphic = !filenameLower.includes("graphic") && !altLower.includes("graphic");
    
    // Large images are likely photos/hero images
    if (isLarge && isNotIcon && isNotGraphic) {
      // Check if it's a hero image (large and likely above the fold)
      if (img.width > 800 || img.height > 600) {
        return "hero";
      }
      return "photo";
    }
    
    // Medium images might also be photos if they're not icons
    if (isMedium && isNotIcon && isNotGraphic) {
      return "photo";
    }
  }
  
  // Default to other - accept all images even if we can't categorize them
  // ✅ FIXED: This ensures Squarespace CDN images without clear classification still get through
  return "other";
}

/**
 * Calculate priority score for image
 */
function calculateImagePriority(img: CrawledImage): number {
  let priority = 0;
  
  // Role-based priority
  if (img.role === "logo") priority += 1000;
  if (img.role === "team") priority += 800;
  if (img.role === "subject") priority += 600;
  if (img.role === "hero") priority += 400;
  if (img.role === "other") priority += 100;
  
  // Page type priority
  if (img.pageType === "main") priority += 100;
  if (img.pageType === "team" || img.pageType === "about") priority += 80;
  
  // Size priority (larger images are generally better)
  if (img.width && img.height) {
    const area = img.width * img.height;
    if (area > 500000) priority += 50; // Very large images
    else if (area > 200000) priority += 30; // Large images
    else if (area > 50000) priority += 10; // Medium images
  }
  
  return priority;
}

/**
 * ✅ NEW: Calculate logo selection score for Brand Guide
 * Higher score = better candidate for primary brand logo
 */
function calculateLogoScore(img: CrawledImage): number {
  let score = 0;
  
  // Header/nav location (strongest signal)
  if (img.inHeaderOrNav === true) score += 4;
  
  // Hero/above fold location
  if (img.inHeroOrAboveFold === true) score += 2;
  
  // Brand match score (multiplied for importance)
  score += (img.brandMatchScore || 0) * 2;
  
  // Role is logo
  if (img.role === "logo") score += 2;
  
  // Penalty for affiliate/partner sections
  if (img.inAffiliateOrPartnerSection === true) score -= 5;
  
  // Size bonus (logos should be reasonable size, not tiny)
  if (img.width && img.height) {
    const maxDim = Math.max(img.width, img.height);
    if (maxDim >= 40 && maxDim < 500) score += 1; // Good logo size range
    if (maxDim < 40) score -= 2; // Too small
  }
  
  // Source type bonus (SVG and CSS are often better quality)
  if (img.sourceType === "svg") score += 1;
  if (img.sourceType === "css-bg") score += 0.5;
  
  return score;
}

/**
 * ✅ NEW: Select best logos for Brand Guide from crawl results
 * Filters out partner/platform logos and selects top 1-2 primary logos
 */
export function selectBrandLogos(crawlResults: CrawlResult[]): CrawledImage[] {
  // Collect all logo candidates from all pages
  const allLogos: CrawledImage[] = [];
  for (const result of crawlResults) {
    if (result.images) {
      const logos = result.images.filter((img): img is CrawledImage => 
        img.role === "logo"
      );
      allLogos.push(...logos);
    }
  }
  
  // Filter out partner/platform logos explicitly
  const primaryCandidates = allLogos.filter(img => {
    // Exclude if explicitly marked as partner/platform (shouldn't happen if role is "logo", but check anyway)
    if (img.role === "platform_logo" || img.role === "partner_logo" || img.role === "social_icon") {
      return false;
    }
    
    // Exclude if in affiliate/partner section
    if (img.inAffiliateOrPartnerSection === true) {
      return false;
    }
    
    // Exclude if too small (likely a favicon or icon)
    if (img.width && img.height && Math.max(img.width, img.height) < 40) {
      return false;
    }
    
    return true;
  });
  
  // Calculate scores and sort
  const scoredLogos = primaryCandidates.map(img => ({
    img,
    score: calculateLogoScore(img),
  }));
  
  scoredLogos.sort((a, b) => b.score - a.score);
  
  // Select top 1-2 logos
  const selected = scoredLogos.slice(0, 2).map(item => item.img);
  
  // ✅ GUARDRAIL: If no logos selected but candidates exist, use fallback
  if (selected.length === 0 && primaryCandidates.length > 0) {
    const fallback = primaryCandidates[0];
    fallback.fallbackSelected = true;
    if (process.env.DEBUG_LOGO_DETECT === "true") {
      console.log(`[LogoSelect] No ideal logos found, using fallback: ${fallback.url.substring(0, 80)}...`);
    }
    return [fallback];
  }
  
  // ✅ DEBUG LOGGING
  if (process.env.DEBUG_LOGO_DETECT === "true") {
    console.log(`[LogoSelect] Selected ${selected.length} logo(s) from ${allLogos.length} candidates:`, {
      selected: selected.map(img => ({
        url: img.url.substring(0, 80),
        score: calculateLogoScore(img),
        inHeaderOrNav: img.inHeaderOrNav,
        brandMatchScore: img.brandMatchScore,
        sourceType: img.sourceType,
        dimensions: img.width && img.height ? `${img.width}x${img.height}` : "unknown",
      })),
      filtered: allLogos.length - primaryCandidates.length,
    });
  }
  
  return selected;
}

/**
 * ✅ NEW: Extract logo candidates from CSS background-image, mask-image, etc.
 * Detects logos rendered via CSS (common on Squarespace, Webflow, etc.)
 */
async function extractCssLogos(page: Page, baseUrl: string): Promise<CrawledImage[]> {
  try {
    const base = new URL(baseUrl);
    
    const cssLogos = await page.evaluate((baseHref) => {
      const baseUrlObj = new URL(baseHref);
      const results: Array<{
        url: string;
        width?: number;
        height?: number;
        role: "logo";
        source: "css-computed";
        confidence: "css";
        filename?: string;
      }> = [];

      // Helper to normalize URL
      const normalizeUrl = (src: string | null): string | null => {
        if (!src) return null;
        try {
          if (src.startsWith("//")) return `${baseUrlObj.protocol}${src}`;
          if (src.startsWith("/")) return `${baseUrlObj.origin}${src}`;
          if (src.startsWith("http://") || src.startsWith("https://")) return src;
          return new URL(src, baseHref).href;
        } catch {
          return null;
        }
      };

      // Helper to extract filename
      const getFilename = (url: string): string => {
        try {
          return new URL(url).pathname.split("/").pop() || "";
        } catch {
          return "";
        }
      };

      // Logo selector patterns (common class names for logo elements)
      const logoSelectors = [
        ".header-logo", ".site-logo", ".logo-image", ".header__logo",
        ".branding-logo", ".SiteHeader-branding-logo", ".site-title",
        "[class*='logo']", "[id*='logo']", "header [class*='logo']",
        "nav [class*='logo']", ".navbar-brand", ".brand-logo"
      ];

      // Find elements that might contain logo images
      const candidateElements: Element[] = [];
      logoSelectors.forEach(selector => {
        try {
          document.querySelectorAll(selector).forEach(el => candidateElements.push(el));
        } catch {
          // Invalid selector, skip
        }
      });

      // Also check header/nav elements for background images
      document.querySelectorAll("header, nav, .header, .navbar").forEach(el => {
        candidateElements.push(el);
      });

      candidateElements.forEach((el) => {
        try {
          const style = window.getComputedStyle(el);
          const bgImage = style.backgroundImage;
          const maskImage = style.maskImage || (style as any).webkitMaskImage;
          
          // Check background-image
          if (bgImage && bgImage !== "none") {
            const match = bgImage.match(/url\(['"]?([^'"]+)['"]?\)/);
            if (match && match[1]) {
              const normalizedUrl = normalizeUrl(match[1]);
              if (normalizedUrl) {
                const rect = el.getBoundingClientRect();
                const filename = getFilename(normalizedUrl);
                const urlLower = normalizedUrl.toLowerCase();
                const filenameLower = filename.toLowerCase();
                
                // Only include if it looks like a logo (has "logo" in URL/filename or is in header/nav)
                const isInHeader = el.closest("header") !== null || el.closest("nav") !== null;
                const hasLogoIndicator = urlLower.includes("logo") || filenameLower.includes("logo");
                
                if (hasLogoIndicator || isInHeader) {
                  results.push({
                    url: normalizedUrl,
                    width: rect.width > 0 ? Math.round(rect.width) : undefined,
                    height: rect.height > 0 ? Math.round(rect.height) : undefined,
                    role: "logo",
                    source: "css-computed",
                    confidence: "css",
                    filename,
                  });
                }
              }
            }
          }
          
          // Check mask-image (used for SVG logos)
          if (maskImage && maskImage !== "none") {
            const match = maskImage.match(/url\(['"]?([^'"]+)['"]?\)/);
            if (match && match[1]) {
              const normalizedUrl = normalizeUrl(match[1]);
              if (normalizedUrl) {
                const rect = el.getBoundingClientRect();
                const filename = getFilename(normalizedUrl);
                const urlLower = normalizedUrl.toLowerCase();
                
                if (urlLower.includes("logo") || el.closest("header") !== null) {
                  results.push({
                    url: normalizedUrl,
                    width: rect.width > 0 ? Math.round(rect.width) : undefined,
                    height: rect.height > 0 ? Math.round(rect.height) : undefined,
                    role: "logo",
                    source: "css-computed",
                    confidence: "css",
                    filename,
                  });
                }
              }
            }
          }
        } catch (elError) {
          // Skip this element if there's an error
        }
      });

      return results;
    }, baseUrl);

    if (process.env.DEBUG_LOGO_DETECT === "true") {
      console.log(`[LogoDetect] Found ${cssLogos.length} CSS background-image logo candidates`);
    }

    return cssLogos.map(logo => ({
      url: logo.url,
      width: logo.width,
      height: logo.height,
      role: "logo" as const,
      filename: logo.filename,
    }));
  } catch (error) {
    console.warn("[Crawler] Error extracting CSS logos:", error);
    return [];
  }
}

/**
 * ✅ NEW: Extract inline SVG logos
 * Detects SVG logos embedded directly in HTML (common on modern sites)
 */
async function extractSvgLogos(page: Page, baseUrl: string): Promise<CrawledImage[]> {
  try {
    const svgLogos = await page.evaluate((baseHref) => {
      const results: Array<{
        url: string;
        width?: number;
        height?: number;
        role: "logo";
        source: "inline-svg";
        svgContent?: string;
        filename?: string;
      }> = [];

      // Helper to convert SVG to data URL
      const svgToDataUrl = (svg: SVGElement): string => {
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svg);
        const encoded = encodeURIComponent(svgString);
        return `data:image/svg+xml;charset=utf-8,${encoded}`;
      };

      // Find SVG logos in common locations
      const svgSelectors = [
        "svg.logo",
        "svg[role='img']",
        "header svg",
        "nav svg",
        ".site-title svg",
        ".header-logo svg",
        ".logo svg",
        "[class*='logo'] svg"
      ];

      const candidateSvgs: SVGElement[] = [];
      svgSelectors.forEach(selector => {
        try {
          document.querySelectorAll(selector).forEach(el => {
            if (el instanceof SVGElement) candidateSvgs.push(el);
          });
        } catch {
          // Invalid selector, skip
        }
      });

      // Also check for SVG in header/nav
      document.querySelectorAll("header svg, nav svg").forEach(el => {
        if (el instanceof SVGElement && !candidateSvgs.includes(el)) {
          candidateSvgs.push(el);
        }
      });

      // Check for SVG <use> references (SVG sprites)
      document.querySelectorAll("use[href*='logo'], use[xlink\\:href*='logo']").forEach(useEl => {
        const svg = useEl.closest("svg");
        if (svg && !candidateSvgs.includes(svg)) {
          candidateSvgs.push(svg);
        }
      });

      candidateSvgs.forEach((svg) => {
        try {
          const rect = svg.getBoundingClientRect();
          const isInHeader = svg.closest("header") !== null || svg.closest("nav") !== null;
          const parentClasses = svg.parentElement?.className?.toLowerCase() || "";
          const parentId = svg.parentElement?.id?.toLowerCase() || "";
          const svgId = svg.id?.toLowerCase() || "";
          const svgClass = svg.className?.baseVal?.toLowerCase() || "";
          
          // Check if this looks like a logo
          const hasLogoIndicator = 
            svgId.includes("logo") ||
            svgClass.includes("logo") ||
            parentClasses.includes("logo") ||
            parentId.includes("logo") ||
            isInHeader;

          if (hasLogoIndicator && rect.width > 0 && rect.height > 0) {
            const svgContent = svgToDataUrl(svg);
            results.push({
              url: svgContent,
              width: Math.round(rect.width),
              height: Math.round(rect.height),
              role: "logo",
              source: "inline-svg",
              svgContent: svg.outerHTML,
              filename: "logo.svg",
            });
          }
        } catch (svgError) {
          // Skip this SVG if there's an error
        }
      });

      return results;
    }, baseUrl);

    if (process.env.DEBUG_LOGO_DETECT === "true") {
      console.log(`[LogoDetect] Found ${svgLogos.length} inline SVG logo(s)`);
    }

    return svgLogos.map(logo => ({
      url: logo.url,
      width: logo.width,
      height: logo.height,
      role: "logo" as const,
      filename: logo.filename,
    }));
  } catch (error) {
    console.warn("[Crawler] Error extracting SVG logos:", error);
    return [];
  }
}

/**
 * ✅ NEW: Extract favicon and mask-icon as fallback logo candidates
 */
async function extractFaviconLogos(page: Page, baseUrl: string): Promise<CrawledImage[]> {
  try {
    const base = new URL(baseUrl);
    
    const faviconLogos = await page.evaluate((baseHref) => {
      const baseUrlObj = new URL(baseHref);
      const results: Array<{
        url: string;
        role: "logo";
        source: "favicon";
        fallback: true;
        filename?: string;
      }> = [];

      // Helper to normalize URL
      const normalizeUrl = (src: string | null): string | null => {
        if (!src) return null;
        try {
          if (src.startsWith("//")) return `${baseUrlObj.protocol}${src}`;
          if (src.startsWith("/")) return `${baseUrlObj.origin}${src}`;
          if (src.startsWith("http://") || src.startsWith("https://")) return src;
          return new URL(src, baseHref).href;
        } catch {
          return null;
        }
      };

      // Check for favicon links
      const faviconSelectors = [
        'link[rel="icon"]',
        'link[rel="shortcut icon"]',
        'link[rel="mask-icon"]',
        'link[rel="apple-touch-icon"]'
      ];

      faviconSelectors.forEach(selector => {
        try {
          document.querySelectorAll(selector).forEach(link => {
            const href = link.getAttribute("href");
            if (href) {
              const normalizedUrl = normalizeUrl(href);
              if (normalizedUrl) {
                const filename = normalizedUrl.split("/").pop() || "favicon.ico";
                results.push({
                  url: normalizedUrl,
                  role: "logo",
                  source: "favicon",
                  fallback: true,
                  filename,
                });
              }
            }
          });
        } catch {
          // Invalid selector, skip
        }
      });

      return results;
    }, baseUrl);

    if (process.env.DEBUG_LOGO_DETECT === "true" && faviconLogos.length > 0) {
      console.log(`[LogoDetect] Favicon used as fallback logo: ${faviconLogos[0].url}`);
    }

    return faviconLogos.map(logo => ({
      url: logo.url,
      role: "logo" as const,
      filename: logo.filename,
    }));
  } catch (error) {
    console.warn("[Crawler] Error extracting favicon logos:", error);
    return [];
  }
}

/**
 * ✅ NEW: Extract logo from OpenGraph metadata as fallback
 */
async function extractOgLogo(page: Page, baseUrl: string): Promise<CrawledImage | null> {
  try {
    const ogMetadata = await extractOpenGraphMetadata(page, baseUrl);
    
    // Prefer og:image, fallback to twitter:image
    const ogImage = ogMetadata?.image || ogMetadata?.twitterImage;
    
    if (ogImage) {
      if (process.env.DEBUG_LOGO_DETECT === "true") {
        console.log(`[LogoDetect] OG image used as fallback logo: ${ogImage}`);
      }
      
      return {
        url: ogImage,
        role: "logo" as const,
        filename: ogImage.split("/").pop() || "og-image.jpg",
      };
    }
    
    return null;
  } catch (error) {
    console.warn("[Crawler] Error extracting OG logo:", error);
    return null;
  }
}

/**
 * ✅ NEW: Merge logo candidates from all sources with priority ordering
 * Priority: Inline SVG > CSS background-image > <img> tags > OG image > Favicon
 */
function mergeLogoCandidates(
  htmlLogos: CrawledImage[],
  cssLogos: CrawledImage[],
  svgLogos: CrawledImage[],
  faviconLogo: CrawledImage | null,
  ogLogo: CrawledImage | null
): CrawledImage[] {
  const merged: CrawledImage[] = [];
  const seen = new Set<string>();

  // Priority 1: Inline SVG logos (strongest signal)
  svgLogos.forEach(logo => {
    if (!seen.has(logo.url)) {
      merged.push(logo);
      seen.add(logo.url);
    }
  });

  // Priority 2: CSS background-image logos
  cssLogos.forEach(logo => {
    if (!seen.has(logo.url)) {
      merged.push(logo);
      seen.add(logo.url);
    }
  });

  // Priority 3: HTML <img> logos
  htmlLogos.forEach(logo => {
    if (!seen.has(logo.url)) {
      merged.push(logo);
      seen.add(logo.url);
    }
  });

  // Priority 4: OG image (only if no other logos found)
  if (merged.length === 0 && ogLogo && !seen.has(ogLogo.url)) {
    merged.push(ogLogo);
    seen.add(ogLogo.url);
  }

  // Priority 5: Favicon (only if no other logos found)
  if (merged.length === 0 && faviconLogo && !seen.has(faviconLogo.url)) {
    merged.push(faviconLogo);
    seen.add(faviconLogo.url);
  }

  if (process.env.DEBUG_LOGO_DETECT === "true") {
    console.log(`[LogoDetect] Merged logo candidates:`, {
      svgLogos: svgLogos.length,
      cssLogos: cssLogos.length,
      htmlLogos: htmlLogos.length,
      ogLogo: ogLogo ? 1 : 0,
      faviconLogo: faviconLogo ? 1 : 0,
      totalMerged: merged.length,
    });
  }

  return merged;
}

/**
 * Extract images from a page with smart prioritization
 * 
 * SIMPLIFIED & ROBUST: 
 * - Waits for images to load before extracting dimensions
 * - More lenient filtering (accepts images without dimensions)
 * - Better error handling
 * - Logs extraction progress
 * - ✅ ENHANCED: Now extracts logos from CSS, SVG, favicon, and OG metadata
 */
async function extractImages(page: Page, baseUrl: string, brandName?: string): Promise<CrawledImage[]> {
  try {
    const pageType = detectPageType(baseUrl);
    
    // ✅ CRITICAL: Wait for images to load before extracting dimensions
    // This ensures naturalWidth/naturalHeight are available
    await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {
      // Continue even if networkidle times out
      console.log("[Crawler] Network idle timeout, continuing with image extraction");
    });
    
    // Wait a bit more for lazy-loaded images
    await page.waitForTimeout(1000);
    
    // ✅ NEW: Get page context for brand matching
    const pageContext = await page.evaluate(() => {
      const title = document.title || "";
      const ogSiteName = document.querySelector('meta[property="og:site_name"]')?.getAttribute("content") || "";
      const mainH1 = document.querySelector("h1")?.textContent?.trim() || "";
      return { title, ogSiteName, mainH1 };
    });

    const images = await page.evaluate((args) => {
      const { url, brandName } = args;
      const base = new URL(url);
      const results: Array<{
        url: string;
        alt?: string;
        width?: number;
        height?: number;
        role?: "logo" | "hero" | "other";
        filename?: string;
        // ✅ NEW: Context metadata
        inHeaderOrNav?: boolean;
        inFooter?: boolean;
        inAffiliateOrPartnerSection?: boolean;
        inHeroOrAboveFold?: boolean;
      }> = [];

      // Helper to normalize URL
      const normalizeUrl = (src: string | null): string | null => {
        if (!src) return null;
        try {
          // Handle relative URLs
          if (src.startsWith("//")) {
            return `${base.protocol}${src}`;
          }
          if (src.startsWith("/")) {
            return `${base.origin}${src}`;
          }
          if (src.startsWith("http://") || src.startsWith("https://")) {
            return src;
          }
          // Relative path
          return new URL(src, base.href).href;
        } catch {
          return null;
        }
      };

      // Helper to extract filename
      const getFilename = (url: string): string => {
        try {
          const urlObj = new URL(url);
          const pathname = urlObj.pathname;
          return pathname.split("/").pop() || "";
        } catch {
          return "";
        }
      };

      // ✅ NEW: Helper to detect if element is in affiliate/partner section
      const isInAffiliateSection = (el: Element): boolean => {
        let current: Element | null = el;
        const maxDepth = 10; // Prevent infinite loops
        let depth = 0;
        
        while (current && depth < maxDepth) {
          const text = current.textContent?.toLowerCase() || "";
          const heading = current.querySelector("h1, h2, h3, h4, h5, h6")?.textContent?.toLowerCase() || "";
          const ariaLabel = current.getAttribute("aria-label")?.toLowerCase() || "";
          const className = current.className?.toString().toLowerCase() || "";
          const id = current.id?.toLowerCase() || "";
          
          const combinedText = `${text} ${heading} ${ariaLabel} ${className} ${id}`;
          
          const affiliateKeywords = [
            "partner", "partners", "association", "associations",
            "affiliation", "affiliations", "member", "membership",
            "vendor", "vendors", "technology partners", "sponsor", "sponsored",
            "powered by", "as seen on", "featured in", "cause", "we support",
            "community partners", "brokers", "advisors", "custodian"
          ];
          
          if (affiliateKeywords.some(keyword => combinedText.includes(keyword))) {
            return true;
          }
          
          current = current.parentElement;
          depth++;
        }
        
        return false;
      };

      // Extract <img> tags
      const imgElements = document.querySelectorAll("img");
      console.log(`[Browser] Found ${imgElements.length} img elements`);
      
      imgElements.forEach((img) => {
        try {
          const src = img.getAttribute("src") || img.getAttribute("srcset")?.split(",")[0]?.trim().split(" ")[0];
          const normalizedUrl = normalizeUrl(src);
          if (!normalizedUrl) return;

          // ✅ MORE LENIENT: Try multiple ways to get dimensions
          // naturalWidth/naturalHeight are most accurate but may be 0 if image hasn't loaded
          // width/height attributes are fallback
          // clientWidth/clientHeight are last resort
          let width: number | undefined = undefined;
          let height: number | undefined = undefined;
          
          if (img.naturalWidth && img.naturalHeight && img.naturalWidth > 0 && img.naturalHeight > 0) {
            width = img.naturalWidth;
            height = img.naturalHeight;
          } else if (img.width && img.height && img.width > 0 && img.height > 0) {
            width = img.width;
            height = img.height;
          } else if (img.clientWidth && img.clientHeight && img.clientWidth > 0 && img.clientHeight > 0) {
            width = img.clientWidth;
            height = img.clientHeight;
          }
          
          const alt = img.getAttribute("alt") || undefined;
          const filename = getFilename(normalizedUrl);

          // ✅ NEW: Detect context
          const isInHeader = img.closest("header") !== null || img.closest("nav") !== null;
          const headerNavClasses = ["header", "site-header", "navbar", "top-nav", "logo-bar", "main-header", "site-header"];
          const isInHeaderByClass = headerNavClasses.some(cls => {
            const ancestor = img.closest(`.${cls}, #${cls}, [class*="${cls}"], [id*="${cls}"]`);
            return ancestor !== null;
          });
          const inHeaderOrNav = isInHeader || isInHeaderByClass;
          
          const isInFooter = img.closest("footer") !== null;
          const footerClasses = ["footer", "site-footer", "page-footer"];
          const isInFooterByClass = footerClasses.some(cls => {
            const ancestor = img.closest(`.${cls}, #${cls}, [class*="${cls}"], [id*="${cls}"]`);
            return ancestor !== null;
          });
          const inFooter = isInFooter || isInFooterByClass;
          
          const inAffiliateOrPartnerSection = isInAffiliateSection(img);
          
          const rect = img.getBoundingClientRect();
          const isAboveFold = rect.top < window.innerHeight * 1.5; // Within 1.5 viewport heights
          const heroClasses = ["hero", "banner", "masthead", "jumbotron", "hero-section"];
          const isInHeroByClass = heroClasses.some(cls => {
            const ancestor = img.closest(`.${cls}, [class*="${cls}"]`);
            return ancestor !== null;
          });
          const inHeroOrAboveFold = isAboveFold || isInHeroByClass;

          // Determine initial role (will be refined later)
          let role: "logo" | "hero" | "other" = "other";

          // ✅ IMPROVED: Stricter logo detection - prioritize size and location
          const altLower = alt?.toLowerCase() || "";
          const filenameLower = filename.toLowerCase();
          const parentClasses = img.parentElement?.className?.toLowerCase() || "";
          const parentId = img.parentElement?.id?.toLowerCase() || "";
          const isSmall = width ? (width < 400 && height ? height < 400 : false) : false;
          const isVerySmall = width ? (width < 300 && height ? height < 300 : false) : false;
          const isLarge = width && height && ((width > 600 && height > 400) || (width > 400 && height > 600));
          const brandNameLower = brandName?.toLowerCase().replace(/\s+/g, "-") || "";

          // ✅ STRICT LOGO DETECTION: Only classify as logo if:
          // 1. Small image (< 400px) AND (in header/nav OR has clear logo indicators)
          // 2. Very small image (< 300px) with logo indicators
          // Large images are never logos - they're hero/brand images
          const hasLogoIndicator = altLower.includes("logo") ||
            filenameLower.includes("logo") ||
            (brandNameLower && (filenameLower.includes(brandNameLower) || altLower.includes(brandName?.toLowerCase() || ""))) ||
            parentClasses.includes("logo") ||
            parentId.includes("logo");
          
          if (isLarge) {
            // Large images are hero/brand images, never logos
            role = inHeroOrAboveFold ? "hero" : "other";
          } else if ((inHeaderOrNav && (isSmall || isVerySmall)) || (hasLogoIndicator && isVerySmall)) {
            // Only small images in header/nav or very small with logo indicators
            role = "logo";
          } else if (hasLogoIndicator && !isSmall) {
            // Has logo indicator but not small - likely a brand image, not a logo
            role = inHeroOrAboveFold ? "hero" : "other";
          }

          results.push({
            url: normalizedUrl,
            alt,
            width,
            height,
            role,
            filename,
            inHeaderOrNav,
            inFooter,
            inAffiliateOrPartnerSection,
            inHeroOrAboveFold,
          });
        } catch (imgError) {
          // Skip this image if there's an error, but continue with others
          console.warn("[Browser] Error processing image:", imgError);
        }
      });

      // Extract background images from major sections
      const sections = document.querySelectorAll("section, main, [class*='hero'], [class*='banner']");
      sections.forEach((section) => {
        try {
          const style = window.getComputedStyle(section);
          const bgImage = style.backgroundImage;
          if (bgImage && bgImage !== "none") {
            const match = bgImage.match(/url\(['"]?([^'"]+)['"]?\)/);
            if (match && match[1]) {
              const normalizedUrl = normalizeUrl(match[1]);
              if (normalizedUrl) {
                const rect = section.getBoundingClientRect();
                const filename = getFilename(normalizedUrl);
                results.push({
                  url: normalizedUrl,
                  width: rect.width > 0 ? rect.width : undefined,
                  height: rect.height > 0 ? rect.height : undefined,
                  role: rect.top < window.innerHeight * 2 ? "hero" : "other", // More lenient
                  filename,
                });
              }
            }
          }
        } catch (sectionError) {
          // Skip this section if there's an error
          console.warn("[Browser] Error processing background image:", sectionError);
        }
      });

      console.log(`[Browser] Extracted ${results.length} images total`);
      return results;
    }, { url: baseUrl, brandName: brandName || undefined });
    
    console.log(`[Crawler] Extracted ${images.length} HTML images from page ${baseUrl}`);

    // ✅ ENHANCED: Extract logos from CSS, SVG, favicon, and OG metadata
    const cssLogos = await extractCssLogos(page, baseUrl).catch(() => []);
    const svgLogos = await extractSvgLogos(page, baseUrl).catch(() => []);
    const faviconLogos = await extractFaviconLogos(page, baseUrl).catch(() => []);
    const faviconLogo = faviconLogos.length > 0 ? faviconLogos[0] : null;
    const ogLogo = await extractOgLogo(page, baseUrl).catch(() => null);

    // ✅ NEW: Enrich HTML logos with context and brand match scores
    const htmlLogos: CrawledImage[] = images
      .filter(img => img.role === "logo")
      .map(img => {
        const brandMatchScore = calculateBrandMatchScore(
          img,
          brandName,
          pageContext.title,
          pageContext.ogSiteName,
          pageContext.mainH1
        );
        return {
          url: img.url,
          alt: img.alt,
          width: img.width,
          height: img.height,
          role: "logo" as const,
          filename: img.filename,
          inHeaderOrNav: img.inHeaderOrNav,
          inFooter: img.inFooter,
          inAffiliateOrPartnerSection: img.inAffiliateOrPartnerSection,
          inHeroOrAboveFold: img.inHeroOrAboveFold,
          brandMatchScore,
          sourceType: "html-img" as const,
        };
      });
    const htmlNonLogos = images.filter(img => img.role !== "logo");

    // ✅ NEW: Enrich CSS/SVG/favicon/OG logos with context
    const enrichedCssLogos: CrawledImage[] = cssLogos.map(logo => ({
      ...logo,
      role: "logo" as const,
      inHeaderOrNav: true, // CSS logos are typically in header/nav
      sourceType: "css-bg" as const,
      brandMatchScore: calculateBrandMatchScore(logo, brandName, pageContext.title, pageContext.ogSiteName, pageContext.mainH1),
    }));
    
    const enrichedSvgLogos: CrawledImage[] = svgLogos.map(logo => ({
      ...logo,
      role: "logo" as const,
      inHeaderOrNav: true, // SVG logos are typically in header/nav
      sourceType: "svg" as const,
      brandMatchScore: calculateBrandMatchScore(logo, brandName, pageContext.title, pageContext.ogSiteName, pageContext.mainH1),
    }));
    
    const enrichedFaviconLogo: CrawledImage | null = faviconLogo ? {
      ...faviconLogo,
      role: "logo" as const,
      sourceType: "favicon" as const,
      brandMatchScore: 0, // Favicon is fallback, low brand match
    } : null;
    
    const enrichedOgLogo: CrawledImage | null = ogLogo ? {
      ...ogLogo,
      role: "logo" as const,
      sourceType: "og" as const,
      brandMatchScore: calculateBrandMatchScore(ogLogo, brandName, pageContext.title, pageContext.ogSiteName, pageContext.mainH1),
    } : null;

    // ✅ MERGE: Combine all logo sources with priority ordering
    const mergedLogos = mergeLogoCandidates(htmlLogos, enrichedCssLogos, enrichedSvgLogos, enrichedFaviconLogo, enrichedOgLogo);

    // Deduplicate non-logo images by URL
    const seen = new Set<string>();
    const uniqueNonLogos = htmlNonLogos.filter((img) => {
      if (seen.has(img.url)) return false;
      seen.add(img.url);
      return true;
    });

    // Combine merged logos with other images
    const allImages = [...mergedLogos, ...uniqueNonLogos];

    // Categorize and enrich images with page type and priority
    // ✅ IMPROVED: Re-evaluate all images, including those initially marked as logos
    const categorizedImages: CrawledImage[] = allImages.map((img) => {
      // ✅ STRICT LOGO VALIDATION: Re-classify oversized "logos" as brand images
      // If image is > 400px in either dimension, it's likely a hero/brand image, not a logo
      const isOversizedForLogo = img.width && img.height && 
        (img.width > 400 || img.height > 400 || (img.width * img.height > 200000)); // > 200k pixels
      
      // ✅ RE-EVALUATE: Even if marked as logo, re-check if it should be a brand image
      let roleToAssign = img.role || "other";
      
      if (img.role === "logo" && isOversizedForLogo) {
        // Oversized logo - reclassify as hero/photo based on context
        if (img.inHeroOrAboveFold || (img.width && img.height && img.width > 600 && img.height > 400)) {
          roleToAssign = "hero";
        } else {
          roleToAssign = "photo"; // Large brand image, not a logo
        }
      } else {
        // Standard categorization - allow re-evaluation even for logos
        roleToAssign = categorizeImage(img, baseUrl, pageType, brandName);
        
        // ✅ DOUBLE-CHECK: If categorized as logo but oversized, downgrade to brand image
        if (roleToAssign === "logo" && isOversizedForLogo) {
          roleToAssign = img.inHeroOrAboveFold ? "hero" : "photo";
        }
      }
      
      return {
        url: img.url,
        alt: img.alt,
        width: img.width,
        height: img.height,
        role: roleToAssign,
        pageType,
        filename: img.filename,
        // ✅ PRESERVE: Keep context fields from extraction (with type safety)
        inHeaderOrNav: "inHeaderOrNav" in img ? img.inHeaderOrNav : undefined,
        inFooter: "inFooter" in img ? img.inFooter : undefined,
        inAffiliateOrPartnerSection: "inAffiliateOrPartnerSection" in img ? img.inAffiliateOrPartnerSection : undefined,
        inHeroOrAboveFold: "inHeroOrAboveFold" in img ? img.inHeroOrAboveFold : undefined,
        brandMatchScore: "brandMatchScore" in img ? img.brandMatchScore : undefined,
        sourceType: "sourceType" in img ? img.sourceType : undefined,
      };
    });

    // Calculate priority scores
    categorizedImages.forEach((img) => {
      img.priority = calculateImagePriority(img);
    });

    // Sort by priority (highest first)
    const sortedImages = categorizedImages.sort((a, b) => {
      const priorityA = a.priority || 0;
      const priorityB = b.priority || 0;
      return priorityB - priorityA; // Descending order
    });

    // ✅ SIMPLIFIED FILTERING: More lenient - accept images even without dimensions
    // Only filter out obvious junk (placeholders, data URIs, very small confirmed icons)
    const filteredImages = sortedImages.filter((img) => {
      // Skip data URIs (usually icons or embedded images)
      if (img.url.startsWith("data:")) return false;
      
      // Skip common placeholder patterns
      const urlLower = img.url.toLowerCase();
      if (urlLower.includes("placeholder") || urlLower.includes("logo-placeholder")) return false;
      
      // Only skip very small images if we have confirmed dimensions
      // If dimensions are missing, accept the image (it might be lazy-loaded)
      if (img.width && img.height) {
        // Skip confirmed tiny icons (but be lenient - 50x50 instead of 100x100)
        if (img.width < 50 && img.height < 50) return false;
      }
      
      // Accept all other images (even without dimensions)
      return true;
    });

    console.log(`[Crawler] Filtered to ${filteredImages.length} images (from ${sortedImages.length} total)`);

    // Limit to 15 images max (10-15 range as specified)
    const finalImages = filteredImages.slice(0, 15);
    
    // ✅ ENHANCED: Log classification summary with role breakdown
    const logoCount = finalImages.filter(img => img.role === "logo").length;
    const heroCount = finalImages.filter(img => img.role === "hero").length;
    const photoCount = finalImages.filter(img => img.role === "photo").length;
    const otherCount = finalImages.filter(img => !["logo", "hero", "photo"].includes(img.role || "")).length;
    
    console.log(`[Crawler] Logo detection summary for ${baseUrl}:`, {
      totalImages: finalImages.length,
      logosFound: logoCount,
      heroesFound: heroCount,
      photosFound: photoCount,
      otherImages: otherCount,
      logosFromSvg: svgLogos.length,
      logosFromCss: cssLogos.length,
      logosFromHtml: htmlLogos.length,
      logosFromOg: ogLogo ? 1 : 0,
      logosFromFavicon: faviconLogo ? 1 : 0,
      roleBreakdown: {
        logo: logoCount,
        hero: heroCount,
        photo: photoCount,
        other: otherCount,
      },
    });
    
    console.log(`[Crawler] Returning ${finalImages.length} images for page ${baseUrl}`);
    
    return finalImages;
  } catch (error) {
    console.error("[Crawler] Error extracting images:", error);
    console.error("[Crawler] Error details:", {
      url: baseUrl,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    // Return empty array on error (don't crash the crawler)
    return [];
  }
}

/**
 * Extract headlines from crawl results
 */
function extractHeadlines(crawlResults: CrawlResult[]): string[] {
  const headlines: string[] = [];
  const seen = new Set<string>();

  for (const result of crawlResults) {
    // Collect H1, H2, H3
    const allHeadings = [...result.h1, ...result.h2, ...result.h3];
    
    for (const heading of allHeadings) {
      const cleaned = heading.trim();
      if (cleaned && cleaned.length > 3 && !seen.has(cleaned.toLowerCase())) {
        headlines.push(cleaned);
        seen.add(cleaned.toLowerCase());
        if (headlines.length >= 5) break; // Limit to 5 unique headlines
      }
    }
    
    if (headlines.length >= 5) break;
  }

  return headlines;
}

/**
 * Extract content from a single page
 */
async function extractPageContent(
  page: Page,
  url: string,
): Promise<CrawlResult> {
  // Extract title
  const title = await page.title();

  // Extract meta description
  const metaDescription = await page
    .$eval('meta[name="description"]', (el) => el.getAttribute("content") || "")
    .catch(() => "");

  // Extract headings
  const h1 = await page.$$eval("h1", (els) =>
    els.map((el) => el.textContent?.trim() || ""),
  );
  const h2 = await page.$$eval("h2", (els) =>
    els.map((el) => el.textContent?.trim() || ""),
  );
  const h3 = await page.$$eval("h3", (els) =>
    els.map((el) => el.textContent?.trim() || ""),
  );

  // Extract body text (excluding nav, footer, script, style)
  const bodyText = await page.evaluate(() => {
    const excludeSelectors = [
      "nav",
      "footer",
      "script",
      "style",
      "noscript",
      "iframe",
    ];
    const clone = document.body.cloneNode(true) as HTMLElement;

    excludeSelectors.forEach((selector) => {
      clone.querySelectorAll(selector).forEach((el) => el.remove());
    });

    return clone.textContent?.trim() || "";
  });

  // Extract images (we don't have brand name here, but can extract from URL if needed)
  // For now, pass undefined - logo detection will work with filename/URL checks
  let images: CrawledImage[] = [];
  try {
    // ✅ CRITICAL: Extract brand name from URL for better logo detection
    const brandNameFromUrl = extractBrandNameFromUrl(url);
    images = await extractImages(page, url, brandNameFromUrl);
    console.log(`[Crawler] Extracted ${images.length} images from ${url}`, {
      url,
      imagesCount: images.length,
      logos: images.filter(img => img.role === "logo").length,
      heroes: images.filter(img => img.role === "hero").length,
      others: images.filter(img => img.role === "other").length,
      sampleImage: images[0]?.url?.substring(0, 100),
    });
  } catch (error) {
    console.error("[Crawler] ❌ Error extracting images from page:", error);
    console.error("[Crawler] Error details:", {
      url,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    // Continue with empty array - don't crash the crawler
    images = [];
  }

  // Extract headlines from this page
  const headlines = [...h1, ...h2, ...h3]
    .map((h) => h.trim())
    .filter((h) => h.length > 3)
    .slice(0, 5);

  // Extract typography (fonts)
  const typography = await extractTypography(page).catch((error) => {
    console.warn("[Crawler] Error extracting typography:", error);
    return undefined;
  });

  // ✅ Extract Open Graph metadata
  const openGraph = await extractOpenGraphMetadata(page, url).catch((error) => {
    console.warn("[Crawler] Error extracting Open Graph metadata:", error);
    return undefined;
  });

  // Create hash for deduplication
  const hash = crypto.createHash("md5").update(bodyText).digest("hex");

  return {
    url,
    title,
    metaDescription,
    h1,
    h2,
    h3,
    bodyText,
    hash,
    images,
    headlines,
    typography,
    openGraph,
  };
}

/**
 * Extract Open Graph metadata from page
 * Extracts og:title, og:description, og:image, og:url, og:type, and Twitter Card tags
 * Normalizes relative URLs to absolute URLs
 */
async function extractOpenGraphMetadata(
  page: Page,
  baseUrl: string
): Promise<OpenGraphMetadata | undefined> {
  try {
    const base = new URL(baseUrl);
    
    const ogData = await page.evaluate((baseHref) => {
      const baseUrlObj = new URL(baseHref);
      const metadata: Record<string, string> = {};

      // Extract Open Graph tags
      document.querySelectorAll('meta[property^="og:"]').forEach((meta) => {
        const property = meta.getAttribute("property");
        const content = meta.getAttribute("content");
        if (property && content) {
          // Remove "og:" prefix
          const key = property.replace("og:", "");
          metadata[key] = content;
        }
      });

      // Extract Twitter Card tags
      document.querySelectorAll('meta[name^="twitter:"]').forEach((meta) => {
        const name = meta.getAttribute("name");
        const content = meta.getAttribute("content");
        if (name && content) {
          // Remove "twitter:" prefix and add twitter prefix
          const key = `twitter${name.replace("twitter:", "")}`;
          metadata[key] = content;
        }
      });

      // Normalize relative URLs to absolute URLs
      const normalizeUrl = (url: string | undefined): string | undefined => {
        if (!url) return undefined;
        try {
          // If already absolute, return as-is
          if (url.startsWith("http://") || url.startsWith("https://")) {
            return url;
          }
          // If protocol-relative, add protocol
          if (url.startsWith("//")) {
            return `${baseUrlObj.protocol}${url}`;
          }
          // If root-relative, prepend origin
          if (url.startsWith("/")) {
            return `${baseUrlObj.origin}${url}`;
          }
          // If relative, resolve against base URL
          return new URL(url, baseHref).href;
        } catch {
          return undefined;
        }
      };

      // Normalize URLs
      if (metadata.image) {
        metadata.image = normalizeUrl(metadata.image) || metadata.image;
      }
      if (metadata.url) {
        metadata.url = normalizeUrl(metadata.url) || metadata.url;
      }
      if (metadata.twitterImage) {
        metadata.twitterImage = normalizeUrl(metadata.twitterImage) || metadata.twitterImage;
      }

      return metadata;
    }, baseUrl);

    // Return undefined if no OG data found
    if (!ogData || Object.keys(ogData).length === 0) {
      return undefined;
    }

    return {
      title: ogData.title || undefined,
      description: ogData.description || undefined,
      image: ogData.image || undefined,
      url: ogData.url || undefined,
      type: ogData.type || undefined,
      siteName: ogData.site_name || undefined,
      twitterTitle: ogData.twitterTitle || undefined,
      twitterDescription: ogData.twitterDescription || undefined,
      twitterImage: ogData.twitterImage || undefined,
      twitterCard: ogData.twitterCard || undefined,
    };
  } catch (error) {
    console.error("[Crawler] Error extracting Open Graph metadata:", error);
    return undefined;
  }
}

/**
 * Extract typography (fonts) from page
 * Detects heading and body fonts from computed styles
 */
async function extractTypography(page: Page): Promise<TypographyData | undefined> {
  try {
    const fontData = await page.evaluate(() => {
      // Get heading font (from h1, h2, h3)
      const headingElements = document.querySelectorAll("h1, h2, h3");
      const headingFonts = new Map<string, number>();
      
      headingElements.forEach((el) => {
        const computed = window.getComputedStyle(el);
        const fontFamily = computed.fontFamily;
        // Extract first font family (before comma)
        const primaryFont = fontFamily.split(",")[0].replace(/['"]/g, "").trim();
        if (primaryFont && primaryFont !== "serif" && primaryFont !== "sans-serif" && primaryFont !== "monospace") {
          headingFonts.set(primaryFont, (headingFonts.get(primaryFont) || 0) + 1);
        }
      });

      // Get body font (from p, body, main content)
      const bodyElements = document.querySelectorAll("p, body, main, article, section");
      const bodyFonts = new Map<string, number>();
      
      bodyElements.forEach((el) => {
        const computed = window.getComputedStyle(el);
        const fontFamily = computed.fontFamily;
        const primaryFont = fontFamily.split(",")[0].replace(/['"]/g, "").trim();
        if (primaryFont && primaryFont !== "serif" && primaryFont !== "sans-serif" && primaryFont !== "monospace") {
          bodyFonts.set(primaryFont, (bodyFonts.get(primaryFont) || 0) + 1);
        }
      });

      // Find most common heading font
      let headingFont = "";
      let maxHeadingCount = 0;
      headingFonts.forEach((count, font) => {
        if (count > maxHeadingCount) {
          maxHeadingCount = count;
          headingFont = font;
        }
      });

      // Find most common body font
      let bodyFont = "";
      let maxBodyCount = 0;
      bodyFonts.forEach((count, font) => {
        if (count > maxBodyCount) {
          maxBodyCount = count;
          bodyFont = font;
        }
      });

      // If no heading font found, use body font
      if (!headingFont && bodyFont) {
        headingFont = bodyFont;
      }
      // If no body font found, use heading font
      if (!bodyFont && headingFont) {
        bodyFont = headingFont;
      }
      // If still no fonts, use default
      if (!headingFont && !bodyFont) {
        return null;
      }

      return {
        heading: headingFont || bodyFont || "Inter",
        body: bodyFont || headingFont || "Inter",
      };
    });

    if (!fontData) {
      return undefined;
    }

    // Determine source (check if it's a Google Font)
    const googleFonts = [
      "Inter", "Roboto", "Open Sans", "Lato", "Montserrat", "Poppins", "Raleway",
      "Oswald", "Source Sans Pro", "Playfair Display", "Merriweather", "PT Sans",
      "Nunito", "Ubuntu", "Crimson Text", "Fira Sans", "Droid Sans", "Droid Serif"
    ];
    const isGoogleFont = googleFonts.some(gf => 
      fontData.heading.toLowerCase().includes(gf.toLowerCase()) ||
      fontData.body.toLowerCase().includes(gf.toLowerCase())
    );

    return {
      heading: fontData.heading,
      body: fontData.body,
      source: isGoogleFont ? "google" : "custom",
    };
  } catch (error) {
    console.error("[Crawler] Error extracting typography:", error);
    return undefined;
  }
}

/**
 * ✅ ENHANCED: Extract color palette focusing on UI/brand colors
 * Prioritizes colors from UI elements (header, nav, buttons, CSS variables) over photo colors
 */
export async function extractColors(url: string): Promise<ColorPalette> {
  let browser: Browser | null = null;

  try {
    browser = await launchBrowser();
    const page = await browser.newPage({ userAgent: CRAWL_USER_AGENT });
    
    // Prevent bundler-generated helpers from breaking in the browser context
    await page.addInitScript(() => {
      // Some bundlers emit calls like __name(fn, "fnName") for stack traces.
      // Define a no-op helper so these calls do not throw ReferenceError.
      (window as any).__name ??= (fn: unknown, _name?: string) => fn;
    });
    
    await page.goto(url, {
      timeout: CRAWL_TIMEOUT_MS,
      waitUntil: "networkidle",
    });

    // ✅ NEW: Extract UI colors from CSS and computed styles
    const uiColors = await page.evaluate(() => {
      const colorCandidates: Map<string, { count: number; source: "ui" | "image" }> = new Map();
      
      // Helper to normalize hex color
      const normalizeHex = (color: string): string | null => {
        // Handle rgb/rgba
        if (color.startsWith("rgb")) {
          const match = color.match(/\d+/g);
          if (match && match.length >= 3) {
            const r = parseInt(match[0]);
            const g = parseInt(match[1]);
            const b = parseInt(match[2]);
            return `#${[r, g, b].map(x => x.toString(16).padStart(2, "0")).join("")}`;
          }
        }
        // Handle hex
        if (color.startsWith("#")) {
          if (color.length === 4) {
            // #RGB -> #RRGGBB
            return `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`;
          }
          return color.length === 7 ? color : null;
        }
        return null;
      };
      
      // Helper to add color with weight
      const addColor = (color: string, source: "ui" | "image", weight: number = 1) => {
        const normalized = normalizeHex(color);
        if (!normalized) return;
        const existing = colorCandidates.get(normalized);
        if (existing) {
          existing.count += weight;
          // Prefer UI source over image source
          if (source === "ui" && existing.source === "image") {
            existing.source = "ui";
          }
        } else {
          colorCandidates.set(normalized, { count: weight, source });
        }
      };
      
      // ✅ PRIORITY 1: CSS Variables (--primary, --secondary, --accent, --brand-*)
      const rootStyle = getComputedStyle(document.documentElement);
      const cssVars = [
        "--primary", "--secondary", "--accent", "--brand-primary", "--brand-secondary",
        "--color-primary", "--color-secondary", "--main-color", "--accent-color"
      ];
      cssVars.forEach(varName => {
        const value = rootStyle.getPropertyValue(varName).trim();
        if (value) {
          addColor(value, "ui", 5); // High weight for CSS variables
        }
      });
      
      // ✅ PRIORITY 2: Header/Nav background and text colors
      const headerNav = document.querySelectorAll("header, nav, .header, .navbar, .site-header");
      headerNav.forEach(el => {
        const style = getComputedStyle(el);
        // Background color
        if (style.backgroundColor && style.backgroundColor !== "transparent" && style.backgroundColor !== "rgba(0, 0, 0, 0)") {
          addColor(style.backgroundColor, "ui", 4);
        }
        // Text color
        if (style.color) {
          addColor(style.color, "ui", 2);
        }
        // Border color
        if (style.borderColor && style.borderColor !== "transparent") {
          addColor(style.borderColor, "ui", 1);
        }
      });
      
      // ✅ PRIORITY 3: Button and CTA colors
      const buttons = document.querySelectorAll("button, .btn, .button, [class*='cta'], [class*='button'], a[class*='btn']");
      buttons.forEach(btn => {
        const style = getComputedStyle(btn);
        // Background color
        if (style.backgroundColor && style.backgroundColor !== "transparent" && style.backgroundColor !== "rgba(0, 0, 0, 0)") {
          addColor(style.backgroundColor, "ui", 3);
        }
        // Text color
        if (style.color) {
          addColor(style.color, "ui", 2);
        }
      });
      
      // ✅ PRIORITY 4: Accent elements (badges, tags, chips)
      const accentElements = document.querySelectorAll(".badge, .tag, .chip, [class*='badge'], [class*='tag'], [class*='pill']");
      accentElements.forEach(el => {
        const style = getComputedStyle(el);
        if (style.backgroundColor && style.backgroundColor !== "transparent" && style.backgroundColor !== "rgba(0, 0, 0, 0)") {
          addColor(style.backgroundColor, "ui", 2);
        }
      });
      
      // ✅ PRIORITY 5: Hero section overlays and text
      const heroSections = document.querySelectorAll(".hero, .banner, .masthead, [class*='hero'], [class*='banner']");
      heroSections.forEach(hero => {
        const style = getComputedStyle(hero);
        // Text color in hero (often brand color)
        if (style.color) {
          addColor(style.color, "ui", 2);
        }
        // Background gradient colors (extract first color)
        if (style.backgroundImage && style.backgroundImage.includes("gradient")) {
          const gradientMatch = style.backgroundImage.match(/rgb\([^)]+\)/);
          if (gradientMatch) {
            addColor(gradientMatch[0], "ui", 1);
          }
        }
      });
      
      // ✅ DE-PRIORITIZE: Colors from images (lower weight)
      // We'll still extract from screenshot but with lower priority
      const images = document.querySelectorAll("img");
      images.forEach(img => {
        // Skip large hero images (likely photos)
        if (img.naturalWidth > 800 || img.naturalHeight > 600) {
          // These are likely photos, skip
          return;
        }
        // Small images might be logos/brand elements, but still lower priority
        const style = getComputedStyle(img);
        if (style.borderColor && style.borderColor !== "transparent") {
          addColor(style.borderColor, "image", 0.5);
        }
      });
      
      // Sort by count (frequency) and source (UI preferred)
      const sorted = Array.from(colorCandidates.entries())
        .sort((a, b) => {
          // Prefer UI colors
          if (a[1].source === "ui" && b[1].source === "image") return -1;
          if (a[1].source === "image" && b[1].source === "ui") return 1;
          // Then by count
          return b[1].count - a[1].count;
        })
        .slice(0, 12); // Get top 12 candidates
      
      return sorted.map(([color]) => color);
    });

    // ✅ FALLBACK: Extract from screenshot if UI colors are insufficient
    const screenshot = await page.screenshot({ fullPage: false });
    const palette = await Vibrant.from(screenshot).getPalette();

    // Combine UI colors with screenshot colors
    const allColorCandidates: string[] = [...uiColors];
    
    // Add screenshot colors (but with lower priority if they're not in UI colors)
    const screenshotColors = [
      palette.Vibrant?.hex,
      palette.Muted?.hex,
      palette.DarkVibrant?.hex,
      palette.LightVibrant?.hex,
      palette.LightMuted?.hex,
      palette.DarkMuted?.hex,
    ].filter((c): c is string => !!c);
    
    // Only add screenshot colors that aren't already in UI colors
    screenshotColors.forEach(color => {
      const normalized = color.startsWith("#") ? color : `#${color}`;
      if (!allColorCandidates.includes(normalized)) {
        allColorCandidates.push(normalized);
      }
    });

    // ✅ FILTER: Remove near-duplicates and skin tones/photo colors
    const filteredColors = filterBrandColors(allColorCandidates);
    
    // Normalize to hex (ensure # prefix)
    const normalizeHex = (color: string | undefined): string | undefined => {
      if (!color) return undefined;
      return color.startsWith("#") ? color : `#${color}`;
    };

    // Build 6-color palette structure (prioritize UI colors)
    const primaryColors = filteredColors.slice(0, 3).map(normalizeHex).filter((c): c is string => !!c);
    const secondaryColors = filteredColors.slice(3, 6).map(normalizeHex).filter((c): c is string => !!c);
    const allColors = [...primaryColors, ...secondaryColors].slice(0, 6);

    // If we have fewer than 6, that's fine - return what we have
    const primary = allColors[0] || undefined;
    const secondary = allColors[1] || undefined;
    const accent = allColors[2] || undefined;

    const colors: ColorPalette = {
      primary: primary || undefined,
      secondary: secondary || undefined,
      accent: accent || undefined,
      confidence: palette.Vibrant?.population || 0,
      // Extended palette for 6-color support
      primaryColors: allColors.slice(0, 3), // First 3 as primary
      secondaryColors: allColors.slice(3, 6), // Next 3 as secondary/accent
      allColors, // All 6 colors
    };

    // ✅ DEBUG LOGGING
    if (process.env.DEBUG_COLOR_EXTRACT === "true") {
      console.log(`[ColorExtract] Extracted palette for ${url}:`, {
        uiColors: uiColors.length,
        screenshotColors: screenshotColors.length,
        filtered: filteredColors.length,
        finalPalette: allColors,
        primary,
        secondary,
        accent,
      });
    }

    await browser.close();
    return colors;
  } catch (error) {
    console.error("[Crawler] Error extracting colors:", error);
    // ✅ GUARDRAIL: Fallback to minimal palette if extraction fails
    if (process.env.DEBUG_COLOR_EXTRACT === "true") {
      console.warn("[ColorExtract] Color extraction failed, using fallback palette");
    }
    // Return minimal fallback palette
    return {
      primary: "#312E81",
      secondary: "#6366F1",
      accent: "#8B5CF6",
      confidence: 0,
      primaryColors: ["#312E81", "#6366F1", "#8B5CF6"],
      secondaryColors: [],
      allColors: ["#312E81", "#6366F1", "#8B5CF6"],
    };
  } finally {
    if (browser) await browser.close();
  }
}

/**
 * ✅ ENHANCED: Filter brand colors - remove near-duplicates, photo colors, and placeholder fills
 * 
 * FIX 2025-12-10: Added filtering for:
 * - Pure black (#000000) and near-black (< 15 brightness)
 * - Pure white (#FFFFFF) and near-white (> 240 brightness)
 * - Common placeholder/icon pack colors (browns, beiges from icon fills)
 * - Solid gray colors that are likely background fills
 * - Photo colors (skin tones, sky blue, clothing)
 */
function filterBrandColors(colors: string[]): string[] {
  const filtered: string[] = [];
  const seen = new Set<string>();
  
  // Helper to calculate color distance
  const colorDistance = (hex1: string, hex2: string): number => {
    const rgb1 = hexToRgb(hex1);
    const rgb2 = hexToRgb(hex2);
    if (!rgb1 || !rgb2) return Infinity;
    return Math.sqrt(
      Math.pow(rgb1.r - rgb2.r, 2) +
      Math.pow(rgb1.g - rgb2.g, 2) +
      Math.pow(rgb1.b - rgb2.b, 2)
    );
  };
  
  // ✅ NEW: Check if color is a placeholder/icon fill color (browns, beiges, generic fills)
  const isPlaceholderColor = (hex: string): boolean => {
    const rgb = hexToRgb(hex);
    if (!rgb) return false;
    
    // Calculate brightness (0-255)
    const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    
    // ✅ FIX: Filter pure black and near-black (< 15 brightness)
    if (brightness < 15) {
      if (process.env.DEBUG_COLOR_EXTRACT === "true") {
        console.log(`[ColorExtract] Filtered near-black: ${hex} (brightness: ${brightness.toFixed(1)})`);
      }
      return true;
    }
    
    // ✅ FIX: Filter pure white and near-white (> 245 brightness)
    if (brightness > 245) {
      if (process.env.DEBUG_COLOR_EXTRACT === "true") {
        console.log(`[ColorExtract] Filtered near-white: ${hex} (brightness: ${brightness.toFixed(1)})`);
      }
      return true;
    }
    
    // ✅ FIX: Filter generic brown/beige icon fills (common in icon packs)
    // Brown/beige: R > G > B, with warm tones
    const isBrownBeige = rgb.r > rgb.g && rgb.g > rgb.b && 
      rgb.r - rgb.b > 30 && rgb.r - rgb.b < 100 &&
      rgb.g > 80 && rgb.g < 180 && rgb.b > 60 && rgb.b < 150;
    
    if (isBrownBeige) {
      if (process.env.DEBUG_COLOR_EXTRACT === "true") {
        console.log(`[ColorExtract] Filtered brown/beige icon fill: ${hex}`);
      }
      return true;
    }
    
    // ✅ FIX: Filter generic grays (low saturation, not a brand color)
    const saturation = Math.max(rgb.r, rgb.g, rgb.b) - Math.min(rgb.r, rgb.g, rgb.b);
    const isGray = saturation < 20 && brightness > 50 && brightness < 200;
    
    if (isGray) {
      if (process.env.DEBUG_COLOR_EXTRACT === "true") {
        console.log(`[ColorExtract] Filtered gray: ${hex} (saturation: ${saturation})`);
      }
      return true;
    }
    
    return false;
  };
  
  // Helper to check if color is likely a skin tone or photo color
  const isPhotoColor = (hex: string): boolean => {
    const rgb = hexToRgb(hex);
    if (!rgb) return false;
    
    // Skin tone range (beige, tan, peach)
    const isSkinTone = rgb.r > 200 && rgb.g > 150 && rgb.b > 100 && rgb.r - rgb.g < 50;
    
    // Sky/sea blue
    const isSkyBlue = rgb.b > rgb.r + 30 && rgb.b > rgb.g + 30 && rgb.b > 150;
    
    // Random clothing colors (very saturated, not brand-like)
    const saturation = Math.max(rgb.r, rgb.g, rgb.b) - Math.min(rgb.r, rgb.g, rgb.b);
    const isRandomClothing = saturation > 100 && (rgb.r > 200 || rgb.g > 200 || rgb.b > 200);
    
    return isSkinTone || isSkyBlue || isRandomClothing;
  };
  
  for (const color of colors) {
    const normalized = color.startsWith("#") ? color.toUpperCase() : `#${color.toUpperCase()}`;
    
    // ✅ FIX: Skip placeholder/icon fill colors FIRST (before checking count)
    if (isPlaceholderColor(normalized)) {
      continue;
    }
    
    // Skip if too similar to existing color (within 15 units for better deduplication)
    const tooSimilar = filtered.some(existing => colorDistance(normalized, existing) < 15);
    if (tooSimilar) continue;
    
    // Skip photo colors (unless we have very few colors)
    if (filtered.length >= 3 && isPhotoColor(normalized)) {
      if (process.env.DEBUG_COLOR_EXTRACT === "true") {
        console.log(`[ColorExtract] Filtered photo color: ${normalized}`);
      }
      continue;
    }
    
    // Skip if already seen
    if (seen.has(normalized)) continue;
    
    filtered.push(normalized);
    seen.add(normalized);
    
    // Limit to 6 colors
    if (filtered.length >= 6) break;
  }
  
  return filtered;
}

/**
 * ✅ NEW: Helper to convert hex to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : null;
}

/**
 * Generate compelling brand summary using AI (Copywriter agent)
 * This ensures we always have a strong, engaging brand story
 * Uses centralized generateWithAI which has automatic fallback to Claude if OpenAI is down
 */
async function generateBrandSummaryWithAI(
  crawlResults: CrawlResult[],
  brandName?: string,
  industry?: string
): Promise<{ about_blurb: string; longFormSummary: string }> {
  // Collect all text from crawl results
  const allText = crawlResults
    .map((r) => `${r.title}\n${r.metaDescription}\n${r.h1.join(" ")}\n${r.h2.join(" ")}\n${r.h3.join(" ")}\n${r.bodyText}`)
    .join("\n\n")
    .slice(0, 4000); // Limit to 4k chars for summary generation

  const brandNameText = brandName ? `Brand Name: ${brandName}\n` : "";
  const industryText = industry ? `Industry: ${industry}\n` : "";

  const prompt = `You are The Copywriter for Postd. Create a compelling brand story for this business.

${brandNameText}${industryText}
Website Content:
${allText}

Create:
1. A concise "About" blurb (1-2 sentences, 120-160 characters) that captures the brand's essence and value proposition
2. A longer form summary (3-5 sentences, 300-500 characters) that tells the brand's story more fully

Respond in JSON format:
{
  "about_blurb": "1-2 sentence brand story...",
  "longFormSummary": "3-5 sentence expanded brand story..."
}`;

  try {
    // ✅ Use centralized generateWithAI which has automatic fallback to Claude if OpenAI is down
    // Default to OpenAI, but will automatically fallback to Claude on API errors
    const result = await generateWithAI(prompt, "doc", "openai");
    
    // Parse JSON response
    const parsed = JSON.parse(result.content || "{}");
    
    return {
      about_blurb: parsed.about_blurb || "",
      longFormSummary: parsed.longFormSummary || parsed.about_blurb || "",
    };
  } catch (error) {
    // ✅ FIX: Log as warning since we have a fallback - AI generation failure is non-critical
    console.warn("[AI] ⚠️ AI generation failed for brand summary (using content fallback):", {
      error: error instanceof Error ? error.message : String(error),
      hint: "Crawler will continue with content-based summary extraction"
    });
    // Final fallback - extract from content
    const allTextFallback = crawlResults
      .map((r) => [r.h1, r.h2, r.h3, r.bodyText].flat().join(" "))
      .join(" ");
    const aboutBlurb = crawlResults[0]?.metaDescription?.slice(0, 160) || allTextFallback.slice(0, 160) || "A professional brand committed to excellence.";
    return {
      about_blurb: aboutBlurb,
      longFormSummary: allTextFallback.slice(0, 500) || aboutBlurb,
    };
  }
}

/**
 * Generate brand kit using AI (with automatic fallback to Claude if OpenAI is down)
 */
// ✅ EXPORT: Allow crawler route to use this function directly
export async function generateBrandKit(
  crawlResults: CrawlResult[],
  colors: ColorPalette,
  sourceUrl: string,
  brandName?: string,
  industry?: string,
): Promise<BrandKitData> {
  // Dedupe by hash
  const uniqueResults = deduplicateResults(crawlResults);

  // Combine text
  const combinedText = uniqueResults
    .map((r) => `${r.title}\n${r.metaDescription}\n${r.bodyText}`)
    .join("\n\n")
    .slice(0, 10000); // Limit to 10k chars

  let brandKit: BrandKitData;
  
  // ✅ Try AI generation (will automatically fallback to Claude if OpenAI is down)
  // Only use fallback if both API keys are missing
  if (isOpenAIConfigured() || process.env.ANTHROPIC_API_KEY) {
    try {
      brandKit = await generateBrandKitWithAI(combinedText, colors, sourceUrl);
    } catch (error) {
      // ✅ FIX: Log as warning since we have fallback - AI generation failure is non-critical
      console.warn("[Brand Crawler] ⚠️ AI generation failed, using rule-based fallback:", {
        error: error instanceof Error ? error.message : String(error),
        hint: "Crawler will continue with rule-based brand kit generation"
      });
      brandKit = await generateBrandKitFallback(uniqueResults, colors, sourceUrl);
    }
  } else {
    brandKit = await generateBrandKitFallback(uniqueResults, colors, sourceUrl);
  }

  // ✅ ENSURE STRONG SUMMARY: Generate AI summary if missing or weak
  if (!brandKit.about_blurb || brandKit.about_blurb.length < 50 || brandKit.about_blurb.includes("professional brand committed")) {
    console.log("[Brand Crawler] Generating enhanced brand summary with AI...");
    const enhancedSummary = await generateBrandSummaryWithAI(uniqueResults, brandName, industry);
    brandKit.about_blurb = enhancedSummary.about_blurb;
    // Also add longFormSummary to brandKit (will be saved to brand_kit.longFormSummary)
    (brandKit as any).longFormSummary = enhancedSummary.longFormSummary;
  }

  return brandKit;
}

/**
 * Deduplicate crawl results by hash
 */
function deduplicateResults(results: CrawlResult[]): CrawlResult[] {
  const seen = new Set<string>();
  return results.filter((result) => {
    if (seen.has(result.hash)) return false;
    seen.add(result.hash);
    return true;
  });
}

/**
 * Generate brand kit using AI (with automatic fallback to Claude if OpenAI is down)
 */
async function generateBrandKitWithAI(
  text: string,
  colors: ColorPalette,
  sourceUrl: string,
): Promise<BrandKitData> {
  const prompt = `Analyze this brand's website content and extract:
1. Tone (3-5 adjectives, e.g., "professional", "friendly", "innovative")
2. Writing style (1-2 words, e.g., "conversational", "formal")
3. Words to avoid (if any compliance issues detected)
4. Target audience (1 sentence)
5. Brand personality traits (3-5 adjectives)
6. Top 5 keyword themes
7. A concise "About" blurb (120-160 characters)

Website content:
${text}

Respond in JSON format:
{
  "tone": ["..."],
  "style": "...",
  "avoid": ["..."],
  "audience": "...",
  "personality": ["..."],
  "keyword_themes": ["..."],
  "about_blurb": "..."
}`;

  try {
    // ✅ Use centralized generateWithAI which has automatic fallback to Claude if OpenAI is down
    // Default to OpenAI, but will automatically fallback to Claude on API errors
    const result = await generateWithAI(prompt, "doc", "openai");
    
    const aiResult = JSON.parse(result.content || "{}");

    return {
      voice_summary: {
        tone: aiResult.tone || [],
        style: aiResult.style || "conversational",
        avoid: aiResult.avoid || [],
        audience: aiResult.audience || "",
        personality: aiResult.personality || [],
      },
      keyword_themes: aiResult.keyword_themes || [],
      about_blurb: aiResult.about_blurb || "",
      colors,
      source_urls: [sourceUrl],
    };
  } catch (error) {
    // ✅ FIX: Log as warning since we have a fallback - AI generation failure is non-critical
    console.warn("[AI] ⚠️ AI generation failed for brand kit (using rule-based fallback):", {
      error: error instanceof Error ? error.message : String(error),
      hint: "Crawler will continue with fallback brand kit generation"
    });
    return generateBrandKitFallback(
      [{ bodyText: text } as CrawlResult],
      colors,
      sourceUrl,
    );
  }
}

/**
 * Fallback brand kit generation (rule-based)
 */
function generateBrandKitFallback(
  results: CrawlResult[],
  colors: ColorPalette,
  sourceUrl: string,
): Promise<BrandKitData> {
  const allText = results.map((r) => r.bodyText).join(" ");

  // Simple keyword extraction (top words by frequency)
  const words: string[] = allText.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];

  const wordFreq: Record<string, number> = words.reduce(
    (acc: Record<string, number>, word: string) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const stopWords = new Set([
    "that",
    "this",
    "with",
    "from",
    "have",
    "will",
    "your",
    "their",
    "about",
  ]);
  const keywords = Object.entries(wordFreq)
    .filter(([word]) => !stopWords.has(word))
    .sort((a: [string, number], b: [string, number]) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);

  // Generate about blurb from meta description or first paragraph
  const aboutBlurb =
    results[0]?.metaDescription?.slice(0, 160) ||
    results[0]?.bodyText?.slice(0, 160) ||
    "A professional brand committed to excellence.";

  return Promise.resolve({
    voice_summary: {
      tone: ["professional", "modern"],
      style: "conversational",
      avoid: [],
      audience: "general public",
      personality: ["trustworthy", "reliable"],
    },
    keyword_themes: keywords,
    about_blurb: aboutBlurb,
    colors,
    source_urls: [sourceUrl],
  });
}

/**
 * Create vector embeddings for brand context
 */
async function createEmbeddings(
  brandId: string,
  brandKit: BrandKitData,
  crawlResults: CrawlResult[],
  supabase: unknown,
): Promise<void> {
  if (!isOpenAIConfigured()) {
    console.warn("[Embeddings] OPENAI_API_KEY not set, skipping");
    return;
  }

  // Combine brand context for embedding
  const contextText = `
    ${brandKit.about_blurb}
    Tone: ${brandKit.voice_summary.tone.join(", ")}
    Style: ${brandKit.voice_summary.style}
    Audience: ${brandKit.voice_summary.audience}
    Keywords: ${brandKit.keyword_themes.join(", ")}
    ${crawlResults
      .slice(0, 3)
      .map((r) => r.bodyText.slice(0, 500))
      .join("\n")}
  `.trim();

  try {
    const embedding = await generateEmbedding(contextText, {
      model: DEFAULT_EMBEDDING_MODEL,
    });

    // Store in Supabase with pgvector
    // Type assertion for supabase parameter
    const supabaseClient = supabase as typeof supabase & {
      from: (table: string) => {
        upsert: (data: Record<string, unknown>) => Promise<{ error?: Error }>;
      };
    };

    await supabaseClient.from("brand_embeddings").upsert({
      brand_id: brandId,
      embedding,
      content: contextText,
      updated_at: new Date().toISOString(),
    });

    console.log(`[Embeddings] Created embedding for brand ${brandId}`);
  } catch (error) {
    console.error("[Embeddings] Error creating embedding:", error);
  }
}
