import { useState } from "react";
import { ColorSwatch, generatePaletteVariants } from "@/lib/colorExtraction";
import { RefreshCw, Edit2, Check, X } from "lucide-react";

interface PalettePreviewProps {
  swatches: ColorSwatch[];
  onConfirm: (colors: string[]) => void;
  onRegenerateVariants: () => void;
}

export function PalettePreview({ swatches, onConfirm, onRegenerateVariants }: PalettePreviewProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editColor, setEditColor] = useState("");
  const [selectedColors, setSelectedColors] = useState<string[]>(swatches.map((s) => s.color));

  const handleEditStart = (index: number, color: string) => {
    setEditingIndex(index);
    setEditColor(color);
  };

  const handleEditSave = (index: number) => {
    if (editColor.match(/^#[0-9A-F]{6}$/i)) {
      const newColors = [...selectedColors];
      newColors[index] = editColor;
      setSelectedColors(newColors);
      setEditingIndex(null);
    }
  };

  const handleUseThisPalette = () => {
    onConfirm(selectedColors);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h3 className="text-sm font-black text-slate-900 mb-2">Your Brand Colors</h3>
        <p className="text-xs text-slate-600">
          We've extracted these colors from your logo. Adjust or confirm to use them.
        </p>
      </div>

      {/* Palette Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {selectedColors.map((color, idx) => {
          const swatch = swatches[idx];
          const isEditing = editingIndex === idx;

          return (
            <div key={idx} className="space-y-2">
              {isEditing ? (
                <div className="flex gap-2 items-end">
                  <input
                    type="text"
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value)}
                    placeholder="#000000"
                    className="flex-1 px-2 py-1 text-xs rounded border-2 border-indigo-500 font-mono"
                  />
                  <button
                    onClick={() => handleEditSave(idx)}
                    className="p-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => setEditingIndex(null)}
                    className="p-1 bg-slate-200 text-slate-700 rounded hover:bg-slate-300 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <>
                  <div
                    className="h-20 rounded-lg border-2 border-slate-200 cursor-pointer hover:border-indigo-500 transition-colors shadow-sm"
                    style={{ backgroundColor: color }}
                    onClick={() => handleEditStart(idx, color)}
                    title="Click to edit"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-900">{swatch?.name || "Color"}</p>
                      <button
                        onClick={() => handleEditStart(idx, color)}
                        className="p-0.5 hover:bg-slate-100 rounded transition-colors"
                      >
                        <Edit2 className="w-3 h-3 text-indigo-600" />
                      </button>
                    </div>
                    <p className="text-xs font-mono text-slate-600">{color}</p>
                    {swatch?.wcag && (
                      <div className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                        swatch.wcag.score === "AAA"
                          ? "bg-green-100 text-green-700"
                          : swatch.wcag.score === "AA"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-red-100 text-red-700"
                      }`}>
                        WCAG {swatch.wcag.score}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-slate-200">
        <button
          onClick={onRegenerateVariants}
          className="flex-1 px-4 py-2 border-2 border-slate-300 rounded-lg font-bold text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Try Another Mix
        </button>
        <button
          onClick={handleUseThisPalette}
          className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 transition-colors"
        >
          Use This Palette ✓
        </button>
      </div>

      {/* Info */}
      <p className="text-xs text-slate-500 text-center">
        💡 WCAG ratings help ensure readability. "AAA" is best.
      </p>
    </div>
  );
}
