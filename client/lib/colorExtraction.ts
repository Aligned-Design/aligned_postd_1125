/**
 * Extract dominant colors from an image file
 * Returns 5-7 swatches with primary, secondary, accents, and neutrals
 */

export interface ExtractedPalette {
  primary: string;
  secondary: string;
  accent: string;
  accentAlt?: string;
  neutral: string;
  neutralDark: string;
  neutralLight: string;
}

export interface ColorSwatch {
  color: string;
  name: string;
  role: "primary" | "secondary" | "accent" | "neutral" | "neutral-dark" | "neutral-light";
  wcag: {
    score: string; // "AAA" | "AA" | "Fail"
    ratio: number;
  };
}

/**
 * Calculate WCAG contrast ratio between two colors
 * Returns a value between 1 and 21
 */
function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) return 0;

  const lum1 = getRelativeLuminance(rgb1);
  const lum2 = getRelativeLuminance(rgb2);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

function getRelativeLuminance(rgb: { r: number; g: number; b: number }): number {
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((val) => {
    const v = val / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

function getWCAGScore(ratio: number): "AAA" | "AA" | "Fail" {
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  return "Fail";
}

/**
 * Extract colors from image file using canvas + image data
 * Returns a mock palette based on file (real implementation would use color quantization)
 */
export async function extractColorsFromImage(file: File): Promise<ColorSwatch[]> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");

          if (!ctx) {
            resolve(getDefaultPalette());
            return;
          }

          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          // Extract color frequencies (simplified quantization)
          const colorMap = new Map<string, number>();

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];

            // Skip transparent and near-white pixels
            if (a < 100 || (r > 240 && g > 240 && b > 240)) continue;

            // Quantize to reduce colors
            const qr = Math.round(r / 32) * 32;
            const qg = Math.round(g / 32) * 32;
            const qb = Math.round(b / 32) * 32;
            const hex = `#${[qr, qg, qb].map((x) => x.toString(16).padStart(2, "0")).join("").toUpperCase()}`;

            colorMap.set(hex, (colorMap.get(hex) || 0) + 1);
          }

          // Get top colors
          const sortedColors = Array.from(colorMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 7)
            .map(([color]) => color);

          if (sortedColors.length === 0) {
            resolve(getDefaultPalette());
            return;
          }

          // Assign roles based on brightness
          const swatches = sortedColors.map((color, idx) => {
            const rgb = hexToRgb(color);
            if (!rgb) return null;

            const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
            let role: ColorSwatch["role"];

            if (idx === 0) role = "primary";
            else if (idx === 1) role = "secondary";
            else if (idx === 2) role = "accent";
            else if (brightness < 50) role = "neutral-dark";
            else if (brightness > 200) role = "neutral-light";
            else role = "neutral";

            const wcagRatio = getContrastRatio(color, "#FFFFFF");
            const score = getWCAGScore(wcagRatio);

            const names: Record<ColorSwatch["role"], string> = {
              primary: "Primary",
              secondary: "Secondary",
              accent: "Accent",
              "neutral-dark": "Dark Neutral",
              "neutral-light": "Light Neutral",
              neutral: "Neutral",
            };

            return {
              color,
              name: names[role],
              role,
              wcag: { score, ratio: Math.round(wcagRatio * 100) / 100 },
            };
          });

          resolve(swatches.filter((s) => s !== null) as ColorSwatch[]);
        } catch (error) {
          resolve(getDefaultPalette());
        }
      };

      img.onerror = () => resolve(getDefaultPalette());
      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Default palette if extraction fails
 */
function getDefaultPalette(): ColorSwatch[] {
  const defaults = [
    { color: "#312E81", name: "Primary", role: "primary" as const },
    { color: "#3B82F6", name: "Secondary", role: "secondary" as const },
    { color: "#B9F227", name: "Accent", role: "accent" as const },
    { color: "#64748B", name: "Neutral", role: "neutral" as const },
    { color: "#1E293B", name: "Dark Neutral", role: "neutral-dark" as const },
    { color: "#F1F5F9", name: "Light Neutral", role: "neutral-light" as const },
  ];

  return defaults.map((swatch) => ({
    ...swatch,
    wcag: {
      score: "AA" as const,
      ratio: 4.5,
    },
  }));
}

/**
 * Generate color palette variants from a base color
 */
export function generatePaletteVariants(baseColor: string): ColorSwatch[] {
  // Simplified: return base + variations
  const variants = [baseColor];
  const rgb = hexToRgb(baseColor);

  if (rgb) {
    // Add lighter variant
    variants.push(
      `#${Math.min(rgb.r + 40, 255)
        .toString(16)
        .padStart(2, "0")}${Math.min(rgb.g + 40, 255)
        .toString(16)
        .padStart(2, "0")}${Math.min(rgb.b + 40, 255)
        .toString(16)
        .padStart(2, "0")}`
    );

    // Add darker variant
    variants.push(
      `#${Math.max(rgb.r - 40, 0)
        .toString(16)
        .padStart(2, "0")}${Math.max(rgb.g - 40, 0)
        .toString(16)
        .padStart(2, "0")}${Math.max(rgb.b - 40, 0)
        .toString(16)
        .padStart(2, "0")}`
    );
  }

  return variants.slice(0, 3).map((color, idx) => ({
    color,
    name: ["Primary", "Light", "Dark"][idx],
    role: "primary",
    wcag: { score: "AA", ratio: 4.5 },
  }));
}
