import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  
  Zap,
  Target,
  AlertCircle,
  CheckCircle,
  ThumbsUp,
  ThumbsDown,
  Play,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/design-system";
import { AdvisorInsight } from "@shared/analytics";

interface AdvisorInsightTileProps {
  brandId?: string;
  className?: string;
  maxInsights?: number;
}

export function AdvisorInsightsTile({
  brandId,
  className,
  maxInsights = 6,
}: AdvisorInsightTileProps) {
  const [insights, setInsights] = useState<AdvisorInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedbackStates, setFeedbackStates] = useState<
    Record<string, AdvisorInsight["feedback"]>
  >({});

  useEffect(() => {
    loadInsights();
  }, [brandId]);

  const loadInsights = async () => {
    try {
      setLoading(true);
      setError(null);
      const url = brandId
        ? `/api/agents/advisor?brandId=${brandId}`
        : "/api/agents/advisor";

      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch insights");

      const data = await response.json();
      setInsights(Array.isArray(data) ? data : data.insights || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load insights");
      console.error("Error loading insights:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (
    insightId: string,
    feedback: AdvisorInsight["feedback"],
  ) => {
    try {
      // Optimistic update
      setFeedbackStates((prev) => ({ ...prev, [insightId]: feedback }));

      // Send feedback to server
      await fetch(`/api/agents/advisor/${insightId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback }),
      });
    } catch (err) {
      console.error("Error sending feedback:", err);
      // Revert on error
      setFeedbackStates((prev) => {
        const newState = { ...prev };
        delete newState[insightId];
        return newState;
      });
    }
  };

  const getInsightIcon = (insight: AdvisorInsight) => {
    switch (insight.type) {
      case "alert":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "recommendation":
        return <Zap className="h-5 w-5 text-blue-500" />;
      case "forecast":
        return insight.evidence.change > 0 ? (
          <TrendingUp className="h-5 w-5 text-green-500" />
        ) : (
          <TrendingDown className="h-5 w-5 text-orange-500" />
        );
      case "observation":
      default:
        return <Target className="h-5 w-5 text-purple-500" />;
    }
  };

  const getTypeColor = (type: AdvisorInsight["type"]) => {
    switch (type) {
      case "alert":
        return "bg-red-50 border-red-200";
      case "recommendation":
        return "bg-blue-50 border-blue-200";
      case "forecast":
        return "bg-green-50 border-green-200";
      case "observation":
        return "bg-purple-50 border-purple-200";
    }
  };

  const getCategoryBadgeVariant = (category: AdvisorInsight["category"]) => {
    switch (category) {
      case "content":
        return "default";
      case "timing":
        return "secondary";
      case "platform":
        return "outline";
      case "audience":
        return "default";
      case "campaign":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getConfidenceColor = (confidence: AdvisorInsight["confidence"]) => {
    switch (confidence) {
      case "high":
        return "text-green-600";
      case "medium":
        return "text-yellow-600";
      case "low":
        return "text-gray-600";
    }
  };

  const displayInsights = insights.slice(0, maxInsights);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            AI Insights & Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            AI Insights & Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button variant="outline" onClick={loadInsights}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            AI Insights & Recommendations
          </CardTitle>
          {insights.length > 0 && (
            <Button variant="ghost" size="sm" onClick={loadInsights}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {displayInsights.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No insights available yet.</p>
            <p className="text-sm">
              Check back soon as we analyze your content performance.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayInsights.map((insight) => {
              const feedback = feedbackStates[insight.id] || insight.feedback;
              const isImplemented = feedback === "implemented";
              const isAccepted = feedback === "accepted";
              const isRejected = feedback === "rejected";

              return (
                <div
                  key={insight.id}
                  className={cn(
                    "border-l-4 p-4 rounded-lg transition-all",
                    getTypeColor(insight.type),
                    isImplemented && "opacity-60 bg-gray-50",
                  )}
                >
                  <div className="flex items-start gap-3">
                    {getInsightIcon(insight)}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm text-gray-900 mb-1">
                            {insight.title}
                          </h4>
                          <p className="text-sm text-gray-700 mb-2">
                            {insight.description}
                          </p>
                        </div>

                        {isImplemented && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-green-100 rounded text-green-700 text-xs font-medium whitespace-nowrap">
                            <CheckCircle className="h-3 w-3" />
                            Implemented
                          </div>
                        )}
                      </div>

                      {/* Metadata badges */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge
                          variant={getCategoryBadgeVariant(insight.category)}
                          className="text-xs"
                        >
                          {insight.category}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            getConfidenceColor(insight.confidence),
                          )}
                        >
                          {insight.confidence} confidence
                        </Badge>
                        {insight.impact === "high" && (
                          <Badge variant="destructive" className="text-xs">
                            High Impact
                          </Badge>
                        )}
                      </div>

                      {/* Evidence section */}
                      <div className="bg-white bg-opacity-50 rounded p-2 mb-3 text-xs text-gray-600">
                        <p>
                          <strong>Evidence:</strong>{" "}
                          {insight.evidence.comparison}
                        </p>
                        <p className="text-gray-500">
                          {insight.evidence.timeframe}
                        </p>
                      </div>

                      {/* Suggestions */}
                      {insight.suggestions.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-medium text-gray-700 mb-1">
                            Suggestions:
                          </p>
                          <ul className="text-xs text-gray-600 space-y-1">
                            {insight.suggestions
                              .slice(0, 2)
                              .map((suggestion, idx) => (
                                <li key={idx} className="flex gap-2">
                                  <span className="text-gray-400">•</span>
                                  <span>{suggestion}</span>
                                </li>
                              ))}
                            {insight.suggestions.length > 2 && (
                              <li className="text-gray-500 italic">
                                +{insight.suggestions.length - 2} more
                                suggestion
                                {insight.suggestions.length - 2 > 1 ? "s" : ""}
                              </li>
                            )}
                          </ul>
                        </div>
                      )}

                      {/* Action buttons */}
                      {!isImplemented && (
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            size="sm"
                            variant={isAccepted ? "default" : "outline"}
                            onClick={() =>
                              handleFeedback(insight.id, "accepted")
                            }
                            disabled={isRejected}
                            className="text-xs"
                          >
                            <ThumbsUp className="h-3 w-3 mr-1" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant={isRejected ? "destructive" : "outline"}
                            onClick={() =>
                              handleFeedback(insight.id, "rejected")
                            }
                            disabled={isAccepted}
                            className="text-xs"
                          >
                            <ThumbsDown className="h-3 w-3 mr-1" />
                            Dismiss
                          </Button>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() =>
                              handleFeedback(insight.id, "implemented")
                            }
                            className="text-xs"
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Implement
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {insights.length > maxInsights && (
              <div className="text-center pt-4 border-t">
                <Button variant="ghost" size="sm">
                  View all {insights.length} insights →
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
