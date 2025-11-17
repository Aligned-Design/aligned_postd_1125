import { ArrowRight, Sparkles } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

interface FinalCTASectionProps {
  onCTA?: () => void;
}

export function FinalCTASection({ onCTA }: FinalCTASectionProps) {
  const { ref: headingRef, isVisible: headingVisible } = useScrollAnimation();
  const { ref: cardRef, isVisible: cardVisible } = useScrollAnimation();
  const { ref: ctaRef, isVisible: ctaVisible } = useScrollAnimation();

  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 md:px-8 bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 relative overflow-hidden">
      {/* Luxury animated background with multiple orbs */}
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
        {/* Primary indigo glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-br from-indigo-500/20 to-indigo-500/5 rounded-full blur-3xl animate-pulse-glow"></div>
        {/* Secondary slate glow */}
        <div
          className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-to-tl from-slate-600/15 to-slate-600/5 rounded-full blur-3xl animate-float-soft"
          style={{ animationDelay: "0.5s" }}
        ></div>
        {/* Accent lime glow */}
        <div className="absolute bottom-1/3 left-1/4 w-64 h-64 bg-lime-500/10 rounded-full blur-3xl opacity-60"></div>
        {/* Light reflection from top */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-transparent"></div>
      </div>

      <div className="max-w-4xl mx-auto text-center">
        <div
          ref={headingRef}
          className={`transition-all duration-700 ${
            headingVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-6 leading-tight">
            You've built something real.
          </h2>

          <p className="text-lg sm:text-xl text-slate-200 mb-8 leading-relaxed">
            Now it's time to run it without running yourself into the ground.
          </p>
        </div>

        <div
          ref={cardRef}
          className={`bg-white/10 backdrop-blur-2xl rounded-2xl border border-white/30 p-8 md:p-12 mb-8 transition-all duration-700 hover:bg-white/15 hover:border-lime-400/40 hover:shadow-2xl hover:shadow-lime-400/20 ${
            cardVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
          }`}
        >
          <p className="text-lg sm:text-xl text-white font-bold mb-6">
            Postd — Marketing that finally works with you.
          </p>
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
            For the bold brands that care deeply, create intentionally, and refuse to blend in.
          </p>
        </div>

        <div
          ref={ctaRef}
          className={`transition-all duration-700 ${
            ctaVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <button
            onClick={onCTA}
            data-cta="final-primary"
            className="px-8 py-3 mb-3 bg-lime-400 hover:bg-lime-300 text-indigo-950 font-black rounded-xl transition-all active:scale-95 inline-flex items-center gap-2 text-lg shadow-xl shadow-lime-400/50 hover:shadow-2xl hover:shadow-lime-400/60 group border border-lime-300/60 hover:border-lime-200/80 backdrop-blur-sm"
          >
            Get Started
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          <p className="text-sm text-slate-300 font-medium">
            Because the best systems let you be creative again.
          </p>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-white/10">
          <p className="text-xs text-slate-500 font-medium">
            © 2024 Postd – For brands that care deeply and create boldly.
          </p>
        </div>
      </div>
    </section>
  );
}
