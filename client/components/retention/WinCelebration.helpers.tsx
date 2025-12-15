import { Trophy } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import confetti from "canvas-confetti";

interface WinData {
  type:
    | "engagement_milestone"
    | "personal_record"
    | "weekly_win"
    | "goal_achieved";
  title: string;
  description: string;
  metric?: {
    label: string;
    value: string;
    comparison?: string;
  };
  reason?: string;
  suggestedAction?: string;
  shareText?: string;
  postUrl?: string;
}

// Toast version for smaller wins
export function celebrateWinToast(
  win: Pick<WinData, "title" | "description" | "metric">,
) {
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  if (!prefersReducedMotion) {
    confetti({
      particleCount: 50,
      spread: 50,
      origin: { y: 0.7 },
      colors: ["#4F46E5", "#818CF8"],
    });
  }

  // ✅ FIX: toast title expects string, not ReactNode. Use description for the JSX content
  toast({
    title: win.title, // Use string title
    description: (
      <div className="flex items-center gap-2">
        <Trophy className="h-4 w-4 text-amber-500" />
        <span>{win.description}</span>
      </div>
    ),
    duration: 6000,
  });

  if (window.posthog) {
    window.posthog.capture("win_toast_shown", { title: win.title });
  }
}

// Example wins
export const exampleWins: WinData[] = [
  {
    type: "engagement_milestone",
    title: "🎉 Your post hit 1K likes!",
    description: "This is your most engaged post this month",
    metric: {
      label: "Total Engagement",
      value: "1,234",
      comparison: "+156% vs average",
    },
    shareText:
      "Just hit 1K engagement with @AlignedAI. Here's the post that did it...",
    postUrl: "/content-queue/post-123",
  },
  {
    type: "personal_record",
    title: "📈 This is your best-performing post!",
    description: "You just set a new personal record",
    metric: {
      label: "Engagement",
      value: "2.3K",
      comparison: "New Record!",
    },
    reason:
      "High engagement because: Testimonial format + posted at 2 PM + featured customer story",
    suggestedAction: "Create 2 more posts like this next week",
  },
  {
    type: "weekly_win",
    title: "You crushed it this week! 🏆",
    description: "Your best week yet",
    metric: {
      label: "Weekly Engagement",
      value: "8.9K",
      comparison: "+45% vs last week",
    },
    suggestedAction:
      "Keep the momentum going - your audience is loving your content!",
  },
];

