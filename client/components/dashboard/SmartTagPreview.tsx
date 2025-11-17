import { X, Check, AlertCircle } from "lucide-react";
import { useState } from "react";
import { Asset, mockDetectAsset } from "@/types/library";

interface SmartTagPreviewProps {
  assetId: string;
  onApprove: (tags: string[]) => void;
  onSkip: () => void;
}

export function SmartTagPreview({ assetId, onApprove, onSkip }: SmartTagPreviewProps) {
  // Mock detection for now
  const mockAsset: Asset = {
    id: assetId,
    filename: "sample.jpg",
    fileType: "image",
    fileSize: 2500000,
    width: 1280,
    height: 720,
    thumbnailUrl: "https://images.unsplash.com/photo-1500000000?w=300&h=300&fit=crop",
    storagePath: "/assets/sample.jpg",
    tags: [],
    category: "Team",
    people: [],
    colors: ["#3B82F6"],
    platformFits: ["Square Post"],
    campaignIds: [],
    eventIds: [],
    usageCount: 0,
    favorite: false,
    source: "upload",
    uploadedAt: new Date().toISOString(),
    uploadedBy: "user-1",
    brandId: "brand-1",
    aiTagsPending: true,
  };

  const detection = mockDetectAsset(mockAsset.filename, mockAsset.fileType);
  const [selectedTags, setSelectedTags] = useState<string[]>(detection.suggestedTags.slice(0, 6));
  const [customTag, setCustomTag] = useState("");

  const handleToggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleAddCustomTag = () => {
    if (customTag.trim() && !selectedTags.includes(customTag.trim())) {
      setSelectedTags([...selectedTags, customTag.trim()]);
      setCustomTag("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setSelectedTags(selectedTags.filter((t) => t !== tag));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-lime-50 to-green-50 p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <Check className="w-6 h-6 text-lime-600" />
              Approve Smart Tags
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              AI detected tags for your asset. Review and customize before saving.
            </p>
          </div>
          <button
            onClick={onSkip}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <div className="p-8 space-y-6">
          {/* AI Confidence Info */}
          <div className="flex gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-blue-900">AI Detection Complete</p>
              <p className="text-sm text-blue-700 mt-1">
                AI analyzed your asset with ~{Math.round(detection.detectionConfidence)}% confidence. You can
                modify or add tags as needed.
              </p>
            </div>
          </div>

          {/* Detection Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-900 mb-2">Category</label>
              <div className="px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-bold">
                {detection.suggestedCategory}
              </div>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-900 mb-2">Best For</label>
              <div className="flex flex-wrap gap-1.5">
                {detection.suggestedPlatformFits.map((fit) => (
                  <div
                    key={fit}
                    className="px-2.5 py-1 bg-green-100 text-green-700 rounded text-xs font-bold"
                  >
                    {fit}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Colors Detected */}
          {detection.suggestedColors.length > 0 && (
            <div>
              <label className="block text-xs font-black text-slate-900 mb-2">Colors Detected</label>
              <div className="flex gap-2">
                {detection.suggestedColors.map((color) => (
                  <div
                    key={color}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg"
                  >
                    <div
                      className="w-6 h-6 rounded border border-slate-300"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-xs font-mono font-bold text-slate-600">{color}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* People Detected */}
          {detection.suggestedPeople.length > 0 && (
            <div>
              <label className="block text-xs font-black text-slate-900 mb-2">People Detected</label>
              <div className="flex flex-wrap gap-2">
                {detection.suggestedPeople.map((person) => (
                  <div
                    key={person}
                    className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-sm font-bold"
                  >
                    {person}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags Selection */}
          <div>
            <label className="block text-xs font-black text-slate-900 mb-3">Tags</label>
            <div className="space-y-3">
              {/* Suggested Tags */}
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-2">Suggested</p>
                <div className="flex flex-wrap gap-2">
                  {detection.suggestedTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handleToggleTag(tag)}
                      className={`px-3 py-1.5 rounded-lg font-semibold text-sm transition-all ${
                        selectedTags.includes(tag)
                          ? "bg-lime-400 text-indigo-950"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {selectedTags.includes(tag) ? "✓ " : ""}{tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Tags Display */}
              {selectedTags.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-700 mb-2">Selected Tags</p>
                  <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    {selectedTags.map((tag) => (
                      <div
                        key={tag}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-lime-400 text-indigo-950 rounded-lg text-sm font-bold"
                      >
                        {tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-red-700 font-black"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Custom Tag */}
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-2">Add More</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customTag}
                    onChange={(e) => setCustomTag(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddCustomTag();
                      }
                    }}
                    placeholder="Type a tag and press Enter..."
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                  <button
                    onClick={handleAddCustomTag}
                    className="px-4 py-2 rounded-lg bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors font-bold text-sm"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-6 border-t border-slate-200">
            <button
              onClick={onSkip}
              className="flex-1 px-4 py-3 rounded-lg border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition-colors"
            >
              Skip for Now
            </button>
            <button
              onClick={() => onApprove(selectedTags)}
              className="flex-1 px-4 py-3 rounded-lg bg-lime-400 text-indigo-950 font-black hover:bg-lime-500 transition-colors flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              Approve & Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
