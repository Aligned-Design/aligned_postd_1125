import { EventType, EVENT_TYPE_CONFIGS } from "@/types/event";
import { Wand2 } from "lucide-react";
import { useState } from "react";

interface EventAIFormProps {
  eventType: EventType;
  onSubmit: (data: {
    goal: string;
    targetAudience: string;
    startDate: string;
    startTime?: string;
    endTime?: string;
    location?: string;
    description?: string;
  }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function EventAIForm({
  eventType,
  onSubmit,
  onCancel,
  isLoading = false,
}: EventAIFormProps) {
  const config = EVENT_TYPE_CONFIGS[eventType];
  const [goal, setGoal] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("19:00");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal || !targetAudience || !startDate) {
      alert("Please fill in Goal, Target Audience, and Date");
      return;
    }

    onSubmit({
      goal,
      targetAudience,
      startDate,
      startTime,
      endTime,
      location,
      description,
    });
  };

  const placeholders: Record<EventType, any> = {
    digital: {
      goal: "e.g., Product launch, webinar, training session",
      targetAudience: "e.g., Small business owners, marketing professionals",
      location: "e.g., Zoom, Google Meet",
    },
    in_person: {
      goal: "e.g., Grand opening, networking mixer, meetup",
      targetAudience: "e.g., Local community, customers, partners, entrepreneurs",
      location: "e.g., 123 Main St, San Francisco",
    },
    promo: {
      goal: "e.g., Spring sale, limited-time offer, seasonal promotion",
      targetAudience: "e.g., Existing customers, new prospects, bargain hunters",
      location: "e.g., Online & In-Store, Website",
    },
  };

  const ph = placeholders[eventType];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Intro */}
      <div className="p-6 bg-gradient-to-br from-lime-50 to-green-50 border-2 border-lime-300 rounded-xl">
        <div className="flex items-start gap-3">
          <Wand2 className="w-6 h-6 text-lime-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-black text-slate-900 mb-1">
              {config.icon} {config.name} Event
            </h3>
            <p className="text-sm text-slate-700">
              Answer a few questions and I'll create a complete event with AI-generated promotion posts.
            </p>
          </div>
        </div>
      </div>

      {/* Goal */}
      <div>
        <label className="block text-sm font-black text-slate-900 mb-2">
          What's the goal or topic? *
        </label>
        <input
          type="text"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder={ph.goal}
          className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
        />
        <p className="text-xs text-slate-500 mt-1">
          Example: "AI tools for content creators", "New location opening"
        </p>
      </div>

      {/* Target Audience */}
      <div>
        <label className="block text-sm font-black text-slate-900 mb-2">
          Who's your target audience? *
        </label>
        <input
          type="text"
          value={targetAudience}
          onChange={(e) => setTargetAudience(e.target.value)}
          placeholder={ph.targetAudience}
          className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
        />
        <p className="text-xs text-slate-500 mt-1">
          Example: "Marketing managers", "Local business owners"
        </p>
      </div>

      {/* Date & Time */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-black text-slate-900 mb-2">
            Event Date *
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-black text-slate-900 mb-2">
            Start Time
          </label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
        </div>
      </div>

      {/* Location (optional) */}
      <div>
        <label className="block text-sm font-black text-slate-900 mb-2">
          Location (optional)
        </label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder={ph.location}
          className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
        />
      </div>

      {/* Description (optional) */}
      <div>
        <label className="block text-sm font-black text-slate-900 mb-2">
          Additional details (optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Any other important information to help AI craft perfect promotion posts..."
          rows={3}
          className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
        />
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 px-4 py-3 rounded-lg border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 px-4 py-3 rounded-lg bg-lime-400 text-indigo-950 font-black hover:bg-lime-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <span className="animate-spin">⚙️</span>
              Generating...
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4" />
              Generate Event
            </>
          )}
        </button>
      </div>
    </form>
  );
}
