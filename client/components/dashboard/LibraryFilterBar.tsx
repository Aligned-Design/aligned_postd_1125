import { X } from "lucide-react";
import { LibraryFilter, AssetFileType } from "@/types/library";

interface LibraryFilterBarProps {
  filters: LibraryFilter;
  onFiltersChange: (filters: LibraryFilter) => void;
  availableTags: string[];
  availablePeople: string[];
  assetCount: number;
  totalAssetCount: number;
}

export function LibraryFilterBar({
  filters,
  onFiltersChange,
  availableTags,
  availablePeople,
  assetCount,
  totalAssetCount,
}: LibraryFilterBarProps) {
  const fileTypeOptions: AssetFileType[] = ["image", "video"];

  const handleToggleTag = (tag: string) => {
    onFiltersChange({
      ...filters,
      tags: filters.tags.includes(tag) ? filters.tags.filter((t) => t !== tag) : [...filters.tags, tag],
    });
  };

  const handleTogglePerson = (person: string) => {
    onFiltersChange({
      ...filters,
      people: filters.people.includes(person)
        ? filters.people.filter((p) => p !== person)
        : [...filters.people, person],
    });
  };

  const handleToggleFileType = (fileType: AssetFileType) => {
    onFiltersChange({
      ...filters,
      fileTypes: filters.fileTypes.includes(fileType)
        ? filters.fileTypes.filter((ft) => ft !== fileType)
        : [...filters.fileTypes, fileType],
    });
  };

  const handleResetFilters = () => {
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

  const activeFilterCount = [
    filters.tags.length,
    filters.people.length,
    filters.fileTypes.length,
    filters.campaignIds.length,
    filters.eventIds.length,
  ].reduce((a, b) => a + b, 0);

  return (
    <div className="sticky top-24 bg-white/80 backdrop-blur-xl rounded-xl border border-white/60 p-4 space-y-4 max-h-[calc(100vh-8rem)] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-900">Filters</h3>
        {activeFilterCount > 0 && (
          <button
            onClick={handleResetFilters}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
          >
            Reset ({activeFilterCount})
          </button>
        )}
      </div>

      {/* Results Count */}
      <div className="px-3 py-2 bg-indigo-50 rounded-lg border border-indigo-200">
        <p className="text-xs font-bold text-indigo-900">
          {assetCount} of {totalAssetCount} assets
        </p>
      </div>

      {/* File Type Filter */}
      <div>
        <label className="block text-xs font-black text-slate-900 mb-2">File Type</label>
        <div className="space-y-1.5">
          {fileTypeOptions.map((type) => (
            <label key={type} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.fileTypes.includes(type)}
                onChange={() => handleToggleFileType(type)}
                className="w-4 h-4 rounded border-slate-300"
              />
              <span className="text-sm text-slate-700 capitalize">{type}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Tags Filter */}
      {availableTags.length > 0 && (
        <div>
          <label className="block text-xs font-black text-slate-900 mb-2">Tags</label>
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {availableTags.slice(0, 12).map((tag) => (
              <label key={tag} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.tags.includes(tag)}
                  onChange={() => handleToggleTag(tag)}
                  className="w-4 h-4 rounded border-slate-300"
                />
                <span className="text-sm text-slate-700 truncate">{tag}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* People Filter */}
      {availablePeople.length > 0 && (
        <div>
          <label className="block text-xs font-black text-slate-900 mb-2">People</label>
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {availablePeople.map((person) => (
              <label key={person} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.people.includes(person)}
                  onChange={() => handleTogglePerson(person)}
                  className="w-4 h-4 rounded border-slate-300"
                />
                <span className="text-sm text-slate-700">{person}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
