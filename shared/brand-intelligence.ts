export interface BrandIntelligence {
  id: string;
  brandId: string;
  // Note: brandProfile field kept for API backward compatibility; internally uses BrandContext
  brandProfile: {
    usp: string[];
    differentiators: string[];
    coreValues: string[];
    targetAudience: {
      demographics: Record<string, string>;
      psychographics: string[];
      painPoints: string[];
      interests: string[];
    };
    brandPersonality: {
      traits: string[];
      tone: string;
      voice: string;
      communicationStyle: string;
    };
    visualIdentity: {
      colorPalette: string[];
      typography: string[];
      imageStyle: string[];
      logoGuidelines: string;
    };
  };
  competitorInsights: {
    primaryCompetitors: CompetitorProfile[];
    benchmarks: {
      avgEngagementRate: number;
      avgPostingFrequency: number;
      topContentThemes: string[];
      bestPostingTimes: Record<string, string[]>;
    };
    gapAnalysis: {
      contentGaps: string[];
      opportunityAreas: string[];
      differentiationOpportunities: string[];
    };
  };
  audienceInsights: {
    activityPatterns: Record<string, {
      peakHours: string[];
      peakDays: string[];
      timezone: string;
      engagementHeatmap: Array<{ hour: number; day: number; score: number }>;
    }>;
    contentPreferences: {
      topPerformingTypes: string[];
      engagementTriggers: string[];
      preferredLength: number;
      hashtagEffectiveness: Record<string, number>;
    };
    growthDrivers: {
      followerGrowthTriggers: string[];
      viralContentPatterns: string[];
      engagementBoosterTactics: string[];
    };
  };
  contentIntelligence: {
    performanceCorrelations: {
      timeVsEngagement: Array<{ time: string; avgEngagement: number }>;
      contentTypeVsGrowth: Array<{ type: string; growthImpact: number }>;
      hashtagVsReach: Array<{ hashtag: string; reachMultiplier: number }>;
    };
    successPatterns: {
      topPerformingContent: ContentPerformancePattern[];
      failurePatterns: ContentPerformancePattern[];
      improvementOpportunities: string[];
    };
  };
  recommendations: {
    strategic: StrategicRecommendation[];
    tactical: TacticalRecommendation[];
    contentSuggestions: ContentSuggestion[];
    timingOptimization: TimingRecommendation[];
  };
  lastAnalyzed: string;
  nextAnalysis: string;
  confidenceScore: number;
}

export interface CompetitorProfile {
  id: string;
  name: string;
  handle: string;
  platform: string;
  followers: number;
  avgEngagement: number;
  postingFrequency: number;
  contentThemes: string[];
  strengths: string[];
  weaknesses: string[];
  lastAnalyzed: string;
}

export interface ContentPerformancePattern {
  id: string;
  contentType: string;
  platform: string;
  avgEngagement: number;
  reachMultiplier: number;
  successFactors: string[];
  examples: string[];
}

export interface StrategicRecommendation {
  id: string;
  type: 'positioning' | 'differentiation' | 'audience_expansion' | 'content_strategy';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  timeframe: string;
  expectedOutcome: string;
  reasoning: string;
}

export interface TacticalRecommendation {
  id: string;
  type: 'content_optimization' | 'posting_schedule' | 'hashtag_strategy' | 'engagement_tactics';
  title: string;
  action: string;
  expectedImpact: string;
  platform: string;
  priority: 'high' | 'medium' | 'low';
}

export interface ContentSuggestion {
  id: string;
  contentType: string;
  platform: string;
  suggestedTopic: string;
  angle: string;
  reasoning: string;
  expectedEngagement: number;
  bestPostingTime: string;
  recommendedHashtags: string[];
}

export interface TimingRecommendation {
  platform: string;
  optimalTimes: string[];
  timezone: string;
  reasoning: string;
  expectedUplift: number;
}

export interface BrandIntelligenceUpdate {
  brandId: string;
  competitorData?: unknown[];
  performanceData?: unknown[];
  audienceData?: unknown[];
  feedbackData?: {
    recommendationId: string;
    action: 'accepted' | 'rejected' | 'modified';
    feedback?: string;
  }[];
}
