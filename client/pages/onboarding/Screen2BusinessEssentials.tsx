/**
 * Screen 2: Business Essentials
 * 
 * Simplified onboarding - just website URL, business type, and optional description.
 * All other details will be scraped by AI or added later in Brand Guide.
 */

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowRight, Globe, Building2 } from "lucide-react";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";

// Helper to extract brand name from URL
const extractBrandNameFromUrl = (url: string): string => {
  try {
    const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`);
    const hostname = urlObj.hostname.replace("www.", "");
    const parts = hostname.split(".");
    return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  } catch {
    return "My Brand";
  }
};

const BUSINESS_TYPES = [
  "E-commerce / Online Retail",
  "SaaS / Technology",
  "Professional Services",
  "Healthcare / Medical",
  "Real Estate",
  "Education / Training",
  "Food & Beverage",
  "Fitness & Wellness",
  "Retail / Brick & Mortar",
  "Non-profit / Charity",
  "Legal Services",
  "Financial Services / Banking",
  "Insurance",
  "Marketing / Advertising Agency",
  "Consulting",
  "Construction / Home Improvement",
  "Automotive",
  "Beauty / Cosmetics",
  "Fashion / Apparel",
  "Travel / Hospitality",
  "Restaurant / Dining",
  "Entertainment / Media",
  "Sports / Recreation",
  "Pet Services",
  "Home Services",
  "Photography / Videography",
  "Event Planning",
  "Interior Design",
  "Architecture",
  "Engineering",
  "Manufacturing",
  "Agriculture / Farming",
  "Energy / Utilities",
  "Transportation / Logistics",
  "Telecommunications",
  "Government / Public Sector",
  "Religious Organization",
  "Arts / Culture",
  "Other",
];

export default function Screen2BusinessEssentials() {
  const { user, updateUser, setOnboardingStep } = useAuth();
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!websiteUrl.trim()) {
      newErrors.websiteUrl = "We need your website to get started. If you don't have one, click 'Skip to manual setup' below.";
    } else {
      // Basic URL validation
      try {
        const url = new URL(websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`);
        if (!url.hostname) {
          newErrors.websiteUrl = "That doesn't look like a website URL. Try: example.com or https://example.com";
        }
      } catch {
        newErrors.websiteUrl = "That doesn't look like a website URL. Try: example.com or https://example.com";
      }
    }
    if (!businessType) {
      newErrors.businessType = "Please select your industry to help us customize content for you";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = async () => {
    if (validate()) {
      // Normalize website URL
      const normalizedUrl = websiteUrl.startsWith("http") 
        ? websiteUrl 
        : `https://${websiteUrl}`;

      console.log("[Onboarding] User clicked 'Continue' with website:", normalizedUrl);

      // ✅ CRITICAL: Create brand FIRST before proceeding
      // This ensures we have a real UUID to use throughout onboarding
      if (user) {
        // Update user info
        updateUser({
          website: normalizedUrl,
          industry: businessType,
          businessName: description || undefined,
        });

        // ✅ Create brand record in database
        try {
          const { apiPost } = await import("@/lib/api");
          const workspaceId = (user as any)?.workspaceId || (user as any)?.tenantId;
          const brandName = description || extractBrandNameFromUrl(normalizedUrl);

          console.log("[Onboarding] Creating brand record", {
            name: brandName,
            website: normalizedUrl,
            workspaceId,
          });

          const brandResponse = await apiPost<{ success: boolean; brand: any }>("/api/brands", {
            name: brandName,
            website_url: normalizedUrl,
            industry: businessType,
            description: description || undefined,
            tenant_id: workspaceId,
            workspace_id: workspaceId,
            autoRunOnboarding: false, // We're already in onboarding
          });

          if (brandResponse.success && brandResponse.brand) {
            const realBrandId = brandResponse.brand.id;
            localStorage.setItem("aligned_brand_id", realBrandId);
            console.log("[Onboarding] ✅ Brand created with UUID:", realBrandId);
          } else {
            throw new Error("Brand creation failed");
          }
          } catch (error) {
            console.error("[Onboarding] ❌ Failed to create brand:", error);
            const { formatErrorForUI } = await import("@/lib/user-friendly-errors");
            const friendlyError = formatErrorForUI(error, "brand");
            
            // ✅ Show user-friendly error to user
            alert(`${friendlyError.title}\n\n${friendlyError.message}\n\n${friendlyError.action}`);
            
            // Don't continue - brand creation is required
            return;
          }
      } else {
        console.error("[Onboarding] ❌ No user found - cannot create brand");
      }

      // Move to expectation setting step
      setOnboardingStep(3);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/30 via-white to-blue-50/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Progress Indicator */}
        <OnboardingProgress currentStep={2} totalSteps={10} label="Business essentials" />

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-600 to-blue-600 mb-4">
            <Globe className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 mb-3">
            Tell us about your business
          </h1>
          <p className="text-slate-600 font-medium text-lg mb-2">
            We'll use this to create content that's perfect for your industry
          </p>
        </div>

        {/* Form */}
        <div className="bg-white/50 backdrop-blur-xl rounded-2xl border border-white/60 p-8 space-y-6 mb-6">
          {/* Website URL */}
          <div>
            <label className="block text-sm font-bold text-slate-900 mb-2">
              Your website URL
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="example.com or https://example.com"
                className={`w-full pl-10 pr-4 py-3 rounded-lg border-2 transition-all focus:outline-none ${
                  errors.websiteUrl
                    ? "border-red-300 bg-red-50/50"
                    : "border-slate-200 bg-white/50 focus:border-indigo-500 focus:bg-white"
                }`}
              />
            </div>
            {errors.websiteUrl && (
              <p className="text-xs text-red-600 mt-1">{errors.websiteUrl}</p>
            )}
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              💡 We'll scan your site to learn your brand voice, colors, and style. 
              Don't have a website? No problem—click "Skip to manual setup" below.
            </p>
          </div>

          {/* Business Type */}
          <div>
            <label className="block text-sm font-bold text-slate-900 mb-2">
              What industry are you in?
            </label>
            <select
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              className={`w-full px-4 py-3 rounded-lg border-2 transition-all focus:outline-none ${
                errors.businessType
                  ? "border-red-300 bg-red-50/50"
                  : "border-slate-200 bg-white/50 focus:border-indigo-500 focus:bg-white"
              }`}
            >
              <option value="">Select your industry</option>
              {BUSINESS_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            {errors.businessType && (
              <p className="text-xs text-red-600 mt-1">{errors.businessType}</p>
            )}
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              💡 This helps us use the right terminology and create industry-specific content.
            </p>
          </div>

          {/* Optional Description */}
          <div>
            <label className="block text-sm font-bold text-slate-900 mb-2">
              Tell us a bit about your business{" "}
              <span className="text-slate-500 font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., A modern SaaS platform helping teams collaborate better"
              rows={2}
              className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 bg-white/50 focus:border-indigo-500 focus:bg-white transition-all focus:outline-none resize-none"
            />
            <p className="text-xs text-slate-500 mt-2">
              This helps us understand your business better. You can skip this and add it later.
            </p>
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={handleContinue}
          className="w-full px-6 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-black rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2 group"
        >
          Continue
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>

        {/* Footer Text */}
        <p className="text-xs text-slate-500 text-center mt-6">
          Don't have a website?{" "}
          <button
            onClick={async () => {
              console.log("[Onboarding] User clicked 'Skip to manual setup' - routing to manual intake");
              
              // Still need to create brand even without website
              if (user && businessType) {
                try {
                  const { apiPost } = await import("@/lib/api");
                  const workspaceId = (user as any)?.workspaceId || (user as any)?.tenantId;
                  const brandName = description || "My Brand";

                  const brandResponse = await apiPost<{ success: boolean; brand: any }>("/api/brands", {
                    name: brandName,
                    website_url: "", // Empty for manual setup
                    industry: businessType,
                    description: description || undefined,
                    tenant_id: workspaceId,
                    workspace_id: workspaceId,
                    autoRunOnboarding: false,
                  });

                  if (brandResponse.success && brandResponse.brand) {
                    localStorage.setItem("aligned_brand_id", brandResponse.brand.id);
                    console.log("[Onboarding] ✅ Brand created for manual setup:", brandResponse.brand.id);
                  }

                  // Update user with empty website to signal manual flow
                  updateUser({
                    website: "",
                    industry: businessType,
                    businessName: description || undefined,
                  });

                  // Route to manual intake screen (step 3.5 - we'll add it to router)
                  // For now, use a special step number that we'll handle
                  localStorage.setItem("aligned:onboarding:manual_setup", "true");
                  setOnboardingStep(3.5); // Special step for manual intake
                } catch (error) {
                  console.error("[Onboarding] Failed to create brand for manual setup:", error);
                  const { formatErrorForUI } = await import("@/lib/user-friendly-errors");
                  const friendlyError = formatErrorForUI(error, "brand");
                  alert(`${friendlyError.title}\n\n${friendlyError.message}\n\n${friendlyError.action}`);
                }
              } else {
                // Fallback: just set empty website and continue
                if (user) {
                  updateUser({
                    website: "",
                    industry: businessType || "Other",
                  });
                }
                localStorage.setItem("aligned:onboarding:manual_setup", "true");
                setOnboardingStep(3.5);
              }
            }}
            className="text-indigo-600 font-bold hover:text-indigo-700 underline"
          >
            Set up manually instead
          </button>
        </p>
      </div>
    </div>
  );
}

