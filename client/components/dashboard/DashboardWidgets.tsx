/**
 * Dashboard widgets component
 * Shows approval and content widgets with role-based actions
 */

import { useCan } from "@/lib/auth/useCan";

interface ApprovalItem {
  id: string;
  title: string;
  status: string;
  date: string;
}

interface DashboardWidgetsProps {
  items?: ApprovalItem[];
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}

export function DashboardWidgets({
  items = [],
  onApprove,
  onReject,
}: DashboardWidgetsProps) {
  // Check if user can approve content
  const canApproveContent = useCan("content:approve");

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Pending Approvals Widget */}
      <div className="border rounded-lg p-6">
        <h3 className="font-semibold mb-4">Pending Approvals</h3>
        {items.length === 0 ? (
          <p className="text-gray-500 text-sm">No pending approvals</p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2 border rounded"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-gray-500">{item.date}</p>
                </div>
                {canApproveContent && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => onApprove?.(item.id)}
                      className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => onReject?.(item.id)}
                      className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Analytics Widget */}
      <div className="border rounded-lg p-6">
        <h3 className="font-semibold mb-4">Recent Activity</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p>📝 5 posts created this week</p>
          <p>✓ 3 posts approved</p>
          <p>📊 1.2K impressions</p>
        </div>
      </div>
    </div>
  );
}

export default DashboardWidgets;
