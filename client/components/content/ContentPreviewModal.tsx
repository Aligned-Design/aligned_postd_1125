/**
 * Enhanced Content Preview Modal
 * 
 * Provides a comprehensive preview of content with:
 * - Platform-styled preview
 * - Inline editing
 * - Quality indicators
 * - Variant comparison
 * - Approval actions
 */

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  XCircle,
  Edit3,
  Eye,
  RefreshCw,
  ThumbsUp,
  MessageSquare,
  BarChart3,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ContentPreviewItem {
  id: string;
  title?: string;
  content: string;
  platform: string;
  contentType: "post" | "blog" | "email" | "gbp";
  status: "draft" | "pending_review" | "approved" | "scheduled" | "published";
  scheduledDate?: string;
  scheduledTime?: string;
  imageUrl?: string;
  hashtags?: string[];
  cta?: string;
  brandFidelityScore?: number;
  readabilityScore?: number;
  platformOptimization?: "excellent" | "good" | "needs-improvement";
  variants?: Array<{
    label: string;
    content: string;
    tone: string;
    wordCount: number;
  }>;
}

interface ContentPreviewModalProps {
  content: ContentPreviewItem;
  open: boolean;
  onClose: () => void;
  onApprove: (contentId: string) => Promise<void>;
  onRequestChanges: (contentId: string, feedback: string) => Promise<void>;
  onEdit: (contentId: string, editedContent: string) => Promise<void>;
  onViewVariants?: () => void;
  loading?: boolean;
}

const PLATFORM_STYLES: Record<string, { bg: string; border: string; icon: string }> = {
  instagram: {
    bg: "bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500",
    border: "border-purple-200",
    icon: "📷",
  },
  linkedin: {
    bg: "bg-blue-600",
    border: "border-blue-200",
    icon: "💼",
  },
  facebook: {
    bg: "bg-blue-700",
    border: "border-blue-200",
    icon: "👥",
  },
  twitter: {
    bg: "bg-slate-900",
    border: "border-slate-200",
    icon: "🐦",
  },
  email: {
    bg: "bg-indigo-600",
    border: "border-indigo-200",
    icon: "📧",
  },
  blog: {
    bg: "bg-slate-700",
    border: "border-slate-200",
    icon: "📝",
  },
  google_business: {
    bg: "bg-red-600",
    border: "border-red-200",
    icon: "📍",
  },
};

export function ContentPreviewModal({
  content,
  open,
  onClose,
  onApprove,
  onRequestChanges,
  onEdit,
  onViewVariants,
  loading = false,
}: ContentPreviewModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content.content);
  const [feedback, setFeedback] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);

  const platformStyle = PLATFORM_STYLES[content.platform.toLowerCase()] || PLATFORM_STYLES.instagram;

  const handleSaveEdit = async () => {
    await onEdit(content.id, editedContent);
    setIsEditing(false);
  };

  const handleApprove = async () => {
    await onApprove(content.id);
    onClose();
  };

  const handleRequestChanges = async () => {
    if (!feedback.trim()) {
      setShowFeedback(true);
      return;
    }
    await onRequestChanges(content.id, feedback);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-white text-lg", platformStyle.bg)}>
                {platformStyle.icon}
              </div>
              <div>
                <DialogTitle className="text-2xl">
                  {content.title || `${content.platform} ${content.contentType}`}
                </DialogTitle>
                <DialogDescription className="mt-1">
                  Review content • {content.platform.charAt(0).toUpperCase() + content.platform.slice(1)}
                </DialogDescription>
              </div>
            </div>
            {content.variants && content.variants.length > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={onViewVariants}
                className="gap-2"
              >
                <Eye className="w-4 h-4" />
                View Other Variants ({content.variants.length})
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Quality Indicators */}
          <div className="grid grid-cols-3 gap-4">
            {content.brandFidelityScore !== undefined && (
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-600">Brand Match</span>
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900">
                    {Math.round(content.brandFidelityScore * 100)}%
                  </span>
                  <span className={cn(
                    "text-xs font-medium",
                    content.brandFidelityScore >= 0.8 ? "text-green-600" : 
                    content.brandFidelityScore >= 0.6 ? "text-yellow-600" : "text-red-600"
                  )}>
                    {content.brandFidelityScore >= 0.8 ? "Excellent" : 
                     content.brandFidelityScore >= 0.6 ? "Good" : "Needs Work"}
                  </span>
                </div>
              </div>
            )}
            
            {content.readabilityScore !== undefined && (
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-600">Readability</span>
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900">
                    {content.readabilityScore >= 80 ? "Excellent" : 
                     content.readabilityScore >= 60 ? "Good" : "Fair"}
                  </span>
                </div>
              </div>
            )}
            
            {content.platformOptimization && (
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-600">Platform Fit</span>
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900 capitalize">
                    {content.platformOptimization}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Platform Preview */}
          <div className="bg-white rounded-xl border-2 border-slate-200 overflow-hidden">
            <div className={cn("h-2", platformStyle.bg)} />
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white", platformStyle.bg)}>
                    {platformStyle.icon}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-900">Your Brand</p>
                    <p className="text-xs text-slate-500">Just now</p>
                  </div>
                </div>
                {!isEditing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="gap-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit
                  </Button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <Textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="min-h-[200px] font-medium text-slate-900"
                    placeholder="Edit your content..."
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSaveEdit}
                      disabled={loading}
                      className="gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Save Changes
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setEditedContent(content.content);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-slate-900 leading-relaxed whitespace-pre-wrap">
                    {content.content}
                  </p>
                  
                  {content.hashtags && content.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200">
                      {content.hashtags.map((tag, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  {content.cta && (
                    <div className="pt-2">
                      <Button variant="outline" size="sm" className="w-full">
                        {content.cta}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {content.imageUrl && (
                <div className="mt-4 rounded-lg overflow-hidden bg-slate-100 aspect-square">
                  <img
                    src={content.imageUrl}
                    alt="Content preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Request Changes Section */}
          {showFeedback && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-amber-900 mb-2">
                What would you like changed?
              </p>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="E.g., Make it more casual, add more hashtags, change the CTA..."
                className="mb-2"
                rows={3}
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleRequestChanges}
                  disabled={loading || !feedback.trim()}
                  variant="outline"
                  className="gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Request Changes
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowFeedback(false);
                    setFeedback("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <Button
              onClick={handleApprove}
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700 gap-2"
              size="lg"
            >
              <CheckCircle2 className="w-5 h-5" />
              Approve & Schedule
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowFeedback(true)}
              disabled={loading || showFeedback}
              className="flex-1 gap-2"
              size="lg"
            >
              <RefreshCw className="w-5 h-5" />
              Request Changes
            </Button>
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={loading}
              size="lg"
            >
              <XCircle className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

