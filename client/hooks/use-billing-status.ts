import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface BillingStatus {
  subscription: {
    plan: "trial" | "base" | "agency";
    status: "active" | "past_due" | "canceled" | "trial";
    currentPeriodEnd: string;
    price: number;
    brands: number;
  };
  usage: {
    postsPublished: number;
    brandsManaged: number;
    aiInsightsUsed?: number;
    limits: {
      postsPublished: number | null;
      brandsManaged: number;
    };
  };
  paymentMethod?: {
    last4: string;
    expiry: string;
    brand: string;
  };
}

interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: "paid" | "pending" | "failed";
  downloadUrl?: string;
}

/**
 * Fetch billing status from API
 */
async function fetchBillingStatus(): Promise<BillingStatus> {
  const response = await fetch("/api/billing/status", {
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch billing status");
  }

  const data = await response.json();
  return data.data;
}

/**
 * Fetch billing history
 */
async function fetchBillingHistory(): Promise<Invoice[]> {
  const response = await fetch("/api/billing/history", {
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch billing history");
  }

  const data = await response.json();
  return data.data;
}

/**
 * Upgrade from trial to paid plan
 */
async function upgradePlan(payload: {
  plan: "base" | "agency";
  paymentMethodId: string;
}): Promise<any> {
  const response = await fetch("/api/billing/upgrade", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Failed to upgrade plan");
  }

  return response.json();
}

/**
 * Hook to manage billing status
 */
export function useBillingStatus() {
  const queryClient = useQueryClient();

  const {
    data: billingStatus,
    isLoading: isLoadingStatus,
    error: statusError,
    refetch: refetchStatus,
  } = useQuery({
    queryKey: ["billingStatus"],
    queryFn: fetchBillingStatus,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });

  const {
    data: billingHistory,
    isLoading: isLoadingHistory,
    error: historyError,
  } = useQuery({
    queryKey: ["billingHistory"],
    queryFn: fetchBillingHistory,
    staleTime: 1000 * 60 * 10, // 10 minutes
    retry: 1,
  });

  const upgradeMutation = useMutation({
    mutationFn: upgradePlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billingStatus"] });
      queryClient.invalidateQueries({ queryKey: ["billingHistory"] });
      queryClient.invalidateQueries({ queryKey: ["trialStatus"] });
    },
  });

  return {
    billingStatus,
    billingHistory,
    isLoading: isLoadingStatus || isLoadingHistory,
    statusError,
    historyError,
    refetchStatus,
    upgradePlan: upgradeMutation.mutate,
    isUpgrading: upgradeMutation.isPending,
  };
}
