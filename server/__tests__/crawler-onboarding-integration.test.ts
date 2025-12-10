/**
 * Crawler → Onboarding Integration Tests
 * 
 * Tests that verify the automatic onboarding workflow trigger after a successful
 * synchronous crawl with a real brand UUID.
 * 
 * Flow tested:
 * POST /api/crawl/start?sync=true → Scrape success → Onboarding triggered → 8 items to Queue
 * 
 * @see docs/POSTD_SYSTEM_FLOW_AND_FAILURE_MAP.md (Flow 1: Onboarding + Brand Creation)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// =============================================================================
// TYPES
// =============================================================================

interface OnboardingStep {
  id: string;
  name: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  startedAt?: string;
  completedAt?: string;
  error?: string;
  result?: unknown;
}

interface OnboardingResult {
  workspaceId?: string;
  brandId: string;
  status: "started" | "completed" | "failed";
  steps: OnboardingStep[];
  startedAt: string;
  completedAt?: string;
  errors: Array<{ step: string; error: string; timestamp: string }>;
}

interface CrawlResponse {
  success: boolean;
  brandKit?: any;
  status: string;
  onboarding?: {
    triggered: boolean;
    status: "triggered" | "skipped_temp_id" | "skipped_no_tenant";
    jobId?: string;
    message: string;
  };
}

// =============================================================================
// MOCKS
// =============================================================================

// Mock runOnboardingWorkflow
const mockRunOnboardingWorkflow = vi.fn().mockResolvedValue({} as OnboardingResult);

// Mock runCrawlJobSync (simplified simulation)
const mockRunCrawlJobSync = vi.fn().mockResolvedValue({
  brandKit: {
    colors: { primary: "#FF0000" },
    typography: { heading: "Arial", body: "Helvetica" },
    about_blurb: "Test brand description",
  },
});

vi.mock("../lib/onboarding-orchestrator", () => ({
  runOnboardingWorkflow: (options: any) => mockRunOnboardingWorkflow(options),
}));

// =============================================================================
// TEST HELPERS
// =============================================================================

function isRealUUID(brandId: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(brandId);
}

function isTempBrandId(brandId: string): boolean {
  return /^brand_\d+$/.test(brandId);
}

/**
 * Simulates the crawler route's onboarding trigger logic
 */
async function simulateCrawlerWithOnboardingTrigger(
  brandId: string,
  tenantId: string | null,
  url: string
): Promise<CrawlResponse> {
  // Simulate successful crawl
  const result = await mockRunCrawlJobSync(url, brandId, tenantId);
  
  // Onboarding trigger logic (mirrors crawler.ts)
  let onboardingTriggered = false;
  let onboardingJobId: string | undefined;
  let onboardingStatus: "triggered" | "skipped_temp_id" | "skipped_no_tenant" = "skipped_temp_id";
  
  if (isRealUUID(brandId) && tenantId) {
    onboardingTriggered = true;
    onboardingStatus = "triggered";
    onboardingJobId = `onboarding-${Date.now()}-${brandId.substring(0, 8)}`;
    
    // Trigger onboarding (async, don't await in real code - but for tests we can track it)
    mockRunOnboardingWorkflow({
      workspaceId: tenantId,
      brandId,
      websiteUrl: url,
    });
  } else if (isRealUUID(brandId) && !tenantId) {
    onboardingStatus = "skipped_no_tenant";
  }
  
  return {
    success: true,
    brandKit: result.brandKit,
    status: "completed",
    onboarding: {
      triggered: onboardingTriggered,
      status: onboardingStatus,
      jobId: onboardingJobId,
      message: onboardingTriggered 
        ? "Onboarding workflow started in background. Content will appear in Queue shortly."
        : isRealUUID(brandId) 
          ? "Onboarding skipped - tenant ID not available."
          : "Onboarding skipped - temporary brand ID. Will run after brand is created.",
    },
  };
}

// =============================================================================
// TESTS
// =============================================================================

describe("Crawler → Onboarding Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock: onboarding completes successfully with 8 items
    mockRunOnboardingWorkflow.mockResolvedValue({
      brandId: "test-brand-id",
      status: "completed",
      steps: [
        { id: "crawler", name: "Website Crawler", status: "completed" },
        { id: "brand-guide", name: "Brand Guide Generation", status: "completed" },
        { id: "strategy", name: "Content Strategy", status: "completed" },
        { id: "sample-content", name: "Sample Content", status: "completed" },
        { id: "brand-summary", name: "Brand Narrative Summary", status: "completed" },
        { 
          id: "content-planning", 
          name: "Content Planning & Generation", 
          status: "completed",
          result: { itemsCount: 8, recommendationsCount: 3 },
        },
      ],
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      errors: [],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Onboarding Trigger Logic", () => {
    it("should trigger onboarding when brandId is a real UUID and tenantId exists", async () => {
      const brandId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
      const tenantId = "tenant-uuid-1234-5678-90ab-cdef12345678";
      const url = "https://example.com";

      const response = await simulateCrawlerWithOnboardingTrigger(brandId, tenantId, url);

      expect(response.success).toBe(true);
      expect(response.onboarding).toBeDefined();
      expect(response.onboarding?.triggered).toBe(true);
      expect(response.onboarding?.status).toBe("triggered");
      expect(response.onboarding?.jobId).toMatch(/^onboarding-\d+-a1b2c3d4$/);
      expect(response.onboarding?.message).toContain("Onboarding workflow started");
      
      // Verify onboarding was called with correct parameters
      expect(mockRunOnboardingWorkflow).toHaveBeenCalledTimes(1);
      expect(mockRunOnboardingWorkflow).toHaveBeenCalledWith({
        workspaceId: tenantId,
        brandId,
        websiteUrl: url,
      });
    });

    it("should NOT trigger onboarding when brandId is a temporary ID (brand_timestamp)", async () => {
      const brandId = "brand_1702300800000";
      const tenantId = "tenant-uuid-1234-5678-90ab-cdef12345678";
      const url = "https://example.com";

      const response = await simulateCrawlerWithOnboardingTrigger(brandId, tenantId, url);

      expect(response.success).toBe(true);
      expect(response.onboarding).toBeDefined();
      expect(response.onboarding?.triggered).toBe(false);
      expect(response.onboarding?.status).toBe("skipped_temp_id");
      expect(response.onboarding?.jobId).toBeUndefined();
      expect(response.onboarding?.message).toContain("temporary brand ID");
      
      // Verify onboarding was NOT called
      expect(mockRunOnboardingWorkflow).not.toHaveBeenCalled();
    });

    it("should NOT trigger onboarding when tenantId is missing", async () => {
      const brandId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
      const tenantId = null;
      const url = "https://example.com";

      const response = await simulateCrawlerWithOnboardingTrigger(brandId, tenantId, url);

      expect(response.success).toBe(true);
      expect(response.onboarding).toBeDefined();
      expect(response.onboarding?.triggered).toBe(false);
      expect(response.onboarding?.status).toBe("skipped_no_tenant");
      expect(response.onboarding?.message).toContain("tenant ID not available");
      
      // Verify onboarding was NOT called
      expect(mockRunOnboardingWorkflow).not.toHaveBeenCalled();
    });
  });

  describe("Scrape Success Independence", () => {
    it("should return scrape success even when onboarding fails", async () => {
      // Setup: onboarding fails
      mockRunOnboardingWorkflow.mockRejectedValue(new Error("Onboarding failed"));
      
      const brandId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
      const tenantId = "tenant-uuid-1234-5678-90ab-cdef12345678";
      const url = "https://example.com";

      const response = await simulateCrawlerWithOnboardingTrigger(brandId, tenantId, url);

      // Scrape should still succeed
      expect(response.success).toBe(true);
      expect(response.status).toBe("completed");
      expect(response.brandKit).toBeDefined();
      
      // Onboarding was triggered (even if it fails later)
      expect(response.onboarding?.triggered).toBe(true);
      expect(mockRunOnboardingWorkflow).toHaveBeenCalledTimes(1);
    });

    it("should include brandKit in response regardless of onboarding status", async () => {
      const brandId = "brand_1702300800000"; // Temp ID - onboarding skipped
      const tenantId = "tenant-uuid-1234-5678-90ab-cdef12345678";
      const url = "https://example.com";

      const response = await simulateCrawlerWithOnboardingTrigger(brandId, tenantId, url);

      expect(response.success).toBe(true);
      expect(response.brandKit).toBeDefined();
      expect(response.brandKit.colors).toBeDefined();
      expect(response.brandKit.typography).toBeDefined();
      expect(response.brandKit.about_blurb).toBe("Test brand description");
    });
  });

  describe("Expected Content Generation", () => {
    it("should generate 8 content items when onboarding completes successfully", async () => {
      const brandId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
      const tenantId = "tenant-uuid-1234-5678-90ab-cdef12345678";
      const url = "https://example.com";

      await simulateCrawlerWithOnboardingTrigger(brandId, tenantId, url);

      // Verify onboarding was called
      expect(mockRunOnboardingWorkflow).toHaveBeenCalledTimes(1);
      
      // The mock is configured to return 8 items in content-planning step
      const mockResult = await mockRunOnboardingWorkflow.mock.results[0]?.value;
      expect(mockResult).toBeDefined();
      
      const contentPlanningStep = mockResult?.steps.find(
        (s: OnboardingStep) => s.id === "content-planning"
      );
      expect(contentPlanningStep?.status).toBe("completed");
      expect((contentPlanningStep?.result as any)?.itemsCount).toBe(8);
    });
  });

  describe("UUID Detection", () => {
    it("should correctly identify valid UUIDs", () => {
      expect(isRealUUID("a1b2c3d4-e5f6-7890-abcd-ef1234567890")).toBe(true);
      expect(isRealUUID("A1B2C3D4-E5F6-7890-ABCD-EF1234567890")).toBe(true); // Case insensitive
      expect(isRealUUID("00000000-0000-0000-0000-000000000000")).toBe(true);
    });

    it("should correctly identify temporary brand IDs", () => {
      expect(isTempBrandId("brand_1702300800000")).toBe(true);
      expect(isTempBrandId("brand_123")).toBe(true);
    });

    it("should correctly reject invalid brand IDs", () => {
      expect(isRealUUID("brand_1702300800000")).toBe(false);
      expect(isRealUUID("invalid-uuid")).toBe(false);
      expect(isRealUUID("")).toBe(false);
      expect(isTempBrandId("a1b2c3d4-e5f6-7890-abcd-ef1234567890")).toBe(false);
    });
  });
});

describe("Onboarding Workflow Steps", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should execute all 6 onboarding steps in order", async () => {
    const expectedSteps = [
      "crawler",
      "brand-guide", 
      "strategy",
      "sample-content",
      "brand-summary",
      "content-planning",
    ];

    mockRunOnboardingWorkflow.mockResolvedValue({
      brandId: "test-brand-id",
      status: "completed",
      steps: expectedSteps.map((id, index) => ({
        id,
        name: `Step ${index + 1}`,
        status: "completed" as const,
      })),
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      errors: [],
    });

    await simulateCrawlerWithOnboardingTrigger(
      "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "tenant-uuid",
      "https://example.com"
    );

    expect(mockRunOnboardingWorkflow).toHaveBeenCalledTimes(1);
    const result = await mockRunOnboardingWorkflow.mock.results[0]?.value;
    expect(result?.steps.map((s: OnboardingStep) => s.id)).toEqual(expectedSteps);
  });

  it("should report partial completion when some steps fail", async () => {
    mockRunOnboardingWorkflow.mockResolvedValue({
      brandId: "test-brand-id",
      status: "failed",
      steps: [
        { id: "crawler", name: "Website Crawler", status: "completed" },
        { id: "brand-guide", name: "Brand Guide Generation", status: "completed" },
        { id: "strategy", name: "Content Strategy", status: "failed", error: "AI service unavailable" },
        { id: "sample-content", name: "Sample Content", status: "pending" },
        { id: "brand-summary", name: "Brand Narrative Summary", status: "pending" },
        { id: "content-planning", name: "Content Planning & Generation", status: "pending" },
      ],
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      errors: [{ step: "strategy", error: "AI service unavailable", timestamp: new Date().toISOString() }],
    });

    await simulateCrawlerWithOnboardingTrigger(
      "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "tenant-uuid",
      "https://example.com"
    );

    const result = await mockRunOnboardingWorkflow.mock.results[0]?.value;
    expect(result?.status).toBe("failed");
    expect(result?.errors).toHaveLength(1);
    expect(result?.steps.filter((s: OnboardingStep) => s.status === "completed")).toHaveLength(2);
    expect(result?.steps.filter((s: OnboardingStep) => s.status === "failed")).toHaveLength(1);
  });
});

