import { Sparkles, TrendingUp, ArrowRight } from "lucide-react";

interface NewsItem {
  emoji: string;
  title: string;
  stat: string;
  detail: string;
}

export function GoodNews() {
  const news: NewsItem[] = [
    {
      emoji: "🚀",
      title: "Best Performer",
      stat: "Client Testimonial Reel",
      detail: "3.2K likes · 156 shares",
    },
    {
      emoji: "📈",
      title: "Trending Up",
      stat: "+45% reach this week",
      detail: "Video content leading growth",
    },
    {
      emoji: "⭐",
      title: "New Milestone",
      stat: "100K total followers",
      detail: "Across all platforms",
    },
  ];

  return (
    <div className="mb-12 bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-600 rounded-2xl p-6 text-white relative overflow-hidden">
      {/* Glassmorphism backdrop effect */}
      <div className="absolute inset-0 bg-white/10 backdrop-blur-xl rounded-2xl -z-10"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -z-10"></div>

      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-lg bg-lime-400/20 backdrop-blur flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-lime-300" />
        </div>
        <h2 className="text-2xl font-black">Good News 🎉</h2>
      </div>

      <p className="text-white/80 text-sm mb-2 max-w-2xl">
        Your content is resonating. Here's what's performing best this week.
      </p>
      <p className="text-xs font-medium text-blue-100/70 mb-6">
        POSTD Summary — Updated Today · Powered by Advisor
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {news.map((item, idx) => (
          <div
            key={idx}
            className="group bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 hover:bg-white/15 hover:border-white/30 transition-all duration-300 cursor-pointer"
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-2xl">{item.emoji}</span>
              <TrendingUp className="w-4 h-4 text-lime-300 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-white/70 text-xs font-medium mb-1">{item.title}</p>
            <p className="text-white font-bold mb-2">{item.stat}</p>
            <p className="text-white/60 text-xs">{item.detail}</p>
          </div>
        ))}
      </div>

      <button className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-lime-400 text-indigo-950 font-bold text-sm rounded-lg hover:bg-lime-300 transition-all duration-200 hover:scale-105 active:scale-95">
        View Full Report
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
