/**
 * Feature Flags - Gradual Rollout Control
 *
 * Manages feature flags for gradual rollout of integrations
 * Flag state stored in Supabase feature_flags table
 *
 * Supported Flags:
 * - integration_meta: Meta/Facebook/Instagram connector
 * - integration_linkedin: LinkedIn connector
 * - integration_tiktok: TikTok connector
 * - integration_gbp: Google Business Profile connector
 * - integration_mailchimp: Mailchimp email connector
 *
 * Usage:
 * import { featureFlags } from './feature-flags';
 *
 * if (await featureFlags.isEnabled('integration_meta', tenantId)) {
 *   // Show Meta integration UI
 * }
 */

import { createClient } from '@supabase/supabase-js';
import { logger } from './logger';

export const AVAILABLE_FLAGS = {
  // Connector integrations
  INTEGRATION_META: 'integration_meta',
  INTEGRATION_LINKEDIN: 'integration_linkedin',
  INTEGRATION_TIKTOK: 'integration_tiktok',
  INTEGRATION_GBP: 'integration_gbp',
  INTEGRATION_MAILCHIMP: 'integration_mailchimp',

  // Features
  ADVANCED_ANALYTICS: 'advanced_analytics',
  CUSTOM_SCHEDULING: 'custom_scheduling',
  WEBHOOK_EVENTS: 'webhook_events',
  BULK_PUBLISHING: 'bulk_publishing',
};

interface FlagConfig {
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number; // 0-100
}

const FLAG_DEFAULTS: Record<string, FlagConfig> = {
  [AVAILABLE_FLAGS.INTEGRATION_META]: {
    name: 'Meta Integration',
    description: 'Facebook, Instagram, Messenger publishing',
    enabled: true,
    rolloutPercentage: 100,
  },
  [AVAILABLE_FLAGS.INTEGRATION_LINKEDIN]: {
    name: 'LinkedIn Integration',
    description: 'LinkedIn profile and company publishing',
    enabled: true,
    rolloutPercentage: 100,
  },
  [AVAILABLE_FLAGS.INTEGRATION_TIKTOK]: {
    name: 'TikTok Integration',
    description: 'TikTok video publishing',
    enabled: true,
    rolloutPercentage: 100,
  },
  [AVAILABLE_FLAGS.INTEGRATION_GBP]: {
    name: 'Google Business Profile',
    description: 'Google Business Profile posting',
    enabled: true,
    rolloutPercentage: 100,
  },
  [AVAILABLE_FLAGS.INTEGRATION_MAILCHIMP]: {
    name: 'Mailchimp Integration',
    description: 'Email campaign management',
    enabled: true,
    rolloutPercentage: 100,
  },
  [AVAILABLE_FLAGS.ADVANCED_ANALYTICS]: {
    name: 'Advanced Analytics',
    description: 'Detailed performance metrics and insights',
    enabled: false,
    rolloutPercentage: 50,
  },
  [AVAILABLE_FLAGS.CUSTOM_SCHEDULING]: {
    name: 'Custom Scheduling',
    description: 'Schedule posts for future times',
    enabled: true,
    rolloutPercentage: 100,
  },
  [AVAILABLE_FLAGS.WEBHOOK_EVENTS]: {
    name: 'Webhook Events',
    description: 'Real-time webhook event processing',
    enabled: true,
    rolloutPercentage: 100,
  },
  [AVAILABLE_FLAGS.BULK_PUBLISHING]: {
    name: 'Bulk Publishing',
    description: 'Publish to multiple platforms at once',
    enabled: false,
    rolloutPercentage: 25,
  },
};

export class FeatureFlagsManager {
  private supabase: any;
  private cache: Map<string, FlagConfig> = new Map();
  private cacheExpiresAt: number = 0;
  private readonly CACHE_TTL_MS = 60000; // 1 minute

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Check if a feature flag is enabled for a specific tenant
   * Takes into account rollout percentage
   */
  async isEnabled(flagName: string, tenantId: string): Promise<boolean> {
    try {
      // Get flag config
      const flagConfig = await this.getFlag(flagName);

      if (!flagConfig.enabled) {
        return false;
      }

      // Check rollout percentage
      if (flagConfig.rolloutPercentage < 100) {
        const hash = await this.hashTenantId(tenantId);
        const percentage = hash % 100;
        return percentage < flagConfig.rolloutPercentage;
      }

      return true;
    } catch (error) {
      logger.error(
        'Error checking feature flag, defaulting to false',
        error instanceof Error ? error : undefined,
        {
          flagName,
          tenantId,
          error: error instanceof Error ? error.message : String(error),
        }
      );
      return false;
    }
  }

  /**
   * Get all available flags for a tenant
   */
  async getAllFlags(tenantId: string): Promise<Record<string, boolean>> {
    const flags: Record<string, boolean> = {};

    for (const flagName of Object.values(AVAILABLE_FLAGS)) {
      flags[flagName] = await this.isEnabled(flagName, tenantId);
    }

    return flags;
  }

  /**
   * Get flag config from database or cache
   */
  private async getFlag(flagName: string): Promise<FlagConfig> {
    // Check cache first
    if (this.cache.has(flagName) && Date.now() < this.cacheExpiresAt) {
      return this.cache.get(flagName)!;
    }

    // Reload all flags from database
    await this.loadFlagsFromDatabase();

    // Return from cache or default
    return this.cache.get(flagName) || FLAG_DEFAULTS[flagName] || FLAG_DEFAULTS[AVAILABLE_FLAGS.INTEGRATION_META];
  }

  /**
   * Load all flags from Supabase
   */
  private async loadFlagsFromDatabase(): Promise<void> {
    try {
      const { data, error } = await this.supabase
        .from('feature_flags')
        .select('flag_name, is_enabled, rollout_percentage, description')
        .not('flag_name', 'is', null);

      if (error) {
        logger.warn(
          'Failed to load feature flags from database, using defaults',
          { error: error.message }
        );
        // Use defaults
        this.cache.clear();
        Object.entries(FLAG_DEFAULTS).forEach(([name, config]) => {
          this.cache.set(name, config);
        });
      } else if (data) {
        this.cache.clear();
        data.forEach((row: any) => {
          this.cache.set(row.flag_name, {
            name: row.flag_name,
            description: row.description || '',
            enabled: row.is_enabled ?? FLAG_DEFAULTS[row.flag_name]?.enabled ?? false,
            rolloutPercentage: row.rollout_percentage ?? FLAG_DEFAULTS[row.flag_name]?.rolloutPercentage ?? 0,
          });
        });

        logger.info('Feature flags loaded from database', { flagCount: this.cache.size });
      }

      // Update cache expiry
      this.cacheExpiresAt = Date.now() + this.CACHE_TTL_MS;
    } catch (error) {
      logger.error(
        'Error loading feature flags',
        error instanceof Error ? error : undefined,
        { error: error instanceof Error ? error.message : String(error) }
      );
      // Fall back to defaults
      this.cache.clear();
      Object.entries(FLAG_DEFAULTS).forEach(([name, config]) => {
        this.cache.set(name, config);
      });
    }
  }

  /**
   * Hash tenant ID for deterministic rollout percentage
   */
  private async hashTenantId(tenantId: string): Promise<number> {
    const encoder = new TextEncoder();
    const data = encoder.encode(tenantId);

    // Simple hash function using crypto.subtle
    try {
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return parseInt(hashHex.substring(0, 2), 16);
    } catch (error) {
      // Fallback simple hash
      let hash = 0;
      for (let i = 0; i < tenantId.length; i++) {
        hash = (hash << 5) - hash + tenantId.charCodeAt(i);
        hash = hash & hash; // Convert to 32bit integer
      }
      return Math.abs(hash) % 100;
    }
  }

  /**
   * Update a flag's enabled status
   */
  async setFlagEnabled(flagName: string, enabled: boolean): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('feature_flags')
        .update({ is_enabled: enabled, updated_at: new Date().toISOString() })
        .eq('flag_name', flagName);

      if (error) {
        throw error;
      }

      // Invalidate cache
      this.cacheExpiresAt = 0;

      logger.info(
        enabled ? 'Feature flag enabled' : 'Feature flag disabled',
        { flagName, enabled }
      );
    } catch (error) {
      logger.error(
        'Failed to update feature flag',
        error instanceof Error ? error : undefined,
        {
          flagName,
          error: error instanceof Error ? error.message : String(error),
        }
      );
      throw error;
    }
  }

  /**
   * Update rollout percentage for a flag
   */
  async setRolloutPercentage(flagName: string, percentage: number): Promise<void> {
    if (percentage < 0 || percentage > 100) {
      throw new Error('Rollout percentage must be between 0 and 100');
    }

    try {
      const { error } = await this.supabase
        .from('feature_flags')
        .update({ rollout_percentage: percentage, updated_at: new Date().toISOString() })
        .eq('flag_name', flagName);

      if (error) {
        throw error;
      }

      // Invalidate cache
      this.cacheExpiresAt = 0;

      logger.info(
        'Rollout percentage updated',
        { flagName, percentage }
      );
    } catch (error) {
      logger.error(
        'Failed to update rollout percentage',
        error instanceof Error ? error : undefined,
        {
          flagName,
          percentage,
          error: error instanceof Error ? error.message : String(error),
        }
      );
      throw error;
    }
  }

  /**
   * Create or update multiple flags at once
   */
  async seedFlags(): Promise<void> {
    try {
      for (const [flagName, config] of Object.entries(FLAG_DEFAULTS)) {
        const { data: existing } = await this.supabase
          .from('feature_flags')
          .select('id')
          .eq('flag_name', flagName)
          .single();

        if (!existing) {
          // Create new flag
          await this.supabase.from('feature_flags').insert({
            flag_name: flagName,
            description: config.description,
            is_enabled: config.enabled,
            rollout_percentage: config.rolloutPercentage,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

          logger.info('Feature flag seeded', { flagName });
        }
      }

      // Invalidate cache
      this.cacheExpiresAt = 0;
    } catch (error) {
      logger.error(
        'Failed to seed feature flags',
        error instanceof Error ? error : undefined,
        { error: error instanceof Error ? error.message : String(error) }
      );
    }
  }
}

// Singleton instance
let featureFlagsInstance: FeatureFlagsManager | null = null;

export async function initializeFeatureFlags(supabaseUrl: string, supabaseKey: string): Promise<FeatureFlagsManager> {
  if (!featureFlagsInstance) {
    featureFlagsInstance = new FeatureFlagsManager(supabaseUrl, supabaseKey);
    await featureFlagsInstance.seedFlags();
  }
  return featureFlagsInstance;
}

export function getFeatureFlagsManager(): FeatureFlagsManager {
  if (!featureFlagsInstance) {
    throw new Error('Feature flags not initialized. Call initializeFeatureFlags first.');
  }
  return featureFlagsInstance;
}

export default {
  initializeFeatureFlags,
  getFeatureFlagsManager,
  AVAILABLE_FLAGS,
};
