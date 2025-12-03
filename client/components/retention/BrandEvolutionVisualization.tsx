import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Palette, FileText, Sparkles } from "lucide-react";
import { cn } from "@/lib/design-system";

interface VoiceProfile {
  trait: string;
  month1: number;
  now: number;
  change: string;
}

interface ColorPalette {
  color: string;
  name: string;
}

interface ContentTypePerformance {
  type: string;
  month1Engagement: number;
  nowEngagement: number;
  change: number;
}

interface BrandEvolutionData {
  voiceProfile: VoiceProfile[];
  colorEvolution: {
    month1: ColorPalette[];
    now: ColorPalette[];
  };
  contentPerformance: ContentTypePerformance[];
  insight: string;
  systemExplanation: string;
}

interface BrandEvolutionVisualizationProps {
  data: BrandEvolutionData;
  className?: string;
}

export function BrandEvolutionVisualization({
  data,
  className,
}: BrandEvolutionVisualizationProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 mb-2">
          How Your Brand Voice Has Evolved
        </h1>
        <p className="text-slate-600">
          Watch your brand personality grow stronger over time
        </p>
      </div>

      {/* Voice Profile - Radar Chart Simulation */}
      <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-600" />
            Voice Profile Evolution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
            {/* Month 1 */}
            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <Badge variant="secondary" className="mb-4">
                Month 1
              </Badge>
              <div className="space-y-3">
                {data.voiceProfile.map((trait, idx) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-700">
                        {trait.trait}
                      </span>
                      <span className="text-sm font-bold text-slate-900">
                        {trait.month1}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-slate-400 rounded-full transition-all"
                        style={{ width: `${trait.month1}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Now */}
            <div className="bg-white rounded-xl p-6 border-2 border-indigo-500">
              <Badge className="mb-4 bg-indigo-600">Now</Badge>
              <div className="space-y-3">
                {data.voiceProfile.map((trait, idx) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-900">
                        {trait.trait}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-indigo-600">
                          {trait.now}%
                        </span>
                        <Badge className="text-xs gap-1 bg-green-100 text-green-700 border-green-200">
                          {trait.change}
                        </Badge>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-indigo-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full transition-all"
                        style={{ width: `${trait.now}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Insight */}
          <div className="bg-indigo-100 border border-indigo-300 rounded-lg p-4">
            <div className="flex gap-3">
              <Sparkles className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-indigo-900 text-sm mb-1">
                  Key Insight
                </h4>
                <p className="text-indigo-800 text-sm">{data.insight}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Color Evolution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-pink-600" />
            Color Preference Evolution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Month 1 Colors */}
            <div>
              <Badge variant="secondary" className="mb-4">
                Month 1
              </Badge>
              <div className="grid grid-cols-3 gap-3">
                {data.colorEvolution.month1.map((color, idx) => (
                  <div key={idx} className="text-center">
                    <div
                      className="w-full h-20 rounded-lg mb-2 border border-slate-200"
                      style={{ backgroundColor: color.color }}
                    />
                    <p className="text-xs text-slate-600">{color.name}</p>
                  </div>
                ))}
              </div>
              <p className="text-sm text-slate-600 mt-4">
                Corporate, professional palette
              </p>
            </div>

            {/* Now Colors */}
            <div>
              <Badge className="mb-4 bg-pink-600">Now</Badge>
              <div className="grid grid-cols-3 gap-3">
                {data.colorEvolution.now.map((color, idx) => (
                  <div key={idx} className="text-center">
                    <div
                      className="w-full h-20 rounded-lg mb-2 border-2 border-pink-500 shadow-lg"
                      style={{ backgroundColor: color.color }}
                    />
                    <p className="text-xs font-medium text-slate-900">
                      {color.name}
                    </p>
                  </div>
                ))}
              </div>
              <p className="text-sm text-pink-700 mt-4 font-medium">
                Warmer, more approachable palette
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Type Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Content Type Performance Trending
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.contentPerformance.map((content, idx) => (
              <div
                key={idx}
                className="bg-slate-50 rounded-lg p-4 border border-slate-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-slate-900">{content.type}</h4>
                  <Badge
                    className={cn(
                      "gap-1",
                      content.change > 0
                        ? "bg-green-100 text-green-700 border-green-200"
                        : "bg-red-100 text-red-700 border-red-200",
                    )}
                  >
                    {content.change > 0 ? "+" : ""}
                    {content.change}%
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Month 1</p>
                    <p className="text-2xl font-black text-slate-700">
                      {content.month1Engagement}
                    </p>
                    <p className="text-xs text-slate-600">avg engagement</p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-700 mb-1 font-medium">
                      Now
                    </p>
                    <p className="text-2xl font-black text-blue-600">
                      {content.nowEngagement.toLocaleString()}
                    </p>
                    <p className="text-xs text-blue-700">avg engagement</p>
                  </div>
                </div>

                {/* Visual Bar Comparison */}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div
                    className="h-2 bg-slate-300 rounded-full"
                    style={{
                      width: `${(content.month1Engagement / content.nowEngagement) * 100}%`,
                    }}
                  />
                  <div className="h-2 bg-blue-600 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Explanation */}
      <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
        <CardContent className="pt-6 pb-6">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
            </div>
            <div>
              <h3 className="font-bold text-green-900 text-lg mb-2">
                How We Made These Improvements
              </h3>
              <p className="text-green-800 leading-relaxed">
                {data.systemExplanation}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ✅ DEV/TEST ONLY: Mock brand evolution data for development and testing
// This is NOT used in production - insights-roi/page.tsx shows "coming soon" instead
// Keep for Storybook examples and tests only
export const mockBrandEvolutionData: BrandEvolutionData = {
  voiceProfile: [
    { trait: "Professional", month1: 80, now: 75, change: "-5%" },
    { trait: "Warm", month1: 60, now: 70, change: "+10%" },
    { trait: "Data-Driven", month1: 50, now: 65, change: "+15%" },
    { trait: "Witty", month1: 40, now: 55, change: "+15%" },
  ],
  colorEvolution: {
    month1: [
      { color: "#3B82F6", name: "Blue" },
      { color: "#6B7280", name: "Gray" },
      { color: "#1F2937", name: "Dark Gray" },
    ],
    now: [
      { color: "#3B82F6", name: "Blue" },
      { color: "#F97316", name: "Orange" },
      { color: "#10B981", name: "Green" },
    ],
  },
  contentPerformance: [
    {
      type: "Blog-style Posts",
      month1Engagement: 400,
      nowEngagement: 520,
      change: 30,
    },
    {
      type: "Testimonials + Reels",
      month1Engagement: 650,
      nowEngagement: 1200,
      change: 85,
    },
    {
      type: "Behind-the-Scenes",
      month1Engagement: 320,
      nowEngagement: 890,
      change: 178,
    },
  ],
  insight:
    "Your brand is becoming more human and less corporate. Engagement +34% as a result.",
  systemExplanation:
    "Based on your top 100 posts and audience feedback, we updated how we generate content for you. Your audience responded positively to warmer tones and personal stories, so we adjusted the AI to prioritize these elements while maintaining your professional foundation.",
};
