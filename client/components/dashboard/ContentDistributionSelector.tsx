import { ContentDistribution, CONTENT_DISTRIBUTION_TYPES } from "@/types/campaign";
import { Plus, Minus } from "lucide-react";
import { useState } from "react";

interface ContentDistributionSelectorProps {
  selectedPlatforms: string[];
  onDistributionChange: (distribution: ContentDistribution[]) => void;
}

export function ContentDistributionSelector({
  selectedPlatforms,
  onDistributionChange,
}: ContentDistributionSelectorProps) {
  const [distribution, setDistribution] = useState<ContentDistribution[]>(
    CONTENT_DISTRIBUTION_TYPES.map((d) => ({ ...d }))
  );

  const handleCountChange = (id: string, newCount: number) => {
    const updated = distribution.map((item) =>
      item.id === id ? { ...item, count: Math.max(0, newCount) } : item
    );
    setDistribution(updated);
    onDistributionChange(updated);
  };

  const handleIncrement = (id: string) => {
    const item = distribution.find((d) => d.id === id);
    if (item) {
      handleCountChange(id, item.count + 1);
    }
  };

  const handleDecrement = (id: string) => {
    const item = distribution.find((d) => d.id === id);
    if (item && item.count > 0) {
      handleCountChange(id, item.count - 1);
    }
  };

  // Filter distribution types - show only those relevant to selected platforms
  const filteredDistribution = distribution.filter((item) => {
    // Always show cross-platform types (emails, blogs)
    if (item.platforms.length === 0) return true;
    // Show if any of the item's platforms are selected
    return item.platforms.some((p) => selectedPlatforms.includes(p));
  });

  const totalPosts = filteredDistribution.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black text-slate-900">Content Breakdown</h3>
          <p className="text-xs text-slate-600 font-medium mt-1">
            Specify how many of each content type for your campaign
          </p>
        </div>
        {totalPosts > 0 && (
          <div className="text-right">
            <p className="text-2xl font-black text-indigo-600">{totalPosts}</p>
            <p className="text-xs text-slate-600 font-medium">Total Posts</p>
          </div>
        )}
      </div>

      {/* Content Distribution List */}
      <div className="space-y-2">
        {filteredDistribution.length > 0 ? (
          filteredDistribution.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all duration-200"
            >
              {/* Left side: Icon + Label */}
              <div className="flex items-center gap-3 flex-1">
                <span className="text-lg flex-shrink-0">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-slate-900">{item.label}</p>
                  {item.platforms.length > 0 && (
                    <p className="text-xs text-slate-600 font-medium">
                      {item.platforms
                        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
                        .join(", ")}
                    </p>
                  )}
                </div>
              </div>

              {/* Right side: Counter controls */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleDecrement(item.id)}
                  disabled={item.count === 0}
                  className="p-1.5 rounded-lg bg-blue-100 hover:bg-blue-200 disabled:bg-slate-100 disabled:text-slate-300 text-blue-600 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  min="0"
                  max="999"
                  value={item.count}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    handleCountChange(item.id, val);
                  }}
                  className="w-14 text-center px-2 py-1.5 border border-slate-300 rounded-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={() => handleIncrement(item.id)}
                  className="p-1.5 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-slate-600 font-medium">
              Select platforms first to see content types
            </p>
          </div>
        )}
      </div>

      {/* Info message */}
      {totalPosts > 0 && (
        <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
          <p className="text-xs text-blue-800 font-medium">
            💡 AI will help distribute these {totalPosts} posts across your campaign
            timeline based on optimal posting frequency and platform-specific best practices.
          </p>
        </div>
      )}
    </div>
  );
}
