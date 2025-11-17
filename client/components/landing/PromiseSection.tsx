import { ArrowRight } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

interface PromiseSectionProps {
  onCTA?: () => void;
}

export function PromiseSection({ onCTA }: PromiseSectionProps) {
  const { ref: headingRef, isVisible: headingVisible } = useScrollAnimation();
  const { ref: contentRef, isVisible: contentVisible } = useScrollAnimation();
  const { ref: ctaRef, isVisible: ctaVisible } = useScrollAnimation();

  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 md:px-8 bg-gradient-to-b from-white via-blue-50/20 to-white relative overflow-hidden">
      {/* Premium gradient orbs with animation */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-indigo-100/30 rounded-full blur-3xl pointer-events-none -z-10 animate-gradient-shift"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-100/25 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse-glow"></div>
      <div
        className="absolute top-1/2 left-1/4 w-64 h-64 bg-indigo-50/20 rounded-full blur-3xl pointer-events-none -z-10"
        style={{ animationDelay: "1s" }}
      ></div>
      {/* Light reflection */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/10 pointer-events-none -z-10"></div>

      <div className="max-w-4xl mx-auto text-center">
        <div
          ref={headingRef}
          className={`transition-all duration-700 ${
            headingVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 mb-6 leading-tight">
            What if marketing actually felt fun again?
          </h2>

          <p className="text-lg sm:text-xl text-indigo-600 font-bold mb-6">
            The kind of fun where ideas flow. Where posting isn't a panic. Where your brand shows up the way you imagined.
          </p>

          <p className="text-base sm:text-lg text-slate-700 mb-6 leading-relaxed">
            That's the Postd feeling. Not the "we should post more" guilt. But the creativity. The clarity. The joy of telling your story, not just keeping up with the algorithm.
          </p>

          <p className="text-base sm:text-lg text-slate-700 mb-8 leading-relaxed">
            Imagine a content rhythm that feels supportive and spacious. Your posts go out at the optimal time. Your content stays true to your voice. Your brand shows up exactly the way you hoped it would.
          </p>
        </div>

        <div
          ref={contentRef}
          className={`grid grid-cols-1 md:grid-cols-2 gap-6 transition-all duration-700 ${
            contentVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="bg-white/40 backdrop-blur-xl rounded-2xl border border-indigo-200/60 p-6 md:p-8 hover:bg-white/60 hover:border-indigo-300/80 hover:shadow-xl hover:shadow-indigo-200/30 transition-all duration-300 group cursor-pointer">
            <div className="flex items-start gap-4">
              <span className="text-3xl">🎨</span>
              <div className="flex-1">
                <h3 className="font-bold text-slate-900 mb-2 group-hover:text-indigo-700 transition-colors">
                  Reclaim Your Time
                </h3>
                <p className="text-sm text-slate-700 leading-relaxed">
                  You reclaim your evenings. You reclaim your weekends. You reclaim the part of you that loves what you do.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/40 backdrop-blur-xl rounded-2xl border border-indigo-200/60 p-6 md:p-8 hover:bg-white/60 hover:border-indigo-300/80 hover:shadow-xl hover:shadow-indigo-200/30 transition-all duration-300 group cursor-pointer">
            <div className="flex items-start gap-4">
              <span className="text-3xl">✨</span>
              <div className="flex-1">
                <h3 className="font-bold text-slate-900 mb-2 group-hover:text-indigo-700 transition-colors">
                  Content Automation
                </h3>
                <p className="text-sm text-slate-700 leading-relaxed">
                  Your workflow becomes simple. Your approvals feel organized. Your analytics feel empowering. Your week feels peaceful.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/40 backdrop-blur-xl rounded-2xl border border-indigo-200/60 p-6 md:p-8 hover:bg-white/60 hover:border-indigo-300/80 hover:shadow-xl hover:shadow-indigo-200/30 transition-all duration-300 group cursor-pointer">
            <div className="flex items-start gap-4">
              <span className="text-3xl">👥</span>
              <div className="flex-1">
                <h3 className="font-bold text-slate-900 mb-2 group-hover:text-indigo-700 transition-colors">
                  Stop Chasing Deadlines
                </h3>
                <p className="text-sm text-slate-700 leading-relaxed">
                  You stop chasing deadlines. You stop drowning in drafts. You stop apologizing for "posting late." You stop waking up in a cold sweat.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/40 backdrop-blur-xl rounded-2xl border border-indigo-200/60 p-6 md:p-8 hover:bg-white/60 hover:border-indigo-300/80 hover:shadow-xl hover:shadow-indigo-200/30 transition-all duration-300 group cursor-pointer">
            <div className="flex items-start gap-4">
              <span className="text-3xl">📊</span>
              <div className="flex-1">
                <h3 className="font-bold text-slate-900 mb-2 group-hover:text-indigo-700 transition-colors">
                  Be the Marketer You Imagined
                </h3>
                <p className="text-sm text-slate-700 leading-relaxed">
                  You get to be the marketer you imagined you'd be when you first fell in love with this work — creative, strategic, purposeful.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div
          ref={ctaRef}
          className={`transition-all duration-700 ${
            ctaVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <button
            onClick={onCTA}
            data-cta="promise-primary"
            className="px-8 py-3 mb-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl transition-all active:scale-95 inline-flex items-center gap-2 text-lg shadow-lg shadow-indigo-600/30 hover:shadow-xl hover:shadow-indigo-600/40 group border border-indigo-500/50 hover:border-indigo-400"
          >
            Start Free
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          <p className="text-sm text-slate-600 font-medium">
            (We'll take it from here.)
          </p>
        </div>
      </div>
    </section>
  );
}
