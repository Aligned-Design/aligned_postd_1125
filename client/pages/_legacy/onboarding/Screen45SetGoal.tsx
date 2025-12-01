/**
 * 🚧 LEGACY ONBOARDING SCREEN
 * This screen is no longer part of the active onboarding flow.
 * It is retained for historical reference only and may be deleted in a future cleanup.
 */

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowRight } from "lucide-react";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";

interface Goal {
  type: "engagement" | "followers" | "leads" | null;
  target: number;
  timeframe: 30; // days
}

const GOAL_OPTIONS = [
  {
    type: "engagement" as const,
    label: "Grow Engagement",
    emoji: "❤️",
    description: "Increase likes, comments, shares",
    defaultTarget: 50,
  },
  {
    type: "followers" as const,
    label: "Gain Followers",
    emoji: "📈",
    description: "Grow your audience",
    defaultTarget: 100,
  },
  {
    type: "leads" as const,
    label: "Generate Leads",
    emoji: "🎯",
    description: "Convert audience to customers",
    defaultTarget: 25,
  },
];

export default function Screen45SetGoal() {
  const { updateUser, setOnboardingStep } = useAuth();
  const [goal, setGoal] = useState<Goal>({
    type: null,
    target: 50,
    timeframe: 30,
  });

  const handleSelectGoalType = (type: Goal["type"]) => {
    const option = GOAL_OPTIONS.find((g) => g.type === type);
    setGoal({
      ...goal,
      type,
      target: option?.defaultTarget || 50,
    });
  };

  const handleTargetChange = (target: number) => {
    setGoal({ ...goal, target });
  };

  const handleSkip = () => {
    setOnboardingStep(5);
  };

  const handleContinue = () => {
    if (goal.type) {
      updateUser({
        // Store goal data (extend OnboardingUser type if needed)
      });
    }
    setOnboardingStep(5);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/30 via-white to-blue-50/20 p-4">
      <div className="max-w-2xl mx-auto pt-6">
        {/* Progress Indicator */}
        <OnboardingProgress currentStep={4.5} totalSteps={5} label="Set a goal" className="mb-6" />

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-100 mb-4">
            <span className="text-lg">🎯</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">Help us help you</h1>
          <p className="text-slate-600 font-medium">
            (Optional) Set a goal to help our AI Advisor suggest better content strategies
          </p>
        </div>

        {/* Goal Selection */}
        <div className="space-y-3 mb-10">
          {GOAL_OPTIONS.map((option) => (
            <button
              key={option.type}
              onClick={() => handleSelectGoalType(option.type)}
              className={`w-full p-6 rounded-2xl border-2 transition-all text-left ${
                goal.type === option.type
                  ? "bg-indigo-100 border-indigo-500 shadow-md"
                  : "bg-white/50 border-slate-200 hover:border-indigo-300"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-3xl mb-2">{option.emoji}</div>
                  <h3 className="font-black text-slate-900">{option.label}</h3>
                  <p className="text-sm text-slate-600 font-medium mt-1">{option.description}</p>
                </div>
                {goal.type === option.type && <div className="text-indigo-600 text-2xl">✓</div>}
              </div>
            </button>
          ))}
        </div>

        {/* Target Input */}
        {goal.type && (
          <div className="bg-white/50 backdrop-blur-xl rounded-2xl border border-white/60 p-8 mb-8">
            <label className="block text-sm font-black text-slate-900 mb-4">
              What's your target for 30 days?
            </label>

            <div className="space-y-4">
              {/* Slider */}
              <div className="space-y-2">
                <input
                  type="range"
                  min="10"
                  max="500"
                  step="10"
                  value={goal.target}
                  onChange={(e) => handleTargetChange(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-xs text-slate-600 font-medium">
                  <span>10</span>
                  <span>500</span>
                </div>
              </div>

              {/* Input Field */}
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={goal.target}
                  onChange={(e) => handleTargetChange(Math.max(10, parseInt(e.target.value) || 10))}
                  className="flex-1 px-4 py-3 rounded-lg border-2 border-indigo-300 bg-white focus:outline-none font-bold text-lg"
                  min="10"
                />
                <span className="text-sm font-bold text-slate-600">
                  {goal.type === "followers"
                    ? "new followers"
                    : goal.type === "engagement"
                      ? "engagement items"
                      : "leads"}
                </span>
              </div>

              {/* Info */}
              <div className="flex gap-2 text-xs text-slate-600 mt-4">
                <span>💡</span>
                <p>
                  Don't worry—you can change this anytime in Brand Guide settings. This just helps us personalize suggestions.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* CTA Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleSkip}
            className="flex-1 px-6 py-4 bg-white/50 border-2 border-slate-200 text-slate-700 font-black rounded-lg hover:bg-slate-50 transition-all"
          >
            Skip for Now
          </button>
          <button
            onClick={handleContinue}
            disabled={!goal.type}
            className={`flex-1 px-6 py-4 font-black rounded-lg transition-all flex items-center justify-center gap-2 group ${
              goal.type
                ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:shadow-lg"
                : "bg-slate-200 text-slate-500 cursor-not-allowed"
            }`}
          >
            Continue
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
