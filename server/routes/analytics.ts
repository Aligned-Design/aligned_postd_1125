// Phase 2 – Issue 3: Using shared AnalyticsSummaryResponse type
import { RequestHandler, Router } from "express";
import { z } from "zod";
import { analyticsDB } from "../lib/analytics-db-service";
import { getSyncStatus, syncBrandAnalytics } from "../lib/analytics-scheduler";
import { AppError } from "../lib/error-middleware";
import { ErrorCode, HTTP_STATUS } from "../lib/error-responses";
import { requireScope } from "../middleware/requireScope";
import { analyticsCache, AnalyticsCache } from "../lib/analytics-cache";
import { AnalyticsSummaryResponse, PlatformMetricsData } from "@shared/analytics";
import { assertBrandAccess } from "../lib/brand-access";

const analyticsRouter = Router();

// ✅ VALIDATION: Zod schemas for analytics routes
const BrandIdParamSchema = z.object({
  brandId: z.string().uuid("Invalid brand ID format"),
});

const AnalyticsQuerySchema = z.object({
  days: z.string().regex(/^\d+$/).transform(Number).refine(n => n > 0 && n <= 365, "Days must be between 1 and 365").optional().default("30"),
  period: z.enum(["next_week", "next_month", "next_quarter"]).optional().default("next_month"),
});

const voiceQuerySchema = z.object({
  query: z.string().min(3).max(500),
});

const feedbackSchema = z.object({
  insightId: z.string().min(2),
  feedback: z.enum(["accepted", "implemented", "rejected"]),
  category: z.string().optional(),
  type: z.string().optional(),
  previousWeight: z.number().optional(),
});

const createGoalSchema = z.object({
  metric: z.string().min(2),
  target: z.number(),
  deadline: z.string().datetime(),
  notes: z.string().max(500).optional(),
});

const syncPayloadSchema = z.object({
  platform: z.string().min(2),
});

const offlineMetricSchema = z.object({
  metric: z.string().min(2),
  value: z.number(),
  date: z.string().datetime(),
});

const performanceMetricSchema = z.object({
  name: z.string(),
  value: z.number(),
  timestamp: z.number(),
  metadata: z.record(z.unknown()).optional(),
});

const getAnalytics: RequestHandler = async (req, res) => {
  try {
    // ✅ VALIDATION: Validate params and query
    let brandId: string;
    let days: number;
    try {
      const validatedParams = BrandIdParamSchema.parse(req.params);
      brandId = validatedParams.brandId;
      const validatedQuery = AnalyticsQuerySchema.parse(req.query);
      days = validatedQuery.days;
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          "Invalid request parameters",
          HTTP_STATUS.BAD_REQUEST,
          "warning",
          { validationErrors: validationError.errors }
        );
      }
      throw validationError;
    }

    await assertBrandAccess(req, brandId);

    // Get summary metrics from database
    const summary = await analyticsDB.getMetricsSummary(brandId, days);

    // Get platform-specific stats
    const platformStats: Record<string, PlatformMetricsData> = {};
    const platforms = [
      "instagram",
      "facebook",
      "linkedin",
      "twitter",
      "tiktok",
      "pinterest",
      "youtube",
      "google_business",
    ];

    for (const platform of platforms) {
      if (summary.platformBreakdown[platform]) {
        const stats = await analyticsDB.getPlatformStats(
          brandId,
          platform,
          days,
        );
        // Ensure stats conform to PlatformMetricsData structure
        platformStats[platform] = stats as PlatformMetricsData;
      }
    }

    // Calculate growth metrics
    const previousSummary = await analyticsDB.getMetricsSummary(
      brandId,
      days * 2,
    );
    const engagementGrowth =
      previousSummary.totalEngagement > 0
        ? ((summary.totalEngagement - previousSummary.totalEngagement) /
            previousSummary.totalEngagement) *
          100
        : 0;
    const followerGrowth =
      previousSummary.totalFollowers > 0
        ? ((summary.totalFollowers - previousSummary.totalFollowers) /
            previousSummary.totalFollowers) *
          100
        : 0;

    // Get last sync timestamp
    const syncStatus = await getSyncStatus(brandId);
    const lastUpdated = syncStatus.lastSync?.toISOString() || new Date().toISOString();

    const analytics: AnalyticsSummaryResponse = {
      summary: {
        reach: summary.totalReach,
        engagement: summary.totalEngagement,
        engagementRate: summary.averageEngagementRate,
        followers: summary.totalFollowers,
        topPlatform: summary.topPlatform,
      },
      platforms: platformStats,
      comparison: {
        engagementGrowth: parseFloat(engagementGrowth.toFixed(1)),
        followerGrowth: parseFloat(followerGrowth.toFixed(1)),
      },
      timeframe: {
        days,
        startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
      },
      lastUpdated,
    };

    res.json(analytics);
  } catch (error) {
    console.error("Failed to fetch analytics:", error);
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "Failed to fetch analytics",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "error",
      error instanceof Error ? { originalError: error.message } : undefined,
      "Please try again later or contact support"
    );
  }
};

const getInsights: RequestHandler = async (req, res) => {
  try {
    // ✅ VALIDATION: Validate brandId param
    let brandId: string;
    try {
      const validated = BrandIdParamSchema.parse(req.params);
      brandId = validated.brandId;
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          "Invalid brand ID format",
          HTTP_STATUS.BAD_REQUEST,
          "warning",
          { validationErrors: validationError.errors }
        );
      }
      throw validationError;
    }
    await assertBrandAccess(req, brandId);
    
    // Check cache first (insights have longer TTL)
    const cacheKey = AnalyticsCache.key("insights", brandId);
    const cached = analyticsCache.getInsights<any>(cacheKey);
    if (cached) {
      return (res as any).json(cached);
    }
    
    const { advisorEngine } = await import("../lib/advisor-engine");

    // Get current and historical metrics
    const currentMetrics = await analyticsDB.getMetricsByDateRange(
      brandId,
      undefined,
      undefined,
      undefined,
      1000,
    );
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const startDateStr = thirtyDaysAgo.toISOString().split("T")[0];
    const historicalMetrics = await analyticsDB.getMetricsByDateRange(
      brandId,
      undefined,
      startDateStr,
      undefined,
      1000,
    );

    // Convert to advisor engine format
    const formattedCurrent = currentMetrics.map((m) => ({
      id: m.id,
      brandId: m.brand_id,
      platform: m.platform as any,
      postId: m.post_id,
      date: m.date,
      metrics: m.metrics as any,
      metadata: m.metadata as any,
      createdAt: m.created_at,
      updatedAt: m.updated_at,
    }));

    const formattedHistorical = historicalMetrics.map((m) => ({
      id: m.id,
      brandId: m.brand_id,
      platform: m.platform as any,
      postId: m.post_id,
      date: m.date,
      metrics: m.metrics as any,
      metadata: m.metadata as any,
      createdAt: m.created_at,
      updatedAt: m.updated_at,
    }));

    // Get goals
    const goals = await analyticsDB.getGoals(brandId);

    // Generate insights
    const insights = await advisorEngine.generateInsights({
      brandId,
      currentMetrics: formattedCurrent,
      historicalMetrics: formattedHistorical,
      goals,
      userFeedback: [],
    });

    const response = { insights, totalCount: insights.length };
    
    // Cache the insights response
    analyticsCache.setInsights(cacheKey, response);

    (res as any).json(response);
  } catch (error) {
    console.error("Failed to fetch insights:", error);
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "Failed to fetch insights",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "error",
      error instanceof Error ? { originalError: error.message } : undefined,
      "Please try again later or contact support"
    );
  }
};

const getForecast: RequestHandler = async (req, res) => {
  try {
    // ✅ VALIDATION: Validate params and query
    let brandId: string;
    let period: string;
    try {
      const validatedParams = BrandIdParamSchema.parse(req.params);
      brandId = validatedParams.brandId;
      const validatedQuery = AnalyticsQuerySchema.parse(req.query);
      period = validatedQuery.period;
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          "Invalid request parameters",
          HTTP_STATUS.BAD_REQUEST,
          "warning",
          { validationErrors: validationError.errors }
        );
      }
      throw validationError;
    }
    await assertBrandAccess(req, brandId);
    
    // Check cache first
    const cacheKey = AnalyticsCache.key("forecast", brandId, period);
    const cached = analyticsCache.getInsights<any>(cacheKey);
    if (cached) {
      return (res as any).json(cached);
    }
    
    const { advisorEngine } = await import("../lib/advisor-engine");

    // Get current metrics
    const metrics = await analyticsDB.getMetricsByDateRange(
      brandId,
      undefined,
      undefined,
      undefined,
      1000,
    );

    // Convert to advisor format
    const formattedMetrics = metrics.map((m) => ({
      id: m.id,
      brandId: m.brand_id,
      platform: m.platform as any,
      postId: m.post_id,
      date: m.date,
      metrics: m.metrics as any,
      metadata: m.metadata as any,
      createdAt: m.created_at,
      updatedAt: m.updated_at,
    }));

    // Generate forecast
    const forecast = await advisorEngine.generateForecast(
      brandId,
      formattedMetrics,
      period,
    );

    // Cache the forecast response
    analyticsCache.setInsights(cacheKey, forecast);

    (res as any).json(forecast);
  } catch (error) {
    console.error("Failed to generate forecast:", error);
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "Failed to generate forecast",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "error",
      error instanceof Error ? { originalError: error.message } : undefined,
      "Please try again later or contact support"
    );
  }
};

const processVoiceQuery: RequestHandler = async (req, res) => {
  try {
    // ✅ VALIDATION: Validate params and body
    let brandId: string;
    try {
      const validatedParams = BrandIdParamSchema.parse(req.params);
      brandId = validatedParams.brandId;
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          "Invalid brand ID format",
          HTTP_STATUS.BAD_REQUEST,
          "warning",
          { validationErrors: validationError.errors }
        );
      }
      throw validationError;
    }
    await assertBrandAccess(req, brandId);
    const { query } = voiceQuerySchema.parse(req.body ?? {});
    const response = {
      query,
      response: `Based on your analytics data: ${query}`,
      suggestions: [
        "Try asking about engagement rates",
        "Check platform performance",
      ],
    };
    (res as any).json(response);
  } catch (error) {
    console.error("Failed to process voice query:", error);
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "Failed to process voice query",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "error",
      error instanceof Error ? { originalError: error.message } : undefined,
      "Please try again later or contact support"
    );
  }
};

const provideFeedback: RequestHandler = async (req, res) => {
  try {
    // ✅ VALIDATION: Validate brandId param
    let brandId: string;
    try {
      const validated = BrandIdParamSchema.parse(req.params);
      brandId = validated.brandId;
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          "Invalid brand ID format",
          HTTP_STATUS.BAD_REQUEST,
          "warning",
          { validationErrors: validationError.errors }
        );
      }
      throw validationError;
    }
    await assertBrandAccess(req, brandId);
    const {
      insightId,
      feedback,
      category,
      type,
      previousWeight = 1.0,
    } = feedbackSchema.parse(req.body ?? {});

    // Calculate new weight based on feedback
    let newWeight = previousWeight;
    switch (feedback) {
      case "accepted":
      case "implemented":
        newWeight = Math.min(1.5, previousWeight + 0.1);
        break;
      case "rejected":
        newWeight = Math.max(0.5, previousWeight - 0.1);
        break;
    }

    // Log feedback to database
    await analyticsDB.logFeedback(
      brandId,
      brandId,
      insightId,
      category,
      type,
      feedback,
      previousWeight,
      newWeight,
    );

    (res as any).json({
      message: "Feedback recorded and weights updated",
      previousWeight,
      newWeight,
      adjustment: (newWeight - previousWeight).toFixed(2),
    });
  } catch (error) {
    console.error("Failed to submit feedback:", error);
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "Failed to submit feedback",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "error",
      error instanceof Error ? { originalError: error.message } : undefined,
      "Please try again later or contact support"
    );
  }
};

const getGoals: RequestHandler = async (req, res) => {
  try {
    // ✅ VALIDATION: Validate brandId param
    let brandId: string;
    try {
      const validated = BrandIdParamSchema.parse(req.params);
      brandId = validated.brandId;
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          "Invalid brand ID format",
          HTTP_STATUS.BAD_REQUEST,
          "warning",
          { validationErrors: validationError.errors }
        );
      }
      throw validationError;
    }
    await assertBrandAccess(req, brandId);

    // Get goals from database
    const goals = await analyticsDB.getGoals(brandId);

    // Add current progress for each goal
    const goalsWithProgress = await Promise.all(
      goals.map(async (goal: any) => {
        const stats = await analyticsDB.getPlatformStats(
          brandId,
          goal.metric,
          30,
        );
        return {
          ...goal,
          current: stats.averageEngagementRate || 0,
          progress:
            goal.target > 0
              ? ((stats.averageEngagementRate || 0) / goal.target) * 100
              : 0,
        };
      }),
    );

    (res as any).json({ goals: goalsWithProgress });
  } catch (error) {
    console.error("Failed to fetch goals:", error);
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "Failed to fetch goals",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "error",
      error instanceof Error ? { originalError: error.message } : undefined,
      "Please try again later or contact support"
    );
  }
};

const createGoal: RequestHandler = async (req, res) => {
  try {
    // ✅ VALIDATION: Validate brandId param
    let brandId: string;
    try {
      const validated = BrandIdParamSchema.parse(req.params);
      brandId = validated.brandId;
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          "Invalid brand ID format",
          HTTP_STATUS.BAD_REQUEST,
          "warning",
          { validationErrors: validationError.errors }
        );
      }
      throw validationError;
    }
    await assertBrandAccess(req, brandId);
    const { metric, target, deadline, notes } = createGoalSchema.parse(
      req.body ?? {},
    );

    // Create goal in database
    const newGoal = await analyticsDB.upsertGoal(
      brandId,
      brandId,
      metric,
      target,
      new Date(deadline),
      notes,
    );

    (res as any).status(201).json(newGoal);
  } catch (error) {
    console.error("Failed to create goal:", error);
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "Failed to create goal",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "error",
      error instanceof Error ? { originalError: error.message } : undefined,
      "Please try again later or contact support"
    );
  }
};

const syncPlatformData: RequestHandler = async (req, res) => {
  try {
    // ✅ VALIDATION: Validate brandId param
    let brandId: string;
    try {
      const validated = BrandIdParamSchema.parse(req.params);
      brandId = validated.brandId;
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          "Invalid brand ID format",
          HTTP_STATUS.BAD_REQUEST,
          "warning",
          { validationErrors: validationError.errors }
        );
      }
      throw validationError;
    }
    await assertBrandAccess(req, brandId);
    const { platform } = syncPayloadSchema.parse(req.body ?? {});

    await syncBrandAnalytics(brandId, brandId);

    // Invalidate cache for this brand after sync
    analyticsCache.invalidateBrand(brandId);

    (res as any).json({
      message: `Sync triggered for ${platform}`,
      status: "queued",
    });
  } catch (error) {
    console.error("Failed to sync platform data:", error);
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "Failed to sync platform data",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "error",
      error instanceof Error ? { originalError: error.message } : undefined,
      "Please try again later or contact support"
    );
  }
};

const addOfflineMetric: RequestHandler = async (req, res) => {
  try {
    // ✅ VALIDATION: Validate brandId param
    let brandId: string;
    try {
      const validated = BrandIdParamSchema.parse(req.params);
      brandId = validated.brandId;
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          "Invalid brand ID format",
          HTTP_STATUS.BAD_REQUEST,
          "warning",
          { validationErrors: validationError.errors }
        );
      }
      throw validationError;
    }
    await assertBrandAccess(req, brandId);
    const { metric, value, date } = offlineMetricSchema.parse(req.body ?? {});

    // Insert offline metric directly to database
    await analyticsDB.logSync(
      brandId,
      brandId,
      "offline",
      "manual",
      "completed",
      1,
      0,
      new Date(date),
      new Date(),
      undefined,
    );

    (res as any).json({ message: "Offline metric added", metric, value, date });
  } catch (error) {
    console.error("Failed to add offline metric:", error);
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "Failed to add offline metric",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "error",
      error instanceof Error ? { originalError: error.message } : undefined,
      "Please try again later or contact support"
    );
  }
};

const getEngagementHeatmap: RequestHandler = async (req, res) => {
  try {
    // ✅ VALIDATION: Validate brandId param
    let brandId: string;
    try {
      const validated = BrandIdParamSchema.parse(req.params);
      brandId = validated.brandId;
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          "Invalid brand ID format",
          HTTP_STATUS.BAD_REQUEST,
          "warning",
          { validationErrors: validationError.errors }
        );
      }
      throw validationError;
    }
    await assertBrandAccess(req, brandId);

    // Check cache first
    const cacheKey = AnalyticsCache.key("heatmap", brandId);
    const cached = analyticsCache.get<any>(cacheKey);
    if (cached) {
      return (res as any).json(cached);
    }

    // Get metrics from database
    const metrics = await analyticsDB.getMetricsByDateRange(
      brandId,
      undefined,
      undefined,
      undefined,
      1000,
    );

    // Build heatmap from real data
    const heatmapData = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      engagement: 0,
    }));

    let maxEngagement = 0;
    let peakHour = 0;

    metrics.forEach((metric) => {
      const hour = parseInt(metric.date.split("T")[1]?.split(":")[0] || "0");
      heatmapData[hour].engagement += metric.metrics.engagement || 0;
      if (heatmapData[hour].engagement > maxEngagement) {
        maxEngagement = heatmapData[hour].engagement;
        peakHour = hour;
      }
    });

    const response = {
      data: heatmapData,
      peak: { hour: peakHour, engagement: maxEngagement },
    };

    // Cache the heatmap response
    analyticsCache.set(cacheKey, response);

    (res as any).json(response);
  } catch (error) {
    console.error("Failed to generate heatmap:", error);
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "Failed to generate heatmap",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "error",
      error instanceof Error ? { originalError: error.message } : undefined,
      "Please try again later or contact support"
    );
  }
};

const getAlerts: RequestHandler = async (req, res) => {
  try {
    // ✅ VALIDATION: Validate brandId param
    let brandId: string;
    try {
      const validated = BrandIdParamSchema.parse(req.params);
      brandId = validated.brandId;
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          "Invalid brand ID format",
          HTTP_STATUS.BAD_REQUEST,
          "warning",
          { validationErrors: validationError.errors }
        );
      }
      throw validationError;
    }
    await assertBrandAccess(req, brandId);
    const { advisorEngine } = await import("../lib/advisor-engine");

    // Get current and historical metrics
    const currentMetrics = await analyticsDB.getMetricsByDateRange(
      brandId,
      undefined,
      undefined,
      undefined,
      1000,
    );
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const startDateStr = thirtyDaysAgo.toISOString().split("T")[0];
    const historicalMetrics = await analyticsDB.getMetricsByDateRange(
      brandId,
      undefined,
      startDateStr,
      undefined,
      1000,
    );

    // Convert to advisor format
    const formattedCurrent = currentMetrics.map((m) => ({
      id: m.id,
      brandId: m.brand_id,
      platform: m.platform as any,
      postId: m.post_id,
      date: m.date,
      metrics: m.metrics as any,
      metadata: m.metadata as any,
      createdAt: m.created_at,
      updatedAt: m.updated_at,
    }));

    const formattedHistorical = historicalMetrics.map((m) => ({
      id: m.id,
      brandId: m.brand_id,
      platform: m.platform as any,
      postId: m.post_id,
      date: m.date,
      metrics: m.metrics as any,
      metadata: m.metadata as any,
      createdAt: m.created_at,
      updatedAt: m.updated_at,
    }));

    // Generate insights which will include alerts
    const insights = await advisorEngine.generateInsights({
      brandId,
      currentMetrics: formattedCurrent,
      historicalMetrics: formattedHistorical,
      goals: [],
      userFeedback: [],
    });

    // Filter for alerts only
    const alerts = insights
      .filter((i) => i.type === "alert")
      .map((i) => ({
        id: i.id,
        type: "warning",
        title: i.title,
        message: i.description,
        timestamp: i.createdAt,
        severity: i.impact === "high" ? "high" : "medium",
      }));

    (res as any).json({ alerts });
  } catch (error) {
    console.error("Failed to fetch alerts:", error);
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "Failed to fetch alerts",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "error",
      error instanceof Error ? { originalError: error.message } : undefined,
      "Please try again later or contact support"
    );
  }
};

const acknowledgeAlert: RequestHandler = async (req, res) => {
  try {
    const { alertId } = req.params;
    // Alerts aren't stored yet, so just acknowledge
    (res as any).json({
      alertId,
      acknowledged: true,
      acknowledgedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to acknowledge alert:", error);
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "Failed to acknowledge alert",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "error",
      error instanceof Error ? { originalError: error.message } : undefined,
      "Please try again later or contact support"
    );
  }
};

const getAnalyticsStatus: RequestHandler = async (req, res) => {
  try {
    // ✅ VALIDATION: Validate brandId param
    let brandId: string;
    try {
      const validated = BrandIdParamSchema.parse(req.params);
      brandId = validated.brandId;
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          "Invalid brand ID format",
          HTTP_STATUS.BAD_REQUEST,
          "warning",
          { validationErrors: validationError.errors }
        );
      }
      throw validationError;
    }
    await assertBrandAccess(req, brandId);
    const status = await getSyncStatus(brandId);
    (res as any).json({
      status: status.status,
      itemsSynced: status.itemsSynced,
      itemsFailed: status.itemsFailed,
      lastSync: status.lastSync?.toISOString() ?? null,
      duration: status.duration ?? null,
      currentSync: null,
    });
  } catch (error) {
    console.error("Failed to fetch analytics status:", error);
    nextWithError(error, res);
  }
};

const logPerformanceMetric: RequestHandler = async (req, res) => {
  try {
    const metric = performanceMetricSchema.parse(req.body ?? {});
    console.log("[PerformanceMetric]", metric);
    (res as any).status(202).json({ success: true });
  } catch (error) {
    nextWithError(error, res);
  }
};

analyticsRouter.post(
  "/performance",
  requireScope("analytics:read"),
  logPerformanceMetric,
);

analyticsRouter.get(
  "/status/:brandId",
  requireScope("analytics:read"),
  getAnalyticsStatus,
);
analyticsRouter.get(
  "/:brandId",
  requireScope("analytics:read"),
  getAnalytics,
);
analyticsRouter.get(
  "/:brandId/insights",
  requireScope("analytics:read"),
  getInsights,
);
analyticsRouter.get(
  "/:brandId/forecast",
  requireScope("analytics:read"),
  getForecast,
);
analyticsRouter.post(
  "/:brandId/voice-query",
  requireScope("analytics:read"),
  processVoiceQuery,
);
analyticsRouter.post(
  "/:brandId/feedback",
  requireScope("analytics:read"),
  provideFeedback,
);
analyticsRouter.get(
  "/:brandId/goals",
  requireScope("analytics:read"),
  getGoals,
);
analyticsRouter.post(
  "/:brandId/goals",
  requireScope("analytics:manage"),
  createGoal,
);
analyticsRouter.post(
  "/:brandId/sync",
  requireScope("analytics:manage"),
  syncPlatformData,
);
analyticsRouter.post(
  "/:brandId/offline-metric",
  requireScope("analytics:manage"),
  addOfflineMetric,
);
analyticsRouter.get(
  "/:brandId/heatmap",
  requireScope("analytics:read"),
  getEngagementHeatmap,
);
analyticsRouter.get(
  "/:brandId/alerts",
  requireScope("analytics:read"),
  getAlerts,
);
analyticsRouter.post(
  "/:brandId/alerts/:alertId/acknowledge",
  requireScope("analytics:read"),
  acknowledgeAlert,
);

export {
  getAnalytics,
  getInsights,
  getForecast,
  processVoiceQuery,
  provideFeedback,
  getGoals,
  createGoal,
  syncPlatformData,
  addOfflineMetric,
  getEngagementHeatmap,
  getAlerts,
  acknowledgeAlert,
};

export default analyticsRouter;

function nextWithError(error: unknown, res: any) {
  const appError =
    error instanceof AppError
      ? error
      : new AppError(
          ErrorCode.INTERNAL_ERROR,
          error instanceof Error ? error.message : "Analytics error",
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
          "error",
        );
  res.status(appError.statusCode || 500).json({ error: appError.message });
}
