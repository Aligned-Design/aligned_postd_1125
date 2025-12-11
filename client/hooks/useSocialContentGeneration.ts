/**
 * useSocialContentGeneration Hook
 *
 * Manages social content generation for Facebook and Instagram slots.
 * Handles:
 * - Generating content via POST /api/agents/generate/social
 * - Fetching existing drafts via GET /api/agents/drafts/slot/:slotId
 * - Updating drafts via PATCH /api/agents/drafts/:draftId
 */

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { SocialContentPackage, SupportedPlatform } from "@shared/social-content";

// ============================================================================
// TYPES
// ============================================================================

export interface ContentDraft {
  id: string;
  slot_id: string;
  brand_id: string;
  platform: SupportedPlatform;
  content: SocialContentPackage;
  status: "draft" | "edited" | "approved" | "rejected";
  created_at: string;
  updated_at: string;
}

export interface GenerateSocialResponse {
  success: boolean;
  draft_id?: string;
  content?: SocialContentPackage;
  error?: string;
}

export interface FetchDraftResponse {
  success: boolean;
  draft: ContentDraft | null;
}

export interface UpdateDraftResponse {
  success: boolean;
  draft_id: string;
  status: string;
  updated_at: string;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

async function generateSocialContent(
  brandId: string,
  slotId: string
): Promise<GenerateSocialResponse> {
  const response = await fetch("/api/agents/generate/social", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      brand_id: brandId,
      slot_id: slotId,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: "Unknown error" } }));
    throw new Error(error.error?.message || error.error?.userMessage || `Generation failed: ${response.status}`);
  }

  return response.json();
}

async function fetchDraftForSlot(slotId: string): Promise<FetchDraftResponse> {
  const response = await fetch(`/api/agents/drafts/slot/${slotId}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: "Unknown error" } }));
    throw new Error(error.error?.message || `Failed to fetch draft: ${response.status}`);
  }

  return response.json();
}

async function updateDraft(
  draftId: string,
  updates: Partial<{
    primary_text: string;
    headline: string;
    suggested_hashtags: string[];
    cta_text: string;
    design_brief: string;
    status: "draft" | "edited" | "approved" | "rejected";
  }>
): Promise<UpdateDraftResponse> {
  const response = await fetch(`/api/agents/drafts/${draftId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: "Unknown error" } }));
    throw new Error(error.error?.message || `Failed to update draft: ${response.status}`);
  }

  return response.json();
}

// ============================================================================
// PLATFORM HELPERS
// ============================================================================

/**
 * Check if a platform is supported for social content generation
 */
export function isSupportedPlatform(platform: string): boolean {
  const supported = ["facebook", "instagram", "instagram_feed", "instagram_reel"];
  return supported.includes(platform.toLowerCase());
}

/**
 * Get platform display name and icon info
 */
export function getPlatformDisplay(platform: string): { label: string; shortLabel: string } {
  const normalized = platform.toLowerCase();
  switch (normalized) {
    case "facebook":
      return { label: "Facebook", shortLabel: "FB" };
    case "instagram":
    case "instagram_feed":
      return { label: "Instagram Feed", shortLabel: "IG" };
    case "instagram_reel":
      return { label: "Instagram Reels", shortLabel: "Reels" };
    default:
      return { label: platform, shortLabel: platform.substring(0, 2).toUpperCase() };
  }
}

// ============================================================================
// MAIN HOOK
// ============================================================================

interface UseSocialContentGenerationOptions {
  slotId: string;
  brandId: string;
  platform: string;
  enabled?: boolean;
}

export function useSocialContentGeneration({
  slotId,
  brandId,
  platform,
  enabled = true,
}: UseSocialContentGenerationOptions) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  // Check if this platform is supported
  const isSupported = isSupportedPlatform(platform);

  // Fetch existing draft for this slot
  const {
    data: draftData,
    isLoading: isDraftLoading,
    refetch: refetchDraft,
  } = useQuery({
    queryKey: ["socialDraft", slotId],
    queryFn: () => fetchDraftForSlot(slotId),
    enabled: enabled && isSupported && !!slotId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const draft = draftData?.draft ?? null;

  // Generate mutation
  const generateMutation = useMutation({
    mutationFn: () => generateSocialContent(brandId, slotId),
    onMutate: () => {
      setIsGenerating(true);
    },
    onSuccess: (data) => {
      setIsGenerating(false);
      if (data.success && data.content) {
        toast({
          title: "Content Generated",
          description: "Your on-brand social content is ready for review.",
        });
        // Invalidate the draft query to refetch
        queryClient.invalidateQueries({ queryKey: ["socialDraft", slotId] });
      } else {
        toast({
          title: "Generation Issue",
          description: data.error || "Content was generated but may have issues.",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      setIsGenerating(false);
      
      // ✅ Handle "no AI provider" error with a user-friendly message
      const errorMessage = error instanceof Error ? error.message : "Failed to generate content. Please try again.";
      const isNoAIProvider = errorMessage.includes("AI content generation is unavailable") ||
                             errorMessage.includes("NO_AI_PROVIDER_CONFIGURED");
      
      toast({
        title: isNoAIProvider ? "AI Not Configured" : "Generation Failed",
        description: isNoAIProvider 
          ? "AI features require API keys. Contact your administrator."
          : errorMessage,
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({
      draftId,
      updates,
    }: {
      draftId: string;
      updates: Partial<{
        primary_text: string;
        headline: string;
        suggested_hashtags: string[];
        cta_text: string;
        design_brief: string;
        status: "draft" | "edited" | "approved" | "rejected";
      }>;
    }) => updateDraft(draftId, updates),
    onSuccess: () => {
      toast({
        title: "Draft Saved",
        description: "Your changes have been saved.",
      });
      // Invalidate the draft query to refetch
      queryClient.invalidateQueries({ queryKey: ["socialDraft", slotId] });
    },
    onError: (error) => {
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save changes. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handler functions
  const generate = useCallback(() => {
    if (!isSupported) {
      toast({
        title: "Unsupported Platform",
        description: "Social content generation is only available for Facebook and Instagram.",
        variant: "destructive",
      });
      return;
    }
    generateMutation.mutate();
  }, [isSupported, generateMutation, toast]);

  const saveDraft = useCallback(
    (updates: Partial<{
      primary_text: string;
      headline: string;
      suggested_hashtags: string[];
      cta_text: string;
      design_brief: string;
      status: "draft" | "edited" | "approved" | "rejected";
    }>) => {
      if (!draft?.id) {
        toast({
          title: "No Draft",
          description: "No draft to save. Generate content first.",
          variant: "destructive",
        });
        return;
      }
      updateMutation.mutate({ draftId: draft.id, updates });
    },
    [draft?.id, updateMutation, toast]
  );

  const approveDraft = useCallback(() => {
    if (!draft?.id) return;
    updateMutation.mutate({ draftId: draft.id, updates: { status: "approved" } });
  }, [draft?.id, updateMutation]);

  return {
    // State
    draft,
    isSupported,
    isLoading: isDraftLoading,
    isGenerating,
    isSaving: updateMutation.isPending,
    hasDraft: !!draft,

    // Actions
    generate,
    saveDraft,
    approveDraft,
    refetchDraft,

    // Last generated content (from mutation, before it's refetched)
    lastGenerated: generateMutation.data?.content ?? null,
  };
}

