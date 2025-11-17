/**
 * Approval workflow routes
 * Handles bulk approvals, individual approvals, and approval status tracking
 */

import { RequestHandler, Router } from "express";
import { z } from "zod";
import {
  ApprovalBoardResponse,
  ApprovalBoardStatus,
  BulkApprovalRequest,
  BulkApprovalResult,
} from "@shared/approvals";
import { approvalsDB } from "../lib/approvals-db-service";
import { logAuditAction } from "../lib/audit-logger";
import { sendEmail } from "../lib/email-service";
import { AppError } from "../lib/error-middleware";
import { ErrorCode, HTTP_STATUS } from "../lib/error-responses";
import { generateReminderEmail } from "../lib/email-templates";
import { requireScope } from "../middleware/requireScope";
import {
  broadcastApprovalUpdated,
  broadcastApprovalReadyForClient,
  broadcastApprovalClientResponded,
} from "../lib/event-broadcaster";
import { notificationService } from "../lib/notification-service";

/**
 * POST /api/approvals/bulk
 * Approve or reject multiple posts in a single request
 *
 * RBAC: Requires 'content:approve' scope
 * Roles allowed: BRAND_MANAGER, CLIENT_APPROVER, AGENCY_ADMIN, SUPERADMIN
 */
export const bulkApproveContent: RequestHandler = async (req, res, next) => {
  try {
    const { postIds, action, note } = req.body as BulkApprovalRequest;
    const userId = (req as any).user?.id || (req as any).userId;
    const userEmail =
      (req as any).user?.email || (req.headers["x-user-email"] as string);
    const brandId =
      (req as any).user?.brandId || (req.headers["x-brand-id"] as string);

    // Validate required fields
    if (!userId || !brandId) {
      throw new AppError(
        ErrorCode.UNAUTHORIZED,
        "User ID and Brand ID are required",
        HTTP_STATUS.UNAUTHORIZED,
        "warning",
      );
    }

    // Validate input
    if (!Array.isArray(postIds) || postIds.length === 0) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "postIds must be a non-empty array",
        HTTP_STATUS.BAD_REQUEST,
        "warning",
      );
    }

    if (!["approve", "reject"].includes(action)) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "action must be approve or reject",
        HTTP_STATUS.BAD_REQUEST,
        "warning",
      );
    }

    // NOTE: Permission check (content:approve) is now enforced by middleware
    // This handler only executes if user has required scope

    // Process bulk action via database
    const results: BulkApprovalResult = {
      success: true,
      totalRequested: postIds.length,
      approved: 0,
      rejected: 0,
      skipped: 0,
      errors: [],
    };

    try {
      if (action === "approve") {
        await approvalsDB.bulkApprovePostIds(postIds, brandId, userId);
        results.approved = postIds.length;
      } else {
        await approvalsDB.bulkRejectPostIds(
          postIds,
          brandId,
          userId,
          note || "",
        );
        results.rejected = postIds.length;
      }

      // Log audit action for bulk operation
      await logAuditAction(
        brandId,
        "bulk_operation",
        userId,
        userEmail,
        action === "approve" ? "BULK_APPROVED" : "BULK_REJECTED",
        {
          note: note || "",
          bulkCount: postIds.length,
          postIds,
        },
        req.ip,
        req.headers["user-agent"],
      );

      // Emit notifications for each approved/rejected post
      for (const postId of postIds) {
        await notificationService.emit({
          type: action === "approve" ? "content.approved" : "content.rejected",
          brandId,
          userId,
          resourceId: postId,
          resourceType: "content",
          metadata: { note: note || "", bulkOperation: true },
          severity: action === "approve" ? "success" : "warning",
        });
      }
    } catch (error) {
      results.errors.push({
        postId: "bulk_operation",
        reason: error instanceof Error ? error.message : "Unknown error",
      });
    }

    (res as any).json(results);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/approvals/:postId/approve
 * Approve a single post
 */
export const approveSingleContent: RequestHandler = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { note } = req.body;
    const userId = (req as any).user?.id || (req as any).userId;
    const userEmail =
      (req as any).user?.email || (req.headers["x-user-email"] as string);
    const brandId =
      (req as any).user?.brandId || (req.headers["x-brand-id"] as string);
    const userRole =
      (req as any).user?.role || (req.headers["x-user-role"] as string);

    // Validate required fields
    if (!userId || !brandId) {
      throw new AppError(
        ErrorCode.UNAUTHORIZED,
        "User ID and Brand ID are required",
        HTTP_STATUS.UNAUTHORIZED,
        "warning",
      );
    }

    // Validate permissions
    if (!["client", "admin"].includes(userRole)) {
      throw new AppError(
        ErrorCode.FORBIDDEN,
        "Only clients and admins can approve content",
        HTTP_STATUS.FORBIDDEN,
        "warning",
      );
    }

    if (!postId) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "postId is required",
        HTTP_STATUS.BAD_REQUEST,
        "warning",
      );
    }

    // Approve post via database
    const approvedPost = await approvalsDB.approvePost(
      postId,
      brandId,
      userId,
      note,
    );

    // Log approval
    await logAuditAction(
      brandId,
      postId,
      userId,
      userEmail,
      "APPROVED",
      { note: note || "" },
      req.ip,
      req.headers["user-agent"],
    );

    // Emit notification for approved content
    await notificationService.emit({
      type: "content.approved",
      brandId,
      userId,
      resourceId: postId,
      resourceType: "content",
      metadata: { note: note || "" },
      severity: "success",
    });

    (res as any).json({
      success: true,
      postId,
      status: "approved",
      approvedBy: userEmail,
      approvedAt: approvedPost.approval_date || new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/approvals/:postId/reject
 * Reject a post with required changes
 */
export const rejectContent: RequestHandler = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { reason, note } = req.body;
    const userId = (req as any).user?.id || (req as any).userId;
    const userEmail =
      (req as any).user?.email || (req.headers["x-user-email"] as string);
    const brandId =
      (req as any).user?.brandId || (req.headers["x-brand-id"] as string);
    const userRole =
      (req as any).user?.role || (req.headers["x-user-role"] as string);

    // Validate required fields
    if (!userId || !brandId) {
      throw new AppError(
        ErrorCode.UNAUTHORIZED,
        "User ID and Brand ID are required",
        HTTP_STATUS.UNAUTHORIZED,
        "warning",
      );
    }

    // Validate permissions
    if (!["client", "admin"].includes(userRole)) {
      throw new AppError(
        ErrorCode.FORBIDDEN,
        "Only clients and admins can reject content",
        HTTP_STATUS.FORBIDDEN,
        "warning",
      );
    }

    // Validate input
    if (!reason) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "reason is required for rejections",
        HTTP_STATUS.BAD_REQUEST,
        "warning",
      );
    }

    if (!postId) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "postId is required",
        HTTP_STATUS.BAD_REQUEST,
        "warning",
      );
    }

    // Reject post via database
    const rejectedPost = await approvalsDB.rejectPost(
      postId,
      brandId,
      userId,
      reason,
      note,
    );

    // Log rejection
    await logAuditAction(
      brandId,
      postId,
      userId,
      userEmail,
      "REJECTED",
      {
        reason,
        note: note || "",
      },
      req.ip,
      req.headers["user-agent"],
    );

    // Emit notification for rejected content
    await notificationService.emit({
      type: "content.rejected",
      brandId,
      userId,
      resourceId: postId,
      resourceType: "content",
      metadata: { reason, note: note || "" },
      severity: "warning",
    });

    (res as any).json({
      success: true,
      postId,
      status: "rejected",
      rejectedBy: userEmail,
      reason,
      rejectedAt: rejectedPost.rejection_date || new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/approvals/:postId/history
 * Get full audit trail for a post
 */
export const getApprovalHistory: RequestHandler = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const brandId =
      (req as any).user?.brandId || (req.headers["x-brand-id"] as string);

    if (!brandId) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "Brand ID is required",
        HTTP_STATUS.BAD_REQUEST,
        "warning",
      );
    }

    if (!postId) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "postId is required",
        HTTP_STATUS.BAD_REQUEST,
        "warning",
      );
    }

    // Get approval history from database
    const auditTrail = await approvalsDB.getApprovalHistory(postId, brandId);

    (res as any).json({
      postId,
      history: auditTrail,
      totalActions: auditTrail.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/approvals/:postId/request
 * Request approval for a post
 */
export const requestApproval: RequestHandler = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { assignedTo, deadline, priority } = req.body;
    const userId = (req as any).user?.id || (req as any).userId;
    const userEmail =
      (req as any).user?.email || (req.headers["x-user-email"] as string);
    const brandId =
      (req as any).user?.brandId || (req.headers["x-brand-id"] as string);

    // Validate required fields
    if (!userId || !brandId || !postId || !assignedTo) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "userId, brandId, postId, and assignedTo are required",
        HTTP_STATUS.BAD_REQUEST,
        "warning",
      );
    }

    // Create approval request via database
    const approvalRequest = await approvalsDB.createApprovalRequest(
      postId,
      brandId,
      userId,
      assignedTo,
      (priority || "normal") as "low" | "normal" | "high",
      deadline,
    );

    // Log approval request
    await logAuditAction(
      brandId,
      postId,
      userId,
      userEmail,
      "APPROVAL_REQUESTED",
      {
        assignedTo,
        deadline,
        priority: priority || "normal",
      },
      req.ip,
      req.headers["user-agent"],
    );

    (res as any).json({
      success: true,
      postId,
      requestedBy: userEmail,
      assignedTo,
      deadline,
      requestedAt: approvalRequest.created_at,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/approvals/pending
 * Get pending approvals for user
 */
const ApprovalsQuerySchema = z.object({
  brandId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  status: z
    .enum([
      "draft",
      "needs_edits",
      "ready_for_client",
      "awaiting_client",
      "approved",
      "scheduled",
    ])
    .optional(),
  search: z.string().max(120).optional(),
});

const ApproveForClientSchema = z.object({
  note: z.string().max(2000).optional(),
});

const SendToDraftSchema = z.object({
  reason: z.string().min(3).max(500),
});

const ReadyForScheduleSchema = z.object({
  scheduledFor: z.string().datetime().optional(),
});

const BFS_SAFE_THRESHOLD = 0.8;

const UI_TO_DB_STATUS: Record<ApprovalBoardStatus, string[]> = {
  draft: ["draft"],
  needs_edits: ["rejected", "failed"],
  ready_for_client: ["pending_review", "in_review"],
  awaiting_client: ["client_review"],
  approved: ["approved"],
  scheduled: ["scheduled", "published"],
};

const SEND_TO_CLIENT_ALLOWED = new Set([
  "draft",
  "pending_review",
  "in_review",
  "rejected",
]);
const SEND_TO_DRAFT_ALLOWED = new Set([
  "client_review",
  "pending_review",
  "in_review",
  "approved",
  "rejected",
]);
const READY_FOR_SCHEDULE_ALLOWED = new Set(["client_review", "approved"]);

const getPendingApprovals: RequestHandler = async (req, res, next) => {
  try {
    const user = getRequestUser(req);
    const { brandId, limit, offset, status, search } =
      ApprovalsQuerySchema.parse(req.query);

    const actorBrands: string[] = Array.isArray(user.brandIds)
      ? user.brandIds
      : [];

    const brandIds = brandId
      ? [brandId]
      : actorBrands.length
        ? actorBrands
        : user.brandId
          ? [user.brandId]
          : [];

    if (!brandIds.length) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "brandId is required for approvals query",
        HTTP_STATUS.BAD_REQUEST,
        "warning",
      );
    }

    if (
      brandId &&
      actorBrands.length > 0 &&
      !actorBrands.includes(brandId) &&
      user.role?.toUpperCase() !== "SUPERADMIN"
    ) {
      throw new AppError(
        ErrorCode.FORBIDDEN,
        "Not authorized for requested brand",
        HTTP_STATUS.FORBIDDEN,
        "warning",
      );
    }

    const dbStatuses = status ? UI_TO_DB_STATUS[status] : undefined;

    const { items, total } = await approvalsDB.getApprovalBoardItems({
      brandIds,
      statuses: dbStatuses,
      limit,
      offset,
      search,
    });

    const response: ApprovalBoardResponse = {
      items,
      total,
      limit,
      offset,
      hasMore: offset + items.length < total,
    };

    (res as any).json(response);
  } catch (error) {
    next(error);
  }
};

const approveForClient: RequestHandler = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { note } = ApproveForClientSchema.parse(req.body ?? {});
    const user = getRequestUser(req);

    const record = await approvalsDB.getScheduledContentById(postId);

    if (!record) {
      throw new AppError(
        ErrorCode.NOT_FOUND,
        "Content not found",
        HTTP_STATUS.NOT_FOUND,
        "warning",
      );
    }

    enforceBrandAccess(user, record.brand_id);
    enforceStatusTransition(record.status, SEND_TO_CLIENT_ALLOWED, "send to client");
    enforceQualityThreshold(record);

    const updated = await approvalsDB.updateScheduledContent(
      postId,
      record.brand_id,
      {
        status: "client_review",
      },
    );

    await logAuditAction(
      record.brand_id,
      postId,
      user.id,
      user.email,
      "APPROVAL_REQUESTED",
      {
        note: note || "",
        fromStatus: record.status,
        toStatus: "client_review",
      },
      req.ip,
      req.headers["user-agent"],
    );

    // Broadcast approval event
    broadcastApprovalReadyForClient(
      postId,
      record.brand_id,
      user.id,
      user.email
      // TODO: Get clientUserId from brand_members or brand settings
    );

    broadcastApprovalUpdated({
      postId,
      brandId: record.brand_id,
      fromStatus: record.status,
      toStatus: "client_review",
      actorId: user.id,
      actorEmail: user.email,
      note: note || undefined,
    });

    const item = await approvalsDB.toBoardItem(updated);

    (res as any).json({
      success: true,
      item,
    });
  } catch (error) {
    next(error);
  }
};

const sendBackToDraft: RequestHandler = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { reason } = SendToDraftSchema.parse(req.body ?? {});
    const user = getRequestUser(req);

    const record = await approvalsDB.getScheduledContentById(postId);

    if (!record) {
      throw new AppError(
        ErrorCode.NOT_FOUND,
        "Content not found",
        HTTP_STATUS.NOT_FOUND,
        "warning",
      );
    }

    enforceBrandAccess(user, record.brand_id);
    enforceStatusTransition(record.status, SEND_TO_DRAFT_ALLOWED, "send to draft");

    const updated = await approvalsDB.updateScheduledContent(
      postId,
      record.brand_id,
      {
        status: "draft",
      },
    );

    await logAuditAction(
      record.brand_id,
      postId,
      user.id,
      user.email,
      "REJECTED",
      {
        reason,
        fromStatus: record.status,
        toStatus: "draft",
      },
      req.ip,
      req.headers["user-agent"],
    );

    // Broadcast approval event
    broadcastApprovalUpdated({
      postId,
      brandId: record.brand_id,
      fromStatus: record.status,
      toStatus: "draft",
      actorId: user.id,
      actorEmail: user.email,
      reason,
    });

    const item = await approvalsDB.toBoardItem(updated);

    (res as any).json({
      success: true,
      item,
    });
  } catch (error) {
    next(error);
  }
};

const markReadyForScheduling: RequestHandler = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { scheduledFor } = ReadyForScheduleSchema.parse(req.body ?? {});
    const user = getRequestUser(req);

    const record = await approvalsDB.getScheduledContentById(postId);

    if (!record) {
      throw new AppError(
        ErrorCode.NOT_FOUND,
        "Content not found",
        HTTP_STATUS.NOT_FOUND,
        "warning",
      );
    }

    enforceBrandAccess(user, record.brand_id);
    enforceStatusTransition(
      record.status,
      READY_FOR_SCHEDULE_ALLOWED,
      "mark ready for scheduling",
    );

    const updates: Record<string, unknown> = {
      status: "scheduled",
    };

    if (scheduledFor) {
      updates.scheduled_for = scheduledFor;
    } else if (!record.scheduled_for) {
      updates.scheduled_for = new Date().toISOString();
    }

    const updated = await approvalsDB.updateScheduledContent(
      postId,
      record.brand_id,
      updates,
    );

    await logAuditAction(
      record.brand_id,
      postId,
      user.id,
      user.email,
      "APPROVED",
      {
        fromStatus: record.status,
        toStatus: "scheduled",
      },
      req.ip,
      req.headers["user-agent"],
    );

    // Broadcast approval event
    broadcastApprovalUpdated({
      postId,
      brandId: record.brand_id,
      fromStatus: record.status,
      toStatus: "scheduled",
      actorId: user.id,
      actorEmail: user.email,
    });

    const item = await approvalsDB.toBoardItem(updated);

    (res as any).json({
      success: true,
      item,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/approvals/send-reminder
 * Send approval reminder email
 */
export const sendApprovalReminder: RequestHandler = async (req, res, next) => {
  try {
    const { clientEmail, brandName, pendingCount, oldestPendingAge } = req.body;
    const brandId =
      (req as any).user?.brandId || (req.headers["x-brand-id"] as string);
    const userId = (req as any).user?.id || (req as any).userId;
    const userEmail =
      (req as any).user?.email || (req.headers["x-user-email"] as string);

    // Validate required fields
    if (!brandId || !userId || !clientEmail || !brandName) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "brandId, userId, clientEmail, and brandName are required",
        HTTP_STATUS.BAD_REQUEST,
        "warning",
      );
    }

    // Generate reminder email
    const { subject, htmlBody, textBody } = generateReminderEmail({
      clientName: clientEmail.split("@")[0],
      brandName,
      pendingCount,
      oldestPendingAge,
      approvalUrl: `${process.env.CLIENT_URL}/approvals`,
      agencyName: "Postd",
      brandColor: "#8B5CF6",
    });

    // Send email
    const sendResult = await sendEmail({
      to: clientEmail,
      subject,
      htmlBody,
      textBody,
      brandId,
      userId,
      notificationType: "approval_reminder",
    });

    if (!sendResult.success) {
      throw new AppError(
        ErrorCode.EXTERNAL_SERVICE_ERROR,
        sendResult.error || "Failed to send email",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "warning",
      );
    }

    // Log email send
    await logAuditAction(brandId, "system", userId, userEmail, "EMAIL_SENT", {
      emailAddress: clientEmail,
      type: "approval_reminder",
      messageId: sendResult.messageId,
    });

    (res as any).json({
      success: true,
      messageId: sendResult.messageId,
      sentTo: clientEmail,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Approvals Router
 * Applies per-route RBAC guards
 */
const approvalsRouter = Router();

approvalsRouter.post(
  "/bulk",
  requireScope("content:approve"),
  bulkApproveContent,
);

approvalsRouter.post(
  "/:postId/approve",
  requireScope("content:approve"),
  approveSingleContent,
);

approvalsRouter.post(
  "/:postId/reject",
  requireScope("content:approve"),
  rejectContent,
);

approvalsRouter.post(
  "/:postId/request",
  requireScope("content:view"),
  requestApproval,
);

approvalsRouter.get(
  "/pending",
  requireScope("content:view"),
  getPendingApprovals,
);

approvalsRouter.get(
  "/:postId/history",
  requireScope("content:view"),
  getApprovalHistory,
);

approvalsRouter.post(
  "/send-reminder",
  requireScope("content:approve"),
  sendApprovalReminder,
);

approvalsRouter.post(
  "/:postId/approve-for-client",
  requireScope("content:approve"),
  approveForClient,
);

approvalsRouter.post(
  "/:postId/send-to-draft",
  requireScope("content:approve"),
  sendBackToDraft,
);

approvalsRouter.post(
  "/:postId/mark-ready-schedule",
  requireScope("content:approve"),
  markReadyForScheduling,
);

export default approvalsRouter;

function getRequestUser(req: any) {
  const user = req.user || req.auth;
  if (!user) {
    throw new AppError(
      ErrorCode.UNAUTHORIZED,
      "Authentication required",
      HTTP_STATUS.UNAUTHORIZED,
      "warning",
    );
  }
  return user;
}

function enforceBrandAccess(user: any, brandId: string) {
  const userBrands: string[] = Array.isArray(user.brandIds) ? user.brandIds : [];
  if (
    userBrands.length > 0 &&
    !userBrands.includes(brandId) &&
    (user.role || "").toUpperCase() !== "SUPERADMIN"
  ) {
    throw new AppError(
      ErrorCode.FORBIDDEN,
      "Not authorized for this brand",
      HTTP_STATUS.FORBIDDEN,
      "warning",
    );
  }
}

function enforceStatusTransition(
  currentStatus: string,
  allowedStatuses: Set<string>,
  actionLabel: string,
) {
  if (!allowedStatuses.has(currentStatus)) {
    throw new AppError(
      ErrorCode.CONFLICT,
      `Cannot ${actionLabel} from status "${currentStatus}"`,
      HTTP_STATUS.CONFLICT,
      "warning",
    );
  }
}

function enforceQualityThreshold(record: Record<string, any>) {
  if (
    typeof record.bfs_score === "number" &&
    record.bfs_score < BFS_SAFE_THRESHOLD
  ) {
    throw new AppError(
      ErrorCode.FORBIDDEN,
      `Content BFS score ${record.bfs_score.toFixed(2)} is below threshold`,
      HTTP_STATUS.FORBIDDEN,
      "warning",
    );
  }

  if (Array.isArray(record.compliance_flags) && record.compliance_flags.length) {
    throw new AppError(
      ErrorCode.FORBIDDEN,
      "Resolve compliance flags before sending to client",
      HTTP_STATUS.FORBIDDEN,
      "warning",
    );
  }
}
