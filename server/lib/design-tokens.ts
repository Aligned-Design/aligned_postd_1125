/**
 * Design Tokens - Universal Brand Design System
 *
 * Defines all colors, typography, spacing, and styling rules
 * that the Creative Intelligence agent uses to enforce brand consistency
 * across light and dark modes, all components, and all platforms.
 */

export type ThemeMode = "light" | "dark";

/**
 * Color Palette - Brand Colors and Neutrals
 */
export interface ColorPalette {
  // Primary brand color (purple)
  primary: string;
  primaryLight: string;
  primaryDark: string;

  // Secondary color (gold/amber)
  secondary: string;
  secondaryLight: string;
  secondaryDark: string;

  // Accent color (used for highlights, CTAs)
  accent: string;
  accentLight: string;

  // Semantic colors
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  error: string;
  errorLight: string;
  info: string;
  infoLight: string;

  // Neutral grays
  neutral50: string;
  neutral100: string;
  neutral200: string;
  neutral300: string;
  neutral400: string;
  neutral500: string;
  neutral600: string;
  neutral700: string;
  neutral800: string;
  neutral900: string;
  neutral950: string;
}

/**
 * Light mode colors (Aligned-20AI brand)
 */
export const lightPalette: ColorPalette = {
  // Primary: Purple (brand signature)
  primary: "#A76CF5",
  primaryLight: "#C89FFF",
  primaryDark: "#8B3FD9",

  // Secondary: Gold (warmth and optimism)
  secondary: "#F5C96C",
  secondaryLight: "#F6D57E",
  secondaryDark: "#D4A746",

  // Accent: Teal (energy and growth)
  accent: "#06B6D4",
  accentLight: "#22D3EE",

  // Semantic colors
  success: "#10B981",
  successLight: "#A7F3D0",
  warning: "#F59E0B",
  warningLight: "#FEF08A",
  error: "#EF4444",
  errorLight: "#FCA5A5",
  info: "#3B82F6",
  infoLight: "#DBEAFE",

  // Neutrals: Light mode uses light backgrounds
  neutral50: "#F9FAFB",
  neutral100: "#F3F4F6",
  neutral200: "#E5E7EB",
  neutral300: "#D1D5DB",
  neutral400: "#9CA3AF",
  neutral500: "#6B7280",
  neutral600: "#4B5563",
  neutral700: "#374151",
  neutral800: "#1F2937",
  neutral900: "#111827",
  neutral950: "#030712",
};

/**
 * Dark mode colors (adjusted for readability and brand consistency)
 */
export const darkPalette: ColorPalette = {
  // Primary: Lighter purple for dark backgrounds
  primary: "#C89FFF",
  primaryLight: "#E6D4FF",
  primaryDark: "#A76CF5",

  // Secondary: Adjusted gold for dark backgrounds
  secondary: "#F6D57E",
  secondaryLight: "#F9E399",
  secondaryDark: "#D4A746",

  // Accent: Lighter teal
  accent: "#22D3EE",
  accentLight: "#67E8F9",

  // Semantic colors (light variants for dark mode)
  success: "#6EE7B7",
  successLight: "#D1FAE5",
  warning: "#FBBF24",
  warningLight: "#FEF08A",
  error: "#F87171",
  errorLight: "#FCA5A5",
  info: "#60A5FA",
  infoLight: "#DBEAFE",

  // Neutrals: Dark mode uses dark backgrounds
  neutral50: "#F9FAFB",
  neutral100: "#F3F4F6",
  neutral200: "#E5E7EB",
  neutral300: "#D1D5DB",
  neutral400: "#9CA3AF",
  neutral500: "#6B7280",
  neutral600: "#4B5563",
  neutral700: "#374151",
  neutral800: "#1F2937",
  neutral900: "#111827",
  neutral950: "#030712",
};

/**
 * Typography Tokens
 */
export interface TypographyTokens {
  fontFamily: {
    body: string;
    heading: string;
    mono: string;
  };
  fontSize: {
    xs: string; // 12px
    sm: string; // 14px
    base: string; // 16px
    lg: string; // 18px
    xl: string; // 20px
    "2xl": string; // 24px
    "3xl": string; // 30px
    "4xl": string; // 36px
  };
  fontWeight: {
    thin: number;
    extralight: number;
    light: number;
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
    extrabold: number;
  };
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
  };
}

export const typographyTokens: TypographyTokens = {
  fontFamily: {
    body: "Inter, system-ui, -apple-system, sans-serif",
    heading: "Poppins, system-ui, -apple-system, sans-serif",
    mono: "Fira Code, Courier New, monospace",
  },
  fontSize: {
    xs: "12px",
    sm: "14px",
    base: "16px",
    lg: "18px",
    xl: "20px",
    "2xl": "24px",
    "3xl": "30px",
    "4xl": "36px",
  },
  fontWeight: {
    thin: 100,
    extralight: 200,
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

/**
 * Spacing Tokens
 */
export interface SpacingTokens {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  "2xl": string;
  "3xl": string;
  "4xl": string;
}

export const spacingTokens: SpacingTokens = {
  xs: "4px",
  sm: "8px",
  md: "16px",
  lg: "24px",
  xl: "32px",
  "2xl": "48px",
  "3xl": "64px",
  "4xl": "96px",
};

/**
 * Border Radius Tokens
 */
export interface BorderRadiusTokens {
  none: string;
  sm: string;
  base: string;
  md: string;
  lg: string;
  full: string;
}

export const borderRadiusTokens: BorderRadiusTokens = {
  none: "0",
  sm: "0.375rem",
  base: "0.75rem",
  md: "1rem",
  lg: "1.5rem",
  full: "9999px",
};

/**
 * Shadow Tokens
 */
export interface ShadowTokens {
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

export const shadowTokens: ShadowTokens = {
  sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
};

/**
 * Theme Configuration - resolved tokens for light/dark modes
 */
export interface ThemeConfig {
  mode: ThemeMode;
  colors: ColorPalette;
  typography: TypographyTokens;
  spacing: SpacingTokens;
  borderRadius: BorderRadiusTokens;
  shadows: ShadowTokens;
  transitions: {
    base: string; // duration for theme transitions
  };
}

/**
 * Get theme configuration for a given mode
 */
export function getThemeConfig(mode: ThemeMode): ThemeConfig {
  const palette = mode === "light" ? lightPalette : darkPalette;

  return {
    mode,
    colors: palette,
    typography: typographyTokens,
    spacing: spacingTokens,
    borderRadius: borderRadiusTokens,
    shadows: shadowTokens,
    transitions: {
      base: "0.2s ease-in-out",
    },
  };
}

/**
 * WCAG AA Contrast Ratio Checker
 * Returns true if contrast ratio meets 4.5:1 minimum for normal text
 */
export function checkContrast(foreground: string, background: string): boolean {
  const getLuminance = (hex: string): number => {
    const rgb = parseInt(hex.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;

    const srgb = [r / 255, g / 255, b / 255].map((c) =>
      c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    );

    return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
  };

  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  const contrastRatio = (lighter + 0.05) / (darker + 0.05);
  return contrastRatio >= 4.5;
}

/**
 * Get contrasting text color (light or dark) for a background
 */
export function getContrastingTextColor(
  backgroundColor: string,
  palette: ColorPalette
): string {
  const light = palette.neutral50;
  const dark = palette.neutral950;

  // Try dark text first
  if (checkContrast(dark, backgroundColor)) {
    return dark;
  }

  // Fall back to light text
  return light;
}

/**
 * Validate that a color is in the approved palette
 */
export function isColorInPalette(color: string, palette: ColorPalette): boolean {
  const paletteValues = Object.values(palette) as string[];
  return paletteValues.includes(color.toUpperCase()) || paletteValues.includes(color.toLowerCase());
}

/**
 * Design System Metadata
 */
export const designSystemMetadata = {
  version: "1.0.0",
  name: "Aligned-20AI Brand Design System",
  wcagCompliance: "AA",
  modes: ["light", "dark", "high-contrast"] as const,
  platforms: [
    "web",
    "mobile",
    "email",
    "social-media",
    "dashboard",
    "landing-page",
  ] as const,
  lastUpdated: new Date().toISOString(),
  maintainers: ["Design Intelligence Agent", "Brand Team"],
};
