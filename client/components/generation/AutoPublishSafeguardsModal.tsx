import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Eye,
  X,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface GeneratedPost {
  id: string;
  title: string;
  platform: string;
  scheduledDate: string;
  preview: string;
  status: "draft" | "scheduled";
}

interface AutoPublishSafeguardsModalProps {
  open: boolean;
  onClose: () => void;
  generatedPosts: GeneratedPost[];
  onQueueAll: () => void;
  onReviewWeekly: () => void;
  onSkip: () => void;
}

export function AutoPublishSafeguardsModal({
  open,
  onClose,
  generatedPosts,
  onQueueAll,
  onReviewWeekly,
  onSkip,
}: AutoPublishSafeguardsModalProps) {
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);

  const handlePrevPreview = () => {
    setCurrentPreviewIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNextPreview = () => {
    setCurrentPreviewIndex((prev) =>
      Math.min(generatedPosts.length - 1, prev + 1),
    );
  };

  const currentPost = generatedPosts[currentPreviewIndex];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-green-600" />
                Content Plan Generated!
              </DialogTitle>
              <DialogDescription className="text-base mt-2">
                I've created {generatedPosts.length} posts for the next 30 days.
                Review samples below and choose how to proceed.
              </DialogDescription>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Stats Banner */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-black text-indigo-600">
                    {generatedPosts.length}
                  </p>
                  <p className="text-sm text-slate-600 mt-1">Posts Created</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-black text-blue-600">30</p>
                  <p className="text-sm text-slate-600 mt-1">Days Planned</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-black text-purple-600">
                    {new Set(generatedPosts.map((p) => p.platform)).size}
                  </p>
                  <p className="text-sm text-slate-600 mt-1">Platforms</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview Carousel */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900">Preview Samples</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevPreview}
                  disabled={currentPreviewIndex === 0}
                  className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-slate-600">
                  {currentPreviewIndex + 1} / {generatedPosts.length}
                </span>
                <button
                  onClick={handleNextPreview}
                  disabled={currentPreviewIndex === generatedPosts.length - 1}
                  className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {currentPost && (
              <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900">
                          {currentPost.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="capitalize">
                            {currentPost.platform}
                          </Badge>
                          <span className="text-xs text-slate-600">
                            Scheduled: {currentPost.scheduledDate}
                          </span>
                        </div>
                      </div>
                      <Badge
                        variant={
                          currentPost.status === "scheduled"
                            ? "default"
                            : "outline"
                        }
                      >
                        {currentPost.status}
                      </Badge>
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-indigo-100">
                      <p className="text-sm text-slate-700 leading-relaxed">
                        {currentPost.preview}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Important Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm font-bold text-blue-900">
                  ✋ Hold on! Nothing will auto-publish without your permission.
                </p>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>
                    • All posts will be saved as <strong>drafts</strong> or{" "}
                    <strong>queued</strong> based on your choice
                  </li>
                  <li>
                    • You can edit, delete, or reschedule any post before it
                    goes live
                  </li>
                  <li>• Review and approve posts individually or in batches</li>
                  <li>
                    • Auto-publishing only happens if you explicitly enable it
                    in settings
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Options */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900">Choose how to proceed:</h3>

            <button
              onClick={() => {
                onQueueAll();
                onClose();
              }}
              className="w-full p-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl transition-all text-left group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold">
                      Queue All {generatedPosts.length} Posts
                    </p>
                    <p className="text-xs opacity-90">
                      Review and edit posts in Content Queue before publishing
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            <button
              onClick={() => {
                onReviewWeekly();
                onClose();
              }}
              className="w-full p-4 bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-indigo-300 rounded-xl transition-all text-left group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <Eye className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">
                      Review 7 Days at a Time
                    </p>
                    <p className="text-xs text-slate-600">
                      Break it into weekly batches for easier review
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            <button
              onClick={() => {
                onSkip();
                onClose();
              }}
              className="w-full p-4 bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-slate-300 rounded-xl transition-all text-left group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                    <X className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Skip for Now</p>
                    <p className="text-xs text-slate-600">
                      I'll create content manually instead
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>

          {/* Schedule Preview */}
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-slate-600" />
              <p className="text-sm font-bold text-slate-900">
                Schedule Preview (Next 7 Days)
              </p>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {generatedPosts.slice(0, 7).map((post, idx) => (
                <div key={post.id} className="text-center">
                  <div className="text-xs text-slate-600 mb-1">
                    {new Date(post.scheduledDate).toLocaleDateString("en-US", {
                      weekday: "short",
                    })}
                  </div>
                  <div className="w-full aspect-square bg-indigo-100 rounded-lg flex items-center justify-center">
                    <span className="text-lg">
                      {post.platform === "instagram"
                        ? "📸"
                        : post.platform === "linkedin"
                          ? "💼"
                          : post.platform === "twitter"
                            ? "🐦"
                            : post.platform === "facebook"
                              ? "👥"
                              : "📱"}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1 truncate">
                    {post.title.slice(0, 10)}...
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
