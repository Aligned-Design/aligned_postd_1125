/**
 * useDragAndDrop Hook
 * 
 * Provides drag-and-drop functionality for calendar scheduling.
 * Uses native HTML5 drag-and-drop API for lightweight, well-supported implementation.
 */

import { useState, useCallback, useRef } from "react";
import { useBrand } from "@/contexts/BrandContext";
import { useToast } from "@/hooks/use-toast";
import { checkPreferredSchedule, type PreferredPostingSchedule } from "@/lib/postingScheduleUtils";

interface DragItem {
  id: string;
  type: "post" | "content";
  currentDate?: string;
  currentTime?: string;
}

interface DropTarget {
  date: string;
  time?: string; // Optional time for hourly views
}

interface UseDragAndDropOptions {
  onDrop: (itemId: string, target: DropTarget) => Promise<void>;
  enabled?: boolean;
  preferredSchedule?: PreferredPostingSchedule | null;
}

export function useDragAndDrop({ onDrop, enabled = true, preferredSchedule }: UseDragAndDropOptions) {
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<DropTarget | null>(null);
  const { currentBrand } = useBrand();
  const { toast } = useToast();
  const isUpdatingRef = useRef(false);

  const handleDragStart = useCallback((e: React.DragEvent, item: DragItem) => {
    if (!enabled || isUpdatingRef.current) {
      e.preventDefault();
      return;
    }

    setDraggedItem(item);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", JSON.stringify(item));
    
    // Add visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "0.5";
    }
  }, [enabled]);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    // Restore visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "1";
    }
    
    setDraggedItem(null);
    setDragOverTarget(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, target: DropTarget) => {
    if (!enabled || !draggedItem) {
      return;
    }

    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverTarget(target);
  }, [enabled, draggedItem]);

  const handleDragLeave = useCallback(() => {
    setDragOverTarget(null);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, target: DropTarget) => {
    if (!enabled || !draggedItem || isUpdatingRef.current) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    // Prevent dropping on the same date/time
    if (
      draggedItem.currentDate === target.date &&
      draggedItem.currentTime === target.time
    ) {
      setDragOverTarget(null);
      return;
    }

    // Check if outside preferred schedule (for suggestion only)
    const scheduledAt = target.time
      ? new Date(`${target.date}T${target.time}`)
      : new Date(`${target.date}T12:00:00`);
    const scheduleCheck = checkPreferredSchedule(scheduledAt, preferredSchedule);

    isUpdatingRef.current = true;

    try {
      await onDrop(draggedItem.id, target);
      
      // Show suggestion in toast if outside preferred schedule
      if (!scheduleCheck.isPreferred && scheduleCheck.suggestion) {
        toast({
          title: "Schedule Updated",
          description: `Content rescheduled. ${scheduleCheck.suggestion}`,
        });
      } else {
        toast({
          title: "Schedule Updated",
          description: "Content has been rescheduled successfully.",
        });
      }
    } catch (error) {
      console.error("Failed to update schedule:", error);
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to reschedule content. Please try again.",
        variant: "destructive",
      });
    } finally {
      isUpdatingRef.current = false;
      setDraggedItem(null);
      setDragOverTarget(null);
    }
  }, [enabled, draggedItem, onDrop, toast, preferredSchedule]);

  return {
    draggedItem,
    dragOverTarget,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    isDragging: !!draggedItem,
  };
}

