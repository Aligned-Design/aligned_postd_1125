import { useState } from "react";
import { Facebook, Twitter, Instagram, Linkedin, Music, Youtube, MapPin, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";
import { useRescheduleContent } from "@/hooks/useRescheduleContent";
import { useToast } from "@/hooks/use-toast";
import { PostPreviewModal } from "./PostPreviewModal";
import type { Post } from "@/types/post";
import { cn } from "@/lib/design-system";

interface HourlyPost {
  id: string;
  title: string;
  platform: "linkedin" | "instagram" | "facebook" | "twitter" | "tiktok" | "youtube" | "pinterest";
  status: "draft" | "reviewing" | "approved" | "scheduled";
  scheduledTime: string;
  excerpt: string;
  brand?: string;
  campaign?: string;
  hour?: number;
}

interface HourlySlot {
  hour: number;
  posts: HourlyPost[];
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

const statusColors = {
  draft: "bg-gray-100 text-gray-700",
  reviewing: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  scheduled: "bg-blue-100 text-blue-700",
};

const DAY_POSTS: HourlyPost[] = [
  {
    id: "1",
    title: "Introducing New Features",
    platform: "linkedin" as const,
    status: "scheduled" as const,
    scheduledTime: "9:00 AM",
    excerpt: "We're excited to announce...",
    brand: "POSTD",
    campaign: "Product Launch",
    hour: 9,
  },
  {
    id: "2",
    title: "Behind the Scenes",
    platform: "instagram" as const,
    status: "scheduled" as const,
    scheduledTime: "2:30 PM",
    excerpt: "Get a sneak peek...",
    brand: "POSTD",
    campaign: "Brand Awareness",
    hour: 14,
  },
  {
    id: "3",
    title: "Weekly Tips",
    platform: "twitter" as const,
    status: "approved" as const,
    scheduledTime: "10:00 AM",
    excerpt: "Three quick ways...",
    brand: "Brand B",
    campaign: "Customer Spotlight",
    hour: 10,
  },
  {
    id: "4",
    title: "Customer Success Story",
    platform: "facebook" as const,
    status: "reviewing" as const,
    scheduledTime: "11:00 AM",
    excerpt: "See how customers...",
    brand: "POSTD",
    campaign: "Customer Spotlight",
    hour: 11,
  },
  {
    id: "5",
    title: "Evening Roundup",
    platform: "instagram" as const,
    status: "scheduled" as const,
    scheduledTime: "6:00 PM",
    excerpt: "Today's highlights...",
    brand: "Brand C",
    campaign: "Brand Awareness",
    hour: 18,
  },
];

interface DayViewHourlyProps {
  filterBrand?: string | null;
  filterPlatforms?: string[];
  filterCampaign?: string | null;
}

export function DayViewHourly({
  filterBrand = null,
  filterPlatforms = [],
  filterCampaign = null,
}: DayViewHourlyProps) {
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
  } = useDragAndDrop({
    onDrop: async (itemId, target) => {
      await reschedule(itemId, target);
    },
    enabled: true,
    preferredSchedule: preferredSchedule || null,
  });

  // Filter posts
  const filteredPosts = DAY_POSTS.filter((post) => {
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
      if (!filterPlatforms.includes(platformNames[post.platform])) return false;
    }
    if (filterCampaign && post.campaign !== filterCampaign) return false;
    return true;
  });

  // Create hourly slots
  const slots: HourlySlot[] = [];
  for (let hour = 6; hour <= 23; hour++) {
    slots.push({
      hour,
      posts: filteredPosts.filter((p) => p.hour === hour),
    });
  }

  const formatHour = (hour: number) => {
    if (hour === 0) return "12 AM";
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return "12 PM";
    return `${hour - 12} PM`;
  };

  return (
    <div className="bg-white/50 backdrop-blur-xl rounded-2xl p-6 border border-white/60 hover:bg-white/70 hover:shadow-md transition-all duration-300 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/40 via-blue-50/20 to-transparent rounded-2xl -z-10"></div>

      <div className="relative">
        {/* Header */}
        <div className="mb-6 pb-4 border-b border-indigo-200/40">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-slate-900" />
            <h3 className="text-lg font-black text-slate-900">Monday, November 18</h3>
          </div>
          <p className="text-xs text-slate-600 font-medium">
            {filteredPosts.length} posts scheduled today
          </p>
        </div>

        {/* Timeline */}
        <div className="space-y-1">
          {slots.map((slot, idx) => (
            <div key={idx} className="flex gap-4">
              {/* Hour label */}
              <div className="w-20 flex-shrink-0">
                <div className="sticky top-0 text-xs font-bold text-slate-600 pt-3">
                  {formatHour(slot.hour)}
                </div>
              </div>

              {/* Slot content - drop zone */}
              <div
                className={cn(
                  "flex-1 pb-4 min-h-[60px] rounded-lg transition-all",
                  dragOverTarget?.time === `${slot.hour}:00` && "bg-indigo-100/50 border-2 border-indigo-400 border-dashed"
                )}
                onDragOver={(e) => {
                  e.preventDefault();
                  const today = new Date();
                  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
                  handleDragOver(e, { date: dateStr, time: `${slot.hour}:00` });
                }}
                onDragLeave={handleDragLeave}
                onDrop={(e) => {
                  const today = new Date();
                  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
                  handleDrop(e, { date: dateStr, time: `${slot.hour}:00` });
                }}
              >
                {slot.posts.length > 0 ? (
                  <div className="space-y-2">
                    {slot.posts.map((post) => {
                      const Icon = PLATFORM_ICONS[post.platform];
                      const today = new Date();
                      const currentDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
                      const currentTime = `${String(post.hour || 0).padStart(2, "0")}:00`;

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
                            "group/post rounded-lg p-3 bg-gradient-to-br from-indigo-50/40 to-blue-50/20 border border-indigo-200/40 hover:border-indigo-300/60 hover:shadow-md transition-all duration-300",
                            (post.status === "scheduled" || post.status === "approved") && "cursor-grab active:cursor-grabbing",
                            draggedItem?.id === post.id && "opacity-50"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <Icon className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <h4 className="font-bold text-slate-900 text-sm leading-tight group-hover/post:text-indigo-600 transition-colors">
                                  {post.title}
                                </h4>
                                <span
                                  className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-bold ${statusColors[post.status]}`}
                                >
                                  {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 font-medium line-clamp-1 mb-1">
                                {post.excerpt}
                              </p>
                              <div className="flex items-center justify-between gap-2 text-xs text-slate-500 font-medium">
                                <span className="text-indigo-600 font-bold">{post.scheduledTime}</span>
                                <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs font-bold">
                                  {post.campaign}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 mt-3 opacity-0 group-hover/post:opacity-100 transition-opacity pt-2 border-t border-indigo-200/30">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
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
                              }}
                              className="flex-1 px-2 py-1 rounded text-xs font-bold bg-indigo-100 hover:bg-indigo-200 text-indigo-600 transition-colors"
                            >
                              Preview
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/studio?postId=${post.id}`);
                              }}
                              className="flex-1 px-2 py-1 rounded text-xs font-bold bg-indigo-100 hover:bg-indigo-200 text-indigo-600 transition-colors"
                            >
                              Edit
                            </button>
                            {post.status !== "approved" && (
                              <button 
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    const response = await fetch(`/api/approvals/${post.id}/approve`, {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({}),
                                    });
                                    if (!response.ok) throw new Error("Failed to approve");
                                    toast({
                                      title: "Post Approved",
                                      description: `${post.title} has been approved successfully.`,
                                    });
                                  } catch (error) {
                                    toast({
                                      title: "Approval Failed",
                                      description: "Failed to approve post. Please try again.",
                                      variant: "destructive",
                                    });
                                  }
                                }}
                                className="flex-1 px-2 py-1 rounded text-xs font-bold bg-lime-100 hover:bg-lime-200 text-lime-600 transition-colors"
                              >
                                Approve
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-3 border-t border-slate-200/30 group hover:bg-indigo-50/20 rounded transition-colors">
                    <p className="text-xs text-slate-400 font-medium">No posts scheduled</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
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
