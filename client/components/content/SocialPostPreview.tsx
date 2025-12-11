/**
 * SocialPostPreview Component
 *
 * Inline preview of how a post will look on Facebook and Instagram.
 * Shows realistic mock-ups with actual caption, hashtags, and image placeholder.
 */

import { useState } from "react";
import { Facebook, Instagram, Film, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/design-system";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// ============================================================================
// TYPES
// ============================================================================

interface SocialPostPreviewProps {
  platform: "facebook" | "instagram_feed" | "instagram_reel";
  caption: string;
  hashtags?: string[];
  imageUrl?: string;
  brandName?: string;
  className?: string;
}

// Character limits per platform
const CHAR_LIMITS: Record<string, number> = {
  facebook: 63206,
  instagram_feed: 2200,
  instagram_reel: 2200,
};

// ============================================================================
// COMPONENT
// ============================================================================

export function SocialPostPreview({
  platform,
  caption,
  hashtags = [],
  imageUrl,
  brandName = "Your Brand",
  className,
}: SocialPostPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const charLimit = CHAR_LIMITS[platform] || 2200;
  const fullText = hashtags.length > 0 
    ? `${caption}\n\n${hashtags.join(" ")}` 
    : caption;
  const charCount = fullText.length;
  const isOverLimit = charCount > charLimit;
  const isNearLimit = charCount > charLimit * 0.9;

  // Instagram shows truncated captions after ~125 characters
  const igTruncateLength = 125;
  const shouldTruncateIG = platform.includes("instagram") && caption.length > igTruncateLength;
  const displayCaption = shouldTruncateIG && !isExpanded 
    ? caption.slice(0, igTruncateLength) + "..." 
    : caption;

  const platformConfig = {
    facebook: {
      icon: Facebook,
      color: "bg-blue-600",
      textColor: "text-blue-600",
      label: "Facebook",
      avatar: "bg-blue-500",
    },
    instagram_feed: {
      icon: Instagram,
      color: "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600",
      textColor: "text-pink-600",
      label: "Instagram",
      avatar: "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600",
    },
    instagram_reel: {
      icon: Film,
      color: "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600",
      textColor: "text-pink-600",
      label: "Instagram Reels",
      avatar: "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600",
    },
  };

  const config = platformConfig[platform] || platformConfig.instagram_feed;
  const Icon = config.icon;

  // Render Facebook post mock-up
  const renderFacebookPreview = () => (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 p-3 border-b border-slate-100">
        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white", config.avatar)}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm text-slate-900">{brandName}</p>
          <p className="text-xs text-slate-500">Just now · 🌎</p>
        </div>
      </div>

      {/* Caption */}
      <div className="px-3 py-2">
        <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
          {caption}
        </p>
        {hashtags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {hashtags.slice(0, 5).map((tag, idx) => (
              <span key={idx} className="text-sm text-blue-600 hover:underline cursor-pointer">
                {tag.startsWith("#") ? tag : `#${tag}`}
              </span>
            ))}
            {hashtags.length > 5 && (
              <span className="text-xs text-slate-400">+{hashtags.length - 5} more</span>
            )}
          </div>
        )}
      </div>

      {/* Media placeholder */}
      <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center border-t border-b border-slate-100">
        {imageUrl ? (
          <img src={imageUrl} alt="Post preview" className="w-full h-full object-cover" />
        ) : (
          <div className="text-center text-slate-400">
            <div className="w-12 h-12 bg-slate-200 rounded-lg mx-auto mb-2 flex items-center justify-center">
              📷
            </div>
            <p className="text-xs">Image/Video Preview</p>
          </div>
        )}
      </div>

      {/* Engagement bar */}
      <div className="flex items-center justify-around p-2 text-xs text-slate-500 border-t border-slate-100">
        <button className="flex items-center gap-1 hover:text-blue-600 py-1 px-3 rounded hover:bg-slate-50">
          👍 Like
        </button>
        <button className="flex items-center gap-1 hover:text-blue-600 py-1 px-3 rounded hover:bg-slate-50">
          💬 Comment
        </button>
        <button className="flex items-center gap-1 hover:text-blue-600 py-1 px-3 rounded hover:bg-slate-50">
          ↗️ Share
        </button>
      </div>
    </div>
  );

  // Render Instagram post mock-up
  const renderInstagramPreview = () => (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden max-w-[320px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 p-2 border-b border-slate-100">
        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white", config.avatar)}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-xs text-slate-900">{brandName.toLowerCase().replace(/\s+/g, "_")}</p>
        </div>
        <div className="text-slate-400">•••</div>
      </div>

      {/* Media - Square for feed, 9:16 for Reels */}
      <div className={cn(
        "bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center",
        platform === "instagram_reel" ? "aspect-[9/16] max-h-[400px]" : "aspect-square"
      )}>
        {imageUrl ? (
          <img src={imageUrl} alt="Post preview" className="w-full h-full object-cover" />
        ) : (
          <div className="text-center text-slate-400">
            <div className="text-4xl mb-2">{platform === "instagram_reel" ? "🎬" : "📷"}</div>
            <p className="text-xs">{platform === "instagram_reel" ? "Reel Preview" : "Image Preview"}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 p-2 text-xl">
        <button className="hover:opacity-60">❤️</button>
        <button className="hover:opacity-60">💬</button>
        <button className="hover:opacity-60">📤</button>
        <button className="ml-auto hover:opacity-60">🔖</button>
      </div>

      {/* Caption */}
      <div className="px-2 pb-2">
        <p className="text-xs text-slate-800 leading-relaxed">
          <span className="font-semibold">{brandName.toLowerCase().replace(/\s+/g, "_")}</span>{" "}
          {displayCaption}
          {shouldTruncateIG && !isExpanded && (
            <button 
              onClick={() => setIsExpanded(true)}
              className="text-slate-400 ml-1 hover:text-slate-600"
            >
              more
            </button>
          )}
        </p>
        
        {(isExpanded || !shouldTruncateIG) && hashtags.length > 0 && (
          <p className="mt-1 text-xs text-blue-900">
            {hashtags.map((tag, idx) => (
              <span key={idx} className="mr-1">
                {tag.startsWith("#") ? tag : `#${tag}`}
              </span>
            ))}
          </p>
        )}
        
        <p className="text-xs text-slate-400 mt-1">View all comments</p>
        <p className="text-xs text-slate-300 uppercase mt-1">Just now</p>
      </div>
    </div>
  );

  return (
    <div className={cn("space-y-3", className)}>
      {/* Header with platform badge and char count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn("gap-1", config.textColor)}>
            <Icon className="w-3 h-3" />
            {config.label} Preview
          </Badge>
        </div>
        <Badge 
          variant={isOverLimit ? "destructive" : isNearLimit ? "secondary" : "outline"}
          className="text-xs"
        >
          {charCount.toLocaleString()} / {charLimit.toLocaleString()}
        </Badge>
      </div>

      {/* Character limit warning */}
      {isOverLimit && (
        <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1">
          ⚠️ Caption exceeds {config.label}'s character limit by {(charCount - charLimit).toLocaleString()} characters
        </div>
      )}

      {/* Preview */}
      <div className="bg-slate-50 rounded-lg p-4">
        {platform === "facebook" ? renderFacebookPreview() : renderInstagramPreview()}
      </div>
    </div>
  );
}

// ============================================================================
// SIDE-BY-SIDE PREVIEW (for scheduling)
// ============================================================================

interface DualPlatformPreviewProps {
  caption: string;
  hashtags?: string[];
  imageUrl?: string;
  brandName?: string;
  platforms?: Array<"facebook" | "instagram_feed" | "instagram_reel">;
  className?: string;
}

export function DualPlatformPreview({
  caption,
  hashtags = [],
  imageUrl,
  brandName = "Your Brand",
  platforms = ["instagram_feed", "facebook"],
  className,
}: DualPlatformPreviewProps) {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className={cn("space-y-3", className)}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setShowPreview(!showPreview)}
        className="w-full justify-center gap-2"
      >
        {showPreview ? (
          <>
            <EyeOff className="w-4 h-4" />
            Hide Preview
          </>
        ) : (
          <>
            <Eye className="w-4 h-4" />
            Preview Post
          </>
        )}
      </Button>

      {showPreview && (
        <div className={cn(
          "grid gap-4",
          platforms.length > 1 ? "md:grid-cols-2" : "grid-cols-1"
        )}>
          {platforms.map((platform) => (
            <SocialPostPreview
              key={platform}
              platform={platform}
              caption={caption}
              hashtags={hashtags}
              imageUrl={imageUrl}
              brandName={brandName}
            />
          ))}
        </div>
      )}
    </div>
  );
}

