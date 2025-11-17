/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

// ============================================================================
// DEMO & EXAMPLE TYPES
// ============================================================================

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

// ============================================================================
// AI GENERATION TYPES
// ============================================================================

export interface AIGenerationRequest {
  prompt: string;
  platformType?: string;
  characterLimit?: number;
  includeHashtags?: boolean;
  tone?: string;
  brandContext?: string;
  agentType?: "doc" | "design" | "advisor";
  provider?: "openai" | "claude";
}

export interface AIGenerationResponse {
  content: string;
  variations?: string[];
  hashtags?: string[];
  estimatedEngagement?: number;
  provider?: "openai" | "claude";
  agentType?: "doc" | "design" | "advisor";
}

export interface AIProviderStatus {
  provider: 'openai' | 'anthropic' | 'auto';
  available: boolean;
  modelName?: string;
}

// ============================================================================
// AGENT TYPES
// ============================================================================

export interface AgentGenerateRequest {
  prompt?: string;
  agentType?: string;
  context?: Record<string, unknown>;
  brand_id?: string;
  input?: Record<string, unknown>;
}

export interface AgentGenerateResponse {
  success: boolean;
  id?: string;
  result?: string;
  output?: unknown;
  error?: string;
  metadata?: Record<string, unknown>;
  executionTime?: number;
}

// ============================================================================
// ASSET & BRAND TYPES
// ============================================================================

export interface AssetUploadResponse {
  success: boolean;
  asset?: {
    id: string;
    url: string;
    filename: string;
    size: number;
    mimeType: string;
    uploadedAt: string;
  };
  id?: string;
  url?: string;
  filename?: string;
  size?: number;
  mimeType?: string;
  uploadedAt?: string;
}

// ============================================================================
// CREATIVE STUDIO TYPES
// ============================================================================
// NOTE: Creative Studio types have been moved to @shared/creative-studio
// Re-exported here for backward compatibility
export type {
  CanvasItem,
  CanvasItemType,
  ShapeType,
  DesignFormat,
  CreativeStudioDesign,
  SaveDesignRequest,
  SaveDesignResponse,
  UpdateDesignRequest,
  UpdateDesignResponse,
  ScheduleDesignRequest,
  ScheduleDesignResponse,
  ListDesignsResponse,
  FormatPreset,
} from "./creative-studio";
// FORMAT_PRESETS is a value, not a type - export separately
export { FORMAT_PRESETS } from "./creative-studio";

export interface BrandIntakeRequest {
  brandName: string;
  description?: string;
  industry?: string;
  companySize?: string;
  website?: string;
  websiteUrl?: string;
  targetAudience?: string;
  missionStatement?: string;
  valueProposition?: string;
  socialLinks?: Record<string, string>;
}

export interface BrandKitResponse {
  id: string;
  brandName: string;
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
  typography?: {
    fontFamily?: string;
    fontWeights?: number[];
  };
  voiceAndTone?: {
    tone?: string[];
    personality?: string;
  };
  guidelines?: string;
}

// ============================================================================
// CALENDAR & CONTENT TYPES
// ============================================================================

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  platform?: string;
  status?: 'draft' | 'scheduled' | 'published' | 'failed';
  contentId?: string;
  scheduledAt?: string;
  brandId?: string;
}

export interface CalendarFilter {
  platform?: string;
  platforms?: string[];
  status?: string;
  statuses?: string[];
  brands?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface PostModel {
  id: string;
  content: string;
  caption?: string;
  platform: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  scheduledAt?: string;
  publishedAt?: string;
  mediaIds?: string[];
  hashtags?: string[];
  mentions?: string[];
  complianceScore?: number;
  linterResults?: {
    errors: string[];
    warnings?: string[];
    passed?: boolean;
  };
  brandId?: string;
}

export interface PostUpdateRequest {
  content?: string;
  caption?: string;
  platform?: string;
  status?: 'draft' | 'scheduled' | 'published';
  scheduledAt?: string;
  mediaIds?: string[];
  hashtags?: string[];
}

// ============================================================================
// REVIEW & APPROVAL TYPES
// ============================================================================

export interface ReviewQueueResponse {
  id: string;
  items: ReviewItem[];
  totalCount: number;
  pendingCount: number;
}

export interface ReviewItem {
  id: string;
  contentId: string;
  content: string;
  platform: string;
  submittedBy: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  feedback?: string;
}

export interface ReviewActionRequest {
  reviewId: string;
  action: 'approve' | 'reject';
  feedback?: string;
  suggestions?: string;
}

export interface ReviewActionResponse {
  success: boolean;
  reviewId?: string;
  action?: 'approve' | 'reject';
  updatedAt?: string;
  error?: string;
}

// ============================================================================
// INTEGRATION TYPES
// ============================================================================

export interface IntegrationFilter {
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith';
  value: string;
}

export interface IntegrationSyncConfig {
  syncEnabled: boolean;
  syncFrequency: 'realtime' | 'hourly' | 'daily';
  syncDirection: 'inbound' | 'outbound' | 'bidirectional';
  autoSync: boolean;
  filterRules?: IntegrationFilter[];
}

// ============================================================================
// WORKFLOW TYPES
// ============================================================================

export interface WorkflowStep {
  id: string;
  name: string;
  type: string;
  config?: Record<string, unknown>;
  status?: 'pending' | 'in_progress' | 'completed' | 'failed';
}

export interface WorkflowInstance {
  id: string;
  templateId?: string;
  steps: WorkflowStep[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: string;
  completedAt?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// ANALYTICS & MONITORING TYPES
// ============================================================================

export interface AnalyticsMetric {
  id: string;
  title: string;
  current: number;
  previous?: number;
  change?: number;
  isPercentage?: boolean;
  icon?: string;
  color?: string;
}

export interface AnalyticsPortalData {
  metrics?: AnalyticsMetric[];
  data?: Record<string, unknown>;
}

export interface SyncEventData {
  syncId: string;
  eventType: string;
  platform?: string;
  progress?: number;
  recordsProcessed?: number;
  totalRecords?: number;
  currentMetric?: string;
  timestamp?: string;
}

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

export interface NotificationMessage {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  brandId?: string;
  actionUrl?: string;
  timestamp?: string;
}

// ============================================================================
// USER & PREFERENCES TYPES
// ============================================================================

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  notifications?: boolean;
  emailDigest?: 'daily' | 'weekly' | 'never';
  language?: string;
  timezone?: string;
}

export interface WhiteLabelConfig {
  brandName?: string;
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  customDomain?: string;
  favicon?: string;
  previewMode?: boolean;
}

// ============================================================================
// ERROR & RESPONSE TYPES
// ============================================================================

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  statusCode?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

// ============================================================================
// DASHBOARD TYPES
// ============================================================================
// Phase 2 – Issue 3: Centralized dashboard response types

export interface DashboardKpi {
  id: string;
  label: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
}

export interface ChartDataPoint {
  date: string;
  value: number;
}

export interface TopContentItem {
  id: string;
  title: string;
  platform: string;
  impressions: number;
  engagement: number;
  engagementRate?: number;
  date?: string;
}

export interface ActivityItem {
  id: string;
  type: "post_created" | "post_approved" | "report_sent" | "brand_connected" | "post" | "approval" | "campaign" | "insight";
  title?: string;
  description?: string;
  timestamp: string;
  icon?: string;
}

export interface DashboardResponse {
  kpis: DashboardKpi[];
  chartData: ChartDataPoint[];
  topContent: TopContentItem[];
  recentActivity: ActivityItem[];
}

// Chart data structure for analytics visualization
export interface DashboardChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    color: string;
  }[];
}

// ============================================================================
// CLIENT PORTAL TYPES
// ============================================================================
// NOTE: ClientDashboardData and related types have been moved to @shared/client-portal
// This section is kept for backward compatibility but types should be imported from @shared/client-portal
