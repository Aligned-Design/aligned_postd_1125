import { ReviewAdvisorInsight, Review } from "@/types/review";
import { Sparkles, AlertCircle, CheckCircle, Zap, ArrowRight } from "lucide-react";

interface ReviewAdvisorProps {
  reviews: Review[];
  onGenerateReplies?: () => void;
}

export function ReviewAdvisor({ reviews, onGenerateReplies }: ReviewAdvisorProps) {
  // Generate insights from reviews
  const insights: ReviewAdvisorInsight[] = [];

  const positiveCount = reviews.filter((r) => r.sentiment === "positive").length;
  const negativeCount = reviews.filter((r) => r.sentiment === "negative").length;
  const flaggedCount = reviews.filter((r) => r.replyStatus === "flagged").length;
  const needsReplyCount = reviews.filter((r) => r.replyStatus === "needs-reply").length;

  if (positiveCount > 0) {
    insights.push({
      id: "positive",
      type: "positive",
      title: `${positiveCount} Positive Review${positiveCount !== 1 ? "s" : ""}`,
      description: `You received ${positiveCount} positive review${positiveCount !== 1 ? "s" : ""} this week. Consider sharing one as a testimonial on your campaigns.`,
      count: positiveCount,
      actionLabel: "Share as Testimonial",
      priority: "medium",
    });
  }

  if (negativeCount > 0) {
    insights.push({
      id: "negative",
      type: "negative",
      title: `${negativeCount} Negative Review${negativeCount !== 1 ? "s" : ""}`,
      description: `${negativeCount} review${negativeCount !== 1 ? "s" : ""} with negative sentiment detected. We recommend personal responses to address concerns.`,
      count: negativeCount,
      actionLabel: "View & Reply",
      priority: "high",
    });
  }

  if (flaggedCount > 0) {
    insights.push({
      id: "flagged",
      type: "negative",
      title: `${flaggedCount} Flagged Review${flaggedCount !== 1 ? "s" : ""}`,
      description: `${flaggedCount} review${flaggedCount !== 1 ? "s" : ""} flagged for follow-up. These need your immediate attention.`,
      count: flaggedCount,
      priority: "high",
    });
  }

  if (needsReplyCount > 0) {
    insights.push({
      id: "needs-reply",
      type: "action-required",
      title: `${needsReplyCount} Review${needsReplyCount !== 1 ? "s" : ""} Awaiting Response`,
      description: `${needsReplyCount} review${needsReplyCount !== 1 ? "s" : ""} still needs your response. Timely replies improve your reputation score.`,
      count: needsReplyCount,
      actionLabel: "Respond Now",
      priority: "high",
    });
  }

  // Fallback insight if no issues
  if (insights.length === 0) {
    insights.push({
      id: "all-good",
      type: "positive",
      title: "Reputation Health: Excellent",
      description: "All reviews have been responded to. Your reputation health is strong! Keep up the great engagement.",
      priority: "low",
    });
  }

  const getIconForType = (type: string) => {
    switch (type) {
      case "positive":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "negative":
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case "action-required":
        return <Zap className="w-5 h-5 text-amber-600" />;
      default:
        return <Sparkles className="w-5 h-5 text-indigo-600" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case "positive":
        return "bg-green-50";
      case "negative":
        return "bg-red-50";
      case "action-required":
        return "bg-amber-50";
      default:
        return "bg-blue-50";
    }
  };

  const getBorderColor = (type: string) => {
    switch (type) {
      case "positive":
        return "border-green-200";
      case "negative":
        return "border-red-200";
      case "action-required":
        return "border-amber-200";
      default:
        return "border-blue-200";
    }
  };

  return (
    <div className="bg-white/50 backdrop-blur-xl rounded-2xl p-6 border border-white/60 hover:bg-white/70 hover:shadow-md transition-all duration-300 relative overflow-hidden group">
      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/40 via-blue-50/20 to-transparent rounded-2xl -z-10"></div>

      {/* Header */}
      <div className="relative flex items-center justify-between mb-6 pb-4 border-b border-indigo-200/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-200/50 to-blue-200/40 backdrop-blur flex items-center justify-center border border-indigo-200/30 group-hover:scale-110 transition-transform duration-300">
            <Sparkles className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">Reputation Advisor</h3>
            <p className="text-xs text-slate-500 font-medium">Maintain your review health</p>
          </div>
        </div>
      </div>

      {/* Insights List */}
      <div className="relative space-y-3 mb-6">
        {insights.map((insight, idx) => (
          <div
            key={insight.id}
            className={`${getBgColor(insight.type)} border ${getBorderColor(insight.type)} rounded-lg p-4 transition-all duration-300 hover:shadow-sm animate-[fadeIn_300ms_ease-out]`}
            style={{
              animationDelay: `${idx * 80}ms`,
              animationFillMode: "both",
            }}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">{getIconForType(insight.type)}</div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="font-black text-slate-900 text-sm leading-tight">
                    {insight.title}
                  </h4>
                  {insight.priority === "high" && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 flex-shrink-0">
                      Urgent
                    </span>
                  )}
                </div>

                <p className="text-slate-700 text-xs font-medium mb-3">
                  {insight.description}
                </p>

                {insight.actionLabel && (
                  <button className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors hover:underline">
                    {insight.actionLabel}
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Generate Replies CTA */}
      <button
        onClick={onGenerateReplies}
        className="w-full py-3 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-black text-sm shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
      >
        <Sparkles className="w-4 h-4" />
        Generate Reply Drafts
      </button>
    </div>
  );
}
