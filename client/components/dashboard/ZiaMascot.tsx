import { useState, useEffect } from "react";

interface ZiaMascotProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  animate?: boolean;
}

export function ZiaMascot({ size = "md", className = "", animate = true }: ZiaMascotProps) {
  const sizeMap = {
    sm: "w-12 h-12",
    md: "w-20 h-20",
    lg: "w-32 h-32",
  };

  const textSizeMap = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-5xl",
  };

  const [isWinking, setIsWinking] = useState(false);

  useEffect(() => {
    if (!animate) return;

    const winkInterval = setInterval(() => {
      setIsWinking(true);
      setTimeout(() => setIsWinking(false), 200);
    }, 4000 + Math.random() * 2000);

    return () => clearInterval(winkInterval);
  }, [animate]);

  return (
    <div className={`${sizeMap[size]} ${className} flex items-center justify-center relative`}>
      {/* Zia mascot - AI assistant visual representation */}
      <div className={`w-full h-full bg-gradient-to-br from-slate-300 via-slate-200 to-slate-300 rounded-full flex items-center justify-center ${textSizeMap[size]} font-bold text-slate-700 border-2 border-slate-400 transition-all duration-300 hover:shadow-lg hover:border-slate-500`}>
        {/* Eyes container */}
        <div className="flex gap-1.5 items-center">
          {/* Left eye */}
          <div className={`w-2 h-2 bg-slate-700 rounded-full transition-all ${isWinking ? "scale-0" : "scale-100"}`}></div>
          {/* Right eye with wink animation */}
          <div className={`w-2 h-2 bg-slate-700 rounded-full transition-all ${isWinking ? "h-0.5" : "scale-100"}`}></div>
        </div>
      </div>

      {/* Sparkle accent */}
      {animate && (
        <div className="absolute -top-2 -right-2 text-lg animate-bounce-slow">
          ✨
        </div>
      )}
    </div>
  );
}
