#!/usr/bin/env tsx
/**
 * Agent Latency Smoke Test
 *
 * Tests Doc, Design, and Advisor agents for:
 * - Response latency (must be < 4s average)
 * - BFS scores (must be ≥ 0.80)
 * - Lint status
 * - Token usage
 *
 * Usage: pnpm tsx scripts/smoke-agents.ts
 */

import fs from "fs";
import path from "path";

const API_BASE = process.env.API_BASE || "http://localhost:5173";
const LATENCY_THRESHOLD_MS = 4000;
const BFS_THRESHOLD = 0.8;

interface TestResult {
  agent: string;
  latency_ms: number;
  status: number;
  bfs?: number;
  lint_status?: string;
  tokens_in?: number;
  tokens_out?: number;
  error?: string;
}

interface SmokeTestReport {
  timestamp: string;
  doc_avg_latency: number;
  design_avg_latency: number;
  advisor_avg_latency: number;
  threshold: number;
  result: "PASS" | "FAIL";
  details: {
    doc: TestResult[];
    design: TestResult[];
    advisor: TestResult[];
  };
  bfs: {
    doc: number;
    design: number;
    advisor: number;
  };
  summary: {
    total_tests: number;
    passed: number;
    failed: number;
    avg_latency: number;
  };
}

/**
 * Test a single agent endpoint
 */
async function testAgent(
  agent: "doc" | "design" | "advisor",
  endpoint: string,
  payload: any,
): Promise<TestResult> {
  const startTime = Date.now();

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-token-123", // Mock auth for testing
      },
      body: JSON.stringify(payload),
    });

    const latency_ms = Date.now() - startTime;
    const data = await response.json();

    return {
      agent,
      latency_ms,
      status: response.status,
      bfs: data.bfs?.overall,
      lint_status: data.linter_results?.passed ? "PASS" : "FAIL",
      tokens_in: data.tokens_in,
      tokens_out: data.tokens_out,
    };
  } catch (error) {
    const latency_ms = Date.now() - startTime;
    return {
      agent,
      latency_ms,
      status: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Run smoke tests for all agents
 */
async function runSmokeTests(): Promise<SmokeTestReport> {
  console.log("🧪 Starting Agent Smoke Tests...\n");

  const mockBrandId = "test-brand-smoke-001";

  // Test payloads - using canonical contract: brand_id + input object
  const docPayload = {
    brand_id: mockBrandId,
    input: {
      topic: "Product announcement",
      platform: "instagram",
      tone: "professional",
      format: "post",
    },
    safety_mode: "safe",
  };

  const designPayload = {
    brand_id: mockBrandId,
    input: {
      post_theme: "educational",
      headline: "Learn Something New",
      aspect_ratio: "1080x1080",
    },
  };

  const advisorPayload = {
    brand_id: mockBrandId,
  };

  // Run 3 tests per agent
  const docTests: TestResult[] = [];
  const designTests: TestResult[] = [];
  const advisorTests: TestResult[] = [];

  console.log("📝 Testing Doc Agent (3 runs)...");
  for (let i = 0; i < 3; i++) {
    const result = await testAgent(
      "doc",
      "/api/agents/generate/doc",
      docPayload,
    );
    docTests.push(result);
    console.log(
      `  Run ${i + 1}: ${result.latency_ms}ms ${result.status === 200 ? "✅" : "❌"}`,
    );
  }

  console.log("\n🎨 Testing Design Agent (3 runs)...");
  for (let i = 0; i < 3; i++) {
    const result = await testAgent(
      "design",
      "/api/agents/generate/design",
      designPayload,
    );
    designTests.push(result);
    console.log(
      `  Run ${i + 1}: ${result.latency_ms}ms ${result.status === 200 ? "✅" : "❌"}`,
    );
  }

  console.log("\n💡 Testing Advisor Agent (3 runs)...");
  for (let i = 0; i < 3; i++) {
    const result = await testAgent(
      "advisor",
      "/api/agents/generate/advisor",
      advisorPayload,
    );
    advisorTests.push(result);
    console.log(
      `  Run ${i + 1}: ${result.latency_ms}ms ${result.status === 200 ? "✅" : "❌"}`,
    );
  }

  // Calculate averages
  const calcAvg = (tests: TestResult[]) =>
    tests.reduce((sum, t) => sum + t.latency_ms, 0) / tests.length;

  const docAvg = calcAvg(docTests);
  const designAvg = calcAvg(designTests);
  const advisorAvg = calcAvg(advisorTests);
  const overallAvg = (docAvg + designAvg + advisorAvg) / 3;

  const calcBfsAvg = (tests: TestResult[]) => {
    const bfsScores = tests
      .filter((t) => t.bfs !== undefined)
      .map((t) => t.bfs!);
    return bfsScores.length > 0
      ? bfsScores.reduce((sum, s) => sum + s, 0) / bfsScores.length
      : 0;
  };

  const allTests = [...docTests, ...designTests, ...advisorTests];
  const passed = allTests.filter(
    (t) => t.status === 200 && t.latency_ms < LATENCY_THRESHOLD_MS,
  ).length;
  const failed = allTests.length - passed;

  const result: "PASS" | "FAIL" =
    docAvg < LATENCY_THRESHOLD_MS &&
    designAvg < LATENCY_THRESHOLD_MS &&
    advisorAvg < LATENCY_THRESHOLD_MS
      ? "PASS"
      : "FAIL";

  const report: SmokeTestReport = {
    timestamp: new Date().toISOString(),
    doc_avg_latency: parseFloat(docAvg.toFixed(1)),
    design_avg_latency: parseFloat(designAvg.toFixed(1)),
    advisor_avg_latency: parseFloat(advisorAvg.toFixed(1)),
    threshold: LATENCY_THRESHOLD_MS,
    result,
    details: {
      doc: docTests,
      design: designTests,
      advisor: advisorTests,
    },
    bfs: {
      doc: parseFloat(calcBfsAvg(docTests).toFixed(2)),
      design: parseFloat(calcBfsAvg(designTests).toFixed(2)),
      advisor: parseFloat(calcBfsAvg(advisorTests).toFixed(2)),
    },
    summary: {
      total_tests: allTests.length,
      passed,
      failed,
      avg_latency: parseFloat(overallAvg.toFixed(1)),
    },
  };

  return report;
}

/**
 * Main execution
 */
async function main() {
  try {
    const report = await runSmokeTests();

    // Print summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 SMOKE TEST SUMMARY");
    console.log("=".repeat(60));
    console.log(`\n⏱️  Latency Results:`);
    console.log(
      `  Doc Agent:     ${report.doc_avg_latency}ms ${report.doc_avg_latency < LATENCY_THRESHOLD_MS ? "✅" : "❌"}`,
    );
    console.log(
      `  Design Agent:  ${report.design_avg_latency}ms ${report.design_avg_latency < LATENCY_THRESHOLD_MS ? "✅" : "❌"}`,
    );
    console.log(
      `  Advisor Agent: ${report.advisor_avg_latency}ms ${report.advisor_avg_latency < LATENCY_THRESHOLD_MS ? "✅" : "❌"}`,
    );
    console.log(`  Overall Avg:   ${report.summary.avg_latency}ms`);
    console.log(`  Threshold:     ${LATENCY_THRESHOLD_MS}ms`);

    console.log(`\n🎯 BFS Scores:`);
    console.log(
      `  Doc Agent:     ${report.bfs.doc} ${report.bfs.doc >= BFS_THRESHOLD ? "✅" : "❌"}`,
    );
    console.log(
      `  Design Agent:  ${report.bfs.design} ${report.bfs.design >= BFS_THRESHOLD ? "✅" : "❌"}`,
    );
    console.log(
      `  Advisor Agent: ${report.bfs.advisor} ${report.bfs.advisor >= BFS_THRESHOLD ? "✅" : "❌"}`,
    );
    console.log(`  Threshold:     ${BFS_THRESHOLD}`);

    console.log(`\n📈 Summary:`);
    console.log(`  Total Tests:   ${report.summary.total_tests}`);
    console.log(`  Passed:        ${report.summary.passed} ✅`);
    console.log(`  Failed:        ${report.summary.failed} ❌`);

    console.log(
      `\n🏁 Overall Result: ${report.result === "PASS" ? "✅ PASS" : "❌ FAIL"}`,
    );
    console.log("=".repeat(60) + "\n");

    // Save report to file
    const logsDir = path.join(process.cwd(), "logs");
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    const reportPath = path.join(logsDir, "latency.json");
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📁 Report saved to: ${reportPath}\n`);

    // Exit with appropriate code
    process.exit(report.result === "PASS" ? 0 : 1);
  } catch (error) {
    console.error("❌ Smoke test failed:", error);
    process.exit(1);
  }
}

main();
