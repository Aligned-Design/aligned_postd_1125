import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertTriangle,
  CheckCircle,
  TrendingDown,
  TrendingUp,
  Zap,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/design-system";

interface SeasonalStrategy {
  name: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
}

interface SeasonalDipData {
  season: "summer" | "winter" | "spring" | "fall";
  type: "warning" | "active" | "recovery";
  title: string;
  description: string;
  expectedDrop?: string;
  reason?: string;
  strategies?: SeasonalStrategy[];
  goal?: string;
  cantControl?: string[];
  actualPerformance?: {
    engagementDrop: number;
    followerChange: number;
    industryAverage: number;
  };
  recoveryMessage?: string;
}

interface SeasonalDipInsuranceProps {
  data: SeasonalDipData;
  onEnableOptimization?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function SeasonalDipInsurance({
  data,
  onEnableOptimization,
  onDismiss,
  className,
}: SeasonalDipInsuranceProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [optimizationEnabled, setOptimizationEnabled] = useState(false);

  const handleEnableOptimization = () => {
    setOptimizationEnabled(true);
    if (onEnableOptimization) {
      onEnableOptimization();
    }

    // Track analytics
    if (window.posthog) {
      window.posthog.capture("seasonal_optimization_enabled", {
        season: data.season,
      });
    }
  };

  const getAlertColor = () => {
    switch (data.type) {
      case "warning":
        return "border-amber-500 bg-amber-50";
      case "active":
        return "border-blue-500 bg-blue-50";
      case "recovery":
        return "border-green-500 bg-green-50";
    }
  };

  const getIcon = () => {
    switch (data.type) {
      case "warning":
        return <AlertTriangle className="h-6 w-6 text-amber-600" />;
      case "active":
        return <TrendingDown className="h-6 w-6 text-blue-600" />;
      case "recovery":
        return <TrendingUp className="h-6 w-6 text-green-600" />;
    }
  };

  return (
    <Alert className={cn("border-2", getAlertColor(), className)}>
      <AlertDescription>
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">{getIcon()}</div>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-slate-900 mb-1">
                {data.title}
              </h3>
              <p className="text-slate-700">{data.description}</p>
            </div>
            {onDismiss && (
              <Button variant="ghost" size="sm" onClick={onDismiss}>
                ✕
              </Button>
            )}
          </div>

          {/* Warning Type Content */}
          {data.type === "warning" && data.expectedDrop && data.reason && (
            <>
              {/* Expected Impact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-amber-200">
                  <CardContent className="pt-4 pb-4">
                    <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2">
                      Expected Impact
                    </p>
                    <p className="text-3xl font-black text-amber-600">
                      {data.expectedDrop}
                    </p>
                    <p className="text-xs text-amber-700 mt-1">
                      Typical seasonal decline
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-slate-200">
                  <CardContent className="pt-4 pb-4">
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                      Why This Happens
                    </p>
                    <p className="text-sm text-slate-700">{data.reason}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Strategies */}
              {data.strategies && (
                <>
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900">What We'll Do</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDetails(!showDetails)}
                    >
                      {showDetails ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  {showDetails && (
                    <div className="space-y-2">
                      {data.strategies.map((strategy, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 p-3 bg-white rounded-lg border border-green-200"
                        >
                          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="font-bold text-slate-900 text-sm mb-1">
                              {strategy.name}
                            </p>
                            <p className="text-slate-600 text-sm">
                              {strategy.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Goal & Limitations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.goal && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex gap-2 items-start">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h5 className="font-bold text-green-900 text-sm mb-1">
                          Your Goal
                        </h5>
                        <p className="text-green-800 text-sm">{data.goal}</p>
                      </div>
                    </div>
                  </div>
                )}

                {data.cantControl && (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <div className="flex gap-2 items-start">
                      <AlertTriangle className="h-4 w-4 text-slate-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h5 className="font-bold text-slate-900 text-sm mb-1">
                          Can't Control
                        </h5>
                        <ul className="text-slate-700 text-sm space-y-1">
                          {data.cantControl.map((item, idx) => (
                            <li key={idx}>• {item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Enable Optimization CTA */}
              {!optimizationEnabled && onEnableOptimization && (
                <Button
                  onClick={handleEnableOptimization}
                  className="w-full gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600"
                  size="lg"
                >
                  <Zap className="h-5 w-5" />
                  Enable{" "}
                  {data.season.charAt(0).toUpperCase() +
                    data.season.slice(1)}{" "}
                  Optimization
                </Button>
              )}

              {optimizationEnabled && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-bold text-green-900 mb-1">
                        Optimization Enabled!
                      </h5>
                      <p className="text-green-800 text-sm">
                        We've adjusted your content strategy for the seasonal
                        period. You'll see optimized posting times and content
                        types in your queue.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Recovery Type Content */}
          {data.type === "recovery" && data.actualPerformance && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="pt-4 pb-4">
                    <p className="text-xs font-bold text-green-700 uppercase tracking-wider mb-2">
                      Your Performance
                    </p>
                    <p className="text-3xl font-black text-green-600 mb-1">
                      {data.actualPerformance.engagementDrop > 0 ? "+" : ""}
                      {data.actualPerformance.engagementDrop}%
                    </p>
                    <p className="text-xs text-green-700">
                      Engagement change |{" "}
                      {data.actualPerformance.followerChange} followers lost
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-slate-200">
                  <CardContent className="pt-4 pb-4">
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                      Industry Average
                    </p>
                    <p className="text-3xl font-black text-slate-600 mb-1">
                      {data.actualPerformance.industryAverage}%
                    </p>
                    <p className="text-xs text-slate-600">
                      Competitor follower loss
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-green-100 border border-green-300 rounded-lg p-4">
                <div className="flex gap-3">
                  <TrendingUp className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-green-900 mb-1">
                      What This Means
                    </h4>
                    <p className="text-green-800 text-sm leading-relaxed">
                      {data.recoveryMessage}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}

// Example data
export const summerSlumpWarning: SeasonalDipData = {
  season: "summer",
  type: "warning",
  title: "Summer slump incoming",
  description: "Heads up: Engagement typically drops during summer months",
  expectedDrop: "15-25%",
  reason: "Audiences are traveling, less time on social",
  strategies: [
    {
      name: "Increase posting frequency",
      description: "More touchpoints = more engagement",
      icon: <CheckCircle className="h-4 w-4" />,
      enabled: true,
    },
    {
      name: 'Shift to "aspirational" content',
      description: "Vacations, leisure, summer themes",
      icon: <CheckCircle className="h-4 w-4" />,
      enabled: true,
    },
    {
      name: "Optimize timing with AI",
      description: "Post when your audience IS online",
      icon: <CheckCircle className="h-4 w-4" />,
      enabled: true,
    },
    {
      name: "Focus on conversion",
      description: "Engagement may dip, but leads should stay stable",
      icon: <CheckCircle className="h-4 w-4" />,
      enabled: true,
    },
  ],
  goal: "Maintain growth vs. seasonal decline",
  cantControl: ["Global trends", "Competitor actions", "Algorithm changes"],
};

export const summerRecovery: SeasonalDipData = {
  season: "summer",
  type: "recovery",
  title: "Summer's over, let's bounce back",
  description: "Great news! You outperformed during the slow season",
  actualPerformance: {
    engagementDrop: -18,
    followerChange: 0,
    industryAverage: -3,
  },
  recoveryMessage:
    "Your Aligned AI content kept your audience engaged during the slow period. While engagement was down 18%, you lost 0 followers (vs. competitors who lost 3%). Back-to-school season is incoming—preparing optimized content plan...",
};
