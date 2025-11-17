/**
 * useDashboardData
 * 
 * React Query hook for fetching real dashboard data from the API.
 * Phase 2 – Issue 3: Using shared DashboardResponse type
 */

import { useQuery } from "@tanstack/react-query";
import { fetchJSON } from "@/lib/api-client";
import { DashboardResponse } from "@shared/api";

// Re-export types for convenience (they're now in shared/api.ts)
export type { DashboardKpi, ChartDataPoint, TopContentItem, ActivityItem } from "@shared/api";
export type { DashboardResponse as DashboardData }; // Alias for backward compatibility

interface UseDashboardDataOptions {
  brandId?: string;
  timeRange?: "7d" | "30d" | "90d" | "all";
  enabled?: boolean;
}

async function fetchDashboardData(options: UseDashboardDataOptions): Promise<DashboardResponse> {
  const { brandId, timeRange = "30d" } = options;

  if (!brandId) {
    throw new Error("Brand ID is required to fetch dashboard data.");
  }

  try {
    return await fetchJSON<DashboardResponse>("/api/dashboard", {
      method: "POST",
      body: JSON.stringify({ brandId, timeRange }),
      timeout: 30000, // 30 seconds
      retries: 2,
    });
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch dashboard data: ${error.message}`);
    }
    throw new Error("Failed to fetch dashboard data");
  }
}

export function useDashboardData(options?: UseDashboardDataOptions) {
  const { brandId, timeRange = "30d", enabled = true } = options || {};

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<DashboardResponse, Error>({
    queryKey: ["dashboard", brandId, timeRange],
    queryFn: () => fetchDashboardData({ brandId, timeRange }),
    enabled: enabled && !!brandId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
    refetchOnWindowFocus: false,
  });

  return {
    data,
    isLoading,
    isError,
    error: error instanceof Error ? error : undefined,
    refetch,
  };
}

