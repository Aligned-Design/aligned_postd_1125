/**
 * useSystemHealth Hook
 * 
 * Fetches system health status including AI configuration and integration status.
 * Used for showing guardrails and availability messaging in the UI.
 */

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";

interface SystemHealth {
  status: string;
  timestamp: string;
  service: string;
  aiConfigured: boolean;
  aiProvider: string | null;
  integrationsConfigured: boolean;
}

export function useSystemHealth() {
  const {
    data: health,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["systemHealth"],
    queryFn: async () => {
      const result = await apiGet<SystemHealth>("/api/health");
      return result;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  return {
    health: health || null,
    isLoading,
    isError,
    error,
    aiConfigured: health?.aiConfigured ?? false,
    integrationsConfigured: health?.integrationsConfigured ?? false,
  };
}

