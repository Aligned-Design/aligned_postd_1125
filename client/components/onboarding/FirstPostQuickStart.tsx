import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  Sparkles,
  Loader,
  Check,
  ArrowRight,
  Calendar,
  Eye,
  PartyPopper,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AiPostReviewModal } from "@/components/postd/ui/modals/AiPostReviewModal";

interface FirstPostQuickStartProps {
  open: boolean;
  onClose: () => void;
  brandData: {
    name: string;
    industry?: string;
  };
}

export function FirstPostQuickStart({
  open,
  onClose,
  brandData,
}: FirstPostQuickStartProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<
    "intro" | "generating" | "preview" | "success"
  >("intro");
  const [generatedPost, setGeneratedPost] = useState<{
    platform: string;
    copy: string;
    hashtags: string[];
  } | null>(null);

  // Generate topic based on industry
  const getDefaultTopic = () => {
    const industryTopics: Record<string, string> = {
      health_wellness: "5 Tips for Maintaining Wellness This Week",
      ecommerce: "New Product Launch Announcement",
      saas: "How Our Platform Solves Your Biggest Challenge",
      agency: "Why Brands Trust Us With Their Marketing",
      nonprofit: "The Impact of Your Support This Month",
      education: "Student Success Story Spotlight",
      real_estate: "This Week's Featured Property",
      hospitality: "Experience the Difference",
      professional_services: "Client Success Story",
      retail: "This Week's Special Offer",
    };

    return (
      industryTopics[brandData.industry || ""] ||
      "Introducing Our Brand to the World"
    );
  };

  const handleGeneratePost = async () => {
    setStep("generating");

    // Simulate AI generation (2-3 seconds)
    await new Promise((resolve) => setTimeout(resolve, 2500));

    // Mock generated post
    const mockPost = {
      platform: "LinkedIn",
      copy: `Excited to share ${brandData.name} with you! 🚀

We're here to help you ${getIndustryGoal()} with innovative solutions tailored to your needs.

What makes us different?
✨ Personalized approach
🎯 Results-driven strategy
💡 Industry expertise

Ready to get started? Let's connect and explore how we can work together.`,
      hashtags: ["#Innovation", "#Business", "#Growth"],
    };

    setGeneratedPost(mockPost);
    setStep("preview");
  };

  const getIndustryGoal = () => {
    const goals: Record<string, string> = {
      health_wellness: "achieve your wellness goals",
      ecommerce: "find products you love",
      saas: "streamline your workflow",
      agency: "grow your brand",
      nonprofit: "make a difference",
      education: "reach your learning potential",
      real_estate: "find your dream property",
      hospitality: "create unforgettable experiences",
      professional_services: "succeed in your business",
      retail: "discover amazing products",
    };
    return goals[brandData.industry || ""] || "succeed";
  };

  const handleAddToQueue = () => {
    setStep("success");
  };

  const handleViewQueue = () => {
    onClose();
    navigate("/content-queue");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Intro Step */}
        {step === "intro" && (
          <>
            <DialogHeader>
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
              </div>
              <DialogTitle className="text-2xl text-center">
                Let's Create Your First Post!
              </DialogTitle>
              <DialogDescription className="text-center text-base">
                See AI in action with a pre-filled post idea based on your
                industry
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Pre-filled Topic */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border-2 border-indigo-200">
                <p className="text-sm font-bold text-slate-900 mb-2">
                  Suggested Topic:
                </p>
                <p className="text-lg font-bold text-indigo-900">
                  {getDefaultTopic()}
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <Badge variant="secondary">LinkedIn</Badge>
                  <Badge variant="secondary">
                    {brandData.industry || "General"}
                  </Badge>
                </div>
              </div>

              {/* What Happens */}
              <div className="space-y-3">
                <p className="text-sm font-bold text-slate-900">
                  What happens next:
                </p>
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-indigo-600">
                        1
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        AI generates your post
                      </p>
                      <p className="text-xs text-slate-600">
                        Using your brand voice and tone
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-indigo-600">
                        2
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        Review and edit if needed
                      </p>
                      <p className="text-xs text-slate-600">
                        Make it perfect before publishing
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-indigo-600">
                        3
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        Add to queue or schedule
                      </p>
                      <p className="text-xs text-slate-600">
                        Publish now or save for later
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Skip for Now
                </Button>
                <Button
                  onClick={handleGeneratePost}
                  className="flex-1 gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate with AI
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Generating Step */}
        {step === "generating" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl text-center">
                Creating Your Post...
              </DialogTitle>
            </DialogHeader>

            <div className="py-12">
              <div className="flex flex-col items-center justify-center space-y-6">
                <div className="relative">
                  <Loader className="w-16 h-16 text-indigo-600 animate-spin" />
                  <Sparkles className="w-6 h-6 text-purple-500 absolute top-0 right-0 animate-pulse" />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-lg font-bold text-slate-900">
                    Analyzing your brand...
                  </p>
                  <p className="text-sm text-slate-600">
                    This usually takes 2-3 seconds
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Preview Step */}
        {step === "preview" && generatedPost && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl text-center">
                Your First Post is Ready! 🎉
              </DialogTitle>
              <DialogDescription className="text-center">
                Review your AI-generated post below
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {/* Post Preview Card */}
              <Card className="border-2 border-indigo-200 bg-gradient-to-br from-white to-indigo-50">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">
                        {generatedPost.platform}
                      </Badge>
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <Eye className="w-4 h-4" />
                        Preview
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-sm text-slate-900 whitespace-pre-line leading-relaxed">
                        {generatedPost.copy}
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {generatedPost.hashtags.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs text-indigo-600 font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Features Highlight */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-xs text-blue-900 font-medium mb-3">
                  ✨ What we did:
                </p>
                <ul className="space-y-1 text-xs text-blue-800">
                  <li className="flex items-start gap-2">
                    <Check className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    Matched your brand tone ({brandData.industry ||
                      "industry"}{" "}
                    style)
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    Added relevant hashtags for better reach
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    Included clear call-to-action
                  </li>
                </ul>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep("intro")}
                  className="flex-1"
                >
                  Try Different Topic
                </Button>
                <Button
                  onClick={handleAddToQueue}
                  className="flex-1 gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                >
                  <Calendar className="w-4 h-4" />
                  Add to Queue
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Success Step */}
        {step === "success" && (
          <>
            <DialogHeader>
              <div className="flex items-center justify-center mb-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center animate-bounce">
                  <PartyPopper className="w-10 h-10 text-white" />
                </div>
              </div>
              <DialogTitle className="text-2xl text-center">
                Your First Post is Queued! 🎉
              </DialogTitle>
              <DialogDescription className="text-center text-base">
                Great job! Your content is ready for review and publishing.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Success Message */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200 text-center">
                <p className="text-lg font-bold text-green-900 mb-2">
                  ✓ Post Added to Content Queue
                </p>
                <p className="text-sm text-green-700">
                  You can edit, schedule, or publish it anytime from the queue
                </p>
              </div>

              {/* Next Steps */}
              <div className="space-y-3">
                <p className="text-sm font-bold text-slate-900">What's next:</p>
                <div className="space-y-2">
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-indigo-600">
                        1
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        Review your post in the queue
                      </p>
                      <p className="text-xs text-slate-600">
                        Make edits if needed
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-indigo-600">
                        2
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        Schedule or publish
                      </p>
                      <p className="text-xs text-slate-600">
                        Choose when to share it
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-indigo-600">
                        3
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        Create more content
                      </p>
                      <p className="text-xs text-slate-600">
                        Build your content calendar
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Go to Dashboard
                </Button>
                <Button
                  onClick={handleViewQueue}
                  className="flex-1 gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                >
                  View Content Queue
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
