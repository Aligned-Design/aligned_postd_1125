/**
 * Calendar API Routes
 * 
 * Provides endpoints for fetching scheduled content for calendar views
 */

import { Router, RequestHandler } from "express";
import { authenticateUser } from "../middleware/security";
import { requireScope } from "../middleware/requireScope";
import { assertBrandAccess } from "../lib/brand-access";
import { supabase } from "../lib/supabase";
import { AppError } from "../lib/error-middleware";
import { ErrorCode, HTTP_STATUS } from "../lib/error-responses";
import { logger } from "../lib/logger";

const calendarRouter = Router();

/**
 * GET /api/calendar/:brandId
 * Fetch scheduled content items for calendar view
 * 
 * Query params:
 * - startDate: ISO date string (default: today)
 * - endDate: ISO date string (default: 30 days from today)
 * - status: filter by status (draft, scheduled, published, etc.)
 */
calendarRouter.get(
  "/:brandId",
  authenticateUser,
  requireScope("content:view"),
  (async (req, res, next) => {
    try {
      const { brandId } = req.params;
      await assertBrandAccess(req, brandId, true, true);

      const startDate = req.query.startDate as string || new Date().toISOString().split('T')[0];
      const endDate = req.query.endDate as string || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const status = req.query.status as string | undefined;

      // Build query
      let query = supabase
        .from("content_items")
        .select("*")
        .eq("brand_id", brandId)
        .gte("scheduled_for", `${startDate}T00:00:00Z`)
        .lte("scheduled_for", `${endDate}T23:59:59Z`)
        .order("scheduled_for", { ascending: true });

      if (status) {
        query = query.eq("status", status);
      }

      const { data: contentItems, error } = await query;

      if (error) {
        logger.error("Failed to fetch calendar content", error, { brandId, startDate, endDate });
        throw new AppError(
          ErrorCode.DATABASE_ERROR,
          "Failed to fetch calendar content",
          HTTP_STATUS.INTERNAL_SERVER_ERROR
        );
      }

      // Transform to calendar format
      const calendarItems = (contentItems || []).map((item: any) => ({
        id: item.id,
        title: item.title || "Untitled",
        platform: item.platform || "instagram",
        contentType: item.content_type || "post",
        status: item.status || "draft",
        scheduledDate: item.scheduled_for ? item.scheduled_for.split('T')[0] : null,
        scheduledTime: item.scheduled_for ? item.scheduled_for.split('T')[1]?.substring(0, 5) : null,
        content: item.body || "",
        excerpt: (item.body || "").substring(0, 100) + "...",
        imageUrl: item.media_urls?.[0] || null,
        brand: item.brand_id,
        campaign: item.campaign_id || null,
        createdDate: item.created_at ? item.created_at.split('T')[0] : null,
      }));

      (res as any).json({
        success: true,
        items: calendarItems,
        count: calendarItems.length,
      });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler
);

export default calendarRouter;

