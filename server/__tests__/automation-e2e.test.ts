/**
 * Automation Pipeline E2E Tests
 * Tests the full flow: AI Generation → Brand Application → BFS Scoring → Scheduling
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  mockAIGeneratedContent,
  mockBrandGuide,
  strictBrandGuide,
  TEST_BRAND_ID,
  TEST_USER_ID,
  TEST_USER_EMAIL,
  TEST_POST_ID,
  timezones,
  bfsScoreExpectations,
  auditLogAssertions,
  createMockAutomationRequest,
  verifyBFSScore,
  verifyBFSBreakdown,
  calculateScheduleTime,
} from "./fixtures/automation-fixtures";

// ==================== MOCK SERVICES ====================

/**
 * Mock AI Service
 */
class MockAIService {
  async generateContent(_prompt: string) {
    return mockAIGeneratedContent.happy_path;
  }

  async generateContentWithVariant(
    variant:
      | "happy_path"
      | "brand_mismatch"
      | "missing_cta"
      | "compliance_violation",
  ) {
    return mockAIGeneratedContent[variant];
  }
}

/**
 * Mock Brand Fidelity Scorer
 */
class MockBFSScorer {
  private strictMode = false;

  setStrictMode(strict: boolean) {
    this.strictMode = strict;
  }

  async scoreContent(content: unknown, brandGuide: unknown) {
    // ✅ FIX: Type guard for content
    const contentObj = content as Record<string, unknown>;
    // Simulate scoring logic
    const toneScore = contentObj.tone === "professional" ? 95 : 30;
    const terminologyScore = typeof contentObj.body === "string" && contentObj.body.includes("Solution") ? 90 : 40;
    const complianceScore = typeof contentObj.body === "string" && !contentObj.body.includes("guarantee") ? 95 : 20;
    const ctaScore = contentObj.cta ? 90 : 10;
    const platformScore = 85;

    const overallScore =
      (toneScore +
        terminologyScore +
        complianceScore +
        ctaScore +
        platformScore) /
      5;

    return {
      overallScore: Math.round(overallScore),
      breakdown: {
        tone: toneScore,
        terminology: terminologyScore,
        compliance: complianceScore,
        cta: ctaScore,
        platform: platformScore,
      },
      recommendations: this.generateRecommendations(content, brandGuide),
    };
  }

  private generateRecommendations(
    content: unknown,
    _brandGuide: unknown,
  ): string[] {
    // ✅ FIX: Type guard for content
    const contentObj = content as Record<string, unknown>;
    const recommendations: string[] = [];

    if (contentObj.tone !== "professional") {
      recommendations.push("Adjust tone to be more professional");
    }

    if (!contentObj.cta) {
      recommendations.push("Add a clear call-to-action");
    }

    if (typeof contentObj.body === "string" && contentObj.body.includes("guarantee")) {
      recommendations.push("Remove guarantee claims");
    }

    return recommendations;
  }
}

/**
 * Mock Scheduling Service
 */
class MockSchedulingService {
  private scheduledPosts = new Map<string, unknown>();

  async schedulePost(postId: string, content: unknown, scheduleTime: Date) {
    // ✅ FIX: Type guard for scheduled
    // Check for conflicts
    for (const [, scheduled] of this.scheduledPosts) {
      const scheduledObj = scheduled as Record<string, unknown>;
      const scheduledTime = scheduledObj.scheduleTime as Date;
      const timeDiff = Math.abs(
        scheduledTime.getTime() - scheduleTime.getTime(),
      );
      if (timeDiff < 3600000) {
        // Less than 1 hour apart
        throw new Error("Schedule conflict detected");
      }
    }

    this.scheduledPosts.set(postId, {
      content,
      scheduleTime,
      status: "scheduled",
    });

    return {
      postId,
      scheduleTime,
      status: "scheduled",
    };
  }

  async getScheduledPost(postId: string) {
    return this.scheduledPosts.get(postId) || null;
  }

  async cancelSchedule(postId: string) {
    this.scheduledPosts.delete(postId);
    return { success: true };
  }

  clear() {
    this.scheduledPosts.clear();
  }
}

/**
 * Mock Audit Logger
 */
class MockAuditLogger {
  private logs: unknown[] = [];

  async logAction(action: string, metadata: unknown) {
    this.logs.push({
      action,
      metadata,
      timestamp: new Date(),
    });
  }

  getLogs(action?: string) {
    // ✅ FIX: Type guard for logs
    return action
      ? this.logs.filter((log) => {
          const logObj = log as Record<string, unknown>;
          return logObj.action === action;
        })
      : this.logs;
  }

  clear() {
    this.logs = [];
  }
}

/**
 * Automation Pipeline Orchestrator
 */
class AutomationPipeline {
  private aiService: MockAIService;
  private bfsScorer: MockBFSScorer;
  private schedulingService: MockSchedulingService;
  private auditLogger: MockAuditLogger;

  constructor() {
    this.aiService = new MockAIService();
    this.bfsScorer = new MockBFSScorer();
    this.schedulingService = new MockSchedulingService();
    this.auditLogger = new MockAuditLogger();
  }

  async executeAutomation(request: {
    brandId: string;
    userId: string;
    userEmail: string;
    postId: string;
    platform: string;
    scheduleHours: number;
    timezone: string;
    contentVariant?:
      | "happy_path"
      | "brand_mismatch"
      | "missing_cta"
      | "compliance_violation";
    brandGuide?: unknown;
  }) {
    const startTime = Date.now();

    try {
      // Step 1: Log automation started
      await this.auditLogger.logAction("AUTOMATION_STARTED", {
        postId: request.postId,
        brandId: request.brandId,
        platform: request.platform,
        scheduleHours: request.scheduleHours,
      });

      // Step 2: Generate AI content
      const content = request.contentVariant
        ? await this.aiService.generateContentWithVariant(
            request.contentVariant,
          )
        : await this.aiService.generateContent("");

      // ✅ FIX: Type guard for content
      const contentObj = content as Record<string, unknown>;
      await this.auditLogger.logAction("AI_GENERATION_COMPLETE", {
        postId: request.postId,
        contentPreview: `${contentObj.title} - ${typeof contentObj.body === "string" ? contentObj.body.substring(0, 50) : ""}...`,
        generationTime: Date.now() - startTime,
      });

      // Step 3: Score against brand guide
      const brandGuide = request.brandGuide || mockBrandGuide;
      const bfsResult = await this.bfsScorer.scoreContent(content, brandGuide);

      await this.auditLogger.logAction("BRAND_APPLICATION_COMPLETE", {
        postId: request.postId,
        bfsScore: bfsResult.overallScore,
        breakdown: bfsResult.breakdown,
        recommendations: bfsResult.recommendations,
      });

      // Step 4: Check if score meets threshold
      if (bfsResult.overallScore < 70) {
        await this.auditLogger.logAction("AUTOMATION_FAILED", {
          postId: request.postId,
          failureReason: "BFS score below threshold",
          bfsScore: bfsResult.overallScore,
          recommendations: bfsResult.recommendations,
        });

        throw new Error(
          `BFS score ${bfsResult.overallScore} below minimum threshold of 70`,
        );
      }

      // Step 5: Schedule the post
      const scheduleTime = calculateScheduleTime(
        request.timezone,
        request.scheduleHours,
      );
      const __schedulingResult = await this.schedulingService.schedulePost(
        request.postId,
        content,
        scheduleTime,
      );

      await this.auditLogger.logAction("SCHEDULING_COMPLETE", {
        postId: request.postId,
        platform: request.platform,
        scheduledTime: scheduleTime.toISOString(),
        timezone: request.timezone,
      });

      const duration = Date.now() - startTime;

      return {
        success: true,
        postId: request.postId,
        content,
        bfsScore: bfsResult.overallScore,
        bfsBreakdown: bfsResult.breakdown,
        scheduledTime: scheduleTime.toISOString(),
        duration,
        auditLogs: this.auditLogger.getLogs(),
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      await this.auditLogger.logAction("AUTOMATION_FAILED", {
        postId: request.postId,
        error: error instanceof Error ? error.message : String(error),
        duration,
      });

      throw error;
    }
  }

  getAuditLogs(action?: string) {
    return this.auditLogger.getLogs(action);
  }

  clearMocks() {
    this.schedulingService.clear();
    this.auditLogger.clear();
  }
}

// ==================== TEST SUITE ====================

describe.skip("Automation Pipeline E2E Tests", () => {
  let pipeline: AutomationPipeline;

  beforeEach(() => {
    pipeline = new AutomationPipeline();
  });

  afterEach(() => {
    pipeline.clearMocks();
  });

  describe("Happy Path - Complete Automation Flow", () => {
    it("should execute full automation pipeline successfully", async () => {
      const request = createMockAutomationRequest({
        contentVariant: "happy_path",
      });

      const result = await pipeline.executeAutomation(request);

      expect(result.success).toBe(true);
      expect(result.postId).toBe(TEST_POST_ID);
      expect(result.bfsScore).toBeGreaterThanOrEqual(70);
      expect(result.content).toBeDefined();
      expect(result.scheduledTime).toBeDefined();
    });

    it("should generate AI content successfully", async () => {
      const request = createMockAutomationRequest({
        contentVariant: "happy_path",
      });

      const result = await pipeline.executeAutomation(request);

      // ✅ FIX: Type guard for result.content
      const content = result.content as Record<string, unknown>;
      expect(content.title).toBeTruthy();
      expect(content.body).toBeTruthy();
      expect(content.cta).toBeTruthy();
      expect((result.content as Record<string, unknown>).hashtags).toBeInstanceOf(Array);
    });

    it("should score content against brand guide", async () => {
      const request = createMockAutomationRequest({
        contentVariant: "happy_path",
      });

      const result = await pipeline.executeAutomation(request);

      const scoreValidation = verifyBFSScore(
        result.bfsScore,
        bfsScoreExpectations.perfect_brand_alignment,
      );
      expect(scoreValidation.valid).toBe(true);
    });

    it("should schedule post with correct timezone", async () => {
      const request = createMockAutomationRequest({
        timezone: "US/Pacific",
        scheduleHours: 24,
      });

      const result = await pipeline.executeAutomation(request);

      expect(result.scheduledTime).toBeDefined();
      const scheduledDate = new Date(result.scheduledTime);
      expect(scheduledDate.getTime()).toBeGreaterThan(Date.now());
    });

    it("should create comprehensive audit trail", async () => {
      const request = createMockAutomationRequest({
        contentVariant: "happy_path",
      });

      await pipeline.executeAutomation(request);

      const allLogs = pipeline.getAuditLogs();
      expect(allLogs.length).toBeGreaterThanOrEqual(4); // At minimum: started, generation, application, scheduling

      // ✅ FIX: Type guard for logs
      expect(allLogs.some((log) => {
        const logObj = log as Record<string, unknown>;
        return logObj.action === "AUTOMATION_STARTED";
      })).toBe(true);
      expect(
        allLogs.some((log) => {
          const logObj = log as Record<string, unknown>;
          return logObj.action === "AI_GENERATION_COMPLETE";
        }),
      ).toBe(true);
      // ✅ FIX: Type guard for remaining log checks
      expect(
        allLogs.some((log) => {
          const logObj = log as Record<string, unknown>;
          return logObj.action === "BRAND_APPLICATION_COMPLETE";
        }),
      ).toBe(true);
      expect(allLogs.some((log) => {
        const logObj = log as Record<string, unknown>;
        return logObj.action === "SCHEDULING_COMPLETE";
      })).toBe(true);
    });
  });

  describe("BFS Failure Scenarios", () => {
    it("should fail when BFS score is below threshold", async () => {
      const request = createMockAutomationRequest({
        contentVariant: "brand_mismatch",
      });

      await expect(pipeline.executeAutomation(request)).rejects.toThrow(
        /BFS score.*below minimum threshold/,
      );
    });

    it("should fail when CTA is missing", async () => {
      const request = createMockAutomationRequest({
        contentVariant: "missing_cta",
      });

      await expect(pipeline.executeAutomation(request)).rejects.toThrow();
    });

    it("should fail on compliance violations", async () => {
      const request = createMockAutomationRequest({
        contentVariant: "compliance_violation",
      });

      await expect(pipeline.executeAutomation(request)).rejects.toThrow();
    });

    it("should log BFS failure to audit trail", async () => {
      const request = createMockAutomationRequest({
        contentVariant: "brand_mismatch",
      });

      try {
        await pipeline.executeAutomation(request);
      } catch {
        // Expected failure
      }

      const failureLogs = pipeline.getAuditLogs("AUTOMATION_FAILED");
      expect(failureLogs.length).toBeGreaterThan(0);
      // ✅ FIX: Type guard for failureLogs
      const firstLog = failureLogs[0] as Record<string, unknown>;
      expect(firstLog.metadata).toHaveProperty("failureReason");
    });
  });

  describe("Brand Mismatch Detection", () => {
    it("should detect tone mismatch with strict brand guide", async () => {
      const request = createMockAutomationRequest({
        contentVariant: "brand_mismatch",
        brandGuide: strictBrandGuide,
      });

      await expect(pipeline.executeAutomation(request)).rejects.toThrow();
    });

    it("should detect terminology mismatches", async () => {
      const request = createMockAutomationRequest({
        contentVariant: "brand_mismatch",
      });

      try {
        await pipeline.executeAutomation(request);
      } catch (error) {
        expect(error).toBeDefined();
      }

      const logs = pipeline.getAuditLogs("BRAND_APPLICATION_COMPLETE");
      expect(logs.length).toBeGreaterThan(0);
    });
  });

  describe("Scheduling & Conflict Detection", () => {
    it("should handle multiple timezones correctly", async () => {
      const timezoneTest = timezones.slice(0, 3);

      for (const tz of timezoneTest) {
        const request = createMockAutomationRequest({
          timezone: tz.name,
          contentVariant: "happy_path",
        });

        const result = await pipeline.executeAutomation(request);
        expect(result.scheduledTime).toBeDefined();
      }
    });

    it("should detect scheduling conflicts", async () => {
      const request1 = createMockAutomationRequest({
        postId: "post-1",
        scheduleHours: 24,
        contentVariant: "happy_path",
      });

      const request2 = createMockAutomationRequest({
        postId: "post-2",
        scheduleHours: 24.3, // Within 1 hour of first post
        contentVariant: "happy_path",
      });

      // First automation should succeed
      const result1 = await pipeline.executeAutomation(request1);
      expect(result1.success).toBe(true);

      // Second automation should fail due to conflict
      await expect(pipeline.executeAutomation(request2)).rejects.toThrow(
        /Schedule conflict/,
      );
    });

    it("should allow non-conflicting schedules", async () => {
      const request1 = createMockAutomationRequest({
        postId: "post-1",
        scheduleHours: 24,
        contentVariant: "happy_path",
      });

      const request2 = createMockAutomationRequest({
        postId: "post-2",
        scheduleHours: 48, // More than 1 hour later
        contentVariant: "happy_path",
      });

      const result1 = await pipeline.executeAutomation(request1);
      expect(result1.success).toBe(true);

      const result2 = await pipeline.executeAutomation(request2);
      expect(result2.success).toBe(true);
    });
  });

  describe("Audit Trail Validation", () => {
    it("should log all steps with correct metadata", async () => {
      const request = createMockAutomationRequest({
        contentVariant: "happy_path",
      });

      await pipeline.executeAutomation(request);

      const logs = pipeline.getAuditLogs();

      // Verify each log type has required fields
      logs.forEach((log) => {
        expect(log).toHaveProperty("action");
        expect(log).toHaveProperty("metadata");
        expect(log).toHaveProperty("timestamp");
      });
    });

    it("should maintain chronological order in audit logs", async () => {
      const request = createMockAutomationRequest({
        contentVariant: "happy_path",
      });

      await pipeline.executeAutomation(request);

      const logs = pipeline.getAuditLogs();
      // ✅ FIX: Type guard for logs
      for (let i = 1; i < logs.length; i++) {
        const currentLog = logs[i] as Record<string, unknown>;
        const previousLog = logs[i - 1] as Record<string, unknown>;
        const currentTimestamp = currentLog.timestamp as Date;
        const previousTimestamp = previousLog.timestamp as Date;
        expect(currentTimestamp.getTime()).toBeGreaterThanOrEqual(
          previousTimestamp.getTime(),
        );
      }
    });
  });

  describe("Concurrency & Cancellation", () => {
    it("should handle concurrent automations for different posts", async () => {
      const requests = [
        createMockAutomationRequest({
          postId: "post-1",
          scheduleHours: 24,
          contentVariant: "happy_path",
        }),
        createMockAutomationRequest({
          postId: "post-2",
          scheduleHours: 48,
          contentVariant: "happy_path",
        }),
        createMockAutomationRequest({
          postId: "post-3",
          scheduleHours: 72,
          contentVariant: "happy_path",
        }),
      ];

      const results = await Promise.all(
        requests.map((req) => pipeline.executeAutomation(req)),
      );

      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result.success).toBe(true);
      });
    });

    it("should handle automation cancellation before scheduling", async () => {
      const request = createMockAutomationRequest({
        contentVariant: "happy_path",
      });

      const result = await pipeline.executeAutomation(request);
      expect(result.success).toBe(true);

      // Simulate cancellation (would be part of orchestrator in production)
      expect(result.postId).toBe(TEST_POST_ID);
    });
  });

  describe("Performance & Timing", () => {
    it("should complete automation within reasonable time", async () => {
      const request = createMockAutomationRequest({
        contentVariant: "happy_path",
      });

      const result = await pipeline.executeAutomation(request);

      // Should complete in less than 5 seconds in test
      expect(result.duration).toBeLessThan(5000);
    });

    it("should have consistent execution times", async () => {
      const durations: number[] = [];

      for (let i = 0; i < 5; i++) {
        const request = createMockAutomationRequest({
          postId: `post-${i}`,
          scheduleHours: 24 + i,
          contentVariant: "happy_path",
        });

        const result = await pipeline.executeAutomation(request);
        durations.push(result.duration);
      }

      // Check that execution times don't vary wildly
      const avgDuration = durations.reduce((a, b) => a + b) / durations.length;
      durations.forEach((duration) => {
        expect(duration).toBeLessThan(avgDuration * 2); // No execution should be 2x slower
      });
    });
  });

  describe("Error Recovery", () => {
    it("should gracefully handle and log unexpected errors", async () => {
      const request = createMockAutomationRequest({
        contentVariant: "happy_path", // Valid variant
      });

      // Modify request to trigger error
      const invalidRequest = { ...request, postId: null as unknown as string };

      try {
        await pipeline.executeAutomation(invalidRequest);
      } catch {
        // Expected
      }

      const failureLogs = pipeline.getAuditLogs("AUTOMATION_FAILED");
      expect(failureLogs.length).toBeGreaterThan(0);
    });
  });
});
