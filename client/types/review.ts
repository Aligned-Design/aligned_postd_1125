export type ReviewSource = "google" | "facebook";
export type ReviewSentiment = "positive" | "neutral" | "negative";
export type ReplyStatus = "needs-reply" | "replied" | "flagged";

export interface Review {
  id: string;
  source: ReviewSource;
  authorName: string;
  authorAvatar?: string;
  rating: number; // 1-5 stars
  text: string;
  sentiment: ReviewSentiment;
  replyStatus: ReplyStatus;
  createdDate: string;
  repliedDate?: string;
  replyText?: string;
  brandId: string;
  flaggedReason?: string;
}

export interface BrandGuide {
  voiceTone: "professional" | "friendly" | "casual" | "inspirational";
  messagingPillars: string[];
  keyDifferentiators: string[];
  callToActionStyle: string;
  doNotSayList: string[];
}

export interface AutoReplySettings {
  enableAutoReply: boolean;
  replyRules: {
    fiveStars?: string; // Template for 5-star replies
    fourStars?: string;
    threeStars?: string;
    twoStars?: string; // Usually needs personal attention
    oneStar?: string; // Usually needs personal attention
  };
  includeFollowUpLinks: boolean;
  addCTA: boolean;
}

export interface ReviewAdvisorInsight {
  id: string;
  type: "positive" | "negative" | "action-required";
  title: string;
  description: string;
  count?: number;
  actionLabel?: string;
  priority: "high" | "medium" | "low";
}

// Sentiment detection helper
export function detectSentiment(rating: number, textLength: number): ReviewSentiment {
  // Hybrid approach: star-based + text analysis
  if (rating >= 4) {
    return textLength > 10 ? "positive" : "positive"; // Short positive = genuine
  }
  if (rating === 3) {
    return textLength > 20 ? "negative" : "neutral"; // 3 stars with long text = concern
  }
  return "negative";
}

export const MOCK_BRAND_GUIDE: BrandGuide = {
  voiceTone: "professional",
  messagingPillars: [
    "Empowering brands through technology",
    "Customer-centric approach",
    "Innovation and excellence",
  ],
  keyDifferentiators: [
    "Easy-to-use platform",
    "Expert support",
    "Comprehensive analytics",
  ],
  callToActionStyle: "collaborative",
  doNotSayList: ["cheap", "basic", "simple"],
};

export const MOCK_AUTO_REPLY_SETTINGS: AutoReplySettings = {
  enableAutoReply: false,
  replyRules: {
    fiveStars: "Thank you for the wonderful review! We're thrilled to hear about your positive experience.",
    fourStars: "We appreciate your feedback! We're glad we could help.",
    threeStars: "Thank you for your review. We'd love to understand how we can improve.",
    twoStars: "We're sorry to hear you had this experience. Let's discuss how we can help.",
    oneStar: "We sincerely apologize. Your feedback is important to us.",
  },
  includeFollowUpLinks: true,
  addCTA: true,
};
