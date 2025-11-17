import React, { useEffect, useRef, useState } from "react";

export default function Reveal({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            // once visible, unobserve
            if (el) obs.unobserve(el);
          }
        });
      },
      { threshold: 0.15 },
    );

    obs.observe(el);

    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`${className} transition-all duration-180 ease-in-out`}
    >
      <div
        className={`transform ${visible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-3 scale-98"}`}
        style={{ willChange: "transform, opacity" }}
      >
        {children}
      </div>
    </div>
  );
}
