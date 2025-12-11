/**
 * SocialContentEditor Component
 *
 * Displays and allows editing of AI-generated social content.
 * Used within the CalendarAccordion for FB/IG slots.
 * 
 * Features:
 * - Caption editing with character count
 * - Refinement toolbar (shorten/expand/emoji)
 * - Inline platform preview (FB/IG mock-up)
 * - Hashtag management
 * - Approve/reject workflow integration
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { Sparkles, Save, Wand2, ChevronDown, ChevronUp, Hash, Palette, Loader2, Check, Eye, EyeOff, CheckCircle } from "lucide-react";
import { cn } from "@/lib/design-system";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  useSocialContentGeneration,
  isSupportedPlatform,
  getPlatformDisplay,
} from "@/hooks/useSocialContentGeneration";
import { RefinementToolbar } from "./RefinementToolbar";
import { SocialPostPreview } from "./SocialPostPreview";

// ============================================================================
// TYPES
// ============================================================================

interface SocialContentEditorProps {
  slotId: string;
  brandId: string;
  platform: string;
  slotTitle: string;
  className?: string;
  onContentGenerated?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function SocialContentEditor({
  slotId,
  brandId,
  platform,
  slotTitle,
  className,
  onContentGenerated,
}: SocialContentEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localCaption, setLocalCaption] = useState("");
  const [localHashtags, setLocalHashtags] = useState<string[]>([]);
  const [hasLocalChanges, setHasLocalChanges] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  
  // Ref for autosave timer
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const {
    draft,
    isSupported,
    isLoading,
    isGenerating,
    isSaving,
    hasDraft,
    generate,
    saveDraft,
    approveDraft,
    lastGenerated,
  } = useSocialContentGeneration({
    slotId,
    brandId,
    platform,
    enabled: true,
  });

  // Sync local state with draft
  useEffect(() => {
    if (draft?.content) {
      setLocalCaption(draft.content.primary_text || "");
      setLocalHashtags(draft.content.suggested_hashtags || []);
      setHasLocalChanges(false);
    }
  }, [draft]);

  // Sync with last generated content
  useEffect(() => {
    if (lastGenerated) {
      setLocalCaption(lastGenerated.primary_text || "");
      setLocalHashtags(lastGenerated.suggested_hashtags || []);
      setHasLocalChanges(false);
      setIsExpanded(true);
      onContentGenerated?.();
    }
  }, [lastGenerated, onContentGenerated]);

  // Handle caption change with debounced autosave
  const handleCaptionChange = useCallback((value: string) => {
    setLocalCaption(value);
    setHasLocalChanges(true);
    setAutoSaveStatus("idle");
    
    // ✅ Debounced autosave: Clear existing timer and start new one
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    
    // Start autosave timer (3 seconds of inactivity)
    autoSaveTimerRef.current = setTimeout(() => {
      // Only autosave if we still have unsaved changes and a valid draft
      if (value.trim() && draft?.id) {
        setAutoSaveStatus("saving");
        saveDraft({
          primary_text: value,
          suggested_hashtags: localHashtags,
        });
        // Mark as saved after a short delay (to show feedback)
        setTimeout(() => {
          setAutoSaveStatus("saved");
          setHasLocalChanges(false);
          // Reset status after 2 seconds
          setTimeout(() => setAutoSaveStatus("idle"), 2000);
        }, 500);
      }
    }, 3000);
  }, [draft?.id, saveDraft, localHashtags]);

  // Cleanup autosave timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  // Handle manual save (clears autosave timer)
  const handleSave = useCallback(() => {
    // Clear any pending autosave
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
    
    setAutoSaveStatus("saving");
    saveDraft({
      primary_text: localCaption,
      suggested_hashtags: localHashtags,
    });
    setHasLocalChanges(false);
    
    // Show "Saved" feedback
    setTimeout(() => {
      setAutoSaveStatus("saved");
      setTimeout(() => setAutoSaveStatus("idle"), 2000);
    }, 500);
  }, [saveDraft, localCaption, localHashtags]);

  // Platform display info
  const platformDisplay = getPlatformDisplay(platform);

  // If platform is not supported, don't render
  if (!isSupported) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={cn("mt-3 p-3 bg-slate-50 rounded-lg animate-pulse", className)}>
        <div className="h-4 bg-slate-200 rounded w-1/3 mb-2"></div>
        <div className="h-20 bg-slate-200 rounded"></div>
      </div>
    );
  }

  // No draft yet - show generate button
  if (!hasDraft && !lastGenerated) {
    return (
      <div className={cn("mt-3", className)}>
        <Button
          variant="outline"
          size="sm"
          onClick={generate}
          disabled={isGenerating}
          className="w-full bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 border-indigo-200 text-indigo-700 font-semibold"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating {platformDisplay.label} Content...
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4 mr-2" />
              Generate {platformDisplay.shortLabel} Content
            </>
          )}
        </Button>
      </div>
    );
  }

  // Content exists - show editor
  const content = draft?.content || lastGenerated;
  if (!content) return null;

  return (
    <div className={cn("mt-3 border border-indigo-100 rounded-lg overflow-hidden", className)}>
      {/* Header - Always Visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 flex items-center justify-between hover:from-indigo-100 hover:to-purple-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <span className="text-sm font-semibold text-indigo-700">
            Generated {platformDisplay.label} Content
          </span>
          {hasLocalChanges && (
            <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
              Unsaved
            </Badge>
          )}
          {draft?.status === "edited" && !hasLocalChanges && (
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
              Edited
            </Badge>
          )}
          {draft?.status === "approved" && (
            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
              <Check className="w-3 h-3 mr-1" />
              Approved
            </Badge>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-indigo-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-indigo-500" />
        )}
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-3 bg-white space-y-3">
          {/* Headline (if present) */}
          {content.headline && (
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">
                Headline
              </label>
              <p className="text-sm font-semibold text-slate-800">{content.headline}</p>
            </div>
          )}

          {/* Main Caption */}
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">
              Caption
            </label>
            <Textarea
              value={localCaption}
              onChange={(e) => handleCaptionChange(e.target.value)}
              className="min-h-[120px] text-sm resize-none border-slate-200 focus:border-indigo-300 focus:ring-indigo-200"
              placeholder="Your caption here..."
            />
            <div className="flex justify-between mt-1">
              <span className="text-xs text-slate-400">
                {localCaption.length} characters
              </span>
              {content.optimal_length && (
                <span className={cn(
                  "text-xs",
                  localCaption.length > content.optimal_length ? "text-red-500" : "text-slate-400"
                )}>
                  Recommended: {content.optimal_length}
                </span>
              )}
            </div>
          </div>

          {/* Refinement Toolbar */}
          {localCaption && (
            <RefinementToolbar
              brandId={brandId}
              platform={platform as "facebook" | "instagram_feed" | "instagram_reel"}
              caption={localCaption}
              hashtags={localHashtags}
              onRefinementComplete={(newCaption) => {
                handleCaptionChange(newCaption);
              }}
              disabled={isSaving}
            />
          )}

          {/* Hashtags */}
          {localHashtags.length > 0 && (
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
                <Hash className="w-3 h-3" />
                Suggested Hashtags
              </label>
              <div className="flex flex-wrap gap-1.5">
                {localHashtags.map((tag, idx) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    className="text-xs bg-indigo-50 text-indigo-700 border-0 hover:bg-indigo-100 cursor-pointer"
                  >
                    {tag.startsWith("#") ? tag : `#${tag}`}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          {content.cta_text && (
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">
                Call-to-Action
              </label>
              <p className="text-sm text-slate-700">{content.cta_text}</p>
            </div>
          )}

          {/* Design Brief */}
          {content.design_brief && (
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
                <Palette className="w-3 h-3" />
                Design Brief
              </label>
              <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                {content.design_brief}
              </p>
            </div>
          )}

          {/* Reel-specific fields */}
          {content.reel_hook && (
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">
                🎬 Reel Hook (First 3 Seconds)
              </label>
              <p className="text-sm text-slate-700 font-medium">{content.reel_hook}</p>
            </div>
          )}

          {content.reel_script_outline && content.reel_script_outline.length > 0 && (
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">
                📝 Script Outline
              </label>
              <ol className="text-xs text-slate-600 space-y-1 list-decimal list-inside bg-slate-50 p-2 rounded">
                {content.reel_script_outline.map((scene, idx) => (
                  <li key={idx}>{scene}</li>
                ))}
              </ol>
            </div>
          )}

          {/* Preview Toggle */}
          <div className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              className="w-full justify-center gap-2 text-xs"
            >
              {showPreview ? (
                <>
                  <EyeOff className="w-3 h-3" />
                  Hide Preview
                </>
              ) : (
                <>
                  <Eye className="w-3 h-3" />
                  Preview How It Will Look
                </>
              )}
            </Button>
          </div>

          {/* Platform Preview */}
          {showPreview && localCaption && (
            <SocialPostPreview
              platform={platform as "facebook" | "instagram_feed" | "instagram_reel"}
              caption={localCaption}
              hashtags={localHashtags}
            />
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={generate}
                disabled={isGenerating}
                className="text-xs"
              >
                {isGenerating ? (
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <Wand2 className="w-3 h-3 mr-1" />
                )}
                Regenerate
              </Button>
            </div>

            <div className="flex gap-2">
              {/* Approve button - only show if not already approved */}
              {draft?.status !== "approved" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={approveDraft}
                  disabled={isSaving || !draft?.id}
                  className="text-xs text-green-700 border-green-200 hover:bg-green-50 hover:border-green-300"
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Approve
                </Button>
              )}
              
              {/* Show save button or autosave status */}
              {hasLocalChanges ? (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving || autoSaveStatus === "saving"}
                  className="text-xs bg-indigo-600 hover:bg-indigo-700"
                >
                  {isSaving || autoSaveStatus === "saving" ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <Save className="w-3 h-3 mr-1" />
                  )}
                  {autoSaveStatus === "saving" ? "Saving..." : "Save Changes"}
                </Button>
              ) : autoSaveStatus === "saved" ? (
                <span className="text-xs text-green-600 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Saved
                </span>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// COMPACT GENERATE BUTTON (for inline use)
// ============================================================================

interface GenerateButtonProps {
  slotId: string;
  brandId: string;
  platform: string;
  size?: "sm" | "default";
  compact?: boolean;
  className?: string;
}

export function GenerateSocialButton({
  slotId,
  brandId,
  platform,
  size = "sm",
  compact = false,
  className,
}: GenerateButtonProps) {
  const { isSupported, isGenerating, hasDraft, generate } = useSocialContentGeneration({
    slotId,
    brandId,
    platform,
    enabled: true,
  });

  if (!isSupported || hasDraft) {
    return null;
  }

  const platformDisplay = getPlatformDisplay(platform);

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={(e) => {
        e.stopPropagation();
        generate();
      }}
      disabled={isGenerating}
      className={cn(
        "text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-bold",
        compact && "text-xs px-2 py-0.5 h-auto",
        className
      )}
    >
      {isGenerating ? (
        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
      ) : (
        <Wand2 className="w-3 h-3 mr-1" />
      )}
      Generate
    </Button>
  );
}

