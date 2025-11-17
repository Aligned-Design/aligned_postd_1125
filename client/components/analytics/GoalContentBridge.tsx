import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Target,
  TrendingUp,
  Calendar,
  Zap,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/design-system";
import { useNavigate } from "react-router-dom";

interface ContentMix {
  type: string;
  emoji: string;
  percentage: number;
  reason: string;
  impactMetric: string;
}

interface GoalData {
  id: string;
  title: string;
  current: number;
  target: number;
  unit: string;
  deadline: string;
  daysRemaining: number;
  recommendation: string;
  contentMix: ContentMix[];
}

interface GoalContentBridgeProps {
  className?: string;
}

export function GoalContentBridge({ className }: GoalContentBridgeProps) {
  const navigate = useNavigate();
  const [goals] = useState<GoalData[]>([
    {
      id: "1",
      title: "Reach 10k followers by Q1 2026",
      current: 7200,
      target: 10000,
      unit: "followers",
      deadline: "March 31, 2026",
      daysRemaining: 75,
      recommendation:
        "Post 3×/week (vs current 2×) + prioritize educational content",
      contentMix: [
        {
          type: "Educational",
          emoji: "📚",
          percentage: 40,
          reason: "tutorials, tips",
          impactMetric: "engagement +22%",
        },
        {
          type: "Emotional",
          emoji: "❤️",
          percentage: 30,
          reason: "storytelling",
          impactMetric: "follow growth +18%",
        },
        {
          type: "Promotional",
          emoji: "🎯",
          percentage: 30,
          reason: "offers",
          impactMetric: "conversion +12%",
        },
      ],
    },
  ]);

  const handleSyncToContentPlan = (goalId: string) => {
    // Track analytics
    if (window.posthog) {
      window.posthog.capture("goal_synced_to_plan", { goalId });
    }

    // Navigate to creative studio with preset
    navigate("/creative-studio?goal=" + goalId);
  };

  if (goals.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Goals &amp; Content Strategy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Target className="h-12 w-12 mx-auto mb-3 text-slate-300" />
            <p className="font-medium text-slate-600 mb-2">No goals set yet</p>
            <p className="text-sm text-slate-500 mb-4">
              Set your first goal to get content recommendations
            </p>
            <Button className="gap-2">
              <Target className="h-4 w-4" />
              Create Your First Goal
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <Target className="h-6 w-6 text-indigo-600" />
          Goals &amp; Content Strategy
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          Content mix to help you hit your targets
        </p>
      </div>

      <div className="space-y-6">
        {goals.map((goal) => {
          const progressPercentage = Math.round(
            (goal.current / goal.target) * 100,
          );
          const isOnTrack = progressPercentage >= 70;

          return (
            <Card key={goal.id} className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2 flex items-center gap-2">
                      <Target className="h-5 w-5 text-indigo-600" />
                      {goal.title}
                    </CardTitle>
                    <div className="flex items-center gap-3 text-sm">
                      <Badge variant="outline" className="gap-1">
                        <Calendar className="h-3 w-3" />
                        {goal.daysRemaining} days left
                      </Badge>
                      <span className="text-slate-600">
                        Due: {new Date(goal.deadline).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <Badge
                    variant={isOnTrack ? "default" : "secondary"}
                    className="gap-1"
                  >
                    <TrendingUp className="h-3 w-3" />
                    {progressPercentage}%
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="pt-6">
                {/* Progress Section */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-600">
                      Progress
                    </span>
                    <span className="text-sm font-bold text-slate-900">
                      {goal.current.toLocaleString()} /{" "}
                      {goal.target.toLocaleString()} {goal.unit}
                    </span>
                  </div>
                  <Progress value={progressPercentage} className="h-3" />
                </div>

                {/* AI Recommendation */}
                <Card className="mb-6 border-indigo-200 bg-indigo-50">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex gap-3">
                      <Sparkles className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-indigo-900 mb-1 text-sm">
                          AI Recommendation
                        </h4>
                        <p className="text-indigo-800 text-sm">
                          {goal.recommendation}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Suggested Content Mix */}
                <div className="mb-6">
                  <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-500" />
                    Suggested Content Mix
                  </h4>
                  <div className="space-y-3">
                    {goal.contentMix.map((mix, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200"
                      >
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center text-xl">
                          {mix.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-slate-900 text-sm">
                              {mix.type}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {mix.percentage}%
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-600">
                            <span>{mix.reason}</span>
                            <span className="text-slate-400">•</span>
                            <span className="text-green-600 font-medium">
                              {mix.impactMetric}
                            </span>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <Progress
                            value={mix.percentage}
                            className="h-2 w-16"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Button */}
                <Button
                  onClick={() => handleSyncToContentPlan(goal.id)}
                  className="w-full gap-2"
                  size="lg"
                >
                  <Zap className="h-4 w-4" />
                  Sync to Content Plan
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <p className="text-xs text-slate-500 text-center mt-2">
                  Auto-applies this mix to next week's content queue
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
