import { useState, useMemo } from "react";
import { Calendar, Clock, X, AlertCircle, Settings } from "lucide-react";
import { useRescheduleContent } from "@/hooks/useRescheduleContent";
import { usePlatformConnections } from "@/hooks/usePlatformConnections";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

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
  const { platforms: platformConnections, hasAnyConnection, isLoading: connectionsLoading } = usePlatformConnections();

  // Map platform names to provider keys
  const platformMap: Record<string, string> = {
    "Instagram": "instagram",
    "Facebook": "facebook",
    "Twitter": "twitter",
    "LinkedIn": "linkedin",
    "TikTok": "tiktok",
  };

  const platforms = ["Instagram", "Facebook", "Twitter", "LinkedIn", "TikTok"];

  // Filter to only show connected platforms, or all if none connected (for planning)
  const availablePlatforms = platforms.filter((platform) => {
    const providerKey = platformMap[platform];
    return platformConnections[providerKey]?.connected || !hasAnyConnection;
  });

  const handleTogglePlatform = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  };

  // Check schedule preference when date/time changes
  // Use useMemo instead of useEffect + setState to avoid setState in effect
  const scheduleSuggestion = useMemo(() => {
    if (date && time) {
      const scheduledAt = new Date(`${date}T${time}`);
      const result = checkSchedule(scheduledAt);
      return result.isPreferred ? null : result.suggestion || null;
    }
    return null;
  }, [date, time, checkSchedule]);

  const handleConfirm = () => {
    if (date && time) {
      // Only allow scheduling if platforms are connected (when autoPublish is true)
      if (autoPublish && !hasAnyConnection) {
        return; // Blocked by UI below
      }
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

        {/* No Platforms Connected Warning */}
        {!connectionsLoading && !hasAnyConnection && autoPublish && (
          <Alert className="mb-4 border-amber-200 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-sm text-amber-800">
              <div className="space-y-2">
                <p className="font-semibold">You don't have any social accounts connected yet.</p>
                <p>Connect at least one platform in Settings to start publishing automatically.</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    window.location.href = "/linked-accounts";
                  }}
                  className="mt-2"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Go to Settings
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

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
          <select className="w-full px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-0" disabled>
            <option value={Intl.DateTimeFormat().resolvedOptions().timeZone}>
              {Intl.DateTimeFormat().resolvedOptions().timeZone}
            </option>
          </select>
          <p className="text-xs text-slate-500 mt-1">
            Times shown in your browser timezone ({Intl.DateTimeFormat().resolvedOptions().timeZone})
          </p>
        </div>

        {/* Platforms */}
        <div className="mb-4">
          <label className="block text-xs font-bold text-slate-600 mb-2">Platforms</label>
          <div className="grid grid-cols-2 gap-2">
            {platforms.map((platform) => {
              const providerKey = platformMap[platform];
              const isConnected = platformConnections[providerKey]?.connected || !hasAnyConnection;
              const isSelected = selectedPlatforms.includes(platform);
              
              return (
                <button
                  key={platform}
                  onClick={() => isConnected && handleTogglePlatform(platform)}
                  disabled={!isConnected}
                  className={`px-3 py-2 rounded-lg font-semibold text-sm transition-all relative ${
                    isSelected
                      ? "bg-lime-400 text-indigo-950"
                      : isConnected
                      ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      : "bg-slate-50 text-slate-400 cursor-not-allowed opacity-60"
                  }`}
                  title={!isConnected ? "Not connected" : undefined}
                >
                  {platform}
                  {!isConnected && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full" title="Not connected" />
                  )}
                </button>
              );
            })}
          </div>
          {!hasAnyConnection && (
            <p className="text-xs text-slate-500 mt-2">
              Connect platforms in Settings to enable scheduling.
            </p>
          )}
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
            disabled={!date || !time || (autoPublish && !hasAnyConnection)}
            className="flex-1 px-4 py-2 bg-lime-400 text-indigo-950 rounded-lg font-bold hover:bg-lime-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Schedule
          </button>
        </div>
      </div>
    </div>
  );
}
