/**
 * Role-Based Approval Flow Component
 * Displays approval/publishing options based on user role
 */

import { useState } from "react";
import { useAuth, useCan } from "@/lib/auth";
import { Button } from "@/components/ui/button";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Manager" | "Contributor" | "Viewer";
}

interface RoleBasedApprovalFlowProps {
  contentId: string;
  requiresApproval?: boolean;
  teamMembers?: TeamMember[];
  onApprove?: (contentId: string) => void;
  onReject?: (contentId: string) => void;
  onPublish?: (contentId: string) => void;
  onSchedule?: (contentId: string, date: Date) => void;
  onRequestApproval?: (contentId: string, approverIds: string[]) => void;
}

export function RoleBasedApprovalFlow({
  contentId,
  requiresApproval = false,
  teamMembers = [],
  onApprove,
  onReject,
  onPublish,
  onSchedule,
  onRequestApproval,
}: RoleBasedApprovalFlowProps) {
  const { role } = useAuth();
  const canApprove = useCan("content:approve");
  const canPublishNow = useCan("publish:now");
  const canSchedule = useCan("publish:schedule");
  const canRequestApproval = useCan("content:create");

  const [selectedApprovers, setSelectedApprovers] = useState<string[]>([]);
  const [scheduleDate, setScheduleDate] = useState<string>("");

  // Get eligible approvers (Admin or Manager roles)
  const eligibleApprovers = teamMembers.filter(
    (member) => member.role === "Admin" || member.role === "Manager",
  );

  return (
    <div className="space-y-6 p-6 bg-gray-50 rounded-lg">
      <div>
        <h3 className="text-lg font-semibold mb-4">
          Content Approval & Publishing
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Role: <span className="font-medium">{role}</span>
        </p>
      </div>

      {/* CREATOR: Request Approval Flow */}
      {!canApprove && canRequestApproval && (
        <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded">
          <h4 className="font-medium text-blue-900">Request Approval</h4>
          <p className="text-sm text-blue-800">
            Your content requires approval before publishing. Select team
            members to review.
          </p>

          {eligibleApprovers.length > 0 ? (
            <div className="space-y-3">
              <label className="block text-sm font-medium">
                Select Approvers
              </label>
              {eligibleApprovers.map((member) => (
                <label key={member.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedApprovers.includes(member.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedApprovers([...selectedApprovers, member.id]);
                      } else {
                        setSelectedApprovers(
                          selectedApprovers.filter((id) => id !== member.id),
                        );
                      }
                    }}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">
                    {member.name} ({member.role})
                  </span>
                </label>
              ))}

              <Button
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={selectedApprovers.length === 0}
                onClick={() => {
                  onRequestApproval?.(contentId, selectedApprovers);
                  setSelectedApprovers([]);
                }}
              >
                Request Approval
              </Button>
            </div>
          ) : (
            <p className="text-sm text-blue-700">No approvers available</p>
          )}
        </div>
      )}

      {/* ADMIN/MANAGER: Approval Actions */}
      {canApprove && requiresApproval && (
        <div className="space-y-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <h4 className="font-medium text-yellow-900">
            Approve or Reject Content
          </h4>
          <div className="flex gap-3">
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={() => onApprove?.(contentId)}
            >
              ✓ Approve
            </Button>
            <Button
              className="flex-1 bg-red-600 hover:bg-red-700"
              onClick={() => onReject?.(contentId)}
            >
              ✕ Reject
            </Button>
          </div>
        </div>
      )}

      {/* ADMIN/MANAGER: Publishing Options */}
      {canPublishNow && !requiresApproval && (
        <div className="space-y-4 p-4 bg-green-50 border border-green-200 rounded">
          <h4 className="font-medium text-green-900">Publishing Options</h4>

          <div className="space-y-3">
            {/* Publish Now */}
            <Button
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={() => onPublish?.(contentId)}
            >
              🚀 Publish Now
            </Button>

            {/* Schedule */}
            {canSchedule && (
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  Or Schedule for Later
                </label>
                <div className="flex gap-2">
                  <input
                    type="datetime-local"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="flex-1 px-3 py-2 border rounded text-sm"
                  />
                  <Button
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={!scheduleDate}
                    onClick={() => {
                      onSchedule?.(contentId, new Date(scheduleDate));
                      setScheduleDate("");
                    }}
                  >
                    Schedule
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CLIENT_APPROVER: Limited Approval */}
      {canApprove && !requiresApproval && (
        <div className="space-y-4 p-4 bg-purple-50 border border-purple-200 rounded">
          <h4 className="font-medium text-purple-900">Review & Approve</h4>
          <p className="text-sm text-purple-800">
            You can approve or reject this content for publication.
          </p>
          <div className="flex gap-3">
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={() => onApprove?.(contentId)}
            >
              ✓ Approve
            </Button>
            <Button
              className="flex-1 bg-red-600 hover:bg-red-700"
              onClick={() => onReject?.(contentId)}
            >
              ✕ Reject
            </Button>
          </div>
        </div>
      )}

      {/* VIEWER: Read-only */}
      {!canApprove && !canRequestApproval && (
        <div className="p-4 bg-gray-100 border border-gray-300 rounded">
          <p className="text-sm text-gray-700">
            📖 You have read-only access to this content.
          </p>
        </div>
      )}
    </div>
  );
}

export default RoleBasedApprovalFlow;
