/**
 * OAuth Utilities - Shared OAuth handling across all connectors
 *
 * Handles:
 * - OAuth state validation
 * - Authorization code exchange
 * - Token storage in vault
 * - Token expiration tracking
 * - Error handling and recovery
 */

import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import TokenVault from '../lib/token-vault';
import { logger } from '../lib/observability';

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  revokeEndpoint?: string;
  scopes: string[];
}

export interface TokenResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType: string;
  scope?: string;
}

export class OAuthManager {
  private vault: TokenVault;
  private supabase: any;
  private config: OAuthConfig;
  private platform: string;

  constructor(
    platform: string,
    config: OAuthConfig,
    vault: TokenVault,
    supabaseUrl: string,
    supabaseKey: string
  ) {
    this.platform = platform;
    this.config = config;
    this.vault = vault;
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Generate OAuth authorization URL
   */
  generateAuthorizationUrl(tenantId: string): { url: string; state: string } {
    const state = this.generateState();
    const scopeString = this.config.scopes.join(' ');

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: scopeString,
      state,
      access_type: 'offline', // For refresh tokens
    });

    const url = `${this.config.authorizationEndpoint}?${params.toString()}`;

    logger.debug(
      {
        platform: this.platform,
        tenantId,
        state: state.substring(0, 8) + '...',
        scopes: this.config.scopes.length,
      },
      'OAuth authorization URL generated'
    );

    return { url, state };
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string): Promise<TokenResponse> {
    try {
      const body = new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        code,
        redirect_uri: this.config.redirectUri,
        grant_type: 'authorization_code',
      });

      const response = await fetch(this.config.tokenEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Token exchange failed: ${response.status} ${error}`);
      }

      const data = await response.json();

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in || 3600,
        tokenType: data.token_type || 'Bearer',
        scope: data.scope,
      };
    } catch (error) {
      logger.error(
        {
          platform: this.platform,
          error: error instanceof Error ? error.message : String(error),
        },
        'Token exchange failed'
      );
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
    try {
      const body = new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      });

      const response = await fetch(this.config.tokenEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Token refresh failed: ${response.status} ${error}`);
      }

      const data = await response.json();

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || refreshToken, // Some platforms don't return new refresh token
        expiresIn: data.expires_in || 3600,
        tokenType: data.token_type || 'Bearer',
        scope: data.scope,
      };
    } catch (error) {
      logger.error(
        {
          platform: this.platform,
          error: error instanceof Error ? error.message : String(error),
        },
        'Token refresh failed'
      );
      throw error;
    }
  }

  /**
   * Revoke token (logout)
   */
  async revokeToken(token: string): Promise<void> {
    if (!this.config.revokeEndpoint) {
      logger.warn({ platform: this.platform }, 'No revoke endpoint configured');
      return;
    }

    try {
      const body = new URLSearchParams({
        token,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
      });

      const response = await fetch(this.config.revokeEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });

      if (!response.ok) {
        throw new Error(`Token revocation failed: ${response.status}`);
      }

      logger.info({ platform: this.platform }, 'Token revoked successfully');
    } catch (error) {
      logger.error(
        {
          platform: this.platform,
          error: error instanceof Error ? error.message : String(error),
        },
        'Token revocation failed'
      );
      // Don't throw - revocation failure shouldn't block logout
    }
  }

  /**
   * Store tokens in vault and database
   */
  async storeTokens(
    tenantId: string,
    connectionId: string,
    tokens: TokenResponse,
    accountInfo: { userId: string; displayName: string; imageUrl?: string }
  ): Promise<void> {
    try {
      // Store in TokenVault (encrypted)
      await this.vault.storeSecret(tenantId, connectionId, 'access_token', tokens.accessToken);

      if (tokens.refreshToken) {
        await this.vault.storeSecret(tenantId, connectionId, 'refresh_token', tokens.refreshToken);
      }

      // Update connection record
      const expiresAt = new Date(Date.now() + tokens.expiresIn * 1000);

      const { error } = await this.supabase
        .from('connections')
        .update({
          status: 'active',
          health_status: 'healthy',
          scopes: this.config.scopes,
          token_expires_at: expiresAt.toISOString(),
          last_token_refresh: new Date().toISOString(),
          display_name: accountInfo.displayName,
          profile_image_url: accountInfo.imageUrl,
          metadata: {
            tokenType: tokens.tokenType,
            lastScope: tokens.scope,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', connectionId)
        .eq('tenant_id', tenantId);

      if (error) {
        throw error;
      }

      logger.info(
        {
          platform: this.platform,
          tenantId,
          connectionId: connectionId.substring(0, 8),
          expiresIn: tokens.expiresIn,
        },
        'Tokens stored successfully'
      );
    } catch (error) {
      logger.error(
        {
          platform: this.platform,
          error: error instanceof Error ? error.message : String(error),
        },
        'Failed to store tokens'
      );
      throw error;
    }
  }

  /**
   * Validate OAuth state to prevent CSRF
   */
  validateState(state: string, storedState: string): boolean {
    return crypto.timingSafeEqual(Buffer.from(state), Buffer.from(storedState));
  }

  /**
   * Generate random state for CSRF protection
   */
  private generateState(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}

export default OAuthManager;
