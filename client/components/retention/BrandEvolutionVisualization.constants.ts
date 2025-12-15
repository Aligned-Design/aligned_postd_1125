interface VoiceProfile {
  trait: string;
  month1: number;
  now: number;
  change: string;
}

interface ColorPalette {
  color: string;
  name: string;
}

interface ContentTypePerformance {
  type: string;
  month1Engagement: number;
  nowEngagement: number;
  change: number;
}

interface BrandEvolutionData {
  voiceProfile: VoiceProfile[];
  colorEvolution: {
    month1: ColorPalette[];
    now: ColorPalette[];
  };
  contentPerformance: ContentTypePerformance[];
  insight: string;
  systemExplanation: string;
}

// ✅ DEV/TEST ONLY: Mock brand evolution data for development and testing
// This is NOT used in production - insights-roi/page.tsx shows "coming soon" instead
// Keep for Storybook examples and tests only
export const mockBrandEvolutionData: BrandEvolutionData = {
  voiceProfile: [
    { trait: "Professional", month1: 80, now: 75, change: "-5%" },
    { trait: "Warm", month1: 60, now: 70, change: "+10%" },
    { trait: "Data-Driven", month1: 50, now: 65, change: "+15%" },
    { trait: "Witty", month1: 40, now: 55, change: "+15%" },
  ],
  colorEvolution: {
    month1: [
      { color: "#3B82F6", name: "Blue" },
      { color: "#6B7280", name: "Gray" },
      { color: "#1F2937", name: "Dark Gray" },
    ],
    now: [
      { color: "#3B82F6", name: "Blue" },
      { color: "#F97316", name: "Orange" },
      { color: "#10B981", name: "Green" },
    ],
  },
  contentPerformance: [
    {
      type: "Blog-style Posts",
      month1Engagement: 400,
      nowEngagement: 520,
      change: 30,
    },
    {
      type: "Testimonials + Reels",
      month1Engagement: 650,
      nowEngagement: 1200,
      change: 85,
    },
    {
      type: "Behind-the-Scenes",
      month1Engagement: 320,
      nowEngagement: 890,
      change: 178,
    },
  ],
  insight:
    "Your brand is becoming more human and less corporate. Engagement +34% as a result.",
  systemExplanation:
    "Based on your top 100 posts and audience feedback, we updated how we generate content for you. Your audience responded positively to warmer tones and personal stories, so we adjusted the AI to prioritize these elements while maintaining your professional foundation.",
};

