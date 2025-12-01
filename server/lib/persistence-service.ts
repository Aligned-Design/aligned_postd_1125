/**
 * Persistence Service
 *
 * Handles all database operations for orchestration artifacts:
 * - StrategyBrief
 * - ContentPackage
 * - BrandHistory
 * - PerformanceLog
 * - Collaboration events
 */

import type {
  StrategyBrief,
  ContentPackage,
  BrandHistory,
  BrandHistoryEntry,
  PerformanceLog,
} from "./collaboration-artifacts";

export interface PersistenceConfig {
  enabled: boolean; // Can toggle between DB and in-memory
  dbUrl?: string;
}

// In-memory store as fallback (will be replaced by DB calls in production)
const memoryStore = {
  strategyBriefs: new Map<string, StrategyBrief>(),
  contentPackages: new Map<string, ContentPackage>(),
  brandHistory: new Map<string, BrandHistory>(),
  performanceLogs: new Map<string, PerformanceLog>(),
  collaborationLogs: new Map<string, any[]>(),
  tokenHealth: new Map<string, {status: string; expiresAt?: Date}>(),
};

export class PersistenceService {
  private enabled: boolean;

  constructor(config: PersistenceConfig = { enabled: false }) {
    this.enabled = config.enabled;
    console.log(`[PersistenceService] Initialized (database=${this.enabled})`);
  }

  // ============================================================
  // STRATEGY BRIEF OPERATIONS
  // ============================================================

  async saveStrategyBrief(
    cycleId: string,
    strategy: StrategyBrief
  ): Promise<void> {
    try {
      if (this.enabled) {
        // Future work: Replace with actual DB insert
        // await supabase.from('strategy_briefs').insert({...})
      }

      // Fallback to memory
      memoryStore.strategyBriefs.set(cycleId, strategy);
      console.log(`[Persistence] Saved StrategyBrief for cycle ${cycleId}`);
    } catch (error) {
      console.error(`[Persistence] Failed to save StrategyBrief:`, error);
      throw error;
    }
  }

  async getStrategyBrief(cycleId: string): Promise<StrategyBrief | null> {
    try {
      if (this.enabled) {
        // Future work: Replace with actual DB query
        // const { data } = await supabase.from('strategy_briefs').select().eq('cycle_id', cycleId)
      }

      return memoryStore.strategyBriefs.get(cycleId) || null;
    } catch (error) {
      console.error(`[Persistence] Failed to retrieve StrategyBrief:`, error);
      return null;
    }
  }

  // ============================================================
  // CONTENT PACKAGE OPERATIONS
  // ============================================================

  async saveContentPackage(
    contentId: string,
    pkg: ContentPackage
  ): Promise<void> {
    try {
      if (this.enabled) {
        // Future work: DB insert
      }

      memoryStore.contentPackages.set(contentId, pkg);
      console.log(`[Persistence] Saved ContentPackage ${contentId}`);
    } catch (error) {
      console.error(`[Persistence] Failed to save ContentPackage:`, error);
      throw error;
    }
  }

  async getContentPackage(contentId: string): Promise<ContentPackage | null> {
    try {
      if (this.enabled) {
        // Future work: DB query
      }

      return memoryStore.contentPackages.get(contentId) || null;
    } catch (error) {
      console.error(`[Persistence] Failed to retrieve ContentPackage:`, error);
      return null;
    }
  }

  async updateContentPackageStatus(
    contentId: string,
    status: "draft" | "in_review" | "approved" | "published"
  ): Promise<void> {
    try {
      const pkg = memoryStore.contentPackages.get(contentId);
      if (pkg) {
        pkg.status = status;
        pkg.updatedAt = new Date().toISOString();
        if (status === "published") {
          // Note: publishedAt would need to be added to ContentPackage type in production
        }

        if (this.enabled) {
          // Future work: DB update
        }

        memoryStore.contentPackages.set(contentId, pkg);
        console.log(`[Persistence] Updated ContentPackage ${contentId} status to ${status}`);
      }
    } catch (error) {
      console.error(`[Persistence] Failed to update ContentPackage status:`, error);
      throw error;
    }
  }

  // ============================================================
  // BRAND HISTORY OPERATIONS
  // ============================================================

  async saveBrandHistory(
    brandId: string,
    history: BrandHistory
  ): Promise<void> {
    try {
      if (this.enabled) {
        // Future work: DB operations - insert entries and patterns separately
      }

      // Ensure all required fields
      const completeHistory: BrandHistory = {
        id: history.id || `bh_${Date.now()}`,
        brandId: history.brandId || brandId,
        entries: history.entries || [],
        successPatterns: history.successPatterns || [],
        designFatigueAlerts: history.designFatigueAlerts || [],
        constraints: history.constraints || [],
        lastUpdated: history.lastUpdated || new Date().toISOString(),
      };

      memoryStore.brandHistory.set(brandId, completeHistory);
      console.log(`[Persistence] Saved BrandHistory for brand ${brandId}`);
    } catch (error) {
      console.error(`[Persistence] Failed to save BrandHistory:`, error);
      throw error;
    }
  }

  async addBrandHistoryEntry(
    brandId: string,
    entry: BrandHistoryEntry
  ): Promise<void> {
    try {
      let history = memoryStore.brandHistory.get(brandId);
      if (!history) {
        history = {
          id: `bh_${Date.now()}`,
          brandId,
          entries: [],
          successPatterns: [],
          designFatigueAlerts: [],
          constraints: [],
          lastUpdated: new Date().toISOString(),
        };
      }

      history.entries.unshift(entry);
      history.lastUpdated = new Date().toISOString();

      if (this.enabled) {
        // Future work: DB insert into brand_history table
      }

      memoryStore.brandHistory.set(brandId, history);
      console.log(`[Persistence] Added BrandHistory entry for brand ${brandId}`);
    } catch (error) {
      console.error(`[Persistence] Failed to add BrandHistory entry:`, error);
      throw error;
    }
  }

  async getBrandHistory(brandId: string): Promise<BrandHistory | null> {
    try {
      if (this.enabled) {
        // Future work: DB query
      }

      return memoryStore.brandHistory.get(brandId) || null;
    } catch (error) {
      console.error(`[Persistence] Failed to retrieve BrandHistory:`, error);
      return null;
    }
  }

  // ============================================================
  // PERFORMANCE LOG OPERATIONS
  // ============================================================

  async savePerformanceLog(
    brandId: string,
    log: PerformanceLog
  ): Promise<void> {
    try {
      if (this.enabled) {
        // Future work: DB insert
      }

      memoryStore.performanceLogs.set(brandId, log);
      console.log(`[Persistence] Saved PerformanceLog for brand ${brandId}`);
    } catch (error) {
      console.error(`[Persistence] Failed to save PerformanceLog:`, error);
      throw error;
    }
  }

  async addPerformanceMetric(
    brandId: string,
    contentId: string,
    metric: any
  ): Promise<void> {
    try {
      let log = memoryStore.performanceLogs.get(brandId);
      if (!log) {
        log = {
          id: `pl_${Date.now()}`,
          brandId,
          period: {
            start: new Date().toISOString(),
            end: new Date().toISOString(),
          },
          summary: {
            totalContent: 0,
            avgEngagement: 0,
            topPerformingMetric: "",
            bottomPerformingMetric: "",
          },
          contentPerformance: [],
          visualPerformance: [],
          copyPerformance: [],
          platformInsights: [],
          patterns: [],
          recommendations: {
            visualRecommendations: [],
            copyRecommendations: [],
            platformRecommendations: [],
          },
          alerts: [],
          lastUpdated: new Date().toISOString(),
        };
      }

      // Note: In production, we'd properly structure the metric
      // For now, just track that a metric was added
      log.lastUpdated = new Date().toISOString();

      if (this.enabled) {
        // Future work: DB insert into performance_logs
      }

      memoryStore.performanceLogs.set(brandId, log);
      console.log(`[Persistence] Added performance metric for brand ${brandId}`);
    } catch (error) {
      console.error(`[Persistence] Failed to add performance metric:`, error);
      throw error;
    }
  }

  // ============================================================
  // COLLABORATION LOG OPERATIONS
  // ============================================================

  async addCollaborationEvent(
    cycleId: string,
    requestId: string,
    brandId: string,
    event: any
  ): Promise<void> {
    try {
      const eventWithMetadata = {
        ...event,
        cycle_id: cycleId,
        request_id: requestId,
        brand_id: brandId,
        created_at: new Date().toISOString(),
      };

      if (this.enabled) {
        // Future work: DB insert into collaboration_logs
      }

      const key = `${cycleId}:events`;
      const events = memoryStore.collaborationLogs.get(key) || [];
      events.push(eventWithMetadata);
      memoryStore.collaborationLogs.set(key, events);
    } catch (error) {
      console.error(`[Persistence] Failed to add collaboration event:`, error);
      throw error;
    }
  }

  async getCollaborationLog(cycleId: string): Promise<any[]> {
    try {
      if (this.enabled) {
        // Future work: DB query
      }

      const key = `${cycleId}:events`;
      return memoryStore.collaborationLogs.get(key) || [];
    } catch (error) {
      console.error(`[Persistence] Failed to retrieve collaboration log:`, error);
      return [];
    }
  }

  // ============================================================
  // TOKEN HEALTH OPERATIONS
  // ============================================================

  async saveTokenHealth(
    brandId: string,
    platform: string,
    status: "healthy" | "warning" | "expired",
    expiresAt?: Date
  ): Promise<void> {
    try {
      const key = `${brandId}:${platform}`;

      if (this.enabled) {
        // Future work: DB upsert into token_health
      }

      memoryStore.tokenHealth.set(key, {
        status,
        expiresAt,
      });
      console.log(
        `[Persistence] Updated token health for ${brandId}/${platform}: ${status}`
      );
    } catch (error) {
      console.error(`[Persistence] Failed to save token health:`, error);
      throw error;
    }
  }

  async getTokenHealth(
    brandId: string,
    platform: string
  ): Promise<{status: string; expiresAt?: Date} | null> {
    try {
      if (this.enabled) {
        // Future work: DB query
      }

      const key = `${brandId}:${platform}`;
      return memoryStore.tokenHealth.get(key) || null;
    } catch (error) {
      console.error(`[Persistence] Failed to retrieve token health:`, error);
      return null;
    }
  }

  // ============================================================
  // UTILITY OPERATIONS
  // ============================================================

  async clearMemoryStore(): Promise<void> {
    memoryStore.strategyBriefs.clear();
    memoryStore.contentPackages.clear();
    memoryStore.brandHistory.clear();
    memoryStore.performanceLogs.clear();
    memoryStore.collaborationLogs.clear();
    memoryStore.tokenHealth.clear();
    console.log("[Persistence] Memory store cleared");
  }

  getMemoryStoreStats(): any {
    return {
      strategyBriefs: memoryStore.strategyBriefs.size,
      contentPackages: memoryStore.contentPackages.size,
      brandHistory: memoryStore.brandHistory.size,
      performanceLogs: memoryStore.performanceLogs.size,
      collaborationLogs: memoryStore.collaborationLogs.size,
      tokenHealth: memoryStore.tokenHealth.size,
    };
  }
}

// Global persistence service instance
export const persistenceService = new PersistenceService({ enabled: false });
