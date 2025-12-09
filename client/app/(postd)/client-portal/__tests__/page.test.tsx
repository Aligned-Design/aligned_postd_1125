/**
 * Client Portal Page - Smoke Tests
 * 
 * Basic render and API integration tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { renderWithProviders } from "@/__tests__/utils/renderWithProviders";
import ClientPortal from "../page";

// Mock fetch
global.fetch = vi.fn();

// Mock dashboard data response
const mockDashboardData = {
  brandInfo: {
    name: "Test Brand",
    logo: "https://example.com/logo.png",
    colors: { primary: "#000000", secondary: "#FFFFFF" },
  },
  agencyInfo: {
    name: "Test Agency",
    contactEmail: "test@agency.com",
  },
  metrics: {
    totalReach: 1000,
    totalEngagement: 100,
    followers: 500,
    postsThisMonth: 10,
    engagementRate: 10,
    pendingApprovals: 2,
    campaignProgress: 75,
    growth: { reach: 5, engagement: 3, followers: 2 },
  },
  recentContent: [],
  upcomingPosts: [],
  pendingApprovals: [],
  topPerformingContent: [],
  recentComments: [],
  quickActions: {
    approvalsNeeded: 2,
    reviewsAvailable: 5,
    eventsUpcoming: 0,
  },
};

vi.mock("@/contexts/BrandContext", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/contexts/BrandContext")>();
  return {
    ...actual,
    useBrand: () => ({ currentBrand: { id: "brand-1" } }),
  };
});

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe("ClientPortal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // ✅ FIX: Use proper type for fetch mock
    (global.fetch as unknown as { mockResolvedValue: (value: unknown) => void }).mockResolvedValue({
      ok: true,
      json: async () => mockDashboardData,
    });
  });

  it("renders client portal and loads dashboard data", async () => {
    renderWithProviders(
      <BrowserRouter>
        <ClientPortal />
      </BrowserRouter>
    );

    // Should call dashboard endpoint
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/client-portal/dashboard");
    });

    // Should display brand name when data loads (multiple instances are expected)
    await waitFor(() => {
      const brandNames = screen.queryAllByText(/test brand/i);
      expect(brandNames.length).toBeGreaterThan(0);
    });
  });

  it("handles dashboard load error gracefully", async () => {
    // ✅ FIX: Use proper type for fetch mock
    (global.fetch as unknown as { mockResolvedValue: (value: unknown) => void }).mockResolvedValue({
      ok: false,
      json: async () => ({ message: "Failed to load" }),
    });

    renderWithProviders(
      <BrowserRouter>
        <ClientPortal />
      </BrowserRouter>
    );

    // Should not crash, should show loading or error state
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });
});

