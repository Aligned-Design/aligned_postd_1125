import { useState, useRef, useEffect } from "react";
import { Save, ChevronDown, Check, Archive, Copy, Sparkles, Edit2, Download } from "lucide-react";

interface SaveDropdownProps {
  isPrimary?: boolean;
  hasUnsavedChanges?: boolean;
  lastAction?: string;
  onSaveToLibrary: () => void;
  onSaveAsDraft: () => void;
  onSaveCreateVariant: () => void;
  onRenameAsset: () => void;
  onDownload: () => void;
}

export function SaveDropdown({
  isPrimary = false,
  hasUnsavedChanges = false,
  lastAction,
  onSaveToLibrary,
  onSaveAsDraft,
  onSaveCreateVariant,
  onRenameAsset,
  onDownload,
}: SaveDropdownProps) {
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
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setIsOpen(true);
          setFocusedIndex(0);
        }
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedIndex((prev) => (prev < 4 ? prev + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : 4));
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

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, focusedIndex]);

  // Focus item when keyboard navigates
  useEffect(() => {
    if (focusedIndex >= 0 && itemsRef.current[focusedIndex]) {
      itemsRef.current[focusedIndex].focus();
    }
  }, [focusedIndex]);

  const baseClasses = "flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all";
  const primaryClasses = isPrimary
    ? "bg-lime-400 text-indigo-950 hover:bg-lime-500"
    : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200";

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Unified Dropdown Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) setFocusedIndex(0);
        }}
        className={`${baseClasses} ${primaryClasses} relative`}
        title={hasUnsavedChanges ? "Unsaved changes" : "Save your design"}
      >
        <Save className="w-4 h-4" />
        <span>Save</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        {hasUnsavedChanges && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-current rounded-full" />
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-white/60 z-50 overflow-hidden">
          {/* Save to Library */}
          <button
            ref={(el) => {
              if (el) itemsRef.current[0] = el;
            }}
            onMouseEnter={() => setFocusedIndex(0)}
            onClick={() => {
              onSaveToLibrary();
              setIsOpen(false);
              setFocusedIndex(-1);
            }}
            className="w-full px-4 py-3 text-left hover:bg-slate-50 border-b border-slate-100 transition-colors flex items-start justify-between group focus:outline-none focus:bg-indigo-50"
          >
            <div className="flex items-start gap-3 flex-1">
              <Archive className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-slate-900 group-hover:text-indigo-700">Save to Library</p>
                <p className="text-xs text-slate-500">Persist to current post</p>
              </div>
            </div>
            {lastAction === "saveToLibrary" && <Check className="w-4 h-4 text-lime-500 flex-shrink-0" />}
          </button>

          {/* Save as Draft */}
          <button
            ref={(el) => {
              if (el) itemsRef.current[1] = el;
            }}
            onMouseEnter={() => setFocusedIndex(1)}
            onClick={() => {
              onSaveAsDraft();
              setIsOpen(false);
              setFocusedIndex(-1);
            }}
            className="w-full px-4 py-3 text-left hover:bg-slate-50 border-b border-slate-100 transition-colors flex items-start justify-between group focus:outline-none focus:bg-indigo-50"
          >
            <div className="flex items-start gap-3 flex-1">
              <Edit2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-slate-900 group-hover:text-indigo-700">Save as Draft</p>
                <p className="text-xs text-slate-500">Create/overwrite post draft</p>
              </div>
            </div>
            {lastAction === "saveAsDraft" && <Check className="w-4 h-4 text-lime-500 flex-shrink-0" />}
          </button>

          {/* Save & Create Variant */}
          <button
            ref={(el) => {
              if (el) itemsRef.current[2] = el;
            }}
            onMouseEnter={() => setFocusedIndex(2)}
            onClick={() => {
              onSaveCreateVariant();
              setIsOpen(false);
              setFocusedIndex(-1);
            }}
            className="w-full px-4 py-3 text-left hover:bg-slate-50 border-b border-slate-100 transition-colors flex items-start justify-between group focus:outline-none focus:bg-indigo-50"
          >
            <div className="flex items-start gap-3 flex-1">
              <Copy className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-slate-900 group-hover:text-indigo-700">Save & Create Variant</p>
                <p className="text-xs text-slate-500">Duplicate into new variant</p>
              </div>
            </div>
            {lastAction === "saveCreateVariant" && <Check className="w-4 h-4 text-lime-500 flex-shrink-0" />}
          </button>

          {/* Divider */}
          <div className="h-px bg-slate-100 my-1" />

          {/* Rename Asset */}
          <button
            ref={(el) => {
              if (el) itemsRef.current[3] = el;
            }}
            onMouseEnter={() => setFocusedIndex(3)}
            onClick={() => {
              onRenameAsset();
              setIsOpen(false);
              setFocusedIndex(-1);
            }}
            className="w-full px-4 py-3 text-left hover:bg-slate-50 border-b border-slate-100 transition-colors flex items-start gap-3 group focus:outline-none focus:bg-indigo-50"
          >
            <Sparkles className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-slate-900 group-hover:text-indigo-700">Rename Asset</p>
              <p className="text-xs text-slate-500">Edit design name</p>
            </div>
          </button>

          {/* Download */}
          <button
            ref={(el) => {
              if (el) itemsRef.current[4] = el;
            }}
            onMouseEnter={() => setFocusedIndex(4)}
            onClick={() => {
              onDownload();
              setIsOpen(false);
              setFocusedIndex(-1);
            }}
            className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors flex items-start justify-between group focus:outline-none focus:bg-indigo-50"
          >
            <div className="flex items-start gap-3 flex-1">
              <Download className="w-4 h-4 text-slate-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-slate-900 group-hover:text-indigo-700">Download</p>
                <p className="text-xs text-slate-500">PNG / JPG / MP4</p>
              </div>
            </div>
            {lastAction === "download" && <Check className="w-4 h-4 text-lime-500 flex-shrink-0" />}
          </button>
        </div>
      )}
    </div>
  );
}
