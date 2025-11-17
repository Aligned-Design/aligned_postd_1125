/**
 * Custom Hook Return Types
 * TypeScript interfaces for all custom React hooks
 */

// ============================================================================
// BRAND INTELLIGENCE HOOK TYPES
// ============================================================================

export interface BrandAnalysis {
  toneKeywords: string[];
  brandPersonality: string;
  writingStyle: string;
  primaryAudience: string;
  secondaryAudience?: string;
  communicationStyle: string;
}

export interface BrandVisuals {
  primaryColor: string;
  secondaryColor: string;
  accentColor?: string;
  fontFamily: string;
  fontWeights: number[];
  logoUrl?: string;
  brandPatterns?: string[];
}

export interface BrandStrategy {
  platformsUsed: string[];
  postFrequency: string;
  preferredContentTypes: string[];
  bestTimeToPost?: string;
  engagementGoals: string[];
  contentPillars?: string[];
}

export interface BrandGuidelines {
  approvalWorkflow: string;
  wordsToAvoid: string[];
  wordsToEmphasize?: string[];
  socialHandles: Record<string, string>;
  hashtags?: string[];
  callToAction?: string;
}

export interface BrandIntelligenceState {
  analysis: BrandAnalysis | null;
  visuals: BrandVisuals | null;
  strategy: BrandStrategy | null;
  guidelines: BrandGuidelines | null;
  loading: boolean;
  error: string | null;
  lastUpdated?: string;
}

export interface UseBrandIntelligenceReturn {
  state: BrandIntelligenceState;
  analyzeBrand: () => Promise<void>;
  updateAnalysis: (analysis: Partial<BrandAnalysis>) => void;
  updateVisuals: (visuals: Partial<BrandVisuals>) => void;
  updateStrategy: (strategy: Partial<BrandStrategy>) => void;
  updateGuidelines: (guidelines: Partial<BrandGuidelines>) => void;
  reset: () => void;
  error: string | null;
}

// ============================================================================
// REALTIME ANALYTICS HOOK TYPES
// ============================================================================

export interface AnalyticsUpdate {
  syncId: string;
  eventType: 'sync_started' | 'sync_progress' | 'sync_completed' | 'sync_failed';
  platform: string;
  progress: number;
  recordsProcessed: number;
  totalRecords: number;
  currentMetric: string;
  timestamp: string;
}

export interface RealtimeAnalyticsState {
  updates: AnalyticsUpdate[];
  isListening: boolean;
  lastUpdate?: AnalyticsUpdate;
  error: string | null;
}

export interface UseRealtimeAnalyticsReturn {
  state: RealtimeAnalyticsState;
  subscribe: (platform: string) => void;
  unsubscribe: (platform: string) => void;
  getLatestUpdate: (platform: string) => AnalyticsUpdate | undefined;
  clearUpdates: () => void;
}

// ============================================================================
// REALTIME NOTIFICATIONS HOOK TYPES
// ============================================================================

export interface NotificationData {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  brandId?: string;
  actionUrl?: string;
  timestamp: string;
}

export interface RealtimeNotificationsState {
  notifications: NotificationData[];
  unreadCount: number;
  isListening: boolean;
  error: string | null;
}

export interface UseRealtimeNotificationsReturn {
  state: RealtimeNotificationsState;
  subscribe: () => void;
  unsubscribe: () => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotification: (notificationId: string) => void;
  clearAll: () => void;
}

// ============================================================================
// REALTIME JOB HOOK TYPES
// ============================================================================

export interface JobUpdate {
  jobId: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  progress: number;
  message: string;
  result?: unknown;
  error?: string;
  timestamp: string;
}

export interface RealtimeJobState {
  jobs: Record<string, JobUpdate>;
  isListening: boolean;
  error: string | null;
}

export interface UseRealtimeJobReturn {
  state: RealtimeJobState;
  watchJob: (jobId: string) => void;
  unwatchJob: (jobId: string) => void;
  getJobStatus: (jobId: string) => JobUpdate | undefined;
  clearJob: (jobId: string) => void;
}

// ============================================================================
// QUERY HOOK TYPES
// ============================================================================

export interface UseQueryState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export interface UseQueryReturn<T> extends UseQueryState<T> {
  refetch: () => Promise<void>;
  isLoading: boolean;
}

export interface UseMutationState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export interface UseMutationReturn<T, V> extends UseMutationState<T> {
  mutate: (variables: V) => Promise<T>;
  isLoading: boolean;
  reset: () => void;
}

// ============================================================================
// FORM HOOK TYPES
// ============================================================================

export interface UseFormReturn<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  loading: boolean;
  isDirty: boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  setFieldValue: <K extends keyof T>(field: K, value: T[K]) => void;
  setFieldError: <K extends keyof T>(field: K, error: string) => void;
  setFieldTouched: <K extends keyof T>(field: K, touched: boolean) => void;
  resetForm: () => void;
}

// ============================================================================
// AUTH HOOK TYPES
// ============================================================================

export interface AuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}

export interface UseAuthReturn {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  updateProfile: (profile: Partial<AuthUser>) => Promise<void>;
}

// ============================================================================
// MODAL HOOK TYPES
// ============================================================================

export interface UseModalReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

// ============================================================================
// LOCAL STORAGE HOOK TYPES
// ============================================================================

export interface UseLocalStorageReturn<T> {
  value: T;
  setValue: (value: T | ((prev: T) => T)) => void;
  removeValue: () => void;
  isLoading: boolean;
}

// ============================================================================
// DEBOUNCE HOOK TYPES
// ============================================================================

export interface UseDebouncedReturn<T> {
  value: T;
  flush: () => void;
}
