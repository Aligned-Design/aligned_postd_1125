import { EventType, EVENT_TYPE_CONFIGS } from "@/types/event";
import { X, Wand2, PenTool } from "lucide-react";

interface EventCreationModeProps {
  isOpen: boolean;
  eventType: EventType | null;
  onClose: () => void;
  onSelectMode: (mode: "ai" | "manual") => void;
}

export function EventCreationMode({
  isOpen,
  eventType,
  onClose,
  onSelectMode,
}: EventCreationModeProps) {
  if (!isOpen || !eventType) return null;

  const config = EVENT_TYPE_CONFIGS[eventType];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-indigo-50 to-blue-50 p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">{config.icon}</span>
              <h2 className="text-2xl font-black text-slate-900">{config.name}</h2>
            </div>
            <p className="text-sm text-slate-600">
              How would you like to create this event?
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Mode selection cards */}
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* AI Generation */}
            <button
              onClick={() => onSelectMode("ai")}
              className="group border-2 border-lime-300 bg-gradient-to-br from-lime-50 to-green-50 rounded-2xl p-6 hover:shadow-lg hover:border-lime-400 transition-all duration-300 text-left"
            >
              <div className="flex items-start justify-between mb-4">
                <Wand2 className="w-8 h-8 text-lime-600 group-hover:scale-110 transition-transform" />
                <span className="px-3 py-1 bg-lime-200 text-lime-900 text-xs font-black rounded-full">
                  Recommended
                </span>
              </div>

              <h3 className="text-lg font-black text-slate-900 mb-2">✨ Generate with AI</h3>

              <p className="text-sm font-medium text-slate-700 mb-4">
                Describe your event and let AI do the strategic heavy lifting.
              </p>

              <div className="space-y-2 mb-6 p-4 bg-white/50 rounded-lg border border-lime-200">
                <p className="text-xs font-bold text-slate-700">AI will generate:</p>
                <ul className="text-xs text-slate-600 space-y-1">
                  <li>✓ Event title, description & SEO tags</li>
                  <li>✓ 5+ promotion posts (pre/during/after)</li>
                  <li>✓ Optimal posting schedule</li>
                  <li>✓ Platform-specific copy variants</li>
                  <li>✓ Hashtags & image prompts</li>
                </ul>
              </div>

              <div className="text-xs text-slate-600 mb-4">
                💡 <span className="font-medium">Saves 30+ minutes</span> of planning & writing
              </div>

              <div className="pt-4 border-t border-lime-200 text-center">
                <p className="text-sm font-black text-lime-600 group-hover:text-lime-700">
                  Answer a few questions →
                </p>
              </div>
            </button>

            {/* Manual Setup */}
            <button
              onClick={() => onSelectMode("manual")}
              className="group border-2 border-slate-300 bg-white rounded-2xl p-6 hover:shadow-lg hover:border-slate-400 transition-all duration-300 text-left"
            >
              <div className="flex items-start justify-between mb-4">
                <PenTool className="w-8 h-8 text-slate-600 group-hover:scale-110 transition-transform" />
                <span className="px-3 py-1 bg-slate-200 text-slate-700 text-xs font-bold rounded-full">
                  Full Control
                </span>
              </div>

              <h3 className="text-lg font-black text-slate-900 mb-2">🖋️ Manual Setup</h3>

              <p className="text-sm font-medium text-slate-700 mb-4">
                Build your event step-by-step with full customization from the start.
              </p>

              <div className="space-y-2 mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-xs font-bold text-slate-700">You'll fill in:</p>
                <ul className="text-xs text-slate-600 space-y-1">
                  <li>✓ Event title, date, time, location</li>
                  <li>✓ Description & details</li>
                  <li>✓ Platforms to publish to</li>
                  <li>✓ Manually add promotion posts</li>
                  <li>✓ Campaign linkage</li>
                </ul>
              </div>

              <div className="text-xs text-slate-600 mb-4">
                Takes about 10-15 minutes for full setup
              </div>

              <div className="pt-4 border-t border-slate-200 text-center">
                <p className="text-sm font-black text-slate-600 group-hover:text-slate-700">
                  Go to event form →
                </p>
              </div>
            </button>
          </div>

          {/* Info box */}
          <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-xs text-amber-900">
              <span className="font-black">✨ Pro Tip:</span> You can always refine AI suggestions before saving. No commitment needed!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
