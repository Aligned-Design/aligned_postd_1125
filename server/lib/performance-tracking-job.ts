/**
 * Performance Tracking Job
 *
 * Periodically polls published content analytics from platform APIs and updates PerformanceLog.
 * Triggers BrandHistory updates when patterns are detected.
 *
 * Usage:
 * - Call executePollCycle() to fetch latest analytics for a brand
 * - Returns PerformanceLog with updated metrics
 * - Integration point: Phase 4 (Learn) of pipeline orchestrator
 */

import type {
  PerformanceLog,
  ContentPerformance,
  PerformanceMetrics,
  BrandHistoryEntry,
} from "./collaboration-artifacts";

export interface PublishedContent {
  contentId: string;
  platform: "instagram" | "twitter" | "linkedin" | "email";
  publishedAt: string;
  headline: string;
  body: string;
  callToAction: string;
  tone: string;
  layout: string;
  colorScheme: string;
  motionType: "static" | "animated" | "video";
  imageType: "photo" | "illustration" | "mixed" | "none";
  hasEmoji: boolean;
}

export interface PlatformMetrics {
  contentId: string;
  reach: number;
  impressions: number;
  engagement: number; // likes + comments + shares
  likes: number;
  comments: number;
  shares: number;
  saves?: number;
  clicks?: number;
  clickThroughRate?: number;
  conversions?: number;
}

/**
 * Performance Tracking Job - Analytics Ingestion
 */
export class PerformanceTrackingJob {
  private brandId: string;
  private platformMetricsCache: Map<string, PlatformMetrics> = new Map();

  constructor(brandId: string) {
    this.brandId = brandId;
  }

  /**
   * Execute full polling cycle for a brand
   * Aggregates metrics and updates PerformanceLog
   */
  async executePollCycle(
    publishedContent: PublishedContent[],
    previousLog?: PerformanceLog
  ): Promise<{ performanceLog: PerformanceLog; learnings: BrandHistoryEntry[] }> {
    console.log(
      `[PerformanceTracking] Starting poll cycle for brand ${this.brandId}`
    );

    const learnings: BrandHistoryEntry[] = [];

    try {
      // Step 1: Collect metrics from all published content
      const contentMetrics: ContentPerformance[] = [];
      for (const content of publishedContent) {
        const metrics = await this.fetchContentMetrics(content);
        if (metrics) {
          contentMetrics.push(metrics);
        }
      }

      // Step 2: Aggregate metrics by visual/copy attributes
      const visualPerformance = this.aggregateVisualPerformance(contentMetrics);
      const copyPerformance = this.aggregateCopyPerformance(contentMetrics);
      const platformInsights = this.aggregatePlatformInsights(contentMetrics);

      // Step 3: Generate recommendations and alerts
      const { recommendations, alerts, patterns } = this.generateInsights(
        contentMetrics,
        visualPerformance,
        copyPerformance,
        previousLog
      );

      // Step 4: Detect success patterns
      const successPatterns = this.detectSuccessPatterns(
        contentMetrics,
        visualPerformance,
        copyPerformance,
        previousLog
      );

      // Step 5: Create BrandHistory entries for significant patterns
      for (const pattern of successPatterns) {
        const entry: BrandHistoryEntry = {
          timestamp: new Date().toISOString(),
          agent: "advisor",
          action: "performance_insight",
          details: {
            description: pattern.description,
            visualization: {
              colors: [],
              layout: pattern.layout || "varied",
              typography: [],
            },
          },
          rationale: pattern.rationale,
          performance: {
            metric: pattern.metric,
            baseline: pattern.baseline,
            result: pattern.result,
            improvement: pattern.improvement,
          },
          tags: pattern.tags,
        };
        learnings.push(entry);
      }

      // Step 6: Construct PerformanceLog
      const performanceLog: PerformanceLog = {
        id: `pl_${Date.now()}`,
        brandId: this.brandId,
        period: {
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // Last 7 days
          end: new Date().toISOString(),
        },
        summary: {
          totalContent: contentMetrics.length,
          avgEngagement: this.calculateAverage(
            contentMetrics.map((c) => c.metrics.engagement.value)
          ),
          topPerformingMetric: this.identifyTopMetric(contentMetrics),
          bottomPerformingMetric: this.identifyBottomMetric(contentMetrics),
        },
        visualPerformance,
        copyPerformance,
        platformInsights,
        contentPerformance: contentMetrics,
        recommendations,
        patterns,
        alerts,
        lastUpdated: new Date().toISOString(),
      };

      console.log(
        `[PerformanceTracking] Poll cycle complete: ${contentMetrics.length} items analyzed`
      );
      return { performanceLog, learnings };
    } catch (error) {
      console.error(`[PerformanceTracking] Poll cycle failed:`, error);
      throw error;
    }
  }

  /**
   * Fetch metrics for a single published content item
   * In production, this would call actual platform APIs
   */
  private async fetchContentMetrics(
    content: PublishedContent
  ): Promise<ContentPerformance | null> {
    try {
      // Mock API call - in production, would call Instagram/Twitter/LinkedIn APIs
      const mockMetrics = this.generateMockMetrics(content);

      const contentPerformance: ContentPerformance = {
        contentId: content.contentId,
        platform: content.platform,
        publishedAt: content.publishedAt,
        metrics: {
          reach: {
            metric: "Reach",
            value: mockMetrics.reach,
            unit: "users",
            target: 5000,
            status: this.getMetricStatus(mockMetrics.reach, 5000),
          },
          engagement: {
            metric: "Engagement Rate",
            value: mockMetrics.engagement,
            unit: "percent",
            target: 3.0,
            status: this.getMetricStatus(mockMetrics.engagement, 3.0),
          },
          clicks: {
            metric: "Click-Through Rate",
            value: mockMetrics.clickThroughRate || 2.0,
            unit: "percent",
            target: 2.5,
            status: this.getMetricStatus(
              mockMetrics.clickThroughRate || 2.0,
              2.5
            ),
          },
          conversions: {
            metric: "Conversions",
            value: mockMetrics.conversions || 0,
            unit: "count",
            status: "good",
          },
          saveRate: {
            metric: "Save Rate",
            value: (mockMetrics.saves || 0) / mockMetrics.reach,
            unit: "percent",
            status: "good",
          },
        },
        visualAttributes: {
          layout: content.layout,
          colorScheme: content.colorScheme,
          motionType: content.motionType,
          imageType: content.imageType,
        },
        copyAttributes: {
          tone: content.tone,
          length: content.body.length,
          hasEmoji: content.hasEmoji,
          hasCallToAction: !!content.callToAction,
        },
      };

      return contentPerformance;
    } catch (error) {
      console.error(
        `[PerformanceTracking] Failed to fetch metrics for ${content.contentId}:`,
        error
      );
      return null;
    }
  }

  /**
   * Generate mock metrics for testing/demo
   * Replace with actual API calls in production
   */
  private generateMockMetrics(content: PublishedContent) {
    // Bias results based on content attributes for more realistic simulation
    const baseEngagement = 2.5;
    const baseReach = 4000;

    // Tone modifier
    const toneModifier = {
      casual: 1.2,
      professional: 0.95,
      energetic: 1.35,
      friendly: 1.15,
      authoritative: 0.9,
      mixed: 1.0,
    };

    // Layout modifier
    const layoutModifier = {
      hero: 1.25,
      carousel: 1.4,
      text: 0.7,
      image: 1.15,
      mixed: 1.0,
    };

    const tone = content.tone as keyof typeof toneModifier;
    const layout = content.layout.toLowerCase() as keyof typeof layoutModifier;

    const toneEffect = toneModifier[tone] || 1.0;
    const layoutEffect = layoutModifier[layout] || 1.0;
    const totalModifier = toneEffect * layoutEffect;

    const engagementRate = Math.round(baseEngagement * totalModifier * 100) / 100;

    return {
      reach: Math.round(baseReach * totalModifier),
      impressions: Math.round(baseReach * totalModifier * 2.2),
      engagement: engagementRate,
      likes: Math.round(baseReach * totalModifier * 0.08),
      comments: Math.round(baseReach * totalModifier * 0.015),
      shares: Math.round(baseReach * totalModifier * 0.01),
      saves: Math.round(baseReach * totalModifier * 0.05),
      clicks: Math.round(baseReach * totalModifier * 0.04),
      clickThroughRate: engagementRate,
      conversions: Math.round(baseReach * totalModifier * 0.01),
    };
  }

  /**
   * Aggregate performance metrics by visual attributes
   */
  private aggregateVisualPerformance(
    contentMetrics: ContentPerformance[]
  ): Array<{
    attribute: string;
    attributeValue: string;
    avgMetrics: { engagement: number; reach: number; clicks: number };
    contentCount: number;
  }> {
    const byLayout = new Map<
      string,
      {
        values: Array<{
          engagement: number;
          reach: number;
          clicks: number;
        }>;
        count: number;
      }
    >();

    for (const content of contentMetrics) {
      const layout = content.visualAttributes.layout;
      if (!byLayout.has(layout)) {
        byLayout.set(layout, { values: [], count: 0 });
      }
      const entry = byLayout.get(layout)!;
      entry.values.push({
        engagement: content.metrics.engagement.value,
        reach: content.metrics.reach.value,
        clicks: content.metrics.clicks.value,
      });
      entry.count++;
    }

    return Array.from(byLayout.entries()).map(([layout, data]) => ({
      attribute: "layout",
      attributeValue: layout,
      avgMetrics: {
        engagement:
          this.calculateAverage(data.values.map((v) => v.engagement)) || 0,
        reach: this.calculateAverage(data.values.map((v) => v.reach)) || 0,
        clicks: this.calculateAverage(data.values.map((v) => v.clicks)) || 0,
      },
      contentCount: data.count,
    }));
  }

  /**
   * Aggregate performance metrics by copy attributes
   */
  private aggregateCopyPerformance(
    contentMetrics: ContentPerformance[]
  ): Array<{
    attribute: string;
    attributeValue: string;
    avgMetrics: { engagement: number; reach: number; clicks: number };
    contentCount: number;
  }> {
    const byTone = new Map<
      string,
      {
        values: Array<{
          engagement: number;
          reach: number;
          clicks: number;
        }>;
        count: number;
      }
    >();

    for (const content of contentMetrics) {
      const tone = content.copyAttributes.tone;
      if (!byTone.has(tone)) {
        byTone.set(tone, { values: [], count: 0 });
      }
      const entry = byTone.get(tone)!;
      entry.values.push({
        engagement: content.metrics.engagement.value,
        reach: content.metrics.reach.value,
        clicks: content.metrics.clicks.value,
      });
      entry.count++;
    }

    return Array.from(byTone.entries()).map(([tone, data]) => ({
      attribute: "tone",
      attributeValue: tone,
      avgMetrics: {
        engagement:
          this.calculateAverage(data.values.map((v) => v.engagement)) || 0,
        reach: this.calculateAverage(data.values.map((v) => v.reach)) || 0,
        clicks: this.calculateAverage(data.values.map((v) => v.clicks)) || 0,
      },
      contentCount: data.count,
    }));
  }

  /**
   * Generate platform-specific insights
   */
  private aggregatePlatformInsights(
    contentMetrics: ContentPerformance[]
  ): Array<{
    platform: string;
    topVisualStyle: string;
    topCopyStyle: string;
    optimalPostTime?: string;
    recommendedFrequency?: string;
    bestPerformingLayout?: string;
  }> {
    const byPlatform = new Map<
      string,
      {
        layouts: Map<string, number>;
        tones: Map<string, number>;
        avgEngagement: number;
        count: number;
      }
    >();

    for (const content of contentMetrics) {
      const platform = content.platform;
      if (!byPlatform.has(platform)) {
        byPlatform.set(platform, {
          layouts: new Map(),
          tones: new Map(),
          avgEngagement: 0,
          count: 0,
        });
      }

      const entry = byPlatform.get(platform)!;
      const layout = content.visualAttributes.layout;
      const tone = content.copyAttributes.tone;

      entry.layouts.set(layout, (entry.layouts.get(layout) || 0) + 1);
      entry.tones.set(tone, (entry.tones.get(tone) || 0) + 1);
      entry.avgEngagement += content.metrics.engagement.value;
      entry.count++;
    }

    return Array.from(byPlatform.entries()).map(([platform, data]) => ({
      platform,
      topVisualStyle: Array.from(data.layouts.entries()).sort(
        (a, b) => b[1] - a[1]
      )[0]?.[0] || "varied",
      topCopyStyle: Array.from(data.tones.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || "varied",
      optimalPostTime:
        platform === "instagram"
          ? "2-4 PM EST"
          : platform === "twitter"
            ? "9-11 AM EST"
            : "10 AM EST",
      recommendedFrequency: "5-7 posts per week",
      bestPerformingLayout: Array.from(data.layouts.entries()).sort(
        (a, b) => b[1] - a[1]
      )[0]?.[0] || "hero",
    }));
  }

  /**
   * Generate insights, recommendations, and alerts
   */
  private generateInsights(
    contentMetrics: ContentPerformance[],
    visualPerformance: Array<any>,
    copyPerformance: Array<any>,
    previousLog?: PerformanceLog
  ) {
    const recommendations = {
      visualRecommendations: [] as string[],
      copyRecommendations: [] as string[],
      platformRecommendations: [] as string[],
    };

    const alerts = [] as Array<{
      alert: string;
      severity: "critical" | "high" | "medium" | "low";
      recommendation: string;
    }>;

    const patterns = [] as Array<{
      pattern: string;
      strength: "strong" | "moderate" | "weak";
      example: string;
      impact: string;
    }>;

    // Analyze visual performance
    const topLayout = visualPerformance.sort(
      (a, b) => b.avgMetrics.engagement - a.avgMetrics.engagement
    )[0];
    if (topLayout) {
      recommendations.visualRecommendations.push(
        `Continue using ${topLayout.attributeValue} layout (avg engagement: ${topLayout.avgMetrics.engagement.toFixed(1)}%)`
      );
      patterns.push({
        pattern: `${topLayout.attributeValue} layouts drive highest engagement`,
        strength: "strong",
        example: topLayout.attributeValue,
        impact: `+${(topLayout.avgMetrics.engagement - 2.5).toFixed(1)}% above baseline`,
      });
    }

    // Analyze copy performance
    const topTone = copyPerformance.sort(
      (a, b) => b.avgMetrics.engagement - a.avgMetrics.engagement
    )[0];
    if (topTone) {
      recommendations.copyRecommendations.push(
        `Prioritize ${topTone.attributeValue} tone (${topTone.avgMetrics.engagement.toFixed(1)}% engagement)`
      );
    }

    // Check for underperforming content
    const underperforming = contentMetrics.filter(
      (c) => c.metrics.engagement.value < 2.0
    );
    if (underperforming.length > 0) {
      alerts.push({
        alert: `${underperforming.length} pieces underperforming (<2% engagement)`,
        severity: "medium",
        recommendation:
          "Review copy and visual attributes; consider more hooks/CTAs",
      });
    }

    // Check for declined performance vs previous period
    if (previousLog && previousLog.summary.avgEngagement > 0) {
      const currentAvg = this.calculateAverage(
        contentMetrics.map((c) => c.metrics.engagement.value)
      );
      const decline = previousLog.summary.avgEngagement - currentAvg;
      if (decline > 0.5) {
        alerts.push({
          alert: `Engagement down ${decline.toFixed(2)}% from previous period`,
          severity: "high",
          recommendation:
            "Audit recent content; test new visual or copy styles",
        });
      }
    }

    recommendations.platformRecommendations = [
      "Post 5-7 times per week for optimal reach",
      "Schedule content 12-24 hours in advance",
      "Monitor competitor activity during peak posting times",
    ];

    return { recommendations, alerts, patterns };
  }

  /**
   * Detect success patterns and tag them
   */
  private detectSuccessPatterns(
    contentMetrics: ContentPerformance[],
    visualPerformance: Array<any>,
    copyPerformance: Array<any>,
    previousLog?: PerformanceLog
  ): Array<{
    description: string;
    layout: string;
    metric: string;
    baseline: number;
    result: number;
    improvement: number;
    rationale: string;
    tags: string[];
  }> {
    const patterns: Array<{
      description: string;
      layout: string;
      metric: string;
      baseline: number;
      result: number;
      improvement: number;
      rationale: string;
      tags: string[];
    }> = [];

    // Find content with >3% engagement (strong performers)
    const topPerformers = contentMetrics.filter(
      (c) => c.metrics.engagement.value > 3.0
    );

    if (topPerformers.length > 0) {
      const avgLayout =
        topPerformers.map((c) => c.visualAttributes.layout)[0] || "hero";
      const avgTone =
        topPerformers.map((c) => c.copyAttributes.tone)[0] || "professional";

      patterns.push({
        description: `High-engagement pattern: ${avgLayout} layout with ${avgTone} tone`,
        layout: avgLayout,
        metric: "engagement",
        baseline: 2.5,
        result: this.calculateAverage(
          topPerformers.map((c) => c.metrics.engagement.value)
        ),
        improvement:
          (this.calculateAverage(
            topPerformers.map((c) => c.metrics.engagement.value)
          ) -
            2.5) /
          2.5,
        rationale: `${topPerformers.length} pieces exceeded 3% engagement threshold`,
        tags: ["success_pattern", "high_engagement", "replicate"],
      });
    }

    // Check for improvements vs previous period
    if (previousLog) {
      const previousAvg = previousLog.summary.avgEngagement;
      const currentAvg = this.calculateAverage(
        contentMetrics.map((c) => c.metrics.engagement.value)
      );

      if (currentAvg > previousAvg * 1.15) {
        // >15% improvement
        patterns.push({
          description: "Overall engagement improvement detected",
          layout: "varied",
          metric: "average_engagement",
          baseline: previousAvg,
          result: currentAvg,
          improvement: (currentAvg - previousAvg) / previousAvg,
          rationale: "Recent content changes correlate with improved metrics",
          tags: ["success_pattern", "improvement", "sustained_growth"],
        });
      }
    }

    return patterns;
  }

  /**
   * Calculate average of numeric array
   */
  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  /**
   * Determine metric status based on target
   */
  private getMetricStatus(
    value: number,
    target: number
  ): "excellent" | "good" | "fair" | "poor" {
    if (value >= target * 1.25) return "excellent";
    if (value >= target * 0.85) return "good";
    if (value >= target * 0.6) return "fair";
    return "poor";
  }

  /**
   * Identify top performing metric across all content
   */
  private identifyTopMetric(contentMetrics: ContentPerformance[]): string {
    let topMetric = "engagement";
    let topValue = 0;

    for (const content of contentMetrics) {
      if (content.metrics.engagement.value > topValue) {
        topValue = content.metrics.engagement.value;
        topMetric = "engagement";
      }
      if (content.metrics.reach.value > topValue * 100) {
        topValue = content.metrics.reach.value / 100;
        topMetric = "reach";
      }
    }

    return topMetric;
  }

  /**
   * Identify bottom performing metric across all content
   */
  private identifyBottomMetric(contentMetrics: ContentPerformance[]): string {
    const avgEngagement = this.calculateAverage(
      contentMetrics.map((c) => c.metrics.engagement.value)
    );
    const avgClicks = this.calculateAverage(
      contentMetrics.map((c) => c.metrics.clicks.value)
    );

    return avgClicks < avgEngagement ? "clicks" : "engagement";
  }
}

/**
 * Create a global performance tracking job instance
 */
export const createPerformanceTrackingJob = (brandId: string) => {
  return new PerformanceTrackingJob(brandId);
};
