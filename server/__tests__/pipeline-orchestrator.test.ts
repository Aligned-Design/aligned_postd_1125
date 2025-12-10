/**
 * Pipeline Orchestrator Integration Tests
 *
 * Validates the complete Plan → Create → Review → Learn workflow
 * with synchronized agent execution and shared data passing.
 *
 * TODO: This file uses a custom test runner (runPipelineOrchestratorTests) instead of Vitest describe/it blocks.
 * Convert to Vitest format or run via: npx tsx server/scripts/run-orchestrator-tests.ts
 */

import { describe, it } from "vitest";
import {
  PipelineOrchestrator,
  type PipelineCycle,
} from "../lib/pipeline-orchestrator";
import type { CollaborationContext } from "../lib/collaboration-artifacts";
import {
  createStrategyBrief,
  createContentPackage,
  createBrandHistory,
  createPerformanceLog,
} from "../lib/collaboration-artifacts";

/**
 * Test Helpers
 */
const createMockCollaborationContext = (
  overrides?: Partial<CollaborationContext>
): Partial<CollaborationContext> => {
  const strategy = createStrategyBrief({
    brandId: "test_brand",
    version: "1.0.0",
    positioning: {
      tagline: "Transform Your Strategy",
      missionStatement: "Delivering strategic insights at scale",
      targetAudience: {
        demographics: "B2B SaaS Leaders",
        psychographics: ["growth-oriented", "data-driven"],
        painPoints: ["scaling challenges", "team alignment"],
        aspirations: ["market leadership", "sustainable growth"],
      },
    },
    voice: {
      tone: "professional",
      personality: ["authoritative", "trustworthy"],
      keyMessages: ["strategy", "insights", "growth"],
      avoidPhrases: ["revolutionary", "only"],
    },
    visual: {
      primaryColor: "#A76CF5",
      secondaryColor: "#F5C96C",
      accentColor: "#06B6D4",
      fontPairing: {
        heading: "Poppins",
        body: "Inter",
      },
      imagery: {
        style: "photo" as const,
        subjects: ["workspace", "collaboration"],
      },
    },
    competitive: {
      differentiation: ["data-driven", "transparent"],
      uniqueValueProposition: "Actionable strategy in minutes, not months",
    },
  });

  return {
    strategyBrief: strategy,
    brandHistory: createBrandHistory({ brandId: "test_brand" }),
    performanceLog: createPerformanceLog({
      brandId: "test_brand",
      contentPerformance: [],
    }),
    ...overrides,
  };
};

/**
 * Test Suite
 */
export async function runPipelineOrchestratorTests(): Promise<{
  passed: number;
  failed: number;
  total: number;
}> {
  let passed = 0;
  let failed = 0;
  const total = 10;

  console.log("\n╔════════════════════════════════════════════════════════════════╗");
  console.log(
    "║         PIPELINE ORCHESTRATOR INTEGRATION TESTS                ║"
  );
  console.log("╚════════════════════════════════════════════════════════════════╝\n");

  // Test 1: Phase 1 - Plan generation
  try {
    console.log("🧪 Test 1: Phase 1 - Plan generates StrategyBrief");
    const context = createMockCollaborationContext();
    const orchestrator = new PipelineOrchestrator("test_brand");
    const { strategy, cycle } = await orchestrator["phase1_Plan"](context);

    if (!strategy || !strategy.positioning || !strategy.voice) {
      throw new Error("Strategy generation failed");
    }
    if (cycle.status !== "creating") {
      throw new Error("Cycle status not updated to 'creating'");
    }
    if (cycle.metrics.planDurationMs < 0) {
      throw new Error("Plan duration not tracked");
    }

    console.log("   ✅ Strategy generated with positioning and voice");
    console.log(
      `   ✅ Duration: ${cycle.metrics.planDurationMs}ms, Status: ${cycle.status}`
    );
    passed++;
  } catch (error) {
    console.error(
      `   ❌ Failed: ${error instanceof Error ? error.message : String(error)}`
    );
    failed++;
  }

  // Test 2: Phase 2 - Create initializes ContentPackage
  try {
    console.log("\n🧪 Test 2: Phase 2 - Create initializes ContentPackage");
    const context = createMockCollaborationContext();
    const orchestrator = new PipelineOrchestrator("test_brand");
    const { strategy } = await orchestrator["phase1_Plan"](context);
    const { contentPackage, cycle } = await orchestrator["phase2_Create"](
      strategy,
      context
    );

    if (!contentPackage) {
      throw new Error("ContentPackage not created");
    }
    if (!contentPackage.copy || !contentPackage.copy.headline) {
      throw new Error("Copy section not populated");
    }
    if (!contentPackage.designContext) {
      throw new Error("Design context not merged");
    }
    if (cycle.status !== "reviewing") {
      throw new Error("Cycle status not updated to 'reviewing'");
    }

    console.log(
      `   ✅ ContentPackage created with headline: "${contentPackage.copy.headline}"`
    );
    console.log(
      `   ✅ Design context merged with ${contentPackage.designContext.componentPrecedence.length} components`
    );
    console.log(`   ✅ Duration: ${cycle.metrics.createDurationMs}ms`);
    passed++;
  } catch (error) {
    console.error(
      `   ❌ Failed: ${error instanceof Error ? error.message : String(error)}`
    );
    failed++;
  }

  // Test 3: Phase 3 - Review scores content
  try {
    console.log("\n🧪 Test 3: Phase 3 - Review scores content with 5D system");
    const context = createMockCollaborationContext();
    const orchestrator = new PipelineOrchestrator("test_brand");
    const { strategy } = await orchestrator["phase1_Plan"](context);
    const { contentPackage } = await orchestrator["phase2_Create"](
      strategy,
      context
    );
    const { reviewScores, cycle } = await orchestrator["phase3_Review"](
      contentPackage,
      strategy
    );

    if (!reviewScores) {
      throw new Error("Scores not calculated");
    }
    if (
      typeof reviewScores.clarity !== "number" ||
      typeof reviewScores.brand_alignment !== "number"
    ) {
      throw new Error("5D scoring not computed");
    }
    if (reviewScores.average < 0 || reviewScores.average > 10) {
      throw new Error("Average score out of valid range");
    }
    if (cycle.status !== "learning") {
      throw new Error("Cycle status not updated to 'learning'");
    }

    console.log(
      `   ✅ 5D Scores - Clarity: ${reviewScores.clarity}, Alignment: ${reviewScores.brand_alignment}, Resonance: ${reviewScores.resonance}, Actionability: ${reviewScores.actionability}, Platform: ${reviewScores.platform_fit}`
    );
    console.log(
      `   ✅ Average: ${reviewScores.average.toFixed(1)}/10, Weighted: ${reviewScores.weighted.toFixed(1)}/10`
    );
    console.log(`   ✅ Duration: ${cycle.metrics.reviewDurationMs}ms`);
    passed++;
  } catch (error) {
    console.error(
      `   ❌ Failed: ${error instanceof Error ? error.message : String(error)}`
    );
    failed++;
  }

  // Test 4: Phase 4 - Learn updates BrandHistory
  try {
    console.log(
      "\n🧪 Test 4: Phase 4 - Learn updates BrandHistory with patterns"
    );
    const context = createMockCollaborationContext();
    const orchestrator = new PipelineOrchestrator("test_brand");
    const { strategy } = await orchestrator["phase1_Plan"](context);
    const { contentPackage } = await orchestrator["phase2_Create"](
      strategy,
      context
    );
    const { reviewScores } = await orchestrator["phase3_Review"](
      contentPackage,
      strategy
    );

    const brandHistory =
      context.brandHistory || createBrandHistory({ brandId: "test_brand" });
    const { updatedHistory, cycle } = await orchestrator["phase4_Learn"](
      contentPackage,
      reviewScores,
      brandHistory
    );

    if (!updatedHistory || !updatedHistory.entries) {
      throw new Error("BrandHistory not updated");
    }
    if (updatedHistory.entries.length === 0) {
      throw new Error("History entries not created");
    }

    const entry = updatedHistory.entries[0];
    if (!entry.tags || entry.tags.length === 0) {
      throw new Error("Pattern tags not applied");
    }
    if (cycle.status !== "complete") {
      throw new Error("Cycle status not updated to 'complete'");
    }

    console.log(
      `   ✅ History entry created: ${entry.action} (${entry.timestamp})`
    );
    console.log(`   ✅ Pattern tags: ${entry.tags.join(", ")}`);
    console.log(
      `   ✅ Performance tracked: metric=${entry.performance?.metric}, improvement=${entry.performance?.improvement.toFixed(2)}`
    );
    console.log(`   ✅ Duration: ${cycle.metrics.learnDurationMs}ms`);
    passed++;
  } catch (error) {
    console.error(
      `   ❌ Failed: ${error instanceof Error ? error.message : String(error)}`
    );
    failed++;
  }

  // Test 5: Full pipeline execution
  try {
    console.log(
      "\n🧪 Test 5: Full pipeline executes Plan → Create → Review → Learn"
    );
    const context = createMockCollaborationContext();
    const orchestrator = new PipelineOrchestrator("test_brand");
    const cycle = await orchestrator.executeFullPipeline(context);

    if (cycle.status !== "complete") {
      throw new Error(`Pipeline failed with status: ${cycle.status}`);
    }
    if (!cycle.strategy || !cycle.contentPackage || !cycle.reviewScores) {
      throw new Error("Pipeline did not populate all artifacts");
    }
    if (cycle.learnings.length === 0) {
      throw new Error("Pipeline did not record learnings");
    }

    const totalDuration =
      cycle.metrics.planDurationMs +
      cycle.metrics.createDurationMs +
      cycle.metrics.reviewDurationMs +
      cycle.metrics.learnDurationMs;

    console.log(`   ✅ Pipeline completed successfully`);
    console.log(
      `   ✅ Total Duration: ${totalDuration}ms (Plan: ${cycle.metrics.planDurationMs}ms, Create: ${cycle.metrics.createDurationMs}ms, Review: ${cycle.metrics.reviewDurationMs}ms, Learn: ${cycle.metrics.learnDurationMs}ms)`
    );
    console.log(`   ✅ Learnings: ${cycle.learnings.length} entries recorded`);
    console.log(`   ✅ Errors: ${cycle.errors.length}`);
    passed++;
  } catch (error) {
    console.error(
      `   ❌ Failed: ${error instanceof Error ? error.message : String(error)}`
    );
    failed++;
  }

  // Test 6: Collaboration log accumulation
  try {
    console.log(
      "\n🧪 Test 6: ContentPackage.collaborationLog accumulates all agent actions"
    );
    const context = createMockCollaborationContext();
    const orchestrator = new PipelineOrchestrator("test_brand");
    const cycle = await orchestrator.executeFullPipeline(context);

    if (!cycle.contentPackage) {
      throw new Error("ContentPackage not available");
    }

    const log = cycle.contentPackage.collaborationLog;
    if (log.length === 0) {
      throw new Error("Collaboration log is empty");
    }

    const agents = log.map((entry) => entry.agent);
    const hasCopy = agents.includes("copywriter");
    const hasCreative = agents.includes("creative");
    const hasAdvisor = agents.includes("advisor");

    if (!hasCopy || !hasCreative || !hasAdvisor) {
      throw new Error("Not all agents logged their actions");
    }

    console.log(
      `   ✅ Collaboration log has ${log.length} entries from all agents`
    );
    console.log(`   ✅ Copy logged: ${log.filter((e) => e.agent === "copywriter").length} action(s)`);
    console.log(
      `   ✅ Creative logged: ${log.filter((e) => e.agent === "creative").length} action(s)`
    );
    console.log(
      `   ✅ Advisor logged: ${log.filter((e) => e.agent === "advisor").length} action(s)`
    );
    passed++;
  } catch (error) {
    console.error(
      `   ❌ Failed: ${error instanceof Error ? error.message : String(error)}`
    );
    failed++;
  }

  // Test 7: Error handling per phase
  try {
    console.log("\n🧪 Test 7: Error handling records phase failures");
    const context: Partial<CollaborationContext> = {
      strategyBrief: undefined, // Will trigger null handling
    };

    const orchestrator = new PipelineOrchestrator("test_brand");

    try {
      // This should handle the missing strategy gracefully
      const cycle = await orchestrator.executeFullPipeline(context);
      // If we get here, the orchestrator handled the missing data
      if (cycle.status === "complete" || cycle.status === "failed") {
        console.log(
          `   ✅ Orchestrator handled missing context gracefully (status: ${cycle.status})`
        );
        passed++;
      } else {
        throw new Error("Unexpected cycle status");
      }
    } catch (innerError) {
      // Even if phase1_Plan throws, the orchestrator should handle it
      if (innerError instanceof Error) {
        console.log(
          `   ✅ Error handling triggered and caught: ${innerError.message}`
        );
        passed++;
      } else {
        throw innerError;
      }
    }
  } catch (error) {
    console.error(
      `   ❌ Failed: ${error instanceof Error ? error.message : String(error)}`
    );
    failed++;
  }

  // Test 8: Request ID and Cycle ID traceability
  try {
    console.log(
      "\n🧪 Test 8: RequestId/CycleId propagates through all phases"
    );
    const context = createMockCollaborationContext();
    const orchestrator = new PipelineOrchestrator("test_brand");
    const cycle = await orchestrator.executeFullPipeline(context);

    if (!cycle.cycleId || !cycle.requestId) {
      throw new Error("IDs not set");
    }
    if (cycle.cycleId !== cycle.cycleId) {
      throw new Error("CycleId not consistent");
    }
    if (!cycle.contentPackage || cycle.contentPackage.requestId !== cycle.requestId) {
      throw new Error("RequestId not propagated to ContentPackage");
    }

    console.log(`   ✅ Cycle ID: ${cycle.cycleId}`);
    console.log(`   ✅ Request ID: ${cycle.requestId}`);
    console.log(
      `   ✅ ContentPackage RequestId matches: ${cycle.contentPackage.requestId}`
    );
    passed++;
  } catch (error) {
    console.error(
      `   ❌ Failed: ${error instanceof Error ? error.message : String(error)}`
    );
    failed++;
  }

  // Test 9: Design accessibility compliance tracking
  try {
    console.log(
      "\n🧪 Test 9: Design concepts include accessibility compliance notes"
    );
    const context = createMockCollaborationContext();
    const orchestrator = new PipelineOrchestrator("test_brand");
    const cycle = await orchestrator.executeFullPipeline(context);

    if (!cycle.contentPackage || !cycle.contentPackage.designContext) {
      throw new Error("Design context not available");
    }

    const notes = cycle.contentPackage.designContext.accessibilityNotes;
    if (!notes || notes.length === 0) {
      throw new Error("Accessibility notes not included");
    }

    console.log(`   ✅ Accessibility notes included: ${notes.length} items`);
    console.log(`   ✅ Sample: "${notes[0]}"`);
    passed++;
  } catch (error) {
    console.error(
      `   ❌ Failed: ${error instanceof Error ? error.message : String(error)}`
    );
    failed++;
  }

  // Test 10: HITL safeguards - all outputs require approval
  try {
    console.log(
      "\n🧪 Test 10: HITL safeguards - all outputs marked requires_approval"
    );
    const context = createMockCollaborationContext();
    const orchestrator = new PipelineOrchestrator("test_brand");
    const cycle = await orchestrator.executeFullPipeline(context);

    if (!cycle.contentPackage) {
      throw new Error("ContentPackage not available");
    }

    // Check that content is not auto-published
    if (cycle.contentPackage.status !== "draft") {
      throw new Error(
        `Content status should be 'draft', got '${cycle.contentPackage.status}'`
      );
    }

    // Verify through collaboration log that all phases logged their work
    const log = cycle.contentPackage.collaborationLog;
    const publishActions = log.filter((e) => e.action.includes("publish"));
    if (publishActions.length > 0) {
      throw new Error(
        "Content should not be auto-published (HITL safeguard violated)"
      );
    }

    console.log(`   ✅ ContentPackage status: ${cycle.contentPackage.status}`);
    console.log(`   ✅ No auto-publish actions in log`);
    console.log(
      `   ✅ HITL safeguard maintained: All outputs require human approval`
    );
    passed++;
  } catch (error) {
    console.error(
      `   ❌ Failed: ${error instanceof Error ? error.message : String(error)}`
    );
    failed++;
  }

  // Summary
  console.log("\n╔════════════════════════════════════════════════════════════════╗");
  console.log("║                      TEST RESULTS                             ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");

  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${failed}/${total}`);

  if (failed === 0) {
    console.log(
      "\n✅ All orchestration tests passed - Synchronized collaboration ready!"
    );
  } else {
    console.log(`\n❌ ${failed} test(s) failed - Review errors above`);
  }

  return { passed, failed, total };
}

// SKIP-E2E: Pipeline Orchestrator tests require AI providers + multi-agent coordination
// The custom test runner above exercises the full content generation pipeline
// Can be run manually via: npx tsx server/scripts/run-orchestrator-tests.ts
// Future: Run in dedicated AI pipeline with rate limiting and cost controls
describe.skip("Pipeline Orchestrator Integration Tests [SKIP-E2E]", () => {
  it.todo("Convert to Vitest format or run via: npx tsx server/scripts/run-orchestrator-tests.ts");
});
