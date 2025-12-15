import {
  Zap,
  BarChart3,
  TrendingUp,
} from "lucide-react";

interface TimeSaving {
  category: string;
  hours: number;
  icon: React.ReactNode;
  color: string;
}

interface ROIData {
  monthlyTimeSaved: {
    total: number;
    breakdown: TimeSaving[];
    hourlyRate: number;
    dollarValue: number;
  };
  roiComparison: {
    subscriptionCost: number;
    timeSavedValue: number;
    netROI: number;
    paybackDays: number;
    multiple: number;
  };
  engagementGrowth: {
    engagementRate: {
      current: number;
      vsMonth1: number;
    };
    followers: {
      current: number;
      vsMonth1: number;
    };
    reach: {
      current: number;
      vsMonth1: number;
    };
    attribution: string;
  };
  vsHiring: {
    socialMediaManager: number;
    alignedCost: number;
    annualSavings: number;
    description: string;
  };
}

// ✅ DEV/TEST ONLY: Mock ROI data for development and testing
// This is NOT used in production - insights-roi/page.tsx shows "coming soon" instead
// Keep for Storybook examples and tests only
export const mockROIData: ROIData = {
  monthlyTimeSaved: {
    total: 18,
    breakdown: [
      {
        category: "AI Content Generation",
        hours: 12,
        icon: <Zap className="h-5 w-5 text-white" />,
        color: "bg-indigo-600",
      },
      {
        category: "Design Templating",
        hours: 4,
        icon: <BarChart3 className="h-5 w-5 text-white" />,
        color: "bg-purple-600",
      },
      {
        category: "Analytics Review",
        hours: 2,
        icon: <TrendingUp className="h-5 w-5 text-white" />,
        color: "bg-blue-600",
      },
    ],
    hourlyRate: 75,
    dollarValue: 1350,
  },
  roiComparison: {
    subscriptionCost: 199,
    timeSavedValue: 1350,
    netROI: 1151,
    paybackDays: 5,
    multiple: 6.8,
  },
  engagementGrowth: {
    engagementRate: {
      current: 5.4,
      vsMonth1: 34,
    },
    followers: {
      current: 8240,
      vsMonth1: 12,
    },
    reach: {
      current: 45200,
      vsMonth1: 28,
    },
    attribution:
      "78% increase from optimized posting times (Aligned AI) + improved tone (AI learning)",
  },
  vsHiring: {
    socialMediaManager: 3500,
    alignedCost: 199,
    annualSavings: 40000,
    description: "You have a $40k social media team for $2,388/year",
  },
};

