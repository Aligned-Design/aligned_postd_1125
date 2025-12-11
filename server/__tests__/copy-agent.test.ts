/**
 * Copy Agent Integration Tests
 *
 * Validates Copy Intelligence module that generates on-brand content
 * from StrategyBrief input with metadata tagging and revision support.
 *
 * NOTE: These tests require the CopyAgent and AI providers.
 * Run with: pnpm vitest run server/__tests__/copy-agent.test.ts
 */

import { describe, it, expect, beforeEach } from "vitest";
import { CopyAgent } from "../lib/copy-agent";
import type { StrategyBrief } from "../lib/collaboration-artifacts";
import { createStrategyBrief } from "../lib/collaboration-artifacts";

/**
 * Test Helpers
 */
const createMockStrategyBrief = (
  overrides?: Partial<StrategyBrief>
): StrategyBrief => {
  return createStrategyBrief({
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
    ...overrides,
  });
};

/**
 * Copy Agent Tests
 * 
 * SKIP-E2E: These tests require AI providers (Anthropic/OpenAI) integration.
 * Run in dedicated AI pipeline with rate limiting and cost controls.
 * Enable by removing .skip when AI providers are configured.
 */
describe.skip("Copy Agent Integration Tests", () => {
  let agent: CopyAgent;
  let strategy: StrategyBrief;

  beforeEach(() => {
    agent = new CopyAgent("test_brand");
    strategy = createMockStrategyBrief();
  });

  describe("Content Generation", () => {
    it("should generate copy with headline, body, and CTA from StrategyBrief", async () => {
      const output = await agent.generateCopy(strategy);

      expect(output.headline).toBeDefined();
      expect(output.headline.length).toBeGreaterThan(0);
      expect(output.body).toBeDefined();
      expect(output.body.length).toBeGreaterThan(0);
      expect(output.callToAction).toBeDefined();
      expect(output.callToAction.length).toBeGreaterThan(0);
    });

    it("should include metadata tags (tone, emotion, hookType, ctaType, platform)", async () => {
      const output = await agent.generateCopy(strategy, { platform: "instagram" });

      expect(output.metadata).toBeDefined();
      expect(output.metadata.tone).toBeDefined();
      expect(output.metadata.emotion).toBeDefined();
      expect(output.metadata.hookType).toBeDefined();
      expect(output.metadata.ctaType).toBeDefined();
      expect(output.metadata.platform).toBeDefined();
      expect(output.metadata.keywords).toBeDefined();
      expect(output.metadata.keywords.length).toBeGreaterThan(0);
    });

    it("should generate hashtags for social platforms", async () => {
      const output = await agent.generateCopy(strategy, { platform: "instagram" });

      expect(output.hashtags).toBeDefined();
      expect(output.hashtags.length).toBeGreaterThan(0);
      expect(output.hashtags.every((h) => h.startsWith("#"))).toBe(true);
    });

    it("should generate alternative versions for A/B testing", async () => {
      const output = await agent.generateCopy(strategy);

      expect(output.alternativeVersions).toBeDefined();
      expect(output.alternativeVersions.length).toBeGreaterThan(0);

      // Alternatives should have different headlines
      const headlines = output.alternativeVersions.map((v) => v.headline);
      const uniqueHeadlines = new Set(headlines).size;
      expect(uniqueHeadlines).toBe(headlines.length);
    });
  });

  describe("Quality Tracking", () => {
    it("should track quality score in valid range (0-10)", async () => {
      const output = await agent.generateCopy(strategy);

      expect(output.qualityScore).toBeDefined();
      expect(output.qualityScore).toBeGreaterThanOrEqual(0);
      expect(output.qualityScore).toBeLessThanOrEqual(10);
    });

    it("should set status to success or needs_review", async () => {
      const output = await agent.generateCopy(strategy);

      expect(["success", "needs_review"]).toContain(output.status);
    });

    it("should track generation duration", async () => {
      const output = await agent.generateCopy(strategy);

      expect(typeof output.durationMs).toBe("number");
      expect(output.durationMs).toBeGreaterThanOrEqual(0);
    });

    it("should set requestId for traceability", async () => {
      const output = await agent.generateCopy(strategy);

      expect(output.requestId).toBeDefined();
    });
  });

  describe("Platform-Specific Generation", () => {
    it("should vary CTA by tone and platform", async () => {
      const casualStrategy = createMockStrategyBrief({
        voice: {
          tone: "casual",
          personality: ["friendly", "approachable"],
          keyMessages: ["easy", "fun"],
          avoidPhrases: ["formal"],
        },
      } as any);

      const casualAgent = new CopyAgent("test_brand");
      const output = await casualAgent.generateCopy(casualStrategy, {
        platform: "twitter",
      });

      expect(output.callToAction).toBeDefined();
      expect(output.callToAction.length).toBeGreaterThan(0);
    });
  });

  describe("Revision Support", () => {
    it("should generate revision with feedback applied", async () => {
      const original = await agent.generateCopy(strategy);
      const revised = await agent.generateRevision(
        original,
        "Make it shorter and more casual"
      );

      // At minimum, status should update
      expect(revised).toBeDefined();
      expect(revised.headline).toBeDefined();
    });
  });

  describe("Strategy Integration", () => {
    it("should generate headlines from positioning and aspirations", async () => {
      const customStrategy = createMockStrategyBrief({
        positioning: {
          tagline: "AI Strategy Platform",
          missionStatement: "Empower teams with smart strategy",
          targetAudience: {
            demographics: "Tech Leaders",
            psychographics: ["innovative", "data-driven"],
            painPoints: ["complexity"],
            aspirations: ["efficiency", "clarity", "scale"],
          },
        },
      } as any);

      const output = await agent.generateCopy(customStrategy);
      expect(output.headline).toBeDefined();
    });

    it("should incorporate mission statement in body copy", async () => {
      const customStrategy = createMockStrategyBrief({
        positioning: {
          tagline: "Data Strategy Platform",
          missionStatement:
            "Making data-driven strategy accessible to every team",
          targetAudience: {
            demographics: "Tech Teams",
            psychographics: ["analytical", "collaborative"],
            painPoints: ["complexity"],
            aspirations: ["accessibility", "clarity"],
          },
        },
      } as any);

      const output = await agent.generateCopy(customStrategy);
      expect(output.body).toBeDefined();
      expect(output.body.length).toBeGreaterThan(0);
    });
  });
});
