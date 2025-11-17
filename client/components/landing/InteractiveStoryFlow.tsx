import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { CheckCircle, Zap, Edit3, Calendar, BarChart3 } from "lucide-react";

export function InteractiveStoryFlow() {
  const { ref: containerRef, isVisible } = useScrollAnimation({
    threshold: 0.3,
  });

  const steps = [
    {
      id: "chaos",
      icon: Edit3,
      label: "Chaos",
      description: "10 brands, 50 drafts, infinite tabs",
      color: "from-red-500 to-orange-500",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
    },
    {
      id: "clarity",
      icon: Calendar,
      label: "Clarity",
      description: "One system, all organized",
      color: "from-amber-500 to-yellow-500",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
    },
    {
      id: "alignment",
      icon: CheckCircle,
      label: "Alignment",
      description: "Your voice, automated",
      color: "from-indigo-500 to-purple-500",
      bgColor: "bg-indigo-50",
      borderColor: "border-indigo-200",
    },
  ];

  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 md:px-8 bg-gradient-to-b from-white via-slate-50/20 to-white relative overflow-hidden">
      {/* Premium animated background with multiple orbs */}
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-100/25 rounded-full blur-3xl animate-gradient-shift"></div>
        <div
          className="absolute bottom-0 right-1/4 w-80 h-80 bg-slate-200/15 rounded-full blur-3xl animate-pulse-glow"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute top-1/3 left-1/4 w-64 h-64 bg-indigo-50/20 rounded-full blur-3xl animate-float-soft"
          style={{ animationDelay: "2s" }}
        ></div>
        {/* Light reflection */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-white/10"></div>
      </div>

      <div
        ref={containerRef}
        className={`max-w-6xl mx-auto transition-all duration-700 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Title */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 mb-4 leading-tight">
            From Chaos to Alignment
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Watch your marketing transform as you scroll. This is what Postd
            does every single day.
          </p>
        </div>

        {/* Journey visualization */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={step.id}
                className={`transition-all duration-700 ${
                  isVisible ? "opacity-100 scale-100" : "opacity-0 scale-90"
                }`}
                style={{
                  transitionDelay: isVisible ? `${idx * 150}ms` : "0ms",
                }}
              >
                <div
                  className={`${step.bgColor} ${step.borderColor} rounded-2xl border-2 p-8 text-center relative group hover:shadow-2xl hover:shadow-slate-200/50 transition-all backdrop-blur-sm hover:backdrop-blur-md`}
                >
                  {/* Number indicator */}
                  <div className="absolute -top-4 -right-4 w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-full flex items-center justify-center font-black text-sm shadow-lg">
                    {idx + 1}
                  </div>

                  {/* Icon */}
                  <div
                    className={`w-16 h-16 bg-gradient-to-br ${step.color} rounded-full flex items-center justify-center mx-auto mb-4 text-white shadow-lg group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="w-8 h-8" />
                  </div>

                  {/* Label */}
                  <h3 className="text-2xl font-black text-slate-900 mb-2">
                    {step.label}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {step.description}
                  </p>

                  {/* Animated underline */}
                  <div
                    className={`h-1 bg-gradient-to-r ${step.color} mx-auto mt-4 rounded-full transition-all ${
                      isVisible ? "w-12" : "w-0"
                    }`}
                    style={{
                      transitionDelay: isVisible
                        ? `${idx * 150 + 400}ms`
                        : "0ms",
                    }}
                  ></div>
                </div>

                {/* Arrow connector (desktop only) */}
                {idx < steps.length - 1 && (
                  <div className="hidden md:flex absolute top-1/2 -right-8 transform -translate-y-1/2">
                    <Zap className="w-5 h-5 text-indigo-400 animate-bounce-slow" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* The transformation message */}
        <div
          className={`bg-white/50 backdrop-blur-xl rounded-2xl border border-indigo-300/60 p-8 md:p-12 text-center transition-all duration-700 hover:bg-white/70 hover:border-indigo-400/70 hover:shadow-xl hover:shadow-indigo-200/40 group ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          style={{
            transitionDelay: isVisible ? "600ms" : "0ms",
          }}
        >
          <p className="text-base sm:text-lg text-slate-700 mb-2 group-hover:text-slate-900 transition-colors">
            Your current reality:
          </p>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mb-6 group-hover:text-indigo-900 transition-colors">
            "I'm managing 10 brands across 15 platforms in my head."
          </p>

          <div className="h-1 w-16 bg-gradient-to-r from-indigo-400 to-purple-400 mx-auto mb-6 rounded-full group-hover:from-indigo-500 group-hover:to-purple-500 transition-all"></div>

          <p className="text-base sm:text-lg text-slate-700 mb-2 group-hover:text-slate-900 transition-colors">
            With Postd:
          </p>
          <p className="text-2xl sm:text-3xl font-black text-indigo-600 group-hover:text-indigo-800 transition-colors">
            "Everything's organized. My voice is consistent. I actually have
            evenings back."
          </p>
        </div>

        {/* Mobile step indicators */}
        <div className="md:hidden mt-8 flex justify-center gap-2">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`h-2 rounded-full transition-all ${
                isVisible ? "bg-indigo-600 w-8" : "bg-slate-300 w-2"
              }`}
              style={{
                transitionDelay: isVisible ? `${idx * 100}ms` : "0ms",
              }}
            ></div>
          ))}
        </div>
      </div>
    </section>
  );
}
