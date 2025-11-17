import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle,
  AlertTriangle,
  X,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Sparkles,
  RefreshCw,
  ThumbsUp,
  Settings,
} from "lucide-react";

interface BrandFidelityScoreCardProps {
  score: number; // 0-100
  reasoning: {
    tone: { status: "pass" | "warn" | "fail"; message: string };
    energy: { status: "pass" | "warn" | "fail"; message: string };
    formality: { status: "pass" | "warn" | "fail"; message: string };
    terminology: { status: "pass" | "warn" | "fail"; message: string };
    callToAction: { status: "pass" | "warn" | "fail"; message: string };
  };
  suggestion?: string;
  onShowSuggestion?: () => void;
  onProceed?: () => void;
  onRegenerate?: () => void;
  onDisableCheck?: () => void;
  className?: string;
}

export function BrandFidelityScoreCard({
  score,
  reasoning,
  suggestion,
  onShowSuggestion,
  onProceed,
  onRegenerate,
  onDisableCheck,
  className,
}: BrandFidelityScoreCardProps) {
  const [expanded, setExpanded] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  const getScoreColor = () => {
    if (score >= 90) return "text-green-600";
    if (score >= 75) return "text-yellow-600";
    if (score >= 60) return "text-orange-600";
    return "text-red-600";
  };

  const getScoreBgColor = () => {
    if (score >= 90) return "bg-green-50";
    if (score >= 75) return "bg-yellow-50";
    if (score >= 60) return "bg-orange-50";
    return "bg-red-50";
  };

  const getScoreBorderColor = () => {
    if (score >= 90) return "border-green-200";
    if (score >= 75) return "border-yellow-200";
    if (score >= 60) return "border-orange-200";
    return "border-red-200";
  };

  const getScoreGrade = () => {
    if (score >= 95) return "Excellent";
    if (score >= 90) return "Great";
    if (score >= 80) return "Good";
    if (score >= 70) return "Fair";
    return "Needs Work";
  };

  const getStatusIcon = (status: "pass" | "warn" | "fail") => {
    switch (status) {
      case "pass":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "warn":
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case "fail":
        return <X className="w-4 h-4 text-red-600" />;
    }
  };

  const allCriteriaPassed = Object.values(reasoning).every(
    (r) => r.status === "pass",
  );

  return (
    <Card
      className={`border-2 ${getScoreBorderColor()} ${getScoreBgColor()} ${className}`}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/80 flex items-center justify-center">
              {score >= 90 ? (
                <CheckCircle className="w-7 h-7 text-green-600" />
              ) : (
                <AlertTriangle className="w-7 h-7 text-yellow-600" />
              )}
            </div>
            <div>
              <CardTitle className="text-lg">Brand Alignment Check</CardTitle>
              <p className="text-xs text-slate-600">
                How well does this match your brand guidelines?
              </p>
            </div>
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
          >
            {expanded ? (
              <ChevronUp className="w-5 h-5 text-slate-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-600" />
            )}
          </button>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4">
          {/* Score Display */}
          <div className="flex items-center justify-between p-4 bg-white rounded-lg border-2 border-slate-200">
            <div>
              <p className="text-sm font-medium text-slate-700 mb-1">
                Overall Score
              </p>
              <div className="flex items-baseline gap-2">
                <span className={`text-5xl font-black ${getScoreColor()}`}>
                  {score}
                </span>
                <span className="text-2xl text-slate-400">/100</span>
              </div>
              <p className="text-sm text-slate-600 mt-1">{getScoreGrade()}</p>
            </div>

            <div className="text-right">
              <div className="w-24 h-24 relative">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="6"
                    className="text-slate-200"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="6"
                    strokeDasharray={`${(score / 100) * 251} 251`}
                    className={getScoreColor()}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-xl font-black ${getScoreColor()}`}>
                    {score}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">Brand Alignment Strength</span>
              <span className={`font-bold ${getScoreColor()}`}>
                {getScoreGrade()}
              </span>
            </div>
            <Progress value={score} className={`h-3 ${getScoreColor()}`} />
            <div className="flex justify-between text-xs text-slate-500">
              <span>0</span>
              <span>50</span>
              <span>75</span>
              <span>90</span>
              <span>100</span>
            </div>
          </div>

          {/* Reasoning Breakdown */}
          <div className="space-y-3">
            <p className="text-sm font-bold text-slate-900">
              Detailed Analysis:
            </p>

            <div className="space-y-2">
              {Object.entries(reasoning).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-start gap-3 p-3 bg-white rounded-lg border border-slate-200"
                >
                  {getStatusIcon(value.status)}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900 capitalize">
                      {key === "callToAction" ? "Call to Action" : key}
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {value.message}
                    </p>
                  </div>
                  {value.status === "pass" && (
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-700 border-green-200"
                    >
                      ✓
                    </Badge>
                  )}
                  {value.status === "warn" && (
                    <Badge
                      variant="secondary"
                      className="bg-yellow-100 text-yellow-700 border-yellow-200"
                    >
                      ⚠
                    </Badge>
                  )}
                  {value.status === "fail" && (
                    <Badge
                      variant="secondary"
                      className="bg-red-100 text-red-700 border-red-200"
                    >
                      ✗
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Suggestion Box */}
          {suggestion && score < 100 && (
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <Lightbulb className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-purple-900 mb-1">
                    💡 How to reach{" "}
                    {score >= 95 ? "100%" : score >= 90 ? "95%+" : "90%+"}:
                  </p>
                  <p className="text-sm text-purple-800">{suggestion}</p>
                  {onShowSuggestion && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onShowSuggestion}
                      className="mt-3 border-purple-300 text-purple-700 hover:bg-purple-100"
                    >
                      <Sparkles className="w-4 h-4 mr-1" />
                      Show Me How
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {allCriteriaPassed && score >= 90 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <p className="text-sm text-green-800 font-medium">
                  ✓ Excellent! This content meets all brand fidelity
                  requirements.
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            {onProceed && (
              <Button
                onClick={onProceed}
                className={`flex-1 ${
                  score >= 75
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                    : "bg-slate-600 hover:bg-slate-700"
                }`}
              >
                <ThumbsUp className="w-4 h-4 mr-2" />
                {score >= 90 ? "Looks Good, Proceed" : "Proceed Anyway"}
              </Button>
            )}

            {onRegenerate && (
              <Button
                variant="outline"
                onClick={onRegenerate}
                className="flex-1"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Regenerate
              </Button>
            )}
          </div>

          {/* Settings Toggle */}
          {onDisableCheck && (
            <div className="pt-2 border-t border-slate-200">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center gap-2 text-xs text-slate-600 hover:text-slate-900 transition-colors"
              >
                <Settings className="w-3 h-3" />
                Advanced Options
              </button>

              {showSettings && (
                <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          onDisableCheck();
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-xs text-slate-700">
                      🤖 Don't check brand alignment for future content (power
                      users only)
                    </span>
                  </label>
                  <p className="text-xs text-slate-500 mt-2 ml-5">
                    Note: You can re-enable this in Settings → Brand Preferences
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
