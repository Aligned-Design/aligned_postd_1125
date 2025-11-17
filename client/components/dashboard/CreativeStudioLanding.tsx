import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { START_MODE_OPTIONS, DesignFormat, FORMAT_PRESETS } from "@/types/creativeStudio";
import { TemplateLibrarySelector } from "./TemplateLibrarySelector";

interface CreativeStudioLandingProps {
  onStartDesign: (mode: "ai" | "template" | "scratch", format: DesignFormat) => void;
  onSelectTemplate: (design: any) => void;
  onCancel: () => void;
}

export function CreativeStudioLanding({ onStartDesign, onSelectTemplate, onCancel }: CreativeStudioLandingProps) {
  const [selectedMode, setSelectedMode] = useState<"ai" | "template" | "scratch" | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<DesignFormat>("social_square");
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);

  const handleConfirm = () => {
    if (!selectedMode) return;

    if (selectedMode === "template") {
      setShowTemplateSelector(true);
    } else {
      onStartDesign(selectedMode, selectedFormat);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/30 via-white to-blue-50/20 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 mb-3">Create Your Design</h1>
          <p className="text-lg text-slate-600">Choose how you'd like to get started with your next creation</p>
        </div>

        {/* Start Mode Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {START_MODE_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => setSelectedMode(option.id as any)}
              className={`p-6 rounded-2xl border-2 transition-all duration-200 ${
                selectedMode === option.id
                  ? "border-lime-400 bg-lime-50 shadow-lg shadow-lime-200"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
              }`}
            >
              <div className="text-5xl mb-3">{option.icon}</div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{option.label}</h3>
              <p className="text-sm text-slate-600">{option.description}</p>
            </button>
          ))}
        </div>

        {/* Format Selection */}
        {selectedMode && (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 mb-8">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Select Design Format</h2>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {(Object.entries(FORMAT_PRESETS) as [DesignFormat, any][]).map(([format, preset]) => (
                <button
                  key={format}
                  onClick={() => setSelectedFormat(format)}
                  className={`p-4 rounded-lg border-2 transition-all text-center ${
                    selectedFormat === format
                      ? "border-lime-400 bg-lime-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="text-2xl mb-2">{preset.icon}</div>
                  <p className="text-xs font-bold text-slate-700">{preset.name}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {preset.width}×{preset.height}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={onCancel}
            className="px-6 py-3 rounded-lg bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedMode}
            className={`px-8 py-3 rounded-lg font-bold transition-all ${
              selectedMode
                ? "bg-lime-400 text-indigo-950 hover:shadow-lg hover:shadow-lime-200"
                : "bg-slate-300 text-slate-500 cursor-not-allowed"
            }`}
          >
            Start Designing
          </button>
        </div>
      </div>

      {/* Template Selector Modal */}
      {showTemplateSelector && (
        <TemplateLibrarySelector
          format={selectedFormat}
          onSelectTemplate={(design) => {
            onSelectTemplate(design);
            setShowTemplateSelector(false);
          }}
          onClose={() => setShowTemplateSelector(false)}
        />
      )}
    </div>
  );
}
