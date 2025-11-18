/**
 * Approvals Database Service
 * Handles approval workflows, requests, and audit logging
 */

import { ApprovalBoardItem, ApprovalBoardStatus } from "@shared/approvals";
import { supabase } from "./supabase";
import { AppError } from "./error-middleware";
import { ErrorCode, HTTP_STATUS } from "./error-responses";

/**
 * Approval request record in database
 */
export interface ApprovalRequestRecord {
  id: string;
  post_id: string;
  brand_id: string;
  requested_by: string;
  assigned_to: string;
  status: "pending" | "approved" | "rejected";
  reason?: string;
  note?: string;
  priority: "low" | "normal" | "high";
  deadline?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Post approval status record
 */
export interface PostApprovalRecord {
  id: string;
  post_id: string;
  brand_id: string;
  status:
    | "draft"
    | "in_review"
    | "client_review"
    | "approved"
    | "rejected"
    | "scheduled"
    | "published";
  approved_by?: string;
  rejected_by?: string;
  rejection_reason?: string;
  rejection_note?: string;
  approval_date?: string;
  rejection_date?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Approvals Database Service Class
 */
export class ApprovalsDBService {
  /**
   * Create an approval request for a post
   */
  async createApprovalRequest(
    postId: string,
    brandId: string,
    requestedBy: string,
    assignedTo: string,
    priority: "low" | "normal" | "high" = "normal",
    deadline?: string
  ): Promise<ApprovalRequestRecord> {
    const { data, error } = await supabase
      .from("approval_requests")
      .insert({
        post_id: postId,
        brand_id: brandId,
        requested_by: requestedBy,
        assigned_to: assignedTo,
        status: "pending",
        priority,
        deadline,
      })
      .select()
      .single();

    if (error) {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to create approval request",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical",
        { details: error.message }
      );
    }

    return data as ApprovalRequestRecord;
  }

  /**
   * Approve a post
   */
  async approvePost(
    postId: string,
    brandId: string,
    approvedBy: string,
    note?: string
  ): Promise<PostApprovalRecord> {
    // Verify post exists and belongs to brand
    const existingRecord = await this.getPostApprovalStatus(postId, brandId);
    if (!existingRecord) {
      throw new AppError(
        ErrorCode.NOT_FOUND,
        "Post not found",
        HTTP_STATUS.NOT_FOUND,
        "warning"
      );
    }

    const { data, error } = await supabase
      .from("post_approvals")
      .update({
        status: "approved",
        approved_by: approvedBy,
        approval_date: new Date().toISOString(),
      })
      .eq("post_id", postId)
      .eq("brand_id", brandId)
      .select()
      .single();

    if (error) {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to approve post",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical",
        { details: error.message }
      );
    }

    return data as PostApprovalRecord;
  }

  /**
   * Reject a post
   */
  async rejectPost(
    postId: string,
    brandId: string,
    rejectedBy: string,
    reason: string,
    note?: string
  ): Promise<PostApprovalRecord> {
    // Verify post exists and belongs to brand
    const existingRecord = await this.getPostApprovalStatus(postId, brandId);
    if (!existingRecord) {
      throw new AppError(
        ErrorCode.NOT_FOUND,
        "Post not found",
        HTTP_STATUS.NOT_FOUND,
        "warning"
      );
    }

    const { data, error } = await supabase
      .from("post_approvals")
      .update({
        status: "rejected",
        rejected_by: rejectedBy,
        rejection_reason: reason,
        rejection_note: note,
        rejection_date: new Date().toISOString(),
      })
      .eq("post_id", postId)
      .eq("brand_id", brandId)
      .select()
      .single();

    if (error) {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to reject post",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical",
        { details: error.message }
      );
    }

    return data as PostApprovalRecord;
  }

  /**
   * Bulk approve posts
   */
  async bulkApprovePostIds(
    postIds: string[],
    brandId: string,
    approvedBy: string
  ): Promise<PostApprovalRecord[]> {
    const { data, error } = await supabase
      .from("post_approvals")
      .update({
        status: "approved",
        approved_by: approvedBy,
        approval_date: new Date().toISOString(),
      })
      .in("post_id", postIds)
      .eq("brand_id", brandId)
      .select();

    if (error) {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to bulk approve posts",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical",
        { details: error.message }
      );
    }

    return (data || []) as PostApprovalRecord[];
  }

  /**
   * Bulk reject posts
   */
  async bulkRejectPostIds(
    postIds: string[],
    brandId: string,
    rejectedBy: string,
    reason: string
  ): Promise<PostApprovalRecord[]> {
    const { data, error } = await supabase
      .from("post_approvals")
      .update({
        status: "rejected",
        rejected_by: rejectedBy,
        rejection_reason: reason,
        rejection_date: new Date().toISOString(),
      })
      .in("post_id", postIds)
      .eq("brand_id", brandId)
      .select();

    if (error) {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to bulk reject posts",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical",
        { details: error.message }
      );
    }

    return (data || []) as PostApprovalRecord[];
  }

  /**
   * Get approval status for a post
   */
  async getPostApprovalStatus(
    postId: string,
    brandId: string
  ): Promise<PostApprovalRecord | null> {
    const { data, error } = await supabase
      .from("post_approvals")
      .select("*")
      .eq("post_id", postId)
      .eq("brand_id", brandId)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to fetch approval status",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical",
        { details: error.message }
      );
    }

    return data as PostApprovalRecord | null;
  }

  /**
   * Get pending approvals for a user
   */
  async getPendingApprovalsForUser(
    userId: string,
    brandId?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ approvals: ApprovalRequestRecord[]; total: number }> {
    let query = supabase
      .from("approval_requests")
      .select("*", { count: "exact" })
      .eq("assigned_to", userId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (brandId) {
      query = query.eq("brand_id", brandId);
    }

    const { data, error, count } = await query;

    if (error) {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to fetch pending approvals",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical",
        { details: error.message }
      );
    }

    return {
      approvals: (data || []) as ApprovalRequestRecord[],
      total: count || 0,
    };
  }

  /**
   * Get approval requests for a post
   */
  async getApprovalRequestsForPost(
    postId: string,
    brandId: string
  ): Promise<ApprovalRequestRecord[]> {
    const { data, error } = await supabase
      .from("approval_requests")
      .select("*")
      .eq("post_id", postId)
      .eq("brand_id", brandId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to fetch approval requests",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical",
        { details: error.message }
      );
    }

    return (data || []) as ApprovalRequestRecord[];
  }

  /**
   * Update approval request status
   */
  async updateApprovalRequestStatus(
    requestId: string,
    status: "pending" | "approved" | "rejected",
    note?: string
  ): Promise<ApprovalRequestRecord> {
    const { data, error } = await supabase
      .from("approval_requests")
      .update({
        status,
        note: note || null,
      })
      .eq("id", requestId)
      .select()
      .single();

    if (error) {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to update approval request",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical",
        { details: error.message }
      );
    }

    return data as ApprovalRequestRecord;
  }

  /**
   * Delete approval request (when post is deleted)
   */
  async deleteApprovalRequest(requestId: string): Promise<void> {
    const { error } = await supabase
      .from("approval_requests")
      .delete()
      .eq("id", requestId);

    if (error) {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to delete approval request",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical",
        { details: error.message }
      );
    }
  }

  /**
   * Get approval history for a post (via audit logs)
   * Note: This would typically query an audit_logs table
   */
  async getApprovalHistory(
    postId: string,
    brandId: string
  ): Promise<Array<{
    id: string;
    action: string;
    userId: string;
    userEmail: string;
    timestamp: string;
    details: Record<string, unknown>;
  }>> {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .eq("post_id", postId)
      .eq("brand_id", brandId)
      .in("action", ["APPROVED", "REJECTED", "APPROVAL_REQUESTED"])
      .order("created_at", { ascending: false });

    if (error) {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to fetch approval history",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical",
        { details: error.message }
      );
    }

    return (data || []).map((item: unknown) => {
      const i = item as any; // ✅ Type assertion for Supabase record
      return {
        id: i.id,
        action: i.action,
        userId: i.user_id,
        userEmail: i.user_email,
        timestamp: i.created_at,
        details: i.details || {},
      };
    });
  }

  /**
   * Count pending approvals for a user
   */
  async countPendingApprovalsForUser(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from("approval_requests")
      .select("*", { count: "exact", head: true })
      .eq("assigned_to", userId)
      .eq("status", "pending");

    if (error) {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to count pending approvals",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical",
        { details: error.message }
      );
    }

    return count || 0;
  }

  /**
   * Fetch a scheduled content record
   */
  async getScheduledContentById(
    contentId: string,
    brandId?: string,
  ): Promise<Record<string, any> | null> {
    const { data, error } = await supabase
      .from("scheduled_content")
      .select("*")
      .eq("id", contentId)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to fetch scheduled content",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical",
        { details: error.message },
      );
    }

    const record = data as Record<string, any> | null;

    if (record && brandId && record.brand_id !== brandId) {
      return null;
    }

    return record;
  }

  /**
   * Update scheduled content status/fields
   */
  async updateScheduledContent(
    contentId: string,
    brandId: string,
    updates: Record<string, unknown>,
  ): Promise<Record<string, any>> {
    const { data, error } = await supabase
      .from("scheduled_content")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", contentId)
      .eq("brand_id", brandId)
      .select("*")
      .single();

    if (error) {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to update scheduled content",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical",
        { details: error.message },
      );
    }

    return data as Record<string, any>;
  }

  /**
   * Helper to map a scheduled content record to API payload
   */
  async toBoardItem(record: Record<string, any>): Promise<ApprovalBoardItem> {
    const brandMap = await this.getBrandSummaries([record.brand_id]);
    return mapScheduledRecordToBoardItem(record, brandMap);
  }

  /**
   * Fetch approval board items for the given brand(s)
   * Now includes items from both scheduled_content and content_items tables
   */
  async getApprovalBoardItems(params: {
    brandIds: string[];
    statuses?: string[];
    limit: number;
    offset: number;
    search?: string;
  }): Promise<{
    items: ApprovalBoardItem[];
    total: number;
  }> {
    if (!params.brandIds.length) {
      return { items: [], total: 0 };
    }

    // Fetch from scheduled_content table
    let scheduledQuery = supabase
      .from("scheduled_content")
      .select("*", { count: "exact" })
      .in("brand_id", params.brandIds)
      .order("updated_at", { ascending: false });

    if (params.statuses && params.statuses.length > 0) {
      if (params.statuses.length === 1) {
        scheduledQuery = scheduledQuery.eq("status", params.statuses[0]);
      } else {
        scheduledQuery = scheduledQuery.in("status", params.statuses);
      }
    }

    if (params.search) {
      const term = params.search.replace(/%/g, "");
      scheduledQuery = scheduledQuery.or(
        `headline.ilike.%${term}%,body.ilike.%${term}%,content_type.ilike.%${term}%`,
      );
    }

    const { data: scheduledData, error: scheduledError, count: scheduledCount } = await scheduledQuery;

    // Also fetch from content_items table (for content planning service items)
    let contentItemsQuery = supabase
      .from("content_items")
      .select("*", { count: "exact" })
      .in("brand_id", params.brandIds)
      .in("status", ["pending_review", "draft"])
      .eq("approval_required", true)
      .order("created_at", { ascending: false });

    if (params.search) {
      const term = params.search.replace(/%/g, "");
      contentItemsQuery = contentItemsQuery.or(
        `title.ilike.%${term}%,body.ilike.%${term}%,content_type.ilike.%${term}%`,
      );
    }

    const { data: contentItemsData, error: contentItemsError } = await contentItemsQuery;

    // Combine results
    const allRecords: Record<string, any>[] = [];
    
    if (!scheduledError && scheduledData) {
      // Map scheduled_content to common format
      scheduledData.forEach((item: any) => {
        allRecords.push({
          id: item.id,
          brand_id: item.brand_id,
          headline: item.headline || item.title,
          body: item.body || item.content,
          content_type: item.content_type,
          platform: item.platform,
          status: item.status,
          scheduled_for: item.scheduled_for,
          created_at: item.created_at,
          updated_at: item.updated_at,
          source: "scheduled_content",
        });
      });
    }

    if (!contentItemsError && contentItemsData) {
      // Map content_items to common format
      contentItemsData.forEach((item: any) => {
        allRecords.push({
          id: item.id,
          brand_id: item.brand_id,
          headline: item.title,
          body: item.body,
          content_type: item.content_type,
          platform: item.platform,
          status: item.status,
          scheduled_for: item.scheduled_for,
          created_at: item.created_at,
          updated_at: item.updated_at,
          source: "content_items",
        });
      });
    }

    // Sort by updated_at descending
    allRecords.sort((a, b) => {
      const aTime = new Date(a.updated_at || a.created_at).getTime();
      const bTime = new Date(b.updated_at || b.created_at).getTime();
      return bTime - aTime;
    });

    // Apply pagination
    const paginatedRecords = allRecords.slice(params.offset, params.offset + params.limit);
    const total = allRecords.length;

    const brandIds = Array.from(new Set(paginatedRecords.map((item) => item.brand_id)));
    const brandMap = await this.getBrandSummaries(brandIds);

    const items = paginatedRecords.map((record) =>
      mapScheduledRecordToBoardItem(record, brandMap),
    );

    return {
      items,
      total,
    };
  }

  private async getBrandSummaries(
    brandIds: string[],
  ): Promise<Record<string, { name: string; logo?: string }>> {
    if (!brandIds.length) {
      return {};
    }

    const { data, error } = await supabase
      .from("brands")
      .select("id,name,logo_url")
      .in("id", brandIds);

    if (error) {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to load brand summaries",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical",
        { details: error.message },
      );
    }

    const summaries: Record<string, { name: string; logo?: string }> = {};
    for (const brand of data || []) {
      summaries[brand.id] = {
        name: brand.name || "Brand",
        logo: brand.logo_url || undefined,
      };
    }
    return summaries;
  }
}

/**
 * Singleton instance
 */
export const approvalsDB = new ApprovalsDBService();

const DB_TO_BOARD_STATUS: Record<string, ApprovalBoardStatus> = {
  draft: "draft",
  rejected: "needs_edits",
  pending_review: "ready_for_client",
  in_review: "ready_for_client",
  client_review: "awaiting_client",
  approved: "approved",
  scheduled: "scheduled",
  published: "scheduled",
  failed: "needs_edits",
};

function mapScheduledRecordToBoardItem(
  record: Record<string, any>,
  brands: Record<string, { name: string; logo?: string }>,
): ApprovalBoardItem {
  const status =
    DB_TO_BOARD_STATUS[record.status as string] ??
    (record.status?.includes("client")
      ? "awaiting_client"
      : "draft");

  return {
    id: record.id,
    contentId: record.id,
    brandId: record.brand_id,
    brandName: brands[record.brand_id]?.name || "Brand",
    platform: record.platform || record.content_type,
    content: {
      headline: record.headline || record.title || "",
      body: record.body || record.caption || "",
      cta: record.cta || undefined,
      mediaUrls: record.media_urls || [],
      caption: record.caption || undefined,
    },
    status,
    workflowStage: getWorkflowStage(status),
    bfsScore: record.bfs_score || record.auto_approval_score || undefined,
    complianceFlags: record.compliance_flags || [],
    scheduledFor: record.scheduled_for || undefined,
    assignedTo: record.assigned_to || undefined,
    assignedToName: record.assigned_to_name || undefined,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    approvedAt: record.approved_at || undefined,
    approvedBy: record.approved_by || undefined,
    requestedChanges: record.requested_changes || record.rejection_reason || undefined,
  };
}

function getWorkflowStage(status: ApprovalBoardStatus): string {
  switch (status) {
    case "draft":
      return "Draft";
    case "needs_edits":
      return "Revision Needed";
    case "ready_for_client":
      return "Agency Review";
    case "awaiting_client":
      return "Client Review";
    case "approved":
      return "Approved";
    case "scheduled":
      return "Scheduled";
    default:
      return "Draft";
  }
}
