/**
 * Dashboard API Route
 * 
 * Provides brand-scoped dashboard data including KPIs, charts, top content, and activity.
 */

// Phase 2 – Issue 3: Using shared DashboardResponse type
import { RequestHandler } from "express";
import { supabase } from "../lib/supabase";
import { AppError } from "../lib/error-middleware";
import { ErrorCode, HTTP_STATUS } from "../lib/error-responses";
import { DashboardResponse, DashboardKpi, ChartDataPoint, TopContentItem, ActivityItem } from "@shared/api";

interface DashboardRequest {
  brandId: string;
  timeRange?: "7d" | "30d" | "90d" | "all";
}

/**
 * Calculate date range from timeRange
 */
function getDateRange(timeRange: "7d" | "30d" | "90d" | "all" = "30d"): Date | null {
  const now = new Date();
  switch (timeRange) {
    case "7d":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "30d":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case "90d":
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case "all":
      return null;
    default:
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
}

/**
 * Get dashboard KPIs
 */
async function getDashboardKPIs(brandId: string, timeRange: "7d" | "30d" | "90d" | "all"): Promise<DashboardKpi[]> {
  const dateFrom = getDateRange(timeRange);
  
  // Build query for content items
  let contentQuery = supabase
    .from("content_items")
    .select("id, status, created_at, published_at")
    .eq("brand_id", brandId);

  if (dateFrom) {
    contentQuery = contentQuery.gte("created_at", dateFrom.toISOString());
  }

  const { data: contentItems, error: contentError } = await contentQuery;

  if (contentError) {
    console.error("[Dashboard] Error fetching content items:", contentError);
  }

  const totalPosts = contentItems?.length || 0;
  const publishedPosts = contentItems?.filter((item) => item.status === "published").length || 0;
  const scheduledPosts = contentItems?.filter((item) => item.status === "pending_review" || item.status === "approved").length || 0;

  // Get analytics metrics if available
  let totalEngagement = 0;
  let totalReach = 0;
  
  if (contentItems && contentItems.length > 0) {
    const contentIds = contentItems.map((item) => item.id);
    const { data: analytics, error: analyticsError } = await supabase
      .from("analytics_metrics")
      .select("engagements, reach")
      .in("content_item_id", contentIds);

    if (!analyticsError && analytics) {
      totalEngagement = analytics.reduce((sum, m) => sum + (m.engagements || 0), 0);
      totalReach = analytics.reduce((sum, m) => sum + (m.reach || 0), 0);
    }
  }

  // Calculate engagement rate
  const engagementRate = totalReach > 0 ? (totalEngagement / totalReach) * 100 : 0;

  // For now, return calculated KPIs (in future, compare with previous period for trends)
  return [
    {
      id: "total-posts",
      label: "Total Posts",
      value: totalPosts.toLocaleString(),
      change: "+12%", // TODO: Calculate from previous period
      trend: "up",
    },
    {
      id: "engagement-rate",
      label: "Engagement Rate",
      value: engagementRate > 0 ? `${engagementRate.toFixed(1)}%` : "0%",
      change: "+0.5%", // TODO: Calculate from previous period
      trend: "up",
    },
    {
      id: "top-channel",
      label: "Top Channel",
      value: "LinkedIn", // TODO: Calculate from content_items.platform
      change: "Stable",
      trend: "neutral",
    },
    {
      id: "scheduled-posts",
      label: "Scheduled Posts",
      value: scheduledPosts.toString(),
      change: scheduledPosts > 0 ? `+${scheduledPosts}` : "0",
      trend: scheduledPosts > 0 ? "up" : "neutral",
    },
  ];
}

/**
 * Get chart data (engagement over time)
 */
async function getChartData(brandId: string, timeRange: "7d" | "30d" | "90d" | "all"): Promise<ChartDataPoint[]> {
  const dateFrom = getDateRange(timeRange);
  
  // Get content items in date range
  let contentQuery = supabase
    .from("content_items")
    .select("id, created_at")
    .eq("brand_id", brandId);

  if (dateFrom) {
    contentQuery = contentQuery.gte("created_at", dateFrom.toISOString());
  }

  const { data: contentItems } = await contentQuery;

  if (!contentItems || contentItems.length === 0) {
    // Return mock data structure if no data
    return [
      { date: "Jan", value: 100 },
      { date: "Feb", value: 120 },
      { date: "Mar", value: 150 },
      { date: "Apr", value: 130 },
      { date: "May", value: 160 },
      { date: "Jun", value: 180 },
      { date: "Jul", value: 200 },
    ];
  }

  // Group by month and calculate engagement
  const contentIds = contentItems.map((item) => item.id);
  const { data: analytics } = await supabase
    .from("analytics_metrics")
    .select("content_item_id, engagements, recorded_at")
    .in("content_item_id", contentIds);

  // TODO: Aggregate by month and return ChartDataPoint[]
  // For now, return simplified data
  return [
    { date: "Jan", value: 100 },
    { date: "Feb", value: 120 },
    { date: "Mar", value: 150 },
    { date: "Apr", value: 130 },
    { date: "May", value: 160 },
    { date: "Jun", value: 180 },
    { date: "Jul", value: 200 },
  ];
}

/**
 * Get top performing content
 */
async function getTopContent(brandId: string, limit: number = 3): Promise<TopContentItem[]> {
  // Get published content with analytics
  const { data: contentItems } = await supabase
    .from("content_items")
    .select("id, title, platform, status")
    .eq("brand_id", brandId)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!contentItems || contentItems.length === 0) {
    return [];
  }

  const contentIds = contentItems.map((item) => item.id);
  const { data: analytics } = await supabase
    .from("analytics_metrics")
    .select("content_item_id, impressions, engagements, reach")
    .in("content_item_id", contentIds);

  // Map content items with analytics
  return contentItems.map((item) => {
    const itemAnalytics = analytics?.find((a) => a.content_item_id === item.id);
    const impressions = itemAnalytics?.impressions || 0;
    const engagements = itemAnalytics?.engagements || 0;
    const engagementRate = impressions > 0 ? (engagements / impressions) * 100 : 0;

    return {
      id: item.id,
      title: item.title || "Untitled",
      platform: item.platform || "Unknown",
      impressions,
      engagement: engagements,
      engagementRate,
    };
  });
}

/**
 * Get recent activity
 */
async function getRecentActivity(brandId: string, limit: number = 4): Promise<ActivityItem[]> {
  // Get recent content items
  const { data: contentItems } = await supabase
    .from("content_items")
    .select("id, title, platform, status, created_at, approved_by, published_at")
    .eq("brand_id", brandId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!contentItems || contentItems.length === 0) {
    return [];
  }

  // Map to activity items
  return contentItems.map((item, idx) => {
    const createdDate = new Date(item.created_at);
    const hoursAgo = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60));
    const timestamp = hoursAgo < 24 
      ? `${hoursAgo} hours ago`
      : `${Math.floor(hoursAgo / 24)} days ago`;

    let type: ActivityItem["type"] = "post_created";
    let title = `New ${item.platform || "post"} created`;
    let description = `${item.title || "Untitled"}`;

    if (item.status === "published" && item.published_at) {
      type = "post_approved";
      title = "Post published";
      description = `${item.platform || "Post"} '${item.title || "Untitled"}' published.`;
    } else if (item.status === "approved" && item.approved_by) {
      type = "post_approved";
      title = "Post approved";
      description = `${item.platform || "Post"} '${item.title || "Untitled"}' approved.`;
    }

    return {
      id: `activity-${item.id}`,
      type,
      title,
      description,
      timestamp,
    };
  });
}

/**
 * Main dashboard endpoint handler
 */
export const getDashboardData: RequestHandler = async (req, res) => {
  try {
    const requestBody = req.body as DashboardRequest;
    const { brandId, timeRange = "30d" } = requestBody;

    if (!brandId) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "Missing required field: brandId",
        HTTP_STATUS.BAD_REQUEST,
        "warning",
        undefined,
        "Please provide a brandId"
      );
    }

    // Fetch all dashboard data in parallel
    const [kpis, chartData, topContent, recentActivity] = await Promise.all([
      getDashboardKPIs(brandId, timeRange),
      getChartData(brandId, timeRange),
      getTopContent(brandId, 3),
      getRecentActivity(brandId, 4),
    ]);

    const response: DashboardResponse = {
      kpis,
      chartData,
      topContent,
      recentActivity,
    };

    res.json(response);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "Failed to fetch dashboard data",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "error",
      { originalError: error instanceof Error ? error.message : "Unknown error" },
      "We couldn't load your dashboard data right now. Please try again later."
    );
  }
};

