import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle,
  AlertCircle,
  HelpCircle,
  MessageSquare,
  Send,
  X,
} from "lucide-react";
import { cn } from "@/lib/design-system";

interface ApprovalOption {
  type:
    | "approve"
    | "approve_with_suggestions"
    | "request_changes"
    | "ask_question";
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  requiresComment?: boolean;
}

interface CollaborativeApprovalFlowProps {
  contentId: string;
  contentPreview: {
    thumbnail?: string;
    caption: string;
    platform: string;
  };
  onApproval: (type: ApprovalOption["type"], comment?: string) => void;
  className?: string;
}

export function CollaborativeApprovalFlow({
  contentId,
  contentPreview,
  onApproval,
  className,
}: CollaborativeApprovalFlowProps) {
  const [selectedOption, setSelectedOption] = useState<
    ApprovalOption["type"] | null
  >(null);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const approvalOptions: ApprovalOption[] = [
    {
      type: "approve",
      label: "Approve - Post This",
      description: "Content looks great! Ready to publish.",
      icon: <CheckCircle className="h-5 w-5" />,
      color: "bg-green-600 hover:bg-green-700 text-white border-green-600",
    },
    {
      type: "approve_with_suggestions",
      label: "Approve with Suggestions",
      description: "Good to go! Here are some ideas for next time.",
      icon: <MessageSquare className="h-5 w-5" />,
      color: "bg-amber-500 hover:bg-amber-600 text-white border-amber-500",
      requiresComment: true,
    },
    {
      type: "request_changes",
      label: "Request Changes",
      description: "Hold posting. This needs revisions.",
      icon: <AlertCircle className="h-5 w-5" />,
      color: "bg-red-600 hover:bg-red-700 text-white border-red-600",
      requiresComment: true,
    },
    {
      type: "ask_question",
      label: "Ask a Question",
      description: "I need clarification before deciding.",
      icon: <HelpCircle className="h-5 w-5" />,
      color: "bg-blue-600 hover:bg-blue-700 text-white border-blue-600",
      requiresComment: true,
    },
  ];

  const handleSubmit = async () => {
    if (!selectedOption) return;

    const option = approvalOptions.find((o) => o.type === selectedOption);
    if (option?.requiresComment && !comment.trim()) {
      alert("Please provide a comment for this action");
      return;
    }

    setIsSubmitting(true);

    try {
      await onApproval(selectedOption, comment || undefined);

      // Reset form
      setSelectedOption(null);
      setComment("");
    } catch (error) {
      console.error("Approval failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setSelectedOption(null);
    setComment("");
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-6">
        {/* Content Preview */}
        <div className="mb-6">
          <div className="flex gap-4">
            {contentPreview.thumbnail && (
              <div className="flex-shrink-0 w-24 h-24 bg-slate-200 rounded-lg overflow-hidden">
                <img
                  src={contentPreview.thumbnail}
                  alt="Content preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <Badge variant="outline" className="mb-2">
                {contentPreview.platform}
              </Badge>
              <p className="text-sm text-slate-700 line-clamp-3">
                {contentPreview.caption}
              </p>
            </div>
          </div>
        </div>

        {/* Approval Options */}
        {!selectedOption ? (
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 mb-4">
              How would you like to proceed?
            </h3>

            {approvalOptions.map((option) => (
              <button
                key={option.type}
                onClick={() => setSelectedOption(option.type)}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all text-left",
                  "hover:shadow-md",
                  option.color.includes("green") &&
                    "border-green-200 hover:border-green-500",
                  option.color.includes("amber") &&
                    "border-amber-200 hover:border-amber-500",
                  option.color.includes("red") &&
                    "border-red-200 hover:border-red-500",
                  option.color.includes("blue") &&
                    "border-blue-200 hover:border-blue-500",
                )}
              >
                <div
                  className={cn(
                    "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
                    option.color.includes("green") &&
                      "bg-green-100 text-green-600",
                    option.color.includes("amber") &&
                      "bg-amber-100 text-amber-600",
                    option.color.includes("red") && "bg-red-100 text-red-600",
                    option.color.includes("blue") &&
                      "bg-blue-100 text-blue-600",
                  )}
                >
                  {option.icon}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-slate-900 mb-1">
                    {option.label}
                  </div>
                  <div className="text-sm text-slate-600">
                    {option.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Selected Option Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    selectedOption === "approve" &&
                      "bg-green-100 text-green-600",
                    selectedOption === "approve_with_suggestions" &&
                      "bg-amber-100 text-amber-600",
                    selectedOption === "request_changes" &&
                      "bg-red-100 text-red-600",
                    selectedOption === "ask_question" &&
                      "bg-blue-100 text-blue-600",
                  )}
                >
                  {approvalOptions.find((o) => o.type === selectedOption)?.icon}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">
                    {
                      approvalOptions.find((o) => o.type === selectedOption)
                        ?.label
                    }
                  </h3>
                  <p className="text-sm text-slate-600">
                    {
                      approvalOptions.find((o) => o.type === selectedOption)
                        ?.description
                    }
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleCancel}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Comment Box */}
            {approvalOptions.find((o) => o.type === selectedOption)
              ?.requiresComment ? (
              <div>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={
                    selectedOption === "approve_with_suggestions"
                      ? "Love the direction. Try adding..."
                      : selectedOption === "request_changes"
                        ? "This doesn't fit our brand. Here's why..."
                        : "What would you like to know?"
                  }
                  className="min-h-32"
                />
                <p className="text-xs text-slate-500 mt-2">
                  {selectedOption === "approve_with_suggestions" &&
                    "Agency can still publish this week, but will see your suggestions"}
                  {selectedOption === "request_changes" &&
                    "Agency must edit and resubmit before publishing"}
                  {selectedOption === "ask_question" &&
                    "Approval stays pending until agency responds"}
                </p>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 text-sm">
                  ✓ This content will be scheduled for publishing
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleSubmit}
                disabled={
                  isSubmitting ||
                  (approvalOptions.find((o) => o.type === selectedOption)
                    ?.requiresComment &&
                    !comment.trim())
                }
                className={cn(
                  "flex-1 gap-2",
                  approvalOptions.find((o) => o.type === selectedOption)?.color,
                )}
              >
                <Send className="h-4 w-4" />
                {isSubmitting ? "Submitting..." : "Submit"}
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
