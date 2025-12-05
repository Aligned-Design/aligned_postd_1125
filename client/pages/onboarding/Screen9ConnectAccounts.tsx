/**
 * Screen 9: Connect Accounts
 * 
 * Triggered after user engages with calendar (clicks, drags, edits).
 * Shows platform connection options.
 * User can connect now or skip to test mode.
 */

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowRight, Check, X, Instagram, Facebook, Linkedin, Twitter, Mail, MapPin } from "lucide-react";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";

const PLATFORMS = [
  { id: "instagram", name: "Instagram", icon: Instagram, color: "from-pink-500 to-rose-500", comingSoon: false },
  { id: "facebook", name: "Facebook", icon: Facebook, color: "from-blue-500 to-blue-600", comingSoon: false },
  { id: "linkedin", name: "LinkedIn", icon: Linkedin, color: "from-blue-600 to-blue-700", comingSoon: false },
  { id: "twitter", name: "Twitter / X", icon: Twitter, color: "from-slate-700 to-slate-900", comingSoon: false },
  { id: "email", name: "Email", icon: Mail, color: "from-purple-500 to-indigo-500", comingSoon: false },
  { id: "google", name: "Google Business", icon: MapPin, color: "from-green-500 to-emerald-500", comingSoon: true }, // ✅ Stubbed connector
];

export default function Screen9ConnectAccounts() {
  const { setOnboardingStep } = useAuth();
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);
  const [isConnecting, setIsConnecting] = useState<string | null>(null);

  const handleConnect = async (platformId: string) => {
    setIsConnecting(platformId);
    
    // Simulate connection (in real app, this would open OAuth flow)
    setTimeout(() => {
      setConnectedPlatforms((prev) => [...prev, platformId]);
      setIsConnecting(null);
    }, 1500);
  };

  const handleDisconnect = (platformId: string) => {
    setConnectedPlatforms((prev) => prev.filter((id) => id !== platformId));
  };

  const handleContinue = () => {
    // Mark onboarding as complete
    setOnboardingStep(10);
  };

  const handleSkip = () => {
    // Mark as skipped, continue to dashboard
    // TODO: Migrate from "aligned:onboarding:connect_skipped" to "postd:onboarding:connect_skipped"
    localStorage.setItem("postd:onboarding:connect_skipped", "true");
    localStorage.setItem("aligned:onboarding:connect_skipped", "true"); // Backward compatibility
    setOnboardingStep(10);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/30 via-white to-blue-50/20 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Progress Indicator */}
        <OnboardingProgress currentStep={9} totalSteps={10} label="Connect your accounts" />

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 mb-4">
            <Check className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 mb-3">
            Connect your accounts to publish
          </h1>
          <p className="text-slate-600 font-medium text-lg">
            Link your social media and email accounts to publish content automatically
          </p>
          <p className="text-sm text-slate-500 mt-2">
            You can always connect more later
          </p>
        </div>

        {/* Platform Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {PLATFORMS.map((platform) => {
            const Icon = platform.icon;
            const isConnected = connectedPlatforms.includes(platform.id);
            const isConnectingPlatform = isConnecting === platform.id;

            return (
              <div
                key={platform.id}
                className={`p-6 rounded-2xl border-2 transition-all ${
                  isConnected
                    ? "border-green-500 bg-green-50"
                    : "border-slate-200 bg-white/50 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${platform.color} flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  {isConnected && (
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-black text-slate-900">{platform.name}</h3>
                  {platform.comingSoon && (
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-semibold rounded">
                      Coming Soon
                    </span>
                  )}
                </div>
                {isConnected ? (
                  <button
                    onClick={() => handleDisconnect(platform.id)}
                    className="w-full px-4 py-2 bg-red-100 text-red-700 font-bold rounded-lg hover:bg-red-200 transition-colors text-sm"
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (platform.comingSoon) {
                        alert(`${platform.name} integration is coming soon. Check back later!`);
                        return;
                      }
                      handleConnect(platform.id);
                    }}
                    disabled={isConnectingPlatform || platform.comingSoon}
                    className={`w-full px-4 py-2 font-black rounded-lg transition-colors text-sm ${
                      isConnectingPlatform || platform.comingSoon
                        ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                        : "bg-indigo-600 text-white hover:bg-indigo-700"
                    }`}
                  >
                    {isConnectingPlatform ? "Connecting..." : platform.comingSoon ? "Coming Soon" : "Connect"}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleSkip}
            className="flex-1 px-6 py-4 bg-white border-2 border-slate-300 text-slate-700 font-black rounded-lg hover:bg-slate-50 transition-all"
          >
            Skip for now (Test Mode)
          </button>
          <button
            onClick={handleContinue}
            className="flex-1 px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            Continue
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

