import { Event, EVENT_STATUS_COLORS, EVENT_STATUS_ICONS, PLATFORM_ICONS, EVENT_TYPE_CONFIGS } from "@/types/event";
import { MoreVertical, Calendar, MapPin, AlertCircle, Sparkles } from "lucide-react";
import { useState } from "react";

interface EventCardProps {
  event: Event;
  onEdit?: (event: Event) => void;
  onDelete?: (id: string) => void;
  onPromote?: (event: Event) => void;
}

export function EventCard({ event, onEdit, onDelete, onPromote }: EventCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const typeConfig = EVENT_TYPE_CONFIGS[event.eventType] || EVENT_TYPE_CONFIGS.digital;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const formatTime = (timeStr: string) => {
    try {
      const [hours, minutes] = timeStr.split(":").map(Number);
      const period = hours >= 12 ? "PM" : "AM";
      const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
      return `${displayHours}:${String(minutes).padStart(2, "0")} ${period}`;
    } catch {
      return timeStr;
    }
  };

  const getDaysUntil = (startDate: string) => {
    const today = new Date();
    const start = new Date(startDate);
    const diff = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const failedSyncs = event.platforms.filter((p) => p.syncStatus === "failed").length;
  const notLinkedPlatforms = event.platforms.filter((p) => p.syncStatus === "not_linked").length;
  const daysUntil = getDaysUntil(event.startDate);
  const statusBgColor = EVENT_STATUS_COLORS[event.status] || EVENT_STATUS_COLORS.draft;
  const statusIcon = EVENT_STATUS_ICONS[event.status] || "📌";

  return (
    <div className="group bg-white/50 backdrop-blur-xl rounded-xl border border-white/60 hover:bg-white/70 hover:shadow-md hover:border-white/80 transition-all duration-300 overflow-hidden">
      {/* Header gradient - colored by event type */}
      <div className={`h-1.5 bg-gradient-to-r ${typeConfig.accentColor}`}></div>

      <div className="p-4 sm:p-5">
        {/* Top row: Icon + Title + Menu */}
        <div className="flex items-start justify-between mb-3 gap-2">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <span className="text-lg flex-shrink-0 mt-0.5">{statusIcon}</span>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-black text-slate-900 line-clamp-2">{event.title}</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">{event.location}</p>
            </div>
          </div>

          <div className="relative flex-shrink-0">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-slate-100"
            >
              <MoreVertical className="w-4 h-4 text-slate-500" />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 min-w-max">
                <button
                  onClick={() => {
                    onEdit?.(event);
                    setShowMenu(false);
                  }}
                  className="block w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 border-b border-slate-100"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    onPromote?.(event);
                    setShowMenu(false);
                  }}
                  className="block w-full text-left px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 border-b border-slate-100"
                >
                  Promote
                </button>
                <button
                  onClick={() => {
                    onDelete?.(event.id);
                    setShowMenu(false);
                  }}
                  className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Error alerts section */}
        {failedSyncs > 0 && (
          <div className="mb-3 flex items-start gap-2 p-2 bg-red-50 rounded-lg border border-red-200">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-red-700">Sync Failed</p>
              <p className="text-xs text-red-600">{failedSyncs} platform sync issue(s)</p>
            </div>
          </div>
        )}

        {notLinkedPlatforms > 0 && (
          <div className="mb-3 flex items-start gap-2 p-2 bg-amber-50 rounded-lg border border-amber-200">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-amber-700">Not Linked</p>
              <p className="text-xs text-amber-600">{notLinkedPlatforms} platform not yet connected</p>
            </div>
          </div>
        )}

        {/* Date/Time info */}
        <div className="flex items-center gap-3 text-xs font-medium text-slate-600 mb-3 flex-wrap">
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatDate(event.startDate)}</span>
          </div>
          <div className="text-slate-400">·</div>
          <span>{formatTime(event.startTime)}</span>
          {daysUntil >= 0 && daysUntil <= 7 && (
            <>
              <div className="text-slate-400">·</div>
              <span className="text-lime-600 font-bold">In {daysUntil} days</span>
            </>
          )}
        </div>

        {/* Platforms status */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {event.platforms.map((platform) => (
            <div
              key={platform.platform}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                platform.syncStatus === "synced"
                  ? "bg-green-100 text-green-700 border border-green-300"
                  : platform.syncStatus === "failed"
                    ? "bg-red-100 text-red-700 border border-red-300"
                    : "bg-amber-100 text-amber-700 border border-amber-300"
              }`}
            >
              <span className="text-sm">{PLATFORM_ICONS[platform.platform]}</span>
              <span className="capitalize">{platform.platform.replace("_", " ")}</span>
              {platform.syncStatus === "synced" && <span>✓</span>}
            </div>
          ))}
        </div>

        {/* Promotions count */}
        {event.promotionSchedule.length > 0 && (
          <div className="text-xs font-medium text-slate-600 mb-4">
            📢 {event.promotionSchedule.length} promotion{event.promotionSchedule.length !== 1 ? "s" : ""} scheduled
          </div>
        )}

        {/* Status and event type badges */}
        <div className="flex items-center gap-2">
          <div className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold border ${statusBgColor}`}>
            {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
          </div>
          <div className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold border ${typeConfig.color}`}>
            {typeConfig.icon} {typeConfig.name}
          </div>
        </div>
      </div>
    </div>
  );
}
