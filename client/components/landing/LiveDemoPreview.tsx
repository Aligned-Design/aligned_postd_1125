import { Calendar, TrendingUp, CheckCircle, Zap } from "lucide-react";
import { useEffect, useState } from "react";

export function LiveDemoPreview() {
  // Use initial state instead of setState in effect
  const [isAnimating] = useState(true);
  const [displayedStats, setDisplayedStats] = useState({
    posts: 0,
    engagement: 0,
    approvals: 0,
  });

  // Animate stats counting up
  useEffect(() => {
    if (!isAnimating) return;

    const intervals = [
      setInterval(() => {
        setDisplayedStats((prev) => ({
          ...prev,
          posts: Math.min(prev.posts + 2, 12),
        }));
      }, 50),
      setInterval(() => {
        setDisplayedStats((prev) => ({
          ...prev,
          engagement: Math.min(prev.engagement + 1, 28),
        }));
      }, 80),
      setInterval(() => {
        setDisplayedStats((prev) => ({
          ...prev,
          approvals: Math.min(prev.approvals + 1, 5),
        }));
      }, 120),
    ];

    return () => intervals.forEach(clearInterval);
  }, [isAnimating]);

  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 md:px-8 bg-gradient-to-b from-white via-slate-50/20 to-white relative overflow-hidden">
      {/* Premium background with animated orbs */}
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-10 right-0 w-96 h-96 bg-indigo-200/25 rounded-full blur-3xl animate-gradient-shift"></div>
        <div
          className="absolute bottom-0 left-1/4 w-80 h-80 bg-slate-200/15 rounded-full blur-3xl animate-pulse-glow"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute top-1/2 right-1/3 w-64 h-64 bg-indigo-100/15 rounded-full blur-3xl animate-float-soft"
          style={{ animationDelay: "2s" }}
        ></div>
        {/* Light reflection */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-white/10"></div>
      </div>

      <div className="max-w-5xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-12">
          <div className="inline-block mb-4 px-4 py-2 bg-indigo-100 rounded-full border border-indigo-200">
            <p className="text-sm font-bold text-indigo-700">🎬 Live Demo</p>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 mb-4 leading-tight">
            See Postd in Action
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            This is your dashboard. Everything visible, everything organized,
            everything working for you.
          </p>
        </div>

        {/* Dashboard mockup */}
        <div className="relative">
          {/* Outer frame glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-300/20 to-transparent rounded-3xl blur-2xl -z-10"></div>

          <div className="bg-white/80 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-indigo-300/30 border border-white/70 overflow-hidden hover:shadow-3xl hover:border-white/80 transition-all duration-300 group">
            {/* Header bar */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 md:px-8 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white/80 uppercase tracking-wider">
                    Content Dashboard
                  </p>
                  <p className="text-sm font-black text-white">
                    Your Postd Week
                  </p>
                </div>
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white font-black border border-white/30">
                  Z
                </div>
              </div>
            </div>

            {/* Content area */}
            <div className="p-6 md:p-8 space-y-6">
              {/* Stats grid */}
              <div className="grid grid-cols-3 gap-4">
                {/* Scheduled posts */}
                <div
                  className={`bg-gradient-to-br from-indigo-50/60 to-indigo-100/40 backdrop-blur-sm rounded-xl p-4 border border-indigo-300/50 hover:border-indigo-400/70 hover:bg-indigo-50/80 transition-all duration-500 group ${
                    isAnimating ? "scale-100 opacity-100" : "scale-90 opacity-0"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-4 h-4 text-indigo-600 group-hover:text-indigo-700 transition-colors" />
                    <span className="text-xs font-bold text-indigo-700 group-hover:text-indigo-900 transition-colors">
                      Scheduled
                    </span>
                  </div>
                  <p className="text-3xl font-black text-indigo-900 group-hover:text-indigo-950 transition-colors">
                    {displayedStats.posts}
                  </p>
                  <p className="text-xs text-indigo-600 group-hover:text-indigo-700 transition-colors mt-1">
                    posts queued
                  </p>
                </div>

                {/* Engagement */}
                <div
                  className={`bg-gradient-to-br from-emerald-50/60 to-emerald-100/40 backdrop-blur-sm rounded-xl p-4 border border-emerald-300/50 hover:border-emerald-400/70 hover:bg-emerald-50/80 transition-all duration-500 group ${
                    isAnimating ? "scale-100 opacity-100" : "scale-90 opacity-0"
                  }`}
                  style={{ transitionDelay: "100ms" }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-4 h-4 text-emerald-600 group-hover:text-emerald-700 transition-colors" />
                    <span className="text-xs font-bold text-emerald-700 group-hover:text-emerald-900 transition-colors">
                      Engagement
                    </span>
                  </div>
                  <p className="text-3xl font-black text-emerald-900 group-hover:text-emerald-950 transition-colors">
                    +{displayedStats.engagement}%
                  </p>
                  <p className="text-xs text-emerald-600 group-hover:text-emerald-700 transition-colors mt-1">
                    week over week
                  </p>
                </div>

                {/* Approvals */}
                <div
                  className={`bg-gradient-to-br from-purple-50/60 to-purple-100/40 backdrop-blur-sm rounded-xl p-4 border border-purple-300/50 hover:border-purple-400/70 hover:bg-purple-50/80 transition-all duration-500 group ${
                    isAnimating ? "scale-100 opacity-100" : "scale-90 opacity-0"
                  }`}
                  style={{ transitionDelay: "200ms" }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-4 h-4 text-purple-600 group-hover:text-purple-700 transition-colors" />
                    <span className="text-xs font-bold text-purple-700 group-hover:text-purple-900 transition-colors">
                      Approvals
                    </span>
                  </div>
                  <p className="text-3xl font-black text-purple-900 group-hover:text-purple-950 transition-colors">
                    {displayedStats.approvals}
                  </p>
                  <p className="text-xs text-purple-600 group-hover:text-purple-700 transition-colors mt-1">
                    awaiting review
                  </p>
                </div>
              </div>

              {/* Mini activity feed */}
              <div
                className={`bg-white/40 backdrop-blur-sm rounded-xl p-4 border border-slate-300/50 hover:border-slate-400/70 hover:bg-white/60 transition-all duration-700 group ${
                  isAnimating ? "opacity-100" : "opacity-0"
                }`}
                style={{ transitionDelay: "400ms" }}
              >
                <p className="text-xs font-bold text-slate-600 group-hover:text-slate-800 transition-colors mb-3 uppercase tracking-wider">
                  📋 This Week's Activity
                </p>
                <div className="space-y-2">
                  {[
                    "Monday: 3 posts scheduled",
                    "Wednesday: Client approved campaign",
                    "Friday: Auto-report sent to clients",
                  ].map((activity, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-2 text-sm text-slate-700 group-hover:text-slate-900 transition-all duration-500 ${
                        isAnimating
                          ? "translate-x-0 opacity-100"
                          : "-translate-x-4 opacity-0"
                      }`}
                      style={{
                        transitionDelay: isAnimating
                          ? `${500 + idx * 100}ms`
                          : "0ms",
                      }}
                    >
                      <Zap className="w-4 h-4 text-lime-500 flex-shrink-0 group-hover:text-lime-600 transition-colors" />
                      {activity}
                    </div>
                  ))}
                </div>
              </div>

              {/* Zia insight card */}
              <div
                className={`bg-gradient-to-r from-lime-50 to-indigo-50 rounded-xl p-4 border border-lime-200/40 transition-all duration-700 flex items-start gap-3 ${
                  isAnimating
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-4"
                }`}
                style={{ transitionDelay: "700ms" }}
              >
                <div className="text-2xl flex-shrink-0">🦓</div>
                <div>
                  <p className="text-xs font-bold text-slate-700 mb-1">
                    Zia's Smart Tip
                  </p>
                  <p className="text-sm text-slate-700">
                    "Your best posting time is 2-4 PM EST. I've scheduled 3
                    posts for Monday during that window."
                  </p>
                </div>
              </div>
            </div>

            {/* Footer hint */}
            <div className="bg-slate-50 border-t border-slate-200/50 px-6 md:px-8 py-4">
              <p className="text-xs font-medium text-slate-500 text-center">
                ✨ All your brands, integrated. All your approvals, streamlined.
                All your time, reclaimed.
              </p>
            </div>
          </div>
        </div>

        {/* CTA below demo */}
        <div className="mt-8 text-center">
          <p className="text-slate-600 text-sm md:text-base mb-4">
            Ready to see this in your workspace?
          </p>
          <div className="flex items-center justify-center gap-4">
            <a
              href="#interactive-demo"
              className="px-8 py-3 bg-lime-400 hover:bg-lime-300 text-indigo-950 font-black rounded-xl transition-all shadow-lg shadow-lime-400/30 hover:shadow-xl inline-flex items-center gap-2"
            >
              Try Interactive Demo
              <Zap className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
