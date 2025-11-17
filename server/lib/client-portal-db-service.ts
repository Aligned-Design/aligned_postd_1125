/**
 * Client Portal Database Service
 * Handles client dashboard data, content comments, and client-specific operations
 */

import { supabase } from "./supabase";
import { AppError } from "./error-middleware";
import { ErrorCode, HTTP_STATUS } from "./error-responses";

/**
 * Content comment record
 */
export interface ContentCommentRecord {
  id: string;
  content_id: string;
  user_id: string;
  user_name: string;
  user_role: "client" | "agency" | "admin";
  message: string;
  is_internal: boolean;
  created_at: string;
  updated_at?: string;
}

/**
 * Client dashboard content record
 */
export interface ClientDashboardContentRecord {
  id: string;
  brand_id: string;
  platform: string;
  content: string;
  status: "draft" | "scheduled" | "published" | "in_review";
  published_at?: string;
  scheduled_for?: string;
  thumbnail?: string;
  metrics: {
    reach: number;
    engagement: number;
    likes: number;
    comments: number;
    shares: number;
  };
  compliance_badges: string[];
  version: number;
  approval_required: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Client approval record
 */
export interface ClientApprovalRecord {
  id: string;
  content_id: string;
  brand_id: string;
  client_id: string;
  approved: boolean;
  feedback?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Client Portal Database Service Class
 */
export class ClientPortalDBService {
  /**
   * Get dashboard content for client
   */
  async getClientDashboardContent(
    brandId: string,
    clientId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{
    recentContent: ClientDashboardContentRecord[];
    upcomingPosts: ClientDashboardContentRecord[];
    pendingApprovals: ClientDashboardContentRecord[];
    total: number;
  }> {
    // Fetch recent published content
    const { data: recentData, error: recentError } = await supabase
      .from("content")
      .select("*")
      .eq("brand_id", brandId)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .range(0, 10);

    if (recentError && recentError.code !== "PGRST116") {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to fetch recent content",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical",
        { details: recentError.message }
      );
    }

    // Fetch upcoming scheduled content
    const { data: upcomingData, error: upcomingError } = await supabase
      .from("content")
      .select("*")
      .eq("brand_id", brandId)
      .eq("status", "scheduled")
      .order("scheduled_for", { ascending: true })
      .range(0, 10);

    if (upcomingError && upcomingError.code !== "PGRST116") {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to fetch upcoming content",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical",
        { details: upcomingError.message }
      );
    }

    // Fetch pending approvals
    const { data: pendingData, error: pendingError } = await supabase
      .from("content")
      .select("*")
      .eq("brand_id", brandId)
      .eq("status", "in_review")
      .eq("approval_required", true)
      .order("created_at", { ascending: false })
      .range(0, 10);

    if (pendingError && pendingError.code !== "PGRST116") {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to fetch pending approvals",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical",
        { details: pendingError.message }
      );
    }

    // Fetch total count
    const { count, error: countError } = await supabase
      .from("content")
      .select("*", { count: "exact", head: true })
      .eq("brand_id", brandId);

    if (countError) {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to count content",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical",
        { details: countError.message }
      );
    }

    return {
      recentContent: (recentData || []) as ClientDashboardContentRecord[],
      upcomingPosts: (upcomingData || []) as ClientDashboardContentRecord[],
      pendingApprovals: (pendingData || []) as ClientDashboardContentRecord[],
      total: count || 0,
    };
  }

  /**
   * Get all comments for content
   */
  async getContentComments(contentId: string): Promise<ContentCommentRecord[]> {
    const { data, error } = await supabase
      .from("content_comments")
      .select("*")
      .eq("content_id", contentId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to fetch content comments",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical",
        { details: error.message }
      );
    }

    return (data || []) as ContentCommentRecord[];
  }

  /**
   * Add comment to content
   */
  async addContentComment(
    contentId: string,
    userId: string,
    userName: string,
    userRole: "client" | "agency" | "admin",
    message: string,
    isInternal: boolean = false
  ): Promise<ContentCommentRecord> {
    const { data, error } = await supabase
      .from("content_comments")
      .insert({
        content_id: contentId,
        user_id: userId,
        user_name: userName,
        user_role: userRole,
        message: message.trim(),
        is_internal: isInternal,
      })
      .select()
      .single();

    if (error) {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to add comment",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical",
        { details: error.message }
      );
    }

    return data as ContentCommentRecord;
  }

  /**
   * Update comment
   */
  async updateContentComment(
    commentId: string,
    message: string
  ): Promise<ContentCommentRecord> {
    const { data, error } = await supabase
      .from("content_comments")
      .update({
        message: message.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", commentId)
      .select()
      .single();

    if (error) {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to update comment",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical",
        { details: error.message }
      );
    }

    return data as ContentCommentRecord;
  }

  /**
   * Delete comment
   */
  async deleteContentComment(commentId: string): Promise<void> {
    const { error } = await supabase
      .from("content_comments")
      .delete()
      .eq("id", commentId);

    if (error) {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to delete comment",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical",
        { details: error.message }
      );
    }
  }

  /**
   * Approve content as client
   */
  async approveContent(
    contentId: string,
    brandId: string,
    clientId: string,
    feedback?: string
  ): Promise<ClientApprovalRecord> {
    const { data, error } = await supabase
      .from("client_approvals")
      .insert({
        content_id: contentId,
        brand_id: brandId,
        client_id: clientId,
        approved: true,
        feedback,
        approved_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to approve content",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical",
        { details: error.message }
      );
    }

    // Update content status to approved
    await supabase
      .from("content")
      .update({ status: "approved" })
      .eq("id", contentId);

    return data as ClientApprovalRecord;
  }

  /**
   * Reject content as client
   */
  async rejectContent(
    contentId: string,
    brandId: string,
    clientId: string,
    feedback: string
  ): Promise<ClientApprovalRecord> {
    const { data, error } = await supabase
      .from("client_approvals")
      .insert({
        content_id: contentId,
        brand_id: brandId,
        client_id: clientId,
        approved: false,
        feedback,
      })
      .select()
      .single();

    if (error) {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to reject content",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical",
        { details: error.message }
      );
    }

    // Update content status back to in_review (for further edits)
    await supabase
      .from("content")
      .update({ status: "in_review" })
      .eq("id", contentId);

    return data as ClientApprovalRecord;
  }

  /**
   * Get client approval status for content
   */
  async getClientApprovalStatus(
    contentId: string,
    clientId: string
  ): Promise<ClientApprovalRecord | null> {
    const { data, error } = await supabase
      .from("client_approvals")
      .select("*")
      .eq("content_id", contentId)
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
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

    return data as ClientApprovalRecord | null;
  }

  /**
   * Get content for client portal (filtered by brand)
   */
  async getContentForClientPortal(
    brandId: string,
    status?: "draft" | "scheduled" | "published" | "in_review",
    limit: number = 50,
    offset: number = 0
  ): Promise<{
    content: ClientDashboardContentRecord[];
    total: number;
  }> {
    let query = supabase
      .from("content")
      .select("*", { count: "exact" })
      .eq("brand_id", brandId);

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to fetch content",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical",
        { details: error.message }
      );
    }

    return {
      content: (data || []) as ClientDashboardContentRecord[],
      total: count || 0,
    };
  }

  /**
   * Get content with comments
   */
  async getContentWithComments(contentId: string): Promise<{
    content: ClientDashboardContentRecord | null;
    comments: ContentCommentRecord[];
  }> {
    // Fetch content
    const { data: contentData, error: contentError } = await supabase
      .from("content")
      .select("*")
      .eq("id", contentId)
      .maybeSingle();

    if (contentError && contentError.code !== "PGRST116") {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to fetch content",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical",
        { details: contentError.message }
      );
    }

    // Fetch comments
    const comments = await this.getContentComments(contentId);

    return {
      content: contentData as ClientDashboardContentRecord | null,
      comments,
    };
  }

  /**
   * Get metrics for client dashboard
   */
  async getClientDashboardMetrics(
    brandId: string
  ): Promise<{
    totalReach: number;
    totalEngagement: number;
    followers: number;
    postsThisMonth: number;
    engagementRate: number;
    pendingApprovals: number;
  }> {
    // This would aggregate data from content and analytics tables
    const { data, error } = await supabase
      .from("brand_analytics")
      .select("*")
      .eq("brand_id", brandId)
      .order("created_at", { ascending: false })
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to fetch metrics",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical",
        { details: error.message }
      );
    }

    // Get pending approvals count
    const { count: pendingCount } = await supabase
      .from("content")
      .select("*", { count: "exact", head: true })
      .eq("brand_id", brandId)
      .eq("status", "in_review");

    return {
      totalReach: (data?.total_reach as number) || 0,
      totalEngagement: (data?.total_engagement as number) || 0,
      followers: (data?.followers as number) || 0,
      postsThisMonth: (data?.posts_this_month as number) || 0,
      engagementRate: (data?.engagement_rate as number) || 0,
      pendingApprovals: pendingCount || 0,
    };
  }

  /**
   * Store client media upload
   */
  async storeClientMediaUpload(
    brandId: string,
    clientId: string,
    filename: string,
    mimeType: string,
    fileSize: number,
    path: string
  ): Promise<{
    id: string;
    filename: string;
    path: string;
    uploadedAt: string;
  }> {
    const { data, error } = await supabase
      .from("client_media")
      .insert({
        brand_id: brandId,
        client_id: clientId,
        filename,
        mime_type: mimeType,
        file_size: fileSize,
        path,
      })
      .select()
      .single();

    if (error) {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to store media upload",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical",
        { details: error.message }
      );
    }

    return {
      id: data.id,
      filename: data.filename,
      path: data.path,
      uploadedAt: data.created_at,
    };
  }

  /**
   * Get client media uploads
   */
  async getClientMediaUploads(
    brandId: string,
    clientId: string,
    limit: number = 50
  ): Promise<Array<{
    id: string;
    filename: string;
    mimeType: string;
    fileSize: number;
    path: string;
    uploadedAt: string;
  }>> {
    const { data, error } = await supabase
      .from("client_media")
      .select("*")
      .eq("brand_id", brandId)
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to fetch media uploads",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical",
        { details: error.message }
      );
    }

    return (data || []).map((item: unknown) => ({
      id: item.id,
      filename: item.filename,
      mimeType: item.mime_type,
      fileSize: item.file_size,
      path: item.path,
      uploadedAt: item.created_at,
    }));
  }

  /**
   * Create a shareable analytics link
   */
  async createShareLink(
    brandId: string,
    createdBy: string,
    data: {
      name: string;
      description?: string;
      scope: string[];
      dateRangeDays: number;
      expiryDays?: number;
      requirePasscode: boolean;
      passcodeHash?: string;
      allowDownload: boolean;
      showWatermark: boolean;
    }
  ): Promise<{
    id: string;
    token: string;
    shareUrl: string;
    expiresAt?: string;
    createdAt: string;
  }> {
    // Generate secure token
    const crypto = await import("crypto");
    const token = crypto.randomBytes(32).toString("base64url");

    // Calculate expiry
    const expiresAt = data.expiryDays
      ? new Date(Date.now() + data.expiryDays * 24 * 60 * 60 * 1000).toISOString()
      : null;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - data.dateRangeDays);

    const { data: shareLink, error } = await supabase
      .from("share_links")
      .insert({
        brand_id: brandId,
        token,
        name: data.name,
        scope: data.scope,
        date_range_days: data.dateRangeDays,
        expires_at: expiresAt,
        passcode_hash: data.passcodeHash || null,
        allow_download: data.allowDownload,
        watermark_logo: data.showWatermark,
        view_count: 0,
        created_by: createdBy,
      })
      .select()
      .single();

    if (error) {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to create share link",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical",
        { details: error.message }
      );
    }

    // Generate share URL (frontend will handle the full URL)
    const shareUrl = `/share/${token}`;

    return {
      id: shareLink.id,
      token: shareLink.token,
      shareUrl,
      expiresAt: shareLink.expires_at || undefined,
      createdAt: shareLink.created_at,
    };
  }

  /**
   * Get share link by token (for public access)
   */
  async getShareLinkByToken(token: string): Promise<{
    id: string;
    brandId: string;
    name: string;
    description?: string;
    scope: string[];
    dateRange: { start: string; end: string };
    expiresAt?: string;
    passwordProtected: boolean;
    allowDownload: boolean;
    viewCount: number;
    lastAccessedAt?: string;
    createdAt: string;
    revoked: boolean;
  } | null> {
    const { data, error } = await supabase
      .from("share_links")
      .select("*")
      .eq("token", token)
      .is("revoked_at", null)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // Not found
      }
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to fetch share link",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical",
        { details: error.message }
      );
    }

    // Check if expired
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return null;
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - data.date_range_days);

    return {
      id: data.id,
      brandId: data.brand_id,
      name: data.name,
      description: data.description || undefined,
      scope: data.scope || [],
      dateRange: {
        start: startDate.toISOString().split("T")[0],
        end: endDate.toISOString().split("T")[0],
      },
      expiresAt: data.expires_at || undefined,
      passwordProtected: !!data.passcode_hash,
      allowDownload: data.allow_download,
      viewCount: data.view_count || 0,
      lastAccessedAt: data.last_accessed_at || undefined,
      createdAt: data.created_at,
      revoked: !!data.revoked_at,
    };
  }

  /**
   * Get all share links for a brand
   */
  async getShareLinksForBrand(
    brandId: string
  ): Promise<Array<{
    id: string;
    token: string;
    name: string;
    description?: string;
    expiresAt?: string;
    viewCount: number;
    lastAccessedAt?: string;
    createdAt: string;
    revoked: boolean;
  }>> {
    const { data, error } = await supabase
      .from("share_links")
      .select("*")
      .eq("brand_id", brandId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to fetch share links",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical",
        { details: error.message }
      );
    }

    return (data || []).map((item: unknown) => ({
      id: item.id,
      token: item.token,
      name: item.name,
      description: item.description || undefined,
      expiresAt: item.expires_at || undefined,
      viewCount: item.view_count || 0,
      lastAccessedAt: item.last_accessed_at || undefined,
      createdAt: item.created_at,
      revoked: !!item.revoked_at,
    }));
  }

  /**
   * Increment share link view count
   */
  async incrementShareLinkViews(token: string): Promise<void> {
    const { error } = await supabase.rpc("increment_share_link_views", {
      p_token: token,
    });

    if (error) {
      // Fallback to manual update if RPC doesn't exist
      const { data: link } = await supabase
        .from("share_links")
        .select("id, view_count")
        .eq("token", token)
        .single();

      if (link) {
        await supabase
          .from("share_links")
          .update({
            view_count: (link.view_count || 0) + 1,
            last_accessed_at: new Date().toISOString(),
          })
          .eq("id", link.id);
      }
    }
  }

  /**
   * Revoke a share link
   */
  async revokeShareLink(brandId: string, linkId: string): Promise<void> {
    const { error } = await supabase
      .from("share_links")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", linkId)
      .eq("brand_id", brandId);

    if (error) {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to revoke share link",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical",
        { details: error.message }
      );
    }
  }
}

/**
 * Singleton instance
 */
export const clientPortalDB = new ClientPortalDBService();
