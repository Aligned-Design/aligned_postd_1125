/**
 * Creative Intelligence Validation Layer
 *
 * Validates inputs/outputs and ensures compliance with the design system.
 * - Token validation
 * - Color palette compliance
 * - WCAG AA contrast checking
 * - Component mapping validation
 */

import { z } from "zod";
import type { ColorPalette, ThemeMode } from "./design-tokens";
import { lightPalette, darkPalette, checkContrast, isColorInPalette } from "./design-tokens";
import { componentTokenMap } from "./component-token-map";

/**
 * Design System Compliance Levels
 */
export type ComplianceLevel = "error" | "warning" | "pass";

/**
 * Validation Result
 */
export interface ValidationResult {
  status: "valid" | "invalid";
  errors: ValidationError[];
  warnings: ValidationWarning[];
  summary: {
    totalChecks: number;
    passed: number;
    failed: number;
    complianceScore: number; // 0-100
  };
}

export interface ValidationError {
  code: string;
  message: string;
  context?: Record<string, unknown>;
  severity: "critical" | "high";
}

export interface ValidationWarning {
  code: string;
  message: string;
  context?: Record<string, unknown>;
  recommendation?: string;
}

/**
 * Validate that a color exists in the approved palette
 */
export function validateColorInPalette(
  color: string,
  palette: ColorPalette,
  context: string
): ValidationError | null {
  if (!isColorInPalette(color, palette)) {
    return {
      code: "INVALID_COLOR",
      message: `Color "${color}" is not in the approved brand palette (${context})`,
      context: { color, context, palette: Object.keys(palette) },
      severity: "critical",
    };
  }
  return null;
}

/**
 * Validate WCAG AA contrast ratio (4.5:1 minimum)
 */
export function validateContrast(
  foreground: string,
  background: string,
  context: string
): { valid: boolean; ratio: number; error?: ValidationError } {
  try {
    const isValid = checkContrast(foreground, background);
    // Calculate actual ratio for reporting
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
    const ratio = (lighter + 0.05) / (darker + 0.05);

    const error = !isValid
      ? {
          code: "CONTRAST_FAILURE",
          message: `Contrast ratio ${ratio.toFixed(2)}:1 fails WCAG AA (minimum 4.5:1) for "${context}"`,
          context: { foreground, background, ratio, context },
          severity: "critical" as const,
        }
      : undefined;

    return { valid: isValid, ratio, error };
  } catch (err) {
    return {
      valid: false,
      ratio: 0,
      error: {
        code: "CONTRAST_CALCULATION_ERROR",
        message: `Failed to calculate contrast ratio for "${context}"`,
        context: { foreground, background, context },
        severity: "high",
      },
    };
  }
}

/**
 * Validate component token mapping
 */
export function validateComponentMapping(componentName: string): ValidationError | null {
  const mapping = componentTokenMap.find(
    (m) => m.component.toLowerCase() === componentName.toLowerCase()
  );

  if (!mapping) {
    return {
      code: "UNMAPPED_COMPONENT",
      message: `Component "${componentName}" is not in the component token map. Add it to ensure consistent styling.`,
      context: { componentName, availableComponents: componentTokenMap.map((m) => m.component) },
      severity: "high",
    };
  }

  return null;
}

/**
 * Validate component styles object
 */
export function validateComponentStyles(
  styles: Record<string, any>,
  palette: ColorPalette
): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const [componentName, styleConfig] of Object.entries(styles)) {
    if (typeof styleConfig !== "object" || !styleConfig.light || !styleConfig.dark) {
      errors.push({
        code: "INVALID_STYLE_CONFIG",
        message: `Component "${componentName}" must have both light and dark mode styles`,
        context: { componentName, provided: Object.keys(styleConfig || {}) },
        severity: "high",
      });
      continue;
    }

    // Check light mode colors
    const lightColors = styleConfig.light;
    for (const [key, color] of Object.entries(lightColors || {})) {
      if (typeof color === "string" && color.startsWith("#")) {
        const error = validateColorInPalette(color, palette, `${componentName}.light.${key}`);
        if (error) errors.push(error);
      }
    }

    // Check dark mode colors
    const darkColors = styleConfig.dark;
    for (const [key, color] of Object.entries(darkColors || {})) {
      if (typeof color === "string" && color.startsWith("#")) {
        const error = validateColorInPalette(color, palette, `${componentName}.dark.${key}`);
        if (error) errors.push(error);
      }
    }
  }

  return errors;
}

/**
 * Comprehensive design system validation
 */
export function validateDesignSystemCompliance(input: {
  componentStyles?: Record<string, any>;
  contrastPairs?: Array<{ foreground: string; background: string; context: string }>;
  missingData?: string[];
}): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  let passedChecks = 0;
  let totalChecks = 0;

  // 1. Check for missing critical data
  if (input.missingData && input.missingData.length > 0) {
    for (const missing of input.missingData) {
      warnings.push({
        code: "MISSING_BRAND_DATA",
        message: `NEEDS_BRAND_DATA: ${missing}`,
        recommendation: `Provide the missing data and resubmit for validation.`,
      });
    }
  }

  // 2. Validate component styles if provided
  if (input.componentStyles) {
    totalChecks++;
    const styleErrors = validateComponentStyles(input.componentStyles, lightPalette);
    if (styleErrors.length === 0) {
      passedChecks++;
    } else {
      errors.push(...styleErrors);
    }
  }

  // 3. Validate contrast pairs
  if (input.contrastPairs) {
    for (const pair of input.contrastPairs) {
      totalChecks++;
      const { valid, ratio, error } = validateContrast(
        pair.foreground,
        pair.background,
        pair.context
      );

      if (valid) {
        passedChecks++;
      } else if (error) {
        errors.push(error);
      }
    }
  }

  // Default totalChecks if nothing was checked
  if (totalChecks === 0) {
    totalChecks = 1;
    passedChecks = 1; // Empty validation passes by default
  }

  const complianceScore = Math.round((passedChecks / totalChecks) * 100);

  return {
    status: errors.length === 0 ? "valid" : "invalid",
    errors,
    warnings,
    summary: {
      totalChecks,
      passed: passedChecks,
      failed: totalChecks - passedChecks,
      complianceScore,
    },
  };
}

/**
 * Zod schema for Creative Input validation
 */
export const CreativeInputSchema = z.object({
  brandId: z.string().uuid("Invalid brand_id format"),
  requestId: z.string().min(1, "requestId required"),
  type: z.enum(["layout", "component", "page", "campaign"], {
    errorMap: () => ({ message: "Invalid request type" }),
  }),
  context: z.object({
    strategyBrief: z.record(z.unknown()).optional(),
    contentPackageDraft: z.record(z.unknown()).optional(),
    performanceLog: z.record(z.unknown()).optional(),
    brandHistory: z.array(z.record(z.unknown())).optional(),
  }),
  constraints: z
    .object({
      mode: z.enum(["light", "dark", "both"]).default("both"),
      wcagLevel: z.enum(["AA", "AAA"]).default("AA"),
      platform: z
        .enum(["web", "mobile", "email", "social-media", "dashboard", "landing-page"])
        .optional(),
    })
    .optional(),
});

export type CreativeInput = z.infer<typeof CreativeInputSchema>;

/**
 * Zod schema for Creative Output validation
 */
export const CreativeOutputSchema = z.object({
  requestId: z.string(),
  brandId: z.string().uuid(),
  status: z.enum(["ready_for_review", "requires_approval", "blocked_missing_data", "error"]),
  mainConcept: z.object({
    description: z.string().min(10),
    componentList: z.array(z.string()),
    lightMode: z.record(z.string()),
    darkMode: z.record(z.string()),
    accessibilityNotes: z.array(z.string()),
  }),
  fallbackConcept: z
    .object({
      description: z.string(),
      componentList: z.array(z.string()),
      lightMode: z.record(z.string()),
      darkMode: z.record(z.string()),
    })
    .optional(),
  resolvedComponentStyles: z.record(z.any()),
  accessibilityReport: z.object({
    wcagCompliance: z.enum(["pass", "fail"]),
    contrastRatios: z.array(
      z.object({
        element: z.string(),
        ratio: z.number(),
        status: z.enum(["pass", "fail"]),
      })
    ),
    adjustedColors: z
      .array(
        z.object({
          original: z.string(),
          adjusted: z.string(),
          reason: z.string(),
        })
      )
      .optional(),
    semanticMarkupRecommendations: z.array(z.string()),
  }),
  collaborationLog: z.object({
    insightsUsed: z.array(z.string()),
    decisionsMade: z.array(
      z.object({
        decision: z.string(),
        rationale: z.string(),
      })
    ),
    nextActions: z.array(z.string()),
  }),
  timestamp: z.string().datetime(),
  requiresApproval: z.boolean(),
  missingData: z.array(z.string()).optional(),
});

export type CreativeOutput = z.infer<typeof CreativeOutputSchema>;

/**
 * Validate Creative Input
 */
export function validateCreativeInput(input: unknown): { valid: boolean; errors: string[] } {
  try {
    CreativeInputSchema.parse(input);
    return { valid: true, errors: [] };
  } catch (err) {
    if (err instanceof z.ZodError) {
      const errors = err.errors.map((e) => `${e.path.join(".")}: ${e.message}`);
      return { valid: false, errors };
    }
    return { valid: false, errors: ["Unknown validation error"] };
  }
}

/**
 * Validate Creative Output
 */
export function validateCreativeOutput(output: unknown): { valid: boolean; errors: string[] } {
  try {
    CreativeOutputSchema.parse(output);
    return { valid: true, errors: [] };
  } catch (err) {
    if (err instanceof z.ZodError) {
      const errors = err.errors.map((e) => `${e.path.join(".")}: ${e.message}`);
      return { valid: false, errors };
    }
    return { valid: false, errors: ["Unknown validation error"] };
  }
}
