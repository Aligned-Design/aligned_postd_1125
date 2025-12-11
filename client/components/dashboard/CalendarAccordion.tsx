import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Music, Youtube, MapPin, Facebook, Twitter, Instagram, Linkedin, Calendar as CalendarIcon, Wand2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";
import { useRescheduleContent } from "@/hooks/useRescheduleContent";
import { useToast } from "@/hooks/use-toast";
import { useCurrentBrand } from "@/hooks/useCurrentBrand";
import { PostPreviewModal } from "./PostPreviewModal";
import type { Post } from "@/types/post";
import { cn } from "@/lib/design-system";
import { LoadingState } from "@/components/postd/dashboard/states/LoadingState";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { SocialContentEditor, GenerateSocialButton } from "@/components/content/SocialContentEditor";
import { isSupportedPlatform } from "@/hooks/useSocialContentGeneration";

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

interface CalendarApiItem {
  id: string;
  title: string;
  platform: string;
  contentType: string;
  status: string;
  scheduledDate: string | null;
  scheduledTime: string | null;
  content: string;
  excerpt: string;
  imageUrl: string | null;
  brand: string;
  campaign: string | null;
  createdDate: string | null;
}

interface CalendarApiResponse {
  success: boolean;
  items: CalendarApiItem[];
  count: number;
}

async function fetchCalendar(brandId: string, startDate?: string, endDate?: string, status?: string): Promise<CalendarApiResponse> {
  const { apiGet } = await import("@/lib/api");
  const params = new URLSearchParams();
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);
  if (status) params.append("status", status);
  
  const queryString = params.toString();
  const url = `/api/calendar/${brandId}${queryString ? `?${queryString}` : ""}`;
  return apiGet<CalendarApiResponse>(url);
}

function transformCalendarItemsToDaySchedules(items: CalendarApiItem[]): DaySchedule[] {
  // Group items by date
  const itemsByDate = new Map<string, CalendarApiItem[]>();
  
  items.forEach((item) => {
    if (!item.scheduledDate) return;
    const dateKey = item.scheduledDate;
    if (!itemsByDate.has(dateKey)) {
      itemsByDate.set(dateKey, []);
    }
    itemsByDate.get(dateKey)!.push(item);
  });

  // Convert to DaySchedule format
  const daySchedules: DaySchedule[] = [];
  const sortedDates = Array.from(itemsByDate.keys()).sort();
  
  sortedDates.forEach((dateStr) => {
    const itemsForDate = itemsByDate.get(dateStr)!;
    const date = new Date(dateStr);
    const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
    const dateFormatted = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    
    const posts: CalendarPost[] = itemsForDate.map((item) => ({
      id: item.id,
      title: item.title,
      platform: item.platform as CalendarPost["platform"],
      status: (item.status === "pending_review" ? "reviewing" : item.status) as CalendarPost["status"],
      scheduledTime: item.scheduledTime || "TBD",
      excerpt: item.excerpt,
      brand: item.brand,
      campaign: item.campaign || undefined,
    }));

    daySchedules.push({
      date: `${dayName.slice(0, 3)} ${dateFormatted}`,
      dayName,
      postCount: posts.length,
      posts,
      statusDots: posts.map((p) => p.status),
    });
  });

  return daySchedules;
}

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
  const { brandId } = useCurrentBrand();
  
  // Calculate date range based on view
  const dateRange = useMemo(() => {
    const startDate = new Date();
    const endDate = new Date();
    if (view === "day") {
      endDate.setDate(endDate.getDate() + 1);
    } else if (view === "week") {
      endDate.setDate(endDate.getDate() + 7);
    } else {
      endDate.setDate(endDate.getDate() + 30);
    }
    return {
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
    };
  }, [view]);

  // Fetch calendar data
  const {
    data: calendarData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["calendar", brandId, dateRange.startDate, dateRange.endDate, view],
    queryFn: () => fetchCalendar(brandId!, dateRange.startDate, dateRange.endDate),
    enabled: !!brandId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Transform API data to DaySchedule format
  const daySchedules = useMemo(() => {
    if (!calendarData?.items) return [];
    return transformCalendarItemsToDaySchedules(calendarData.items);
  }, [calendarData]);
  
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

  // Loading state
  if (isLoading) {
    return <LoadingState />;
  }

  // Error state
  if (isError) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : "Failed to load calendar"}
        onRetry={() => refetch()}
      />
    );
  }

  // Empty state
  if (!daySchedules || daySchedules.length === 0) {
    return (
      <EmptyState
        icon={CalendarIcon}
        title="No scheduled content"
        description="You don't have any content scheduled for this period. Create some content to see it here."
        action={{
          label: "Go to Studio",
          onClick: () => navigate("/studio"),
        }}
      />
    );
  }

  // Filter posts based on filters
  const filteredSchedules = daySchedules
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

      // Refetch calendar data to reflect approval
      refetch();
    } catch (error) {
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
                                  {/* Generate button for supported platforms */}
                                  {isSupportedPlatform(post.platform) && brandId && (
                                    <GenerateSocialButton
                                      slotId={post.id}
                                      brandId={brandId}
                                      platform={post.platform}
                                      compact
                                    />
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Social Content Editor (for FB/IG slots) */}
                          {isSupportedPlatform(post.platform) && brandId && (
                            <SocialContentEditor
                              slotId={post.id}
                              brandId={brandId}
                              platform={post.platform}
                              slotTitle={post.title}
                              className="mx-3 mb-3"
                            />
                          )}
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
