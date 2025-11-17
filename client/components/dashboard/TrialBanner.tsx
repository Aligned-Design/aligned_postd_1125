import { Sparkles, X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface TrialBannerProps {
  publishedCount: number;
  maxPosts?: number;
}

export function TrialBanner({
  publishedCount,
  maxPosts = 2,
}: TrialBannerProps) {
  const [isVisible, setIsVisible] = useState(true);
  const navigate = useNavigate();

  if (!isVisible) return null;

  return (
    <div className="bg-gradient-to-r from-lime-100 to-yellow-100 border-l-4 border-lime-500 p-4 rounded-lg mb-6 shadow-md relative">
      <button
        onClick={() => setIsVisible(false)}
        className="absolute top-2 right-2 text-slate-600 hover:text-slate-900 transition-colors"
        aria-label="Dismiss banner"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-3 pr-6">
        <Sparkles className="w-6 h-6 text-lime-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-bold text-slate-900 mb-1 flex items-center gap-2">
            🎉 You're in trial mode!
            <span className="inline-flex items-center bg-lime-600 text-white text-xs font-bold px-2 py-1 rounded-full">
              Posts used {publishedCount}/{maxPosts}
            </span>
          </h3>
          <p className="text-sm text-slate-700 mb-3">
            You can test up to {maxPosts} live posts during your 7-day trial.
            Experience the full workflow and see results in action!
          </p>
          {publishedCount >= maxPosts && (
            <button
              onClick={() => navigate("/billing")}
              className="inline-flex items-center gap-2 bg-lime-600 hover:bg-lime-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
            >
              Upgrade to Continue Publishing
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
