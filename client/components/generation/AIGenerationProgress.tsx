import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader,
  Sparkles,
  Clock,
  X,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface AIGenerationProgressProps {
  isGenerating: boolean;
  status: "idle" | "generating" | "success" | "error";
  type: "copy" | "design" | "variations";
  estimatedTime?: number; // in seconds
  onCancel?: () => void;
  onRetry?: () => void;
  errorMessage?: string;
  generatedCount?: number;
  targetCount?: number;
}

export function AIGenerationProgress({
  isGenerating,
  status,
  type,
  estimatedTime = 10,
  onCancel,
  onRetry,
  errorMessage,
  generatedCount = 0,
  targetCount = 3,
}: AIGenerationProgressProps) {
  // Reset when generation starts - use initial state function
  const [elapsedTime, setElapsedTime] = useState(() => {
    return status === "generating" ? 0 : 0;
  });
  const [progressPercent, setProgressPercent] = useState(() => {
    return status === "generating" ? 0 : status === "success" ? 100 : 0;
  });

  // Reset when generation starts
  useEffect(() => {
    if (status === "generating") {
      setElapsedTime(0);
      setProgressPercent(0);
    } else if (status === "success") {
      setProgressPercent(100);
    }
  }, [status]);

  // Update elapsed time and progress
  useEffect(() => {
    if (status === "generating") {
      const interval = setInterval(() => {
        setElapsedTime((prev) => {
          const newElapsed = prev + 0.1;
          setProgressPercent(Math.min(90, (newElapsed / estimatedTime) * 100));
          return newElapsed;
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [status, estimatedTime]);

  const getStatusMessage = () => {
    switch (type) {
      case "copy":
        return "Crafting caption variations";
      case "design":
        return "Generating design templates";
      case "variations":
        return "Creating content variations";
      default:
        return "Processing with AI";
    }
  };

  // Don't show anything if idle
  if (status === "idle") {
    return null;
  }

  return (
    <Card
      className={`border-2 ${
        status === "generating"
          ? "border-indigo-200 bg-indigo-50/50"
          : status === "success"
            ? "border-green-200 bg-green-50/50"
            : status === "error"
              ? "border-red-200 bg-red-50/50"
              : "border-slate-200"
      }`}
    >
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Header with Status Icon */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  status === "generating"
                    ? "bg-indigo-100"
                    : status === "success"
                      ? "bg-green-100"
                      : status === "error"
                        ? "bg-red-100"
                        : "bg-slate-100"
                }`}
              >
                {status === "generating" && (
                  <Loader className="w-5 h-5 text-indigo-600 animate-spin" />
                )}
                {status === "success" && (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                )}
                {status === "error" && (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
              </div>

              <div>
                <p className="font-bold text-slate-900">
                  {status === "generating" && (
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      {getStatusMessage()}...
                    </span>
                  )}
                  {status === "success" && "Generation Complete!"}
                  {status === "error" && "Generation Failed"}
                </p>

                {status === "generating" && (
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span className="text-xs text-slate-600">
                      ~{Math.max(0, Math.ceil(estimatedTime - elapsedTime))}s
                      remaining
                    </span>
                  </div>
                )}

                {status === "success" && generatedCount > 0 && (
                  <p className="text-xs text-green-700 mt-1">
                    ✅ Generated {generatedCount}{" "}
                    {type === "copy" ? "variations" : "options"} in{" "}
                    {elapsedTime.toFixed(1)}s
                  </p>
                )}

                {status === "error" && errorMessage && (
                  <p className="text-xs text-red-700 mt-1">{errorMessage}</p>
                )}
              </div>
            </div>

            {/* Cancel button during generation */}
            {status === "generating" && onCancel && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancel}
                className="text-slate-600 hover:text-slate-900"
              >
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
            )}

            {/* Retry button on error */}
            {status === "error" && onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="text-red-700 border-red-300 hover:bg-red-50"
              >
                Try Again
              </Button>
            )}
          </div>

          {/* Progress Bar */}
          {status === "generating" && (
            <div className="space-y-2">
              <Progress value={progressPercent} className="h-2" />
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>{Math.round(progressPercent)}% complete</span>
                <span>
                  {generatedCount}/{targetCount}{" "}
                  {type === "copy" ? "variations" : "items"}
                </span>
              </div>
            </div>
          )}

          {/* Success Animation - Stagger Cards */}
          {status === "success" && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <p className="text-sm text-green-800 font-medium">
                  Results ready! Review your options below.
                </p>
              </div>
            </div>
          )}

          {/* Error Details */}
          {status === "error" && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-red-800 font-medium">
                      {errorMessage ||
                        "Couldn't generate content. Please try again."}
                    </p>
                    <p className="text-xs text-red-700 mt-1">
                      If the problem persists, check your internet connection or
                      contact support.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Helpful Tips During Generation */}
          {status === "generating" && (
            <div className="text-xs text-slate-600 italic">
              💡 Tip: Press{" "}
              <kbd className="px-1 py-0.5 bg-slate-200 rounded text-[10px] font-mono">
                Esc
              </kbd>{" "}
              to cancel generation
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
