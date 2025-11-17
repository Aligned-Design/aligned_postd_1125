import { useState, useEffect } from "react";
import { X, Search, ChevronDown, Loader } from "lucide-react";
import { StockImage, StockProvider, StockSearchParams } from "@/types/stock";
import {
  searchStockImages,
  getProviderBadgeColor,
  getLicenseBadgeColor,
} from "@/lib/stockImageApi";
import { useToast } from "@/hooks/use-toast";

interface StockImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (image: StockImage, action: "add-to-library" | "use-in-post") => void;
  initialQuery?: string;
}

export function StockImageModal({
  isOpen,
  onClose,
  onSelectImage,
  initialQuery = "",
}: StockImageModalProps) {
  const { toast } = useToast();
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<StockImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [selectedProviders, setSelectedProviders] = useState<StockProvider[]>([
    "pexels", // Pexels and Pixabay are now implemented
  ]);
  const [orientation, setOrientation] = useState<
    "landscape" | "portrait" | "square" | ""
  >("");

  useEffect(() => {
    if (!isOpen) return;

    const performSearch = async () => {
      setLoading(true);
      try {
        const searchParams: StockSearchParams = {
          query: query || "nature",
          page,
          perPage: 12,
          orientation: orientation as any,
          providers: selectedProviders,
        };

        const result = await searchStockImages(searchParams);
        setResults(result.images);
        setHasMore(result.hasMore);
      } catch (error) {
        console.error("Search error:", error);
        toast({
          title: "Search failed",
          description: "Unable to search stock images",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [isOpen, query, page, selectedProviders, orientation, toast]);

  const toggleProvider = (provider: StockProvider) => {
    setSelectedProviders((prev) =>
      prev.includes(provider) ? prev.filter((p) => p !== provider) : [...prev, provider]
    );
    setPage(1);
  };

  const handleSelectImage = (image: StockImage, action: "add-to-library" | "use-in-post") => {
    onSelectImage(image, action);
    toast({
      title: action === "add-to-library" ? "Added to Library" : "Image Selected",
      description: `"${image.title}" from ${image.provider}`,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full mx-4 my-8 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Browse Stock Images</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          {/* Filters */}
          <div className="sticky top-0 bg-slate-50 border-b border-slate-200 p-6 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search stock images..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-0 placeholder:text-slate-400"
              />
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap gap-3">
              {/* Provider Filter */}
              <div className="flex gap-2">
                {(["pexels", "pixabay"] as const).map((provider) => (
                  <button
                    key={provider}
                    onClick={() => toggleProvider(provider)}
                    className={`px-3 py-1.5 rounded-full font-semibold text-sm transition-all ${
                      selectedProviders.includes(provider)
                        ? "bg-lime-500 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {provider.charAt(0).toUpperCase() + provider.slice(1)}
                  </button>
                ))}
                <span className="px-3 py-1.5 text-xs text-slate-500 self-center">
                  (Unsplash coming soon)
                </span>
              </div>

              {/* Orientation Filter */}
              <select
                value={orientation}
                onChange={(e) => {
                  setOrientation(e.target.value as any);
                  setPage(1);
                }}
                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-0"
              >
                <option value="">All Orientations</option>
                <option value="landscape">Landscape</option>
                <option value="portrait">Portrait</option>
                <option value="square">Square</option>
              </select>
            </div>
          </div>

          {/* Results Grid */}
          <div className="flex-1 p-6">
            {loading && results.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-4">
                  <Loader className="w-8 h-8 text-indigo-600 animate-spin" />
                  <p className="text-slate-600">Searching...</p>
                </div>
              </div>
            ) : results.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-slate-600">No images found. Try a different search.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {results.map((image) => (
                    <div
                      key={`${image.provider}-${image.id}`}
                      className="group bg-white border border-slate-200 rounded-lg overflow-hidden hover:border-indigo-400 hover:shadow-lg transition-all"
                    >
                      {/* Image Preview */}
                      <div className="relative bg-slate-100 overflow-hidden h-48">
                        <img
                          src={image.previewUrl}
                          alt={image.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />

                        {/* Provider Badge */}
                        <div
                          className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-bold ${getProviderBadgeColor(
                            image.provider
                          )}`}
                        >
                          {image.provider.toUpperCase()}
                        </div>
                      </div>

                      {/* Info */}
                      <div className="p-3 space-y-2">
                        {/* Title */}
                        <h3 className="font-bold text-sm text-slate-900 line-clamp-2">
                          {image.title}
                        </h3>

                        {/* Creator */}
                        <p className="text-xs text-slate-600">by {image.creatorName}</p>

                        {/* License Badge */}
                        <div className="flex gap-1">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-semibold ${getLicenseBadgeColor(
                              image.licensType
                            )}`}
                          >
                            {image.licensType === "free" ? "Free" : "Premium"}
                          </span>
                          {image.attributionRequired && (
                            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800">
                              Attribution
                            </span>
                          )}
                        </div>

                        {/* Dimensions */}
                        <p className="text-xs text-slate-500">
                          {image.width} × {image.height}px
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="border-t border-slate-200 grid grid-cols-2 bg-slate-50">
                        <button
                          onClick={() => handleSelectImage(image, "add-to-library")}
                          className="px-2 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 border-r border-slate-200 transition-colors"
                        >
                          📚 Add
                        </button>
                        <button
                          onClick={() => handleSelectImage(image, "use-in-post")}
                          className="px-2 py-2 text-xs font-bold text-lime-600 hover:bg-lime-50 transition-colors"
                        >
                          ✓ Use
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Load More */}
                {hasMore && (
                  <div className="mt-6 text-center">
                    <button
                      onClick={() => setPage((p) => p + 1)}
                      disabled={loading}
                      className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                      {loading ? "Loading..." : "Load More"}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
