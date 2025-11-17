/**
 * ActivityFeed
 * 
 * Displays a feed of recent activity items.
 */

import type { ActivityItem } from "@/components/postd/dashboard/hooks/useDashboardData";
import { Clock } from "lucide-react";

interface ActivityFeedProps {
  items: ActivityItem[];
  maxItems?: number;
}

const typeIcons: Record<string, string> = {
  post: "📝",
  approval: "✓",
  campaign: "🚀",
  insight: "💡",
};

export function ActivityFeed({ items, maxItems = 10 }: ActivityFeedProps) {
  const displayItems = items.slice(0, maxItems);

  return (
    <div className="space-y-3">
      {displayItems.map((item) => (
        <div
          key={item.id}
          className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-lg">
            {item.icon || typeIcons[item.type] || "•"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">{item.title}</p>
            {item.description && (
              <p className="text-xs text-gray-600 mt-1">{item.description}</p>
            )}
            <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              <span>{item.timestamp}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

