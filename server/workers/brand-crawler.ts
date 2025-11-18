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
import OpenAI from "openai";
import { generateWithAI } from "./ai-generation";
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
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const CRAWL_MAX_PAGES = parseInt(process.env.CRAWL_MAX_PAGES || "50", 10);
const CRAWL_TIMEOUT_MS = parseInt(process.env.CRAWL_TIMEOUT_MS || "30000", 10);
const CRAWL_USER_AGENT = process.env.CRAWL_USER_AGENT || "AlignedAIBot/1.0";
const MAX_DEPTH = 3;
const CRAWL_DELAY_MS = 1000;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

interface CrawledImage {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
  role: "logo" | "team" | "subject" | "hero" | "other";
  pageType?: "main" | "team" | "about" | "other";
  filename?: string;
  priority?: number; // Calculated priority score
}

interface TypographyData {
  heading: string;
  body: string;
  source: "scrape" | "google" | "custom";
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
    if (OPENAI_API_KEY) {
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
        "[Brand Crawler] OPENAI_API_KEY not set, skipping embeddings",
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

        // Fetch page with retry logic
        await retryWithBackoff(
          () =>
            page.goto(url, {
              timeout: CRAWL_TIMEOUT_MS,
              waitUntil: "networkidle",
            }),
          2, // Fewer retries per page (max 3 total with main retries)
          500, // Shorter delay for individual page fetches
        );

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
function extractBrandNameFromUrl(url: string): string | undefined {
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
function extractIndustryFromContent(crawlResults: CrawlResult[]): string | undefined {
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
 * Enhanced logo detection - checks filename, URL path, alt text, and brand name
 */
function isLogo(
  img: { url: string; alt?: string; width?: number; height?: number },
  pageUrl: string,
  brandName?: string
): boolean {
  const filename = extractFilename(img.url);
  const urlLower = img.url.toLowerCase();
  const altLower = img.alt?.toLowerCase() || "";
  const pathname = new URL(img.url).pathname.toLowerCase();
  
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
  
  // Existing checks: parent classes, header position, size
  // These are handled in the page.evaluate() function
  
  return false;
}

/**
 * Categorize image based on context
 * 
 * SIMPLIFIED: More lenient categorization - accepts images even if categorization is uncertain
 */
function categorizeImage(
  img: { url: string; alt?: string; width?: number; height?: number; role?: string },
  pageUrl: string,
  pageType: "main" | "team" | "about" | "other",
  brandName?: string
): "logo" | "team" | "subject" | "hero" | "other" {
  // Logo detection (highest priority) - use existing role if already detected
  if (img.role === "logo" || isLogo(img, pageUrl, brandName)) {
    return "logo";
  }
  
  // Hero images: large images near top of page - use existing role if already detected
  if (img.role === "hero") {
    return "hero";
  }
  
  // Team images: from team/about pages, or images with faces (detected by alt text or context)
  // More lenient - if on team/about page, prioritize team categorization
  if (pageType === "team" || pageType === "about") {
    const altLower = img.alt?.toLowerCase() || "";
    const urlLower = img.url.toLowerCase();
    const filenameLower = img.url.split("/").pop()?.toLowerCase() || "";
    
    // More lenient team detection - check multiple signals
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
  
  // Subject matter: product/service images (medium priority)
  // More lenient - check multiple signals
  const altLower = img.alt?.toLowerCase() || "";
  const urlLower = img.url.toLowerCase();
  const filenameLower = img.url.split("/").pop()?.toLowerCase() || "";
  
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
  
  // Default to other - accept all images even if we can't categorize them
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
 * Extract images from a page with smart prioritization
 * 
 * SIMPLIFIED & ROBUST: 
 * - Waits for images to load before extracting dimensions
 * - More lenient filtering (accepts images without dimensions)
 * - Better error handling
 * - Logs extraction progress
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

          // Determine initial role (will be refined later)
          let role: "logo" | "hero" | "other" = "other";

          // Enhanced logo detection
          const altLower = alt?.toLowerCase() || "";
          const filenameLower = filename.toLowerCase();
          const parentClasses = img.parentElement?.className?.toLowerCase() || "";
          const parentId = img.parentElement?.id?.toLowerCase() || "";
          const isInHeader = img.closest("header") !== null || img.closest("nav") !== null;
          const isSmall = width ? (width < 400 && height ? height < 400 : false) : false;
          const brandNameLower = brandName?.toLowerCase().replace(/\s+/g, "-") || "";

          if (
            altLower.includes("logo") ||
            filenameLower.includes("logo") ||
            (brandNameLower && (filenameLower.includes(brandNameLower) || altLower.includes(brandName?.toLowerCase() || ""))) ||
            parentClasses.includes("logo") ||
            parentId.includes("logo") ||
            (isInHeader && isSmall)
          ) {
            role = "logo";
          } else if (
            // Hero detection: large image near top of page (more lenient - accept if width OR height is large)
            width && height && ((width > 600 && height > 400) || (width > 400 && height > 600)) &&
            img.offsetTop < window.innerHeight * 2 // More lenient - check within 2 viewport heights
          ) {
            role = "hero";
          }

          results.push({
            url: normalizedUrl,
            alt,
            width,
            height,
            role,
            filename,
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
    
    console.log(`[Crawler] Extracted ${images.length} images from page ${baseUrl}`);

    // Deduplicate by URL
    const seen = new Set<string>();
    const uniqueImages = images.filter((img) => {
      if (seen.has(img.url)) return false;
      seen.add(img.url);
      return true;
    });

    // Categorize and enrich images with page type and priority
    const categorizedImages: CrawledImage[] = uniqueImages.map((img) => {
      const categorized = categorizeImage(img, baseUrl, pageType, brandName);
      return {
        url: img.url,
        alt: img.alt,
        width: img.width,
        height: img.height,
        role: categorized,
        pageType,
        filename: img.filename,
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
    images = await extractImages(page, url);
    console.log(`[Crawler] Extracted ${images.length} images from ${url}`);
  } catch (error) {
    console.error("[Crawler] Error extracting images from page:", error);
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
  };
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
 * Extract color palette using node-vibrant
 */
export async function extractColors(url: string): Promise<ColorPalette> {
  let browser: Browser | null = null;

  try {
    browser = await launchBrowser();
    const page = await browser.newPage({ userAgent: CRAWL_USER_AGENT });
    await page.goto(url, {
      timeout: CRAWL_TIMEOUT_MS,
      waitUntil: "networkidle",
    });

    // Take screenshot
    const screenshot = await page.screenshot({ fullPage: false });

    // Extract colors with vibrant
    const palette = await Vibrant.from(screenshot).getPalette();

    // Extract up to 6 colors: 3 primary (most dominant) + 3 secondary/accent
    const primaryColors: string[] = [];
    const secondaryColors: string[] = [];

    // Primary colors (most dominant)
    if (palette.Vibrant?.hex) primaryColors.push(palette.Vibrant.hex);
    if (palette.Muted?.hex && !primaryColors.includes(palette.Muted.hex)) {
      primaryColors.push(palette.Muted.hex);
    }
    if (palette.DarkVibrant?.hex && !primaryColors.includes(palette.DarkVibrant.hex)) {
      primaryColors.push(palette.DarkVibrant.hex);
    }

    // Secondary/accent colors
    if (palette.LightVibrant?.hex && !primaryColors.includes(palette.LightVibrant.hex)) {
      secondaryColors.push(palette.LightVibrant.hex);
    }
    if (palette.LightMuted?.hex && !primaryColors.includes(palette.LightMuted.hex) && !secondaryColors.includes(palette.LightMuted.hex)) {
      secondaryColors.push(palette.LightMuted.hex);
    }
    if (palette.DarkMuted?.hex && !primaryColors.includes(palette.DarkMuted.hex) && !secondaryColors.includes(palette.DarkMuted.hex)) {
      secondaryColors.push(palette.DarkMuted.hex);
    }

    // Normalize to hex (ensure # prefix)
    const normalizeHex = (color: string | undefined): string | undefined => {
      if (!color) return undefined;
      return color.startsWith("#") ? color : `#${color}`;
    };

    // Build 6-color palette structure
    const allColors = [
      ...primaryColors.map(normalizeHex).filter((c): c is string => !!c),
      ...secondaryColors.map(normalizeHex).filter((c): c is string => !!c),
    ].slice(0, 6); // Max 6 colors

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

    await browser.close();
    return colors;
  } catch (error) {
    console.error("[Crawler] Error extracting colors:", error);
    // ❌ NO FALLBACK - throw error instead of returning mock data
    throw new Error(`Color extraction failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  } finally {
    if (browser) await browser.close();
  }
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
    console.error("[AI] Error generating brand summary (both providers failed):", error);
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
async function generateBrandKit(
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
  if (OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY) {
    try {
      brandKit = await generateBrandKitWithAI(combinedText, colors, sourceUrl);
    } catch (error) {
      console.error("[Brand Crawler] AI generation failed, using rule-based fallback:", error);
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
    console.error("[AI] Error generating brand kit:", error);
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
  if (!OPENAI_API_KEY) {
    console.warn("[Embeddings] OPENAI_API_KEY not set, skipping");
    return;
  }

  const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

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
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: contextText,
    });

    const embedding = response.data[0].embedding;

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
