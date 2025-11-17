import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UnauthenticatedLayout } from "@shared-components/layout/UnauthenticatedLayout";
import { Check, Sparkles, ArrowRight, HelpCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { analytics } from "@/lib/analytics";

export default function Pricing() {
  const navigate = useNavigate();

  const handleCTA = (plan: "base" | "agency" | "trial", source: string) => {
    analytics.track("pricing_cta_click", {
      plan,
      source,
    });

    if (plan === "trial") {
      navigate("/signup?trial=7");
    } else if (plan === "agency") {
      navigate("/signup?plan=agency");
    } else {
      navigate("/signup");
    }
  };

  return (
    <UnauthenticatedLayout>
      {/* Hero Section */}
      <section className="min-h-[60vh] bg-gradient-to-b from-purple-50 via-white to-gray-50 pt-32 pb-16 px-4 sm:px-6 md:px-8 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-0 right-0 w-full h-full pointer-events-none -z-10">
          <div className="absolute top-20 right-10 w-96 h-96 bg-gradient-to-br from-purple-200/30 to-purple-100/10 rounded-full blur-3xl animate-pulse-glow"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-indigo-200/20 to-indigo-100/10 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-purple-200 rounded-full px-4 py-2 mb-6 shadow-sm">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-semibold text-purple-900">
              NEW – No Hidden Fees
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 mb-6 leading-tight">
            💫 Aligned AI Pricing Framework
          </h1>

          {/* Subheadline */}
          <p className="text-xl sm:text-2xl text-slate-700 font-medium mb-10 max-w-3xl mx-auto">
            Simple. Scalable. Built for brands and agencies that never stop
            growing.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => handleCTA("base", "hero-primary")}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 text-lg shadow-xl shadow-purple-500/40 hover:shadow-2xl hover:shadow-purple-600/50"
            >
              Get Started
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              onClick={() => navigate("/contact")}
              className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-gray-50 text-slate-900 font-semibold rounded-xl transition-all border-2 border-slate-300 hover:border-slate-400 flex items-center justify-center gap-2 text-lg"
            >
              Book a Demo
            </button>

            <button
              onClick={() => handleCTA("trial", "hero-trial")}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-lime-400 to-lime-500 hover:from-lime-300 hover:to-lime-400 text-slate-900 font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 text-lg shadow-xl shadow-lime-400/40 hover:shadow-2xl hover:shadow-lime-500/50"
            >
              <Sparkles className="w-5 h-5" />
              Start 7-Day Guided Trial
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Tier Section */}
      <section className="py-20 px-4 sm:px-6 md:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Base Plan */}
            <div className="bg-white rounded-2xl shadow-xl p-8 relative overflow-hidden border border-gray-200 hover:shadow-2xl transition-shadow">
              {/* Trial Badge */}
              <div className="absolute top-4 right-4">
                <div className="inline-flex items-center gap-1 bg-lime-100 text-lime-800 text-xs font-bold px-3 py-1 rounded-full">
                  🎁 Includes a 7-Day Guided Trial
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-2xl font-black text-slate-900 mb-2">
                  Base Plan
                </h3>
                <p className="text-slate-600 mb-4">
                  Best for independent brands, creators, or small businesses.
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black text-purple-600">
                    $199
                  </span>
                  <span className="text-slate-600 font-medium">
                    /mo per Business
                  </span>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-lime-500 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">
                    1 brand workspace (unlimited posts, AI generation &
                    analytics)
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-lime-500 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">
                    All social integrations
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-lime-500 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">
                    Creative Studio + drag-and-drop Content Queue
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-lime-500 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">
                    Client & Team approval workflows
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-lime-500 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">
                    AI-driven insights + performance tracking
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-lime-500 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">
                    Brand Voice learning & feedback optimization
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-lime-500 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700 font-semibold">
                    ✅ No hidden limits ✅ Cancel anytime
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-lime-500 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700 font-semibold">
                    ✅ Add additional brands @ $199 each (up to 5)
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleCTA("base", "base-plan-card")}
                className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg"
              >
                Start for $199
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            {/* Agency Tier */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl shadow-xl p-8 relative overflow-hidden border-2 border-purple-200 hover:shadow-2xl transition-shadow">
              {/* Popular Badge */}
              <div className="absolute top-4 right-4">
                <div className="inline-flex items-center gap-1 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  ⭐ Best for Agencies
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-2xl font-black text-slate-900 mb-2">
                  Agency Tier
                </h3>
                <p className="text-slate-700 mb-4">
                  Best for agencies, multi-location teams, or family offices.
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black text-purple-600">
                    $99
                  </span>
                  <span className="text-slate-700 font-medium">
                    /mo per Business (5+)
                  </span>
                </div>
                <p className="text-sm text-slate-600 mt-2">
                  Once you reach 5 active brands, pricing auto-adjusts to $99
                  per brand.
                </p>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-800 font-semibold">
                    Everything in Base Plan plus:
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">White-label portal</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">Multi-brand dashboard</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">Role-based access</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">Team analytics roll-up</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">Priority support</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700 font-semibold">
                    ✅ Transparent scaling ✅ No "enterprise call"
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">
                    🧭 Optional onboarding support ($299/client)
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleCTA("agency", "agency-plan-card")}
                className="w-full px-6 py-4 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg"
              >
                Scale Smarter
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Positioning Copy */}
          <div className="mt-12 text-center max-w-3xl mx-auto">
            <div className="bg-white rounded-xl p-6 border-l-4 border-purple-600 shadow-md">
              <p className="text-lg text-slate-700 leading-relaxed">
                <span className="font-bold text-purple-600">
                  Aligned AI starts at $199 per business.
                </span>{" "}
                Once you manage five or more, pricing automatically adjusts to
                $99 per brand — so you're positioned to scale smarter.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Add-Ons Section */}
      <section className="py-20 px-4 sm:px-6 md:px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4 text-center">
            🧾 Add-Ons & Upgrades
          </h2>
          <p className="text-lg text-slate-600 mb-12 text-center max-w-2xl mx-auto">
            Enhance your experience with optional add-ons. No surprises, just
            value.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left py-4 px-6 font-bold text-slate-900 border-b-2 border-gray-300 rounded-tl-xl">
                    Add-On
                  </th>
                  <th className="text-left py-4 px-6 font-bold text-slate-900 border-b-2 border-gray-300">
                    Description
                  </th>
                  <th className="text-right py-4 px-6 font-bold text-slate-900 border-b-2 border-gray-300 rounded-tr-xl">
                    Price
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6 font-semibold text-slate-900 border-b border-gray-200">
                    Onboarding Concierge
                  </td>
                  <td className="py-4 px-6 text-slate-700 border-b border-gray-200">
                    Full setup & brand alignment session
                  </td>
                  <td className="py-4 px-6 text-right font-bold text-purple-600 border-b border-gray-200">
                    $299 per client
                  </td>
                </tr>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6 font-semibold text-slate-900 border-b border-gray-200">
                    Custom Domain + White-Label Portal
                  </td>
                  <td className="py-4 px-6 text-slate-700 border-b border-gray-200">
                    Agency-branded interface
                  </td>
                  <td className="py-4 px-6 text-right font-bold text-purple-600 border-b border-gray-200">
                    $49/mo
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 sm:px-6 md:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <HelpCircle className="w-12 h-12 text-purple-600 mx-auto mb-4" />
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4">
              💬 Frequently Asked Questions
            </h2>
            <p className="text-lg text-slate-600">
              Everything you need to know about Aligned AI pricing.
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-4">
            <AccordionItem
              value="item-1"
              className="bg-white rounded-xl px-6 border border-gray-200 shadow-sm"
            >
              <AccordionTrigger className="text-lg font-semibold text-slate-900 hover:text-purple-600 transition-colors">
                Do you offer a free trial?
              </AccordionTrigger>
              <AccordionContent className="text-slate-700 leading-relaxed">
                Yes! Our <strong>7-Day Guided Trial</strong> lets you create
                content, connect one platform, and publish up to two test posts
                to see the full workflow in action.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="item-2"
              className="bg-white rounded-xl px-6 border border-gray-200 shadow-sm"
            >
              <AccordionTrigger className="text-lg font-semibold text-slate-900 hover:text-purple-600 transition-colors">
                Can I cancel anytime?
              </AccordionTrigger>
              <AccordionContent className="text-slate-700 leading-relaxed">
                Absolutely. Cancel or adjust any plan with 30 days' notice so we
                can wrap up active projects.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="item-3"
              className="bg-white rounded-xl px-6 border border-gray-200 shadow-sm"
            >
              <AccordionTrigger className="text-lg font-semibold text-slate-900 hover:text-purple-600 transition-colors">
                What's included in onboarding?
              </AccordionTrigger>
              <AccordionContent className="text-slate-700 leading-relaxed">
                Every workspace gets a guided brand alignment session. Add the{" "}
                <strong>Onboarding Concierge ($299/client)</strong> for
                multi-brand setup.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="item-4"
              className="bg-white rounded-xl px-6 border border-gray-200 shadow-sm"
            >
              <AccordionTrigger className="text-lg font-semibold text-slate-900 hover:text-purple-600 transition-colors">
                How does pricing scale for agencies?
              </AccordionTrigger>
              <AccordionContent className="text-slate-700 leading-relaxed">
                At 5+ brands, your rate drops to $99 per brand — no contracts,
                no calls.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="item-5"
              className="bg-white rounded-xl px-6 border border-gray-200 shadow-sm"
            >
              <AccordionTrigger className="text-lg font-semibold text-slate-900 hover:text-purple-600 transition-colors">
                Are there hidden fees?
              </AccordionTrigger>
              <AccordionContent className="text-slate-700 leading-relaxed">
                Never. Optional add-ons only; everything else is included.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-20 px-4 sm:px-6 md:px-8 bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4">
            🪶 Your brand message — Aligned and Postd.
          </h2>
          <p className="text-xl sm:text-2xl font-semibold mb-8">
            Start today for $199 or try it free for 7 days.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <button
              onClick={() => handleCTA("trial", "footer-cta")}
              className="px-8 py-4 bg-white hover:bg-gray-100 text-purple-700 font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 text-lg shadow-xl"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleCTA("base", "footer-cta-secondary")}
              className="px-8 py-4 bg-lime-400 hover:bg-lime-300 text-slate-900 font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 text-lg shadow-xl"
            >
              Get Started for $199
            </button>
          </div>

          <p className="text-sm text-purple-100 font-medium">
            Cancel anytime. No contracts. Just results.
          </p>
        </div>
      </section>
    </UnauthenticatedLayout>
  );
}
