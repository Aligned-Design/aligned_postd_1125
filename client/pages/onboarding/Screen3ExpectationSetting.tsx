/**
 * Screen 3: Expectation Setting
 * 
 * Lightweight micro-step that sets expectations before AI scrape.
 * Explains what will be pulled from the website.
 */

import { useAuth } from "@/contexts/AuthContext";
import { ArrowRight, Sparkles, Image, Palette, MessageSquare, Package } from "lucide-react";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";

export default function Screen3ExpectationSetting() {
  const { setOnboardingStep } = useAuth();

  const handleStartScan = () => {
    setOnboardingStep(4);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/30 via-white to-blue-50/20 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Indicator */}
        <OnboardingProgress currentStep={3} totalSteps={10} label="Setting expectations" />

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 mb-4 animate-pulse">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 mb-3">
            We're about to build your brand automatically
          </h1>
          <p className="text-slate-600 font-medium text-lg">
            We'll pull everything we need from your website
          </p>
        </div>

        {/* What We'll Extract */}
        <div className="bg-white/50 backdrop-blur-xl rounded-2xl border border-white/60 p-8 mb-6">
          <h2 className="text-xl font-black text-slate-900 mb-6 text-center">
            Here's what we'll extract:
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Images */}
            <div className="flex items-start gap-4 p-4 rounded-lg bg-indigo-50/50 border border-indigo-100">
              <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <Image className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-1">Brand Images</h3>
                <p className="text-sm text-slate-600">
                  Hero images, product photos, and visual assets
                </p>
              </div>
            </div>

            {/* Colors */}
            <div className="flex items-start gap-4 p-4 rounded-lg bg-purple-50/50 border border-purple-100">
              <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Palette className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-1">Color Palette</h3>
                <p className="text-sm text-slate-600">
                  Primary, secondary, and accent colors
                </p>
              </div>
            </div>

            {/* Tone */}
            <div className="flex items-start gap-4 p-4 rounded-lg bg-blue-50/50 border border-blue-100">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-1">Brand Voice</h3>
                <p className="text-sm text-slate-600">
                  Tone, messaging style, and communication patterns
                </p>
              </div>
            </div>

            {/* Offerings */}
            <div className="flex items-start gap-4 p-4 rounded-lg bg-emerald-50/50 border border-emerald-100">
              <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <Package className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-1">Services & Products</h3>
                <p className="text-sm text-slate-600">
                  Key offerings and value propositions
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Reassurance Message */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6 text-center">
          <p className="text-sm text-blue-900 font-medium">
            💡 <strong>Don't worry</strong> — You can edit anything later in your Brand Guide
          </p>
        </div>

        {/* CTA Button */}
        <button
          onClick={handleStartScan}
          className="w-full px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2 group text-lg"
        >
          Start Scan
          <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}

