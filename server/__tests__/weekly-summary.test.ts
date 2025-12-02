import { describe, it, expect } from "vitest";
import { createWeeklySummaryService, WeeklySummaryService } from "../lib/weekly-summary";
import type {
  BrandHistory,
  PerformanceLog,
} from "@shared/collaboration-artifacts";

describe("WeeklySummaryService", () => {
  const brandId = "test-brand";
  const service = createWeeklySummaryService(brandId);

  const mockPerformanceLogs: PerformanceLog[] = [
    {
      id: "pl_1",
      brandId,
      period: {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        end: new Date().toISOString().split("T")[0],
      },
      summary: {
        totalContent: 3,
        avgEngagement: 4.0,
        topPerformingMetric: "engagement",
        bottomPerformingMetric: "reach",
      },
      visualPerformance: [
        {
          attribute: "layout",
          attributeValue: "hero",
          avgMetrics: {
            engagement: 4.85,
            reach: 100,
            clicks: 50,
          },
          contentCount: 2,
        },
      ],
      copyPerformance: [],
      platformInsights: [],
      contentPerformance: [],
      recommendations: {
        visualRecommendations: [],
        copyRecommendations: [],
        platformRecommendations: [],
      },
      patterns: [],
      alerts: [],
      lastUpdated: new Date().toISOString(),
    },
  ];

  const mockBrandHistory: BrandHistory = {
    id: "history_1",
    brandId,
    entries: [
      {
        timestamp: new Date().toISOString(),
        agent: "advisor",
        action: "design_created",
        details: {
          description: "Created design concept",
          visualization: {
            colors: [],
            layout: "hero",
            typography: [],
          },
        },
        rationale: "Test design",
        tags: ["test"],
      },
      {
        timestamp: new Date().toISOString(),
        agent: "copywriter",
        action: "pattern_identified",
        details: {
          description: "Professional tone performs well",
          visualization: {
            colors: [],
            layout: "text-only",
            typography: [],
          },
        },
        rationale: "Pattern analysis",
        tags: ["pattern"],
      },
    ],
    successPatterns: [
      {
        pattern: "Professional tone on Instagram drives engagement",
        frequency: 2,
        avgPerformance: 4.85,
        examples: ["content_1", "content_3"],
      },
    ],
    designFatigueAlerts: [],
    constraints: [],
    lastUpdated: new Date().toISOString(),
  };

  it("generates weekly summary with metrics", async () => {
    const summary = await service.generateWeeklySummary(
      mockPerformanceLogs,
      mockBrandHistory
    );

    expect(summary).toBeDefined();
    expect(summary.brandId).toBe(brandId);
    expect(summary.metrics).toBeDefined();
    expect(summary.metrics.totalContent).toBe(3);
    expect(summary.metrics.averageEngagement).toBeGreaterThan(0);
    expect(summary.metrics.topPerformingPlatform).toBe("instagram");
  });

  it("identifies success patterns", async () => {
    const summary = await service.generateWeeklySummary(
      mockPerformanceLogs,
      mockBrandHistory
    );

    expect(summary.successPatterns.length).toBeGreaterThan(0);
    expect(summary.successPatterns[0].pattern).toBeDefined();
    expect(summary.successPatterns[0].confidence).toMatch(
      /high|medium|low/
    );
  });

  it("analyzes design patterns", async () => {
    const summary = await service.generateWeeklySummary(
      mockPerformanceLogs,
      mockBrandHistory
    );

    expect(summary.designPatterns).toBeDefined();
    expect(summary.designPatterns.layouts).toBeDefined();
    expect(summary.designPatterns.layouts.length).toBeGreaterThan(0);
  });

  it("analyzes copy patterns", async () => {
    const summary = await service.generateWeeklySummary(
      mockPerformanceLogs,
      mockBrandHistory
    );

    expect(summary.copyPatterns).toBeDefined();
    expect(summary.copyPatterns.tones).toBeDefined();
    expect(summary.copyPatterns.tones.length).toBeGreaterThan(0);
    expect(summary.copyPatterns.emojiUsage).toBeDefined();
  });

  it("generates recommendations", async () => {
    const summary = await service.generateWeeklySummary(
      mockPerformanceLogs,
      mockBrandHistory
    );

    expect(summary.recommendations.length).toBeGreaterThan(0);
    expect(
      summary.recommendations.some((r) => r.includes("instagram"))
    ).toBe(true);
  });

  it("creates advisor actions", async () => {
    const summary = await service.generateWeeklySummary(
      mockPerformanceLogs,
      mockBrandHistory
    );

    expect(summary.advisorActions.length).toBeGreaterThan(0);
    expect(summary.advisorActions[0].id).toBeDefined();
    expect(summary.advisorActions[0].description).toBeDefined();
  });

  it("identifies risks and opportunities", async () => {
    const summary = await service.generateWeeklySummary(
      mockPerformanceLogs,
      mockBrandHistory
    );

    expect(summary.risksAndOpportunities).toBeDefined();
    expect(
      summary.risksAndOpportunities.risks ||
        summary.risksAndOpportunities.opportunities
    ).toBeDefined();
  });

  it("exports to markdown", async () => {
    const summary = await service.generateWeeklySummary(
      mockPerformanceLogs,
      mockBrandHistory
    );

    const markdown = WeeklySummaryService.toMarkdown(summary);

    expect(markdown).toContain("Weekly Summary");
    expect(markdown).toContain(summary.metrics.topPerformingPlatform);
    expect(markdown).toContain("Recommendations");
  });
});
