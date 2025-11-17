import { X } from "lucide-react";
import { LibraryFilter, AssetFileType, GraphicsSize, getGraphicsSizeInfo } from "@/types/library";
import { FilterDropdown } from "./FilterDropdown";
import { DateFilterDropdown } from "./DateFilterDropdown";

interface LibraryFilterRowProps {
  filters: LibraryFilter;
  onFiltersChange: (filters: LibraryFilter) => void;
  availableTags: string[];
  availablePeople: string[];
  availableGraphicsSizes: GraphicsSize[];
  assetCount: number;
  totalAssetCount: number;
}

export function LibraryFilterRow({
  filters,
  onFiltersChange,
  availableTags,
  availablePeople,
  availableGraphicsSizes,
  assetCount,
  totalAssetCount,
}: LibraryFilterRowProps) {
  const fileTypeOptions = [
    { id: "image", label: "📷 Images" },
    { id: "video", label: "🎬 Videos" },
  ];

  const graphicsSizeOptions = availableGraphicsSizes.map((size) => {
    const info = getGraphicsSizeInfo(size);
    return {
      id: size,
      label: `${info.icon} ${info.name}`,
    };
  });

  const tagOptions = availableTags.map((tag) => ({
    id: tag,
    label: tag,
  }));

  const peopleOptions = availablePeople.map((person) => ({
    id: person,
    label: person,
  }));

  const hasActiveFilters =
    filters.fileTypes.length > 0 ||
    filters.tags.length > 0 ||
    filters.people.length > 0 ||
    filters.campaignIds.length > 0 ||
    filters.eventIds.length > 0;

  const handleClearAllFilters = () => {
    onFiltersChange({
      dateRange: undefined,
      tags: [],
      fileTypes: [],
      people: [],
      campaignIds: [],
      eventIds: [],
      searchQuery: filters.searchQuery,
    });
  };

  const handleRemoveFilter = (type: string, value: string) => {
    if (type === "fileType") {
      onFiltersChange({
        ...filters,
        fileTypes: filters.fileTypes.filter((ft) => ft !== value),
      });
    } else if (type === "tag") {
      onFiltersChange({
        ...filters,
        tags: filters.tags.filter((t) => t !== value),
      });
    } else if (type === "person") {
      onFiltersChange({
        ...filters,
        people: filters.people.filter((p) => p !== value),
      });
    }
  };

  return (
    <div className="space-y-3">
      {/* Filter Dropdowns - Horizontal */}
      <div className="flex flex-wrap gap-2 items-center">
        <DateFilterDropdown
          selectedPreset={filters.datePreset}
          customFrom={filters.dateRange?.from}
          customTo={filters.dateRange?.to}
          onApply={(preset, from, to) => {
            if (!preset && !from && !to) {
              onFiltersChange({ ...filters, datePreset: undefined, dateRange: undefined });
            } else {
              onFiltersChange({
                ...filters,
                datePreset: preset as any,
                dateRange: from && to ? { from, to } : undefined,
              });
            }
          }}
          isActive={!!filters.datePreset || !!filters.dateRange}
        />

        <FilterDropdown
          label="File Type"
          icon=""
          options={fileTypeOptions}
          selected={filters.fileTypes}
          onSelectionChange={(selected) =>
            onFiltersChange({ ...filters, fileTypes: selected as AssetFileType[] })
          }
          isActive={filters.fileTypes.length > 0}
        />

        {availableTags.length > 0 && (
          <FilterDropdown
            label="Tags"
            icon=""
            options={tagOptions}
            selected={filters.tags}
            onSelectionChange={(selected) =>
              onFiltersChange({ ...filters, tags: selected })
            }
            isActive={filters.tags.length > 0}
          />
        )}

        {availablePeople.length > 0 && (
          <FilterDropdown
            label="People"
            icon=""
            options={peopleOptions}
            selected={filters.people}
            onSelectionChange={(selected) =>
              onFiltersChange({ ...filters, people: selected })
            }
            isActive={filters.people.length > 0}
          />
        )}

        {availableGraphicsSizes.length > 0 && (
          <FilterDropdown
            label="Graphics Size"
            icon=""
            options={graphicsSizeOptions}
            selected={filters.campaignIds} // Reuse campaign IDs field for graphics sizes for now
            onSelectionChange={(selected) =>
              onFiltersChange({ ...filters, campaignIds: selected })
            }
            isActive={filters.campaignIds.length > 0}
          />
        )}

        {/* Stats Badge */}
        <div className="ml-auto text-xs font-bold text-slate-600">
          {assetCount} of {totalAssetCount} assets
        </div>
      </div>

      {/* Active Filters Display - Removable Chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 items-center pt-2 border-t border-slate-200">
          <span className="text-xs font-bold text-slate-600">Active:</span>

          {filters.fileTypes.map((fileType) => (
            <div
              key={`ft-${fileType}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold"
            >
              {fileType === "image" ? "📷 Images" : "🎬 Videos"}
              <button
                onClick={() => handleRemoveFilter("fileType", fileType)}
                className="hover:text-red-600 transition-colors"
              >
                ✕
              </button>
            </div>
          ))}

          {filters.tags.map((tag) => (
            <div
              key={`tag-${tag}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-bold"
            >
              {tag}
              <button
                onClick={() => handleRemoveFilter("tag", tag)}
                className="hover:text-red-600 transition-colors"
              >
                ✕
              </button>
            </div>
          ))}

          {filters.people.map((person) => (
            <div
              key={`person-${person}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-xs font-bold"
            >
              👤 {person}
              <button
                onClick={() => handleRemoveFilter("person", person)}
                className="hover:text-red-600 transition-colors"
              >
                ✕
              </button>
            </div>
          ))}

          <button
            onClick={handleClearAllFilters}
            className="ml-auto px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors font-bold text-xs flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Clear All
          </button>
        </div>
      )}
    </div>
  );
}
