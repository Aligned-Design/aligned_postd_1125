/**
 * Creative Intelligence Test Runner
 * Run this with: npx tsx server/scripts/run-creative-tests.ts
 */

import { runCreativeAgentTests } from "../__tests__/creative-agent.test";

async function main() {
  const startTime = Date.now();

  try {
    const results = await runCreativeAgentTests();

    const totalDuration = Date.now() - startTime;

    console.log(
      "╔════════════════════════════════════════════════════════════════╗"
    );
    console.log(
      "║                    FINAL RESULTS                              ║"
    );
    console.log(
      "╚════════════════════════════════════════════════════════════════╝"
    );

    console.log(`\n📊 Overall: ${results.passed}/${results.total} tests passed`);
    console.log(`⏱️  Total Duration: ${totalDuration}ms\n`);

    if (results.failed === 0) {
      console.log("✅ ALL TESTS PASSED - Creative Intelligence system ready for deployment!");
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
