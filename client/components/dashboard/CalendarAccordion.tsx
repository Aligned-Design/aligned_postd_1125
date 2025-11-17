import { useState } from "react";
import { ChevronDown, Music, Youtube, MapPin, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";
import { useRescheduleContent } from "@/hooks/useRescheduleContent";
import { useToast } from "@/hooks/use-toast";
import { PostPreviewModal } from "./PostPreviewModal";
import type { Post } from "@/types/post";
import { cn } from "@/lib/design-system";

interface CalendarPost {
  id: string;
  title: string;
  platform: "linkedin" | "instagram" | "facebook" | "twitter" | "tiktok" | "youtube" | "pinterest";
  status: "draft" | "reviewing" | "approved" | "scheduled";
  scheduledTime: string;
  excerpt: string;
  brand?: string;
  campaign?: string;
}

interface DaySchedule {
  date: string;
  dayName: string;
  postCount: number;
  posts: CalendarPost[];
  statusDots: string[];
}

interface CalendarAccordionProps {
  view?: "day" | "week" | "month";
  filterBrand?: string | null;
  filterPlatforms?: string[];
  filterCampaign?: string | null;
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

export function CalendarAccordion({
  view = "week",
  filterBrand = null,
  filterPlatforms = [],
  filterCampaign = null,
}: CalendarAccordionProps) {
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([0])); // Default first day expanded
  const [previewPost, setPreviewPost] = useState<Post | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
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
    isDragging,
  } = useDragAndDrop({
    onDrop: async (itemId, target) => {
      await reschedule(itemId, target);
    },
    enabled: true,
    preferredSchedule: preferredSchedule || null,
  });

  const allSchedules: DaySchedule[] = [
    {
      date: "Mon 11/18",
      dayName: "Monday",
      postCount: 3,
      statusDots: ["approved", "scheduled", "scheduled"],
      posts: [
        {
          id: "1",
          title: "Introducing New Features",
          platform: "linkedin",
          status: "scheduled",
          scheduledTime: "9:00 AM",
          excerpt: "We're excited to announce our latest product updates...",
          brand: "Aligned-20AI",
          campaign: "Product Launch",
        },
        {
          id: "2",
          title: "Behind the Scenes",
          platform: "instagram",
          status: "scheduled",
          scheduledTime: "2:30 PM",
          excerpt: "Get a sneak peek into how our team creates content...",
          brand: "Aligned-20AI",
          campaign: "Brand Awareness",
        },
        {
          id: "3",
          title: "Weekly Tips",
          platform: "twitter",
          status: "approved",
          scheduledTime: "10:00 AM",
          excerpt: "Three quick ways to boost your engagement this week...",
          brand: "Brand B",
          campaign: "Customer Spotlight",
        },
      ],
    },
    {
      date: "Tue 11/19",
      dayName: "Tuesday",
      postCount: 2,
      statusDots: ["reviewing", "draft"],
      posts: [
        {
          id: "4",
          title: "Customer Success Story",
          platform: "facebook",
          status: "reviewing",
          scheduledTime: "11:00 AM",
          excerpt: "See how our customers are achieving their goals...",
          brand: "Aligned-20AI",
          campaign: "Customer Spotlight",
        },
        {
          id: "5",
          title: "Weekly Newsletter",
          platform: "linkedin",
          status: "draft",
          scheduledTime: "8:00 AM",
          excerpt: "This week's must-read insights and trends...",
          brand: "Brand C",
          campaign: "Brand Awareness",
        },
      ],
    },
    {
      date: "Wed 11/20",
      dayName: "Wednesday",
      postCount: 4,
      statusDots: ["scheduled", "scheduled", "approved", "scheduled"],
      posts: [
        {
          id: "6",
          title: "Trending Sounds Challenge",
          platform: "tiktok",
          status: "scheduled",
          scheduledTime: "3:00 PM",
          excerpt: "Join the latest trend and show your creative side...",
          brand: "Aligned-20AI",
          campaign: "Product Launch",
        },
        {
          id: "7",
          title: "Product Demo Video",
          platform: "youtube",
          status: "approved",
          scheduledTime: "1:00 PM",
          excerpt: "In-depth walkthrough of our latest features...",
          brand: "Brand B",
          campaign: "Product Launch",
        },
        {
          id: "8",
          title: "Design Inspiration",
          platform: "pinterest",
          status: "scheduled",
          scheduledTime: "4:00 PM",
          excerpt: "Curated collection of design inspiration...",
          brand: "Aligned-20AI",
          campaign: "Holiday Promo",
        },
        {
          id: "9",
          title: "Quick Tips",
          platform: "instagram",
          status: "scheduled",
          scheduledTime: "2:00 PM",
          excerpt: "Fast-paced tips for content creators...",
          brand: "Brand C",
          campaign: "Brand Awareness",
        },
      ],
    },
    {
      date: "Thu 11/21",
      dayName: "Thursday",
      postCount: 1,
      statusDots: ["scheduled"],
      posts: [
        {
          id: "10",
          title: "Team Highlights",
          platform: "linkedin",
          status: "scheduled",
          scheduledTime: "9:00 AM",
          excerpt: "Celebrating our amazing team this week...",
          brand: "Aligned-20AI",
          campaign: "Brand Awareness",
        },
      ],
    },
    {
      date: "Fri 11/22",
      dayName: "Friday",
      postCount: 2,
      statusDots: ["draft", "scheduled"],
      posts: [
        {
          id: "11",
          title: "Weekend Plans",
          platform: "twitter",
          status: "draft",
          scheduledTime: "TBD",
          excerpt: "What's on your weekend agenda?...",
          brand: "Brand B",
          campaign: "Customer Spotlight",
        },
        {
          id: "12",
          title: "Week Recap",
          platform: "facebook",
          status: "scheduled",
          scheduledTime: "5:00 PM",
          excerpt: "This week's highlights and key moments...",
          brand: "Aligned-20AI",
          campaign: "Product Launch",
        },
      ],
    },
    {
      date: "Sat 11/23",
      dayName: "Saturday",
      postCount: 0,
      statusDots: [],
      posts: [],
    },
    {
      date: "Sun 11/24",
      dayName: "Sunday",
      postCount: 1,
      statusDots: ["scheduled"],
      posts: [
        {
          id: "13",
          title: "Sunday Inspiration",
          platform: "instagram",
          status: "scheduled",
          scheduledTime: "10:00 AM",
          excerpt: "Start your week with inspiration...",
          brand: "Aligned-20AI",
          campaign: "Holiday Promo",
        },
      ],
    },
  ];

  // Filter posts based on filters
  const filteredSchedules = allSchedules
    .map((day) => ({
      ...day,
      posts: day.posts.filter((post) => {
        if (filterBrand && post.brand !== filterBrand) return false;
        if (filterPlatforms.length > 0 && !filterPlatforms.includes(post.platform.toUpperCase())) {
          // Check if platform name matches (case-insensitive)
          const platformNames: Record<string, string> = {
            linkedin: "LinkedIn",
            instagram: "Instagram",
            facebook: "Facebook",
            twitter: "Twitter",
            tiktok: "TikTok",
            youtube: "YouTube",
            pinterest: "Pinterest",
          };
          if (!filterPlatforms.includes(platformNames[post.platform])) return false;
        }
        if (filterCampaign && post.campaign !== filterCampaign) return false;
        return true;
      }),
    }))
    .map((day) => ({
      ...day,
      postCount: day.posts.length,
      statusDots: day.posts.map((p) => p.status),
    }));

  // Apply view filtering
  let schedule: DaySchedule[] = [];
  if (view === "day") {
    schedule = filteredSchedules.slice(0, 1);
  } else if (view === "week") {
    schedule = filteredSchedules;
  } else if (view === "month") {
    // In a real app, we'd have 30 days of data; for now, repeat the week
    schedule = [...filteredSchedules, ...filteredSchedules.slice(0, 4)];
  }

  const toggleDay = (dayIndex: number) => {
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(dayIndex)) {
      newExpanded.delete(dayIndex);
    } else {
      newExpanded.add(dayIndex);
    }
    setExpandedDays(newExpanded);
  };

  const toggleAllDays = () => {
    if (expandedDays.size === schedule.length) {
      setExpandedDays(new Set());
    } else {
      setExpandedDays(new Set(schedule.map((_, idx) => idx)));
    }
  };

  const handlePreview = (post: CalendarPost) => {
    // Convert CalendarPost to Post for preview modal
    const previewPostData: Post = {
      id: post.id,
      title: post.title,
      platform: post.platform,
      status: post.status === "approved" ? "scheduled" : post.status === "reviewing" ? "reviewing" : "scheduled",
      brand: post.brand || "",
      campaign: post.campaign || "",
      createdDate: new Date().toISOString(),
      scheduledDate: post.scheduledTime,
      excerpt: post.excerpt,
    };
    setPreviewPost(previewPostData);
    setShowPreview(true);
  };

  const handleEdit = (post: CalendarPost) => {
    navigate(`/studio?postId=${post.id}`);
  };

  const handleApprove = async (post: CalendarPost) => {
    try {
      const response = await fetch(`/api/approvals/${post.id}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.error?.message || `Failed to approve post: ${response.status}`);
      }

      const result = await response.json();
      
      toast({
        title: "Post Approved",
        description: `${post.title} has been approved successfully.`,
        variant: "default",
      });

      // Update local state to reflect approval
      // In a real app, you'd refetch the schedule data here
      // For now, we'll just show the toast
    } catch (error) {
      console.error("Failed to approve post:", error);
      toast({
        title: "Approval Failed",
        description: error instanceof Error ? error.message : "Failed to approve post. Please try again.",
        variant: "destructive",
      });
    }
  };

  const statusDotMap = {
    draft: "bg-gray-400",
    reviewing: "bg-yellow-500",
    approved: "bg-green-500",
    scheduled: "bg-blue-500",
  };

  return (
    <div className="bg-white/50 backdrop-blur-xl rounded-2xl p-6 border border-white/60 hover:bg-white/70 hover:shadow-md transition-all duration-300 relative overflow-hidden">
      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/40 via-blue-50/20 to-transparent rounded-2xl -z-10"></div>

      {/* Header with toggle */}
      <div className="relative flex items-center justify-between mb-6 pb-4 border-b border-indigo-200/40">
        <div>
          <h3 className="text-lg font-black text-slate-900">
            {view === "day" ? "Today" : view === "week" ? "Next 7 Days" : "This Month"}
          </h3>
          <p className="text-xs text-slate-600 font-medium">
            {view === "day"
              ? "Content scheduled for today"
              : view === "week"
              ? "Content scheduled for this week"
              : "Content scheduled this month"}
          </p>
        </div>
        <button
          onClick={toggleAllDays}
          className="text-xs font-bold px-2 py-1 rounded-md bg-indigo-100/50 text-indigo-600 hover:bg-indigo-100 transition-all duration-200"
        >
          {expandedDays.size === schedule.length ? "Collapse" : "Expand"} All
        </button>
      </div>

      {/* Days accordion */}
      <div className="relative space-y-2">
        {schedule.map((day, dayIndex) => {
          const isExpanded = expandedDays.has(dayIndex);

          return (
            <div
              key={dayIndex}
              className="rounded-lg border border-indigo-200/20 overflow-hidden transition-all duration-300"
            >
              {/* Day header - always visible - drop zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  // Extract date from day.date (format: "Mon 11/18")
                  const dateMatch = day.date.match(/(\d{1,2})\/(\d{1,2})/);
                  if (dateMatch) {
                    const [, month, dayNum] = dateMatch;
                    const currentYear = new Date().getFullYear();
                    const dateStr = `${currentYear}-${month.padStart(2, "0")}-${dayNum.padStart(2, "0")}`;
                    handleDragOver(e, { date: dateStr });
                  }
                }}
                onDragLeave={handleDragLeave}
                onDrop={(e) => {
                  const dateMatch = day.date.match(/(\d{1,2})\/(\d{1,2})/);
                  if (dateMatch) {
                    const [, month, dayNum] = dateMatch;
                    const currentYear = new Date().getFullYear();
                    const dateStr = `${currentYear}-${month.padStart(2, "0")}-${dayNum.padStart(2, "0")}`;
                    handleDrop(e, { date: dateStr });
                  }
                }}
                className={cn(
                  "w-full transition-all duration-300",
                  dragOverTarget && "bg-indigo-100/50 border-2 border-indigo-400 border-dashed"
                )}
              >
                <button
                  onClick={() => toggleDay(dayIndex)}
                  className="w-full px-4 py-3 bg-gradient-to-br from-indigo-50/30 to-blue-50/10 hover:from-indigo-50/50 hover:to-blue-50/20 transition-all duration-300 flex items-center justify-between group"
                >
                <div className="flex items-center gap-3 flex-1">
                  <ChevronDown
                    className={`w-5 h-5 text-indigo-600 transition-transform duration-300 ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                  <div className="text-left">
                    <p className="font-bold text-slate-900 text-sm">{day.date}</p>
                    <p className="text-xs text-slate-600 font-medium">{day.postCount} posts</p>
                  </div>
                </div>

                {/* Status dots */}
                <div className="flex items-center gap-1.5">
                  {day.statusDots.map((status, idx) => (
                    <div
                      key={idx}
                      className={`w-2.5 h-2.5 rounded-full ${statusDotMap[status as keyof typeof statusDotMap]} shadow-sm`}
                    />
                  ))}
                </div>
                </button>
              </div>

              {/* Day content - expandable */}
              {isExpanded && (
                <div className="bg-white/30 border-t border-indigo-200/20 p-4 space-y-2 animate-[slideDown_200ms_ease-out]">
                  {day.posts.length > 0 ? (
                    day.posts.map((post) => {
                      const Icon = PLATFORM_ICONS[post.platform];
                      const statusColors = {
                        draft: "bg-gray-100 text-gray-700",
                        reviewing: "bg-yellow-100 text-yellow-700",
                        approved: "bg-green-100 text-green-700",
                        scheduled: "bg-blue-100 text-blue-700",
                      };

                      // Extract date from day.date for drag item
                      const dateMatch = day.date.match(/(\d{1,2})\/(\d{1,2})/);
                      const currentYear = new Date().getFullYear();
                      const currentDate = dateMatch
                        ? `${currentYear}-${dateMatch[1].padStart(2, "0")}-${dateMatch[2].padStart(2, "0")}`
                        : "";
                      
                      // Parse time from scheduledTime (format: "9:00 AM")
                      const timeMatch = post.scheduledTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
                      const currentTime = timeMatch
                        ? `${String((parseInt(timeMatch[1]) % 12) + (timeMatch[3].toUpperCase() === "PM" ? 12 : 0)).padStart(2, "0")}:${timeMatch[2]}`
                        : undefined;

                      return (
                        <div
                          key={post.id}
                          draggable={post.status === "scheduled" || post.status === "approved"}
                          onDragStart={(e) => handleDragStart(e, {
                            id: post.id,
                            type: "post",
                            currentDate,
                            currentTime,
                          })}
                          onDragEnd={handleDragEnd}
                          className={cn(
                            "group/post rounded-lg p-3 bg-white/40 hover:bg-white/60 border border-indigo-200/20 hover:border-indigo-300/50 transition-all duration-300 cursor-move hover:shadow-sm",
                            (post.status === "scheduled" || post.status === "approved") && "cursor-grab active:cursor-grabbing",
                            draggedItem?.id === post.id && "opacity-50"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0">
                              <Icon className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <h4 className="font-bold text-slate-900 text-sm leading-tight group-hover/post:text-indigo-600 transition-colors">
                                  {post.title}
                                </h4>
                                <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-bold ${statusColors[post.status]}`}>
                                  {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 font-medium mb-2 line-clamp-1">
                                {post.excerpt}
                              </p>
                              <div className="flex items-center justify-between gap-2 text-xs text-slate-500 font-medium">
                                <span>{post.scheduledTime}</span>
                                <div className="flex items-center gap-1.5 opacity-0 group-hover/post:opacity-100 transition-opacity">
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePreview(post);
                                    }}
                                    className="px-2 py-0.5 rounded hover:bg-indigo-100 text-indigo-600 font-bold hover:text-indigo-700 transition-all"
                                  >
                                    Preview
                                  </button>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEdit(post);
                                    }}
                                    className="px-2 py-0.5 rounded hover:bg-indigo-100 text-indigo-600 font-bold hover:text-indigo-700 transition-all"
                                  >
                                    Edit
                                  </button>
                                  {post.status !== "approved" && (
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleApprove(post);
                                      }}
                                      className="px-2 py-0.5 rounded hover:bg-lime-100 text-lime-600 font-bold hover:text-lime-700 transition-all"
                                    >
                                      Approve
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-slate-500 text-center py-4">No posts scheduled for this day</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Preview Modal */}
      {previewPost && (
        <PostPreviewModal
          post={previewPost}
          isOpen={showPreview}
          onClose={() => {
            setShowPreview(false);
            setPreviewPost(null);
          }}
        />
      )}
    </div>
  );
}
