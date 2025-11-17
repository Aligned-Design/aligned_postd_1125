/**
 * Pipeline Orchestrator Test Runner
 * Run this with: npx tsx server/scripts/run-orchestrator-tests.ts
 */

import { runPipelineOrchestratorTests } from "../__tests__/pipeline-orchestrator.test";

async function main() {
  const startTime = Date.now();

  try {
    const results = await runPipelineOrchestratorTests();

    const totalDuration = Date.now() - startTime;

    console.log(`\n⏱️  Total Duration: ${totalDuration}ms\n`);

    if (results.failed === 0) {
      console.log(
        "✅ ALL ORCHESTRATION TESTS PASSED - Pipeline ready for deployment!"
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
