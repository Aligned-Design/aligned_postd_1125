/**
 * Copy Agent Test Runner
 * Run this with: npx tsx server/scripts/run-copy-tests.ts
 */

import { runCopyAgentTests } from "../__tests__/copy-agent.test";

async function main() {
  const startTime = Date.now();

  try {
    const results = await runCopyAgentTests();

    const totalDuration = Date.now() - startTime;

    console.log(`\n⏱️  Total Duration: ${totalDuration}ms\n`);

    if (results.failed === 0) {
      console.log(
        "✅ ALL COPY AGENT TESTS PASSED - Copy Intelligence ready for deployment!"
      );
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
