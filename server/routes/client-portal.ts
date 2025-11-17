import { RequestHandler, Router } from "express";
import { z } from "zod";
import {
  ClientDashboardData,
  ContentComment,
  ContentItem,
} from "@shared/client-portal";
import { WorkflowAction } from "@shared/workflow";
import { clientPortalDB } from "../lib/client-portal-db-service";
import { AppError } from "../lib/error-middleware";
import { ErrorCode, HTTP_STATUS } from "../lib/error-responses";
import { broadcastApprovalClientResponded } from "../lib/event-broadcaster";
import { requireScope } from "../middleware/requireScope";
import { supabase } from "../lib/supabase";
import { workflowDB } from "../lib/workflow-db-service";
import { logAuditAction } from "../lib/audit-logger";

/**
 * GET /api/client-portal/dashboard
 * Get client dashboard with content, metrics, and pending approvals
 */
export const getClientDashboard: RequestHandler = async (req, res, next) => {
  try {
    const context = getPortalContext(req);

    const dashboardContent = await clientPortalDB.getClientDashboardContent(
      context.brandId,
      context.userId,
      50,
      0,
    );

    const brandInfo = await fetchBrandProfile(context.brandId);
    const metricsRow = await fetchLatestDashboardMetric(context.brandId);
    const mappedRecent = dashboardContent.recentContent.map(mapContentRecord);
    const mappedUpcoming = dashboardContent.upcomingPosts.map(mapContentRecord);
    const mappedPending = dashboardContent.pendingApprovals.map(
      mapContentRecord,
    );

    const metrics = buildDashboardMetrics(
      metricsRow,
      mappedRecent,
      mappedUpcoming,
      mappedPending,
    );

    const topPerformingContent = deriveTopContent(
      metricsRow,
      mappedRecent,
      mappedUpcoming,
    );

    const dashboardData: ClientDashboardData = {
      brandInfo,
      agencyInfo: {
        name: "Postd Agency",
        logo: brandInfo.logo,
        contactEmail: "support@postd.agency",
        supportUrl: "https://support.postd.agency",
      },
      metrics,
      aiInsight: buildAiInsight(metricsRow, metrics),
      recentContent: mappedRecent,
      upcomingPosts: mappedUpcoming,
      pendingApprovals: mappedPending,
      topPerformingContent,
      recentComments: [],
      quickActions: {
        approvalsNeeded: mappedPending.length,
        reviewsAvailable: mappedUpcoming.length,
        eventsUpcoming: 0,
      },
    };

    (res as any).json(dashboardData);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/client-portal/content/:contentId/approve
 * Approve content as client
 */
export const approveContent: RequestHandler = async (req, res, next) => {
  try {
    const { contentId } = req.params;
    const { feedback } = req.body;
    const brandId = (req as unknown).user?.brandId;
    const clientId = (req as unknown).user?.id || (req as unknown).userId;

    if (!brandId || !clientId || !contentId) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        'brandId, clientId, and contentId are required',
        HTTP_STATUS.BAD_REQUEST,
        'warning'
      );
    }

    // Approve content via database
    const approval = await clientPortalDB.approveContent(
      contentId,
      brandId,
      clientId,
      feedback
    );

    // Broadcast client approval
    broadcastApprovalClientResponded(
      contentId,
      brandId,
      clientId,
      "approved"
    );

    (res as any).json({
      success: true,
      contentId,
      approved: true,
      message: 'Content approved successfully',
      approvedAt: approval.approved_at,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/client-portal/content/:contentId/reject
 * Reject content as client with feedback
 */
export const rejectContent: RequestHandler = async (req, res, next) => {
  try {
    const { contentId } = req.params;
    const { feedback } = req.body;
    const brandId = (req as unknown).user?.brandId;
    const clientId = (req as unknown).user?.id || (req as unknown).userId;

    if (!brandId || !clientId || !contentId) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        'brandId, clientId, and contentId are required',
        HTTP_STATUS.BAD_REQUEST,
        'warning'
      );
    }

    if (!feedback?.trim()) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        'feedback is required when rejecting content',
        HTTP_STATUS.BAD_REQUEST,
        'warning'
      );
    }

    // Reject content via database
    const rejection = await clientPortalDB.rejectContent(
      contentId,
      brandId,
      clientId,
      feedback.trim()
    );

    // Broadcast client rejection
    broadcastApprovalClientResponded(
      contentId,
      brandId,
      clientId,
      "rejected",
      feedback.trim()
    );

    (res as any).json({
      success: true,
      contentId,
      approved: false,
      message: 'Feedback requested - content returned to drafts',
      rejectedAt: rejection.created_at,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/client-portal/content/:contentId/comments
 * Add comment to content
 */
export const addContentComment: RequestHandler = async (req, res, next) => {
  try {
    const { contentId } = req.params;
    const { message } = req.body;
    const userId = (req as unknown).user?.id || (req as unknown).userId;
    const userName = (req as unknown).user?.name || 'User';
    const userRole = (req as unknown).user?.role || 'client';

    if (!contentId || !message?.trim()) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        'contentId and message are required',
        HTTP_STATUS.BAD_REQUEST,
        'warning'
      );
    }

    // Add comment via database
    const comment = await clientPortalDB.addContentComment(
      contentId,
      userId,
      userName,
      userRole as unknown,
      message.trim(),
      false
    );

    (res as any).json({
      success: true,
      comment: {
        id: comment.id,
        contentId: comment.content_id,
        userId: comment.user_id,
        userName: comment.user_name,
        userRole: comment.user_role,
        message: comment.message,
        isInternal: comment.is_internal,
        createdAt: comment.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/client-portal/content/:contentId/comments
 * Get comments for content
 */
export const getContentComments: RequestHandler = async (req, res, next) => {
  try {
    const { contentId } = req.params;

    if (!contentId) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        'contentId is required',
        HTTP_STATUS.BAD_REQUEST,
        'warning'
      );
    }

    // Fetch comments from database
    const comments = await clientPortalDB.getContentComments(contentId);

    // Map to response format
    const mappedComments = comments.map((comment) => ({
      id: comment.id,
      contentId: comment.content_id,
      userId: comment.user_id,
      userName: comment.user_name,
      userRole: comment.user_role,
      message: comment.message,
      isInternal: comment.is_internal,
      createdAt: comment.created_at,
    }));

    (res as any).json({
      contentId,
      comments: mappedComments,
      total: mappedComments.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/client-portal/media/upload
 * Handle file uploads from client
 */
export const uploadClientMedia: RequestHandler = async (req, res, next) => {
  try {
    const { filename, mimeType, fileSize, path } = req.body;
    const brandId = (req as unknown).user?.brandId;
    const clientId = (req as unknown).user?.id || (req as unknown).userId;

    if (!brandId || !clientId || !filename || !mimeType || fileSize === undefined) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        'brandId, clientId, filename, mimeType, and fileSize are required',
        HTTP_STATUS.BAD_REQUEST,
        'warning'
      );
    }

    // Store upload in database
    const uploadRecord = await clientPortalDB.storeClientMediaUpload(
      brandId,
      clientId,
      filename,
      mimeType,
      fileSize,
      path || `client-uploads/${brandId}/${clientId}/${filename}`
    );

    (res as any).json({
      success: true,
      message: 'File uploaded successfully',
      uploads: [
        {
          id: uploadRecord.id,
          filename: uploadRecord.filename,
          path: uploadRecord.path,
          uploadedAt: uploadRecord.uploadedAt,
        },
      ],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/client-portal/media
 * Get client media uploads
 */
export const getClientMedia: RequestHandler = async (req, res, next) => {
  try {
    const brandId = (req as unknown).user?.brandId;
    const clientId = (req as unknown).user?.id || (req as unknown).userId;
    const limit = parseInt((req as any).query.limit as string) || 50;

    if (!brandId || !clientId) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        'brandId and clientId are required',
        HTTP_STATUS.BAD_REQUEST,
        'warning'
      );
    }

    // Fetch media uploads from database
    const uploads = await clientPortalDB.getClientMediaUploads(brandId, clientId, limit);

    (res as any).json({
      uploads,
      total: uploads.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/client-portal/content
 * Get all content for client portal (with filtering)
 */
export const getPortalContent: RequestHandler = async (req, res, next) => {
  try {
    const brandId = (req as unknown).user?.brandId;
    const status = (req as any).query.status as unknown;
    const limit = parseInt((req as any).query.limit as string) || 50;
    const offset = parseInt((req as any).query.offset as string) || 0;

    if (!brandId) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        'brandId is required',
        HTTP_STATUS.BAD_REQUEST,
        'warning'
      );
    }

    // Fetch content from database
    const { content, total } = await clientPortalDB.getContentForClientPortal(
      brandId,
      status,
      limit,
      offset
    );

    (res as any).json({
      content,
      total,
      hasMore: offset + content.length < total,
      limit,
      offset,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/client-portal/content/:contentId
 * Get content with comments
 */
export const getContentWithComments: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const { contentId } = req.params;

    if (!contentId) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        'contentId is required',
        HTTP_STATUS.BAD_REQUEST,
        'warning'
      );
    }

    // Fetch content and comments from database
    const { content, comments } = await clientPortalDB.getContentWithComments(contentId);

    if (!content) {
      throw new AppError(
        ErrorCode.NOT_FOUND,
        'Content not found',
        HTTP_STATUS.NOT_FOUND,
        'warning'
      );
    }

    // Map comments to response format
    const mappedComments = comments.map((comment) => ({
      id: comment.id,
      contentId: comment.content_id,
      userId: comment.user_id,
      userName: comment.user_name,
      userRole: comment.user_role,
      message: comment.message,
      isInternal: comment.is_internal,
      createdAt: comment.created_at,
    }));

    (res as any).json({
      content,
      comments: mappedComments,
      commentCount: mappedComments.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/client/share-links
 * Create a new shareable analytics link
 */
export const createShareLink: RequestHandler = async (req, res, next) => {
  try {
    const brandId = (req as unknown).user?.brandId;
    const userId = (req as unknown).user?.id || (req as unknown).userId;

    if (!brandId || !userId) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "brandId and userId are required",
        HTTP_STATUS.BAD_REQUEST,
        "warning"
      );
    }

    const {
      name,
      description,
      scope = ["overview", "channels", "top-content"],
      expiryDays,
      requirePasscode,
      passcode,
      allowDownload,
      showWatermark,
    } = req.body;

    if (!name) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "name is required",
        HTTP_STATUS.BAD_REQUEST,
        "warning"
      );
    }

    // Hash passcode if provided
    let passcodeHash: string | undefined;
    if (requirePasscode && passcode) {
      const crypto = await import("crypto");
      passcodeHash = crypto.createHash("sha256").update(passcode).digest("hex");
    }

    const shareLink = await clientPortalDB.createShareLink(brandId, userId, {
      name,
      description,
      scope,
      dateRangeDays: 28, // Default to 28 days
      expiryDays,
      requirePasscode: !!requirePasscode,
      passcodeHash,
      allowDownload: allowDownload !== false,
      showWatermark: showWatermark !== false,
    });

    (res as any).json({
      success: true,
      shareUrl: shareLink.shareUrl,
      link: {
        id: shareLink.id,
        token: shareLink.token,
        name,
        description,
        expiresAt: shareLink.expiresAt,
        createdAt: shareLink.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/client/share-links
 * Get all share links for a brand
 */
export const getShareLinks: RequestHandler = async (req, res, next) => {
  try {
    const brandId = (req as unknown).user?.brandId;

    if (!brandId) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "brandId is required",
        HTTP_STATUS.BAD_REQUEST,
        "warning"
      );
    }

    const links = await clientPortalDB.getShareLinksForBrand(brandId);

    (res as any).json({
      success: true,
      links,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/client/share-links/:token
 * Get share link data by token (public access)
 */
export const getShareLinkByToken: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const { token } = req.params;

    if (!token) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "token is required",
        HTTP_STATUS.BAD_REQUEST,
        "warning"
      );
    }

    const shareLink = await clientPortalDB.getShareLinkByToken(token);

    if (!shareLink) {
      throw new AppError(
        ErrorCode.NOT_FOUND,
        "Share link not found or expired",
        HTTP_STATUS.NOT_FOUND,
        "warning"
      );
    }

    // Increment view count
    await clientPortalDB.incrementShareLinkViews(token);

    (res as any).json({
      success: true,
      link: shareLink,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/client/share-links/:linkId
 * Revoke a share link
 */
export const revokeShareLink: RequestHandler = async (req, res, next) => {
  try {
    const { linkId } = req.params;
    const brandId = (req as unknown).user?.brandId;

    if (!brandId || !linkId) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "brandId and linkId are required",
        HTTP_STATUS.BAD_REQUEST,
        "warning"
      );
    }

    await clientPortalDB.revokeShareLink(brandId, linkId);

    (res as any).json({
      success: true,
      message: "Share link revoked",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Client Portal Router
 */
const clientPortalRouter = Router();

clientPortalRouter.get(
  "/dashboard",
  requireScope("content:view"),
  getClientDashboard,
);

clientPortalRouter.post(
  "/content/:contentId/approve",
  requireScope("content:approve"),
  approveContent,
);

clientPortalRouter.post(
  "/content/:contentId/reject",
  requireScope("content:approve"),
  rejectContent,
);

clientPortalRouter.post(
  "/content/:contentId/comments",
  requireScope("comment:create"),
  addContentComment,
);

clientPortalRouter.get(
  "/content/:contentId/comments",
  requireScope("content:view"),
  getContentComments,
);

clientPortalRouter.post(
  "/media/upload",
  requireScope("content:view"),
  uploadClientMedia,
);

clientPortalRouter.get(
  "/media",
  requireScope("content:view"),
  getClientMedia,
);

clientPortalRouter.get(
  "/content",
  requireScope("content:view"),
  getPortalContent,
);

clientPortalRouter.get(
  "/content/:contentId",
  requireScope("content:view"),
  getContentWithComments,
);

clientPortalRouter.post(
  "/share-links",
  requireScope("content:view"),
  createShareLink,
);

clientPortalRouter.get(
  "/share-links",
  requireScope("content:view"),
  getShareLinks,
);

clientPortalRouter.delete(
  "/share-links/:linkId",
  requireScope("content:view"),
  revokeShareLink,
);

const workflowActionSchema = z.object({
  stepInstanceId: z.string().min(6),
  type: z.enum([
    "approve",
    "reject",
    "request_changes",
    "reassign",
    "skip",
    "escalate",
  ]),
  comment: z.string().max(1000).optional(),
});

clientPortalRouter.post(
  "/workflow/action",
  requireScope("content:approve"),
  async (req, res, next) => {
    try {
      const context = getPortalContext(req);
      const action = workflowActionSchema.parse(req.body ?? {});

      const workflowInstance = await workflowDB.getWorkflowInstanceByStep(
        action.stepInstanceId,
        context.brandScope,
      );

      if (!workflowInstance) {
        throw new AppError(
          ErrorCode.NOT_FOUND,
          "Workflow step not found",
          HTTP_STATUS.NOT_FOUND,
          "warning",
        );
      }

      const updatedWorkflow = await workflowDB.processWorkflowAction(
        workflowInstance.id,
        action.stepInstanceId,
        action.type,
        {
          comment: action.comment,
          actedBy: context.userId,
          actedByEmail: context.email,
        },
      );

      await logAuditAction(
        workflowInstance.brand_id,
        workflowInstance.content_id,
        context.userId,
        context.email,
        "WORKFLOW_ACTION",
        {
          workflowId: workflowInstance.id,
          stepInstanceId: action.stepInstanceId,
          action: action.type,
        },
        req.ip,
        req.headers["user-agent"],
      );

      (res as any).json({
        success: true,
        workflow: updatedWorkflow,
      });
    } catch (error) {
      next(error);
    }
  },
);

export default clientPortalRouter;

function getPortalContext(req: any) {
  const user = req.user || req.auth;
  if (!user) {
    throw new AppError(
      ErrorCode.UNAUTHORIZED,
      "Authentication required",
      HTTP_STATUS.UNAUTHORIZED,
      "warning",
    );
  }

  const brandId =
    user.brandId ||
    user.brand_id ||
    (Array.isArray(user.brandIds) && user.brandIds.length === 1
      ? user.brandIds[0]
      : undefined);

  if (!brandId) {
    throw new AppError(
      ErrorCode.MISSING_REQUIRED_FIELD,
      "brandId is required",
      HTTP_STATUS.BAD_REQUEST,
      "warning",
    );
  }

  const brandScope =
    Array.isArray(user.brandIds) && user.brandIds.length > 0
      ? user.brandIds
      : [brandId];

  return {
    userId: user.id || user.userId,
    email: user.email,
    brandId,
    brandScope,
    user,
  };
}

function mapContentRecord(record: any): ContentItem {
  const statusMap: Record<string, ContentItem["status"]> = {
    draft: "draft",
    in_review: "in_review",
    pending_review: "in_review",
    client_review: "in_review",
    approved: "approved",
    scheduled: "scheduled",
    published: "published",
    rejected: "rejected",
  };

  return {
    id: record.id,
    platform: (record.platform || "instagram") as ContentItem["platform"],
    content: record.content || record.caption || "",
    status: statusMap[record.status] || "draft",
    scheduledFor: record.scheduled_for,
    publishedAt: record.published_at,
    thumbnail: record.thumbnail || record.media_urls?.[0],
    bfsScore: record.bfs_score || undefined,
    complianceBadges: record.compliance_badges || [],
    metrics: record.metrics,
    comments: [],
    approvalRequired: Boolean(record.approval_required ?? true),
    approvedBy: record.approved_by || undefined,
    approvedAt: record.approved_at || undefined,
    requestedChanges: record.requested_changes || undefined,
    version: record.version || 1,
    createdAt: record.created_at,
    workflowInstance: record.workflow || undefined,
  };
}

async function fetchBrandProfile(brandId: string) {
  const { data, error } = await supabase
    .from("brands")
    .select("name,logo_url,primary_color,secondary_color,favicon_url")
    .eq("id", brandId)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    throw new AppError(
      ErrorCode.DATABASE_ERROR,
      "Failed to load brand profile",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "critical",
      { details: error.message },
    );
  }

  return {
    name: data?.name || "Brand",
    logo: data?.logo_url || undefined,
    favicon: data?.favicon_url || undefined,
    colors: {
      primary: data?.primary_color || "#39339a",
      secondary: data?.secondary_color || "#292661",
    },
  };
}

async function fetchLatestDashboardMetric(brandId: string) {
  const { data, error } = await supabase
    .from("dashboard_metrics")
    .select("*")
    .eq("brand_id", brandId)
    .order("metric_date", { ascending: false })
    .limit(1);

  if (error && error.code !== "PGRST116") {
    throw new AppError(
      ErrorCode.DATABASE_ERROR,
      "Failed to load dashboard metrics",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "critical",
      { details: error.message },
    );
  }

  return data?.[0] || null;
}

function buildDashboardMetrics(
  metricsRow: any,
  recent: ContentItem[],
  upcoming: ContentItem[],
  pending: ContentItem[],
): ClientDashboardData["metrics"] {
  const postsThisMonth =
    metricsRow?.posts_published ??
    recent.filter((item) => item.status === "published").length;

  const totalReach = metricsRow?.reach ?? sumMetric(recent, "reach");
  const totalEngagement =
    metricsRow?.engagement ?? sumMetric(recent, "engagement");
  const followers = metricsRow?.followers_gained ?? 0;

  const campaignProgress = computeCampaignProgress(upcoming, pending);

  return {
    totalReach,
    totalEngagement,
    engagementRate: metricsRow?.engagement_rate ?? 0,
    followers,
    postsThisMonth,
    pendingApprovals: pending.length,
    campaignProgress,
    growth: {
      reach: metricsRow?.reach_change_pct ?? 0,
      engagement: metricsRow?.engagement_change_pct ?? 0,
      followers: metricsRow?.follower_change_pct ?? 0,
    },
  };
}

function sumMetric(content: ContentItem[], field: string) {
  return content.reduce((sum, item) => {
    const value = (item.metrics as any)?.[field];
    return sum + (typeof value === "number" ? value : 0);
  }, 0);
}

function computeCampaignProgress(upcoming: ContentItem[], pending: ContentItem[]) {
  const total = upcoming.length + pending.length;
  if (total === 0) return 100;
  return Math.max(
    5,
    Math.min(100, Math.round((upcoming.length / total) * 100)),
  );
}

function deriveTopContent(
  metricsRow: any,
  recent: ContentItem[],
  upcoming: ContentItem[],
) {
  if (Array.isArray(metricsRow?.top_posts) && metricsRow.top_posts.length > 0) {
    return metricsRow.top_posts.slice(0, 3) as ContentItem[];
  }

  const combined = [...recent, ...upcoming];
  return combined
    .sort((a, b) => {
      const aEng = (a.metrics as any)?.engagement || 0;
      const bEng = (b.metrics as any)?.engagement || 0;
      return bEng - aEng;
    })
    .slice(0, 3);
}

function buildAiInsight(metricsRow: any, metrics: ClientDashboardData["metrics"]) {
  if (Array.isArray(metricsRow?.advisor_insights) && metricsRow.advisor_insights[0]) {
    const insight = metricsRow.advisor_insights[0];
    return {
      title: insight.title || "Advisor Insight",
      description: insight.description || "Stay on-brand and on schedule.",
      impact: (insight.impact || "actionable") as ClientDashboardData["aiInsight"]["impact"],
    };
  }

  return {
    title: "Keep momentum",
    description:
      metrics.pendingApprovals > 0
        ? "You have posts awaiting approval. Clearing them keeps your schedule on track."
        : "Content is on track. Consider scheduling another campaign while engagement is high.",
    impact: "actionable" as const,
  };
}
