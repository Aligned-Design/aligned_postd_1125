/**
 * Advisor History Storage
 *
 * Lightweight storage for Advisor reviews and action history.
 * Used for trend analysis, performance tracking, and historical reference.
 */

import type { ReviewScore } from "./advisor-review-scorer";

export interface AdvisorReviewRecord {
  id: string;
  brand_id: string;
  content_id: string;
  platform: string;
  scores: ReviewScore;
  severity_level: "green" | "yellow" | "red";
  reflection_question: string;
  suggested_actions: string[];
  created_at: string;
  actioned_at?: string;
  published_at?: string;
}

export interface AdvisorActionRecord {
  id: string;
  brand_id: string;
  review_id: string;
  action_type: string;
  user_id: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  result?: Record<string, unknown>;
  error?: string;
  created_at: string;
  completed_at?: string;
}

export interface AdvisorTrendData {
  brand_id: string;
  period: "daily" | "weekly" | "monthly";
  date_range: { start: string; end: string };
  average_clarity: number;
  average_alignment: number;
  average_resonance: number;
  average_actionability: number;
  average_platform_fit: number;
  overall_average: number;
  total_reviews: number;
  published_count: number;
  approval_rate: number;
  top_platforms: string[];
  most_common_actions: string[];
  action_success_rate: number;
}

/**
 * In-memory store for recent reviews (production would use database)
 */
class AdvisorHistoryStore {
  private reviews: Map<string, AdvisorReviewRecord> = new Map();
  private actions: Map<string, AdvisorActionRecord> = new Map();
  private trends: Map<string, AdvisorTrendData> = new Map();

  /**
   * Store a new review
   */
  storeReview(review: AdvisorReviewRecord): void {
    this.reviews.set(review.id, review);
    console.log(`[Advisor History] Stored review: ${review.id} for brand ${review.brand_id}`);
  }

  /**
   * Store a new action
   */
  storeAction(action: AdvisorActionRecord): void {
    this.actions.set(action.id, action);
    console.log(`[Advisor History] Stored action: ${action.id} (${action.action_type})`);
  }

  /**
   * Get review by ID
   */
  getReview(reviewId: string): AdvisorReviewRecord | null {
    return this.reviews.get(reviewId) || null;
  }

  /**
   * Get all reviews for a brand
   */
  getBrandReviews(brandId: string, limit: number = 50): AdvisorReviewRecord[] {
    return Array.from(this.reviews.values())
      .filter((r) => r.brand_id === brandId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  }

  /**
   * Get recent reviews for a specific platform
   */
  getPlatformReviews(
    brandId: string,
    platform: string,
    limit: number = 20
  ): AdvisorReviewRecord[] {
    return Array.from(this.reviews.values())
      .filter((r) => r.brand_id === brandId && r.platform === platform)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  }

  /**
   * Get action history for a review
   */
  getReviewActions(reviewId: string): AdvisorActionRecord[] {
    return Array.from(this.actions.values())
      .filter((a) => a.review_id === reviewId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  /**
   * Calculate trend data for a brand
   */
  calculateTrends(
    brandId: string,
    daysBack: number = 7
  ): AdvisorTrendData {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    const relevantReviews = Array.from(this.reviews.values()).filter(
      (r) =>
        r.brand_id === brandId && new Date(r.created_at).getTime() >= cutoffDate.getTime()
    );

    if (relevantReviews.length === 0) {
      return this.getDefaultTrendData(brandId, daysBack);
    }

    // Calculate averages
    const avgClarity =
      relevantReviews.reduce((sum, r) => sum + r.scores.clarity, 0) / relevantReviews.length;
    const avgAlignment =
      relevantReviews.reduce((sum, r) => sum + r.scores.brand_alignment, 0) /
      relevantReviews.length;
    const avgResonance =
      relevantReviews.reduce((sum, r) => sum + r.scores.resonance, 0) / relevantReviews.length;
    const avgActionability =
      relevantReviews.reduce((sum, r) => sum + r.scores.actionability, 0) /
      relevantReviews.length;
    const avgPlatformFit =
      relevantReviews.reduce((sum, r) => sum + r.scores.platform_fit, 0) /
      relevantReviews.length;

    const overallAverage =
      (avgClarity + avgAlignment + avgResonance + avgActionability + avgPlatformFit) / 5;

    // Count published and actions
    const publishedCount = relevantReviews.filter((r) => r.published_at).length;

    // Get top platforms
    const platformCounts = relevantReviews.reduce(
      (acc, r) => {
        acc[r.platform] = (acc[r.platform] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    const topPlatforms = Object.entries(platformCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([platform]) => platform);

    // Get action stats
    const relevantActions = Array.from(this.actions.values()).filter(
      (a) =>
        relevantReviews.some((r) => r.id === a.review_id) &&
        new Date(a.created_at).getTime() >= cutoffDate.getTime()
    );

    const actionCounts = relevantActions.reduce(
      (acc, a) => {
        acc[a.action_type] = (acc[a.action_type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    const mostCommonActions = Object.entries(actionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([action]) => action);

    const successCount = relevantActions.filter((a) => a.status === "completed").length;
    const actionSuccessRate =
      relevantActions.length > 0 ? (successCount / relevantActions.length) * 100 : 0;

    return {
      brand_id: brandId,
      period: "weekly",
      date_range: {
        start: cutoffDate.toISOString(),
        end: new Date().toISOString(),
      },
      average_clarity: Math.round(avgClarity * 10) / 10,
      average_alignment: Math.round(avgAlignment * 10) / 10,
      average_resonance: Math.round(avgResonance * 10) / 10,
      average_actionability: Math.round(avgActionability * 10) / 10,
      average_platform_fit: Math.round(avgPlatformFit * 10) / 10,
      overall_average: Math.round(overallAverage * 10) / 10,
      total_reviews: relevantReviews.length,
      published_count: publishedCount,
      approval_rate: (publishedCount / relevantReviews.length) * 100,
      top_platforms: topPlatforms,
      most_common_actions: mostCommonActions,
      action_success_rate: Math.round(actionSuccessRate),
    };
  }

  /**
   * Get default trend data when no reviews exist
   */
  private getDefaultTrendData(brandId: string, daysBack: number): AdvisorTrendData {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    return {
      brand_id: brandId,
      period: "weekly",
      date_range: {
        start: cutoffDate.toISOString(),
        end: new Date().toISOString(),
      },
      average_clarity: 0,
      average_alignment: 0,
      average_resonance: 0,
      average_actionability: 0,
      average_platform_fit: 0,
      overall_average: 0,
      total_reviews: 0,
      published_count: 0,
      approval_rate: 0,
      top_platforms: [],
      most_common_actions: [],
      action_success_rate: 0,
    };
  }

  /**
   * Store calculated trends
   */
  storeTrends(trends: AdvisorTrendData): void {
    const key = `${trends.brand_id}_${trends.period}`;
    this.trends.set(key, trends);
    console.log(`[Advisor History] Stored trends for ${trends.brand_id}`);
  }

  /**
   * Get stored trends for a brand
   */
  getTrends(brandId: string): AdvisorTrendData | null {
    const weeklyKey = `${brandId}_weekly`;
    return this.trends.get(weeklyKey) || null;
  }

  /**
   * Mark review as published
   */
  markReviewPublished(reviewId: string): void {
    const review = this.reviews.get(reviewId);
    if (review) {
      review.published_at = new Date().toISOString();
    }
  }

  /**
   * Mark action as completed
   */
  markActionCompleted(actionId: string, result?: Record<string, unknown>): void {
    const action = this.actions.get(actionId);
    if (action) {
      action.status = "completed";
      action.completed_at = new Date().toISOString();
      if (result) action.result = result;
    }
  }

  /**
   * Get summary statistics for a brand
   */
  getBrandSummary(brandId: string) {
    const allReviews = this.getBrandReviews(brandId, 1000);
    const allActions = Array.from(this.actions.values()).filter((a) =>
      allReviews.some((r) => r.id === a.review_id)
    );

    if (allReviews.length === 0) {
      return {
        total_reviews: 0,
        total_actions: 0,
        average_score: 0,
        action_success_rate: 0,
        platforms: [] as string[],
      };
    }

    const platforms = [...new Set(allReviews.map((r) => r.platform))];
    const avgScore =
      allReviews.reduce((sum, r) => sum + r.scores.average, 0) / allReviews.length;
    const successCount = allActions.filter((a) => a.status === "completed").length;
    const successRate =
      allActions.length > 0 ? (successCount / allActions.length) * 100 : 0;

    return {
      total_reviews: allReviews.length,
      total_actions: allActions.length,
      average_score: Math.round(avgScore * 10) / 10,
      action_success_rate: Math.round(successRate),
      platforms,
    };
  }
}

// Export singleton instance
export const advisorHistoryStore = new AdvisorHistoryStore();
