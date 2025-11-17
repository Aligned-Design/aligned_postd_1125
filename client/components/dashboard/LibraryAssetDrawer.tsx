import { useState } from "react";
import { X, Star, Trash2, Copy, Link as LinkIcon } from "lucide-react";
import { Asset } from "@/types/library";

interface LibraryAssetDrawerProps {
  asset: Asset;
  onClose: () => void;
  onUpdateTags: (assetId: string, newTags: string[]) => void;
  onToggleFavorite: (assetId: string) => void;
  onDelete: (assetId: string) => void;
}

export function LibraryAssetDrawer({
  asset,
  onClose,
  onUpdateTags,
  onToggleFavorite,
  onDelete,
}: LibraryAssetDrawerProps) {
  const [activeTab, setActiveTab] = useState<"details" | "usage">("details");
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [editedTags, setEditedTags] = useState(asset.tags);
  const [newTagInput, setNewTagInput] = useState("");

  const handleAddTag = () => {
    if (newTagInput.trim() && !editedTags.includes(newTagInput.trim())) {
      setEditedTags([...editedTags, newTagInput.trim()]);
      setNewTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setEditedTags(editedTags.filter((t) => t !== tag));
  };

  const handleSaveTags = () => {
    onUpdateTags(asset.id, editedTags);
    setIsEditingTags(false);
  };

  const handleDelete = () => {
    if (window.confirm(`Delete "${asset.filename}"?`)) {
      onDelete(asset.id);
      onClose();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end z-50">
      <div className="w-full sm:w-96 h-[90vh] bg-white rounded-t-2xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-indigo-50 to-blue-50 p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-bold text-slate-900">Asset Details</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Preview */}
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <div className="aspect-video bg-slate-200 rounded-lg overflow-hidden mb-3">
              {asset.fileType === "image" ? (
                <img
                  src={asset.thumbnailUrl}
                  alt={asset.filename}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-300">
                  <div className="text-center">
                    <div className="text-3xl mb-2">🎬</div>
                    <p className="text-xs text-slate-600">Video ({asset.duration}s)</p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onToggleFavorite(asset.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-bold transition-colors ${
                  asset.favorite
                    ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                    : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                }`}
              >
                <Star className="w-4 h-4" />
                {asset.favorite ? "Favorited" : "Add to Favorites"}
              </button>
              <button
                onClick={handleDelete}
                className="px-3 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors font-bold"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-200 sticky top-0 bg-white">
            <button
              onClick={() => setActiveTab("details")}
              className={`flex-1 py-3 px-4 font-bold text-sm transition-colors border-b-2 ${
                activeTab === "details"
                  ? "text-indigo-600 border-indigo-600"
                  : "text-slate-600 border-transparent hover:text-slate-900"
              }`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab("usage")}
              className={`flex-1 py-3 px-4 font-bold text-sm transition-colors border-b-2 ${
                activeTab === "usage"
                  ? "text-indigo-600 border-indigo-600"
                  : "text-slate-600 border-transparent hover:text-slate-900"
              }`}
            >
              Usage ({asset.usageCount})
            </button>
          </div>

          {/* Details Tab */}
          {activeTab === "details" && (
            <div className="p-4 space-y-4">
              {/* Filename */}
              <div>
                <label className="block text-xs font-black text-slate-900 mb-1">Filename</label>
                <p className="text-sm text-slate-600 break-normal break-words font-mono">{asset.filename}</p>
              </div>

              {/* File Info */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-900 mb-1">File Size</label>
                  <p className="text-sm text-slate-600">{formatFileSize(asset.fileSize)}</p>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-900 mb-1">Type</label>
                  <p className="text-sm text-slate-600 capitalize">{asset.fileType}</p>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-900 mb-1">Dimensions</label>
                  <p className="text-sm text-slate-600">
                    {asset.width} × {asset.height}px
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-900 mb-1">Uploaded</label>
                  <p className="text-sm text-slate-600">{new Date(asset.uploadedAt).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-black text-slate-900 mb-2">Category</label>
                <div className="inline-block px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-bold">
                  {asset.category}
                </div>
              </div>

              {/* Tags */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-black text-slate-900">Tags</label>
                  {!isEditingTags && (
                    <button
                      onClick={() => setIsEditingTags(true)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                    >
                      Edit
                    </button>
                  )}
                </div>

                {isEditingTags ? (
                  <div className="space-y-2">
                    <div className="flex gap-2 flex-wrap">
                      {editedTags.map((tag) => (
                        <div
                          key={tag}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                        >
                          {tag}
                          <button
                            onClick={() => handleRemoveTag(tag)}
                            className="hover:text-red-600"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newTagInput}
                        onChange={(e) => setNewTagInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                        placeholder="Add tag..."
                        className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                      />
                      <button
                        onClick={handleAddTag}
                        className="px-3 py-1.5 rounded-lg bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors font-bold text-xs"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex gap-2 pt-2 border-t border-slate-200">
                      <button
                        onClick={handleSaveTags}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-lime-400 text-indigo-950 hover:bg-lime-500 transition-colors font-bold text-xs"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingTags(false);
                          setEditedTags(asset.tags);
                        }}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors font-bold text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {asset.tags.length > 0 ? (
                      asset.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-block px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold"
                        >
                          {tag}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500 italic">No tags yet</p>
                    )}
                  </div>
                )}
              </div>

              {/* People */}
              {asset.people.length > 0 && (
                <div>
                  <label className="block text-xs font-black text-slate-900 mb-2">People</label>
                  <div className="flex flex-wrap gap-2">
                    {asset.people.map((person) => (
                      <span
                        key={person}
                        className="inline-block px-2.5 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold"
                      >
                        {person}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Platform Fit */}
              {asset.platformFits.length > 0 && (
                <div>
                  <label className="block text-xs font-black text-slate-900 mb-2">Best For</label>
                  <div className="flex flex-wrap gap-2">
                    {asset.platformFits.map((fit) => (
                      <span
                        key={fit}
                        className="inline-block px-2.5 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-semibold"
                      >
                        {fit}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Usage Tab */}
          {activeTab === "usage" && (
            <div className="p-4">
              <div className="text-center py-8">
                <div className="text-3xl mb-2">📊</div>
                <p className="text-sm text-slate-600 mb-4">
                  This asset has been used in <span className="font-black text-slate-900">{asset.usageCount}</span> posts
                  and campaigns.
                </p>
                <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors font-bold text-sm">
                  <LinkIcon className="w-4 h-4" />
                  Add to Campaign
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
