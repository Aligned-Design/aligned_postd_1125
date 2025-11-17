import { useState } from "react";
import { Design, DesignFormat, FORMAT_PRESETS } from "@/types/creativeStudio";
import { X } from "lucide-react";

interface SmartResizeModalProps {
  design: Design;
  onResize: (newDesign: Design) => void;
  onClose: () => void;
}

interface ResizeOption {
  ratio: "1:1" | "9:16" | "16:9";
  name: string;
  format: DesignFormat;
  width: number;
  height: number;
  description: string;
}

const RESIZE_OPTIONS: ResizeOption[] = [
  {
    ratio: "1:1",
    name: "Square",
    format: "social_square",
    width: 1080,
    height: 1080,
    description: "Instagram Post, TikTok",
  },
  {
    ratio: "9:16",
    name: "Portrait / Vertical",
    format: "story_portrait",
    width: 1080,
    height: 1920,
    description: "Instagram Story, TikTok, Reels",
  },
  {
    ratio: "16:9",
    name: "Landscape / Wide",
    format: "blog_featured",
    width: 1200,
    height: 675,
    description: "Blog Headers, YouTube Thumbnail",
  },
];

export function SmartResizeModal({ design, onResize, onClose }: SmartResizeModalProps) {
  const [selectedRatio, setSelectedRatio] = useState<"1:1" | "9:16" | "16:9" | null>(null);
  const [preserveContent, setPreserveContent] = useState(true);

  const currentRatio = (design.width / design.height).toFixed(2);

  const handleResize = (option: ResizeOption) => {
    const resizedDesign: Design = {
      ...design,
      format: option.format,
      width: option.width,
      height: option.height,
    };

    if (preserveContent) {
      // Scale items proportionally to fit new canvas
      const scaleX = option.width / design.width;
      const scaleY = option.height / design.height;
      const scale = Math.min(scaleX, scaleY); // Keep aspect ratio

      resizedDesign.items = design.items.map((item) => {
        if (item.id === "bg-1" || item.type === "background") {
          // Always stretch background to fill
          return {
            ...item,
            width: option.width,
            height: option.height,
          };
        }

        return {
          ...item,
          x: item.x * scaleX,
          y: item.y * scaleY,
          width: item.width * scale,
          height: item.height * scale,
        };
      });
    }

    onResize(resizedDesign);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-white/60 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Smart Resize</h2>
            <p className="text-sm text-slate-600 mt-1">
              Convert your design to a different aspect ratio
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-all"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Current Design Info */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <p className="text-sm text-slate-600 font-semibold">Current Design</p>
            <p className="text-lg font-black text-slate-900 mt-1">
              {design.width} × {design.height}px
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Aspect Ratio: {currentRatio} ({design.width / gcd(design.width, design.height)}:
              {design.height / gcd(design.width, design.height)})
            </p>
          </div>

          {/* Options */}
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase">Select New Format</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {RESIZE_OPTIONS.map((option) => (
                <button
                  key={option.ratio}
                  onClick={() => setSelectedRatio(option.ratio)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectedRatio === option.ratio
                      ? "border-lime-400 bg-lime-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="text-2xl font-black text-slate-900 mb-2">{option.ratio}</div>
                  <p className="font-bold text-slate-700">{option.name}</p>
                  <p className="text-xs text-slate-600 mt-1">{option.width}×{option.height}px</p>
                  <p className="text-xs text-slate-500 mt-2">{option.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preserveContent}
                onChange={(e) => setPreserveContent(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300"
              />
              <span className="text-sm font-semibold text-slate-700">
                Preserve & Scale Content
              </span>
            </label>
            <p className="text-xs text-slate-600 ml-7">
              {preserveContent
                ? "Content will be proportionally scaled to fit the new canvas. Background will always stretch to fill."
                : "Only the canvas size will change. Content position and size will remain the same."}
            </p>
          </div>

          {/* Comparison Table */}
          {selectedRatio && (
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2 text-left font-bold text-slate-900">
                      Property
                    </th>
                    <th className="px-4 py-2 text-left font-bold text-slate-600">Current</th>
                    <th className="px-4 py-2 text-left font-bold text-slate-900">New</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {RESIZE_OPTIONS.find((o) => o.ratio === selectedRatio) && (
                    <>
                      <tr>
                        <td className="px-4 py-3 font-semibold text-slate-700">Width</td>
                        <td className="px-4 py-3 text-slate-600">{design.width}px</td>
                        <td className="px-4 py-3 font-bold text-slate-900">
                          {RESIZE_OPTIONS.find((o) => o.ratio === selectedRatio)?.width}px
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-semibold text-slate-700">Height</td>
                        <td className="px-4 py-3 text-slate-600">{design.height}px</td>
                        <td className="px-4 py-3 font-bold text-slate-900">
                          {RESIZE_OPTIONS.find((o) => o.ratio === selectedRatio)?.height}px
                        </td>
                      </tr>
                      <tr className="bg-slate-50">
                        <td className="px-4 py-3 font-semibold text-slate-700">Aspect Ratio</td>
                        <td className="px-4 py-3 text-slate-600">{currentRatio}</td>
                        <td className="px-4 py-3 font-bold text-slate-900">{selectedRatio}</td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-white/80 backdrop-blur-xl border-t border-white/60 p-6 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-lg bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-all"
          >
            Cancel
          </button>
          {selectedRatio && (
            <button
              onClick={() => {
                const option = RESIZE_OPTIONS.find((o) => o.ratio === selectedRatio);
                if (option) {
                  handleResize(option);
                  onClose();
                }
              }}
              className="px-6 py-3 rounded-lg bg-lime-400 text-indigo-950 font-bold hover:shadow-lg hover:shadow-lime-200 transition-all"
            >
              Apply Resize
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}
