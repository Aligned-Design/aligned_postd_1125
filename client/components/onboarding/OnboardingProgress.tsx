/**
 * OnboardingProgress Component
 * 
 * Displays progress indicator for onboarding steps (Step X of Y)
 * Used across all onboarding screens for consistent progress tracking
 */

import { cn } from "@/lib/design-system";

interface OnboardingProgressProps {
  currentStep: number | string; // Support decimal steps like 3.5, 4.5
  totalSteps: number;
  label?: string;
  className?: string;
}

export function OnboardingProgress({
  currentStep,
  totalSteps,
  label,
  className,
}: OnboardingProgressProps) {
  const stepNum = typeof currentStep === "string" ? parseFloat(currentStep) : currentStep;
  const progressPercent = (stepNum / totalSteps) * 100;
  const displayStep = typeof currentStep === "string" ? currentStep : currentStep;

  return (
    <div className={cn("mb-6", className)}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-700">
              Step {displayStep} of {totalSteps}
            </span>
          {label && (
            <>
              <span className="text-slate-400">•</span>
              <span className="text-sm text-slate-600 font-medium">{label}</span>
            </>
          )}
        </div>
        <span className="text-xs text-slate-500 font-medium">
          {Math.round(progressPercent)}% complete
        </span>
      </div>
      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}

