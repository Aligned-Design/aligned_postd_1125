import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { BrandDNAVisualization } from "@/components/onboarding/BrandDNAVisualization";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { useConfetti } from "@/hooks/useConfetti";
import { Sparkles, Loader2 } from "lucide-react";

export default function Screen4BrandSnapshot() {
  const { brandSnapshot, setBrandSnapshot, user, setOnboardingStep } = useAuth();
  const { fire } = useConfetti();
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Celebrate when brand snapshot loads
  useEffect(() => {
    if (brandSnapshot) {
      // Fire confetti after a short delay for better UX
      const timer = setTimeout(() => {
        fire({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.5 },
          colors: ["#632bf0", "#c084fc", "#e2e8f0", "#a855f7"], // primary-light, purple-400, slate-200, purple-500 (design tokens)
        });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [brandSnapshot, fire]);

  const handleRegenerate = async () => {
    if (!user?.website) return;

    setIsRegenerating(true);
    try {
      // Call API to regenerate brand snapshot
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(
        `${supabaseUrl}/functions/v1/process-brand-intake`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            brandId: localStorage.getItem("aligned_brand_id") || "",
            websiteUrl: user.website,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        const newSnapshot = {
          name: user.businessName || brandSnapshot?.name || "Your Brand",
          voice: result.brandKit?.voice_summary?.style || brandSnapshot?.voice || "Professional and clear",
          tone: result.brandKit?.voice_summary?.tone || brandSnapshot?.tone || ["Professional"],
          audience: result.brandKit?.voice_summary?.audience || brandSnapshot?.audience || "Your target audience",
          goal: brandSnapshot?.goal || "Grow brand awareness",
          colors: result.brandKit?.colors
            ? [
                result.brandKit.colors.primary,
                result.brandKit.colors.secondary,
                result.brandKit.colors.accent,
              ].filter(Boolean)
            : brandSnapshot?.colors || ["#632bf0"], // primary-light (design token)
          industry: user.industry || brandSnapshot?.industry,
          extractedMetadata: {
            keywords: result.brandKit?.keyword_themes || [],
            coreMessaging: [],
            dos: [],
            donts: result.brandKit?.voice_summary?.avoid || [],
          },
        };
        setBrandSnapshot(newSnapshot);
        fire({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.5 },
        });
      }
    } catch (err) {
      // Error already handled in catch block
    } finally {
      setIsRegenerating(false);
    }
  };

  if (!brandSnapshot) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-indigo-50/30 via-white to-blue-50/20">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-slate-600 font-medium">
            Loading your brand profile...
          </p>
        </div>
      </div>
    );
  }

  const handleEdit = () => {
    // Show edit modal (handled in Screen5BrandSummaryReview)
    // This screen is being replaced, but keeping for backward compatibility
    setOnboardingStep(6);
  };

  const handleConfirm = () => {
    // Continue to weekly focus selector
    setOnboardingStep(6);
  };

  // Transform brandSnapshot to brandData format expected by BrandDNAVisualization
  const brandData = {
    name: brandSnapshot.name || "Your Brand",
    colors: brandSnapshot.colors || [],
    tone: brandSnapshot.tone || [],
    voiceExample: brandSnapshot.voice,
    audience: brandSnapshot.audience,
    goal: brandSnapshot.goal,
    industry: brandSnapshot.industry,
    extractedMetadata: brandSnapshot.extractedMetadata || {
      keywords: [],
      coreMessaging: [],
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
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/30 via-white to-blue-50/20 p-4">
      <div className="max-w-4xl mx-auto pt-6 pb-12">
        {/* Progress Indicator */}
        <OnboardingProgress currentStep={5} totalSteps={10} label="Your brand is ready" />

        {/* Regenerate Button */}
        <div className="mb-6 flex justify-end">
          <button
            onClick={handleRegenerate}
            disabled={isRegenerating || !user?.website}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold text-sm"
          >
            {isRegenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Regenerating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Regenerate With AI
              </>
            )}
          </button>
        </div>

        <BrandDNAVisualization
          brandData={brandData}
          onEdit={handleEdit}
          onConfirm={handleConfirm}
        />
      </div>
    </div>
  );
}
