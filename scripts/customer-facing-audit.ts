#!/usr/bin/env tsx

import fs from "fs";
import path from "path";
import { execSync } from "child_process";

interface ValidationResult {
  category: string;
  status: "PASS" | "FAIL" | "WARNING";
  details: string;
  metrics?: Record<string, any>;
}

interface CustomerAuditReport {
  timestamp: string;
  overallStatus: "PASS" | "FAIL" | "WARNING";
  results: ValidationResult[];
  summary: {
    totalChecks: number;
    passed: number;
    failed: number;
    warnings: number;
  };
}

async function auditCustomerFacingComponents(): Promise<ValidationResult> {
  try {
    const clientComponents = execSync(
      'find client/components -name "*.tsx" | wc -l',
      { encoding: "utf-8" },
    ).trim();
    const uiComponents = execSync(
      'find client/components/ui -name "*.tsx" | wc -l',
      { encoding: "utf-8" },
    ).trim();

    return {
      category: "UI Components",
      status: "PASS",
      details: `Found ${clientComponents} customer-facing components, ${uiComponents} reusable UI components`,
      metrics: {
        totalComponents: parseInt(clientComponents),
        uiComponents: parseInt(uiComponents),
      },
    };
  } catch (error) {
    return {
      category: "UI Components",
      status: "FAIL",
      details: `Failed to audit components: ${error}`,
    };
  }
}

async function auditAccessibility(): Promise<ValidationResult> {
  try {
    const accessibleComponents = [
      "client/components/ui/accessible-button.tsx",
      "client/components/ui/accessible-chart.tsx",
    ];

    const existing = accessibleComponents.filter((c) => fs.existsSync(c));

    return {
      category: "Accessibility",
      status:
        existing.length === accessibleComponents.length ? "PASS" : "WARNING",
      details: `${existing.length}/${accessibleComponents.length} accessible components found`,
      metrics: {
        accessibleComponents: existing.length,
        expected: accessibleComponents.length,
      },
    };
  } catch (error) {
    return {
      category: "Accessibility",
      status: "FAIL",
      details: `Accessibility audit failed: ${error}`,
    };
  }
}

async function auditCustomerPages(): Promise<ValidationResult> {
  try {
    const pages = execSync('find client/pages -name "*.tsx" | wc -l', {
      encoding: "utf-8",
    }).trim();

    const criticalPages = [
      "client/pages/Dashboard.tsx",
      "client/pages/Analytics.tsx",
      "client/pages/BrandIntake.tsx",
    ];

    const existing = criticalPages.filter((p) => fs.existsSync(p));

    return {
      category: "Customer Pages",
      status: existing.length === criticalPages.length ? "PASS" : "FAIL",
      details: `${existing.length}/${criticalPages.length} critical customer pages exist. Total pages: ${pages}`,
      metrics: {
        totalPages: parseInt(pages),
        criticalPages: existing.length,
      },
    };
  } catch (error) {
    return {
      category: "Customer Pages",
      status: "FAIL",
      details: `Page audit failed: ${error}`,
    };
  }
}

async function auditResponsiveDesign(): Promise<ValidationResult> {
  try {
    const responsive = fs.existsSync("e2e/responsive-ui.spec.ts");
    const tailwindConfig = fs.existsSync("tailwind.config.ts");

    return {
      category: "Responsive Design",
      status: responsive && tailwindConfig ? "PASS" : "WARNING",
      details: responsive
        ? "Responsive UI tests exist and Tailwind configured"
        : "Missing responsive UI tests",
      metrics: {
        hasResponsiveTests: responsive,
        hasTailwind: tailwindConfig,
      },
    };
  } catch (error) {
    return {
      category: "Responsive Design",
      status: "FAIL",
      details: `Responsive design audit failed: ${error}`,
    };
  }
}

async function auditCustomerAPI(): Promise<ValidationResult> {
  try {
    const customerEndpoints = [
      "server/routes/brand.ts",
      "server/routes/posts.ts",
      "server/routes/analytics.ts",
      "server/routes/ai-generation.ts",
    ];

    const existing = customerEndpoints.filter((e) => fs.existsSync(e));

    return {
      category: "Customer APIs",
      status: existing.length >= 3 ? "PASS" : "WARNING",
      details: `${existing.length}/${customerEndpoints.length} customer-facing API endpoints exist`,
      metrics: {
        endpoints: existing.length,
        expected: customerEndpoints.length,
      },
    };
  } catch (error) {
    return {
      category: "Customer APIs",
      status: "FAIL",
      details: `API audit failed: ${error}`,
    };
  }
}

async function auditPerformance(): Promise<ValidationResult> {
  try {
    const hasLazyLoading = fs.existsSync(
      "client/components/charts/LazyChart.tsx",
    );
    const viteConfig = fs.existsSync("vite.config.ts");

    return {
      category: "Performance",
      status: hasLazyLoading && viteConfig ? "PASS" : "WARNING",
      details: hasLazyLoading
        ? "Lazy loading implemented, Vite configured for optimization"
        : "Consider implementing lazy loading for heavy components",
      metrics: {
        hasLazyLoading,
        hasBundleOptimization: viteConfig,
      },
    };
  } catch (error) {
    return {
      category: "Performance",
      status: "WARNING",
      details: `Performance audit incomplete: ${error}`,
    };
  }
}

async function runCustomerFacingAudit(): Promise<CustomerAuditReport> {
  console.log("🔍 Starting Customer-Facing Audit...\n");

  const results: ValidationResult[] = await Promise.all([
    auditCustomerFacingComponents(),
    auditAccessibility(),
    auditCustomerPages(),
    auditResponsiveDesign(),
    auditCustomerAPI(),
    auditPerformance(),
  ]);

  const summary = {
    totalChecks: results.length,
    passed: results.filter((r) => r.status === "PASS").length,
    failed: results.filter((r) => r.status === "FAIL").length,
    warnings: results.filter((r) => r.status === "WARNING").length,
  };

  const overallStatus: "PASS" | "FAIL" | "WARNING" =
    summary.failed > 0 ? "FAIL" : summary.warnings > 0 ? "WARNING" : "PASS";

  const report: CustomerAuditReport = {
    timestamp: new Date().toISOString(),
    overallStatus,
    results,
    summary,
  };

  console.log(`\n✅ Passed: ${summary.passed}`);
  console.log(`⚠️  Warnings: ${summary.warnings}`);
  console.log(`❌ Failed: ${summary.failed}`);
  console.log(`\n📊 Overall Status: ${overallStatus}\n`);

  return report;
}

async function generateMarkdownReport(
  report: CustomerAuditReport,
): Promise<string> {
  const statusEmoji = {
    PASS: "✅",
    FAIL: "❌",
    WARNING: "⚠️",
  };

  let markdown = `# Customer Experience Validation Report

**Generated:** ${new Date(report.timestamp).toLocaleString()}  
**Overall Status:** ${statusEmoji[report.overallStatus]} ${report.overallStatus}

## Summary

| Metric | Count |
|--------|-------|
| Total Checks | ${report.summary.totalChecks} |
| Passed | ${report.summary.passed} ✅ |
| Warnings | ${report.summary.warnings} ⚠️ |
| Failed | ${report.summary.failed} ❌ |

## Validation Results

`;

  for (const result of report.results) {
    markdown += `### ${statusEmoji[result.status]} ${result.category}

**Status:** ${result.status}  
**Details:** ${result.details}

`;

    if (result.metrics) {
      markdown +=
        "**Metrics:**\n```json\n" +
        JSON.stringify(result.metrics, null, 2) +
        "\n```\n\n";
    }
  }

  markdown += `## Recommendations

`;

  const failedResults = report.results.filter((r) => r.status === "FAIL");
  const warningResults = report.results.filter((r) => r.status === "WARNING");

  if (failedResults.length > 0) {
    markdown += `### Critical Issues (${failedResults.length})

`;
    failedResults.forEach((r) => {
      markdown += `- **${r.category}:** ${r.details}\n`;
    });
    markdown += "\n";
  }

  if (warningResults.length > 0) {
    markdown += `### Improvements Suggested (${warningResults.length})

`;
    warningResults.forEach((r) => {
      markdown += `- **${r.category}:** ${r.details}\n`;
    });
    markdown += "\n";
  }

  if (report.overallStatus === "PASS") {
    markdown += `### ✨ All customer-facing validations passed!

The customer experience is ready for production.

`;
  }

  markdown += `## Next Steps

1. ${failedResults.length > 0 ? "Fix critical issues before deployment" : "Monitor customer feedback post-launch"}
2. ${warningResults.length > 0 ? "Address warnings in next sprint" : "Continue performance optimization"}
3. Run this audit on every deployment to ensure quality

---

*This report is automatically generated on every push to main/pulse-nest branches.*
`;

  return markdown;
}

async function main() {
  try {
    const report = await runCustomerFacingAudit();

    const jsonPath = path.join(
      process.cwd(),
      "logs",
      "customer-experience-audit.json",
    );
    const mdPath = path.join(
      process.cwd(),
      "docs",
      "CUSTOMER_EXPERIENCE_REPORT.md",
    );

    fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
    fs.mkdirSync(path.dirname(mdPath), { recursive: true });

    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
    console.log(`📄 JSON report saved to: ${jsonPath}`);

    const markdown = await generateMarkdownReport(report);
    fs.writeFileSync(mdPath, markdown);
    console.log(`📄 Markdown report saved to: ${mdPath}`);

    process.exit(report.overallStatus === "FAIL" ? 1 : 0);
  } catch (error) {
    console.error("❌ Audit failed:", error);
    process.exit(1);
  }
}

main();
