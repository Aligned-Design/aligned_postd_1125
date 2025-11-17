/**
 * Design Tokens for Aligned-20AI
 *
 * All component styles must consume tokens from this file.
 * No ad-hoc hex codes, spacing values, or shadow definitions allowed.
 *
 * Usage in components:
 * import { tokens } from '@/lib/tokens';
 *
 * className={`bg-[${tokens.colors.primary}] p-[${tokens.spacing.md}]`}
 */

export const tokens = {
  // ━━━━━━━━━━���━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // COLOR PALETTE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  colors: {
    // Primary Brand
    primary: "#3D0FD6",
    primaryLight: "#7C3AED",
    primaryLighter: "#A855F7",

    // Semantic
    success: "#12B76A",
    warning: "#F59E0B",
    error: "#DC2626",
    info: "#2563EB",

    // Neutrals (Light mode)
    foreground: "#111827",
    surface: "#F9FAFB",
    border: "#E5E7EB",
    subtle: "#9CA3AF",
    muted: "#6B7280",

    // Dark mode
    darkBg: "#0F172A",
    darkSurface: "#1E293B",
    darkForeground: "#F1F5F9",

    // Extended palette
    slate: {
      50: "#F8FAFC",
      100: "#F1F5F9",
      200: "#E2E8F0",
      300: "#CBD5E1",
      400: "#94A3B8",
      500: "#64748B",
      600: "#475569",
      700: "#334155",
      800: "#1E293B",
      900: "#0F172A",
    },
    gray: {
      50: "#F9FAFB",
      100: "#F3F4F6",
      200: "#E5E7EB",
      300: "#D1D5DB",
      400: "#9CA3AF",
      500: "#6B7280",
      600: "#4B5563",
      700: "#374151",
      800: "#1F2937",
      900: "#111827",
    },
    blue: {
      50: "#EFF6FF",
      100: "#DBEAFE",
      500: "#3B82F6",
      600: "#2563EB",
      700: "#1D4ED8",
    },
    green: {
      50: "#F0FDF4",
      100: "#DCFCE7",
      500: "#22C55E",
      600: "#16A34A",
      700: "#15803D",
    },
    red: {
      50: "#FEF2F2",
      100: "#FEE2E2",
      500: "#EF4444",
      600: "#DC2626",
      700: "#B91C1C",
    },
    orange: {
      50: "#FFF7ED",
      100: "#FFEDD5",
      500: "#F97316",
      600: "#EA580C",
      700: "#C2410C",
    },
    amber: {
      50: "#FFFBEB",
      100: "#FEF3C7",
      500: "#FBBF24",
      600: "#F59E0B",
      700: "#D97706",
    },
    pink: {
      400: "#F472B6",
      500: "#EC4899",
    },
    purple: {
      400: "#C084FC",
      500: "#A855F7",
    },
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SPACING SYSTEM (4px base unit)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━��━━━
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "16px",
    lg: "24px",
    xl: "32px",
    "2xl": "40px",
    "3xl": "48px",
    "4xl": "64px",
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TYPOGRAPHY
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  typography: {
    fontFamily: {
      base: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },
    fontSize: {
      h1: "32px",
      h2: "24px",
      h3: "20px",
      bodyLarge: "16px",
      body: "14px",
      bodySmall: "12px",
      label: "12px",
    },
    lineHeight: {
      tight: "1.2",
      normal: "1.5",
      relaxed: "1.75",
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      black: 900,
    },
    letterSpacing: {
      tight: "-0.02em",
      normal: "0em",
      wide: "0.02em",
    },
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // BORDER RADIUS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  borderRadius: {
    sm: "4px",
    md: "6px",
    lg: "8px",
    xl: "12px",
    "2xl": "16px",
    full: "9999px",
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SHADOWS & ELEVATION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  shadow: {
    none: "none",
    xs: "0 1px 2px rgba(0, 0, 0, 0.05)",
    sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    base: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
    md: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)",
    lg: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
    xl: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
  },

  // ━━━━━━━━��━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ANIMATIONS & TRANSITIONS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  animation: {
    easing: "cubic-bezier(0.4, 0, 0.2, 1)",
    duration: {
      quick: "150ms",
      normal: "300ms",
      slow: "500ms",
    },
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // COMPONENT-SPECIFIC TOKENS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  button: {
    paddingX: "16px",
    paddingY: "8px",
    height: "40px",
    minHeight: "40px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: 700,
    focusRing: "2px solid #3D0FD6",
  },

  input: {
    height: "40px",
    paddingX: "12px",
    paddingY: "8px",
    borderRadius: "6px",
    fontSize: "14px",
    border: "1px solid #E5E7EB",
    focusRing: "2px solid #3D0FD6",
  },

  card: {
    borderRadius: "8px",
    padding: "16px",
    border: "1px solid #E5E7EB",
    shadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
  },

  modal: {
    borderRadius: "12px",
    shadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
  },

  badge: {
    paddingX: "8px",
    paddingY: "4px",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: 600,
  },

  toast: {
    borderRadius: "8px",
    padding: "16px",
    shadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SEMANTIC UTILITY FUNCTIONS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
} as const;

/**
 * Helper: Get color by semantic status
 * Usage: getStatusColor('success') → '#12B76A'
 */
export function getStatusColor(
  status: "success" | "warning" | "error" | "info",
): string {
  return tokens.colors[status];
}

/**
 * Helper: Get spacing scale
 * Usage: getSpacing('md') → '16px'
 */
export function getSpacing(size: keyof typeof tokens.spacing): string {
  return tokens.spacing[size];
}

/**
 * Helper: Get shadow by elevation
 * Usage: getShadow('lg') → shadow value
 */
export function getShadow(level: keyof typeof tokens.shadow): string {
  return tokens.shadow[level];
}

/**
 * Helper: Merge Tailwind classes with token-based styles
 * This allows gradual migration while keeping tokens central
 */
export function mergeTokenStyles(
  baseClass: string,
  tokenOverrides?: Record<string, string>,
): string {
  return [baseClass, Object.values(tokenOverrides || {}).join(" ")]
    .filter(Boolean)
    .join(" ");
}
