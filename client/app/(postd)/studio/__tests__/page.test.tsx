/**
 * Creative Studio Page - Smoke Tests
 * 
 * Basic render and interaction tests to ensure core functionality works
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { renderWithProviders } from "@/__tests__/utils/renderWithProviders";
import CreativeStudio from "../page";

// Mock dependencies
vi.mock("@/contexts/UserContext", () => ({
  useUser: () => ({ user: { id: "user-1", name: "Test User", role: "admin" } }),
}));

vi.mock("@/contexts/WorkspaceContext", () => ({
  useWorkspace: () => ({ currentWorkspace: { id: "workspace-1" } }),
}));

vi.mock("@/contexts/BrandContext", () => ({
  useBrand: () => ({ currentBrand: { id: "brand-1", name: "Test Brand" } }),
}));

vi.mock("@/hooks/useBrandGuide", () => ({
  useBrandGuide: () => ({ brandGuide: null, isLoading: false }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock("@/lib/logger", () => ({
  logTelemetry: vi.fn(),
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock as any;

describe("CreativeStudio", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it("renders the entry screen when no design is active", () => {
    renderWithProviders(
      <BrowserRouter>
        <CreativeStudio />
      </BrowserRouter>
    );

    // Should show entry screen options
    expect(screen.getByText(/start from ai/i)).toBeTruthy();
    expect(screen.getByText(/blank canvas/i)).toBeTruthy();
  });

  it("opens AI modal when 'Start from AI' is clicked", async () => {
    renderWithProviders(
      <BrowserRouter>
        <CreativeStudio />
      </BrowserRouter>
    );

    const aiButton = screen.getByText(/start from ai/i);
    fireEvent.click(aiButton);

    // AI modal should open (check for modal content)
    await waitFor(() => {
      // Modal should be visible - check for AI generation content
      const dialog = screen.queryByRole("dialog");
      const generateText = screen.queryByText(/generate/i);
      expect(dialog || generateText).toBeTruthy();
    });
  });

  it("opens template grid when 'Blank Canvas' is clicked", async () => {
    renderWithProviders(
      <BrowserRouter>
        <CreativeStudio />
      </BrowserRouter>
    );

    const blankCanvasButton = screen.getByText(/blank canvas/i);
    fireEvent.click(blankCanvasButton);

    // Template grid modal should open
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeTruthy();
    });
  });
});

