/**
 * Advisor Integration Test Runner
 * Run this with: npx tsx server/scripts/run-advisor-tests.ts
 */

import { runAdvisorIntegrationTests } from "../lib/advisor-integration-tests";

async function main() {
  console.log(
    "╔════════════════════════════════════════════════════════════════╗"
  );
  console.log(
    "║         ADVISOR SYSTEM - INTEGRATION TEST SUITE              ║"
  );
  console.log(
    "╚════════════════════════════════════════════════════════════════╝"
  );

  const startTime = Date.now();

  try {
    const results = await runAdvisorIntegrationTests();

    const totalDuration = Date.now() - startTime;

    console.log(
      "\n╔════════════════════════════════════════════════════════════════╗"
    );
    console.log(
      "║                      FINAL RESULTS                            ║"
    );
    console.log(
      "╚════════════════════════════════════════════════════════════════╝"
    );

    console.log(`\n📊 Overall: ${results.passed}/${results.total} tests passed`);
    console.log(`⏱️  Total Duration: ${totalDuration}ms\n`);

    if (results.failed === 0) {
      console.log("✅ ALL TESTS PASSED - Advisor system ready for deployment!");
      process.exit(0);
    } else {
      console.log(`❌ ${results.failed} test(s) failed - Review errors above`);
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Test runner failed:", error);
    process.exit(1);
  }
}

main();
