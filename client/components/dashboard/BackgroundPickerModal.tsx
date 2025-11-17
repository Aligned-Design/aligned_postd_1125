import { useState } from "react";
import { X } from "lucide-react";

interface BackgroundPickerModalProps {
  currentColor?: string;
  onConfirm: (backgroundColor: string) => void;
  onClose: () => void;
}

const PRESET_COLORS = [
  { name: "White", color: "#FFFFFF" },
  { name: "Light Gray", color: "#F3F4F6" },
  { name: "Dark Gray", color: "#1F2937" },
  { name: "Black", color: "#000000" },
  { name: "Indigo", color: "#4F46E5" },
  { name: "Blue", color: "#3B82F6" },
  { name: "Cyan", color: "#06B6D4" },
  { name: "Teal", color: "#14B8A6" },
  { name: "Green", color: "#10B981" },
  { name: "Emerald", color: "#059669" },
  { name: "Lime", color: "#84CC16" },
  { name: "Yellow", color: "#FBBF24" },
  { name: "Orange", color: "#F97316" },
  { name: "Red", color: "#EF4444" },
  { name: "Rose", color: "#F43F5E" },
  { name: "Pink", color: "#EC4899" },
];

export function BackgroundPickerModal({ currentColor = "#FFFFFF", onConfirm, onClose }: BackgroundPickerModalProps) {
  const [selectedColor, setSelectedColor] = useState(currentColor);
  const [customColor, setCustomColor] = useState(currentColor);
  const [useCustom, setUseCustom] = useState(!PRESET_COLORS.some((p) => p.color === currentColor));

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-black text-slate-900">Canvas Background</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Preset Colors */}
        <div className="mb-6">
          <p className="text-xs font-bold text-slate-600 mb-3 uppercase">Preset Colors</p>
          <div className="grid grid-cols-4 gap-2">
            {PRESET_COLORS.map((preset) => (
              <button
                key={preset.color}
                onClick={() => {
                  setSelectedColor(preset.color);
                  setUseCustom(false);
                }}
                className={`w-full aspect-square rounded-lg border-2 transition-all ${
                  !useCustom && selectedColor === preset.color
                    ? "border-lime-400 shadow-lg"
                    : "border-slate-200 hover:border-slate-300"
                }`}
                style={{ backgroundColor: preset.color }}
                title={preset.name}
              />
            ))}
          </div>
        </div>

        {/* Custom Color */}
        <div className="mb-6">
          <p className="text-xs font-bold text-slate-600 mb-2 uppercase">Custom Color</p>
          <div className="flex gap-2">
            <input
              type="color"
              value={customColor}
              onChange={(e) => {
                setCustomColor(e.target.value);
                setUseCustom(true);
                setSelectedColor(e.target.value);
              }}
              className="w-12 h-10 rounded-lg cursor-pointer border border-slate-200"
            />
            <input
              type="text"
              value={customColor}
              onChange={(e) => {
                if (e.target.value.startsWith("#") && e.target.value.length === 7) {
                  setCustomColor(e.target.value);
                  setSelectedColor(e.target.value);
                  setUseCustom(true);
                }
              }}
              placeholder="#000000"
              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
            />
          </div>
        </div>

        {/* Preview */}
        <div className="mb-6">
          <p className="text-xs font-bold text-slate-600 mb-2 uppercase">Preview</p>
          <div
            className="w-full h-24 rounded-lg border border-slate-200"
            style={{ backgroundColor: selectedColor }}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-bold hover:bg-slate-200 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(selectedColor)}
            className="flex-1 px-4 py-2 bg-lime-400 text-indigo-950 rounded-lg font-bold hover:bg-lime-500 transition-all"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
