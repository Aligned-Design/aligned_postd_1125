import { Event, EventQuickStats, EVENT_TYPE_CONFIGS } from "@/types/event";
import { Lightbulb, AlertTriangle, TrendingUp, Zap, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";

interface EventInsightsPanelProps {
  events: Event[];
  stats: EventQuickStats;
  onPromoteClick?: (insight: string) => void;
}

interface Insight {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  type: "suggestion" | "warning" | "opportunity" | "action";
  actionLabel?: string;
  actionCallback?: () => void;
}

export function EventInsightsPanel({
  events,
  stats,
  onPromoteClick,
}: EventInsightsPanelProps) {
  const [insights, setInsights] = useState<Insight[]>([]);

  useEffect(() => {
    const generatedInsights: Insight[] = [];

    // Group events by type
    const eventsByType = {
      digital: events.filter((e) => e.eventType === "digital"),
      in_person: events.filter((e) => e.eventType === "in_person"),
      promo: events.filter((e) => e.eventType === "promo"),
    };

    // Check for upcoming events without promotion
    const upcomingWithoutPromo = events.filter(
      (e) =>
        e.status === "scheduled" &&
        new Date(e.startDate) > new Date() &&
        (!e.promotionSchedule || e.promotionSchedule.length === 0)
    );

    if (upcomingWithoutPromo.length > 0) {
      // Type-specific messaging
      const typeBreakdown = Object.entries(eventsByType)
        .filter(([_, e]) => upcomingWithoutPromo.some((up) => e.some((ev) => ev.id === up.id)))
        .map(([type, _]) => EVENT_TYPE_CONFIGS[type as any].icon)
        .join(" ");

      generatedInsights.push({
        id: "1",
        icon: <TrendingUp className="w-5 h-5" />,
        title: "Promotion Opportunity",
        description: `${typeBreakdown} ${upcomingWithoutPromo.length} upcoming event${upcomingWithoutPromo.length !== 1 ? "s" : ""} need promotions. AI can auto-generate 5+ posts per event.`,
        type: "suggestion",
        actionLabel: "Generate Promotions",
        actionCallback: () => onPromoteClick?.("Create Promotions"),
      });
    }

    // Check for failed syncs
    if (stats.failedSyncs > 0) {
      generatedInsights.push({
        id: "2",
        icon: <AlertTriangle className="w-5 h-5" />,
        title: "Sync Issues",
        description: `${stats.failedSyncs} event${stats.failedSyncs !== 1 ? "s" : ""} failed to sync to ${stats.failedSyncs === 1 ? "a platform" : "platforms"}. Check your integrations.`,
        type: "warning",
        actionLabel: "Fix Syncs",
      });
    }

    // Check for unlinked platforms
    const unlinkedEventCount = events.filter((e) =>
      e.platforms.some((p) => p.syncStatus === "not_linked")
    ).length;

    if (unlinkedEventCount > 0) {
      generatedInsights.push({
        id: "3",
        icon: <AlertTriangle className="w-5 h-5" />,
        title: "Unconnected Platforms",
        description: `${unlinkedEventCount} event${unlinkedEventCount !== 1 ? "s" : ""} have platforms that aren't connected. Link them to expand event reach.`,
        type: "warning",
        actionLabel: "Connect Platforms",
      });
    }

    // Upcoming event within 7 days
    const imminentEvent = events.find(
      (e) =>
        e.status === "published" ||
        (e.status === "scheduled" && new Date(e.startDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
    );

    if (imminentEvent) {
      generatedInsights.push({
        id: "4",
        icon: <Zap className="w-5 h-5" />,
        title: "Urgent: Event Coming Up",
        description: `"${imminentEvent.title}" is happening soon. Make sure all social posts are scheduled and reminders are sent.`,
        type: "action",
        actionLabel: "Review Event",
      });
    }

    // Best practices suggestion
    if (events.length > 0 && stats.connectedPlatforms >= 2) {
      const avgPromos =
        events.reduce((sum, e) => sum + (e.promotionSchedule?.length || 0), 0) /
        events.length;

      if (avgPromos < 2) {
        generatedInsights.push({
          id: "5",
          icon: <Lightbulb className="w-5 h-5" />,
          title: "More Promotions Win",
          description:
            "Events with 3+ promotion posts see 40% higher attendance. Consider adding before, during, and after-event posts.",
          type: "suggestion",
        });
      }
    }

    // Multi-platform success
    if (stats.connectedPlatforms === 3 && stats.upcomingCount > 0) {
      generatedInsights.push({
        id: "6",
        icon: <TrendingUp className="w-5 h-5" />,
        title: "Maximize Reach",
        description:
          "All platforms connected! Your events are positioned for maximum exposure. Keep scheduling across all channels.",
        type: "opportunity",
      });
    }

    setInsights(generatedInsights.slice(0, 4));
  }, [events, stats, onPromoteClick]);

  const getInsightColors = (type: string) => {
    switch (type) {
      case "suggestion":
        return "bg-blue-50 border-blue-200 text-blue-900";
      case "warning":
        return "bg-amber-50 border-amber-200 text-amber-900";
      case "action":
        return "bg-red-50 border-red-200 text-red-900";
      case "opportunity":
        return "bg-green-50 border-green-200 text-green-900";
      default:
        return "bg-slate-50 border-slate-200 text-slate-900";
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case "suggestion":
        return "text-blue-600";
      case "warning":
        return "text-amber-600";
      case "action":
        return "text-red-600";
      case "opportunity":
        return "text-green-600";
      default:
        return "text-slate-600";
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-5 h-5 text-indigo-600" />
        <h3 className="font-black text-slate-900">Aligned Advisor</h3>
      </div>

      {/* Insights cards */}
      <div className="space-y-3">
        {insights.length > 0 ? (
          insights.map((insight) => (
            <div
              key={insight.id}
              className={`p-4 rounded-xl border-2 transition-all duration-300 ${getInsightColors(insight.type)}`}
            >
              <div className="flex gap-3">
                <div className={`flex-shrink-0 mt-0.5 ${getIconColor(insight.type)}`}>
                  {insight.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black uppercase tracking-wide mb-1">
                    {insight.title}
                  </p>
                  <p className="text-xs font-medium leading-relaxed mb-2 opacity-90">
                    {insight.description}
                  </p>
                  {insight.actionLabel && (
                    <button
                      onClick={insight.actionCallback}
                      className="text-xs font-bold hover:underline transition-colors"
                    >
                      → {insight.actionLabel}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-4 rounded-xl border-2 border-green-200 bg-green-50 text-green-900">
            <p className="text-xs font-black uppercase tracking-wide mb-1">All Set! ✨</p>
            <p className="text-xs font-medium opacity-90">
              Your events are well-organized with good platform coverage and promotion schedules.
            </p>
          </div>
        )}
      </div>

      {/* Stats footer */}
      <div className="pt-4 border-t border-slate-200 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-slate-600">Upcoming Events</span>
          <span className="font-bold text-slate-900">{stats.upcomingCount}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-600">Connected Platforms</span>
          <span className="font-bold text-slate-900">{stats.connectedPlatforms}/3</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-600">Scheduled Promotions</span>
          <span className="font-bold text-slate-900">{stats.scheduledPromotions}</span>
        </div>
        {stats.failedSyncs > 0 && (
          <div className="flex items-center justify-between pt-2 border-t border-amber-200">
            <span className="text-amber-700">Failed Syncs</span>
            <span className="font-bold text-amber-700">{stats.failedSyncs}</span>
          </div>
        )}
      </div>
    </div>
  );
}
