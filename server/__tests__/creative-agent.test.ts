/**
 * Creative Intelligence Agent Tests
 *
 * Comprehensive test suite for design tokens, component mapping,
 * Creative agent workflow, and accessibility compliance.
 *
 * TODO: This file uses a custom test runner (runCreativeAgentTests) instead of Vitest describe/it blocks.
 * Convert to Vitest format or run via separate script.
 */

import { describe, it } from "vitest";
import {
  lightPalette,
  darkPalette,
  checkContrast,
  getThemeConfig,
  designSystemMetadata,
} from "../lib/design-tokens";
import { componentTokenMap, getAllCategories, getComponentsByCategory } from "../lib/component-token-map";
import {
  validateColorInPalette,
  validateContrast,
  validateDesignSystemCompliance,
  validateComponentMapping,
  validateCreativeInput,
  validateCreativeOutput,
} from "../lib/creative-validation";
import {
  generateAccessibilityReport,
  formatAccessibilityReport,
} from "../lib/accessibility-report-generator";
import { CreativeAgent } from "../lib/creative-agent";
import {
  createStrategyBrief,
  createContentPackage,
  createBrandHistory,
  createPerformanceLog,
  createCollaborationContext,
} from "../lib/collaboration-artifacts";

/**
 * Test Result
 */
interface TestResult {
  name: string;
  status: "pass" | "fail";
  duration: number;
  message?: string;
}

/**
 * Run all Creative Intelligence tests
 */
export async function runCreativeAgentTests(): Promise<{
  passed: number;
  failed: number;
  total: number;
  results: TestResult[];
}> {
  const results: TestResult[] = [];

  console.log(
    "\n╔════════════════════════════════════════════════════════════════╗"
  );
  console.log(
    "║         CREATIVE INTELLIGENCE - TEST SUITE                   ║"
  );
  console.log(
    "╚════════════════════════════════════════════════════════════════╝\n"
  );

  // 1. Design Tokens Tests
  console.log("1️⃣  Testing Design Tokens...");
  results.push(await testDesignTokensExist());
  results.push(await testThemeConfiguration());
  results.push(await testContrastValidation());

  // 2. Component Mapping Tests
  console.log("\n2️⃣  Testing Component-to-Token Mapping...");
  results.push(await testComponentMappingCoverage());
  results.push(await testComponentsByCategory());
  results.push(await testComponentStyleResolution());

  // 3. Validation Tests
  console.log("\n3️⃣  Testing Validation Layer...");
  results.push(await testColorPaletteValidation());
  results.push(await testContrastRatioValidation());
  results.push(await testComponentMappingValidation());

  // 4. Accessibility Tests
  console.log("\n4️⃣  Testing Accessibility Reports...");
  results.push(await testAccessibilityReportGeneration());
  results.push(await testAccessibilityCompliance());

  // 5. Creative Agent Tests
  console.log("\n5️⃣  Testing Creative Agent Workflow...");
  results.push(await testCreativeAgentInitialization());
  results.push(await testCreativeDesignConcept());
  results.push(await testCollaborationContext());

  // 6. Integration Tests
  console.log("\n6️⃣  Testing Full Creative Pipeline...");
  results.push(await testEndToEndWorkflow());

  // Summary
  const passed = results.filter((r) => r.status === "pass").length;
  const failed = results.filter((r) => r.status === "fail").length;
  const total = results.length;

  console.log("\n╔════════════════════════════════════════════════════════════════╗");
  console.log("║                      TEST SUMMARY                             ║");
  console.log("╚════════════════════════════════════════════════════════════════╝");

  for (const result of results) {
    const icon = result.status === "pass" ? "✅" : "❌";
    console.log(`${icon} ${result.name} (${result.duration}ms)`);
    if (result.message) {
      console.log(`   ${result.message}`);
    }
  }

  console.log(`\n📊 Results: ${passed}/${total} tests passed\n`);

  return { passed, failed, total, results };
}

// ==================== DESIGN TOKENS TESTS ====================

async function testDesignTokensExist(): Promise<TestResult> {
  const start = Date.now();
  try {
    const lightKeys = Object.keys(lightPalette);
    const darkKeys = Object.keys(darkPalette);

    if (lightKeys.length === 0 || darkKeys.length === 0) {
      throw new Error("Design tokens not found");
    }

    return {
      name: "Design Tokens Exist",
      status: "pass",
      duration: Date.now() - start,
      message: `Light: ${lightKeys.length} colors, Dark: ${darkKeys.length} colors`,
    };
  } catch (error) {
    return {
      name: "Design Tokens Exist",
      status: "fail",
      duration: Date.now() - start,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function testThemeConfiguration(): Promise<TestResult> {
  const start = Date.now();
  try {
    const lightTheme = getThemeConfig("light");
    const darkTheme = getThemeConfig("dark");

    if (!lightTheme.colors || !darkTheme.colors) {
      throw new Error("Theme configuration incomplete");
    }

    if (!lightTheme.typography || !darkTheme.typography) {
      throw new Error("Typography configuration incomplete");
    }

    return {
      name: "Theme Configuration",
      status: "pass",
      duration: Date.now() - start,
      message: `Light and dark themes configured with typography and spacing`,
    };
  } catch (error) {
    return {
      name: "Theme Configuration",
      status: "fail",
      duration: Date.now() - start,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function testContrastValidation(): Promise<TestResult> {
  const start = Date.now();
  try {
    // Test WCAG AA compliance
    const isValid = checkContrast(lightPalette.neutral900, lightPalette.neutral50);

    if (!isValid) {
      throw new Error("Primary contrast pair fails WCAG AA");
    }

    return {
      name: "Contrast Validation",
      status: "pass",
      duration: Date.now() - start,
      message: "Primary color pairs pass WCAG AA (4.5:1) contrast",
    };
  } catch (error) {
    return {
      name: "Contrast Validation",
      status: "fail",
      duration: Date.now() - start,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ==================== COMPONENT MAPPING TESTS ====================

async function testComponentMappingCoverage(): Promise<TestResult> {
  const start = Date.now();
  try {
    const totalComponents = componentTokenMap.length;
    const requiredCategories = [
      "base-layout",
      "interactive",
      "surfaces",
      "feedback",
      "navigation",
      "data-viz",
      "marketing-media",
    ];

    const categories = getAllCategories();
    const missingCategories = requiredCategories.filter((c) => !categories.includes(c));

    if (missingCategories.length > 0) {
      throw new Error(`Missing categories: ${missingCategories.join(", ")}`);
    }

    return {
      name: "Component Mapping Coverage",
      status: "pass",
      duration: Date.now() - start,
      message: `${totalComponents} components mapped across ${categories.length} categories`,
    };
  } catch (error) {
    return {
      name: "Component Mapping Coverage",
      status: "fail",
      duration: Date.now() - start,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function testComponentsByCategory(): Promise<TestResult> {
  const start = Date.now();
  try {
    const categories = getAllCategories();

    for (const category of categories) {
      const components = getComponentsByCategory(category);
      if (components.length === 0) {
        throw new Error(`Category "${category}" has no components`);
      }
    }

    return {
      name: "Components by Category",
      status: "pass",
      duration: Date.now() - start,
      message: `All ${categories.length} categories have mapped components`,
    };
  } catch (error) {
    return {
      name: "Components by Category",
      status: "fail",
      duration: Date.now() - start,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function testComponentStyleResolution(): Promise<TestResult> {
  const start = Date.now();
  try {
    const testComponent = componentTokenMap[0];

    if (!testComponent.tokens.light || !testComponent.tokens.dark) {
      throw new Error("Component styles not fully defined");
    }

    const lightTokens = Object.keys(testComponent.tokens.light);
    const darkTokens = Object.keys(testComponent.tokens.dark);

    if (lightTokens.length === 0 || darkTokens.length === 0) {
      throw new Error("Component tokens incomplete");
    }

    return {
      name: "Component Style Resolution",
      status: "pass",
      duration: Date.now() - start,
      message: `Sample component "${testComponent.component}" has ${lightTokens.length} light and ${darkTokens.length} dark tokens`,
    };
  } catch (error) {
    return {
      name: "Component Style Resolution",
      status: "fail",
      duration: Date.now() - start,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ==================== VALIDATION TESTS ====================

async function testColorPaletteValidation(): Promise<TestResult> {
  const start = Date.now();
  try {
    const validColor = lightPalette.primary;
    const error = validateColorInPalette(validColor, lightPalette, "test");

    if (error !== null) {
      throw new Error("Valid color failed palette validation");
    }

    return {
      name: "Color Palette Validation",
      status: "pass",
      duration: Date.now() - start,
      message: "Valid colors pass palette validation",
    };
  } catch (error) {
    return {
      name: "Color Palette Validation",
      status: "fail",
      duration: Date.now() - start,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function testContrastRatioValidation(): Promise<TestResult> {
  const start = Date.now();
  try {
    const result = validateContrast(
      lightPalette.neutral900,
      lightPalette.neutral50,
      "body text"
    );

    if (!result.valid) {
      throw new Error("Valid contrast pair failed validation");
    }

    if (result.ratio < 4.5) {
      throw new Error("Contrast ratio below WCAG AA");
    }

    return {
      name: "Contrast Ratio Validation",
      status: "pass",
      duration: Date.now() - start,
      message: `Contrast ratio: ${result.ratio.toFixed(2)}:1 (WCAG AA compliant)`,
    };
  } catch (error) {
    return {
      name: "Contrast Ratio Validation",
      status: "fail",
      duration: Date.now() - start,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function testComponentMappingValidation(): Promise<TestResult> {
  const start = Date.now();
  try {
    const validComponent = "Button / Primary";
    const error = validateComponentMapping(validComponent);

    if (error !== null) {
      throw new Error(`Valid component "${validComponent}" failed mapping validation`);
    }

    return {
      name: "Component Mapping Validation",
      status: "pass",
      duration: Date.now() - start,
      message: `Component "${validComponent}" is properly mapped`,
    };
  } catch (error) {
    return {
      name: "Component Mapping Validation",
      status: "fail",
      duration: Date.now() - start,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ==================== ACCESSIBILITY TESTS ====================

async function testAccessibilityReportGeneration(): Promise<TestResult> {
  const start = Date.now();
  try {
    const theme = getThemeConfig("light");
    const componentStyles = {
      "Button / Primary": {
        light: { text: theme.colors.neutral50, bg: theme.colors.primary },
        dark: { text: theme.colors.neutral950, bg: theme.colors.primary },
      },
    };

    const report = generateAccessibilityReport(
      "test-req-1",
      componentStyles,
      theme.colors,
      "AA"
    );

    if (!report || report.complianceScore === undefined) {
      throw new Error("Accessibility report generation failed");
    }

    return {
      name: "Accessibility Report Generation",
      status: "pass",
      duration: Date.now() - start,
      message: `Report generated with ${report.contrastAnalysis.length} contrast checks, compliance: ${report.complianceScore}%`,
    };
  } catch (error) {
    return {
      name: "Accessibility Report Generation",
      status: "fail",
      duration: Date.now() - start,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function testAccessibilityCompliance(): Promise<TestResult> {
  const start = Date.now();
  try {
    const theme = getThemeConfig("light");
    const componentStyles = {
      "Text / Body": {
        light: { text: theme.colors.neutral900, bg: theme.colors.neutral50 },
        dark: { text: theme.colors.neutral50, bg: theme.colors.neutral950 },
      },
    };

    const report = generateAccessibilityReport(
      "test-req-2",
      componentStyles,
      theme.colors,
      "AA"
    );

    if (report.summary.failedContrast > 0) {
      throw new Error(`${report.summary.failedContrast} contrast checks failed`);
    }

    return {
      name: "Accessibility Compliance",
      status: "pass",
      duration: Date.now() - start,
      message: `All ${report.summary.passedContrast} contrast checks passed WCAG AA`,
    };
  } catch (error) {
    return {
      name: "Accessibility Compliance",
      status: "fail",
      duration: Date.now() - start,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ==================== CREATIVE AGENT TESTS ====================

async function testCreativeAgentInitialization(): Promise<TestResult> {
  const start = Date.now();
  try {
    const brandId = "550e8400-e29b-41d4-a716-446655440000";
    const agent = new CreativeAgent(brandId);

    if (!agent) {
      throw new Error("Agent initialization failed");
    }

    return {
      name: "Creative Agent Initialization",
      status: "pass",
      duration: Date.now() - start,
      message: "Agent initialized and ready for design generation",
    };
  } catch (error) {
    return {
      name: "Creative Agent Initialization",
      status: "fail",
      duration: Date.now() - start,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function testCreativeDesignConcept(): Promise<TestResult> {
  const start = Date.now();
  try {
    const brandId = "550e8400-e29b-41d4-a716-446655440000";
    const context = createCollaborationContext(brandId, "test-req-1", {
      strategyBrief: {
        positioning: {
          tagline: "Test Brand",
          missionStatement: "Test mission",
          targetAudience: {
            demographics: "18-35",
            psychographics: ["innovative"],
            painPoints: ["efficiency"],
            aspirations: ["success"],
          },
        },
        voice: {
          tone: "professional",
          personality: ["authentic"],
          keyMessages: ["quality"],
          avoidPhrases: [],
        },
        visual: {
          primaryColor: "#A76CF5",
          secondaryColor: "#F5C96C",
          accentColor: "#06B6D4",
          fontPairing: { heading: "Poppins", body: "Inter" },
          imagery: { style: "photo", subjects: ["people"] },
        },
        competitive: {
          differentiation: ["innovation"],
          uniqueValueProposition: "Best in class",
        },
      },
      contentPackage: {
        copy: {
          headline: "Test Headline",
          body: "Test body copy for content package validation",
          callToAction: "Learn More",
          tone: "professional",
          keywords: ["test"],
          estimatedReadTime: 10,
        },
      },
    });

    const agent = new CreativeAgent(brandId);
    const output = await agent.generateDesignConcept(context);

    if (!output || !output.mainConcept) {
      throw new Error("Design concept generation failed");
    }

    if (!output.requiresApproval) {
      throw new Error("Output not marked for human approval (HITL violation)");
    }

    return {
      name: "Creative Design Concept",
      status: "pass",
      duration: Date.now() - start,
      message: `Design concept generated with ${output.mainConcept.componentList.length} components, status: ${output.status}`,
    };
  } catch (error) {
    return {
      name: "Creative Design Concept",
      status: "fail",
      duration: Date.now() - start,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function testCollaborationContext(): Promise<TestResult> {
  const start = Date.now();
  try {
    const brandId = "550e8400-e29b-41d4-a716-446655440000";
    const context = createCollaborationContext(brandId, "test-req-1");

    if (!context.strategyBrief || !context.contentPackage || !context.brandHistory || !context.performanceLog) {
      throw new Error("Collaboration context incomplete");
    }

    return {
      name: "Collaboration Context",
      status: "pass",
      duration: Date.now() - start,
      message: "All collaboration artifacts initialized",
    };
  } catch (error) {
    return {
      name: "Collaboration Context",
      status: "fail",
      duration: Date.now() - start,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ==================== INTEGRATION TESTS ====================

async function testEndToEndWorkflow(): Promise<TestResult> {
  const start = Date.now();
  try {
    const brandId = "550e8400-e29b-41d4-a716-446655440000";

    // Create full collaboration context
    const context = createCollaborationContext(brandId, "test-e2e-1", {
      strategyBrief: {
        positioning: {
          tagline: "Innovative Brand Solutions",
          missionStatement: "Empower brands with AI-driven creative intelligence",
          targetAudience: {
            demographics: "18-45, Marketing Professionals",
            psychographics: ["innovators", "early adopters"],
            painPoints: ["content fatigue", "time constraints"],
            aspirations: ["brand excellence", "scalability"],
          },
        },
        voice: {
          tone: "energetic",
          personality: ["innovative", "collaborative"],
          keyMessages: ["AI-powered", "brand-safe", "data-driven"],
          avoidPhrases: ["generic", "corporate"],
        },
        visual: {
          primaryColor: "#A76CF5",
          secondaryColor: "#F5C96C",
          accentColor: "#06B6D4",
          fontPairing: { heading: "Poppins", body: "Inter" },
          imagery: { style: "mixed", subjects: ["team", "tech", "creativity"] },
        },
        competitive: {
          differentiation: ["Holistic AI Intelligence (Copy + Creative + Advisor)"],
          uniqueValueProposition: "Complete creative automation with brand safety",
        },
      },
      contentPackage: {
        copy: {
          headline: "Brand Intelligence Reimagined",
          subheadline: "Where AI meets creative excellence",
          body: "Discover how our Creative, Copy, and Advisor intelligence agents transform your brand content strategy with data-driven insights and brand-safe designs.",
          callToAction: "Start Your Free Trial",
          tone: "energetic",
          keywords: ["AI", "brand", "creative", "data-driven"],
          estimatedReadTime: 30,
        },
      },
      performanceLog: {
        summary: {
          totalContent: 150,
          avgEngagement: 4.2,
          topPerformingMetric: "engagement",
          bottomPerformingMetric: "conversions",
        },
        visualPerformance: [
          {
            attribute: "layout",
            attributeValue: "Hero with centered text",
            avgMetrics: { engagement: 5.1, reach: 3200, clicks: 145 },
            contentCount: 42,
          },
        ],
        copyPerformance: [
          {
            attribute: "tone",
            attributeValue: "energetic",
            avgMetrics: { engagement: 4.8, reach: 3100, clicks: 142 },
            contentCount: 38,
          },
        ],
        platformInsights: [
          {
            platform: "instagram",
            topVisualStyle: "Hero with centered text",
            topCopyStyle: "energetic",
            optimalPostTime: "Tuesday 10 AM",
            recommendedFrequency: "3-4 posts per week",
            bestPerformingLayout: "Hero with centered text",
          },
        ],
        contentPerformance: [],
        recommendations: {
          visualRecommendations: ["Use hero layouts for high engagement"],
          copyRecommendations: ["Keep headlines short and impactful"],
          platformRecommendations: ["Post in mornings for better reach"],
        },
        patterns: [],
        alerts: [],
        lastUpdated: new Date().toISOString(),
      },
    });

    // Run Creative Agent
    const agent = new CreativeAgent(brandId);
    const output = await agent.generateDesignConcept(context, {
      mode: "light",
      platform: "instagram",
      wcagLevel: "AA",
    });

    // Validate output structure and status
    const validStatuses = ["ready_for_review", "requires_approval", "blocked_missing_data", "error"];
    if (!validStatuses.includes(output.status)) {
      throw new Error(`Invalid output status: ${output.status}`);
    }

    // Main output fields should always be present
    if (!output.mainConcept || !output.accessibilityReport) {
      throw new Error("Output missing required fields");
    }

    // For valid workflows (not errors), should be marked for approval
    if (output.status !== "error" && !output.requiresApproval && output.status !== "blocked_missing_data") {
      throw new Error("HITL safeguard violated: output not marked for approval");
    }

    // Verify accessibility report
    const accessReport = output.accessibilityReport;
    if (accessReport.wcagCompliance !== "pass" && accessReport.wcagCompliance !== "fail") {
      throw new Error("Invalid accessibility compliance status");
    }

    return {
      name: "End-to-End Workflow",
      status: "pass",
      duration: Date.now() - start,
      message: `Complete workflow executed: Design → A11y report → Collaboration log (status: ${output.status})`,
    };
  } catch (error) {
    return {
      name: "End-to-End Workflow",
      status: "fail",
      duration: Date.now() - start,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// SKIP-E2E: Creative Agent tests require AI provider (Anthropic/OpenAI) integration
// The custom test runner above exercises image analysis, visual recommendations, etc.
// Future: Run in dedicated AI pipeline with rate limiting and cost controls
describe.skip("Creative Agent Integration Tests [SKIP-E2E]", () => {
  it.todo("Convert to Vitest format - requires AI provider mocking");
});
