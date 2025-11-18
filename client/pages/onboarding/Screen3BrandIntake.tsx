import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ProgressiveDisclosure } from "@/components/ui/ProgressiveDisclosure";
import { ArrowRight, Loader, ChevronRight, Check } from "lucide-react";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { extractColorsFromImage, ColorSwatch } from "@/lib/colorExtraction";
import { PalettePreview } from "@/components/onboarding/PalettePreview";
import { Progress } from "@/components/ui/progress";
import { saveBrandGuideFromOnboarding } from "@/lib/onboarding-brand-sync";

interface BrandFormData {
  brandName: string;
  businessDescription: string;
  tone: string[];
  audience: string;
  goal: string;
  colors: string[];
  logo: File | null;
  extractedSwatches?: ColorSwatch[];
}

interface ScreenState {
  step: "questions" | "palette";
}

const TONE_OPTIONS = [
  { label: "Professional", emoji: "💼" },
  { label: "Playful", emoji: "🎉" },
  { label: "Inspiring", emoji: "✨" },
  { label: "Bold", emoji: "⚡" },
  { label: "Approachable", emoji: "🤝" },
];

// Color theme palettes - each palette has 2-3 colors
const COLOR_THEMES = [
  {
    name: "Professional",
    colors: ["#1F2937", "#3B82F6", "#E5E7EB"],
    emoji: "💼",
  },
  {
    name: "Vibrant",
    colors: ["#312E81", "#B9F227", "#EC4899"],
    emoji: "🌈",
  },
  {
    name: "Modern",
    colors: ["#0F172A", "#06B6D4", "#F43F5E"],
    emoji: "✨",
  },
  {
    name: "Earthy",
    colors: ["#92400E", "#D97706", "#F3E8FF"],
    emoji: "🌿",
  },
  {
    name: "Tech",
    colors: ["#1E293B", "#8B5CF6", "#10B981"],
    emoji: "🚀",
  },
  {
    name: "Bold",
    colors: ["#7C2D12", "#DC2626", "#FBBF24"],
    emoji: "⚡",
  },
  {
    name: "Minimal",
    colors: ["#000000", "#FFFFFF", "#64748B"],
    emoji: "◇",
  },
  {
    name: "Creative",
    colors: ["#EC4899", "#A855F7", "#0EA5E9"],
    emoji: "🎨",
  },
];

const AUDIENCE_OPTIONS = [
  "Startups & SMBs",
  "Enterprise",
  "Consumers (B2C)",
  "Mixed",
  "Other",
];

const GOAL_OPTIONS = [
  { label: "Grow followers", emoji: "📈" },
  { label: "Get leads", emoji: "🎯" },
  { label: "Strengthen brand consistency", emoji: "✅" },
  { label: "Other", emoji: "🎨" },
];

export default function Screen3BrandIntake() {
  const { user, setOnboardingStep, setBrandSnapshot } = useAuth();
  const [form, setForm] = useState<BrandFormData>({
    brandName: user?.businessName || "",
    businessDescription: "",
    tone: [],
    audience: "",
    goal: "",
    colors: [],
    logo: null,
  });
  const [screenState, setScreenState] = useState<ScreenState>({
    step: "questions",
  });
  const [isGenerating, setIsGenerating] = useState(false);

  // Calculate progress percentage
  const calculateProgress = () => {
    let score = 0;
    if (form.brandName) score += 20;
    if (form.businessDescription) score += 20;
    if (form.tone.length > 0) score += 15;
    if (form.audience) score += 15;
    if (form.goal) score += 15;
    if (form.colors.length > 0) score += 15;
    return score;
  };

  const progressPercent = calculateProgress();

  const toggleTone = (tone: string) => {
    setForm((prev) => ({
      ...prev,
      tone: prev.tone.includes(tone)
        ? prev.tone.filter((t) => t !== tone)
        : [...prev.tone, tone],
    }));
  };

  const toggleColor = (color: string) => {
    setForm((prev) => ({
      ...prev,
      colors: prev.colors.includes(color)
        ? prev.colors.filter((c) => c !== color)
        : [...prev.colors, color],
    }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setForm((prev) => ({ ...prev, logo: file }));

      // Extract colors from logo
      const swatches = await extractColorsFromImage(file);
      setForm((prev) => ({ ...prev, extractedSwatches: swatches }));

      // Show palette preview if colors were extracted
      if (swatches.length > 0) {
        setScreenState({ step: "palette" });
      }
    }
  };

  const handlePaletteConfirm = (selectedColors: string[]) => {
    setForm((prev) => ({ ...prev, colors: selectedColors }));
    setScreenState({ step: "questions" });
  };

  const handleRegenerateVariants = async () => {
    // In a real app, this would regenerate variants
  };

  const generateBrandSnapshot = async () => {
    setIsGenerating(true);

    try {
      const brandId = localStorage.getItem("aligned_brand_id");
      if (!brandId) {
        throw new Error("Brand ID not found. Please go back and complete brand creation.");
      }

      // Build brand snapshot from form data
      const snapshot = {
        name: form.brandName || "Your Brand",
        voice:
          form.businessDescription.slice(0, 150) || "Professional and engaging",
        tone: form.tone.length > 0 ? form.tone : ["Professional"],
        audience: form.audience || "Mixed",
        goal: form.goal || "Strengthen brand consistency",
        colors: form.colors.length > 0 ? form.colors : ["#312E81", "#B9F227"],
        logo: form.logo ? URL.createObjectURL(form.logo) : undefined,
        industry: user?.industry,
        extractedMetadata: {
          keywords: form.businessDescription ? form.businessDescription.split(/\s+/).slice(0, 5) : ["innovation", "quality", "trust"],
          coreMessaging: form.businessDescription ? [form.businessDescription] : [
            "We deliver value through innovation",
            "Customer success is our priority",
          ],
          dos: [
            "Always maintain brand consistency",
            "Use approved color palette",
            "Include clear call-to-action",
            "Engage authentically with audience",
          ],
          donts: [
            "Don't use off-brand colors or fonts",
            "Avoid overly promotional language",
            "Don't post without review if approval required",
            "Avoid controversial topics unrelated to brand",
          ],
          images: [],
          brandIdentity: form.businessDescription || `${form.brandName} is a ${user?.industry || "business"} that connects with customers through authentic communication.`,
        },
      };

      // ✅ CRITICAL: Save to backend via brand guide API
      // ✅ FIX: Use static import (already imported at top of file)
      await saveBrandGuideFromOnboarding(brandId, snapshot, form.brandName || "Your Brand");
      
      console.log("[Onboarding] ✅ Manual brand guide saved to backend", { brandId });

      setBrandSnapshot(snapshot);
      setIsGenerating(false);
      
      // Continue to brand summary review (step 5)
      setOnboardingStep(5);
    } catch (error) {
      console.error("[Onboarding] Failed to save manual brand guide:", error);
      setIsGenerating(false);
      alert(`Failed to save brand information: ${error instanceof Error ? error.message : "Unknown error"}\n\nPlease try again.`);
    }
  };

  // Minimum viable: just brand name required
  const canProceed = form.brandName.trim().length > 0;

  // Show palette preview if in palette step and swatches exist
  if (screenState.step === "palette" && form.extractedSwatches) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50/30 via-white to-blue-50/20 p-4">
        <div className="max-w-2xl mx-auto pt-6">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-black text-slate-900 mb-2">
              Your Brand Colors
            </h1>
            <p className="text-slate-600 font-medium">
              We've extracted these colors from your logo. Adjust or confirm to
              use them.
            </p>
          </div>

          <div className="bg-white/50 backdrop-blur-xl rounded-2xl border border-white/60 p-8 mb-8">
            <PalettePreview
              swatches={form.extractedSwatches}
              onConfirm={handlePaletteConfirm}
              onRegenerateVariants={handleRegenerateVariants}
            />
          </div>

          <button
            onClick={() => setScreenState({ step: "questions" })}
            className="w-full px-6 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-lg transition-colors"
          >
            ← Back to Questions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/30 via-white to-blue-50/20 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Indicator */}
        <OnboardingProgress currentStep={3} totalSteps={5} label="Your brand" className="pt-6" />

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-slate-900 mb-2">
            Tell us about your brand
          </h1>
          <p className="text-slate-600 font-medium">
            This helps us keep your content aligned and consistent
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-slate-700">
              {progressPercent}% Complete
            </span>
            <span className="text-xs text-slate-500">
              {progressPercent === 100
                ? "🎉 All set! You're doing great!"
                : "Fill in what you know—everything helps"}
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Form */}
        <div className="space-y-6 mb-8">
          {/* Q1: Brand Name (Required) */}
          <div className="bg-white/50 backdrop-blur-xl rounded-2xl border-2 border-indigo-200 p-6">
            <div className="flex items-start justify-between mb-3">
              <label className="block text-sm font-black text-slate-900">
                Let's start with the basics. What's your brand called? <span className="text-red-500">*</span>
              </label>
              {form.brandName && (
                <div className="flex items-center gap-1 text-green-600">
                  <Check className="w-4 h-4" />
                  <span className="text-xs font-bold">Done</span>
                </div>
              )}
            </div>
            <input
              type="text"
              value={form.brandName}
              onChange={(e) => setForm({ ...form, brandName: e.target.value })}
              placeholder="E.g., Your Brand Name"
              className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 bg-white/50 focus:border-indigo-500 focus:outline-none text-sm font-medium"
            />
          </div>

          {/* Q2: Business Description (Optional) */}
          <div className="bg-white/50 backdrop-blur-xl rounded-2xl border border-white/60 p-6">
            <div className="flex items-start justify-between mb-3">
              <label className="block text-sm font-black text-slate-900">
                Great! In one sentence, what do you do?{" "}
                <span className="text-slate-500 font-normal">(Optional)</span>
              </label>
              {form.businessDescription && (
                <div className="flex items-center gap-1 text-green-600">
                  <Check className="w-4 h-4" />
                  <span className="text-xs font-bold">Done</span>
                </div>
              )}
            </div>
            <textarea
              value={form.businessDescription}
              onChange={(e) =>
                setForm({ ...form, businessDescription: e.target.value })
              }
              placeholder="E.g., We help agencies create on-brand content at scale using AI..."
              className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 bg-white/50 focus:border-indigo-500 focus:outline-none text-sm font-medium resize-none"
              rows={3}
            />
          </div>

          {/* Q3: Tone (Optional) */}
          <div className="bg-white/50 backdrop-blur-xl rounded-2xl border border-white/60 p-6">
            <div className="flex items-start justify-between mb-4">
              <label className="block text-sm font-black text-slate-900">
                Now, how do you want to sound?{" "}
                <span className="text-slate-500 font-normal">(Optional)</span>
              </label>
              {form.tone.length > 0 && (
                <div className="flex items-center gap-1 text-green-600">
                  <Check className="w-4 h-4" />
                  <span className="text-xs font-bold">
                    {form.tone.length} selected
                  </span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {TONE_OPTIONS.map((option) => (
                <button
                  key={option.label}
                  onClick={() => toggleTone(option.label)}
                  className={`px-3 py-3 rounded-lg border-2 font-bold text-sm transition-all text-center ${
                    form.tone.includes(option.label)
                      ? "bg-indigo-100 border-indigo-500 text-indigo-700"
                      : "bg-white/50 border-slate-200 text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <div className="text-lg mb-1">{option.emoji}</div>
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Q4: Audience (Optional) */}
          <div className="bg-white/50 backdrop-blur-xl rounded-2xl border border-white/60 p-6">
            <div className="flex items-start justify-between mb-3">
              <label className="block text-sm font-black text-slate-900">
                Who are you talking to?{" "}
                <span className="text-slate-500 font-normal">(Optional)</span>
              </label>
              {form.audience && (
                <div className="flex items-center gap-1 text-green-600">
                  <Check className="w-4 h-4" />
                  <span className="text-xs font-bold">Done</span>
                </div>
              )}
            </div>
            <select
              value={form.audience}
              onChange={(e) => setForm({ ...form, audience: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 bg-white/50 focus:border-indigo-500 focus:outline-none font-medium"
            >
              <option value="">Select your audience...</option>
              {AUDIENCE_OPTIONS.map((aud) => (
                <option key={aud} value={aud}>
                  {aud}
                </option>
              ))}
            </select>
          </div>

          {/* Q5: Goal (Optional) */}
          <div className="bg-white/50 backdrop-blur-xl rounded-2xl border border-white/60 p-6">
            <div className="flex items-start justify-between mb-4">
              <label className="block text-sm font-black text-slate-900">
                What's your main goal?{" "}
                <span className="text-slate-500 font-normal">(Optional)</span>
              </label>
              {form.goal && (
                <div className="flex items-center gap-1 text-green-600">
                  <Check className="w-4 h-4" />
                  <span className="text-xs font-bold">Done</span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {GOAL_OPTIONS.map((option) => (
                <button
                  key={option.label}
                  onClick={() => setForm({ ...form, goal: option.label })}
                  className={`px-4 py-3 rounded-lg border-2 font-bold text-sm transition-all text-left flex items-center gap-3 ${
                    form.goal === option.label
                      ? "bg-indigo-100 border-indigo-500 text-indigo-700"
                      : "bg-white/50 border-slate-200 text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <span className="text-xl">{option.emoji}</span>
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Q6: Logo Upload (Optional) */}
          <div className="bg-white/50 backdrop-blur-xl rounded-2xl border border-white/60 p-6">
            <div className="flex items-start justify-between mb-3">
              <label className="block text-sm font-black text-slate-900">
                6️⃣ Upload your logo{" "}
                <span className="text-slate-500 font-normal">(Optional)</span>
              </label>
              {form.logo && (
                <div className="flex items-center gap-1 text-green-600">
                  <Check className="w-4 h-4" />
                  <span className="text-xs font-bold">Done</span>
                </div>
              )}
            </div>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-indigo-400 transition-colors cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
                id="logo-input"
              />
              <label htmlFor="logo-input" className="cursor-pointer block">
                {form.logo ? (
                  <div className="flex flex-col items-center">
                    <img
                      src={URL.createObjectURL(form.logo)}
                      alt="Logo preview"
                      className="w-16 h-16 object-contain mb-2"
                    />
                    <p className="text-sm font-bold text-slate-700">
                      {form.logo.name}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Click to change
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-2xl mb-2">📸</p>
                    <p className="text-sm font-bold text-slate-700">
                      Click to upload
                    </p>
                    <p className="text-xs text-slate-500">
                      PNG, JPG up to 5MB • AI will extract your brand colors
                    </p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Q7: Colors (Optional) */}
          <div className="bg-white/50 backdrop-blur-xl rounded-2xl border border-white/60 p-6">
            <div className="flex items-start justify-between mb-4">
              <label className="block text-sm font-black text-slate-900">
                7️⃣ Choose a color theme{" "}
                <span className="text-slate-500 font-normal">(Optional)</span>
              </label>
              {form.colors.length > 0 && (
                <div className="flex items-center gap-1 text-green-600">
                  <Check className="w-4 h-4" />
                  <span className="text-xs font-bold">
                    {form.colors.length} colors
                  </span>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-600 mb-4">
              Pick a pre-made palette or upload a logo for AI color extraction
            </p>

            {/* Theme Palettes */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {COLOR_THEMES.map((theme) => (
                <button
                  key={theme.name}
                  onClick={() => setForm({ ...form, colors: theme.colors })}
                  className={`p-3 rounded-lg border-2 transition-all text-center ${
                    form.colors.length === theme.colors.length &&
                    theme.colors.every((c) => form.colors.includes(c))
                      ? "bg-indigo-100 border-indigo-500"
                      : "bg-white/50 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="text-xl mb-2">{theme.emoji}</div>
                  <p className="text-xs font-bold text-slate-700 mb-2">
                    {theme.name}
                  </p>
                  <div className="flex gap-1 justify-center">
                    {theme.colors.map((color) => (
                      <div
                        key={color}
                        className="w-4 h-4 rounded border border-slate-300"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </button>
              ))}
            </div>

            {/* Selected Colors Preview */}
            {form.colors.length > 0 && (
              <div className="border-t pt-4 mt-4">
                <p className="text-xs font-bold text-slate-700 mb-3">
                  Selected Colors:
                </p>
                <div className="flex flex-wrap gap-3">
                  {form.colors.map((color) => (
                    <div
                      key={color}
                      className="flex flex-col items-center gap-1"
                    >
                      <div
                        className="w-12 h-12 rounded-lg border-2 border-slate-900 shadow-md"
                        style={{ backgroundColor: color }}
                      />
                      <code className="text-xs font-mono text-slate-600">
                        {color}
                      </code>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setForm({ ...form, colors: [] })}
                  className="text-xs text-slate-600 hover:text-slate-900 mt-3 font-medium underline"
                >
                  Clear selection
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8">
          <p className="text-xs text-blue-800 font-medium">
            💡 <strong>Pro tip:</strong> You only need to fill in your brand
            name to continue. The more details you provide, the better AI will
            understand your brand. You can always refine this later from
            Settings → Brand Profile.
          </p>
        </div>

        {/* CTA Button */}
        <button
          onClick={generateBrandSnapshot}
          disabled={!canProceed || isGenerating}
          className={`w-full px-6 py-4 font-black rounded-lg transition-all flex items-center justify-center gap-2 group ${
            canProceed && !isGenerating
              ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:shadow-lg"
              : "bg-slate-200 text-slate-500 cursor-not-allowed"
          }`}
        >
          {isGenerating ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Analyzing your brand...
            </>
          ) : (
            <>
              Generate My Brand DNA
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
