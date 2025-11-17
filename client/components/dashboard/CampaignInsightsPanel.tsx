import { Sparkles, Zap, TrendingUp, RefreshCw, ArrowRight } from "lucide-react";

interface CampaignInsight {
  id: string;
  icon: string;
  title: string;
  description: string;
  action: string;
  actionType: "generate" | "extend" | "optimize" | "convert";
}

export function CampaignInsightsPanel() {
  const insights: CampaignInsight[] = [
    {
      id: "1",
      icon: "📅",
      title: "Schedule Gap Detected",
      description: "You have 2 open weeks with no campaigns scheduled. This is a great time to plan a new initiative.",
      action: "Fill Schedule",
      actionType: "generate",
    },
    {
      id: "2",
      icon: "📈",
      title: "Spring Season Opportunity",
      description: "Your engagement peaks in March based on past data. Last year's giveaway campaign outperformed 25% above average.",
      action: "Plan Spring Campaign",
      actionType: "generate",
    },
    {
      id: "3",
      icon: "🎯",
      title: "Best Performing Format",
      description: "Video content drives 3.2x more engagement than static posts. Consider including 2-3 Reels in your next campaign.",
      action: "View Recommendations",
      actionType: "optimize",
    },
    {
      id: "4",
      icon: "✨",
      title: "Content Reshuffle Idea",
      description: "Your top 3 posts from last month are still relevant. Reshare them strategically during slower engagement periods.",
      action: "Generate Scheduler",
      actionType: "optimize",
    },
  ];

  const getActionStyles = (type: CampaignInsight["actionType"]) => {
    const styles = {
      generate: "bg-indigo-600 hover:bg-indigo-700 text-white",
      extend: "bg-blue-600 hover:bg-blue-700 text-white",
      optimize: "bg-emerald-600 hover:bg-emerald-700 text-white",
      convert: "bg-amber-600 hover:bg-amber-700 text-white",
    };
    return styles[type];
  };

  return (
    <div className="bg-white/50 backdrop-blur-xl rounded-2xl p-6 border border-white/60 hover:bg-white/70 hover:shadow-md transition-all duration-300 relative overflow-hidden group">
      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/40 via-blue-50/20 to-transparent rounded-2xl -z-10"></div>

      {/* Header */}
      <div className="relative flex items-center justify-between mb-6 pb-4 border-b border-indigo-200/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-200/50 to-blue-200/40 backdrop-blur flex items-center justify-center border border-indigo-200/30 group-hover:scale-110 transition-transform duration-300">
            <Sparkles className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">AI Campaign Insights</h3>
            <p className="text-xs text-slate-500 font-medium">Smart recommendations for your strategy</p>
          </div>
        </div>
        <button className="p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-indigo-100">
          <RefreshCw className="w-4 h-4 text-indigo-600" />
        </button>
      </div>

      {/* Insights Grid */}
      <div className="relative space-y-3">
        {insights.map((insight, idx) => (
          <div
            key={insight.id}
            className="group/insight rounded-lg p-4 bg-gradient-to-br from-indigo-50/20 to-blue-50/10 hover:from-indigo-100/30 hover:to-blue-100/20 border border-indigo-200/20 hover:border-indigo-300/50 transition-all duration-300 cursor-pointer hover:shadow-sm animate-[fadeIn_300ms_ease-out] hover:translate-y-[-2px]"
            style={{
              animationDelay: `${idx * 80}ms`,
              animationFillMode: "both",
            }}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0 group-hover/insight:scale-110 transition-transform duration-300 mt-0.5">
                {insight.icon}
              </span>
              <div className="flex-1 min-w-0">
                <h4 className="font-black text-slate-900 text-sm leading-tight mb-1">
                  {insight.title}
                </h4>
                <p className="text-slate-600 text-xs font-medium line-clamp-2 mb-3">
                  {insight.description}
                </p>
                <button
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-xs transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105 active:scale-95 ${getActionStyles(
                    insight.actionType
                  )}`}
                >
                  {insight.action}
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom CTA */}
      <button className="relative w-full mt-4 py-2 rounded-lg bg-lime-400 hover:bg-lime-300 text-indigo-950 font-bold text-xs shadow-md shadow-lime-400/20 hover:shadow-lg hover:shadow-lime-400/30 transition-all duration-200 hover:scale-105 active:scale-95">
        Get Personalized Ideas
      </button>
    </div>
  );
}
