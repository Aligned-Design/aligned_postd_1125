import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useCurrentBrand } from "@/hooks/useCurrentBrand";
import { ReviewCard } from "@/components/dashboard/ReviewCard";
import { ReviewAdvisor } from "@/components/dashboard/ReviewAdvisor";
import { Review, ReviewSource, ReviewListResponse } from "@shared/reviews";
import { BrandGuide, AutoReplySettings } from "@/types/review";
import { Star, Settings, Filter, MessageCircle, AlertCircle } from "lucide-react";
import { useBrandGuide } from "@/hooks/useBrandGuide";
import { useState, useEffect } from "react";
import { PageShell } from "@/components/postd/ui/layout/PageShell";
import { PageHeader } from "@/components/postd/ui/layout/PageHeader";
import { logError, logWarning, logInfo } from "@/lib/logger";

export default function Reviews() {
  const { currentWorkspace } = useWorkspace();
  const { brandId } = useCurrentBrand();
  const { brandGuide } = useBrandGuide();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterSource, setFilterSource] = useState<ReviewSource | "all">("all");
  const [filterSentiment, setFilterSentiment] = useState<"all" | "positive" | "neutral" | "negative">("all");
  const [showAutoReplySettings, setShowAutoReplySettings] = useState(false);
  const [autoReplySettings, setAutoReplySettings] = useState<AutoReplySettings | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    positive: 0,
    neutral: 0,
    negative: 0,
    needsReply: 0,
    avgRating: "0.0",
  });

  // Load reviews from API
  useEffect(() => {
    if (!brandId) {
      logWarning("[Reviews] No brandId available, skipping fetch");
      setLoading(false);
      setError("No brand selected. Please select a brand to view reviews.");
      return;
    }

    // Validate brandId is a valid UUID before making the request
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(brandId)) {
      logWarning("[Reviews] Invalid brandId format, skipping fetch", { brandId });
      setLoading(false);
      setError("Invalid brand. Please select a valid brand to view reviews.");
      return;
    }

    const loadReviews = async () => {
      try {
        setLoading(true);
        setError(null);

        logInfo("[Reviews] Fetching reviews for brandId", { brandId });
        const response = await fetch(`/api/reviews/${brandId}`);
        
        logInfo("[Reviews] Response status", { status: response.status, statusText: response.statusText });
        
        if (!response.ok) {
          // Try to parse error message from response
          let errorMessage = `Failed to load reviews: ${response.statusText}`;
          
          try {
            const errorData = await response.json();
            if (errorData.error?.message) {
              errorMessage = errorData.error.message;
            } else if (errorData.message) {
              errorMessage = errorData.message;
            } else if (typeof errorData === "string") {
              errorMessage = errorData;
            }
            
            // Add user-friendly context based on status code
            if (response.status === 400) {
              if (errorMessage.includes("Brand ID") || errorMessage.includes("brandId")) {
                errorMessage = "Invalid brand. Please select a valid brand.";
              } else {
                errorMessage = `Invalid request: ${errorMessage}`;
              }
            } else if (response.status === 403) {
              if (errorMessage.includes("scope")) {
                errorMessage = "You don't have permission to view reviews. Please contact your administrator.";
              } else if (errorMessage.includes("authorized") || errorMessage.includes("access")) {
                errorMessage = "You don't have access to reviews for this brand. Please contact your administrator.";
              } else {
                errorMessage = `Access denied: ${errorMessage}`;
              }
            } else if (response.status === 401) {
              errorMessage = "Authentication required. Please log in again.";
            } else if (response.status >= 500) {
              errorMessage = "Server error. Please try again in a moment.";
            }
          } catch (parseError) {
            // If we can't parse the error, use the status code
            if (response.status === 400) {
              errorMessage = "Invalid request. Please check your input and try again.";
            } else if (response.status === 403) {
              errorMessage = "You don't have permission to view reviews for this brand.";
            } else if (response.status === 401) {
              errorMessage = "Authentication required. Please log in again.";
            }
          }
          
          throw new Error(errorMessage);
        }

        const data: ReviewListResponse = await response.json();
        logInfo("[Reviews] Received data", { reviewCount: data.reviews.length, stats: data.stats });
        
        setReviews(data.reviews);
        setStats({
          total: data.stats.total,
          positive: data.stats.positive,
          neutral: data.stats.neutral,
          negative: data.stats.negative,
          needsReply: data.stats.needsReply,
          avgRating: data.stats.avgRating.toFixed(1),
        });
      } catch (err) {
        logError("[Reviews] Failed to load reviews", err instanceof Error ? err : new Error(String(err)), { brandId });
        const errorMessage = err instanceof Error ? err.message : "Failed to load reviews";
        setError(errorMessage);
        // Set empty state on error (no mock data fallback)
        setReviews([]);
        setStats({
          total: 0,
          positive: 0,
          neutral: 0,
          negative: 0,
          needsReply: 0,
          avgRating: "0.0",
        });
      } finally {
        setLoading(false);
      }
    };

    loadReviews();
  }, [brandId]);

  // ✅ FIX: Load auto-reply settings from API (no mock data)
  useEffect(() => {
    const loadAutoReplySettings = async () => {
      if (!brandId) {
        setSettingsLoading(false);
        return;
      }

      try {
        setSettingsLoading(true);
        const response = await fetch(`/api/settings/auto-reply?brandId=${brandId}`);

        if (response.ok) {
          const settings: AutoReplySettings = await response.json();
          setAutoReplySettings(settings);
        } else if (response.status === 404) {
          // No settings configured yet - show empty state
          setAutoReplySettings(null);
        } else {
          logWarning("[Reviews] Failed to load auto-reply settings", { status: response.status });
          setAutoReplySettings(null);
        }
      } catch (err) {
        logError("[Reviews] Failed to load auto-reply settings", err instanceof Error ? err : new Error(String(err)));
        setAutoReplySettings(null);
      } finally {
        setSettingsLoading(false);
      }
    };

    loadAutoReplySettings();
  }, [brandId]);

  // Filter reviews
  const filteredReviews = reviews.filter((r) => {
    const sourceMatch = filterSource === "all" || r.source === filterSource;
    const sentimentMatch = filterSentiment === "all" || r.sentiment === filterSentiment;
    return sourceMatch && sentimentMatch;
  });

  const handleReply = (reviewId: string) => {
    logInfo("Reply to review", { reviewId });
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

  // Loading state
  if (loading) {
    return (
      <PageShell>
        <div className="space-y-4 animate-pulse">
          <div className="h-8 w-48 bg-gray-200 rounded" />
          <div className="h-96 bg-gray-200 rounded-lg" />
        </div>
      </PageShell>
    );
  }

  // Error state
  if (error) {
    return (
      <PageShell>
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-900">Failed to load reviews</p>
            <p className="text-sm text-red-700">{error}</p>
            <p className="text-xs text-red-600 mt-2">
              Reviews feature is currently being set up. Please check back later.
            </p>
          </div>
        </div>
      </PageShell>
    );
  }

  return (    
      <PageShell>
        <PageHeader
          title="Reviews"
          subtitle={`${currentWorkspace?.logo || ""} ${currentWorkspace?.name || ""} — Centralized reputation management and review analysis`}
        />

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
              <ReviewAdvisor 
                reviews={reviews} 
                onGenerateReplies={handleGenerateReplies}
              />

              {/* Auto Reply Settings */}
              <div className="bg-white/50 backdrop-blur-xl rounded-xl p-5 border border-white/60 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-slate-900 flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Auto-Reply
                  </h3>
                  {autoReplySettings && (
                    <button
                      onClick={() => setShowAutoReplySettings(!showAutoReplySettings)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                    >
                      {showAutoReplySettings ? "Hide" : "Edit"}
                    </button>
                  )}
                </div>

                {/* Empty State - No Settings Configured */}
                {!settingsLoading && !autoReplySettings && (
                  <div className="text-center py-6">
                    <p className="text-sm text-slate-600 mb-3">No auto-reply settings configured yet.</p>
                    <button
                      onClick={() => {
                        // Initialize with default settings
                        setAutoReplySettings({
                          enableAutoReply: false,
                          replyRules: {},
                          includeFollowUpLinks: true,
                          addCTA: true,
                        });
                        setShowAutoReplySettings(true);
                      }}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                    >
                      Configure Auto-Reply
                    </button>
                  </div>
                )}

                {/* Settings UI (only show if settings exist) */}
                {autoReplySettings && (
                  <>
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
                              checked={autoReplySettings.includeFollowUpLinks || false}
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
                  </>
                )}
              </div>
            </div>
          </div>
      </PageShell>
  );
}
