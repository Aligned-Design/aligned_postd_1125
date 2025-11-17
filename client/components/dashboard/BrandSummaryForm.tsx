import { useState } from "react";
import { BrandGuide } from "@/types/brandGuide";
import { Sparkles, Check, X } from "lucide-react";

interface BrandSummaryFormProps {
  brand: BrandGuide;
  onUpdate: (updates: Partial<BrandGuide>) => void;
}

interface AIGeneratedVariation {
  purpose: string;
  mission: string;
  vision: string;
}

// Mock AI generation function
function generateAISummaryVariations(
  purpose: string,
  mission: string,
  vision: string
): AIGeneratedVariation[] {
  const variations: AIGeneratedVariation[] = [
    {
      purpose:
        purpose ||
        "To inspire and empower individuals to achieve their full potential through meaningful experiences and connections.",
      mission:
        mission ||
        "We create transformative solutions that make a tangible difference in the lives of our customers and communities.",
      vision:
        vision ||
        "To build a world where everyone has access to resources and support needed to thrive and succeed.",
    },
    {
      purpose:
        purpose ||
        "To democratize access and break down barriers that prevent people from reaching their goals.",
      mission:
        mission ||
        "We deliver innovative services with a commitment to excellence, integrity, and customer-centricity.",
      vision:
        vision ||
        "To be the trusted partner that enables growth, innovation, and positive change at scale.",
    },
    {
      purpose:
        purpose ||
        "To create lasting value by solving real problems with authentic, thoughtful solutions.",
      mission:
        mission ||
        "We foster meaningful connections and provide tools that help people succeed in their endeavors.",
      vision:
        vision ||
        "To shape a future where our brand is synonymous with quality, reliability, and positive impact.",
    },
  ];
  return variations;
}

export function BrandSummaryForm({ brand, onUpdate }: BrandSummaryFormProps) {
  const [showAIVariations, setShowAIVariations] = useState(false);
  const [aiVariations, setAiVariations] = useState<AIGeneratedVariation[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleChange = (
    field: keyof Pick<BrandGuide, "purpose" | "mission" | "vision">,
    value: string
  ) => {
    onUpdate({ [field]: value });
  };

  const handleAIReview = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const variations = generateAISummaryVariations(
        brand.purpose || "",
        brand.mission || "",
        brand.vision || ""
      );
      setAiVariations(variations);
      setShowAIVariations(true);
      setIsGenerating(false);
    }, 1200);
  };

  const handleApplyVariation = (variation: AIGeneratedVariation) => {
    onUpdate({
      purpose: variation.purpose,
      mission: variation.mission,
      vision: variation.vision,
      summaryReviewedByAI: true,
    });
    setShowAIVariations(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/50 backdrop-blur-xl rounded-xl border border-white/60 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-slate-900">Brand Summary</h2>
          <button
            onClick={handleAIReview}
            disabled={isGenerating}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-100 text-indigo-700 hover:bg-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold text-sm"
          >
            <Sparkles className="w-4 h-4" />
            {isGenerating ? "Reviewing..." : "AI Review"}
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-black text-slate-900 mb-2">
              Purpose
            </label>
            <p className="text-xs text-slate-600 mb-2">Why does your brand exist?</p>
            <textarea
              value={brand.purpose || ""}
              onChange={(e) => handleChange("purpose", e.target.value)}
              placeholder="e.g., To empower people to live healthier, more balanced lives..."
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-black text-slate-900 mb-2">
              Mission
            </label>
            <p className="text-xs text-slate-600 mb-2">What does your brand do?</p>
            <textarea
              value={brand.mission || ""}
              onChange={(e) => handleChange("mission", e.target.value)}
              placeholder="e.g., We provide accessible wellness services through community-focused care..."
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-black text-slate-900 mb-2">
              Vision
            </label>
            <p className="text-xs text-slate-600 mb-2">Where is your brand going?</p>
            <textarea
              value={brand.vision || ""}
              onChange={(e) => handleChange("vision", e.target.value)}
              placeholder="e.g., To become the trusted wellness partner for underserved communities..."
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* AI Variations Modal */}
      {showAIVariations && (
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border border-indigo-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              AI Suggestions
            </h3>
            <button
              onClick={() => setShowAIVariations(false)}
              className="text-slate-600 hover:text-slate-900 p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-sm text-slate-700 mb-4">
            Here are 3 variations of your brand summary. Click "Use This" to apply any variation, or continue refining your original version.
          </p>

          <div className="space-y-3">
            {aiVariations.map((variation, idx) => (
              <div key={idx} className="bg-white rounded-lg p-4 border border-slate-200 hover:border-indigo-300 transition-colors">
                <div className="space-y-2 mb-3 text-sm">
                  <div>
                    <p className="text-xs font-bold text-slate-600 mb-1">Purpose</p>
                    <p className="text-slate-700">{variation.purpose}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-600 mb-1">Mission</p>
                    <p className="text-slate-700">{variation.mission}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-600 mb-1">Vision</p>
                    <p className="text-slate-700">{variation.vision}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleApplyVariation(variation)}
                  className="w-full px-3 py-2 rounded-lg bg-lime-400 text-slate-900 hover:bg-lime-500 transition-colors font-bold text-sm flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Use This Variation
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
