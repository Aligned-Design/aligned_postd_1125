/**
 * AiPostReviewModal
 * 
 * Refactored AI post review modal using Postd design system primitives.
 * Two-column layout: post preview (left) + AI enhancements sidebar (right).
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal } from "../overlay/Modal";
import { SectionCard } from "../cards/SectionCard";
import { Badge } from "@/components/ui/badge";
import { Eye, Check, Calendar, Sparkles } from "lucide-react";
import { cn } from "@/lib/design-system";

interface AiPostReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: {
    platform: string;
    copy: string;
    hashtags: string[];
  };
  brandData: {
    name: string;
    industry?: string;
  };
  onTryDifferent?: () => void;
  onAddToQueue: () => void;
}

export function AiPostReviewModal({
  open,
  onOpenChange,
  post,
  brandData,
  onTryDifferent,
  onAddToQueue,
}: AiPostReviewModalProps) {
  const navigate = useNavigate();

  const handleAddToQueue = () => {
    onAddToQueue();
    onOpenChange(false);
  };

  const handleTryDifferent = () => {
    onTryDifferent?.();
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Your First Post is Ready! 🎉"
      subtitle="Review your AI-generated post below"
      maxWidth="4xl"
      variant="gradient-header"
      primaryAction={{
        label: "Add to Queue",
        onClick: handleAddToQueue,
      }}
      secondaryAction={onTryDifferent ? {
        label: "Try Different Topic",
        onClick: handleTryDifferent,
      } : undefined}
    >
      <div className={cn(
        "grid grid-cols-1 lg:grid-cols-3 gap-6",
        "w-full"
      )}>
        {/* Left Column: Post Preview (65% on desktop) */}
        <div className="lg:col-span-2">
          <SectionCard padding="lg" variant="default">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-xs font-medium">
                  {post.platform}
                </Badge>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Eye className="w-4 h-4" />
                  <span>Preview</span>
                </div>
              </div>

              {/* Post Content */}
              <div className="space-y-4">
                <p className={cn(
                  "text-sm sm:text-base",
                  "text-foreground",
                  "whitespace-pre-line",
                  "leading-relaxed"
                )}>
                  {post.copy}
                </p>

                {/* Hashtags */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {post.hashtags.map((tag) => (
                    <span
                      key={tag}
                      className={cn(
                        "text-xs font-medium",
                        "text-primary",
                        "px-2 py-1",
                        "rounded-md",
                        "bg-primary/10"
                      )}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* Right Column: AI Enhancements Sidebar (35% on desktop) */}
        <div className="lg:col-span-1">
          <SectionCard padding="lg" variant="subtle">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className={cn(
                  "text-sm font-semibold",
                  "text-foreground"
                )}>
                  AI Enhancements
                </h3>
              </div>

              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className={cn(
                    "w-5 h-5 rounded-full",
                    "bg-green-100",
                    "flex items-center justify-center",
                    "flex-shrink-0",
                    "mt-0.5"
                  )}>
                    <Check className="w-3 h-3 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-xs font-medium",
                      "text-foreground"
                    )}>
                      Matched brand tone
                    </p>
                    <p className={cn(
                      "text-xs",
                      "text-muted-foreground",
                      "mt-0.5"
                    )}>
                      {brandData.industry || "industry"} style
                    </p>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <div className={cn(
                    "w-5 h-5 rounded-full",
                    "bg-green-100",
                    "flex items-center justify-center",
                    "flex-shrink-0",
                    "mt-0.5"
                  )}>
                    <Check className="w-3 h-3 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-xs font-medium",
                      "text-foreground"
                    )}>
                      Added relevant hashtags
                    </p>
                    <p className={cn(
                      "text-xs",
                      "text-muted-foreground",
                      "mt-0.5"
                    )}>
                      For better reach
                    </p>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <div className={cn(
                    "w-5 h-5 rounded-full",
                    "bg-green-100",
                    "flex items-center justify-center",
                    "flex-shrink-0",
                    "mt-0.5"
                  )}>
                    <Check className="w-3 h-3 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-xs font-medium",
                      "text-foreground"
                    )}>
                      Clear call-to-action
                    </p>
                    <p className={cn(
                      "text-xs",
                      "text-muted-foreground",
                      "mt-0.5"
                    )}>
                      Encourages engagement
                    </p>
                  </div>
                </li>
              </ul>

              {/* Brand Fidelity Score placeholder */}
              <div className={cn(
                "mt-6 pt-4",
                "border-t border-border"
              )}>
                <div className="flex items-center justify-between mb-2">
                  <span className={cn(
                    "text-xs font-medium",
                    "text-muted-foreground"
                  )}>
                    Brand Fidelity
                  </span>
                  <span className={cn(
                    "text-sm font-bold",
                    "text-green-600"
                  )}>
                    95%
                  </span>
                </div>
                <div className={cn(
                  "w-full h-2",
                  "bg-slate-200",
                  "rounded-full",
                  "overflow-hidden"
                )}>
                  <div className={cn(
                    "h-full",
                    "bg-gradient-to-r from-green-500 to-green-600",
                    "rounded-full",
                    "transition-all duration-300"
                  )} style={{ width: "95%" }} />
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </Modal>
  );
}

