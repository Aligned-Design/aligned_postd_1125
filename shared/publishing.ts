export type Platform = 'instagram' | 'facebook' | 'linkedin' | 'twitter' | 'x' | 'tiktok' | 'threads' | 'canva' | 'google_business';

export interface PlatformConnection {
  id: string;
  platform: Platform;
  brandId: string;
  tenantId: string;
  accountId: string;
  accountName: string;
  profilePicture?: string;
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: string;
  status: 'connected' | 'expired' | 'error' | 'disconnected';
  lastError?: string;
  lastSyncAt?: string;
  createdAt: string;
  updatedAt: string;
  permissions: string[];
  metadata: Record<string, unknown>;
}

export interface PublishingJob {
  id: string;
  brandId: string;
  tenantId: string;
  postId: string;
  platform: Platform;
  connectionId: string;
  status: 'pending' | 'processing' | 'published' | 'failed' | 'cancelled';
  scheduledAt?: string;
  publishedAt?: string;
  platformPostId?: string;
  platformUrl?: string;
  content: PostContent;
  validationResults: ValidationResult[];
  retryCount: number;
  maxRetries: number;
  lastError?: string;
  errorDetails?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface PostContent {
  text?: string;
  images?: string[];
  videos?: string[];
  links?: PostLink[];
  hashtags?: string[];
  mentions?: string[];
  location?: PostLocation;
  metadata?: Record<string, unknown>;
}

export interface PostLink {
  url: string;
  title?: string;
  description?: string;
  image?: string;
}

export interface PostLocation {
  name: string;
  latitude?: number;
  longitude?: number;
  address?: string;
}

export interface ValidationResult {
  field: string;
  status: 'valid' | 'warning' | 'error';
  message: string;
  suggestion?: string;
}

export interface PlatformLimits {
  platform: Platform;
  textMaxLength: number;
  textMinLength?: number;
  imagesMax: number;
  videosMax: number;
  hashtagsMax: number;
  supportedAspectRatios: string[];
  supportedFormats: string[];
  schedulingEnabled: boolean;
  maxScheduleDays: number;
}

export interface OAuthFlow {
  platform: Platform;
  authUrl: string;
  state: string;
  codeVerifier?: string;
  expiresAt: string;
}

export interface ConnectionStatus {
  platform: Platform;
  connected: boolean;
  accountName?: string;
  profilePicture?: string;
  tokenExpiry?: string;
  lastError?: string;
  permissions: string[];
  needsReauth: boolean;
}

export interface PublishRequest {
  brandId: string;
  platforms: Platform[];
  content: PostContent;
  scheduledAt?: string;
  validateOnly?: boolean;
}

export interface PublishResponse {
  success: boolean;
  jobs: PublishingJob[];
  validationResults: ValidationResult[];
  errors?: string[];
}

export interface JobStatusUpdate {
  jobId: string;
  status: PublishingJob['status'];
  platformPostId?: string;
  platformUrl?: string;
  error?: string;
  publishedAt?: string;
}
