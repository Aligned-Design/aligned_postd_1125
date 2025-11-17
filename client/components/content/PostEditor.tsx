import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/design-system";
import type { PostModel, PostUpdateRequest } from "@shared/api";

interface PostEditorProps {
  post: PostModel;
  onSave: (updates: PostUpdateRequest) => Promise<void>;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  readonly?: boolean;
}

export function PostEditor({
  post,
  onSave,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  readonly = false,
}: PostEditorProps) {
  const [caption, setCaption] = useState(post.caption);
  const [hashtags, setHashtags] = useState(post.hashtags.join(" "));
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [characterCount, setCharacterCount] = useState(0);
  const [complianceScore, _setComplianceScore] = useState(post.complianceScore);

  // Platform character limits
  const platformLimits = {
    twitter: 280,
    instagram: 2200,
    facebook: 63206,
    linkedin: 3000,
    tiktok: 150,
  };

  const maxCharacters = platformLimits[post.platform];

  useEffect(() => {
    const fullText = caption + " " + hashtags;
    setCharacterCount(fullText.length);
  }, [caption, hashtags]);

  // Auto-save every 5 seconds
  useEffect(() => {
    if (readonly) return;

    const timer = setTimeout(async () => {
      const updates: PostUpdateRequest = {
        caption,
        hashtags: hashtags.split(" ").filter((tag) => tag.trim()),
      };

      setIsSaving(true);
      try {
        await onSave(updates);
        setLastSaved(new Date());
      } finally {
        setIsSaving(false);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [caption, hashtags, onSave, readonly]);

  const handleAIRewrite = async () => {
    try {
      const response = await fetch("/api/ai-rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: caption,
          platform: post.platform,
          brandId: post.brandId,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setCaption(result.rewrittenContent);
      }
    } catch (error) {
      console.error("AI rewrite failed:", error);
    }
  };

  const getCharacterCountColor = () => {
    const percentage = characterCount / maxCharacters;
    if (percentage > 0.9) return "text-red-600";
    if (percentage > 0.8) return "text-yellow-600";
    return "text-gray-600";
  };

  const getComplianceColor = () => {
    if (complianceScore >= 0.8) return "text-green-600";
    if (complianceScore >= 0.6) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6 p-6 bg-white rounded-lg shadow">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Post Editor</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onUndo}
            disabled={!canUndo || readonly}
          >
            ↶ Undo
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRedo}
            disabled={!canRedo || readonly}
          >
            ↷ Redo
          </Button>

          {lastSaved && (
            <span className="text-xs text-gray-500">
              Saved {lastSaved.toLocaleTimeString()}
            </span>
          )}

          {isSaving && <span className="text-xs text-blue-600">Saving...</span>}
        </div>
      </div>

      {/* Platform Info */}
      <div className="flex items-center gap-4 p-3 bg-gray-50 rounded">
        <span className="font-medium capitalize">{post.platform}</span>
        <span className="text-sm text-gray-600">Status: {post.status}</span>
        <span className={cn("text-sm font-medium", getComplianceColor())}>
          Compliance: {(complianceScore * 100).toFixed(0)}%
        </span>
      </div>

      {/* Caption Editor */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium">Caption</label>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAIRewrite}
            disabled={readonly}
          >
            ✨ AI Rewrite
          </Button>
        </div>

        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary min-h-32 resize-none"
          placeholder="Write your post caption..."
          disabled={readonly}
        />
      </div>

      {/* Hashtags */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Hashtags</label>
        <input
          type="text"
          value={hashtags}
          onChange={(e) => setHashtags(e.target.value)}
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary"
          placeholder="#hashtag #another"
          disabled={readonly}
        />
      </div>

      {/* Character Counter */}
      <div className="flex justify-between text-sm">
        <span className={getCharacterCountColor()}>
          {characterCount} / {maxCharacters} characters
        </span>

        {characterCount > maxCharacters && (
          <span className="text-red-600 font-medium">
            Exceeds limit by {characterCount - maxCharacters}
          </span>
        )}
      </div>

      {/* Compliance Warnings */}
      {post.linterResults.errors.length > 0 && (
        <div className="p-3 bg-red-50 border border-red-200 rounded">
          <h4 className="font-medium text-red-800 mb-1">Compliance Errors</h4>
          <ul className="text-sm text-red-600 space-y-1">
            {post.linterResults.errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {post.linterResults.warnings.length > 0 && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
          <h4 className="font-medium text-yellow-800 mb-1">Warnings</h4>
          <ul className="text-sm text-yellow-600 space-y-1">
            {post.linterResults.warnings.map((warning, index) => (
              <li key={index}>• {warning}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
