/**
 * Screen 6: Weekly Focus Selector
 * 
 * Before generating content, ask user what they want to focus on this week.
 * This conditions the content generator.
 */

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowRight, Target, Heart, Users, TrendingUp, ShoppingCart } from "lucide-react";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";

const FOCUS_OPTIONS = [
  {
    id: "engagement",
    label: "Social Engagement",
    description: "Build community and increase interactions",
    icon: Heart,
    color: "from-pink-500 to-rose-500",
  },
  {
    id: "leads",
    label: "Lead Generation",
    description: "Attract potential customers and drive conversions",
    icon: Target,
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "consistency",
    label: "Brand Consistency",
    description: "Maintain a cohesive brand presence",
    icon: Users,
    color: "from-purple-500 to-indigo-500",
  },
  {
    id: "awareness",
    label: "Brand Awareness",
    description: "Increase visibility and reach new audiences",
    icon: TrendingUp,
    color: "from-emerald-500 to-teal-500",
  },
  {
    id: "sales",
    label: "Promotion / Sales",
    description: "Drive sales with promotional content",
    icon: ShoppingCart,
    color: "from-amber-500 to-orange-500",
  },
];

export default function Screen6WeeklyFocus() {
  const { user, signUp, setOnboardingStep } = useAuth();
  const [selectedFocuses, setSelectedFocuses] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleContinue = () => {
    if (selectedFocuses.length === 0) {
      setErrors({ focus: "Please select at least one focus area" });
      return;
    }

    // Store weekly focus in user object
    // ✅ FIX: weeklyFocus expects string, not string[]. Join array into comma-separated string
    if (user) {
      signUp({
        ...user,
        weeklyFocus: selectedFocuses.join(", "),
      });
    }

    // Move to content generation step
    setOnboardingStep(7);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/30 via-white to-blue-50/20 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        {/* Progress Indicator */}
        <OnboardingProgress currentStep={6} totalSteps={10} label="Set your focus" />

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 mb-4">
            <Target className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 mb-3">
            What do you want to focus on this week?
          </h1>
          <p className="text-slate-600 font-medium text-lg">
            This helps us generate content that aligns with your goals
          </p>
        </div>

        {/* Focus Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {FOCUS_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedFocuses.includes(option.id);
            
            return (
              <button
                key={option.id}
                onClick={() => {
                  setSelectedFocuses((prev) =>
                    prev.includes(option.id)
                      ? prev.filter((id) => id !== option.id)
                      : [...prev, option.id]
                  );
                  setErrors({});
                }}
                className={`p-6 rounded-2xl border-2 transition-all text-left ${
                  isSelected
                    ? "border-indigo-500 bg-indigo-50 shadow-lg shadow-indigo-200"
                    : "border-slate-200 bg-white/50 hover:border-slate-300 hover:shadow-md"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${option.color} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-lg font-black mb-1 ${isSelected ? "text-indigo-900" : "text-slate-900"}`}>
                      {option.label}
                    </h3>
                    <p className={`text-sm ${isSelected ? "text-indigo-700" : "text-slate-600"}`}>
                      {option.description}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {errors.focus && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600 font-medium">{errors.focus}</p>
          </div>
        )}

        {/* CTA Button */}
        <button
          onClick={handleContinue}
          disabled={selectedFocuses.length === 0}
          className="w-full px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2 group text-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Generate My Week
          <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}

