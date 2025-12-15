/**
 * Bulk Approval Modal Component
 * Provides UI for bulk approving or rejecting multiple posts with confirmation dialog
 */

import React, { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle, AlertCircle, XCircle, Loader } from "lucide-react";

export interface BulkApprovalModalProps {
  isOpen: boolean;
  action: "approve" | "reject";
  selectedPostIds: string[];
  onConfirm: (note?: string) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export function BulkApprovalModal({
  isOpen,
  action,
  selectedPostIds,
  onConfirm,
  onCancel,
  isLoading = false,
  error = null,
}: BulkApprovalModalProps) {
  const [note, setNote] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);

  const handleConfirm = async () => {
    setLocalLoading(true);
    try {
      await onConfirm(note);
      // Reset state after successful submission
      setNote("");
      setAcknowledged(false);
    } finally {
      setLocalLoading(false);
    }
  };

  const isSubmitting = isLoading || localLoading;
  const canSubmit = acknowledged && !isSubmitting;

  const actionColor = action === "approve" ? "green" : "red";
  const actionIcon = action === "approve" ? CheckCircle : XCircle;
  const ActionIcon = actionIcon;

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <ActionIcon className={`h-6 w-6 text-${actionColor}-600`} />
            <div>
              <AlertDialogTitle>
                {action === "approve" ? "Approve Items" : "Reject Items"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {selectedPostIds.length} post
                {selectedPostIds.length !== 1 ? "s" : ""} selected
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          {/* Summary */}
          <div
            className={`p-4 rounded-lg border-2 border-${actionColor}-200 bg-${actionColor}-50`}
          >
            <p className={`text-${actionColor}-900 font-medium text-lg`}>
              {selectedPostIds.length}{" "}
              {selectedPostIds.length === 1 ? "post" : "posts"} will be{" "}
              {action === "approve" ? "approved" : "rejected"}
            </p>
            <p className={`text-${actionColor}-700 text-sm mt-1`}>
              {action === "approve"
                ? "This action will immediately schedule these posts for publication."
                : "This action will remove these posts from the review queue."}
            </p>
          </div>

          {/* Note field */}
          <div>
            <Label htmlFor="bulk-note" className="text-sm font-medium">
              Add a note (optional)
            </Label>
            <Textarea
              id="bulk-note"
              placeholder={
                action === "approve"
                  ? 'e.g., "Posts look great, ready to publish"'
                  : 'e.g., "Needs more brand alignment adjustments"'
              }
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-2"
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          {/* Acknowledgement checkbox */}
          <div className="flex items-start gap-3">
            <Checkbox
              id="bulk-acknowledge"
              checked={acknowledged}
              onCheckedChange={(checked) => setAcknowledged(checked as boolean)}
              disabled={isSubmitting}
              className="mt-1"
            />
            <Label
              htmlFor="bulk-acknowledge"
              className="text-sm text-gray-700 leading-tight cursor-pointer"
            >
              I understand that this action will{" "}
              {action === "approve"
                ? "immediately approve and schedule"
                : "reject"}{" "}
              all selected posts. This action cannot be easily undone.
            </Label>
          </div>

          {/* Error message */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-900 font-medium text-sm">
                  Action failed
                </p>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Post count warning for large batches */}
          {selectedPostIds.length > 20 && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-900 font-medium text-sm">
                  Large batch action
                </p>
                <p className="text-amber-700 text-sm mt-1">
                  Processing {selectedPostIds.length} posts may take a moment.
                </p>
              </div>
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!canSubmit}
            className={`gap-2 ${
              action === "approve"
                ? "bg-green-600 hover:bg-green-700"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {isSubmitting && <Loader className="h-4 w-4 animate-spin" />}
            {action === "approve" ? "Approve" : "Reject"} (
            {selectedPostIds.length})
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
