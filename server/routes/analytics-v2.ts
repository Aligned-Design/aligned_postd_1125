/**
 * Analytics API Routes (v2)
 * 
 * Real implementation using analytics database service.
 * Replaces mock implementation with actual data access.
 */

import { Router, RequestHandler } from "express";
import { z } from "zod";
import { analyticsDB } from "../lib/analytics-db-service";
import { AppError } from "../lib/error-middleware";
import { ErrorCode, HTTP_STATUS } from "../lib/error-responses";
import { authenticateUser } from "../middleware/security";
import { requireScope } from "../middleware/requireScope";
import { validateBrandId } from "../middleware/validate-brand-id";
import { supabase } from "../lib/supabase";
import { logger } from "../lib/logger";

const router = Router();

// ✅ VALIDATION: Zod schemas for analytics routes
// Note: brandId validation is handled by validateBrandId middleware
const AnalyticsQuerySchema = z.object({
  brandId: z.string().optional(), // Format validation handled by middleware
  days: z.coerce.number().int().min(7).max(90).default(30).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10).optional(),
});

/**
 * GET /api/analytics/overview
 * High-level analytics overview for dashboard tiles
 * 
 * **Auth:** Required (authenticateUser)
 * **Scope:** content:view
 * **Query:** brandId (UUID, optional), days (7-90, default 30)
 */
router.get(
  "/overview",
  authenticateUser,
  requireScope("content:view"),
  validateBrandId, // Validates brandId format and access (if provided)
  (async (req, res, next) => {
    try {
      // ✅ Use validated brandId from middleware (checks params, query, body)
      let brandId: string | undefined = (req as any).validatedBrandId ?? (req.query.brandId as string);
      let days: number;
      try {
        const validated = AnalyticsQuerySchema.parse(req.query);
        // Use validated brandId from middleware if available, otherwise from query
        brandId = brandId || validated.brandId;
        days = validated.days || 30;
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          throw new AppError(
            ErrorCode.VALIDATION_ERROR,
            "Invalid query parameters",
            HTTP_STATUS.BAD_REQUEST,
            "warning",
            { validationErrors: validationError.errors },
            "Please check your query parameters and try again"
          );
        }
        throw validationError;
      }

      // If brandId not provided, get from user's brands
      if (!brandId) {
        // Get user's first brand if no brandId provided
        const user = req.user || req.auth;
        if (user?.brandIds && user.brandIds.length > 0) {
          brandId = user.brandIds[0];
        } else {
          throw new AppError(
            ErrorCode.MISSING_REQUIRED_FIELD,
            "brandId is required",
            HTTP_STATUS.BAD_REQUEST,
            "warning",
            undefined,
            "Please provide a brandId in the query parameters"
          );
        }
      }

      // Get metrics summary from database
      const summary = await analyticsDB.getMetricsSummary(brandId, days);

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get published posts count
      const { data: contentItems, error: contentError } = await supabase
        .from("content_items")
        .select("id")
        .eq("brand_id", brandId)
        .eq("status", "published")
        .gte("published_at", startDate.toISOString())
        .lte("published_at", endDate.toISOString());

      if (contentError) {
        logger.error("Error fetching content items", new Error(contentError.message), {
          code: contentError.code,
        });
      }

      const postsPublished = contentItems?.length || 0;

      // Build response
      const response = {
        period: `last_${days}_days`,
        totals: {
          impressions: summary.totalReach,
          clicks: Math.round(summary.totalEngagement * 0.1), // Estimate clicks from engagement
          ctr: summary.averageEngagementRate / 100, // Convert percentage to decimal
          followers: summary.totalFollowers,
          postsPublished,
        },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }) as RequestHandler
);

/**
 * GET /api/analytics/engagement-trend?days=30
 * Sparkline data for engagement charts
 * 
 * **Auth:** Required (authenticateUser)
 * **Scope:** content:view
 * **Query:** brandId (UUID, optional), days (7-90, default 30)
 */
router.get(
  "/engagement-trend",
  authenticateUser,
  requireScope("content:view"),
  validateBrandId, // Validates brandId format and access (if provided)
  (async (req, res, next) => {
    try {
      // ✅ Use validated brandId from middleware
      let brandId: string | undefined = (req as any).validatedBrandId ?? (req.query.brandId as string);
      let days: number;
      try {
        const validated = AnalyticsQuerySchema.parse(req.query);
        brandId = brandId || validated.brandId;
        days = validated.days || 30;
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          throw new AppError(
            ErrorCode.VALIDATION_ERROR,
            "Invalid query parameters",
            HTTP_STATUS.BAD_REQUEST,
            "warning",
            { validationErrors: validationError.errors }
          );
        }
        throw validationError;
      }

      // Get brandId if not provided
      if (!brandId) {
        const user = req.user || req.auth;
        if (user?.brandIds && user.brandIds.length > 0) {
          brandId = user.brandIds[0];
        } else {
          throw new AppError(
            ErrorCode.MISSING_REQUIRED_FIELD,
            "brandId is required",
            HTTP_STATUS.BAD_REQUEST,
            "warning"
          );
        }
      }

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get metrics by date range
      const metrics = await analyticsDB.getMetricsByDateRange(
        brandId,
        undefined,
        startDate.toISOString().split("T")[0],
        endDate.toISOString().split("T")[0],
        1000
      );

      // Group metrics by date
      const metricsByDate: Record<string, { likes: number; comments: number; shares: number }> = {};
      
      metrics.forEach((metric) => {
        const date = metric.date.split("T")[0];
        if (!metricsByDate[date]) {
          metricsByDate[date] = { likes: 0, comments: 0, shares: 0 };
        }
        
        const m = metric.metrics || {};
        metricsByDate[date].likes += typeof m.likes === "number" ? m.likes : 0;
        metricsByDate[date].comments += typeof m.comments === "number" ? m.comments : 0;
        metricsByDate[date].shares += typeof m.shares === "number" ? m.shares : 0;
      });

      // Build series array for all days
      const series = Array.from({ length: days }, (_, i) => {
        const d = new Date(endDate);
        d.setDate(endDate.getDate() - (days - 1 - i));
        const dateStr = d.toISOString().slice(0, 10);
        const dayMetrics = metricsByDate[dateStr] || { likes: 0, comments: 0, shares: 0 };
        
        return {
          date: dateStr,
          likes: dayMetrics.likes,
          comments: dayMetrics.comments,
          shares: dayMetrics.shares,
        };
      });

      res.json({ periodDays: days, series });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler
);

/**
 * GET /api/analytics/content-performance?limit=10
 * Tabular view for top performing content
 * 
 * **Auth:** Required (authenticateUser)
 * **Scope:** content:view
 * **Query:** brandId (UUID, optional), limit (1-50, default 10)
 */
router.get(
  "/content-performance",
  authenticateUser,
  requireScope("content:view"),
  validateBrandId, // Validates brandId format and access (if provided)
  (async (req, res, next) => {
    try {
      // ✅ Use validated brandId from middleware
      let brandId: string | undefined = (req as any).validatedBrandId ?? (req.query.brandId as string);
      let limit: number;
      try {
        const validated = AnalyticsQuerySchema.parse(req.query);
        brandId = brandId || validated.brandId;
        limit = validated.limit || 10;
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          throw new AppError(
            ErrorCode.VALIDATION_ERROR,
            "Invalid query parameters",
            HTTP_STATUS.BAD_REQUEST,
            "warning",
            { validationErrors: validationError.errors }
          );
        }
        throw validationError;
      }

      // Get brandId if not provided
      if (!brandId) {
        const user = req.user || req.auth;
        if (user?.brandIds && user.brandIds.length > 0) {
          brandId = user.brandIds[0];
        } else {
          throw new AppError(
            ErrorCode.MISSING_REQUIRED_FIELD,
            "brandId is required",
            HTTP_STATUS.BAD_REQUEST,
            "warning"
          );
        }
      }

      // Get published content with analytics
      const { data: contentItems, error: contentError } = await supabase
        .from("content_items")
        .select("id, title, platform, status, published_at")
        .eq("brand_id", brandId)
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(limit);

      if (contentError) {
        throw new AppError(
          ErrorCode.DATABASE_ERROR,
          "Failed to fetch content items",
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
          "error",
          { details: contentError.message }
        );
      }

      if (!contentItems || contentItems.length === 0) {
        return res.json({ items: [], total: 0 });
      }

      // Get analytics for content items
      const contentIds = contentItems.map((item) => item.id);
      const metrics = await analyticsDB.getMetricsByDateRange(brandId, undefined, undefined, undefined, 1000);
      
      // Map content items with analytics
      const items = contentItems.map((item) => {
        const itemMetrics = metrics.filter((m) => m.post_id === item.id);
        const totalImpressions = itemMetrics.reduce((sum, m) => {
          const impressions = typeof m.metrics?.impressions === "number" ? m.metrics.impressions : 0;
          return sum + impressions;
        }, 0);
        const totalEngagement = itemMetrics.reduce((sum, m) => {
          const engagement = typeof m.metrics?.engagement === "number" ? m.metrics.engagement : 0;
          return sum + engagement;
        }, 0);
        const totalClicks = itemMetrics.reduce((sum, m) => {
          const clicks = typeof m.metrics?.clicks === "number" ? m.metrics.clicks : 0;
          return sum + clicks;
        }, 0);
        
        const ctr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
        const saves = itemMetrics.reduce((sum, m) => {
          const saves = typeof m.metrics?.saves === "number" ? m.metrics.saves : 0;
          return sum + saves;
        }, 0);
        const comments = itemMetrics.reduce((sum, m) => {
          const comments = typeof m.metrics?.comments === "number" ? m.metrics.comments : 0;
          return sum + comments;
        }, 0);
        const shares = itemMetrics.reduce((sum, m) => {
          const shares = typeof m.metrics?.shares === "number" ? m.metrics.shares : 0;
          return sum + shares;
        }, 0);

        return {
          id: item.id,
          type: item.platform || "post",
          title: item.title || "Untitled",
          publishedAt: item.published_at || item.id,
          impressions: totalImpressions,
          clicks: totalClicks,
          ctr: parseFloat(ctr.toFixed(4)),
          saves,
          comments,
          shares,
        };
      });

      // @supabase-scope-ok Uses .eq("brand_id", brandId) - properly scoped
      // Get total count
      const { count } = await supabase
        .from("content_items")
        .select("*", { count: "exact", head: true })
        .eq("brand_id", brandId)
        .eq("status", "published");

      res.json({ items, total: count || items.length });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler
);

/**
 * GET /api/analytics/top-posts?brandId=...&limit=5
 * Get top performing posts by engagement rate
 * 
 * **Auth:** Required (authenticateUser)
 * **Scope:** content:view
 * **Query:** brandId (UUID, required), limit (1-20, default 5)
 */
router.get(
  "/top-posts",
  authenticateUser,
  requireScope("content:view"),
  validateBrandId, // Validates brandId format and access (required for this route)
  (async (req, res, next) => {
    try {
      // ✅ Use validated brandId from middleware (required for this route)
      const brandId = (req as any).validatedBrandId ?? (req.query.brandId as string);
      if (!brandId) {
        throw new AppError(
          ErrorCode.MISSING_REQUIRED_FIELD,
          "brandId is required",
          HTTP_STATUS.BAD_REQUEST,
          "warning"
        );
      }
      
      let limit: number;
      try {
        const validated = AnalyticsQuerySchema.parse(req.query);
        limit = validated.limit || 5;
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          throw new AppError(
            ErrorCode.VALIDATION_ERROR,
            "Invalid query parameters",
            HTTP_STATUS.BAD_REQUEST,
            "warning",
            { validationErrors: validationError.errors }
          );
        }
        throw validationError;
      }

      // Get published content
      const { data: contentItems, error: contentError } = await supabase
        .from("content_items")
        .select("id, title, platform, published_at")
        .eq("brand_id", brandId)
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(100); // Get more to calculate top performers

      if (contentError) {
        throw new AppError(
          ErrorCode.DATABASE_ERROR,
          "Failed to fetch content items",
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
          "error",
          { details: contentError.message }
        );
      }

      if (!contentItems || contentItems.length === 0) {
        return res.json({ brandId, items: [] });
      }

      // Get analytics metrics
      const metrics = await analyticsDB.getMetricsByDateRange(brandId, undefined, undefined, undefined, 1000);

      // Calculate engagement rates for each post
      const postPerformance = contentItems.map((item) => {
        const itemMetrics = metrics.filter((m) => m.post_id === item.id);
        const totalImpressions = itemMetrics.reduce((sum, m) => {
          const impressions = typeof m.metrics?.impressions === "number" ? m.metrics.impressions : 0;
          return sum + impressions;
        }, 0);
        const totalEngagement = itemMetrics.reduce((sum, m) => {
          const engagement = typeof m.metrics?.engagement === "number" ? m.metrics.engagement : 0;
          return sum + engagement;
        }, 0);
        
        const engagementRate = totalImpressions > 0 ? totalEngagement / totalImpressions : 0;

        return {
          id: item.id,
          brandId,
          title: item.title || "Untitled",
          platform: item.platform || "unknown",
          impressions: totalImpressions,
          engagementRate: parseFloat(engagementRate.toFixed(4)),
          url: item.id, // Use ID as placeholder URL
        };
      });

      // Sort by engagement rate and take top N
      const topPosts = postPerformance
        .sort((a, b) => b.engagementRate - a.engagementRate)
        .slice(0, limit);

      res.json({ brandId, items: topPosts });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler
);

export default router;
