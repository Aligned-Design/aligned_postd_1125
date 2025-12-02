/**
 * Dashboard Page
 * Main entry point after authentication
 * Displays role-based content and actions
 * 
 * Phase 4: Unified dashboard experience with modular widgets
 */

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrentBrand } from "@/hooks/useCurrentBrand";
import { useBrand } from "@/contexts/BrandContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { DashboardRow } from "@/components/postd/dashboard/DashboardShell";
import { useDashboardData } from "@/components/postd/dashboard/hooks/useDashboardData";
import { KpiRow } from "@/components/postd/dashboard/widgets/KpiRow";
import { TrafficAndEngagementRow } from "@/components/postd/dashboard/widgets/TrafficAndEngagementRow";
import { TopContentTable } from "@/components/postd/dashboard/widgets/TopContentTable";
import { RecentActivityPanel } from "@/components/postd/dashboard/widgets/RecentActivityPanel";
import { AdvisorInsightsPanel } from "@/components/postd/dashboard/widgets/AdvisorInsightsPanel";
import { LoadingState } from "@/components/postd/dashboard/states/LoadingState";
import { FirstTimeWelcome } from "@/components/postd/dashboard/FirstTimeWelcome";
import { DashboardWelcome } from "@/components/dashboard/DashboardWelcome";
import { PageShell } from "@/components/postd/ui/layout/PageShell";
import { PageHeader } from "@/components/postd/ui/layout/PageHeader";
import { EmptyState } from "@/components/postd/ui/feedback/EmptyState";
import { ErrorState } from "@/components/postd/ui/feedback/ErrorState";
import { PostOnboardingTour } from "@/components/postd/onboarding/PostOnboardingTour";
import { usePostOnboardingTour } from "@/hooks/usePostOnboardingTour";
import { NewPostButton } from "@/components/postd/shared/NewPostButton";

export default function Dashboard() {
  const { user, role, onboardingStep } = useAuth();
  const { brandId } = useCurrentBrand();
  const { currentBrand } = useBrand();
  const { currentWorkspace } = useWorkspace();
  const { data, isLoading, isError, error, refetch } = useDashboardData({ brandId, timeRange: "30d" });
  const [retryCount, setRetryCount] = useState(0);
  const { shouldShowTour, markTourCompleted } = usePostOnboardingTour();

  // Check if this is a first-time visit (onboarding complete, welcome not dismissed)
  // Use useState with lazy initializer to compute initial state safely
  const [showFirstTimeWelcome, setShowFirstTimeWelcome] = useState<boolean>(() => {
    if (typeof window === "undefined") return false; // guard for SSR

    if (!onboardingStep) {
      const dismissed = localStorage.getItem("aligned:first_time_welcome:dismissed");
      const onboardingCompleted = localStorage.getItem("aligned:onboarding:completed");
      
      // Show welcome if onboarding was just completed (first time after onboarding)
      if (!dismissed && onboardingCompleted === "true") {
        // Mark as shown so it doesn't show again
        localStorage.setItem("aligned:onboarding:completed", "shown");
        return true;
      }
    }
    return false;
  });

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
    refetch();
  };

  return (
    <PageShell>
      {/* Post-Onboarding Tour */}
      {shouldShowTour && (
        <PostOnboardingTour
          onComplete={markTourCompleted}
          onSkip={markTourCompleted}
        />
      )}

      <PageHeader
        title="Dashboard"
        subtitle={showFirstTimeWelcome ? "You're all set! Let's create something amazing." : `Welcome back, ${currentBrand?.name || currentWorkspace?.name || user?.name || "User"}!`}
        actions={<NewPostButton variant="default" size="md" label="Create Content" />}
      />

      {/* First-Time Welcome Hero */}
      {showFirstTimeWelcome && (
        <DashboardWelcome
          onDismiss={() => {
            setShowFirstTimeWelcome(false);
            localStorage.setItem("aligned:first_time_welcome:dismissed", "true");
          }}
          brandId={brandId}
          hasContent={data?.topContent && data.topContent.length > 0}
          hasBrandGuide={!!currentBrand}
          hasConnectedAccounts={false}
        />
      )}

      {/* Dashboard Content */}
      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState onRetry={handleRetry} />
      ) : !data ? (
        <EmptyState
          title="No Dashboard Data"
          description="It looks like there's no data to display yet. Connect your first brand or create your first campaign to see insights here!"
          action={{
            label: "Get Started",
            onClick: () => {},
          }}
        />
      ) : (
        <>
          {/* On first visit, hide empty widgets and show only welcome + CTA */}
          {showFirstTimeWelcome ? (
            <div className="space-y-6">
              {/* Show advisor panel if available, but hide empty KPIs/charts/tables */}
              {data && (data.recentActivity?.length > 0 || data.topContent?.length > 0) && (
                <DashboardRow columns={2} gap="lg">
                  {data.topContent && data.topContent.length > 0 && (
                    <TopContentTable items={data.topContent} />
                  )}
                  <div className="space-y-6">
                    {data.recentActivity && data.recentActivity.length > 0 && (
                      <RecentActivityPanel items={data.recentActivity} />
                    )}
                    <AdvisorInsightsPanel />
                  </div>
                </DashboardRow>
              )}
              {(!data || (data.recentActivity?.length === 0 && data.topContent?.length === 0)) && (
                <div className="text-center py-8">
                  <p className="text-slate-600 font-medium mb-4">
                    Once you create content, you'll see insights and analytics here.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6 sm:space-y-8">
              {/* Row 1: KPIs */}
              <KpiRow kpis={data.kpis} />

              {/* Row 2: Charts */}
              <TrafficAndEngagementRow chartData={data.chartData} />

              {/* Row 3: Table + Feed/Advisors */}
              <DashboardRow columns={2} gap="lg">
                <TopContentTable items={data.topContent} />
                <div className="space-y-6">
                  <RecentActivityPanel items={data.recentActivity} />
                  <AdvisorInsightsPanel />
                </div>
              </DashboardRow>
            </div>
          )}
        </>
      )}
    </PageShell>
  );
}
