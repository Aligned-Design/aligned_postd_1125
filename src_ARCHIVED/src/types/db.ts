// Conservative DB types used across the server (hand-written, conservative)
export interface PlatformConnectionRecordDB {
  id: string;
  brand_id: string;
  tenant_id: string;
  platform: string;
  account_id: string;
  account_name?: string | null;
  profile_picture?: string | null;
  access_token: string;
  refresh_token?: string | null;
  token_expires_at?: string | null;
  status: "connected" | "expired" | "revoked" | "disconnected";
  permissions?: string[] | null;
  metadata?: Record<string, unknown> | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  last_verified_at?: string | null;
}

export interface PublishingJobDB {
  id: string;
  brand_id: string;
  tenant_id: string;
  platforms?: string[];
  status?: string;
  scheduled_at?: string | null;
  published_at?: string | null;
  content?: unknown;
  validation_results?: unknown[];
  retry_count?: number;
  max_retries?: number;
  last_error?: string | null;
  last_error_details?: unknown;
  created_at?: string;
  updated_at?: string;
}

export interface MediaAssetRowDB {
  id: string;
  brand_id: string;
  tenant_id: string;
  category: string;
  filename: string;
  mime_type: string;
  path: string;
  file_size: number;
  hash?: string | null;
  thumbnail_url?: string | null;
  metadata?: Record<string, unknown> | null;
  variants?: unknown[] | null;
  used_in?: string[] | null;
  usage_count?: number | null;
  created_at?: string;
  updated_at?: string;
}
