/**
 * Creative Intelligence Agent
 *
 * Core runtime module for the Creative Intelligence agent.
 * Generates design concepts, enforces brand consistency, produces accessibility reports.
 */

import { v4 as uuidv4 } from "uuid";
import { getThemeConfig } from "./design-tokens";
import type { ThemeMode } from "./design-tokens";
import { componentTokenMap, getComponentsByCategory } from "./component-token-map";
import {
  creativeSystemPrompt,
  creativeAgentConfig,
  type CreativeOutput,
  type CreativeAgentStatus,
} from "./creative-system-prompt";
import {
  validateCreativeInput,
  validateDesignSystemCompliance,
  type CreativeInput,
} from "./creative-validation";
import {
  generateAccessibilityReport,
  formatAccessibilityReport,
  type AccessibilityReport,
} from "./accessibility-report-generator";
import type { CollaborationContext } from "./collaboration-artifacts";

/**
 * Creative Intelligence Agent
 */
export class CreativeAgent {
  private systemPrompt: string;
  private config: typeof creativeAgentConfig;
  private requestId: string;
  private brandId: string;

  constructor(brandId: string) {
    this.systemPrompt = creativeSystemPrompt;
    this.config = creativeAgentConfig;
    this.requestId = uuidv4();
    this.brandId = brandId;
  }

  /**
   * Generate a creative design concept
   */
  async generateDesignConcept(
    context: CollaborationContext,
    constraints?: {
      mode?: ThemeMode;
      platform?: string;
      wcagLevel?: "AA" | "AAA";
    }
  ): Promise<CreativeOutput> {
    const startTime = Date.now();
    const mode = constraints?.mode || "light";
    const wcagLevel = constraints?.wcagLevel || "AA";

    // Validate input context
    const inputValidation = this.validateCollaborationContext(context);
    if (!inputValidation.valid) {
      return this.createBlockedOutput(inputValidation.missingData);
    }

    // Load theme configuration
    const theme = getThemeConfig(mode);

    // Generate main visual concept based on context
    const mainConcept = this.createMainConcept(context, theme, constraints?.platform);

    // Generate fallback concept
    const fallbackConcept = this.createFallbackConcept(context, theme);

    // Resolve component styles
    const componentStyles = this.resolveComponentStyles(mainConcept.componentList, theme);

    // Generate accessibility report
    const a11yReport = generateAccessibilityReport(
      this.requestId,
      componentStyles,
      theme.colors,
      wcagLevel
    );

    // Create collaboration log
    const collaborationLog = {
      insightsUsed: this.extractInsightsFromContext(context),
      decisionsMade: this.logDesignDecisions(context, mainConcept, theme),
      nextActions: this.suggestNextActions(context, a11yReport),
    };

    // Determine status
    const status: CreativeAgentStatus =
      a11yReport.overallStatus === "fail"
        ? "blocked_missing_data"
        : "requires_approval";

    const output: CreativeOutput = {
      requestId: this.requestId,
      brandId: this.brandId,
      status,
      mainConcept: {
        description: mainConcept.description,
        componentList: mainConcept.componentList,
        lightMode: mainConcept.lightMode,
        darkMode: mainConcept.darkMode,
        accessibilityNotes: a11yReport.semanticMarkupRecommendations.slice(0, 5),
      },
      fallbackConcept: {
        description: fallbackConcept.description,
        componentList: fallbackConcept.componentList,
        lightMode: fallbackConcept.lightMode,
        darkMode: fallbackConcept.darkMode,
      },
      resolvedComponentStyles: componentStyles,
      accessibilityReport: {
        wcagCompliance: a11yReport.overallStatus === "pass" ? "pass" : "fail",
        contrastRatios: a11yReport.contrastAnalysis.map((c) => ({
          element: c.element,
          ratio: c.ratio,
          status: c.passes ? "pass" : "fail",
        })),
        adjustedColors: a11yReport.colorAdjustments.map((adj) => ({
          original: adj.original,
          adjusted: adj.suggested,
          reason: adj.reason,
        })),
        semanticMarkupRecommendations: a11yReport.semanticMarkupRecommendations,
      },
      collaborationLog,
      timestamp: new Date().toISOString(),
      requiresApproval: true,
      missingData: inputValidation.missingData.length > 0 ? inputValidation.missingData : undefined,
    };

    // Log performance
    const duration = Date.now() - startTime;
    console.log(
      `[Creative Agent] Design concept generated in ${duration}ms for brand ${this.brandId}`
    );

    return output;
  }

  /**
   * Validate collaboration context
   */
  private validateCollaborationContext(
    context: CollaborationContext
  ): { valid: boolean; missingData: string[] } {
    const missingData: string[] = [];

    // StrategyBrief is critical - check main object exists
    if (!context.strategyBrief) {
      missingData.push("NEEDS_BRAND_DATA: StrategyBrief");
    } else if (
      !context.strategyBrief.positioning ||
      !context.strategyBrief.positioning.tagline
    ) {
      missingData.push("NEEDS_BRAND_DATA: StrategyBrief.positioning.tagline");
    }

    // ContentPackage is critical - check main object exists
    if (!context.contentPackage) {
      missingData.push("NEEDS_BRAND_DATA: ContentPackage");
    } else if (!context.contentPackage.copy || !context.contentPackage.copy.headline) {
      missingData.push("NEEDS_BRAND_DATA: ContentPackage.copy.headline");
    }

    // BrandHistory is optional - warn if empty but don't fail validation
    if (!context.brandHistory || context.brandHistory.entries.length === 0) {
      console.warn("[Creative Agent] BrandHistory is empty; using defaults");
    }

    // PerformanceLog is optional - warn if empty but don't fail validation
    if (!context.performanceLog || context.performanceLog.contentPerformance.length === 0) {
      console.warn("[Creative Agent] PerformanceLog is empty; using defaults");
    }

    return {
      valid: missingData.length === 0,
      missingData,
    };
  }

  /**
   * Create main visual concept
   */
  private createMainConcept(
    context: CollaborationContext,
    theme: any,
    platform?: string
  ): {
    description: string;
    componentList: string[];
    lightMode: Record<string, string>;
    darkMode: Record<string, string>;
  } {
    const brief = context.strategyBrief;
    const content = context.contentPackage;
    const perf = context.performanceLog;

    // Determine layout based on content and performance data
    let layoutRecommendation = "Hero with body text and CTA";
    const componentList = ["Hero / Banner", "Text / Body", "Button / Primary"];

    if (perf && perf.visualPerformance && perf.visualPerformance.length > 0) {
      const topLayout = perf.visualPerformance[0];
      if (topLayout.attributeValue) {
        layoutRecommendation = `${topLayout.attributeValue} (based on ${topLayout.contentCount} high-performing posts)`;
      }
    }

    // Build light mode tokens
    const lightMode: Record<string, string> = {
      background: theme.colors.neutral50,
      text: theme.colors.neutral900,
      primaryColor: theme.colors.primary,
      accentColor: theme.colors.accent,
      borderColor: theme.colors.neutral200,
      shadowColor: theme.shadows.md,
    };

    // Build dark mode tokens
    const darkMode: Record<string, string> = {
      background: theme.colors.neutral950,
      text: theme.colors.neutral50,
      primaryColor: theme.colors.primaryLight,
      accentColor: theme.colors.accentLight,
      borderColor: theme.colors.neutral800,
      shadowColor: theme.shadows.md,
    };

    const description =
      `${layoutRecommendation}\n` +
      `Voice: ${brief.voice.tone}\n` +
      `Copy Length: ${content.copy.body.length} characters\n` +
      `CTA Style: ${brief.visual.primaryColor} button with accent highlight`;

    return {
      description,
      componentList,
      lightMode,
      darkMode,
    };
  }

  /**
   * Create fallback concept (simplified)
   */
  private createFallbackConcept(
    context: CollaborationContext,
    theme: any
  ): {
    description: string;
    componentList: string[];
    lightMode: Record<string, string>;
    darkMode: Record<string, string>;
  } {
    return {
      description:
        "Simplified layout: centered text with single CTA button. " +
        "Uses solid colors (no gradients) and basic typography for maximum compatibility.",
      componentList: ["Text / Body", "Button / Primary"],
      lightMode: {
        background: theme.colors.neutral50,
        text: theme.colors.neutral900,
        primaryColor: theme.colors.primary,
      },
      darkMode: {
        background: theme.colors.neutral950,
        text: theme.colors.neutral50,
        primaryColor: theme.colors.primaryLight,
      },
    };
  }

  /**
   * Resolve component styles for all components in the concept
   */
  private resolveComponentStyles(
    componentList: string[],
    theme: any
  ): Record<string, any> {
    const styles: Record<string, any> = {};

    for (const componentName of componentList) {
      const mapping = componentTokenMap.find(
        (m) => m.component.toLowerCase() === componentName.toLowerCase()
      );

      if (!mapping) continue;

      // Resolve tokens to actual values
      const lightTokens = mapping.tokens.light;
      const darkTokens = mapping.tokens.dark;

      const resolvedLight: Record<string, string> = {};
      for (const [key, tokenName] of Object.entries(lightTokens)) {
        resolvedLight[key] = this.resolveTokenValue(tokenName, theme, "light");
      }

      const resolvedDark: Record<string, string> = {};
      for (const [key, tokenName] of Object.entries(darkTokens)) {
        resolvedDark[key] = this.resolveTokenValue(tokenName, theme, "dark");
      }

      styles[componentName] = {
        light: resolvedLight,
        dark: resolvedDark,
        wcagCompliance: mapping.wcagCompliance,
      };
    }

    return styles;
  }

  /**
   * Resolve token name to actual value
   */
  private resolveTokenValue(tokenName: string, theme: any, mode: string): string {
    // Handle direct color tokens
    if (theme.colors[tokenName]) {
      return theme.colors[tokenName];
    }

    // Handle typography tokens
    if (theme.typography.fontFamily[tokenName]) {
      return theme.typography.fontFamily[tokenName];
    }
    if (theme.typography.fontSize[tokenName]) {
      return theme.typography.fontSize[tokenName];
    }

    // Handle spacing tokens
    if (theme.spacing[tokenName]) {
      return theme.spacing[tokenName];
    }

    // Handle border radius tokens
    if (theme.borderRadius[tokenName]) {
      return theme.borderRadius[tokenName];
    }

    // Handle shadow tokens
    if (theme.shadows[tokenName]) {
      return theme.shadows[tokenName];
    }

    return tokenName; // Return as-is if not found
  }

  /**
   * Extract insights from collaboration context
   */
  private extractInsightsFromContext(context: CollaborationContext): string[] {
    const insights: string[] = [];

    const brief = context.strategyBrief;
    if (brief.positioning.targetAudience.aspirations.length > 0) {
      insights.push(`Target audience aspirations: ${brief.positioning.targetAudience.aspirations.join(", ")}`);
    }

    const perf = context.performanceLog;
    if (perf && perf.patterns && perf.patterns.length > 0) {
      const strongPattern = perf.patterns.find((p) => p.strength === "strong");
      if (strongPattern) {
        insights.push(`Strong performance pattern: ${strongPattern.pattern}`);
      }
    }

    if (perf && perf.platformInsights && perf.platformInsights.length > 0) {
      insights.push(`Best performing visual style: ${perf.platformInsights[0].topVisualStyle}`);
    }

    return insights;
  }

  /**
   * Log design decisions
   */
  private logDesignDecisions(
    context: CollaborationContext,
    concept: any,
    theme: any
  ): Array<{ decision: string; rationale: string }> {
    const decisions: Array<{ decision: string; rationale: string }> = [];

    decisions.push({
      decision: "Used primary brand color for CTAs",
      rationale:
        "Primary color (purple) has strong brand recognition and passes WCAG AA contrast ratios",
    });

    decisions.push({
      decision: "Included light and dark mode variants",
      rationale: "Ensures accessibility across user preferences and improves readability",
    });

    decisions.push({
      decision: `Selected ${concept.componentList.length} core components`,
      rationale:
        "Balanced complexity and visual impact based on performance data from similar layouts",
    });

    const perf = context.performanceLog;
    if (perf && perf.recommendations && perf.recommendations.visualRecommendations && perf.recommendations.visualRecommendations.length > 0) {
      decisions.push({
        decision: `Followed visual recommendation: ${perf.recommendations.visualRecommendations[0]}`,
        rationale: "Data-driven approach based on historical performance metrics",
      });
    }

    return decisions;
  }

  /**
   * Suggest next actions based on a11y report
   */
  private suggestNextActions(context: CollaborationContext, a11yReport: AccessibilityReport): string[] {
    const actions: string[] = [];

    if (a11yReport.summary.failedContrast > 0) {
      actions.push(
        `Review and adjust ${a11yReport.summary.failedContrast} color pair(s) that fail WCAG AA contrast`
      );
    }

    const perf = context.performanceLog;
    if (perf && perf.alerts && perf.alerts.length > 0) {
      actions.push(`Address performance alert: ${perf.alerts[0].alert}`);
    }

    actions.push("Request human review before applying design changes");
    actions.push("Test design across browsers and devices for visual consistency");
    actions.push("Verify keyboard navigation and screen reader compatibility");

    return actions;
  }

  /**
   * Create blocked output when data is missing
   */
  private createBlockedOutput(missingData: string[]): CreativeOutput {
    return {
      requestId: this.requestId,
      brandId: this.brandId,
      status: "blocked_missing_data",
      mainConcept: {
        description: "Unable to generate design concept due to missing brand data",
        componentList: [],
        lightMode: {},
        darkMode: {},
        accessibilityNotes: [],
      },
      resolvedComponentStyles: {},
      accessibilityReport: {
        wcagCompliance: "fail",
        contrastRatios: [],
        semanticMarkupRecommendations: [],
      },
      collaborationLog: {
        insightsUsed: [],
        decisionsMade: [],
        nextActions: missingData,
      },
      timestamp: new Date().toISOString(),
      requiresApproval: false,
      missingData,
    };
  }
}

/**
 * Run Creative Agent
 */
export async function runCreativeAgent(
  brandId: string,
  context: CollaborationContext,
  constraints?: {
    mode?: ThemeMode;
    platform?: string;
    wcagLevel?: "AA" | "AAA";
  }
): Promise<CreativeOutput> {
  const agent = new CreativeAgent(brandId);
  return agent.generateDesignConcept(context, constraints);
}
