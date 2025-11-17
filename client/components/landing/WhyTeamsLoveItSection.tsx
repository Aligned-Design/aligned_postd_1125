import { useScrollAnimation } from "@/hooks/useScrollAnimation";

export function WhyTeamsLoveItSection() {
  const { ref: titleRef, isVisible: titleVisible } = useScrollAnimation();
  const { ref: card1Ref, isVisible: card1Visible } = useScrollAnimation();
  const { ref: card2Ref, isVisible: card2Visible } = useScrollAnimation();

  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 md:px-8 bg-gradient-to-b from-white via-indigo-50/10 to-white relative overflow-hidden">
      {/* Premium background with animated orbs */}
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-0 right-1/2 w-96 h-96 bg-indigo-100/25 rounded-full blur-3xl animate-gradient-shift"></div>
        <div
          className="absolute bottom-0 left-1/3 w-80 h-80 bg-blue-100/15 rounded-full blur-3xl animate-pulse-glow"
          style={{ animationDelay: "1s" }}
        ></div>
        {/* Light reflection */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-white/10"></div>
      </div>

      <div className="max-w-4xl mx-auto text-center">
        <div
          ref={titleRef}
          className={`transition-all duration-700 mb-12 ${
            titleVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 mb-6 leading-tight">
            Built for Agencies That Care Too Much to Cut Corners
          </h2>
          <p className="text-base sm:text-lg text-slate-700 mb-6 leading-relaxed">
            You don't do cookie-cutter. You care about color palettes, client
            calls, and captions that actually sound human. You've built a
            reputation on details — and Postd was built to protect them.
          </p>
          <p className="text-base sm:text-lg text-slate-700 leading-relaxed">
            Because other AI tools create content. Postd creates consistency.
            Always on. Always consistent.
          </p>
        </div>

        <div className="space-y-8 hidden">
          <div
            ref={card1Ref}
            className={`bg-white/45 backdrop-blur-xl rounded-2xl border border-indigo-200/60 p-8 md:p-10 hover:bg-white/70 hover:border-indigo-400/70 hover:shadow-xl hover:shadow-indigo-200/40 transition-all group cursor-pointer ${
              card1Visible
                ? "opacity-100 translate-x-0"
                : "opacity-0 -translate-x-12"
            }`}
          >
            <h3 className="text-2xl font-black text-slate-900 mb-4 group-hover:text-indigo-900 transition-colors">
              ✓ Built for agencies, not amateurs
            </h3>
            <p className="text-base sm:text-lg text-slate-700 leading-relaxed group-hover:text-slate-900 transition-colors">
              Multi-workspace account management. White-labeled client portals.
              Built-in approvals. Designed for teams managing 10, 50, or 100+
              brands. Not a single-user tool trying to be everything.
            </p>
          </div>

          <div
            ref={card2Ref}
            className={`bg-white/45 backdrop-blur-xl rounded-2xl border border-indigo-200/60 p-8 md:p-10 hover:bg-white/70 hover:border-indigo-400/70 hover:shadow-xl hover:shadow-indigo-200/40 transition-all group cursor-pointer ${
              card2Visible
                ? "opacity-100 translate-x-0"
                : "opacity-0 translate-x-12"
            }`}
          >
            <h3 className="text-2xl font-black text-slate-900 mb-4 group-hover:text-indigo-900 transition-colors">
              ✓ AI that understands your brand voice
            </h3>
            <p className="text-base sm:text-lg text-slate-700 leading-relaxed group-hover:text-slate-900 transition-colors">
              Unlike generic AI content tools, Postd learns your brand tone,
              style, and strategy. Every post, email, and caption sounds like
              *you*—not like a robot.
            </p>
          </div>

          <div
            className={`bg-white/45 backdrop-blur-xl rounded-2xl border border-indigo-200/60 p-8 md:p-10 hover:bg-white/70 hover:border-indigo-400/70 hover:shadow-xl hover:shadow-indigo-200/40 transition-all group cursor-pointer ${
              titleVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            <h3 className="text-2xl font-black text-slate-900 mb-4 group-hover:text-indigo-900 transition-colors">
              ✓ One system, one source of truth
            </h3>
            <p className="text-base sm:text-lg text-slate-700 leading-relaxed group-hover:text-slate-900 transition-colors">
              Brand guides, content creation, scheduling, approvals,
              analytics—all in one place. No context switching. No syncing
              between tools. No confusion.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
