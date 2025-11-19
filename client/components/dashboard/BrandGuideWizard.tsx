import { useState } from "react";
import { BrandGuide } from "@/types/brandGuide";
import { Sparkles, BookOpen, ArrowRight, Zap } from "lucide-react";

interface BrandGuideWizardProps {
  onComplete: (brand: BrandGuide, method: "ai_generated" | "detailed") => void;
  onSkip: () => void;
}

type WizardStep = "method_select" | "ai_form" | "manual_confirm";

// Mock AI generation function
function generateAIBrandGuide(brandName: string): Partial<BrandGuide> {
  return {
    purpose: `To empower and inspire our audience while delivering exceptional value in everything we do.`,
    mission: `We create innovative solutions that make a meaningful difference in the lives of our customers and communities.`,
    vision: `To become the most trusted and beloved brand that our customers think of when they need quality, reliability, and authentic connection.`,
    tone: ["Friendly", "Confident", "Professional", "Empathetic"],
    friendlinessLevel: 75,
    formalityLevel: 60,
    confidenceLevel: 80,
    voiceDescription: `We speak with warmth and confidence, making complex ideas accessible and relatable. Our communication is honest, grounded in expertise, and always focused on what's best for our audience.`,
  };
}

export function BrandGuideWizard({
  onComplete,
  onSkip,
}: BrandGuideWizardProps) {
  const [step, setStep] = useState<WizardStep>("method_select");
  const [brandName, setBrandName] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleAIGenerate = () => {
    if (!brandName.trim()) return;

    setIsGenerating(true);
    setTimeout(() => {
      const aiData = generateAIBrandGuide(brandName);
      // ✅ FIX: Create BrandGuide with required nested structure
      const newBrand: BrandGuide = {
        id: `brand-${Date.now()}`,
        brandName,
        brandId: `brand-${Date.now()}`,
        // Required nested structure
        identity: {
          name: brandName,
          businessType: undefined,
          industryKeywords: [],
          competitors: undefined,
          sampleHeadlines: undefined,
        },
        voiceAndTone: {
          tone: aiData.tone || [],
          friendlinessLevel: aiData.friendlinessLevel || 50,
          formalityLevel: aiData.formalityLevel || 50,
          confidenceLevel: aiData.confidenceLevel || 50,
          voiceDescription: aiData.voiceDescription || "",
        },
        visualIdentity: {
          colors: ["#292661", "#12b76a"], // primary-dark, success (design tokens)
          typography: {
            heading: "Inter",
            body: "Inter",
            source: "google",
          },
          photographyStyle: {
            mustInclude: [],
            mustAvoid: [],
          },
          logoUrl: "",
          visualNotes: "",
        },
        contentRules: {
          neverDo: [], // ✅ FIX: Add required neverDo property
          guardrails: [],
        },
        // Legacy flat fields for backward compatibility
        purpose: aiData.purpose || "",
        mission: aiData.mission || "",
        vision: aiData.vision || "",
        tone: aiData.tone || [],
        friendlinessLevel: aiData.friendlinessLevel || 50,
        formalityLevel: aiData.formalityLevel || 50,
        confidenceLevel: aiData.confidenceLevel || 50,
        voiceDescription: aiData.voiceDescription || "",
        logoUrl: "",
        primaryColors: ["#292661"], // primary-dark (design token)
        secondaryColors: ["#12b76a"], // success (design token)
        fontFamily: "Inter",
        visualNotes: "",
        personas: [],
        goals: [],
        guardrails: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completionPercentage: 40,
        setupMethod: "ai_generated",
        version: 1,
      };
      onComplete(newBrand, "ai_generated");
      setIsGenerating(false);
    }, 1500);
  };

  const handleManualStart = () => {
    if (!brandName.trim()) return;

    // ✅ FIX: Create BrandGuide with required nested structure
    const newBrand: BrandGuide = {
      id: `brand-${Date.now()}`,
      brandName,
      brandId: `brand-${Date.now()}`,
      // Required nested structure
      identity: {
        name: brandName,
        businessType: undefined,
        industryKeywords: [],
        competitors: undefined,
        sampleHeadlines: undefined,
      },
      voiceAndTone: {
        tone: [],
        friendlinessLevel: 50,
        formalityLevel: 50,
        confidenceLevel: 50,
        voiceDescription: "",
      },
      visualIdentity: {
        colors: ["#3b82f6", "#12b76a"], // blue-500, success (design tokens)
        typography: {
          heading: "Inter",
          body: "Inter",
          source: "google",
        },
        photographyStyle: {
          mustInclude: [],
          mustAvoid: [],
        },
        logoUrl: "",
        visualNotes: "",
      },
      contentRules: {
        neverDo: [], // ✅ FIX: Add required neverDo property
        guardrails: [],
      },
      // Legacy flat fields for backward compatibility
      purpose: "",
      mission: "",
      vision: "",
      tone: [],
      friendlinessLevel: 50,
      formalityLevel: 50,
      confidenceLevel: 50,
      voiceDescription: "",
      logoUrl: "",
      primaryColors: ["#3b82f6"], // blue-500 (design token)
      secondaryColors: ["#12b76a"], // success (design token)
      fontFamily: "Inter",
      visualNotes: "",
      personas: [],
      goals: [],
      guardrails: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completionPercentage: 0,
      setupMethod: "detailed",
      version: 1,
    };

    onComplete(newBrand, "detailed");
  };

  if (step === "method_select") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50/30 via-white to-blue-50/20 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="text-5xl mb-4">🎨</div>
            <h1 className="text-4xl font-black text-slate-900 mb-3">Create Your Brand Guide</h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Choose how you'd like to build your brand guide. We can generate suggestions with AI or you can craft it yourself.
            </p>
          </div>

          {/* Brand Name Input */}
          <div className="mb-8 max-w-md mx-auto">
            <input
              type="text"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="Enter your brand name"
              className="w-full px-6 py-3 rounded-lg bg-white text-slate-700 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-0 text-lg font-bold placeholder:text-slate-400"
              onKeyDown={(e) => {
                if (e.key === "Enter" && brandName.trim()) {
                  handleAIGenerate();
                }
              }}
            />
          </div>

          {/* Method Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* AI Path */}
            <button
              onClick={handleAIGenerate}
              disabled={!brandName.trim() || isGenerating}
              className="group relative overflow-hidden rounded-2xl border-2 border-indigo-300 bg-gradient-to-br from-indigo-50 to-blue-50 p-8 text-left hover:border-indigo-500 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-blue-500 opacity-0 group-hover:opacity-5 transition-opacity" />

              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-indigo-100 rounded-xl">
                    <Sparkles className="w-6 h-6 text-indigo-600" />
                  </div>
                  <Zap className="w-5 h-5 text-amber-500" />
                </div>

                <h3 className="text-2xl font-black text-slate-900 mb-2">Quick Setup</h3>
                <p className="text-slate-600 mb-6">
                  Get suggestions for your brand summary, tone, and guidelines. Perfect for getting started quickly.
                </p>

                <div className="space-y-2 mb-6 text-sm text-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="text-lime-500 font-bold">✓</span>
                    <span>Auto-generate purpose, mission, vision</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lime-500 font-bold">✓</span>
                    <span>Suggested tone & voice attributes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lime-500 font-bold">✓</span>
                    <span>~2 minutes to get started</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-indigo-600 font-bold">
                  {isGenerating ? "Generating..." : "Get Started"}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </button>

            {/* Manual Path */}
            <button
              onClick={handleManualStart}
              disabled={!brandName.trim()}
              className="group relative overflow-hidden rounded-2xl border-2 border-slate-300 bg-gradient-to-br from-slate-50 to-slate-100 p-8 text-left hover:border-slate-500 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-slate-400 to-slate-500 opacity-0 group-hover:opacity-5 transition-opacity" />

              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-slate-200 rounded-xl">
                    <BookOpen className="w-6 h-6 text-slate-700" />
                  </div>
                  <span className="text-xs font-bold text-slate-500 uppercase">Detailed Path</span>
                </div>

                <h3 className="text-2xl font-black text-slate-900 mb-2">Detailed Setup</h3>
                <p className="text-slate-600 mb-6">
                  Craft your brand guide step-by-step with full control. Best for brands with established identities.
                </p>

                <div className="space-y-2 mb-6 text-sm text-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="text-lime-500 font-bold">✓</span>
                    <span>Full customization & control</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lime-500 font-bold">✓</span>
                    <span>Add personas, goals, guardrails</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lime-500 font-bold">✓</span>
                    <span>Thoughtful, intentional process</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-slate-700 font-bold">
                  Start Building
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </button>
          </div>

          {/* Skip Link */}
          <div className="text-center">
            <button
              onClick={onSkip}
              className="text-slate-600 hover:text-slate-900 font-bold text-sm transition-colors"
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
