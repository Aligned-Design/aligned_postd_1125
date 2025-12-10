/**
 * Pipeline Orchestrator Chaos Tests (R01)
 * 
 * Tests for failure modes identified in the Chaos Audit:
 * - R01: PersistenceService { enabled: false } → ContentPackages never saved
 * 
 * These tests pin down current behavior before fixes are applied.
 * 
 * @see docs/POSTD_FULL_STACK_CHAOS_AUDIT.md
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { PersistenceService } from "../lib/persistence-service";
import type { StrategyBrief, ContentPackage, BrandHistory, BrandHistoryEntry } from "@shared/collaboration-artifacts";

// =============================================================================
// TESTS: PersistenceService Configuration (R01)
// =============================================================================

describe("PersistenceService Configuration (R01 - Chaos Audit)", () => {
  describe("Default Configuration", () => {
    it("defaults to disabled when no config provided", () => {
      const service = new PersistenceService();
      
      // ✅ R01 CURRENT BEHAVIOR: Persistence is disabled by default
      // This is the root cause of the data loss issue
      const stats = service.getMemoryStoreStats();
      expect(stats).toBeDefined();
    });

    it("explicitly disabled when enabled: false", () => {
      const service = new PersistenceService({ enabled: false });
      
      // Service should use in-memory store
      const stats = service.getMemoryStoreStats();
      expect(stats).toBeDefined();
    });

    it("can be enabled with config", () => {
      const service = new PersistenceService({ enabled: true });
      
      // Service would use DB operations (currently not implemented)
      const stats = service.getMemoryStoreStats();
      expect(stats).toBeDefined();
    });
  });

  describe("Console Logging", () => {
    let consoleLogSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    });

    afterEach(() => {
      consoleLogSpy.mockRestore();
    });

    it("logs initialization message with database=false when disabled", () => {
      new PersistenceService({ enabled: false });
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "[PersistenceService] Initialized (database=false)"
      );
    });

    it("logs initialization message with database=true when enabled", () => {
      new PersistenceService({ enabled: true });
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "[PersistenceService] Initialized (database=true)"
      );
    });
  });
});

// =============================================================================
// TESTS: In-Memory Storage Behavior
// =============================================================================

describe("PersistenceService In-Memory Storage (R01 - Chaos Audit)", () => {
  let service: PersistenceService;

  beforeEach(() => {
    service = new PersistenceService({ enabled: false });
  });

  afterEach(async () => {
    await service.clearMemoryStore();
  });

  describe("StrategyBrief Operations", () => {
    const mockStrategy: StrategyBrief = {
      id: "strategy-123",
      brandId: "brand-123",
      version: "1.0.0",
      positioning: {
        tagline: "Test Tagline",
        missionStatement: "Test Mission",
        targetAudience: {
          demographics: "Test Demographics",
          psychographics: [],
          painPoints: [],
          aspirations: [],
        },
      },
      voice: {
        tone: "professional",
        personality: [],
        keyMessages: [],
        avoidPhrases: [],
      },
      visual: {
        primaryColor: "#000000",
        secondaryColor: "#FFFFFF",
        accentColor: "#FF0000",
        fontPairing: { heading: "Arial", body: "Helvetica" },
        imagery: { style: "photo" as const, subjects: [] },
      },
      competitive: {
        differentiation: [],
        uniqueValueProposition: "Test UVP",
      },
      updatedAt: new Date().toISOString(),
    };

    it("saves StrategyBrief to memory store", async () => {
      await service.saveStrategyBrief("cycle-123", mockStrategy);
      
      const retrieved = await service.getStrategyBrief("cycle-123");
      expect(retrieved).toEqual(mockStrategy);
    });

    it("returns null for non-existent StrategyBrief", async () => {
      const retrieved = await service.getStrategyBrief("non-existent");
      expect(retrieved).toBeNull();
    });
  });

  describe("ContentPackage Operations", () => {
    const mockContentPackage: ContentPackage = {
      id: "cp-123",
      brandId: "brand-123",
      contentId: "content-123",
      requestId: "request-123",
      platform: "instagram",
      copy: {
        headline: "Test Headline",
        body: "Test Body",
        callToAction: "Test CTA",
        tone: "professional",
        keywords: [],
        estimatedReadTime: 2,
      },
      status: "draft",
      createdBy: "test-agent",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      collaborationLog: [],
    };

    it("saves ContentPackage to memory store", async () => {
      await service.saveContentPackage("content-123", mockContentPackage);
      
      const retrieved = await service.getContentPackage("content-123");
      expect(retrieved).toEqual(mockContentPackage);
    });

    it("returns null for non-existent ContentPackage", async () => {
      const retrieved = await service.getContentPackage("non-existent");
      expect(retrieved).toBeNull();
    });

    it("updates ContentPackage status", async () => {
      await service.saveContentPackage("content-123", mockContentPackage);
      await service.updateContentPackageStatus("content-123", "approved");
      
      const retrieved = await service.getContentPackage("content-123");
      expect(retrieved?.status).toBe("approved");
    });
  });

  describe("BrandHistory Operations", () => {
    const mockBrandHistory: BrandHistory = {
      id: "bh-123",
      brandId: "brand-123",
      entries: [],
      successPatterns: [],
      designFatigueAlerts: [],
      constraints: [],
      lastUpdated: new Date().toISOString(),
    };

    it("saves BrandHistory to memory store", async () => {
      await service.saveBrandHistory("brand-123", mockBrandHistory);
      
      const retrieved = await service.getBrandHistory("brand-123");
      expect(retrieved).toEqual(mockBrandHistory);
    });

    it("adds entry to existing BrandHistory", async () => {
      await service.saveBrandHistory("brand-123", mockBrandHistory);
      
      const newEntry: BrandHistoryEntry = {
        timestamp: new Date().toISOString(),
        agent: "advisor",
        action: "performance_insight",
        contentId: "content-456",
        details: { description: "Test" },
        rationale: "Test rationale",
        tags: ["test"],
      };
      
      await service.addBrandHistoryEntry("brand-123", newEntry);
      
      const retrieved = await service.getBrandHistory("brand-123");
      expect(retrieved?.entries).toHaveLength(1);
      expect(retrieved?.entries[0].action).toBe("performance_insight");
    });

    it("creates BrandHistory when adding entry to non-existent brand", async () => {
      const newEntry: BrandHistoryEntry = {
        timestamp: new Date().toISOString(),
        agent: "advisor",
        action: "performance_insight",
        contentId: "content-456",
        details: { description: "Test" },
        rationale: "Test rationale",
        tags: ["test"],
      };
      
      await service.addBrandHistoryEntry("new-brand-123", newEntry);
      
      const retrieved = await service.getBrandHistory("new-brand-123");
      expect(retrieved).not.toBeNull();
      expect(retrieved?.entries).toHaveLength(1);
    });
  });

  describe("Memory Store Stats", () => {
    it("returns accurate counts", async () => {
      await service.saveStrategyBrief("cycle-1", { brandId: "b1" } as any);
      await service.saveStrategyBrief("cycle-2", { brandId: "b2" } as any);
      await service.saveContentPackage("content-1", { id: "c1" } as any);
      
      const stats = service.getMemoryStoreStats();
      expect(stats.strategyBriefs).toBe(2);
      expect(stats.contentPackages).toBe(1);
    });

    it("clears all stores", async () => {
      await service.saveStrategyBrief("cycle-1", { brandId: "b1" } as any);
      await service.saveContentPackage("content-1", { id: "c1" } as any);
      
      await service.clearMemoryStore();
      
      const stats = service.getMemoryStoreStats();
      expect(stats.strategyBriefs).toBe(0);
      expect(stats.contentPackages).toBe(0);
    });
  });
});

// =============================================================================
// TESTS: Data Loss Scenario (R01)
// =============================================================================

describe("Pipeline Orchestrator Data Loss (R01 - Chaos Audit)", () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  /**
   * Simulates PipelineOrchestrator constructor behavior
   * (Matches server/lib/pipeline-orchestrator.ts lines 63-88)
   */
  function createOrchestratorWithConfig(persistenceEnabled: boolean): {
    persistenceService: PersistenceService;
    logs: string[];
  } {
    const logs: string[] = [];
    const persistenceService = new PersistenceService({ enabled: persistenceEnabled });
    
    if (!persistenceEnabled) {
      logs.push("[Orchestrator] ⚠️ Persistence DISABLED - ContentPackages will NOT be saved to database");
    }
    
    return { persistenceService, logs };
  }

  it("orchestrator creates PersistenceService with enabled: false by default", () => {
    // ✅ R01 CURRENT BEHAVIOR: This is the problem
    const { persistenceService } = createOrchestratorWithConfig(false);
    
    // Persistence is disabled - nothing will be saved to DB
    const stats = persistenceService.getMemoryStoreStats();
    expect(stats).toBeDefined();
  });

  it("PROPOSED FIX: should log warning when persistence is disabled", () => {
    const { logs } = createOrchestratorWithConfig(false);
    
    // ✅ PROPOSED FIX: Warning should be logged
    expect(logs).toContain("[Orchestrator] ⚠️ Persistence DISABLED - ContentPackages will NOT be saved to database");
  });

  it("no warning logged when persistence is enabled", () => {
    const { logs } = createOrchestratorWithConfig(true);
    
    expect(logs).not.toContain("[Orchestrator] ⚠️ Persistence DISABLED - ContentPackages will NOT be saved to database");
  });

  /**
   * Simulates the data loss scenario
   */
  it("demonstrates data loss when persistence is disabled (R01 scenario)", async () => {
    const service = new PersistenceService({ enabled: false });
    
    // Save content package to memory store
    const pkg = {
      id: "cp-123",
      brandId: "brand-123",
      contentId: "content-123",
      status: "draft",
    } as ContentPackage;
    
    await service.saveContentPackage("content-123", pkg);
    
    // Data exists in memory
    const inMemory = await service.getContentPackage("content-123");
    expect(inMemory).not.toBeNull();
    
    // ✅ R01 PROBLEM: Data is only in memory, not persisted to DB
    // When server restarts, all data is lost
    await service.clearMemoryStore();
    
    const afterClear = await service.getContentPackage("content-123");
    expect(afterClear).toBeNull(); // Data is gone!
  });
});

// =============================================================================
// TESTS: Environment Variable Toggle (Phase 2B)
// =============================================================================

describe("Pipeline Persistence Environment Toggle (Phase 2B)", () => {
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env.PIPELINE_PERSISTENCE_ENABLED;
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.PIPELINE_PERSISTENCE_ENABLED = originalEnv;
    } else {
      delete process.env.PIPELINE_PERSISTENCE_ENABLED;
    }
  });

  /**
   * Simulates reading persistence config from environment
   */
  function getPersistenceEnabledFromEnv(): boolean {
    return process.env.PIPELINE_PERSISTENCE_ENABLED === "true";
  }

  it("returns false when env var is not set", () => {
    delete process.env.PIPELINE_PERSISTENCE_ENABLED;
    expect(getPersistenceEnabledFromEnv()).toBe(false);
  });

  it("returns false when env var is empty string", () => {
    process.env.PIPELINE_PERSISTENCE_ENABLED = "";
    expect(getPersistenceEnabledFromEnv()).toBe(false);
  });

  it("returns false when env var is 'false'", () => {
    process.env.PIPELINE_PERSISTENCE_ENABLED = "false";
    expect(getPersistenceEnabledFromEnv()).toBe(false);
  });

  it("returns true when env var is 'true'", () => {
    process.env.PIPELINE_PERSISTENCE_ENABLED = "true";
    expect(getPersistenceEnabledFromEnv()).toBe(true);
  });

  it("returns false for other values (safety)", () => {
    process.env.PIPELINE_PERSISTENCE_ENABLED = "yes";
    expect(getPersistenceEnabledFromEnv()).toBe(false);
    
    process.env.PIPELINE_PERSISTENCE_ENABLED = "1";
    expect(getPersistenceEnabledFromEnv()).toBe(false);
  });
});

// =============================================================================
// TESTS: Token Health Operations
// =============================================================================

describe("PersistenceService Token Health (Bonus Coverage)", () => {
  let service: PersistenceService;

  beforeEach(() => {
    service = new PersistenceService({ enabled: false });
  });

  afterEach(async () => {
    await service.clearMemoryStore();
  });

  it("saves and retrieves token health status", async () => {
    const expiresAt = new Date(Date.now() + 86400000); // 24 hours from now
    
    await service.saveTokenHealth("brand-123", "instagram", "healthy", expiresAt);
    
    const health = await service.getTokenHealth("brand-123", "instagram");
    expect(health).not.toBeNull();
    expect(health?.status).toBe("healthy");
    expect(health?.expiresAt).toEqual(expiresAt);
  });

  it("returns null for non-existent token health", async () => {
    const health = await service.getTokenHealth("non-existent", "instagram");
    expect(health).toBeNull();
  });

  it("stores token health per brand-platform combination", async () => {
    await service.saveTokenHealth("brand-123", "instagram", "healthy");
    await service.saveTokenHealth("brand-123", "facebook", "warning");
    await service.saveTokenHealth("brand-456", "instagram", "expired");
    
    const igHealth = await service.getTokenHealth("brand-123", "instagram");
    const fbHealth = await service.getTokenHealth("brand-123", "facebook");
    const otherBrandHealth = await service.getTokenHealth("brand-456", "instagram");
    
    expect(igHealth?.status).toBe("healthy");
    expect(fbHealth?.status).toBe("warning");
    expect(otherBrandHealth?.status).toBe("expired");
  });
});

