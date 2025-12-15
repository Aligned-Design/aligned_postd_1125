import { ArrowRight } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { ZiaQuip } from "./ZiaPersonality";
import { ZIA_QUIPS } from "./ZiaPersonality.constants";

interface WhatItFeelsLikeSectionProps {
  onCTA?: () => void;
}

export function WhatItFeelsLikeSection({ onCTA }: WhatItFeelsLikeSectionProps) {
  const { ref: containerRef, isVisible } = useScrollAnimation();

  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 md:px-8 bg-gradient-to-b from-white via-indigo-50/15 to-white relative overflow-hidden">
      {/* Premium background with animated elements */}
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-100/25 rounded-full blur-3xl animate-gradient-shift"></div>
        <div
          className="absolute bottom-0 left-0 w-80 h-80 bg-slate-200/15 rounded-full blur-3xl animate-pulse-glow"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute top-1/2 right-1/3 w-64 h-64 bg-blue-100/15 rounded-full blur-3xl animate-float-soft"
          style={{ animationDelay: "2s" }}
        ></div>
        {/* Light reflection */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-white/10"></div>
      </div>

      <div className="max-w-4xl mx-auto">
        <div
          ref={containerRef}
          className={`bg-white/55 backdrop-blur-xl rounded-3xl border border-indigo-200/60 p-8 md:p-12 text-center transition-all duration-700 hover:bg-white/70 hover:border-indigo-400/70 hover:shadow-2xl hover:shadow-indigo-300/40 group ${
            isVisible
              ? "opacity-100 scale-100 translate-y-0"
              : "opacity-0 scale-95 translate-y-8"
          }`}
        >
          <p className="text-2xl font-black text-slate-900 mb-6 group-hover:text-indigo-900 transition-colors">
            It's Monday.
          </p>

          <p className="text-base sm:text-lg text-slate-700 mb-8 leading-relaxed group-hover:text-slate-900 transition-colors">
            You open your laptop. Everything's already scheduled. The content looks sharp. The clients are happy. And for once, you actually remember to eat lunch.
          </p>

          <p className="text-xl md:text-2xl font-black text-slate-900 mb-6 group-hover:text-indigo-900 transition-colors">
            That's Postd.
          </p>

          <p className="text-base sm:text-lg text-slate-700 mb-10 leading-relaxed group-hover:text-slate-900 transition-colors">
            Your content posts itself. Your brand stays consistent without you babysitting it. Your captions sound like you (on a good day). Your analytics don't make you want to cry. Your calendar isn't a crime scene.
          </p>
          <p className="text-base sm:text-lg text-slate-700 mb-10 leading-relaxed group-hover:text-slate-900 transition-colors">
            Instead… Your content is consistent. Your posting is automatic. Your brain is calm.
          </p>

          <button
            onClick={onCTA}
            data-cta="feel-primary"
            className="px-8 py-3 mb-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl transition-all active:scale-95 inline-flex items-center gap-2 text-lg shadow-lg shadow-indigo-600/30 hover:shadow-xl hover:shadow-indigo-600/50 border border-indigo-500/50 hover:border-indigo-400 group"
          >
            Get Started
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          <p className="text-sm text-slate-600 font-medium">
            (Clarity looks good on you.)
          </p>
        </div>

        {/* Zia personality moment */}
        <div className="mt-12">
          <ZiaQuip
            quip={ZIA_QUIPS.whatItFeeelsLike[0]}
            placement="center"
            size="md"
          />
        </div>
      </div>
    </section>
  );
}
