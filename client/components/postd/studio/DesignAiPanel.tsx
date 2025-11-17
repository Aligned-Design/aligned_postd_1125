/**
 * DesignAiPanel
 * 
 * UI component for generating visual concepts with The Creative.
 */

import { useState } from "react";
import { Palette, Loader2, AlertTriangle, CheckCircle2, Copy, RefreshCw } from "lucide-react";
import { cn } from "@/lib/design-system";
import { useDesignAgent } from "./hooks/useDesignAgent";
import { useCurrentBrand } from "@/hooks/useCurrentBrand";
import { useBrandGuide } from "@/hooks/useBrandGuide";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AiDesignGenerationRequest, AiDesignVariant } from "@/lib/types/aiContent";

interface DesignAiPanelProps {
  onUseVariant?: (variant: AiDesignVariant) => void;
}

export function DesignAiPanel({ onUseVariant }: DesignAiPanelProps) {
  const { brandId: contextBrandId, brand: currentBrand } = useCurrentBrand();
  const { currentWorkspace } = useWorkspace();
  const { hasBrandGuide, isLoading: brandGuideLoading } = useBrandGuide();
  const { toast } = useToast();
  
  // Auto-detect brand from workspace if no explicit brand exists
  // Workspace only exists if there's a brand, so use workspace-level brand
  const brandId = contextBrandId || (currentWorkspace?.id ? `workspace-${currentWorkspace.id}` : null);
  
  const { variants, isLoading, isError, error, generate, reset } = useDesignAgent();

  const [formData, setFormData] = useState<Partial<AiDesignGenerationRequest>>({
    campaignName: "",
    platform: "instagram",
    format: "feed",
    tone: "",
    visualStyle: "",
    additionalContext: "",
  });

  const handleGenerate = async () => {
    // Brand is auto-detected from workspace - no need to validate or block
    // If no brandId exists, use workspace default
    const effectiveBrandId = brandId || (currentWorkspace?.id ? `workspace-${currentWorkspace.id}` : "workspace-default");

    // Validation: Check required fields
    if (!formData.campaignName?.trim()) {
      toast({
        title: "Campaign Name Required",
        description: "Please enter a visual concept description.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.platform || formData.platform.trim() === "") {
      toast({
        title: "Platform Required",
        description: "Please select a platform.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.format) {
      toast({
        title: "Format Required",
        description: "Please select a format.",
        variant: "destructive",
      });
      return;
    }

    // Ensure format matches backend enum
    const validFormats = ["story", "feed", "reel", "short", "ad", "other"] as const;
    if (!validFormats.includes(formData.format as any)) {
      toast({
        title: "Invalid Format",
        description: "Please select a valid format.",
        variant: "destructive",
      });
      return;
    }

    // Normalize platform value (ensure lowercase, no spaces)
    const normalizedPlatform = formData.platform.toLowerCase().trim();

    try {
      // Build request payload matching backend contract exactly
      // Backend expects: brandId (required UUID), platform (required), format (required enum),
      // campaignName (optional), tone (optional), visualStyle (optional), additionalContext (optional)
      const payload: AiDesignGenerationRequest = {
        brandId: effectiveBrandId,
        platform: normalizedPlatform,
        format: formData.format as "story" | "feed" | "reel" | "short" | "ad" | "other",
      };

      // Add optional fields only if they have non-empty values (to avoid sending empty strings)
      const trimmedCampaignName = formData.campaignName?.trim();
      if (trimmedCampaignName) {
        payload.campaignName = trimmedCampaignName;
      }

      const trimmedTone = formData.tone?.trim();
      if (trimmedTone) {
        payload.tone = trimmedTone;
      }

      const trimmedVisualStyle = formData.visualStyle?.trim();
      if (trimmedVisualStyle) {
        payload.visualStyle = trimmedVisualStyle;
      }

      const trimmedAdditionalContext = formData.additionalContext?.trim();
      if (trimmedAdditionalContext) {
        payload.additionalContext = trimmedAdditionalContext;
      }

      await generate(payload);
    } catch (err: any) {
      // Handle specific error codes
      if (err?.code === "NO_BRAND_GUIDE") {
        toast({
          title: "Brand Guide Required",
          description: err.message || "This brand doesn't have a Brand Guide yet. Create one to unlock AI content generation.",
          variant: "destructive",
        });
      } else if (err?.code === "INVALID_BRAND") {
        toast({
          title: "Invalid Brand",
          description: err.message || "Please select a valid brand.",
          variant: "destructive",
        });
      } else {
        // Generic error - hook will show toast
        console.error("Design generation error:", err);
        if (err instanceof Error && !err.message.includes("HTTP")) {
          toast({
            title: "Generation Failed",
            description: err.message || "Failed to generate concepts. Please try again.",
            variant: "destructive",
          });
        }
      }
    }
  };

  const handleUseVariant = (variant: AiDesignVariant) => {
    onUseVariant?.(variant);
  };

  const handleCopyPrompt = (variant: AiDesignVariant) => {
    navigator.clipboard.writeText(variant.prompt);
  };

  // Show brand guide missing state
  if (!brandGuideLoading && !hasBrandGuide && brandId) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            The Creative
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
            <Palette className="w-5 h-5" />
            Generate Visual Concepts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Essential Fields Only */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">
              What visual concept do you need? <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="e.g., Fall Promotion, Product Launch, Event Announcement"
              value={formData.campaignName}
              onChange={(e) => setFormData({ ...formData, campaignName: e.target.value })}
              className="text-base"
            />
            <p className="text-xs text-slate-500">
              Describe the visual concept you want to create
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Platform</label>
              <Select
                value={formData.platform}
                onValueChange={(value) => setFormData({ ...formData, platform: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="twitter">Twitter</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Format</label>
              <Select
                value={formData.format}
                onValueChange={(value: any) => setFormData({ ...formData, format: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="story">Story</SelectItem>
                  <SelectItem value="feed">Feed Post</SelectItem>
                  <SelectItem value="reel">Reel</SelectItem>
                  <SelectItem value="short">Short Video</SelectItem>
                  <SelectItem value="ad">Ad</SelectItem>
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
                <label className="text-sm font-medium text-slate-600">Visual Style</label>
                <Input
                  placeholder="e.g., minimal, bold, playful"
                  value={formData.visualStyle}
                  onChange={(e) => setFormData({ ...formData, visualStyle: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">Additional Context</label>
                <Textarea
                  placeholder="e.g., launching a fall promo for memberships, warm and cozy mood..."
                  value={formData.additionalContext}
                  onChange={(e) => setFormData({ ...formData, additionalContext: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
          </details>

          <Button
            onClick={handleGenerate}
            disabled={isLoading || !formData.campaignName}
            className="w-full font-semibold"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Concepts...
              </>
            ) : (
              <>
                <Palette className="w-4 h-4 mr-2" />
                Generate Concepts
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Error State */}
      {isError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-2 text-red-700">
              <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold mb-1">Failed to Generate Concepts</p>
                <p className="text-sm">
                  {error?.message || "An unexpected error occurred. Please try again."}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerate}
              className="mt-4"
              disabled={isLoading}
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
          <h3 className="text-lg font-semibold">Generated Concepts</h3>
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
                      {variant.useCase && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {variant.useCase}
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
                          This concept may not fully match your brand guidelines. Review before using.
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

                  {/* Description */}
                  {variant.description && (
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <p className="text-sm text-gray-700">{variant.description}</p>
                    </div>
                  )}

                  {/* Prompt */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Image Prompt</label>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopyPrompt(variant)}
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Copy
                      </Button>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg border font-mono text-xs">
                      <p className="whitespace-pre-wrap">{variant.prompt}</p>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {variant.aspectRatio && (
                      <Badge variant="secondary" className="text-xs">
                        {variant.aspectRatio}
                      </Badge>
                    )}
                    {variant.useCase && (
                      <Badge variant="secondary" className="text-xs">
                        {variant.useCase}
                      </Badge>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleUseVariant(variant)}
                      className="flex-1"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Use Prompt
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

