export type Theme = 'light' | 'dark' | 'auto';
export type Language = 'en' | 'es' | 'fr' | 'de';
export type DateTimeFormat = '12h' | '24h';
export type DashboardDensity = 'comfortable' | 'compact';
export type CardAnimation = 'smooth' | 'minimal' | 'off';
export type AnalyticsStyle = 'graph-heavy' | 'summary-only';
export type FontSize = 'small' | 'medium' | 'large';
export type NotificationFrequency = 'daily' | 'weekly' | 'monthly' | 'off';
export type ReportFormat = 'html' | 'pdf' | 'share-link';
export type AIInsightLevel = 'lite' | 'detailed';
export type TonePreset = 'safe' | 'bold' | 'edgy';
export type VoiceAdaptationSpeed = 'conservative' | 'balanced' | 'adaptive';
export type CommentTagAlerts = 'immediate' | 'digest' | 'off';
export type AutoSaveInterval = '5s' | '30s' | 'manual';
export type ApprovalWorkflow = '1-step' | '2-step' | 'client-signoff';
export type SessionTimeout = '1h' | '8h' | '24h';
export type PostFailureHandling = 'auto-retry' | 'notify-only' | 'pause-schedule';

export interface BasicPreferences {
  // General
  theme: Theme;
  language: Language;
  timezone: string;
  dateTimeFormat: DateTimeFormat;
  defaultBrandId?: string;
  homePageView: 'dashboard' | 'calendar' | 'analytics';

  // Notifications & Communication
  emailNotifications: {
    approvals: boolean;
    newReview: boolean;
    failedPost: boolean;
    analyticsDigest: boolean;
  };
  digestFrequency: NotificationFrequency;
  appNotifications: boolean;
  slackIntegration?: {
    enabled: boolean;
    webhookUrl?: string;
    channels: string[];
  };
  inAppMessageSounds: boolean;

  // Display & Layout
  dashboardDensity: DashboardDensity;
  cardAnimation: CardAnimation;
  analyticsStyle: AnalyticsStyle;
  fontSize: FontSize;
  quickActionsOnHover: boolean;
}

export interface AdvancedPreferences {
  // Analytics & AI
  analyticsEmailCadence: string; // cron expression or preset
  reportFormat: ReportFormat;
  aiInsightLevel: AIInsightLevel;
  showBenchmarks: boolean;
  includeCompetitorMentions: boolean;

  // AI Content Settings
  tonePreset: TonePreset;
  voiceAdaptationSpeed: VoiceAdaptationSpeed;
  autoGenerateNextMonthPlan: boolean;
  autoApproveAISuggestions: boolean;
  languageStyle: 'us-english' | 'uk-english' | 'custom';
  aiRegenerationTriggers: 'manual' | 'auto-on-low-bfs' | 'prompted';
  draftVisibility: 'internal-only' | 'client-visible';

  // Communication & Collaboration
  commentTagAlerts: CommentTagAlerts;
  clientCommentVisibility: boolean;
  autoMeetingSummaries: boolean;
  taskIntegration: 'asana' | 'clickup' | 'trello' | 'none';
  meetingNotesToAI: 'always' | 'ask-each-time';

  // Workflow & Automation
  autoSaveInterval: AutoSaveInterval;
  approvalWorkflow: ApprovalWorkflow;
  graceWindowHours: 24 | 48 | 72;
  postFailureHandling: PostFailureHandling;
  contentQuotaOverride?: Record<string, number>; // platform -> posts per week

  // Security & Privacy
  twoFactorAuth: boolean;
  sessionTimeout: SessionTimeout;
  ipWhitelist: string[];
  autoDataExport: boolean;
  dataExportFrequency: NotificationFrequency;
}

export interface AgencyOverrides {
  defaultSafetyMode: TonePreset;
  globalBrandQuotaTemplate: Record<string, number>;
  defaultAnalyticsEmailSchedule: string;
  clientAccessControls: {
    uploads: boolean;
    reviews: boolean;
    events: boolean;
    analytics: boolean;
    pipeline: boolean;
  };
  whiteLabel: boolean;
  customEmailSender?: {
    name: string;
    domain: string;
  };
  defaultReportSections: string[];
  forceMFA: boolean;
  disableAutoAIPlan: boolean;
  maintenanceMode: boolean;
}

export interface UserPreferences {
  id: string;
  userId: string;
  brandId?: string; // null for global user preferences

  // UI & Experience
  interface: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    timezone: string;
    dateFormat: string;
    showAdvancedOptions: boolean;
    defaultDashboardView: string;
    compactMode: boolean;
  };

  // AI & Content Generation
  aiSettings: {
    defaultTone: 'professional' | 'casual' | 'friendly' | 'authoritative' | 'playful';
    brandVoice: {
      personality: string[];
      avoidWords: string[];
      preferredStyle: 'concise' | 'detailed' | 'conversational';
      industryContext: string;
    };
    creativityLevel: 'conservative' | 'balanced' | 'creative' | 'experimental';
    strictBrandMode: boolean;
    autoGenerateHashtags: boolean;
    maxContentLength: { [platform: string]: number };
  };

  // Publishing & Automation
  publishing: {
    defaultPlatforms: string[];
    postingFrequency: {
      [platform: string]: {
        postsPerWeek: number;
        preferredTimes: string[];
        timezone: string;
      };
    };
    autoApproval: {
      enabled: boolean;
      rules: {
        minBrandFitScore: number;
        requiresReview: string[]; // content types that always need review
        autoPublishScore: number;
      };
    };
    schedulingBuffer: number; // hours before auto-publish
  };

  // Notifications & Alerts
  notifications: {
    email: {
      enabled: boolean;
      frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
      types: {
        contentReady: boolean;
        approvalNeeded: boolean;
        analyticsReports: boolean;
        systemUpdates: boolean;
      };
    };
    inApp: {
      enabled: boolean;
      types: string[];
    };
    slack: {
      enabled: boolean;
      webhookUrl?: string;
      channelMentions: boolean;
    };
  };

  // Team & Permissions
  teamSettings: {
    role: 'admin' | 'manager' | 'creator' | 'viewer';
    permissions: {
      canCreateContent: boolean;
      canApproveContent: boolean;
      canEditSettings: boolean;
      canInviteUsers: boolean;
      canViewAnalytics: boolean;
      canExportData: boolean;
    };
    workflowPreferences: {
      requiresApproval: boolean;
      approvalWorkflow: string[]; // ordered list of approval steps
    };
  };

  // Advanced Settings with experimental section
  advanced?: {
    analytics: {
      reportingInterval: 'daily' | 'weekly' | 'monthly';
      customMetrics: string[];
      dataRetention: number; // days
    };
    api: {
      rateLimits: { [endpoint: string]: number };
      webhookEndpoints: string[];
    };
    experimental?: {
      betaFeatures: string[];
      aiModelVersion: string;
      advancedPromptSettings: boolean;
    };
  };

  createdAt: string;
  updatedAt: string;
  lastSyncedAt: string;
}

export interface PreferenceUpdate {
  section: keyof UserPreferences;
  updates: Record<string, unknown>;
  validateOnly?: boolean;
}

export interface PreferenceValidation {
  valid: boolean;
  errors: Array<{
    field: string;
    message: string;
    code: string;
  }>;
  warnings: Array<{
    field: string;
    message: string;
  }>;
}

export interface PreferenceAuditLog {
  id: string;
  userId: string;
  brandId?: string;
  action: 'create' | 'update' | 'delete' | 'reset';
  section: string;
  changes: {
    field: string;
    oldValue: unknown;
    newValue: unknown;
  }[];
  timestamp: string;
  userAgent?: string;
  ipAddress?: string;
}
