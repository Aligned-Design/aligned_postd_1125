import { Campaign, CampaignGoal, CampaignTone, Platform, CAMPAIGN_GOALS, ContentDistribution } from "@/types/campaign";
import { ContentDistributionSelector } from "./ContentDistributionSelector";
import { X, Sparkles, Hand, Calendar, Target, Music, Zap, MessageCircle, DollarSign, Palette } from "lucide-react";
import { useState } from "react";

interface StartNewCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (campaign: Partial<Campaign>, aiGenerate: boolean) => void;
}

type Step = "method" | "basics" | "distribution" | "strategy" | "review";

const PLATFORM_OPTIONS: { value: Platform; label: string; icon: any }[] = [
  { value: "linkedin", label: "LinkedIn", icon: "💼" },
  { value: "instagram", label: "Instagram", icon: "📸" },
  { value: "facebook", label: "Facebook", icon: "f" },
  { value: "twitter", label: "Twitter", icon: "𝕏" },
  { value: "tiktok", label: "TikTok", icon: "♪" },
  { value: "youtube", label: "YouTube", icon: "▶" },
  { value: "pinterest", label: "Pinterest", icon: "📍" },
  { value: "google_business", label: "Google Business", icon: "🏢" },
];

const GOAL_OPTIONS: { value: CampaignGoal; icon: string }[] = [
  { value: "awareness", icon: "🎯" },
  { value: "engagement", icon: "💬" },
  { value: "sales", icon: "💰" },
  { value: "event", icon: "🎉" },
  { value: "brand-building", icon: "🏢" },
];

const TONE_OPTIONS: CampaignTone[] = ["inspirational", "informative", "promo", "personal"];

export function StartNewCampaignModal({
  isOpen,
  onClose,
  onCreate,
}: StartNewCampaignModalProps) {
  const [step, setStep] = useState<Step>("method");
  const [useAI, setUseAI] = useState(false);

  // Form state
  const [campaignName, setCampaignName] = useState("");
  const [goal, setGoal] = useState<CampaignGoal>("awareness");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [platforms, setPlatforms] = useState<Platform[]>([]);

  const [audiencePersona, setAudiencePersona] = useState("");
  const [tone, setTone] = useState<CampaignTone>("inspirational");
  const [keyMessage, setKeyMessage] = useState("");
  const [postFrequency, setPostFrequency] = useState("5");
  const [notes, setNotes] = useState("");
  const [contentDistribution, setContentDistribution] = useState<ContentDistribution[]>([]);

  const handleMethodSelect = (method: "ai" | "manual") => {
    setUseAI(method === "ai");
    setStep("basics");
  };

  const handleBasicsSubmit = () => {
    if (!campaignName || !startDate || !endDate || platforms.length === 0) {
      alert("Please fill in all required fields");
      return;
    }
    setStep("distribution");
  };

  const handleCreate = () => {
    const campaign: Partial<Campaign> = {
      name: campaignName,
      goal,
      startDate,
      endDate,
      targetPlatforms: platforms,
      description: notes,
      audiencePersona: useAI ? audiencePersona : undefined,
      tone: useAI ? tone : undefined,
      keyMessage: useAI ? keyMessage : undefined,
      postFrequency: useAI ? postFrequency : undefined,
      contentDistribution: contentDistribution.filter((c) => c.count > 0),
      status: "draft",
    };

    onCreate(campaign, useAI);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setStep("method");
    setCampaignName("");
    setGoal("awareness");
    setStartDate("");
    setEndDate("");
    setPlatforms([]);
    setAudiencePersona("");
    setTone("inspirational");
    setKeyMessage("");
    setPostFrequency("5");
    setNotes("");
    setContentDistribution([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-6 flex items-center justify-between border-b border-indigo-700">
          <h2 className="text-2xl font-black flex items-center gap-2">
            <Sparkles className="w-6 h-6" />
            Start New Campaign
          </h2>
          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* METHOD SELECTION */}
          {step === "method" && (
            <div className="space-y-4">
              <p className="text-slate-600 font-medium mb-4">How would you like to create your campaign?</p>

              <button
                onClick={() => handleMethodSelect("ai")}
                className="w-full p-6 border-2 border-indigo-200 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 transition-all duration-300 text-left group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-500 text-white flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Generate with AI</h3>
                    <p className="text-sm text-slate-600 mt-1">
                      Answer a few questions and let AI create your campaign plan, calendar, and draft posts
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleMethodSelect("manual")}
                className="w-full p-6 border-2 border-slate-200 rounded-xl hover:border-slate-400 hover:bg-slate-50 transition-all duration-300 text-left group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-slate-500 to-slate-600 text-white flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Hand className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Manual Campaign</h3>
                    <p className="text-sm text-slate-600 mt-1">
                      Create a campaign from scratch with full control over dates, platforms, and content
                    </p>
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* BASICS STEP */}
          {step === "basics" && (
            <div className="space-y-5">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Target className="w-5 h-5" />
                Campaign Basics
              </h3>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Campaign Name *</label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="e.g., Spring Launch 2024"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Start Date *</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">End Date *</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">Goal *</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {GOAL_OPTIONS.map(({ value, icon }) => (
                    <button
                      key={value}
                      onClick={() => setGoal(value)}
                      className={`p-3 rounded-lg border-2 font-bold text-sm transition-all ${
                        goal === value
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                          : "border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      <span className="text-lg block mb-1">{icon}</span>
                      {value
                        .split("-")
                        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                        .join(" ")}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">Target Platforms *</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PLATFORM_OPTIONS.map(({ value, label, icon }) => (
                    <button
                      key={value}
                      onClick={() =>
                        setPlatforms(
                          platforms.includes(value)
                            ? platforms.filter((p) => p !== value)
                            : [...platforms, value]
                        )
                      }
                      className={`p-3 rounded-lg border-2 font-bold text-xs text-center transition-all ${
                        platforms.includes(value)
                          ? "border-lime-400 bg-lime-50 text-lime-700"
                          : "border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      <span className="text-lg block mb-1">{icon}</span>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional notes or details about this campaign..."
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    resetForm();
                    onClose();
                  }}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setStep("distribution")}
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-colors"
                >
                  Next: Content Breakdown
                </button>
              </div>
            </div>
          )}

          {/* DISTRIBUTION STEP */}
          {step === "distribution" && (
            <div className="space-y-5">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                📊 Content Distribution
              </h3>

              <ContentDistributionSelector
                selectedPlatforms={platforms.map((p) => p)}
                onDistributionChange={setContentDistribution}
              />

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setStep("basics")}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => useAI ? setStep("strategy") : handleCreate}
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-colors"
                >
                  {useAI ? "Next: Strategy" : "Create Campaign"}
                </button>
              </div>
            </div>
          )}

          {/* STRATEGY STEP (AI only) */}
          {step === "strategy" && useAI && (
            <div className="space-y-5">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Strategy Setup
              </h3>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Audience Persona</label>
                <input
                  type="text"
                  value={audiencePersona}
                  onChange={(e) => setAudiencePersona(e.target.value)}
                  placeholder="e.g., Busy professionals aged 25-40"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">Tone</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {TONE_OPTIONS.map((toneOption) => (
                    <button
                      key={toneOption}
                      onClick={() => setTone(toneOption)}
                      className={`p-3 rounded-lg border-2 font-bold text-sm transition-all ${
                        tone === toneOption
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                          : "border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {toneOption.charAt(0).toUpperCase() + toneOption.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Key Message or Offer</label>
                <textarea
                  value={keyMessage}
                  onChange={(e) => setKeyMessage(e.target.value)}
                  placeholder="What's the main message you want to communicate?"
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Posting Frequency</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="14"
                    value={postFrequency}
                    onChange={(e) => setPostFrequency(e.target.value)}
                    className="w-16 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-slate-600 font-medium">posts over the campaign duration</span>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setStep("distribution")}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep("review")}
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-colors"
                >
                  Review Plan
                </button>
              </div>
            </div>
          )}

          {/* REVIEW STEP */}
          {step === "review" && (
            <div className="space-y-5">
              <h3 className="text-lg font-black text-slate-900">Review Your Campaign</h3>

              <div className="bg-slate-50 p-4 rounded-lg space-y-3">
                <div>
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Campaign Name</p>
                  <p className="text-base font-black text-slate-900">{campaignName}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Goal</p>
                    <p className="text-sm font-bold text-slate-900">
                      {CAMPAIGN_GOALS[goal]}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Duration</p>
                    <p className="text-sm font-bold text-slate-900">
                      {new Date(startDate).toLocaleDateString()} -{" "}
                      {new Date(endDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Platforms</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {platforms.map((p) => (
                      <span
                        key={p}
                        className="px-3 py-1 rounded-full bg-lime-100 text-lime-700 text-xs font-bold"
                      >
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </span>
                    ))}
                  </div>
                </div>

                {useAI && (
                  <>
                    <div>
                      <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Tone</p>
                      <p className="text-sm font-bold text-slate-900">
                        {tone.charAt(0).toUpperCase() + tone.slice(1)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Posts</p>
                      <p className="text-sm font-bold text-slate-900">{postFrequency} posts planned</p>
                    </div>
                  </>
                )}

                {contentDistribution.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Content Breakdown</p>
                    <div className="space-y-1.5">
                      {contentDistribution
                        .filter((c) => c.count > 0)
                        .map((item) => (
                          <div key={item.id} className="flex items-center justify-between text-sm">
                            <span className="text-slate-700 font-medium">
                              {item.icon} {item.label}
                            </span>
                            <span className="font-black text-indigo-600">{item.count}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {useAI && (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                  <p className="text-sm text-blue-800 font-medium">
                    <Sparkles className="w-4 h-4 inline mr-2" />
                    AI will generate a complete campaign plan with:
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-blue-700 ml-6">
                    <li>• Auto-generated campaign calendar</li>
                    <li>• Post recommendations per platform</li>
                    <li>• Themes and content ideas</li>
                    <li>• Draft posts ready to customize</li>
                  </ul>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setStep(useAI ? "strategy" : "distribution")}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleCreate}
                  className="flex-1 px-4 py-2 bg-lime-400 hover:bg-lime-300 text-indigo-950 rounded-lg font-bold transition-colors"
                >
                  {useAI ? "Generate Campaign Plan" : "Create Campaign"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
