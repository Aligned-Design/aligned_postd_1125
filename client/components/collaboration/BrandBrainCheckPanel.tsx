/**
 * BrandBrainCheckPanel
 * 
 * Displays Brand Brain evaluation results for content review.
 * This is ADVISORY ONLY - it does not block approval or publishing.
 * 
 * Features:
 * - Alignment score display (0-100)
 * - Grouped checks (pass/warn/fail)
 * - Top recommendations
 * - Low score hint (score < 60)
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Brain,
  Lightbulb,
  Info,
} from "lucide-react";
import { cn } from "@/lib/design-system";
import type { BrandBrainEvaluation } from "@shared/aiContent";
import type { EvaluationCheck } from "@shared/brand-brain";

interface BrandBrainCheckPanelProps {
  evaluation: BrandBrainEvaluation | null | undefined;
  /** Compact mode for smaller displays */
  compact?: boolean;
  /** Class name for styling */
  className?: string;
}

/**
 * Get score color based on value
 */
function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-yellow-600";
  return "text-red-600";
}

/**
 * Get score background color
 */
function getScoreBgColor(score: number): string {
  if (score >= 80) return "bg-green-50 border-green-200";
  if (score >= 60) return "bg-yellow-50 border-yellow-200";
  return "bg-red-50 border-red-200";
}

/**
 * Get status icon
 */
function getStatusIcon(status: EvaluationCheck["status"]) {
  switch (status) {
    case "pass":
      return <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />;
    case "warn":
      return <AlertTriangle className="h-3.5 w-3.5 text-yellow-600" />;
    case "fail":
      return <XCircle className="h-3.5 w-3.5 text-red-600" />;
  }
}

/**
 * Group checks by status
 */
function groupChecksByStatus(checks: EvaluationCheck[]) {
  return {
    passed: checks.filter((c) => c.status === "pass"),
    warnings: checks.filter((c) => c.status === "warn"),
    failed: checks.filter((c) => c.status === "fail"),
  };
}

/**
 * BrandBrainCheckPanel - Full panel for Approvals UI
 */
export function BrandBrainCheckPanel({
  evaluation,
  compact = false,
  className,
}: BrandBrainCheckPanelProps) {
  if (!evaluation) {
    return (
      <Card className={cn("border border-slate-200 bg-slate-50/50", className)}>
        <CardContent className="py-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Brain className="h-4 w-4" />
            <span>No Brand Brain evaluation available for this item yet.</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { passed, warnings, failed } = groupChecksByStatus(evaluation.checks);
  const showLowScoreHint = evaluation.score < 60;

  if (compact) {
    return (
      <BrandBrainScoreBadge score={evaluation.score} className={className} />
    );
  }

  return (
    <Card
      className={cn(
        "border-2",
        getScoreBgColor(evaluation.score),
        className
      )}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-sm sm:text-base flex items-center gap-2">
          <Brain className="h-4 w-4 text-violet" />
          Brand Brain Check
          <Badge variant="outline" className="ml-auto font-normal text-xs">
            Advisory
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score Display */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Alignment Score</span>
          <span className={cn("text-2xl font-bold", getScoreColor(evaluation.score))}>
            {evaluation.score}/100
          </span>
        </div>

        {/* Low Score Hint */}
        {showLowScoreHint && (
          <div className="flex items-start gap-2 p-2 bg-yellow-100 border border-yellow-300 rounded-md text-xs">
            <Info className="h-4 w-4 text-yellow-700 mt-0.5 flex-shrink-0" />
            <span className="text-yellow-800">
              Consider revising based on Brand Brain feedback before publishing.
            </span>
          </div>
        )}

        {/* Checks Summary */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Checks
          </div>
          
          {/* Failed Checks */}
          {failed.length > 0 && (
            <div className="space-y-1">
              {failed.map((check, i) => (
                <CheckItem key={`fail-${i}`} check={check} />
              ))}
            </div>
          )}

          {/* Warning Checks */}
          {warnings.length > 0 && (
            <div className="space-y-1">
              {warnings.map((check, i) => (
                <CheckItem key={`warn-${i}`} check={check} />
              ))}
            </div>
          )}

          {/* Passed Checks (collapsed if there are issues) */}
          {passed.length > 0 && (
            <div className="space-y-1">
              {(failed.length === 0 && warnings.length === 0) ? (
                // Show all passed if no issues
                passed.map((check, i) => (
                  <CheckItem key={`pass-${i}`} check={check} />
                ))
              ) : (
                // Show summary if there are issues
                <div className="flex items-center gap-2 text-xs text-green-600">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>{passed.length} check{passed.length !== 1 ? "s" : ""} passed</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Recommendations */}
        {evaluation.recommendations.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <Lightbulb className="h-3 w-3" />
              Recommendations
            </div>
            <ul className="space-y-1">
              {evaluation.recommendations.slice(0, 3).map((rec, i) => (
                <li key={i} className="text-xs text-muted-foreground pl-4 relative">
                  <span className="absolute left-0">•</span>
                  {rec.replace(/^\[(Critical|Suggestion|Tip|Important)\]\s*/i, "")}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Evaluation Version (tiny footer) */}
        <div className="text-[10px] text-muted-foreground/60 pt-2 border-t">
          Evaluated at {new Date(evaluation.evaluatedAt).toLocaleTimeString()} • {evaluation.evaluationVersion}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Single check item display
 */
function CheckItem({ check }: { check: EvaluationCheck }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 text-xs cursor-help">
            {getStatusIcon(check.status)}
            <span className={cn(
              check.status === "fail" && "text-red-700",
              check.status === "warn" && "text-yellow-700",
              check.status === "pass" && "text-green-700",
            )}>
              {check.name}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <p className="text-xs">{check.details}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * BrandBrainScoreBadge - Compact score display for Creative Studio
 */
export function BrandBrainScoreBadge({
  score,
  className,
  showLabel = true,
}: {
  score: number;
  className?: string;
  showLabel?: boolean;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              "gap-1 font-medium cursor-help",
              score >= 80 && "bg-green-50 text-green-700 border-green-300",
              score >= 60 && score < 80 && "bg-yellow-50 text-yellow-700 border-yellow-300",
              score < 60 && "bg-red-50 text-red-700 border-red-300",
              className
            )}
          >
            <Brain className="h-3 w-3" />
            {showLabel && <span className="text-[10px] uppercase">BB:</span>}
            <span>{score}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">Brand Brain Alignment Score: {score}/100</p>
          <p className="text-xs text-muted-foreground mt-1">
            {score >= 80 ? "Great alignment with brand guidelines" :
             score >= 60 ? "Acceptable, some improvements suggested" :
             "Consider revising based on Brand Brain feedback"}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default BrandBrainCheckPanel;

