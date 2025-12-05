import { useState, useEffect } from "react";
import { X, Upload, Search, Loader2, FileQuestion, AlertCircle } from "lucide-react";
import { Asset } from "@/types/library";
import { StockImage } from "@/types/stock";
import { StockImageModal } from "./StockImageModal";
import { useCurrentBrand } from "@/hooks/useCurrentBrand";
import { logError } from "@/lib/logger";

interface ImageSelectorModalProps {
  onSelectImage: (imageUrl: string, imageName: string) => void;
  onClose: () => void;
}

// ✅ REMOVED: MOCK_LIBRARY_ASSETS - now fetching real assets from API

export function ImageSelectorModal({ onSelectImage, onClose }: ImageSelectorModalProps) {
  const { brandId } = useCurrentBrand();
  const [activeTab, setActiveTab] = useState<"library" | "upload" | "stock">("library");
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedName, setUploadedName] = useState("");
  const [showStockModal, setShowStockModal] = useState(false);
  
  // ✅ REAL IMPLEMENTATION: Fetch assets from API
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssets = async () => {
      if (!brandId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          brandId,
          limit: "100",
          offset: "0",
        });

        const response = await fetch(`/api/media/list?${params.toString()}`);

        if (!response.ok) {
          throw new Error(`Failed to load assets: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.success && data.assets) {
          // Type for API response asset (matches Supabase media table structure)
          type ApiAsset = {
            id: string;
            filename?: string;
            path?: string;
            mime_type?: string;
            size_bytes?: number;
            width?: number;
            height?: number;
            metadata?: {
              width?: number;
              height?: number;
              thumbnailUrl?: string;
              aiTags?: string[];
              people?: string[];
              colors?: string[];
              platformFits?: string[];
              graphicsSize?: string;
              orientation?: string;
              campaignIds?: string[];
              eventIds?: string[];
              favorite?: boolean;
              source?: string;
              uploadedBy?: string;
              aiTagsPending?: boolean;
              archived?: boolean;
            };
            category?: string;
            usage_count?: number;
            created_at?: string;
            brand_id?: string;
            status?: string;
          };

          const mappedAssets: Asset[] = data.assets.map((asset: ApiAsset) => ({
            id: asset.id,
            filename: asset.filename || asset.path?.split("/").pop() || "unknown",
            fileType: asset.mime_type?.startsWith("video/") ? "video" : "image",
            fileSize: asset.size_bytes || 0,
            width: asset.metadata?.width || 0,
            height: asset.metadata?.height || 0,
            thumbnailUrl: asset.metadata?.thumbnailUrl || asset.path || "",
            storagePath: asset.path || "",
            tags: asset.metadata?.aiTags || [],
            category: asset.category || "images",
            people: asset.metadata?.people || [],
            colors: asset.metadata?.colors || [],
            platformFits: asset.metadata?.platformFits || [],
            graphicsSize: asset.metadata?.graphicsSize || "medium",
            orientation: asset.metadata?.orientation || "landscape",
            aspectRatio: asset.width && asset.height ? asset.width / asset.height : 1,
            campaignIds: asset.metadata?.campaignIds || [],
            eventIds: asset.metadata?.eventIds || [],
            usageCount: asset.usage_count || 0,
            favorite: asset.metadata?.favorite || false,
            source: asset.metadata?.source || "upload",
            uploadedAt: asset.created_at || new Date().toISOString(),
            uploadedBy: asset.metadata?.uploadedBy || "unknown",
            brandId: asset.brand_id || brandId,
            aiTagsPending: asset.metadata?.aiTagsPending || false,
            archived: asset.status === "archived" || asset.metadata?.archived || false,
          }));

          setAssets(mappedAssets);
        } else {
          setAssets([]);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load library assets";
        logError("[ImageSelectorModal] Failed to fetch assets", err instanceof Error ? err : new Error(String(err)), { brandId });
        setError(errorMessage);
        setAssets([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, [brandId]);

  // Filter library assets from real data
  const filteredAssets = assets.filter(
    (asset) =>
      asset.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Recent uploads (sorted by uploadedAt, most recent first)
  const recentAssets = [...assets]
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
    .slice(0, 3);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        setUploadedImage(imageUrl);
        setUploadedName(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectImage = (imageUrl: string, imageName: string) => {
    onSelectImage(imageUrl, imageName);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-white/60 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Select Image</h2>
            <p className="text-sm text-slate-600 mt-1">Choose from library or upload new</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-all"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-4 border-b border-slate-200 bg-slate-50 sticky top-24 z-30">
          <button
            onClick={() => setActiveTab("library")}
            className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm transition-all ${
              activeTab === "library"
                ? "bg-lime-400 text-indigo-950"
                : "bg-white text-slate-700 hover:bg-slate-100"
            }`}
          >
            Library
          </button>
          <button
            onClick={() => setActiveTab("upload")}
            className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm transition-all ${
              activeTab === "upload"
                ? "bg-lime-400 text-indigo-950"
                : "bg-white text-slate-700 hover:bg-slate-100"
            }`}
          >
            Upload New
          </button>
          <button
            onClick={() => setActiveTab("stock")}
            className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm transition-all ${
              activeTab === "stock"
                ? "bg-lime-400 text-indigo-950"
                : "bg-white text-slate-700 hover:bg-slate-100"
            }`}
          >
            🌍 Stock
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 space-y-4">
          {/* Library Tab */}
          {activeTab === "library" && (
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search library..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-0 placeholder:text-slate-400"
                />
              </div>

              {/* Loading State */}
              {loading && (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
                  <p className="text-slate-600 font-medium">Loading library assets...</p>
                </div>
              )}

              {/* Error State */}
              {!loading && error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-6">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-900 mb-1">Failed to load library assets</p>
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!loading && !error && assets.length === 0 && (
                <div className="text-center py-12">
                  <FileQuestion className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-slate-900 mb-2">No images yet</h3>
                  <p className="text-slate-600 mb-4">Upload your first image to get started.</p>
                </div>
              )}

              {/* Recent Uploads Section */}
              {!loading && !error && recentAssets.length > 0 && (
                <div>
                  <p className="text-sm font-bold text-slate-600 mb-3">Recently Uploaded</p>
                  <div className="grid grid-cols-3 gap-4">
                    {recentAssets.map((asset) => (
                      <button
                        key={asset.id}
                        onClick={() => handleSelectImage(asset.thumbnailUrl, asset.filename)}
                        className="group relative rounded-lg overflow-hidden border-2 border-slate-200 hover:border-lime-400 transition-all"
                      >
                        <img
                          src={asset.thumbnailUrl || "data:image/svg+xml,%3Csvg width='300' height='300' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='300' height='300' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='14' fill='%2364748b'%3ENo Image%3C/text%3E%3C/svg%3E"}
                          alt={asset.filename}
                          className="w-full aspect-square object-cover group-hover:scale-110 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-end p-2">
                          <span className="text-xs font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                            {asset.filename}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Search Results */}
              {searchQuery && (
                <div>
                  <p className="text-sm font-bold text-slate-600 mb-3">
                    Search Results ({filteredAssets.length})
                  </p>
                  {filteredAssets.length > 0 ? (
                    <div className="grid grid-cols-4 gap-3">
                      {filteredAssets.map((asset) => (
                        <button
                          key={asset.id}
                          onClick={() => handleSelectImage(asset.thumbnailUrl, asset.filename)}
                          className="group relative rounded-lg overflow-hidden border-2 border-slate-200 hover:border-lime-400 transition-all"
                        >
                          <img
                            src={asset.thumbnailUrl || "data:image/svg+xml,%3Csvg width='300' height='300' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='300' height='300' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='14' fill='%2364748b'%3ENo Image%3C/text%3E%3C/svg%3E"}
                            alt={asset.filename}
                            className="w-full aspect-square object-cover group-hover:scale-110 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      <p>No images found matching "{searchQuery}"</p>
                    </div>
                  )}
                </div>
              )}

              {/* All Library Assets */}
              {!searchQuery && !loading && !error && assets.length > 0 && (
                <div>
                  <p className="text-sm font-bold text-slate-600 mb-3">All Assets</p>
                  <div className="grid grid-cols-4 gap-3">
                    {assets.map((asset) => (
                      <button
                        key={asset.id}
                        onClick={() => handleSelectImage(asset.thumbnailUrl, asset.filename)}
                        className="group relative rounded-lg overflow-hidden border-2 border-slate-200 hover:border-lime-400 transition-all"
                      >
                        <img
                          src={asset.thumbnailUrl || "data:image/svg+xml,%3Csvg width='300' height='300' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='300' height='300' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='14' fill='%2364748b'%3ENo Image%3C/text%3E%3C/svg%3E"}
                          alt={asset.filename}
                          className="w-full aspect-square object-cover group-hover:scale-110 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-end p-2">
                          <span className="text-xs font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity line-clamp-1">
                            {asset.filename}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Upload Tab */}
          {activeTab === "upload" && (
            <div className="space-y-4">
              {!uploadedImage ? (
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-lime-400 transition-colors">
                  <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-700 mb-2">Drag & drop or click to upload</p>
                  <p className="text-xs text-slate-500 mb-4">PNG, JPG, GIF up to 10MB</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="inline-block px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200 transition-all cursor-pointer"
                  >
                    Choose Image
                  </label>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="border-2 border-slate-200 rounded-lg overflow-hidden">
                    <img
                      src={uploadedImage}
                      alt="Preview"
                      className="w-full max-h-64 object-contain"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Filename</label>
                    <input
                      type="text"
                      value={uploadedName}
                      onChange={(e) => setUploadedName(e.target.value)}
                      className="w-full px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-0 placeholder:text-slate-400"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setUploadedImage(null);
                        setUploadedName("");
                      }}
                      className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200 transition-all"
                    >
                      Choose Different
                    </button>
                    <button
                      onClick={() => handleSelectImage(uploadedImage, uploadedName || "uploaded-image")}
                      className="flex-1 px-4 py-2 bg-lime-400 text-indigo-950 font-bold rounded-lg hover:shadow-lg hover:shadow-lime-200 transition-all"
                    >
                      Use Image
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Stock Tab */}
          {activeTab === "stock" && (
            <div className="text-center py-8">
              <button
                onClick={() => setShowStockModal(true)}
                className="px-6 py-3 bg-lime-400 text-indigo-950 font-black rounded-lg hover:bg-lime-500 transition-colors"
              >
                🔍 Browse Stock Images
              </button>
              <p className="text-sm text-slate-600 mt-4">
                Search and add free stock images from Unsplash, Pexels, and Pixabay
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white/80 backdrop-blur-xl border-t border-white/60 p-6 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-all"
          >
            Close
          </button>
        </div>
      </div>

      {/* Stock Image Modal */}
      {showStockModal && (
        <StockImageModal
          isOpen={showStockModal}
          onClose={() => setShowStockModal(false)}
          onSelectImage={(image, action) => {
            if (action === "use-in-post") {
              handleSelectImage(image.fullImageUrl, image.title);
            }
          }}
        />
      )}
    </div>
  );
}
