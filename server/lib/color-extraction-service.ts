/**
 * Color Extraction Service
 * 
 * Robust color palette extraction from websites with fallback mechanisms.
 * 
 * PRIMARY: DOM-based extraction (CSS variables, computed styles)
 * SECONDARY: Screenshot-based extraction (node-vibrant)
 * FALLBACK: Smart fallback if both fail
 * 
 * This ensures we never return a single pale background color when
 * richer brand colors exist in the DOM.
 * 
 * @see docs/POSTD_PRODUCT_DEFINITION_AND_GUARDRAILS.md
 */

import { Page } from "playwright";
import { Vibrant } from "node-vibrant/node";

/**
 * Color palette structure aligned with brand_kit schema
 */
export interface ColorPalette {
  primary?: string;
  secondary?: string;
  accent?: string;
  confidence: number;
  primaryColors: string[];      // Up to 3 primary colors
  secondaryColors: string[];    // Up to 3 secondary/accent colors
  allColors: string[];          // All 6 colors combined
  source: "dom" | "screenshot" | "hybrid" | "fallback";
}

/**
 * Extracted color with metadata
 */
interface ExtractedColor {
  hex: string;
  source: "css-var" | "header" | "button" | "hero" | "footer" | "accent" | "screenshot";
  weight: number;              // Higher = more important
  brightness: number;          // 0-255
}

/**
 * DOM-based color extraction
 * 
 * Extracts colors from:
 * 1. CSS variables (--primary, --secondary, --accent, --brand-*)
 * 2. Header/nav background and text colors
 * 3. Button/CTA colors
 * 4. Hero section colors
 * 5. Footer colors
 */
export async function extractColorsFromDOM(page: Page): Promise<ExtractedColor[]> {
  const colors = await page.evaluate(() => {
    const results: Array<{
      hex: string;
      source: string;
      weight: number;
    }> = [];

    // Helper to normalize color to hex
    const toHex = (color: string): string | null => {
      if (!color || color === "transparent" || color === "rgba(0, 0, 0, 0)") {
        return null;
      }

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

    // Add color with deduplication
    const addColor = (color: string, source: string, weight: number) => {
      const hex = toHex(color);
      if (!hex) return;

      // Check for duplicate
      const existing = results.find(r => r.hex.toLowerCase() === hex.toLowerCase());
      if (existing) {
        existing.weight = Math.max(existing.weight, weight);
        return;
      }

      results.push({ hex: hex.toLowerCase(), source, weight });
    };

    // 1. CSS Variables (highest priority)
    try {
      const rootStyle = getComputedStyle(document.documentElement);
      const cssVars = [
        "--primary", "--secondary", "--accent",
        "--brand-primary", "--brand-secondary", "--brand-accent",
        "--color-primary", "--color-secondary", "--color-accent",
        "--main-color", "--accent-color", "--highlight-color",
        "--theme-color", "--brand-color",
      ];

      for (const varName of cssVars) {
        const value = rootStyle.getPropertyValue(varName).trim();
        if (value) {
          addColor(value, "css-var", 10); // Highest weight
        }
      }
    } catch (e) {
      // CSS variable extraction failed, continue
    }

    // 2. Header/Nav colors (high priority)
    try {
      const headerElements = document.querySelectorAll("header, nav, .header, .navbar, .site-header, .main-header");
      headerElements.forEach(el => {
        const style = getComputedStyle(el);

        // Background color
        if (style.backgroundColor) {
          addColor(style.backgroundColor, "header", 8);
        }

        // Text color in header (often brand color)
        if (style.color) {
          addColor(style.color, "header", 6);
        }

        // Logo container background
        const logoContainer = el.querySelector(".logo, [class*='logo'], .brand, .site-title");
        if (logoContainer) {
          const logoStyle = getComputedStyle(logoContainer);
          if (logoStyle.backgroundColor) {
            addColor(logoStyle.backgroundColor, "header", 7);
          }
          if (logoStyle.color) {
            addColor(logoStyle.color, "header", 7);
          }
        }
      });
    } catch (e) {
      // Header extraction failed, continue
    }

    // 3. Button/CTA colors (high priority)
    try {
      const buttons = document.querySelectorAll(
        "button, .btn, .button, [class*='cta'], [class*='button'], " +
        "a[class*='btn'], .primary-button, .secondary-button"
      );
      buttons.forEach(btn => {
        const style = getComputedStyle(btn);

        // Button background
        if (style.backgroundColor) {
          addColor(style.backgroundColor, "button", 7);
        }

        // Button text (often contrasting brand color)
        if (style.color) {
          addColor(style.color, "button", 5);
        }

        // Button border (often accent color)
        if (style.borderColor && style.borderColor !== "transparent") {
          addColor(style.borderColor, "button", 4);
        }
      });
    } catch (e) {
      // Button extraction failed, continue
    }

    // 4. Hero section colors
    try {
      const heroSections = document.querySelectorAll(
        ".hero, .banner, .masthead, [class*='hero'], [class*='banner'], " +
        ".jumbotron, .intro, .above-fold, section:first-of-type"
      );
      heroSections.forEach(hero => {
        const style = getComputedStyle(hero);

        // Hero text (often brand color)
        if (style.color) {
          addColor(style.color, "hero", 6);
        }

        // Hero background
        if (style.backgroundColor) {
          addColor(style.backgroundColor, "hero", 5);
        }

        // Gradient colors
        if (style.backgroundImage && style.backgroundImage.includes("gradient")) {
          const gradientMatch = style.backgroundImage.match(/rgb\([^)]+\)/g);
          if (gradientMatch) {
            gradientMatch.forEach(c => addColor(c, "hero", 4));
          }
        }
      });
    } catch (e) {
      // Hero extraction failed, continue
    }

    // 5. Accent elements (badges, tags, highlights)
    try {
      const accentElements = document.querySelectorAll(
        ".badge, .tag, .chip, [class*='badge'], [class*='tag'], [class*='pill'], " +
        ".highlight, .accent, [class*='accent'], .featured"
      );
      accentElements.forEach(el => {
        const style = getComputedStyle(el);
        if (style.backgroundColor) {
          addColor(style.backgroundColor, "accent", 5);
        }
        if (style.color) {
          addColor(style.color, "accent", 3);
        }
      });
    } catch (e) {
      // Accent extraction failed, continue
    }

    // 6. Footer colors (lower priority but often contains brand colors)
    try {
      const footerElements = document.querySelectorAll("footer, .footer, .site-footer");
      footerElements.forEach(el => {
        const style = getComputedStyle(el);
        if (style.backgroundColor) {
          addColor(style.backgroundColor, "footer", 3);
        }
        if (style.color) {
          addColor(style.color, "footer", 2);
        }
      });
    } catch (e) {
      // Footer extraction failed, continue
    }

    // 7. Link colors (accent indicator)
    try {
      const links = document.querySelectorAll("a:not([class*='btn']):not([class*='button'])");
      const sampledLinks = Array.from(links).slice(0, 20); // Sample first 20
      sampledLinks.forEach(link => {
        const style = getComputedStyle(link);
        if (style.color) {
          addColor(style.color, "accent", 2);
        }
      });
    } catch (e) {
      // Link extraction failed, continue
    }

    return results;
  });

  // Add brightness calculation
  return colors.map(c => ({
    ...c,
    source: c.source as ExtractedColor["source"],
    brightness: calculateBrightness(c.hex),
  }));
}

/**
 * Calculate brightness of a hex color (0-255)
 */
function calculateBrightness(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 128; // Default to middle brightness
  return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
}

/**
 * Convert hex to RGB
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
 * Screenshot-based color extraction using node-vibrant
 */
export async function extractColorsFromScreenshot(
  page: Page,
  timeout: number = 10000
): Promise<ExtractedColor[]> {
  try {
    // Take viewport screenshot (not full page - faster)
    const screenshot = await page.screenshot({ 
      fullPage: false,
      timeout,
    });

    const palette = await Vibrant.from(screenshot).getPalette();

    const colors: ExtractedColor[] = [];

    // Extract colors in priority order
    if (palette.Vibrant?.hex) {
      colors.push({
        hex: palette.Vibrant.hex.toLowerCase(),
        source: "screenshot",
        weight: 5,
        brightness: calculateBrightness(palette.Vibrant.hex),
      });
    }
    if (palette.DarkVibrant?.hex) {
      colors.push({
        hex: palette.DarkVibrant.hex.toLowerCase(),
        source: "screenshot",
        weight: 4,
        brightness: calculateBrightness(palette.DarkVibrant.hex),
      });
    }
    if (palette.Muted?.hex) {
      colors.push({
        hex: palette.Muted.hex.toLowerCase(),
        source: "screenshot",
        weight: 3,
        brightness: calculateBrightness(palette.Muted.hex),
      });
    }
    if (palette.LightVibrant?.hex) {
      colors.push({
        hex: palette.LightVibrant.hex.toLowerCase(),
        source: "screenshot",
        weight: 2,
        brightness: calculateBrightness(palette.LightVibrant.hex),
      });
    }
    if (palette.LightMuted?.hex) {
      colors.push({
        hex: palette.LightMuted.hex.toLowerCase(),
        source: "screenshot",
        weight: 1,
        brightness: calculateBrightness(palette.LightMuted.hex),
      });
    }
    if (palette.DarkMuted?.hex) {
      colors.push({
        hex: palette.DarkMuted.hex.toLowerCase(),
        source: "screenshot",
        weight: 1,
        brightness: calculateBrightness(palette.DarkMuted.hex),
      });
    }

    return colors;
  } catch (error) {
    console.warn("[ColorExtraction] Screenshot extraction failed:", error instanceof Error ? error.message : String(error));
    return [];
  }
}

/**
 * Filter colors to remove neutrals, near-duplicates, and photo colors
 */
function filterBrandColors(colors: ExtractedColor[]): ExtractedColor[] {
  const filtered: ExtractedColor[] = [];
  const seenHexes = new Set<string>();

  for (const color of colors) {
    // Skip if we've seen this color
    if (seenHexes.has(color.hex.toLowerCase())) continue;

    // Skip near-black (brightness < 15)
    if (color.brightness < 15) {
      if (process.env.DEBUG_COLOR_EXTRACT === "true") {
        console.log(`[ColorExtract] Filtered near-black: ${color.hex}`);
      }
      continue;
    }

    // Skip near-white (brightness > 245)
    if (color.brightness > 245) {
      if (process.env.DEBUG_COLOR_EXTRACT === "true") {
        console.log(`[ColorExtract] Filtered near-white: ${color.hex}`);
      }
      continue;
    }

    // Skip grays (low saturation - R, G, B are close together)
    const rgb = hexToRgb(color.hex);
    if (rgb) {
      const max = Math.max(rgb.r, rgb.g, rgb.b);
      const min = Math.min(rgb.r, rgb.g, rgb.b);
      const saturation = max === 0 ? 0 : (max - min) / max;
      
      // Very low saturation = gray
      if (saturation < 0.1 && color.brightness > 50 && color.brightness < 200) {
        if (process.env.DEBUG_COLOR_EXTRACT === "true") {
          console.log(`[ColorExtract] Filtered gray: ${color.hex} (saturation: ${saturation.toFixed(2)})`);
        }
        continue;
      }
    }

    // Skip photo colors (skin tones, common photo colors)
    if (isPhotoColor(color.hex)) {
      if (process.env.DEBUG_COLOR_EXTRACT === "true") {
        console.log(`[ColorExtract] Filtered photo color: ${color.hex}`);
      }
      continue;
    }

    // Skip near-duplicates (color distance < 20)
    let isDuplicate = false;
    for (const existing of filtered) {
      if (colorDistance(color.hex, existing.hex) < 20) {
        isDuplicate = true;
        break;
      }
    }
    if (isDuplicate) continue;

    seenHexes.add(color.hex.toLowerCase());
    filtered.push(color);
  }

  return filtered;
}

/**
 * Check if color looks like a photo color (skin tones, etc.)
 */
function isPhotoColor(hex: string): boolean {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;

  // Skin tone detection (beige/tan range)
  const isSkinTone = (
    rgb.r > 150 && rgb.r < 255 &&
    rgb.g > 100 && rgb.g < 200 &&
    rgb.b > 50 && rgb.b < 180 &&
    rgb.r > rgb.g && rgb.g > rgb.b
  );

  return isSkinTone;
}

/**
 * Calculate Euclidean distance between two colors
 */
function colorDistance(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  if (!rgb1 || !rgb2) return Infinity;

  return Math.sqrt(
    Math.pow(rgb1.r - rgb2.r, 2) +
    Math.pow(rgb1.g - rgb2.g, 2) +
    Math.pow(rgb1.b - rgb2.b, 2)
  );
}

/**
 * Main color extraction function with fallback
 * 
 * Strategy:
 * 1. Try DOM-based extraction (fast, reliable)
 * 2. If DOM yields < 3 colors, supplement with screenshot
 * 3. If both fail, use smart fallback (never return empty)
 */
export async function extractColorPalette(
  page: Page,
  options: {
    screenshotTimeout?: number;
    minColors?: number;
  } = {}
): Promise<ColorPalette> {
  const { screenshotTimeout = 10000, minColors = 3 } = options;

  let domColors: ExtractedColor[] = [];
  let screenshotColors: ExtractedColor[] = [];
  let source: ColorPalette["source"] = "dom";

  // Step 1: DOM-based extraction
  try {
    domColors = await extractColorsFromDOM(page);
    domColors = filterBrandColors(domColors);
    
    if (process.env.DEBUG_COLOR_EXTRACT === "true") {
      console.log(`[ColorExtract] DOM extracted ${domColors.length} colors:`, 
        domColors.map(c => ({ hex: c.hex, source: c.source, weight: c.weight })));
    }
  } catch (error) {
    console.warn("[ColorExtraction] DOM extraction failed:", error instanceof Error ? error.message : String(error));
  }

  // Step 2: If DOM didn't yield enough, try screenshot
  if (domColors.length < minColors) {
    try {
      screenshotColors = await extractColorsFromScreenshot(page, screenshotTimeout);
      screenshotColors = filterBrandColors(screenshotColors);

      if (process.env.DEBUG_COLOR_EXTRACT === "true") {
        console.log(`[ColorExtract] Screenshot extracted ${screenshotColors.length} colors:`,
          screenshotColors.map(c => c.hex));
      }

      // Determine source
      if (domColors.length > 0 && screenshotColors.length > 0) {
        source = "hybrid";
      } else if (screenshotColors.length > 0) {
        source = "screenshot";
      }
    } catch (error) {
      console.warn("[ColorExtraction] Screenshot extraction failed:", error instanceof Error ? error.message : String(error));
    }
  }

  // Combine colors (DOM first, then screenshot)
  const allColors: ExtractedColor[] = [];
  const seenHexes = new Set<string>();

  // Add DOM colors (higher priority)
  for (const color of domColors.sort((a, b) => b.weight - a.weight)) {
    if (!seenHexes.has(color.hex)) {
      allColors.push(color);
      seenHexes.add(color.hex);
    }
  }

  // Add screenshot colors (fill gaps)
  for (const color of screenshotColors) {
    if (!seenHexes.has(color.hex) && allColors.length < 6) {
      allColors.push(color);
      seenHexes.add(color.hex);
    }
  }

  // Step 3: Fallback if we still don't have enough colors
  if (allColors.length === 0) {
    console.warn("[ColorExtraction] No colors extracted, using fallback palette");
    source = "fallback";
    return {
      primary: "#312E81",      // Deep indigo (POSTD brand)
      secondary: "#6366F1",    // Bright indigo
      accent: "#8B5CF6",       // Purple accent
      confidence: 0,
      primaryColors: ["#312E81", "#6366F1", "#8B5CF6"],
      secondaryColors: [],
      allColors: ["#312E81", "#6366F1", "#8B5CF6"],
      source: "fallback",
    };
  }

  // Build 6-color palette structure
  const hexColors = allColors.map(c => c.hex);
  const primaryColors = hexColors.slice(0, 3);
  const secondaryColors = hexColors.slice(3, 6);

  return {
    primary: primaryColors[0],
    secondary: primaryColors[1],
    accent: primaryColors[2],
    confidence: calculateConfidence(allColors),
    primaryColors,
    secondaryColors,
    allColors: hexColors.slice(0, 6),
    source,
  };
}

/**
 * Calculate confidence score based on extraction quality
 */
function calculateConfidence(colors: ExtractedColor[]): number {
  if (colors.length === 0) return 0;

  // Base confidence on:
  // 1. Number of colors (more = better)
  // 2. Source diversity (multiple sources = better)
  // 3. Weight of colors (higher weight = better)

  const colorCount = Math.min(colors.length, 6);
  const sources = new Set(colors.map(c => c.source));
  const avgWeight = colors.reduce((sum, c) => sum + c.weight, 0) / colors.length;

  let confidence = 0;
  confidence += colorCount * 10;          // Up to 60 points for 6 colors
  confidence += sources.size * 10;        // Up to 50 points for 5 sources
  confidence += avgWeight * 3;            // Up to 30 points for avg weight 10

  // Normalize to 0-100
  return Math.min(Math.round(confidence), 100);
}

/**
 * Debug helper to log extraction results
 */
export function logColorPalette(palette: ColorPalette, context?: string): void {
  if (process.env.DEBUG_COLOR_EXTRACT !== "true") return;

  console.log(`[ColorExtract] ${context || "Palette"} (source: ${palette.source}, confidence: ${palette.confidence})`);
  console.log(`  Primary: ${palette.primaryColors.join(", ")}`);
  console.log(`  Secondary: ${palette.secondaryColors.join(", ")}`);
}

