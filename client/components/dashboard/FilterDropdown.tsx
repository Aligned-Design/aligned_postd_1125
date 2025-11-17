import { useState, useRef, useEffect } from "react";
import { ChevronDown, X, Search } from "lucide-react";

interface FilterDropdownProps {
  label: string;
  icon?: string;
  options: Array<{ id: string; label: string; count?: number }>;
  selected: string[];
  onSelectionChange: (selected: string[]) => void;
  isActive?: boolean;
  placeholder?: string;
}

export function FilterDropdown({
  label,
  icon,
  options,
  selected,
  onSelectionChange,
  isActive = false,
  placeholder = "Search...",
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleOption = (optionId: string) => {
    onSelectionChange(
      selected.includes(optionId)
        ? selected.filter((id) => id !== optionId)
        : [...selected, optionId]
    );
  };

  const handleClearAll = () => {
    onSelectionChange([]);
    setSearchQuery("");
  };

  // Close dropdown on outside click
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
        <span>{icon && `${icon} `}{label}</span>
        {selected.length > 0 && (
          <span className="ml-1 px-2 py-0.5 bg-indigo-600 text-white rounded-full text-xs font-black">
            {selected.length}
          </span>
        )}
        <ChevronDown
          className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white rounded-xl border border-slate-200 shadow-lg z-50 min-w-56 max-w-xs">
          {/* Search Box (if many options) */}
          {options.length > 5 && (
            <div className="p-3 border-b border-slate-200">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder={placeholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-0 text-sm placeholder:text-slate-400"
                />
              </div>
            </div>
          )}

          {/* Options List */}
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              <div className="space-y-1 p-3">
                {filteredOptions.map((option) => (
                  <label
                    key={option.id}
                    className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(option.id)}
                      onChange={() => handleToggleOption(option.id)}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="flex-1 text-sm text-slate-700">{option.label}</span>
                    {option.count !== undefined && (
                      <span className="text-xs text-slate-500 font-semibold">{option.count}</span>
                    )}
                  </label>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-sm text-slate-500">No options found</div>
            )}
          </div>

          {/* Footer */}
          {selected.length > 0 && (
            <div className="p-3 border-t border-slate-200 flex gap-2">
              <button
                onClick={handleClearAll}
                className="flex-1 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors font-semibold text-xs"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
