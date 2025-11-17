/**
 * Token Health Checker
 *
 * Monitors and validates OAuth tokens for all connected social platforms.
 * Blocks publishing on expired/invalid tokens and provides reconnection guidance.
 *
 * Platforms: Instagram, Facebook, LinkedIn, Twitter/X, TikTok, GBP, Mailchimp, YouTube, Pinterest, WordPress
 */

import type { BrandHistoryEntry } from "./collaboration-artifacts";

export interface TokenStatus {
  platform: string;
  accountId: string;
  status: "healthy" | "expiring" | "expired" | "scope_missing" | "rate_limited";
  expiresAt?: Date;
  scopes?: string[];
  missingScopesFor?: string[]; // e.g., ["post_insights", "manage_pages"]
  rateLimitRemaining?: number;
  rateLimitReset?: Date;
  lastChecked: Date;
  error?: string;
}

export interface TokenHealthReport {
  brandId: string;
  generatedAt: Date;
  overall: "healthy" | "expiring" | "at_risk" | "critical";
  tokens: TokenStatus[];
  warnings: Array<{
    platform: string;
    message: string;
    daysUntilAction: number;
    recommendedAction: string;
  }>;
  blockedPlatforms: string[]; // Platforms that cannot publish right now
  nextCheckScheduled: Date;
}

const PLATFORMS = [
  "instagram",
  "facebook",
  "linkedin",
  "twitter",
  "tiktok",
  "gbp",
  "mailchimp",
  "youtube",
  "pinterest",
  "wordpress",
];

const EXPIRY_WARNING_DAYS = {
  critical: 1,
  urgent: 3,
  warning: 7,
  advisory: 30,
};

/**
 * Token Health Checker - validates all connected platform tokens
 */
export class TokenHealthChecker {
  private brandId: string;
  private tokenStore: Map<string, TokenStatus> = new Map();

  constructor(brandId: string) {
    this.brandId = brandId;
    this.initializeTokenStore();
  }

  /**
   * Initialize empty token store for all platforms
   */
  private initializeTokenStore(): void {
    for (const platform of PLATFORMS) {
      this.tokenStore.set(platform, {
        platform,
        accountId: "",
        status: "expired",
        lastChecked: new Date(),
        error: "Token not connected",
      });
    }
  }

  /**
   * Check health of all connected tokens
   */
  async checkAllTokens(): Promise<TokenHealthReport> {
    const tokens: TokenStatus[] = [];
    const warnings: TokenHealthReport["warnings"] = [];
    const blockedPlatforms: string[] = [];

    console.log(`[TokenHealthChecker] Checking tokens for brand ${this.brandId}`);

    for (const platform of PLATFORMS) {
      try {
        const status = await this.checkPlatformToken(platform);
        tokens.push(status);

        // Add to warnings if approaching expiry
        if (status.expiresAt) {
          const daysUntilExpiry = Math.floor(
            (status.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          );

          if (daysUntilExpiry <= EXPIRY_WARNING_DAYS.advisory) {
            const severity =
              daysUntilExpiry <= EXPIRY_WARNING_DAYS.critical
                ? "critical"
                : daysUntilExpiry <= EXPIRY_WARNING_DAYS.urgent
                  ? "urgent"
                  : daysUntilExpiry <= EXPIRY_WARNING_DAYS.warning
                    ? "warning"
                    : "advisory";

            warnings.push({
              platform,
              message: `Token ${severity === "critical" ? "EXPIRED" : "expiring"} in ${daysUntilExpiry} day(s)`,
              daysUntilAction: daysUntilExpiry,
              recommendedAction:
                severity === "critical"
                  ? "Reconnect immediately—publishing blocked"
                  : `Reconnect within ${daysUntilExpiry} days to maintain access`,
            });
          }
        }

        // Check for missing scopes
        if (status.missingScopesFor && status.missingScopesFor.length > 0) {
          warnings.push({
            platform,
            message: `Missing permissions: ${status.missingScopesFor.join(", ")}`,
            daysUntilAction: 0,
            recommendedAction: "Re-authorize account with required scopes",
          });

          if (status.missingScopesFor.includes("publish")) {
            blockedPlatforms.push(platform);
          }
        }

        // Block if token is invalid/expired
        if (
          status.status === "expired" ||
          status.status === "scope_missing" ||
          status.error
        ) {
          blockedPlatforms.push(platform);
        }
      } catch (error) {
        console.warn(`[TokenHealthChecker] Error checking ${platform}:`, error);
        const status: TokenStatus = {
          platform,
          accountId: "",
          status: "expired",
          lastChecked: new Date(),
          error: `Check failed: ${error instanceof Error ? error.message : String(error)}`,
        };
        tokens.push(status);
        blockedPlatforms.push(platform);
      }
    }

    // Determine overall health
    const overall: TokenHealthReport["overall"] =
      blockedPlatforms.length > 0
        ? blockedPlatforms.length >= 3
          ? "critical"
          : "at_risk"
        : warnings.length > 0
          ? "expiring"
          : "healthy";

    const report: TokenHealthReport = {
      brandId: this.brandId,
      generatedAt: new Date(),
      overall,
      tokens,
      warnings,
      blockedPlatforms,
      nextCheckScheduled: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
    };

    console.log(
      `[TokenHealthChecker] Report complete: ${overall} (${blockedPlatforms.length} platforms blocked)`
    );
    return report;
  }

  /**
   * Check single platform token (mocked for demo)
   */
  private async checkPlatformToken(
    platform: string
  ): Promise<TokenStatus> {
    // In production, this would call actual platform APIs to verify token validity
    // For now, we return a mock status that can be used for testing

    const mockTokens: Record<string, TokenStatus> = {
      instagram: {
        platform: "instagram",
        accountId: "aligned-ai-brand",
        status: "healthy",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        scopes: ["instagram_basic", "instagram_content_publishing"],
        lastChecked: new Date(),
      },
      facebook: {
        platform: "facebook",
        accountId: "aligned-ai-brand",
        status: "healthy",
        expiresAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days
        scopes: ["pages_manage_metadata", "pages_manage_posts"],
        lastChecked: new Date(),
      },
      linkedin: {
        platform: "linkedin",
        accountId: "aligned-ai-brand",
        status: "expiring",
        expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days (warning)
        scopes: ["w_member_social", "r_liteprofile"],
        lastChecked: new Date(),
      },
      twitter: {
        platform: "twitter",
        accountId: "aligned_ai",
        status: "scope_missing",
        scopes: ["tweet.read"],
        missingScopesFor: ["tweet.write"],
        lastChecked: new Date(),
        error: "Missing required write scope",
      },
      tiktok: {
        platform: "tiktok",
        accountId: "aligned_ai",
        status: "expired",
        lastChecked: new Date(),
        error: "Token expired on 2025-11-10",
      },
      gbp: {
        platform: "gbp",
        accountId: "aligned-ai-business",
        status: "healthy",
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
        scopes: ["business.manage", "business.publish"],
        lastChecked: new Date(),
      },
      mailchimp: {
        platform: "mailchimp",
        accountId: "aligned@mailchimp",
        status: "healthy",
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        scopes: ["campaigns", "lists", "reports"],
        lastChecked: new Date(),
      },
      youtube: {
        platform: "youtube",
        accountId: "aligned-ai-channel",
        status: "healthy",
        expiresAt: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000), // 35 days
        scopes: ["youtube.upload", "youtube.manage"],
        lastChecked: new Date(),
      },
      pinterest: {
        platform: "pinterest",
        accountId: "aligned_ai",
        status: "rate_limited",
        expiresAt: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000), // 50 days
        scopes: ["boards:read", "pins:create"],
        rateLimitRemaining: 0,
        rateLimitReset: new Date(Date.now() + 3600 * 1000), // 1 hour
        lastChecked: new Date(),
        error: "Rate limit exceeded; reset in 1 hour",
      },
      wordpress: {
        platform: "wordpress",
        accountId: "aligned-ai-blog",
        status: "healthy",
        expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 180 days
        scopes: ["edit_posts", "manage_categories"],
        lastChecked: new Date(),
      },
    };

    return (
      mockTokens[platform] || {
        platform,
        accountId: "",
        status: "expired",
        lastChecked: new Date(),
        error: "Platform not supported",
      }
    );
  }

  /**
   * Check if platform can publish
   */
  canPublish(platform: string): boolean {
    const status = this.tokenStore.get(platform.toLowerCase());
    if (!status) return false;

    return (
      status.status === "healthy" &&
      !status.error &&
      (!status.expiresAt ||
        new Date(status.expiresAt).getTime() > Date.now() + 24 * 60 * 60 * 1000)
    ); // Must have >24h validity
  }

  /**
   * Create BrandHistoryEntry for token warning
   */
  createTokenWarningEntry(
    report: TokenHealthReport
  ): BrandHistoryEntry | null {
    if (report.overall === "healthy") return null;

    return {
      timestamp: new Date().toISOString(),
      agent: "advisor",
      action: "performance_insight",
      details: {
        description: `Token health check: ${report.overall.toUpperCase()}`,
        visualization: {
          colors: [],
          layout: "status-report",
          typography: [],
        },
      },
      rationale: `${report.blockedPlatforms.length} platform(s) blocked due to token issues: ${report.blockedPlatforms.join(", ")}`,
      tags: [`token_${report.overall}`, "publishing_blocked"],
    };
  }

  /**
   * Get reconnection prompt for user
   */
  getReconnectionPrompt(platform: string): string {
    return `
🔗 Reconnect ${platform.toUpperCase()}

Your ${platform} account needs attention before you can publish.

Action Required:
1. Go to Settings → Connected Accounts
2. Click "Reconnect ${platform}"
3. Follow the authorization flow
4. Approve all requested permissions

Once connected, you can publish immediately.
    `.trim();
  }
}

/**
 * Create global token health checker instance
 */
export const createTokenHealthChecker = (brandId: string) => {
  return new TokenHealthChecker(brandId);
};

/**
 * Get human-readable health report
 */
export function getHealthReportString(report: TokenHealthReport): string {
  let output = `\n📊 Token Health Report: ${report.brandId}\n`;
  output += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  const statusIcon = {
    healthy: "✅",
    expiring: "⚠️ ",
    at_risk: "🔴",
    critical: "⛔",
  };

  output += `Overall Status: ${statusIcon[report.overall]} ${report.overall.toUpperCase()}\n`;
  output += `Generated: ${report.generatedAt.toISOString()}\n`;
  output += `Blocked Platforms: ${report.blockedPlatforms.length}\n\n`;

  output += `📋 Platform Details:\n`;
  for (const token of report.tokens) {
    const icon =
      token.status === "healthy"
        ? "✅"
        : token.status === "expiring"
          ? "⚠️ "
          : "❌";
    output += `  ${icon} ${token.platform.toUpperCase()}: ${token.status}`;

    if (token.expiresAt) {
      const daysLeft = Math.floor(
        (token.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      output += ` (expires in ${daysLeft} days)`;
    }

    if (token.error) {
      output += ` - ${token.error}`;
    }

    output += "\n";
  }

  if (report.warnings.length > 0) {
    output += `\n⚠️  Warnings:\n`;
    for (const warning of report.warnings) {
      output += `  • [${warning.platform}] ${warning.message}\n`;
      output += `    → ${warning.recommendedAction}\n`;
    }
  }

  output += `\nNext Check: ${report.nextCheckScheduled.toISOString()}\n`;

  return output;
}
