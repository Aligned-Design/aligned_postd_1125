import { Campaign, CAMPAIGN_GOAL_ICONS, CAMPAIGN_STATUS_COLORS } from "@/types/campaign";
import { MoreVertical, Calendar, Users, Target, TrendingUp } from "lucide-react";
import { useState } from "react";

interface CampaignCardProps {
  campaign: Campaign;
  onEdit?: (campaign: Campaign) => void;
  onDelete?: (id: string) => void;
}

export function CampaignCard({ campaign, onEdit, onDelete }: CampaignCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getDaysRemaining = (endDate: string) => {
    const today = new Date();
    const end = new Date(endDate);
    const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const statusBgColor = CAMPAIGN_STATUS_COLORS[campaign.status] || CAMPAIGN_STATUS_COLORS.draft;
  const goalIcon = CAMPAIGN_GOAL_ICONS[campaign.goal] || "📌";
  const daysRemaining = getDaysRemaining(campaign.endDate);

  return (
    <div className="group bg-white/50 backdrop-blur-xl rounded-xl border border-white/60 hover:bg-white/70 hover:shadow-md hover:border-white/80 transition-all duration-300 overflow-hidden">
      {/* Header with gradient accent */}
      <div className="h-1 bg-gradient-to-r from-indigo-500 via-blue-500 to-indigo-500"></div>

      <div className="p-4 sm:p-5 relative">
        {/* Top row: Title + Menu */}
        <div className="flex items-start justify-between mb-3 gap-2">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <span className="text-lg flex-shrink-0 mt-0.5">{goalIcon}</span>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-black text-slate-900 line-clamp-2">
                {campaign.name}
              </h3>
            </div>
          </div>

          <div className="relative flex-shrink-0">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-slate-100"
            >
              <MoreVertical className="w-4 h-4 text-slate-500" />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 min-w-max">
                <button
                  onClick={() => {
                    onEdit?.(campaign);
                    setShowMenu(false);
                  }}
                  className="block w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 border-b border-slate-100"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    onDelete?.(campaign.id);
                    setShowMenu(false);
                  }}
                  className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {campaign.description && (
          <p className="text-xs text-slate-600 mb-3 line-clamp-2">
            {campaign.description}
          </p>
        )}

        {/* Badges row */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-bold ${statusBgColor}`}>
            {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-100/50 border border-indigo-300/50 text-indigo-700 text-xs font-bold">
            {campaign.goal
              .split("-")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ")}
          </span>
          {campaign.postCount && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-lime-100/50 border border-lime-300/50 text-lime-700 text-xs font-bold">
              {campaign.postCount} Posts
            </span>
          )}
        </div>

        {/* Performance bar for active/completed campaigns */}
        {(campaign.status === "active" || campaign.status === "completed") &&
          campaign.performance && (
            <div className="mb-4 pb-4 border-t border-slate-200">
              <div className="flex items-center justify-between mb-2 mt-4">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Performance
                </span>
                {campaign.performance.performancePercent && (
                  <span className="text-xs font-black text-green-600">
                    +{campaign.performance.performancePercent}%
                  </span>
                )}
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-lime-400 to-lime-500 transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      (campaign.performance.performancePercent || 50) * 2,
                      100
                    )}%`,
                  }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-slate-500 mt-2 font-medium">
                <span>Reach: {(campaign.performance.reach / 1000).toFixed(1)}K</span>
                <span>Engagement: {campaign.performance.engagement.toFixed(1)}%</span>
              </div>
            </div>
          )}

        {/* Info row: Dates + Post count */}
        <div className="flex items-center justify-between text-xs text-slate-600 mb-3 pt-3 border-t border-slate-200">
          <div className="flex items-center gap-2">
            <Calendar className="w-3 h-3" />
            <span className="font-medium">
              {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}
            </span>
          </div>
          {campaign.status === "active" && (
            <span className="font-bold text-green-600">
              {daysRemaining > 0 ? `${daysRemaining}d left` : "Ending soon"}
            </span>
          )}
        </div>

        {/* Content Distribution Breakdown */}
        {campaign.contentDistribution && campaign.contentDistribution.length > 0 && (
          <div className="mb-3 pt-3 border-t border-slate-200">
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Content Breakdown</p>
            <div className="grid grid-cols-2 gap-2">
              {campaign.contentDistribution
                .filter((c) => c.count > 0)
                .slice(0, 4)
                .map((item) => (
                  <div
                    key={item.id}
                    className="p-2 rounded-lg bg-slate-50/80 border border-slate-200"
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-sm">{item.icon}</span>
                      <span className="text-xs font-bold text-slate-700 line-clamp-1">
                        {item.label}
                      </span>
                    </div>
                    <p className="text-sm font-black text-indigo-600">{item.count}</p>
                  </div>
                ))}
            </div>
            {campaign.contentDistribution.filter((c) => c.count > 0).length > 4 && (
              <p className="text-xs text-slate-600 mt-2 font-medium">
                +{campaign.contentDistribution.filter((c) => c.count > 0).length - 4} more
              </p>
            )}
          </div>
        )}

        {/* Platforms row */}
        {campaign.targetPlatforms && campaign.targetPlatforms.length > 0 && (
          <div className="flex items-center gap-1.5">
            {campaign.targetPlatforms.map((platform) => (
              <div
                key={platform}
                className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-200/50 to-blue-200/50 border border-indigo-300/50 flex items-center justify-center text-xs font-bold text-indigo-700"
                title={platform}
              >
                {platform.charAt(0).toUpperCase()}
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        {campaign.status === "draft" && (
          <button className="w-full mt-4 px-3 py-2 rounded-lg bg-lime-400/20 border border-lime-400/60 text-lime-700 font-bold text-xs hover:bg-lime-400/30 transition-all duration-200">
            Continue Setup
          </button>
        )}
      </div>
    </div>
  );
}
