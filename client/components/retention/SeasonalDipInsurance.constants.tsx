import { CheckCircle } from "lucide-react";

interface SeasonalStrategy {
  name: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
}

interface SeasonalDipData {
  season: "summer" | "winter" | "spring" | "fall";
  type: "warning" | "active" | "recovery";
  title: string;
  description: string;
  expectedDrop?: string;
  reason?: string;
  strategies?: SeasonalStrategy[];
  goal?: string;
  cantControl?: string[];
  actualPerformance?: {
    engagementDrop: number;
    followerChange: number;
    industryAverage: number;
  };
  recoveryMessage?: string;
}

export const summerSlumpWarning: SeasonalDipData = {
  season: "summer",
  type: "warning",
  title: "Summer slump incoming",
  description: "Heads up: Engagement typically drops during summer months",
  expectedDrop: "15-25%",
  reason: "Audiences are traveling, less time on social",
  strategies: [
    {
      name: "Increase posting frequency",
      description: "More touchpoints = more engagement",
      icon: <CheckCircle className="h-4 w-4" />,
      enabled: true,
    },
    {
      name: 'Shift to "aspirational" content',
      description: "Vacations, leisure, summer themes",
      icon: <CheckCircle className="h-4 w-4" />,
      enabled: true,
    },
    {
      name: "Optimize timing with AI",
      description: "Post when your audience IS online",
      icon: <CheckCircle className="h-4 w-4" />,
      enabled: true,
    },
    {
      name: "Focus on conversion",
      description: "Engagement may dip, but leads should stay stable",
      icon: <CheckCircle className="h-4 w-4" />,
      enabled: true,
    },
  ],
  goal: "Maintain growth vs. seasonal decline",
  cantControl: ["Global trends", "Competitor actions", "Algorithm changes"],
};

export const summerRecovery: SeasonalDipData = {
  season: "summer",
  type: "recovery",
  title: "Summer's over, let's bounce back",
  description: "Great news! You outperformed during the slow season",
  actualPerformance: {
    engagementDrop: -18,
    followerChange: 0,
    industryAverage: -3,
  },
  recoveryMessage:
    "Your Aligned AI content kept your audience engaged during the slow period. While engagement was down 18%, you lost 0 followers (vs. competitors who lost 3%). Back-to-school season is incoming—preparing optimized content plan...",
};

