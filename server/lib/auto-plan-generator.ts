/**
 * Monthly Auto-Plan Generator
 * Generates content plans based on analytics insights, brand guide, and AI recommendations
 */

import { analyticsDB } from "./analytics-db-service";
import { advisorEngine } from "./advisor-engine";
import { getCurrentBrandGuide } from "./brand-guide-service";
import { getBrandContext } from "./brand-context";
import { generateWithAI } from "../workers/ai-generation";
import { buildFullBrandGuidePrompt } from "./prompts/brand-guide-prompts";
import { logger } from "./logger";

export interface AutoPlanData {
  month: string;
  topics: string[];
  formats: string[];
  bestTimes: string[];
  platformMix: Record<string, number>;
  recommendedPostCount: number;
  contentCalendar: {
    week: number;
    topics: string[];
    platforms: string[];
  }[];
  confidence: number;
  notes: string[];
}

export class AutoPlanGenerator {
  /**
   * Generate monthly content plan for a brand
   * ✅ FIX: Now integrates brand guide and uses AI for plan generation
   */
  async generateMonthlyPlan(
    brandId: string,
    tenantId: string,
    month?: Date,
  ): Promise<AutoPlanData> {
    const planMonth = month || new Date();
    const monthStart = new Date(
      planMonth.getFullYear(),
      planMonth.getMonth(),
      1,
    );
    const monthEnd = new Date(
      planMonth.getFullYear(),
      planMonth.getMonth() + 1,
      0,
    );

    // ✅ BRAND GUIDE: Load brand guide (source of truth)
    const brandGuide = await getCurrentBrandGuide(brandId);
    const brand = await getBrandContext(brandId);

    // Get metrics for the past 90 days for analysis
    const metrics = await analyticsDB.getMetricsByDateRange(
      brandId,
      undefined,
      new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      undefined,
      1000,
    );

    if (metrics.length === 0) {
      return this.generateDefaultPlan(monthStart, 0.5, brandGuide);
    }

    // Convert to advisor format
    const formattedMetrics = metrics.map((m) => ({
      id: m.id,
      brandId: m.brand_id,
      platform: m.platform as unknown,
      postId: m.post_id,
      date: m.date,
      metrics: m.metrics,
      metadata: m.metadata,
      createdAt: m.created_at,
      updatedAt: m.updated_at,
    })) as unknown[];

    // Generate forecast for the month
    const forecast = await advisorEngine.generateForecast(
      brandId,
      formattedMetrics as any,
      "next_month",
    );

    // Generate insights for topics and formats
    const insights = await advisorEngine.generateInsights({
      brandId,
      currentMetrics: formattedMetrics as any,
      historicalMetrics: (formattedMetrics.slice(
        0,
        Math.floor(formattedMetrics.length / 2),
      ) as any),
      goals: [],
      userFeedback: [],
    });

    // ✅ AI + BRAND GUIDE: Generate topics using AI with brand guide context
    const topics = await this.generateTopicsWithAI(
      brandGuide,
      brand,
      insights,
      formattedMetrics.length,
    );

    const formats = forecast.recommendations?.topFormats || [
      "video",
      "carousel",
      "image",
    ];
    const bestTimes = forecast.recommendations?.bestTimes || [
      "9:00 AM",
      "1:00 PM",
      "7:00 PM",
    ];
    const platformMix = forecast.recommendations?.platformMix || {
      instagram: 40,
      facebook: 25,
      linkedin: 20,
      twitter: 15,
    };

    // Calculate optimal post count for the month
    const daysInMonth = monthEnd.getDate();
    const recommendedPostCount =
      forecast.predictions?.optimalPostCount || Math.ceil(daysInMonth / 3);

    // Create content calendar
    const contentCalendar = this.createContentCalendar(
      daysInMonth,
      topics,
      Object.keys(platformMix),
      recommendedPostCount,
    );

    const plan: AutoPlanData = {
      month: monthStart.toISOString().split("T")[0],
      topics,
      formats: formats.slice(0, 3),
      bestTimes: bestTimes.slice(0, 3),
      platformMix,
      recommendedPostCount,
      contentCalendar,
      confidence: forecast.predictions?.reach?.confidence || 0.75,
      notes: [
        `Based on ${formattedMetrics.length} data points from the past 90 days`,
        brandGuide ? `Aligned with brand guide content pillars` : `Using analytics-based recommendations`,
        `Recommended posting frequency: ${(recommendedPostCount / (daysInMonth / 7)).toFixed(1)} posts per week`,
        `Focus on ${topics[0] || "varied content"} for maximum engagement`,
        `Best performing platform: ${Object.entries(platformMix).sort(([, a], [, b]) => b - a)[0]?.[0] || "Instagram"}`,
      ],
    };

    return plan;
  }

  /**
   * ✅ NEW: Generate topics using AI with brand guide context
   */
  private async generateTopicsWithAI(
    brandGuide: any,
    brand: any,
    insights: unknown[],
    dataPointCount: number,
  ): Promise<string[]> {
    try {
      // Build AI prompt with brand guide + analytics insights
      let prompt = `You are a content strategist. Generate 5-7 content topic recommendations for a monthly content plan.\n\n`;

      // ✅ BRAND GUIDE: Include brand guide data
      if (brandGuide) {
        prompt += buildFullBrandGuidePrompt(brandGuide);
        prompt += `\n\n`;
      } else if (brand) {
        prompt += `## Brand Context\n`;
        prompt += `Name: ${brand.name}\n`;
        if (brand.targetAudience) {
          prompt += `Target Audience: ${brand.targetAudience}\n`;
        }
        if (brand.values && brand.values.length > 0) {
          prompt += `Values: ${brand.values.join(", ")}\n`;
        }
        prompt += `\n`;
      }

      // Include analytics insights
      prompt += `## Analytics Insights\n`;
      prompt += `Based on ${dataPointCount} data points from the past 90 days:\n`;
      const contentInsights = insights.filter((i: any) => i.category === "content");
      if (contentInsights.length > 0) {
        contentInsights.slice(0, 3).forEach((insight: any) => {
          prompt += `- ${insight.title}: ${insight.body}\n`;
        });
      } else {
        prompt += `- No specific content insights available\n`;
      }

      // ✅ BRAND GUIDE: Use content pillars if available
      if (brandGuide?.contentRules?.contentPillars && brandGuide.contentRules.contentPillars.length > 0) {
        prompt += `\n## Content Pillars (MUST USE)\n`;
        prompt += `The brand has defined these content pillars: ${brandGuide.contentRules.contentPillars.join(", ")}\n`;
        prompt += `Generate topics that align with these pillars.\n`;
      }

      prompt += `\n## Requirements\n`;
      prompt += `- Generate 5-7 specific, actionable content topics\n`;
      prompt += `- Topics should align with brand guide (if provided)\n`;
      prompt += `- Topics should be relevant to target audience\n`;
      prompt += `- Topics should be varied (mix of educational, promotional, behind-the-scenes, etc.)\n`;
      prompt += `- Return as JSON array: ["topic1", "topic2", "topic3", ...]\n`;

      // Call AI to generate topics
      const provider = process.env.AI_PROVIDER === "anthropic" ? "claude" : "openai";
      logger.info("Generating content topics with AI", { brandId: brand?.id, provider });
      
      const result = await generateWithAI(prompt, "advisor", provider);

      // Parse JSON response
      try {
        const jsonMatch = result.content.match(/\[[\s\S]*?\]/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (Array.isArray(parsed) && parsed.length > 0) {
            logger.info("AI-generated topics", { count: parsed.length, topics: parsed });
            return parsed.slice(0, 7); // Return up to 7 topics
          }
        }
      } catch (parseError) {
        logger.warn("Failed to parse AI topic response, falling back to insights", {
          error: parseError instanceof Error ? parseError.message : String(parseError),
        });
      }
    } catch (error) {
      logger.error("AI topic generation failed, falling back to insights", error instanceof Error ? error : new Error(String(error)));
    }

    // Fallback: Extract topics from insights
    return this.extractTopicsFromInsights(insights);
  }

  /**
   * Extract topics from advisor insights
   */
  private extractTopicsFromInsights(insights: unknown[]): string[] {
    const topicInsights = insights.filter((i: unknown) => (i as any).category === "content");
    const topics = new Set<string>();

    topicInsights.forEach((insight) => {
      const i = insight as any; // ✅ Type assertion for insight object
      if (i.suggestions) {
        i.suggestions.forEach((suggestion: string) => {
          // Extract topics from suggestions
          if (suggestion.includes("behind-the-scenes"))
            topics.add("behind-the-scenes");
          if (suggestion.includes("tips")) topics.add("tips");
          if (suggestion.includes("user-generated"))
            topics.add("user-generated-content");
          if (suggestion.includes("case study")) topics.add("case-studies");
          if (suggestion.includes("tutorial")) topics.add("tutorials");
          if (suggestion.includes("news")) topics.add("industry-news");
        });
      }
    });

    // Return top topics or defaults
    const topicsArray = Array.from(topics);
    return topicsArray.length > 0
      ? topicsArray.slice(0, 5)
      : ["behind-the-scenes", "tips", "user-generated-content"];
  }

  /**
   * Create content calendar for the month
   */
  private createContentCalendar(
    daysInMonth: number,
    topics: string[],
    platforms: string[],
    postCount: number,
  ): AutoPlanData["contentCalendar"] {
    const calendar: AutoPlanData["contentCalendar"] = [];
    const weeksInMonth = Math.ceil(daysInMonth / 7);
    const postsPerWeek = Math.ceil(postCount / weeksInMonth);

    for (let week = 1; week <= weeksInMonth; week++) {
      const weekTopics =
        topics.length > 0 ? [topics[(week - 1) % topics.length]] : ["general"];
      const weekPlatforms = this.selectPlatformsForWeek(
        week,
        platforms,
        postsPerWeek,
      );

      calendar.push({
        week,
        topics: weekTopics,
        platforms: weekPlatforms,
      });
    }

    return calendar;
  }

  /**
   * Select platforms for a specific week
   */
  private selectPlatformsForWeek(
    week: number,
    allPlatforms: string[],
    postsPerWeek: number,
  ): string[] {
    if (allPlatforms.length === 0) {
      return ["instagram", "facebook", "linkedin"].slice(0, postsPerWeek);
    }

    const selected: string[] = [];
    for (let i = 0; i < Math.min(postsPerWeek, allPlatforms.length); i++) {
      selected.push(allPlatforms[(week + i) % allPlatforms.length]);
    }
    return selected;
  }

  /**
   * Generate default plan when no data available
   * ✅ FIX: Now uses brand guide content pillars if available
   */
  private generateDefaultPlan(month: Date, confidence: number, brandGuide?: any): AutoPlanData {
    const daysInMonth = new Date(
      month.getFullYear(),
      month.getMonth() + 1,
      0,
    ).getDate();

    // ✅ BRAND GUIDE: Use content pillars if available
    let defaultTopics = ["behind-the-scenes", "tips", "user-generated-content"];
    if (brandGuide?.contentRules?.contentPillars && brandGuide.contentRules.contentPillars.length > 0) {
      defaultTopics = brandGuide.contentRules.contentPillars.slice(0, 5);
    }

    return {
      month: month.toISOString().split("T")[0],
      topics: defaultTopics,
      formats: ["video", "carousel", "image"],
      bestTimes: ["9:00 AM", "1:00 PM", "7:00 PM"],
      platformMix: {
        instagram: 40,
        facebook: 25,
        linkedin: 20,
        twitter: 15,
      },
      recommendedPostCount: Math.ceil(daysInMonth / 3),
      contentCalendar: [
        {
          week: 1,
          topics: [defaultTopics[0] || "general"],
          platforms: ["instagram", "facebook"],
        },
        {
          week: 2,
          topics: [defaultTopics[1] || defaultTopics[0] || "general"],
          platforms: ["linkedin", "facebook"],
        },
        {
          week: 3,
          topics: [defaultTopics[2] || defaultTopics[0] || "general"],
          platforms: ["instagram", "twitter"],
        },
        {
          week: 4,
          topics: [defaultTopics[0] || "general"],
          platforms: ["instagram", "linkedin"],
        },
      ],
      confidence,
      notes: [
        "Default plan generated - insufficient historical data",
        brandGuide ? "Using brand guide content pillars" : "Update this plan as you collect more analytics data",
        "Recommended posting frequency: ~3 posts per week",
        "Rotate between platforms for maximum audience reach",
      ],
    };
  }

  /**
   * Approve and publish a plan
   */
  async approvePlan(
    brandId: string,
    tenantId: string,
    planId: string,
    userId: string,
  ): Promise<unknown> {
    const { supabase } = await import("./supabase");

    const { data, error } = await supabase
      .from("auto_plans")
      .update({
        approved: true,
        approved_at: new Date().toISOString(),
        approved_by: userId,
      })
      .eq("id", planId)
      .eq("brand_id", brandId)
      .select()
      .single();

    if (error) throw new Error(`Failed to approve plan: ${error.message}`);
    return data;
  }

  /**
   * Get plan history for a brand
   */
  async getPlanHistory(brandId: string, limit: number = 12): Promise<unknown[]> {
    const { supabase } = await import("./supabase");

    const { data, error } = await supabase
      .from("auto_plans")
      .select("*")
      .eq("brand_id", brandId)
      .order("month", { ascending: false })
      .limit(limit);

    if (error)
      throw new Error(`Failed to fetch plan history: ${error.message}`);
    return data || [];
  }

  /**
   * Get current month's plan
   */
  async getCurrentMonthPlan(brandId: string): Promise<unknown | null> {
    const { supabase } = await import("./supabase");

    const monthStart = new Date();
    monthStart.setDate(1);
    const monthStr = monthStart.toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("auto_plans")
      .select("*")
      .eq("brand_id", brandId)
      .eq("month", monthStr)
      .single();

    if (error && error.code !== "PGRST116") {
      throw new Error(`Failed to fetch plan: ${error.message}`);
    }

    return data || null;
  }
}

export const autoPlanGenerator = new AutoPlanGenerator();
