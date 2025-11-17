import React, { useEffect, useRef } from "react";
import { Star } from "lucide-react";

const reviews = [
  {
    quote:
      "Aligned AI turned our monthly content chaos into a predictable machine. The quality is consistently on-brand and the time savings are unreal.",
    name: "Avery Reed",
    title: "Agency Owner",
    initials: "AR",
  },
  {
    quote:
      "Our team finally trusts an AI assistant. Drafts arrive ready to edit, not rewrite — and clients love the branded previews.",
    name: "Jordan Kim",
    title: "Marketing Director",
    initials: "JK",
  },
  {
    quote:
      "The Advisor recommendations helped us prioritize content that actually moves metrics. Reporting now feels effortless.",
    name: "Priya Patel",
    title: "Growth Lead",
    initials: "PP",
  },
  {
    quote:
      "We shaved hours off every campaign cycle. The approval flows are clean and clients approve faster than ever.",
    name: "Marcus Lee",
    title: "Creative Director",
    initials: "ML",
  },
];

export default function ReviewsCarousel() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const scrollInterval = useRef<number | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const startAutoScroll = () => {
      stopAutoScroll();
      scrollInterval.current = window.setInterval(() => {
        if (!el) return;
        const scrollAmount = el.clientWidth * 0.9; // scroll almost a full view
        if (
          el.scrollLeft + scrollAmount >=
          el.scrollWidth - el.clientWidth / 2
        ) {
          // wrap to start
          el.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          el.scrollBy({ left: scrollAmount, behavior: "smooth" });
        }
      }, 4500);
    };

    const stopAutoScroll = () => {
      if (scrollInterval.current) {
        window.clearInterval(scrollInterval.current);
        scrollInterval.current = null;
      }
    };

    startAutoScroll();
    el.addEventListener("mouseover", stopAutoScroll);
    el.addEventListener("mouseout", startAutoScroll);

    return () => {
      stopAutoScroll();
      el.removeEventListener("mouseover", stopAutoScroll);
      el.removeEventListener("mouseout", startAutoScroll);
    };
  }, []);

  return (
    <section aria-labelledby="reviews-heading" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-8">
          <h3
            id="reviews-heading"
            className="text-2xl md:text-3xl font-extrabold text-slate-900"
          >
            What agencies are saying
          </h3>
          <p className="text-slate-600 mt-2">
            Real teams. Real results. Honest reviews.
          </p>
        </div>

        <div
          ref={containerRef}
          className="flex flex-col md:flex-row gap-6 overflow-x-auto md:overflow-x-visible no-scrollbar py-4 px-1 md:snap-x snap-mandatory scroll-smooth"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {reviews.map((r, idx) => (
            <article
              key={idx}
              className="snap-start flex-shrink-0 w-full md:w-1/3 max-w-md md:max-w-none rounded-3xl bg-[var(--surface-0)] border border-gray-100 p-6 shadow-sm"
              aria-roledescription="testimonial"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-sm font-semibold text-slate-900">
                    {r.initials}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-[var(--accent-lime)]">
                    <Star className="w-4 h-4" />
                    <Star className="w-4 h-4" />
                    <Star className="w-4 h-4" />
                    <Star className="w-4 h-4" />
                    <Star className="w-4 h-4" />
                  </div>
                  <p className="mt-3 text-slate-700 leading-relaxed">
                    {r.quote}
                  </p>

                  <div className="mt-4">
                    <div className="text-slate-900 font-semibold">{r.name}</div>
                    <div className="text-sm text-slate-500">{r.title}</div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* small pager dots */}
        <div className="flex items-center justify-center gap-2 mt-6">
          {reviews.map((_, i) => (
            <span key={i} className="w-2 h-2 rounded-full bg-gray-300" />
          ))}
        </div>
      </div>
    </section>
  );
}
