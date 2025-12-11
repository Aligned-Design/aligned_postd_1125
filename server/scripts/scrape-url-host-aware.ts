#!/usr/bin/env npx tsx
/**
 * Host-Aware URL Scraper CLI
 * 
 * A dev-only script to manually test the host-aware scraper against real URLs.
 * Useful for validating that Squarespace, WordPress, Shopify, and other CMS
 * sites are correctly detected and scraped.
 * 
 * Usage:
 *   npx tsx server/scripts/scrape-url-host-aware.ts <url>
 *   npx tsx server/scripts/scrape-url-host-aware.ts https://example.squarespace.com
 *   npx tsx server/scripts/scrape-url-host-aware.ts https://example.com https://another.com
 * 
 * Options:
 *   --json          Output results as JSON
 *   --images-only   Only show image extraction results
 *   --no-crawl      Skip full crawl, only do host detection
 *   --verbose       Show detailed logging
 * 
 * @see server/workers/brand-crawler.ts
 * @see docs/MVP1_IMPLEMENTATION_NOTES.md
 */

import { chromium, Page } from 'playwright';

// =============================================================================
// TYPES (mirrors brand-crawler.ts)
// =============================================================================

interface DetectedHost {
  name: "squarespace" | "wix" | "wordpress" | "webflow" | "shopify" | "unknown";
  confidence: "high" | "medium" | "low";
  detectionMethod: "domain" | "meta" | "signature" | "cdn" | "fallback";
  signals: string[];
}

interface HostExtractionConfig {
  name: string;
  imageDataAttributes: string[];
  logoSelectors: string[];
  additionalWaitMs: number;
  scrollBeforeExtract: boolean;
}

interface ExtractedImage {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
  role: string;
  source: string;
}

interface ScrapeResult {
  url: string;
  host: DetectedHost;
  config: HostExtractionConfig;
  images: ExtractedImage[];
  summary: {
    totalImages: number;
    logoCount: number;
    heroCount: number;
    otherCount: number;
    warnings: string[];
  };
  timing: {
    detectionMs: number;
    extractionMs: number;
    totalMs: number;
  };
}

// =============================================================================
// HOST DETECTION (mirrors brand-crawler.ts)
// =============================================================================

const HOST_SIGNATURES: Record<string, {
  domains: string[];
  cdnPatterns: string[];
  metaPatterns: RegExp[];
  cssSelectors: string[];
  classPatterns: RegExp[];
}> = {
  squarespace: {
    domains: ["squarespace.com", "sqsp.com"],
    cdnPatterns: ["images.squarespace-cdn.com", "static1.squarespace.com"],
    metaPatterns: [/Squarespace/i],
    cssSelectors: [".sqs-layout", ".sqs-block", "[data-controller='SiteLoader']"],
    classPatterns: [/^sqs-/, /^Header-branding/]
  },
  wix: {
    domains: ["wix.com", "wixsite.com"],
    cdnPatterns: ["static.wixstatic.com"],
    metaPatterns: [/Wix/i],
    cssSelectors: ["[data-mesh-id]", "[id^='comp-']"],
    classPatterns: [/^comp-/, /^wixui/]
  },
  wordpress: {
    domains: ["wordpress.com", "wordpress.org"],
    cdnPatterns: ["wp-content/", "wp-includes/"],
    metaPatterns: [/WordPress/i],
    cssSelectors: [".wp-block-", "#wpadminbar"],
    classPatterns: [/^wp-/]
  },
  webflow: {
    domains: ["webflow.io", "webflow.com"],
    cdnPatterns: ["assets.website-files.com", "uploads-ssl.webflow.com"],
    metaPatterns: [/Webflow/i],
    cssSelectors: [".w-webflow-badge", "[data-wf-domain]"],
    classPatterns: [/^w-/]
  },
  shopify: {
    domains: ["myshopify.com", "shopify.com"],
    cdnPatterns: ["cdn.shopify.com", "shopifycdn.com"],
    metaPatterns: [/Shopify/i],
    cssSelectors: ["[data-shopify]", ".shopify-section"],
    classPatterns: [/^shopify-/]
  }
};

const HOST_EXTRACTION_CONFIGS: Record<string, HostExtractionConfig> = {
  squarespace: {
    name: "squarespace",
    imageDataAttributes: ["data-src", "data-image", "data-image-focal-point"],
    logoSelectors: [
      ".header-title-logo img",
      ".Header-branding-logo img",
      ".site-title-logo img",
      ".Logo-image img"
    ],
    additionalWaitMs: 2000,
    scrollBeforeExtract: true
  },
  wix: {
    name: "wix",
    imageDataAttributes: ["data-src", "data-pin-media"],
    logoSelectors: ["[data-testid='siteHeader'] img", "[id^='comp-'] img[alt*='logo']"],
    additionalWaitMs: 3000,
    scrollBeforeExtract: true
  },
  wordpress: {
    name: "wordpress",
    imageDataAttributes: ["data-lazy-src", "data-src", "data-original"],
    logoSelectors: [".custom-logo", ".site-logo img", "#site-logo img"],
    additionalWaitMs: 1500,
    scrollBeforeExtract: true
  },
  webflow: {
    name: "webflow",
    imageDataAttributes: ["data-src"],
    logoSelectors: [".w-nav-brand img", "a.w-nav-brand img"],
    additionalWaitMs: 1000,
    scrollBeforeExtract: false
  },
  shopify: {
    name: "shopify",
    imageDataAttributes: ["data-src", "data-srcset"],
    logoSelectors: [".header__heading-logo img", ".site-logo img"],
    additionalWaitMs: 1500,
    scrollBeforeExtract: true
  },
  generic: {
    name: "generic",
    imageDataAttributes: ["data-src", "data-lazy-src"],
    logoSelectors: ["header img[alt*='logo']", ".logo img", "nav img"],
    additionalWaitMs: 1000,
    scrollBeforeExtract: false
  }
};

// =============================================================================
// DETECTION FUNCTION
// =============================================================================

async function detectHost(page: Page, url: string): Promise<DetectedHost> {
  const urlLower = url.toLowerCase();
  const signals: string[] = [];
  
  // Method 1: Check domain patterns
  for (const [hostName, signature] of Object.entries(HOST_SIGNATURES)) {
    for (const domain of signature.domains) {
      if (urlLower.includes(domain)) {
        signals.push(`domain:${domain}`);
        return {
          name: hostName as DetectedHost["name"],
          confidence: "high",
          detectionMethod: "domain",
          signals
        };
      }
    }
  }
  
  // Method 2: Check CDN patterns
  for (const [hostName, signature] of Object.entries(HOST_SIGNATURES)) {
    for (const cdnPattern of signature.cdnPatterns) {
      if (urlLower.includes(cdnPattern)) {
        signals.push(`cdn:${cdnPattern}`);
        return {
          name: hostName as DetectedHost["name"],
          confidence: "high",
          detectionMethod: "cdn",
          signals
        };
      }
    }
  }
  
  // Method 3: Check meta tags and HTML signatures
  try {
    const pageSignatures = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="generator"]');
      const generatorContent = meta?.getAttribute("content") || "";
      
      return {
        generator: generatorContent,
        hasSquarespaceSqs: document.querySelector(".sqs-layout") !== null,
        hasWixMesh: document.querySelector("[data-mesh-id]") !== null,
        hasWebflowBadge: document.querySelector(".w-webflow-badge") !== null,
        hasShopifySection: document.querySelector(".shopify-section") !== null,
        hasWordPressBlock: document.querySelector(".wp-block-") !== null || 
                          document.querySelector("#wpadminbar") !== null
      };
    });
    
    // Check generator meta
    for (const [hostName, signature] of Object.entries(HOST_SIGNATURES)) {
      for (const pattern of signature.metaPatterns) {
        if (pattern.test(pageSignatures.generator)) {
          signals.push(`meta:${pageSignatures.generator}`);
          return {
            name: hostName as DetectedHost["name"],
            confidence: "high",
            detectionMethod: "meta",
            signals
          };
        }
      }
    }
    
    // Check specific selectors
    if (pageSignatures.hasSquarespaceSqs) {
      signals.push("selector:.sqs-layout");
      return { name: "squarespace", confidence: "medium", detectionMethod: "signature", signals };
    }
    if (pageSignatures.hasWixMesh) {
      signals.push("selector:[data-mesh-id]");
      return { name: "wix", confidence: "medium", detectionMethod: "signature", signals };
    }
    if (pageSignatures.hasWebflowBadge) {
      signals.push("selector:.w-webflow-badge");
      return { name: "webflow", confidence: "medium", detectionMethod: "signature", signals };
    }
    if (pageSignatures.hasShopifySection) {
      signals.push("selector:.shopify-section");
      return { name: "shopify", confidence: "medium", detectionMethod: "signature", signals };
    }
    if (pageSignatures.hasWordPressBlock) {
      signals.push("selector:.wp-block-");
      return { name: "wordpress", confidence: "medium", detectionMethod: "signature", signals };
    }
  } catch (error) {
    signals.push(`error:${error instanceof Error ? error.message : 'unknown'}`);
  }
  
  // Fallback
  signals.push("no-match");
  return {
    name: "unknown",
    confidence: "low",
    detectionMethod: "fallback",
    signals
  };
}

function getHostExtractionConfig(host: DetectedHost): HostExtractionConfig {
  return HOST_EXTRACTION_CONFIGS[host.name] || HOST_EXTRACTION_CONFIGS.generic;
}

// =============================================================================
// IMAGE EXTRACTION
// =============================================================================

async function extractImages(page: Page, host: DetectedHost, config: HostExtractionConfig): Promise<ExtractedImage[]> {
  // Scroll to trigger lazy loading if needed
  if (config.scrollBeforeExtract) {
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight / 2);
    });
    await page.waitForTimeout(500);
    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(config.additionalWaitMs);
  }
  
  const dataAttributes = config.imageDataAttributes;
  
  const images = await page.evaluate((args) => {
    const { dataAttributes } = args;
    const results: Array<{
      url: string;
      alt?: string;
      width?: number;
      height?: number;
      className?: string;
    }> = [];
    
    // Extract <img> tags
    document.querySelectorAll("img").forEach((img) => {
      // Try to get the best src
      let src = img.getAttribute("src");
      
      if (!src || src.startsWith("data:") || src.includes("placeholder") || src.includes("loading")) {
        for (const attr of dataAttributes) {
          const value = img.getAttribute(attr);
          if (value && !value.startsWith("data:") && !value.includes("placeholder")) {
            src = value;
            break;
          }
        }
      }
      
      if (!src || src.startsWith("data:")) {
        const srcset = img.getAttribute("srcset");
        if (srcset) {
          src = srcset.split(",")[0]?.trim().split(" ")[0] || src;
        }
      }
      
      if (!src || src.startsWith("data:")) return;
      
      // Normalize URL
      try {
        src = new URL(src, window.location.href).href;
      } catch {
        return;
      }
      
      results.push({
        url: src,
        alt: img.alt || undefined,
        width: img.naturalWidth || img.width || undefined,
        height: img.naturalHeight || img.height || undefined,
        className: img.className || undefined
      });
    });
    
    return results;
  }, { dataAttributes });
  
  // Classify images
  return images.map(img => ({
    ...img,
    role: classifyImage(img.url, img.alt, img.width, img.height),
    source: "html-img"
  }));
}

function classifyImage(url: string, alt?: string, width?: number, height?: number): string {
  const urlLower = url.toLowerCase();
  const altLower = (alt || "").toLowerCase();
  
  // Logo detection
  if (urlLower.includes("logo") || altLower.includes("logo")) {
    return "logo";
  }
  
  // Hero detection (large images)
  if (width && height && width > 800 && height > 400) {
    return "hero";
  }
  
  // Icon/favicon detection
  if (urlLower.includes("favicon") || urlLower.includes("icon")) {
    return "icon";
  }
  
  return "other";
}

// =============================================================================
// MAIN SCRAPE FUNCTION
// =============================================================================

async function scrapeUrl(url: string, options: { verbose?: boolean; noCrawl?: boolean }): Promise<ScrapeResult> {
  const startTime = Date.now();
  const warnings: string[] = [];
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (compatible; POSTD-Scraper/1.0; +https://postd.ai)'
  });
  const page = await context.newPage();
  
  try {
    if (options.verbose) {
      console.log(`\n🌐 Navigating to: ${url}`);
    }
    
    await page.goto(url, { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    // Wait a bit for dynamic content
    await page.waitForTimeout(2000);
    
    // Host detection
    const detectionStart = Date.now();
    const host = await detectHost(page, url);
    const detectionMs = Date.now() - detectionStart;
    
    if (options.verbose) {
      console.log(`🔍 Host detected: ${host.name} (${host.confidence} confidence)`);
      console.log(`   Method: ${host.detectionMethod}`);
      console.log(`   Signals: ${host.signals.join(", ")}`);
    }
    
    const config = getHostExtractionConfig(host);
    
    let images: ExtractedImage[] = [];
    let extractionMs = 0;
    
    if (!options.noCrawl) {
      // Image extraction
      const extractionStart = Date.now();
      images = await extractImages(page, host, config);
      extractionMs = Date.now() - extractionStart;
      
      if (options.verbose) {
        console.log(`📷 Extracted ${images.length} images`);
      }
      
      // Warnings
      if (images.length === 0) {
        warnings.push("No images found - page may use unusual image loading");
      }
      if (images.length < 5) {
        warnings.push("Few images found - lazy loading may not have triggered");
      }
      if (!images.some(img => img.role === "logo")) {
        warnings.push("No logo detected - check logo selectors");
      }
    }
    
    const totalMs = Date.now() - startTime;
    
    return {
      url,
      host,
      config,
      images,
      summary: {
        totalImages: images.length,
        logoCount: images.filter(img => img.role === "logo").length,
        heroCount: images.filter(img => img.role === "hero").length,
        otherCount: images.filter(img => img.role === "other").length,
        warnings
      },
      timing: {
        detectionMs,
        extractionMs,
        totalMs
      }
    };
  } finally {
    await browser.close();
  }
}

// =============================================================================
// CLI INTERFACE
// =============================================================================

function printResult(result: ScrapeResult, options: { json?: boolean; imagesOnly?: boolean }) {
  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  
  console.log("\n" + "=".repeat(60));
  console.log(`🌐 URL: ${result.url}`);
  console.log("=".repeat(60));
  
  // Host detection
  console.log("\n📊 HOST DETECTION:");
  console.log(`   Platform:   ${result.host.name}`);
  console.log(`   Confidence: ${result.host.confidence}`);
  console.log(`   Method:     ${result.host.detectionMethod}`);
  console.log(`   Signals:    ${result.host.signals.join(", ")}`);
  
  // Extraction config
  console.log("\n⚙️  EXTRACTION CONFIG:");
  console.log(`   Data attrs: ${result.config.imageDataAttributes.join(", ")}`);
  console.log(`   Scroll:     ${result.config.scrollBeforeExtract ? "Yes" : "No"}`);
  console.log(`   Wait:       ${result.config.additionalWaitMs}ms`);
  
  // Image summary
  console.log("\n📷 IMAGES:");
  console.log(`   Total:      ${result.summary.totalImages}`);
  console.log(`   Logos:      ${result.summary.logoCount}`);
  console.log(`   Heroes:     ${result.summary.heroCount}`);
  console.log(`   Other:      ${result.summary.otherCount}`);
  
  // Sample images
  if (!options.imagesOnly && result.images.length > 0) {
    console.log("\n   Sample images:");
    const samples = result.images.slice(0, 5);
    samples.forEach((img, i) => {
      const dims = img.width && img.height ? `${img.width}x${img.height}` : "unknown";
      console.log(`   ${i + 1}. [${img.role}] ${img.url.substring(0, 60)}... (${dims})`);
    });
    if (result.images.length > 5) {
      console.log(`   ... and ${result.images.length - 5} more`);
    }
  }
  
  // Warnings
  if (result.summary.warnings.length > 0) {
    console.log("\n⚠️  WARNINGS:");
    result.summary.warnings.forEach(w => console.log(`   - ${w}`));
  }
  
  // Timing
  console.log("\n⏱️  TIMING:");
  console.log(`   Detection:  ${result.timing.detectionMs}ms`);
  console.log(`   Extraction: ${result.timing.extractionMs}ms`);
  console.log(`   Total:      ${result.timing.totalMs}ms`);
  
  console.log("\n" + "=".repeat(60));
}

async function main() {
  const args = process.argv.slice(2);
  
  // Parse options
  const options = {
    json: args.includes("--json"),
    imagesOnly: args.includes("--images-only"),
    noCrawl: args.includes("--no-crawl"),
    verbose: args.includes("--verbose")
  };
  
  // Get URLs (filter out options)
  const urls = args.filter(arg => !arg.startsWith("--") && (arg.startsWith("http://") || arg.startsWith("https://")));
  
  if (urls.length === 0) {
    console.log(`
Host-Aware URL Scraper CLI
===========================

Usage:
  npx tsx server/scripts/scrape-url-host-aware.ts <url> [options]
  npx tsx server/scripts/scrape-url-host-aware.ts https://example.squarespace.com
  npx tsx server/scripts/scrape-url-host-aware.ts https://example.com https://another.com

Options:
  --json          Output results as JSON
  --images-only   Only show image summary (no samples)
  --no-crawl      Skip full crawl, only do host detection
  --verbose       Show detailed logging

Examples:
  # Test a Squarespace site
  npx tsx server/scripts/scrape-url-host-aware.ts https://www.squarespace.com

  # Test multiple sites
  npx tsx server/scripts/scrape-url-host-aware.ts https://site1.com https://site2.com

  # JSON output for scripting
  npx tsx server/scripts/scrape-url-host-aware.ts https://example.com --json
`);
    process.exit(1);
  }
  
  console.log(`\n🔧 Host-Aware Scraper Test`);
  console.log(`   URLs to test: ${urls.length}`);
  console.log(`   Options: ${JSON.stringify(options)}`);
  
  for (const url of urls) {
    try {
      const result = await scrapeUrl(url, options);
      printResult(result, options);
    } catch (error) {
      console.error(`\n❌ Error scraping ${url}:`);
      console.error(`   ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

main().catch(console.error);

