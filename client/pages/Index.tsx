import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { analytics } from "@/lib/analytics";
import { UnauthenticatedLayout } from "@shared-components/layout/UnauthenticatedLayout";
import { HeroSection } from "@/components/landing/HeroSection";
import { InteractiveStoryFlow } from "@/components/landing/InteractiveStoryFlow";
import { LiveDemoPreview } from "@/components/landing/LiveDemoPreview";
import { InteractiveDemo } from "@/components/landing/InteractiveDemo";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { PromiseSection } from "@/components/landing/PromiseSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { WhatItFeelsLikeSection } from "@/components/landing/WhatItFeelsLikeSection";
import { WhyTeamsLoveItSection } from "@/components/landing/WhyTeamsLoveItSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { ZiaQuotePanel } from "@/components/landing/ZiaQuotePanel";
import { FinalCTASection } from "@/components/landing/FinalCTASection";
import { ZiaFloatingAccent } from "@/components/landing/ZiaPersonality";

export default function Index() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCTA = (source: "hero" | "sticky" | "footer") => {
    analytics.track("cta_click", {
      source,
      auth_state: user ? "authed" : "anon",
    });
    navigate(user ? "/dashboard" : "/onboarding");
  };

  // DEV ONLY: Mock auth toggle
  const handleDevLogin = () => {
    if (import.meta.env.DEV) {
      localStorage.setItem("aligned_dev_auth", "true");
      window.location.reload();
    }
  };

  return (
    <UnauthenticatedLayout>
      {/* DEV ONLY: Quick login toggle */}
      {import.meta.env.DEV && !user && (
        <div className="fixed top-4 right-4 z-50">
          <button
            onClick={handleDevLogin}
            className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg shadow-lg hover:bg-purple-700 transition-colors"
          >
            🔧 Login as Test User (Dev Only)
          </button>
        </div>
      )}
      <HeroSection onCTA={() => handleCTA("hero")} />
      <ProblemSection />
      <InteractiveStoryFlow />
      <LiveDemoPreview />
      <InteractiveDemo />
      <PromiseSection onCTA={() => handleCTA("sticky")} />
      <HowItWorksSection />
      <WhatItFeelsLikeSection onCTA={() => handleCTA("footer")} />
      <WhyTeamsLoveItSection />
      <TestimonialsSection />
      <ZiaQuotePanel />
      <FinalCTASection onCTA={() => handleCTA("footer")} />
      <ZiaFloatingAccent />
    </UnauthenticatedLayout>
  );
}
