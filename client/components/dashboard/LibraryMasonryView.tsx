import { Star, Trash2, CheckSquare } from "lucide-react";
import { Asset } from "@/types/library";

interface LibraryMasonryViewProps {
  assets: Asset[];
  selectedAssets: string[];
  onSelectAsset: (assetId: string, multiSelect?: boolean) => void;
  onToggleFavorite: (assetId: string) => void;
  onDelete: (assetId: string) => void;
}

export function LibraryMasonryView({
  assets,
  selectedAssets,
  onSelectAsset,
  onToggleFavorite,
  onDelete,
}: LibraryMasonryViewProps) {
  return (
    <div className="columns-2 sm:columns-3 lg:columns-4 gap-4 space-y-4">
      {assets.map((asset) => {
        const isSelected = selectedAssets.includes(asset.id);
        const aspectRatio = asset.height / asset.width;
        
        return (
          <div
            key={asset.id}
            className="group bg-white/50 backdrop-blur-xl rounded-xl overflow-hidden border border-white/60 hover:border-indigo-300 hover:shadow-lg transition-all duration-300 cursor-pointer break-inside-avoid"
          >
            {/* Thumbnail Container */}
            <div
              className="relative bg-slate-100 overflow-hidden"
              style={{ paddingBottom: `${aspectRatio * 100}%` }}
              onClick={() => onSelectAsset(asset.id, false)}
            >
              {/* Selection Checkbox */}
              <div className="absolute top-2 left-2 z-10">
                <div
                  className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                    isSelected
                      ? "bg-indigo-600 border-indigo-600"
                      : "bg-white border-white hover:border-indigo-400"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectAsset(asset.id, true);
                  }}
                >
                  {isSelected && <CheckSquare className="w-3.5 h-3.5 text-white" />}
                </div>
              </div>

              {/* Image/Video Preview */}
              {asset.fileType === "image" ? (
                <img
                  src={asset.thumbnailUrl}
                  alt={asset.filename}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl mb-1">🎬</div>
                    <p className="text-xs text-slate-300">
                      {asset.duration || "?"} sec
                    </p>
                  </div>
                </div>
              )}

              {/* Category Badge */}
              <div className="absolute top-2 right-2 px-2.5 py-1 bg-black/60 text-white rounded-lg text-xs font-bold backdrop-blur-sm">
                {asset.category}
              </div>

              {/* Hover Actions */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(asset.id);
                  }}
                  className={`p-2 rounded-lg transition-colors ${
                    asset.favorite
                      ? "bg-yellow-400 text-white"
                      : "bg-white/20 text-white hover:bg-white/40"
                  }`}
                  title="Toggle favorite"
                >
                  <Star className="w-5 h-5" fill={asset.favorite ? "currentColor" : "none"} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`Delete "${asset.filename}"?`)) {
                      onDelete(asset.id);
                    }
                  }}
                  className="p-2 rounded-lg bg-white/20 text-white hover:bg-red-500 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              {/* Usage Badge */}
              {asset.usageCount > 0 && (
                <div className="absolute bottom-2 left-2 px-2.5 py-1 bg-lime-400 text-indigo-950 rounded-lg text-xs font-bold">
                  Used {asset.usageCount}x
                </div>
              )}
            </div>

            {/* Info Section */}
            <div className="p-3">
              <p className="text-xs font-bold text-slate-900 truncate mb-2">{asset.filename}</p>
              <div className="flex flex-wrap gap-1">
                {asset.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="inline-block px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-semibold"
                  >
                    {tag}
                  </span>
                ))}
                {asset.tags.length > 2 && (
                  <span className="inline-block px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-semibold">
                    +{asset.tags.length - 2}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
