/**
 * Aligned AI Summary component
 * Shows AI insights and suggestions
 */

import { useAuth } from "@/lib/auth/useAuth";
import { useCan } from "@/lib/auth/useCan";

interface AlignedAISummaryProps {
  className?: string;
}

export function AlignedAISummary({ className = "" }: AlignedAISummaryProps) {
  const { user } = useAuth();
  const canEditContent = useCan("content:edit");

  return (
    <div
      className={`bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            🤖 AI Insights
          </h3>
          <p className="text-gray-700 mb-4">
            Based on your recent activity and performance metrics, here are
            AI-generated insights:
          </p>

          <ul className="space-y-2 text-sm text-gray-700">
            <li>✨ Your best-performing content type: Educational threads</li>
            <li>⏰ Optimal posting time: 9 AM - 11 AM EST</li>
            <li>
              📈 Recommended content topics: Market analysis, industry trends
            </li>
            <li>👥 Top engaging audience: C-suite professionals</li>
          </ul>
        </div>

        {/* Edit prompt - if user can edit */}
        {canEditContent && (
          <button className="ml-4 px-4 py-2 text-sm bg-white border border-purple-300 rounded hover:bg-purple-50">
            ✏️ Edit
          </button>
        )}
      </div>

      {/* Read-only indicator for limited access */}
      {!canEditContent && (
        <p className="text-xs text-slate-500 italic mt-3 pt-3 border-t border-purple-200">
          📖 Read-only: You don't have permission to edit these insights
        </p>
      )}
    </div>
  );
}

export default AlignedAISummary;
