/**
 * Action buttons header for dashboard
 * Shows role-based action buttons
 */

import { Button } from "@/components/ui/button";
import { useCan } from "@/lib/auth";

interface ActionButtonsHeaderProps {
  onCreateContent?: () => void;
  onSchedulePost?: () => void;
  onPublishNow?: () => void;
  onBestTimeSuggestions?: () => void;
}

export function ActionButtonsHeader({
  onCreateContent,
  onSchedulePost,
  onPublishNow,
  onBestTimeSuggestions,
}: ActionButtonsHeaderProps) {
  // Check permissions for different actions
  const canCreateContent = useCan("content:create");
  const canPublishNow = useCan("publish:now");
  const canScheduleContent = useCan("publish:schedule");

  return (
    <div className="flex gap-3 flex-wrap">
      {/* Create Content */}
      {canCreateContent && (
        <Button
          onClick={onCreateContent}
          className="bg-purple-600 hover:bg-purple-700"
        >
          + Create Content
        </Button>
      )}

      {/* Schedule Post */}
      {canScheduleContent && (
        <Button variant="outline" onClick={onSchedulePost}>
          📅 Schedule
        </Button>
      )}

      {/* Publish Now */}
      {canPublishNow && (
        <Button variant="outline" onClick={onPublishNow}>
          🚀 Publish Now
        </Button>
      )}

      {/* Best Time Suggestions */}
      <Button variant="outline" onClick={onBestTimeSuggestions}>
        ⏰ Best Time
      </Button>
    </div>
  );
}

export default ActionButtonsHeader;
