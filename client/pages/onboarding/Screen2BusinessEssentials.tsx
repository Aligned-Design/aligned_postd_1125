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

const BUSINESS_TYPES = [
  "E-commerce",
  "SaaS / Technology",
  "Professional Services",
  "Healthcare",
  "Real Estate",
  "Education",
  "Food & Beverage",
  "Fitness & Wellness",
  "Retail",
  "Non-profit",
  "Other",
];

export default function Screen2BusinessEssentials() {
  const { user, signUp, setOnboardingStep } = useAuth();
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!websiteUrl.trim()) {
      newErrors.websiteUrl = "Website URL is required";
    } else {
      // Basic URL validation
      try {
        const url = new URL(websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`);
        if (!url.hostname) {
          newErrors.websiteUrl = "Please enter a valid website URL";
        }
      } catch {
        newErrors.websiteUrl = "Please enter a valid website URL (e.g., example.com)";
      }
    }
    if (!businessType) {
      newErrors.businessType = "Please select your business type";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (validate()) {
      // Normalize website URL
      const normalizedUrl = websiteUrl.startsWith("http") 
        ? websiteUrl 
        : `https://${websiteUrl}`;

      // Store business essentials in user object
      if (user) {
        signUp({
          ...user,
          website: normalizedUrl,
          industry: businessType,
          businessName: description || undefined,
        });
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
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-600 to-blue-600 mb-4">
            <Globe className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 mb-3">
            Tell us about your business
          </h1>
          <p className="text-slate-600 font-medium mb-1">
            We'll use this to automatically build your brand profile
          </p>
          <p className="text-slate-500 text-sm">
            Just the basics—we'll handle the rest with AI ✨
          </p>
          <p className="text-slate-400 text-xs mt-2">
            Don't worry—you can change anything later in your Brand Guide
          </p>
        </div>

        {/* Form */}
        <div className="bg-white/50 backdrop-blur-xl rounded-2xl border border-white/60 p-8 space-y-6 mb-6">
          {/* Website URL */}
          <div>
            <label className="block text-sm font-bold text-slate-900 mb-2">
              Business Website <span className="text-red-500">*</span>
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
            <p className="text-xs text-slate-500 mt-2">
              💡 We'll scan your website to extract colors, voice, and brand details automatically
            </p>
          </div>

          {/* Business Type */}
          <div>
            <label className="block text-sm font-bold text-slate-900 mb-2">
              Business Type <span className="text-red-500">*</span>
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
              <option value="">Select your business type</option>
              {BUSINESS_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            {errors.businessType && (
              <p className="text-xs text-red-600 mt-1">{errors.businessType}</p>
            )}
          </div>

          {/* Optional Description */}
          <div>
            <label className="block text-sm font-bold text-slate-900 mb-2">
              One-line Business Description{" "}
              <span className="text-slate-500 font-normal">(Optional)</span>
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
            onClick={() => setOnboardingStep(3)}
            className="text-indigo-600 font-bold hover:text-indigo-700"
          >
            Skip to manual setup
          </button>
        </p>
      </div>
    </div>
  );
}

