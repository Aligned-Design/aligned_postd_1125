import { useState } from "react";
import { X } from "lucide-react";

interface PlatformSelectorModalProps {
  onConfirm: (selectedPlatforms: string[], createVariants: boolean) => void;
  onClose: () => void;
}

export function PlatformSelectorModal({ onConfirm, onClose }: PlatformSelectorModalProps) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["Instagram", "Facebook"]);
  const [createVariants, setCreateVariants] = useState(true);

  const platforms = [
    { id: "instagram", name: "Instagram", icon: "📷", size: "1080×1080" },
    { id: "facebook", name: "Facebook", icon: "📱", size: "1200×628" },
    { id: "twitter", name: "Twitter/X", icon: "🐦", size: "1200×675" },
    { id: "linkedin", name: "LinkedIn", icon: "💼", size: "1200×628" },
    { id: "tiktok", name: "TikTok", icon: "🎵", size: "1080×1920" },
    { id: "pinterest", name: "Pinterest", icon: "📌", size: "1000×1500" },
  ];

  const handleTogglePlatform = (platformName: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformName)
        ? prev.filter((p) => p !== platformName)
        : [...prev, platformName]
    );
  };

  const handleConfirm = () => {
    if (selectedPlatforms.length > 0) {
      onConfirm(selectedPlatforms, createVariants);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-black text-slate-900">Send to Multiple Platforms</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Description */}
        <p className="text-sm text-slate-500 mb-6">
          Select platforms to publish to. Each platform will automatically receive optimized variants.
        </p>

        {/* Platform Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          {platforms.map((platform) => (
            <button
              key={platform.id}
              onClick={() => handleTogglePlatform(platform.name)}
              className={`p-4 rounded-lg border-2 transition-all text-center ${
                selectedPlatforms.includes(platform.name)
                  ? "border-lime-400 bg-lime-50"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="text-2xl mb-2">{platform.icon}</div>
              <p className="font-bold text-slate-900 text-sm mb-1">{platform.name}</p>
              <p className="text-xs text-slate-500">{platform.size}</p>
            </button>
          ))}
        </div>

        {/* Create Variants Toggle */}
        <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg mb-6 cursor-pointer hover:bg-slate-100 transition-colors">
          <input
            type="checkbox"
            checked={createVariants}
            onChange={(e) => setCreateVariants(e.target.checked)}
            className="w-4 h-4 rounded accent-lime-400"
          />
          <div>
            <p className="font-semibold text-slate-900">Create size-optimized variants</p>
            <p className="text-xs text-slate-500">
              Automatically resize for each platform's optimal dimensions
            </p>
          </div>
        </label>

        {/* Selected Summary */}
        {selectedPlatforms.length > 0 && (
          <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg mb-6">
            <p className="text-xs font-bold text-indigo-700 mb-2">Sending to {selectedPlatforms.length} platform{selectedPlatforms.length > 1 ? "s" : ""}:</p>
            <div className="flex flex-wrap gap-2">
              {selectedPlatforms.map((platform) => (
                <span key={platform} className="px-2 py-1 bg-indigo-200 text-indigo-900 text-xs font-semibold rounded">
                  {platform}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-bold hover:bg-slate-200 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedPlatforms.length === 0}
            className="flex-1 px-4 py-2 bg-lime-400 text-indigo-950 rounded-lg font-bold hover:bg-lime-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send to {selectedPlatforms.length} Platform{selectedPlatforms.length !== 1 ? "s" : ""}
          </button>
        </div>
      </div>
    </div>
  );
}
