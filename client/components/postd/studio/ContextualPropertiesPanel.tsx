/**
 * ContextualPropertiesPanel - Right panel that appears when element is selected
 * Phase 1 Canvas Simplification - Advanced properties, brand-first
 */

import { X, Sparkles, Palette, Type, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/design-system";
import { CanvasItem, Design } from "@/types/creativeStudio";
import { BrandGuide } from "@/types/brandGuide";

interface ContextualPropertiesPanelProps {
  item: CanvasItem | null;
  design: Design;
  brand: BrandGuide | null;
  onClose: () => void;
  onUpdateItem: (updates: Partial<CanvasItem>) => void;
  onUpdateDesign?: (updates: Partial<Design>) => void;
  onApplyBrandStyle?: () => void;
  onReplaceImage?: () => void;
  onEnterCropMode?: () => void;
  croppingItemId?: string | null;
  cropAspectRatio?: "1:1" | "9:16" | "16:9" | "free";
  onCropAspectRatioChange?: (ratio: "1:1" | "9:16" | "16:9" | "free") => void;
  onConfirmCrop?: (itemId: string, crop: { x: number; y: number; width: number; height: number; aspectRatio?: "1:1" | "9:16" | "16:9" | "free" }) => void;
  onExitCropMode?: () => void;
  className?: string;
}

export function ContextualPropertiesPanel({
  item,
  design,
  brand,
  onClose,
  onUpdateItem,
  onUpdateDesign,
  onApplyBrandStyle,
  onReplaceImage,
  onEnterCropMode,
  croppingItemId,
  cropAspectRatio = "free",
  onCropAspectRatioChange,
  onConfirmCrop,
  onExitCropMode,
  className,
}: ContextualPropertiesPanelProps) {
  if (!item) {
    // Canvas properties when nothing selected
    return (
      <div className={cn("w-80 bg-white border-l border-slate-200 p-6 overflow-y-auto", className)}>
        <h3 className="text-sm font-bold text-slate-900 mb-4">Canvas Properties</h3>
        
        {/* Background Color */}
        <div className="mb-6">
          <label className="block text-xs font-medium text-slate-700 mb-2">Background</label>
          <div className="flex items-center gap-2">
            {brand?.primaryColor && (
              <button
                onClick={() => onUpdateItem({ backgroundColor: brand.primaryColor } as Partial<CanvasItem>)}
                className="w-8 h-8 rounded border-2 border-slate-200 hover:border-indigo-400"
                style={{ backgroundColor: brand.primaryColor }}
                title="Brand Primary"
              />
            )}
              <input
                type="color"
                value={design.backgroundColor || "#FFFFFF"}
                onChange={(e) => {
                  onUpdateDesign?.({ backgroundColor: e.target.value });
                }}
                className="w-8 h-8 rounded border border-slate-200 cursor-pointer"
              />
          </div>
        </div>

        {/* Canvas Size */}
        <div className="mb-6">
          <label className="block text-xs font-medium text-slate-700 mb-2">Size</label>
          <div className="text-sm text-slate-600">
            {design.width} × {design.height}px
          </div>
        </div>
      </div>
    );
  }

  const isText = item.type === "text";
  const isImage = item.type === "image";

  return (
    <div className={cn("w-80 bg-white border-l border-slate-200 p-6 overflow-y-auto", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-bold text-slate-900 capitalize">
          {item.type} Properties
        </h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-100 rounded transition-colors"
        >
          <X className="w-4 h-4 text-slate-600" />
        </button>
      </div>

      {/* Apply Brand Style - Prominent */}
      {isText && brand && onApplyBrandStyle && (
        <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
          <button
            onClick={onApplyBrandStyle}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Apply Brand Style
          </button>
          <p className="text-xs text-slate-600 mt-2 text-center">
            {brand.fontFamily} + {brand.primaryColor}
          </p>
        </div>
      )}

      {/* Text Properties */}
      {isText && (
        <div className="space-y-6">
          {/* Font Family - Brand First */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-2">Font</label>
            <select
              value={item.fontFamily || "Arial"}
              onChange={(e) => onUpdateItem({ fontFamily: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {brand?.fontFamily && (
                <option value={brand.fontFamily}>{brand.fontFamily} (Brand)</option>
              )}
              <option value="Arial">Arial</option>
              <option value="Helvetica">Helvetica</option>
              <option value="Georgia">Georgia</option>
              <option value="Times New Roman">Times New Roman</option>
            </select>
          </div>

          {/* Font Size */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-2">
              Size: {item.fontSize || 24}px
            </label>
            <input
              type="range"
              min="12"
              max="72"
              value={item.fontSize || 24}
              onChange={(e) => onUpdateItem({ fontSize: Number(e.target.value) })}
              className="w-full"
            />
          </div>

          {/* Font Weight */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-2">Weight</label>
            <div className="flex gap-2">
              <button
                onClick={() => onUpdateItem({ fontWeight: "normal" })}
                className={cn(
                  "flex-1 px-3 py-2 text-sm rounded-lg border transition-colors",
                  item.fontWeight === "normal" || !item.fontWeight
                    ? "bg-indigo-100 border-indigo-300 text-indigo-700 font-bold"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                )}
              >
                Regular
              </button>
              <button
                onClick={() => onUpdateItem({ fontWeight: "bold" })}
                className={cn(
                  "flex-1 px-3 py-2 text-sm rounded-lg border transition-colors",
                  item.fontWeight === "bold"
                    ? "bg-indigo-100 border-indigo-300 text-indigo-700 font-bold"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                )}
              >
                Bold
              </button>
            </div>
          </div>

          {/* Color - Brand Colors First */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-2">Color</label>
            <div className="space-y-2">
              {/* Brand Colors */}
              {brand && (
                <div>
                  <p className="text-xs text-slate-500 mb-2">Brand Colors</p>
                  <div className="flex flex-wrap gap-2">
                    {[brand.primaryColor, brand.secondaryColor, ...(brand.colorPalette || [])]
                      .filter(Boolean)
                      .slice(0, 6)
                      .map((color, idx) => (
                        <button
                          key={idx}
                          onClick={() => onUpdateItem({ fontColor: color })}
                          className={cn(
                            "w-10 h-10 rounded-lg border-2 transition-all",
                            item.fontColor === color
                              ? "border-indigo-500 ring-2 ring-indigo-200 scale-110"
                              : "border-slate-200 hover:border-slate-300"
                          )}
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                  </div>
                </div>
              )}
              
              {/* Custom Color */}
              <div>
                <p className="text-xs text-slate-500 mb-2">Custom</p>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={item.fontColor || "#111827"}
                    onChange={(e) => onUpdateItem({ fontColor: e.target.value })}
                    className="w-10 h-10 rounded border border-slate-200 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={item.fontColor || "#111827"}
                    onChange={(e) => onUpdateItem({ fontColor: e.target.value })}
                    className="flex-1 px-3 py-2 text-sm bg-white border border-slate-200 text-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-0 placeholder:text-slate-400"
                    placeholder="#111827"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Text Content */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-2">Text</label>
            <textarea
              value={item.text || ""}
              onChange={(e) => onUpdateItem({ text: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 text-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-0 resize-none placeholder:text-slate-400"
              rows={3}
            />
          </div>
        </div>
      )}

      {/* Image Properties */}
      {isImage && (
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-2">Image</label>
            {item.imageUrl && (
              <div className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 mb-2">
                <img
                  src={item.imageUrl}
                  alt={item.imageName || "Image"}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <p className="text-xs text-slate-500">{item.imageName || "No image"}</p>
          </div>

          {/* Image Actions */}
          <div className="space-y-2">
            <button 
              onClick={() => {
                if (onReplaceImage) {
                  onReplaceImage();
                }
              }}
              className="w-full px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Replace Image
            </button>
            <button className="w-full px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
              Apply Filters
            </button>
            {croppingItemId === item.id ? (
              <div className="space-y-2">
                {/* Aspect Ratio Selector */}
                {onCropAspectRatioChange && (
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-slate-700">Aspect Ratio</label>
                    <div className="grid grid-cols-4 gap-2">
                      {(["free", "1:1", "9:16", "16:9"] as const).map((ratio) => (
                        <button
                          key={ratio}
                          onClick={() => onCropAspectRatioChange(ratio)}
                          className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                            cropAspectRatio === ratio
                              ? "bg-lime-400 text-indigo-950 font-bold"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          {ratio === "free" ? "Free" : ratio}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {/* Confirm/Cancel */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (onExitCropMode) onExitCropMode();
                    }}
                    className="flex-1 px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <p className="text-xs text-slate-500 text-center">
                    Use the Confirm button in the crop overlay on the canvas
                  </p>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  if (onEnterCropMode) onEnterCropMode();
                }}
                className="w-full px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Crop Image
              </button>
            )}
          </div>
        </div>
      )}

      {/* Position & Size */}
      <div className="mt-6 pt-6 border-t border-slate-200">
        <h4 className="text-xs font-medium text-slate-700 mb-3">Position & Size</h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">X</label>
            <input
              type="number"
              value={Math.round(item.x)}
              onChange={(e) => onUpdateItem({ x: Number(e.target.value) })}
              className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Y</label>
            <input
              type="number"
              value={Math.round(item.y)}
              onChange={(e) => onUpdateItem({ y: Number(e.target.value) })}
              className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Width</label>
            <input
              type="number"
              value={Math.round(item.width)}
              onChange={(e) => onUpdateItem({ width: Number(e.target.value) })}
              className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Height</label>
            <input
              type="number"
              value={Math.round(item.height)}
              onChange={(e) => onUpdateItem({ height: Number(e.target.value) })}
              className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

