import { Sparkles, TrendingUp, Zap, RefreshCw } from "lucide-react";

interface Insight {
  id: string;
  icon: string;
  title: string;
  metric: string;
  cta?: string;
  style: "metric" | "text" | "action";
}

export function InsightsFeed() {
  const insights: Insight[] = [
    {
      id: "1",
      icon: "💡",
      title: "Best Time to Post",
      metric: "9 AM Thursday · +23% engagement",
      style: "metric",
    },
    {
      id: "2",
      icon: "📈",
      title: "Top Performing Topic",
      metric: "Behind-the-scenes content · 45K avg reach",
      style: "metric",
    },
    {
      id: "3",
      icon: "⚡",
      title: "Quick Win",
      metric: "Video posts → 3.2× more engagement",
      style: "text",
    },
    {
      id: "4",
      icon: "🔁",
      title: "Reshare Strategy",
      metric: "Top 3 posts from last month",
      cta: "Generate Scheduler",
      style: "action",
    },
  ];

  return (
    <div className="bg-white/50 backdrop-blur-xl rounded-2xl p-4 border border-white/60 hover:bg-white/70 hover:shadow-md transition-all duration-300 relative overflow-hidden h-full">
      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/40 via-blue-50/20 to-transparent rounded-2xl -z-10"></div>

      <div className="relative flex items-center gap-2 mb-4 pb-3 border-b border-indigo-200/40">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-200/50 to-blue-200/40 backdrop-blur flex items-center justify-center border border-indigo-200/30">
          <Sparkles className="w-4 h-4 text-indigo-600" />
        </div>
        <div>
          <h3 className="text-sm font-black text-slate-900">AI Insights</h3>
          <p className="text-xs text-slate-500 font-medium">Always-on strategist</p>
        </div>
      </div>

      <div className="relative space-y-2">
        {insights.map((insight, idx) => (
          <div
            key={insight.id}
            className="group rounded-lg p-2.5 bg-gradient-to-br from-indigo-50/20 to-blue-50/10 hover:from-indigo-100/30 hover:to-blue-100/20 border border-indigo-200/20 hover:border-indigo-300/50 transition-all duration-300 cursor-pointer hover:shadow-sm animate-[fadeIn_300ms_ease-out] hover:translate-y-[-1px]"
            style={{
              animationDelay: `${idx * 100}ms`,
              animationFillMode: "both",
            }}
          >
            <div className="flex items-start gap-2">
              <span className="text-xs group-hover:scale-110 transition-transform duration-300 flex-shrink-0 mt-0.5">
                {insight.icon}
              </span>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-slate-900 text-xs leading-tight mb-0.5">
                  {insight.title}
                </h4>
                {insight.style === "metric" && (
                  <p className="text-slate-600 text-xs font-medium line-clamp-2">
                    {insight.metric}
                  </p>
                )}
                {insight.style === "text" && (
                  <p className="text-slate-700 text-xs font-semibold">
                    {insight.metric}
                  </p>
                )}
                {insight.style === "action" && (
                  <div className="space-y-1.5 mt-1">
                    <p className="text-slate-600 text-xs font-medium line-clamp-1">
                      {insight.metric}
                    </p>
                    <button className="w-full px-1.5 py-1 rounded-md bg-lime-500/15 border border-lime-400/60 text-lime-700 font-bold text-xs hover:bg-lime-500/25 transition-all duration-200">
                      {insight.cta}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <button className="relative w-full mt-3 py-1.5 rounded-lg bg-lime-400 hover:bg-lime-300 text-indigo-950 font-bold text-xs shadow-md shadow-lime-400/20 hover:shadow-lg hover:shadow-lime-400/30 transition-all duration-200 hover:scale-105 active:scale-95">
        Get Weekly Brief →
      </button>
    </div>
  );
}
