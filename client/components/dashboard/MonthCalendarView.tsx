import { useState } from "react";
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Music,
  Youtube,
  MapPin,
} from "lucide-react";
import { PostPreviewModal } from "./PostPreviewModal";
import { Post } from "@/types/post";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";
import { useRescheduleContent } from "@/hooks/useRescheduleContent";
import { cn } from "@/lib/design-system";

interface DayData {
  date: number;
  posts: Post[];
  isCurrentMonth: boolean;
}

const PLATFORM_ICONS: Record<string, any> = {
  facebook: Facebook,
  twitter: Twitter,
  instagram: Instagram,
  linkedin: Linkedin,
  tiktok: Music,
  youtube: Youtube,
  pinterest: MapPin,
};

const MONTH_DATA: DayData[] = [
  // Previous month days
  { date: 27, posts: [], isCurrentMonth: false },
  { date: 28, posts: [], isCurrentMonth: false },
  { date: 29, posts: [], isCurrentMonth: false },
  { date: 30, posts: [], isCurrentMonth: false },
  { date: 31, posts: [], isCurrentMonth: false },
  // Current month days
  { date: 1, posts: [], isCurrentMonth: true },
  {
    date: 2,
    posts: [
      {
        id: "1",
        title: "Product Launch",
        platform: "linkedin",
        status: "scheduled",
        excerpt:
          "Excited to announce our latest features that will transform your workflow.",
        brand: "Brand A",
        campaign: "Product Launch",
        createdDate: "2024-11-01",
        scheduledDate: "2024-11-02",
      },
    ],
    isCurrentMonth: true,
  },
  { date: 3, posts: [], isCurrentMonth: true },
  {
    date: 4,
    posts: [
      {
        id: "2",
        title: "Behind the Scenes",
        platform: "instagram",
        status: "scheduled",
        excerpt: "Meet the team working magic behind the scenes! 🎥✨",
        brand: "Brand A",
        campaign: "Brand Awareness",
        createdDate: "2024-11-01",
        scheduledDate: "2024-11-04",
      },
      {
        id: "3",
        title: "Weekly Tips",
        platform: "twitter",
        status: "published",
        excerpt: "Pro tip: Try this workflow hack to save hours weekly...",
        brand: "Brand B",
        campaign: "Customer Spotlight",
        createdDate: "2024-11-03",
        scheduledDate: "2024-11-04",
      },
    ],
    isCurrentMonth: true,
  },
  { date: 5, posts: [], isCurrentMonth: true },
  {
    date: 6,
    posts: [
      {
        id: "4",
        title: "Customer Story",
        platform: "facebook",
        status: "draft",
        excerpt: "How our client increased conversions by 45% in 90 days",
        brand: "Brand A",
        campaign: "Customer Spotlight",
        createdDate: "2024-11-04",
      },
    ],
    isCurrentMonth: true,
  },
  { date: 7, posts: [], isCurrentMonth: true },
  {
    date: 8,
    posts: [
      {
        id: "5",
        title: "TikTok Challenge",
        platform: "tiktok",
        status: "scheduled",
        excerpt:
          "Join the #CreativeChallenge and show us your best content! ���",
        brand: "Brand A",
        campaign: "Product Launch",
        createdDate: "2024-11-06",
        scheduledDate: "2024-11-08",
      },
    ],
    isCurrentMonth: true,
  },
  {
    date: 9,
    posts: [
      {
        id: "6",
        title: "Video Demo",
        platform: "youtube",
        status: "published",
        excerpt:
          "Full walkthrough of our new dashboard and all its powerful features.",
        brand: "Brand B",
        campaign: "Product Launch",
        createdDate: "2024-11-07",
        scheduledDate: "2024-11-09",
      },
    ],
    isCurrentMonth: true,
  },
  { date: 10, posts: [], isCurrentMonth: true },
  {
    date: 11,
    posts: [
      {
        id: "7",
        title: "Design Inspiration",
        platform: "pinterest",
        status: "scheduled",
        excerpt: "30 stunning design layouts to inspire your next campaign",
        brand: "Brand A",
        campaign: "Holiday Promo",
        createdDate: "2024-11-09",
        scheduledDate: "2024-11-11",
      },
    ],
    isCurrentMonth: true,
  },
  { date: 12, posts: [], isCurrentMonth: true },
  { date: 13, posts: [], isCurrentMonth: true },
  { date: 14, posts: [], isCurrentMonth: true },
  { date: 15, posts: [], isCurrentMonth: true },
  {
    date: 16,
    posts: [
      {
        id: "8",
        title: "Team Highlights",
        platform: "linkedin",
        status: "scheduled",
        excerpt: "Team feature...",
        brand: "Brand A",
        campaign: "Brand Awareness",
        createdDate: "2024-11-14",
        scheduledDate: "2024-11-16",
      },
    ],
    isCurrentMonth: true,
  },
  { date: 17, posts: [], isCurrentMonth: true },
  { date: 18, posts: [], isCurrentMonth: true },
  { date: 19, posts: [], isCurrentMonth: true },
  { date: 20, posts: [], isCurrentMonth: true },
  { date: 21, posts: [], isCurrentMonth: true },
  { date: 22, posts: [], isCurrentMonth: true },
  { date: 23, posts: [], isCurrentMonth: true },
  { date: 24, posts: [], isCurrentMonth: true },
  { date: 25, posts: [], isCurrentMonth: true },
  { date: 26, posts: [], isCurrentMonth: true },
  { date: 27, posts: [], isCurrentMonth: true },
  { date: 28, posts: [], isCurrentMonth: true },
  { date: 29, posts: [], isCurrentMonth: true },
  { date: 30, posts: [], isCurrentMonth: true },
  // Next month days
  { date: 1, posts: [], isCurrentMonth: false },
  { date: 2, posts: [], isCurrentMonth: false },
  { date: 3, posts: [], isCurrentMonth: false },
];

interface MonthCalendarViewProps {
  filterBrand?: string | null;
  filterPlatforms?: string[];
  filterCampaign?: string | null;
}

export function MonthCalendarView({
  filterBrand = null,
  filterPlatforms = [],
  filterCampaign = null,
}: MonthCalendarViewProps) {
  const [previewPost, setPreviewPost] = useState<Post | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  
  // Drag-and-drop functionality
  const { reschedule, preferredSchedule } = useRescheduleContent();
  const {
    draggedItem,
    dragOverTarget,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  } = useDragAndDrop({
    onDrop: async (itemId, target) => {
      await reschedule(itemId, target);
    },
    enabled: true,
    preferredSchedule: preferredSchedule || null,
  });

  const filteredDays = MONTH_DATA.map((day) => ({
    ...day,
    posts: day.posts.filter((post) => {
      if (filterBrand && post.brand !== filterBrand) return false;
      if (filterPlatforms.length > 0) {
        const platformNames: Record<string, string> = {
          linkedin: "LinkedIn",
          instagram: "Instagram",
          facebook: "Facebook",
          twitter: "Twitter",
          tiktok: "TikTok",
          youtube: "YouTube",
          pinterest: "Pinterest",
        };
        if (!filterPlatforms.includes(platformNames[post.platform]))
          return false;
      }
      if (filterCampaign && post.campaign !== filterCampaign) return false;
      return true;
    }),
  }));

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="bg-white/50 backdrop-blur-xl rounded-2xl p-6 border border-white/60 hover:bg-white/70 hover:shadow-md transition-all duration-300 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/40 via-blue-50/20 to-transparent rounded-2xl -z-10"></div>

      <div className="relative">
        {/* Month header */}
        <div className="mb-6 pb-4 border-b border-indigo-200/40">
          <h3 className="text-lg font-black text-slate-900">November 2024</h3>
          <p className="text-xs text-slate-600 font-medium">
            Click a day to see details
          </p>
        </div>

        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-black text-slate-600 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-2">
          {filteredDays.map((day, idx) => {
            // Convert day.date (number) to ISO date string
            const currentYear = new Date().getFullYear();
            const currentMonth = new Date().getMonth() + 1; // November = 11
            const dateStr = day.isCurrentMonth
              ? `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(day.date).padStart(2, "0")}`
              : "";

            return (
              <div
                key={idx}
                onDragOver={(e) => {
                  if (day.isCurrentMonth && dateStr) {
                    e.preventDefault();
                    handleDragOver(e, { date: dateStr });
                  }
                }}
                onDragLeave={handleDragLeave}
                onDrop={(e) => {
                  if (day.isCurrentMonth && dateStr) {
                    handleDrop(e, { date: dateStr });
                  }
                }}
                className={cn(
                  "aspect-square rounded-lg p-2 border transition-all duration-200 hover:shadow-md group flex flex-col",
                  day.isCurrentMonth
                    ? "bg-gradient-to-br from-indigo-50/30 to-blue-50/10 border-indigo-200/40 hover:border-indigo-300/60 hover:bg-indigo-50/50"
                    : "bg-slate-100/30 border-slate-200/30 opacity-50",
                  dragOverTarget?.date === dateStr && day.isCurrentMonth && "bg-indigo-100/50 border-2 border-indigo-400 border-dashed"
                )}
              >
              <span
                className={`text-xs font-bold ${day.isCurrentMonth ? "text-slate-900" : "text-slate-500"}`}
              >
                {day.date}
              </span>

              {day.posts.length > 0 && day.isCurrentMonth && (
                <div className="mt-auto flex flex-wrap gap-1.5 items-center justify-start">
                  {day.posts.slice(0, 3).map((post) => {
                    const Icon = PLATFORM_ICONS[post.platform];
                    const statusIndicator =
                      post.status === "draft"
                        ? "🔲"
                        : post.status === "reviewing"
                          ? "🔄"
                          : post.status === "published"
                            ? "✓"
                            : post.status === "scheduled"
                              ? "📅"
                              : "⚠️";
                    // Get current date for this post
                    const postCurrentDate = post.scheduledDate || dateStr;
                    const postCurrentTime = undefined; // Month view doesn't show time

                    return (
                      <div
                        key={post.id}
                        draggable={day.isCurrentMonth && post.status === "scheduled"}
                        onDragStart={(e) => {
                          if (day.isCurrentMonth) {
                            handleDragStart(e, {
                              id: post.id,
                              type: "post",
                              currentDate: postCurrentDate,
                              currentTime: postCurrentTime,
                            });
                          }
                        }}
                        onDragEnd={handleDragEnd}
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewPost(post);
                          setShowPreview(true);
                        }}
                        className={cn(
                          "relative group",
                          day.isCurrentMonth && post.status === "scheduled" ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
                          draggedItem?.id === post.id && "opacity-50"
                        )}
                        role="button"
                        tabIndex={0}
                        title={`${day.isCurrentMonth && post.status === "scheduled" ? "Drag to reschedule or " : ""}Click to preview: ${post.title}`}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.stopPropagation();
                            setPreviewPost(post);
                            setShowPreview(true);
                          }
                        }}
                      >
                        <div className="flex items-center gap-0.5 bg-white/70 rounded-md px-1.5 py-1 border border-indigo-200/50 hover:border-indigo-400/70 transition-all hover:shadow-sm">
                          <Icon className="w-3 h-3 text-indigo-600" />
                          <span className="text-xs font-bold text-slate-700">
                            {statusIndicator}
                          </span>
                        </div>
                        {/* Tooltip on hover */}
                        <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-slate-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10 font-medium shadow-lg">
                          {post.title}
                        </div>
                      </div>
                    );
                  })}
                  {day.posts.length > 3 && (
                    <div className="text-xs font-bold text-indigo-600 group-hover:text-indigo-700 transition-colors">
                      +{day.posts.length - 3}
                    </div>
                  )}
                </div>
              )}

              {day.posts.length === 0 && day.isCurrentMonth && (
                <div className="mt-auto opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-xs text-slate-400 font-medium">No posts</p>
                </div>
              )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Post Preview Modal */}
      <PostPreviewModal
        post={previewPost}
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
      />
    </div>
  );
}
