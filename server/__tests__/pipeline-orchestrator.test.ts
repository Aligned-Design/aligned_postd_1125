/**
 * Pipeline Orchestrator Integration Tests
 *
 * Validates the complete Plan → Create → Review → Learn workflow
 * with synchronized agent execution and shared data passing.
 *
 * NOTE: These tests require the PipelineOrchestrator and its dependencies.
 * Run with: pnpm vitest run server/__tests__/pipeline-orchestrator.test.ts
 */

import { describe, it, expect, beforeEach } from "vitest";
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
 * Pipeline Orchestrator Tests
 * 
 * SKIP-E2E: These tests require AI providers + multi-agent coordination.
 * Run manually in AI pipeline with rate limiting and cost controls.
 * Enable by removing .skip when AI providers are configured.
 */
describe.skip("Pipeline Orchestrator Integration Tests", () => {
  let orchestrator: PipelineOrchestrator;
  let context: Partial<CollaborationContext>;

  beforeEach(() => {
    orchestrator = new PipelineOrchestrator("test_brand");
    context = createMockCollaborationContext();
  });

  describe("Phase 1 - Plan", () => {
    it("should generate StrategyBrief with positioning and voice", async () => {
      const { strategy, cycle } = await orchestrator["phase1_Plan"](context);

      expect(strategy).toBeDefined();
      expect(strategy.positioning).toBeDefined();
      expect(strategy.voice).toBeDefined();
      expect(cycle.status).toBe("creating");
      expect(cycle.metrics.planDurationMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Phase 2 - Create", () => {
    it("should initialize ContentPackage with copy and design context", async () => {
      const { strategy } = await orchestrator["phase1_Plan"](context);
      const { contentPackage, cycle } = await orchestrator["phase2_Create"](
        strategy,
        context
      );

      expect(contentPackage).toBeDefined();
      expect(contentPackage.copy).toBeDefined();
      expect(contentPackage.copy.headline).toBeDefined();
      expect(contentPackage.designContext).toBeDefined();
      expect(cycle.status).toBe("reviewing");
      expect(cycle.metrics.createDurationMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Phase 3 - Review", () => {
    it("should score content with 5D system", async () => {
      const { strategy } = await orchestrator["phase1_Plan"](context);
      const { contentPackage } = await orchestrator["phase2_Create"](
        strategy,
        context
      );
      const { reviewScores, cycle } = await orchestrator["phase3_Review"](
        contentPackage,
        strategy
      );

      expect(reviewScores).toBeDefined();
      expect(typeof reviewScores.clarity).toBe("number");
      expect(typeof reviewScores.brand_alignment).toBe("number");
      expect(typeof reviewScores.resonance).toBe("number");
      expect(typeof reviewScores.actionability).toBe("number");
      expect(typeof reviewScores.platform_fit).toBe("number");
      expect(reviewScores.average).toBeGreaterThanOrEqual(0);
      expect(reviewScores.average).toBeLessThanOrEqual(10);
      expect(cycle.status).toBe("learning");
    });
  });

  describe("Phase 4 - Learn", () => {
    it("should update BrandHistory with patterns", async () => {
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

      expect(updatedHistory).toBeDefined();
      expect(updatedHistory.entries).toBeDefined();
      expect(updatedHistory.entries.length).toBeGreaterThan(0);

      const entry = updatedHistory.entries[0];
      expect(entry.tags).toBeDefined();
      expect(entry.tags.length).toBeGreaterThan(0);
      expect(cycle.status).toBe("complete");
    });
  });

  describe("Full Pipeline Execution", () => {
    it("should execute Plan → Create → Review → Learn successfully", async () => {
      const cycle = await orchestrator.executeFullPipeline(context);

      expect(cycle.status).toBe("complete");
      expect(cycle.strategy).toBeDefined();
      expect(cycle.contentPackage).toBeDefined();
      expect(cycle.reviewScores).toBeDefined();
      expect(cycle.learnings.length).toBeGreaterThan(0);
    });

    it("should accumulate all agent actions in collaboration log", async () => {
      const cycle = await orchestrator.executeFullPipeline(context);

      expect(cycle.contentPackage).toBeDefined();
      const log = cycle.contentPackage!.collaborationLog;
      expect(log.length).toBeGreaterThan(0);

      const agents = log.map((entry) => entry.agent);
      expect(agents).toContain("copywriter");
      expect(agents).toContain("creative");
      expect(agents).toContain("advisor");
    });

    it("should propagate RequestId/CycleId through all phases", async () => {
      const cycle = await orchestrator.executeFullPipeline(context);

      expect(cycle.cycleId).toBeDefined();
      expect(cycle.requestId).toBeDefined();
      expect(cycle.contentPackage).toBeDefined();
      expect(cycle.contentPackage!.requestId).toBe(cycle.requestId);
    });
  });

  describe("Error Handling", () => {
    it("should handle missing context gracefully", async () => {
      const emptyContext: Partial<CollaborationContext> = {
        strategyBrief: undefined,
      };

      const emptyOrchestrator = new PipelineOrchestrator("test_brand");
      
      // Should either complete or fail gracefully
      const cycle = await emptyOrchestrator.executeFullPipeline(emptyContext);
      expect(["complete", "failed"]).toContain(cycle.status);
    });
  });

  describe("Design Accessibility Compliance", () => {
    it("should include accessibility compliance notes in design concepts", async () => {
      const cycle = await orchestrator.executeFullPipeline(context);

      expect(cycle.contentPackage).toBeDefined();
      expect(cycle.contentPackage!.designContext).toBeDefined();

      const notes = cycle.contentPackage!.designContext.accessibilityNotes;
      expect(notes).toBeDefined();
      expect(notes.length).toBeGreaterThan(0);
    });
  });

  describe("HITL Safeguards", () => {
    it("should mark all outputs as requiring approval (not auto-published)", async () => {
      const cycle = await orchestrator.executeFullPipeline(context);

      expect(cycle.contentPackage).toBeDefined();
      expect(cycle.contentPackage!.status).toBe("draft");

      // Verify no auto-publish actions in log
      const log = cycle.contentPackage!.collaborationLog;
      const publishActions = log.filter((e) => e.action.includes("publish"));
      expect(publishActions.length).toBe(0);
    });
  });
});
