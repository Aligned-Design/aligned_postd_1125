export type Platform = 'instagram' | 'facebook' | 'linkedin' | 'twitter' | 'tiktok' | 'google_business' | 'pinterest' | 'youtube';
export type UserRole = 'admin' | 'manager' | 'client';

export interface AnalyticsMetric {
  id: string;
  brandId: string;
  platform: Platform;
  postId?: string;
  date: string;
  metrics: {
    reach: number;
    impressions: number;
    engagement: number;
    likes: number;
    comments: number;
    shares: number;
    saves?: number;
    clicks: number;
    followers: number;
    followerGrowth: number;
    ctr: number;
    engagementRate: number;
    videoViews?: number;
    videoCompletionRate?: number;
  };
  metadata: {
    postType: 'image' | 'video' | 'carousel' | 'text' | 'story' | 'reel';
    hashtags: string[];
    contentCategory: string;
    utmParams?: Record<string, string>;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AdvisorInsight {
  id: string;
  brandId: string;
  type: 'recommendation' | 'observation' | 'alert' | 'forecast';
  category: 'content' | 'timing' | 'platform' | 'audience' | 'campaign';
  title: string;
  description: string;
  confidence: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  priority: number;
  actionable: boolean;
  suggestions: string[];
  evidence: {
    metric: string;
    change: number;
    timeframe: string;
    comparison: string;
  };
  feedback?: 'accepted' | 'rejected' | 'implemented';
  createdAt: string;
  expiresAt?: string;
}

export interface AnalyticsGoal {
  id: string;
  brandId: string;
  metric: string;
  target: number;
  current: number;
  period: 'month' | 'quarter' | 'year';
  startDate: string;
  endDate: string;
  status: 'on_track' | 'behind' | 'ahead' | 'completed';
  progress: number;
  createdAt: string;
}

export interface AnalyticsSummary {
  brandId: string;
  period: 'day' | 'week' | 'month' | 'quarter' | 'year';
  startDate: string;
  endDate: string;
  platforms: Platform[];
  totalMetrics: {
    reach: number;
    engagement: number;
    followers: number;
    posts: number;
    avgEngagementRate: number;
    topPerformingPost?: string;
    totalClicks: number;
    conversions?: number;
  };
  platformBreakdown: Record<Platform, Partial<AnalyticsMetric['metrics']>>;
  trends: {
    reachGrowth: number;
    engagementGrowth: number;
    followerGrowth: number;
  };
  topContent: TopPerformingContent[];
  insights: AdvisorInsight[];
}

export interface TopPerformingContent {
  postId: string;
  platform: Platform;
  contentType: string;
  thumbnail?: string;
  caption: string;
  publishedAt: string;
  metrics: {
    reach: number;
    engagement: number;
    engagementRate: number;
    clicks: number;
  };
  whyItWorked: string; // AI explanation
}

export interface AnalyticsAlert {
  id: string;
  brandId: string;
  type: 'spike' | 'drop' | 'anomaly' | 'goal' | 'threshold';
  metric: string;
  currentValue: number;
  previousValue: number;
  changePercent: number;
  threshold?: number;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  suggestions: string[];
  acknowledged: boolean;
  createdAt: string;
}

export interface ChartData {
  type: 'line' | 'bar' | 'donut' | 'bubble' | 'heatmap';
  title: string;
  data: unknown[];
  config: {
    xAxis?: string;
    yAxis?: string;
    groupBy?: string;
    colors?: string[];
    format?: string;
  };
}

export interface BenchmarkData {
  category: string; // 'wellness', 'finance', 'retail', etc.
  metrics: {
    avgEngagementRate: number;
    avgReach: number;
    avgPostFrequency: number;
    topPerformingFormats: string[];
  };
  percentiles: {
    top10: number;
    top25: number;
    median: number;
    bottom25: number;
  };
}

// Phase 2 – Issue 3: Simplified analytics response for basic analytics endpoint
// This matches what GET /api/analytics/:brandId actually returns
export interface AnalyticsSummaryResponse {
  summary: {
    reach: number;
    engagement: number;
    engagementRate: number;
    followers: number;
    topPlatform: string;
  };
  platforms: Record<string, PlatformMetricsData>;
  comparison: {
    engagementGrowth: number;
    followerGrowth: number;
  };
  timeframe: {
    days: number;
    startDate: string;
  };
  lastUpdated: string;
}

// Platform metrics data structure (returned by backend)
export interface PlatformMetricsData {
  reach?: number;
  engagement?: number;
  impressions?: number;
  clicks?: number;
  engagementRate?: number;
  followers?: number;
  followerGrowth?: number;
  posts?: number;
  [key: string]: unknown; // Allow additional platform-specific fields
}

// Full analytics response (for comprehensive analytics endpoints)
export interface AnalyticsResponse {
  summary: AnalyticsSummary;
  charts: ChartData[];
  insights: AdvisorInsight[];
  goals: AnalyticsGoal[];
  alerts: AnalyticsAlert[];
  forecast?: ContentForecast;
  benchmark?: BenchmarkData;
  heatmap?: EngagementHeatmap[];
}

export interface ContentForecast {
  brandId: string;
  period: string; // "next_month", "next_quarter"
  predictions: {
    reach: { value: number; confidence: number };
    engagement: { value: number; confidence: number };
    followers: { value: number; confidence: number };
    optimalPostCount: number;
  };
  recommendations: {
    bestDays: string[];
    bestTimes: string[];
    topFormats: string[];
    suggestedTopics: string[];
    platformMix: Record<Platform, number>; // percentage
  };
  scenarios: {
    conservative: ForecastScenario;
    expected: ForecastScenario;
    optimistic: ForecastScenario;
  };
}

export interface ForecastScenario {
  reach: number;
  engagement: number;
  followers: number;
  requiredPosts: number;
  description: string;
}

export interface EngagementHeatmap {
  dayOfWeek: number; // 0-6 (Sun-Sat)
  hour: number; // 0-23
  engagement: number;
  posts: number;
  avgEngagementRate: number;
}

export interface VoiceQuery {
  query: string;
  brandId: string;
  context?: 'overview' | 'content' | 'timing' | 'platform';
}

export interface VoiceResponse {
  answer: string;
  data?: unknown;
  suggestions?: string[];
  chartRecommendation?: string;
}

// Quality & Performance Audit Types
export interface PerformanceMetrics {
  route: string;
  loadTime: number;
  ttfb: number; // Time to First Byte
  fcp: number;  // First Contentful Paint
  lcp: number;  // Largest Contentful Paint
  cls: number;  // Cumulative Layout Shift
  tbt: number;  // Total Blocking Time
  inp: number;  // Interaction to Next Paint
  bundleSize: number;
  timestamp: string;
}

export interface QualityGate {
  id: string;
  category: 'performance' | 'security' | 'accessibility' | 'resilience' | 'data_integrity';
  name: string;
  threshold: number;
  unit: string;
  currentValue: number;
  status: 'pass' | 'fail' | 'warning';
  lastChecked: string;
  details?: string;
}

export interface AuditResult {
  id: string;
  type: 'lighthouse' | 'security' | 'accessibility' | 'performance' | 'resilience';
  route?: string;
  score: number;
  maxScore: number;
  status: 'pass' | 'fail' | 'warning';
  issues: AuditIssue[];
  timestamp: string;
  environment: 'development' | 'staging' | 'production';
}

export interface AuditIssue {
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: string;
  description: string;
  recommendation: string;
  impact: string;
  element?: string;
}

export interface ChaosTestResult {
  scenario: string;
  description: string;
  duration: number;
  passed: boolean;
  metrics: {
    errorRate: number;
    responseTime: number;
    availability: number;
  };
  issues: string[];
  timestamp: string;
}

export interface AccessibilityReport {
  route: string;
  score: number;
  violations: {
    critical: number;
    serious: number;
    moderate: number;
    minor: number;
  };
  details: AccessibilityViolation[];
  wcagLevel: 'A' | 'AA' | 'AAA';
  timestamp: string;
}

export interface AccessibilityViolation {
  id: string;
  severity: 'critical' | 'serious' | 'moderate' | 'minor';
  description: string;
  element: string;
  wcagCriterion: string;
  recommendation: string;
}

export interface SecurityScanResult {
  vulnerabilities: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  details: SecurityVulnerability[];
  owasp: {
    category: string;
    risk: 'critical' | 'high' | 'medium' | 'low';
    status: 'pass' | 'fail';
  }[];
  timestamp: string;
}

export interface SecurityVulnerability {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  cve?: string;
  package?: string;
  version?: string;
  fixedIn?: string;
  recommendation: string;
}

export interface LoadTestResult {
  scenario: string;
  duration: number;
  virtualUsers: number;
  requestsPerSecond: number;
  metrics: {
    avgResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    errorRate: number;
    throughput: number;
  };
  passed: boolean;
  timestamp: string;
}
