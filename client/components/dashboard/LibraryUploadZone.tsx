import { useState, useRef } from "react";
import { Upload, X, AlertCircle } from "lucide-react";
import { Asset, mockDetectAsset } from "@/types/library";

interface LibraryUploadZoneProps {
  onUploadComplete: (assets: Asset[]) => void;
  onCancel: () => void;
}

export function LibraryUploadZone({ onUploadComplete, onCancel }: LibraryUploadZoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFiles = async (files: File[]) => {
    const supportedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "video/mp4", "video/quicktime"];
    const validFiles = files.filter((file) => supportedTypes.includes(file.type));

    if (validFiles.length !== files.length) {
      setErrors((prev) => [...prev, `Some files were skipped (only images and videos supported)`]);
    }

    if (validFiles.length === 0) {
      setErrors((prev) => [...prev, "No valid files to upload"]);
      return;
    }

    setUploading(true);
    setErrors([]);

    const newAssets: Asset[] = [];

    for (const file of validFiles) {
      const fileId = `${file.name}-${Date.now()}`;
      setUploadProgress((prev) => ({ ...prev, [fileId]: 0 }));

      try {
        // Simulate upload progress
        for (let i = 0; i <= 100; i += Math.random() * 40) {
          setUploadProgress((prev) => ({ ...prev, [fileId]: Math.min(i, 100) }));
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
        setUploadProgress((prev) => ({ ...prev, [fileId]: 100 }));

        // Create asset
        const fileType = file.type.startsWith("image") ? "image" : "video";
        const detection = mockDetectAsset(file.name, fileType);

        const asset: Asset = {
          id: `asset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          filename: file.name,
          fileType,
          fileSize: file.size,
          width: 1280,
          height: 720,
          duration: fileType === "video" ? 30 : undefined,
          thumbnailUrl: `https://images.unsplash.com/photo-${Math.random() * 1000000 | 0}?w=300&h=300&fit=crop`,
          storagePath: `/assets/${file.name}`,

          tags: detection.suggestedTags.slice(0, 5),
          category: detection.suggestedCategory,
          people: detection.suggestedPeople,
          colors: detection.suggestedColors,
          platformFits: detection.suggestedPlatformFits,

          campaignIds: [],
          eventIds: [],
          usageCount: 0,
          favorite: false,

          source: "upload",
          uploadedAt: new Date().toISOString(),
          uploadedBy: "user-1",
          brandId: "brand-1",

          aiTagsPending: true,
          description: undefined,
        };

        newAssets.push(asset);
      } catch (error) {
        setErrors((prev) => [...prev, `Failed to upload ${file.name}`]);
      }
    }

    setUploading(false);
    setUploadProgress({});

    if (newAssets.length > 0) {
      onUploadComplete(newAssets);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    processFiles(files);
  };

  const uploadingFiles = Object.keys(uploadProgress);
  const completedCount = Object.values(uploadProgress).filter((p) => p === 100).length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-indigo-50 to-blue-50 p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Upload Media</h2>
            <p className="text-sm text-slate-600 mt-1">
              Drag and drop images or videos, or click to browse
            </p>
          </div>
          <button
            onClick={onCancel}
            disabled={uploading}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <div className="p-8">
          {/* Drop Zone */}
          {!uploading && uploadingFiles.length === 0 && (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
                dragActive
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-slate-300 bg-slate-50 hover:border-slate-400"
              }`}
            >
              <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="font-bold text-slate-900 mb-2">Drag files here or click to browse</h3>
              <p className="text-sm text-slate-600 mb-4">
                Supports images (JPG, PNG, GIF, WebP) and videos (MP4, MOV)
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Choose Files
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleChange}
                className="hidden"
              />
            </div>
          )}

          {/* Upload Progress */}
          {(uploading || uploadingFiles.length > 0) && (
            <div className="space-y-3">
              {uploadingFiles.map((fileId) => {
                const progress = uploadProgress[fileId];
                return (
                  <div key={fileId} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-slate-900 truncate">
                        {fileId.split("-").slice(0, -2).join("-")}
                      </span>
                      <span className="text-sm font-bold text-indigo-600">{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-lime-400 transition-all duration-200"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                );
              })}

              {uploading && (
                <div className="text-center py-4">
                  <div className="inline-flex items-center gap-2 text-slate-600">
                    <div className="animate-spin">⚙️</div>
                    Uploading {uploadingFiles.length} file{uploadingFiles.length !== 1 ? "s" : ""}...
                  </div>
                </div>
              )}

              {!uploading && uploadingFiles.length > 0 && (
                <div className="text-center py-4 text-green-700 font-bold">
                  ✓ {completedCount} file{completedCount !== 1 ? "s" : ""} uploaded successfully
                </div>
              )}
            </div>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <div className="mt-4 space-y-2">
              {errors.map((error, idx) => (
                <div key={idx} className="flex gap-2 items-start p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          {!uploading && (
            <div className="flex gap-3 pt-6 border-t border-slate-200 mt-6">
              <button
                onClick={onCancel}
                disabled={uploading}
                className="flex-1 px-4 py-3 rounded-lg border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              {completedCount > 0 && (
                <button
                  onClick={onCancel}
                  className="flex-1 px-4 py-3 rounded-lg bg-lime-400 text-indigo-950 font-black hover:bg-lime-500 transition-colors"
                >
                  Done
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
