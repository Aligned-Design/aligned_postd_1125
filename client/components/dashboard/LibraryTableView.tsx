import { Star, Trash2, CheckSquare } from "lucide-react";
import { Asset } from "@/types/library";

interface LibraryTableViewProps {
  assets: Asset[];
  selectedAssets: string[];
  onSelectAsset: (assetId: string, multiSelect?: boolean) => void;
  onToggleFavorite: (assetId: string) => void;
  onDelete: (assetId: string) => void;
}

export function LibraryTableView({
  assets,
  selectedAssets,
  onSelectAsset,
  onToggleFavorite,
  onDelete,
}: LibraryTableViewProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="bg-white/50 backdrop-blur-xl rounded-xl border border-white/60 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-4 py-3 text-left font-black text-slate-900 w-10">
              <div className="flex items-center justify-center">
                <CheckSquare className="w-4 h-4 text-slate-400" />
              </div>
            </th>
            <th className="px-4 py-3 text-left font-black text-slate-900">Name</th>
            <th className="px-4 py-3 text-left font-black text-slate-900">Type</th>
            <th className="px-4 py-3 text-left font-black text-slate-900">Size</th>
            <th className="px-4 py-3 text-left font-black text-slate-900">Category</th>
            <th className="px-4 py-3 text-left font-black text-slate-900">Tags</th>
            <th className="px-4 py-3 text-left font-black text-slate-900">Usage</th>
            <th className="px-4 py-3 text-left font-black text-slate-900">Uploaded</th>
            <th className="px-4 py-3 text-center font-black text-slate-900">Actions</th>
          </tr>
        </thead>
        <tbody>
          {assets.map((asset, idx) => {
            const isSelected = selectedAssets.includes(asset.id);
            return (
              <tr
                key={asset.id}
                className={`border-b border-slate-200 hover:bg-indigo-50 transition-colors ${
                  idx % 2 === 0 ? "bg-white/30" : "bg-slate-50/30"
                }`}
              >
                <td className="px-4 py-3 text-center">
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition-all ${
                      isSelected
                        ? "bg-indigo-600 border-indigo-600"
                        : "border-slate-300 hover:border-indigo-400"
                    }`}
                    onClick={() => onSelectAsset(asset.id, true)}
                  >
                    {isSelected && <CheckSquare className="w-3.5 h-3.5 text-white" />}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => onSelectAsset(asset.id, false)}
                    className="font-semibold text-slate-900 hover:text-indigo-600 truncate max-w-xs"
                  >
                    {asset.filename}
                  </button>
                </td>
                <td className="px-4 py-3 capitalize text-slate-600">{asset.fileType}</td>
                <td className="px-4 py-3 text-slate-600">{formatFileSize(asset.fileSize)}</td>
                <td className="px-4 py-3">
                  <span className="inline-block px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-bold">
                    {asset.category}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  <div className="flex flex-wrap gap-1">
                    {asset.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="text-xs bg-slate-100 text-slate-700 rounded px-1.5 py-0.5">
                        {tag}
                      </span>
                    ))}
                    {asset.tags.length > 2 && (
                      <span className="text-xs bg-slate-100 text-slate-700 rounded px-1.5 py-0.5">
                        +{asset.tags.length - 2}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600 font-semibold">{asset.usageCount}</td>
                <td className="px-4 py-3 text-slate-600">
                  {new Date(asset.uploadedAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => onToggleFavorite(asset.id)}
                      className={`p-1.5 rounded transition-colors ${
                        asset.favorite
                          ? "bg-yellow-100 text-yellow-600"
                          : "text-slate-400 hover:text-slate-600"
                      }`}
                      title="Toggle favorite"
                    >
                      <Star className="w-4 h-4" fill={asset.favorite ? "currentColor" : "none"} />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete "${asset.filename}"?`)) {
                          onDelete(asset.id);
                        }
                      }}
                      className="p-1.5 rounded text-slate-400 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
