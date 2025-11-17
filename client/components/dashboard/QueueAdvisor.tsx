import { AlertCircle, CheckCircle2, Clock, Zap } from "lucide-react";
import { useState } from "react";

export function QueueAdvisor() {
  const [isBulkReviewing, setIsBulkReviewing] = useState(false);

  const handleBulkReview = () => {
    setIsBulkReviewing(true);
    setTimeout(() => setIsBulkReviewing(false), 2000);
  };

  return (
    <div className="bg-white/50 backdrop-blur-xl rounded-2xl p-6 border border-white/60 hover:bg-white/70 hover:shadow-md transition-all duration-300 relative overflow-hidden">
      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/40 via-blue-50/20 to-transparent rounded-2xl -z-10"></div>

      <div className="relative">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-indigo-200/40">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-lime-200/50 to-green-200/40 backdrop-blur flex items-center justify-center border border-lime-300/50">
            <Zap className="w-4 h-4 text-lime-600" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">Queue Advisor</h3>
            <p className="text-xs text-slate-500 font-medium">Workflow optimization</p>
          </div>
        </div>

        {/* Pending Approvals Alert */}
        <div className="mb-6 p-4 rounded-lg bg-gradient-to-br from-orange-50/40 to-yellow-50/20 border border-orange-200/40 hover:border-orange-300/60 transition-all duration-300">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              <div className="w-6 h-6 rounded-full bg-orange-400/20 flex items-center justify-center">
                <AlertCircle className="w-4 h-4 text-orange-600" />
              </div>
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-slate-900 text-sm mb-1">
                Pending Approvals Bottleneck
              </h4>
              <p className="text-slate-700 text-sm font-semibold mb-2">
                <span className="text-orange-600 font-black">4 posts</span> awaiting approval
              </p>
              <p className="text-slate-600 text-xs leading-relaxed mb-3">
                Review and approve these posts to keep your content calendar on track. Average wait time is 12 hours.
              </p>
              <button
                onClick={handleBulkReview}
                disabled={isBulkReviewing}
                className="w-full px-3 py-2 rounded-lg bg-orange-100 hover:bg-orange-200 disabled:bg-orange-100 text-orange-700 font-bold text-xs transition-all duration-200 hover:translate-y-[-1px] active:translate-y-[1px]"
              >
                {isBulkReviewing ? "Opening Review Panel..." : "Bulk Review Now"}
              </button>
            </div>
          </div>
        </div>

        {/* Caption Update Alert */}
        <div className="mb-6 p-4 rounded-lg bg-gradient-to-br from-blue-50/40 to-cyan-50/20 border border-blue-200/40 hover:border-blue-300/60 transition-all duration-300">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              <div className="w-6 h-6 rounded-full bg-blue-400/20 flex items-center justify-center">
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-slate-900 text-sm mb-1">
                Brand Voice Update Required
              </h4>
              <p className="text-slate-700 text-sm font-semibold mb-2">
                <span className="text-blue-600 font-black">2 scheduled posts</span> need caption updates
              </p>
              <p className="text-slate-600 text-xs leading-relaxed">
                Your brand voice guidelines were updated yesterday. These scheduled posts should be aligned before publishing.
              </p>
              <div className="mt-3 space-y-2">
                <p className="text-xs text-slate-600 font-medium">Affected posts:</p>
                <ul className="text-xs text-slate-600 space-y-1">
                  <li>• "Introducing New Features" (LinkedIn - Nov 22)</li>
                  <li>• "Weekly Tips" (Twitter - Nov 21)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Optimization Opportunities */}
        <div className="space-y-3">
          <h4 className="font-bold text-slate-900 text-sm">Optimization Tips</h4>

          <div className="group p-3 rounded-lg bg-gradient-to-br from-green-50/40 to-emerald-50/20 border border-green-200/40 hover:border-green-300/60 transition-all duration-300 cursor-pointer hover:shadow-sm">
            <div className="flex items-start gap-2">
              <span className="text-sm flex-shrink-0 mt-0.5">✅</span>
              <div className="flex-1">
                <p className="text-slate-900 font-semibold text-xs">
                  Approve before 2 PM for same-day publishing
                </p>
                <p className="text-slate-600 text-xs mt-0.5">
                  Posts approved by 2 PM go live during peak hours
                </p>
              </div>
            </div>
          </div>

          <div className="group p-3 rounded-lg bg-gradient-to-br from-purple-50/40 to-pink-50/20 border border-purple-200/40 hover:border-purple-300/60 transition-all duration-300 cursor-pointer hover:shadow-sm">
            <div className="flex items-start gap-2">
              <span className="text-sm flex-shrink-0 mt-0.5">📊</span>
              <div className="flex-1">
                <p className="text-slate-900 font-semibold text-xs">
                  Add preview images to boost approvals
                </p>
                <p className="text-slate-600 text-xs mt-0.5">
                  Posts with images get approved 40% faster
                </p>
              </div>
            </div>
          </div>

          <div className="group p-3 rounded-lg bg-gradient-to-br from-indigo-50/40 to-blue-50/20 border border-indigo-200/40 hover:border-indigo-300/60 transition-all duration-300 cursor-pointer hover:shadow-sm">
            <div className="flex items-start gap-2">
              <span className="text-sm flex-shrink-0 mt-0.5">🚀</span>
              <div className="flex-1">
                <p className="text-slate-900 font-semibold text-xs">
                  Batch similar posts together
                </p>
                <p className="text-slate-600 text-xs mt-0.5">
                  Reviewing posts by campaign reduces context switching
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
