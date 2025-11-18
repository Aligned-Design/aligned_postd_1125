/**
 * Screen 3: AI Scrape & Generate
 * 
 * Shows progress animations while AI scans the website and generates brand profile.
 * This creates a magical, exciting moment for users.
 */

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Sparkles, CheckCircle2, Loader2, Palette, Image, MessageSquare, Package } from "lucide-react";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { useConfetti } from "@/hooks/useConfetti";

interface ScrapeProgress {
  step: string;
  status: "pending" | "processing" | "complete" | "error";
  message: string;
}

const SCRAPE_STEPS: ScrapeProgress[] = [
  {
    step: "images",
    status: "pending",
    message: "Pulling your brand images",
  },
  {
    step: "colors",
    status: "pending",
    message: "Detecting color palette",
  },
  {
    step: "voice",
    status: "pending",
    message: "Analyzing your messaging",
  },
  {
    step: "offerings",
    status: "pending",
    message: "Identifying services & products",
  },
  {
    step: "generate",
    status: "pending",
    message: "Building your Brand Snapshot",
  },
];

export default function Screen3AiScrape() {
  const { user, setBrandSnapshot, setOnboardingStep } = useAuth();
  const { fire } = useConfetti();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [steps, setSteps] = useState<ScrapeProgress[]>(SCRAPE_STEPS);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("[Onboarding] Screen3AiScrape loaded", {
      hasWebsite: !!user?.website,
      website: user?.website || "none",
    });

    if (!user?.website) {
      console.warn("[Onboarding] No website provided - skipping scraping, using default data");
      // No website provided, skip scraping and generate default brand snapshot
      setTimeout(() => {
        generateDefaultBrandSnapshot();
      }, 2000);
      return;
    }

    console.log("[Onboarding] Starting scraping process for:", user.website);
    startScraping();
  }, []);

  const startScraping = async () => {
    try {
      // Simulate progress through each step
      for (let i = 0; i < steps.length; i++) {
        setCurrentStepIndex(i);
        setSteps((prev) =>
          prev.map((s, idx) =>
            idx === i
              ? { ...s, status: "processing" }
              : idx < i
              ? { ...s, status: "complete" }
              : s
          )
        );

        // Simulate processing time (1-2 seconds per step)
        await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 1000));

        // Mark step as complete
        setSteps((prev) =>
          prev.map((s, idx) =>
            idx === i ? { ...s, status: "complete" } : s
          )
        );
      }

      // Call actual API to scrape website
      await scrapeWebsite();

      // Celebrate completion
      setIsComplete(true);
      fire({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.5 },
        colors: ["#4F46E5", "#818CF8", "#C7D2FE", "#A855F7"],
      });

      // Move to brand summary review after a moment
      setTimeout(() => {
        setOnboardingStep(5);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to scrape website");
      // Still proceed to brand summary review with default data
      setTimeout(() => {
        generateDefaultBrandSnapshot();
        setOnboardingStep(5);
      }, 2000);
    }
  };

  const scrapeWebsite = async () => {
    if (!user?.website) {
      console.warn("[Onboarding] scrapeWebsite called but no website provided");
      return;
    }

    try {
      // ✅ ROOT FIX: Use consistent brandId throughout onboarding
      // Get existing brandId from localStorage or create new one
      let brandId = localStorage.getItem("aligned_brand_id");
      if (!brandId) {
        brandId = `brand_${Date.now()}`;
        localStorage.setItem("aligned_brand_id", brandId);
      }

      console.log("[Onboarding] Calling crawler API", {
        url: user.website,
        brandId,
        sync: true,
      });

      // Call the backend crawler endpoint (sync mode for onboarding)
      const response = await fetch(`/api/crawl/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: user.website,
          brand_id: brandId, // ✅ Use consistent brandId
          sync: true, // Use sync mode for immediate results
        }),
      });

      console.log("[Onboarding] Crawler API response status:", response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[Onboarding] Crawler API error:", {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        });
        throw new Error(`Failed to process website: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      // Handle both success and fallback responses
      const brandKit = result.brandKit || result;
      
      // Transform result into BrandSnapshot format
      // Use brandKit from result (sync mode returns brandKit directly)
      const brandSnapshot = {
        name: user.businessName || extractBrandNameFromUrl(user.website),
        voice: brandKit?.voice_summary?.style || "Professional and clear",
        tone: Array.isArray(brandKit?.voice_summary?.tone) 
          ? brandKit.voice_summary.tone 
          : ["Professional", "Trustworthy"],
        audience: brandKit?.voice_summary?.audience || "Your target audience",
        goal: "Grow brand awareness and engagement",
        colors: brandKit?.colors
          ? [
              brandKit.colors.primary,
              brandKit.colors.secondary,
              brandKit.colors.accent,
            ].filter(Boolean)
          : ["#4F46E5", "#818CF8"],
        industry: user.industry,
        logo: brandKit?.logoUrl, // Include logo URL
        extractedMetadata: {
          keywords: brandKit?.keyword_themes || [],
          coreMessaging: [],
          dos: [],
          donts: brandKit?.voice_summary?.avoid || [],
          images: brandKit?.images?.map((img: any) => img.url) || [], // Extract image URLs
          brandIdentity: brandKit?.about_blurb || "",
          headlines: brandKit?.headlines || [], // Include headlines
        },
      };
      
      // Log if we got real scraped data or fallback
      if (result.status === "fallback") {
        console.warn("[Onboarding] Crawler returned fallback data:", result.error);
      } else {
        console.log("[Onboarding] Successfully scraped website data");
      }

      setBrandSnapshot(brandSnapshot);
      
      // ✅ ROOT FIX: Use the SAME brandId that was used for crawling
      // This ensures scraped images are associated with the same brandId
      const brandName = user.businessName || extractBrandNameFromUrl(user.website);
      
      // brandId is already set from above and stored in localStorage
      
      // Save Brand Guide to Supabase
      try {
        const { saveBrandGuideFromOnboarding } = await import("@/lib/onboarding-brand-sync");
        await saveBrandGuideFromOnboarding(brandId, brandSnapshot, brandName);
      } catch (error) {
        console.error("Failed to save Brand Guide during scrape:", error);
        // Continue anyway - don't block onboarding
      }
    } catch (err) {
      console.error("Scraping error:", err);
      // Fall through to default generation
      generateDefaultBrandSnapshot();
    }
  };

  const generateDefaultBrandSnapshot = () => {
    const brandSnapshot = {
      name: user?.businessName || extractBrandNameFromUrl(user?.website || ""),
      voice: "Professional and clear",
      tone: ["Professional", "Trustworthy", "Approachable"],
      audience: "Your target customers",
      goal: "Grow brand awareness and engagement",
      colors: ["#4F46E5", "#818CF8", "#C7D2FE"],
      industry: user?.industry,
      extractedMetadata: {
        keywords: [],
        coreMessaging: [],
        dos: [],
        donts: [],
        images: [],
        brandIdentity: `${user?.businessName || "Your brand"} is a ${user?.industry || "business"} that connects with customers through authentic communication.`,
      },
    };

    setBrandSnapshot(brandSnapshot);
  };

  const extractBrandNameFromUrl = (url: string): string => {
    try {
      const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`);
      return urlObj.hostname.replace("www.", "").split(".")[0];
    } catch {
      return "Your Brand";
    }
  };

  const getStepIcon = (step: string) => {
    switch (step) {
      case "images":
        return <Image className="w-5 h-5" />;
      case "colors":
        return <Palette className="w-5 h-5" />;
      case "voice":
        return <MessageSquare className="w-5 h-5" />;
      case "offerings":
        return <Package className="w-5 h-5" />;
      default:
        return <Sparkles className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/30 via-white to-blue-50/20 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Indicator */}
        <OnboardingProgress currentStep={4} totalSteps={10} label="AI scanning your brand" />

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 mb-4 animate-pulse">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 mb-3">
            We're scanning your brand...
          </h1>
          <p className="text-slate-600 font-medium">
            Our AI is analyzing your website to build your brand profile
          </p>
        </div>

        {/* Progress Steps */}
        <div className="bg-white/50 backdrop-blur-xl rounded-2xl border border-white/60 p-8 space-y-4">
          {steps.map((step, index) => (
            <div
              key={step.step}
              className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
                step.status === "complete"
                  ? "bg-green-50 border border-green-200"
                  : step.status === "processing"
                  ? "bg-indigo-50 border border-indigo-200"
                  : "bg-slate-50 border border-slate-200"
              }`}
            >
              {/* Icon */}
              <div
                className={`flex-shrink-0 ${
                  step.status === "complete"
                    ? "text-green-600"
                    : step.status === "processing"
                    ? "text-indigo-600"
                    : "text-slate-400"
                }`}
              >
                {step.status === "complete" ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : step.status === "processing" ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  getStepIcon(step.step)
                )}
              </div>

              {/* Content */}
              <div className="flex-1">
                <p
                  className={`font-bold text-sm ${
                    step.status === "complete"
                      ? "text-green-900"
                      : step.status === "processing"
                      ? "text-indigo-900"
                      : "text-slate-600"
                  }`}
                >
                  {step.message}
                </p>
                {step.status === "processing" && (
                  <div className="mt-2 h-1 bg-indigo-200 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full animate-pulse" style={{ width: "60%" }} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-900">
              ⚠️ {error}. Don't worry—we'll create a default profile you can customize.
            </p>
          </div>
        )}

        {/* Completion Message */}
        {isComplete && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
            <p className="text-sm font-bold text-green-900">
              ✨ Brand profile generated! Taking you to review...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

