import { useState, useRef, useEffect } from "react";
import { Send, ChevronDown, Check, AlertCircle, Zap, Share2, ListTodo } from "lucide-react";

interface SendToQueueDropdownProps {
  isPrimary?: boolean;
  isDisabled?: boolean;
  disabledReason?: string;
  lastAction?: string;
  onSendToQueue: () => void;
  onSendPublishNow: () => void;
  onSendMultiplePlatforms: () => void;
  onOpenContentQueue: () => void;
}

export function SendToQueueDropdown({
  isPrimary = false,
  isDisabled = false,
  disabledReason,
  lastAction,
  onSendToQueue,
  onSendPublishNow,
  onSendMultiplePlatforms,
  onOpenContentQueue,
}: SendToQueueDropdownProps) {
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
    : "bg-blue-100 text-blue-700 hover:bg-blue-200";

  const disabledClasses = isDisabled ? "opacity-60 cursor-not-allowed hover:bg-blue-100" : "";

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
        title={disabledReason || "Send to content queue"}
      >
        <Send className="w-4 h-4" />
        <span>Queue</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && !isDisabled && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-white/60 z-50 overflow-hidden">
          {/* Send to Queue */}
          <button
            ref={(el) => {
              if (el) itemsRef.current[0] = el;
            }}
            onMouseEnter={() => setFocusedIndex(0)}
            onClick={() => {
              onSendToQueue();
              setIsOpen(false);
              setFocusedIndex(-1);
            }}
            className="w-full px-4 py-3 text-left hover:bg-slate-50 border-b border-slate-100 transition-colors flex items-start justify-between group focus:outline-none focus:bg-blue-50"
          >
            <div className="flex items-start gap-3 flex-1">
              <ListTodo className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-slate-900 group-hover:text-blue-700">Send to Queue</p>
                <p className="text-xs text-slate-500">Keeps as draft in queue</p>
              </div>
            </div>
            {lastAction === "sendToQueue" && <Check className="w-4 h-4 text-lime-500 flex-shrink-0" />}
          </button>

          {/* Send & Publish Now */}
          <button
            ref={(el) => {
              if (el) itemsRef.current[1] = el;
            }}
            onMouseEnter={() => setFocusedIndex(1)}
            onClick={() => {
              onSendPublishNow();
              setIsOpen(false);
              setFocusedIndex(-1);
            }}
            className="w-full px-4 py-3 text-left hover:bg-rose-50 border-b border-slate-100 transition-colors flex items-start justify-between group focus:outline-none focus:bg-rose-50"
          >
            <div className="flex items-start gap-3 flex-1">
              <Zap className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-rose-700 group-hover:text-rose-800">Send & Publish Now</p>
                <p className="text-xs text-slate-500">Bypasses schedule</p>
              </div>
            </div>
            {lastAction === "sendPublishNow" && <Check className="w-4 h-4 text-lime-500 flex-shrink-0" />}
          </button>

          {/* Send to Multiple Platforms */}
          <button
            ref={(el) => {
              if (el) itemsRef.current[2] = el;
            }}
            onMouseEnter={() => setFocusedIndex(2)}
            onClick={() => {
              onSendMultiplePlatforms();
              setIsOpen(false);
              setFocusedIndex(-1);
            }}
            className="w-full px-4 py-3 text-left hover:bg-slate-50 border-b border-slate-100 transition-colors flex items-start justify-between group focus:outline-none focus:bg-blue-50"
          >
            <div className="flex items-start gap-3 flex-1">
              <Share2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-slate-900 group-hover:text-blue-700">Send to Multiple Platforms</p>
                <p className="text-xs text-slate-500">Select platforms & create variants</p>
              </div>
            </div>
            {lastAction === "sendMultiplePlatforms" && <Check className="w-4 h-4 text-lime-500 flex-shrink-0" />}
          </button>

          {/* Divider */}
          <div className="h-px bg-slate-100 my-1" />

          {/* Open Content Queue */}
          <button
            ref={(el) => {
              if (el) itemsRef.current[3] = el;
            }}
            onMouseEnter={() => setFocusedIndex(3)}
            onClick={() => {
              onOpenContentQueue();
              setIsOpen(false);
              setFocusedIndex(-1);
            }}
            className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors flex items-start gap-3 group focus:outline-none focus:bg-blue-50"
          >
            <Send className="w-4 h-4 text-slate-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-slate-900 group-hover:text-blue-700">Open Content Queue</p>
              <p className="text-xs text-slate-500">View all queued posts</p>
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
