import {
  CheckCircle,
  Calendar,
  Clock,
  BarChart3,
  HelpCircle,
} from "lucide-react";

interface AnalysisFactor {
  name: string;
  status: "positive" | "neutral" | "warning" | "unknown";
  description: string;
  icon: React.ReactNode;
}

interface MetricChange {
  metric: string;
  change: number;
  isPositive: boolean;
  factors: AnalysisFactor[];
  recommendation: string;
  learnMoreUrl?: string;
}

// Example usage data
export const mockMetricChanges: MetricChange[] = [
  {
    metric: "Engagement",
    change: -20,
    isPositive: false,
    factors: [
      {
        name: "Content quality",
        status: "positive",
        description: "Same as last week",
        icon: <CheckCircle className="h-3 w-3" />,
      },
      {
        name: "Posting frequency",
        status: "warning",
        description: "Down to 1 post (vs usual 3)",
        icon: <Calendar className="h-3 w-3" />,
      },
      {
        name: "Posting time",
        status: "warning",
        description: "Shifted later (usual 10 AM → 3 PM)",
        icon: <Clock className="h-3 w-3" />,
      },
      {
        name: "Platform factor",
        status: "unknown",
        description: "Instagram algorithm may have changed",
        icon: <BarChart3 className="h-3 w-3" />,
      },
      {
        name: "External factor",
        status: "neutral",
        description: "Holidays may suppress engagement",
        icon: <HelpCircle className="h-3 w-3" />,
      },
    ],
    recommendation: "Post 3× this week to compensate for lower frequency",
    learnMoreUrl: "/help/engagement-analysis",
  },
];

