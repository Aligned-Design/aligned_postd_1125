import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { Post, PLATFORM_ICONS } from "@/types/post";

interface SectionCarouselProps {
  title: string;
  icon: React.ReactNode;
  posts: Post[];
  onPostClick?: (post: Post) => void;
  hasError?: boolean;
}

export function SectionCarousel({
  title,
  icon,
  posts,
  onPostClick,
  hasError = false,
}: SectionCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
      setTimeout(checkScroll, 300);
    }
  };

  // ✅ REAL IMPLEMENTATION: Get post image from post data or use default placeholder
  const getPostImage = (post: Post) => {
    // Check for media fields (may be added to Post type in future)
    const postMedia = (post as any).thumbnailUrl || (post as any).mediaUrl || (post as any).imageUrl;
    
    if (postMedia) {
      return postMedia;
    }
    
    // Default "no image" placeholder - simple gradient instead of external Unsplash URL
    return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23e0e7ff' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%239ca3af' font-family='system-ui' font-size='14'%3ENo Image%3C/text%3E%3C/svg%3E";
  };

  if (posts.length === 0) {
    return (
      <div className="mb-8 rounded-lg bg-white/50 backdrop-blur-xl border border-white/60 p-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <span className="text-2xl">{icon}</span>
          <h3 className="text-lg font-black text-slate-900">{title}</h3>
        </div>
        <p className="text-slate-500 font-medium">No posts in {title.toLowerCase()}</p>
      </div>
    );
  }

  return (
    <div className="mb-8">
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-indigo-200/40">
        <span className="text-2xl">{icon}</span>
        <div>
          <h3 className="text-lg font-black text-slate-900">{title}</h3>
          <p className="text-xs text-slate-600 font-medium">
            {posts.length} {posts.length === 1 ? "post" : "posts"}
          </p>
        </div>
      </div>

      {/* Carousel Container */}
      <div className="relative">
        {/* Left Arrow */}
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-14 z-10 p-2 hover:bg-indigo-100 rounded-lg transition-colors text-indigo-600 hover:text-indigo-700"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Scrollable Container */}
        <div
          ref={scrollContainerRef}
          onScroll={checkScroll}
          className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
          style={{ scrollBehavior: "smooth" }}
        >
          {posts.map((post) => {
            const Icon = PLATFORM_ICONS[post.platform] as React.ComponentType<any>;

            return (
              <div
                key={post.id}
                onClick={() => onPostClick?.(post)}
                className="flex-shrink-0 w-72 cursor-pointer group rounded-lg overflow-hidden bg-white/50 hover:bg-white/70 border border-indigo-200/20 hover:border-indigo-300/50 transition-all duration-300 hover:shadow-md hover:scale-105 snap-start flex flex-col h-full"
              >
                {/* Image Preview */}
                <div className="relative w-full h-40 bg-gradient-to-br from-indigo-100 to-blue-100 overflow-hidden">
                  <img
                    src={getPostImage(post)}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Platform Icon */}
                  <div className="absolute top-2 right-2 flex items-center gap-2">
                    {Icon && (
                      <div className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center text-indigo-600">
                        <Icon className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  {/* Error Badge */}
                  {post.errorMessage && (
                    <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full bg-red-500 text-white text-xs font-bold animate-pulse">
                      <AlertCircle className="w-3 h-3" />
                      Retry
                    </div>
                  )}
                </div>

                {/* Content Area */}
                <div className="p-3 flex flex-col flex-1">
                  {/* Row 1: Title */}
                  <h4 className="font-bold text-slate-900 text-sm leading-tight mb-1 group-hover:text-indigo-600 transition-colors line-clamp-2">
                    {post.title}
                  </h4>

                  {/* Row 2: Error Message or Excerpt */}
                  {post.errorMessage ? (
                    <p className="text-xs text-red-600 font-semibold mb-2 line-clamp-2">
                      {post.errorMessage}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-600 font-medium mb-2 line-clamp-3 flex-grow">
                      {post.excerpt}
                    </p>
                  )}

                  {/* Row 3: Campaign Badge */}
                  <div className="flex items-center gap-1 mb-2">
                    <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-lime-100 text-lime-700">
                      {post.campaign}
                    </span>
                  </div>

                  {/* Row 4: Dates */}
                  <div className="text-xs text-slate-500 font-medium pt-2 border-t border-indigo-200/30">
                    <span>Created {post.createdDate}</span>
                    {post.scheduledDate && (
                      <span className="block text-indigo-600 font-bold">
                        Scheduled {post.scheduledDate}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Arrow */}
        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-14 z-10 p-2 hover:bg-indigo-100 rounded-lg transition-colors text-indigo-600 hover:text-indigo-700"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  );
}
