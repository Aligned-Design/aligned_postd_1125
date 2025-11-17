/**
 * Accessibility Report Generator
 *
 * Generates detailed WCAG AA accessibility reports for design outputs.
 * - Contrast verification
 * - Semantic markup recommendations
 * - Color adjustment suggestions
 * - Readability analysis
 */

import type { ColorPalette } from "./design-tokens";
import { checkContrast, getContrastingTextColor } from "./design-tokens";

/**
 * Accessibility Issue Severity
 */
export type A11ySeverity = "critical" | "high" | "medium" | "low" | "info";

/**
 * Accessibility Issue
 */
export interface A11yIssue {
  severity: A11ySeverity;
  code: string;
  message: string;
  context: string;
  recommendation?: string;
  affectedElement?: string;
}

/**
 * Contrast Pair Analysis
 */
export interface ContrastAnalysis {
  foreground: string;
  background: string;
  element: string;
  ratio: number;
  passes: boolean;
  wcagLevel: "AA" | "AAA" | "failed";
}

/**
 * Accessibility Report
 */
export interface AccessibilityReport {
  requestId: string;
  timestamp: string;
  wcagLevel: "AA" | "AAA";
  overallStatus: "pass" | "fail" | "warnings";
  complianceScore: number; // 0-100
  issues: A11yIssue[];
  contrastAnalysis: ContrastAnalysis[];
  colorAdjustments: Array<{
    original: string;
    suggested: string;
    reason: string;
    ratio: number;
  }>;
  semanticMarkupRecommendations: string[];
  summary: {
    totalElements: number;
    passedContrast: number;
    failedContrast: number;
    criticalIssues: number;
    highIssues: number;
  };
}

/**
 * Calculate contrast ratio between two colors
 */
function calculateContrastRatio(foreground: string, background: string): number {
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

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Determine WCAG compliance level for a contrast ratio
 */
function getWCAGLevel(ratio: number): "AA" | "AAA" | "failed" {
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  return "failed";
}

/**
 * Suggest an alternative color with better contrast
 */
function suggestAlternativeColor(
  foreground: string,
  background: string,
  palette: ColorPalette
): { color: string; ratio: number } | null {
  // Get contrasting text color from palette
  const light = "#F9FAFB"; // neutral50
  const dark = "#030712"; // neutral950

  const lightRatio = calculateContrastRatio(light, background);
  const darkRatio = calculateContrastRatio(dark, background);

  if (lightRatio >= 4.5) {
    return { color: light, ratio: lightRatio };
  }
  if (darkRatio >= 4.5) {
    return { color: dark, ratio: darkRatio };
  }

  return null;
}

/**
 * Generate accessibility report for component styles
 */
export function generateAccessibilityReport(
  requestId: string,
  componentStyles: Record<string, any>,
  palette: ColorPalette,
  wcagLevel: "AA" | "AAA" = "AA"
): AccessibilityReport {
  const issues: A11yIssue[] = [];
  const contrastAnalysis: ContrastAnalysis[] = [];
  const colorAdjustments: Array<{ original: string; suggested: string; reason: string; ratio: number }> = [];
  const semanticMarkupRecommendations: string[] = [];

  let totalElements = 0;
  let passedContrast = 0;
  let failedContrast = 0;

  // Analyze each component's light and dark mode styles
  for (const [componentName, styleConfig] of Object.entries(componentStyles)) {
    if (!styleConfig || typeof styleConfig !== "object") continue;

    // Check light mode
    if (styleConfig.light && typeof styleConfig.light === "object") {
      const lightText = styleConfig.light.text || styleConfig.light.color;
      const lightBg = styleConfig.light.bg || styleConfig.light.background;

      if (lightText && lightBg && lightText.startsWith("#") && lightBg.startsWith("#")) {
        totalElements++;
        const ratio = calculateContrastRatio(lightText, lightBg);
        const wcagStatus = getWCAGLevel(ratio);
        const passes = wcagStatus !== "failed";

        contrastAnalysis.push({
          foreground: lightText,
          background: lightBg,
          element: `${componentName} (light)`,
          ratio: Math.round(ratio * 100) / 100,
          passes,
          wcagLevel: wcagStatus,
        });

        if (passes) {
          passedContrast++;
        } else {
          failedContrast++;
          const suggestion = suggestAlternativeColor(lightText, lightBg, palette);
          if (suggestion) {
            colorAdjustments.push({
              original: lightText,
              suggested: suggestion.color,
              reason: `Improved contrast ratio from ${Math.round(ratio * 100) / 100}:1 to ${Math.round(suggestion.ratio * 100) / 100}:1 for ${componentName} (light mode)`,
              ratio: Math.round(suggestion.ratio * 100) / 100,
            });

            issues.push({
              severity: "critical",
              code: "CONTRAST_FAILURE_LIGHT",
              message: `Component "${componentName}" (light mode) has contrast ratio ${Math.round(ratio * 100) / 100}:1, below WCAG AA minimum (4.5:1)`,
              context: `${componentName} light mode: text="${lightText}" bg="${lightBg}"`,
              recommendation: `Use "${suggestion.color}" for text to achieve ${Math.round(suggestion.ratio * 100) / 100}:1 contrast`,
              affectedElement: componentName,
            });
          }
        }
      }
    }

    // Check dark mode
    if (styleConfig.dark && typeof styleConfig.dark === "object") {
      const darkText = styleConfig.dark.text || styleConfig.dark.color;
      const darkBg = styleConfig.dark.bg || styleConfig.dark.background;

      if (darkText && darkBg && darkText.startsWith("#") && darkBg.startsWith("#")) {
        totalElements++;
        const ratio = calculateContrastRatio(darkText, darkBg);
        const wcagStatus = getWCAGLevel(ratio);
        const passes = wcagStatus !== "failed";

        contrastAnalysis.push({
          foreground: darkText,
          background: darkBg,
          element: `${componentName} (dark)`,
          ratio: Math.round(ratio * 100) / 100,
          passes,
          wcagLevel: wcagStatus,
        });

        if (passes) {
          passedContrast++;
        } else {
          failedContrast++;
          const suggestion = suggestAlternativeColor(darkText, darkBg, palette);
          if (suggestion) {
            colorAdjustments.push({
              original: darkText,
              suggested: suggestion.color,
              reason: `Improved contrast ratio from ${Math.round(ratio * 100) / 100}:1 to ${Math.round(suggestion.ratio * 100) / 100}:1 for ${componentName} (dark mode)`,
              ratio: Math.round(suggestion.ratio * 100) / 100,
            });

            issues.push({
              severity: "critical",
              code: "CONTRAST_FAILURE_DARK",
              message: `Component "${componentName}" (dark mode) has contrast ratio ${Math.round(ratio * 100) / 100}:1, below WCAG AA minimum (4.5:1)`,
              context: `${componentName} dark mode: text="${darkText}" bg="${darkBg}"`,
              recommendation: `Use "${suggestion.color}" for text to achieve ${Math.round(suggestion.ratio * 100) / 100}:1 contrast`,
              affectedElement: componentName,
            });
          }
        }
      }
    }
  }

  // Add semantic markup recommendations
  semanticMarkupRecommendations.push(
    "Use semantic HTML5 elements: <h1>, <h2>, <h3> for headings (never use <div>)",
    "Use <button> for buttons (never use <div role='button'>)",
    "Use <a> for links with href attribute",
    "Use <label> elements associated with <input> fields via 'for' attribute",
    "Use <nav> for navigation regions",
    "Use <main> for primary content region",
    "Use <article> for content snippets",
    "Use <aside> for supplementary content",
    "Use aria-label for icon-only buttons",
    "Use aria-describedby for complex interactive elements",
    "Ensure all interactive elements are keyboard accessible (tabindex, focus management)",
    "Use focus-visible for focus indicators instead of removing outline",
    "Test keyboard navigation: Tab, Shift+Tab, Enter, Space, Arrows",
    "Ensure modals trap focus and restore it on close",
    "Provide skip links for keyboard navigation"
  );

  // Calculate compliance score
  const complianceScore =
    totalElements > 0
      ? Math.round((passedContrast / totalElements) * 100)
      : 100;

  // Determine overall status
  let overallStatus: "pass" | "fail" | "warnings" = "pass";
  if (issues.length > 0) {
    overallStatus = "fail";
  } else if (colorAdjustments.length > 0) {
    overallStatus = "warnings";
  }

  const criticalIssues = issues.filter((i) => i.severity === "critical").length;
  const highIssues = issues.filter((i) => i.severity === "high").length;

  return {
    requestId,
    timestamp: new Date().toISOString(),
    wcagLevel,
    overallStatus,
    complianceScore,
    issues,
    contrastAnalysis,
    colorAdjustments,
    semanticMarkupRecommendations,
    summary: {
      totalElements,
      passedContrast,
      failedContrast,
      criticalIssues,
      highIssues,
    },
  };
}

/**
 * Format accessibility report for display
 */
export function formatAccessibilityReport(report: AccessibilityReport): string {
  const lines: string[] = [];

  lines.push("═════════════════════════════════════════════════════════════");
  lines.push("ACCESSIBILITY REPORT (WCAG AA)");
  lines.push("═════════════════════════════════════════════════════════════\n");

  lines.push(`Request ID: ${report.requestId}`);
  lines.push(`Generated: ${report.timestamp}`);
  lines.push(`WCAG Level: ${report.wcagLevel}`);
  lines.push(`Overall Status: ${report.overallStatus.toUpperCase()}`);
  lines.push(`Compliance Score: ${report.complianceScore}%\n`);

  lines.push("SUMMARY");
  lines.push("───────────────────────────────────────────────────────────");
  lines.push(`Total Elements Analyzed: ${report.summary.totalElements}`);
  lines.push(`Passed Contrast Check: ${report.summary.passedContrast}`);
  lines.push(`Failed Contrast Check: ${report.summary.failedContrast}`);
  lines.push(`Critical Issues: ${report.summary.criticalIssues}`);
  lines.push(`High Issues: ${report.summary.highIssues}\n`);

  if (report.issues.length > 0) {
    lines.push("ISSUES");
    lines.push("───────────────────────────────────────────────────────────");
    for (const issue of report.issues) {
      lines.push(`[${issue.severity.toUpperCase()}] ${issue.code}`);
      lines.push(`  ${issue.message}`);
      if (issue.recommendation) {
        lines.push(`  Recommendation: ${issue.recommendation}`);
      }
      lines.push("");
    }
  }

  if (report.colorAdjustments.length > 0) {
    lines.push("\nCOLOR ADJUSTMENTS SUGGESTED");
    lines.push("───────────────────────────────────────────────────────────");
    for (const adj of report.colorAdjustments) {
      lines.push(`${adj.original} → ${adj.suggested}`);
      lines.push(`  Reason: ${adj.reason}`);
      lines.push(`  New Contrast Ratio: ${adj.ratio}:1`);
      lines.push("");
    }
  }

  lines.push("\nCONTRAST ANALYSIS");
  lines.push("───────────────────────────────────────────────────────────");
  for (const analysis of report.contrastAnalysis) {
    const status = analysis.passes ? "✓ PASS" : "✗ FAIL";
    lines.push(`${status} ${analysis.element}: ${analysis.ratio}:1 (${analysis.wcagLevel})`);
  }

  lines.push("\nSEMANTIC MARKUP RECOMMENDATIONS");
  lines.push("───────────────────────────────────────────────────────────");
  for (let i = 0; i < report.semanticMarkupRecommendations.length; i++) {
    lines.push(`${i + 1}. ${report.semanticMarkupRecommendations[i]}`);
  }

  lines.push("\n═════════════════════════════════════════════════════════════");

  return lines.join("\n");
}
