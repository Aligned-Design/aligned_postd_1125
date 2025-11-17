/**
 * Smart Dashboard component
 * Shows analytics with role-based view complexity
 */

import { useState } from "react";
import { useCan } from "@/lib/auth/useCan";

interface SmartDashboardProps {
  hasGoals?: boolean;
}

export function SmartDashboard({ hasGoals = false }: SmartDashboardProps) {
  // Check permissions
  const canExportAnalytics = useCan("analytics:export");
  const [viewMode, setViewMode] = useState<"simple" | "advanced">(
    canExportAnalytics ? "advanced" : "simple",
  );

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Analytics Dashboard</h2>

        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("simple")}
            className={`px-3 py-1 text-sm rounded ${
              viewMode === "simple"
                ? "bg-purple-600 text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            Simple
          </button>
          <button
            onClick={() => setViewMode("advanced")}
            className={`px-3 py-1 text-sm rounded ${
              viewMode === "advanced"
                ? "bg-purple-600 text-white"
                : "bg-gray-100 text-gray-700"
            }`}
            disabled={!canExportAnalytics}
          >
            Advanced
          </button>
          {canExportAnalytics && (
            <button className="px-3 py-1 text-sm rounded bg-green-100 text-green-800 hover:bg-green-200">
              ⬇️ Export
            </button>
          )}
        </div>
      </div>

      {/* Simple view */}
      {viewMode === "simple" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border rounded bg-blue-50">
            <p className="text-xs text-gray-500">Total Impressions</p>
            <p className="text-2xl font-bold">45.2K</p>
          </div>
          <div className="p-4 border rounded bg-green-50">
            <p className="text-xs text-gray-500">Engagement Rate</p>
            <p className="text-2xl font-bold">12.5%</p>
          </div>
          <div className="p-4 border rounded bg-purple-50">
            <p className="text-xs text-gray-500">Posts Published</p>
            <p className="text-2xl font-bold">24</p>
          </div>
        </div>
      )}

      {/* Advanced view */}
      {viewMode === "advanced" && (
        <div className="space-y-4">
          <div className="p-6 border rounded bg-white">
            <h3 className="font-semibold mb-4">Advanced Metrics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500">Click-through Rate</p>
                <p className="text-xl font-bold">3.2%</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Avg. Session Time</p>
                <p className="text-xl font-bold">2m 45s</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Conversion Rate</p>
                <p className="text-xl font-bold">0.8%</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Bounce Rate</p>
                <p className="text-xl font-bold">42%</p>
              </div>
            </div>
          </div>

          <div className="p-6 border rounded bg-gradient-to-r from-green-50 to-blue-50">
            <h3 className="font-semibold mb-2">Goals Achievement</h3>
            {hasGoals ? (
              <p className="text-sm text-gray-700">
                15 of 20 quarterly goals met (75%)
              </p>
            ) : (
              <p className="text-sm text-gray-500">No goals set yet</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SmartDashboard;
