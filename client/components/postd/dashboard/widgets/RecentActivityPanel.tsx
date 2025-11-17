/**
 * RecentActivityPanel
 * 
 * Wrapper for ActivityFeed with panel styling.
 */

import { ActivityFeed } from "@/components/postd/ui/feeds/ActivityFeed";
import type { ActivityItem } from "@/components/postd/dashboard/hooks/useDashboardData";

interface RecentActivityPanelProps {
  items: ActivityItem[];
}

export function RecentActivityPanel({ items }: RecentActivityPanelProps) {
  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Recent Activity</h2>
        <p className="text-sm text-gray-600">
          Latest updates from your account
        </p>
      </div>
      <ActivityFeed items={items} maxItems={5} />
    </div>
  );
}

