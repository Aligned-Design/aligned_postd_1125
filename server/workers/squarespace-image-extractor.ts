/**
 * Squarespace-specific image extraction
 * 
 * Squarespace sites use:
 * - CSS background-image on divs (not just sections)
 * - Lazy-loaded images that require scrolling
 * - srcset with multiple variants
 * - data-src, data-image, data-image-resolution attributes
 * - Specific class patterns: .sqs-block-image, .image-block-wrapper, .content-fill
 */

import { Page } from "playwright";

export interface SquarespaceImage {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
  role?: "logo" | "hero" | "photo" | "other";
  source: "html-img" | "css-bg";
  squarespaceClass?: string;
}

/**
 * Extract images from Squarespace site with enhanced detection
 * Returns images that standard extraction might miss
 */
export async function extractSquarespaceImages(
  page: Page,
  baseUrl: string
): Promise<SquarespaceImage[]> {
  console.log("[Squarespace] Starting enhanced image extraction");

  // Step 1: Scroll to trigger lazy-loading
  await triggerLazyLoading(page);

  // Step 2: Wait for images to load
  await page.waitForTimeout(2000);

  // Step 3: Extract images using multiple strategies
  const images = await page.evaluate((url) => {
    const base = new URL(url);
    const results: Array<{
      url: string;
      alt?: string;
      width?: number;
      height?: number;
      role?: "logo" | "hero" | "photo" | "other";
      source: "html-img" | "css-bg";
      squarespaceClass?: string;
    }> = [];

    const seen = new Set<string>();

    // Helper to normalize URL
    const normalizeUrl = (src: string): string | null => {
      if (!src) return null;
      try {
        if (src.startsWith("//")) return `${base.protocol}${src}`;
        if (src.startsWith("/")) return `${base.origin}${src}`;
        if (src.startsWith("http")) return src;
        return new URL(src, base.href).href;
      } catch {
        return null;
      }
    };

    // Helper to classify role based on context
    const classifyRole = (
      el: Element,
      width?: number,
      height?: number
    ): "logo" | "hero" | "photo" | "other" => {
      const className = el.className?.toString().toLowerCase() || "";
      const parentClassName = el.parentElement?.className?.toString().toLowerCase() || "";
      const combinedClass = `${className} ${parentClassName}`;

      // Logo detection
      if (
        combinedClass.includes("logo") ||
        combinedClass.includes("branding") ||
        combinedClass.includes("site-title")
      ) {
        return "logo";
      }

      // Hero detection
      if (
        combinedClass.includes("hero") ||
        combinedClass.includes("banner") ||
        combinedClass.includes("intro") ||
        combinedClass.includes("splash") ||
        (width && height && width > 800 && height > 400)
      ) {
        return "hero";
      }

      // Photo (medium-large images in content)
      if (width && height && ((width > 400 && height > 300) || (width > 300 && height > 400))) {
        return "photo";
      }

      return "other";
    };

    // Strategy 1: CSS background-image on Squarespace-specific elements
    console.log("[Squarespace] Extracting CSS background images");
    const sqsSelectors = [
      ".sqs-block-image",
      ".image-block-wrapper",
      ".content-fill",
      "[class*='image-block']",
      "[class*='Image']", // React components
      ".gallery-grid-item",
      ".slide",
      "[data-block-type='5']", // Squarespace image block type
    ];

    sqsSelectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((el) => {
        try {
          const style = window.getComputedStyle(el);
          const bgImage = style.backgroundImage;

          if (bgImage && bgImage !== "none") {
            // Extract URL from url("...")
            const match = bgImage.match(/url\(['"]?([^'"()]+)['"]?\)/i);
            if (match && match[1]) {
              const normalized = normalizeUrl(match[1]);
              if (normalized && !seen.has(normalized) && !normalized.includes("data:image")) {
                const rect = el.getBoundingClientRect();
                results.push({
                  url: normalized,
                  width: rect.width > 0 ? Math.floor(rect.width) : undefined,
                  height: rect.height > 0 ? Math.floor(rect.height) : undefined,
                  role: classifyRole(el, rect.width, rect.height),
                  source: "css-bg",
                  squarespaceClass: el.className?.toString() || undefined,
                });
                seen.add(normalized);
              }
            }
          }
        } catch (err) {
          // Skip errors
        }
      });
    });

    // Strategy 2: Enhanced <img> tag extraction with Squarespace data attributes
    console.log("[Squarespace] Extracting <img> tags with data attributes");
    document.querySelectorAll("img").forEach((img) => {
      try {
        let src: string | null = null;

        // Priority order for Squarespace
        const attrs = [
          "data-src",
          "data-image",
          "data-image-resolution",
          "data-original",
          "data-lazy-src",
          "src",
        ];

        for (const attr of attrs) {
          const value = img.getAttribute(attr);
          if (value && !value.startsWith("data:image") && !value.includes("placeholder")) {
            src = value;
            break;
          }
        }

        // Fallback to srcset if no src found
        if (!src) {
          const srcset = img.getAttribute("srcset");
          if (srcset) {
            // Parse srcset and take the largest image
            const srcsetParts = srcset.split(",").map((s) => {
              const parts = s.trim().split(/\s+/);
              return {
                url: parts[0],
                descriptor: parts[1] || "1x",
              };
            });
            // Sort by descriptor (prefer larger images)
            srcsetParts.sort((a, b) => {
              const aVal = parseFloat(a.descriptor) || 1;
              const bVal = parseFloat(b.descriptor) || 1;
              return bVal - aVal;
            });
            if (srcsetParts[0]) {
              src = srcsetParts[0].url;
            }
          }
        }

        if (!src) return;

        const normalized = normalizeUrl(src);
        if (normalized && !seen.has(normalized) && !normalized.includes("data:image")) {
          results.push({
            url: normalized,
            alt: img.alt || undefined,
            width: img.naturalWidth || img.width || undefined,
            height: img.naturalHeight || img.height || undefined,
            role: classifyRole(img, img.naturalWidth || img.width, img.naturalHeight || img.height),
            source: "html-img",
            squarespaceClass: img.className?.toString() || undefined,
          });
          seen.add(normalized);
        }
      } catch (err) {
        // Skip errors
      }
    });

    // Strategy 3: <picture> elements (Squarespace uses these for responsive images)
    console.log("[Squarespace] Extracting <picture> elements");
    document.querySelectorAll("picture").forEach((picture) => {
      try {
        // Get the <img> inside <picture>
        const img = picture.querySelector("img");
        if (img) {
          const src = img.getAttribute("src") || img.getAttribute("data-src");
          if (src) {
            const normalized = normalizeUrl(src);
            if (normalized && !seen.has(normalized) && !normalized.includes("data:image")) {
              results.push({
                url: normalized,
                alt: img.alt || undefined,
                width: img.naturalWidth || img.width || undefined,
                height: img.naturalHeight || img.height || undefined,
                role: classifyRole(img, img.naturalWidth || img.width, img.naturalHeight || img.height),
                source: "html-img",
                squarespaceClass: img.className?.toString() || undefined,
              });
              seen.add(normalized);
            }
          }
        }

        // Also check <source> elements for higher-res variants
        picture.querySelectorAll("source").forEach((source) => {
          const srcset = source.getAttribute("srcset");
          if (srcset) {
            const firstUrl = srcset.split(",")[0]?.trim().split(/\s+/)[0];
            if (firstUrl) {
              const normalized = normalizeUrl(firstUrl);
              if (normalized && !seen.has(normalized) && !normalized.includes("data:image")) {
                results.push({
                  url: normalized,
                  role: "photo",
                  source: "html-img",
                });
                seen.add(normalized);
              }
            }
          }
        });
      } catch (err) {
        // Skip errors
      }
    });

    console.log(`[Squarespace] Extracted ${results.length} images`);
    return results;
  }, baseUrl);

  console.log(`[Squarespace] Enhanced extraction found ${images.length} images`);

  // Filter out obvious noise
  const filtered = images.filter((img) => {
    const url = img.url.toLowerCase();
    // Skip tracking pixels, icons, and very small images
    if (url.includes("tracking") || url.includes("pixel") || url.includes("1x1")) return false;
    if (url.includes("icon") && (img.width || 0) < 50) return false;
    if (url.includes("spinner") || url.includes("loader")) return false;
    return true;
  });

  console.log(`[Squarespace] After filtering: ${filtered.length} images`);
  return filtered;
}

/**
 * Scroll page to trigger lazy-loaded images
 * Squarespace uses intersection observers for lazy loading
 */
async function triggerLazyLoading(page: Page): Promise<void> {
  console.log("[Squarespace] Scrolling to trigger lazy-loading");

  try {
    // Scroll to bottom in steps to trigger lazy-loading
    await page.evaluate(async () => {
      const scrollStep = window.innerHeight;
      const totalHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight
      );
      const maxScrolls = Math.ceil(totalHeight / scrollStep);

      for (let i = 0; i < Math.min(maxScrolls, 5); i++) {
        // Limit to 5 scrolls
        window.scrollTo({
          top: scrollStep * i,
          behavior: "smooth",
        });
        // Wait for images to load
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Scroll back to top
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    console.log("[Squarespace] Lazy-loading triggered");
  } catch (error) {
    console.warn("[Squarespace] Error triggering lazy-loading:", error);
  }
}

/**
 * Detect if a site is using Squarespace
 */
export async function isSquarespaceSite(page: Page): Promise<boolean> {
  return await page.evaluate(() => {
    // Check for Squarespace indicators
    const meta = document.querySelector('meta[name="generator"]');
    if (meta?.getAttribute("content")?.includes("Squarespace")) return true;

    // Check for Squarespace-specific classes
    const sqsClasses = [".sqs-block", ".squarespace-footer", ".sqs-cookie-banner"];
    for (const selector of sqsClasses) {
      if (document.querySelector(selector)) return true;
    }

    // Check for Squarespace in body class
    if (document.body.className.includes("sqs-")) return true;

    return false;
  });
}

