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

  // ✅ REMOVED: Dev-only mock auth toggle
  // All authentication must go through real Supabase Auth
  // No mock/dev bypasses allowed

  return (
    <UnauthenticatedLayout>
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
