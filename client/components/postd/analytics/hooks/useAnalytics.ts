/**
 * useAnalytics Hook
 * Fetches analytics data from the API with lastUpdated timestamp
 * Phase 2 – Issue 3: Using shared AnalyticsSummaryResponse type
 */

import { useQuery } from "@tanstack/react-query";
import { useCurrentBrand } from "@/hooks/useCurrentBrand";
import { AnalyticsSummaryResponse } from "@shared/analytics";

export function useAnalytics(days: number = 30) {
  const { brandId } = useCurrentBrand();

  // Validate brandId is a valid UUID before making the request
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const isValidBrandId = brandId && uuidRegex.test(brandId);

  return useQuery<AnalyticsSummaryResponse>({
    queryKey: ["analytics", brandId, days],
    queryFn: async () => {
      if (!brandId) {
        throw new Error("Brand ID is required");
      }

      if (!isValidBrandId) {
        throw new Error("Invalid brand ID. Please select a valid brand.");
      }

      const response = await fetch(`/api/analytics/${brandId}?days=${days}`);
      if (!response.ok) {
        let errorMessage = `Failed to fetch analytics: ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.error?.message) {
            errorMessage = errorData.error.message;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch {
          // Use default error message if parsing fails
        }
        throw new Error(errorMessage);
      }

      return response.json() as Promise<AnalyticsSummaryResponse>;
    },
    enabled: !!isValidBrandId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
  });
}

