import { useState, useRef, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";

interface DateFilterDropdownProps {
  selectedPreset?: string;
  customFrom?: string;
  customTo?: string;
  onApply: (preset?: string, from?: string, to?: string) => void;
  isActive: boolean;
}

type PresetType = "7days" | "30days" | "90days" | "6months" | "12months" | "alltime" | "custom";

const PRESETS = [
  { id: "7days", label: "Last 7 days" },
  { id: "30days", label: "Last 30 days" },
  { id: "90days", label: "Last 90 days" },
  { id: "6months", label: "Last 6 months" },
  { id: "12months", label: "Last 12 months" },
  { id: "alltime", label: "All time" },
];

export function DateFilterDropdown({
  selectedPreset,
  customFrom,
  customTo,
  onApply,
  isActive,
}: DateFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(selectedPreset === "custom");
  const [fromDate, setFromDate] = useState(customFrom || "");
  const [toDate, setToDate] = useState(customTo || "");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const getPresetLabel = () => {
    if (!selectedPreset || selectedPreset === "custom") {
      if (customFrom && customTo) {
        return `${customFrom} to ${customTo}`;
      }
      return "Custom date";
    }
    return PRESETS.find((p) => p.id === selectedPreset)?.label || "Date";
  };

  const handlePresetClick = (presetId: PresetType) => {
    if (presetId === "custom") {
      setShowCustom(true);
    } else {
      onApply(presetId);
      setShowCustom(false);
      setIsOpen(false);
    }
  };

  const handleApplyCustom = () => {
    if (fromDate && toDate) {
      onApply("custom", fromDate, toDate);
      setIsOpen(false);
    }
  };

  const handleReset = () => {
    setFromDate("");
    setToDate("");
    setShowCustom(false);
    onApply();
  };

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold text-sm transition-all whitespace-nowrap ${
          isActive
            ? "bg-indigo-100 text-indigo-700 border border-indigo-300"
            : "bg-white border border-slate-300 text-slate-700 hover:border-slate-400"
        }`}
      >
        <span>📅 {getPresetLabel()}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white rounded-xl border border-slate-200 shadow-lg z-50 min-w-64">
          {!showCustom ? (
            <div className="space-y-1 p-3">
              {PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handlePresetClick(preset.id as PresetType)}
                  className={`w-full text-left px-3 py-2 rounded-lg font-semibold text-sm transition-colors ${
                    selectedPreset === preset.id
                      ? "bg-indigo-100 text-indigo-700"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
              <button
                onClick={() => handlePresetClick("custom")}
                className={`w-full text-left px-3 py-2 rounded-lg font-semibold text-sm transition-colors mt-2 border-t border-slate-200 pt-3 ${
                  selectedPreset === "custom"
                    ? "bg-indigo-100 text-indigo-700"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                📆 Custom range
              </button>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">From</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-0 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">To</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-0 text-sm"
                />
              </div>
              <div className="flex gap-2 pt-2 border-t border-slate-200">
                <button
                  onClick={() => setShowCustom(false)}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors font-bold text-xs"
                >
                  Back
                </button>
                <button
                  onClick={handleApplyCustom}
                  disabled={!fromDate || !toDate}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-lime-400 text-indigo-950 hover:bg-lime-500 transition-colors font-bold text-xs disabled:opacity-50"
                >
                  Apply
                </button>
              </div>
              {selectedPreset === "custom" && (
                <button
                  onClick={handleReset}
                  className="w-full px-3 py-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors font-bold text-xs"
                >
                  Clear Filter
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
