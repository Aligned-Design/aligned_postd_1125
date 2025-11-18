import { useAuth } from "@/contexts/AuthContext";
import Screen1SignUp from "./onboarding/Screen1SignUp";
import Screen2BusinessEssentials from "./onboarding/Screen2BusinessEssentials";
import Screen3ExpectationSetting from "./onboarding/Screen3ExpectationSetting";
import Screen3AiScrape from "./onboarding/Screen3AiScrape";
import Screen3BrandIntake from "./onboarding/Screen3BrandIntake";
import Screen5BrandSummaryReview from "./onboarding/Screen5BrandSummaryReview";
import Screen6WeeklyFocus from "./onboarding/Screen6WeeklyFocus";
import Screen7ContentGeneration from "./onboarding/Screen7ContentGeneration";
import Screen8CalendarPreview from "./onboarding/Screen8CalendarPreview";
import Screen9ConnectAccounts from "./onboarding/Screen9ConnectAccounts";
import Screen10DashboardWelcome from "./onboarding/Screen10DashboardWelcome";

export default function Onboarding() {
  const { onboardingStep } = useAuth();

  const screens: Record<number | string, React.ComponentType> = {
    1: Screen1SignUp,
    2: Screen2BusinessEssentials,
    3: Screen3ExpectationSetting,
    3.5: Screen3BrandIntake, // Manual intake screen for users without website
    4: Screen3AiScrape,
    5: Screen5BrandSummaryReview,
    6: Screen6WeeklyFocus,
    7: Screen7ContentGeneration,
    8: Screen8CalendarPreview,
    9: Screen9ConnectAccounts,
    10: Screen10DashboardWelcome,
  };

  const CurrentScreen = screens[onboardingStep || 1] || Screen1SignUp;

  return <CurrentScreen />;
}
