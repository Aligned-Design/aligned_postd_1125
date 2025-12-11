/**
 * Content Items API Routes
 * 
 * Provides endpoints for listing and managing content items (generated posts, captions, etc.)
 * Used by Content Queue and Studio pages to display generated content.
 */

import { Router, RequestHandler } from "express";
import { supabase } from "../lib/supabase";
import { authenticateUser } from "../middleware/security";
import { validateBrandId } from "../middleware/validate-brand-id";
import { assertBrandAccess } from "../lib/brand-access";
import { AppError } from "../lib/error-middleware";
import { ErrorCode, HTTP_STATUS } from "../lib/error-responses";

const router = Router();

/**
 * GET /api/content-items
 * List content items for a brand
 * 
 * Query params:
 * - brandId (required): Brand ID to filter by
 * - status (optional): Filter by status (draft, scheduled, published, etc.)
 * - platform (optional): Filter by platform
 * - limit (optional): Max items to return (default: 50)
 * - offset (optional): Pagination offset (default: 0)
 */
router.get("/", authenticateUser, validateBrandId, async (req, res, next) => {
  try {
    // ✅ Use validated brandId from middleware (checks params, query, body)
    const brandId = (req as any).validatedBrandId ?? (req.query.brandId as string);
    const { status, platform, limit = "50", offset = "0" } = req.query;

    const limitNum = parseInt(limit as string, 10) || 50;
    const offsetNum = parseInt(offset as string, 10) || 0;

    // Build query
    let query = supabase
      .from("content_items")
      .select("*")
      .eq("brand_id", brandId)
      .order("created_at", { ascending: false })
      .range(offsetNum, offsetNum + limitNum - 1);

    // Apply filters
    if (status && typeof status === "string") {
      query = query.eq("status", status);
    }

    if (platform && typeof platform === "string") {
      // content_items.content is JSONB, may contain platform field
      // For now, filter by content->>platform if it exists
      query = query.or(`content->>platform.eq.${platform},metadata->>platform.eq.${platform}`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[ContentItems] Error fetching content items:", error);
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to fetch content items",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "error",
        { details: error.message }
      );
    }

    // Map to response format expected by Content Queue
    const items = (data || []).map((item: any) => {
      const content = item.content || {};
      const metadata = item.metadata || {};
      
      return {
        id: item.id,
        title: content.headline || content.title || item.title || "Untitled Post",
        name: content.headline || content.title || item.title || "Untitled Post",
        content: content.body || content.caption || content.text || "",
        body: content.body || content.caption || content.text || "",
        caption: content.caption || content.body || content.text || "",
        platform: content.platform || metadata.platform || item.platform || "instagram",
        type: content.type || metadata.type || item.type || "post",
        status: item.status || "draft",
        brand_id: item.brand_id,
        brandId: item.brand_id,
        brand_name: metadata.brand_name || item.brand_name,
        brandName: metadata.brand_name || item.brand_name,
        campaign: content.campaign || metadata.campaign || item.campaign,
        campaign_name: content.campaign || metadata.campaign || item.campaign,
        created_at: item.created_at,
        createdAt: item.created_at,
        // Handle both scheduled_for (schema) and scheduled_at (legacy) columns
        scheduled_at: item.scheduled_for || item.scheduled_at || content.scheduledDate,
        scheduledAt: item.scheduled_for || item.scheduled_at || content.scheduledDate,
        published_at: item.published_at,
        publishedAt: item.published_at,
        error_message: item.error_message || metadata.error_message,
        errorMessage: item.error_message || metadata.error_message,
        content_id: item.id,
      };
    });

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      items,
      posts: items, // Alias for backward compatibility
      total: items.length,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/content-items/:id
 * Get a single content item by ID
 */
router.get("/:id", authenticateUser, async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("content_items")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        throw new AppError(
          ErrorCode.NOT_FOUND,
          "Content item not found",
          HTTP_STATUS.NOT_FOUND,
          "warning"
        );
      }
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to fetch content item",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "error",
        { details: error.message }
      );
    }

    // ✅ SECURITY: Verify user has access to this brand
    await assertBrandAccess(req, data.brand_id, true, true);

    const content = data.content || {};

    const item = {
      id: data.id,
      title: content.headline || content.title || data.title || "Untitled Post",
      content: content.body || content.caption || content.text || "",
      platform: content.platform || data.platform || "instagram",
      status: data.status || "draft",
      brand_id: data.brand_id,
      created_at: data.created_at,
      // Handle both scheduled_for (schema) and scheduled_at (legacy) + content.scheduledDate
      scheduled_at: data.scheduled_for || data.scheduled_at || content.scheduledDate,
      published_at: data.published_at,
      generated_by_agent: data.generated_by_agent,
      media_urls: data.media_urls,
      ...content,
    };

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      item,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

