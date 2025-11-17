/**
 * Shared Review Types
 * Used by both client and server for review management
 */

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

export interface ReviewListResponse {
  reviews: Review[];
  total: number;
  stats: {
    total: number;
    positive: number;
    neutral: number;
    negative: number;
    needsReply: number;
    avgRating: number;
  };
}

