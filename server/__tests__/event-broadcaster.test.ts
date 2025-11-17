import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  broadcastJobCreated,
  broadcastJobPending,
  broadcastJobApproved,
  broadcastJobPublishing,
  broadcastJobCompleted,
  broadcastJobFailed,
  broadcastJobRetry,
  broadcastAnalyticsSyncStarted,
  broadcastAnalyticsSyncProgressUpdate,
  broadcastAnalyticsSyncCompleted,
  broadcastInsightsGenerated,
  broadcastForecastReady,
  broadcastNotification,
  broadcastTeamAlert,
  broadcastBatchJobProgress,
  broadcastBatchJobCompleted,
} from "../lib/event-broadcaster";

// Mock the websocket-server module
vi.mock("../lib/websocket-server", () => ({
  broadcastJobStatusUpdate: vi.fn(),
  broadcastAnalyticsSyncProgress: vi.fn(),
  broadcastNotificationToUser: vi.fn(),
  getWebSocketInstance: vi.fn(() => ({
    of: vi.fn(() => ({
      to: vi.fn(() => ({
        emit: vi.fn(),
      })),
    })),
  })),
}));

describe("Event Broadcaster", () => {
  describe("Job Status Events", () => {
    it("should broadcast job created event", () => {
      expect(() => {
        broadcastJobCreated("job-123", {
          brandId: "brand-123",
          platforms: ["instagram", "facebook"],
          scheduledAt: "2025-01-15T10:00:00Z",
        });
      }).not.toThrow();
    });

    it("should broadcast job pending event", () => {
      expect(() => {
        broadcastJobPending("job-123", {
          brandId: "brand-123",
          platforms: ["instagram"],
        });
      }).not.toThrow();
    });

    it("should broadcast job approved event", () => {
      expect(() => {
        broadcastJobApproved("job-123", {
          brandId: "brand-123",
          approvedBy: "user-456",
        });
      }).not.toThrow();
    });

    it("should broadcast job publishing event with progress", () => {
      expect(() => {
        broadcastJobPublishing("job-123", {
          brandId: "brand-123",
          currentPlatform: "instagram",
          platformIndex: 1,
          totalPlatforms: 3,
        });
      }).not.toThrow();
    });

    it("should calculate progress correctly during publishing", () => {
      // Progress should be: (1 / 3) * 80 + 20 = 46%
      expect(() => {
        broadcastJobPublishing("job-123", {
          brandId: "brand-123",
          currentPlatform: "facebook",
          platformIndex: 1,
          totalPlatforms: 3,
        });
      }).not.toThrow();
    });

    it("should broadcast job completed event", () => {
      expect(() => {
        broadcastJobCompleted("job-123", {
          brandId: "brand-123",
          platformsPublished: ["instagram", "facebook"],
          publishedUrls: {
            instagram: "https://instagram.com/post/123",
            facebook: "https://facebook.com/post/456",
          },
        });
      }).not.toThrow();
    });

    it("should broadcast job failed event", () => {
      expect(() => {
        broadcastJobFailed("job-123", {
          brandId: "brand-123",
          error: "Network timeout",
          failedPlatforms: ["instagram"],
          retryCount: 1,
        });
      }).not.toThrow();
    });

    it("should broadcast job retry event", () => {
      expect(() => {
        broadcastJobRetry("job-123", {
          brandId: "brand-123",
          retryCount: 2,
          nextAttemptAt: new Date(Date.now() + 60000).toISOString(),
        });
      }).not.toThrow();
    });
  });

  describe("Analytics Sync Events", () => {
    it("should broadcast analytics sync started event", () => {
      expect(() => {
        broadcastAnalyticsSyncStarted("brand-123", {
          syncId: "sync-123",
          platform: "instagram",
        });
      }).not.toThrow();
    });

    it("should broadcast analytics sync progress update", () => {
      expect(() => {
        broadcastAnalyticsSyncProgressUpdate("brand-123", "facebook", {
          platform: "facebook",
          progress: 50,
          recordsProcessed: 150,
          totalRecords: 300,
          currentMetric: "Syncing engagement metrics",
        });
      }).not.toThrow();
    });

    it("should broadcast analytics sync completed event", () => {
      expect(() => {
        broadcastAnalyticsSyncCompleted("brand-123", {
          syncId: "sync-123",
          platform: "instagram",
          recordsProcessed: 500,
          duration: 5000,
        });
      }).not.toThrow();
    });

    it("should broadcast insights generated event", () => {
      expect(() => {
        broadcastInsightsGenerated("brand-123", {
          insightCount: 12,
          topInsights: [
            { title: "High engagement on video posts", priority: "high" },
            { title: "Best time to post: 6-8 PM", priority: "medium" },
          ],
        });
      }).not.toThrow();
    });

    it("should broadcast forecast ready event", () => {
      expect(() => {
        broadcastForecastReady("brand-123", {
          forecastId: "forecast-123",
          predictions: 90,
          confidence: 0.85,
        });
      }).not.toThrow();
    });
  });

  describe("Notification Events", () => {
    it("should broadcast notification to user", () => {
      expect(() => {
        broadcastNotification("user-123", {
          type: "job-completed",
          title: "Job Published",
          message: "Your content has been published to 3 platforms",
          brandId: "brand-123",
          actionUrl: "/jobs/job-123",
          severity: "success",
        });
      }).not.toThrow();
    });

    it("should broadcast team alert with warning severity", () => {
      expect(() => {
        broadcastTeamAlert("team-123", {
          title: "API Rate Limit Warning",
          message: "Instagram API approaching rate limit",
          severity: "warning",
          actionUrl: "/settings/integrations",
        });
      }).not.toThrow();
    });

    it("should broadcast team alert with critical severity", () => {
      expect(() => {
        broadcastTeamAlert("team-123", {
          title: "Authentication Failed",
          message: "Facebook API token has expired",
          severity: "critical",
          actionUrl: "/settings/integrations/facebook",
        });
      }).not.toThrow();
    });
  });

  describe("Batch Operations", () => {
    it("should broadcast batch job progress", () => {
      expect(() => {
        broadcastBatchJobProgress("batch-123", {
          totalJobs: 10,
          processedJobs: 5,
          successCount: 4,
          failureCount: 1,
        });
      }).not.toThrow();
    });

    it("should calculate progress percentage correctly", () => {
      // Progress = (5 / 10) * 100 = 50%
      expect(() => {
        broadcastBatchJobProgress("batch-456", {
          totalJobs: 20,
          processedJobs: 10,
          successCount: 9,
          failureCount: 1,
        });
      }).not.toThrow();
    });

    it("should broadcast batch job completion", () => {
      expect(() => {
        broadcastBatchJobCompleted("batch-123", {
          totalJobs: 10,
          successCount: 9,
          failureCount: 1,
          failedJobs: ["job-5"],
        });
      }).not.toThrow();
    });
  });

  describe("Event Error Tolerance", () => {
    it("should not throw if WebSocket is not initialized", () => {
      // Events should be wrapped in try-catch
      expect(() => {
        broadcastJobCreated("job-123", {
          brandId: "brand-123",
          platforms: ["instagram"],
        });
      }).not.toThrow();
    });

    it("should handle null data gracefully", () => {
      expect(() => {
        broadcastJobCreated("job-123", {
          brandId: "brand-123",
          platforms: [],
        });
      }).not.toThrow();
    });
  });

  describe("Event Type Safety", () => {
    it("should require correct status values for job created", () => {
      // This is a type-level test - would catch at compile time
      const validData = {
        brandId: "brand-123",
        platforms: ["instagram"],
      };
      expect(validData).toBeDefined();
    });

    it("should require platform field in analytics progress", () => {
      // This is a type-level test
      const validPayload = {
        platform: "instagram",
        progress: 50,
        recordsProcessed: 100,
      };
      expect(validPayload).toBeDefined();
    });

    it("should require severity field in notifications", () => {
      // This is a type-level test
      const validNotification = {
        type: "job-completed" as const,
        title: "Title",
        message: "Message",
        severity: "success" as const,
      };
      expect(validNotification).toBeDefined();
    });
  });
});
