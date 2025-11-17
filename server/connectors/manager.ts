/**
 * Connector Manager - Orchestrates all platform connectors
 *
 * Provides:
 * - Unified connector instantiation
 * - Connection status tracking
 * - Token refresh scheduling
 * - Health check monitoring
 * - Error classification and DLQ management
 * - Retry logic integration with Bull queue
 *
 * Usage:
 * const manager = new ConnectorManager(tenantId);
 * const connector = await manager.getConnector('meta', connectionId);
 * const result = await connector.publish(accountId, title, body);
 */

import { createClient } from '@supabase/supabase-js';
import pino from 'pino';
import MetaConnector from './meta';
import LinkedInConnector from './linkedin';
import TikTokConnector from './tiktok';
import TwitterConnector from './twitter/implementation';
import CanvaConnector from './canva';
import { publishJobQueue } from '../queue';
import { logger, recordMetric } from '../lib/observability';
import TokenVault from '../lib/token-vault';
import BaseConnector from './base';

const logger_pino = pino();

export class ConnectorManager {
  private tenantId: string;
  private supabase: any;
  private vault: TokenVault;
  private connectors: Map<string, BaseConnector> = new Map();

  constructor(
    tenantId: string,
    supabaseUrl?: string,
    supabaseKey?: string,
    vault?: TokenVault
  ) {
    this.tenantId = tenantId;
    const url = supabaseUrl || process.env.VITE_SUPABASE_URL || '';
    const key = supabaseKey || process.env.VITE_SUPABASE_ANON_KEY || '';

    this.supabase = createClient(url, key);
    this.vault = vault || new TokenVault({ supabaseUrl: url, supabaseKey: key });
  }

  /**
   * Get or create connector instance for a platform
   */
  async getConnector(platform: string, connectionId: string): Promise<BaseConnector> {
    const cacheKey = `${platform}_${connectionId}`;

    // Return cached instance
    if (this.connectors.has(cacheKey)) {
      return this.connectors.get(cacheKey)!;
    }

    // Create new connector
    let connector: BaseConnector;

    switch (platform.toLowerCase()) {
      case 'meta':
        connector = new MetaConnector(this.tenantId, connectionId, {
          vault: this.vault,
          supabaseUrl: process.env.VITE_SUPABASE_URL,
          supabaseKey: process.env.VITE_SUPABASE_ANON_KEY,
        });
        break;

      case 'linkedin':
        connector = new LinkedInConnector(this.tenantId, connectionId, {
          vault: this.vault,
          supabaseUrl: process.env.VITE_SUPABASE_URL,
          supabaseKey: process.env.VITE_SUPABASE_ANON_KEY,
        });
        break;

      case 'tiktok':
        connector = new TikTokConnector(this.tenantId, connectionId, {
          vault: this.vault,
          supabaseUrl: process.env.VITE_SUPABASE_URL,
          supabaseKey: process.env.VITE_SUPABASE_ANON_KEY,
        });
        break;

      case 'twitter':
      case 'x':
        connector = new TwitterConnector(this.tenantId, connectionId, {
          vault: this.vault,
          supabaseUrl: process.env.VITE_SUPABASE_URL,
          supabaseKey: process.env.VITE_SUPABASE_ANON_KEY,
        });
        break;

      case 'canva':
        connector = new CanvaConnector(this.tenantId, connectionId, {
          vault: this.vault,
          supabaseUrl: process.env.VITE_SUPABASE_URL,
          supabaseKey: process.env.VITE_SUPABASE_ANON_KEY,
        });
        break;

      case 'gbp':
        // TODO: Import GBPConnector
        throw new Error('GBP connector not yet implemented');

      case 'mailchimp':
        // TODO: Import MailchimpConnector
        throw new Error('Mailchimp connector not yet implemented');

      default:
        throw new Error(`Unknown platform: ${platform}`);
    }

    // Cache and return
    this.connectors.set(cacheKey, connector);
    return connector;
  }

  /**
   * Publish content via Bull queue for async processing
   */
  async publishViaQueue(
    connectionId: string,
    platform: string,
    accountId: string,
    title: string,
    body: string,
    mediaUrls?: string[],
    idempotencyKey?: string
  ): Promise<string> {
    try {
      // Generate idempotency key if not provided (prevents duplicates)
      const key = idempotencyKey || `publish_${Date.now()}_${Math.random().toString(36)}`;

      // Add job to queue
      const job = await publishJobQueue.add(
        'publish',
        {
          jobId: key,
          tenantId: this.tenantId,
          connectionId,
          platform,
          accountId,
          title,
          body,
          mediaUrls,
        },
        {
          jobId: key,
          attempts: 4,
          backoff: { type: 'exponential', delay: 1000 },
          removeOnComplete: { age: 3600 }, // Remove after 1 hour
          removeOnFail: false, // Keep for DLQ inspection
        }
      );

      logger.info(
        {
          tenantId: this.tenantId,
          jobId: job.id,
          platform,
          accountId,
        },
        'Publish job queued'
      );

      recordMetric('connector.publish_queued', 1, { platform });

      return job.id || key;
    } catch (error) {
      logger.error(
        {
          tenantId: this.tenantId,
          platform,
          error: error instanceof Error ? error.message : String(error),
        },
        'Failed to queue publish job'
      );
      throw error;
    }
  }

  /**
   * Schedule token refresh for all expiring tokens
   */
  async scheduleTokenRefreshes(): Promise<void> {
    try {
      // Get all connections expiring in next 24 hours
      const { data: expiring, error } = await this.supabase
        .from('connections')
        .select('id, platform_id, token_expires_at')
        .eq('tenant_id', this.tenantId)
        .eq('status', 'active')
        .lt('token_expires_at', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString())
        .gt('token_expires_at', new Date().toISOString());

      if (error) {
        throw error;
      }

      // Queue refresh jobs
      for (const conn of expiring || []) {
        // Get platform name
        const { data: platform } = await this.supabase
          .from('connector_platforms')
          .select('platform_name')
          .eq('id', conn.platform_id)
          .single();

        if (!platform) continue;

        await publishJobQueue.add(
          'token_refresh',
          {
            tenantId: this.tenantId,
            connectionId: conn.id,
            platform: platform.platform_name,
          },
          {
            jobId: `refresh_${conn.id}_${Date.now()}`,
            attempts: 3,
            backoff: { type: 'exponential', delay: 2000 },
          }
        );

        logger.debug(
          {
            connectionId: conn.id,
            platform: platform.platform_name,
            expiresAt: conn.token_expires_at,
          },
          'Token refresh scheduled'
        );
      }

      recordMetric('connector.token_refresh_scheduled', expiring?.length || 0);
    } catch (error) {
      logger.error(
        {
          tenantId: this.tenantId,
          error: error instanceof Error ? error.message : String(error),
        },
        'Failed to schedule token refreshes'
      );
    }
  }

  /**
   * Run health checks for all active connections
   */
  async runHealthChecks(): Promise<void> {
    try {
      // Get all active connections
      const { data: connections, error } = await this.supabase
        .from('connections')
        .select('id, platform_id, status')
        .eq('tenant_id', this.tenantId)
        .eq('status', 'active');

      if (error) {
        throw error;
      }

      // Run health check for each
      for (const conn of connections || []) {
        // Get platform name
        const { data: platform } = await this.supabase
          .from('connector_platforms')
          .select('platform_name')
          .eq('id', conn.platform_id)
          .single();

        if (!platform) continue;

        try {
          const connector = await this.getConnector(platform.platform_name, conn.id);
          const health = await connector.healthCheck();

          // Store health check result
          const { error: logError } = await this.supabase
            .from('connection_health_log')
            .insert({
              connection_id: conn.id,
              status: health.status,
              latency_ms: health.latencyMs,
              error_message: health.message,
              check_type: 'synthetic',
            });

          if (logError) {
            logger.warn({ error: logError.message }, 'Failed to log health check');
          }

          // Update connection status
          let newStatus = 'active';
          if (health.status === 'critical') {
            newStatus = 'attention';
          }

          await this.supabase
            .from('connections')
            .update({
              health_status: health.status,
              last_health_check: new Date().toISOString(),
              status: newStatus,
              health_check_error: health.message,
            })
            .eq('id', conn.id);

          recordMetric('connector.health_check', 1, {
            platform: platform.platform_name,
            status: health.status,
            latency_ms: health.latencyMs,
          });
        } catch (checkError) {
          logger.error(
            {
              connectionId: conn.id,
              error: checkError instanceof Error ? checkError.message : String(checkError),
            },
            'Health check failed'
          );

          // Mark as unhealthy
          await this.supabase
            .from('connections')
            .update({
              health_status: 'critical',
              status: 'attention',
              health_check_error: checkError instanceof Error ? checkError.message : String(checkError),
              last_health_check: new Date().toISOString(),
            })
            .eq('id', conn.id);
        }
      }
    } catch (error) {
      logger.error(
        {
          tenantId: this.tenantId,
          error: error instanceof Error ? error.message : String(error),
        },
        'Failed to run health checks'
      );
    }
  }

  /**
   * Classify error for retry determination
   */
  classifyError(error: Error | string, status?: number): {
    code: string;
    isRetryable: boolean;
    message: string;
  } {
    const errorStr = error instanceof Error ? error.message : String(error);
    const statusCode = status || this.extractStatusCode(errorStr);

    let code = 'UNKNOWN_ERROR';
    let isRetryable = false;

    if (statusCode === 429) {
      code = 'RATE_LIMIT_EXCEEDED';
      isRetryable = true;
    } else if (statusCode >= 500) {
      code = 'SERVER_ERROR';
      isRetryable = true;
    } else if (statusCode === 408) {
      code = 'TIMEOUT';
      isRetryable = true;
    } else if (statusCode === 401) {
      code = 'AUTH_FAILED';
      isRetryable = false;
    } else if (statusCode === 403) {
      code = 'PERMISSION_DENIED';
      isRetryable = false;
    } else if (statusCode === 400 || statusCode === 404) {
      code = 'VALIDATION_ERROR';
      isRetryable = false;
    }

    return {
      code,
      isRetryable,
      message: errorStr,
    };
  }

  /**
   * Extract HTTP status code from error message
   */
  private extractStatusCode(errorStr: string): number {
    const match = errorStr.match(/(\d{3})/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Get connector status summary
   */
  async getConnectorStatus(): Promise<{
    platform: string;
    healthyCount: number;
    warningCount: number;
    criticalCount: number;
  }[]> {
    try {
      const { data: statuses, error } = await this.supabase
        .from('connections')
        .select('platform_id, health_status')
        .eq('tenant_id', this.tenantId);

      if (error) {
        throw error;
      }

      // Group by platform
      const platforms: Map<string, { healthy: number; warning: number; critical: number }> = new Map();

      for (const status of statuses || []) {
        const { data: platform } = await this.supabase
          .from('connector_platforms')
          .select('platform_name')
          .eq('id', status.platform_id)
          .single();

        if (!platform) continue;

        if (!platforms.has(platform.platform_name)) {
          platforms.set(platform.platform_name, { healthy: 0, warning: 0, critical: 0 });
        }

        const counts = platforms.get(platform.platform_name)!;
        if (status.health_status === 'healthy') {
          counts.healthy++;
        } else if (status.health_status === 'warning') {
          counts.warning++;
        } else {
          counts.critical++;
        }
      }

      // Return summary
      return Array.from(platforms.entries()).map(([platform, counts]) => ({
        platform,
        healthyCount: counts.healthy,
        warningCount: counts.warning,
        criticalCount: counts.critical,
      }));
    } catch (error) {
      logger.error(
        {
          tenantId: this.tenantId,
          error: error instanceof Error ? error.message : String(error),
        },
        'Failed to get connector status'
      );
      return [];
    }
  }
}

export default ConnectorManager;
