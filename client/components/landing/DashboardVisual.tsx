import {
  Calendar,
  BarChart3,
  CheckCircle,
  Zap,
  Clock,
  TrendingUp,
} from "lucide-react";

export function DashboardVisual() {
  return (
    <div className="relative w-full h-full min-h-[400px] flex items-center justify-center">
      {/* Luxury outer glow ring with animation */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-300/25 via-indigo-200/15 to-transparent rounded-3xl blur-3xl animate-pulse-glow"></div>

      {/* Additional ambient lighting */}
      <div
        className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-200/20 rounded-full blur-3xl animate-float-soft"
        style={{ animationDelay: "1s" }}
      ></div>

      {/* Main dashboard card with premium styling */}
      <div className="relative w-full max-w-md bg-white/85 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-indigo-300/40 border border-white/70 overflow-hidden hover:shadow-3xl hover:border-white/80 transition-all duration-300 group">
        {/* Header gradient bar */}
        <div className="h-1.5 bg-gradient-to-r from-indigo-600 via-purple-500 to-indigo-400"></div>

        {/* Dashboard content */}
        <div className="p-6 space-y-4">
          {/* Dashboard header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Content Dashboard
              </p>
              <p className="text-lg font-black text-slate-900">
                Today's Postd
              </p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-black text-sm">
              Z
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Scheduled posts */}
            <div className="bg-indigo-50/50 backdrop-blur-sm rounded-lg p-3 border border-indigo-300/50 hover:border-indigo-400/70 hover:bg-indigo-50/80 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-indigo-700">
                  Scheduled
                </span>
              </div>
              <p className="text-2xl font-black text-indigo-900">12</p>
              <p className="text-xs text-indigo-600">posts queued</p>
            </div>

            {/* Performance */}
            <div className="bg-emerald-50/50 backdrop-blur-sm rounded-lg p-3 border border-emerald-300/50 hover:border-emerald-400/70 hover:bg-emerald-50/80 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-emerald-700">
                  Performance
                </span>
              </div>
              <p className="text-2xl font-black text-emerald-900">+28%</p>
              <p className="text-xs text-emerald-600">engagement ↑</p>
            </div>

            {/* Pending approvals */}
            <div className="bg-amber-50/50 backdrop-blur-sm rounded-lg p-3 border border-amber-300/50 hover:border-amber-400/70 hover:bg-amber-50/80 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-bold text-amber-700">
                  Approvals
                </span>
              </div>
              <p className="text-2xl font-black text-amber-900">3</p>
              <p className="text-xs text-amber-600">awaiting review</p>
            </div>

            {/* Next publish */}
            <div className="bg-purple-50/50 backdrop-blur-sm rounded-lg p-3 border border-purple-300/50 hover:border-purple-400/70 hover:bg-purple-50/80 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-bold text-purple-700">
                  Next Post
                </span>
              </div>
              <p className="text-sm font-black text-purple-900">in 45m</p>
              <p className="text-xs text-purple-600">auto-publish</p>
            </div>
          </div>

          {/* Mini insight bar with glassmorphism */}
          <div className="bg-lime-50/50 backdrop-blur-sm rounded-lg p-3 border border-lime-300/50 hover:border-lime-400/70 hover:bg-lime-50/80 transition-all group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-600 group-hover:text-slate-800 transition-colors mb-1">
                  💡 Smart Insight
                </p>
                <p className="text-xs text-slate-700 group-hover:text-slate-900 transition-colors">
                  Best time to post: 2-4 PM EST
                </p>
              </div>
              <Zap className="w-4 h-4 text-lime-500 group-hover:text-lime-600 transition-colors flex-shrink-0" />
            </div>
          </div>

          {/* Footer action hint */}
          <div className="pt-2 border-t border-slate-200/50 text-center">
            <p className="text-xs font-medium text-slate-500">
              Managed across 5 brands • All in one place
            </p>
          </div>
        </div>
      </div>

      {/* Floating accent cards (desktop only) */}
      <div className="hidden md:block absolute -bottom-4 -right-8 w-40 h-32 bg-white/40 backdrop-blur-lg rounded-xl shadow-lg border border-white/60 p-4 transform rotate-3">
        <p className="text-xs font-bold text-slate-700 mb-2">
          Content Pipeline
        </p>
        <div className="space-y-2">
          <div className="h-2 bg-indigo-200 rounded-full"></div>
          <div className="h-2 bg-indigo-300 rounded-full w-4/5"></div>
          <div className="h-2 bg-indigo-400 rounded-full w-3/5"></div>
        </div>
      </div>

      <div className="hidden md:block absolute -top-6 -left-12 w-36 h-28 bg-white/40 backdrop-blur-lg rounded-xl shadow-lg border border-white/60 p-4 transform -rotate-2">
        <p className="text-xs font-bold text-slate-700 mb-3">Brand Voices</p>
        <div className="flex gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
            A
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-xs font-bold text-white">
            B
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-xs font-bold text-white">
            C
          </div>
        </div>
      </div>
    </div>
  );
}
