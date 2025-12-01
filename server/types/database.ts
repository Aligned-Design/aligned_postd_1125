/**
 * Database Response Types & DTOs
 * TypeScript interfaces for Supabase query results and database models
 */

// ============================================================================
// AUTH & USER TYPES
// ============================================================================

export interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
  lastSignInAt?: string;
  isActive: boolean;
}

export interface UserPreferencesRecord {
  id: string;
  userId: string;
  theme: 'light' | 'dark' | 'system';
  notificationsEnabled: boolean;
  emailDigest: 'daily' | 'weekly' | 'never';
  language: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// BRAND & AGENCY TYPES
// ============================================================================

export interface BrandRecord {
  id: string;
  agencyId?: string;
  name: string;
  description?: string;
  industry?: string;
  website?: string;
  logoUrl?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface BrandMember {
  id: string;
  brandId: string;
  userId: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  joinedAt: string;
  invitedBy?: string;
}

export interface BrandAsset {
  id: string;
  brandId: string;
  assetType: 'logo' | 'brand_guide' | 'color_palette' | 'typography' | 'image' | 'video';
  url: string;
  filename: string;
  fileSize?: number;
  mimeType?: string;
  metadata?: Record<string, unknown>;
  uploadedAt: string;
  uploadedBy: string;
}

export interface WhiteLabelConfigRecord {
  id: string;
  agencyId: string;
  customDomain?: string;
  brandName?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  faviconUrl?: string;
  previewMode: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// CONTENT & POSTS TYPES
// ============================================================================

export interface ContentItem {
  id: string;
  brandId: string;
  title: string;
  description?: string;
  content: Record<string, unknown>; // JSONB column - matches schema: content JSONB NOT NULL
  status: 'draft' | 'scheduled' | 'published' | 'archived';
  type: string; // Matches schema: type TEXT NOT NULL (not contentType)
  scheduledAt?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface Post {
  id: string;
  contentId: string;
  platform: string;
  platformPostId?: string;
  url?: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  scheduledAt?: string;
  publishedAt?: string;
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PostApproval {
  id: string;
  postId: string;
  contentId: string;
  status: 'pending' | 'approved' | 'rejected' | 'changes_requested';
  approvedBy?: string;
  rejectedBy?: string;
  feedback?: string;
  approvedAt?: string;
  rejectedAt?: string;
  createdAt: string;
}

// ============================================================================
// ANALYTICS & METRICS TYPES
// ============================================================================

export interface AnalyticsData {
  id: string;
  brandId: string;
  platform: string;
  metricType: string;
  value: number;
  date: string;
  metadata?: Record<string, unknown>;
  recordedAt: string;
}

export interface AnalyticsMetricRecord {
  id: string;
  brandId: string;
  platform: string;
  metricName: string;
  currentValue: number;
  previousValue?: number;
  changePercentage?: number;
  recordedAt: string;
}

export interface SyncEvent {
  id: string;
  brandId: string;
  syncId: string;
  platform: string;
  eventType: 'started' | 'progress' | 'completed' | 'failed';
  status: string;
  progress?: number;
  recordsProcessed?: number;
  totalRecords?: number;
  errorMessage?: string;
  createdAt: string;
}

// ============================================================================
// INTEGRATION TYPES
// ============================================================================

export interface PlatformConnection {
  id: string;
  brandId: string;
  platform: string;
  accountId: string;
  accountName?: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
  isActive: boolean;
  lastSyncAt?: string;
  nextSyncAt?: string;
  createdAt: string;
  updatedAt: string;
  disconnectedAt?: string;
}

export interface IntegrationEvent {
  id: string;
  brandId: string;
  connectionId: string;
  eventType: string;
  payload: Record<string, unknown>;
  processedAt?: string;
  createdAt: string;
}

// ============================================================================
// APPROVAL & WORKFLOW TYPES
// ============================================================================

export interface ApprovalRequest {
  id: string;
  brandId: string;
  contentId: string;
  status: 'pending' | 'approved' | 'rejected' | 'changes_requested';
  requestedBy: string;
  approvalLevel: number;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface ApprovalThread {
  id: string;
  approvalRequestId: string;
  authorId: string;
  message: string;
  attachmentUrls?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowTemplate {
  id: string;
  brandId: string;
  name: string;
  description?: string;
  steps: Array<{
    id: string;
    order: number;
    type: string;
    config: Record<string, unknown>;
  }>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowInstance {
  id: string;
  templateId: string;
  brandId: string;
  contentId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  currentStep: number;
  startedAt: string;
  completedAt?: string;
  failureReason?: string;
  createdAt: string;
}

// ============================================================================
// CLIENT PORTAL TYPES
// ============================================================================

export interface ClientSetting {
  id: string;
  brandId: string;
  clientId: string;
  canViewAnalytics: boolean;
  canApproveContent: boolean;
  canUploadMedia: boolean;
  canViewBrandGuide: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClientComment {
  id: string;
  contentId: string;
  clientId: string;
  comment: string;
  attachmentUrls?: string[];
  isResolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClientMedia {
  id: string;
  brandId: string;
  clientId: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  url: string;
  status: 'uploading' | 'ready' | 'failed';
  uploadedAt: string;
  expiresAt?: string;
}

// ============================================================================
// AUDIT LOG TYPES
// ============================================================================

export interface AuditLog {
  id: string;
  brandId: string;
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  changes?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

export interface Notification {
  id: string;
  userId: string;
  brandId?: string;
  type: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  actionUrl?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  expiresAt?: string;
}

// ============================================================================
// GENERIC RESPONSE WRAPPER TYPES
// ============================================================================

export interface QueryResult<T> {
  data: T[];
  count: number;
  error: null | string;
}

export interface SingleResult<T> {
  data: T | null;
  error: null | string;
}

export interface PaginatedResult<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

// ============================================================================
// BRAND GUIDE TYPES
// ============================================================================

export interface BrandGuideVersionRow {
  id: string;
  brandId: string; // UUID
  version: number;
  brandGuide: Record<string, unknown>; // JSONB
  changedFields: string[]; // TEXT[]
  changedBy: string | null; // UUID (nullable)
  changeReason: string | null;
  createdAt: string; // TIMESTAMPTZ
}

// ============================================================================
// SCHEDULING TYPES
// ============================================================================

export interface ScheduledContentRow {
  id: string;
  brandId: string; // UUID
  contentId: string; // UUID
  scheduledAt: string; // TIMESTAMPTZ
  platforms: string[]; // TEXT[]
  status: string; // TEXT (default: 'scheduled')
  createdAt: string; // TIMESTAMPTZ
  updatedAt: string; // TIMESTAMPTZ
}

// ============================================================================
// PERSISTENCE SCHEMA TYPES (AI Learning Loop)
// ============================================================================

export interface StrategyBriefRow {
  id: string;
  /** @deprecated Legacy TEXT column dropped in migration 006. Use brandIdUuid instead. */
  brandId?: string; // TEXT (deprecated, dropped in migration 006) - use brandIdUuid instead
  brandIdUuid: string; // UUID (primary, required) - migration 005 adds FK, migration 006 drops brand_id TEXT
  requestId: string;
  cycleId: string;
  version: string;
  positioning: Record<string, unknown>; // JSONB
  voice: Record<string, unknown>; // JSONB
  visual: Record<string, unknown>; // JSONB
  competitive: Record<string, unknown>; // JSONB
  createdAt: string; // TIMESTAMPTZ
  updatedAt: string; // TIMESTAMPTZ
}

export interface ContentPackageRow {
  id: string;
  /** @deprecated Legacy TEXT column dropped in migration 006. Use brandIdUuid instead. */
  brandId?: string; // TEXT (deprecated, dropped in migration 006) - use brandIdUuid instead
  brandIdUuid: string; // UUID (primary, required) - migration 005 adds FK, migration 006 drops brand_id TEXT
  contentId: string;
  requestId: string;
  cycleId: string;
  copy: Record<string, unknown>; // JSONB
  designContext: Record<string, unknown> | null; // JSONB (nullable)
  collaborationLog: Record<string, unknown>; // JSONB
  status: string; // TEXT (default: 'draft')
  qualityScore: number | null; // DECIMAL(3,1) (nullable)
  requiresApproval: boolean; // BOOLEAN (default: true)
  createdAt: string; // TIMESTAMPTZ
  updatedAt: string; // TIMESTAMPTZ
  publishedAt: string | null; // TIMESTAMPTZ (nullable)
}

export interface BrandHistoryRow {
  id: string;
  /** @deprecated Legacy TEXT column dropped in migration 006. Use brandIdUuid instead. */
  brandId?: string; // TEXT (deprecated, dropped in migration 006) - use brandIdUuid instead
  brandIdUuid: string; // UUID (primary, required) - migration 005 adds FK, migration 006 drops brand_id TEXT
  entryId: string;
  timestamp: string; // TIMESTAMPTZ
  agent: string;
  action: string;
  contentId: string | null;
  details: Record<string, unknown> | null; // JSONB (nullable)
  rationale: string | null;
  performance: Record<string, unknown> | null; // JSONB (nullable)
  tags: string[]; // TEXT[] (default: '{}')
  createdAt: string; // TIMESTAMPTZ
}

export interface BrandSuccessPatternRow {
  id: string;
  /** @deprecated Legacy TEXT column dropped in migration 006. Use brandIdUuid instead. */
  brandId?: string; // TEXT (deprecated, dropped in migration 006) - use brandIdUuid instead
  brandIdUuid: string; // UUID (primary, required) - migration 005 adds FK, migration 006 drops brand_id TEXT
  pattern: string;
  frequency: number; // INTEGER (default: 1)
  avgPerformance: number | null; // DECIMAL(4,2) (nullable)
  examples: string[]; // TEXT[] (default: '{}')
  lastSeen: string; // TIMESTAMPTZ (default: NOW())
  createdAt: string; // TIMESTAMPTZ
}

export interface CollaborationLogRow {
  id: string;
  cycleId: string;
  requestId: string;
  /** @deprecated Legacy TEXT column dropped in migration 006. Use brandIdUuid instead. */
  brandId?: string; // TEXT (deprecated, dropped in migration 006) - use brandIdUuid instead
  brandIdUuid: string; // UUID (primary, required) - migration 005 adds FK, migration 006 drops brand_id TEXT
  agent: string;
  action: string;
  timestamp: string; // TIMESTAMPTZ
  contentId: string | null;
  notes: string | null;
  metadata: Record<string, unknown> | null; // JSONB (nullable)
  createdAt: string; // TIMESTAMPTZ
}

export interface PerformanceLogRow {
  id: string;
  /** @deprecated Legacy TEXT column dropped in migration 006. Use brandIdUuid instead. */
  brandId?: string; // TEXT (deprecated, dropped in migration 006) - use brandIdUuid instead
  brandIdUuid: string; // UUID (primary, required) - migration 005 adds FK, migration 006 drops brand_id TEXT
  contentId: string | null;
  cycleId: string | null;
  contentType: string | null;
  platform: string;
  engagement: Record<string, unknown>; // JSONB
  reach: number | null; // INTEGER (nullable)
  impressions: number | null; // INTEGER (nullable)
  clickThroughRate: number | null; // DECIMAL(5,2) (nullable)
  recordedAt: string; // TIMESTAMPTZ
  createdAt: string; // TIMESTAMPTZ
}

export interface PlatformInsightRow {
  id: string;
  /** @deprecated Legacy TEXT column dropped in migration 006. Use brandIdUuid instead. */
  brandId?: string; // TEXT (deprecated, dropped in migration 006) - use brandIdUuid instead
  brandIdUuid: string; // UUID (primary, required) - migration 005 adds FK, migration 006 drops brand_id TEXT
  platform: string;
  topVisualStyle: string | null;
  bestPostingTime: string | null;
  topicAffinity: string[]; // TEXT[] (default: '{}')
  avgEngagement: number | null; // DECIMAL(4,2) (nullable)
  sampleSize: number | null; // INTEGER (nullable)
  lastUpdated: string; // TIMESTAMPTZ (default: NOW())
  createdAt: string; // TIMESTAMPTZ
}

export interface TokenHealthRow {
  id: string;
  /** @deprecated Legacy TEXT column dropped in migration 006. Use brandIdUuid instead. */
  brandId?: string; // TEXT (deprecated, dropped in migration 006) - use brandIdUuid instead
  brandIdUuid: string; // UUID (primary, required) - migration 005 adds FK, migration 006 drops brand_id TEXT
  platform: string;
  tokenType: string;
  status: string; // TEXT (default: 'healthy')
  expiresAt: string | null; // TIMESTAMPTZ (nullable)
  lastVerified: string; // TIMESTAMPTZ (default: NOW())
  errorMessage: string | null;
  createdAt: string; // TIMESTAMPTZ
}

export interface WeeklySummaryRow {
  id: string;
  /** @deprecated Legacy TEXT column dropped in migration 006. Use brandIdUuid instead. */
  brandId?: string; // TEXT (deprecated, dropped in migration 006) - use brandIdUuid instead
  brandIdUuid: string; // UUID (primary, required) - migration 005 adds FK, migration 006 drops brand_id TEXT
  weekStart: string; // DATE
  weekEnd: string; // DATE
  totalCycles: number; // INTEGER (default: 0)
  avgQualityScore: number | null; // DECIMAL(4,2) (nullable)
  topPerformers: Record<string, unknown> | null; // JSONB (nullable)
  successPatterns: Record<string, unknown> | null; // JSONB (nullable)
  recommendations: Record<string, unknown> | null; // JSONB (nullable)
  createdAt: string; // TIMESTAMPTZ
}

export interface AdvisorReviewAuditRow {
  id: string;
  cycleId: string; // UNIQUE
  requestId: string;
  /** @deprecated Legacy TEXT column dropped in migration 006. Use brandIdUuid instead. */
  brandId?: string; // TEXT (deprecated, dropped in migration 006) - use brandIdUuid instead
  brandIdUuid: string; // UUID (primary, required) - migration 005 adds FK, migration 006 drops brand_id TEXT
  contentId: string;
  platform: string;
  clarityScore: number; // DECIMAL(3,1)
  alignmentScore: number; // DECIMAL(3,1)
  resonanceScore: number; // DECIMAL(3,1)
  actionabilityScore: number; // DECIMAL(3,1)
  platformFitScore: number; // DECIMAL(3,1)
  averageScore: number; // DECIMAL(4,2)
  weightedScore: number; // DECIMAL(4,2)
  severityLevel: string;
  reflectionQuestion: string | null;
  suggestedActions: Record<string, unknown> | null; // JSONB (nullable)
  createdAt: string; // TIMESTAMPTZ
}
