/**
 * Platform Connections API Functions
 */

import { apiGet, apiPost, apiDelete } from "../api";

export interface ConnectedAccount {
  id: string;
  platform: string;
  account_name: string;
  account_id: string;
  status: "connected" | "disconnected" | "error";
  connected_at: string;
  disconnected_at?: string;
}

/**
 * List connected accounts for a brand
 */
export async function listConnectedAccounts(brandId: string): Promise<ConnectedAccount[]> {
  const response = await apiGet<{ connections: ConnectedAccount[] }>(
    `/api/brands/${brandId}/connections`
  );
  return response.connections || [];
}

/**
 * Connect a new platform account
 */
export async function connectAccount(
  brandId: string,
  platform: string,
  authData: Record<string, unknown>
): Promise<ConnectedAccount> {
  return apiPost<ConnectedAccount>(`/api/brands/${brandId}/connections`, {
    platform,
    ...authData,
  });
}

/**
 * Disconnect a platform account
 */
export async function disconnectAccount(brandId: string, connectionId: string): Promise<void> {
  await apiDelete(`/api/brands/${brandId}/connections/${connectionId}`);
}

