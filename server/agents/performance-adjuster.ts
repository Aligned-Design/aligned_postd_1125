/**
 * Performance Adjustment Engine
 *
 * Automatically adjusts posting frequency based on performance metrics
 *
 * Rules:
 * - Engagement ↑ > 25% → Add +1 post/week on top 2 channels
 * - Engagement ↓ > 20% → Reduce by 1 post/week; focus quality
 * - Growth flat 2+ months → Shift mix: 60% awareness → 40% conversion
 * - Failed posts > 2x/month → Auto-audit integrations
 */

import {
  PerformanceAdjustment,
  PERFORMANCE_ADJUSTMENT_RULES,
  BrandPostingConfig,
  Platform,
} from "../../client/types/content-quota";

interface PerformanceData {
  brand_id: string;
  platform: Platform;
  current_month: {
    posts_count: number;
    avg_engagement_rate: number;
    follower_growth: number;
    failed_posts: number;
  };
  previous_month: {
    posts_count: number;
    avg_engagement_rate: number;
    follower_growth: number;
    failed_posts: number;
  };
  two_months_ago?: {
    follower_growth: number;
  };
}

interface AdjustmentResult {
  should_adjust: boolean;
  adjustments: Array<{
    condition: string;
    action: string;
    platform?: Platform;
    details: string;
    new_posts_per_week?: number;
    new_funnel_mix?: { top: number; mid: number; bottom: number };
  }>;
}

/**
 * Analyze performance and determine if adjustments are needed
 */
export async function analyzePerformance(
  performanceData: PerformanceData[],
  currentConfig: BrandPostingConfig,
): Promise<AdjustmentResult> {
  const adjustments: AdjustmentResult["adjustments"] = [];

  for (const data of performanceData) {
    // Rule 1: Engagement Up > 25%
    const engagementChange =
      (data.current_month.avg_engagement_rate -
        data.previous_month.avg_engagement_rate) /
      Math.max(data.previous_month.avg_engagement_rate, 0.001);

    if (engagementChange > 0.25) {
      adjustments.push({
        condition: "engagement_up",
        action: "increase_frequency",
        platform: data.platform,
        details: `${data.platform}: Engagement up ${Math.round(engagementChange * 100)}% → Add +1 post/week`,
        new_posts_per_week:
          getPlatformPostsPerWeek(currentConfig, data.platform) + 1,
      });
    }

    // Rule 2: Engagement Down > 20%
    if (engagementChange < -0.2) {
      adjustments.push({
        condition: "engagement_down",
        action: "decrease_frequency",
        platform: data.platform,
        details: `${data.platform}: Engagement down ${Math.abs(Math.round(engagementChange * 100))}% → Reduce by 1 post/week; focus quality`,
        new_posts_per_week: Math.max(
          getPlatformPostsPerWeek(currentConfig, data.platform) - 1,
          1,
        ),
      });
    }

    // Rule 3: Growth Flat for 2+ Months
    if (
      data.two_months_ago &&
      Math.abs(data.current_month.follower_growth) < 10 &&
      Math.abs(data.previous_month.follower_growth) < 10 &&
      Math.abs(data.two_months_ago.follower_growth) < 10
    ) {
      adjustments.push({
        condition: "growth_flat",
        action: "shift_mix",
        platform: data.platform,
        details: `${data.platform}: Follower growth flat for 2+ months → Shift mix to 60% awareness, 40% conversion`,
        new_funnel_mix: { top: 0.6, mid: 0.0, bottom: 0.4 },
      });
    }

    // Rule 4: Failed Posts > 2x/month
    if (data.current_month.failed_posts > 2) {
      adjustments.push({
        condition: "failed_posts",
        action: "audit_integrations",
        platform: data.platform,
        details: `${data.platform}: ${data.current_month.failed_posts} failed posts this month → Auto-audit integration and flag for review`,
      });
    }
  }

  // Rank platforms by performance (for "top 2 performing channels")
  const topPerformers = performanceData
    .sort((a, b) => {
      const aChange =
        (a.current_month.avg_engagement_rate -
          a.previous_month.avg_engagement_rate) /
        Math.max(a.previous_month.avg_engagement_rate, 0.001);
      const bChange =
        (b.current_month.avg_engagement_rate -
          b.previous_month.avg_engagement_rate) /
        Math.max(b.previous_month.avg_engagement_rate, 0.001);
      return bChange - aChange;
    })
    .slice(0, 2)
    .map((d) => d.platform);

  // Apply adjustments only to top 2 performers for frequency increases
  const filteredAdjustments = adjustments.filter((adj) => {
    if (adj.action === "increase_frequency") {
      return adj.platform && topPerformers.includes(adj.platform);
    }
    return true; // Keep all other adjustments
  });

  return {
    should_adjust: filteredAdjustments.length > 0,
    adjustments: filteredAdjustments,
  };
}

/**
 * Apply adjustments to brand posting config
 */
export function applyAdjustments(
  currentConfig: BrandPostingConfig,
  adjustments: AdjustmentResult["adjustments"],
): BrandPostingConfig {
  const newConfig = { ...currentConfig };

  for (const adjustment of adjustments) {
    if (
      adjustment.action === "increase_frequency" &&
      adjustment.platform &&
      adjustment.new_posts_per_week
    ) {
      // Update platform schedule to add more posts
      updatePlatformFrequency(
        newConfig,
        adjustment.platform,
        adjustment.new_posts_per_week,
      );
    }

    if (
      adjustment.action === "decrease_frequency" &&
      adjustment.platform &&
      adjustment.new_posts_per_week
    ) {
      // Update platform schedule to reduce posts
      updatePlatformFrequency(
        newConfig,
        adjustment.platform,
        adjustment.new_posts_per_week,
      );
    }

    if (adjustment.action === "shift_mix" && adjustment.new_funnel_mix) {
      // Update funnel mix (stored in monthly content plan, not config)
      // This would be passed to Advisor Agent for next month's plan
    }

    if (adjustment.action === "audit_integrations") {
      // Flag for user review (create notification/task)
      // This would trigger an integration health check
    }
  }

  return newConfig;
}

/**
 * Get current posts per week for a platform
 */
function getPlatformPostsPerWeek(
  config: BrandPostingConfig,
  platform: Platform,
): number {
  const schedule = config.publish_schedule[platform];
  if (!schedule) return 3; // Default

  // Count unique day/time combinations
  return schedule.length;
}

/**
 * Update platform posting frequency
 */
function updatePlatformFrequency(
  config: BrandPostingConfig,
  platform: Platform,
  newPostsPerWeek: number,
): void {
  // Get current schedule
  const currentSchedule = config.publish_schedule[platform] || [];

  if (newPostsPerWeek > currentSchedule.length) {
    // Add more posts (distribute evenly across week)
    const daysToAdd = newPostsPerWeek - currentSchedule.length;
    const daysOfWeek = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];
    const usedDays = new Set(currentSchedule.map((s) => s.day));

    for (let i = 0; i < daysToAdd; i++) {
      const nextDay = daysOfWeek.find((day) => !usedDays.has(day));
      if (nextDay) {
        currentSchedule.push({ day: nextDay, time: "18:00" }); // Default to 6pm
        usedDays.add(nextDay);
      }
    }
  } else if (newPostsPerWeek < currentSchedule.length) {
    // Remove posts (keep best performing days)
    currentSchedule.splice(newPostsPerWeek);
  }

  config.publish_schedule[platform] = currentSchedule;
}

/**
 * Generate suggested actions for weekly summary
 */
export function generateSuggestedActions(
  brandId: string,
  weeklyData: {
    posts_published: number;
    posts_awaiting_approval: number;
    reach_change_pct: number;
    engagement_change_pct: number;
  },
): Array<{ action: string; label: string; count?: number }> {
  const actions: Array<{ action: string; label: string; count?: number }> = [];

  // If engagement is up, suggest generating more similar content
  if (weeklyData.engagement_change_pct > 0.1) {
    actions.push({
      action: "generate_more",
      label: "Generate More Like These",
      count: 5,
    });
  }

  // If reach is down, suggest regenerating low performers
  if (weeklyData.reach_change_pct < -0.1) {
    actions.push({
      action: "regenerate_low",
      label: "Regenerate Low-Performers",
      count: 3,
    });
  }

  // If posts are waiting for approval, suggest reviewing
  if (weeklyData.posts_awaiting_approval > 5) {
    actions.push({
      action: "review_pending",
      label: "Review Pending Approvals",
      count: weeklyData.posts_awaiting_approval,
    });
  }

  // Always suggest rebalancing (adaptive planning)
  actions.push({
    action: "rebalance_plan",
    label: "Rebalance This Week's Plan",
  });

  return actions;
}

/**
 * Calculate system success metrics for a period
 */
export function calculateSuccessMetrics(
  totalPlanned: number,
  totalGenerated: number,
  totalApprovedWithoutEdit: number,
  avgBfsScore: number,
  totalScheduled: number,
  totalPublishedOnTime: number,
  previousEngagement: number,
  currentEngagement: number,
): {
  auto_generation_rate: number;
  approval_without_edit_rate: number;
  avg_bfs_score: number;
  on_time_publication_rate: number;
  mom_engagement_growth: number;
} {
  return {
    auto_generation_rate: totalPlanned > 0 ? totalGenerated / totalPlanned : 0,
    approval_without_edit_rate:
      totalGenerated > 0 ? totalApprovedWithoutEdit / totalGenerated : 0,
    avg_bfs_score: avgBfsScore,
    on_time_publication_rate:
      totalScheduled > 0 ? totalPublishedOnTime / totalScheduled : 0,
    mom_engagement_growth:
      previousEngagement > 0
        ? (currentEngagement - previousEngagement) / previousEngagement
        : 0,
  };
}
