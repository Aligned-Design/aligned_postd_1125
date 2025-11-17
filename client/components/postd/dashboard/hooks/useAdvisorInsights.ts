/**
 * useAdvisorInsights
 * 
 * React Query hook for fetching AI advisor insights.
 */

import { useQuery } from "@tanstack/react-query";
import type { AdvisorRequest, AdvisorResponse, AdvisorInsight } from "@shared/advisor";

interface UseAdvisorInsightsParams {
  brandId: string;
  timeRange?: "7d" | "30d" | "90d" | "all";
  period?: string;
  metrics?: AdvisorRequest["metrics"];
  enabled?: boolean;
}

async function fetchAdvisorInsights(params: UseAdvisorInsightsParams): Promise<AdvisorResponse> {
  // Validate brandId is a valid UUID before making the request
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(params.brandId)) {
    throw new Error("Invalid brand ID. Please select a valid brand.");
  }

  const response = await fetch("/api/ai/advisor", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      brandId: params.brandId,
      timeRange: params.timeRange,
      period: params.period,
      metrics: params.metrics,
    }),
  });

  if (!response.ok) {
    let errorMessage = "Failed to fetch insights";
    try {
      const errorData = await response.json();
      
      // Parse structured validation errors from backend
      if (errorData.error?.details?.validationErrors && Array.isArray(errorData.error.details.validationErrors)) {
        const validationErrors = errorData.error.details.validationErrors;
        const errorMessages = validationErrors.map((err: { field: string; message: string }) => 
          `${err.field}: ${err.message}`
        ).join(", ");
        errorMessage = `Validation failed: ${errorMessages}`;
      } else if (errorData.error?.message) {
        errorMessage = errorData.error.message;
      } else if (errorData.message) {
        errorMessage = errorData.message;
      } else if (response.status === 400) {
        errorMessage = "Invalid request. Please check your brand selection and try again.";
      } else if (response.status === 403) {
        errorMessage = "You don't have permission to view insights for this brand.";
      } else if (response.status === 401) {
        errorMessage = "Authentication required. Please log in again.";
      }
    } catch {
      // If we can't parse the error, use status-based message
      if (response.status === 400) {
        errorMessage = "Invalid request. Please check your brand selection and try again.";
      } else if (response.status === 403) {
        errorMessage = "You don't have permission to view insights for this brand.";
      } else if (response.status === 401) {
        errorMessage = "Authentication required. Please log in again.";
      }
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export function useAdvisorInsights(params: UseAdvisorInsightsParams) {
  const { brandId, timeRange, period, metrics, enabled = true } = params;

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<AdvisorResponse>({
    queryKey: ["advisorInsights", brandId, timeRange || period],
    queryFn: () => fetchAdvisorInsights({ brandId, timeRange, period, metrics }),
    enabled: enabled && !!brandId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
    refetchOnWindowFocus: false,
  });

  return {
    data,
    insights: data?.insights || [],
    brandFidelityScore: data?.brandFidelityScore ?? 0,
    compliance: data?.compliance || {},
    isLoading,
    isError,
    error: error instanceof Error ? error : undefined,
    refetch,
    rawModelInfo: data?.rawModelInfo,
  };
}

