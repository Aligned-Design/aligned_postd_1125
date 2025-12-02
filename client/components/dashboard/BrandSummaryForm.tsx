import { useState } from "react";
import { BrandGuide } from "@/types/brandGuide";
import { Sparkles, Check, X, Plus } from "lucide-react";

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
  const [newValueInput, setNewValueInput] = useState("");
  const [newPainPointInput, setNewPainPointInput] = useState("");

  const handleChange = (
    field: keyof Pick<BrandGuide, "purpose" | "mission" | "vision">,
    value: string
  ) => {
    onUpdate({ [field]: value });
  };

  const handleIdentityUpdate = (field: "values" | "targetAudience" | "painPoints", value: any) => {
    onUpdate({
      identity: {
        ...brand.identity,
        [field]: value,
      },
    });
  };

  const handleAddValue = () => {
    if (!newValueInput.trim()) return;
    const currentValues = brand.identity?.values || [];
    if (!currentValues.includes(newValueInput.trim())) {
      handleIdentityUpdate("values", [...currentValues, newValueInput.trim()]);
    }
    setNewValueInput("");
  };

  const handleRemoveValue = (value: string) => {
    const currentValues = brand.identity?.values || [];
    handleIdentityUpdate("values", currentValues.filter((v) => v !== value));
  };

  const handleAddPainPoint = () => {
    if (!newPainPointInput.trim()) return;
    const currentPainPoints = brand.identity?.painPoints || [];
    if (!currentPainPoints.includes(newPainPointInput.trim())) {
      handleIdentityUpdate("painPoints", [...currentPainPoints, newPainPointInput.trim()]);
    }
    setNewPainPointInput("");
  };

  const handleRemovePainPoint = (painPoint: string) => {
    const currentPainPoints = brand.identity?.painPoints || [];
    handleIdentityUpdate("painPoints", currentPainPoints.filter((p) => p !== painPoint));
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

      {/* Identity: Core Values, Target Audience, Pain Points */}
      <div className="bg-white/50 backdrop-blur-xl rounded-xl border border-white/60 p-6">
        <h3 className="text-lg font-black text-slate-900 mb-4">Brand Identity</h3>

        {/* Core Values */}
        <div className="mb-6">
          <label className="block text-sm font-black text-slate-900 mb-2">
            Core Values
          </label>
          <p className="text-xs text-slate-600 mb-2">What principles guide your brand?</p>
          <div className="flex flex-wrap gap-2 mb-2">
            {(brand.identity?.values || []).map((value) => (
              <span
                key={value}
                className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-bold"
              >
                {value}
                <button
                  onClick={() => handleRemoveValue(value)}
                  className="hover:text-indigo-900 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newValueInput}
              onChange={(e) => setNewValueInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddValue();
                }
              }}
              placeholder="e.g., Sustainability, Authenticity, Quality"
              className="flex-1 px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
            <button
              onClick={handleAddValue}
              className="px-3 py-2 rounded-lg bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors font-bold text-sm flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
        </div>

        {/* Target Audience */}
        <div className="mb-6">
          <label className="block text-sm font-black text-slate-900 mb-2">
            Target Audience
          </label>
          <p className="text-xs text-slate-600 mb-2">Who is your primary target audience?</p>
          <textarea
            value={brand.identity?.targetAudience || ""}
            onChange={(e) => handleIdentityUpdate("targetAudience", e.target.value)}
            placeholder="e.g., Small business owners aged 30-50 who value efficiency and quality..."
            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
            rows={3}
          />
        </div>

        {/* Pain Points */}
        <div>
          <label className="block text-sm font-black text-slate-900 mb-2">
            Pain Points
          </label>
          <p className="text-xs text-slate-600 mb-2">What challenges does your audience face?</p>
          <div className="flex flex-wrap gap-2 mb-2">
            {(brand.identity?.painPoints || []).map((painPoint) => (
              <span
                key={painPoint}
                className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-bold"
              >
                {painPoint}
                <button
                  onClick={() => handleRemovePainPoint(painPoint)}
                  className="hover:text-red-900 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newPainPointInput}
              onChange={(e) => setNewPainPointInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddPainPoint();
                }
              }}
              placeholder="e.g., Lack of time, Budget constraints, Information overload"
              className="flex-1 px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
            <button
              onClick={handleAddPainPoint}
              className="px-3 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors font-bold text-sm flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
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
