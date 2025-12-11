import { FirstVisitTooltip } from "@/components/dashboard/FirstVisitTooltip";
import { PlatformMetricsCarousel } from "@/components/dashboard/PlatformMetricsCarousel";
import { AnalyticsAdvisor } from "@/components/dashboard/AnalyticsAdvisor";
import { ReportingMenu } from "@/components/dashboard/ReportingMenu";
import { ReportSettingsModal } from "@/components/dashboard/ReportSettingsModal";
import { EmailReportDialog } from "@/components/dashboard/EmailReportDialog";
import { PlatformMetrics, AnalyticsInsight, DATE_RANGES, PLATFORMS } from "@/types/analytics";
import { Calendar, BarChart3, Clock } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useAnalytics } from "@/components/postd/analytics/hooks/useAnalytics";
import { useCurrentBrand } from "@/hooks/useCurrentBrand";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageShell } from "@/components/postd/ui/layout/PageShell";
import { PageHeader } from "@/components/postd/ui/layout/PageHeader";
import { LoadingState } from "@/components/postd/dashboard/states/LoadingState";
import { ErrorState } from "@/components/postd/ui/feedback/ErrorState";
import { EmptyState } from "@/components/postd/ui/feedback/EmptyState";
import { BarChart3 as BarChart3Icon, AlertCircle, Loader2 } from "lucide-react";
import { logError } from "@/lib/logger";
import { useToast } from "@/hooks/use-toast";

export default function Analytics() {
  const { currentWorkspace } = useWorkspace();
  const { brandId } = useCurrentBrand();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [dateRange, setDateRange] = useState(DATE_RANGES[0]);
  const [showReportSettings, setShowReportSettings] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  
  // Get active tab from URL query params, default to "overview"
  const activeTab = searchParams.get("tab") || "overview";
  
  useEffect(() => {
    // If tab is set in URL, ensure it's valid
    const validTabs = ["overview", "content", "engagement", "channels"];
    if (activeTab && !validTabs.includes(activeTab)) {
      setSearchParams({ tab: "overview" }, { replace: true });
    }
  }, [activeTab, setSearchParams]);
  
  // Fetch analytics data with lastUpdated timestamp
  const days = dateRange.days || 30;
  const { data: analyticsData, isLoading: isLoadingAnalytics, isError: isErrorAnalytics, error: analyticsError, refetch: refetchAnalytics } = useAnalytics(days);

  // Phase 2 – Issue 1: Transform API platform metrics to UI format
  const platformMetrics: PlatformMetrics[] = useMemo(() => {
    if (!analyticsData?.platforms) {
      return [];
    }

    const platforms: PlatformMetrics[] = [];
    const platformEntries = Object.entries(analyticsData.platforms);

    for (const [platformKey, platformData] of platformEntries) {
      const platformInfo = PLATFORMS.find((p) => p.id === platformKey);
      if (!platformInfo) continue;

      // Calculate period string from timeframe
      const period = analyticsData.timeframe
        ? `${new Date(analyticsData.timeframe.startDate).toLocaleDateString()} - ${new Date().toLocaleDateString()}`
        : "Current period";

      // Use comparison data from API when available
      // Per-platform comparison uses global comparison as proxy when platform-specific data not available
      const globalComparison = analyticsData.comparison || { engagementGrowth: 0, followerGrowth: 0 };

      platforms.push({
        platform: platformKey as PlatformMetrics["platform"],
        icon: platformInfo.icon,
        color: platformInfo.color,
        period,
        metrics: {
          reach: platformData.reach || 0,
          engagement: platformData.engagement || 0,
          engagementRate: platformData.engagementRate || 0,
          followers: platformData.followers || 0,
          followerGrowth: platformData.followerGrowth || 0,
          topContent: [], // Top content requires separate API endpoint
        },
        comparison: {
          // Use global engagement growth as proxy for per-platform changes
          reachChange: globalComparison.engagementGrowth || 0,
          engagementChange: globalComparison.engagementGrowth || 0,
          followerChange: platformData.followerGrowth || globalComparison.followerGrowth || 0,
          period: `vs previous ${days} days`,
        },
      });
    }

    return platforms;
  }, [analyticsData]);

  // Legacy mock platform metrics (removed - Phase 2 Issue 1)
  const _legacyMockPlatformMetrics: PlatformMetrics[] = [
    {
      platform: "facebook",
      icon: "📘",
      color: "from-blue-500 to-blue-600",
      period: "Nov 8 - Nov 14, 2024",
      metrics: {
        reach: 45320,
        engagement: 2840,
        engagementRate: 6.3,
        followers: 12450,
        followerGrowth: 3.2,
        topContent: [
          {
            title: "Behind-the-Scenes Team Culture",
            type: "video",
            engagement: 45,
            reach: 8900,
            icon: "🎥",
          },
          {
            title: "Client Success Story",
            type: "post",
            engagement: 38,
            reach: 6200,
            icon: "⭐",
          },
          {
            title: "Product Launch Announcement",
            type: "post",
            engagement: 32,
            reach: 5100,
            icon: "🚀",
          },
        ],
      },
      comparison: {
        reachChange: 12,
        engagementChange: 8,
        followerChange: 2.1,
        period: "previous week",
      },
    },
    {
      platform: "instagram",
      icon: "📸",
      color: "from-pink-500 to-purple-600",
      period: "Nov 8 - Nov 14, 2024",
      metrics: {
        reach: 67850,
        engagement: 4120,
        engagementRate: 6.1,
        followers: 18920,
        followerGrowth: 4.5,
        topContent: [
          {
            title: "Reel: AI Tips & Tricks",
            type: "reel",
            engagement: 52,
            reach: 12400,
            icon: "🎞️",
          },
          {
            title: "Carousel: Content Calendar Breakdown",
            type: "post",
            engagement: 41,
            reach: 9800,
            icon: "📱",
          },
          {
            title: "Story: Daily Workflow",
            type: "story",
            engagement: 28,
            reach: 6500,
            icon: "📖",
          },
        ],
      },
      comparison: {
        reachChange: 18,
        engagementChange: 15,
        followerChange: 3.8,
        period: "previous week",
      },
    },
    {
      platform: "linkedin",
      icon: "💼",
      color: "from-blue-700 to-blue-800",
      period: "Nov 8 - Nov 14, 2024",
      metrics: {
        reach: 23450,
        engagement: 1280,
        engagementRate: 5.5,
        followers: 8650,
        followerGrowth: 1.2,
        topContent: [
          {
            title: "Industry Insights: AI Trends 2024",
            type: "post",
            engagement: 38,
            reach: 5600,
            icon: "📈",
          },
          {
            title: "Company Milestone Announcement",
            type: "post",
            engagement: 25,
            reach: 4200,
            icon: "🎉",
          },
          {
            title: "Thought Leadership Article",
            type: "post",
            engagement: 18,
            reach: 3100,
            icon: "💡",
          },
        ],
      },
      comparison: {
        reachChange: 7,
        engagementChange: 4,
        followerChange: 0.8,
        period: "previous week",
      },
    },
    {
      platform: "tiktok",
      icon: "🎵",
      color: "from-slate-800 to-slate-900",
      period: "Nov 8 - Nov 14, 2024",
      metrics: {
        reach: 156230,
        engagement: 8960,
        engagementRate: 5.7,
        followers: 45670,
        followerGrowth: 8.2,
        topContent: [
          {
            title: "Quick Tip: Content Ideas",
            type: "video",
            engagement: 78,
            reach: 32100,
            icon: "⚡",
          },
          {
            title: "Day in the Life",
            type: "video",
            engagement: 62,
            reach: 24500,
            icon: "📹",
          },
          {
            title: "Trending Sounds Challenge",
            type: "video",
            engagement: 54,
            reach: 19800,
            icon: "🎤",
          },
        ],
      },
      comparison: {
        reachChange: 22,
        engagementChange: 19,
        followerChange: 5.6,
        period: "previous week",
      },
    },
    {
      platform: "youtube",
      icon: "📺",
      color: "from-red-500 to-red-600",
      period: "Nov 8 - Nov 14, 2024",
      metrics: {
        reach: 89340,
        engagement: 3240,
        engagementRate: 3.6,
        followers: 12800,
        followerGrowth: 2.3,
        topContent: [
          {
            title: "Content Strategy Tutorial (15 min)",
            type: "video",
            engagement: 45,
            reach: 8900,
            icon: "🎓",
          },
          {
            title: "Live Q&A Session Highlights",
            type: "video",
            engagement: 32,
            reach: 5600,
            icon: "💬",
          },
          {
            title: "Product Demo Video",
            type: "video",
            engagement: 28,
            reach: 4200,
            icon: "🔧",
          },
        ],
      },
      comparison: {
        reachChange: 9,
        engagementChange: 6,
        followerChange: 1.5,
        period: "previous week",
      },
    },
  ]; // End of legacy mock - not used

  // ✅ FIX: Real AI insights - no mock data
  const [insights, setInsights] = useState<AnalyticsInsight[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [insightsError, setInsightsError] = useState<string | null>(null);

  // ✅ FIX: Fetch real AI insights from API with brandId
  useEffect(() => {
    const loadInsights = async () => {
      if (!brandId) {
        setInsights([]);
        setInsightsLoading(false);
        return;
      }

      try {
        setInsightsLoading(true);
        setInsightsError(null);

        const response = await fetch(`/api/analytics/${brandId}/insights`);

        if (response.ok) {
          const data = await response.json();
          setInsights(data.insights || []);
        } else if (response.status === 404) {
          // No insights data available yet
          setInsights([]);
        } else {
          throw new Error(`Failed to load insights: ${response.statusText}`);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load insights";
        logError("[Analytics] Failed to load insights", err instanceof Error ? err : new Error(String(err)));
        setInsightsError(errorMessage);
        setInsights([]); // Show empty state instead of mock data
      } finally {
        setInsightsLoading(false);
      }
    };

    loadInsights();
  }, [brandId]);

  const handleReportSettings = () => {
    setShowReportSettings(true);
  };

  const handleRunReport = () => {
    // Report generation uses the ReportSettingsModal for configuration
    setShowReportSettings(true);
  };

  const handleEmailReport = () => {
    setShowEmailDialog(true);
  };

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value }, { replace: true });
  };

  const handleRetry = () => {
    refetchAnalytics();
  };

  // Loading state
  if (isLoadingAnalytics) {
    return (
      <PageShell>
        <PageHeader
          title="Analytics"
          subtitle={`${currentWorkspace?.name || "Workspace"} — Cross-platform performance insights and recommendations`}
          actions={
            <ReportingMenu
              onSettings={handleReportSettings}
              onRun={handleRunReport}
              onEmail={handleEmailReport}
              dateRangeLabel={dateRange.label}
            />
          }
        />
        <LoadingState />
      </PageShell>
    );
  }

  // Error state
  if (isErrorAnalytics) {
    return (
      <PageShell>
        <PageHeader
          title="Analytics"
          subtitle={`${currentWorkspace?.name || "Workspace"} — Cross-platform performance insights and recommendations`}
          actions={
            <ReportingMenu
              onSettings={handleReportSettings}
              onRun={handleRunReport}
              onEmail={handleEmailReport}
              dateRangeLabel={dateRange.label}
            />
          }
        />
        <ErrorState 
          onRetry={handleRetry}
          title="Failed to load analytics"
          message={analyticsError instanceof Error ? analyticsError.message : "An unexpected error occurred"}
        />
      </PageShell>
    );
  }

  // Empty state (no analytics data)
  if (!analyticsData || (!analyticsData.platforms || Object.keys(analyticsData.platforms).length === 0)) {
    return (
      <PageShell>
        <PageHeader
          title="Analytics"
          subtitle={`${currentWorkspace?.name || "Workspace"} — Cross-platform performance insights and recommendations`}
          actions={
            <ReportingMenu
              onSettings={handleReportSettings}
              onRun={handleRunReport}
              onEmail={handleEmailReport}
              dateRangeLabel={dateRange.label}
            />
          }
        />
        <EmptyState
          icon={<BarChart3Icon className="w-12 h-12 text-slate-400" />}
          title="No Analytics Data"
          description="Analytics data will appear here once you start publishing content and connecting your social media accounts."
          action={{
            label: "Connect Accounts",
            onClick: () => {
              window.location.href = "/linked-accounts";
            },
          }}
        />
      </PageShell>
    );
  }

  return (
    <FirstVisitTooltip page="analytics">
      <PageShell>
        <PageHeader
          title="Analytics"
          subtitle={`${currentWorkspace?.name || "Workspace"} — Cross-platform performance insights and recommendations`}
          actions={
            <ReportingMenu
              onSettings={handleReportSettings}
              onRun={handleRunReport}
              onEmail={handleEmailReport}
              dateRangeLabel={dateRange.label}
            />
          }
        />
        
        {analyticsData?.lastUpdated && (
          <div className="flex items-center gap-1.5 mb-6 text-xs text-slate-500">
            <Clock className="w-3 h-3" />
            <span>
              Last updated: {new Date(analyticsData.lastUpdated).toLocaleString()}
            </span>
          </div>
        )}

        {/* Date Range Selector */}
        <div className="mb-8 flex flex-wrap gap-2 sm:gap-3">
          {DATE_RANGES.map((range) => (
            <button
              key={range.label}
              onClick={() => setDateRange(range)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all duration-200 ${
                dateRange.label === range.label
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                  : "bg-white/50 border border-white/60 text-slate-700 hover:border-indigo-300/50 hover:bg-white/70"
              }`}
            >
              <Calendar className="w-4 h-4" />
              {range.label}
            </button>
          ))}
        </div>

        {/* Tabs for different analytics views */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
            <TabsTrigger value="channels">Channels</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Platform Metrics Carousel Grid */}
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Platform Performance
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {platformMetrics.length > 0 ? (
                platformMetrics.map((platform) => (
                  <div
                    key={platform.platform}
                    className="bg-white/50 backdrop-blur-xl rounded-2xl p-6 border border-white/60 hover:bg-white/70 hover:shadow-md transition-all duration-300"
                  >
                    <PlatformMetricsCarousel platform={platform} />
                  </div>
                ))
              ) : (
                <div className="text-center py-12 px-4 bg-white/50 backdrop-blur-xl rounded-2xl border border-white/60">
                  <p className="text-muted-foreground text-lg mb-2">
                    No platform analytics yet
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Connect accounts or wait for data to accumulate.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* AI Insights Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              {insightsLoading ? (
                <div className="bg-white/50 backdrop-blur-xl rounded-2xl p-6 border border-white/60">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-slate-600 text-center">Loading AI insights...</p>
                </div>
              ) : insightsError ? (
                <div className="bg-white/50 backdrop-blur-xl rounded-2xl p-6 border border-white/60">
                  <AlertCircle className="w-8 h-8 text-red-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-600 text-center">{insightsError}</p>
                </div>
              ) : insights.length === 0 ? (
                <div className="bg-white/50 backdrop-blur-xl rounded-2xl p-6 border border-white/60">
                  <p className="text-sm font-medium text-slate-900 mb-2">AI Insights</p>
                  <p className="text-xs text-slate-600 text-center">No insights available yet. AI-powered recommendations will appear here once analytics data is available.</p>
                </div>
              ) : (
                <AnalyticsAdvisor insights={insights} />
              )}
            </div>

            {/* Key Takeaways */}
            <div className="lg:col-span-2 space-y-4">
              {/* Weekly Summary */}
              <div className="bg-white/50 backdrop-blur-xl rounded-2xl p-6 border border-white/60 hover:bg-white/70 transition-all duration-300">
                <h3 className="text-lg font-black text-slate-900 mb-4">Weekly Summary</h3>
                {analyticsData?.summary ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-white/50 rounded-lg">
                      <p className="text-2xl font-bold text-indigo-600">{analyticsData.summary.reach?.toLocaleString() || 0}</p>
                      <p className="text-xs text-slate-600">Total Reach</p>
                    </div>
                    <div className="text-center p-3 bg-white/50 rounded-lg">
                      <p className="text-2xl font-bold text-lime-600">{analyticsData.summary.engagement?.toLocaleString() || 0}</p>
                      <p className="text-xs text-slate-600">Engagements</p>
                    </div>
                    <div className="text-center p-3 bg-white/50 rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">{(analyticsData.summary.engagementRate || 0).toFixed(1)}%</p>
                      <p className="text-xs text-slate-600">Engagement Rate</p>
                    </div>
                    <div className="text-center p-3 bg-white/50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{analyticsData.summary.followers?.toLocaleString() || 0}</p>
                      <p className="text-xs text-slate-600">Followers</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-slate-600 font-medium">
                      Connect your social accounts to see weekly performance metrics.
                    </p>
                  </div>
                )}
              </div>

              {/* Top Opportunities */}
              <div className="bg-white/50 backdrop-blur-xl rounded-2xl p-6 border border-white/60 hover:bg-white/70 transition-all duration-300">
                <h3 className="text-lg font-black text-slate-900 mb-4">Top Opportunities</h3>
                {insights.length > 0 ? (
                  <ul className="space-y-3">
                    {insights.slice(0, 3).map((insight, idx) => (
                      <li key={idx} className="flex items-start gap-3 p-3 bg-white/50 rounded-lg">
                        <span className="text-lg">💡</span>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{insight.title}</p>
                          <p className="text-xs text-slate-600 mt-1">{insight.description}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-slate-600 font-medium">
                      AI-powered recommendations will appear once you have analytics data.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          </TabsContent>

          <TabsContent value="content">
            <div className="bg-white rounded-2xl p-8 border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Content Analytics</h2>
              {platformMetrics.length > 0 ? (
                <div className="space-y-6">
                  <p className="text-gray-600">Content performance across your connected platforms.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {platformMetrics.map((platform) => (
                      <div key={platform.platform} className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xl">{platform.icon}</span>
                          <span className="font-semibold capitalize">{platform.platform}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-gray-500">Reach</p>
                            <p className="font-bold">{platform.metrics.reach.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Engagement</p>
                            <p className="font-bold">{platform.metrics.engagement.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-gray-600">Connect your social accounts to see content performance metrics.</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="engagement">
            <div className="bg-white rounded-2xl p-8 border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Engagement Analytics</h2>
              {platformMetrics.length > 0 ? (
                <div className="space-y-6">
                  <p className="text-gray-600">Engagement metrics and trends across platforms.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {platformMetrics.map((platform) => (
                      <div key={platform.platform} className="bg-gray-50 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{platform.icon}</span>
                            <span className="font-semibold capitalize">{platform.platform}</span>
                          </div>
                          <span className={`text-sm font-bold ${platform.comparison.engagementChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {platform.comparison.engagementChange >= 0 ? '+' : ''}{platform.comparison.engagementChange}%
                          </span>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Engagement Rate</span>
                            <span className="font-bold">{platform.metrics.engagementRate.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total Engagements</span>
                            <span className="font-bold">{platform.metrics.engagement.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Followers</span>
                            <span className="font-bold">{platform.metrics.followers.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-gray-600">Connect your social accounts to see engagement analytics.</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="channels">
            <div className="bg-white rounded-2xl p-8 border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Channel Analytics</h2>
              {platformMetrics.length > 0 ? (
                <div className="space-y-6">
                  <p className="text-gray-600">Cross-platform performance comparison.</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-semibold">Channel</th>
                          <th className="text-right py-3 px-4 font-semibold">Reach</th>
                          <th className="text-right py-3 px-4 font-semibold">Engagement</th>
                          <th className="text-right py-3 px-4 font-semibold">Rate</th>
                          <th className="text-right py-3 px-4 font-semibold">Followers</th>
                          <th className="text-right py-3 px-4 font-semibold">Growth</th>
                        </tr>
                      </thead>
                      <tbody>
                        {platformMetrics.map((platform) => (
                          <tr key={platform.platform} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span>{platform.icon}</span>
                                <span className="capitalize font-medium">{platform.platform}</span>
                              </div>
                            </td>
                            <td className="text-right py-3 px-4">{platform.metrics.reach.toLocaleString()}</td>
                            <td className="text-right py-3 px-4">{platform.metrics.engagement.toLocaleString()}</td>
                            <td className="text-right py-3 px-4">{platform.metrics.engagementRate.toFixed(1)}%</td>
                            <td className="text-right py-3 px-4">{platform.metrics.followers.toLocaleString()}</td>
                            <td className="text-right py-3 px-4">
                              <span className={platform.comparison.followerChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                                {platform.comparison.followerChange >= 0 ? '+' : ''}{platform.comparison.followerChange.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600">Connect your social accounts to see channel comparisons.</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </PageShell>

      {/* Modals */}
      <ReportSettingsModal
        isOpen={showReportSettings}
        onClose={() => setShowReportSettings(false)}
        onSave={(settings) => {
          toast({
            title: "Report settings saved",
            description: `"${settings.name}" has been configured successfully.`,
          });
          setShowReportSettings(false);
        }}
      />

      <EmailReportDialog
        isOpen={showEmailDialog}
        onClose={() => setShowEmailDialog(false)}
        onSend={(emails) => {
          toast({
            title: "Report sent",
            description: `Report sent to ${emails.length} recipient${emails.length !== 1 ? 's' : ''} for ${dateRange.label}.`,
          });
          setShowEmailDialog(false);
        }}
        dateRangeLabel={dateRange.label}
      />
    </FirstVisitTooltip>
  );
}
