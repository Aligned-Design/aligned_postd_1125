import { ZiaMascot } from "@/components/dashboard/ZiaMascot";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { ZiaQuip } from "./ZiaPersonality";
import { ZIA_QUIPS } from "./ZiaPersonality.constants";
import {
  BrandChaosVisual,
  ApprovalBottleneckVisual,
  ManualOverloadVisual,
  ReportingFatigueVisual,
} from "./ProblemVisuals";

export function ProblemSection() {
  const { ref: contentRef, isVisible: contentVisible } = useScrollAnimation();
  const { ref: ziaRef, isVisible: ziaVisible } = useScrollAnimation();

  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 md:px-8 bg-gradient-to-b from-slate-50/60 via-white to-slate-50/40 relative overflow-hidden">
      {/* Premium background animation with multiple layers */}
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-slate-200/15 rounded-full blur-3xl animate-pulse-glow"></div>
        <div
          className="absolute bottom-0 left-1/4 w-72 h-72 bg-indigo-100/10 rounded-full blur-3xl animate-float-soft"
          style={{ animationDelay: "1s" }}
        ></div>
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-blue-100/10 rounded-full blur-3xl opacity-60"></div>
        {/* Light reflection overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-white/10"></div>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left: Text Content */}
          <div
            ref={contentRef}
            className={`transition-all duration-700 ${
              contentVisible
                ? "opacity-100 translate-x-0"
                : "opacity-0 -translate-x-12"
            }`}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 mb-4 leading-tight">
              You're behind. You're buried.
            </h2>

            <p className="text-lg sm:text-xl text-indigo-600 font-bold mb-6">
              In drafts. In DMs. In a dozen open Google Docs named "Final_v10".
            </p>

            <p className="text-base sm:text-lg text-slate-700 mb-8 leading-relaxed">
              You've got the vision. The voice. The brand everyone trusts. You
              just don't have the hours left to hold it all together.
            </p>

            <p className="text-base sm:text-lg text-slate-700 mb-8 leading-relaxed">
              Your marketing isn't the problem. Everything around it is. Too many tools. Too many logins. Too many "quick updates" that turn into a three-hour horse-ride into the abyss.
            </p>
            <p className="text-base sm:text-lg text-slate-700 mb-8 leading-relaxed">
              Postd brings everything together — your brand, your content, your approvals, your analytics — into one beautifully aligned home. Marketing, handled. (And yes, you can finally close those 14 tabs.)
            </p>

            <div className="space-y-4 hidden">
              <div className="flex gap-3">
                <span className="text-slate-900 font-bold text-lg">🎨</span>
                <div>
                  <p className="font-bold text-slate-900">Brand chaos</p>
                  <p className="text-sm text-slate-600">
                    Every client needs a different tone, style, voice—and
                    keeping them separate is a full-time job.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="text-slate-900 font-bold text-lg">⏸️</span>
                <div>
                  <p className="font-bold text-slate-900">
                    Approval bottlenecks
                  </p>
                  <p className="text-sm text-slate-600">
                    Clients ghost. Feedback arrives late. Revisions pile up.
                    Nothing ships on time.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="text-slate-900 font-bold text-lg">🔄</span>
                <div>
                  <p className="font-bold text-slate-900">Manual overload</p>
                  <p className="text-sm text-slate-600">
                    Content creation, scheduling, platform management—it's all
                    happening in different tabs and apps.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="text-slate-900 font-bold text-lg">📊</span>
                <div>
                  <p className="font-bold text-slate-900">Reporting fatigue</p>
                  <p className="text-sm text-slate-600">
                    Data everywhere. No story. Clients don't understand impact.
                    Neither do you.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Zia Quote with Mascot */}
          <div
            ref={ziaRef}
            className={`flex flex-col items-center justify-center gap-6 transition-all duration-700 ${
              ziaVisible
                ? "opacity-100 translate-x-0"
                : "opacity-0 translate-x-12"
            }`}
          >
            <ZiaMascot size="md" className="animate-float" />

            <blockquote className="bg-white/50 backdrop-blur-xl rounded-2xl border border-indigo-300/50 p-8 text-center max-w-xs shadow-xl shadow-indigo-200/30 hover:shadow-2xl hover:shadow-indigo-300/40 hover:border-indigo-400/70 hover:bg-white/60 transition-all group">
              <p className="text-base sm:text-lg font-medium text-slate-900 italic mb-3 group-hover:text-indigo-800 transition-colors leading-relaxed">
                "One system away from freedom, darling—and I've got the map."
              </p>
              <cite className="text-xs font-semibold text-slate-600 group-hover:text-slate-800 transition-colors not-italic">
                ✨ Zia
              </cite>
            </blockquote>
          </div>
        </div>

        {/* Mobile: Stack Zia below */}
        <div className="md:hidden mt-12 flex flex-col items-center gap-6 animate-fade-in-up">
          <blockquote className="bg-white/50 backdrop-blur-xl rounded-2xl border border-indigo-300/50 p-8 text-center max-w-sm shadow-xl shadow-indigo-200/30 hover:shadow-2xl hover:shadow-indigo-300/40 hover:border-indigo-400/70 transition-all group">
            <p className="text-base font-medium text-slate-900 italic mb-3 group-hover:text-indigo-800 transition-colors leading-relaxed">
              "One system away from freedom, darling—and I've got the map."
            </p>
            <cite className="text-xs font-semibold text-slate-600 group-hover:text-slate-800 transition-colors not-italic">
              ✨ Zia
            </cite>
          </blockquote>
        </div>
      </div>
    </section>
  );
}
