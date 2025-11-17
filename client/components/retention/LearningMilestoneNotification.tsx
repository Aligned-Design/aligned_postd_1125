import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Sparkles,
  TrendingUp,
  ArrowRight,
  CheckCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/design-system";
import { useState } from "react";

interface ToneProfile {
  name: string;
  before: number;
  after: number;
}

interface PostComparison {
  beforePreview: {
    thumbnail?: string;
    caption: string;
    engagement: number;
  };
  afterPreview: {
    thumbnail?: string;
    caption: string;
    engagement: number;
  };
  improvement: string;
}

interface LearningMilestoneData {
  daysSinceStart: number;
  brandFidelityImprovement: {
    before: number;
    after: number;
    improvement: number;
  };
  topPerformerType: string;
  audienceInsight: string;
  toneProfileChanges: ToneProfile[];
  postExample?: PostComparison;
  whatChanged: string;
}

interface LearningMilestoneNotificationProps {
  milestone: LearningMilestoneData;
  onDismiss?: () => void;
  className?: string;
}

export function LearningMilestoneNotification({
  milestone,
  onDismiss,
  className,
}: LearningMilestoneNotificationProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [showPostComparison, setShowPostComparison] = useState(false);

  return (
    <Card
      className={cn(
        "border-2 border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50",
        className,
      )}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <Badge className="bg-indigo-600">
                Day {milestone.daysSinceStart} Milestone
              </Badge>
            </div>
            <CardTitle className="text-2xl font-black text-slate-900">
              ✨ We've gotten {milestone.brandFidelityImprovement.improvement}%
              better at your brand voice
            </CardTitle>
            <p className="text-slate-600 mt-2">
              Our AI has been learning from your content. Here's what improved.
            </p>
          </div>
          {onDismiss && (
            <Button variant="ghost" size="sm" onClick={onDismiss}>
              ✕
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Brand Fidelity Score Improvement */}
        <div className="bg-white rounded-xl p-6 border border-indigo-200">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-600" />
            Brand Fidelity Score
          </h3>

          <div className="flex items-center gap-8">
            {/* Before Circle */}
            <div className="flex-shrink-0">
              <div className="relative w-24 h-24">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="none"
                    className="text-slate-200"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="none"
                    strokeDasharray={`${milestone.brandFidelityImprovement.before * 2.51} 251`}
                    className="text-slate-400"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-xl font-black text-slate-700">
                    {milestone.brandFidelityImprovement.before}
                  </span>
                  <span className="text-xs text-slate-500">Before</span>
                </div>
              </div>
            </div>

            <ArrowRight className="h-8 w-8 text-indigo-600 flex-shrink-0" />

            {/* After Circle */}
            <div className="flex-shrink-0">
              <div className="relative w-24 h-24">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="none"
                    className="text-slate-200"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="none"
                    strokeDasharray={`${milestone.brandFidelityImprovement.after * 2.51} 251`}
                    className="text-indigo-600"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-2xl font-black text-indigo-600">
                    {milestone.brandFidelityImprovement.after}
                  </span>
                  <span className="text-xs text-slate-500">Now</span>
                </div>
              </div>
            </div>

            {/* Improvement Badge */}
            <div className="flex-1">
              <Badge className="gap-1 bg-green-100 text-green-700 border-green-200 text-lg px-4 py-2">
                <TrendingUp className="h-4 w-4" />+
                {milestone.brandFidelityImprovement.improvement}% Improvement
              </Badge>
            </div>
          </div>
        </div>

        {/* Key Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 border border-slate-200">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">
                  Top Performer Type
                </h4>
                <p className="text-slate-700 text-sm">
                  {milestone.topPerformerType}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-slate-200">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">
                  Audience Insight
                </h4>
                <p className="text-slate-700 text-sm">
                  {milestone.audienceInsight}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tone Profile Changes */}
        <div>
          <Button
            variant="ghost"
            onClick={() => setShowDetails(!showDetails)}
            className="w-full justify-between p-0 h-auto hover:bg-transparent"
          >
            <h3 className="font-bold text-slate-900">Updated Tone Profile</h3>
            {showDetails ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>

          {showDetails && (
            <div className="mt-4 space-y-3">
              {milestone.toneProfileChanges.map((tone, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-lg p-4 border border-slate-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-slate-900">
                      {tone.name}
                    </span>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-slate-600">{tone.before}%</span>
                      <ArrowRight className="h-3 w-3 text-slate-400" />
                      <span className="font-bold text-indigo-600">
                        {tone.after}%
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Progress
                      value={tone.before}
                      className="h-2 flex-1 bg-slate-200"
                    />
                    <Progress
                      value={tone.after}
                      className="h-2 flex-1 bg-indigo-100"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Post Example */}
        {milestone.postExample && (
          <div>
            <Button
              variant="ghost"
              onClick={() => setShowPostComparison(!showPostComparison)}
              className="w-full justify-between p-0 h-auto hover:bg-transparent mb-4"
            >
              <h3 className="font-bold text-slate-900">
                Example: Post We Improved
              </h3>
              {showPostComparison ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>

            {showPostComparison && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Before */}
                <div className="bg-slate-50 border-2 border-slate-300 rounded-lg p-4">
                  <Badge variant="secondary" className="mb-3">
                    Before
                  </Badge>
                  {milestone.postExample.beforePreview.thumbnail && (
                    <div className="w-full h-32 bg-slate-200 rounded-lg mb-3 overflow-hidden">
                      <img
                        src={milestone.postExample.beforePreview.thumbnail}
                        alt="Before"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <p className="text-sm text-slate-700 mb-2 line-clamp-3">
                    {milestone.postExample.beforePreview.caption}
                  </p>
                  <p className="text-xs text-slate-600">
                    {milestone.postExample.beforePreview.engagement} engagement
                  </p>
                </div>

                {/* After */}
                <div className="bg-indigo-50 border-2 border-indigo-500 rounded-lg p-4">
                  <Badge className="mb-3 bg-indigo-600">
                    After (AI Optimized)
                  </Badge>
                  {milestone.postExample.afterPreview.thumbnail && (
                    <div className="w-full h-32 bg-slate-200 rounded-lg mb-3 overflow-hidden">
                      <img
                        src={milestone.postExample.afterPreview.thumbnail}
                        alt="After"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <p className="text-sm text-slate-900 mb-2 line-clamp-3">
                    {milestone.postExample.afterPreview.caption}
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-slate-700">
                      {milestone.postExample.afterPreview.engagement} engagement
                    </p>
                    <Badge className="gap-1 bg-green-100 text-green-700 border-green-200">
                      {milestone.postExample.improvement}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* What Changed Explanation */}
        <div className="bg-indigo-100 border border-indigo-300 rounded-lg p-4">
          <h4 className="font-bold text-indigo-900 mb-2">What Changed</h4>
          <p className="text-indigo-800 text-sm leading-relaxed">
            {milestone.whatChanged}
          </p>
        </div>

        {/* CTA */}
        <div className="flex gap-3">
          <Button className="flex-1 gap-2">
            View Full Brand Evolution
            <ArrowRight className="h-4 w-4" />
          </Button>
          {onDismiss && (
            <Button variant="outline" onClick={onDismiss}>
              Got it!
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Example usage data
export const mockLearningMilestone: LearningMilestoneData = {
  daysSinceStart: 30,
  brandFidelityImprovement: {
    before: 84,
    after: 94,
    improvement: 23,
  },
  topPerformerType: "Reels + testimonials (now prioritized)",
  audienceInsight:
    "Your followers are 40% more likely to comment on educational content",
  toneProfileChanges: [
    { name: "Professional", before: 80, after: 75 },
    { name: "Warm", before: 60, after: 70 },
    { name: "Witty", before: 40, after: 65 },
  ],
  postExample: {
    beforePreview: {
      thumbnail: "/placeholder.svg",
      caption: "Check out our new product features...",
      engagement: 450,
    },
    afterPreview: {
      thumbnail: "/placeholder.svg",
      caption:
        "Behind the scenes: Here's how we built this feature based on YOUR feedback...",
      engagement: 603,
    },
    improvement: "+34%",
  },
  whatChanged:
    "Based on your top 30 posts, we learned you connect more with customers when you include personal stories.",
};
