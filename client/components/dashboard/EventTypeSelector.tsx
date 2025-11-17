import { EventType, EVENT_TYPE_CONFIGS } from "@/types/event";
import { X } from "lucide-react";

interface EventTypeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectType: (type: EventType) => void;
}

export function EventTypeSelector({ isOpen, onClose, onSelectType }: EventTypeSelectorProps) {
  if (!isOpen) return null;

  const eventTypes: EventType[] = ["digital", "in_person", "promo"];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-indigo-50 to-blue-50 p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900">What type of event?</h2>
            <p className="text-sm text-slate-600 mt-1">
              Choose an event type to get started. Each type has tailored promotion strategies.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Event type cards */}
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {eventTypes.map((type) => {
              const config = EVENT_TYPE_CONFIGS[type];
              return (
                <button
                  key={type}
                  onClick={() => onSelectType(type)}
                  className="group bg-white border-2 border-slate-200 rounded-2xl p-6 hover:border-indigo-400 hover:shadow-lg transition-all duration-300 text-left"
                >
                  {/* Icon */}
                  <div className="text-5xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
                    {config.icon}
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-black text-slate-900 mb-2">{config.name}</h3>

                  {/* Description */}
                  <p className="text-sm font-medium text-slate-600 mb-4">
                    {config.description}
                  </p>

                  {/* Example */}
                  <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-xs font-bold text-slate-700 uppercase mb-1">Example</p>
                    <p className="text-xs text-slate-600">{config.example}</p>
                  </div>

                  {/* AI Tone */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-lime-600 font-black">AI Tone:</span>
                    <span className="text-slate-600">{config.aiTone}</span>
                  </div>

                  {/* CTA */}
                  <div className="mt-4 pt-4 border-t border-slate-200 text-center">
                    <p className="text-xs font-bold text-indigo-600 group-hover:text-indigo-700">
                      Choose Type →
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Helper text */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-xs text-blue-900">
              <span className="font-black">💡 Tip:</span> Each event type has unique promotion strategies. Digital events emphasize sign-ups and reach, in-person events build excitement and community, and promotions drive urgency and conversions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
