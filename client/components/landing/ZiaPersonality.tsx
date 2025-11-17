import { ZiaMascot } from "@/components/dashboard/ZiaMascot";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useState } from "react";

interface ZiaQuipProps {
  quip: string;
  placement?: "left" | "right" | "center";
  size?: "sm" | "md" | "lg";
  showBubble?: boolean;
}

export function ZiaQuip({
  quip,
  placement = "center",
  size = "md",
  showBubble = true,
}: ZiaQuipProps) {
  const { ref, isVisible } = useScrollAnimation();
  const [isHovered, setIsHovered] = useState(false);

  const placementClass = {
    left: "md:flex-row",
    right: "md:flex-row-reverse",
    center: "justify-center",
  };

  return (
    <div
      ref={ref}
      className={`flex items-center gap-4 ${placementClass[placement]} transition-all duration-700 ${
        isVisible ? "opacity-100" : "opacity-0 scale-90"
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Zia mascot */}
      <div className={`flex-shrink-0 ${isHovered ? "animate-float" : ""}`}>
        <ZiaMascot size={size} animate={true} />
      </div>

      {/* Speech bubble */}
      {showBubble && (
        <div
          className={`bg-white/70 backdrop-blur-xl rounded-2xl border border-indigo-200/60 p-4 md:p-6 shadow-lg hover:shadow-xl transition-all ${
            isHovered ? "border-indigo-300/80 scale-105" : ""
          }`}
        >
          <p className="text-sm md:text-base font-medium text-slate-700 italic">
            "{quip}"
          </p>
        </div>
      )}
    </div>
  );
}

// Preset Zia quips for different sections
export const ZIA_QUIPS = {
  loading: [
    "Hold your horses—just aligning things.",
    "Brewing some brand magic ☕",
    "Teaching AI your vibe… this won't take long.",
  ],
  problem: [
    "One system away from freedom, darling—and I've got the map.",
    "Too many tabs? Let me organize that for you.",
    "Your clients are waiting. Let's sync up.",
  ],
  promise: [
    "Your voice, but way more consistent.",
    "AI that actually sounds like you. Weird, right?",
    "Every post, every channel, perfectly Postd.",
  ],
  howItWorks: [
    "You set up once. I handle the rest.",
    "Watch me make this boring part feel easy.",
    "This is where the magic happens. Ready?",
  ],
  whatItFeeelsLike: [
    "Remember when you had a life outside of content?",
    "That's what 10 hours back feels like.",
    "Peace of mind, finally.",
  ],
  testimonials: [
    "These agencies get it. So do I.",
    "Real stories from real teams.",
    "Proof that alignment isn't a buzzword.",
  ],
  finalCTA: [
    "Your turn. Let's get you Postd.",
    "No more chaos. Just clarity.",
    "Ready to feel the difference?",
  ],
};

// Floating Zia accent (small, appears on hover or scroll)
export function ZiaFloatingAccent() {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.5 });
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      ref={ref}
      className={`fixed bottom-8 right-8 z-40 transition-all duration-700 ${
        isVisible ? "opacity-100 scale-100" : "opacity-0 scale-0"
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Floating Zia */}
      <div className={`cursor-help transition-all ${isHovered ? "animate-float scale-110" : ""}`}>
        <ZiaMascot size="md" animate={true} />
      </div>

      {/* Tooltip on hover */}
      {isHovered && (
        <div className="absolute bottom-full right-0 mb-4 bg-slate-900 text-white rounded-lg px-3 py-2 text-xs font-medium whitespace-nowrap shadow-lg animate-fade-in">
          💡 Questions? I'm here to help.
          <div className="absolute top-full right-3 w-2 h-2 bg-slate-900 transform rotate-45"></div>
        </div>
      )}
    </div>
  );
}

// Animated badge for sections with Zia commentary
export function ZiaBadge({ label = "Zia says" }: { label?: string }) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 border border-indigo-200 rounded-full">
      <span className="text-sm font-medium text-indigo-700">{label}</span>
      <span className="text-sm">🦓</span>
    </div>
  );
}
