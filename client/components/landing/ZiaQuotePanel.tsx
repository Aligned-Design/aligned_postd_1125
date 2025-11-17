import { ZiaMascot } from "@/components/dashboard/ZiaMascot";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

export function ZiaQuotePanel() {
  const { ref: containerRef, isVisible } = useScrollAnimation();

  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 md:px-8 bg-gradient-to-b from-white via-lime-50/10 to-white relative overflow-hidden">
      {/* Premium background with animated orbs */}
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-100/25 rounded-full blur-3xl animate-gradient-shift"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-lime-100/25 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: "1s" }}></div>
        <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-indigo-50/20 rounded-full blur-3xl animate-float-soft" style={{ animationDelay: "2s" }}></div>
        {/* Light reflection */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-white/10"></div>
      </div>

      <div
        ref={containerRef}
        className={`max-w-4xl mx-auto flex flex-col items-center text-center transition-all duration-700 ${
          isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        {/* Zia Mascot with float animation */}
        <div className="mb-8 animate-float">
          <ZiaMascot size="lg" animate={true} />
        </div>

        {/* Quote with staggered animation */}
        <blockquote className="mb-8">
          <p className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 leading-tight">
            Meet Zia, your AI Advisor.
          </p>
          <p className="text-2xl sm:text-3xl md:text-4xl font-black text-indigo-600 mt-2 leading-tight">
            Strategic. Smart. Always Postd.
          </p>
        </blockquote>

        {/* Divider with animation */}
        <div className="h-1 w-20 bg-gradient-to-r from-indigo-400 to-lime-300 mb-8 rounded-full"></div>

        <p className="text-base sm:text-lg text-slate-700 max-w-md leading-relaxed hover:text-slate-900 transition-colors">
          Zia guides every decision—recommending the best content, the best times to post, and insights your clients actually care about. Because great systems need great guidance.
        </p>
      </div>
    </section>
  );
}
