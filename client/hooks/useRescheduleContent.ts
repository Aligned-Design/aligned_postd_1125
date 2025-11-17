/**
 * useRescheduleContent Hook
 * 
 * Handles rescheduling content via the API.
 */

import { useCallback, useState, useEffect } from "react";
import { useCurrentBrand } from "@/hooks/useCurrentBrand";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { checkPreferredSchedule, type PreferredPostingSchedule } from "@/lib/postingScheduleUtils";

interface RescheduleParams {
  jobId: string;
  scheduledAt: string; // ISO 8601 datetime string
}

export function useRescheduleContent() {
  const { brandId } = useCurrentBrand();
  const queryClient = useQueryClient();
  const [schedule, setSchedule] = useState<PreferredPostingSchedule | null>(null);

  // Load preferred posting schedule
  useEffect(() => {
    if (!brandId) return;

    // Validate brandId is a valid UUID before making the request
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(brandId)) {
      console.warn("[useRescheduleContent] Invalid brandId, skipping schedule fetch:", brandId);
      return;
    }

    const loadSchedule = async () => {
      try {
        const response = await fetch(`/api/brands/${brandId}/posting-schedule`);
        if (response.ok) {
          const data = await response.json();
          if (data.schedule) {
            setSchedule(data.schedule);
          }
        }
      } catch (error) {
        console.error("Failed to load posting schedule:", error);
      }
    };

    loadSchedule();
  }, [brandId]);

  const mutation = useMutation({
    mutationFn: async ({ jobId, scheduledAt }: RescheduleParams) => {
      const response = await fetch(`/api/publishing/jobs/${jobId}/schedule`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          scheduledAt,
          brandId: brandId,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Failed to update schedule" }));
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries to refresh calendar data
      queryClient.invalidateQueries({ queryKey: ["publishing-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
    },
  });

  const reschedule = useCallback(
    async (jobId: string, target: { date: string; time?: string }) => {
      // Combine date and time into ISO 8601 datetime
      const dateTime = target.time
        ? new Date(`${target.date}T${target.time}`).toISOString()
        : new Date(`${target.date}T12:00:00`).toISOString();

      await mutation.mutateAsync({
        jobId,
        scheduledAt: dateTime,
      });
    },
    [mutation]
  );

  // Check if a scheduled time is within preferred schedule
  const checkSchedule = useCallback(
    (scheduledAt: Date | string) => {
      return checkPreferredSchedule(scheduledAt, schedule);
    },
    [schedule]
  );

  return {
    reschedule,
    checkSchedule,
    isLoading: mutation.isPending,
    error: mutation.error,
    preferredSchedule: schedule,
  };
}

