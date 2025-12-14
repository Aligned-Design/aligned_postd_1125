import { useState } from "react";
import { Facebook, Twitter, Instagram, Linkedin, ChevronLeft, ChevronRight, Music, Youtube, MapPin, ShoppingCart } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface DraftedPostsItem {
  platform: string;
  count: number;
  icon: LucideIcon;
}

export function DraftedPosts() {
  const [scrollPosition, setScrollPosition] = useState(0);

  const drafted: DraftedPostsItem[] = [
    { platform: "LinkedIn", count: 3, icon: Linkedin },
    { platform: "Instagram", count: 5, icon: Instagram },
    { platform: "Facebook", count: 2, icon: Facebook },
    { platform: "Twitter", count: 7, icon: Twitter },
    { platform: "TikTok", count: 4, icon: Music },
    { platform: "YouTube", count: 1, icon: Youtube },
    { platform: "Pinterest", count: 6, icon: MapPin },
    { platform: "Shopify", count: 2, icon: ShoppingCart },
  ];

  const itemsPerView = 4;
  const maxScroll = Math.max(0, drafted.length - itemsPerView);

  const handleScroll = (direction: "left" | "right") => {
    const newPosition = direction === "right" ? Math.min(scrollPosition + 1, maxScroll) : Math.max(scrollPosition - 1, 0);
    setScrollPosition(newPosition);
  };

  const visibleItems = drafted.slice(scrollPosition, scrollPosition + itemsPerView);

  return (
    <div className="bg-white/40 backdrop-blur-2xl rounded-2xl p-6 border border-white/60 hover:bg-white/50 hover:shadow-lg transition-all duration-300 relative overflow-hidden mb-10">
      {/* Glassmorphism gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/20 via-blue-50/10 to-transparent rounded-2xl -z-10"></div>

      <div className="relative flex items-center justify-between mb-4">
        <h3 className="text-lg font-black text-slate-900">All Drafted Posts</h3>
        {drafted.length > itemsPerView && (
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => handleScroll("left")}
              disabled={scrollPosition === 0}
              className="p-1 sm:p-1.5 rounded-lg hover:bg-indigo-100/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300"
            >
              <ChevronLeft className="w-4 h-4 text-indigo-600" />
            </button>
            <button
              onClick={() => handleScroll("right")}
              disabled={scrollPosition === maxScroll}
              className="p-1 sm:p-1.5 rounded-lg hover:bg-indigo-100/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300"
            >
              <ChevronRight className="w-4 h-4 text-indigo-600" />
            </button>
          </div>
        )}
      </div>
      <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.platform}
              className="group rounded-lg p-2 sm:p-4 bg-gradient-to-br from-indigo-50/20 to-blue-50/10 hover:from-indigo-100/30 hover:to-blue-100/20 border border-indigo-200/20 hover:border-indigo-300/50 transition-all duration-300 text-center cursor-pointer"
            >
              <Icon className="w-5 sm:w-6 h-5 sm:h-6 text-indigo-600 mx-auto mb-1 sm:mb-2 group-hover:scale-125 transition-transform duration-300" />
              <p className="text-lg sm:text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors duration-300">{item.count}</p>
              <p className="text-xs text-slate-600 font-medium">{item.platform}</p>
              <p className="text-xs text-slate-500 font-medium">Drafts</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
