/**
 * Dashboard Page - Smoke Tests
 * 
 * Basic render and data loading tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Dashboard from "../page";

// Mock useDashboardData hook
const mockDashboardData = {
  kpis: [
    { id: "1", label: "Total Reach", value: "10.5K", change: "+12%" },
    { id: "2", label: "Engagement", value: "1.2K", change: "+8%" },
  ],
  chartData: [
    { date: "2024-01-01", value: 100 },
    { date: "2024-01-02", value: 150 },
  ],
  topContent: [
    { id: "1", title: "Post 1", platform: "instagram", impressions: 1000, engagement: 100 },
  ],
  recentActivity: [
    { id: "1", type: "post_created", title: "New post created", timestamp: "2024-01-01" },
  ],
};

vi.mock("@/components/postd/dashboard/hooks/useDashboardData", () => ({
  useDashboardData: () => ({
    data: mockDashboardData,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "user-1", name: "Test User" },
    role: "admin",
    onboardingStep: null,
  }),
}));

vi.mock("@/contexts/BrandContext", () => ({
  useBrand: () => ({ currentBrand: { id: "brand-1" } }),
}));

vi.mock("@/hooks/usePostOnboardingTour", () => ({
  usePostOnboardingTour: () => ({
    shouldShowTour: false,
    markTourCompleted: vi.fn(),
  }),
}));

describe("Dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders dashboard with data", () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    expect(screen.getByText(/dashboard/i)).toBeTruthy();
    expect(screen.getByText(/total reach/i)).toBeTruthy();
  });

  it("shows loading state when data is loading", () => {
    vi.doMock("@/components/postd/dashboard/hooks/useDashboardData", () => ({
      useDashboardData: () => ({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
        refetch: vi.fn(),
      }),
    }));

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    // Should show loading state
    expect(screen.getByText(/loading/i) || screen.queryByRole("progressbar")).toBeTruthy();
  });

  it("shows error state when data fetch fails", () => {
    vi.doMock("@/components/postd/dashboard/hooks/useDashboardData", () => ({
      useDashboardData: () => ({
        data: undefined,
        isLoading: false,
        isError: true,
        error: new Error("Failed to load"),
        refetch: vi.fn(),
      }),
    }));

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    // Should show error state with retry option
    expect(screen.getByText(/error/i) || screen.getByText(/retry/i)).toBeTruthy();
  });
});

