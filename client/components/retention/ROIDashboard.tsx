import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Clock,
  DollarSign,
  TrendingUp,
  Users,
  Zap,
  BarChart3,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/design-system";

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

interface ROIDashboardProps {
  data: ROIData;
  className?: string;
}

export function ROIDashboard({ data, className }: ROIDashboardProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 mb-2">
          Your Aligned Impact
        </h1>
        <p className="text-slate-600">
          See the concrete value and time you're saving with Aligned AI
        </p>
      </div>

      {/* Time Saved Section */}
      <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-indigo-600" />
            Time Saved This Month
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Big Number */}
          <div className="text-center">
            <p className="text-6xl font-black text-indigo-600 mb-2">
              {data.monthlyTimeSaved.total}
            </p>
            <p className="text-2xl font-bold text-slate-900">hours saved</p>
            <Badge className="mt-2 gap-1 bg-green-100 text-green-700 border-green-200">
              <TrendingUp className="h-3 w-3" />
              Growing as you let AI do more
            </Badge>
          </div>

          {/* Breakdown */}
          <div className="space-y-3">
            {data.monthlyTimeSaved.breakdown.map((item, idx) => (
              <div
                key={idx}
                className="bg-white rounded-lg p-4 border border-indigo-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        item.color,
                      )}
                    >
                      {item.icon}
                    </div>
                    <span className="font-bold text-slate-900">
                      {item.category}
                    </span>
                  </div>
                  <span className="text-2xl font-black text-indigo-600">
                    {item.hours}h
                  </span>
                </div>
                <Progress
                  value={(item.hours / data.monthlyTimeSaved.total) * 100}
                  className="h-2"
                />
              </div>
            ))}
          </div>

          {/* Dollar Value */}
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-green-900 uppercase tracking-wider mb-1">
                  Dollar Value
                </p>
                <p className="text-xs text-green-700">
                  {data.monthlyTimeSaved.total}h × $
                  {data.monthlyTimeSaved.hourlyRate}/hour
                </p>
              </div>
              <p className="text-4xl font-black text-green-600">
                ${data.monthlyTimeSaved.dollarValue.toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ROI vs Subscription */}
      <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            ROI vs Subscription
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Monthly Cost */}
            <div className="bg-white rounded-lg p-6 border border-green-200">
              <p className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-2">
                Monthly Cost
              </p>
              <p className="text-4xl font-black text-slate-900 mb-1">
                ${data.roiComparison.subscriptionCost}
              </p>
              <p className="text-xs text-slate-600">Aligned AI subscription</p>
            </div>

            {/* Time Saved Value */}
            <div className="bg-white rounded-lg p-6 border border-green-200">
              <p className="text-sm font-bold text-green-700 uppercase tracking-wider mb-2">
                Time Saved Value
              </p>
              <p className="text-4xl font-black text-green-600 mb-1">
                ${data.roiComparison.timeSavedValue.toLocaleString()}
              </p>
              <p className="text-xs text-green-700">Monthly value generated</p>
            </div>
          </div>

          {/* Net ROI */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-8 text-white text-center">
            <p className="text-sm font-bold uppercase tracking-wider mb-2 opacity-90">
              Net ROI This Month
            </p>
            <p className="text-5xl font-black mb-2">
              +${data.roiComparison.netROI.toLocaleString()}
            </p>
            <div className="flex items-center justify-center gap-4 mt-4">
              <Badge className="bg-white/20 text-white border-white/30">
                Payback: {data.roiComparison.paybackDays} days
              </Badge>
              <Badge className="bg-white/20 text-white border-white/30">
                {data.roiComparison.multiple}x ROI
              </Badge>
            </div>
          </div>

          {/* Visual */}
          <div className="bg-white rounded-lg p-6 border border-green-200">
            <p className="text-center text-2xl font-black text-green-600 mb-4">
              You've saved {data.roiComparison.multiple}× your subscription cost
              this month
            </p>
            <Progress
              value={
                (data.roiComparison.timeSavedValue /
                  data.roiComparison.subscriptionCost) *
                100
              }
              className="h-4"
            />
          </div>
        </CardContent>
      </Card>

      {/* Engagement Growth */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-indigo-600" />
            Engagement Growth
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg p-6 border border-pink-200">
              <p className="text-xs font-bold text-pink-700 uppercase tracking-wider mb-2">
                Engagement Rate
              </p>
              <p className="text-3xl font-black text-pink-600 mb-1">
                {data.engagementGrowth.engagementRate.current}%
              </p>
              <Badge className="gap-1 bg-pink-100 text-pink-700 border-pink-200">
                <TrendingUp className="h-3 w-3" />+
                {data.engagementGrowth.engagementRate.vsMonth1}% vs month 1
              </Badge>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
              <p className="text-xs font-bold text-purple-700 uppercase tracking-wider mb-2">
                Followers
              </p>
              <p className="text-3xl font-black text-purple-600 mb-1">
                {data.engagementGrowth.followers.current.toLocaleString()}
              </p>
              <Badge className="gap-1 bg-purple-100 text-purple-700 border-purple-200">
                <TrendingUp className="h-3 w-3" />+
                {data.engagementGrowth.followers.vsMonth1}% vs month 1
              </Badge>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
              <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2">
                Reach
              </p>
              <p className="text-3xl font-black text-blue-600 mb-1">
                {data.engagementGrowth.reach.current.toLocaleString()}
              </p>
              <Badge className="gap-1 bg-blue-100 text-blue-700 border-blue-200">
                <TrendingUp className="h-3 w-3" />+
                {data.engagementGrowth.reach.vsMonth1}% vs month 1
              </Badge>
            </div>
          </div>

          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <div className="flex gap-3">
              <CheckCircle className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-indigo-900 text-sm mb-1">
                  Attribution
                </h4>
                <p className="text-indigo-800 text-sm">
                  {data.engagementGrowth.attribution}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparison */}
      <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-amber-600" />
            vs. Hiring a Social Media Manager
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-lg p-6 border-2 border-slate-300">
              <p className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-2">
                Social Media Manager
              </p>
              <p className="text-4xl font-black text-slate-900 mb-2">
                ${data.vsHiring.socialMediaManager.toLocaleString()}/mo
              </p>
              <p className="text-xs text-slate-600">Average full-time cost</p>
            </div>

            <div className="bg-white rounded-lg p-6 border-2 border-indigo-500">
              <p className="text-sm font-bold text-indigo-700 uppercase tracking-wider mb-2">
                Postd
              </p>
              <p className="text-4xl font-black text-indigo-600 mb-2">
                ${data.vsHiring.alignedCost}/mo
              </p>
              <p className="text-xs text-indigo-700">Marketing platform</p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-amber-600 to-yellow-600 rounded-xl p-8 text-white text-center">
            <p className="text-sm font-bold uppercase tracking-wider mb-2 opacity-90">
              Annual Savings
            </p>
            <p className="text-5xl font-black mb-3">
              ~${data.vsHiring.annualSavings.toLocaleString()}
            </p>
            <p className="text-sm opacity-90">{data.vsHiring.description}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Placeholder/demo data - TODO: Replace with real API data when ROI tracking is implemented
// This is used in insights-roi/page.tsx as placeholder data until the ROI API is ready
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
