import { AppShell } from "@postd/layout/AppShell";
import { FirstVisitTooltip } from "@/components/dashboard/FirstVisitTooltip";
import { PlatformMetricsCarousel } from "@/components/dashboard/PlatformMetricsCarousel";
import { AnalyticsAdvisor } from "@/components/dashboard/AnalyticsAdvisor";
import { ReportingMenu } from "@/components/dashboard/ReportingMenu";
import { ReportSettingsModal } from "@/components/dashboard/ReportSettingsModal";
import { EmailReportDialog } from "@/components/dashboard/EmailReportDialog";
import { PlatformMetrics, AnalyticsInsight, DATE_RANGES } from "@/types/analytics";
import { Calendar, BarChart3 } from "lucide-react";
import { useState } from "react";
import { useWorkspace } from "@/contexts/WorkspaceContext";

export default function Analytics() {
  const { currentWorkspace } = useWorkspace();
  const [dateRange, setDateRange] = useState(DATE_RANGES[0]);
  const [showReportSettings, setShowReportSettings] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);

  // Mock platform metrics data
  const platformMetrics: PlatformMetrics[] = [
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
  ];

  // Mock AI insights
  const insights: AnalyticsInsight[] = [
    {
      id: "1",
      platform: "Instagram",
      icon: "📸",
      title: "Video Content Drives 3× Engagement",
      description:
        "Your Reels and videos drove 3× more engagement than static posts this week. Consider shifting 60% of your content to video format.",
      metric: "Reels: 52 avg engagements vs Posts: 18 avg",
      actionLabel: "Create Video Plan",
      priority: "high",
      type: "opportunity",
    },
    {
      id: "2",
      platform: "Facebook",
      icon: "📘",
      title: "Wednesday Posts Underperform",
      description:
        "Posts published on Wednesdays average 28% lower engagement. Reschedule your Wednesday content to Friday mornings (9-11 AM).",
      metric: "Wed avg: 22 engagement vs Fri avg: 42",
      actionLabel: "Adjust Schedule",
      priority: "high",
      type: "suggestion",
    },
    {
      id: "3",
      platform: "TikTok",
      icon: "🎵",
      title: "Growth Opportunity with Trending Sounds",
      description:
        "Posts using trending audio get 2.5× more views. 3 of your top 5 videos used trending sounds. Keep leveraging popular tracks.",
      metric: "Trending audio: 28K avg reach vs Original: 11K",
      actionLabel: "Trending Audio Ideas",
      priority: "medium",
      type: "opportunity",
    },
    {
      id: "4",
      platform: "YouTube",
      icon: "📺",
      title: "Tutorial Content Resonates",
      description:
        "Your 15-minute tutorial outperformed shorts. Consider producing 1-2 longer-form tutorials monthly for sustained engagement.",
      metric: "Long-form avg: 8.9K reach vs Shorts: 4.2K",
      actionLabel: "Plan Tutorials",
      priority: "medium",
      type: "suggestion",
    },
    {
      id: "5",
      platform: "LinkedIn",
      icon: "💼",
      title: "Post Timing Impact",
      description:
        "Tuesday and Thursday posts at 8 AM perform 45% better. This is peak time for your professional audience.",
      metric: "Tue/Thu 8 AM: 1,200 avg reach vs Other times: 680",
      actionLabel: "Optimize Timing",
      priority: "low",
      type: "suggestion",
    },
  ];

  const handleReportSettings = () => {
    setShowReportSettings(true);
  };

  const handleRunReport = () => {
    alert("Generating report...");
    // TODO: Implement report generation
  };

  const handleEmailReport = () => {
    setShowEmailDialog(true);
  };

  return (
    <AppShell>
      <FirstVisitTooltip page="analytics">
        <div className="min-h-screen bg-gradient-to-b from-indigo-50/30 via-white to-blue-50/20">
        <div className="p-4 sm:p-6 md:p-8">
          {/* Page Header with Reporting Button */}
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-2">Analytics</h1>
              <p className="text-slate-600 text-xs sm:text-sm font-medium">
                {currentWorkspace?.logo} {currentWorkspace?.name} — Cross-platform performance insights and recommendations
              </p>
            </div>
            <ReportingMenu
              onSettings={handleReportSettings}
              onRun={handleRunReport}
              onEmail={handleEmailReport}
              dateRangeLabel={dateRange.label}
            />
          </div>

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

          {/* Platform Metrics Carousel Grid */}
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Platform Performance
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {platformMetrics.map((platform) => (
                <div
                  key={platform.platform}
                  className="bg-white/50 backdrop-blur-xl rounded-2xl p-6 border border-white/60 hover:bg-white/70 hover:shadow-md transition-all duration-300"
                >
                  <PlatformMetricsCarousel platform={platform} />
                </div>
              ))}
            </div>
          </div>

          {/* AI Insights Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <AnalyticsAdvisor insights={insights} />
            </div>

            {/* Key Takeaways */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white/50 backdrop-blur-xl rounded-2xl p-6 border border-white/60 hover:bg-white/70 transition-all duration-300">
                <h3 className="text-lg font-black text-slate-900 mb-4">Weekly Summary</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-emerald-50/50 border border-emerald-200/50">
                    <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">
                      Total Reach
                    </p>
                    <p className="text-2xl sm:text-3xl font-black text-slate-900">
                      382K
                    </p>
                    <p className="text-xs text-emerald-600 font-medium mt-2">↑ 13.2% vs last week</p>
                  </div>

                  <div className="p-4 rounded-lg bg-pink-50/50 border border-pink-200/50">
                    <p className="text-xs font-bold text-pink-700 uppercase tracking-wider mb-1">
                      Total Engagement
                    </p>
                    <p className="text-2xl sm:text-3xl font-black text-slate-900">
                      20.5K
                    </p>
                    <p className="text-xs text-pink-600 font-medium mt-2">↑ 10.4% vs last week</p>
                  </div>

                  <div className="p-4 rounded-lg bg-blue-50/50 border border-blue-200/50">
                    <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">
                      Avg Engagement Rate
                    </p>
                    <p className="text-2xl sm:text-3xl font-black text-slate-900">
                      5.4%
                    </p>
                    <p className="text-xs text-blue-600 font-medium mt-2">↑ 0.8% vs last week</p>
                  </div>

                  <div className="p-4 rounded-lg bg-purple-50/50 border border-purple-200/50">
                    <p className="text-xs font-bold text-purple-700 uppercase tracking-wider mb-1">
                      New Followers
                    </p>
                    <p className="text-2xl sm:text-3xl font-black text-slate-900">
                      1,847
                    </p>
                    <p className="text-xs text-purple-600 font-medium mt-2">↑ 3.9% vs last week</p>
                  </div>
                </div>
              </div>

              {/* Top Opportunities */}
              <div className="bg-white/50 backdrop-blur-xl rounded-2xl p-6 border border-white/60 hover:bg-white/70 transition-all duration-300">
                <h3 className="text-lg font-black text-slate-900 mb-4">Top Opportunities</h3>

                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-50/50 border border-emerald-200/50">
                    <span className="text-lg flex-shrink-0">💡</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900">Shift to Video Content</p>
                      <p className="text-xs text-slate-600 mt-1">
                        Video posts generate 3× more engagement. Reallocate budget to Reels/TikTok.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50/50 border border-amber-200/50">
                    <span className="text-lg flex-shrink-0">🎯</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900">Optimize Post Timing</p>
                      <p className="text-xs text-slate-600 mt-1">
                        Friday 9-11 AM sees 42 avg engagements. Reschedule low-performing day content.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50/50 border border-blue-200/50">
                    <span className="text-lg flex-shrink-0">📈</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900">Leverage Trending Audio</p>
                      <p className="text-xs text-slate-600 mt-1">
                        TikTok trending sounds deliver 2.5× reach. Implement trending audio strategy.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      </FirstVisitTooltip>

      {/* Modals */}
      <ReportSettingsModal
        isOpen={showReportSettings}
        onClose={() => setShowReportSettings(false)}
        onSave={(settings) => {
          alert(`Report settings saved: ${settings.name}`);
          setShowReportSettings(false);
        }}
      />

      <EmailReportDialog
        isOpen={showEmailDialog}
        onClose={() => setShowEmailDialog(false)}
        onSend={(emails) => {
          alert(`Report sent to: ${emails.join(", ")}\nDate Range: ${dateRange.label}`);
          setShowEmailDialog(false);
        }}
        dateRangeLabel={dateRange.label}
      />
    </AppShell>
  );
}
