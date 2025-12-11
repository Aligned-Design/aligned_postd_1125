/**
 * Approvals API Routes (v2)
 * 
 * Real implementation using approvals database service.
 * Replaces mock implementation with actual data access.
 */

import { Router, RequestHandler } from "express";
import { z } from "zod";
import { approvalsDB } from "../lib/approvals-db-service";
import { AppError } from "../lib/error-middleware";
import { ErrorCode, HTTP_STATUS } from "../lib/error-responses";
import { authenticateUser } from "../middleware/security";
import { requireScope } from "../middleware/requireScope";
import { validateBrandId } from "../middleware/validate-brand-id";
import { assertBrandAccess } from "../lib/brand-access";
import { supabase } from "../lib/supabase";
import { extractBody, extractTitle } from "@shared/content-item";

const router = Router();

// ✅ VALIDATION: Zod schemas for approvals routes
// Note: brandId validation is handled by validateBrandId middleware
const ApprovalQuerySchema = z.object({
  brandId: z.string().optional(), // Format validation handled by middleware
  limit: z.coerce.number().int().min(1).max(100).default(10).optional(),
  offset: z.coerce.number().int().min(0).default(0).optional(),
  status: z.enum(["pending", "approved", "rejected"]).optional(),
});

const ApprovalIdParamSchema = z.object({
  approvalId: z.string().uuid("Invalid approval ID format"),
});

const ApproveBodySchema = z.object({
  notes: z.string().optional(),
}).strict();

const RejectBodySchema = z.object({
  reason: z.string().min(1, "Reason is required"),
}).strict();

/**
 * GET /api/approvals/pending?brandId=...&limit=10&offset=0
 * List pending approvals with pagination
 * 
 * **Auth:** Required (authenticateUser)
 * **Scope:** content:view
 * **Query:** brandId (UUID, optional), limit (1-100, default 10), offset (default 0), status (optional)
 */
router.get(
  "/pending",
  authenticateUser,
  requireScope("content:view"),
  (async (req, res, next) => {
    try {
      // ✅ VALIDATION: Validate query parameters
      let brandId: string | undefined;
      let limit: number;
      let offset: number;
      let status: "pending" | "approved" | "rejected" | undefined;
      
      try {
        const validated = ApprovalQuerySchema.parse(req.query);
        brandId = validated.brandId;
        limit = validated.limit || 10;
        offset = validated.offset || 0;
        status = validated.status;
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

      const user = req.user || req.auth;
      const userId = req.user?.id || req.auth?.userId;

      if (!userId) {
        throw new AppError(
          ErrorCode.UNAUTHORIZED,
          "User ID is required",
          HTTP_STATUS.UNAUTHORIZED,
          "warning"
        );
      }

      // Get brandId if not provided
      if (!brandId) {
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

      // Brand access already verified by validateBrandId middleware

      // Get pending approvals from database
      const { approvals, total } = await approvalsDB.getPendingApprovalsForUser(
        userId,
        brandId,
        limit,
        offset
      );

      // Get content items for approvals
      // ✅ RLS HARDENING: Add explicit brand_id filter for defense-in-depth
      const postIds = approvals.map((a) => a.post_id);
      const { data: contentItems, error: contentError } = await supabase
        .from("content_items")
        .select("id, title, platform, status, content, scheduled_for")
        .eq("brand_id", brandId) // Explicit brand filter
        .in("id", postIds.length > 0 ? postIds : ["none"]);

      if (contentError) {
        const { logger } = await import("../lib/logger");
        logger.error("Error fetching content items", new Error(contentError.message), {
          code: contentError.code,
        });
      }

      // ✅ Map approvals to response format using shared extractors
      const items = approvals.map((approval) => {
        const contentItem = contentItems?.find((item) => item.id === approval.post_id);
        const content = contentItem?.content as Record<string, unknown> | undefined;
        
        return {
          id: approval.id,
          brandId: approval.brand_id,
          contentId: approval.post_id,
          title: contentItem?.title || "Untitled",
          platform: contentItem?.platform || "unknown",
          status: approval.status,
          requestedBy: approval.requested_by,
          requestedAt: approval.created_at,
          dueDate: approval.deadline,
          content: {
            headline: extractTitle(content) || contentItem?.title || "",
            body: extractBody(content),
          },
        };
      });

      // Filter by status if provided
      let filteredItems = items;
      if (status) {
        filteredItems = items.filter((item) => item.status === status);
      }

      res.json({
        items: filteredItems,
        total: filteredItems.length,
        limit,
        offset,
        hasMore: offset + limit < filteredItems.length,
      });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler
);

/**
 * GET /api/approvals/:approvalId
 * Get single approval details
 * 
 * **Auth:** Required (authenticateUser)
 * **Scope:** content:view
 * **Params:** approvalId (UUID)
 */
router.get(
  "/:approvalId",
  authenticateUser,
  requireScope("content:view"),
  (async (req, res, next) => {
    try {
      // ✅ VALIDATION: Validate approvalId parameter
      let approvalId: string;
      try {
        const validated = ApprovalIdParamSchema.parse(req.params);
        approvalId = validated.approvalId;
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          throw new AppError(
            ErrorCode.VALIDATION_ERROR,
            "Invalid approval ID format",
            HTTP_STATUS.BAD_REQUEST,
            "warning",
            { validationErrors: validationError.errors }
          );
        }
        throw validationError;
      }

      // Get approval request from database
      const { data: approval, error: approvalError } = await supabase
        .from("approval_requests")
        .select("*")
        .eq("id", approvalId)
        .single();

      if (approvalError || !approval) {
        throw new AppError(
          ErrorCode.NOT_FOUND,
          "Approval not found",
          HTTP_STATUS.NOT_FOUND,
          "info"
        );
      }

      // ✅ Verify brand access (brandId comes from approval record, not request params)
      // Note: Cannot use validateBrandId middleware here since brandId is from DB, not request
      await assertBrandAccess(req, approval.brand_id, true, true);

      // Get content item
      const { data: contentItem, error: contentError } = await supabase
        .from("content_items")
        .select("id, title, platform, status, content, scheduled_for")
        .eq("id", approval.post_id)
        .single();

      if (contentError) {
        const { logger } = await import("../lib/logger");
        logger.error("Error fetching content item", new Error(contentError.message), {
          code: contentError.code,
          postId: approval.post_id,
        });
      }

      const content = contentItem?.content as Record<string, unknown> | undefined;

      const response = {
        id: approval.id,
        brandId: approval.brand_id,
        contentId: approval.post_id,
        title: contentItem?.title || "Untitled",
        platform: contentItem?.platform || "unknown",
        status: approval.status,
        requestedBy: approval.requested_by,
        requestedAt: approval.created_at,
        dueDate: approval.deadline,
        content: {
          headline: extractTitle(content) || contentItem?.title || "",
          body: extractBody(content),
        },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }) as RequestHandler
);

/**
 * POST /api/approvals/:approvalId/approve
 * Approve content
 * 
 * **Auth:** Required (authenticateUser)
 * **Scope:** content:approve
 * **Params:** approvalId (UUID)
 * **Body:** { notes?: string }
 */
router.post(
  "/:approvalId/approve",
  authenticateUser,
  requireScope("content:approve"),
  (async (req, res, next) => {
    try {
      // ✅ VALIDATION: Validate params and body
      let approvalId: string;
      let notes: string | undefined;
      
      try {
        const validatedParams = ApprovalIdParamSchema.parse(req.params);
        approvalId = validatedParams.approvalId;
        const validatedBody = ApproveBodySchema.parse(req.body);
        notes = validatedBody.notes;
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

      const user = req.user || req.auth;
      const userId = req.user?.id || req.auth?.userId;

      if (!userId) {
        throw new AppError(
          ErrorCode.UNAUTHORIZED,
          "User ID is required",
          HTTP_STATUS.UNAUTHORIZED,
          "warning"
        );
      }

      // Get approval request
      const { data: approval, error: approvalError } = await supabase
        .from("approval_requests")
        .select("*")
        .eq("id", approvalId)
        .single();

      if (approvalError || !approval) {
        throw new AppError(
          ErrorCode.NOT_FOUND,
          "Approval not found",
          HTTP_STATUS.NOT_FOUND,
          "info"
        );
      }

      // ✅ Verify brand access (brandId comes from approval record, not request params)
      // Note: Cannot use validateBrandId middleware here since brandId is from DB, not request
      await assertBrandAccess(req, approval.brand_id, true, true);

      // Approve the post
      await approvalsDB.approvePost(
        approval.post_id,
        approval.brand_id,
        userId,
        notes
      );

      // Update approval request status
      await supabase
        .from("approval_requests")
        .update({ status: "approved", updated_at: new Date().toISOString() })
        .eq("id", approvalId);

      res.json({
        approvalId,
        status: "approved",
        approvedAt: new Date().toISOString(),
        notes,
      });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler
);

/**
 * POST /api/approvals/:approvalId/reject
 * Reject content
 * 
 * **Auth:** Required (authenticateUser)
 * **Scope:** content:approve
 * **Params:** approvalId (UUID)
 * **Body:** { reason: string }
 */
router.post(
  "/:approvalId/reject",
  authenticateUser,
  requireScope("content:approve"),
  (async (req, res, next) => {
    try {
      // ✅ VALIDATION: Validate params and body
      let approvalId: string;
      let reason: string;
      
      try {
        const validatedParams = ApprovalIdParamSchema.parse(req.params);
        approvalId = validatedParams.approvalId;
        const validatedBody = RejectBodySchema.parse(req.body);
        reason = validatedBody.reason;
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

      const user = req.user || req.auth;
      const userId = req.user?.id || req.auth?.userId;

      if (!userId) {
        throw new AppError(
          ErrorCode.UNAUTHORIZED,
          "User ID is required",
          HTTP_STATUS.UNAUTHORIZED,
          "warning"
        );
      }

      // Get approval request
      const { data: approval, error: approvalError } = await supabase
        .from("approval_requests")
        .select("*")
        .eq("id", approvalId)
        .single();

      if (approvalError || !approval) {
        throw new AppError(
          ErrorCode.NOT_FOUND,
          "Approval not found",
          HTTP_STATUS.NOT_FOUND,
          "info"
        );
      }

      // ✅ Verify brand access (brandId comes from approval record, not request params)
      // Note: Cannot use validateBrandId middleware here since brandId is from DB, not request
      await assertBrandAccess(req, approval.brand_id, true, true);

      // Reject the post
      await approvalsDB.rejectPost(
        approval.post_id,
        approval.brand_id,
        userId,
        reason
      );

      // Update approval request status
      await supabase
        .from("approval_requests")
        .update({ status: "rejected", updated_at: new Date().toISOString() })
        .eq("id", approvalId);

      res.json({
        approvalId,
        status: "rejected",
        rejectedAt: new Date().toISOString(),
        reason,
      });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler
);

/**
 * GET /api/approvals/history?brandId=...&limit=20
 * Get approval history
 * 
 * **Auth:** Required (authenticateUser)
 * **Scope:** content:view
 * **Query:** brandId (UUID, optional), limit (1-100, default 20)
 */
router.get(
  "/history",
  authenticateUser,
  requireScope("content:view"),
  validateBrandId, // Validates brandId format and access (if provided)
  (async (req, res, next) => {
    try {
      // ✅ Use validated brandId from middleware
      let brandId: string | undefined = (req as any).validatedBrandId ?? (req.query.brandId as string);
      let limit: number;
      
      try {
        const validated = ApprovalQuerySchema.parse(req.query);
        brandId = brandId || validated.brandId;
        limit = validated.limit || 20;
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

      // Get approval history (non-pending approvals)
      const { data: approvals, error: approvalsError } = await supabase
        .from("approval_requests")
        .select("*")
        .eq("brand_id", brandId)
        .neq("status", "pending")
        .order("updated_at", { ascending: false })
        .limit(limit);

      if (approvalsError) {
        throw new AppError(
          ErrorCode.DATABASE_ERROR,
          "Failed to fetch approval history",
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
          "error",
          { details: approvalsError.message }
        );
      }

      // Get content items
      // ✅ RLS HARDENING: Add explicit brand_id filter for defense-in-depth
      const postIds = (approvals || []).map((a: any) => a.post_id);
      const { data: contentItems } = await supabase
        .from("content_items")
        .select("id, title, platform, status, content")
        .eq("brand_id", brandId) // Explicit brand filter
        .in("id", postIds.length > 0 ? postIds : ["none"]);

      // Map to response format
      const items = (approvals || []).map((approval: any) => {
        const contentItem = contentItems?.find((item) => item.id === approval.post_id);
        const content = contentItem?.content as Record<string, unknown> | undefined;

        return {
          id: approval.id,
          brandId: approval.brand_id,
          contentId: approval.post_id,
          title: contentItem?.title || "Untitled",
          platform: contentItem?.platform || "unknown",
          status: approval.status,
          requestedBy: approval.requested_by,
          requestedAt: approval.created_at,
          approvedBy: approval.status === "approved" ? approval.assigned_to : undefined,
          approvedAt: approval.status === "approved" ? approval.updated_at : undefined,
          content: {
            headline: extractTitle(content) || contentItem?.title || "",
            body: extractBody(content),
          },
        };
      });

      res.json({ items, total: items.length });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler
);

export default router;
