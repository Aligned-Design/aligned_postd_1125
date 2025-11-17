/**
 * Token Lifecycle Management
 *
 * Tracks OAuth token expiration, health status, and provides health checks
 * before scheduling actions that require valid channel connections.
 */

import { supabase } from "./supabase";

export interface TokenHealth {
  account_id: string;
  platform: string;
  is_healthy: boolean;
  expires_in_days: number | null;
  expires_at: string | null;
  last_checked: string;
  status: "valid" | "expiring_soon" | "expired" | "error";
}

export interface ChannelHealth {
  account_id: string;
  platform: string;
  healthy: boolean;
  reason: string | null;
  last_verified: string;
}

/**
 * Check if a token is healthy (not expired, not expiring soon)
 */
export async function checkTokenHealth(
  accountId: string
): Promise<TokenHealth | null> {
  try {
    const { data, error } = await supabase
      .from("linked_accounts")
      .select("*")
      .eq("id", accountId)
      .single();

    if (error || !data) {
      return {
        account_id: accountId,
        platform: "unknown",
        is_healthy: false,
        expires_in_days: null,
        expires_at: null,
        last_checked: new Date().toISOString(),
        status: "error",
      };
    }

    const tokenExpiresIn = data.token_expires_in || null;
    const expiresAt = data.token_expires_at || null;

    // Determine health status
    let status: "valid" | "expiring_soon" | "expired" | "error" = "valid";
    let isHealthy = true;

    if (!expiresAt) {
      status = "error";
      isHealthy = false;
    } else {
      const expiryDate = new Date(expiresAt);
      const daysUntilExpiry = Math.ceil(
        (expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilExpiry < 0) {
        status = "expired";
        isHealthy = false;
      } else if (daysUntilExpiry < 7) {
        // Warning: expiring within 7 days
        status = "expiring_soon";
        isHealthy = false;
      } else {
        status = "valid";
        isHealthy = true;
      }
    }

    return {
      account_id: accountId,
      platform: data.platform,
      is_healthy: isHealthy,
      expires_in_days:
        tokenExpiresIn ||
        (expiresAt
          ? Math.ceil(
              (new Date(expiresAt).getTime() - new Date().getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : null),
      expires_at: expiresAt,
      last_checked: new Date().toISOString(),
      status,
    };
  } catch (error) {
    console.error("Failed to check token health:", error);
    return {
      account_id: accountId,
      platform: "unknown",
      is_healthy: false,
      expires_in_days: null,
      expires_at: null,
      last_checked: new Date().toISOString(),
      status: "error",
    };
  }
}

/**
 * Check health of multiple accounts
 */
export async function checkMultipleTokenHealth(
  accountIds: string[]
): Promise<TokenHealth[]> {
  const results = await Promise.all(
    accountIds.map((id) => checkTokenHealth(id))
  );
  return results.filter((r) => r !== null) as TokenHealth[];
}

/**
 * Check if account is ready for scheduling (all channels healthy)
 */
export async function isChannelHealthy(accountId: string): Promise<boolean> {
  const health = await checkTokenHealth(accountId);
  if (!health) return false;
  return health.is_healthy;
}

/**
 * Get all unhealthy accounts for a brand
 */
export async function getUnhealthyAccounts(
  brandId: string
): Promise<TokenHealth[]> {
  try {
    const { data, error } = await supabase
      .from("linked_accounts")
      .select("*")
      .eq("brand_id", brandId);

    if (error || !data) return [];

    const healthChecks = await Promise.all(
      data.map((account) => checkTokenHealth(account.id))
    );

    return healthChecks.filter((h) => h && !h.is_healthy) as TokenHealth[];
  } catch (error) {
    console.error("Failed to get unhealthy accounts:", error);
    return [];
  }
}

/**
 * Update token expiration data (usually called after OAuth refresh)
 */
export async function updateTokenExpiration(
  accountId: string,
  expiresInDays: number,
  newTokenExpiresAt?: string
): Promise<void> {
  try {
    const expiresAt =
      newTokenExpiresAt ||
      new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString();

    await supabase
      .from("linked_accounts")
      .update({
        token_expires_in: expiresInDays,
        token_expires_at: expiresAt,
        last_synced_at: new Date().toISOString(),
      })
      .eq("id", accountId);
  } catch (error) {
    console.error("Failed to update token expiration:", error);
    throw error;
  }
}

/**
 * Daily cron task: Check all tokens and mark expired ones
 * (Should be called by a scheduled job, e.g., Vercel cron)
 */
export async function dailyTokenHealthCheck(): Promise<{
  checked: number;
  unhealthy: number;
  expired: number;
}> {
  try {
    const { data: allAccounts, error } = await supabase
      .from("linked_accounts")
      .select("id");

    if (error || !allAccounts) {
      return { checked: 0, unhealthy: 0, expired: 0 };
    }

    let unhealthyCount = 0;
    let expiredCount = 0;

    for (const account of allAccounts) {
      const health = await checkTokenHealth(account.id);
      if (health && !health.is_healthy) {
        unhealthyCount++;
        if (health.status === "expired") {
          expiredCount++;
        }
      }
    }

    // TODO: Send daily digest email with findings
    console.log(
      `Daily token health check: ${allAccounts.length} checked, ${unhealthyCount} unhealthy, ${expiredCount} expired`
    );

    return {
      checked: allAccounts.length,
      unhealthy: unhealthyCount,
      expired: expiredCount,
    };
  } catch (error) {
    console.error("Daily token health check failed:", error);
    return { checked: 0, unhealthy: 0, expired: 0 };
  }
}

/**
 * Get token health summary for a brand's connected accounts
 */
export async function getTokenHealthSummary(brandId: string): Promise<{
  total_accounts: number;
  healthy: number;
  expiring_soon: number;
  expired: number;
  error: number;
}> {
  const unhealthy = await getUnhealthyAccounts(brandId);
  const { data: allAccounts, error } = await supabase
    .from("linked_accounts")
    .select("*")
    .eq("brand_id", brandId);

  if (error || !allAccounts) {
    return { total_accounts: 0, healthy: 0, expiring_soon: 0, expired: 0, error: 0 };
  }

  const healthDetails = await Promise.all(
    allAccounts.map((acc) => checkTokenHealth(acc.id))
  );

  const summary = {
    total_accounts: allAccounts.length,
    healthy: 0,
    expiring_soon: 0,
    expired: 0,
    error: 0,
  };

  for (const health of healthDetails) {
    if (!health) continue;
    switch (health.status) {
      case "valid":
        summary.healthy++;
        break;
      case "expiring_soon":
        summary.expiring_soon++;
        break;
      case "expired":
        summary.expired++;
        break;
      case "error":
        summary.error++;
        break;
    }
  }

  return summary;
}
