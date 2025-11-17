export interface AnalyticsPortalData {
  brandInfo: {
    name: string;
    logo?: string;
    colors: {
      primary: string;
      secondary: string;
    };
  };
  timeRange: {
    start: string;
    end: string;
    period: 'week' | 'month' | 'quarter' | 'year';
  };
  metrics: {
    reach: { current: number; previous: number; change: number };
    engagement: { current: number; previous: number; change: number };
    conversions: { current: number; previous: number; change: number };
    contentVolume: { current: number; previous: number; change: number };
    engagementRate: { current: number; previous: number; change: number };
  };
  charts: {
    reachOverTime: Array<{ date: string; value: number }>;
    engagementByPlatform: Array<{ platform: string; value: number }>;
    topContent: Array<{ id: string; title: string; engagement: number; reach: number }>;
    audienceGrowth: Array<{ date: string; followers: number }>;
  };
  contentPerformance: Array<{
    id: string;
    title: string;
    platform: string;
    publishedAt: string;
    metrics: {
      reach: number;
      engagement: number;
      clicks: number;
      saves: number;
    };
    canProvideFeedback: boolean;
  }>;
}

export interface ClientFeedback {
  id: string;
  contentId?: string;
  campaignId?: string;
  type: 'approval' | 'revision' | 'comment' | 'general';
  priority: 'low' | 'medium' | 'high';
  message: string;
  specificChanges?: Array<{
    section: string;
    currentText: string;
    suggestedText: string;
    reason: string;
  }>;
  attachments?: string[];
  status: 'pending' | 'acknowledged' | 'resolved';
  createdAt: string;
  updatedAt: string;
}

export interface ShareableAnalyticsLink {
  id: string;
  brandId: string;
  token: string;
  name: string;
  description?: string;
  includeMetrics: string[];
  dateRange: { start: string; end: string };
  expiresAt?: string;
  passwordProtected: boolean;
  allowDownload: boolean;
  viewCount: number;
  lastAccessedAt?: string;
  createdAt: string;
}

export interface CustomReport {
  id: string;
  name: string;
  description?: string;
  brandId: string;
  createdBy: string;
  schedule: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    dayOfWeek?: number; // 0-6 for weekly
    dayOfMonth?: number; // 1-31 for monthly
    time: string; // HH:MM format
    timezone: string;
  };
  content: {
    includeMetrics: string[];
    includePlatforms: string[];
    includeCharts: string[];
    customSections?: Array<{
      title: string;
      type: 'text' | 'metric' | 'chart';
      content: string;
    }>;
  };
  delivery: {
    format: 'pdf' | 'html' | 'csv';
    recipients: string[];
    subject: string;
    message?: string;
    attachAnalytics: boolean;
  };
  dateRange: {
    type: 'relative' | 'fixed';
    relativePeriod?: 'last_7_days' | 'last_30_days' | 'last_quarter';
    fixedStart?: string;
    fixedEnd?: string;
  };
  isActive: boolean;
  lastSent?: string;
  nextScheduled?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReportExecution {
  id: string;
  reportId: string;
  status: 'pending' | 'generating' | 'sent' | 'failed';
  scheduledAt: string;
  executedAt?: string;
  error?: string;
  recipients: string[];
  fileUrl?: string;
}
