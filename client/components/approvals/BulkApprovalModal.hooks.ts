import { useState } from "react";

/**
 * Hook for managing bulk approval modal state
 */
export function useBulkApprovalModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [action, setAction] = useState<"approve" | "reject">("approve");
  const [selectedPostIds, setSelectedPostIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openModal = (
    postIds: string[],
    actionType: "approve" | "reject" = "approve",
  ) => {
    setSelectedPostIds(postIds);
    setAction(actionType);
    setError(null);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setSelectedPostIds([]);
    setError(null);
  };

  const handleConfirm = async (
    onConfirmCallback: (note?: string) => Promise<void>,
  ) => {
    return async (note?: string) => {
      setIsLoading(true);
      setError(null);
      try {
        await onConfirmCallback(note);
        closeModal();
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };
  };

  return {
    isOpen,
    action,
    selectedPostIds,
    isLoading,
    error,
    openModal,
    closeModal,
    handleConfirm,
  };
}

