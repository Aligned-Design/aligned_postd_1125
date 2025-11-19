/* eslint-disable */
/**
 * PostOnboardingTour
 * 
 * Lightweight, four-step guided tour shown after onboarding.
 * Features:
 * - Tooltip-style UI with darkened backdrop
 * - Non-blocking (users can exit anytime)
 * - Mobile-friendly
 * - Confetti on final step
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { X, ArrowRight } from "lucide-react";
import { useConfetti } from "@/hooks/useConfetti";
import { cn } from "@/lib/design-system";
import { PrimaryButton } from "../ui/buttons/PrimaryButton";
import { SecondaryButton } from "../ui/buttons/SecondaryButton";

interface TourStep {
  id: number;
  title: string;
  description: string;
  targetSelector?: string; // CSS selector for highlighting element
  position?: "top" | "bottom" | "left" | "right" | "center";
  emoji?: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 1,
    title: "Welcome to your Dashboard! 🎉",
    description: "This is your command center. Here you'll see your KPIs, recent activity, and AI insights at a glance. Everything you need to manage your brand is right here.",
    position: "center",
    emoji: "📊",
  },
  {
    id: 2,
    title: "Create Magic in the Studio ✨",
    description: "The Creative Studio is where AI helps you generate content. Create posts, captions, and visual concepts that match your brand perfectly.",
    targetSelector: '[data-tour-target="creative-studio"]',
    position: "right",
    emoji: "🎨",
  },
  {
    id: 3,
    title: "Plan Your Content Calendar 📅",
    description: "Schedule and organize all your content in one place. Drag and drop to rearrange, and see your entire content plan at a glance.",
    targetSelector: '[data-tour-target="calendar"]',
    position: "right",
    emoji: "📆",
  },
  {
    id: 4,
    title: "Connect Your Accounts 🔗",
    description: "Link your social media accounts to publish directly from Aligned. Connect Instagram, Facebook, LinkedIn, and more to streamline your workflow.",
    targetSelector: '[data-tour-target="linked-accounts"]',
    position: "right",
    emoji: "🔌",
  },
];

interface PostOnboardingTourProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function PostOnboardingTour({ onComplete, onSkip }: PostOnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
  const { fire } = useConfetti();
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Detect mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const step = TOUR_STEPS[currentStep];
  const isLastStep = currentStep === TOUR_STEPS.length - 1;

  // Find and highlight target element
  useEffect(() => {
    if (step.targetSelector) {
      const element = document.querySelector(step.targetSelector) as HTMLElement;
      setTargetElement(element);
      
      // Scroll to element if it exists
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        // Add highlight class
        element.classList.add("tour-highlight");
      }
    } else {
      setTargetElement(null);
    }

    return () => {
      // Clean up highlight
      if (step.targetSelector) {
        const element = document.querySelector(step.targetSelector) as HTMLElement;
        if (element) {
          element.classList.remove("tour-highlight");
        }
      }
    };
  }, [currentStep, step.targetSelector]);

  // Position tooltip relative to target or center
  const getTooltipPosition = () => {
    if (!targetElement && step.position === "center") {
      return {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      };
    }

    if (targetElement) {
      const rect = targetElement.getBoundingClientRect();
      const tooltipHeight = tooltipRef.current?.offsetHeight || 200;
      const tooltipWidth = tooltipRef.current?.offsetWidth || 320;
      const spacing = 16;

      switch (step.position) {
        case "right":
          return {
            top: `${rect.top + rect.height / 2}px`,
            left: `${rect.right + spacing}px`,
            transform: "translateY(-50%)",
          };
        case "left":
          return {
            top: `${rect.top + rect.height / 2}px`,
            left: `${rect.left - tooltipWidth - spacing}px`,
            transform: "translateY(-50%)",
          };
        case "top":
          return {
            top: `${rect.top - tooltipHeight - spacing}px`,
            left: `${rect.left + rect.width / 2}px`,
            transform: "translateX(-50%)",
          };
        case "bottom":
          return {
            top: `${rect.bottom + spacing}px`,
            left: `${rect.left + rect.width / 2}px`,
            transform: "translateX(-50%)",
          };
        default:
          return {
            top: `${rect.bottom + spacing}px`,
            left: `${rect.left + rect.width / 2}px`,
            transform: "translateX(-50%)",
          };
      }
    }

    return {
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
    };
  };

  const handleNext = () => {
    if (isLastStep) {
      // Fire confetti on completion
      fire({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.5 },
        colors: ["#4F46E5", "#818CF8", "#C7D2FE", "#A855F7", "#10B981"],
      });
      
      // Mark as completed
      localStorage.setItem("aligned:post_onboarding_tour:completed", "true");
      onComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleSkip = useCallback(() => {
    localStorage.setItem("aligned:post_onboarding_tour:completed", "true");
    onSkip();
  }, [onSkip]);

  // Safety check: Auto-dismiss if step is invalid
  useEffect(() => {
    if (!step || currentStep >= TOUR_STEPS.length) {
      handleSkip();
    }
  }, [step, currentStep, handleSkip]);

  // Handle navigation for steps that need it
  const handleStepAction = () => {
    if (step.id === 2) {
      // Navigate to Creative Studio
      navigate("/creative-studio");
      // Wait for navigation, then continue
      setTimeout(() => {
        handleNext();
      }, 800);
    } else if (step.id === 3) {
      // Navigate to Calendar
      navigate("/calendar");
      setTimeout(() => {
        handleNext();
      }, 800);
    } else if (step.id === 4) {
      // Navigate to Linked Accounts
      navigate("/linked-accounts");
      setTimeout(() => {
        handleNext();
      }, 800);
    } else {
      handleNext();
    }
  };

  const tooltipStyle = getTooltipPosition();

  return (
    <>
      {/* Darkened Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] animate-in fade-in-0"
        onClick={handleSkip}
        aria-hidden="true"
      />

      {/* Highlight Overlay for Target Element */}
      {targetElement && (
        <div
          className="fixed z-[9997] pointer-events-none"
          style={{
            top: `${targetElement.getBoundingClientRect().top - 4}px`,
            left: `${targetElement.getBoundingClientRect().left - 4}px`,
            width: `${targetElement.offsetWidth + 8}px`,
            height: `${targetElement.offsetHeight + 8}px`,
            borderRadius: "12px",
            border: "3px solid #4F46E5",
            boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.5)",
          }}
        />
      )}

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className={cn(
          "fixed z-[9999]",
          "bg-white rounded-2xl shadow-2xl border-2 border-indigo-200",
          "p-6 sm:p-8",
          "max-w-sm sm:max-w-md",
          "animate-in fade-in-0 zoom-in-95",
          "motion-reduce:animate-none",
          // Mobile: center the tooltip
          "sm:static",
          "mx-4 sm:mx-0"
        )}
        style={{
          ...tooltipStyle,
          // On mobile, override positioning to center
          ...(isMobile && {
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            maxWidth: "calc(100vw - 32px)",
          }),
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Skip tour"
        >
          <X className="w-5 h-5 text-slate-500" />
        </button>

        {/* Step Content */}
        <div className="space-y-4">
          {/* Emoji & Title */}
          <div className="flex items-start gap-3">
            {step.emoji && (
              <span className="text-3xl flex-shrink-0">{step.emoji}</span>
            )}
            <div className="flex-1">
              <h3 className="text-xl font-black text-slate-900 mb-2">
                {step.title}
              </h3>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                {step.description}
              </p>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex gap-1.5">
              {TOUR_STEPS.map((_, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "h-2 rounded-full transition-all",
                    idx <= currentStep
                      ? "bg-indigo-600 w-8"
                      : "bg-slate-300 w-2"
                  )}
                />
              ))}
            </div>
            <span className="text-xs font-bold text-slate-500">
              {currentStep + 1} / {TOUR_STEPS.length}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <SecondaryButton
              onClick={handleSkip}
              className="flex-1"
              size="md"
            >
              Skip Tour
            </SecondaryButton>
            <PrimaryButton
              onClick={handleStepAction}
              className="flex-1 gap-2"
              size="md"
            >
              {isLastStep ? "Get Started" : "Next"}
              {!isLastStep && <ArrowRight className="w-4 h-4" />}
            </PrimaryButton>
          </div>
        </div>
      </div>

      {/* Mobile: Ensure tooltip is visible on small screens */}
      <style>{`
        @media (max-width: 640px) {
          .tour-tooltip-mobile {
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            max-width: calc(100vw - 32px);
          }
        }
        .tour-highlight {
          position: relative;
          z-index: 9999;
        }
      `}</style>
    </>
  );
}

