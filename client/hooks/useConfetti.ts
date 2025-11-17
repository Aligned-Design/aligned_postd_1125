import { useCallback, useEffect, useRef } from "react";
import confetti from "canvas-confetti";

export function useConfetti() {
  const prefersReduced = useRef(false);

  useEffect(() => {
    prefersReduced.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
  }, []);

  const fire = useCallback((opts?: confetti.Options) => {
    if (prefersReduced.current) return;
    const defaults: confetti.Options = {
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
    };
    confetti({ ...defaults, ...opts });
  }, []);

  const burst = useCallback(() => {
    if (prefersReduced.current) return;
    const end = Date.now() + 600;
    const frame = () => {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#4F46E5", "#818CF8", "#C7D2FE"],
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#4F46E5", "#818CF8", "#C7D2FE"],
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, []);

  return { fire, burst };
}
