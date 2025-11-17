import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  TrendingDown,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  Calendar,
  Clock,
  BarChart3,
  ExternalLink,
  X,
} from "lucide-react";
import { cn } from "@/lib/design-system";

interface AnalysisFactor {
  name: string;
  status: "positive" | "neutral" | "warning" | "unknown";
  description: string;
  icon: React.ReactNode;
}

interface MetricChange {
  metric: string;
  change: number;
  isPositive: boolean;
  factors: AnalysisFactor[];
  recommendation: string;
  learnMoreUrl?: string;
}

interface RootCauseAnalysisProps {
  changes: MetricChange[];
  onDismiss?: (metric: string) => void;
  className?: string;
}

export function RootCauseAnalysis({
  changes,
  onDismiss,
  className,
}: RootCauseAnalysisProps) {
  const getFactorIcon = (status: AnalysisFactor["status"]) => {
    switch (status) {
      case "positive":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      case "neutral":
        return <BarChart3 className="h-4 w-4 text-blue-600" />;
      case "unknown":
        return <HelpCircle className="h-4 w-4 text-slate-600" />;
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {changes.map((change) => (
        <Alert
          key={change.metric}
          className={cn(
            "border-l-4",
            change.isPositive
              ? "border-l-green-500 bg-green-50 border-green-200"
              : "border-l-red-500 bg-red-50 border-red-200",
          )}
        >
          <div className="flex gap-4">
            <div className="flex-shrink-0 pt-1">
              {change.isPositive ? (
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <AlertDescription>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <h3
                      className={cn(
                        "font-bold text-lg mb-1",
                        change.isPositive ? "text-green-900" : "text-red-900",
                      )}
                    >
                      📊 {change.metric} {change.isPositive ? "up" : "down"}{" "}
                      {Math.abs(change.change)}% this week
                    </h3>
                    <p
                      className={cn(
                        "text-sm",
                        change.isPositive ? "text-green-800" : "text-red-800",
                      )}
                    >
                      {change.isPositive
                        ? "Great news! Here's what contributed to this growth:"
                        : "Here's our analysis of what changed:"}
                    </p>
                  </div>

                  {onDismiss && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDismiss(change.metric)}
                      className="flex-shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* AI Analysis Factors */}
                <Card className="mb-4 bg-white">
                  <CardContent className="pt-4 pb-4">
                    <h4
                      className={cn(
                        "font-bold text-sm mb-3",
                        change.isPositive ? "text-green-900" : "text-red-900",
                      )}
                    >
                      AI Analysis:
                    </h4>
                    <div className="space-y-2">
                      {change.factors.map((factor, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <div className="flex-shrink-0 mt-0.5">
                            {getFactorIcon(factor.status)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {factor.icon}
                              <span className="font-medium text-sm text-slate-900">
                                {factor.name}
                              </span>
                            </div>
                            <p className="text-sm text-slate-600 mt-0.5">
                              {factor.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Recommended Action */}
                <Card
                  className={cn(
                    "border-2",
                    change.isPositive
                      ? "border-green-300 bg-green-50"
                      : "border-amber-300 bg-amber-50",
                  )}
                >
                  <CardContent className="pt-4 pb-4">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0">
                        <div
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center",
                            change.isPositive ? "bg-green-200" : "bg-amber-200",
                          )}
                        >
                          {change.isPositive ? "🎯" : "💡"}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4
                          className={cn(
                            "font-bold text-sm mb-1",
                            change.isPositive
                              ? "text-green-900"
                              : "text-amber-900",
                          )}
                        >
                          {change.isPositive
                            ? "Keep the momentum!"
                            : "Recommended Action:"}
                        </h4>
                        <p
                          className={cn(
                            "text-sm",
                            change.isPositive
                              ? "text-green-800"
                              : "text-amber-800",
                          )}
                        >
                          {change.recommendation}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Learn More Link */}
                {change.learnMoreUrl && (
                  <Button
                    variant="link"
                    className={cn(
                      "mt-3 p-0 h-auto font-medium gap-1",
                      change.isPositive ? "text-green-700" : "text-red-700",
                    )}
                    onClick={() => window.open(change.learnMoreUrl, "_blank")}
                  >
                    Learn more about this analysis
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                )}
              </AlertDescription>
            </div>
          </div>
        </Alert>
      ))}
    </div>
  );
}

// Example usage data
export const mockMetricChanges: MetricChange[] = [
  {
    metric: "Engagement",
    change: -20,
    isPositive: false,
    factors: [
      {
        name: "Content quality",
        status: "positive",
        description: "Same as last week",
        icon: <CheckCircle className="h-3 w-3" />,
      },
      {
        name: "Posting frequency",
        status: "warning",
        description: "Down to 1 post (vs usual 3)",
        icon: <Calendar className="h-3 w-3" />,
      },
      {
        name: "Posting time",
        status: "warning",
        description: "Shifted later (usual 10 AM → 3 PM)",
        icon: <Clock className="h-3 w-3" />,
      },
      {
        name: "Platform factor",
        status: "unknown",
        description: "Instagram algorithm may have changed",
        icon: <BarChart3 className="h-3 w-3" />,
      },
      {
        name: "External factor",
        status: "neutral",
        description: "Holidays may suppress engagement",
        icon: <HelpCircle className="h-3 w-3" />,
      },
    ],
    recommendation: "Post 3× this week to compensate for lower frequency",
    learnMoreUrl: "/help/engagement-analysis",
  },
];
