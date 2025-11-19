import { useState } from "react";
import { BrandGuide, TONE_OPTIONS } from "@/types/brandGuide";
import { Sparkles, X } from "lucide-react";

interface VoiceToneEditorProps {
  brand: BrandGuide;
  onUpdate: (updates: Partial<BrandGuide>) => void;
}

// Mock AI suggestions based on tone selections
function generateAIToneSuggestions(selectedTones: string[]): string[] {
  const suggestions: Record<string, string[]> = {
    Friendly: [
      "Use conversational language like you're talking to a friend",
      "Include casual greetings and warm sign-offs",
      "Share relatable stories and personal experiences",
    ],
    Professional: [
      "Use industry-standard terminology and formal language",
      "Maintain a structured, organized communication style",
      "Focus on credibility and expertise",
    ],
    Playful: [
      "Use humor and witty wordplay throughout communications",
      "Incorporate emojis and casual punctuation where appropriate",
      "Have fun with language and don't take yourself too seriously",
    ],
    Confident: [
      "Use strong, assertive language without hedging",
      "Make bold claims backed by evidence",
      "Position your brand as a trusted authority",
    ],
    Empathetic: [
      "Acknowledge customer pain points and emotions",
      "Use 'you' and 'we' language to create connection",
      "Show genuine care in every interaction",
    ],
    Default: [
      "Be clear and concise in all communications",
      "Use active voice to create engaging content",
      "Focus on benefits that matter to your audience",
    ],
  };

  const allSuggestions = selectedTones.length > 0
    ? selectedTones.flatMap(tone => suggestions[tone] || suggestions.Default)
    : suggestions.Default;

  return [...new Set(allSuggestions)].slice(0, 4);
}

export function VoiceToneEditor({ brand, onUpdate }: VoiceToneEditorProps) {
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleToggleTone = (tone: string) => {
    const newTone = brand.tone.includes(tone)
      ? brand.tone.filter((t) => t !== tone)
      : [...brand.tone, tone];
    onUpdate({ tone: newTone });
  };

  const handleAIVariations = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const suggestions = generateAIToneSuggestions(brand.tone);
      onUpdate({ aiToneSuggestions: suggestions });
      setShowAISuggestions(true);
      setIsGenerating(false);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/50 backdrop-blur-xl rounded-xl border border-white/60 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black text-slate-900">Voice & Tone</h2>
          <button
            onClick={handleAIVariations}
            disabled={isGenerating || brand.tone.length === 0}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold text-sm"
          >
            <Sparkles className="w-4 h-4" />
            {isGenerating ? "Generating..." : "AI Variations"}
          </button>
        </div>
        <p className="text-sm text-slate-600 mb-6">Select keywords that describe your brand voice</p>

        <div className="flex flex-wrap gap-2 mb-8">
          {TONE_OPTIONS.map((tone) => (
            <button
              key={tone}
              onClick={() => handleToggleTone(tone)}
              className={`px-4 py-2 rounded-full font-bold text-sm transition-all ${
                brand.tone.includes(tone)
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {tone}
            </button>
          ))}
        </div>

        {brand.tone.length > 0 && (
          <p className="text-xs text-slate-600 bg-indigo-50 p-3 rounded-lg">
            {brand.tone.length} tone(s) selected. Add more keywords or adjust sliders below to refine your voice.
          </p>
        )}
      </div>

      {/* Sliders */}
      <div className="bg-white/50 backdrop-blur-xl rounded-xl border border-white/60 p-6">
        <h3 className="text-lg font-black text-slate-900 mb-6">Tone Adjustments</h3>

        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-bold text-slate-900">Friendliness</label>
              <span className="text-sm font-bold text-indigo-600">{brand.friendlinessLevel}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={brand.friendlinessLevel}
              onChange={(e) => onUpdate({ friendlinessLevel: Number(e.target.value) })}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>Formal</span>
              <span>Warm & Friendly</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-bold text-slate-900">Formality</label>
              <span className="text-sm font-bold text-indigo-600">{brand.formalityLevel}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={brand.formalityLevel}
              onChange={(e) => onUpdate({ formalityLevel: Number(e.target.value) })}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>Casual</span>
              <span>Professional</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-bold text-slate-900">Confidence</label>
              <span className="text-sm font-bold text-indigo-600">{brand.confidenceLevel}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={brand.confidenceLevel}
              onChange={(e) => onUpdate({ confidenceLevel: Number(e.target.value) })}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>Tentative</span>
              <span>Bold & Authoritative</span>
            </div>
          </div>
        </div>
      </div>

      {/* Voice Description */}
      <div className="bg-white/50 backdrop-blur-xl rounded-xl border border-white/60 p-6">
        <h3 className="text-lg font-black text-slate-900 mb-2">Voice Description</h3>
        <p className="text-sm text-slate-600 mb-3">Describe how your brand communicates</p>
        <textarea
          value={brand.voiceDescription || ""}
          onChange={(e) => onUpdate({ voiceDescription: e.target.value })}
          placeholder="e.g., We speak directly to our audience with empathy and warmth, using conversational language while maintaining professional credibility..."
          className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
          rows={4}
        />
      </div>

      {/* AI Suggestions */}
      {showAISuggestions && brand.aiToneSuggestions && brand.aiToneSuggestions.length > 0 && (
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              AI Communication Tips
            </h3>
            <button
              onClick={() => setShowAISuggestions(false)}
              className="text-slate-600 hover:text-slate-900 p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-sm text-slate-700 mb-4">
            Based on your selected tones ({brand.tone.join(", ")}), here's how to apply them:
          </p>

          <ul className="space-y-3">
            {brand.aiToneSuggestions.map((suggestion, idx) => (
              <li key={idx} className="flex gap-3 items-start">
                <span className="w-6 h-6 rounded-full bg-purple-200 text-purple-700 font-bold flex items-center justify-center text-xs flex-shrink-0">
                  {idx + 1}
                </span>
                <p className="text-sm text-slate-700 pt-0.5">{suggestion}</p>
              </li>
            ))}
          </ul>

          <div className="mt-4 p-3 bg-white rounded-lg border border-purple-200">
            <p className="text-xs text-slate-600">
              💡 Tip: These suggestions are starting points. Feel free to adapt them to your brand's specific context and audience.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
