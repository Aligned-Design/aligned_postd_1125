import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Play,
  Eye,
  ThumbsUp,
  X,
  TrendingUp,
  ChevronRight,
  Check,
} from "lucide-react";
import { cn } from "@/lib/design-system";
import { useNavigate } from "react-router-dom";

interface ActionableInsight {
  id: string;
  title: string;
  description: string;
  evidence: string;
  impact: "high" | "medium" | "low";
  actions: {
    label: string;
    type: "primary" | "secondary" | "preview";
    route?: string;
    previewData?: unknown;
  }[];
  acted?: boolean;
  dismissed?: boolean;
}

interface ActionableInsightsProps {
  className?: string;
}

export function ActionableInsights({ className }: ActionableInsightsProps) {
  const navigate = useNavigate();
  const [insights, setInsights] = useState<ActionableInsight[]>([
    {
      id: "1",
      title: "🎬 Reels outperform carousels 3:1",
      description:
        "Your video content drives significantly more engagement than static posts.",
      evidence: "Reels avg 1.2K engagement vs carousels 400",
      impact: "high",
      actions: [
        {
          label: "Try This",
          type: "primary",
          route: "/creative-studio?preset=reels",
        },
        {
          label: "Preview Examples",
          type: "preview",
          previewData: { contentType: "reels" },
        },
        {
          label: "Dismiss",
          type: "secondary",
        },
      ],
    },
    {
      id: "2",
      title: "📅 Wednesday posts underperform",
      description:
        "Posts published on Wednesdays average 28% lower engagement.",
      evidence: "Wed avg: 22 engagement vs Fri avg: 42",
      impact: "high",
      actions: [
        {
          label: "Adjust Schedule",
          type: "primary",
          route: "/calendar",
        },
        {
          label: "Learn More",
          type: "secondary",
        },
        {
          label: "Dismiss",
          type: "secondary",
        },
      ],
    },
    {
      id: "3",
      title: "🎵 Trending sounds boost reach 2.5×",
      description:
        "Posts using trending audio get significantly more views than original audio.",
      evidence: "Trending audio: 28K avg reach vs Original: 11K",
      impact: "medium",
      actions: [
        {
          label: "Trending Audio Ideas",
          type: "primary",
          route: "/creative-studio?audio=trending",
        },
        {
          label: "Preview",
          type: "preview",
        },
        {
          label: "Dismiss",
          type: "secondary",
        },
      ],
    },
  ]);

  const [feedbackGiven, setFeedbackGiven] = useState<
    Record<string, "acted" | "dismissed">
  >({});

  const handleAction = (
    insightId: string,
    actionType: "primary" | "secondary" | "preview",
    route?: string,
  ) => {
    if (actionType === "primary" && route) {
      // Mark as acted on
      setFeedbackGiven((prev) => ({ ...prev, [insightId]: "acted" }));
      setInsights((prev) =>
        prev.map((i) => (i.id === insightId ? { ...i, acted: true } : i)),
      );

      // Track analytics
      if (window.posthog) {
        window.posthog.capture("insight_acted", { insightId });
      }

      // Navigate to route
      navigate(route);
    } else if (actionType === "secondary") {
      // Dismiss insight
      setFeedbackGiven((prev) => ({ ...prev, [insightId]: "dismissed" }));
      setInsights((prev) =>
        prev.map((i) => (i.id === insightId ? { ...i, dismissed: true } : i)),
      );

      // Track analytics
      if (window.posthog) {
        window.posthog.capture("insight_dismissed", { insightId });
      }
    }
  };

  const visibleInsights = insights.filter((i) => !i.dismissed);

  if (visibleInsights.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-600" />
            AI Insights &amp; Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-500">
            <Check className="h-12 w-12 mx-auto mb-3 text-green-500" />
            <p className="font-medium">All caught up!</p>
            <p className="text-sm">
              No new insights right now. Check back soon.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-indigo-600" />
            AI Insights &amp; Recommendations
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Actionable recommendations based on your performance data
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {visibleInsights.map((insight) => {
          const hasActed =
            insight.acted || feedbackGiven[insight.id] === "acted";

          return (
            <Card
              key={insight.id}
              className={cn(
                "transition-all duration-200",
                hasActed ? "opacity-60 bg-slate-50" : "hover:shadow-md",
                insight.impact === "high" && "border-l-4 border-l-amber-500",
              )}
            >
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900 text-lg mb-1">
                          {insight.title}
                        </h3>
                        <p className="text-slate-700 text-sm mb-3">
                          {insight.description}
                        </p>
                      </div>

                      {hasActed && (
                        <Badge
                          variant="outline"
                          className="gap-1 bg-green-50 text-green-700 border-green-200"
                        >
                          <ThumbsUp className="h-3 w-3" />
                          Acted On
                        </Badge>
                      )}

                      {insight.impact === "high" && !hasActed && (
                        <Badge variant="destructive" className="gap-1">
                          <TrendingUp className="h-3 w-3" />
                          High Impact
                        </Badge>
                      )}
                    </div>

                    {/* Evidence */}
                    <div className="bg-slate-100 rounded-lg p-3 mb-4">
                      <p className="text-sm text-slate-700">
                        <strong>Data:</strong> {insight.evidence}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    {!hasActed && (
                      <div className="flex flex-wrap gap-2">
                        {insight.actions.map((action, idx) => {
                          if (action.type === "primary") {
                            return (
                              <Button
                                key={idx}
                                onClick={() =>
                                  handleAction(
                                    insight.id,
                                    "primary",
                                    action.route,
                                  )
                                }
                                className="gap-2"
                              >
                                <Play className="h-4 w-4" />
                                {action.label}
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            );
                          }

                          if (action.type === "preview") {
                            return (
                              <Button
                                key={idx}
                                variant="outline"
                                onClick={() =>
                                  handleAction(insight.id, "preview")
                                }
                                className="gap-2"
                              >
                                <Eye className="h-4 w-4" />
                                {action.label}
                              </Button>
                            );
                          }

                          return (
                            <Button
                              key={idx}
                              variant="ghost"
                              onClick={() =>
                                handleAction(insight.id, "secondary")
                              }
                              className="gap-2 text-slate-600"
                            >
                              <X className="h-4 w-4" />
                              {action.label}
                            </Button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
