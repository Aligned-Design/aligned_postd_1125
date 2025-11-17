import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowRight,
  Plus,
  X,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Info,
  HelpCircle,
} from "lucide-react";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface PlatformAccount {
  id: string;
  name: string;
  emoji: string;
  connected: boolean;
  username?: string;
  error?: {
    message: string;
    reason: string;
    canRetry: boolean;
  };
}

const PLATFORMS: PlatformAccount[] = [
  { id: "instagram", name: "Instagram", emoji: "📸", connected: false },
  { id: "facebook", name: "Facebook", emoji: "👥", connected: false },
  { id: "linkedin", name: "LinkedIn", emoji: "💼", connected: false },
  { id: "google", name: "Google Business", emoji: "🔍", connected: false },
  { id: "mailchimp", name: "Mailchimp", emoji: "📧", connected: false },
];

const ERROR_EXPLANATIONS: Record<
  string,
  { title: string; description: string; solution: string }
> = {
  permission_denied: {
    title: "Permission Denied",
    description: "You declined to grant permissions to Postd.",
    solution:
      "Click 'Retry' and make sure to accept all required permissions in the authorization window.",
  },
  token_expired: {
    title: "Session Expired",
    description: "The authorization session expired or timed out.",
    solution:
      "Click 'Retry' to start a fresh connection. The process usually takes less than 30 seconds.",
  },
  network_error: {
    title: "Network Error",
    description: "Unable to connect to the platform's servers.",
    solution:
      "Check your internet connection and try again. If the problem persists, the platform may be experiencing issues.",
  },
  invalid_credentials: {
    title: "Invalid Credentials",
    description: "The account credentials couldn't be verified.",
    solution:
      "Make sure you're logged into the correct account in your browser before trying again.",
  },
};

export default function Screen35ConnectAccounts() {
  const { setOnboardingStep } = useAuth();
  const [platforms, setPlatforms] = useState<PlatformAccount[]>(PLATFORMS);
  const [connecting, setConnecting] = useState<string | null>(null);

  const handleConnect = async (id: string) => {
    setConnecting(id);

    // Clear any previous errors
    setPlatforms(
      platforms.map((p) => (p.id === id ? { ...p, error: undefined } : p)),
    );

    // Simulate auth flow (real implementation would open OAuth dialog)
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Simulate random success/failure for demo
    const success = Math.random() > 0.3; // 70% success rate

    if (success) {
      setPlatforms(
        platforms.map((p) =>
          p.id === id
            ? {
                ...p,
                connected: true,
                username: `@user_${id}`,
                error: undefined,
              }
            : p,
        ),
      );
    } else {
      // Simulate error
      const errorTypes = [
        "permission_denied",
        "token_expired",
        "network_error",
      ];
      const errorType =
        errorTypes[Math.floor(Math.random() * errorTypes.length)];

      setPlatforms(
        platforms.map((p) =>
          p.id === id
            ? {
                ...p,
                connected: false,
                error: {
                  message: ERROR_EXPLANATIONS[errorType].title,
                  reason: errorType,
                  canRetry: true,
                },
              }
            : p,
        ),
      );
    }

    setConnecting(null);
  };

  const handleDisconnect = (id: string) => {
    setPlatforms(
      platforms.map((p) =>
        p.id === id
          ? { ...p, connected: false, username: undefined, error: undefined }
          : p,
      ),
    );
  };

  const handleSkip = () => {
    setOnboardingStep(5);
  };

  const handleContinue = () => {
    setOnboardingStep(5);
  };

  const connectedCount = platforms.filter((p) => p.connected).length;
  const hasErrors = platforms.some((p) => p.error);

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/30 via-white to-blue-50/20 p-4">
      <div className="max-w-3xl mx-auto pt-6">
        {/* Progress Indicator */}
        <OnboardingProgress currentStep={3.5} totalSteps={5} label="Connect accounts" className="mb-6" />

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-100 mb-4">
            <span className="text-2xl">🔗</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">
            Ready to publish?
          </h1>
          <p className="text-slate-600 font-medium">
            Connect your accounts to publish directly from Aligned
          </p>
          <p className="text-xs text-slate-500 mt-2">
            ⏭️ This step is optional—you can connect platforms later
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-slate-700">
              {connectedCount} of {platforms.length} connected
            </span>
            {connectedCount > 0 && (
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-700 border-green-200"
              >
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Great start!
              </Badge>
            )}
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
              style={{ width: `${(connectedCount / platforms.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Platforms Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {platforms.map((platform) => (
            <div
              key={platform.id}
              className={`relative p-6 rounded-2xl border-2 transition-all ${
                platform.connected
                  ? "bg-green-50/50 border-green-300 shadow-sm"
                  : platform.error
                    ? "bg-red-50/50 border-red-300"
                    : "bg-white/50 border-slate-200 hover:border-indigo-300"
              }`}
            >
              {/* Platform Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-3xl mb-2">{platform.emoji}</div>
                  <h3 className="font-black text-slate-900 text-sm">
                    {platform.name}
                  </h3>
                </div>
                {platform.connected && (
                  <div className="bg-green-100 rounded-full p-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                )}
                {platform.error && (
                  <div className="bg-red-100 rounded-full p-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  </div>
                )}
              </div>

              {/* Connected State */}
              {platform.connected && (
                <div className="space-y-3">
                  <div className="px-3 py-2 bg-green-100 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-green-700 font-bold">
                          Connected
                        </p>
                        <p className="text-xs text-green-800 font-medium truncate">
                          {platform.username}
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDisconnect(platform.id)}
                    className="w-full px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    Disconnect
                  </button>
                </div>
              )}

              {/* Error State */}
              {platform.error && (
                <div className="space-y-3">
                  <div className="px-3 py-2 bg-red-100 rounded-lg border border-red-200">
                    <div className="flex items-start gap-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-red-700 font-bold">
                          {platform.error.message}
                        </p>
                        <p className="text-xs text-red-600 mt-1">
                          {
                            ERROR_EXPLANATIONS[platform.error.reason]
                              ?.description
                          }
                        </p>
                      </div>
                    </div>

                    {/* What Happened Link */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <button className="text-xs text-red-700 hover:text-red-900 font-medium flex items-center gap-1 mt-1">
                          <HelpCircle className="w-3 h-3" />
                          What happened?
                        </button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-red-600" />
                            {ERROR_EXPLANATIONS[platform.error.reason]?.title}
                          </DialogTitle>
                          <DialogDescription className="text-left space-y-3 pt-2">
                            <div>
                              <p className="text-sm font-bold text-slate-900 mb-1">
                                What happened:
                              </p>
                              <p className="text-sm text-slate-600">
                                {
                                  ERROR_EXPLANATIONS[platform.error.reason]
                                    ?.description
                                }
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900 mb-1">
                                How to fix it:
                              </p>
                              <p className="text-sm text-slate-600">
                                {
                                  ERROR_EXPLANATIONS[platform.error.reason]
                                    ?.solution
                                }
                              </p>
                            </div>
                          </DialogDescription>
                        </DialogHeader>
                        <div className="flex gap-2 mt-4">
                          <DialogTrigger asChild>
                            <Button variant="outline" className="flex-1">
                              Close
                            </Button>
                          </DialogTrigger>
                          <Button
                            onClick={() => handleConnect(platform.id)}
                            className="flex-1 gap-2"
                          >
                            <RefreshCw className="w-4 h-4" />
                            Try Again
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {/* Retry Button */}
                  {platform.error.canRetry && (
                    <button
                      onClick={() => handleConnect(platform.id)}
                      disabled={connecting === platform.id}
                      className="w-full px-4 py-2 bg-red-600 text-white font-bold text-sm rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {connecting === platform.id ? (
                        <>
                          <span className="inline-block animate-spin">⏳</span>
                          Retrying...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4" />
                          Try Again
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}

              {/* Not Connected State */}
              {!platform.connected && !platform.error && (
                <button
                  onClick={() => handleConnect(platform.id)}
                  disabled={connecting === platform.id}
                  className="w-full px-4 py-2 bg-indigo-600 text-white font-bold text-sm rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {connecting === platform.id ? (
                    <>
                      <span className="inline-block animate-spin">⏳</span>
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Connect
                    </>
                  )}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Info Box */}
        <div
          className={`rounded-xl p-4 mb-8 border ${
            hasErrors
              ? "bg-amber-50 border-amber-200"
              : "bg-blue-50 border-blue-200"
          }`}
        >
          <div className="flex items-start gap-3">
            <Info
              className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                hasErrors ? "text-amber-600" : "text-blue-600"
              }`}
            />
            <div className="space-y-2">
              {hasErrors ? (
                <>
                  <p className="text-sm font-bold text-amber-900">
                    Connection Issues? No Problem!
                  </p>
                  <p className="text-xs text-amber-800">
                    You can retry connections now or set them up later from
                    Settings → Integrations. You can still use Aligned to plan
                    and approve content without platform connections.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-bold text-blue-900">
                    💡 Good to Know
                  </p>
                  <p className="text-xs text-blue-800">
                    You can add or change platforms anytime from Settings.
                    Starting without connections? No problem—use Aligned to plan
                    and approve content, then manually post when ready.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleSkip}
            className="flex-1 px-6 py-4 bg-white/50 border-2 border-slate-200 text-slate-700 font-black rounded-lg hover:bg-slate-50 transition-all"
          >
            Skip for Now
          </button>
          <button
            onClick={handleContinue}
            className="flex-1 px-6 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-black rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2 group"
          >
            Continue
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
