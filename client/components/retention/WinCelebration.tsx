import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Trophy,
  Share2,
  TrendingUp,
  Sparkles,
  X,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/design-system";
import { toast } from "@/hooks/use-toast";
import confetti from "canvas-confetti";

interface WinData {
  type:
    | "engagement_milestone"
    | "personal_record"
    | "weekly_win"
    | "goal_achieved";
  title: string;
  description: string;
  metric?: {
    label: string;
    value: string;
    comparison?: string;
  };
  reason?: string;
  suggestedAction?: string;
  shareText?: string;
  postUrl?: string;
}

interface WinCelebrationProps {
  win: WinData;
  onDismiss?: () => void;
  onShare?: () => void;
  className?: string;
}

export function WinCelebration({
  win,
  onDismiss,
  onShare,
  className,
}: WinCelebrationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Fire confetti on mount
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (!prefersReducedMotion) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#4F46E5", "#818CF8", "#C7D2FE", "#FFD700"],
      });
    }

    // Track analytics
    if (window.posthog) {
      window.posthog.capture("win_celebrated", {
        type: win.type,
        metric: win.metric?.value,
      });
    }
  }, [win]);

  const handleShare = () => {
    const shareData = {
      title: win.title,
      text: win.shareText || `🎉 ${win.title} - ${win.description}`,
      url: win.postUrl || window.location.href,
    };

    if (navigator.share) {
      navigator.share(shareData).catch(() => {
        // Fallback to clipboard
        navigator.clipboard.writeText(shareData.text);
        toast({
          title: "Copied to clipboard!",
          description: "Share your win on social media",
        });
      });
    } else {
      navigator.clipboard.writeText(shareData.text);
      toast({
        title: "Copied to clipboard!",
        description: "Share your win on social media",
      });
    }

    if (onShare) {
      onShare();
    }

    // Track analytics
    if (window.posthog) {
      window.posthog.capture("win_shared", { type: win.type });
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    if (onDismiss) {
      onDismiss();
    }
  };

  if (!isVisible) return null;

  return (
    <Card
      className={cn(
        "border-2 border-amber-500 bg-gradient-to-br from-amber-50 to-yellow-50 shadow-2xl",
        className,
      )}
    >
      <CardContent className="pt-6 pb-6">
        <div className="flex items-start gap-4">
          {/* Trophy Icon */}
          <div className="flex-shrink-0">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg">
              <Trophy className="h-8 w-8 text-white" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1">
                <h3 className="text-2xl font-black text-slate-900 mb-1">
                  {win.title}
                </h3>
                <p className="text-slate-700 text-sm">{win.description}</p>
              </div>
              {onDismiss && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                  className="flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Metric */}
            {win.metric && (
              <div className="bg-white rounded-lg p-4 mb-4 border border-amber-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                      {win.metric.label}
                    </p>
                    <p className="text-3xl font-black text-amber-600">
                      {win.metric.value}
                    </p>
                  </div>
                  {win.metric.comparison && (
                    <Badge className="gap-1 bg-green-100 text-green-700 border-green-200">
                      <TrendingUp className="h-3 w-3" />
                      {win.metric.comparison}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Reason */}
            {win.reason && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex gap-3">
                  <Sparkles className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-blue-900 text-sm mb-1">
                      What made it work?
                    </h4>
                    <p className="text-blue-800 text-sm">{win.reason}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Suggested Action */}
            {win.suggestedAction && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-4">
                <div className="flex gap-3">
                  <TrendingUp className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-indigo-900 text-sm mb-1">
                      Keep the momentum!
                    </h4>
                    <p className="text-indigo-800 text-sm">
                      {win.suggestedAction}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                onClick={handleShare}
                className="flex-1 gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600"
              >
                <Share2 className="h-4 w-4" />
                Share This Win
              </Button>
              {win.postUrl && (
                <Button variant="outline" className="gap-2" asChild>
                  <a
                    href={win.postUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View Post
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
