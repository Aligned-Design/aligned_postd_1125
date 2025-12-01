import { Event, Platform, PLATFORM_NAMES, PROMOTION_TYPES, EventType } from "@/types/event";
import { X, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

interface EventEditorModalProps {
  event?: Event;
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Event) => void;
  campaigns?: Array<{ id: string; name: string }>;
}

const EMPTY_EVENT: Omit<Event, "id" | "createdDate" | "updatedDate"> = {
  title: "",
  description: "",
  location: "",
  startDate: new Date().toISOString().split("T")[0],
  startTime: "09:00",
  endDate: new Date().toISOString().split("T")[0],
  endTime: "10:00",
  eventType: "digital",
  status: "draft",
  visibility: "public",
  tags: [],
  brand: "POSTD",
  platforms: [],
  promotionSchedule: [],
};

export function EventEditorModal({
  event,
  isOpen,
  onClose,
  onSave,
  campaigns = [],
}: EventEditorModalProps) {
  const [formData, setFormData] = useState<Omit<Event, "id" | "createdDate" | "updatedDate">>(
    event
      ? {
          title: event.title,
          description: event.description,
          location: event.location,
          startDate: event.startDate,
          startTime: event.startTime,
          endDate: event.endDate,
          endTime: event.endTime,
          imageUrl: event.imageUrl,
          eventType: event.eventType,
          status: event.status,
          visibility: event.visibility,
          rsvpUrl: event.rsvpUrl,
          tags: event.tags,
          brand: event.brand,
          platforms: event.platforms,
          promotionSchedule: event.promotionSchedule,
          assignedCampaignId: event.assignedCampaignId,
          attendance: event.attendance,
          engagementData: event.engagementData,
        }
      : { ...EMPTY_EVENT }
  );

  const [step, setStep] = useState(1);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(
    formData.platforms.map((p) => p.platform)
  );

  if (!isOpen) return null;

  const handlePlatformToggle = (platform: Platform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  };

  const handleAddPromotion = () => {
    const newPromo = {
      id: Date.now().toString(),
      type: "before" as const,
      title: "",
      content: "",
      platforms: selectedPlatforms,
      scheduledDate: formData.startDate,
      status: "draft" as const,
    };
    setFormData({
      ...formData,
      promotionSchedule: [...(formData.promotionSchedule || []), newPromo],
    });
  };

  const handleRemovePromotion = (id: string) => {
    setFormData({
      ...formData,
      promotionSchedule: (formData.promotionSchedule || []).filter((p) => p.id !== id),
    });
  };

  const handleSave = () => {
    if (!formData.title || !formData.location || !formData.startDate) {
      alert("Please fill in all required fields");
      return;
    }

    const eventToSave: Event = {
      id: event?.id || Date.now().toString(),
      ...formData,
      createdDate: event?.createdDate || new Date().toISOString(),
      updatedDate: new Date().toISOString(),
      platforms: selectedPlatforms.map((platform) => ({
        platform,
        isConnected: true,
        syncStatus: "pending",
      })),
    };

    onSave(eventToSave);
    onClose();
  };

  const availablePlatforms: Platform[] = ["facebook", "google_business", "squarespace"];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-indigo-50 to-blue-50 p-6 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-2xl font-black text-slate-900">
            {event ? "Edit Event" : "Create New Event"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Step 1: Event Details */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">
                    Event Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Product Launch Webinar"
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Event details and description..."
                    rows={3}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">
                    Location *
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., Zoom or San Francisco, CA"
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-900 mb-2">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-900 mb-2">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-900 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-900 mb-2">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">
                    RSVP/Registration URL
                  </label>
                  <input
                    type="url"
                    value={formData.rsvpUrl || ""}
                    onChange={(e) => setFormData({ ...formData, rsvpUrl: e.target.value })}
                    placeholder="https://example.com/register"
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">Tags</label>
                  <input
                    type="text"
                    value={formData.tags.join(", ")}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tags: e.target.value.split(",").map((t) => t.trim()),
                      })
                    }
                    placeholder="e.g., webinar, product, engagement"
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Platforms & Promotion */}
          {step === 2 && (
            <div className="space-y-6">
              {/* Platform Selection */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-3">
                  Publish to Platforms
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {availablePlatforms.map((platform) => (
                    <label key={platform} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedPlatforms.includes(platform)}
                        onChange={() => handlePlatformToggle(platform)}
                        className="w-4 h-4 rounded border-slate-300 accent-indigo-600"
                      />
                      <span className="text-sm font-medium text-slate-700">
                        {PLATFORM_NAMES[platform]}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Promotion Schedule */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-900">Promotion Schedule</h3>
                  <button
                    onClick={handleAddPromotion}
                    className="flex items-center gap-1 px-3 py-1.5 bg-lime-400 text-indigo-950 rounded-lg hover:bg-lime-500 transition-colors text-xs font-bold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.promotionSchedule?.map((promo, idx) => (
                    <div key={promo.id} className="p-4 rounded-lg border border-slate-300 bg-slate-50 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Promotion Type
                          </label>
                          <select
                            value={promo.type}
                            onChange={(e) => {
                              const updated = [...(formData.promotionSchedule || [])];
                              updated[idx].type = e.target.value as any;
                              setFormData({ ...formData, promotionSchedule: updated });
                            }}
                            className="w-full px-3 py-1.5 rounded text-xs border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            {Object.entries(PROMOTION_TYPES).map(([key, label]) => (
                              <option key={key} value={key}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <button
                          onClick={() => handleRemovePromotion(promo.id)}
                          className="p-1.5 hover:bg-red-100 rounded transition-colors mt-5"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Title
                        </label>
                        <input
                          type="text"
                          value={promo.title}
                          onChange={(e) => {
                            const updated = [...(formData.promotionSchedule || [])];
                            updated[idx].title = e.target.value;
                            setFormData({ ...formData, promotionSchedule: updated });
                          }}
                          placeholder="Promotion post title"
                          className="w-full px-3 py-1.5 rounded text-xs border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Content
                        </label>
                        <textarea
                          value={promo.content}
                          onChange={(e) => {
                            const updated = [...(formData.promotionSchedule || [])];
                            updated[idx].content = e.target.value;
                            setFormData({ ...formData, promotionSchedule: updated });
                          }}
                          placeholder="Post content..."
                          rows={2}
                          className="w-full px-3 py-1.5 rounded text-xs border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Scheduled Date
                        </label>
                        <input
                          type="date"
                          value={promo.scheduledDate}
                          onChange={(e) => {
                            const updated = [...(formData.promotionSchedule || [])];
                            updated[idx].scheduledDate = e.target.value;
                            setFormData({ ...formData, promotionSchedule: updated });
                          }}
                          className="w-full px-3 py-1.5 rounded text-xs border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-lg p-4 space-y-3 max-h-96 overflow-y-auto">
                <div>
                  <p className="text-xs font-bold text-slate-600 uppercase">Title</p>
                  <p className="text-sm font-medium text-slate-900">{formData.title}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-600 uppercase">Location</p>
                  <p className="text-sm font-medium text-slate-900">{formData.location}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-bold text-slate-600 uppercase">Start</p>
                    <p className="text-sm font-medium text-slate-900">
                      {new Date(formData.startDate).toLocaleDateString()} {formData.startTime}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-600 uppercase">End</p>
                    <p className="text-sm font-medium text-slate-900">
                      {new Date(formData.endDate).toLocaleDateString()} {formData.endTime}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-600 uppercase">Platforms</p>
                  <div className="flex gap-2 flex-wrap mt-1">
                    {selectedPlatforms.map((p) => (
                      <span key={p} className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">
                        {PLATFORM_NAMES[p]}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-600 uppercase">Promotions</p>
                  <p className="text-sm font-medium text-slate-900">
                    {formData.promotionSchedule?.length || 0} scheduled
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 p-6 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500 font-medium">
            Step {step} of 3
          </div>
          <div className="flex gap-3">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-100 transition-colors"
              >
                Back
              </button>
            )}
            {step < 3 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSave}
                className="px-6 py-2 rounded-lg bg-lime-400 text-indigo-950 font-black hover:bg-lime-500 transition-colors"
              >
                Save Event
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
