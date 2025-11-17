import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const STEPS = [
  {
    number: 1,
    title: "Set up your brands",
    description:
      "Each client gets their own private workspace. No mix-ups. No brand bleed.",
    emoji: "🏢",
  },
  {
    number: 2,
    title: "Build your brand guide",
    description:
      "Link the website. Upload logos, colors, tone, visuals—or let Postd generate one automatically.",
    emoji: "🎨",
  },
  {
    number: 3,
    title: "Approve and Align",
    description: "See the content. Edit what you need. We'll handle the rest.",
    emoji: "✅",
  },
  {
    number: 4,
    title: "Automate your week",
    description:
      "Posts go live. Reports update. Clients stay in the loop — without you chasing them.",
    emoji: "🚀",
  },
];

export function HowItWorksSection() {
  const { ref: titleRef, isVisible: titleVisible } = useScrollAnimation();
  const { ref: cardsRef, isVisible: cardsVisible } = useScrollAnimation();

  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 md:px-8 bg-gradient-to-b from-white via-blue-50/10 to-white relative overflow-hidden">
      {/* Premium background with multiple animated orbs */}
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-100/25 rounded-full blur-3xl animate-gradient-shift"></div>
        <div
          className="absolute bottom-0 right-1/4 w-80 h-80 bg-blue-100/15 rounded-full blur-3xl animate-pulse-glow"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute top-1/3 left-1/4 w-64 h-64 bg-indigo-50/20 rounded-full blur-3xl animate-float-soft"
          style={{ animationDelay: "2s" }}
        ></div>
        {/* Light reflection */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-white/10"></div>
      </div>

      <div className="max-w-7xl mx-auto">
        <div
          ref={titleRef}
          className={`text-center mb-16 transition-all duration-700 ${
            titleVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 mb-4">
            How It Works
          </h2>
          <p className="text-lg text-slate-600">
            Four simple steps to content freedom.
          </p>
        </div>

        <div ref={cardsRef} className="grid md:grid-cols-4 gap-6">
          {STEPS.map((step) => (
            <div
              key={step.number}
              className={`bg-white/45 backdrop-blur-xl rounded-2xl border border-indigo-200/50 p-6 hover:bg-white/70 hover:border-indigo-400/70 hover:shadow-xl hover:shadow-indigo-200/40 transition-all duration-300 relative group cursor-pointer ${
                cardsVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              }`}
              style={{
                transitionDelay: cardsVisible
                  ? `${step.number * 100}ms`
                  : "0ms",
              }}
            >
              {/* Step Number Badge with glow */}
              <div className="absolute -top-4 -left-4 w-10 h-10 bg-gradient-to-br from-lime-400 to-lime-500 text-indigo-950 font-black rounded-full flex items-center justify-center text-sm shadow-lg shadow-lime-400/40 group-hover:shadow-lime-400/60 transition-shadow">
                {step.number}
              </div>

              {/* Emoji Icon with enhanced animation */}
              <div className="text-4xl mb-4 mt-2 group-hover:scale-125 group-hover:-translate-y-1 transition-all duration-300">
                {step.emoji}
              </div>

              {/* Content */}
              <h3 className="text-lg font-black text-slate-900 mb-3 group-hover:text-indigo-700 transition-colors">
                {step.title}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed group-hover:text-slate-700 transition-colors">
                {step.description}
              </p>

              {/* Arrow connector (hidden on mobile) */}
              {step.number < 4 && (
                <div className="hidden md:block absolute -right-8 top-1/2 transform -translate-y-1/2 text-indigo-300 group-hover:text-indigo-500 text-2xl transition-colors">
                  →
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Mobile step indicators */}
        <div className="md:hidden mt-12 flex justify-center gap-2">
          {STEPS.map((step) => (
            <div
              key={step.number}
              className="w-2 h-2 rounded-full bg-indigo-400 hover:bg-indigo-600 transition-colors"
            ></div>
          ))}
        </div>

        {/* Tagline */}
        <div className="mt-16 text-center">
          <p className="text-xl md:text-2xl font-black text-slate-900">
            You stay creative. We stay consistent.
          </p>
        </div>
      </div>
    </section>
  );
}
