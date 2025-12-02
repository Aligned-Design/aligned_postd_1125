/**
 * DocAiPanel
 * 
 * UI component for generating text content with The Copywriter.
 */

import { useState } from "react";
import { FileText, Loader2, AlertTriangle, CheckCircle2, Copy, Edit, RefreshCw } from "lucide-react";
import { cn } from "@/lib/design-system";
import { useDocAgent } from "./hooks/useDocAgent";
import { useCurrentBrand } from "@/hooks/useCurrentBrand";
import { useBrandGuide } from "@/hooks/useBrandGuide";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { logError } from "@/lib/logger";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AiDocGenerationRequest, AiDocVariant } from "@/lib/types/aiContent";

interface DocAiPanelProps {
  onUseVariant?: (variant: AiDocVariant) => void;
  onEditVariant?: (variant: AiDocVariant) => void;
}

export function DocAiPanel({ onUseVariant, onEditVariant }: DocAiPanelProps) {
  const { brandId: contextBrandId, brand: currentBrand } = useCurrentBrand();
  const { currentWorkspace } = useWorkspace();
  const { hasBrandGuide, isLoading: brandGuideLoading } = useBrandGuide();
  const { toast } = useToast();
  
  // Auto-detect brand from workspace if no explicit brand exists
  // Workspace only exists if there's a brand, so use workspace-level brand
  const brandId = contextBrandId || (currentWorkspace?.id ? `workspace-${currentWorkspace.id}` : null);
  
  const { variants, isLoading, isError, error, generate, reset } = useDocAgent();

  const [formData, setFormData] = useState<Partial<AiDocGenerationRequest>>({
    topic: "",
    platform: "instagram",
    contentType: "caption",
    tone: "",
    length: "medium",
    callToAction: "",
    additionalContext: "",
  });

  const handleGenerate = async () => {
    // Brand is auto-detected from workspace - no need to validate or block
    // If no brandId exists, use workspace default
    const effectiveBrandId = brandId || (currentWorkspace?.id ? `workspace-${currentWorkspace.id}` : "workspace-default");

    // Validate required fields
    if (!formData.topic || !formData.platform || !formData.contentType) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields (Topic, Platform, Content Type).",
        variant: "destructive",
      });
      return;
    }

    try {
      await generate({
        brandId: effectiveBrandId,
        topic: formData.topic,
        platform: formData.platform,
        contentType: formData.contentType,
        tone: formData.tone,
        length: formData.length,
        callToAction: formData.callToAction,
        additionalContext: formData.additionalContext,
      });
    } catch (err) {
      // Error is already handled by the hook, but we can add additional logging
      logError("[Copywriter] Generation error", err instanceof Error ? err : new Error(String(err)), { brandId: effectiveBrandId, topic: formData.topic });
    }
  };

  const handleUseVariant = (variant: AiDocVariant) => {
    onUseVariant?.(variant);
  };

  const handleEditVariant = (variant: AiDocVariant) => {
    onEditVariant?.(variant);
  };

  const handleCopyVariant = (variant: AiDocVariant) => {
    navigator.clipboard.writeText(variant.content);
  };

  // Show brand guide missing state
  if (!brandGuideLoading && !hasBrandGuide && brandId) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            The Copywriter
          </CardTitle>
        </CardHeader>
        <CardContent>
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
    );
  }

  // Brand is auto-detected from workspace - no blocking UI needed

  return (
    <div className="space-y-6">
      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Generate Copy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleGenerate();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleGenerate();
              }
            }}
          >
          {/* Essential Fields Only */}
          <div className="space-y-2">
            <label htmlFor="doc-topic" className="text-sm font-semibold">
              What do you want to create? <span className="text-red-500">*</span>
            </label>
            <Input
              id="doc-topic"
              placeholder="e.g., Summer Sale Launch, Product Announcement, Weekly Newsletter"
              value={formData.topic}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              aria-label="Topic or campaign name"
              className="text-base"
            />
            <p className="text-xs text-slate-500">
              Describe your content idea in a few words
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="doc-platform" className="text-sm font-semibold">Platform</label>
              <Select
                value={formData.platform}
                onValueChange={(value) => setFormData({ ...formData, platform: value })}
              >
                <SelectTrigger id="doc-platform" aria-label="Platform">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="twitter">Twitter</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="blog">Blog</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label htmlFor="doc-content-type" className="text-sm font-semibold">Content Type</label>
              <Select
                value={formData.contentType}
                onValueChange={(value: any) => setFormData({ ...formData, contentType: value })}
              >
                <SelectTrigger id="doc-content-type" aria-label="Content Type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="caption">Caption</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="blog">Blog Post</SelectItem>
                  <SelectItem value="ad">Ad Copy</SelectItem>
                  <SelectItem value="script">Script</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Optional Context - Collapsed by default */}
          <details className="space-y-2">
            <summary className="text-sm font-medium text-slate-600 cursor-pointer hover:text-slate-900">
              Additional details (optional)
            </summary>
            <div className="mt-3 space-y-3 pt-3 border-t border-slate-200">
              <div className="space-y-2">
                <label htmlFor="doc-length" className="text-sm font-medium text-slate-600">Length</label>
                <Select
                  value={formData.length}
                  onValueChange={(value: any) => setFormData({ ...formData, length: value })}
                >
                  <SelectTrigger id="doc-length" aria-label="Length">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">Short</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="long">Long</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label htmlFor="doc-cta" className="text-sm font-medium text-slate-600">Call-to-Action</label>
                <Input
                  id="doc-cta"
                  placeholder="e.g., Shop Now, Learn More"
                  value={formData.callToAction}
                  onChange={(e) => setFormData({ ...formData, callToAction: e.target.value })}
                  aria-label="Call to action"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="doc-context" className="text-sm font-medium text-slate-600">Additional Context</label>
                <Textarea
                  id="doc-context"
                  placeholder="Any specific tone, style, or requirements..."
                  value={formData.additionalContext}
                  onChange={(e) => setFormData({ ...formData, additionalContext: e.target.value })}
                  rows={2}
                  aria-label="Additional context"
                />
              </div>
            </div>
          </details>

          <Button
            type="submit"
            disabled={isLoading || !formData.topic}
            className="w-full font-semibold"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Generate Copy
              </>
            )}
          </Button>
          </form>
        </CardContent>
      </Card>

      {/* Error State */}
      {isError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-5 h-5" />
              <p className="text-sm">
                {error?.message || "Failed to generate content. Please try again."}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerate}
              className="mt-4"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Variants */}
      {variants.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Generated Options</h3>
          {variants.map((variant) => {
            const bfsPercentage = Math.round(variant.brandFidelityScore * 100);
            const isLowBFS = variant.brandFidelityScore < 0.8;

            return (
              <Card
                key={variant.id}
                className={cn(
                  "relative",
                  isLowBFS && "border-amber-300 bg-amber-50/30"
                )}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{variant.label}</CardTitle>
                      {variant.wordCount && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {variant.wordCount} words
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={isLowBFS ? "warning" : "success"}
                        className="text-xs"
                        title={`Brand Fidelity Score: ${bfsPercentage}% (how well this matches your brand)`}
                      >
                        {bfsPercentage}% match
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Low BFS Warning */}
                  {isLowBFS && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-100 border border-amber-300">
                      <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-amber-900 mb-1">
                          Brand Fidelity Warning
                        </p>
                        <p className="text-xs text-amber-700">
                          This content may not fully match your brand guidelines. Review before publishing.
                        </p>
                        {variant.complianceTags && variant.complianceTags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {variant.complianceTags.map((tag, idx) => (
                              <Badge key={idx} variant="warning" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Content Preview */}
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <p className="text-sm whitespace-pre-wrap">{variant.content}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleUseVariant(variant)}
                      className="flex-1"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Use This
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditVariant(variant)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopyVariant(variant)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

