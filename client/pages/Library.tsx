import { useState, useMemo } from "react";
import {
  Upload,
  Grid3X3,
  LayoutGrid,
  Table2,
  Search,
  X,
  Star,
  ZapOff,
  AlertCircle,
  FileQuestion,
  Filter,
} from "lucide-react";
import { Asset, LibraryFilter, LibraryViewPreferences, generateMockAssets, AssetFileType } from "@/types/library";
import { StockImage } from "@/types/stock";
import { LibraryUploadZone } from "@/components/dashboard/LibraryUploadZone";
import { LibraryAssetDrawer } from "@/components/dashboard/LibraryAssetDrawer";
import { LibraryGridView } from "@/components/dashboard/LibraryGridView";
import { LibraryTableView } from "@/components/dashboard/LibraryTableView";
import { LibraryMasonryView } from "@/components/dashboard/LibraryMasonryView";
import { LibraryFilterRow } from "@/components/dashboard/LibraryFilterRow";
import { SmartTagPreview } from "@/components/dashboard/SmartTagPreview";
import { StockImageModal } from "@/components/dashboard/StockImageModal";
import { FirstVisitTooltip } from "@/components/dashboard/FirstVisitTooltip";
import { AppShell } from "@postd/layout/AppShell";
import { useToast } from "@/hooks/use-toast";
import { useWorkspace } from "@/contexts/WorkspaceContext";

export default function Library() {
  const { toast } = useToast();
  const { currentWorkspace } = useWorkspace();

  // Data state
  const [assets, setAssets] = useState<Asset[]>(generateMockAssets(16));
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);

  // UI state
  const [viewMode, setViewMode] = useState<"grid" | "table" | "masonry">("grid");
  const [showUploadZone, setShowUploadZone] = useState(false);
  const [showAssetDrawer, setShowAssetDrawer] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [showTagPreview, setShowTagPreview] = useState(false);
  const [pendingTagsAssetId, setPendingTagsAssetId] = useState<string | null>(null);
  const [showBulkTagEditor, setShowBulkTagEditor] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [activeTab, setActiveTab] = useState<"uploads" | "stock">("uploads");
  const [showStockModal, setShowStockModal] = useState(false);

  // Filter state
  const [filters, setFilters] = useState<LibraryFilter>({
    datePreset: undefined,
    dateRange: undefined,
    tags: [],
    fileTypes: [],
    people: [],
    graphicsSizes: [],
    campaignIds: [],
    eventIds: [],
    searchQuery: "",
  });

  // View preferences state
  const [viewPrefs, setViewPrefs] = useState<LibraryViewPreferences>({
    viewMode: "grid",
    itemsPerPage: 20,
    sortBy: "date",
    sortOrder: "desc",
  });

  // Helper: Calculate date range from preset
  const getDateRangeFromPreset = (preset: string) => {
    const now = new Date();
    const from = new Date();

    switch (preset) {
      case "7days":
        from.setDate(now.getDate() - 7);
        break;
      case "30days":
        from.setDate(now.getDate() - 30);
        break;
      case "90days":
        from.setDate(now.getDate() - 90);
        break;
      case "6months":
        from.setMonth(now.getMonth() - 6);
        break;
      case "12months":
        from.setFullYear(now.getFullYear() - 1);
        break;
      case "alltime":
        return { from: new Date(0), to: now };
      default:
        return null;
    }

    return { from, to: now };
  };

  // Filter & search logic
  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      // Archive filter: Hide archived by default, unless showArchived is true
      if (!showArchived && asset.archived) return false;

      // Date filter
      let dateRange = filters.dateRange;
      if (filters.datePreset && !dateRange) {
        const calculated = getDateRangeFromPreset(filters.datePreset);
        if (calculated) {
          dateRange = {
            from: calculated.from.toISOString().split("T")[0],
            to: calculated.to.toISOString().split("T")[0],
          };
        }
      }

      if (dateRange) {
        const assetDate = new Date(asset.uploadedAt);
        const fromDate = new Date(dateRange.from);
        const toDate = new Date(dateRange.to);
        if (assetDate < fromDate || assetDate > toDate) return false;
      }

      // Search query
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesSearch =
          asset.filename.toLowerCase().includes(query) ||
          asset.tags.some((t) => t.toLowerCase().includes(query)) ||
          asset.people.some((p) => p.toLowerCase().includes(query)) ||
          asset.category.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // File type filter
      if (filters.fileTypes.length > 0 && !filters.fileTypes.includes(asset.fileType)) {
        return false;
      }

      // Tag filter
      if (filters.tags.length > 0) {
        const hasTag = filters.tags.some((tag) => asset.tags.includes(tag));
        if (!hasTag) return false;
      }

      // People filter
      if (filters.people.length > 0) {
        const hasPerson = filters.people.some((person) => asset.people.includes(person));
        if (!hasPerson) return false;
      }

      // Campaign filter
      if (filters.campaignIds.length > 0) {
        const hasCampaign = filters.campaignIds.some((cId) => asset.campaignIds.includes(cId));
        if (!hasCampaign) return false;
      }

      // Event filter
      if (filters.eventIds.length > 0) {
        const hasEvent = filters.eventIds.some((eId) => asset.eventIds.includes(eId));
        if (!hasEvent) return false;
      }

      // Graphics size filter
      if (filters.graphicsSizes.length > 0) {
        if (!filters.graphicsSizes.includes(asset.graphicsSize)) return false;
      }

      // Date range
      if (filters.dateRange) {
        const uploadDate = new Date(asset.uploadedAt);
        const fromDate = new Date(filters.dateRange.from);
        const toDate = new Date(filters.dateRange.to);
        if (uploadDate < fromDate || uploadDate > toDate) return false;
      }

      return true;
    });
  }, [assets, filters]);

  // Sort logic
  const sortedAssets = useMemo(() => {
    const sorted = [...filteredAssets];
    if (viewPrefs.sortBy === "date") {
      sorted.sort((a, b) => {
        const aDate = new Date(a.uploadedAt).getTime();
        const bDate = new Date(b.uploadedAt).getTime();
        return viewPrefs.sortOrder === "asc" ? aDate - bDate : bDate - aDate;
      });
    } else if (viewPrefs.sortBy === "name") {
      sorted.sort((a, b) => {
        const cmp = a.filename.localeCompare(b.filename);
        return viewPrefs.sortOrder === "asc" ? cmp : -cmp;
      });
    } else if (viewPrefs.sortBy === "usage") {
      sorted.sort((a, b) => {
        const cmp = a.usageCount - b.usageCount;
        return viewPrefs.sortOrder === "asc" ? cmp : -cmp;
      });
    } else if (viewPrefs.sortBy === "favorite") {
      sorted.sort((a, b) => {
        if (a.favorite === b.favorite) return 0;
        return viewPrefs.sortOrder === "asc" ? (a.favorite ? 1 : -1) : a.favorite ? -1 : 1;
      });
    }
    return sorted;
  }, [filteredAssets, viewPrefs]);

  // Handlers
  const handleUploadComplete = (newAssets: Asset[]) => {
    setAssets((prev) => [...newAssets, ...prev]);
    setShowUploadZone(false);
    if (newAssets.length > 0) {
      setPendingTagsAssetId(newAssets[0].id);
      setShowTagPreview(true);
    }
  };

  const handleSelectAsset = (assetId: string, multiSelect: boolean = false) => {
    if (multiSelect) {
      setSelectedAssets((prev) =>
        prev.includes(assetId) ? prev.filter((id) => id !== assetId) : [...prev, assetId]
      );
    } else {
      setSelectedAssetId(assetId);
      setShowAssetDrawer(true);
    }
  };

  const handleToggleFavorite = (assetId: string) => {
    setAssets((prev) => prev.map((a) => (a.id === assetId ? { ...a, favorite: !a.favorite } : a)));
  };

  const handleArchiveAsset = (assetId: string) => {
    setAssets((prev) =>
      prev.map((a) =>
        a.id === assetId
          ? {
              ...a,
              archived: true,
              archivedAt: new Date().toISOString(),
              archivedBy: "user-1",
            }
          : a
      )
    );
  };

  const handlePermanentlyDeleteAsset = (assetId: string) => {
    // Only for admins - permanently remove from system
    setAssets((prev) => prev.filter((a) => a.id !== assetId));
  };

  const handleUpdateTags = (assetId: string, newTags: string[]) => {
    setAssets((prev) => prev.map((a) => (a.id === assetId ? { ...a, tags: newTags } : a)));
  };

  const handleBulkFavorite = () => {
    setAssets((prev) =>
      prev.map((a) => (selectedAssets.includes(a.id) ? { ...a, favorite: true } : a))
    );
    setSelectedAssets([]);
  };

  const handleBulkClearFavorite = () => {
    setAssets((prev) =>
      prev.map((a) => (selectedAssets.includes(a.id) ? { ...a, favorite: false } : a))
    );
    setSelectedAssets([]);
  };

  const handleBulkArchive = () => {
    setAssets((prev) =>
      prev.map((a) =>
        selectedAssets.includes(a.id)
          ? {
              ...a,
              archived: true,
              archivedAt: new Date().toISOString(),
              archivedBy: "user-1",
            }
          : a
      )
    );
    setSelectedAssets([]);
  };

  const selectedAssetData = assets.find((a) => a.id === selectedAssetId);
  const allTags = Array.from(new Set(assets.flatMap((a) => a.tags))).sort();
  const allPeople = Array.from(new Set(assets.flatMap((a) => a.people))).sort();
  const allGraphicsSizes = Array.from(new Set(assets.map((a) => a.graphicsSize))) as any[];

  return (
    <AppShell>
      <FirstVisitTooltip page="library">
        <div className="min-h-screen bg-gradient-to-br from-indigo-50/30 via-white to-blue-50/20">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-white/60">
          <div className="p-4 sm:p-6 md:p-8">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-black text-slate-900">Library</h1>
                <p className="text-sm text-slate-600 mt-1">
                  {currentWorkspace?.logo} {currentWorkspace?.name} — Organize, search, and reuse your creative assets
                </p>
              </div>
              <button
                onClick={() => setShowUploadZone(true)}
                className="flex items-center gap-2 px-4 py-3 rounded-lg bg-lime-400 text-indigo-950 font-black hover:bg-lime-500 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Upload Media
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setActiveTab("uploads")}
                className={`px-4 py-2 rounded-lg font-bold transition-colors ${
                  activeTab === "uploads"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                📤 Uploads
              </button>
              <button
                onClick={() => setActiveTab("stock")}
                className={`px-4 py-2 rounded-lg font-bold transition-colors ${
                  activeTab === "stock"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                🌍 Stock
              </button>
            </div>

            {/* Search Bar */}
            {activeTab === "uploads" && (
              <div className="flex-1 relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, tag, person, or category..."
                  value={filters.searchQuery}
                  onChange={(e) => setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
            )}

            {/* Horizontal Filter Bar & View Toggle */}
            {activeTab === "uploads" && (
            <div className="flex items-center justify-between gap-4">
              <LibraryFilterRow
                filters={filters}
                onFiltersChange={setFilters}
                availableTags={allTags}
                availablePeople={allPeople}
                availableGraphicsSizes={allGraphicsSizes}
                assetCount={sortedAssets.length}
                totalAssetCount={assets.length}
              />

              {/* View Mode Toggles */}
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => {
                    setViewMode("grid");
                    setViewPrefs((prev) => ({ ...prev, viewMode: "grid" }));
                  }}
                  className={`p-2.5 rounded-lg transition-all ${
                    viewMode === "grid"
                      ? "bg-indigo-100 text-indigo-700"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                  title="Grid View"
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setViewMode("masonry");
                    setViewPrefs((prev) => ({ ...prev, viewMode: "masonry" }));
                  }}
                  className={`p-2.5 rounded-lg transition-all ${
                    viewMode === "masonry"
                      ? "bg-indigo-100 text-indigo-700"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                  title="Masonry View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setViewMode("table");
                    setViewPrefs((prev) => ({ ...prev, viewMode: "table" }));
                  }}
                  className={`p-2.5 rounded-lg transition-all ${
                    viewMode === "table"
                      ? "bg-indigo-100 text-indigo-700"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                  title="Table View"
                >
                  <Table2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="p-4 sm:p-6 md:p-8">
          {activeTab === "uploads" && (
            <>
              {/* Bulk Actions Bar */}
              {selectedAssets.length > 0 && (
                <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center justify-between">
                  <span className="font-bold text-indigo-900">{selectedAssets.length} selected</span>
                  <div className="flex gap-2">
                    <button
                      onClick={handleBulkFavorite}
                      className="px-3 py-1.5 rounded-lg bg-yellow-100 text-yellow-700 hover:bg-yellow-200 transition-colors font-semibold text-sm flex items-center gap-1"
                    >
                      <Star className="w-3 h-3" />
                      Favorite
                    </button>
                    <button
                      onClick={handleBulkClearFavorite}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors font-semibold text-sm flex items-center gap-1"
                    >
                      <ZapOff className="w-3 h-3" />
                      Unfavorite
                    </button>
                    <button
                      onClick={() => setShowBulkTagEditor(true)}
                      className="px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors font-semibold text-sm"
                    >
                      Edit Tags
                    </button>
                    <button
                      onClick={handleBulkArchive}
                      className="px-3 py-1.5 rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors font-semibold text-sm"
                    >
                      Archive
                    </button>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {sortedAssets.length === 0 && assets.length === 0 && (
                <div className="text-center py-16">
                  <FileQuestion className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-slate-900 mb-1">No assets yet</h3>
                  <p className="text-sm text-slate-600 mb-6">Upload your first image or video to get started</p>
                  <button
                    onClick={() => setShowUploadZone(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-lime-400 text-indigo-950 font-black hover:bg-lime-500 transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    Upload Media
                  </button>
                </div>
              )}

              {/* No Results */}
              {sortedAssets.length === 0 && assets.length > 0 && (
                <div className="text-center py-16">
                  <AlertCircle className="w-16 h-16 text-amber-300 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-slate-900 mb-1">No assets match your filters</h3>
                  <p className="text-sm text-slate-600 mb-6">Try adjusting your search or filters</p>
                  <button
                    onClick={() =>
                      setFilters({
                        dateRange: undefined,
                        tags: [],
                        fileTypes: [],
                        people: [],
                        campaignIds: [],
                        eventIds: [],
                        searchQuery: "",
                      })
                    }
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-200 text-slate-700 font-bold hover:bg-slate-300 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Clear Filters
                  </button>
                </div>
              )}

              {/* View Renderer */}
              {sortedAssets.length > 0 && (
                <>
                  {viewMode === "grid" && (
                    <LibraryGridView
                    assets={sortedAssets}
                    selectedAssets={selectedAssets}
                    onSelectAsset={handleSelectAsset}
                    onToggleFavorite={handleToggleFavorite}
                    onDelete={handleArchiveAsset}
                  />
                  )}
                  {viewMode === "masonry" && (
                    <LibraryMasonryView
                    assets={sortedAssets}
                    selectedAssets={selectedAssets}
                    onSelectAsset={handleSelectAsset}
                    onToggleFavorite={handleToggleFavorite}
                    onDelete={handleArchiveAsset}
                  />
                  )}
                  {viewMode === "table" && (
                    <LibraryTableView
                    assets={sortedAssets}
                    selectedAssets={selectedAssets}
                    onSelectAsset={handleSelectAsset}
                    onToggleFavorite={handleToggleFavorite}
                    onDelete={handleArchiveAsset}
                  />
                  )}
                </>
              )}
            </>
          )}

          {activeTab === "stock" && (
            <div>
              <button
                onClick={() => setShowStockModal(true)}
                className="mb-6 flex items-center gap-2 px-6 py-3 bg-lime-400 text-indigo-950 font-black rounded-lg hover:bg-lime-500 transition-colors"
              >
                🔍 Browse Stock Images
              </button>
              <p className="text-slate-600 text-sm">
                Search and add stock images from Unsplash, Pexels, and Pixabay to your library. All images come with proper attribution metadata.
              </p>
            </div>
          )}
        </div>

        {/* Upload Zone Modal */}
        {showUploadZone && (
          <LibraryUploadZone
            onUploadComplete={handleUploadComplete}
            onCancel={() => setShowUploadZone(false)}
          />
        )}

        {/* Asset Drawer */}
        {showAssetDrawer && selectedAssetData && (
          <LibraryAssetDrawer
            asset={selectedAssetData}
            onClose={() => {
              setShowAssetDrawer(false);
              setSelectedAssetId(null);
            }}
            onUpdateTags={handleUpdateTags}
            onToggleFavorite={handleToggleFavorite}
            onDelete={handleArchiveAsset}
          />
        )}

        {/* Stock Image Modal */}
        {showStockModal && (
          <StockImageModal
            isOpen={showStockModal}
            onClose={() => setShowStockModal(false)}
            onSelectImage={(image, action) => {
              if (action === "add-to-library") {
                const newAsset: Asset = {
                  id: `stock-${image.provider}-${image.id}`,
                  filename: image.title,
                  fileType: "image",
                  fileSize: 0,
                  width: image.width || 0,
                  height: image.height || 0,
                  duration: undefined,
                  thumbnailUrl: image.previewUrl || image.fullImageUrl,
                  storagePath: `/assets/stock-${image.provider}-${image.id}`,

                  tags: ["stock", image.provider, ...(image.tags || [])],
                  category: image.category || "stock",
                  people: [],
                  colors: image.colors || [],
                  platformFits: [],

                  campaignIds: [],
                  eventIds: [],
                  usageCount: 0,
                  favorite: false,

                  source: "stock",
                  uploadedAt: new Date().toISOString(),
                  uploadedBy: "system",
                  brandId: "brand-1",

                  aiTagsPending: false,

                  archived: false,
                };
                setAssets((prev) => [newAsset, ...prev]);
                setShowStockModal(false);
                toast({
                  title: "Added to Library",
                  description: `"${image.title}" from ${image.provider}`,
                });
              }
            }}
          />
        )}

        {/* Smart Tag Preview Modal */}
        {showTagPreview && pendingTagsAssetId && (
          <SmartTagPreview
            assetId={pendingTagsAssetId}
            onApprove={(tags) => {
              handleUpdateTags(pendingTagsAssetId, tags);
              setShowTagPreview(false);
              setPendingTagsAssetId(null);
            }}
            onSkip={() => {
              setShowTagPreview(false);
              setPendingTagsAssetId(null);
            }}
          />
        )}
      </div>
      </FirstVisitTooltip>
    </AppShell>
  );
}
