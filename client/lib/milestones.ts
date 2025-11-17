export type MilestoneKey =
  | "onboarding_complete"
  | "first_integration"
  | "first_approval"
  | "first_publish"
  | "goal_met"
  | "agency_scale_5"
  | "month_1_anniversary";

export const milestoneCopy: Record<
  MilestoneKey,
  { title: string; body: string }
> = {
  onboarding_complete: {
    title: "Welcome aboard! 🎉",
    body: "Your Brand Guide is live. Time to create your first post.",
  },
  first_integration: {
    title: "All connected! 🔌",
    body: "Publishing is ready across your linked platforms.",
  },
  first_approval: {
    title: "First approval! ✅",
    body: "Your content is on-brand and ready to go.",
  },
  first_publish: {
    title: "Published! 🚀",
    body: "Your first post just went live. Check analytics for lift.",
  },
  goal_met: {
    title: "Goal achieved! 🏁",
    body: "Performance goal hit—AI has updated next week's plan.",
  },
  agency_scale_5: {
    title: "You're scaling smart. 📈",
    body: "You've reached 5 brands—pricing auto-adjusted to $99/brand.",
  },
  month_1_anniversary: {
    title: "One month in! 💫",
    body: "Thanks for building with us—here's to the next wins.",
  },
};
