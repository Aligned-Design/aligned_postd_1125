import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface TrialStatus {
  isTrial: boolean;
  publishedCount: number;
  maxPosts: number;
  remainingPosts: number;
  daysRemaining: number | null;
  isExpired: boolean;
  canPublish?: boolean;
}

/**
 * Fetch trial status from API
 */
async function fetchTrialStatus(): Promise<TrialStatus> {
  const response = await fetch("/api/trial/status", {
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch trial status");
  }

  const data = await response.json();
  return data.data;
}

/**
 * Start trial period
 */
async function startTrial(): Promise<any> {
  const response = await fetch("/api/trial/start", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to start trial");
  }

  return response.json();
}

/**
 * Hook to manage trial status
 */
export function useTrialStatus() {
  const queryClient = useQueryClient();

  const {
    data: trialStatus,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["trialStatus"],
    queryFn: fetchTrialStatus,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });

  const startTrialMutation = useMutation({
    mutationFn: startTrial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trialStatus"] });
    },
  });

  return {
    trialStatus,
    isLoading,
    error,
    refetch,
    startTrial: startTrialMutation.mutate,
    isStartingTrial: startTrialMutation.isPending,
  };
}
