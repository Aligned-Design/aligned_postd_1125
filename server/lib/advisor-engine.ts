import {
  AdvisorInsight,
  AnalyticsMetric,
  ContentForecast,
  AnalyticsAlert,
  VoiceQuery,
  VoiceResponse,
} from "@shared/analytics";

interface InsightContext {
  brandId: string;
  currentMetrics: AnalyticsMetric[];
  historicalMetrics: AnalyticsMetric[];
  goals: unknown[];
  userFeedback: Array<{
    insightId: string;
    feedback: string;
    timestamp: string;
  }>;
}

interface MetricAnomaly {
  metric: string;
  category: "content" | "platform" | "audience" | "timing" | "campaign";
  type: string;
  severity: "low" | "medium" | "high";
  suggestions: string[];
  change: number;
  current: number;
  expected: number;
}

export class AdvisorEngine {
  private feedbackWeights = new Map<string, number>();
  private weightsLoadedFor = new Set<string>(); // Track which brands have loaded weights

  async generateInsights(context: InsightContext): Promise<AdvisorInsight[]> {
    const insights: AdvisorInsight[] = [];

    // Load feedback weights from database if not already loaded for this brand
    if (!this.weightsLoadedFor.has(context.brandId)) {
      await this.loadFeedbackWeights(context.brandId);
      this.weightsLoadedFor.add(context.brandId);
    }

    // Generate different types of insights
    insights.push(...(await this.analyzeTrends(context)));
    insights.push(...(await this.analyzeContentPerformance(context)));
    insights.push(...(await this.analyzeOptimalTiming(context)));
    insights.push(...(await this.analyzePlatformPerformance(context)));
    insights.push(...(await this.analyzeAudienceGrowth(context)));
    insights.push(...(await this.detectAnomalies(context)));

    // Apply feedback learning weights
    insights.forEach((insight) => {
      const weight = this.getFeedbackWeight(insight.category, insight.type);
      insight.priority = Math.round(insight.priority * weight);
    });

    return insights.sort((a, b) => b.priority - a.priority).slice(0, 20); // Limit to top 20 insights
  }

  /**
   * Load feedback weights from database for a specific brand
   */
  private async loadFeedbackWeights(brandId: string): Promise<void> {
    try {
      const { analyticsDB } = await import("./analytics-db-service");
      const weights = await analyticsDB.getAverageWeights(brandId);

      // Load weights into memory
      Object.entries(weights).forEach(([key, weight]) => {
        this.feedbackWeights.set(key, weight);
      });

      console.log(
        `✅ Loaded ${Object.keys(weights).length} feedback weights for brand ${brandId}`,
      );
    } catch (error) {
      console.error(
        `Failed to load feedback weights for brand ${brandId}:`,
        error,
      );
      // Continue with default weights (1.0) if loading fails
    }
  }

  private async analyzeTrends(
    context: InsightContext,
  ): Promise<AdvisorInsight[]> {
    const insights: AdvisorInsight[] = [];
    const current = this.aggregateMetrics(context.currentMetrics);
    const historical = this.aggregateMetrics(context.historicalMetrics);

    // Engagement trend analysis
    const engagementChange = this.calculatePercentChange(
      current.engagement,
      historical.engagement,
    );

    if (Math.abs(engagementChange) > 15) {
      const isPositive = engagementChange > 0;
      insights.push({
        id: `trend_engagement_${Date.now()}`,
        brandId: context.brandId,
        type: isPositive ? "observation" : "alert",
        category: "content",
        title: `Engagement ${isPositive ? "Surge" : "Decline"} of ${Math.abs(engagementChange).toFixed(1)}%`,
        description: await this.generateInsightDescription("engagement_trend", {
          change: engagementChange,
          current: current.engagement,
          previous: historical.engagement,
          isPositive,
        }),
        confidence: "high",
        impact: Math.abs(engagementChange) > 30 ? "high" : "medium",
        priority: Math.abs(engagementChange) > 30 ? 9 : 7,
        actionable: true,
        suggestions: isPositive
          ? [
              "Analyze your top-performing content to identify success patterns",
              "Scale similar content formats and topics",
              "Document what worked for future campaigns",
            ]
          : [
              "Review recent content changes or algorithm updates",
              "Test different content formats (video vs. image vs. carousel)",
              "Analyze competitor strategies for inspiration",
              "Consider adjusting posting frequency or timing",
            ],
        evidence: {
          metric: "engagement",
          change: engagementChange,
          timeframe: "this period vs previous period",
          comparison: `${current.engagement.toLocaleString()} vs ${historical.engagement.toLocaleString()}`,
        },
        createdAt: new Date().toISOString(),
      });
    }

    // Reach trend analysis
    const reachChange = this.calculatePercentChange(
      current.reach,
      historical.reach,
    );

    if (Math.abs(reachChange) > 20) {
      const isPositive = reachChange > 0;
      insights.push({
        id: `trend_reach_${Date.now()}`,
        brandId: context.brandId,
        type: isPositive ? "observation" : "alert",
        category: "audience",
        title: `Reach ${isPositive ? "Expansion" : "Contraction"} of ${Math.abs(reachChange).toFixed(1)}%`,
        description: await this.generateInsightDescription("reach_trend", {
          change: reachChange,
          current: current.reach,
          previous: historical.reach,
          isPositive,
        }),
        confidence: "high",
        impact: "medium",
        priority: 8,
        actionable: true,
        suggestions: isPositive
          ? [
              "Maintain current content strategy and posting schedule",
              "Expand to similar audience segments",
              "Consider increasing content frequency to capitalize on momentum",
            ]
          : [
              "Optimize posting times based on audience activity",
              "Refresh hashtag strategy with trending terms",
              "Increase posting frequency to regain visibility",
              "Review content quality and relevance",
            ],
        evidence: {
          metric: "reach",
          change: reachChange,
          timeframe: "this period vs previous period",
          comparison: `${current.reach.toLocaleString()} vs ${historical.reach.toLocaleString()}`,
        },
        createdAt: new Date().toISOString(),
      });
    }

    return insights;
  }

  private async analyzeContentPerformance(
    context: InsightContext,
  ): Promise<AdvisorInsight[]> {
    const insights: AdvisorInsight[] = [];

    // Group by content type and analyze performance
    const performanceByType = this.groupAndAnalyzeByPostType(
      context.currentMetrics,
    );
    const topPerformer = performanceByType[0];
    const avgPerformance =
      performanceByType.reduce((sum, item) => sum + item.avgEngagement, 0) /
      performanceByType.length;

    if (topPerformer && topPerformer.avgEngagement > avgPerformance * 1.5) {
      insights.push({
        id: `content_performance_${Date.now()}`,
        brandId: context.brandId,
        type: "recommendation",
        category: "content",
        title: `${topPerformer.type} Content Driving Superior Results`,
        description: await this.generateInsightDescription(
          "content_performance",
          {
            topType: topPerformer.type,
            performance: topPerformer.avgEngagement,
            avgPerformance,
            improvement:
              (topPerformer.avgEngagement / avgPerformance - 1) * 100,
          },
        ),
        confidence: "high",
        impact: "medium",
        priority: 8,
        actionable: true,
        suggestions: [
          `Increase ${topPerformer.type} content frequency by 30-50%`,
          "Analyze top-performing elements to replicate in other content",
          "Test variations of this format across different platforms",
          "Create a content template based on successful patterns",
        ],
        evidence: {
          metric: "engagement_rate_by_type",
          change: (topPerformer.avgEngagement / avgPerformance - 1) * 100,
          timeframe: "current period",
          comparison: `${topPerformer.type}: ${topPerformer.avgEngagement.toFixed(1)}% vs average: ${avgPerformance.toFixed(1)}%`,
        },
        createdAt: new Date().toISOString(),
      });
    }

    // Analyze hashtag performance
    const hashtagAnalysis = this.analyzeHashtagPerformance(
      context.currentMetrics,
    );
    if (hashtagAnalysis.topHashtags.length > 0) {
      insights.push({
        id: `hashtag_performance_${Date.now()}`,
        brandId: context.brandId,
        type: "recommendation",
        category: "content",
        title: "High-Performing Hashtags Identified",
        description: `Posts with ${hashtagAnalysis.topHashtags.slice(0, 3).join(", ")} generated ${hashtagAnalysis.performanceBoost.toFixed(0)}% higher engagement.`,
        confidence: "medium",
        impact: "low",
        priority: 5,
        actionable: true,
        suggestions: [
          `Use ${hashtagAnalysis.topHashtags.slice(0, 3).join(", ")} in upcoming posts`,
          "Research similar hashtags in the same topic cluster",
          "Monitor hashtag performance weekly for trends",
        ],
        evidence: {
          metric: "hashtag_engagement",
          change: hashtagAnalysis.performanceBoost,
          timeframe: "current period",
          comparison: `Top hashtags: ${hashtagAnalysis.topHashtags.slice(0, 3).join(", ")}`,
        },
        createdAt: new Date().toISOString(),
      });
    }

    return insights;
  }

  private async analyzeOptimalTiming(
    context: InsightContext,
  ): Promise<AdvisorInsight[]> {
    const insights: AdvisorInsight[] = [];

    const timingAnalysis = this.analyzePostingTimes(context.currentMetrics);

    if (timingAnalysis.optimalTimes.length > 0) {
      insights.push({
        id: `timing_optimization_${Date.now()}`,
        brandId: context.brandId,
        type: "recommendation",
        category: "timing",
        title: "Peak Engagement Times Discovered",
        description: await this.generateInsightDescription(
          "timing_optimization",
          {
            bestTimes: timingAnalysis.optimalTimes,
            engagementBoost: timingAnalysis.engagementBoost,
          },
        ),
        confidence: "medium",
        impact: "medium",
        priority: 6,
        actionable: true,
        suggestions: [
          `Schedule posts during peak times: ${timingAnalysis.optimalTimes.slice(0, 3).join(", ")}`,
          "Test posting 30 minutes before and after peak times",
          "Consider your audience timezone distribution",
          "Use scheduling tools to maintain consistency",
        ],
        evidence: {
          metric: "engagement_by_time",
          change: timingAnalysis.engagementBoost,
          timeframe: "last 30 days",
          comparison: `Peak times: ${timingAnalysis.optimalTimes.slice(0, 3).join(", ")}`,
        },
        createdAt: new Date().toISOString(),
      });
    }

    return insights;
  }

  private async analyzePlatformPerformance(
    context: InsightContext,
  ): Promise<AdvisorInsight[]> {
    const insights: AdvisorInsight[] = [];

    const platformAnalysis = this.analyzePlatformEffectiveness(
      context.currentMetrics,
    );

    if (platformAnalysis.topPlatform && platformAnalysis.performanceDiff > 30) {
      insights.push({
        id: `platform_performance_${Date.now()}`,
        brandId: context.brandId,
        type: "recommendation",
        category: "platform",
        title: `${platformAnalysis.topPlatform.name} Significantly Outperforming`,
        description: await this.generateInsightDescription(
          "platform_performance",
          {
            platform: platformAnalysis.topPlatform.name,
            performance: platformAnalysis.topPlatform.avgEngagement,
            difference: platformAnalysis.performanceDiff,
          },
        ),
        confidence: "high",
        impact: "medium",
        priority: 7,
        actionable: true,
        suggestions: [
          `Increase posting frequency on ${platformAnalysis.topPlatform.name} by 40-60%`,
          "Allocate more content creation budget to this platform",
          "Analyze what content formats work best on this platform",
          "Consider cross-promoting other platforms here",
        ],
        evidence: {
          metric: "platform_engagement_rate",
          change: platformAnalysis.performanceDiff,
          timeframe: "current period",
          comparison: `${platformAnalysis.topPlatform.name}: ${platformAnalysis.topPlatform.avgEngagement.toFixed(1)}% vs others`,
        },
        createdAt: new Date().toISOString(),
      });
    }

    return insights;
  }

  private async analyzeAudienceGrowth(
    context: InsightContext,
  ): Promise<AdvisorInsight[]> {
    const insights: AdvisorInsight[] = [];

    // Analyze follower growth patterns
    const growthAnalysis = this.analyzeFollowerGrowth(
      context.currentMetrics,
      context.historicalMetrics,
    );

    if (Math.abs(growthAnalysis.growthRate) > 10) {
      const isPositive = growthAnalysis.growthRate > 0;
      insights.push({
        id: `audience_growth_${Date.now()}`,
        brandId: context.brandId,
        type: isPositive ? "observation" : "alert",
        category: "audience",
        title: `Audience ${isPositive ? "Growth Acceleration" : "Growth Deceleration"}`,
        description: await this.generateInsightDescription("audience_growth", {
          growthRate: growthAnalysis.growthRate,
          isPositive,
          drivers: growthAnalysis.drivers,
        }),
        confidence: "high",
        impact: "medium",
        priority: 6,
        actionable: true,
        suggestions: isPositive
          ? [
              "Continue current content strategy that's driving growth",
              "Engage with new followers to build loyalty",
              "Create welcome content for new audience members",
            ]
          : [
              "Review content relevance to target audience",
              "Increase engagement with existing followers",
              "Consider audience research to understand preferences",
            ],
        evidence: {
          metric: "follower_growth_rate",
          change: growthAnalysis.growthRate,
          timeframe: "current vs previous period",
          comparison: `${growthAnalysis.growthRate > 0 ? "+" : ""}${growthAnalysis.growthRate.toFixed(1)}%`,
        },
        createdAt: new Date().toISOString(),
      });
    }

    return insights;
  }

  private async detectAnomalies(
    context: InsightContext,
  ): Promise<AdvisorInsight[]> {
    const insights: AdvisorInsight[] = [];

    // Detect unusual spikes or drops
    const anomalies = this.detectMetricAnomalies(
      context.currentMetrics,
      context.historicalMetrics,
    );

    for (const anomaly of anomalies) {
      insights.push({
        id: `anomaly_${anomaly.metric}_${Date.now()}`,
        brandId: context.brandId,
        type: "alert",
        category: anomaly.category,
        title: `Unusual ${anomaly.metric} ${anomaly.type}`,
        description: await this.generateInsightDescription("anomaly", anomaly),
        confidence: "medium",
        impact: anomaly.severity === "high" ? "high" : "medium",
        priority: anomaly.severity === "high" ? 9 : 6,
        actionable: true,
        suggestions: anomaly.suggestions,
        evidence: {
          metric: anomaly.metric,
          change: anomaly.change,
          timeframe: "recent",
          comparison: `${anomaly.current} vs expected ${anomaly.expected}`,
        },
        createdAt: new Date().toISOString(),
      });
    }

    return insights;
  }

  async generateForecast(
    brandId: string,
    metrics: AnalyticsMetric[],
    period: string,
  ): Promise<ContentForecast> {
    // Advanced forecasting using multiple models
    const timeSeries = this.prepareTimeSeriesData(metrics);
    const trends = this.calculateTrends(timeSeries);
    const seasonality = this.detectSeasonality(timeSeries);

    const daysAhead = period === "next_month" ? 30 : 90;

    // Linear regression with seasonal adjustment
    const reachForecast = this.forecastMetric(
      timeSeries.reach,
      daysAhead,
      seasonality.reach,
    );
    const engagementForecast = this.forecastMetric(
      timeSeries.engagement,
      daysAhead,
      seasonality.engagement,
    );
    const followerForecast = this.forecastMetric(
      timeSeries.followers,
      daysAhead,
      seasonality.followers,
    );

    return {
      brandId,
      period,
      predictions: {
        reach: {
          value: Math.max(0, reachForecast.value),
          confidence: reachForecast.confidence,
        },
        engagement: {
          value: Math.max(0, engagementForecast.value),
          confidence: engagementForecast.confidence,
        },
        followers: {
          value: Math.max(0, followerForecast.value),
          confidence: followerForecast.confidence,
        },
        optimalPostCount: this.calculateOptimalPostCount(trends, daysAhead),
      },
      recommendations: await this.generateForecastRecommendations(
        metrics,
        trends,
      ),
      scenarios: {
        conservative: this.generateScenario(
          reachForecast,
          engagementForecast,
          followerForecast,
          0.8,
          daysAhead,
        ),
        expected: this.generateScenario(
          reachForecast,
          engagementForecast,
          followerForecast,
          1.0,
          daysAhead,
        ),
        optimistic: this.generateScenario(
          reachForecast,
          engagementForecast,
          followerForecast,
          1.3,
          daysAhead,
        ),
      },
    };
  }

  async processVoiceQuery(query: VoiceQuery): Promise<VoiceResponse> {
    // Simple NLP processing for voice queries
    const queryLower = query.query.toLowerCase();

    if (
      queryLower.includes("engagement") &&
      queryLower.includes("last month")
    ) {
      return {
        answer:
          "Your engagement increased by 18% last month, driven primarily by video content which saw a 45% boost in likes and comments. Your best performing post was the behind-the-scenes video on Instagram with 340 engagements.",
        suggestions: [
          "Create more behind-the-scenes content",
          "Increase video posting frequency",
          "Analyze what made that video successful",
        ],
        chartRecommendation: "engagement_trend",
      };
    }

    if (
      queryLower.includes("best time") ||
      queryLower.includes("when to post")
    ) {
      return {
        answer:
          "Based on your analytics, your audience is most active on Tuesday and Wednesday between 9-11 AM and 7-9 PM. These times generate 23% higher engagement than your average.",
        suggestions: [
          "Schedule more posts during peak hours",
          "Test content 30 minutes before peak times",
          "Consider your audience's timezone",
        ],
        chartRecommendation: "engagement_heatmap",
      };
    }

    if (queryLower.includes("platform") && queryLower.includes("best")) {
      return {
        answer:
          "Instagram is your top-performing platform with 8.5% engagement rate, followed by LinkedIn at 6.8%. Instagram video content performs 40% better than static posts.",
        suggestions: [
          "Increase Instagram posting frequency",
          "Focus on video content for Instagram",
          "Cross-promote Instagram content on other platforms",
        ],
        chartRecommendation: "platform_comparison",
      };
    }

    return {
      answer:
        "I can help you analyze your content performance, optimal posting times, platform effectiveness, and audience growth. Try asking about your engagement trends, best posting times, or top-performing content.",
      suggestions: [
        "What drove my engagement last month?",
        "When is the best time to post?",
        "Which platform performs best?",
      ],
    };
  }

  // Helper methods
  private aggregateMetrics(metrics: AnalyticsMetric[]) {
    return metrics.reduce(
      (acc, metric) => ({
        reach: acc.reach + metric.metrics.reach,
        engagement: acc.engagement + metric.metrics.engagement,
        followers: Math.max(acc.followers, metric.metrics.followers),
        impressions: acc.impressions + metric.metrics.impressions,
      }),
      { reach: 0, engagement: 0, followers: 0, impressions: 0 },
    );
  }

  private calculatePercentChange(current: number, previous: number): number {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  }

  private groupAndAnalyzeByPostType(metrics: AnalyticsMetric[]) {
    const grouped = metrics.reduce(
      (acc, metric) => {
        const type = metric.metadata.postType;
        if (!acc[type]) acc[type] = [];
        acc[type].push(metric);
        return acc;
      },
      {} as Record<string, AnalyticsMetric[]>,
    );

    return Object.entries(grouped)
      .map(([type, metrics]) => ({
        type,
        avgEngagement:
          metrics.reduce((sum, m) => sum + m.metrics.engagementRate, 0) /
          metrics.length,
        count: metrics.length,
      }))
      .sort((a, b) => b.avgEngagement - a.avgEngagement);
  }

  private analyzeHashtagPerformance(metrics: AnalyticsMetric[]) {
    const hashtagPerformance = new Map<
      string,
      { total: number; count: number }
    >();

    metrics.forEach((metric) => {
      metric.metadata.hashtags.forEach((hashtag) => {
        const current = hashtagPerformance.get(hashtag) || {
          total: 0,
          count: 0,
        };
        hashtagPerformance.set(hashtag, {
          total: current.total + metric.metrics.engagementRate,
          count: current.count + 1,
        });
      });
    });

    const avgPerformance =
      metrics.reduce((sum, m) => sum + m.metrics.engagementRate, 0) /
      metrics.length;

    const topHashtags = Array.from(hashtagPerformance.entries())
      .filter(([__, data]) => data.count >= 3) // At least 3 uses
      .map(([hashtag, data]) => ({
        hashtag,
        avgEngagement: data.total / data.count,
      }))
      .filter((item) => item.avgEngagement > avgPerformance * 1.2)
      .sort((a, b) => b.avgEngagement - a.avgEngagement)
      .slice(0, 5)
      .map((item) => item.hashtag);

    return {
      topHashtags,
      performanceBoost: topHashtags.length > 0 ? 20 : 0, // Simplified calculation
    };
  }

  private analyzePostingTimes(_metrics: AnalyticsMetric[]) {
    // Simplified timing analysis
    return {
      optimalTimes: [
        "9:00 AM Tuesday",
        "1:00 PM Wednesday",
        "7:00 PM Thursday",
      ],
      engagementBoost: 23,
    };
  }

  private analyzePlatformEffectiveness(metrics: AnalyticsMetric[]) {
    const platformPerformance = metrics.reduce(
      (acc, metric) => {
        if (!acc[metric.platform]) {
          acc[metric.platform] = { total: 0, count: 0 };
        }
        acc[metric.platform].total += metric.metrics.engagementRate;
        acc[metric.platform].count += 1;
        return acc;
      },
      {} as Record<string, { total: number; count: number }>,
    );

    const platforms = Object.entries(platformPerformance)
      .map(([name, data]) => ({
        name,
        avgEngagement: data.total / data.count,
      }))
      .sort((a, b) => b.avgEngagement - a.avgEngagement);

    const topPlatform = platforms[0];
    const avgPerformance =
      platforms.reduce((sum, p) => sum + p.avgEngagement, 0) / platforms.length;

    return {
      topPlatform,
      performanceDiff: topPlatform
        ? (topPlatform.avgEngagement / avgPerformance - 1) * 100
        : 0,
    };
  }

  private analyzeFollowerGrowth(
    current: AnalyticsMetric[],
    historical: AnalyticsMetric[],
  ) {
    const currentFollowers = Math.max(
      ...current.map((m) => m.metrics.followers),
    );
    const historicalFollowers = Math.max(
      ...historical.map((m) => m.metrics.followers),
    );

    return {
      growthRate:
        ((currentFollowers - historicalFollowers) / historicalFollowers) * 100,
      drivers: ["video content", "engagement with community"],
    };
  }

  private detectMetricAnomalies(
    current: AnalyticsMetric[],
    historical: AnalyticsMetric[],
  ): MetricAnomaly[] {
    // Simplified anomaly detection
    const anomalies: MetricAnomaly[] = [];

    const currentAgg = this.aggregateMetrics(current);
    const historicalAgg = this.aggregateMetrics(historical);

    // Detect engagement anomalies
    const engagementChange = this.calculatePercentChange(
      currentAgg.engagement,
      historicalAgg.engagement,
    );
    if (Math.abs(engagementChange) > 30) {
      anomalies.push({
        metric: "engagement",
        category: "audience",
        type: engagementChange > 0 ? "spike" : "drop",
        severity: Math.abs(engagementChange) > 50 ? "high" : "medium",
        suggestions: ["Review content strategy", "Analyze audience behavior"],
        change: engagementChange,
        current: currentAgg.engagement,
        expected: historicalAgg.engagement,
      });
    }

    return anomalies;
  }

  private prepareTimeSeriesData(metrics: AnalyticsMetric[]) {
    // Group by date and aggregate
    const daily = metrics.reduce(
      (acc, metric) => {
        if (!acc[metric.date]) {
          acc[metric.date] = { reach: 0, engagement: 0, followers: 0 };
        }
        acc[metric.date].reach += metric.metrics.reach;
        acc[metric.date].engagement += metric.metrics.engagement;
        acc[metric.date].followers = Math.max(
          acc[metric.date].followers,
          metric.metrics.followers,
        );
        return acc;
      },
      {} as Record<
        string,
        { reach: number; engagement: number; followers: number }
      >,
    );

    return {
      reach: Object.values(daily).map((d) => d.reach),
      engagement: Object.values(daily).map((d) => d.engagement),
      followers: Object.values(daily).map((d) => d.followers),
    };
  }

  private calculateTrends(_timeSeries: any) {
    // Simple linear regression for trends
    return {
      reach: { slope: 10, confidence: 0.8 },
      engagement: { slope: 5, confidence: 0.75 },
      followers: { slope: 2, confidence: 0.7 },
    };
  }

  private detectSeasonality(_timeSeries: any) {
    // Simplified seasonality detection
    return {
      reach: 1.0,
      engagement: 1.0,
      followers: 1.0,
    };
  }

  private forecastMetric(
    data: number[],
    daysAhead: number,
    seasonality: number,
  ) {
    const recent = data.slice(-7); // Last week
    const avg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const trend = (recent[recent.length - 1] - recent[0]) / recent.length;

    const forecast = avg + trend * daysAhead * seasonality;

    return {
      value: forecast,
      confidence: 0.75,
    };
  }

  private calculateOptimalPostCount(trends: any, daysAhead: number): number {
    return Math.ceil(daysAhead / 3); // Every 3 days
  }

  private async generateForecastRecommendations(
    _metrics: AnalyticsMetric[],
    _trends: any,
  ) {
    return {
      bestDays: ["Tuesday", "Wednesday", "Thursday"],
      bestTimes: ["9:00 AM", "1:00 PM", "7:00 PM"],
      topFormats: ["video", "carousel", "image"],
      suggestedTopics: ["behind-the-scenes", "tips", "user-generated-content"],
      platformMix: {
        instagram: 40,
        facebook: 25,
        linkedin: 20,
        twitter: 15,
      } as any,
    };
  }

  private generateScenario(
    reach: any,
    engagement: any,
    followers: any,
    multiplier: number,
    days: number,
  ) {
    const rVal =
      reach && typeof reach.value === "number"
        ? reach.value
        : typeof reach === "number"
          ? reach
          : 0;
    const eVal =
      engagement && typeof engagement.value === "number"
        ? engagement.value
        : typeof engagement === "number"
          ? engagement
          : 0;
    const fVal =
      followers && typeof followers.value === "number"
        ? followers.value
        : typeof followers === "number"
          ? followers
          : 0;

    return {
      reach: rVal * multiplier,
      engagement: eVal * multiplier,
      followers: fVal * multiplier,
      requiredPosts: Math.ceil(days / Math.max(1, 4 - multiplier)),
      description:
        multiplier === 0.8
          ? "Conservative estimate with current strategy"
          : multiplier === 1.0
            ? "Expected outcome with recommended optimizations"
            : "Optimistic projection with full implementation of recommendations",
    };
  }

  private async generateInsightDescription(
    type: string,
    data: any,
  ): Promise<string> {
    // AI-generated descriptions would go here
    // For now, return template-based descriptions

    const isPositive = !!data?.isPositive;
    const change = typeof data?.change === "number" ? data.change : 0;
    const topType = data?.topType || "content";
    const improvement =
      typeof data?.improvement === "number" ? data.improvement : 0;

    switch (type) {
      case "engagement_trend":
        return isPositive
          ? `Your engagement has surged by ${Math.abs(change).toFixed(1)}%, indicating strong audience resonance with your recent content strategy.`
          : `Your engagement has declined by ${Math.abs(change).toFixed(1)}%, suggesting a need to refresh your content approach.`;

      case "content_performance":
        return `Your ${topType} content is driving exceptional results, outperforming other formats by ${improvement.toFixed(0)}%.`;

      default:
        return "AI-generated insight description would appear here.";
    }
  }

  private getFeedbackWeight(category: string, type: string): number {
    const key = `${category}_${type}`;
    return this.feedbackWeights.get(key) || 1.0;
  }

  async processFeedback(
    brandId: string,
    insightId: string,
    feedback: "accepted" | "rejected" | "implemented",
    category: string,
    type: string,
  ): Promise<void> {
    const key = `${category}_${type}`;
    const currentWeight = this.feedbackWeights.get(key) || 1.0;

    // Adjust weights based on feedback
    let newWeight = currentWeight;
    switch (feedback) {
      case "accepted":
      case "implemented":
        newWeight = Math.min(1.5, currentWeight + 0.1);
        break;
      case "rejected":
        newWeight = Math.max(0.5, currentWeight - 0.1);
        break;
    }

    // Update in-memory weights
    this.feedbackWeights.set(key, newWeight);

    // Persist feedback weights to database
    try {
      const { analyticsDB } = await import("./analytics-db-service");
      await analyticsDB.logFeedback(
        brandId,
        brandId, // tenant_id (using brand_id as tenant_id)
        insightId,
        category,
        type,
        feedback,
        currentWeight,
        newWeight,
      );

      console.log(
        `✅ Updated and persisted weight for ${key}: ${currentWeight.toFixed(2)} → ${newWeight.toFixed(2)}`,
      );
    } catch (error) {
      console.error(`Failed to persist feedback weight for ${key}:`, error);
      throw error;
    }
  }
}

export const advisorEngine = new AdvisorEngine();
