/**
 * usePlatformConnections Hook
 * 
 * Fetches platform connection status for a brand.
 * Returns simple boolean flags for each platform.
 */

import { useQuery } from "@tanstack/react-query";
import { useCurrentBrand } from "@/hooks/useCurrentBrand";
import { apiGet } from "@/lib/api";

interface PlatformStatus {
  connected: boolean;
}

interface PlatformConnectionsResponse {
  success: boolean;
  platforms: {
    facebook: PlatformStatus;
    instagram: PlatformStatus;
    linkedin: PlatformStatus;
    twitter: PlatformStatus;
    tiktok: PlatformStatus;
    meta: PlatformStatus;
  };
}

export function usePlatformConnections() {
  const { brandId } = useCurrentBrand();

  const {
    data: connections,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["platformConnections", brandId],
    queryFn: async () => {
      if (!brandId) {
        return null;
      }
      const result = await apiGet<PlatformConnectionsResponse>(
        `/api/integrations/status?brandId=${brandId}`
      );
      return result;
    },
    enabled: !!brandId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const platforms = connections?.platforms || {
    facebook: { connected: false },
    instagram: { connected: false },
    linkedin: { connected: false },
    twitter: { connected: false },
    tiktok: { connected: false },
    meta: { connected: false },
  };

  const hasAnyConnection = Object.values(platforms).some((p) => p.connected);

  return {
    platforms,
    hasAnyConnection,
    isLoading,
    isError,
    error,
  };
}

