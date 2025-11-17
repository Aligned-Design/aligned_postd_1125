import { Event, EVENT_TYPE_CONFIGS } from "@/types/event";
import { X, Sparkles, Plus, XCircle } from "lucide-react";

interface EventConfirmationModalProps {
  isOpen: boolean;
  event: Event | null;
  onClose: () => void;
  onGenerateCampaign: () => void;
  onLaunchManually: () => void;
  onSkip: () => void;
  isGenerating?: boolean;
}

export function EventConfirmationModal({
  isOpen,
  event,
  onClose,
  onGenerateCampaign,
  onLaunchManually,
  onSkip,
  isGenerating = false,
}: EventConfirmationModalProps) {
  if (!isOpen || !event) return null;

  const config = EVENT_TYPE_CONFIGS[event.eventType];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-green-50 to-lime-50 p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl animate-bounce">✨</span>
              <h2 className="text-2xl font-black text-slate-900">Event Created!</h2>
            </div>
            <p className="text-sm text-slate-600">
              Your {config.name} is ready. Let's amplify its reach.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Event summary */}
          <div className="mb-8 p-6 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-start gap-4">
              <div className="text-4xl">{config.icon}</div>
              <div className="flex-1">
                <h3 className="text-lg font-black text-slate-900 mb-1">{event.title}</h3>
                <p className="text-sm text-slate-600 mb-3">
                  {new Date(event.startDate).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}{" "}
                  at {event.startTime} • {event.location}
                </p>
                <div className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold">
                  {config.name}
                </div>
              </div>
            </div>
          </div>

          {/* Main options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Generate Campaign */}
            <button
              onClick={onGenerateCampaign}
              disabled={isGenerating}
              className="group bg-gradient-to-br from-lime-100 to-green-100 border-2 border-lime-300 rounded-xl p-6 hover:shadow-lg hover:border-lime-400 transition-all duration-300 text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-start justify-between mb-4">
                <Sparkles className="w-8 h-8 text-lime-600 group-hover:scale-110 transition-transform group-disabled:animate-spin" />
              </div>

              <h3 className="text-lg font-black text-slate-900 mb-2">
                ✨ Generate Campaign
              </h3>

              <p className="text-sm font-medium text-slate-700 mb-4">
                AI creates a full promotion campaign with posts, schedule, and cross-platform variants.
              </p>

              <div className="space-y-2 mb-4 p-3 bg-white/50 rounded-lg border border-lime-200">
                <p className="text-xs font-bold text-slate-700">AI will create:</p>
                <ul className="text-xs text-slate-600 space-y-1">
                  <li>✓ {event.promotionSchedule?.length || 3}+ promotional posts</li>
                  <li>✓ Optimal posting cadence</li>
                  <li>✓ Platform-specific copy</li>
                  <li>✓ Connected campaign</li>
                </ul>
              </div>

              <div className="pt-4 border-t border-lime-200">
                <p className="text-sm font-black text-lime-600 group-hover:text-lime-700">
                  {isGenerating ? "Generating..." : "Generate Now →"}
                </p>
              </div>
            </button>

            {/* Launch Manually */}
            <button
              onClick={onLaunchManually}
              disabled={isGenerating}
              className="group bg-white border-2 border-indigo-300 rounded-xl p-6 hover:shadow-lg hover:border-indigo-400 transition-all duration-300 text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-start justify-between mb-4">
                <Plus className="w-8 h-8 text-indigo-600 group-hover:scale-110 transition-transform" />
              </div>

              <h3 className="text-lg font-black text-slate-900 mb-2">
                ➕ Launch Manually
              </h3>

              <p className="text-sm font-medium text-slate-700 mb-4">
                Create a new campaign and add your own promotion posts with full control.
              </p>

              <div className="space-y-2 mb-4 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                <p className="text-xs font-bold text-slate-700">You'll get:</p>
                <ul className="text-xs text-slate-600 space-y-1">
                  <li>✓ New campaign pre-filled with event</li>
                  <li>✓ Add promotion posts manually</li>
                  <li>✓ Full customization</li>
                  <li>✓ Same scheduling controls</li>
                </ul>
              </div>

              <div className="pt-4 border-t border-indigo-200">
                <p className="text-sm font-black text-indigo-600 group-hover:text-indigo-700">
                  Create Campaign →
                </p>
              </div>
            </button>
          </div>

          {/* Skip option */}
          <div className="text-center">
            <button
              onClick={onSkip}
              disabled={isGenerating}
              className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors disabled:opacity-50"
            >
              <XCircle className="w-4 h-4 inline mr-1" />
              No Thanks, Return to Events
            </button>
          </div>

          {/* Info */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-xs text-blue-900">
              <span className="font-black">💡 Tip:</span> You can always create a campaign later from the Campaigns page. This event is saved and ready to promote!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
