/**
 * Integrations Database Service
 * Handles platform connections, OAuth tokens, and integration configuration
 */

import { supabase } from "./supabase";
import { AppError } from "./error-middleware";
import { ErrorCode, HTTP_STATUS } from "./error-responses";

/**
 * Platform connection record (OAuth token)
 */
export interface PlatformConnectionRecord {
  id: string;
  brand_id: string;
  provider: string;
  account_username?: string;
  account_id?: string;
  access_token: string;
  refresh_token?: string;
  token_expires_at?: string;
  scopes: string[];
  status: "connected" | "disconnected" | "expired" | "revoked";
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/**
 * Integration configuration
 */
export interface IntegrationConfig {
  syncEnabled: boolean;
  syncFrequency: "realtime" | "hourly" | "daily" | "weekly";
  syncDirection: "unidirectional" | "bidirectional";
  autoSync: boolean;
  filterRules?: Array<{
    field: string;
    operator: string;
    value: unknown;
  }>;
}

/**
 * Social post record
 */
export interface SocialPostRecord {
  id: string;
  brand_id: string;
  connection_ids: string[];
  title?: string;
  caption?: string;
  content_type?: string;
  media_urls?: string[];
  hashtags?: string[];
  cta_text?: string;
  cta_url?: string;
  platform_specific_data?: Record<string, unknown>;
  schedule_for?: string;
  status: "draft" | "scheduled" | "published" | "failed";
  published_at?: string;
  published_urls?: Record<string, string>;
  performance_metrics?: Record<string, unknown>;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Integrations Database Service Class
 */
export class IntegrationsDBService {
  /**
   * Create a new platform connection
   */
  async createConnection(
    brandId: string,
    provider: string,
    accessToken: string,
    options?: {
      accountUsername?: string;
      accountId?: string;
      refreshToken?: string;
      tokenExpiresAt?: Date;
      scopes?: string[];
      metadata?: Record<string, unknown>;
    }
  ): Promise<PlatformConnectionRecord> {
    const { data, error } = await supabase
      .from("platform_connections")
      .insert({
        brand_id: brandId,
        platform: provider,  // Map provider to platform column
        account_name: options?.accountUsername,  // Map accountUsername to account_name
        account_id: options?.accountId,
        access_token: accessToken,
        refresh_token: options?.refreshToken,
        expires_at: options?.tokenExpiresAt?.toISOString(),  // Map token_expires_at to expires_at
        status: "connected",
        metadata: options?.metadata,
        // Note: scopes column doesn't exist in schema - removed from insert
      })
      .select()
      .single();

    if (error) {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to create connection",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical",
        { details: error.message }
      );
    }

    // Map database columns to interface (platform -> provider, account_name -> account_username, expires_at -> token_expires_at)
    const mapped = data as any;
    return {
      ...mapped,
      provider: mapped.platform || mapped.provider,  // Map platform to provider for interface
      account_username: mapped.account_name || mapped.account_username,  // Map account_name to account_username
      token_expires_at: mapped.expires_at || mapped.token_expires_at,  // Map expires_at to token_expires_at
      scopes: mapped.scopes || [],  // Default to empty array if scopes column doesn't exist
    } as PlatformConnectionRecord;
  }

  /**
   * Get a connection by ID
   */
  async getConnection(connectionId: string): Promise<PlatformConnectionRecord | null> {
    const { data, error } = await supabase
      .from("platform_connections")
      .select("*")
      .eq("id", connectionId)
      .single();

    if (error && error.code === "PGRST116") {
      return null;
    }

    if (error) {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to fetch connection",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical"
      );
    }

    // Map database columns to interface (platform -> provider, account_name -> account_username, expires_at -> token_expires_at)
    const mapped = data as any;
    return {
      ...mapped,
      provider: mapped.platform || mapped.provider,  // Map platform to provider for interface
      account_username: mapped.account_name || mapped.account_username,  // Map account_name to account_username
      token_expires_at: mapped.expires_at || mapped.token_expires_at,  // Map expires_at to token_expires_at
      scopes: mapped.scopes || [],  // Default to empty array if scopes column doesn't exist
    } as PlatformConnectionRecord;
  }

  /**
   * Get all connections for a brand
   */
  async getBrandConnections(brandId: string): Promise<PlatformConnectionRecord[]> {
    const { data, error } = await supabase
      .from("platform_connections")
      .select("*")
      .eq("brand_id", brandId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to fetch brand connections",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical"
      );
    }

    // Map database columns to interface for all records
    return (data || []).map((record: any) => ({
      ...record,
      provider: record.platform || record.provider,
      account_username: record.account_name || record.account_username,
      token_expires_at: record.expires_at || record.token_expires_at,
      scopes: record.scopes || [],
    })) as PlatformConnectionRecord[];
  }

  /**
   * Get connections for a brand filtered by provider
   */
  async getBrandConnectionsByProvider(
    brandId: string,
    provider: string
  ): Promise<PlatformConnectionRecord[]> {
    const { data, error } = await supabase
      .from("platform_connections")
      .select("*")
      .eq("brand_id", brandId)
      .eq("platform", provider)  // Map provider to platform column
      .order("created_at", { ascending: false });

    if (error) {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to fetch provider connections",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical"
      );
    }

    // Map database columns to interface for all records
    return (data || []).map((record: any) => ({
      ...record,
      provider: record.platform || record.provider,
      account_username: record.account_name || record.account_username,
      token_expires_at: record.expires_at || record.token_expires_at,
      scopes: record.scopes || [],
    })) as PlatformConnectionRecord[];
  }

  /**
   * Update a connection (refresh tokens, metadata, status)
   */
  async updateConnection(
    connectionId: string,
    updates: Partial<{
      accessToken: string;
      refreshToken: string;
      tokenExpiresAt: Date;
      status: string;
      metadata: Record<string, unknown>;
    }>
  ): Promise<PlatformConnectionRecord> {
    const updateData: Record<string, unknown> = {};

    if (updates.accessToken) updateData.access_token = updates.accessToken;
    if (updates.refreshToken) updateData.refresh_token = updates.refreshToken;
    if (updates.tokenExpiresAt)
      updateData.expires_at = updates.tokenExpiresAt.toISOString();  // Map token_expires_at to expires_at
    if (updates.status) updateData.status = updates.status;
    if (updates.metadata) updateData.metadata = updates.metadata;

    const { data, error } = await supabase
      .from("platform_connections")
      .update(updateData)
      .eq("id", connectionId)
      .select()
      .single();

    if (error) {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to update connection",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical"
      );
    }

    // Map database columns to interface (platform -> provider, account_name -> account_username, expires_at -> token_expires_at)
    const mapped = data as any;
    return {
      ...mapped,
      provider: mapped.platform || mapped.provider,  // Map platform to provider for interface
      account_username: mapped.account_name || mapped.account_username,  // Map account_name to account_username
      token_expires_at: mapped.expires_at || mapped.token_expires_at,  // Map expires_at to token_expires_at
      scopes: mapped.scopes || [],  // Default to empty array if scopes column doesn't exist
    } as PlatformConnectionRecord;
  }

  /**
   * Disconnect a platform (soft delete)
   */
  async disconnectPlatform(connectionId: string): Promise<void> {
    const { error } = await supabase
      .from("platform_connections")
      .update({ status: "disconnected" })
      .eq("id", connectionId);

    if (error) {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to disconnect platform",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical"
      );
    }
  }

  /**
   * Delete a connection (hard delete)
   */
  async deleteConnection(connectionId: string): Promise<void> {
    const { error } = await supabase
      .from("platform_connections")
      .delete()
      .eq("id", connectionId);

    if (error) {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to delete connection",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical"
      );
    }
  }

  /**
   * Create a social post
   */
  async createPost(
    brandId: string,
    post: {
      connectionIds: string[];
      title?: string;
      caption?: string;
      contentType?: string;
      mediaUrls?: string[];
      hashtags?: string[];
      ctaText?: string;
      ctaUrl?: string;
      platformSpecificData?: Record<string, unknown>;
      scheduleFor?: Date;
      createdBy?: string;
    }
  ): Promise<SocialPostRecord> {
    const { data, error } = await supabase
      .from("social_posts")
      .insert({
        brand_id: brandId,
        connection_ids: post.connectionIds,
        title: post.title,
        caption: post.caption,
        content_type: post.contentType,
        media_urls: post.mediaUrls,
        hashtags: post.hashtags,
        cta_text: post.ctaText,
        cta_url: post.ctaUrl,
        platform_specific_data: post.platformSpecificData,
        schedule_for: post.scheduleFor?.toISOString(),
        status: post.scheduleFor && post.scheduleFor > new Date() ? "scheduled" : "draft",
        created_by: post.createdBy,
      })
      .select()
      .single();

    if (error) {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to create post",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical"
      );
    }

    return data as SocialPostRecord;
  }

  /**
   * Get a social post by ID
   */
  async getPost(postId: string): Promise<SocialPostRecord | null> {
    const { data, error } = await supabase
      .from("social_posts")
      .select("*")
      .eq("id", postId)
      .single();

    if (error && error.code === "PGRST116") {
      return null;
    }

    if (error) {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to fetch post",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical"
      );
    }

    return data as SocialPostRecord;
  }

  /**
   * List posts for a brand
   */
  async listPosts(
    brandId: string,
    filters?: {
      status?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ posts: SocialPostRecord[]; total: number }> {
    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;

    let query = supabase
      .from("social_posts")
      .select("*", { count: "exact" })
      .eq("brand_id", brandId);

    if (filters?.status) {
      query = query.eq("status", filters.status);
    }

    query = query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to list posts",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical"
      );
    }

    return {
      posts: (data || []) as SocialPostRecord[],
      total: count || 0,
    };
  }

  /**
   * Update a post
   */
  async updatePost(
    postId: string,
    updates: Partial<{
      title: string;
      caption: string;
      mediaUrls: string[];
      hashtags: string[];
      status: string;
      platformSpecificData: Record<string, unknown>;
      publishedAt: Date;
      publishedUrls: Record<string, string>;
      performanceMetrics: Record<string, unknown>;
    }>
  ): Promise<SocialPostRecord> {
    const updateData: Record<string, unknown> = {};

    if (updates.title) updateData.title = updates.title;
    if (updates.caption) updateData.caption = updates.caption;
    if (updates.mediaUrls) updateData.media_urls = updates.mediaUrls;
    if (updates.hashtags) updateData.hashtags = updates.hashtags;
    if (updates.status) updateData.status = updates.status;
    if (updates.platformSpecificData)
      updateData.platform_specific_data = updates.platformSpecificData;
    if (updates.publishedAt) updateData.published_at = updates.publishedAt.toISOString();
    if (updates.publishedUrls) updateData.published_urls = updates.publishedUrls;
    if (updates.performanceMetrics)
      updateData.performance_metrics = updates.performanceMetrics;

    const { data, error } = await supabase
      .from("social_posts")
      .update(updateData)
      .eq("id", postId)
      .select()
      .single();

    if (error) {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to update post",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical"
      );
    }

    return data as SocialPostRecord;
  }

  /**
   * Delete a post
   */
  async deletePost(postId: string): Promise<void> {
    const { error } = await supabase
      .from("social_posts")
      .delete()
      .eq("id", postId);

    if (error) {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to delete post",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical"
      );
    }
  }

  /**
   * Check if a brand has a valid connection for a provider
   */
  async hasValidConnection(
    brandId: string,
    provider: string
  ): Promise<boolean> {
    const { data, error } = await supabase
      .from("platform_connections")
      .select("id", { count: "exact" })
      .eq("brand_id", brandId)
      .eq("platform", provider)  // Map provider to platform column
      .eq("status", "connected")
      .limit(1);

    if (error) {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to check connection status",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical"
      );
    }

    return (data?.length || 0) > 0;
  }

  /**
   * Get integration sync events (from analytics logs or similar)
   */
  async getIntegrationSyncEvents(
    integrationId: string,
    limit: number = 50
  ): Promise<Array<{ id: string; event_type: string; status: string; created_at: string }>> {
    // This would query from a sync_events or similar table if it exists
    // For now, return empty as the schema doesn't have a dedicated sync_events table
    return [];
  }
}

/**
 * Singleton instance
 */
export const integrationsDB = new IntegrationsDBService();
