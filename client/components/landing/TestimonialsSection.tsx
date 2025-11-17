import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const TESTIMONIALS = [
  {
    id: 1,
    company: "Little Fox Creative",
    initials: "LFC",
    quote:
      "We were dropping balls and burning out. Now everything runs smooth, and we actually have energy left for ideas.",
    color: "slate",
  },
  {
    id: 2,
    company: "Indigo & Co",
    initials: "I&Co",
    quote:
      "Our clients think we built this just for them. We're not correcting them.",
    color: "indigo",
  },
  {
    id: 3,
    company: "806 Marketing",
    initials: "806",
    quote: "Finally, reports clients actually read — and understand.",
    color: "slate",
  },
];

interface LogoPlaceholderProps {
  initials: string;
  color: "slate" | "indigo";
}

function LogoPlaceholder({ initials, color }: LogoPlaceholderProps) {
  const bgColor =
    color === "indigo"
      ? "bg-indigo-100 text-indigo-700"
      : "bg-slate-200 text-slate-700";

  return (
    <div
      className={`w-12 h-12 sm:w-14 sm:h-14 rounded-lg ${bgColor} flex items-center justify-center font-black text-xs sm:text-sm`}
      aria-label={`Logo placeholder for company with initials ${initials}`}
    >
      {initials}
    </div>
  );
}

export function TestimonialsSection() {
  const { ref: titleRef, isVisible: titleVisible } = useScrollAnimation();
  const { ref: cardsRef, isVisible: cardsVisible } = useScrollAnimation();

  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 md:px-8 bg-gradient-to-b from-white via-slate-50/20 to-white relative overflow-hidden">
      {/* Premium background with animated orbs */}
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-10 right-10 w-96 h-96 bg-slate-200/20 rounded-full blur-3xl animate-pulse-glow"></div>
        <div
          className="absolute bottom-0 left-1/4 w-80 h-80 bg-indigo-100/15 rounded-full blur-3xl animate-gradient-shift"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute top-1/2 right-1/3 w-64 h-64 bg-blue-100/10 rounded-full blur-3xl animate-float-soft"
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
            Real Talk from Real Marketers
          </h2>
          <p className="text-lg text-slate-600">From agencies that get it.</p>
        </div>

        {/* Testimonials Grid */}
        <div ref={cardsRef} className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((testimonial, index) => (
            <div
              key={testimonial.id}
              className={`bg-white/50 backdrop-blur-xl rounded-2xl border border-indigo-200/50 p-6 md:p-8 hover:bg-white/80 hover:border-indigo-400/70 hover:shadow-xl hover:shadow-indigo-200/40 transition-all flex flex-col group cursor-pointer ${
                cardsVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              }`}
              style={{
                transitionDelay: cardsVisible ? `${index * 100}ms` : "0ms",
              }}
            >
              {/* Logo */}
              <div className="mb-6 group-hover:scale-125 group-hover:-translate-y-1 transition-all origin-left">
                <LogoPlaceholder
                  initials={testimonial.initials}
                  color={testimonial.color as "slate" | "indigo"}
                />
              </div>

              {/* Quote */}
              <blockquote className="flex-1 mb-6">
                <p className="text-base text-slate-700 leading-relaxed font-medium group-hover:text-slate-900 transition-colors">
                  "{testimonial.quote}"
                </p>
              </blockquote>

              {/* Attribution */}
              <div>
                <cite className="text-sm font-black text-slate-900 group-hover:text-indigo-900 transition-colors not-italic">
                  {testimonial.company}
                </cite>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile carousel indicator */}
        <div className="md:hidden mt-12 flex justify-center gap-2">
          {TESTIMONIALS.map((_, idx) => (
            <div
              key={idx}
              className="w-2 h-2 rounded-full bg-indigo-400 hover:bg-indigo-600 transition-colors"
            ></div>
          ))}
        </div>
      </div>
    </section>
  );
}
