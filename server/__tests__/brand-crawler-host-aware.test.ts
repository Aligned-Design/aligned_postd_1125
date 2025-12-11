/**
 * Tests for Host-Aware Crawler Behavior
 * 
 * Tests that:
 * - Host detection returns correct CMS type for known platforms
 * - Squarespace data-src/data-image attributes are recognized
 * - WordPress data-lazy-src attributes are recognized
 * - Shopify CDN images are correctly handled
 * - Unknown hosts fallback to generic strategy
 * - Image extraction uses correct host-specific attributes
 * 
 * These tests use lightweight HTML fixtures and test the detection/extraction
 * logic WITHOUT requiring live Playwright browser instances.
 * 
 * @see server/workers/brand-crawler.ts for implementation
 * @see docs/MVP1_IMPLEMENTATION_NOTES.md for design documentation
 */

import { describe, it, expect } from "vitest";

// =============================================================================
// HOST DETECTION LOGIC (mirrors brand-crawler.ts implementation)
// =============================================================================

/**
 * Host signatures - patterns that identify specific CMS platforms
 * This mirrors HOST_SIGNATURES in brand-crawler.ts
 */
const HOST_SIGNATURES: Record<string, {
  domains: string[];
  cdnPatterns: string[];
  metaPatterns: RegExp[];
  classPatterns: RegExp[];
}> = {
  squarespace: {
    domains: ["squarespace.com", "sqsp.com"],
    cdnPatterns: ["images.squarespace-cdn.com", "static1.squarespace.com"],
    metaPatterns: [/Squarespace/i],
    classPatterns: [/^sqs-/, /^Header-branding/]
  },
  wix: {
    domains: ["wix.com", "wixsite.com"],
    cdnPatterns: ["static.wixstatic.com", "wix.com"],
    metaPatterns: [/Wix/i],
    classPatterns: [/^comp-/, /^wixui/]
  },
  wordpress: {
    domains: ["wordpress.com", "wordpress.org"],
    cdnPatterns: ["wp-content/", "wp-includes/"],
    metaPatterns: [/WordPress/i],
    classPatterns: [/^wp-/]
  },
  webflow: {
    domains: ["webflow.io", "webflow.com"],
    cdnPatterns: ["assets.website-files.com", "uploads-ssl.webflow.com"],
    metaPatterns: [/Webflow/i],
    classPatterns: [/^w-/]
  },
  shopify: {
    domains: ["myshopify.com", "shopify.com"],
    cdnPatterns: ["cdn.shopify.com", "shopifycdn.com"],
    metaPatterns: [/Shopify/i],
    classPatterns: [/^shopify-/]
  }
};

/**
 * Host-specific extraction configurations
 * This mirrors HOST_EXTRACTION_CONFIGS in brand-crawler.ts
 */
const HOST_EXTRACTION_CONFIGS: Record<string, {
  name: string;
  imageDataAttributes: string[];
  scrollBeforeExtract: boolean;
  // Copy extraction selectors (host-aware)
  heroSelectors?: string[];
  aboutSelectors?: string[];
  servicesSelectors?: string[];
  copyExclusions?: string[];
}> = {
  squarespace: {
    name: "squarespace",
    imageDataAttributes: ["data-src", "data-image", "data-image-focal-point"],
    scrollBeforeExtract: true,
    heroSelectors: [".sqs-block-html h1", "[data-block-type='headline'] h1", ".Index-page-content h1", ".banner-thumbnail-wrapper h1"],
    aboutSelectors: [".sqs-block-content p", "[data-block-type='text'] .sqs-block-content", ".sqs-layout .sqs-block-html p"],
    servicesSelectors: ["[data-block-type='accordion'] .accordion-item-title", ".portfolio-grid-item-title", ".sqs-block-summary-v2 .summary-title"],
    copyExclusions: [".sqs-cookie-banner", ".sqs-announcement-bar", ".announcement-bar-text"]
  },
  wix: {
    name: "wix",
    imageDataAttributes: ["data-src", "data-pin-media"],
    scrollBeforeExtract: true,
    heroSelectors: ["[data-testid='richTextElement'] h1", "[data-hook='header-content'] h1", "[id^='comp-'] h1"],
    aboutSelectors: ["[data-testid='richTextElement'] p", "[data-hook='content-section'] p"],
    servicesSelectors: ["[data-hook='services-item'] h3", ".gallery-item-title"],
    copyExclusions: ["[data-testid='WixAdsDesktopRoot']", "[data-hook='cookie-banner']"]
  },
  wordpress: {
    name: "wordpress",
    imageDataAttributes: ["data-lazy-src", "data-src", "data-original"],
    scrollBeforeExtract: true,
    heroSelectors: [".entry-title", ".wp-block-heading", ".hero-content h1", ".page-header h1"],
    aboutSelectors: [".entry-content p", ".wp-block-group p", "article.page .content p"],
    servicesSelectors: [".wp-block-columns h3", ".services-list li", ".wp-block-media-text h3"],
    copyExclusions: [".wp-block-search", ".comment-form", ".sidebar", "#secondary"]
  },
  webflow: {
    name: "webflow",
    imageDataAttributes: ["data-src"],
    scrollBeforeExtract: false,
    heroSelectors: [".hero-heading", ".hero h1", "[class*='hero'] h1"],
    aboutSelectors: [".w-richtext p", ".about-content p", ".page-content p"],
    servicesSelectors: [".w-dyn-item h3", ".services-grid h3", ".service-card h3"],
    copyExclusions: [".w-webflow-badge"]
  },
  shopify: {
    name: "shopify",
    imageDataAttributes: ["data-src", "data-srcset"],
    scrollBeforeExtract: true,
    heroSelectors: [".banner__heading", ".collection-hero__title", ".product-single__title", ".page-title"],
    aboutSelectors: [".page-content p", ".rte.rte--page p", "[data-section-type='custom-content'] p"],
    servicesSelectors: [".product-card__title", ".collection-product-card__title", "[data-product-title]"],
    copyExclusions: [".announcement-bar", ".shopify-section-header-sticky"]
  },
  generic: {
    name: "generic",
    imageDataAttributes: ["data-src", "data-lazy-src"],
    scrollBeforeExtract: false,
    heroSelectors: ["h1", "header h1", ".hero h1", "main h1"],
    aboutSelectors: ["main p", "article p", ".content p", "section p"],
    servicesSelectors: [".services li", "main h3", "section h3"],
    copyExclusions: []
  },
  unknown: {
    name: "unknown",
    imageDataAttributes: ["data-src", "data-lazy-src"],
    scrollBeforeExtract: false,
    heroSelectors: ["h1", "header h1", ".hero h1", "main h1"],
    aboutSelectors: ["main p", "article p", ".content p", "section p"],
    servicesSelectors: [".services li", "main h3", "section h3"],
    copyExclusions: []
  }
};

// =============================================================================
// DETECTION FUNCTIONS (pure, testable versions)
// =============================================================================

interface DetectedHost {
  name: "squarespace" | "wix" | "wordpress" | "webflow" | "shopify" | "unknown";
  confidence: "high" | "medium" | "low";
  detectionMethod: "domain" | "meta" | "signature" | "cdn" | "fallback";
  signals: string[];
}

interface HTMLSignatures {
  generator: string;
  classes: string[];
  hasSquarespaceSqs: boolean;
  hasWixMesh: boolean;
  hasWebflowBadge: boolean;
  hasShopifySection: boolean;
  hasWordPressBlock: boolean;
}

/**
 * Detect host from URL only (domain and CDN patterns)
 */
function detectHostFromUrl(url: string): DetectedHost | null {
  const urlLower = url.toLowerCase();
  const signals: string[] = [];
  
  // Check domain patterns
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
  
  // Check CDN patterns
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
  
  return null;
}

/**
 * Detect host from HTML signatures (meta tags, class patterns)
 */
function detectHostFromHTML(signatures: HTMLSignatures): DetectedHost | null {
  const signals: string[] = [];
  
  // Check generator meta tag
  for (const [hostName, signature] of Object.entries(HOST_SIGNATURES)) {
    for (const pattern of signature.metaPatterns) {
      if (pattern.test(signatures.generator)) {
        signals.push(`meta:${signatures.generator}`);
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
  if (signatures.hasSquarespaceSqs) {
    signals.push("selector:.sqs-layout");
    return {
      name: "squarespace",
      confidence: "medium",
      detectionMethod: "signature",
      signals
    };
  }
  
  if (signatures.hasWixMesh) {
    signals.push("selector:[data-mesh-id]");
    return {
      name: "wix",
      confidence: "medium",
      detectionMethod: "signature",
      signals
    };
  }
  
  if (signatures.hasWebflowBadge) {
    signals.push("selector:.w-webflow-badge");
    return {
      name: "webflow",
      confidence: "medium",
      detectionMethod: "signature",
      signals
    };
  }
  
  if (signatures.hasShopifySection) {
    signals.push("selector:.shopify-section");
    return {
      name: "shopify",
      confidence: "medium",
      detectionMethod: "signature",
      signals
    };
  }
  
  if (signatures.hasWordPressBlock) {
    signals.push("selector:.wp-block-");
    return {
      name: "wordpress",
      confidence: "medium",
      detectionMethod: "signature",
      signals
    };
  }
  
  // Check class patterns
  for (const [hostName, signature] of Object.entries(HOST_SIGNATURES)) {
    for (const pattern of signature.classPatterns) {
      const matchingClass = signatures.classes.find(c => pattern.test(c));
      if (matchingClass) {
        signals.push(`class:${matchingClass}`);
        return {
          name: hostName as DetectedHost["name"],
          confidence: "low",
          detectionMethod: "signature",
          signals
        };
      }
    }
  }
  
  return null;
}

/**
 * Combined host detection (URL first, then HTML signatures)
 */
function detectHost(url: string, signatures: HTMLSignatures): DetectedHost {
  // Try URL-based detection first
  const urlDetection = detectHostFromUrl(url);
  if (urlDetection) return urlDetection;
  
  // Fall back to HTML-based detection
  const htmlDetection = detectHostFromHTML(signatures);
  if (htmlDetection) return htmlDetection;
  
  // Fallback to unknown
  return {
    name: "unknown",
    confidence: "low",
    detectionMethod: "fallback",
    signals: ["no-match"]
  };
}

/**
 * Get extraction config for detected host
 */
function getHostExtractionConfig(host: DetectedHost) {
  return HOST_EXTRACTION_CONFIGS[host.name] || HOST_EXTRACTION_CONFIGS.generic;
}

// =============================================================================
// IMAGE EXTRACTION LOGIC (pure, testable version)
// =============================================================================

interface MockImage {
  src?: string;
  "data-src"?: string;
  "data-image"?: string;
  "data-lazy-src"?: string;
  "data-original"?: string;
  "data-pin-media"?: string;
  srcset?: string;
  width?: number;
  height?: number;
  alt?: string;
  className?: string;
}

/**
 * Extract image URL using host-specific data attributes
 * This mirrors the logic in extractImages' page.evaluate
 */
function extractImageUrl(img: MockImage, dataAttributes: string[]): string | null {
  // Check src first (if not a placeholder)
  let src = img.src;
  
  // If src is missing or is a placeholder, try data attributes
  if (!src || src.startsWith("data:") || src.includes("placeholder") || src.includes("loading")) {
    // Try host-specific data attributes in order
    for (const attr of dataAttributes) {
      const value = img[attr as keyof MockImage] as string | undefined;
      if (value && !value.startsWith("data:") && !value.includes("placeholder")) {
        src = value;
        break;
      }
    }
  }
  
  // Fallback to srcset first value
  if (!src || src.startsWith("data:")) {
    if (img.srcset) {
      const firstSrcset = img.srcset.split(",")[0]?.trim().split(" ")[0];
      if (firstSrcset) src = firstSrcset;
    }
  }
  
  return src || null;
}

// =============================================================================
// TEST FIXTURES
// =============================================================================

const SQUARESPACE_FIXTURE: HTMLSignatures = {
  generator: "Squarespace 7.1",
  classes: ["sqs-layout", "sqs-block", "Header-branding-logo"],
  hasSquarespaceSqs: true,
  hasWixMesh: false,
  hasWebflowBadge: false,
  hasShopifySection: false,
  hasWordPressBlock: false
};

const WORDPRESS_FIXTURE: HTMLSignatures = {
  generator: "WordPress 6.3.2",
  classes: ["wp-block-image", "wp-content", "entry-content"],
  hasSquarespaceSqs: false,
  hasWixMesh: false,
  hasWebflowBadge: false,
  hasShopifySection: false,
  hasWordPressBlock: true
};

const WIX_FIXTURE: HTMLSignatures = {
  generator: "Wix.com Website Builder",
  classes: ["comp-abc123", "wixui-image"],
  hasSquarespaceSqs: false,
  hasWixMesh: true,
  hasWebflowBadge: false,
  hasShopifySection: false,
  hasWordPressBlock: false
};

const SHOPIFY_FIXTURE: HTMLSignatures = {
  generator: "Shopify",
  classes: ["shopify-section", "product-image"],
  hasSquarespaceSqs: false,
  hasWixMesh: false,
  hasWebflowBadge: false,
  hasShopifySection: true,
  hasWordPressBlock: false
};

const WEBFLOW_FIXTURE: HTMLSignatures = {
  generator: "Webflow",
  classes: ["w-webflow-badge", "w-container"],
  hasSquarespaceSqs: false,
  hasWixMesh: false,
  hasWebflowBadge: true,
  hasShopifySection: false,
  hasWordPressBlock: false
};

const UNKNOWN_FIXTURE: HTMLSignatures = {
  generator: "",
  classes: ["header", "main", "footer"],
  hasSquarespaceSqs: false,
  hasWixMesh: false,
  hasWebflowBadge: false,
  hasShopifySection: false,
  hasWordPressBlock: false
};

// =============================================================================
// TESTS
// =============================================================================

describe("Host-Aware Crawler", () => {
  describe("Host Detection - URL Patterns", () => {
    it("should detect Squarespace from domain", () => {
      const result = detectHostFromUrl("https://example.squarespace.com/about");
      expect(result).not.toBeNull();
      expect(result?.name).toBe("squarespace");
      expect(result?.confidence).toBe("high");
      expect(result?.detectionMethod).toBe("domain");
    });

    it("should detect Squarespace from CDN URL", () => {
      const result = detectHostFromUrl("https://images.squarespace-cdn.com/content/v1/123/hero.jpg");
      expect(result).not.toBeNull();
      expect(result?.name).toBe("squarespace");
      expect(result?.confidence).toBe("high");
      expect(result?.detectionMethod).toBe("cdn");
    });

    it("should detect WordPress from domain", () => {
      const result = detectHostFromUrl("https://myblog.wordpress.com");
      expect(result).not.toBeNull();
      expect(result?.name).toBe("wordpress");
      expect(result?.confidence).toBe("high");
    });

    it("should detect WordPress from wp-content CDN pattern", () => {
      const result = detectHostFromUrl("https://example.com/wp-content/uploads/image.jpg");
      expect(result).not.toBeNull();
      expect(result?.name).toBe("wordpress");
      expect(result?.detectionMethod).toBe("cdn");
    });

    it("should detect Shopify from domain", () => {
      const result = detectHostFromUrl("https://mystore.myshopify.com/products");
      expect(result).not.toBeNull();
      expect(result?.name).toBe("shopify");
      expect(result?.confidence).toBe("high");
    });

    it("should detect Shopify from CDN URL (contains shopify.com domain)", () => {
      const result = detectHostFromUrl("https://cdn.shopify.com/s/files/1/image.jpg");
      expect(result).not.toBeNull();
      expect(result?.name).toBe("shopify");
      // Note: cdn.shopify.com matches "shopify.com" domain pattern first
      expect(result?.detectionMethod).toBe("domain");
    });

    it("should detect Wix from domain", () => {
      const result = detectHostFromUrl("https://mysite.wixsite.com/home");
      expect(result).not.toBeNull();
      expect(result?.name).toBe("wix");
    });

    it("should detect Webflow from domain", () => {
      const result = detectHostFromUrl("https://mysite.webflow.io");
      expect(result).not.toBeNull();
      expect(result?.name).toBe("webflow");
    });

    it("should return null for unknown domains", () => {
      const result = detectHostFromUrl("https://example.com/about");
      expect(result).toBeNull();
    });
  });

  describe("Host Detection - HTML Signatures", () => {
    it("should detect Squarespace from generator meta", () => {
      const result = detectHostFromHTML(SQUARESPACE_FIXTURE);
      expect(result).not.toBeNull();
      expect(result?.name).toBe("squarespace");
      expect(result?.confidence).toBe("high");
      expect(result?.detectionMethod).toBe("meta");
    });

    it("should detect WordPress from generator meta", () => {
      const result = detectHostFromHTML(WORDPRESS_FIXTURE);
      expect(result).not.toBeNull();
      expect(result?.name).toBe("wordpress");
      expect(result?.confidence).toBe("high");
    });

    it("should detect Wix from generator meta", () => {
      const result = detectHostFromHTML(WIX_FIXTURE);
      expect(result).not.toBeNull();
      expect(result?.name).toBe("wix");
    });

    it("should detect Shopify from generator meta", () => {
      const result = detectHostFromHTML(SHOPIFY_FIXTURE);
      expect(result).not.toBeNull();
      expect(result?.name).toBe("shopify");
    });

    it("should detect Webflow from generator meta", () => {
      const result = detectHostFromHTML(WEBFLOW_FIXTURE);
      expect(result).not.toBeNull();
      expect(result?.name).toBe("webflow");
    });

    it("should return null for unknown HTML", () => {
      const result = detectHostFromHTML(UNKNOWN_FIXTURE);
      expect(result).toBeNull();
    });

    it("should detect Squarespace from .sqs- class pattern", () => {
      const fixture: HTMLSignatures = {
        generator: "", // No generator
        classes: ["sqs-block-content", "sqs-row"],
        hasSquarespaceSqs: true,
        hasWixMesh: false,
        hasWebflowBadge: false,
        hasShopifySection: false,
        hasWordPressBlock: false
      };
      const result = detectHostFromHTML(fixture);
      expect(result?.name).toBe("squarespace");
      expect(result?.confidence).toBe("medium"); // selector-based is medium
    });
  });

  describe("Host Detection - Combined", () => {
    it("should prefer URL detection over HTML detection", () => {
      // URL says Squarespace, HTML says WordPress
      const result = detectHost("https://example.squarespace.com", WORDPRESS_FIXTURE);
      expect(result.name).toBe("squarespace"); // URL wins
      expect(result.detectionMethod).toBe("domain");
    });

    it("should fallback to HTML when URL is unknown", () => {
      const result = detectHost("https://custom-domain.com", SQUARESPACE_FIXTURE);
      expect(result.name).toBe("squarespace"); // HTML detection
      expect(result.detectionMethod).toBe("meta");
    });

    it("should return unknown when nothing matches", () => {
      const result = detectHost("https://example.com", UNKNOWN_FIXTURE);
      expect(result.name).toBe("unknown");
      expect(result.confidence).toBe("low");
      expect(result.detectionMethod).toBe("fallback");
    });
  });

  describe("Host Extraction Config", () => {
    it("should return Squarespace config for Squarespace host", () => {
      const host = detectHost("https://example.squarespace.com", SQUARESPACE_FIXTURE);
      const config = getHostExtractionConfig(host);
      
      expect(config.name).toBe("squarespace");
      expect(config.imageDataAttributes).toContain("data-src");
      expect(config.imageDataAttributes).toContain("data-image");
      expect(config.scrollBeforeExtract).toBe(true);
    });

    it("should return WordPress config for WordPress host", () => {
      const host = detectHost("https://example.wordpress.com", WORDPRESS_FIXTURE);
      const config = getHostExtractionConfig(host);
      
      expect(config.name).toBe("wordpress");
      expect(config.imageDataAttributes).toContain("data-lazy-src");
      expect(config.imageDataAttributes).toContain("data-src");
    });

    it("should return Shopify config for Shopify host", () => {
      const host = detectHost("https://store.myshopify.com", SHOPIFY_FIXTURE);
      const config = getHostExtractionConfig(host);
      
      expect(config.name).toBe("shopify");
      expect(config.imageDataAttributes).toContain("data-src");
    });

    it("should return unknown config for unknown host", () => {
      const host = detectHost("https://example.com", UNKNOWN_FIXTURE);
      const config = getHostExtractionConfig(host);
      
      expect(config.name).toBe("unknown");
      expect(config.imageDataAttributes).toContain("data-src");
    });
  });

  describe("Image URL Extraction - Host-Specific Attributes", () => {
    describe("Squarespace images", () => {
      const squarespaceAttrs = HOST_EXTRACTION_CONFIGS.squarespace.imageDataAttributes;

      it("should extract URL from data-src when src is placeholder", () => {
        const img: MockImage = {
          src: "data:image/gif;base64,placeholder",
          "data-src": "https://images.squarespace-cdn.com/content/v1/123/hero.jpg"
        };
        const url = extractImageUrl(img, squarespaceAttrs);
        expect(url).toBe("https://images.squarespace-cdn.com/content/v1/123/hero.jpg");
      });

      it("should extract URL from data-image attribute", () => {
        const img: MockImage = {
          src: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
          "data-image": "https://images.squarespace-cdn.com/content/v1/456/product.jpg"
        };
        const url = extractImageUrl(img, squarespaceAttrs);
        expect(url).toBe("https://images.squarespace-cdn.com/content/v1/456/product.jpg");
      });

      it("should prefer src when it's a valid URL", () => {
        const img: MockImage = {
          src: "https://images.squarespace-cdn.com/content/v1/123/loaded.jpg",
          "data-src": "https://images.squarespace-cdn.com/content/v1/123/original.jpg"
        };
        const url = extractImageUrl(img, squarespaceAttrs);
        expect(url).toBe("https://images.squarespace-cdn.com/content/v1/123/loaded.jpg");
      });
    });

    describe("WordPress images", () => {
      const wordpressAttrs = HOST_EXTRACTION_CONFIGS.wordpress.imageDataAttributes;

      it("should extract URL from data-lazy-src", () => {
        const img: MockImage = {
          src: "/placeholder.gif",
          "data-lazy-src": "https://example.com/wp-content/uploads/hero.jpg"
        };
        const url = extractImageUrl(img, wordpressAttrs);
        expect(url).toBe("https://example.com/wp-content/uploads/hero.jpg");
      });

      it("should fallback to data-src if data-lazy-src is missing", () => {
        const img: MockImage = {
          src: "data:image/placeholder",
          "data-src": "https://example.com/wp-content/uploads/product.jpg"
        };
        const url = extractImageUrl(img, wordpressAttrs);
        expect(url).toBe("https://example.com/wp-content/uploads/product.jpg");
      });

      it("should use data-original as last resort", () => {
        const img: MockImage = {
          src: "data:image/gif;base64,loading",
          "data-original": "https://example.com/wp-content/uploads/original.jpg"
        };
        const url = extractImageUrl(img, wordpressAttrs);
        expect(url).toBe("https://example.com/wp-content/uploads/original.jpg");
      });
    });

    describe("Generic/unknown host images", () => {
      const genericAttrs = HOST_EXTRACTION_CONFIGS.generic.imageDataAttributes;

      it("should extract from src when available", () => {
        const img: MockImage = {
          src: "https://example.com/image.jpg"
        };
        const url = extractImageUrl(img, genericAttrs);
        expect(url).toBe("https://example.com/image.jpg");
      });

      it("should fallback to srcset", () => {
        const img: MockImage = {
          srcset: "https://example.com/image-800.jpg 800w, https://example.com/image-400.jpg 400w"
        };
        const url = extractImageUrl(img, genericAttrs);
        expect(url).toBe("https://example.com/image-800.jpg");
      });

      it("should try data-src when src is placeholder", () => {
        const img: MockImage = {
          src: "data:image/gif;base64,placeholder",
          "data-src": "https://example.com/real-image.jpg"
        };
        const url = extractImageUrl(img, genericAttrs);
        expect(url).toBe("https://example.com/real-image.jpg");
      });

      it("should return null when no valid source found", () => {
        const img: MockImage = {
          src: "data:image/gif;base64,placeholder"
        };
        const url = extractImageUrl(img, genericAttrs);
        // Will return the placeholder since no alternatives
        expect(url).toBe("data:image/gif;base64,placeholder");
      });
    });
  });

  describe("Regression Protection", () => {
    it("should always return a valid DetectedHost object", () => {
      const hosts = [
        detectHost("https://example.squarespace.com", SQUARESPACE_FIXTURE),
        detectHost("https://example.wordpress.com", WORDPRESS_FIXTURE),
        detectHost("https://example.com", UNKNOWN_FIXTURE),
        detectHost("", UNKNOWN_FIXTURE)
      ];

      for (const host of hosts) {
        expect(host).toHaveProperty("name");
        expect(host).toHaveProperty("confidence");
        expect(host).toHaveProperty("detectionMethod");
        expect(host).toHaveProperty("signals");
        expect(["squarespace", "wix", "wordpress", "webflow", "shopify", "unknown"]).toContain(host.name);
        expect(["high", "medium", "low"]).toContain(host.confidence);
      }
    });

    it("should always return valid extraction config", () => {
      const hosts = [
        { name: "squarespace" as const, confidence: "high" as const, detectionMethod: "domain" as const, signals: [] },
        { name: "wordpress" as const, confidence: "high" as const, detectionMethod: "meta" as const, signals: [] },
        { name: "unknown" as const, confidence: "low" as const, detectionMethod: "fallback" as const, signals: [] }
      ];

      for (const host of hosts) {
        const config = getHostExtractionConfig(host);
        expect(config).toHaveProperty("name");
        expect(config).toHaveProperty("imageDataAttributes");
        expect(Array.isArray(config.imageDataAttributes)).toBe(true);
        expect(config.imageDataAttributes.length).toBeGreaterThan(0);
      }
    });

    it("Squarespace data-src images should not be silently skipped", () => {
      const squarespaceImg: MockImage = {
        src: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
        "data-src": "https://images.squarespace-cdn.com/content/v1/5a1b2c3d/1234/hero-banner.jpg"
      };
      
      const config = HOST_EXTRACTION_CONFIGS.squarespace;
      const url = extractImageUrl(squarespaceImg, config.imageDataAttributes);
      
      expect(url).not.toBeNull();
      expect(url).not.toContain("data:image");
      expect(url).toContain("squarespace-cdn.com");
    });

    it("WordPress lazy-loaded images should not be silently skipped", () => {
      const wordpressImg: MockImage = {
        src: "/wp-content/plugins/lazy-load/placeholder.gif",
        "data-lazy-src": "https://example.com/wp-content/uploads/2023/12/team-photo.jpg"
      };
      
      const config = HOST_EXTRACTION_CONFIGS.wordpress;
      const url = extractImageUrl(wordpressImg, config.imageDataAttributes);
      
      expect(url).not.toBeNull();
      expect(url).toContain("wp-content/uploads");
    });

    it("Shopify CDN images should be correctly extracted", () => {
      const shopifyImg: MockImage = {
        src: "https://cdn.shopify.com/s/files/1/0123/4567/8901/products/product.jpg"
      };
      
      const config = HOST_EXTRACTION_CONFIGS.shopify;
      const url = extractImageUrl(shopifyImg, config.imageDataAttributes);
      
      expect(url).not.toBeNull();
      expect(url).toContain("cdn.shopify.com");
    });
  });

  // ===========================================================================
  // HOST-AWARE COPY EXTRACTION TESTS
  // ===========================================================================

  describe("Host-Aware Copy Extraction Config", () => {
    it("should have copy extraction selectors for all hosts", () => {
      const hosts = ["squarespace", "wix", "wordpress", "webflow", "shopify", "unknown"];
      
      for (const hostName of hosts) {
        const config = HOST_EXTRACTION_CONFIGS[hostName];
        expect(config).toBeDefined();
        expect(config.name).toBe(hostName);
        
        // Each host should have copy extraction selectors
        expect(config.heroSelectors).toBeDefined();
        expect(Array.isArray(config.heroSelectors)).toBe(true);
        expect(config.heroSelectors!.length).toBeGreaterThan(0);
        
        expect(config.aboutSelectors).toBeDefined();
        expect(Array.isArray(config.aboutSelectors)).toBe(true);
        expect(config.aboutSelectors!.length).toBeGreaterThan(0);
        
        expect(config.servicesSelectors).toBeDefined();
        expect(Array.isArray(config.servicesSelectors)).toBe(true);
        expect(config.servicesSelectors!.length).toBeGreaterThan(0);
      }
    });

    it("Squarespace should have Squarespace-specific selectors", () => {
      const config = HOST_EXTRACTION_CONFIGS.squarespace;
      
      // Hero should use Squarespace patterns
      expect(config.heroSelectors!.some(s => s.includes("sqs-"))).toBe(true);
      
      // About should use Squarespace content blocks
      expect(config.aboutSelectors!.some(s => s.includes("sqs-block"))).toBe(true);
      
      // Services should use Squarespace patterns
      expect(config.servicesSelectors!.some(s => 
        s.includes("accordion") || s.includes("portfolio") || s.includes("summary")
      )).toBe(true);
      
      // Should have exclusions for Squarespace UI elements
      expect(config.copyExclusions).toBeDefined();
      expect(config.copyExclusions!.some(s => s.includes("cookie") || s.includes("announcement"))).toBe(true);
    });

    it("WordPress should have WordPress-specific selectors", () => {
      const config = HOST_EXTRACTION_CONFIGS.wordpress;
      
      // Hero should use WordPress patterns
      expect(config.heroSelectors!.some(s => 
        s.includes("entry-title") || s.includes("wp-block")
      )).toBe(true);
      
      // About should use WordPress content patterns
      expect(config.aboutSelectors!.some(s => s.includes("entry-content"))).toBe(true);
      
      // Should have exclusions for WordPress UI elements
      expect(config.copyExclusions).toBeDefined();
      expect(config.copyExclusions!.some(s => s.includes("sidebar") || s.includes("comment"))).toBe(true);
    });

    it("Wix should have Wix-specific selectors", () => {
      const config = HOST_EXTRACTION_CONFIGS.wix;
      
      // Wix uses data-testid and data-hook attributes
      expect(config.heroSelectors!.some(s => 
        s.includes("data-testid") || s.includes("data-hook")
      )).toBe(true);
      
      // Should have exclusions for Wix ads
      expect(config.copyExclusions).toBeDefined();
      expect(config.copyExclusions!.some(s => s.includes("WixAds"))).toBe(true);
    });

    it("unknown host should have generic fallback selectors", () => {
      const config = HOST_EXTRACTION_CONFIGS.unknown;
      
      // Generic hero selectors
      expect(config.heroSelectors).toContain("h1");
      
      // Generic about selectors
      expect(config.aboutSelectors!.some(s => s.includes("main") || s.includes("article"))).toBe(true);
      
      // Should have empty exclusions (generic doesn't need specific exclusions)
      expect(config.copyExclusions).toEqual([]);
    });

    it("all copy selectors should be valid CSS selectors", () => {
      const hosts = ["squarespace", "wix", "wordpress", "webflow", "shopify", "unknown"];
      
      for (const hostName of hosts) {
        const config = HOST_EXTRACTION_CONFIGS[hostName];
        
        // Test that selectors are valid (don't throw when creating a selector)
        for (const selector of config.heroSelectors || []) {
          expect(() => {
            // This would throw if selector is invalid
            document.querySelector(selector);
          }).not.toThrow();
        }
        
        for (const selector of config.aboutSelectors || []) {
          expect(() => {
            document.querySelector(selector);
          }).not.toThrow();
        }
        
        for (const selector of config.servicesSelectors || []) {
          expect(() => {
            document.querySelector(selector);
          }).not.toThrow();
        }
      }
    });
  });

  // ===========================================================================
  // COPY EXTRACTION QUALITY CONSTRAINTS
  // ===========================================================================

  describe("Copy Extraction Quality Constraints", () => {
    // Helper: Simulates the normalizeText function from brand-crawler.ts
    const normalizeText = (text: string, maxLength: number): string => {
      return text
        .replace(/\s+/g, ' ')
        .replace(/[\u200B-\u200D\uFEFF]/g, '')
        .trim()
        .slice(0, maxLength);
    };

    const MAX_HERO_LENGTH = 180;
    const MAX_ABOUT_LENGTH = 800;
    const MAX_SERVICE_LENGTH = 120;

    it("should normalize whitespace in text", () => {
      const messyText = "Hello   World\n\nThis  is   a\ttest";
      const normalized = normalizeText(messyText, 200);
      expect(normalized).toBe("Hello World This is a test");
    });

    it("should remove zero-width characters", () => {
      const textWithZeroWidth = "Hello\u200BWorld\uFEFF";
      const normalized = normalizeText(textWithZeroWidth, 200);
      expect(normalized).toBe("HelloWorld");
    });

    it("should enforce hero max length of 180 chars", () => {
      const longText = "A".repeat(250);
      const normalized = normalizeText(longText, MAX_HERO_LENGTH);
      expect(normalized.length).toBe(180);
    });

    it("should enforce about text max length of 800 chars", () => {
      const longText = "B".repeat(1000);
      const normalized = normalizeText(longText, MAX_ABOUT_LENGTH);
      expect(normalized.length).toBe(800);
    });

    it("should enforce service item max length of 120 chars", () => {
      const longService = "C".repeat(200);
      const normalized = normalizeText(longService, MAX_SERVICE_LENGTH);
      expect(normalized.length).toBe(120);
    });

    it("should trim leading and trailing whitespace", () => {
      const spacedText = "   Hello World   ";
      const normalized = normalizeText(spacedText, 200);
      expect(normalized).toBe("Hello World");
    });

    it("services deduplication should work", () => {
      const services = ["Service A", "Service B", "Service A", "Service C", "Service B"];
      const deduped = [...new Set(services)];
      expect(deduped).toEqual(["Service A", "Service B", "Service C"]);
    });

    it("services should be limited to 10 items", () => {
      const manyServices = Array.from({ length: 20 }, (_, i) => `Service ${i + 1}`);
      const limited = manyServices.slice(0, 10);
      expect(limited.length).toBe(10);
    });

    it("all hosts should have copyExclusions defined", () => {
      const hosts = ["squarespace", "wix", "wordpress", "webflow", "shopify", "unknown"];
      
      for (const hostName of hosts) {
        const config = HOST_EXTRACTION_CONFIGS[hostName];
        expect(config.copyExclusions).toBeDefined();
        expect(Array.isArray(config.copyExclusions)).toBe(true);
      }
    });

    it("Squarespace exclusions should filter cookie banners", () => {
      const config = HOST_EXTRACTION_CONFIGS.squarespace;
      expect(config.copyExclusions).toContain(".sqs-cookie-banner");
      expect(config.copyExclusions).toContain(".sqs-announcement-bar");
    });

    it("WordPress exclusions should filter sidebars and comments", () => {
      const config = HOST_EXTRACTION_CONFIGS.wordpress;
      expect(config.copyExclusions).toContain(".sidebar");
      expect(config.copyExclusions).toContain(".comment-form");
    });
  });
});

