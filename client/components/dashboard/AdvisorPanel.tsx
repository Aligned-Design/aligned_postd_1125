import { Sparkles } from "lucide-react";

interface InsightItem {
  emoji: string;
  title: string;
  detail: string;
  highlight: string;
}

export function AdvisorPanel() {
  const insights: InsightItem[] = [
    {
      emoji: "💡",
      title: "Best Time to Post",
      detail: "9:00 AM on Thursdays",
      highlight: "+23% engagement",
    },
    {
      emoji: "📈",
      title: "Top Performing Topic",
      detail: "Behind-the-scenes content",
      highlight: "45K avg reach",
    },
    {
      emoji: "⚡",
      title: "Quick Win",
      detail: "Video posts outperform static",
      highlight: "3.2x more engagement",
    },
    {
      emoji: "🔄",
      title: "Reshare Strategy",
      detail: "Top 3 posts from last month",
      highlight: "Generate scheduler",
    },
  ];

  return (
    <div className="bg-white/50 backdrop-blur-xl rounded-2xl p-6 border border-indigo-200/50 hover:border-indigo-300/60 hover:shadow-md transition-all duration-300 relative overflow-hidden">
      {/* Glassmorphism gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/40 via-blue-50/20 to-transparent rounded-2xl -z-10"></div>

      <div className="relative flex items-center gap-4 mb-6 pb-4 border-b border-indigo-200/40">
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-300/40 to-blue-300/30 backdrop-blur flex items-center justify-center border border-indigo-300/50 shadow-md">
          <Sparkles className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h3 className="text-lg font-black text-slate-900">Advisor</h3>
          <p className="text-xs text-slate-600 font-medium">Insights and recommendations</p>
        </div>
      </div>

      <div className="relative space-y-2">
        {insights.map((insight, idx) => (
          <div
            key={idx}
            className="group rounded-xl p-2.5 sm:p-3.5 bg-white/50 hover:bg-white/70 transition-all duration-300 border border-indigo-200/30 hover:border-indigo-300/50 cursor-pointer hover:shadow-sm"
          >
            <div className="flex items-start gap-2 sm:gap-3 mb-1.5 sm:mb-2.5">
              <span className="text-base sm:text-lg group-hover:scale-110 transition-transform duration-300 origin-center flex-shrink-0">{insight.emoji}</span>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-slate-900 text-xs sm:text-sm leading-tight">
                  {insight.title}
                </h4>
                <p className="text-slate-600 text-xs mt-0.5 sm:mt-1 font-medium line-clamp-1 sm:line-clamp-none">{insight.detail}</p>
              </div>
            </div>
            <div className="ml-5 sm:ml-7">
              <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1.5 rounded-lg bg-lime-500/15 border border-lime-400/60 shadow-sm shadow-lime-400/10 hover:bg-lime-500/20 hover:border-lime-400/80 transition-all duration-200">
                <span className="text-lime-700 font-bold text-xs capitalize line-clamp-1">{insight.highlight}</span>
              </span>
            </div>
          </div>
        ))}
      </div>

      <button className="relative w-full mt-6 py-2.5 rounded-lg bg-lime-400 hover:bg-lime-300 text-indigo-950 font-black text-sm shadow-md shadow-lime-400/20 hover:shadow-lg hover:shadow-lime-400/30 transition-all duration-200 hover:scale-105 active:scale-95">
        Get Weekly Brief →
      </button>
    </div>
  );
}
