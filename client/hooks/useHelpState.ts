import { useState, useEffect } from "react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import type { OnboardingFlags, PageKey } from "@/types/help";

export function useHelpState() {
  const { currentWorkspace } = useWorkspace();
  const wsId = currentWorkspace?.id || "default";

  const getStorageKey = (suffix: string) => `Aligned:${suffix}:${wsId}`;

  // Tour completion
  const isTourCompleted = () => {
    return localStorage.getItem(getStorageKey("tour:completed")) === "true";
  };

  const markTourCompleted = () => {
    localStorage.setItem(getStorageKey("tour:completed"), "true");
  };

  const resetTour = () => {
    localStorage.removeItem(getStorageKey("tour:completed"));
  };

  // First-visit tooltips
  const isTipDismissed = (page: PageKey) => {
    return localStorage.getItem(getStorageKey(`tip:${page}`)) === "dismissed";
  };

  const dismissTip = (page: PageKey) => {
    localStorage.setItem(getStorageKey(`tip:${page}`), "dismissed");
  };

  // Help drawer state
  const isHelpLastOpen = () => {
    return localStorage.getItem(getStorageKey("help:lastOpen")) === "true";
  };

  const setHelpLastOpen = (open: boolean) => {
    localStorage.setItem(getStorageKey("help:lastOpen"), open ? "true" : "false");
  };

  return {
    wsId,
    isTourCompleted,
    markTourCompleted,
    resetTour,
    isTipDismissed,
    dismissTip,
    isHelpLastOpen,
    setHelpLastOpen,
  };
}
