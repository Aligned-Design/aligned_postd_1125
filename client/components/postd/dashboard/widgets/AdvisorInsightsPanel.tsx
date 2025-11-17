/**
 * AdvisorInsightsPanel
 * 
 * Displays insights and recommendations from The Advisor with Brand Fidelity Score.
 */

import { Sparkles, ArrowRight, AlertTriangle, RefreshCw, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/design-system";
import { useAdvisorInsights } from "../hooks/useAdvisorInsights";
import { useCurrentBrand } from "@/hooks/useCurrentBrand";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

const severityStyles = {
  info: "border-l-4 border-l-blue-500 bg-blue-50/50",
  warning: "border-l-4 border-l-amber-500 bg-amber-50/50",
  critical: "border-l-4 border-l-red-500 bg-red-50/50",
};

export function AdvisorInsightsPanel() {
  const { brandId } = useCurrentBrand();
  
  const {
    insights,
    brandFidelityScore,
    compliance,
    isLoading,
    isError,
    error,
    refetch,
  } = useAdvisorInsights({
    brandId,
    timeRange: "7d",
    enabled: !!brandId,
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">The Advisor</h2>
            <p className="text-xs text-gray-600">Insights and recommendations</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          <span className="ml-2 text-sm text-gray-600">Analyzing your brand's performance...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">The Advisor</h2>
            <p className="text-xs text-gray-600">Insights and recommendations</p>
          </div>
        </div>
        <div className="text-center py-8">
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-3" />
          <p className="text-sm text-gray-700 mb-4">
            We couldn't load insights right now. Please try again.
          </p>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Empty state
  if (insights.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">The Advisor</h2>
            <p className="text-xs text-gray-600">Insights and recommendations</p>
          </div>
        </div>
        <div className="text-center py-8">
          <p className="text-sm text-gray-600 mb-2">
            We don't have enough data yet to generate insights.
          </p>
          <p className="text-xs text-gray-500">
            Try again after a few days of activity.
          </p>
        </div>
      </div>
    );
  }

  // Normal state - show insights
  const bfsPercentage = Math.round(brandFidelityScore * 100);
  const isLowBFS = brandFidelityScore < 0.8;
  const hasComplianceIssues = compliance.offBrand || (compliance.bannedPhrases && compliance.bannedPhrases.length > 0);

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">The Advisor</h2>
            <p className="text-xs text-gray-600">Insights and recommendations</p>
          </div>
        </div>
        
        {/* Brand Fidelity Score Badge */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-semibold",
                  isLowBFS
                    ? "bg-amber-100 text-amber-700 border border-amber-300"
                    : "bg-green-100 text-green-700 border border-green-300"
                )}
              >
                BFS: {bfsPercentage}%
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">
                Brand Fidelity Score: {bfsPercentage}%
                {isLowBFS && (
                  <span className="block mt-1 text-amber-600">
                    These insights may not fully match your brand guidelines.
                  </span>
                )}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Compliance Warning */}
      {hasComplianceIssues && (
        <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-amber-900 mb-1">
                Compliance Notice
              </p>
              {compliance.offBrand && (
                <p className="text-xs text-amber-700 mb-1">
                  Some insights may not fully align with brand guidelines.
                </p>
              )}
              {compliance.bannedPhrases && compliance.bannedPhrases.length > 0 && (
                <p className="text-xs text-amber-700">
                  Detected phrases: {compliance.bannedPhrases.join(", ")}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Insights List */}
      <div className="space-y-4">
        {insights.map((insight) => (
          <div
            key={insight.id}
            className={cn(
              "p-4 rounded-lg",
              severityStyles[insight.severity]
            )}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="text-sm font-semibold text-gray-900">
                {insight.title}
              </h3>
              {insight.confidence > 0 && (
                <span className="text-xs text-gray-500 flex-shrink-0">
                  {Math.round(insight.confidence * 100)}% confidence
                </span>
              )}
            </div>
            <p className="text-xs text-gray-700 mb-3">{insight.body}</p>
            
            {/* Recommended Actions */}
            {insight.recommendedActions && insight.recommendedActions.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-gray-700 mb-1">Recommended Actions:</p>
                <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
                  {insight.recommendedActions.map((action, idx) => (
                    <li key={idx}>{action}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Category Badge */}
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
                {insight.category}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
