/**
 * Enhanced Content Card Component
 * 
 * Displays content items with quality indicators, platform styling, and quick actions.
 */

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Eye,
  Edit3,
  CheckCircle2,
  XCircle,
  Sparkles,
  BarChart3,
  Clock,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ContentPreviewModal, ContentPreviewItem } from "./ContentPreviewModal";

interface EnhancedContentCardProps {
  content: ContentPreviewItem;
  onApprove?: (id: string) => Promise<void>;
  onRequestChanges?: (id: string, feedback: string) => Promise<void>;
  onEdit?: (id: string, editedContent: string) => Promise<void>;
  onView?: () => void;
  showQualityScores?: boolean;
}

const PLATFORM_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  instagram: { bg: "bg-gradient-to-br from-purple-500 to-pink-500", text: "text-purple-600", border: "border-purple-200" },
  linkedin: { bg: "bg-blue-600", text: "text-blue-600", border: "border-blue-200" },
  facebook: { bg: "bg-blue-700", text: "text-blue-600", border: "border-blue-200" },
  twitter: { bg: "bg-slate-900", text: "text-slate-600", border: "border-slate-200" },
  email: { bg: "bg-indigo-600", text: "text-indigo-600", border: "border-indigo-200" },
  blog: { bg: "bg-slate-700", text: "text-slate-600", border: "border-slate-200" },
  google_business: { bg: "bg-red-600", text: "text-red-600", border: "border-red-200" },
};

export function EnhancedContentCard({
  content,
  onApprove,
  onRequestChanges,
  onEdit,
  onView,
  showQualityScores = true,
}: EnhancedContentCardProps) {
  const [showPreview, setShowPreview] = useState(false);
  const platformColor = PLATFORM_COLORS[content.platform.toLowerCase()] || PLATFORM_COLORS.instagram;

  const getStatusColor = () => {
    switch (content.status) {
      case "approved":
      case "published":
        return "border-green-200 bg-green-50/50";
      case "pending_review":
        return "border-yellow-200 bg-yellow-50/50";
      case "scheduled":
        return "border-blue-200 bg-blue-50/50";
      case "draft":
        return "border-slate-200 bg-slate-50/50";
      default:
        return "border-slate-200 bg-white";
    }
  };

  const getStatusBadge = () => {
    switch (content.status) {
      case "approved":
        return <Badge className="bg-green-600 text-white">Approved</Badge>;
      case "published":
        return <Badge className="bg-green-700 text-white">Published</Badge>;
      case "pending_review":
        return <Badge className="bg-yellow-600 text-white">Review</Badge>;
      case "scheduled":
        return <Badge className="bg-blue-600 text-white">Scheduled</Badge>;
      case "draft":
        return <Badge variant="outline">Draft</Badge>;
      default:
        return null;
    }
  };

  return (
    <>
      <Card
        className={cn(
          "border-2 transition-all hover:shadow-lg cursor-pointer",
          getStatusColor()
        )}
        onClick={() => setShowPreview(true)}
      >
        <CardContent className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-white flex-shrink-0", platformColor.bg)}>
                {content.platform.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-900 truncate mb-1">
                  {content.title || `${content.platform} ${content.contentType}`}
                </h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs capitalize">
                    {content.platform}
                  </Badge>
                  {getStatusBadge()}
                </div>
              </div>
            </div>
          </div>

          {/* Content Preview */}
          <p className="text-sm text-slate-700 line-clamp-3 mb-4 leading-relaxed">
            {content.content}
          </p>

          {/* Quality Indicators */}
          {showQualityScores && (
            <div className="grid grid-cols-3 gap-2 mb-4 pb-4 border-b border-slate-200">
              {content.brandFidelityScore !== undefined && (
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Sparkles className={cn("w-3 h-3", content.brandFidelityScore >= 0.8 ? "text-green-600" : content.brandFidelityScore >= 0.6 ? "text-yellow-600" : "text-red-600")} />
                    <span className={cn(
                      "text-xs font-bold",
                      content.brandFidelityScore >= 0.8 ? "text-green-600" : 
                      content.brandFidelityScore >= 0.6 ? "text-yellow-600" : "text-red-600"
                    )}>
                      {Math.round(content.brandFidelityScore * 100)}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">Brand Match</p>
                </div>
              )}
              
              {content.readabilityScore !== undefined && (
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <BarChart3 className="w-3 h-3 text-blue-600" />
                    <span className="text-xs font-bold text-blue-600">
                      {content.readabilityScore >= 80 ? "Excellent" : content.readabilityScore >= 60 ? "Good" : "Fair"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">Readability</p>
                </div>
              )}
              
              {content.platformOptimization && (
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <CheckCircle2 className={cn(
                      "w-3 h-3",
                      content.platformOptimization === "excellent" ? "text-green-600" :
                      content.platformOptimization === "good" ? "text-blue-600" : "text-yellow-600"
                    )} />
                    <span className="text-xs font-bold capitalize text-slate-700">
                      {content.platformOptimization}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">Platform Fit</p>
                </div>
              )}
            </div>
          )}

          {/* Metadata */}
          <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
            <div className="flex items-center gap-3">
              {content.scheduledDate && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(content.scheduledDate).toLocaleDateString()}</span>
                </div>
              )}
              {content.hashtags && content.hashtags.length > 0 && (
                <span>{content.hashtags.length} hashtags</span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-2"
              onClick={(e) => {
                e.stopPropagation();
                setShowPreview(true);
              }}
            >
              <Eye className="w-4 h-4" />
              Preview
            </Button>
            {content.status === "pending_review" && onApprove && (
              <Button
                size="sm"
                className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                onClick={async (e) => {
                  e.stopPropagation();
                  await onApprove(content.id);
                }}
              >
                <CheckCircle2 className="w-4 h-4" />
                Approve
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preview Modal */}
      {showPreview && (
        <ContentPreviewModal
          content={content}
          open={showPreview}
          onClose={() => setShowPreview(false)}
          onApprove={onApprove || (async () => {})}
          onRequestChanges={onRequestChanges || (async () => {})}
          onEdit={onEdit || (async () => {})}
        />
      )}
    </>
  );
}

