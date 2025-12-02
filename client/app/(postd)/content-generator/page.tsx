import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentBrand } from "@/hooks/useCurrentBrand";
import { useBrandGuide } from "@/hooks/useBrandGuide";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { logTelemetry, logError } from "@/lib/logger";
import { PageShell } from "@/components/postd/ui/layout/PageShell";
import { PageHeader } from "@/components/postd/ui/layout/PageHeader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Wand2,
  Loader2,
  AlertCircle,
  CheckCircle,
  Sparkles,
} from "lucide-react";
import { GenerationResult } from "@/components/generation/GenerationResult";
import type { BrandFidelityScore, LinterResult } from "@/types/agent-config";

interface GenerationState {
  topic: string;
  tone: string;
  platform: string;
  format: string;
  maxLength?: number;
  includeCTA: boolean;
  ctaType?: string;
}

interface ResultState {
  content: string;
  bfsScore?: BrandFidelityScore;
  linterResult?: LinterResult;
  timestamp: string;
}

const DEFAULT_STATE: GenerationState = {
  topic: "",
  tone: "professional",
  platform: "instagram",
  format: "post",
  maxLength: 280,
  includeCTA: true,
  ctaType: "comment",
};

export default function ContentGenerator() {
  const { brandId: contextBrandId } = useCurrentBrand();
  const { currentWorkspace } = useWorkspace();
  const { hasBrandGuide, isLoading: brandGuideLoading } = useBrandGuide();
  const { toast } = useToast();
  
  // Auto-detect brand from workspace if no explicit brand exists
  const brandId = contextBrandId || (currentWorkspace?.id ? `workspace-${currentWorkspace.id}` : null);
  
  const [formState, setFormState] = useState<GenerationState>(DEFAULT_STATE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResultState | null>(null);
  const [_regenerationCount, setRegenerationCount] = useState(0);

  const handleGenerate = async () => {
    if (!formState.topic.trim()) {
      setError("Please enter a topic");
      return;
    }

    // Use workspace-level brand if no explicit brand
    const effectiveBrandId = brandId || (currentWorkspace?.id ? `workspace-${currentWorkspace.id}` : "workspace-default");

    try {
      setLoading(true);
      setError(null);

      // ✅ FIX: Include brandId in API request (required by backend)
      // ✅ FIX: Map format to contentType (backend expects contentType, not format)
      const response = await fetch("/api/agents/generate/doc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId: effectiveBrandId, // ✅ CRITICAL: Backend requires brandId
          topic: formState.topic,
          tone: formState.tone || undefined, // Only send if provided
          platform: formState.platform,
          contentType: formState.format === "post" ? "caption" : formState.format, // Map format to contentType
          length: formState.maxLength ? (formState.maxLength < 150 ? "short" : formState.maxLength < 500 ? "medium" : "long") : undefined,
          callToAction: formState.includeCTA ? formState.ctaType : undefined,
          additionalContext: undefined, // Not in form, but can be added later
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate content");
      }

      const data = await response.json();
      
      // ✅ FIX: Handle new API response format with variants
      // The new API returns variants array, not single content
      if (data.variants && Array.isArray(data.variants) && data.variants.length > 0) {
        // Use first variant for backward compatibility
        const firstVariant = data.variants[0];
        // Construct proper BrandFidelityScore if we have a score number
        const bfsScore: BrandFidelityScore | undefined = firstVariant.brandFidelityScore !== undefined ? {
          overall: firstVariant.brandFidelityScore,
          tone_alignment: 0,
          terminology_match: 0,
          compliance: 0,
          cta_fit: 0,
          platform_fit: 0,
          passed: firstVariant.brandFidelityScore >= 0.8,
          issues: [],
          regeneration_count: 0,
        } : undefined;
        // Construct proper LinterResult from complianceTags
        const linterResult: LinterResult | undefined = firstVariant.complianceTags ? {
          passed: firstVariant.complianceTags.length === 0,
          profanity_detected: false,
          toxicity_score: 0,
          banned_phrases_found: firstVariant.complianceTags,
          banned_claims_found: [],
          missing_disclaimers: [],
          missing_hashtags: [],
          platform_violations: [],
          pii_detected: [],
          competitor_mentions: [],
          fixes_applied: [],
          blocked: false,
          needs_human_review: firstVariant.complianceTags.length > 0,
        } : undefined;
        setResult({
          content: firstVariant.content,
          bfsScore,
          linterResult,
          timestamp: new Date().toISOString(),
        });
      } else if (data.content) {
        // Fallback to old format
        setResult({
          content: data.content,
          bfsScore: data.bfs_score,
          linterResult: data.linter_result,
          timestamp: new Date().toISOString(),
        });
      } else {
        throw new Error("Invalid response format from API");
      }
      
      logTelemetry("Content generated successfully", { brandId: effectiveBrandId, platform: formState.platform, contentType: formState.format });
      setRegenerationCount(0);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Generation failed";
      setError(errorMessage);
      logError("Content generation failed", err instanceof Error ? err : new Error(errorMessage), { brandId: effectiveBrandId, topic: formState.topic });
      
      // Show toast for user feedback
      toast({
        title: "Generation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    setRegenerationCount((prev) => prev + 1);
    await handleGenerate();
  };

  const handleApprove = async () => {
    if (!result) return;

    try {
      setLoading(true);
      const response = await fetch("/api/agents/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: result.content,
          platform: formState.platform,
          bfs_score: result.bfsScore?.overall,
        }),
      });

      if (response.ok) {
        setError(null);
        // Show success message and clear form
        setTimeout(() => {
          setResult(null);
          setFormState(DEFAULT_STATE);
        }, 1500);
      } else {
        setError("Failed to approve content");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approval failed");
    } finally {
      setLoading(false);
    }
  };

  // Show brand guide missing state
  if (!brandGuideLoading && !hasBrandGuide && brandId) {
    return (
      <PageShell>
        <PageHeader
          title="AI Content Generator"
          subtitle="Generate on-brand content with AI and guaranteed compliance"
        />
        <Card className="w-full max-w-2xl mx-auto">
          <CardContent className="pt-6">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-amber-900 mb-1">
                    Brand Guide Required
                  </h3>
                  <p className="text-sm text-amber-800 mb-3">
                    This brand doesn't have a Brand Guide yet. Create one to unlock AI content generation.
                  </p>
                  <Link
                    to={`/brand-guide?brandId=${brandId}`}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors"
                  >
                    Create Brand Guide
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="AI Content Generator"
        subtitle="Generate on-brand content with AI and guaranteed compliance"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Generation Form */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Content Parameters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Topic */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Topic or Idea
                </label>
                <Textarea
                  placeholder="What would you like to create content about?"
                  value={formState.topic}
                  onChange={(e) =>
                    setFormState({ ...formState, topic: e.target.value })
                  }
                  rows={3}
                />
              </div>

              {/* Platform */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Platform
                </label>
                <Select
                  value={formState.platform}
                  onValueChange={(value) =>
                    setFormState({ ...formState, platform: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="twitter">Twitter/X</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Format */}
              <div>
                <label className="block text-sm font-medium mb-1">Format</label>
                <Select
                  value={formState.format}
                  onValueChange={(value) =>
                    setFormState({ ...formState, format: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="post">Post</SelectItem>
                    <SelectItem value="carousel">Carousel</SelectItem>
                    <SelectItem value="reel">Reel</SelectItem>
                    <SelectItem value="story">Story</SelectItem>
                    <SelectItem value="image">Image Caption</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tone */}
              <div>
                <label className="block text-sm font-medium mb-1">Tone</label>
                <Select
                  value={formState.tone}
                  onValueChange={(value) =>
                    setFormState({ ...formState, tone: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="authoritative">Authoritative</SelectItem>
                    <SelectItem value="playful">Playful</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Max Length */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Max Characters
                </label>
                <Input
                  type="number"
                  value={formState.maxLength}
                  onChange={(e) =>
                    setFormState({
                      ...formState,
                      maxLength: parseInt(e.target.value),
                    })
                  }
                  min={50}
                  max={5000}
                />
              </div>

              {/* CTA Options */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="includeCTA"
                    checked={formState.includeCTA}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        includeCTA: e.target.checked,
                      })
                    }
                    className="rounded"
                  />
                  <label htmlFor="includeCTA" className="text-sm font-medium">
                    Include Call-to-Action
                  </label>
                </div>

                {formState.includeCTA && (
                  <Select
                    value={formState.ctaType}
                    onValueChange={(value) =>
                      setFormState({ ...formState, ctaType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="link">Link Click</SelectItem>
                      <SelectItem value="comment">Comment</SelectItem>
                      <SelectItem value="dm">Direct Message</SelectItem>
                      <SelectItem value="bio">Bio Link</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Generate Content
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Results Area */}
        <div className="lg:col-span-2">
          {!result ? (
            <Card className="h-full min-h-96">
              <CardContent className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Sparkles className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">
                    Generate content to see results with BFS scoring and
                    compliance checks
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <GenerationResult
              content={result.content}
              platform={formState.platform}
              bfsScore={result.bfsScore}
              linterResult={result.linterResult}
              onApprove={handleApprove}
              onRegenerate={handleRegenerate}
              onEdit={() => {
                // In a full implementation, this would open an editor modal
                logTelemetry("Edit draft requested", { contentLength: result.content.length });
              }}
              isLoading={loading}
            />
          )}
        </div>
      </div>
    </PageShell>
  );
}
