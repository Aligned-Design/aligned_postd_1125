import crypto from "crypto";
import { Platform, OAuthFlow, PlatformConnection } from "@shared/publishing";
import { oauthStateCache } from "./oauth-state-cache";

interface OAuthConfig {
  authUrl: string;
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string[];
}

const getAppUrl = () => process.env.APP_URL || process.env.VITE_APP_URL || 'http://localhost:8080';

const OAUTH_CONFIGS: Record<Platform, OAuthConfig> = {
  instagram: {
    authUrl: "https://www.facebook.com/v18.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v18.0/oauth/access_token",
    clientId: process.env.META_APP_ID || '',
    clientSecret: process.env.META_APP_SECRET || '',
    redirectUri: process.env.META_REDIRECT_URI || `${getAppUrl()}/api/auth/meta/callback`,
    scope: [
      "pages_manage_posts",
      "pages_read_engagement",
      "instagram_business_content_publish",
      "instagram_business_basic",
    ],
  },
  facebook: {
    authUrl: "https://www.facebook.com/v18.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v18.0/oauth/access_token",
    clientId: process.env.META_APP_ID || '',
    clientSecret: process.env.META_APP_SECRET || '',
    redirectUri: process.env.META_REDIRECT_URI || `${getAppUrl()}/api/auth/meta/callback`,
    scope: [
      "pages_manage_posts",
      "pages_read_engagement",
      "business_management",
    ],
  },
  linkedin: {
    authUrl: "https://www.linkedin.com/oauth/v2/authorization",
    tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
    clientId: process.env.LINKEDIN_CLIENT_ID || '',
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
    redirectUri: process.env.LINKEDIN_REDIRECT_URI || `${getAppUrl()}/api/auth/linkedin/callback`,
    scope: ["w_member_social", "r_liteprofile", "r_emailaddress"],
  },
  twitter: {
    authUrl: "https://twitter.com/i/oauth2/authorize",
    tokenUrl: "https://api.twitter.com/2/oauth2/token",
    clientId: process.env.X_CLIENT_ID || '',
    clientSecret: process.env.X_CLIENT_SECRET || '',
    redirectUri: process.env.X_REDIRECT_URI || `${getAppUrl()}/api/auth/x/callback`,
    scope: ["tweet.read", "tweet.write", "users.read"],
  },
  x: {
    authUrl: "https://twitter.com/i/oauth2/authorize",
    tokenUrl: "https://api.twitter.com/2/oauth2/token",
    clientId: process.env.X_CLIENT_ID || '',
    clientSecret: process.env.X_CLIENT_SECRET || '',
    redirectUri: process.env.X_REDIRECT_URI || `${getAppUrl()}/api/auth/x/callback`,
    scope: ["tweet.read", "tweet.write", "users.read"],
  },
  tiktok: {
    authUrl: "https://www.tiktok.com/v2/auth/authorize",
    tokenUrl: "https://open.tiktokapis.com/v2/oauth/token",
    clientId: process.env.TIKTOK_CLIENT_KEY || '',
    clientSecret: process.env.TIKTOK_CLIENT_SECRET || '',
    redirectUri: process.env.TIKTOK_REDIRECT_URI || `${getAppUrl()}/api/auth/tiktok/callback`,
    scope: ["video.upload", "video.publish", "user.info.basic"],
  },
  threads: {
    authUrl: "https://www.facebook.com/v18.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v18.0/oauth/access_token",
    clientId: process.env.THREADS_APP_ID || process.env.META_APP_ID || '',
    clientSecret: process.env.THREADS_APP_SECRET || process.env.META_APP_SECRET || '',
    redirectUri: process.env.THREADS_REDIRECT_URI || process.env.META_REDIRECT_URI || `${getAppUrl()}/api/auth/threads/callback`,
    scope: ["threads_basic", "threads_content_publish"],
  },
  canva: {
    authUrl: "https://www.canva.com/api/oauth/authorize",
    tokenUrl: "https://api.canva.com/rest/v1/oauth/token",
    clientId: process.env.CANVA_CLIENT_ID || '',
    clientSecret: process.env.CANVA_CLIENT_SECRET || '',
    redirectUri: process.env.CANVA_REDIRECT_URI || `${getAppUrl()}/api/auth/canva/callback`,
    scope: ["design:read", "design:write", "user:read"],
  },
  google_business: {
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: `${getAppUrl()}/api/auth/google/callback`,
    scope: ["https://www.googleapis.com/auth/business.manage"],
  },
};

/**
 * ✅ SECURE: Generate OAuth URL with secure state token
 * - State token is 64-character hex string (no information disclosure)
 * - brandId is stored securely in backend cache, NOT in state parameter
 * - Prevents information disclosure in OAuth provider logs
 */
export function generateOAuthUrl(
  platform: Platform,
  brandId: string,
): OAuthFlow {
  const config = OAUTH_CONFIGS[platform];
  const state = crypto.randomBytes(32).toString("hex");
  const codeVerifier = crypto.randomBytes(32).toString("base64url");

  // Store state and code verifier in secure cache with 10-minute expiration
  // This prevents CSRF attacks and ensures state can only be used once
  // brandId is stored securely in backend, not exposed in state parameter
  oauthStateCache.store(state, brandId, platform, codeVerifier);

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scope.join(" "),
    // ✅ SECURE: State token only, no brandId (prevents information disclosure)
    state,
    response_type: "code",
  });

  // Add platform-specific parameters
  if (platform === "twitter" || platform === "x") {
    const codeChallenge = crypto
      .createHash("sha256")
      .update(codeVerifier)
      .digest("base64url");
    params.append("code_challenge", codeChallenge);
    params.append("code_challenge_method", "S256");
  }

  const authUrl = `${config.authUrl}?${params.toString()}`;

  return {
    platform,
    authUrl,
    // ✅ SECURE: Return state token only (no brandId exposure)
    state,
    codeVerifier: platform === "twitter" || platform === "x" ? codeVerifier : undefined,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
  };
}

/**
 * ✅ SECURE: Exchange OAuth code for access token
 * - Validates state from cache to prevent CSRF
 * - Retrieves brandId from backend cache (not from state parameter)
 * - Verifies platform matches the original request
 */
export async function exchangeCodeForToken(
  platform: Platform,
  code: string,
  state: string,
): Promise<{
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  accountInfo: unknown;
  brandId: string;
}> {
  const config = OAUTH_CONFIGS[platform];

  // ✅ SECURE: Retrieve and validate state from cache
  // This prevents CSRF attacks and verifies we initiated this OAuth flow
  // State is now just the token - no information disclosure
  const stateData = oauthStateCache.retrieve(state);

  if (!stateData) {
    throw new Error(
      "Invalid or expired OAuth state. The authorization request may have expired. Please start again.",
    );
  }

  // Verify platform matches the original request
  if (stateData.platform !== platform) {
    throw new Error(
      `Platform mismatch: expected ${stateData.platform}, got ${platform}`,
    );
  }

  // ✅ SECURE: Retrieve brandId from backend cache, not from state parameter
  const { brandId, codeVerifier } = stateData;

  const tokenParams = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
    code,
    grant_type: "authorization_code",
  });

  // Add platform-specific parameters
  if (platform === "twitter" || platform === "x") {
    // ✅ SECURE: Retrieve code_verifier from cache (PKCE verification)
    // This ensures the token exchange came from the same client that initiated the OAuth flow
    tokenParams.append("code_verifier", codeVerifier);
  }

  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: tokenParams.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  const tokenData = await response.json();

  // Get account information
  const accountInfo = await getAccountInfo(platform, tokenData.access_token);

  return {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresIn: tokenData.expires_in,
    accountInfo,
    // ✅ SECURE: brandId comes from cache, not from state parameter
    brandId,
  };
}

async function getAccountInfo(
  platform: Platform,
  accessToken: string,
): Promise<unknown> {
  const endpoints: Record<Platform, string> = {
    instagram:
      "https://graph.instagram.com/me?fields=id,username,account_type,media_count",
    facebook: "https://graph.facebook.com/me?fields=id,name,picture",
    linkedin:
      "https://api.linkedin.com/v2/me?projection=(id,firstName,lastName,profilePicture)",
    twitter:
      "https://api.twitter.com/2/users/me?user.fields=id,name,username,profile_image_url",
    x:
      "https://api.twitter.com/2/users/me?user.fields=id,name,username,profile_image_url",
    tiktok:
      "https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name",
    threads:
      "https://graph.facebook.com/me?fields=id,name,picture",
    canva:
      "https://api.canva.com/rest/v1/users/me",
    google_business:
      "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
  };

  const endpoint = endpoints[platform];
  if (!endpoint) {
    throw new Error(`No account info endpoint configured for platform: ${platform}`);
  }

  const response = await fetch(endpoint, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get account info: ${response.statusText}`);
  }

  return response.json();
}

export async function refreshAccessToken(
  connection: PlatformConnection,
): Promise<{
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}> {
  if (!connection.refreshToken) {
    throw new Error("No refresh token available");
  }

  const config = OAUTH_CONFIGS[connection.platform];

  const params = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: connection.refreshToken,
    grant_type: "refresh_token",
  });

  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    throw new Error(`Token refresh failed: ${response.statusText}`);
  }

  const tokenData = await response.json();

  return {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token || connection.refreshToken,
    expiresIn: tokenData.expires_in,
  };
}

export function isTokenExpired(connection: PlatformConnection): boolean {
  if (!connection.tokenExpiresAt) {
    return false; // Assume valid if no expiry set
  }

  const expiryTime = new Date(connection.tokenExpiresAt).getTime();
  const now = Date.now();
  const buffer = 5 * 60 * 1000; // 5 minute buffer

  return now >= expiryTime - buffer;
}
