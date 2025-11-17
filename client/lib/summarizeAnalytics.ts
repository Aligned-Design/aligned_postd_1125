// AI Summary generator for Aligned Analytics Reports
// Generates positive, contextual summaries based on dashboard metrics

export interface AnalyticsSummaryData {
  analyticsMetrics?: {
    totalReach: number;
    totalEngagement: number;
    engagementRate: number;
    followerGrowth: number;
  };
  campaignData?: {
    activeCampaigns: number;
    totalPerformancePercent: number;
  };
  contentQueueData?: {
    totalScheduled: number;
    topPerformingContent: string;
  };
}

const POSITIVE_PHRASES = {
  reach: [
    "Your content reached",
    "Strong audience reach of",
    "Impressive reach across",
    "Extended reach to",
    "Expanded audience impact with",
  ],
  engagement: [
    "engagement metrics demonstrate strong audience connection",
    "engagement shows active audience participation",
    "strong engagement indicates quality content resonance",
    "solid engagement reflects audience interest",
    "engagement rates reflect audience alignment",
  ],
  followers: [
    "growing community of followers",
    "expanding audience base",
    "strengthening community presence",
    "building loyal follower base",
    "attracting quality followers",
  ],
  campaigns: [
    "Your active campaigns are performing well",
    "Campaigns demonstrating solid performance",
    "Strong campaign execution across channels",
    "Well-executed campaign strategy",
    "Effective campaign momentum",
  ],
  content: [
    "Strategic content mix resonating with audience",
    "Quality content driving engagement",
    "Diverse content strategy performing well",
    "Content strategy showing strong results",
    "Curated content attracting audience attention",
  ],
};

function selectRandomPhrase(phrases: string[]): string {
  return phrases[Math.floor(Math.random() * phrases.length)];
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

export function generateAIAnalyticsSummary(data: AnalyticsSummaryData, maxWords: number = 75): string {
  const summaryParts: string[] = [];

  // Reach analysis
  if (data.analyticsMetrics?.totalReach) {
    const reachPhrase = selectRandomPhrase(POSITIVE_PHRASES.reach);
    summaryParts.push(
      `${reachPhrase} ${formatNumber(data.analyticsMetrics.totalReach)} across your channels.`
    );
  }

  // Engagement analysis
  if (data.analyticsMetrics?.engagementRate && data.analyticsMetrics.engagementRate > 0) {
    const engagementPhrase = selectRandomPhrase(POSITIVE_PHRASES.engagement);
    summaryParts.push(
      `With a ${data.analyticsMetrics.engagementRate.toFixed(1)}% engagement rate, your ${engagementPhrase}.`
    );
  }

  // Follower growth analysis
  if (data.analyticsMetrics?.followerGrowth && data.analyticsMetrics.followerGrowth > 0) {
    const followerPhrase = selectRandomPhrase(POSITIVE_PHRASES.followers);
    summaryParts.push(`You're building a ${followerPhrase} with ${data.analyticsMetrics.followerGrowth}% growth.`);
  }

  // Campaign analysis
  if (data.campaignData?.activeCampaigns && data.campaignData.activeCampaigns > 0) {
    const campaignPhrase = selectRandomPhrase(POSITIVE_PHRASES.campaigns);
    summaryParts.push(
      `${campaignPhrase} at ${data.campaignData.totalPerformancePercent || 15}% above baseline.`
    );
  }

  // Content analysis
  if (data.contentQueueData?.topPerformingContent) {
    const contentPhrase = selectRandomPhrase(POSITIVE_PHRASES.content);
    summaryParts.push(
      `${contentPhrase}, with "${data.contentQueueData.topPerformingContent}" as your standout performer.`
    );
  }

  // Fallback summary if no data
  if (summaryParts.length === 0) {
    return "Your analytics show solid performance across all channels. Continue leveraging your top-performing content types and maintain consistent posting schedules for sustained growth.";
  }

  // Join parts and trim to word limit
  let summary = summaryParts.join(" ");

  // Truncate to word limit
  const words = summary.split(" ");
  if (words.length > maxWords) {
    summary = words.slice(0, maxWords).join(" ") + "...";
  }

  return summary;
}

// Mock data generator for demo
export function generateMockAnalyticsSummary(): string {
  const mockData: AnalyticsSummaryData = {
    analyticsMetrics: {
      totalReach: 382000,
      totalEngagement: 20500,
      engagementRate: 5.4,
      followerGrowth: 3.9,
    },
    campaignData: {
      activeCampaigns: 2,
      totalPerformancePercent: 18,
    },
    contentQueueData: {
      totalScheduled: 24,
      topPerformingContent: "Behind-the-Scenes Team Culture",
    },
  };

  return generateAIAnalyticsSummary(mockData, 100);
}
