import { PlatformMetrics } from "@/types/analytics";
import { TrendingUp, TrendingDown, Eye, Heart, Users } from "lucide-react";
import { useState } from "react";

interface PlatformMetricsCarouselProps {
  platform: PlatformMetrics;
}

export function PlatformMetricsCarousel({ platform }: PlatformMetricsCarouselProps) {
  const [activeMetric, setActiveMetric] = useState(0);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const formatChange = (change: number) => {
    const isPositive = change >= 0;
    return {
      text: `${isPositive ? "+" : ""}${change}%`,
      color: isPositive ? "text-green-600" : "text-red-600",
      icon: isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />,
    };
  };

  const metricsData = [
    {
      id: "reach",
      label: "Reach",
      value: formatNumber(platform.metrics.reach),
      change: platform.comparison?.reachChange || 0,
      icon: <Eye className="w-6 h-6" />,
      color: "from-blue-500/20 to-blue-600/20",
      borderColor: "border-blue-300/50",
    },
    {
      id: "engagement",
      label: "Engagement",
      value: formatNumber(platform.metrics.engagement),
      change: platform.comparison?.engagementChange || 0,
      icon: <Heart className="w-6 h-6" />,
      color: "from-pink-500/20 to-pink-600/20",
      borderColor: "border-pink-300/50",
    },
    {
      id: "followers",
      label: "Followers",
      value: formatNumber(platform.metrics.followers),
      change: platform.comparison?.followerChange || 0,
      icon: <Users className="w-6 h-6" />,
      color: "from-purple-500/20 to-purple-600/20",
      borderColor: "border-purple-300/50",
    },
    {
      id: "rate",
      label: "Engagement Rate",
      value: `${platform.metrics.engagementRate.toFixed(1)}%`,
      change: 0,
      icon: <TrendingUp className="w-6 h-6" />,
      color: "from-emerald-500/20 to-emerald-600/20",
      borderColor: "border-emerald-300/50",
    },
  ];

  const currentMetric = metricsData[activeMetric];
  const changeInfo = formatChange(currentMetric.change);

  return (
    <div className="space-y-4">
      {/* Platform Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{platform.icon}</span>
          <div>
            <h3 className="text-lg font-black text-slate-900">
              {platform.platform.charAt(0).toUpperCase() + platform.platform.slice(1)}
            </h3>
            <p className="text-xs text-slate-600 font-medium">{platform.period}</p>
          </div>
        </div>
      </div>

      {/* Carousel Card */}
      <div className={`bg-gradient-to-br ${currentMetric.color} border ${currentMetric.borderColor} backdrop-blur-xl rounded-2xl p-6 sm:p-8 transition-all duration-300`}>
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-white/40 backdrop-blur flex items-center justify-center text-slate-700">
              {currentMetric.icon}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                {currentMetric.label}
              </p>
              <p className="text-3xl sm:text-4xl font-black text-slate-900 mt-1">
                {currentMetric.value}
              </p>
            </div>
          </div>

          {currentMetric.id !== "rate" && (
            <div className={`text-right ${changeInfo.color}`}>
              <div className="flex items-center gap-1 justify-end">
                {changeInfo.icon}
                <p className="text-sm font-black">{changeInfo.text}</p>
              </div>
              <p className="text-xs font-medium text-slate-600 mt-1">
                vs {platform.comparison?.period || "last period"}
              </p>
            </div>
          )}
        </div>

        {/* Mini Sparkline visualization */}
        <div className="w-full h-1 bg-white/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-slate-400 to-slate-600 rounded-full"
            style={{ width: `${Math.min((parseFloat(currentMetric.value) / 100000) * 100, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Metric Selector Dots */}
      <div className="flex justify-center gap-2">
        {metricsData.map((metric, idx) => (
          <button
            key={metric.id}
            onClick={() => setActiveMetric(idx)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              idx === activeMetric
                ? "bg-slate-900 w-8"
                : "bg-slate-300 hover:bg-slate-400"
            }`}
            title={metric.label}
          />
        ))}
      </div>

      {/* Top Content Section */}
      {platform.metrics.topContent.length > 0 && (
        <div className="mt-6 pt-6 border-t border-slate-200">
          <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">
            Top Performing Content
          </p>
          <div className="space-y-2">
            {platform.metrics.topContent.slice(0, 3).map((content, idx) => (
              <div
                key={idx}
                className="flex items-start justify-between p-3 rounded-lg bg-white/50 hover:bg-white/70 border border-slate-200 transition-all duration-200"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm">{content.icon}</span>
                    <p className="text-sm font-bold text-slate-900 line-clamp-1">
                      {content.title}
                    </p>
                  </div>
                  <p className="text-xs text-slate-600 font-medium">
                    {content.reach.toLocaleString()} reach · {content.engagement} engagement
                  </p>
                </div>
                <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                  <TrendingUp className="w-3 h-3 text-green-600" />
                  <span className="text-xs font-bold text-green-600">+{content.engagement}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
