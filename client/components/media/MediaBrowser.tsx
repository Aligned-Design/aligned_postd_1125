import React, { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Search, Grid, List } from "lucide-react";
import { cn } from "@/lib/design-system";
import { MediaAsset, MediaListRequest, MediaListResponse } from "@shared/media";

interface MediaBrowserProps {
  brandId: string;
  onSelectAsset?: (asset: MediaAsset) => void;
  selectedAssets?: string[];
  multiSelect?: boolean;
  _multiSelect?: boolean;
  className?: string;
}

export function MediaBrowser({
  brandId,
  onSelectAsset,
  selectedAssets = [],
  _multiSelect = false,
  className,
}: MediaBrowserProps) {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [hasMore, setHasMore] = useState(true);

  const loadAssets = useCallback(
    async (reset = false) => {
      setLoading(true);
      try {
        const params: MediaListRequest = {
          brandId,
          search: search || undefined,
          tags: selectedTags.length > 0 ? selectedTags : undefined,
          limit: 20,
          offset: reset ? 0 : assets.length,
        };

        const queryString = new URLSearchParams(
          Object.entries(params).filter(([__, value]) => value !== undefined),
        ).toString();

        const response = await fetch(`/api/media/list?${queryString}`);
        const data: MediaListResponse = await response.json();

        if (reset) {
          setAssets(data.assets);
        } else {
          setAssets((prev) => [...prev, ...data.assets]);
        }

        setHasMore(data.hasMore);
      } catch (error) {
        console.error("Failed to load assets:", error);
      } finally {
        setLoading(false);
      }
    },
    [brandId, search, selectedTags, assets.length],
  );

  useEffect(() => {
    loadAssets(true);
  }, [brandId, search, selectedTags]);

  const handleAssetClick = (asset: MediaAsset) => {
    onSelectAsset?.(asset);
  };

  const getAssetUrl = async (asset: MediaAsset): Promise<string> => {
    const response = await fetch(
      `/api/media/url/${asset.id}`,
    );
    const data = await response.json();
    return data.url;
  };

  const [assetUrls, setAssetUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    // Load asset URLs for display
    assets.forEach(async (asset) => {
      if (!assetUrls[asset.id]) {
        try {
          const url = await getAssetUrl(asset);
          setAssetUrls((prev) => ({ ...prev, [asset.id]: url }));
        } catch (error) {
          console.error("Failed to get asset URL:", error);
        }
      }
    });
  }, [assets]);

  const allTags = [...new Set(assets.flatMap((asset) => asset.tags))];

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search assets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("grid")}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tag Filters */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {allTags.map((tag) => (
            <Badge
              key={tag}
              variant={selectedTags.includes(tag) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => {
                setSelectedTags((prev) =>
                  prev.includes(tag)
                    ? prev.filter((t) => t !== tag)
                    : [...prev, tag],
                );
              }}
            >
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Assets Grid/List */}
      <div
        className={cn(
          viewMode === "grid"
            ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
            : "space-y-2",
        )}
      >
        {assets.map((asset) => (
          <AssetCard
            key={asset.id}
            asset={asset}
            imageUrl={assetUrls[asset.id]}
            viewMode={viewMode}
            selected={selectedAssets.includes(asset.id)}
            onClick={() => handleAssetClick(asset)}
          />
        ))}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => loadAssets()}
            disabled={loading}
          >
            {loading ? "Loading..." : "Load More"}
          </Button>
        </div>
      )}

      {assets.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          No assets found. Upload some media to get started.
        </div>
      )}
    </div>
  );
}

interface AssetCardProps {
  asset: MediaAsset;
  imageUrl?: string;
  viewMode: "grid" | "list";
  selected: boolean;
  onClick: () => void;
}

function AssetCard({
  asset,
  imageUrl,
  viewMode,
  selected,
  onClick,
}: AssetCardProps) {
  if (viewMode === "list") {
    return (
      <Card
        className={cn(
          "p-4 cursor-pointer transition-colors hover:bg-gray-50",
          selected && "ring-2 ring-primary",
        )}
        onClick={onClick}
      >
        <div className="flex items-center gap-4">
          {imageUrl && (
            <img
              src={imageUrl}
              alt={asset.filename}
              className="w-12 h-12 object-cover rounded"
              loading="lazy"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{asset.filename}</p>
            <p className="text-sm text-gray-500">
              {asset.width}×{asset.height} • {Math.round(asset.size / 1024)}KB
            </p>
            {asset.tags.length > 0 && (
              <div className="flex gap-1 mt-1">
                {asset.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "group cursor-pointer transition-all hover:shadow-md",
        selected && "ring-2 ring-primary",
      )}
      onClick={onClick}
    >
      <div className="aspect-square relative overflow-hidden rounded-t-lg">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={asset.filename}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-400 text-xs">Loading...</span>
          </div>
        )}
      </div>
      <div className="p-2">
        <p className="text-xs font-medium truncate">{asset.filename}</p>
        <p className="text-xs text-gray-500">
          {Math.round(asset.size / 1024)}KB
        </p>
      </div>
    </Card>
  );
}
