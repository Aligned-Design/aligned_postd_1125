import { useEffect, useRef } from "react";
import { useConfetti } from "@/hooks/useConfetti";
import { useMilestones } from "@/hooks/useMilestones";
import { toast } from "@/hooks/use-toast";
import { milestoneCopy, type MilestoneKey } from "@/lib/milestones";

// Frequency cap: max 2 celebrations per minute
const CELEBRATION_RATE_LIMIT = 2;
const CELEBRATION_WINDOW_MS = 60000; // 1 minute

export default function MilestoneCelebrator() {
  const { fire, burst } = useConfetti();
  const { newlyUnlocked, acknowledgeMilestone } = useMilestones();
  const celebrationTimestamps = useRef<number[]>([]);

  useEffect(() => {
    if (newlyUnlocked.length === 0) return;

    // Clean up old timestamps outside the window
    const now = Date.now();
    celebrationTimestamps.current = celebrationTimestamps.current.filter(
      (timestamp) => now - timestamp < CELEBRATION_WINDOW_MS,
    );

    // Process each newly unlocked milestone
    newlyUnlocked.forEach((key: MilestoneKey) => {
      // Check rate limit
      if (celebrationTimestamps.current.length >= CELEBRATION_RATE_LIMIT) {
        console.log(`Rate limit reached - deferring celebration for ${key}`);
        return;
      }

      // Record this celebration
      celebrationTimestamps.current.push(now);

      // 1) Fire confetti
      const burstMilestones: MilestoneKey[] = [
        "onboarding_complete",
        "first_publish",
        "agency_scale_5",
        "month_1_anniversary",
      ];

      if (burstMilestones.includes(key)) {
        burst();
      } else {
        fire();
      }

      // 2) Show toast notification
      const copy = milestoneCopy[key];
      toast({
        title: copy.title,
        description: copy.body,
        duration: 6000,
      });

      // 3) Track analytics
      if (window.posthog) {
        window.posthog.capture("milestone_unlocked", { milestone: key });
      }

      // 4) Acknowledge milestone so it doesn't show again
      setTimeout(() => {
        acknowledgeMilestone(key);
      }, 100);
    });
  }, [newlyUnlocked, burst, fire, acknowledgeMilestone]);

  return null; // Headless component
}
