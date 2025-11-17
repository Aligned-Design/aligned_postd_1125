/**
 * FirstTimeWelcome Component
 * 
 * Welcome hero for first-time dashboard visits after onboarding completion.
 * Shows celebration, brand summary, and quick action buttons.
 */

import { useState, useEffect } from "react";
import { X, Sparkles, Plus, Upload, BookOpen, Link2 } from "lucide-react";
import { useConfetti } from "@/hooks/useConfetti";
import { useBrand } from "@/contexts/BrandContext";
import { useAuth } from "@/contexts/AuthContext";
import { SectionCard } from "@/components/postd/ui/cards/SectionCard";
import { PrimaryButton } from "@/components/postd/ui/buttons/PrimaryButton";
import { SecondaryButton } from "@/components/postd/ui/buttons/SecondaryButton";

interface FirstTimeWelcomeProps {
  onDismiss?: () => void;
}

export function FirstTimeWelcome({ onDismiss }: FirstTimeWelcomeProps) {
  const { user, brandSnapshot } = useAuth();
  const { currentBrand } = useBrand();
  const { fire } = useConfetti();
  const [isVisible, setIsVisible] = useState(true);

  // Fire confetti on first render
  useEffect(() => {
    const timer = setTimeout(() => {
      fire({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.3 },
        colors: ["#4F46E5", "#818CF8", "#C7D2FE", "#A855F7", "#10B981"],
      });
    }, 200);
    return () => clearTimeout(timer);
  }, [fire]);

  const handleDismiss = () => {
    setIsVisible(false);
    // Store dismissal in localStorage
    localStorage.setItem("aligned:first_time_welcome:dismissed", "true");
    if (onDismiss) {
      onDismiss();
    }
  };

  if (!isVisible) return null;

  const firstName = user?.name?.split(" ")[0] || "there";
  const brandName = currentBrand?.name || brandSnapshot?.name || "your brand";

  return (
    <SectionCard className="mb-8 relative overflow-hidden">
      {/* Dismiss Button */}
      <button
        onClick={handleDismiss}
        className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-lg transition-colors z-10"
        aria-label="Dismiss welcome"
      >
        <X className="w-4 h-4 text-slate-500" />
      </button>

      <div className="p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-black text-slate-900 mb-1">
              Welcome, {firstName}! 👋
            </h2>
            <p className="text-slate-600 font-medium">
              Your brand <strong>{brandName}</strong> is set up and ready to grow.
            </p>
          </div>
        </div>

        {/* Brand Summary */}
        {brandSnapshot && (
          <div className="mb-6 p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
            <p className="text-sm font-bold text-slate-900 mb-2">Your brand profile:</p>
            <div className="flex flex-wrap gap-2">
              {brandSnapshot.tone && brandSnapshot.tone.length > 0 && (
                <span className="text-xs px-2 py-1 bg-white rounded-full text-slate-700 font-medium">
                  {brandSnapshot.tone.join(", ")}
                </span>
              )}
              {brandSnapshot.audience && (
                <span className="text-xs px-2 py-1 bg-white rounded-full text-slate-700 font-medium">
                  Targeting {brandSnapshot.audience}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="space-y-3">
          <p className="text-sm font-bold text-slate-900 mb-3">What would you like to do first?</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <PrimaryButton
              onClick={() => {
                window.location.href = "/studio";
              }}
              className="w-full justify-center gap-2 text-base py-3 font-black"
            >
              <Plus className="w-5 h-5" />
              Create Your First Post
            </PrimaryButton>
            <SecondaryButton
              onClick={() => {
                window.location.href = "/library";
              }}
              className="w-full justify-start gap-2"
            >
              <Upload className="w-4 h-4" />
              Upload Brand Media
            </SecondaryButton>
            <SecondaryButton
              onClick={() => {
                window.location.href = "/brand-guide";
              }}
              className="w-full justify-start gap-2"
            >
              <BookOpen className="w-4 h-4" />
              Review Brand Guide
            </SecondaryButton>
            <SecondaryButton
              onClick={() => {
                window.location.href = "/linked-accounts";
              }}
              className="w-full justify-start gap-2"
            >
              <Link2 className="w-4 h-4" />
              Connect Platforms
            </SecondaryButton>
          </div>
        </div>

        {/* Advisor Hint */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900 font-medium">
            💡 <strong>Tip:</strong> The Advisor is ready to help! Check the insights panel for personalized suggestions.
          </p>
        </div>
      </div>
    </SectionCard>
  );
}

