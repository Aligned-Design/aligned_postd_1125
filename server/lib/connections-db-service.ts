/* eslint-disable */
/**
 * Platform Connections Database Service
 * Manages OAuth token persistence, verification, and lifecycle
 */

import { supabase } from "./supabase";
import { Platform } from "@shared/publishing";
import { parsePlatformConnection } from "../types/guards";

export interface PlatformConnectionRecord {
  id: string;
  brand_id: string;
  platform: string;
  account_id: string;
  account_name?: string;
  access_token: string;
  refresh_token?: string;
  expires_at?: string;
  token_expires_at?: string; // Alternative name for expires_at
  is_active: boolean;
  status: string;
  last_sync_at?: string;
  last_verified_at?: string; // Last time token was verified
  next_sync_at?: string;
  tenant_id?: string; // Tenant ID for multi-tenant support
  permissions?: string[]; // Platform permissions/scopes
  metadata?: Record<string, unknown>; // Additional metadata
  created_at: string;
  updated_at: string;
  disconnected_at?: string;
}

/**
 * Platform Connections Service
 * Handles database operations for OAuth connections
 */
export class ConnectionsDBService {
  /**
   * Create or update a platform connection
   */
  async upsertConnection(
    brandId: string,
    tenantId: string,
    platform: Platform,
    accessToken: string,
    accountId: string,
    accountName?: string,
    profilePicture?: string,
    refreshToken?: string,
    tokenExpiresAt?: Date,
    permissions?: string[],
    metadata?: unknown,
    userId?: string,
  ): Promise<PlatformConnectionRecord> {
    const { data: existing } = await supabase
      .from("platform_connections")
      .select("id")
      .eq("brand_id", brandId)
      .eq("platform", platform)
      .limit(1);

    const connectionData: unknown = {
      brand_id: brandId,
      platform,
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: tokenExpiresAt?.toISOString(),
      account_id: accountId,
      account_name: accountName,
      status: "active", // Use 'active' to match schema default
      is_active: true,
      updated_at: new Date().toISOString(),
    };

    if (existing && existing.length > 0) {
      // Update existing connection
      const { data, error } = await supabase
        .from("platform_connections")
        .update(connectionData)
        .eq("id", existing[0].id)
        .select()
        .single();

      if (error)
        throw new Error(`Failed to update connection: ${error.message}`);
      // runtime-validate
      const parsed = parsePlatformConnection(data);
      return parsed as PlatformConnectionRecord;
    } else {
      // Insert new connection
      const { data, error } = await supabase
        .from("platform_connections")
        .insert(connectionData)
        .select()
        .single();

      if (error)
        throw new Error(`Failed to create connection: ${error.message}`);
      const parsed = parsePlatformConnection(data);
      return parsed as PlatformConnectionRecord;
    }
  }

  /**
   * Get a connection by brand and platform
   */
  async getConnection(
    brandId: string,
    platform: Platform,
  ): Promise<PlatformConnectionRecord | null> {
    try {
      const { data, error } = await supabase
        .from("platform_connections")
        .select("*")
        .eq("brand_id", brandId)
        .eq("platform", platform)
        .single();

      if (error) {
        // PGRST116 means no rows returned, which is expected for non-existent connections
        if (error.code !== "PGRST116") {
          throw new Error(`Failed to get connection: ${error.message}`);
        }
        return null;
      }

      return parsePlatformConnection(data) as PlatformConnectionRecord;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all connections for a brand
   */
  async getBrandConnections(
    brandId: string,
  ): Promise<PlatformConnectionRecord[]> {
    const { data, error } = await supabase
      .from("platform_connections")
      .select("*")
      .eq("brand_id", brandId)
      .order("created_at", { ascending: false });

    if (error)
      throw new Error(`Failed to get brand connections: ${error.message}`);
    return data as PlatformConnectionRecord[];
  }

  /**
   * Get all connected accounts for a brand
   */
  async getConnectedPlatforms(brandId: string): Promise<Platform[]> {
    const { data, error } = await supabase
      .from("platform_connections")
      .select("platform")
      .eq("brand_id", brandId)
      .eq("status", "active")
      .eq("is_active", true);

    if (error)
      throw new Error(`Failed to get connected platforms: ${error.message}`);
    return data?.map((d: PlatformConnectionRecord) => d.platform as Platform) || [];
  }

  /**
   * Update connection status
   */
  async updateConnectionStatus(
    connectionId: string,
    status: "connected" | "expired" | "revoked" | "disconnected",
  ): Promise<PlatformConnectionRecord> {
    const { data, error } = await supabase
      .from("platform_connections")
      .update({ 
        status: status === "connected" ? "active" : status,
        is_active: status === "connected",
        updated_at: new Date().toISOString() 
      })
      .eq("id", connectionId)
      .select()
      .single();

    if (error)
      throw new Error(`Failed to update connection status: ${error.message}`);
    return data as PlatformConnectionRecord;
  }

  /**
   * Update access token (after refresh)
   */
  async updateAccessToken(
    connectionId: string,
    accessToken: string,
    refreshToken?: string,
    tokenExpiresAt?: Date,
  ): Promise<PlatformConnectionRecord> {
    const updateData: Record<string, unknown> = {
      access_token: accessToken,
      updated_at: new Date().toISOString(),
    };

    if (refreshToken) {
      updateData.refresh_token = refreshToken;
    }

    if (tokenExpiresAt) {
      updateData.expires_at = tokenExpiresAt.toISOString();
    }

    const { data, error } = await supabase
      .from("platform_connections")
      .update(updateData)
      .eq("id", connectionId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update token: ${error.message}`);
    return data as PlatformConnectionRecord;
  }

  /**
   * Disconnect a platform
   */
  async disconnectPlatform(
    brandId: string,
    platform: Platform,
  ): Promise<boolean> {
    const { error } = await supabase
      .from("platform_connections")
      .update({
        status: "disconnected",
        is_active: false,
        access_token: "", // Clear the token
        refresh_token: null,
        disconnected_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("brand_id", brandId)
      .eq("platform", platform);

    if (error)
      throw new Error(`Failed to disconnect platform: ${error.message}`);
    return true;
  }

  /**
   * Delete a connection permanently
   */
  async deleteConnection(
    brandId: string,
    platform: Platform,
  ): Promise<boolean> {
    const { error } = await supabase
      .from("platform_connections")
      .delete()
      .eq("brand_id", brandId)
      .eq("platform", platform);

    if (error) throw new Error(`Failed to delete connection: ${error.message}`);
    return true;
  }

  /**
   * Get connections expiring soon
   */
  async getExpiringConnections(
    hoursUntilExpiry: number = 24,
  ): Promise<PlatformConnectionRecord[]> {
    const expiryThreshold = new Date(
      Date.now() + hoursUntilExpiry * 60 * 60 * 1000,
    ).toISOString();

    const { data, error } = await supabase
      .from("platform_connections")
      .select("*")
      .eq("status", "active")
      .eq("is_active", true)
      .lte("expires_at", expiryThreshold)
      .order("expires_at", { ascending: true });

    if (error)
      throw new Error(`Failed to get expiring connections: ${error.message}`);
    return data as PlatformConnectionRecord[];
  }

  /**
   * Mark connection as verified
   */
  async verifyConnection(
    connectionId: string,
  ): Promise<PlatformConnectionRecord> {
    const { data, error } = await supabase
      .from("platform_connections")
      .update({
        status: "active",
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", connectionId)
      .select()
      .single();

    if (error) throw new Error(`Failed to verify connection: ${error.message}`);
    return data as PlatformConnectionRecord;
  }

  /**
   * Get connection statistics for a brand
   */
  async getConnectionStats(brandId: string): Promise<{
    total: number;
    connected: number;
    expired: number;
    revoked: number;
    platforms: string[];
  }> {
    const { data, error } = await supabase
      .from("platform_connections")
      .select("platform, status")
      .eq("brand_id", brandId);

    if (error)
      throw new Error(`Failed to get connection stats: ${error.message}`);

    const stats = {
      total: data?.length || 0,
      connected:
        data?.filter((d: PlatformConnectionRecord) => d.status === "connected" || d.status === "active").length || 0,
      expired: data?.filter((d: PlatformConnectionRecord) => d.status === "expired").length || 0,
      revoked: data?.filter((d: PlatformConnectionRecord) => d.status === "revoked").length || 0,
      platforms: [...new Set(data?.map((d: PlatformConnectionRecord) => d.platform) || [])] as string[],
    };

    return stats;
  }

  /**
   * Batch update connection statuses
   */
  async updateConnectionStatuses(
    updates: Array<{ id: string; status: string }>,
  ): Promise<PlatformConnectionRecord[]> {
    const results: PlatformConnectionRecord[] = [];

    for (const { id, status } of updates) {
      const { data, error } = await supabase
        .from("platform_connections")
        .update({
          status: status === "connected" ? "active" : status,
          is_active: status === "connected" || status === "active",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error)
        throw new Error(`Failed to update connection ${id}: ${error.message}`);
      results.push(data as PlatformConnectionRecord);
    }

    return results;
  }

  /**
   * Search connections
   */
  async searchConnections(
    brandId: string,
    filters?: {
      platform?: Platform;
      status?: string;
    },
  ): Promise<PlatformConnectionRecord[]> {
    let query = supabase
      .from("platform_connections")
      .select("*")
      .eq("brand_id", brandId);

    if (filters?.platform) {
      query = query.eq("platform", filters.platform);
    }

    if (filters?.status) {
      query = query.eq("status", filters.status);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error)
      throw new Error(`Failed to search connections: ${error.message}`);
    return data as PlatformConnectionRecord[];
  }
}

// Export singleton instance
export const connectionsDB = new ConnectionsDBService();
