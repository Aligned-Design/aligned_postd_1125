import { ReportSettings } from "@/types/user";
import { PostdSummary } from "./PostdSummary";
import { X, Plus, Trash2, Sparkles } from "lucide-react";
import { useState } from "react";

interface ReportSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: Partial<ReportSettings>) => void;
  initialSettings?: Partial<ReportSettings>;
}

export function ReportSettingsModal({
  isOpen,
  onClose,
  onSave,
  initialSettings,
}: ReportSettingsModalProps) {
  const [name, setName] = useState(initialSettings?.name || "Aligned Analytics Report");
  const [frequency, setFrequency] = useState<"weekly" | "monthly" | "quarterly">(
    (initialSettings?.frequency as any) || "weekly"
  );
  const [dayOfWeek, setDayOfWeek] = useState(initialSettings?.dayOfWeek || 1);
  const [monthlyType, setMonthlyType] = useState<"specific-day" | "ordinal">(
    initialSettings?.monthlyType || "specific-day"
  );
  const [dayOfMonth, setDayOfMonth] = useState(initialSettings?.dayOfMonth || 1);
  const [ordinalDay, setOrdinalDay] = useState<{ ordinal: "first" | "second" | "third" | "fourth" | "last"; dayOfWeek: number }>(
    (initialSettings?.ordinalDay as any) || { ordinal: "first", dayOfWeek: 1 }
  );
  const [quarterlyMonth, setQuarterlyMonth] = useState(initialSettings?.quarterlyMonth || 0);
  const [autoScheduleAllQuarters, setAutoScheduleAllQuarters] = useState(false);
  const [includePlatforms, setIncludePlatforms] = useState(
    initialSettings?.includePlatforms || ["facebook", "instagram", "linkedin"]
  );
  const [includeMetrics, setIncludeMetrics] = useState(
    initialSettings?.includeMetrics || ["reach", "engagement", "followers"]
  );
  const [includeAISummary, setIncludeAISummary] = useState(
    initialSettings?.includeAISummary !== false
  );
  const [aiSummary, setAiSummary] = useState(initialSettings?.aiSummary || "");
  const [newRecipient, setNewRecipient] = useState("");
  const [recipients, setRecipients] = useState(initialSettings?.recipients || []);

  const platforms = ["facebook", "instagram", "linkedin", "tiktok", "youtube"];
  const metrics = [
    { id: "reach", label: "Reach" },
    { id: "engagement", label: "Engagement" },
    { id: "followers", label: "Followers" },
    { id: "engagement-rate", label: "Engagement Rate" },
    { id: "google-business", label: "Google Business Rating" },
    { id: "seo-ranking", label: "SEO/Website Ranking" },
  ];
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const ordinals = ["first", "second", "third", "fourth", "last"] as const;

  const handleAddRecipient = () => {
    if (newRecipient && !recipients.includes(newRecipient)) {
      setRecipients([...recipients, newRecipient]);
      setNewRecipient("");
    }
  };

  const handleRemoveRecipient = (email: string) => {
    setRecipients(recipients.filter((r) => r !== email));
  };

  const handleSave = () => {
    // If quarterly with auto-schedule all quarters, we'll return a special flag
    // The parent component will handle creating multiple reports
    if (frequency === "quarterly" && autoScheduleAllQuarters) {
      onSave({
        name,
        frequency,
        recipients,
        includePlatforms,
        includeMetrics,
        includeAISummary,
        aiSummary,
        // Special flag for auto-scheduling
        quarterlyMonth: -1, // -1 indicates "all quarters"
      });
    } else {
      onSave({
        name,
        frequency,
        dayOfWeek: frequency === "weekly" ? dayOfWeek : undefined,
        monthlyType: frequency === "monthly" ? monthlyType : undefined,
        dayOfMonth: frequency === "monthly" && monthlyType === "specific-day" ? dayOfMonth : undefined,
        ordinalDay: frequency === "monthly" && monthlyType === "ordinal" ? ordinalDay : undefined,
        quarterlyMonth: frequency === "quarterly" ? quarterlyMonth : undefined,
        recipients,
        includePlatforms,
        includeMetrics,
        includeAISummary,
        aiSummary,
      });
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-6 flex items-center justify-between border-b border-indigo-700">
          <h2 className="text-2xl font-black">Auto Report Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Report Name */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Report Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Frequency */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3">Frequency</label>
            <div className="grid grid-cols-3 gap-2">
              {(["weekly", "monthly", "quarterly"] as const).map((freq) => (
                <button
                  key={freq}
                  onClick={() => setFrequency(freq)}
                  className={`p-3 rounded-lg border-2 font-bold text-sm transition-all ${
                    frequency === freq
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {freq.charAt(0).toUpperCase() + freq.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Day of Week (if weekly) */}
          {frequency === "weekly" && (
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Send on</label>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {days.map((day, idx) => (
                  <option key={idx} value={idx}>
                    {day}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Monthly Scheduling */}
          {frequency === "monthly" && (
            <div className="space-y-3">
              <label className="block text-sm font-bold text-slate-700">Monthly Schedule</label>
              <div className="flex gap-2 mb-3">
                {(["specific-day", "ordinal"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setMonthlyType(type)}
                    className={`flex-1 p-2 rounded-lg border-2 font-bold text-xs transition-all ${
                      monthlyType === type
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    {type === "specific-day" ? "Specific Day" : "Ordinal (e.g., 1st Monday)"}
                  </button>
                ))}
              </div>

              {monthlyType === "specific-day" ? (
                <select
                  value={dayOfMonth}
                  onChange={(e) => setDayOfMonth(parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                    <option key={day} value={day}>
                      Day {day}
                      {day === 1 ? "st" : day === 2 ? "nd" : day === 3 ? "rd" : "th"}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={ordinalDay.ordinal}
                    onChange={(e) =>
                      setOrdinalDay({ ...ordinalDay, ordinal: e.target.value as any })
                    }
                    className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {ordinals.map((ord) => (
                      <option key={ord} value={ord}>
                        {ord.charAt(0).toUpperCase() + ord.slice(1)}
                      </option>
                    ))}
                  </select>
                  <select
                    value={ordinalDay.dayOfWeek}
                    onChange={(e) =>
                      setOrdinalDay({ ...ordinalDay, dayOfWeek: parseInt(e.target.value) })
                    }
                    className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {days.map((day, idx) => (
                      <option key={idx} value={idx}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Quarterly Scheduling */}
          {frequency === "quarterly" && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">Quarterly Schedule</label>
                <button
                  onClick={() => setAutoScheduleAllQuarters(!autoScheduleAllQuarters)}
                  className={`w-full p-3 rounded-lg border-2 font-bold text-sm transition-all ${
                    autoScheduleAllQuarters
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {autoScheduleAllQuarters ? "✓ Auto-send All Quarters" : "Auto-send All Quarters"}
                </button>
                <p className="text-xs text-slate-600 mt-2 font-medium">
                  {autoScheduleAllQuarters
                    ? "Will create 4 reports: Q1 (sent Apr 1), Q2 (sent Jul 1), Q3 (sent Oct 1), Q4 (sent Jan 1)"
                    : "Click to auto-schedule reports for all quarters"}
                </p>
              </div>

              {!autoScheduleAllQuarters && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Select Quarter</label>
                  <select
                    value={quarterlyMonth}
                    onChange={(e) => setQuarterlyMonth(parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value={0}>Q1 (sent April 1st)</option>
                    <option value={3}>Q2 (sent July 1st)</option>
                    <option value={6}>Q3 (sent October 1st)</option>
                    <option value={9}>Q4 (sent January 1st)</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Metrics Selection */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3">Include Metrics</label>
            <div className="grid grid-cols-2 gap-2">
              {metrics.map((metric) => (
                <button
                  key={metric.id}
                  onClick={() =>
                    setIncludeMetrics(
                      includeMetrics.includes(metric.id)
                        ? includeMetrics.filter((m) => m !== metric.id)
                        : [...includeMetrics, metric.id]
                    )
                  }
                  className={`p-2 rounded-lg border-2 font-bold text-xs transition-all ${
                    includeMetrics.includes(metric.id)
                      ? "border-lime-400 bg-lime-50 text-lime-700"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {metric.label}
                </button>
              ))}
            </div>
          </div>

          {/* Platforms */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3">Include Platforms</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {platforms.map((platform) => (
                <button
                  key={platform}
                  onClick={() =>
                    setIncludePlatforms(
                      includePlatforms.includes(platform)
                        ? includePlatforms.filter((p) => p !== platform)
                        : [...includePlatforms, platform]
                    )
                  }
                  className={`p-3 rounded-lg border-2 font-bold text-sm transition-all ${
                    includePlatforms.includes(platform)
                      ? "border-lime-400 bg-lime-50 text-lime-700"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {platform.charAt(0).toUpperCase() + platform.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* AI Summary Section */}
          <div className="space-y-3">
            <button
              onClick={() => setIncludeAISummary(!includeAISummary)}
              className={`w-full p-3 rounded-lg border-2 font-bold text-sm transition-all flex items-center gap-2 ${
                includeAISummary
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                  : "border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              {includeAISummary ? "✓ Include AI Summary" : "Add AI Summary"}
            </button>

            {includeAISummary && (
              // PostdSummary reads from context internally
              <PostdSummary />
            )}
          </div>

          {/* Recipients */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Recipients</label>
            <div className="flex gap-2 mb-3">
              <input
                type="email"
                value={newRecipient}
                onChange={(e) => setNewRecipient(e.target.value)}
                placeholder="Add email address"
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={handleAddRecipient}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
            <div className="space-y-2">
              {recipients.map((email) => (
                <div
                  key={email}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200"
                >
                  <span className="text-sm font-medium text-slate-700">{email}</span>
                  <button
                    onClick={() => handleRemoveRecipient(email)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2 bg-lime-400 hover:bg-lime-300 text-indigo-950 rounded-lg font-bold transition-colors"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
