interface ToneProfile {
  name: string;
  before: number;
  after: number;
}

interface PostComparison {
  beforePreview: {
    thumbnail?: string;
    caption: string;
    engagement: number;
  };
  afterPreview: {
    thumbnail?: string;
    caption: string;
    engagement: number;
  };
  improvement: string;
}

interface LearningMilestoneData {
  daysSinceStart: number;
  brandFidelityImprovement: {
    before: number;
    after: number;
    improvement: number;
  };
  topPerformerType: string;
  audienceInsight: string;
  toneProfileChanges: ToneProfile[];
  postExample?: PostComparison;
  whatChanged: string;
}

export const mockLearningMilestone: LearningMilestoneData = {
  daysSinceStart: 30,
  brandFidelityImprovement: {
    before: 84,
    after: 94,
    improvement: 23,
  },
  topPerformerType: "Reels + testimonials (now prioritized)",
  audienceInsight:
    "Your followers are 40% more likely to comment on educational content",
  toneProfileChanges: [
    { name: "Professional", before: 80, after: 75 },
    { name: "Warm", before: 60, after: 70 },
    { name: "Witty", before: 40, after: 65 },
  ],
  postExample: {
    beforePreview: {
      thumbnail: "/placeholder.svg",
      caption: "Check out our new product features...",
      engagement: 450,
    },
    afterPreview: {
      thumbnail: "/placeholder.svg",
      caption:
        "Behind the scenes: Here's how we built this feature based on YOUR feedback...",
      engagement: 603,
    },
    improvement: "+34%",
  },
  whatChanged:
    "Based on your top 30 posts, we learned you connect more with customers when you include personal stories.",
};

