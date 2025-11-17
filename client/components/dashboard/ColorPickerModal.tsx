import { useState } from "react";
import { X } from "lucide-react";

interface ColorPickerModalProps {
  brandColors?: string[];
  selectedColor?: string;
  onSelectColor: (color: string) => void;
  onClose: () => void;
}

const DEFAULT_COLORS = [
  "#000000",
  "#FFFFFF",
  "#FF0000",
  "#00FF00",
  "#0000FF",
  "#FFFF00",
  "#FF00FF",
  "#00FFFF",
  "#FFA500",
  "#800080",
  "#FFC0CB",
  "#A52A2A",
  "#808080",
  "#FFD700",
  "#4B0082",
  "#008080",
];

export function ColorPickerModal({
  brandColors = [],
  selectedColor,
  onSelectColor,
  onClose,
}: ColorPickerModalProps) {
  const [customColor, setCustomColor] = useState(selectedColor || "#000000");
  const [activeTab, setActiveTab] = useState<"brand" | "standard" | "custom">("brand");

  const handleApply = (color: string) => {
    onSelectColor(color);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-black text-slate-900">Color Picker</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-all"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-4 border-b border-slate-200 bg-slate-50">
          {brandColors.length > 0 && (
            <button
              onClick={() => setActiveTab("brand")}
              className={`flex-1 py-2 px-3 rounded-lg font-bold text-sm transition-all ${
                activeTab === "brand"
                  ? "bg-lime-400 text-indigo-950"
                  : "bg-white text-slate-700 hover:bg-slate-100"
              }`}
            >
              Brand Colors
            </button>
          )}
          <button
            onClick={() => setActiveTab("standard")}
            className={`flex-1 py-2 px-3 rounded-lg font-bold text-sm transition-all ${
              activeTab === "standard"
                ? "bg-lime-400 text-indigo-950"
                : "bg-white text-slate-700 hover:bg-slate-100"
            }`}
          >
            Standard
          </button>
          <button
            onClick={() => setActiveTab("custom")}
            className={`flex-1 py-2 px-3 rounded-lg font-bold text-sm transition-all ${
              activeTab === "custom"
                ? "bg-lime-400 text-indigo-950"
                : "bg-white text-slate-700 hover:bg-slate-100"
            }`}
          >
            Custom
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Brand Colors */}
          {activeTab === "brand" && brandColors.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-bold text-slate-600">Select a brand color:</p>
              <div className="grid grid-cols-4 gap-3">
                {brandColors.map((color, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleApply(color)}
                    className="group relative"
                  >
                    <div
                      className="w-full aspect-square rounded-lg border-3 hover:border-lime-400 transition-all hover:shadow-lg"
                      style={{
                        backgroundColor: color,
                        borderColor: selectedColor === color ? "#B9F227" : "#E5E7EB",
                      }}
                    />
                    <span className="text-xs font-bold text-slate-600 mt-1 block opacity-0 group-hover:opacity-100 transition-opacity">
                      {color}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Standard Colors */}
          {activeTab === "standard" && (
            <div className="space-y-3">
              <p className="text-sm font-bold text-slate-600">Select a standard color:</p>
              <div className="grid grid-cols-4 gap-3">
                {DEFAULT_COLORS.map((color, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleApply(color)}
                    className="group relative"
                  >
                    <div
                      className="w-full aspect-square rounded-lg border-3 hover:border-lime-400 transition-all hover:shadow-lg"
                      style={{
                        backgroundColor: color,
                        borderColor: selectedColor === color ? "#B9F227" : "#E5E7EB",
                      }}
                    />
                    <span className="text-xs font-bold text-slate-600 mt-1 block opacity-0 group-hover:opacity-100 transition-opacity">
                      {color}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Custom Color */}
          {activeTab === "custom" && (
            <div className="space-y-4">
              <p className="text-sm font-bold text-slate-600">Create a custom color:</p>

              {/* Color Input */}
              <div className="flex gap-3">
                <input
                  type="color"
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  className="w-16 h-16 rounded-lg cursor-pointer border-2 border-slate-200"
                />
                <div className="flex-1 space-y-2">
                  <label className="text-xs font-bold text-slate-600">Hex Code</label>
                  <input
                    type="text"
                    value={customColor.toUpperCase()}
                    onChange={(e) => {
                      let val = e.target.value;
                      if (!val.startsWith("#")) val = "#" + val;
                      if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                        setCustomColor(val);
                      }
                    }}
                    placeholder="#000000"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-lime-400"
                  />
                </div>
              </div>

              {/* Preview */}
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-xs font-bold text-slate-600 mb-2">Preview</p>
                <div
                  className="w-full h-20 rounded-lg border-2 border-slate-200"
                  style={{ backgroundColor: customColor }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 border-t border-slate-200">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-all"
          >
            Cancel
          </button>
          {activeTab === "custom" && (
            <button
              onClick={() => handleApply(customColor)}
              className="flex-1 px-4 py-2 rounded-lg bg-lime-400 text-indigo-950 font-bold hover:shadow-lg hover:shadow-lime-200 transition-all"
            >
              Apply Color
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
