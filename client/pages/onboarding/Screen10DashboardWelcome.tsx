/**
 * Screen 10: First-Time Dashboard Welcome
 * 
 * Celebration moment + welcome hero after onboarding completion.
 * Shows:
 * - Confetti animation
 * - "Your brand is now aligned 🎉"
 * - "Here's what we've created for you"
 * - Quick Actions (Review Week, Create Post, Edit Brand Guide, Connect Accounts)
 * - Hides charts/KPIs/empty widgets until real data exists
 */

import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useConfetti } from "@/hooks/useConfetti";
import { useNavigate } from "react-router-dom";
import { Sparkles, Calendar, Plus, BookOpen, Link2, ArrowRight } from "lucide-react";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { PrimaryButton } from "@/components/postd/ui/buttons/PrimaryButton";
import { SecondaryButton } from "@/components/postd/ui/buttons/SecondaryButton";

export default function Screen10DashboardWelcome() {
  const { completeOnboarding, brandSnapshot } = useAuth();
  const { fire } = useConfetti();
  const navigate = useNavigate();

  // Fire confetti on load
  useEffect(() => {
    const timer = setTimeout(() => {
      fire({
        particleCount: 200,
        spread: 90,
        origin: { y: 0.3 },
        colors: ["#632bf0", "#c084fc", "#e2e8f0", "#a855f7", "#12b76a", "#f59e0b"], // primary-light, purple-400, slate-200, purple-500, success, amber-600 (design tokens)
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [fire]);

  const handleComplete = () => {
    // Mark onboarding as completed before navigating
    localStorage.setItem("aligned:onboarding:completed", "true");
    completeOnboarding();
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/30 via-white to-blue-50/20 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        {/* Progress Indicator */}
        <OnboardingProgress currentStep={10} totalSteps={10} label="You're all set!" />

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 mb-6 animate-pulse">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-black text-slate-900 mb-4">
            Your brand is ready 🎉
          </h1>
          <p className="text-slate-600 font-medium text-lg">
            Here's what we've created for you
          </p>
        </div>

        {/* What We Created Summary */}
        <div className="bg-white/50 backdrop-blur-xl rounded-2xl border border-white/60 p-8 mb-6">
          <h2 className="text-xl font-black text-slate-900 mb-6">Your Onboarding Summary</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-indigo-50 border border-indigo-100">
              <p className="text-sm font-bold text-indigo-900 mb-1">Brand Guide</p>
              <p className="text-xs text-indigo-700">✓ Colors, tone, and identity extracted</p>
            </div>
            <div className="p-4 rounded-lg bg-purple-50 border border-purple-100">
              <p className="text-sm font-bold text-purple-900 mb-1">Content Plan</p>
              <p className="text-xs text-purple-700">✓ 7 days of multi-channel content ready</p>
            </div>
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-100">
              <p className="text-sm font-bold text-blue-900 mb-1">Calendar</p>
              <p className="text-xs text-blue-700">✓ Posts scheduled across the week</p>
            </div>
            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100">
              <p className="text-sm font-bold text-emerald-900 mb-1">Ready to Publish</p>
              <p className="text-xs text-emerald-700">✓ Connect accounts to go live</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white/50 backdrop-blur-xl rounded-2xl border border-white/60 p-8 mb-6">
          <h2 className="text-xl font-black text-slate-900 mb-4">What would you like to do next?</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <PrimaryButton
              onClick={() => {
                handleComplete();
                navigate("/calendar");
              }}
              className="w-full justify-start gap-3 h-auto py-4"
            >
              <Calendar className="w-5 h-5" />
              <div className="text-left">
                <div className="font-black">Review Your Week</div>
                <div className="text-xs font-normal opacity-90">See your 7-day content plan</div>
              </div>
            </PrimaryButton>
            
            <PrimaryButton
              onClick={() => {
                handleComplete();
                navigate("/studio");
              }}
              className="w-full justify-start gap-3 h-auto py-4"
            >
              <Plus className="w-5 h-5" />
              <div className="text-left">
                <div className="font-black">Create a Post</div>
                <div className="text-xs font-normal opacity-90">Generate new content with AI</div>
              </div>
            </PrimaryButton>
            
            <SecondaryButton
              onClick={() => {
                handleComplete();
                navigate("/brand-guide");
              }}
              className="w-full justify-start gap-3 h-auto py-4"
            >
              <BookOpen className="w-5 h-5" />
              <div className="text-left">
                <div className="font-black">Edit Brand Guide</div>
                <div className="text-xs font-normal opacity-90">Refine your Brand Guide</div>
              </div>
            </SecondaryButton>
            
            <SecondaryButton
              onClick={() => {
                handleComplete();
                navigate("/linked-accounts");
              }}
              className="w-full justify-start gap-3 h-auto py-4"
            >
              <Link2 className="w-5 h-5" />
              <div className="text-left">
                <div className="font-black">Connect Accounts</div>
                <div className="text-xs font-normal opacity-90">Link platforms to publish</div>
              </div>
            </SecondaryButton>
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={handleComplete}
          className="w-full px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2 text-lg"
        >
          Go to Dashboard
          <ArrowRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}

