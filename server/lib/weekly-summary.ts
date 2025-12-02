/**
 * Weekly Summary Service
 *
 * Aggregates weekly performance metrics, identifies success patterns,
 * and generates actionable recommendations for the next content cycle.
 *
 * Outputs:
 * - weekly/summary.json (metrics, patterns, recommendations, advisorActions)
 * - weekly/WEEKLY_SUMMARY.md (human-readable performance brief)
 */

import type {
  BrandHistory,
  BrandHistoryEntry,
  PerformanceLog,
} from "./collaboration-artifacts";
// Local interface for advisor actions in weekly summary
interface WeeklyAdvisorAction {
  id: string;
  action: string;
  description: string;
  rationale: string;
  expectedImpact: "high" | "medium" | "low";
  effort: "high" | "medium" | "low";
}

export interface WeeklySummaryMetrics {
  weekOf: string; // ISO date of Monday
  brandId: string;
  totalContent: number;
  averageEngagement: number;
  topPerformingPlatform: string;
  topPerformingTone: string;
  topPerformingLayout: string;
  lowestPerformingPlatform?: string;
  contentByStatus: {
    draft: number;
    approved: number;
    published: number;
    archived: number;
  };
  platformBreakdown: Record<
    string,
    {
      published: number;
      avgEngagement: number;
      topTone: string;
      topLayout: string;
    }
  >;
  tonePerformance: Record<string, { count: number; avgEngagement: number }>;
  layoutPerformance: Record<string, { count: number; avgEngagement: number }>;
  designFatigueRisk: "low" | "medium" | "high";
}

export interface SuccessPattern {
  pattern: string;
  evidence: string[];
  confidence: "high" | "medium" | "low";
  recommendation: string;
  actionType?:
    | "replicate"
    | "expand"
    | "test_variant"
    | "investigate"
    | "discontinue";
  impactScore: number;
}

export interface WeeklySummary {
  weekOf: string;
  brandId: string;
  generatedAt: string;
  metrics: WeeklySummaryMetrics;
  successPatterns: SuccessPattern[];
  designPatterns: {
    layouts: Array<{ layout: string; engagement: number; frequency: number }>;
    colors: Array<{ color: string; engagement: number; frequency: number }>;
    typography: Array<{
      style: string;
      engagement: number;
      frequency: number;
    }>;
  };
  copyPatterns: {
    tones: Array<{ tone: string; engagement: number; frequency: number }>;
    lengths: Array<{ range: string; engagement: number; frequency: number }>;
    emojiUsage: { withEmoji: number; withoutEmoji: number; engagement: number };
  };
  recommendations: string[];
  advisorActions: WeeklyAdvisorAction[];
  risksAndOpportunities: {
    risks: Array<{ risk: string; severity: "low" | "medium" | "high" }>;
    opportunities: Array<{ opportunity: string; priority: "low" | "medium" | "high" }>;
  };
}

export class WeeklySummaryService {
  private brandId: string;

  constructor(brandId: string) {
    this.brandId = brandId;
  }

  /**
   * Generate complete weekly summary from performance logs and brand history
   */
  async generateWeeklySummary(
    performanceLogs: PerformanceLog[],
    brandHistory: BrandHistory
  ): Promise<WeeklySummary> {
    console.log(
      `[WeeklySummary] Generating summary for brand ${this.brandId}`
    );

    const weekOf = this.getWeekStartDate();
    const metrics = this.aggregateMetrics(performanceLogs, brandHistory);
    const successPatterns = this.identifySuccessPatterns(
      performanceLogs,
      brandHistory
    );
    const designPatterns = this.analyzeDesignPatterns(performanceLogs);
    const copyPatterns = this.analyzeCopyPatterns(performanceLogs);
    const recommendations = this.generateRecommendations(
      metrics,
      successPatterns,
      designPatterns,
      copyPatterns
    );
    const advisorActions = this.createAdvisorActions(
      recommendations,
      successPatterns
    );
    const risksAndOpportunities =
      this.identifyRisksAndOpportunities(metrics);

    const summary: WeeklySummary = {
      weekOf,
      brandId: this.brandId,
      generatedAt: new Date().toISOString(),
      metrics,
      successPatterns,
      designPatterns,
      copyPatterns,
      recommendations,
      advisorActions,
      risksAndOpportunities,
    };

    console.log(
      `[WeeklySummary] Complete: ${successPatterns.length} patterns, ${advisorActions.length} recommendations`
    );
    return summary;
  }

  /**
   * Aggregate weekly metrics from performance logs
   */
  private aggregateMetrics(
    logs: PerformanceLog[],
    history: BrandHistory
  ): WeeklySummaryMetrics {
    const platformMetrics: Record<
      string,
      { engagement: number[]; tones: Record<string, number> }
    > = {};
    const tonePerformance: Record<string, { count: number; total: number }> =
      {};
    const layoutPerformance: Record<
      string,
      { count: number; total: number }
    > = {};

    let totalContent = 0;
    let totalEngagement = 0;

    // Process all performance logs
    for (const log of logs) {
      if (!log.contentMetrics || log.contentMetrics.length === 0) {
        continue;
      }

      for (const metric of log.contentMetrics) {
        totalContent++;
        const engagement = metric.engagement || 0;
        totalEngagement += engagement;

        // Platform breakdown
        if (!platformMetrics[metric.platform]) {
          platformMetrics[metric.platform] = { engagement: [], tones: {} };
        }
        platformMetrics[metric.platform].engagement.push(engagement);

        // Tone tracking
        if (metric.tone) {
          if (!tonePerformance[metric.tone]) {
            tonePerformance[metric.tone] = { count: 0, total: 0 };
          }
          tonePerformance[metric.tone].count++;
          tonePerformance[metric.tone].total += engagement;
          platformMetrics[metric.platform].tones[metric.tone] =
            (platformMetrics[metric.platform].tones[metric.tone] || 0) + 1;
        }

        // Layout tracking
        const layout = typeof metric.layout === 'string' ? metric.layout : null;
        if (layout) {
          if (!layoutPerformance[layout]) {
            layoutPerformance[layout] = { count: 0, total: 0 };
          }
          layoutPerformance[layout].count++;
          layoutPerformance[layout].total += engagement;
        }
      }
    }

    // Calculate top performers
    const topPerformingPlatform = Object.entries(platformMetrics).reduce(
      (best, [platform, data]) => {
        const avgEngagement =
          data.engagement.length > 0
            ? data.engagement.reduce((a, b) => a + b, 0) /
              data.engagement.length
            : 0;
        const currentBest = platformMetrics[best]?.engagement || [];
        const currentAvg =
          currentBest.length > 0
            ? currentBest.reduce((a, b) => a + b, 0) / currentBest.length
            : 0;
        return avgEngagement > currentAvg ? platform : best;
      },
      Object.keys(platformMetrics)[0] || "unknown"
    );

    const topPerformingTone = Object.entries(tonePerformance).reduce(
      (best, [tone, data]) => {
        const bestData = tonePerformance[best];
        const bestAvg = bestData
          ? bestData.total / bestData.count
          : 0;
        const currentAvg = data.total / data.count;
        return currentAvg > bestAvg ? tone : best;
      },
      Object.keys(tonePerformance)[0] || "professional"
    );

    const topPerformingLayout = Object.entries(layoutPerformance).reduce(
      (best, [layout, data]) => {
        const bestData = layoutPerformance[best];
        const bestAvg = bestData
          ? bestData.total / bestData.count
          : 0;
        const currentAvg = data.total / data.count;
        return currentAvg > bestAvg ? layout : best;
      },
      Object.keys(layoutPerformance)[0] || "hero"
    );

    // Determine design fatigue risk
    const layoutCount = Object.keys(layoutPerformance).length;
    const designFatigueRisk =
      layoutCount < 2
        ? ("high" as const)
        : layoutCount < 4
          ? ("medium" as const)
          : ("low" as const);

    // Count content by status
    const contentByStatus = {
      draft: history.entries.filter((e) => e.action === "design_created")
        .length,
      approved: history.entries.filter(
        (e) => e.action === "design_created"
      ).length,
      published: history.entries.filter(
        (e) => e.action === "pattern_identified"
      ).length,
      archived: history.entries.filter((e) => e.action === "constraint_added")
        .length,
    };

    // Platform breakdown
    const platformBreakdown: Record<
      string,
      {
        published: number;
        avgEngagement: number;
        topTone: string;
        topLayout: string;
      }
    > = {};

    for (const [platform, data] of Object.entries(platformMetrics)) {
      const avgEngagement =
        data.engagement.length > 0
          ? data.engagement.reduce((a, b) => a + b, 0) / data.engagement.length
          : 0;
      const topTone = Object.entries(data.tones).reduce<string>((best, [tone, count]) => {
        const bestCount = typeof data.tones[best] === 'number' ? data.tones[best] : 0;
        const currentCount = typeof count === 'number' ? count : 0;
        return currentCount > bestCount ? tone : best;
      }, Object.keys(data.tones)[0] || "professional");

      platformBreakdown[platform] = {
        published: data.engagement.length,
        avgEngagement: Math.round(avgEngagement * 100) / 100,
        topTone: topTone,
        topLayout: topPerformingLayout,
      };
    }

    // Tone performance
    const tonePerformanceFormatted: Record<
      string,
      { count: number; avgEngagement: number }
    > = {};
    for (const [tone, data] of Object.entries(tonePerformance)) {
      tonePerformanceFormatted[tone] = {
        count: data.count,
        avgEngagement: Math.round((data.total / data.count) * 100) / 100,
      };
    }

    // Layout performance
    const layoutPerformanceFormatted: Record<
      string,
      { count: number; avgEngagement: number }
    > = {};
    for (const [layout, data] of Object.entries(layoutPerformance)) {
      layoutPerformanceFormatted[layout] = {
        count: data.count,
        avgEngagement: Math.round((data.total / data.count) * 100) / 100,
      };
    }

    return {
      weekOf: this.getWeekStartDate(),
      brandId: this.brandId,
      totalContent,
      averageEngagement:
        totalContent > 0 ? Math.round((totalEngagement / totalContent) * 100) / 100 : 0,
      topPerformingPlatform,
      topPerformingTone,
      topPerformingLayout,
      contentByStatus,
      platformBreakdown,
      tonePerformance: tonePerformanceFormatted,
      layoutPerformance: layoutPerformanceFormatted,
      designFatigueRisk,
    };
  }

  /**
   * Identify success patterns from performance data
   */
  private identifySuccessPatterns(
    logs: PerformanceLog[],
    history: BrandHistory
  ): SuccessPattern[] {
    const patterns: SuccessPattern[] = [];

    // Find patterns marked in history
    for (const pattern of history.successPatterns || []) {
      patterns.push({
        pattern: pattern.pattern,
        evidence: pattern.examples || [], // Use examples as evidence since evidence doesn't exist in BrandHistory.successPatterns
        confidence: "high",
        recommendation: `Continue using this pattern (${pattern.frequency} instances, ${pattern.avgPerformance.toFixed(1)} avg performance)`,
        actionType: "replicate",
        impactScore: 0.85,
      });
    }

    // Analyze engagement spikes
    const engagementPeaks: Record<string, number[]> = {};
    for (const log of logs) {
      if (!log.contentMetrics) continue;

      for (const metric of log.contentMetrics) {
        const key = `${metric.platform}_${metric.tone}`;
        if (!engagementPeaks[key]) {
          engagementPeaks[key] = [];
        }
        if (metric.engagement && metric.engagement > 3) {
          engagementPeaks[key].push(metric.engagement);
        }
      }
    }

    // Create pattern entries for high-engagement combinations
    for (const [key, values] of Object.entries(engagementPeaks)) {
      if (values.length >= 2) {
        const avgEngagement =
          values.reduce((a, b) => a + b, 0) / values.length;
        const [platform, tone] = key.split("_");

        patterns.push({
          pattern: `High engagement on ${platform} with ${tone} tone`,
          evidence: [`${values.length} instances with >3% engagement`],
          confidence: "medium",
          recommendation: `Increase frequency of ${tone} tone content on ${platform}`,
          actionType: "expand",
          impactScore: avgEngagement / 10,
        });
      }
    }

    return patterns.slice(0, 5); // Top 5 patterns
  }

  /**
   * Analyze design patterns from performance logs
   */
  private analyzeDesignPatterns(logs: PerformanceLog[]) {
    const layoutMap: Record<string, { engagement: number[]; count: number }> =
      {};
    const colorMap: Record<string, { engagement: number[]; count: number }> =
      {};
    const typographyMap: Record<
      string,
      { engagement: number[]; count: number }
    > = {};

    for (const log of logs) {
      if (!log.visualPerformance) continue;

      for (const visual of log.visualPerformance) {
        // Layout
        if (visual.layout) {
          if (!layoutMap[visual.layout]) {
            layoutMap[visual.layout] = { engagement: [], count: 0 };
          }
          layoutMap[visual.layout].engagement.push(visual.engagement || 0);
          layoutMap[visual.layout].count++;
        }

        // Colors
        if (visual.colorScheme) {
          if (!colorMap[visual.colorScheme]) {
            colorMap[visual.colorScheme] = { engagement: [], count: 0 };
          }
          colorMap[visual.colorScheme].engagement.push(visual.engagement || 0);
          colorMap[visual.colorScheme].count++;
        }

        // Typography
        if (visual.motionType) {
          if (!typographyMap[visual.motionType]) {
            typographyMap[visual.motionType] = { engagement: [], count: 0 };
          }
          typographyMap[visual.motionType].engagement.push(
            visual.engagement || 0
          );
          typographyMap[visual.motionType].count++;
        }
      }
    }

    return {
      layouts: Object.entries(layoutMap)
        .map(([layout, data]) => ({
          layout,
          engagement: Math.round(
            (data.engagement.reduce((a, b) => a + b, 0) /
              data.engagement.length) *
              100
          ) / 100,
          frequency: data.count,
        }))
        .sort((a, b) => b.engagement - a.engagement),
      colors: Object.entries(colorMap)
        .map(([color, data]) => ({
          color,
          engagement: Math.round(
            (data.engagement.reduce((a, b) => a + b, 0) /
              data.engagement.length) *
              100
          ) / 100,
          frequency: data.count,
        }))
        .sort((a, b) => b.engagement - a.engagement),
      typography: Object.entries(typographyMap)
        .map(([style, data]) => ({
          style,
          engagement: Math.round(
            (data.engagement.reduce((a, b) => a + b, 0) /
              data.engagement.length) *
              100
          ) / 100,
          frequency: data.count,
        }))
        .sort((a, b) => b.engagement - a.engagement),
    };
  }

  /**
   * Analyze copy patterns from performance logs
   */
  private analyzeCopyPatterns(logs: PerformanceLog[]) {
    const toneMap: Record<string, { engagement: number[]; count: number }> =
      {};
    const lengthMap: Record<string, { engagement: number[]; count: number }> =
      {};
    let withEmoji = 0;
    let withoutEmoji = 0;
    let emojiEngagement = 0;
    let noEmojiEngagement = 0;

    for (const log of logs) {
      if (!log.contentMetrics) continue;

      for (const content of log.contentMetrics) {
        // Tone
        if (content.tone) {
          if (!toneMap[content.tone]) {
            toneMap[content.tone] = { engagement: [], count: 0 };
          }
          toneMap[content.tone].engagement.push(content.engagement || 0);
          toneMap[content.tone].count++;
        }

        // Length
        const body = typeof content.body === 'string' ? content.body : '';
        const bodyLength = body.length || 0;
        let lengthRange = "short";
        if (bodyLength > 500) {
          lengthRange = "long";
        } else if (bodyLength > 200) {
          lengthRange = "medium";
        }

        if (!lengthMap[lengthRange]) {
          lengthMap[lengthRange] = { engagement: [], count: 0 };
        }
        lengthMap[lengthRange].engagement.push(content.engagement || 0);
        lengthMap[lengthRange].count++;

        // Emoji
        const headline = typeof content.headline === 'string' ? content.headline : '';
        if (headline.includes("😊") || body.includes("😊")) {
          withEmoji++;
          emojiEngagement += content.engagement || 0;
        } else {
          withoutEmoji++;
          noEmojiEngagement += content.engagement || 0;
        }
      }
    }

    return {
      tones: Object.entries(toneMap)
        .map(([tone, data]) => ({
          tone,
          engagement: Math.round(
            (data.engagement.reduce((a, b) => a + b, 0) /
              data.engagement.length) *
              100
          ) / 100,
          frequency: data.count,
        }))
        .sort((a, b) => b.engagement - a.engagement),
      lengths: Object.entries(lengthMap)
        .map(([range, data]) => ({
          range,
          engagement: Math.round(
            (data.engagement.reduce((a, b) => a + b, 0) /
              data.engagement.length) *
              100
          ) / 100,
          frequency: data.count,
        }))
        .sort((a, b) => b.engagement - a.engagement),
      emojiUsage: {
        withEmoji,
        withoutEmoji,
        engagement: Math.round(
          ((emojiEngagement + noEmojiEngagement) /
            (withEmoji + withoutEmoji)) *
            100
        ) / 100,
      },
    };
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(
    metrics: WeeklySummaryMetrics,
    patterns: SuccessPattern[],
    design: any,
    copy: any
  ): string[] {
    const recommendations: string[] = [];

    // Based on top performers
    recommendations.push(
      `Focus on ${metrics.topPerformingPlatform} - it's driving ${metrics.platformBreakdown[metrics.topPerformingPlatform]?.avgEngagement || 0}% avg engagement`
    );

    recommendations.push(
      `Increase ${metrics.topPerformingTone} tone content - shows strongest performance`
    );

    // Design fatigue warning
    if (metrics.designFatigueRisk === "high") {
      recommendations.push(
        "Diversify layouts to avoid design fatigue - test new layout variants"
      );
    }

    // Success patterns
    if (patterns.length > 0) {
      recommendations.push(
        `Replicate ${patterns[0].pattern} - identified as success pattern`
      );
    }

    // Copy insights
    if (copy.lengths && copy.lengths.length > 0) {
      recommendations.push(
        `${copy.lengths[0].range} format performing best - optimize for this length`
      );
    }

    return recommendations;
  }

  /**
   * Create advisor action items from recommendations
   */
  private createAdvisorActions(
    recommendations: string[],
    patterns: SuccessPattern[]
  ): WeeklyAdvisorAction[] {
    return recommendations.map((rec, idx) => ({
      id: `action_${Date.now()}_${idx}`,
      action: "tighten_post_length", // Map recommendations to handlers
      description: rec,
      rationale: "Based on weekly performance analysis",
      expectedImpact: "high" as const,
      effort: "medium" as const,
    }));
  }

  /**
   * Identify risks and opportunities
   */
  private identifyRisksAndOpportunities(metrics: WeeklySummaryMetrics) {
    const risks = [];
    const opportunities = [];

    // Design fatigue risk
    if (metrics.designFatigueRisk === "high") {
      risks.push({
        risk: "High design fatigue - low layout variety detected",
        severity: "high" as const,
      });
    }

    // Platform concentration
    const platformCount = Object.keys(metrics.platformBreakdown).length;
    if (platformCount === 1) {
      risks.push({
        risk: "All content on single platform - diversify for resilience",
        severity: "medium" as const,
      });
    }

    // Low engagement opportunity
    const lowPerformers = Object.entries(metrics.platformBreakdown)
      .filter(([_, data]) => data.avgEngagement < 2)
      .map(([platform]) => platform);

    if (lowPerformers.length > 0) {
      opportunities.push({
        opportunity: `Investigate ${lowPerformers.join(", ")} for optimization - currently underperforming`,
        priority: "high" as const,
      });
    }

    // High performer expansion
    opportunities.push({
      opportunity: `Scale content on ${metrics.topPerformingPlatform} - proven platform for this brand`,
      priority: "high" as const,
    });

    return { risks, opportunities };
  }

  /**
   * Get Monday of current week
   */
  private getWeekStartDate(): string {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    return monday.toISOString().split("T")[0];
  }

  /**
   * Export summary to markdown format
   */
  static toMarkdown(summary: WeeklySummary): string {
    let md = `# Weekly Summary: ${summary.weekOf}\n\n`;
    md += `**Brand**: ${summary.brandId}\n`;
    md += `**Generated**: ${summary.generatedAt}\n\n`;

    // Metrics Section
    md += `## 📊 Performance Metrics\n\n`;
    md += `- **Total Content**: ${summary.metrics.totalContent} pieces\n`;
    md += `- **Average Engagement**: ${summary.metrics.averageEngagement}%\n`;
    md += `- **Top Platform**: ${summary.metrics.topPerformingPlatform}\n`;
    md += `- **Top Tone**: ${summary.metrics.topPerformingTone}\n`;
    md += `- **Design Fatigue Risk**: ${summary.metrics.designFatigueRisk.toUpperCase()}\n\n`;

    // Success Patterns
    md += `## 🎯 Success Patterns\n\n`;
    for (const pattern of summary.successPatterns) {
      md += `### ${pattern.pattern}\n`;
      md += `- **Confidence**: ${pattern.confidence}\n`;
      md += `- **Recommendation**: ${pattern.recommendation}\n\n`;
    }

    // Recommendations
    md += `## 💡 Recommendations\n\n`;
    for (const rec of summary.recommendations) {
      md += `- ${rec}\n`;
    }
    md += `\n`;

    // Advisor Actions
    md += `## ✅ Action Items\n\n`;
    for (const action of summary.advisorActions) {
      md += `- [ ] ${action.description}\n`;
    }
    md += `\n`;

    // Risks & Opportunities
    md += `## ⚠️ Risks & Opportunities\n\n`;
    if (summary.risksAndOpportunities.risks.length > 0) {
      md += `### Risks\n`;
      for (const risk of summary.risksAndOpportunities.risks) {
        md += `- **${risk.severity.toUpperCase()}**: ${risk.risk}\n`;
      }
      md += `\n`;
    }

    if (summary.risksAndOpportunities.opportunities.length > 0) {
      md += `### Opportunities\n`;
      for (const opp of summary.risksAndOpportunities.opportunities) {
        md += `- **${opp.priority.toUpperCase()}**: ${opp.opportunity}\n`;
      }
      md += `\n`;
    }

    return md;
  }
}

/**
 * Create weekly summary generator instance
 */
export const createWeeklySummaryService = (brandId: string) => {
  return new WeeklySummaryService(brandId);
};
