/**
 * Screen 7: Generate 7 Days of Multi-Channel Content
 * 
 * Automatically generates:
 * - 5 social posts
 * - 1 email
 * - 1 Google Business Profile post
 * - 1 blog/caption expansion (optional)
 * 
 * Shows magical loading sequence.
 */

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Sparkles, CheckCircle2, Loader2, Instagram, Mail, MapPin, FileText } from "lucide-react";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { useConfetti } from "@/hooks/useConfetti";

interface GenerationStep {
  id: string;
  label: string;
  platform: string;
  status: "pending" | "processing" | "complete";
  icon: typeof Instagram;
}

const GENERATION_STEPS: GenerationStep[] = [
  {
    id: "social-1",
    label: "Social Post 1",
    platform: "Instagram",
    status: "pending",
    icon: Instagram,
  },
  {
    id: "social-2",
    label: "Social Post 2",
    platform: "Facebook",
    status: "pending",
    icon: Instagram,
  },
  {
    id: "social-3",
    label: "Social Post 3",
    platform: "LinkedIn",
    status: "pending",
    icon: Instagram,
  },
  {
    id: "social-4",
    label: "Social Post 4",
    platform: "Twitter",
    status: "pending",
    icon: Instagram,
  },
  {
    id: "social-5",
    label: "Social Post 5",
    platform: "Instagram",
    status: "pending",
    icon: Instagram,
  },
  {
    id: "email",
    label: "Email Campaign",
    platform: "Email",
    status: "pending",
    icon: Mail,
  },
  {
    id: "gbp",
    label: "Google Business Post",
    platform: "Google",
    status: "pending",
    icon: MapPin,
  },
  {
    id: "blog",
    label: "Blog Expansion",
    platform: "Blog",
    status: "pending",
    icon: FileText,
  },
];

export default function Screen7ContentGeneration() {
  const { user, brandSnapshot, setOnboardingStep } = useAuth();
  const { fire } = useConfetti();
  const [steps, setSteps] = useState<GenerationStep[]>(GENERATION_STEPS);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    startGeneration();
  }, []);

  const startGeneration = async () => {
    try {
      // Simulate progress through each step
      for (let i = 0; i < steps.length; i++) {
        setSteps((prev) =>
          prev.map((s, idx) =>
            idx === i
              ? { ...s, status: "processing" }
              : idx < i
              ? { ...s, status: "complete" }
              : s
          )
        );

        // Simulate processing time (1-2 seconds per step)
        await new Promise((resolve) => setTimeout(resolve, 1200 + Math.random() * 800));

        // Mark step as complete
        setSteps((prev) =>
          prev.map((s, idx) =>
            idx === i ? { ...s, status: "complete" } : s
          )
        );
      }

      // Call actual API to generate content
      await generateContent();

      // Celebrate completion
      setIsComplete(true);
      fire({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.5 },
        colors: ["#4F46E5", "#818CF8", "#C7D2FE", "#A855F7", "#10B981"],
      });

      // Move to calendar preview after a moment
      setTimeout(() => {
        setOnboardingStep(8);
      }, 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate content");
      // Still proceed to calendar preview
      setTimeout(() => {
        setOnboardingStep(8);
      }, 2000);
    }
  };

  const generateContent = async () => {
    if (!user?.weeklyFocus || !brandSnapshot) return;

    try {
      // Call the content generation endpoint
      const response = await fetch("/api/onboarding/generate-week", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          brandId: `brand_${Date.now()}`,
          weeklyFocus: user.weeklyFocus,
          brandSnapshot,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate content");
      }

      const result = await response.json();
      // ContentPackageDraft is saved to DB by backend
      console.log("Content generated:", result);
      
      // Save to localStorage for calendar preview (fallback)
      if (result.success && result.contentPackage) {
        localStorage.setItem("aligned:onboarding:content_package", JSON.stringify(result.contentPackage));
        // Also save brandId for loading
        localStorage.setItem("aligned_brand_id", result.contentPackage.brandId);
      }
    } catch (err) {
      console.error("Content generation error:", err);
      // Fall through - we'll show empty calendar if needed
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/30 via-white to-blue-50/20 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        {/* Progress Indicator */}
        <OnboardingProgress currentStep={7} totalSteps={10} label="Generating your week" />

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 mb-4 animate-pulse">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 mb-3">
            Generating your 7-day content plan...
          </h1>
          <p className="text-slate-600 font-medium">
            We're creating posts across all your channels
          </p>
        </div>

        {/* Generation Steps */}
        <div className="bg-white/50 backdrop-blur-xl rounded-2xl border border-white/60 p-8 space-y-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={step.id}
                className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
                  step.status === "complete"
                    ? "bg-green-50 border border-green-200"
                    : step.status === "processing"
                    ? "bg-indigo-50 border border-indigo-200"
                    : "bg-slate-50 border border-slate-200"
                }`}
              >
                {/* Icon */}
                <div
                  className={`flex-shrink-0 ${
                    step.status === "complete"
                      ? "text-green-600"
                      : step.status === "processing"
                      ? "text-indigo-600"
                      : "text-slate-400"
                  }`}
                >
                  {step.status === "complete" ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : step.status === "processing" ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <Icon className="w-6 h-6" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <p
                    className={`font-bold text-sm ${
                      step.status === "complete"
                        ? "text-green-900"
                        : step.status === "processing"
                        ? "text-indigo-900"
                        : "text-slate-600"
                    }`}
                  >
                    {step.label}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{step.platform}</p>
                  {step.status === "processing" && (
                    <div className="mt-2 h-1 bg-indigo-200 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-600 rounded-full animate-pulse" style={{ width: "60%" }} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-900">
              ⚠️ {error}. Don't worry—we'll create a default content plan you can customize.
            </p>
          </div>
        )}

        {/* Completion Message */}
        {isComplete && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
            <p className="text-sm font-bold text-green-900">
              ✨ Your 7-day content plan is ready! Taking you to your calendar...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

