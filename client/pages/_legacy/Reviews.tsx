// LEGACY PAGE (archived)
// This file is not routed or imported anywhere.
// Canonical implementation lives under client/app/(postd)/...
// Safe to delete after one or two stable releases.

import { useWorkspace } from "@/contexts/WorkspaceContext";
import { AppShell } from "@postd/layout/AppShell";
import { ReviewCard } from "@/components/dashboard/ReviewCard";
import { ReviewAdvisor } from "@/components/dashboard/ReviewAdvisor";
import { Review, ReviewSource, MOCK_BRAND_GUIDE, MOCK_AUTO_REPLY_SETTINGS } from "@/types/review";
import { Star, Settings, Filter, MessageCircle } from "lucide-react";
import { useState } from "react";

// Mock review data combining Google and Facebook reviews
const MOCK_REVIEWS: Review[] = [
  {
    id: "review-1",
    source: "google",
    authorName: "Sarah Johnson",
    rating: 5,
    text: "Absolutely fantastic service! The team was responsive, professional, and delivered exactly what we needed. Highly recommend for anyone looking to streamline their social media strategy.",
    sentiment: "positive",
    replyStatus: "replied",
    createdDate: "2024-11-07",
    repliedDate: "2024-11-07",
    replyText: "Thank you so much for the wonderful review, Sarah! We're thrilled to have helped you streamline your social media strategy.",
    brandId: "brand-1",
  },
  {
    id: "review-2",
    source: "facebook",
    authorName: "Michael Chen",
    rating: 4,
    text: "Great platform overall. Very intuitive and helpful. Would love to see more analytics features.",
    sentiment: "positive",
    replyStatus: "needs-reply",
    createdDate: "2024-11-06",
    brandId: "brand-1",
  },
  {
    id: "review-3",
    source: "google",
    authorName: "Emma Wilson",
    rating: 1,
    text: "Disappointed with the service. Customer support was slow to respond and the platform crashed during our biggest campaign.",
    sentiment: "negative",
    replyStatus: "flagged",
    createdDate: "2024-11-05",
    brandId: "brand-1",
    flaggedReason: "Urgent - service complaint",
  },
  {
    id: "review-4",
    source: "facebook",
    authorName: "David Martinez",
    rating: 5,
    text: "Perfect solution for managing multiple brand accounts! The analytics dashboard is incredible and the AI insights are spot-on.",
    sentiment: "positive",
    replyStatus: "replied",
    createdDate: "2024-11-04",
    repliedDate: "2024-11-04",
    replyText: "Thank you, David! We're so glad you're loving the analytics dashboard and AI insights. Your success is our success!",
    brandId: "brand-1",
  },
  {
    id: "review-5",
    source: "google",
    authorName: "Jessica Lee",
    rating: 3,
    text: "Decent platform but the pricing feels a bit high compared to competitors. The reporting features are solid though.",
    sentiment: "neutral",
    replyStatus: "needs-reply",
    createdDate: "2024-11-03",
    brandId: "brand-1",
  },
  {
    id: "review-6",
    source: "facebook",
    authorName: "Robert Taylor",
    rating: 2,
    text: "Had some issues with the integration. Once I figured it out it was better, but the onboarding could be improved.",
    sentiment: "negative",
    replyStatus: "needs-reply",
    createdDate: "2024-11-02",
    brandId: "brand-1",
  },
  {
    id: "review-7",
    source: "google",
    authorName: "Lisa Anderson",
    rating: 5,
    text: "Outstanding experience from start to finish. The team is incredibly helpful and the platform saves us hours every week. Worth every penny!",
    sentiment: "positive",
    replyStatus: "needs-reply",
    createdDate: "2024-11-01",
    brandId: "brand-1",
  },
];

export default function Reviews() {
  const { currentWorkspace } = useWorkspace();
  const [reviews, setReviews] = useState<Review[]>(MOCK_REVIEWS);
  const [filterSource, setFilterSource] = useState<ReviewSource | "all">("all");
  const [filterSentiment, setFilterSentiment] = useState<"all" | "positive" | "neutral" | "negative">("all");
  const [showAutoReplySettings, setShowAutoReplySettings] = useState(false);
  const [autoReplySettings, setAutoReplySettings] = useState(MOCK_AUTO_REPLY_SETTINGS);

  // Filter reviews
  const filteredReviews = reviews.filter((r) => {
    const sourceMatch = filterSource === "all" || r.source === filterSource;
    const sentimentMatch = filterSentiment === "all" || r.sentiment === filterSentiment;
    return sourceMatch && sentimentMatch;
  });

  // Calculate stats
  const stats = {
    total: reviews.length,
    positive: reviews.filter((r) => r.sentiment === "positive").length,
    neutral: reviews.filter((r) => r.sentiment === "neutral").length,
    negative: reviews.filter((r) => r.sentiment === "negative").length,
    needsReply: reviews.filter((r) => r.replyStatus === "needs-reply").length,
    avgRating: (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1),
  };

  const handleReply = (reviewId: string) => {
    console.log("Reply to review:", reviewId);
  };

  const handleFlag = (reviewId: string) => {
    setReviews(
      reviews.map((r) =>
        r.id === reviewId ? { ...r, replyStatus: "flagged" as const } : r
      )
    );
  };

  const handleGenerateReplies = () => {
    alert("Generating AI-suggested replies for all flagged and negative reviews...");
  };

  return (
    <AppShell>
      <div className="min-h-screen bg-gradient-to-b from-indigo-50/30 via-white to-blue-50/20">
        <div className="p-4 sm:p-6 md:p-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-2">Reviews</h1>
            <p className="text-slate-600 text-xs sm:text-sm font-medium">
              {currentWorkspace?.logo} {currentWorkspace?.name} — Centralized reputation management and review analysis
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-8">
            <div className="bg-white/50 backdrop-blur-xl rounded-lg p-3 border border-white/60">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Total</p>
              <p className="text-2xl font-black text-slate-900">{stats.total}</p>
            </div>
            <div className="bg-green-50/50 backdrop-blur-xl rounded-lg p-3 border border-green-200/50">
              <p className="text-xs font-bold text-green-700 uppercase tracking-wider mb-1">Positive</p>
              <p className="text-2xl font-black text-green-900">{stats.positive}</p>
            </div>
            <div className="bg-slate-50/50 backdrop-blur-xl rounded-lg p-3 border border-slate-200/50">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Neutral</p>
              <p className="text-2xl font-black text-slate-900">{stats.neutral}</p>
            </div>
            <div className="bg-red-50/50 backdrop-blur-xl rounded-lg p-3 border border-red-200/50">
              <p className="text-xs font-bold text-red-700 uppercase tracking-wider mb-1">Negative</p>
              <p className="text-2xl font-black text-red-900">{stats.negative}</p>
            </div>
            <div className="bg-amber-50/50 backdrop-blur-xl rounded-lg p-3 border border-amber-200/50">
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">Needs Reply</p>
              <p className="text-2xl font-black text-amber-900">{stats.needsReply}</p>
            </div>
            <div className="bg-blue-50/50 backdrop-blur-xl rounded-lg p-3 border border-blue-200/50">
              <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">Avg Rating</p>
              <p className="text-2xl font-black text-blue-900 flex items-center gap-1">
                {stats.avgRating}
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              </p>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Left Column - Reviews Feed */}
            <div className="lg:col-span-2 space-y-4">
              {/* Filters */}
              <div className="bg-white/50 backdrop-blur-xl rounded-lg p-4 border border-white/60 space-y-3">
                <h3 className="font-black text-slate-900 flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filter Reviews
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(["all", "google", "facebook"] as const).map((source) => (
                    <button
                      key={source}
                      onClick={() => setFilterSource(source)}
                      className={`px-3 py-2 rounded-lg border-2 font-bold text-xs transition-all ${
                        filterSource === source
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                          : "border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {source === "all" ? "All Sources" : source.charAt(0).toUpperCase() + source.slice(1)}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {(["all", "positive", "neutral", "negative"] as const).map((sentiment) => (
                    <button
                      key={sentiment}
                      onClick={() => setFilterSentiment(sentiment)}
                      className={`px-3 py-2 rounded-lg border-2 font-bold text-xs transition-all ${
                        filterSentiment === sentiment
                          ? "border-lime-400 bg-lime-50 text-lime-700"
                          : "border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {sentiment === "all" ? "All" : sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reviews List */}
              <div className="space-y-3">
                {filteredReviews.length > 0 ? (
                  filteredReviews.map((review) => (
                    <ReviewCard
                      key={review.id}
                      review={review}
                      onReply={handleReply}
                      onFlag={handleFlag}
                    />
                  ))
                ) : (
                  <div className="bg-white/50 backdrop-blur-xl rounded-lg p-12 text-center border border-white/60">
                    <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-600 font-medium">No reviews match your filters</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Advisor & Settings */}
            <div className="space-y-4">
              {/* Review Advisor */}
              <ReviewAdvisor reviews={reviews} onGenerateReplies={handleGenerateReplies} />

              {/* Auto Reply Settings */}
              <div className="bg-white/50 backdrop-blur-xl rounded-xl p-5 border border-white/60 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-slate-900 flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Auto-Reply
                  </h3>
                  <button
                    onClick={() => setShowAutoReplySettings(!showAutoReplySettings)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                  >
                    {showAutoReplySettings ? "Hide" : "Edit"}
                  </button>
                </div>

                {/* Toggle */}
                <button
                  onClick={() =>
                    setAutoReplySettings({ ...autoReplySettings, enableAutoReply: !autoReplySettings.enableAutoReply })
                  }
                  className={`w-full p-3 rounded-lg border-2 font-bold text-sm transition-all ${
                    autoReplySettings.enableAutoReply
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {autoReplySettings.enableAutoReply ? "✓ Auto-Reply Enabled" : "Auto-Reply Disabled"}
                </button>

                {/* Settings Panel */}
                {showAutoReplySettings && (
                  <div className="space-y-3 pt-3 border-t border-slate-200">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-2">5-Star Response Template</label>
                      <textarea
                        value={autoReplySettings.replyRules.fiveStars || ""}
                        onChange={(e) =>
                          setAutoReplySettings({
                            ...autoReplySettings,
                            replyRules: { ...autoReplySettings.replyRules, fiveStars: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        rows={2}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-2">1-Star Response Template</label>
                      <textarea
                        value={autoReplySettings.replyRules.oneStar || ""}
                        onChange={(e) =>
                          setAutoReplySettings({
                            ...autoReplySettings,
                            replyRules: { ...autoReplySettings.replyRules, oneStar: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        rows={2}
                      />
                    </div>

                    <div className="flex gap-2">
                      <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                        <input
                          type="checkbox"
                          checked={autoReplySettings.includeFollowUpLinks}
                          onChange={(e) =>
                            setAutoReplySettings({
                              ...autoReplySettings,
                              includeFollowUpLinks: e.target.checked,
                            })
                          }
                          className="w-4 h-4 rounded"
                        />
                        Include Follow-up Links
                      </label>
                    </div>
                  </div>
                )}

                {/* Info */}
                <p className="text-xs text-slate-600 font-medium italic">
                  {autoReplySettings.enableAutoReply
                    ? "Auto-replies are enabled. We'll respond to 5-star and 4-star reviews automatically."
                    : "Manual replies only. You'll handle each response personally."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
