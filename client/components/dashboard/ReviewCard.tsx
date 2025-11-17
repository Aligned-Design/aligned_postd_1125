import { Review, ReviewSource } from "@/types/review";
import { Star, MessageCircle, Flag, CheckCircle, Clock } from "lucide-react";
import { useState } from "react";

interface ReviewCardProps {
  review: Review;
  onReply?: (reviewId: string) => void;
  onFlag?: (reviewId: string) => void;
}

export function ReviewCard({ review, onReply, onFlag }: ReviewCardProps) {
  const [showReply, setShowReply] = useState(false);

  const sourceIcons: Record<ReviewSource, string> = {
    google: "🔍",
    facebook: "f",
  };

  const sourceLabels: Record<ReviewSource, string> = {
    google: "Google",
    facebook: "Facebook",
  };

  const sentimentColors = {
    positive: "border-green-300/50 bg-green-50/40",
    neutral: "border-slate-300/50 bg-slate-50/40",
    negative: "border-red-300/50 bg-red-50/40",
  };

  const sentimentIcons = {
    positive: "😊",
    neutral: "😐",
    negative: "😞",
  };

  const replyStatusColors = {
    "needs-reply": "text-amber-600 bg-amber-100/50 border-amber-300",
    replied: "text-green-600 bg-green-100/50 border-green-300",
    flagged: "text-red-600 bg-red-100/50 border-red-300",
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className={`rounded-xl border-2 ${sentimentColors[review.sentiment]} backdrop-blur-xl p-4 sm:p-5 hover:shadow-md transition-all duration-300`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {review.authorAvatar ? (
            <img
              src={review.authorAvatar}
              alt={review.authorName}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
              {review.authorName.charAt(0)}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-slate-900 truncate">{review.authorName}</h3>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/60 text-slate-700">
                {sourceIcons[review.source]} {sourceLabels[review.source]}
              </span>
            </div>
            <p className="text-xs text-slate-600 font-medium">{formatDate(review.createdDate)}</p>
          </div>
        </div>

        {/* Sentiment & Reply Status */}
        <div className="flex flex-col gap-1.5 items-end flex-shrink-0">
          <span className="text-xl">{sentimentIcons[review.sentiment]}</span>
          <div className={`px-2 py-1 rounded-full text-xs font-bold border flex items-center gap-1 ${replyStatusColors[review.replyStatus]}`}>
            {review.replyStatus === "replied" && <CheckCircle className="w-3 h-3" />}
            {review.replyStatus === "flagged" && <Flag className="w-3 h-3" />}
            {review.replyStatus === "needs-reply" && <Clock className="w-3 h-3" />}
            {review.replyStatus === "replied" && "Replied"}
            {review.replyStatus === "needs-reply" && "Needs Reply"}
            {review.replyStatus === "flagged" && "Flagged"}
          </div>
        </div>
      </div>

      {/* Star Rating */}
      <div className="flex items-center gap-1 mb-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < review.rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-slate-300"
            }`}
          />
        ))}
      </div>

      {/* Review Text */}
      <p className="text-sm text-slate-700 mb-3 leading-relaxed line-clamp-3">{review.text}</p>

      {/* Reply if exists */}
      {review.replyText && (
        <div className="mb-3 p-3 rounded-lg bg-white/50 border border-slate-200">
          <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Your Reply</p>
          <p className="text-xs text-slate-700">{review.replyText}</p>
          {review.repliedDate && (
            <p className="text-xs text-slate-500 mt-1">{formatDate(review.repliedDate)}</p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-3 border-t border-slate-200">
        {review.replyStatus !== "replied" && (
          <button
            onClick={() => {
              onReply?.(review.id);
              setShowReply(!showReply);
            }}
            className="flex-1 px-3 py-2 rounded-lg bg-blue-100/50 border border-blue-300/50 text-blue-700 font-bold text-xs hover:bg-blue-100 transition-all flex items-center justify-center gap-1.5"
          >
            <MessageCircle className="w-3 h-3" />
            Reply
          </button>
        )}

        {review.replyStatus !== "flagged" && (
          <button
            onClick={() => onFlag?.(review.id)}
            className="px-3 py-2 rounded-lg bg-red-100/50 border border-red-300/50 text-red-700 font-bold text-xs hover:bg-red-100 transition-all flex items-center justify-center gap-1.5"
          >
            <Flag className="w-3 h-3" />
            Flag
          </button>
        )}
      </div>
    </div>
  );
}
