import { useState, useEffect } from "react";
import { Calendar, Clock, X, AlertCircle } from "lucide-react";
import { useRescheduleContent } from "@/hooks/useRescheduleContent";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ScheduleModalProps {
  currentSchedule?: { date: string; time: string; autoPublish?: boolean };
  onConfirm: (date: string, time: string, autoPublish: boolean, platforms: string[]) => void;
  onClose: () => void;
}

export function ScheduleModal({ currentSchedule, onConfirm, onClose }: ScheduleModalProps) {
  const [date, setDate] = useState(currentSchedule?.date || "");
  const [time, setTime] = useState(currentSchedule?.time || "12:00");
  const [autoPublish, setAutoPublish] = useState(currentSchedule?.autoPublish || false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["Instagram", "Facebook"]);
  const { checkSchedule } = useRescheduleContent();
  const [scheduleSuggestion, setScheduleSuggestion] = useState<string | null>(null);

  const platforms = ["Instagram", "Facebook", "Twitter", "LinkedIn", "TikTok"];

  const handleTogglePlatform = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  };

  // Check schedule preference when date/time changes
  useEffect(() => {
    if (date && time) {
      const scheduledAt = new Date(`${date}T${time}`);
      const result = checkSchedule(scheduledAt);
      setScheduleSuggestion(result.isPreferred ? null : result.suggestion || null);
    } else {
      setScheduleSuggestion(null);
    }
  }, [date, time, checkSchedule]);

  const handleConfirm = () => {
    if (date && time) {
      onConfirm(date, time, autoPublish, selectedPlatforms);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-black text-slate-900">Schedule Content</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Description */}
        <p className="text-sm text-slate-500 mb-6">Set when and where to publish your content</p>

        {/* Date Input */}
        <div className="mb-4">
          <label className="block text-xs font-bold text-slate-600 mb-2">Date</label>
          <div className="relative">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
            />
            <Calendar className="absolute right-3 top-2.5 w-5 h-5 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Time Input */}
        <div className="mb-4">
          <label className="block text-xs font-bold text-slate-600 mb-2">Time</label>
          <div className="relative">
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
            />
            <Clock className="absolute right-3 top-2.5 w-5 h-5 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Timezone */}
        <div className="mb-4">
          <label className="block text-xs font-bold text-slate-600 mb-2">Timezone</label>
          <select className="w-full px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-0">
            <option value="UTC">UTC</option>
            <option value="EST">EST</option>
            <option value="CST">CST</option>
            <option value="MST">MST</option>
            <option value="PST">PST</option>
          </select>
        </div>

        {/* Platforms */}
        <div className="mb-4">
          <label className="block text-xs font-bold text-slate-600 mb-2">Platforms</label>
          <div className="grid grid-cols-2 gap-2">
            {platforms.map((platform) => (
              <button
                key={platform}
                onClick={() => handleTogglePlatform(platform)}
                className={`px-3 py-2 rounded-lg font-semibold text-sm transition-all ${
                  selectedPlatforms.includes(platform)
                    ? "bg-lime-400 text-indigo-950"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {platform}
              </button>
            ))}
          </div>
        </div>

        {/* Schedule Suggestion */}
        {scheduleSuggestion && (
          <Alert className="mb-4 border-amber-200 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-sm text-amber-800">
              {scheduleSuggestion}
            </AlertDescription>
          </Alert>
        )}

        {/* Auto-publish Toggle */}
        <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg mb-6 cursor-pointer hover:bg-slate-100 transition-colors">
          <input
            type="checkbox"
            checked={autoPublish}
            onChange={(e) => setAutoPublish(e.target.checked)}
            className="w-4 h-4 rounded accent-lime-400"
          />
          <div>
            <p className="font-semibold text-slate-900">Schedule & Auto-publish</p>
            <p className="text-xs text-slate-500">Automatically publish when time arrives</p>
          </div>
        </label>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-bold hover:bg-slate-200 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!date || !time}
            className="flex-1 px-4 py-2 bg-lime-400 text-indigo-950 rounded-lg font-bold hover:bg-lime-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Schedule
          </button>
        </div>
      </div>
    </div>
  );
}
