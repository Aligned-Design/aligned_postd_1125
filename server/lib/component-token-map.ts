/**
 * Component-to-Token Mapping Matrix
 *
 * Defines how each component type references and applies design tokens.
 * This ensures consistency across all UI surfaces and enforces brand rules.
 */

import type { ThemeMode, ColorPalette } from "./design-tokens";

/**
 * Component style configuration - defines token usage for each component
 */
export interface ComponentTokenMapping {
  component: string;
  category: string;
  tokens: {
    light: Record<string, string | string[]>;
    dark: Record<string, string | string[]>;
  };
  wcagCompliance: "AA" | "AAA";
  notes?: string;
}

/**
 * Complete component mapping matrix
 * Each component maps to specific tokens by mode
 */
export const componentTokenMap: ComponentTokenMapping[] = [
  // ==================== BASE LAYOUT ====================
  {
    component: "Background",
    category: "base-layout",
    tokens: {
      light: {
        bg: "neutral50", // #F9FAFB
        gradientFrom: "neutral50",
        gradientTo: "neutral50",
      },
      dark: {
        bg: "neutral950", // #030712
        gradientFrom: "neutral950",
        gradientTo: "neutral950",
      },
    },
    wcagCompliance: "AA",
    notes: "Always solid, no gradients. Foundation for all other elements.",
  },

  {
    component: "Text / Body",
    category: "base-layout",
    tokens: {
      light: {
        color: "neutral900", // #111827
        fontFamily: "body",
        fontSize: "base",
        fontWeight: "normal",
        lineHeight: "normal",
      },
      dark: {
        color: "neutral50", // #F9FAFB
        fontFamily: "body",
        fontSize: "base",
        fontWeight: "normal",
        lineHeight: "normal",
      },
    },
    wcagCompliance: "AA",
    notes: "Primary text color. Must maintain 4.5:1 contrast.",
  },

  {
    component: "Heading / H1",
    category: "base-layout",
    tokens: {
      light: {
        color: "primary", // #A76CF5
        fontFamily: "heading",
        fontSize: "4xl",
        fontWeight: "bold",
        lineHeight: "tight",
      },
      dark: {
        color: "primaryLight", // #C89FFF
        fontFamily: "heading",
        fontSize: "4xl",
        fontWeight: "bold",
        lineHeight: "tight",
      },
    },
    wcagCompliance: "AA",
  },

  {
    component: "Heading / H2",
    category: "base-layout",
    tokens: {
      light: {
        color: "primary",
        fontFamily: "heading",
        fontSize: "3xl",
        fontWeight: "bold",
        lineHeight: "tight",
      },
      dark: {
        color: "primaryLight",
        fontFamily: "heading",
        fontSize: "3xl",
        fontWeight: "bold",
        lineHeight: "tight",
      },
    },
    wcagCompliance: "AA",
  },

  {
    component: "Heading / H3",
    category: "base-layout",
    tokens: {
      light: {
        color: "neutral900",
        fontFamily: "heading",
        fontSize: "2xl",
        fontWeight: "semibold",
        lineHeight: "normal",
      },
      dark: {
        color: "neutral50",
        fontFamily: "heading",
        fontSize: "2xl",
        fontWeight: "semibold",
        lineHeight: "normal",
      },
    },
    wcagCompliance: "AA",
  },

  {
    component: "Border / Divider",
    category: "base-layout",
    tokens: {
      light: {
        color: "neutral200", // #E5E7EB
        width: "1px",
      },
      dark: {
        color: "neutral800", // #1F2937
        width: "1px",
      },
    },
    wcagCompliance: "AA",
    notes: "Subtle visual separation. Minimal contrast edge.",
  },

  // ==================== INTERACTIVE COMPONENTS ====================
  {
    component: "Button / Primary",
    category: "interactive",
    tokens: {
      light: {
        bg: "primary", // #A76CF5
        text: "neutral50", // white text on purple
        border: "transparent",
        hoverBg: "primaryDark", // #8B3FD9 (10% darker)
        activeBg: "primaryDark",
        disabledBg: "neutral400", // #9CA3AF
        disabledText: "neutral50",
        borderRadius: "base",
        padding: "md lg", // vertical horizontal
      },
      dark: {
        bg: "primary", // #C89FFF in dark mode
        text: "neutral950",
        border: "transparent",
        hoverBg: "primaryLight", // lighter on dark
        activeBg: "primaryLight",
        disabledBg: "neutral700", // #374151
        disabledText: "neutral400",
        borderRadius: "base",
        padding: "md lg",
      },
    },
    wcagCompliance: "AA",
    notes: "Primary CTA. Always 4.5:1 contrast.",
  },

  {
    component: "Button / Secondary",
    category: "interactive",
    tokens: {
      light: {
        bg: "transparent",
        text: "primary",
        border: "primary",
        hoverBg: "neutral100", // #F3F4F6
        borderRadius: "base",
      },
      dark: {
        bg: "transparent",
        text: "primaryLight",
        border: "primaryLight",
        hoverBg: "neutral900", // #111827
        borderRadius: "base",
      },
    },
    wcagCompliance: "AA",
  },

  {
    component: "Link",
    category: "interactive",
    tokens: {
      light: {
        color: "accent", // #06B6D4
        textDecoration: "none",
        hoverTextDecoration: "underline",
        hoverOpacity: "0.8",
      },
      dark: {
        color: "accentLight", // #22D3EE
        textDecoration: "none",
        hoverTextDecoration: "underline",
        hoverOpacity: "0.9",
      },
    },
    wcagCompliance: "AA",
    notes: "No color shift on hover; use underline or glow instead.",
  },

  {
    component: "Input / Text Field",
    category: "interactive",
    tokens: {
      light: {
        bg: "neutral50", // #F9FAFB
        text: "neutral900",
        border: "neutral200",
        focusRing: "primary",
        placeholder: "neutral400", // #9CA3AF
        borderRadius: "base",
      },
      dark: {
        bg: "neutral900", // #111827
        text: "neutral50",
        border: "neutral800",
        focusRing: "primaryLight",
        placeholder: "neutral600", // #4B5563
        borderRadius: "base",
      },
    },
    wcagCompliance: "AA",
    notes: "Focus ring is brand primary. Minimum 2px width.",
  },

  {
    component: "Toggle / Checkbox",
    category: "interactive",
    tokens: {
      light: {
        uncheckedBg: "neutral200",
        checkedBg: "primary",
        checkmark: "neutral50",
        hoverBg: "neutral300",
      },
      dark: {
        uncheckedBg: "neutral800",
        checkedBg: "primaryLight",
        checkmark: "neutral950",
        hoverBg: "neutral700",
      },
    },
    wcagCompliance: "AA",
  },

  // ==================== SURFACES & CONTAINERS ====================
  {
    component: "Card / Panel",
    category: "surfaces",
    tokens: {
      light: {
        bg: "neutral100", // #F3F4F6
        text: "neutral900",
        border: "neutral200",
        shadow: "md",
        borderRadius: "md",
      },
      dark: {
        bg: "neutral900", // #111827
        text: "neutral50",
        border: "neutral800",
        shadow: "md", // shadow adjusts for dark mode
        borderRadius: "md",
      },
    },
    wcagCompliance: "AA",
    notes: "Elevation and containment. Shadow uses 10% text opacity.",
  },

  {
    component: "Modal / Dialog",
    category: "surfaces",
    tokens: {
      light: {
        overlayBg: "neutral950",
        overlayOpacity: "0.6",
        bg: "neutral50",
        text: "neutral900",
        borderRadius: "lg",
      },
      dark: {
        overlayBg: "neutral950",
        overlayOpacity: "0.6",
        bg: "neutral900",
        text: "neutral50",
        borderRadius: "lg",
      },
    },
    wcagCompliance: "AA",
    notes: "Overlay opacity consistent across modes.",
  },

  // ==================== FEEDBACK COMPONENTS ====================
  {
    component: "Alert / Success",
    category: "feedback",
    tokens: {
      light: {
        bg: "successLight", // #A7F3D0
        text: "neutral900",
        icon: "success", // #10B981
        border: "success",
        borderRadius: "base",
      },
      dark: {
        bg: "neutral900",
        text: "successLight",
        icon: "successLight",
        border: "success",
        borderRadius: "base",
      },
    },
    wcagCompliance: "AA",
  },

  {
    component: "Alert / Warning",
    category: "feedback",
    tokens: {
      light: {
        bg: "warningLight", // #FEF08A
        text: "neutral900",
        icon: "warning", // #F59E0B
        border: "warning",
        borderRadius: "base",
      },
      dark: {
        bg: "neutral900",
        text: "warningLight",
        icon: "warningLight",
        border: "warning",
        borderRadius: "base",
      },
    },
    wcagCompliance: "AA",
  },

  {
    component: "Alert / Error",
    category: "feedback",
    tokens: {
      light: {
        bg: "errorLight", // #FCA5A5
        text: "neutral900",
        icon: "error", // #EF4444
        border: "error",
        borderRadius: "base",
      },
      dark: {
        bg: "neutral900",
        text: "errorLight",
        icon: "errorLight",
        border: "error",
        borderRadius: "base",
      },
    },
    wcagCompliance: "AA",
  },

  {
    component: "Badge / Tag",
    category: "feedback",
    tokens: {
      light: {
        bg: "neutral200",
        text: "neutral900",
        borderRadius: "full",
      },
      dark: {
        bg: "neutral800",
        text: "neutral50",
        borderRadius: "full",
      },
    },
    wcagCompliance: "AA",
    notes: "Use semantic colors for status variants (success, error, etc).",
  },

  // ==================== NAVIGATION ====================
  {
    component: "Sidebar / Navbar",
    category: "navigation",
    tokens: {
      light: {
        bg: "neutral100",
        text: "neutral900",
        activeLinkBg: "neutral200",
        activeLink: "primary",
        inactiveLink: "neutral600",
        hoverBg: "neutral200",
      },
      dark: {
        bg: "neutral900",
        text: "neutral50",
        activeLinkBg: "neutral800",
        activeLink: "primaryLight",
        inactiveLink: "neutral400",
        hoverBg: "neutral800",
      },
    },
    wcagCompliance: "AA",
    notes: "Active link uses brand primary. Hover: elevation or glow.",
  },

  {
    component: "Breadcrumbs",
    category: "navigation",
    tokens: {
      light: {
        text: "neutral600",
        activeLink: "primary",
        separator: "neutral400",
      },
      dark: {
        text: "neutral400",
        activeLink: "primaryLight",
        separator: "neutral600",
      },
    },
    wcagCompliance: "AA",
  },

  // ==================== DATA VISUALIZATION ====================
  {
    component: "Chart / Graph",
    category: "data-viz",
    tokens: {
      light: {
        seriesPalette: ["primary", "secondary", "accent", "success", "warning"],
        axisText: "neutral600",
        gridLines: "neutral200",
      },
      dark: {
        seriesPalette: ["primaryLight", "secondaryLight", "accentLight", "success", "warning"],
        axisText: "neutral400",
        gridLines: "neutral800",
      },
    },
    wcagCompliance: "AA",
    notes: "Avoid red/green overlap. Use accessible hues.",
  },

  {
    component: "Table",
    category: "data-viz",
    tokens: {
      light: {
        headerBg: "neutral100",
        headerText: "neutral900",
        rowBg: "neutral50",
        alternateRowBg: "neutral100", // 5-8% opacity difference
        hoverBg: "neutral200",
        borderColor: "neutral200",
      },
      dark: {
        headerBg: "neutral800",
        headerText: "neutral50",
        rowBg: "neutral900",
        alternateRowBg: "neutral800",
        hoverBg: "neutral700",
        borderColor: "neutral800",
      },
    },
    wcagCompliance: "AA",
    notes: "Alternate rows use subtle opacity difference.",
  },

  // ==================== MARKETING & MEDIA ====================
  {
    component: "Hero / Banner",
    category: "marketing-media",
    tokens: {
      light: {
        overlayGradient: "primaryDark → transparent",
        text: "neutral50",
        cta: "accent",
        ctaHover: "accentLight",
      },
      dark: {
        overlayGradient: "primary → transparent",
        text: "neutral50",
        cta: "accentLight",
        ctaHover: "accent",
      },
    },
    wcagCompliance: "AA",
    notes: "Text color adapts to background contrast rule. Overlay gradients use brand accent variants only.",
  },

  {
    component: "CTA Button / Large",
    category: "marketing-media",
    tokens: {
      light: {
        bg: "accent",
        text: "neutral50",
        hoverBg: "accentLight",
        padding: "lg 2xl",
        fontSize: "lg",
      },
      dark: {
        bg: "accentLight",
        text: "neutral950",
        hoverBg: "accent",
        padding: "lg 2xl",
        fontSize: "lg",
      },
    },
    wcagCompliance: "AA",
    notes: "High visibility. Prominent placement.",
  },

  {
    component: "Icon / Illustration",
    category: "marketing-media",
    tokens: {
      light: {
        color: "primary",
        fallback: "neutral600",
      },
      dark: {
        color: "primaryLight",
        fallback: "neutral400",
      },
    },
    wcagCompliance: "AA",
    notes: "Only use brand colors or neutrals. No gradients.",
  },
];

/**
 * Get component mapping by name
 */
export function getComponentMapping(componentName: string): ComponentTokenMapping | undefined {
  return componentTokenMap.find(
    (m) => m.component.toLowerCase() === componentName.toLowerCase()
  );
}

/**
 * Get all components in a category
 */
export function getComponentsByCategory(category: string): ComponentTokenMapping[] {
  return componentTokenMap.filter((m) => m.category === category);
}

/**
 * Get all unique categories
 */
export function getAllCategories(): string[] {
  const categories = new Set(componentTokenMap.map((m) => m.category));
  return Array.from(categories).sort();
}

/**
 * Component coverage summary - for verification
 */
export const componentCoverageSummary = {
  total: componentTokenMap.length,
  byCategory: componentTokenMap.reduce(
    (acc, m) => {
      acc[m.category] = (acc[m.category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  ),
  wcagCompliance: {
    AA: componentTokenMap.filter((m) => m.wcagCompliance === "AA").length,
    AAA: componentTokenMap.filter((m) => m.wcagCompliance === "AAA").length,
  },
};
