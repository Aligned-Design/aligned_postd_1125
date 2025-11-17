/**
 * usePostOnboardingTour
 * 
 * Hook to manage post-onboarding tour state.
 * Checks if tour should be shown and provides completion handlers.
 */

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

const STORAGE_KEY = "aligned:post_onboarding_tour:completed";

export function usePostOnboardingTour() {
  const { onboardingStep } = useAuth();
  const [shouldShowTour, setShouldShowTour] = useState(false);

  useEffect(() => {
    // Only show tour if:
    // 1. Onboarding is complete (onboardingStep is null)
    // 2. Tour hasn't been completed before
    // 3. User is on dashboard (handled by component)
    // 4. Add a small delay to ensure page is fully loaded
    const timer = setTimeout(() => {
      if (onboardingStep === null) {
        const tourCompleted = localStorage.getItem(STORAGE_KEY) === "true";
        setShouldShowTour(!tourCompleted);
      } else {
        setShouldShowTour(false);
      }
    }, 500); // Small delay to prevent blur on initial load

    return () => clearTimeout(timer);
  }, [onboardingStep]);

  const markTourCompleted = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setShouldShowTour(false);
  };

  const resetTour = () => {
    localStorage.removeItem(STORAGE_KEY);
    setShouldShowTour(true);
  };

  return {
    shouldShowTour,
    markTourCompleted,
    resetTour,
  };
}

