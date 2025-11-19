/**
 * ContextualFloatingToolbar - Enhanced floating toolbar with contextual options
 * Phase 1 Canvas Simplification - Shows relevant tools based on element type
 */

import { 
  Trash2, Copy, AlignLeft, AlignCenter, AlignRight, 
  Type, Bold, Italic, Palette, Sparkles, Image as ImageIcon,
  Crop, Replace, Filter, RotateCw
} from "lucide-react";
import { cn } from "@/lib/design-system";
import { CanvasItem } from "@/types/creativeStudio";

interface ContextualFloatingToolbarProps {
  item: CanvasItem;
  position: { x: number; y: number };
  brandColors?: string[];
  brandFont?: string;
  onDelete: () => void;
  onDuplicate: () => void;
  onAlign?: (alignment: "left" | "center" | "right") => void;
  onRotate?: () => void;
  // Text-specific
  onFontChange?: (font: string) => void;
  onSizeChange?: (size: number) => void;
  onWeightChange?: (weight: "normal" | "bold") => void;
  onColorChange?: (color: string) => void;
  onAiRewrite?: () => void;
  onApplyBrandStyle?: () => void;
  // Image-specific
  onCrop?: () => void;
  onReplace?: () => void;
  onFilters?: () => void;
  onSwapImage?: () => void;
  className?: string;
}

export function ContextualFloatingToolbar({
  item,
  position,
  brandColors = [],
  brandFont,
  onDelete,
  onDuplicate,
  onAlign,
  onRotate,
  onFontChange,
  onSizeChange,
  onWeightChange,
  onColorChange,
  onAiRewrite,
  onApplyBrandStyle,
  onCrop,
  onReplace,
  onFilters,
  onSwapImage,
  className,
}: ContextualFloatingToolbarProps) {
  const toolbarStyle = {
    left: `${position.x}px`,
    top: `${position.y - 56}px`, // Above element
  };

  const isText = item.type === "text";
  const isImage = item.type === "image";

  return (
    <div
      className={cn(
        "absolute z-50 flex items-center gap-1 bg-white rounded-lg shadow-xl border border-slate-200 p-1.5",
        "animate-in fade-in slide-in-from-bottom-2 duration-200",
        className
      )}
      style={toolbarStyle}
    >
      {/* Common Actions */}
      <button
        onClick={onDelete}
        className="p-2 hover:bg-red-50 rounded-md transition-colors group"
        title="Delete"
      >
        <Trash2 className="w-4 h-4 text-red-600 group-hover:text-red-700" />
      </button>
      <button
        onClick={onDuplicate}
        className="p-2 hover:bg-indigo-50 rounded-md transition-colors group"
        title="Duplicate"
      >
        <Copy className="w-4 h-4 text-indigo-600 group-hover:text-indigo-700" />
      </button>

      <div className="w-px h-6 bg-slate-200" />

      {/* Text-Specific Tools */}
      {isText && (
        <>
          {/* Apply Brand Style - One-click */}
          {onApplyBrandStyle && brandFont && brandColors.length > 0 && (
            <>
              <button
                onClick={onApplyBrandStyle}
                className="px-3 py-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-md transition-colors text-xs font-bold flex items-center gap-1.5"
                title="Apply Brand Style"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Brand
              </button>
              <div className="w-px h-6 bg-slate-200" />
            </>
          )}

          {/* Font Quick Select */}
          {onFontChange && (
            <select
              value={item.fontFamily || "Arial"}
              onChange={(e) => onFontChange(e.target.value)}
              className="px-2 py-1.5 text-xs font-medium border border-slate-200 rounded-md bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              onClick={(e) => e.stopPropagation()}
            >
              {brandFont && <option value={brandFont}>{brandFont} (Brand)</option>}
              <option value="Arial">Arial</option>
              <option value="Helvetica">Helvetica</option>
              <option value="Georgia">Georgia</option>
              <option value="Times New Roman">Times</option>
            </select>
          )}

          {/* Size */}
          {onSizeChange && (
            <select
              value={item.fontSize || 24}
              onChange={(e) => onSizeChange(Number(e.target.value))}
              className="px-2 py-1.5 text-xs font-medium border border-slate-200 rounded-md bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              onClick={(e) => e.stopPropagation()}
            >
              <option value={12}>12</option>
              <option value={16}>16</option>
              <option value={20}>20</option>
              <option value={24}>24</option>
              <option value={32}>32</option>
              <option value={48}>48</option>
            </select>
          )}

          {/* Weight */}
          {onWeightChange && (
            <>
              <button
                onClick={() => onWeightChange(item.fontWeight === "bold" ? "normal" : "bold")}
                className={cn(
                  "p-2 rounded-md transition-colors",
                  item.fontWeight === "bold"
                    ? "bg-indigo-100 text-indigo-700"
                    : "hover:bg-slate-50 text-slate-600"
                )}
                title="Bold"
              >
                <Bold className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Color - Brand Colors First */}
          {onColorChange && (
            <>
              <div className="w-px h-6 bg-slate-200" />
              <div className="flex items-center gap-1">
                {brandColors.slice(0, 3).map((color, idx) => (
                  <button
                    key={idx}
                    onClick={() => onColorChange(color)}
                    className={cn(
                      "w-6 h-6 rounded border-2 transition-all",
                      item.fontColor === color
                        ? "border-indigo-500 ring-2 ring-indigo-200"
                        : "border-slate-200 hover:border-slate-300"
                    )}
                    style={{ backgroundColor: color }}
                    title={`Brand Color ${idx + 1}`}
                  />
                ))}
                <button
                  onClick={() => {
                    // Open color picker
                    const color = prompt("Enter hex color:", item.fontColor || "#111827");
                    if (color) onColorChange(color);
                  }}
                  className="w-6 h-6 rounded border-2 border-slate-200 hover:border-slate-300 bg-white flex items-center justify-center"
                  title="More Colors"
                >
                  <Palette className="w-3 h-3 text-slate-600" />
                </button>
              </div>
            </>
          )}

          {/* Alignment */}
          {onAlign && (
            <>
              <div className="w-px h-6 bg-slate-200" />
              <button
                onClick={() => onAlign("left")}
                className={cn(
                  "p-2 rounded-md transition-colors",
                  item.textAlign === "left"
                    ? "bg-indigo-100 text-indigo-700"
                    : "hover:bg-slate-50 text-slate-600"
                )}
                title="Align Left"
              >
                <AlignLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => onAlign("center")}
                className={cn(
                  "p-2 rounded-md transition-colors",
                  item.textAlign === "center"
                    ? "bg-indigo-100 text-indigo-700"
                    : "hover:bg-slate-50 text-slate-600"
                )}
                title="Align Center"
              >
                <AlignCenter className="w-4 h-4" />
              </button>
              <button
                onClick={() => onAlign("right")}
                className={cn(
                  "p-2 rounded-md transition-colors",
                  item.textAlign === "right"
                    ? "bg-indigo-100 text-indigo-700"
                    : "hover:bg-slate-50 text-slate-600"
                )}
                title="Align Right"
              >
                <AlignRight className="w-4 h-4" />
              </button>
            </>
          )}

          {/* AI Rewrite */}
          {onAiRewrite && (
            <>
              <div className="w-px h-6 bg-slate-200" />
              <button
                onClick={onAiRewrite}
                className="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-md transition-colors text-xs font-bold flex items-center gap-1.5"
                title="AI Rewrite"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Rewrite
              </button>
            </>
          )}
        </>
      )}

      {/* Image-Specific Tools */}
      {isImage && (
        <>
          <div className="w-px h-6 bg-slate-200" />
          {onCrop && (
            <button
              onClick={onCrop}
              className="p-2 hover:bg-slate-50 rounded-md transition-colors"
              title="Crop"
            >
              <Crop className="w-4 h-4 text-slate-600" />
            </button>
          )}
          {onReplace && (
            <button
              onClick={onReplace}
              className="p-2 hover:bg-slate-50 rounded-md transition-colors"
              title="Replace Image"
            >
              <Replace className="w-4 h-4 text-slate-600" />
            </button>
          )}
          {onFilters && (
            <button
              onClick={onFilters}
              className="p-2 hover:bg-slate-50 rounded-md transition-colors"
              title="Filters"
            >
              <Filter className="w-4 h-4 text-slate-600" />
            </button>
          )}
          {onSwapImage && (
            <button
              onClick={onSwapImage}
              className="p-2 hover:bg-slate-50 rounded-md transition-colors"
              title="Swap Image"
            >
              <ImageIcon className="w-4 h-4 text-slate-600" />
            </button>
          )}
        </>
      )}

      {/* Rotate (all elements) */}
      {onRotate && (
        <>
          <div className="w-px h-6 bg-slate-200" />
          <button
            onClick={onRotate}
            className="p-2 hover:bg-slate-50 rounded-md transition-colors"
            title="Rotate 45°"
          >
            <RotateCw className="w-4 h-4 text-slate-600" />
          </button>
        </>
      )}
    </div>
  );
}

