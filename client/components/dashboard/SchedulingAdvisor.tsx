import { Sparkles, Zap, AlertCircle } from "lucide-react";
import { useState } from "react";

export function SchedulingAdvisor() {
  const [isAutoFilling, setIsAutoFilling] = useState(false);

  const handleAutoFill = () => {
    setIsAutoFilling(true);
    setTimeout(() => setIsAutoFilling(false), 2000);
  };

  return (
    <div className="bg-white/50 backdrop-blur-xl rounded-2xl p-6 border border-white/60 hover:bg-white/70 hover:shadow-md transition-all duration-300 relative overflow-hidden">
      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/40 via-blue-50/20 to-transparent rounded-2xl -z-10"></div>

      <div className="relative">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-indigo-200/40">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-lime-200/50 to-green-200/40 backdrop-blur flex items-center justify-center border border-lime-300/50">
            <Sparkles className="w-4 h-4 text-lime-600" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">Scheduling Advisor</h3>
            <p className="text-xs text-slate-500 font-medium">Insights and recommendations</p>
          </div>
        </div>

        {/* Best Engagement Window */}
        <div className="mb-6 p-4 rounded-lg bg-gradient-to-br from-lime-50/40 to-green-50/20 border border-lime-200/40 hover:border-lime-300/60 transition-all duration-300">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              <div className="w-6 h-6 rounded-full bg-lime-400/20 flex items-center justify-center">
                <span className="text-sm font-bold text-lime-600">📊</span>
              </div>
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-slate-900 text-sm mb-1">
                Your Best Engagement Window
              </h4>
              <p className="text-slate-700 text-sm font-semibold mb-2">
                <span className="text-lime-600 font-black">8–10 AM</span> this week
              </p>
              <p className="text-slate-600 text-xs leading-relaxed">
                Based on your audience's activity patterns, this time slot consistently gets 28% more engagement across platforms.
              </p>
            </div>
          </div>
        </div>

        {/* Open Days Alert */}
        <div className="mb-6 p-4 rounded-lg bg-gradient-to-br from-indigo-50/40 to-blue-50/20 border border-indigo-200/40 hover:border-indigo-300/60 transition-all duration-300">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              <div className="w-6 h-6 rounded-full bg-indigo-400/20 flex items-center justify-center">
                <AlertCircle className="w-4 h-4 text-indigo-600" />
              </div>
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-slate-900 text-sm mb-1">
                Open Days This Week
              </h4>
              <p className="text-slate-700 text-sm font-semibold mb-2">
                <span className="text-indigo-600 font-black">2 days</span> with no content scheduled
              </p>
              <p className="text-slate-600 text-xs leading-relaxed mb-3">
                Saturday and Sunday are wide open. You could fill these gaps with evergreen content or weekend engagement opportunities.
              </p>
              <button
                onClick={handleAutoFill}
                disabled={isAutoFilling}
                className="w-full px-3 py-2 rounded-lg bg-indigo-100 hover:bg-indigo-200 disabled:bg-indigo-100 text-indigo-700 font-bold text-xs transition-all duration-200 hover:translate-y-[-1px] active:translate-y-[1px]"
              >
                {isAutoFilling ? "Filling Open Dates..." : "Auto-fill Open Dates"}
              </button>
            </div>
          </div>
        </div>

        {/* Quick Tips */}
        <div className="space-y-3">
          <h4 className="font-bold text-slate-900 text-sm">Smart Tips</h4>

          <div className="group p-3 rounded-lg bg-gradient-to-br from-purple-50/40 to-pink-50/20 border border-purple-200/40 hover:border-purple-300/60 transition-all duration-300 cursor-pointer hover:shadow-sm">
            <div className="flex items-start gap-2">
              <span className="text-sm flex-shrink-0 mt-0.5">⚡</span>
              <div className="flex-1">
                <p className="text-slate-900 font-semibold text-xs">
                  Video posts drive 3.2× more engagement
                </p>
                <p className="text-slate-600 text-xs mt-0.5">
                  Reels and TikToks are your top performers
                </p>
              </div>
            </div>
          </div>

          <div className="group p-3 rounded-lg bg-gradient-to-br from-orange-50/40 to-yellow-50/20 border border-orange-200/40 hover:border-orange-300/60 transition-all duration-300 cursor-pointer hover:shadow-sm">
            <div className="flex items-start gap-2">
              <span className="text-sm flex-shrink-0 mt-0.5">🎯</span>
              <div className="flex-1">
                <p className="text-slate-900 font-semibold text-xs">
                  Hashtag strategy matters
                </p>
                <p className="text-slate-600 text-xs mt-0.5">
                  Adding 10+ hashtags increases reach by 40%
                </p>
              </div>
            </div>
          </div>

          <div className="group p-3 rounded-lg bg-gradient-to-br from-cyan-50/40 to-blue-50/20 border border-cyan-200/40 hover:border-cyan-300/60 transition-all duration-300 cursor-pointer hover:shadow-sm">
            <div className="flex items-start gap-2">
              <span className="text-sm flex-shrink-0 mt-0.5">🔄</span>
              <div className="flex-1">
                <p className="text-slate-900 font-semibold text-xs">
                  Republish top performers
                </p>
                <p className="text-slate-600 text-xs mt-0.5">
                  Your best posts from last month still work
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
