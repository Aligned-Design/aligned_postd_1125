import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useToast } from "@/hooks/use-toast";
import { logError } from "@/lib/logger";
import { PageShell } from "@/components/postd/ui/layout/PageShell";
import { PageHeader } from "@/components/postd/ui/layout/PageHeader";
import { StatusOverviewBanner } from "@/components/dashboard/StatusOverviewBanner";
import { QueueAdvisor } from "@/components/dashboard/QueueAdvisor";
import { PostActionMenu } from "@/components/dashboard/PostActionMenu";
import { PostPreviewModal } from "@/components/dashboard/PostPreviewModal";
import { PostCarousel } from "@/components/dashboard/PostCarousel";
import { SectionCarousel } from "@/components/dashboard/SectionCarousel";
import { Post, PLATFORM_ICONS, PostStatus } from "@/types/post";
import {
  Filter,
  X,
  Eye,
  Edit3,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
} from "lucide-react";

const allPosts: Post[] = [
  {
    id: "1",
    title: "Introducing New Features",
    platform: "linkedin",
    status: "reviewing",
    brand: "Postd",
    campaign: "Product Launch",
    createdDate: "Nov 18",
    scheduledDate: "Nov 22",
    excerpt: "We're excited to announce our latest product updates...",
  },
  {
    id: "2",
    title: "Behind the Scenes",
    platform: "instagram",
    status: "draft",
    brand: "Postd",
    campaign: "Brand Awareness",
    createdDate: "Nov 18",
    excerpt: "Get a sneak peek into how our team creates content...",
  },
  {
    id: "3",
    title: "Weekly Tips",
    platform: "twitter",
    status: "reviewing",
    brand: "Brand B",
    campaign: "Customer Spotlight",
    createdDate: "Nov 17",
    scheduledDate: "Nov 21",
    excerpt: "Three quick ways to boost your engagement this week...",
  },
  {
    id: "4",
    title: "Customer Success Story",
    platform: "facebook",
    status: "reviewing",
    brand: "Postd",
    campaign: "Customer Spotlight",
    createdDate: "Nov 17",
    excerpt: "See how our customers are achieving their goals...",
  },
  {
    id: "5",
    title: "Trending Sounds Challenge",
    platform: "tiktok",
    status: "scheduled",
    brand: "Postd",
    campaign: "Product Launch",
    createdDate: "Nov 16",
    scheduledDate: "Nov 20",
    excerpt: "Join the latest trend and show your creative side...",
  },
  {
    id: "6",
    title: "Product Demo Video",
    platform: "youtube",
    status: "scheduled",
    brand: "Brand B",
    campaign: "Product Launch",
    createdDate: "Nov 15",
    scheduledDate: "Nov 19",
    excerpt: "In-depth walkthrough of our latest features...",
  },
  {
    id: "7",
    title: "Design Inspiration",
    platform: "pinterest",
    status: "published",
    brand: "Postd",
    campaign: "Holiday Promo",
    createdDate: "Nov 14",
    scheduledDate: "Nov 18",
    excerpt: "Curated collection of design inspiration...",
  },
  {
    id: "8",
    title: "Team Highlights",
    platform: "linkedin",
    status: "published",
    brand: "Postd",
    campaign: "Brand Awareness",
    createdDate: "Nov 13",
    scheduledDate: "Nov 17",
    excerpt: "Celebrating our amazing team this week...",
  },
  {
    id: "9",
    title: "Weekend Plans",
    platform: "twitter",
    status: "draft",
    brand: "Brand B",
    campaign: "Customer Spotlight",
    createdDate: "Nov 12",
    excerpt: "What's on your weekend agenda?...",
  },
  {
    id: "10",
    title: "Email Campaign Sync Error",
    platform: "instagram",
    status: "draft",
    brand: "Brand C",
    campaign: "Brand Awareness",
    createdDate: "Nov 11",
    excerpt: "Failed to sync with email marketing platform...",
    errorMessage:
      "Failed to sync with email marketing platform. Please check your API credentials.",
  },
];

const statusConfig: Record<
  PostStatus,
  { label: string; color: string; icon: React.ReactNode; bgColor: string }
> = {
  draft: {
    label: "Drafts",
    color: "text-gray-700",
    icon: "✏️",
    bgColor: "bg-gray-50/50",
  },
  reviewing: {
    label: "Pending Approvals",
    color: "text-yellow-700",
    icon: "⏳",
    bgColor: "bg-yellow-50/50",
  },
  scheduled: {
    label: "Scheduled",
    color: "text-blue-700",
    icon: "📅",
    bgColor: "bg-blue-50/50",
  },
  published: {
    label: "Published",
    color: "text-green-700",
    icon: "✓",
    bgColor: "bg-green-50/50",
  },
  errored: {
    label: "Errored",
    color: "text-red-700",
    icon: "⚠️",
    bgColor: "bg-red-50/50",
  },
};

export default function ContentQueue() {
  const { currentWorkspace } = useWorkspace();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [bulkApprovingReviewing, setBulkApprovingReviewing] = useState(false);
  const [bulkRetryingErrored, setBulkRetryingErrored] = useState(false);
  const [previewPost, setPreviewPost] = useState<Post | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "carousel">("grid");
  const [posts, setPosts] = useState<Post[]>(allPosts);

  // Get status filter from URL query params
  const statusFilter = searchParams.get("status") as PostStatus | null;

  const brands = Array.from(new Set(posts.map((p) => p.brand)));
  const platforms = Array.from(new Set(posts.map((p) => p.platform)));
  const campaigns = Array.from(new Set(posts.map((p) => p.campaign)));

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform],
    );
  };

  const clearFilters = () => {
    setSelectedBrand(null);
    setSelectedPlatforms([]);
    setSelectedCampaign(null);
  };

  const handleBulkApprove = () => {
    setBulkApprovingReviewing(true);
    setTimeout(() => {
      setBulkApprovingReviewing(false);
    }, 1500);
  };

  const handleBulkRetry = () => {
    setBulkRetryingErrored(true);
    setTimeout(() => {
      setBulkRetryingErrored(false);
    }, 1500);
  };

  const hasActiveFilters =
    selectedBrand || selectedPlatforms.length > 0 || selectedCampaign;

  // Filter posts
  const filteredPosts = posts.filter((post) => {
    // Filter by status from URL if provided
    if (statusFilter && post.status !== statusFilter) return false;
    if (selectedBrand && post.brand !== selectedBrand) return false;
    if (selectedPlatforms.length > 0) {
      const platformNames: Record<string, string> = {
        linkedin: "LinkedIn",
        instagram: "Instagram",
        facebook: "Facebook",
        twitter: "Twitter",
        tiktok: "TikTok",
        youtube: "YouTube",
        pinterest: "Pinterest",
      };
      if (!selectedPlatforms.includes(platformNames[post.platform]))
        return false;
    }
    if (selectedCampaign && post.campaign !== selectedCampaign) return false;
    return true;
  });

  // Group by status
  const postsByStatus: Record<PostStatus, Post[]> = {
    draft: [],
    reviewing: [],
    scheduled: [],
    published: [],
    errored: [],
  };

  filteredPosts.forEach((post) => {
    postsByStatus[post.status].push(post);
  });

  const statusOrder: PostStatus[] = [
    "reviewing",
    "draft",
    "scheduled",
    "published",
    "errored",
  ];

  const PostCard = ({ post }: { post: Post }) => {
    const Icon = PLATFORM_ICONS[post.platform] as React.ComponentType<any>;
    const isPending = post.status === "reviewing";

    // Placeholder image - in production, this would come from post data
    const placeholderImage = `https://images.unsplash.com/photo-${
      post.id === "1"
        ? "1552664730-d307ca884978?w=400&h=300&fit=crop"
        : post.id === "3"
          ? "1611532736579-6b16e2b50449?w=400&h=300&fit=crop"
          : "1460661419201-fd4cecdf8a8b?w=400&h=300&fit=crop"
    }`;

    if (isPending) {
      // Pending cards: with image preview and 4-row layout
      return (
        <div className="group/card rounded-lg overflow-hidden bg-white/50 hover:bg-white/70 border border-indigo-200/20 hover:border-indigo-300/50 transition-all duration-300 hover:shadow-md flex flex-col h-full">
          {/* Image Preview */}
          <div className="relative w-full h-40 bg-gradient-to-br from-indigo-100 to-blue-100 overflow-hidden">
            <img
              src={placeholderImage}
              alt={post.title}
              className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-300"
            />
            <div className="absolute top-2 right-2 flex items-center gap-2">
              <Icon className="w-5 h-5 bg-white/90 rounded-full p-1 text-indigo-600" />
            </div>
          </div>

          {/* Content Area */}
          <div className="p-4 flex flex-col flex-1">
            {/* Row 1: Title */}
            <h4 className="font-bold text-slate-900 text-sm leading-tight mb-2 group-hover/card:text-indigo-600 transition-colors line-clamp-2">
              {post.title}
            </h4>

            {/* Row 2: Excerpt */}
            <p className="text-xs text-slate-600 font-medium mb-2 line-clamp-2 flex-grow">
              {post.excerpt}
            </p>

            {/* Row 3: Badges */}
            <div className="flex items-center flex-wrap gap-1 mb-3">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-indigo-100 text-indigo-700">
                {Icon && <Icon className="w-3 h-3" />}
              </span>
              <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-lime-100 text-lime-700">
                {post.campaign}
              </span>
            </div>

            {/* Row 4: Dates + Menu */}
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium pt-2 border-t border-indigo-200/30">
              <div>
                <span>Created {post.createdDate}</span>
                {post.scheduledDate && (
                  <span className="block text-indigo-600 font-bold">
                    Scheduled {post.scheduledDate}
                  </span>
                )}
              </div>
              <PostActionMenu
                postId={post.id}
                status={post.status}
                onDelete={() => {/* TODO: Implement delete */}}
                onDuplicate={() => {/* TODO: Implement duplicate */}}
                onSchedule={() => {/* TODO: Implement schedule */}}
                onChangeStatus={() => {/* TODO: Implement change status */}}
                onAssign={() => {/* TODO: Implement assign */}}
                onMoveCampaign={() => {/* TODO: Implement move campaign */}}
                onShare={() => {/* TODO: Implement share */}}
              />
            </div>
          </div>

          {/* Action buttons - visible on hover */}
          <div className="px-4 pb-4 flex gap-2 opacity-0 group-hover/card:opacity-100 transition-opacity">
            <button
              className="flex-1 px-2 py-1.5 rounded text-xs font-bold bg-indigo-100 hover:bg-indigo-200 text-indigo-600 transition-colors flex items-center justify-center gap-1"
              onClick={() => {
                setPreviewPost(post);
                setShowPreview(true);
              }}
            >
              <Edit3 className="w-3 h-3" />
              Edit
            </button>
            <button
              className="flex-1 px-2 py-1.5 rounded text-xs font-bold bg-lime-100 hover:bg-lime-200 text-lime-600 transition-colors flex items-center justify-center gap-1"
              onClick={async () => {
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

                  toast({
                    title: "Post Approved",
                    description: `${post.title} has been approved successfully.`,
                    variant: "default",
                  });

                  // Update local state - update post status to approved
                  setPosts((prevPosts) =>
                    prevPosts.map((p) =>
                      p.id === post.id ? { ...p, status: "approved" as PostStatus } : p
                    )
                  );
                } catch (error) {
                  logError("Failed to approve post", error instanceof Error ? error : new Error(String(error)), { postId: post.id });
                  toast({
                    title: "Approval Failed",
                    description: error instanceof Error ? error.message : "Failed to approve post. Please try again.",
                    variant: "destructive",
                  });
                }
              }}
            >
              <CheckCircle2 className="w-3 h-3" />
              Approve
            </button>
          </div>
        </div>
      );
    }

    // Non-pending cards: compact layout
    return (
      <div className="group/card p-4 rounded-lg bg-white/40 hover:bg-white/60 border border-indigo-200/20 hover:border-indigo-300/50 transition-all duration-300 hover:shadow-md">
        <div className="flex items-start gap-3">
          <Icon className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-slate-900 text-sm leading-tight mb-1 group-hover/card:text-indigo-600 transition-colors">
              {post.title}
            </h4>
            <p className="text-xs text-slate-600 font-medium mb-2 line-clamp-2">
              {post.excerpt}
            </p>
            <div className="flex items-center flex-wrap gap-2 mb-3">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-indigo-100 text-indigo-700">
                {Icon && <Icon className="w-3 h-3" />}
              </span>
              <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-lime-100 text-lime-700">
                {post.campaign}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Created {post.createdDate}</span>
              {post.scheduledDate && (
                <span className="text-indigo-600 font-bold">
                  Scheduled {post.scheduledDate}
                </span>
              )}
            </div>
          </div>
          <div className="flex-shrink-0 opacity-0 group-hover/card:opacity-100 transition-opacity">
            <PostActionMenu
              postId={post.id}
              status={post.status}
              onDelete={() => {/* TODO: Implement delete */}}
              onDuplicate={() => {/* TODO: Implement duplicate */}}
              onSchedule={() => {/* TODO: Implement schedule */}}
              onChangeStatus={() => {/* TODO: Implement change status */}}
              onAssign={() => {/* TODO: Implement assign */}}
              onMoveCampaign={() => {/* TODO: Implement move campaign */}}
              onShare={() => {/* TODO: Implement share */}}
            />
          </div>
        </div>

        {/* Action buttons - visible on hover */}
        <div className="mt-3 pt-3 border-t border-indigo-200/30 flex gap-2 opacity-0 group-hover/card:opacity-100 transition-opacity">
          <button
            className="flex-1 px-2 py-1.5 rounded text-xs font-bold bg-indigo-100 hover:bg-indigo-200 text-indigo-600 transition-colors flex items-center justify-center gap-1"
            onClick={() => {
              setPreviewPost(post);
              setShowPreview(true);
            }}
          >
            <Eye className="w-3 h-3" />
            View
          </button>
          <button
            className="flex-1 px-2 py-1.5 rounded text-xs font-bold bg-indigo-100 hover:bg-indigo-200 text-indigo-600 transition-colors flex items-center justify-center gap-1"
            onClick={() => {
              navigate(`/studio?postId=${post.id}`);
            }}
          >
            <Edit3 className="w-3 h-3" />
            Edit
          </button>
        </div>
      </div>
    );
  };

  const getStatusLabel = (status: PostStatus | null): string => {
    if (!status) return "";
    const labels: Record<PostStatus, string> = {
      draft: "Drafts",
      reviewing: "Pending Approvals",
      scheduled: "Scheduled",
      published: "Published",
      errored: "Errored",
    };
    return labels[status];
  };

  const clearStatusFilter = () => {
    setSearchParams({});
  };

  return (
    <PageShell>
      <PageHeader
        title={statusFilter ? getStatusLabel(statusFilter) : "Content Queue"}
        subtitle={`${currentWorkspace?.logo || ""} ${currentWorkspace?.name || ""} — ${statusFilter ? `View all ${filteredPosts.length} posts in ${getStatusLabel(statusFilter).toLowerCase()}.` : "Organize and manage all your content by status. Review, approve, and schedule posts across all platforms."}`}
        actions={
          statusFilter ? (
            <button
              onClick={clearStatusFilter}
              className="p-2 hover:bg-slate-200/50 rounded-lg transition-colors text-slate-600"
              title="Back to all posts"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          ) : undefined
        }
      />

          {/* Status Overview Banner */}
          <StatusOverviewBanner navigateToQueue={true} />

          {/* Filter Controls & Status Actions */}
          <div className="mb-8 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/50 backdrop-blur-xl border border-white/60 hover:border-indigo-300/50 text-slate-700 font-bold text-sm transition-all"
            >
              <Filter className="w-4 h-4" />
              Filters
              {hasActiveFilters && (
                <span className="ml-1 px-2 py-0.5 rounded-full bg-lime-400 text-indigo-950 text-xs font-black">
                  Active
                </span>
              )}
            </button>
            <button
              onClick={() =>
                setViewMode(viewMode === "grid" ? "carousel" : "grid")
              }
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-bold text-sm ${
                viewMode === "carousel"
                  ? "bg-lime-400 hover:bg-lime-500 text-indigo-950"
                  : "bg-white/50 backdrop-blur-xl border border-white/60 hover:border-indigo-300/50 text-slate-700"
              }`}
            >
              {viewMode === "carousel" ? "Grid View" : "Browse Posts"}
            </button>

            {/* Status-specific actions */}
            {statusFilter === "reviewing" && filteredPosts.length > 0 && (
              <button
                onClick={handleBulkApprove}
                disabled={bulkApprovingReviewing}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-lime-400 hover:bg-lime-500 text-indigo-950 font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle2 className="w-4 h-4" />
                {bulkApprovingReviewing
                  ? "Approving..."
                  : `Approve All (${filteredPosts.length})`}
              </button>
            )}
            {statusFilter === "errored" && filteredPosts.length > 0 && (
              <button
                onClick={handleBulkRetry}
                disabled={bulkRetryingErrored}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-lime-400 hover:bg-lime-500 text-indigo-950 font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className="w-4 h-4" />
                {bulkRetryingErrored
                  ? "Retrying..."
                  : `Retry All (${filteredPosts.length})`}
              </button>
            )}
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mb-8 p-4 rounded-lg bg-white/50 backdrop-blur-xl border border-white/60 space-y-4 animate-[slideDown_200ms_ease-out]">
              {/* Brand Filter */}
              <div>
                <h3 className="font-bold text-slate-900 text-sm mb-2">Brand</h3>
                <div className="flex flex-wrap gap-2">
                  {brands.map((brand) => (
                    <button
                      key={brand}
                      onClick={() =>
                        setSelectedBrand(selectedBrand === brand ? null : brand)
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        selectedBrand === brand
                          ? "bg-lime-400 text-indigo-950"
                          : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                      }`}
                    >
                      {brand}
                    </button>
                  ))}
                </div>
              </div>

              {/* Platform Filter */}
              <div>
                <h3 className="font-bold text-slate-900 text-sm mb-2">
                  Platforms
                </h3>
                <div className="flex flex-wrap gap-2">
                  {platforms.map((platform) => {
                    const platformNames: Record<string, string> = {
                      linkedin: "LinkedIn",
                      instagram: "Instagram",
                      facebook: "Facebook",
                      twitter: "Twitter",
                      tiktok: "TikTok",
                      youtube: "YouTube",
                      pinterest: "Pinterest",
                    };
                    const displayName = platformNames[platform];
                    return (
                      <button
                        key={platform}
                        onClick={() => togglePlatform(displayName)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          selectedPlatforms.includes(displayName)
                            ? "bg-lime-400 text-indigo-950"
                            : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                        }`}
                      >
                        {displayName}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Campaign Filter */}
              <div>
                <h3 className="font-bold text-slate-900 text-sm mb-2">
                  Campaign
                </h3>
                <div className="flex flex-wrap gap-2">
                  {campaigns.map((campaign) => (
                    <button
                      key={campaign}
                      onClick={() =>
                        setSelectedCampaign(
                          selectedCampaign === campaign ? null : campaign,
                        )
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        selectedCampaign === campaign
                          ? "bg-lime-400 text-indigo-950"
                          : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                      }`}
                    >
                      {campaign}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  <X className="w-3 h-3" />
                  Clear Filters
                </button>
              )}
            </div>
          )}

          {/* Carousel View */}
          {viewMode === "carousel" && (
            <div className="mb-12">
              <PostCarousel
                posts={filteredPosts.slice(0, 10)}
                onPostClick={(post) => {
                  setPreviewPost(post);
                  setShowPreview(true);
                }}
                title="Browse Posts"
              />
            </div>
          )}

          {/* Section Carousels or Filtered Grid View */}
          {viewMode === "grid" && (
            <div className="mb-12">
              {statusFilter ? (
                // Filtered status view: show as grid
                filteredPosts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredPosts.map((post) => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-slate-900 mb-1">
                      No posts found
                    </h3>
                    <p className="text-slate-600">
                      No posts in {getStatusLabel(statusFilter).toLowerCase()}{" "}
                      status.
                    </p>
                  </div>
                )
              ) : (
                // Full grid view: show all statuses
                <div className="space-y-8">
                  {statusOrder.map((status) => {
                    const posts = postsByStatus[status];
                    const config = statusConfig[status];

                    return (
                      <SectionCarousel
                        key={status}
                        title={config.label}
                        icon={config.icon}
                        posts={posts}
                        onPostClick={(post) => {
                          setPreviewPost(post);
                          setShowPreview(true);
                        }}
                        hasError={
                          status === "draft" &&
                          posts.some((p) => p.errorMessage)
                        }
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Queue Advisor - hidden when status filtered */}
          {!statusFilter && (
            <div className="mb-12">
              <QueueAdvisor />
            </div>
          )}

      {/* Post Preview Modal */}
      <PostPreviewModal
        post={previewPost}
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        />
    </PageShell>
  );
}
