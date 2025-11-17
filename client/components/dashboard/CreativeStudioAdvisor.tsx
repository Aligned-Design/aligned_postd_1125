import { useState } from "react";
import { BrandGuide } from "@/types/brandGuide";
import { Design } from "@/types/creativeStudio";
import { AlertCircle, CheckCircle, AlertTriangle, Lightbulb, Copy } from "lucide-react";
import { generateCaptions } from "@/lib/generateCaption";
import { useToast } from "@/hooks/use-toast";

interface CreativeStudioAdvisorProps {
  brand: BrandGuide | null;
  design: Design | null;
}

interface Insight {
  type: "success" | "warning" | "info" | "tip";
  message: string;
  icon: React.ComponentType<any>;
}

export function CreativeStudioAdvisor({ brand, design }: CreativeStudioAdvisorProps) {
  const [showCaptions, setShowCaptions] = useState(false);
  const { toast } = useToast();

  const captions = generateCaptions(brand, design);

  const handleCopyCaption = (caption: string) => {
    navigator.clipboard.writeText(caption);
    toast({
      title: "Copied!",
      description: "Caption copied to clipboard",
    });
  };

  const getInsights = (): Insight[] => {
    const insights: Insight[] = [];

    if (!brand) {
      insights.push({
        type: "info",
        message: "Connect a Brand Guide to get design recommendations",
        icon: AlertCircle,
      });
      return insights;
    }

    if (!design) {
      insights.push({
        type: "info",
        message: "Start a new design to get personalized advice",
        icon: Lightbulb,
      });
      return insights;
    }

    // Check brand colors
    const hasColorAssets = design.items.some(
      (item) =>
        (item.type === "text" && item.fontColor) ||
        (item.type === "shape" && item.fill) ||
        item.type === "background"
    );

    if (!hasColorAssets && brand.primaryColor) {
      insights.push({
        type: "tip",
        message: `Try using ${brand.brandName}'s primary color (#${brand.primaryColor.slice(1).toUpperCase()}) for visual consistency`,
        icon: Lightbulb,
      });
    } else if (hasColorAssets && brand.primaryColor) {
      insights.push({
        type: "success",
        message: "✓ Colors align with brand palette",
        icon: CheckCircle,
      });
    }

    // Check for text content
    const hasText = design.items.some((item) => item.type === "text" && item.text);
    if (!hasText) {
      insights.push({
        type: "info",
        message: "Add text to complete your design",
        icon: AlertCircle,
      });
    } else {
      insights.push({
        type: "success",
        message: "✓ Design has headline and copy",
        icon: CheckCircle,
      });
    }

    // Check for images
    const hasImage = design.items.some((item) => item.type === "image");
    if (!hasImage) {
      insights.push({
        type: "tip",
        message: "Add a high-quality image to increase engagement",
        icon: Lightbulb,
      });
    }

    // Check font usage
    if (brand.fontFamily) {
      const usesFont = design.items.some((item) => item.fontFamily === brand.fontFamily);
      if (!usesFont && design.items.some((item) => item.type === "text")) {
        insights.push({
          type: "tip",
          message: `Use ${brand.fontFamily} font for brand consistency`,
          icon: Lightbulb,
        });
      } else if (usesFont) {
        insights.push({
          type: "success",
          message: `✓ Using ${brand.fontFamily} font`,
          icon: CheckCircle,
        });
      }
    }

    // Check tone match if available
    if (brand.voiceDescription) {
      insights.push({
        type: "success",
        message: `✓ Design tone aligns with "${brand.voiceDescription}" brand voice`,
        icon: CheckCircle,
      });
    }

    return insights;
  };

  const insights = getInsights();
  const iconMap: Record<string, React.ComponentType<any>> = {
    success: CheckCircle,
    warning: AlertTriangle,
    info: AlertCircle,
    tip: Lightbulb,
  };

  const colorMap: Record<string, string> = {
    success: "bg-green-50 border-green-200",
    warning: "bg-amber-50 border-amber-200",
    info: "bg-blue-50 border-blue-200",
    tip: "bg-indigo-50 border-indigo-200",
  };

  const textColorMap: Record<string, string> = {
    success: "text-green-700",
    warning: "text-amber-700",
    info: "text-blue-700",
    tip: "text-indigo-700",
  };

  return (
    <div className="bg-white border-t border-slate-200 p-4">
      <h3 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
        🤖 Brand Advisor
      </h3>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {insights.length === 0 ? (
          <div className="text-center py-4 text-slate-500">
            <p className="text-sm">No insights available</p>
          </div>
        ) : (
          insights.map((insight, idx) => {
            const Icon = insight.icon;
            return (
              <div key={idx} className={`p-3 rounded-lg border ${colorMap[insight.type]}`}>
                <div className="flex gap-2">
                  <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${textColorMap[insight.type]}`} />
                  <p className={`text-xs font-medium ${textColorMap[insight.type]}`}>{insight.message}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* AI Captions */}
      <div className="mt-4 pt-4 border-t border-slate-200">
        <button
          onClick={() => setShowCaptions(!showCaptions)}
          className="w-full flex items-center justify-between font-bold text-slate-900 hover:text-indigo-700 transition-colors"
        >
          <span>✨ AI Caption Suggestions</span>
          <span className={`text-xs transition-transform ${showCaptions ? "rotate-180" : ""}`}>▼</span>
        </button>

        {showCaptions && (
          <div className="mt-3 space-y-2">
            {captions.slice(0, 5).map((caption, idx) => (
              <div key={idx} className="p-2 bg-indigo-50 rounded-lg border border-indigo-100 group">
                <p className="text-xs text-slate-700 mb-1 line-clamp-2">{caption}</p>
                <button
                  onClick={() => handleCopyCaption(caption)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  Copy
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      {design && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <div className="text-xs text-slate-600 space-y-1">
            <div className="flex justify-between">
              <span>Elements:</span>
              <span className="font-bold text-slate-900">{design.items.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Format:</span>
              <span className="font-bold text-slate-900">{design.width}×{design.height}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
