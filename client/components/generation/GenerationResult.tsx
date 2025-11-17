import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  CheckCircle,
  Copy,
  Edit2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  FileText,
  Eye,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/design-system";
import type { BrandFidelityScore, LinterResult } from "@/types/agent-config";

interface GenerationResultProps {
  content: string;
  platform: string;
  bfsScore?: BrandFidelityScore;
  linterResult?: LinterResult;
  onApprove?: () => void;
  onRegenerate?: () => void;
  onEdit?: () => void;
  isLoading?: boolean;
  className?: string;
}

export function GenerationResult({
  content,
  platform,
  bfsScore,
  linterResult,
  onApprove,
  onRegenerate,
  onEdit,
  isLoading = false,
  className,
}: GenerationResultProps) {
  const [copied, setCopied] = useState(false);
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null);
  const [showRawContent, setShowRawContent] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getBFSColor = (score: number | undefined) => {
    if (!score) return "text-gray-600";
    if (score >= 0.9) return "text-green-600";
    if (score >= 0.8) return "text-yellow-600";
    return "text-red-600";
  };

  const getBFSBgColor = (score: number | undefined) => {
    if (!score) return "bg-gray-100";
    if (score >= 0.9) return "bg-green-50";
    if (score >= 0.8) return "bg-yellow-50";
    return "bg-red-50";
  };

  const _hasComplianceIssues =
    linterResult &&
    (!linterResult.passed ||
      linterResult.pii_detected?.length > 0 ||
      linterResult.banned_phrases_found?.length > 0 ||
      linterResult.banned_claims_found?.length > 0 ||
      linterResult.platform_violations?.length > 0);

  const _hasBFSIssues = bfsScore && !bfsScore.passed;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Content Preview Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Generated Content</CardTitle>
            <Badge variant="outline">{platform}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Content Display */}
          <div className="bg-gray-50 rounded-lg p-4 min-h-32 max-h-64 overflow-auto">
            <p className="text-gray-900 whitespace-pre-wrap">{content}</p>
          </div>

          {/* Content Stats */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>{content.length} characters</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={copyToClipboard}>
                <Copy className="h-4 w-4 mr-1" />
                {copied ? "Copied!" : "Copy"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowRawContent(!showRawContent)}
              >
                {showRawContent ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-1" />
                    Hide
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-1" />
                    Raw
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Raw Content (Hidden by default) */}
          {showRawContent && (
            <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-xs overflow-auto max-h-40">
              <pre>{JSON.stringify({ content, platform }, null, 2)}</pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* BFS Score Card */}
      {bfsScore && (
        <Card className={getBFSBgColor(bfsScore.overall)}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Brand Fidelity Score (BFS)
              </CardTitle>
              <div className="flex items-center gap-2">
                {bfsScore.passed ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                )}
                <span
                  className={cn(
                    "text-3xl font-bold",
                    getBFSColor(bfsScore.overall),
                  )}
                >
                  {(bfsScore.overall * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Component Scores */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                {
                  label: "Tone Alignment",
                  score: bfsScore.tone_alignment,
                  weight: "30%",
                },
                {
                  label: "Terminology",
                  score: bfsScore.terminology_match,
                  weight: "20%",
                },
                {
                  label: "Compliance",
                  score: bfsScore.compliance,
                  weight: "20%",
                },
                { label: "CTA Fit", score: bfsScore.cta_fit, weight: "15%" },
                {
                  label: "Platform Fit",
                  score: bfsScore.platform_fit,
                  weight: "15%",
                },
              ].map((component) => (
                <div key={component.label} className="text-center">
                  <div className="relative w-16 h-16 mx-auto mb-2">
                    <svg className="w-16 h-16 transform -rotate-90">
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-gray-300"
                      />
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeDasharray={`${component.score * 176} 176`}
                        className={cn(
                          component.score >= 0.8
                            ? "text-green-600"
                            : "text-yellow-600",
                        )}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold">
                        {(component.score * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <p className="text-xs font-medium">{component.label}</p>
                  <p className="text-xs text-gray-600">{component.weight}</p>
                </div>
              ))}
            </div>

            {/* Status Message */}
            <div
              className={cn(
                "p-3 rounded-lg text-sm font-medium",
                bfsScore.passed
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800",
              )}
            >
              {bfsScore.passed
                ? "✓ Content meets brand fidelity requirements (≥80%)"
                : "✗ Content falls short of brand fidelity requirements"}
            </div>

            {/* Issues */}
            {bfsScore.issues.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Issues Found:</h4>
                <ul className="space-y-1">
                  {bfsScore.issues.map((issue: string, idx: number) => (
                    <li key={idx} className="flex gap-2 text-sm">
                      <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                      <span>{issue}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Regeneration Count */}
            {bfsScore.regeneration_count > 0 && (
              <div className="text-xs text-gray-600">
                Regenerated {bfsScore.regeneration_count} time
                {bfsScore.regeneration_count > 1 ? "s" : ""}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Compliance & Linter Card */}
      {linterResult && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Compliance Check
              </CardTitle>
              {linterResult.passed ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Safety Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-600">Toxicity Score</p>
                <p
                  className={cn(
                    "text-lg font-bold",
                    linterResult.toxicity_score > 0.5
                      ? "text-red-600"
                      : "text-green-600",
                  )}
                >
                  {(linterResult.toxicity_score * 100).toFixed(0)}%
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Profanity Detected</p>
                <p className="text-lg font-bold">
                  {linterResult.profanity_detected ? "⚠️" : "✓"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Needs Human Review</p>
                <p className="text-lg font-bold">
                  {linterResult.needs_human_review ? "✓" : "No"}
                </p>
              </div>
            </div>

            {/* Issues List */}
            <div className="space-y-3">
              {/* Banned Phrases */}
              {linterResult.banned_phrases_found?.length > 0 && (
                <div>
                  <button
                    onClick={() =>
                      setExpandedIssue(
                        expandedIssue === "phrases" ? null : "phrases",
                      )
                    }
                    className="flex items-center gap-2 w-full text-left hover:bg-gray-100 p-2 rounded"
                  >
                    {expandedIssue === "phrases" ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span className="font-medium">
                      Banned phrases detected (
                      {linterResult.banned_phrases_found.length})
                    </span>
                  </button>
                  {expandedIssue === "phrases" && (
                    <ul className="ml-6 space-y-1 mt-2">
                      {linterResult.banned_phrases_found.map(
                        (phrase: string, idx: number) => (
                          <li key={idx} className="text-sm text-red-700">
                            "{phrase}"
                          </li>
                        ),
                      )}
                    </ul>
                  )}
                </div>
              )}

              {/* Banned Claims */}
              {linterResult.banned_claims_found?.length > 0 && (
                <div>
                  <button
                    onClick={() =>
                      setExpandedIssue(
                        expandedIssue === "claims" ? null : "claims",
                      )
                    }
                    className="flex items-center gap-2 w-full text-left hover:bg-gray-100 p-2 rounded"
                  >
                    {expandedIssue === "claims" ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span className="font-medium">
                      Banned claims detected (
                      {linterResult.banned_claims_found.length})
                    </span>
                  </button>
                  {expandedIssue === "claims" && (
                    <ul className="ml-6 space-y-1 mt-2">
                      {linterResult.banned_claims_found.map(
                        (claim: string, idx: number) => (
                          <li key={idx} className="text-sm text-red-700">
                            {claim}
                          </li>
                        ),
                      )}
                    </ul>
                  )}
                </div>
              )}

              {/* Missing Disclaimers */}
              {linterResult.missing_disclaimers?.length > 0 && (
                <div>
                  <button
                    onClick={() =>
                      setExpandedIssue(
                        expandedIssue === "disclaimers" ? null : "disclaimers",
                      )
                    }
                    className="flex items-center gap-2 w-full text-left hover:bg-gray-100 p-2 rounded"
                  >
                    {expandedIssue === "disclaimers" ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <span className="font-medium">
                      Missing disclaimers (
                      {linterResult.missing_disclaimers.length})
                    </span>
                  </button>
                  {expandedIssue === "disclaimers" && (
                    <ul className="ml-6 space-y-1 mt-2">
                      {linterResult.missing_disclaimers.map(
                        (disclaimer: string, idx: number) => (
                          <li key={idx} className="text-sm text-yellow-700">
                            {disclaimer}
                          </li>
                        ),
                      )}
                    </ul>
                  )}
                </div>
              )}

              {/* Platform Violations */}
              {linterResult.platform_violations?.length > 0 && (
                <div>
                  <button
                    onClick={() =>
                      setExpandedIssue(
                        expandedIssue === "platform" ? null : "platform",
                      )
                    }
                    className="flex items-center gap-2 w-full text-left hover:bg-gray-100 p-2 rounded"
                  >
                    {expandedIssue === "platform" ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <span className="font-medium">
                      Platform violations (
                      {linterResult.platform_violations.length})
                    </span>
                  </button>
                  {expandedIssue === "platform" && (
                    <ul className="ml-6 space-y-2 mt-2">
                      {linterResult.platform_violations.map(
                        (violation: { platform?: string; issue?: string; current?: number; limit?: number; suggestion?: string }, idx: number) => (
                          <li key={idx} className="text-sm text-orange-700">
                            <p className="font-medium">
                              {violation.platform}: {violation.issue}
                            </p>
                            <p className="text-xs">
                              Current: {violation.current} | Limit:{" "}
                              {violation.limit}
                            </p>
                            <p className="text-xs italic">
                              {violation.suggestion}
                            </p>
                          </li>
                        ),
                      )}
                    </ul>
                  )}
                </div>
              )}

              {/* Competitor Mentions */}
              {linterResult.competitor_mentions?.length > 0 && (
                <div>
                  <button
                    onClick={() =>
                      setExpandedIssue(
                        expandedIssue === "competitors" ? null : "competitors",
                      )
                    }
                    className="flex items-center gap-2 w-full text-left hover:bg-gray-100 p-2 rounded"
                  >
                    {expandedIssue === "competitors" ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">
                      Competitor mentions (
                      {linterResult.competitor_mentions.length})
                    </span>
                  </button>
                  {expandedIssue === "competitors" && (
                    <ul className="ml-6 space-y-1 mt-2">
                      {linterResult.competitor_mentions.map(
                        (mention: string, idx: number) => (
                          <li key={idx} className="text-sm text-blue-700">
                            "{mention}"
                          </li>
                        ),
                      )}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* Fixes Applied */}
            {linterResult.fixes_applied?.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm font-medium text-green-900 mb-2">
                  Auto-fixes applied:
                </p>
                <ul className="space-y-1">
                  {linterResult.fixes_applied.map(
                    (fix: string, idx: number) => (
                      <li key={idx} className="text-sm text-green-800">
                        ✓ {fix}
                      </li>
                    ),
                  )}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 sticky bottom-0 bg-white p-4 rounded-lg border">
        <Button
          onClick={onApprove}
          disabled={isLoading || !bfsScore?.passed}
          className="flex-1"
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          {isLoading ? "Processing..." : "Approve & Publish"}
        </Button>
        <Button
          onClick={onEdit}
          variant="outline"
          disabled={isLoading}
          className="flex-1"
        >
          <Edit2 className="h-4 w-4 mr-2" />
          Edit Draft
        </Button>
        <Button
          onClick={onRegenerate}
          variant="outline"
          disabled={isLoading}
          className="flex-1"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Regenerate
        </Button>
      </div>
    </div>
  );
}
