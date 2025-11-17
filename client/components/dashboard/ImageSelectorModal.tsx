import { useState } from "react";
import { X, Upload, Search } from "lucide-react";
import { Asset } from "@/types/library";
import { StockImage } from "@/types/stock";
import { StockImageModal } from "./StockImageModal";

interface ImageSelectorModalProps {
  onSelectImage: (imageUrl: string, imageName: string) => void;
  onClose: () => void;
}

// Mock library assets for demo
const MOCK_LIBRARY_ASSETS: Asset[] = [
  {
    id: "asset-1",
    filename: "workspace-meeting.jpg",
    fileType: "image",
    fileSize: 245000,
    width: 1080,
    height: 720,
    thumbnailUrl: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=300&h=200&fit=crop",
    storagePath: "/library/workspace-meeting.jpg",
    tags: ["team", "office", "meeting"],
    category: "Team",
    people: ["Team"],
    colors: ["#3B82F6", "#1F2937"],
    platformFits: ["Reels", "Story"],
    graphicsSize: "social_square",
    orientation: "horizontal",
    aspectRatio: 1.5,
    campaignIds: [],
    eventIds: [],
    usageCount: 2,
    favorite: true,
    source: "upload",
    uploadedAt: new Date().toISOString(),
    uploadedBy: "user",
    brandId: "default",
    aiTagsPending: false,
    archived: false,
  },
  {
    id: "asset-2",
    filename: "product-showcase.jpg",
    fileType: "image",
    fileSize: 320000,
    width: 1080,
    height: 1080,
    thumbnailUrl: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=300&h=300&fit=crop",
    storagePath: "/library/product-showcase.jpg",
    tags: ["product", "technology"],
    category: "Product",
    people: [],
    colors: ["#EC4899", "#8B5CF6"],
    platformFits: ["Square Post", "Story"],
    graphicsSize: "social_square",
    orientation: "square",
    aspectRatio: 1,
    campaignIds: [],
    eventIds: [],
    usageCount: 1,
    favorite: false,
    source: "upload",
    uploadedAt: new Date(Date.now() - 86400000).toISOString(),
    uploadedBy: "user",
    brandId: "default",
    aiTagsPending: false,
    archived: false,
  },
  {
    id: "asset-3",
    filename: "event-celebration.jpg",
    fileType: "image",
    fileSize: 280000,
    width: 1080,
    height: 1920,
    thumbnailUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=300&h=400&fit=crop",
    storagePath: "/library/event-celebration.jpg",
    tags: ["event", "celebration", "party"],
    category: "Event",
    people: ["Team"],
    colors: ["#FBBF24", "#DC2626"],
    platformFits: ["Story", "Portrait"],
    graphicsSize: "story_portrait",
    orientation: "vertical",
    aspectRatio: 0.5625,
    campaignIds: [],
    eventIds: [],
    usageCount: 0,
    favorite: false,
    source: "upload",
    uploadedAt: new Date(Date.now() - 172800000).toISOString(),
    uploadedBy: "user",
    brandId: "default",
    aiTagsPending: false,
    archived: false,
  },
];

export function ImageSelectorModal({ onSelectImage, onClose }: ImageSelectorModalProps) {
  const [activeTab, setActiveTab] = useState<"library" | "upload" | "stock">("library");
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedName, setUploadedName] = useState("");
  const [showStockModal, setShowStockModal] = useState(false);

  // Filter library assets
  const filteredAssets = MOCK_LIBRARY_ASSETS.filter(
    (asset) =>
      asset.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Recent uploads (mocked)
  const recentAssets = MOCK_LIBRARY_ASSETS.slice(0, 3);

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

              {/* Recent Uploads Section */}
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
                        src={asset.thumbnailUrl}
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
                            src={asset.thumbnailUrl}
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
              {!searchQuery && (
                <div>
                  <p className="text-sm font-bold text-slate-600 mb-3">All Assets</p>
                  <div className="grid grid-cols-4 gap-3">
                    {MOCK_LIBRARY_ASSETS.map((asset) => (
                      <button
                        key={asset.id}
                        onClick={() => handleSelectImage(asset.thumbnailUrl, asset.filename)}
                        className="group relative rounded-lg overflow-hidden border-2 border-slate-200 hover:border-lime-400 transition-all"
                      >
                        <img
                          src={asset.thumbnailUrl}
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
