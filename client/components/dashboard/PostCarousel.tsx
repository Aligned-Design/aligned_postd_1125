import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Post, PLATFORM_ICONS } from "@/types/post";

interface PostCarouselProps {
  posts: Post[];
  onPostClick?: (post: Post) => void;
  title?: string;
}

export function PostCarousel({ posts, onPostClick, title }: PostCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? posts.length - 1 : prev - 1));
    scrollToIndex(currentIndex - 1);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === posts.length - 1 ? 0 : prev + 1));
    scrollToIndex(currentIndex + 1);
  };

  const scrollToIndex = (index: number) => {
    if (scrollContainerRef.current) {
      const element = scrollContainerRef.current.children[index] as HTMLElement;
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
    }
  };

  if (posts.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-500 font-medium">No posts available</p>
      </div>
    );
  }

  const placeholderImage = (id: string) => {
    const imageMap: Record<string, string> = {
      "1": "1552664730-d307ca884978?w=400&h=300&fit=crop",
      "3": "1611532736579-6b16e2b50449?w=400&h=300&fit=crop",
      "4": "1552664730-d307ca884978?w=400&h=300&fit=crop",
      "5": "1460661419201-fd4cecdf8a8b?w=400&h=300&fit=crop",
    };
    return `https://images.unsplash.com/photo-${imageMap[id] || "1460661419201-fd4cecdf8a8b?w=400&h=300&fit=crop"}`;
  };

  const currentPost = posts[currentIndex];

  return (
    <div className="relative">
      {title && (
        <h3 className="text-lg font-black text-slate-900 mb-4">{title}</h3>
      )}

      <div className="relative">
        {/* Main carousel display */}
        <div className="bg-white/50 backdrop-blur-xl rounded-2xl p-4 border border-white/60">
          <div className="relative h-96 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-lg overflow-hidden mb-4">
            <img
              src={placeholderImage(currentPost.id)}
              alt={currentPost.title}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="px-2">
            <h4 className="text-xl font-black text-slate-900 mb-2 line-clamp-2">
              {currentPost.title}
            </h4>
            <p className="text-sm text-slate-600 font-medium mb-3 line-clamp-3">
              {currentPost.excerpt}
            </p>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {PLATFORM_ICONS[currentPost.platform] && (() => {
                  const Icon = PLATFORM_ICONS[currentPost.platform] as React.ComponentType<any>;
                  return (
                    <div className="w-8 h-8 bg-white/50 rounded-lg flex items-center justify-center border border-indigo-200/50">
                      <Icon className="w-4 h-4" />
                    </div>
                  );
                })()}
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-lime-100 text-lime-700">
                {currentPost.campaign}
              </span>
            </div>

            <div className="text-xs text-slate-500 font-medium mb-4">
              Created {currentPost.createdDate}
              {currentPost.scheduledDate && (
                <span className="block text-indigo-600 font-bold">
                  Scheduled {currentPost.scheduledDate}
                </span>
              )}
            </div>

            <button
              onClick={() => onPostClick?.(currentPost)}
              className="w-full px-4 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-all hover:shadow-lg"
            >
              Preview Post
            </button>
          </div>
        </div>

        {/* Navigation arrows */}
        {posts.length > 1 && (
          <>
            <button
              onClick={handlePrevious}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-16 p-2 hover:bg-indigo-100 rounded-lg transition-colors text-indigo-600 hover:text-indigo-700 z-10"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-16 p-2 hover:bg-indigo-100 rounded-lg transition-colors text-indigo-600 hover:text-indigo-700 z-10"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Indicator dots */}
        {posts.length > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            {posts.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setCurrentIndex(idx);
                  scrollToIndex(idx);
                }}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  idx === currentIndex
                    ? "bg-indigo-600 w-8"
                    : "bg-slate-300 hover:bg-slate-400"
                }`}
              />
            ))}
          </div>
        )}

        {/* Counter */}
        {posts.length > 1 && (
          <div className="text-center mt-4 text-xs font-bold text-slate-600">
            {currentIndex + 1} / {posts.length}
          </div>
        )}
      </div>
    </div>
  );
}
