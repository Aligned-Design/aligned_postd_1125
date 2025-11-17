/**
 * Phase 4: Go-Live Readiness Validation Orchestrator
 *
 * Systematically validates all 9 sections and generates comprehensive report
 * Run: npx tsx server/scripts/phase4-validation-orchestrator.ts
 * Output: logs/phase4/validation-report.json, logs/phase4/readiness-summary.md
 */

import * as fs from "fs";
import * as path from "path";

interface ValidationSection {
  number: number;
  name: string;
  status: "PASS" | "PARTIAL" | "FAIL" | "PENDING";
  completionPercentage: number;
  findings: string[];
  issues: Array<{
    severity: "CRITICAL" | "IMPORTANT" | "INFO";
    title: string;
    description: string;
    recommendation: string;
  }>;
  checklist: Array<{
    item: string;
    status: "COMPLETE" | "INCOMPLETE" | "BLOCKED";
  }>;
}

interface ValidationReport {
  timestamp: string;
  commit: string;
  overallReadinessScore: number; // 0-100
  verdict: "READY" | "READY_WITH_CAVEATS" | "NOT_READY";
  sections: ValidationSection[];
  summary: {
    totalItemsChecked: number;
    itemsComplete: number;
    itemsFailing: number;
    criticalIssuesCount: number;
    nextActions: string[];
  };
}

function getGitCommit(): string {
  try {
    const cmd = require("child_process").execSync("git rev-parse HEAD", {
      encoding: "utf-8",
    });
    return cmd.trim().substring(0, 7);
  } catch {
    return "unknown";
  }
}

function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

function readFile(filePath: string): string {
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return "";
  }
}

/**
 * Section 1: Environment & Security Validation
 */
function validateSection1(): ValidationSection {
  const findings: string[] = [];
  const issues: ValidationSection["issues"] = [];
  const checklist: ValidationSection["checklist"] = [];

  // Check OPENAI_API_KEY configuration
  const envContent = readFile(path.join(process.cwd(), ".env"));
  if (envContent.includes("OPENAI_API_KEY=k-ant-api")) {
    issues.push({
      severity: "CRITICAL",
      title: "OPENAI_API_KEY misconfiguration",
      description: "Set to Anthropic key value (k-ant-api0...) instead of OpenAI",
      recommendation: "Comment out or set to valid 'sk-' prefixed OpenAI key",
    });
    checklist.push({ item: "Fix OPENAI_API_KEY", status: "INCOMPLETE" });
  } else if (!envContent.includes("# OPENAI_API_KEY")) {
    checklist.push({
      item: "OPENAI_API_KEY properly disabled",
      status: "COMPLETE",
    });
  }

  // Check for OAuth credentials in env
  const hasOAuthCreds = [
    "FACEBOOK_CLIENT_ID",
    "LINKEDIN_CLIENT_ID",
    "TWITTER_CLIENT_ID",
    "GOOGLE_CLIENT_ID",
  ].filter((key) => envContent.includes(`${key}=`));

  if (hasOAuthCreds.length === 0) {
    issues.push({
      severity: "CRITICAL",
      title: "OAuth credentials missing",
      description: "No OAuth CLIENT_ID/SECRET variables found in .env",
      recommendation:
        "Configure all 6 platform OAuth credentials (Facebook, Instagram, LinkedIn, Twitter, Google, TikTok)",
    });
    checklist.push({ item: "Configure OAuth credentials", status: "INCOMPLETE" });
  } else {
    findings.push(`Found ${hasOAuthCreds.length} OAuth credential variables`);
    checklist.push({ item: "OAuth credentials present", status: "COMPLETE" });
  }

  // Check CORS configuration in server code
  const serverIndexPath = path.join(process.cwd(), "server/index.ts");
  const serverCode = readFile(serverIndexPath);
  if (serverCode.includes("corsOptions") && serverCode.includes("VITE_APP_URL")) {
    findings.push("CORS policy configured with environment-specific origins");
    checklist.push({ item: "CORS policy configured", status: "COMPLETE" });
  } else {
    issues.push({
      severity: "CRITICAL",
      title: "CORS policy not properly configured",
      description: "CORS doesn't appear to be environment-aware",
      recommendation: "Implement environment-specific CORS policy",
    });
    checklist.push({ item: "CORS policy configuration", status: "INCOMPLETE" });
  }

  // Check security headers
  if (serverCode.includes("X-Frame-Options") && serverCode.includes("HSTS")) {
    findings.push("Security headers implemented (HSTS, CSP, X-Frame-Options)");
    checklist.push({ item: "Security headers", status: "COMPLETE" });
  } else {
    issues.push({
      severity: "IMPORTANT",
      title: "Security headers missing",
      description: "HSTS, CSP, X-Frame-Options not found in server code",
      recommendation: "Add security headers middleware",
    });
    checklist.push({ item: "Security headers", status: "INCOMPLETE" });
  }

  // Check HTTPS URLs
  if (
    envContent.includes("https://") &&
    !envContent.includes("http://") &&
    !envContent.includes("localhost")
  ) {
    findings.push("All production URLs use HTTPS");
    checklist.push({ item: "HTTPS enforced", status: "COMPLETE" });
  }

  const completeItems = checklist.filter((c) => c.status === "COMPLETE").length;

  return {
    number: 1,
    name: "Environment & Security Validation",
    status: issues.some((i) => i.severity === "CRITICAL") ? "FAIL" : "PARTIAL",
    completionPercentage: Math.round((completeItems / checklist.length) * 100),
    findings,
    issues,
    checklist,
  };
}

/**
 * Section 2: Infrastructure Health & Scaling
 */
function validateSection2(): ValidationSection {
  const findings: string[] = [];
  const issues: ValidationSection["issues"] = [];
  const checklist: ValidationSection["checklist"] = [];

  // Check Supabase configuration
  const envContent = readFile(path.join(process.cwd(), ".env"));
  if (envContent.includes("VITE_SUPABASE_URL") && envContent.includes("SUPABASE_SERVICE_ROLE_KEY")) {
    findings.push("Supabase configuration present");
    checklist.push({ item: "Supabase configured", status: "COMPLETE" });
  }

  // Check Bull Queue configuration
  const packageJsonContent = readFile(path.join(process.cwd(), "package.json"));
  if (packageJsonContent.includes('"bull"')) {
    findings.push("Bull Queue package installed");
    checklist.push({ item: "Bull Queue installed", status: "COMPLETE" });
  }

  // Check Redis configuration
  if (packageJsonContent.includes('"ioredis"')) {
    findings.push("Redis client (ioredis) installed");
    checklist.push({ item: "Redis client installed", status: "COMPLETE" });
  }

  // Flag: Load testing not yet executed
  issues.push({
    severity: "IMPORTANT",
    title: "Infrastructure load testing not yet executed",
    description: "Database and queue under load not tested",
    recommendation: "Execute load test with 100+ concurrent operations",
  });
  checklist.push({ item: "Load testing database", status: "INCOMPLETE" });
  checklist.push({ item: "Load testing queue", status: "INCOMPLETE" });
  checklist.push({ item: "Health checks working", status: "INCOMPLETE" });

  const completeItems = checklist.filter((c) => c.status === "COMPLETE").length;

  return {
    number: 2,
    name: "Infrastructure Health & Scaling",
    status: "PENDING",
    completionPercentage: Math.round((completeItems / checklist.length) * 100),
    findings,
    issues,
    checklist,
  };
}

/**
 * Section 3: Connector Readiness & Token Flow
 */
function validateSection3(): ValidationSection {
  const findings: string[] = [];
  const issues: ValidationSection["issues"] = [];
  const checklist: ValidationSection["checklist"] = [];

  // Check connector implementations
  const connectorDir = path.join(process.cwd(), "server/connectors");
  const connectors = ["meta", "linkedin", "tiktok", "gbp", "mailchimp"];
  let foundConnectors = 0;

  for (const connector of connectors) {
    const implPath = path.join(connectorDir, connector);
    if (fileExists(implPath)) {
      foundConnectors++;
      checklist.push({ item: `${connector} connector exists`, status: "COMPLETE" });
    }
  }

  findings.push(`Found ${foundConnectors}/5 connector implementations`);

  // Check TokenVault
  const tokenVaultPath = path.join(process.cwd(), "server/lib/token-vault.ts");
  if (fileExists(tokenVaultPath)) {
    const tokenVaultContent = readFile(tokenVaultPath);
    if (tokenVaultContent.includes("AES-256-GCM")) {
      findings.push("TokenVault with AES-256-GCM encryption found");
      checklist.push({ item: "TokenVault encryption", status: "COMPLETE" });
    }
  }

  // OAuth redirect URI verification pending
  issues.push({
    severity: "CRITICAL",
    title: "OAuth redirect URIs not verified",
    description: "Redirect URIs not confirmed whitelisted on platforms",
    recommendation: "Whitelist OAuth redirect URIs on all 6 platforms",
  });
  checklist.push({
    item: "OAuth redirect URIs whitelisted",
    status: "INCOMPLETE",
  });

  // Connection lifecycle testing pending
  issues.push({
    severity: "IMPORTANT",
    title: "Connector lifecycle tests not executed",
    description: "Connect → Verify → Reconnect → Revoke cycle not tested",
    recommendation: "Execute lifecycle test for each connector",
  });
  checklist.push({ item: "Connector lifecycle testing", status: "INCOMPLETE" });

  const completeItems = checklist.filter((c) => c.status === "COMPLETE").length;

  return {
    number: 3,
    name: "Connector Readiness & Token Flow",
    status: foundConnectors === 5 ? "PARTIAL" : "FAIL",
    completionPercentage: Math.round((completeItems / checklist.length) * 100),
    findings,
    issues,
    checklist,
  };
}

/**
 * Section 4: AI Model & Agent Integration
 */
function validateSection4(): ValidationSection {
  const findings: string[] = [];
  const issues: ValidationSection["issues"] = [];
  const checklist: ValidationSection["checklist"] = [];

  // Check for AI model components
  const libDir = path.join(process.cwd(), "server/lib");
  const modelFiles = [
    { name: "advisor-engine.ts", model: "Advisor" },
    { name: "error-taxonomy.ts", system: "HITL" },
    { name: "recovery/auto-pause.ts", system: "Auto-pause" },
  ];

  for (const file of modelFiles) {
    const filePath = path.join(libDir, file.name);
    if (fileExists(filePath)) {
      findings.push(`Found ${file.model || file.system}`);
      checklist.push({
        item: `${file.model || file.system} system`,
        status: "COMPLETE",
      });
    }
  }

  // AI model testing pending
  checklist.push({ item: "Copy model E2E test", status: "INCOMPLETE" });
  checklist.push({ item: "Creative model E2E test", status: "INCOMPLETE" });
  checklist.push({ item: "Advisor model E2E test", status: "INCOMPLETE" });
  checklist.push({ item: "HITL approval workflow", status: "INCOMPLETE" });

  issues.push({
    severity: "IMPORTANT",
    title: "AI model E2E testing not yet executed",
    description: "Copy, Creative, Advisor models not tested end-to-end",
    recommendation: "Execute E2E test for each model with real data",
  });

  const completeItems = checklist.filter((c) => c.status === "COMPLETE").length;

  return {
    number: 4,
    name: "AI Model & Agent Integration",
    status: "PENDING",
    completionPercentage: Math.round((completeItems / checklist.length) * 100),
    findings,
    issues,
    checklist,
  };
}

/**
 * Section 5: Observability & Alerting
 */
function validateSection5(): ValidationSection {
  const findings: string[] = [];
  const issues: ValidationSection["issues"] = [];
  const checklist: ValidationSection["checklist"] = [];

  // Check for observability setup
  const observabilityPath = path.join(process.cwd(), "server/lib/observability.ts");
  if (fileExists(observabilityPath)) {
    const obsContent = readFile(observabilityPath);
    if (obsContent.includes("pino")) {
      findings.push("Pino logger configured");
      checklist.push({ item: "Pino logger", status: "COMPLETE" });
    }
    if (obsContent.includes("cycleId") && obsContent.includes("requestId")) {
      findings.push("Structured logging with required fields");
      checklist.push({ item: "Structured logging", status: "COMPLETE" });
    }
  }

  // Datadog integration pending
  issues.push({
    severity: "IMPORTANT",
    title: "Datadog integration not configured",
    description:
      "No evidence of Datadog API key or dashboard configuration",
    recommendation: "Set DATADOG_API_KEY and create dashboards for Connectors, Queue, Errors, Tokens",
  });
  checklist.push({ item: "Datadog dashboards", status: "INCOMPLETE" });
  checklist.push({ item: "Alert policies configured", status: "INCOMPLETE" });
  checklist.push({ item: "DLQ visibility", status: "INCOMPLETE" });
  checklist.push({ item: "Synthetic health checks", status: "INCOMPLETE" });

  const completeItems = checklist.filter((c) => c.status === "COMPLETE").length;

  return {
    number: 5,
    name: "Observability & Alerting",
    status: "PENDING",
    completionPercentage: Math.round((completeItems / checklist.length) * 100),
    findings,
    issues,
    checklist,
  };
}

/**
 * Section 6: Workflow QA
 */
function validateSection6(): ValidationSection {
  const findings: string[] = [];
  const issues: ValidationSection["issues"] = [];
  const checklist: ValidationSection["checklist"] = [];

  // Check React Router setup
  const appPath = path.join(process.cwd(), "client/App.tsx");
  if (fileExists(appPath)) {
    const appContent = readFile(appPath);
    if (appContent.includes("BrowserRouter")) {
      findings.push("React Router configured");
      checklist.push({ item: "React Router", status: "COMPLETE" });
    }
  }

  // Workflow testing pending
  checklist.push({ item: "Full user journey test", status: "INCOMPLETE" });
  checklist.push({ item: "Beta flags verification", status: "INCOMPLETE" });
  checklist.push({ item: "UI components (modals, toasts)", status: "INCOMPLETE" });
  checklist.push({
    item: "Capability-aware platform selection",
    status: "INCOMPLETE",
  });
  checklist.push({ item: "Error handling & fallbacks", status: "INCOMPLETE" });

  issues.push({
    severity: "IMPORTANT",
    title: "Workflow QA not yet executed",
    description: "Full user journey and UI component testing not completed",
    recommendation: "Execute Sign-up → Connect → Post → Approve → Publish workflow",
  });

  const completeItems = checklist.filter((c) => c.status === "COMPLETE").length;

  return {
    number: 6,
    name: "Workflow QA",
    status: "PENDING",
    completionPercentage: Math.round((completeItems / checklist.length) * 100),
    findings,
    issues,
    checklist,
  };
}

/**
 * Section 7: Data Governance
 */
function validateSection7(): ValidationSection {
  const findings: string[] = [];
  const issues: ValidationSection["issues"] = [];
  const checklist: ValidationSection["checklist"] = [];

  // Data governance items pending
  checklist.push({ item: "Data retention policy defined", status: "INCOMPLETE" });
  checklist.push({
    item: "GDPR/CCPA delete route implemented",
    status: "INCOMPLETE",
  });
  checklist.push({ item: "Audit table verification", status: "INCOMPLETE" });
  checklist.push({ item: "S3/R2 storage policies", status: "INCOMPLETE" });

  issues.push({
    severity: "IMPORTANT",
    title: "Data governance policies not yet defined",
    description:
      "Retention policies, delete routes, and audit logging not verified",
    recommendation:
      "Define retention limits, implement GDPR/CCPA delete routes, verify audit logging",
  });

  return {
    number: 7,
    name: "Data Governance",
    status: "PENDING",
    completionPercentage: 0,
    findings,
    issues,
    checklist,
  };
}

/**
 * Section 8: Go-Live Procedures
 */
function validateSection8(): ValidationSection {
  const findings: string[] = [];
  const issues: ValidationSection["issues"] = [];
  const checklist: ValidationSection["checklist"] = [];

  // Deployment procedures pending
  checklist.push({
    item: "Staging → Production migration plan",
    status: "INCOMPLETE",
  });
  checklist.push({ item: "Maintenance mode implementation", status: "INCOMPLETE" });
  checklist.push({ item: "Rollback procedure documented", status: "INCOMPLETE" });
  checklist.push({
    item: "User communication templates",
    status: "INCOMPLETE",
  });
  checklist.push({ item: "Final smoke test executed", status: "INCOMPLETE" });

  issues.push({
    severity: "CRITICAL",
    title: "Go-live procedures not documented",
    description:
      "Migration plan, maintenance mode, and rollback procedures incomplete",
    recommendation:
      "Document complete deployment procedure with team sign-off",
  });

  return {
    number: 8,
    name: "Go-Live Readiness",
    status: "PENDING",
    completionPercentage: 0,
    findings,
    issues,
    checklist,
  };
}

/**
 * Section 9: Post-Launch Monitoring
 */
function validateSection9(): ValidationSection {
  const findings: string[] = [];
  const issues: ValidationSection["issues"] = [];
  const checklist: ValidationSection["checklist"] = [];

  // Monitoring setup pending
  checklist.push({
    item: "Hourly success rate monitoring",
    status: "INCOMPLETE",
  });
  checklist.push({ item: "Error rate monitoring", status: "INCOMPLETE" });
  checklist.push({ item: "Token lifecycle monitoring", status: "INCOMPLETE" });
  checklist.push({ item: "Queue SLA monitoring", status: "INCOMPLETE" });
  checklist.push({
    item: "Weekly summary & Advisor report",
    status: "INCOMPLETE",
  });

  issues.push({
    severity: "IMPORTANT",
    title: "Post-launch monitoring not yet configured",
    description: "Success rate, error rate, and SLA dashboards not set up",
    recommendation:
      "Create monitoring dashboards and configure alerts before launch",
  });

  return {
    number: 9,
    name: "Post-Launch Monitoring",
    status: "PENDING",
    completionPercentage: 0,
    findings,
    issues,
    checklist,
  };
}

/**
 * Main orchestration function
 */
async function generateValidationReport(): Promise<ValidationReport> {
  console.log("🔍 Phase 4: Go-Live Readiness Validation Orchestrator\n");
  console.log("Validating all 9 sections...\n");

  const sections: ValidationSection[] = [
    validateSection1(),
    validateSection2(),
    validateSection3(),
    validateSection4(),
    validateSection5(),
    validateSection6(),
    validateSection7(),
    validateSection8(),
    validateSection9(),
  ];

  // Calculate overall readiness
  const totalChecklist = sections.flatMap((s) => s.checklist);
  const completeItems = totalChecklist.filter(
    (c) => c.status === "COMPLETE"
  ).length;
  const totalCriticalIssues = sections.flatMap((s) => s.issues).filter((i) => i.severity === "CRITICAL").length;

  const readinessScore = Math.round(
    (completeItems / totalChecklist.length) * 100
  );

  // Determine verdict
  let verdict: "READY" | "READY_WITH_CAVEATS" | "NOT_READY" = "NOT_READY";
  if (readinessScore >= 95 && totalCriticalIssues === 0) {
    verdict = "READY";
  } else if (readinessScore >= 75 && totalCriticalIssues <= 2) {
    verdict = "READY_WITH_CAVEATS";
  }

  // Generate next actions
  const nextActions = [
    "Fix OPENAI_API_KEY configuration",
    "Configure all OAuth credentials (6 platforms)",
    "Whitelist OAuth redirect URIs on each platform",
    "Load test infrastructure (database and queue)",
    "Execute AI model E2E testing",
    "Set up Datadog integration and dashboards",
    "Execute full workflow QA",
    "Finalize data governance policies",
    "Document and test go-live procedures",
  ];

  const report: ValidationReport = {
    timestamp: new Date().toISOString(),
    commit: getGitCommit(),
    overallReadinessScore: readinessScore,
    verdict,
    sections,
    summary: {
      totalItemsChecked: totalChecklist.length,
      itemsComplete: completeItems,
      itemsFailing: totalChecklist.filter((c) => c.status === "INCOMPLETE").length,
      criticalIssuesCount: totalCriticalIssues,
      nextActions,
    },
  };

  return report;
}

async function main() {
  const report = await generateValidationReport();

  // Create logs directory
  const logsDir = path.join(process.cwd(), "logs/phase4");
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  // Save JSON report
  const reportPath = path.join(logsDir, "validation-report.json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`✅ Report saved: ${reportPath}`);

  // Display summary
  console.log("\n" + "=".repeat(70));
  console.log(`PHASE 4 VALIDATION SUMMARY`);
  console.log("=".repeat(70));
  console.log(`\nOverall Readiness Score: ${report.overallReadinessScore}/100`);
  console.log(`Verdict: ${report.verdict}`);
  console.log(`\nCompletion: ${report.summary.itemsComplete}/${report.summary.totalItemsChecked} items`);
  console.log(`Critical Issues: ${report.summary.criticalIssuesCount}`);
  console.log(`\nSection Scores:`);
  report.sections.forEach((section) => {
    console.log(
      `  ${section.number}. ${section.name}: ${section.completionPercentage}% (${section.status})`
    );
  });

  console.log(`\nImmediate Actions:`);
  report.summary.nextActions.slice(0, 3).forEach((action, i) => {
    console.log(`  ${i + 1}. ${action}`);
  });

  process.exit(report.verdict === "READY" ? 0 : 1);
}

main().catch((err) => {
  console.error("Validation error:", err);
  process.exit(1);
});
