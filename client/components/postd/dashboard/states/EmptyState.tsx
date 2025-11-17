/**
 * EmptyState
 * 
 * Displays an empty state when there's no dashboard data.
 */

import { FileText, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  actionUrl?: string;
}

export function EmptyState({
  title = "No data yet",
  description = "Get started by creating your first post or connecting a brand.",
  actionLabel = "Create Content",
  actionUrl = "/creative-studio",
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <FileText className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 text-center max-w-md mb-6">
        {description}
      </p>
      {actionUrl && (
        <Link to={actionUrl}>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            {actionLabel}
          </Button>
        </Link>
      )}
    </div>
  );
}

