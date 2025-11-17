export interface ClientUser {
  id: string;
  email: string;
  name: string;
  brandId: string;
  role: 'approver' | 'viewer';
  permissions: {
    viewAnalytics: boolean;
    viewContent: boolean;
    uploadMedia: boolean;
    leaveComments: boolean;
    approveContent: boolean;
    viewSchedule: boolean;
    viewReviews: boolean;
    viewEvents: boolean;
  };
  lastLoginAt?: string;
  inviteToken?: string;
  tokenExpiresAt?: string;
  createdAt: string;
}

export interface ClientSession {
  userId: string;
  brandId: string;
  role: 'approver' | 'viewer';
  permissions: ClientUser['permissions'];
  agencyBranding: {
    companyName: string;
    logoUrl?: string;
    primaryColor: string;
    domain: string;
  };
  expiresAt: string;
}

export interface ContentItem {
  id: string;
  platform: 'instagram' | 'facebook' | 'linkedin' | 'twitter' | 'tiktok';
  content: string;
  status: 'draft' | 'in_review' | 'approved' | 'scheduled' | 'published' | 'rejected';
  scheduledFor?: string;
  publishedAt?: string;
  thumbnail?: string;
  bfsScore?: number;
  complianceBadges: string[];
  metrics?: {
    reach: number;
    engagement: number;
    likes: number;
    comments: number;
    shares: number;
  };
  comments: ContentComment[];
  approvalRequired: boolean;
  approvedBy?: string;
  approvedAt?: string;
  requestedChanges?: string;
  version: number;
  createdAt?: string; // When content was created/submitted for review
  workflowInstance?: unknown; // WorkflowInstance - using any to avoid circular imports
}

export interface ContentComment {
  id: string;
  contentId: string;
  userId: string;
  userName: string;
  userRole: 'client' | 'agency' | 'admin';
  message: string;
  isInternal: boolean;
  createdAt: string;
}

export interface ClientDashboardData {
  brandInfo: {
    name: string;
    logo?: string;
    favicon?: string;
    colors: {
      primary: string;
      secondary: string;
    };
  };
  agencyInfo: {
    name: string;
    logo?: string;
    contactEmail: string;
    supportUrl?: string;
  };
  metrics: {
    totalReach: number;
    totalEngagement: number;
    followers: number;
    postsThisMonth: number;
    engagementRate: number;
    pendingApprovals: number;
    campaignProgress: number;
    growth: {
      reach: number;
      engagement: number;
      followers: number;
    };
  };
  aiInsight: {
    title: string;
    description: string;
    impact: 'positive' | 'neutral' | 'actionable';
  };
  recentContent: ContentItem[];
  upcomingPosts: ContentItem[];
  pendingApprovals: ContentItem[];
  topPerformingContent: ContentItem[];
  recentComments: ContentComment[];
  quickActions: {
    approvalsNeeded: number;
    reviewsAvailable: number;
    eventsUpcoming: number;
  };
}

export interface ReviewItem {
  id: string;
  platform: 'google' | 'facebook' | 'yelp';
  rating: number;
  text: string;
  author: string;
  date: string;
  responded: boolean;
  suggestedReply?: string;
  sentiment: 'positive' | 'neutral' | 'negative';
}

export interface EventItem {
  id: string;
  title: string;
  platform: 'facebook' | 'google_business';
  date: string;
  attendees: number;
  rsvpCount: number;
  status: 'upcoming' | 'active' | 'completed';
}

export interface ApprovalAction {
  contentId: string;
  action: 'approve' | 'request_changes';
  comment?: string;
  batchId?: string;
}

export interface ClientPortalConfig {
  brandId: string;
  modules: {
    calendar: boolean;
    analytics: boolean;
    reviews: boolean;
    events: boolean;
    approvals: boolean;
  };
  branding: {
    logoUrl?: string;
    primaryColor: string;
    companyName: string;
    domain: string;
    showPoweredBy: boolean;
  };
  settings: {
    sessionTimeoutDays: number;
    autoApproveThreshold: number; // BFS score
    allowBatchApprovals: boolean;
  };
}
