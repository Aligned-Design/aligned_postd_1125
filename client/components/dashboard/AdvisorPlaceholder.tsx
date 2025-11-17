import { Sparkles, RefreshCw } from "lucide-react";
import { BrandGuide } from "@/types/brandGuide";

interface AdvisorPlaceholderProps {
  brand?: BrandGuide;
}

export function AdvisorPlaceholder({ brand }: AdvisorPlaceholderProps) {
  const insights = brand
    ? [
        {
          icon: "🎤",
          title: "Tone Profile",
          message: `Your tone is ${brand.voiceAndTone?.friendlinessLevel || brand.friendlinessLevel || 50}% friendly and ${brand.voiceAndTone?.confidenceLevel || brand.confidenceLevel || 50}% confident. This creates a warm yet authoritative voice perfect for building trust.`,
          color: "indigo",
        },
        {
          icon: "✨",
          title: "Brand Alignment",
          message:
            (brand.voiceAndTone?.tone || brand.tone || []).length > 3
              ? `Your keywords (${(brand.voiceAndTone?.tone || brand.tone || []).slice(0, 3).join(", ")}...) align well with your mission. Consider emphasizing these in your messaging.`
              : "Add more tone keywords to refine your brand voice further.",
          color: "blue",
        },
        {
          icon: "📊",
          title: "Completeness",
          message: `Your guide is ${brand.completionPercentage}% complete. ${
            brand.completionPercentage < 100
              ? `Add ${[
                  !brand.personas?.length && "personas",
                  !brand.goals?.length && "goals",
                  !(brand.contentRules?.guardrails || brand.guardrails || [])?.length && "guardrails",
                ]
                  .filter(Boolean)
                  .join(", ")} to unlock full potential.`
              : "Complete! Your brand guide is fully defined."
          }`,
          color: "purple",
        },
      ]
    : [
        {
          icon: "🎨",
          title: "Getting Started",
          message: "Choose AI-generated or manual setup to begin defining your brand.",
          color: "indigo",
        },
        {
          icon: "✨",
          title: "Smart Guidance",
          message: "As you build, the Advisor will surface insights and alignment recommendations.",
          color: "blue",
        },
        {
          icon: "🚀",
          title: "Iterative Refinement",
          message: "Your brand guide will evolve as you add more data and insights.",
          color: "purple",
        },
      ];

  const colorClasses: Record<string, string> = {
    indigo: "bg-indigo-50 border-indigo-200 text-indigo-900",
    blue: "bg-blue-50 border-blue-200 text-blue-900",
    purple: "bg-purple-50 border-purple-200 text-purple-900",
  };

  return (
    <div className="bg-white/50 backdrop-blur-xl rounded-xl border border-white/60 p-6 sticky top-24 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-black text-slate-900">Aligned Advisor</h3>
        <Sparkles className="w-5 h-5 text-indigo-600" />
      </div>

      <p className="text-xs text-slate-600">
        {brand ? "AI insights based on your brand data" : "Personalized guidance as you build"}
      </p>

      <div className="space-y-3">
        {insights.map((insight, idx) => (
          <div key={idx} className={`p-3 rounded-lg border transition-all hover:shadow-md ${colorClasses[insight.color]}`}>
            <p className="text-sm font-black mb-1">{insight.icon} {insight.title}</p>
            <p className="text-xs leading-relaxed opacity-90">{insight.message}</p>
          </div>
        ))}
      </div>

      {brand && (
        <button className="w-full px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors font-bold text-sm flex items-center justify-center gap-2 mt-4">
          <RefreshCw className="w-4 h-4" />
          Refresh Insights
        </button>
      )}
    </div>
  );
}
