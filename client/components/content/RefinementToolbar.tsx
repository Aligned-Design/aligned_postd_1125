/**
 * RefinementToolbar Component
 *
 * Quick-action buttons to refine captions:
 * - Shorten / Expand
 * - More Fun / More Professional
 * - Add Emojis / Remove Emojis
 */

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Minus,
  Plus,
  Smile,
  SmilePlus,
  Sparkles,
  Briefcase,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/design-system";

// ============================================================================
// TYPES
// ============================================================================

type RefinementType =
  | "shorten"
  | "expand"
  | "more_fun"
  | "more_professional"
  | "add_emojis"
  | "remove_emojis";

interface RefinementToolbarProps {
  brandId: string;
  platform: "facebook" | "instagram_feed" | "instagram_reel";
  caption: string;
  hashtags?: string[];
  onRefinementComplete: (newCaption: string) => void;
  disabled?: boolean;
  className?: string;
}

interface RefineResponse {
  success: boolean;
  refined_caption: string;
  refinement_type: RefinementType;
  original_length: number;
  refined_length: number;
}

// ============================================================================
// API FUNCTION
// ============================================================================

async function refineCaption(params: {
  brand_id: string;
  caption: string;
  platform: "facebook" | "instagram_feed" | "instagram_reel";
  refinement_type: RefinementType;
  hashtags?: string[];
}): Promise<RefineResponse> {
  const response = await fetch("/api/agents/refine-caption", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: "Unknown error" } }));
    throw new Error(error.error?.message || `Refinement failed: ${response.status}`);
  }

  return response.json();
}

// ============================================================================
// COMPONENT
// ============================================================================

export function RefinementToolbar({
  brandId,
  platform,
  caption,
  hashtags,
  onRefinementComplete,
  disabled = false,
  className,
}: RefinementToolbarProps) {
  const { toast } = useToast();
  const [activeRefinement, setActiveRefinement] = useState<RefinementType | null>(null);

  const refineMutation = useMutation({
    mutationFn: refineCaption,
    onSuccess: (data) => {
      onRefinementComplete(data.refined_caption);
      const lengthChange = data.refined_length - data.original_length;
      const changeText = lengthChange > 0 
        ? `+${lengthChange} chars` 
        : `${lengthChange} chars`;
      
      toast({
        title: "Caption Refined",
        description: `${getRefinementLabel(data.refinement_type)} complete (${changeText})`,
      });
      setActiveRefinement(null);
    },
    onError: (error) => {
      // ✅ Handle "no AI provider" error with a user-friendly message
      const errorMessage = error instanceof Error ? error.message : "Please try again.";
      const isNoAIProvider = errorMessage.includes("AI content generation is unavailable") || 
                             errorMessage.includes("NO_AI_PROVIDER_CONFIGURED");
      
      toast({
        title: isNoAIProvider ? "AI Not Configured" : "Refinement Failed",
        description: isNoAIProvider 
          ? "AI features require API keys. Contact your administrator."
          : errorMessage,
        variant: "destructive",
      });
      setActiveRefinement(null);
    },
  });

  const handleRefine = (type: RefinementType) => {
    if (!caption.trim()) {
      toast({
        title: "No Caption",
        description: "Add a caption before refining.",
        variant: "destructive",
      });
      return;
    }

    setActiveRefinement(type);
    refineMutation.mutate({
      brand_id: brandId,
      caption,
      platform,
      refinement_type: type,
      hashtags,
    });
  };

  const getRefinementLabel = (type: RefinementType): string => {
    const labels: Record<RefinementType, string> = {
      shorten: "Shortened",
      expand: "Expanded",
      more_fun: "Made More Fun",
      more_professional: "Made More Professional",
      add_emojis: "Added Emojis",
      remove_emojis: "Removed Emojis",
    };
    return labels[type];
  };

  const isLoading = refineMutation.isPending;
  const isCaptionEmpty = !caption.trim();
  const isDisabled = disabled || isLoading || isCaptionEmpty;

  // Check if caption has emojis
  const hasEmojis = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(caption);

  const refinementButtons = [
    {
      type: "shorten" as RefinementType,
      label: "Shorten",
      icon: Minus,
      tooltip: "Make caption shorter and punchier",
    },
    {
      type: "expand" as RefinementType,
      label: "Expand",
      icon: Plus,
      tooltip: "Add more detail and context",
    },
    {
      type: "more_fun" as RefinementType,
      label: "More Fun",
      icon: SmilePlus,
      tooltip: "Add playfulness and personality",
    },
    {
      type: "more_professional" as RefinementType,
      label: "More Pro",
      icon: Briefcase,
      tooltip: "Make more polished and professional",
    },
    {
      type: hasEmojis ? "remove_emojis" as RefinementType : "add_emojis" as RefinementType,
      label: hasEmojis ? "Remove 😀" : "Add 😀",
      icon: hasEmojis ? Smile : SmilePlus,
      tooltip: hasEmojis ? "Strip all emojis" : "Add relevant emojis",
    },
  ];

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      <span className="text-xs text-slate-400 flex items-center mr-1">
        <Sparkles className="w-3 h-3 mr-1" />
        Refine:
      </span>
      {/* Show inline helper when caption is empty */}
      {isCaptionEmpty ? (
        <span className="text-xs text-slate-400 italic">
          Add a caption before using refine tools.
        </span>
      ) : (
        refinementButtons.map(({ type, label, icon: Icon, tooltip }) => (
          <Button
            key={type}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleRefine(type)}
            disabled={isDisabled}
            title={tooltip}
            className={cn(
              "h-7 px-2 text-xs font-medium transition-all",
              "border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700",
              activeRefinement === type && "border-indigo-400 bg-indigo-100 text-indigo-700"
            )}
          >
            {isLoading && activeRefinement === type ? (
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            ) : (
              <Icon className="w-3 h-3 mr-1" />
            )}
            {label}
          </Button>
        ))
      )}
    </div>
  );
}

