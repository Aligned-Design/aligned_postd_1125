import { useState, useRef, useEffect } from "react";
import { Calendar, ChevronDown, Check, AlertCircle, Clock, Lightbulb, Edit3 } from "lucide-react";

interface ScheduleDropdownProps {
  isPrimary?: boolean;
  isDisabled?: boolean;
  disabledReason?: string;
  hasSchedule?: boolean;
  lastAction?: string;
  onSchedule: () => void;
  onScheduleAutoPublish: () => void;
  onViewCalendar: () => void;
  onBestTimeSuggestions: () => void;
}

export function ScheduleDropdown({
  isPrimary = false,
  isDisabled = false,
  disabledReason,
  hasSchedule = false,
  lastAction,
  onSchedule,
  onScheduleAutoPublish,
  onViewCalendar,
  onBestTimeSuggestions,
}: ScheduleDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<HTMLButtonElement[]>([]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) {
        if (!isDisabled && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          setIsOpen(true);
          setFocusedIndex(0);
        }
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedIndex((prev) => (prev < 3 ? prev + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : 3));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (focusedIndex >= 0 && itemsRef.current[focusedIndex]) {
          itemsRef.current[focusedIndex].click();
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    if (isOpen && !isDisabled) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, focusedIndex, isDisabled]);

  // Focus item when keyboard navigates
  useEffect(() => {
    if (focusedIndex >= 0 && itemsRef.current[focusedIndex]) {
      itemsRef.current[focusedIndex].focus();
    }
  }, [focusedIndex]);

  const baseClasses = "flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all";
  const primaryClasses = isPrimary
    ? "bg-lime-400 text-indigo-950 hover:bg-lime-500"
    : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200";

  const disabledClasses = isDisabled ? "opacity-60 cursor-not-allowed hover:bg-emerald-100" : "";

  const buttonLabel = hasSchedule ? "Update" : "Schedule";
  const buttonIcon = hasSchedule ? Clock : Calendar;
  const IconComponent = buttonIcon;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Unified Dropdown Button */}
      <button
        onClick={() => {
          if (!isDisabled) {
            setIsOpen(!isOpen);
            if (!isOpen) setFocusedIndex(0);
          }
        }}
        className={`${baseClasses} ${primaryClasses} ${disabledClasses}`}
        disabled={isDisabled}
        title={disabledReason || "Schedule content"}
      >
        <IconComponent className="w-4 h-4" />
        <span>{buttonLabel}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && !isDisabled && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-white/60 z-50 overflow-hidden">
          {/* Schedule */}
          <button
            ref={(el) => {
              if (el) itemsRef.current[0] = el;
            }}
            onMouseEnter={() => setFocusedIndex(0)}
            onClick={() => {
              onSchedule();
              setIsOpen(false);
              setFocusedIndex(-1);
            }}
            className="w-full px-4 py-3 text-left hover:bg-slate-50 border-b border-slate-100 transition-colors flex items-start justify-between group focus:outline-none focus:bg-emerald-50"
          >
            <div className="flex items-start gap-3 flex-1">
              <Calendar className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-slate-900 group-hover:text-emerald-700">
                  {hasSchedule ? "Update Schedule" : "Schedule"}
                </p>
                <p className="text-xs text-slate-500">Set date, time & platforms</p>
              </div>
            </div>
            {lastAction === "schedule" && <Check className="w-4 h-4 text-lime-500 flex-shrink-0" />}
          </button>

          {/* Schedule & Auto-publish */}
          <button
            ref={(el) => {
              if (el) itemsRef.current[1] = el;
            }}
            onMouseEnter={() => setFocusedIndex(1)}
            onClick={() => {
              onScheduleAutoPublish();
              setIsOpen(false);
              setFocusedIndex(-1);
            }}
            className="w-full px-4 py-3 text-left hover:bg-slate-50 border-b border-slate-100 transition-colors flex items-start justify-between group focus:outline-none focus:bg-emerald-50"
          >
            <div className="flex items-start gap-3 flex-1">
              <Lightbulb className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-slate-900 group-hover:text-emerald-700">Schedule & Auto-publish</p>
                <p className="text-xs text-slate-500">Auto-publish when time arrives</p>
              </div>
            </div>
            {lastAction === "scheduleAutoPublish" && <Check className="w-4 h-4 text-lime-500 flex-shrink-0" />}
          </button>

          {/* View in Calendar */}
          <button
            ref={(el) => {
              if (el) itemsRef.current[2] = el;
            }}
            onMouseEnter={() => setFocusedIndex(2)}
            onClick={() => {
              onViewCalendar();
              setIsOpen(false);
              setFocusedIndex(-1);
            }}
            className="w-full px-4 py-3 text-left hover:bg-slate-50 border-b border-slate-100 transition-colors flex items-start justify-between group focus:outline-none focus:bg-emerald-50"
          >
            <div className="flex items-start gap-3 flex-1">
              <Edit3 className="w-4 h-4 text-slate-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-slate-900 group-hover:text-emerald-700">View in Calendar</p>
                <p className="text-xs text-slate-500">Opens scheduled date</p>
              </div>
            </div>
            {lastAction === "viewCalendar" && <Check className="w-4 h-4 text-lime-500 flex-shrink-0" />}
          </button>

          {/* Divider */}
          <div className="h-px bg-slate-100 my-1" />

          {/* Best Time Suggestions */}
          <button
            ref={(el) => {
              if (el) itemsRef.current[3] = el;
            }}
            onMouseEnter={() => setFocusedIndex(3)}
            onClick={() => {
              onBestTimeSuggestions();
              setIsOpen(false);
              setFocusedIndex(-1);
            }}
            className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors flex items-start gap-3 group focus:outline-none focus:bg-emerald-50"
          >
            <Lightbulb className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-slate-900 group-hover:text-emerald-700">Best Time Suggestions</p>
              <p className="text-xs text-slate-500">AI timing recommendations</p>
            </div>
          </button>
        </div>
      )}

      {/* Disabled Tooltip */}
      {isDisabled && disabledReason && (
        <div className="absolute top-full left-0 mt-2 px-3 py-2 bg-slate-900 text-white text-xs rounded shadow-lg whitespace-nowrap z-50 flex items-center gap-2">
          <AlertCircle className="w-3 h-3" />
          {disabledReason}
        </div>
      )}
    </div>
  );
}
