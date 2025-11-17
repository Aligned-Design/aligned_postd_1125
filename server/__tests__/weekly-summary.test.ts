import { createWeeklySummaryService, WeeklySummaryService } from "../lib/weekly-summary";
import type {
  BrandHistory,
  PerformanceLog,
} from "../lib/collaboration-artifacts";

describe("WeeklySummaryService", () => {
  const brandId = "test-brand";
  const service = createWeeklySummaryService(brandId);

  const mockPerformanceLogs: PerformanceLog[] = [
    {
      cycleId: "cycle_1",
      timestamp: new Date().toISOString(),
      contentMetrics: [
        {
          contentId: "content_1",
          platform: "instagram",
          tone: "professional",
          headline: "Test Headline",
          body: "Test body content",
          engagement: 4.5,
          layout: "hero",
          colorScheme: "blue",
          imageType: "photo",
          hasEmoji: false,
        },
        {
          contentId: "content_2",
          platform: "twitter",
          tone: "casual",
          headline: "Test Tweet",
          body: "Short content",
          engagement: 2.1,
          layout: "text-only",
          colorScheme: "neutral",
          imageType: "none",
          hasEmoji: true,
        },
        {
          contentId: "content_3",
          platform: "instagram",
          tone: "professional",
          headline: "Another Headline",
          body: "More test content here with good length",
          engagement: 5.2,
          layout: "hero",
          colorScheme: "blue",
          imageType: "photo",
          hasEmoji: false,
        },
      ],
      visualPerformance: [
        {
          layout: "hero",
          engagement: 4.85,
          colorScheme: "blue",
          motionType: "static",
        },
      ],
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
        agent: "copy",
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
        evidence: ["4.5% engagement", "5.2% engagement"],
        recommendation: "Increase professional tone content on Instagram",
      },
    ],
    designFatigueAlerts: [],
    constraints: [],
    lastUpdated: new Date().toISOString(),
  };

  test("generates weekly summary with metrics", async () => {
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

  test("identifies success patterns", async () => {
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

  test("analyzes design patterns", async () => {
    const summary = await service.generateWeeklySummary(
      mockPerformanceLogs,
      mockBrandHistory
    );

    expect(summary.designPatterns).toBeDefined();
    expect(summary.designPatterns.layouts).toBeDefined();
    expect(summary.designPatterns.layouts.length).toBeGreaterThan(0);
  });

  test("analyzes copy patterns", async () => {
    const summary = await service.generateWeeklySummary(
      mockPerformanceLogs,
      mockBrandHistory
    );

    expect(summary.copyPatterns).toBeDefined();
    expect(summary.copyPatterns.tones).toBeDefined();
    expect(summary.copyPatterns.tones.length).toBeGreaterThan(0);
    expect(summary.copyPatterns.emojiUsage).toBeDefined();
  });

  test("generates recommendations", async () => {
    const summary = await service.generateWeeklySummary(
      mockPerformanceLogs,
      mockBrandHistory
    );

    expect(summary.recommendations.length).toBeGreaterThan(0);
    expect(
      summary.recommendations.some((r) => r.includes("instagram"))
    ).toBe(true);
  });

  test("creates advisor actions", async () => {
    const summary = await service.generateWeeklySummary(
      mockPerformanceLogs,
      mockBrandHistory
    );

    expect(summary.advisorActions.length).toBeGreaterThan(0);
    expect(summary.advisorActions[0].id).toBeDefined();
    expect(summary.advisorActions[0].description).toBeDefined();
  });

  test("identifies risks and opportunities", async () => {
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

  test("exports to markdown", async () => {
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
