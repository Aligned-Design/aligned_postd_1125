/**
 * TopContentTable
 * 
 * Displays top performing content in a table format.
 */

import type { TopContentItem } from "@/components/postd/dashboard/hooks/useDashboardData";
import { ExternalLink } from "lucide-react";

interface TopContentTableProps {
  items: TopContentItem[];
}

const platformColors: Record<string, string> = {
  Instagram: "bg-pink-100 text-pink-700",
  LinkedIn: "bg-blue-100 text-blue-700",
  Facebook: "bg-indigo-100 text-indigo-700",
  TikTok: "bg-slate-100 text-slate-700",
  Twitter: "bg-sky-100 text-sky-700",
};

export function TopContentTable({ items }: TopContentTableProps) {
  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Top Content</h2>
        <p className="text-sm text-gray-600">
          Your best performing posts this week
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                Content
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                Platform
              </th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                Engagement
              </th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                Impressions
              </th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                Rate
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item.id}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <td className="py-3 px-4">
                  <div className="font-medium text-gray-900">{item.title}</div>
                  <div className="text-xs text-gray-500 mt-1">{item.date}</div>
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      platformColors[item.platform] || "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {item.platform}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="font-medium text-gray-900">
                    {item.engagement.toLocaleString()}
                  </div>
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="font-medium text-gray-900">
                    {item.impressions.toLocaleString()}
                  </div>
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="font-medium text-green-600">
                    {item.engagementRate ? item.engagementRate.toFixed(1) : (item.impressions > 0 ? ((item.engagement / item.impressions) * 100).toFixed(1) : "0.0")}%
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

