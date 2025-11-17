import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Heart,
  ExternalLink,
  Download,
  TrendingUp,
  MessageCircle,
  Sparkles,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/design-system";

interface PerformanceMetric {
  icon: React.ReactNode;
  label: string;
  value: string;
  change: number;
  color: string;
  explanation: string;
}

interface TopPost {
  id: string;
  thumbnail?: string;
  caption: string;
  platform: string;
  date: string;
  reach: number;
  engagement: number;
  sentiment: "positive" | "neutral" | "mixed";
}

interface ClientAnalyticsDashboardProps {
  brandName: string;
  agencyName: string;
  className?: string;
}

export function ClientAnalyticsDashboard({
  brandName,
  agencyName,
  className,
}: ClientAnalyticsDashboardProps) {
  const performanceMetrics: PerformanceMetric[] = [
    {
      icon: <Users className="h-6 w-6" />,
      label: "Followers",
      value: "8,250",
      change: 3,
      color: "text-purple-600 bg-purple-100",
      explanation: "You gained 240 new followers this month",
    },
    {
      icon: <Heart className="h-6 w-6" />,
      label: "Average Engagement",
      value: "245",
      change: 12,
      color: "text-pink-600 bg-pink-100",
      explanation: "likes/post (customers love your content!)",
    },
    {
      icon: <ExternalLink className="h-6 w-6" />,
      label: "Link Clicks",
      value: "1,200",
      change: 45,
      color: "text-blue-600 bg-blue-100",
      explanation: "People clicking through to your website",
    },
    {
      icon: <MessageCircle className="h-6 w-6" />,
      label: "Comments",
      value: "156",
      change: 18,
      color: "text-green-600 bg-green-100",
      explanation: "Customers love your authentic tone!",
    },
  ];

  const topPost: TopPost = {
    id: "1",
    thumbnail: "/placeholder.svg",
    caption:
      "Behind the scenes: How we create custom designs for every client...",
    platform: "Instagram",
    date: "Nov 15, 2024",
    reach: 12400,
    engagement: 892,
    sentiment: "positive",
  };

  const brandFidelityTrend = {
    current: 92,
    previous: 87,
    improvement: 5,
    example: "Your comments are 18% more positive since we adjusted tone",
  };

  return (
    <div className={className}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 mb-2">
          Your Content Performance
        </h1>
        <p className="text-slate-600">
          {brandName}'s social media impact — managed by {agencyName}
        </p>
      </div>

      {/* Performance Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {performanceMetrics.map((metric, idx) => (
          <Card key={idx} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={cn("p-3 rounded-full", metric.color)}>
                  {metric.icon}
                </div>
                <Badge
                  variant={metric.change > 0 ? "default" : "secondary"}
                  className="gap-1 bg-green-50 text-green-700 border-green-200"
                >
                  <TrendingUp className="h-3 w-3" />+{metric.change}%
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">
                  {metric.label}
                </p>
                <p className="text-3xl font-black text-slate-900 mb-2">
                  {metric.value}
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {metric.explanation}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Top Performing Post */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Top Performing Post This Month
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-6">
            {/* Post Preview */}
            <div className="flex-shrink-0 w-64 h-64 bg-slate-200 rounded-lg overflow-hidden">
              <img
                src={topPost.thumbnail}
                alt="Top post"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Post Details */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <Badge variant="outline" className="mb-2">
                    {topPost.platform}
                  </Badge>
                  <p className="text-slate-700 mb-2 leading-relaxed">
                    {topPost.caption}
                  </p>
                  <p className="text-sm text-slate-500">{topPost.date}</p>
                </div>
              </div>

              {/* Performance Stats */}
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Eye className="h-4 w-4 text-blue-600" />
                    <p className="text-xs font-bold text-blue-900 uppercase">
                      Reach
                    </p>
                  </div>
                  <p className="text-2xl font-black text-slate-900">
                    {topPost.reach.toLocaleString()}
                  </p>
                </div>

                <div className="p-4 bg-pink-50 rounded-lg border border-pink-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Heart className="h-4 w-4 text-pink-600" />
                    <p className="text-xs font-bold text-pink-900 uppercase">
                      Engagement
                    </p>
                  </div>
                  <p className="text-2xl font-black text-slate-900">
                    {topPost.engagement}
                  </p>
                </div>

                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-1">
                    <MessageCircle className="h-4 w-4 text-green-600" />
                    <p className="text-xs font-bold text-green-900 uppercase">
                      Sentiment
                    </p>
                  </div>
                  <p className="text-2xl font-black text-slate-900 capitalize">
                    {topPost.sentiment}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Brand Fidelity Improvement */}
      <Card className="mb-8 border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-600" />
            How We're Improving Your Brand Voice
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-8">
            {/* Progress Circle */}
            <div className="flex-shrink-0">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-slate-200"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${brandFidelityTrend.current * 3.51} 351`}
                    className="text-indigo-600 transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-3xl font-black text-slate-900">
                    {brandFidelityTrend.current}%
                  </span>
                  <span className="text-xs text-slate-600">Brand Fit</span>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <Badge
                  variant="default"
                  className="gap-1 bg-green-100 text-green-700 border-green-200"
                >
                  <TrendingUp className="h-3 w-3" />+
                  {brandFidelityTrend.improvement}% improvement
                </Badge>
                <span className="text-sm text-slate-600">
                  vs last month ({brandFidelityTrend.previous}%)
                </span>
              </div>

              <p className="text-slate-700 mb-3 leading-relaxed">
                Your brand voice is becoming more consistent and authentic
                across all platforms.
              </p>

              <div className="p-3 bg-white rounded-lg border border-indigo-200">
                <p className="text-sm text-indigo-900">
                  <strong>Example:</strong> {brandFidelityTrend.example}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Download Report CTA */}
      <Card className="border-2 border-indigo-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 mb-1">
                Monthly Performance Report
              </h3>
              <p className="text-sm text-slate-600">
                Download your complete analytics report to share with your team
              </p>
            </div>
            <Button className="gap-2">
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
