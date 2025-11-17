/**
 * PHASE 7: Publishing Jobs & Audit Trail
 * Creates tables for job persistence, retry tracking, and audit logging
 */

-- Create publishing_jobs table for job persistence
CREATE TABLE IF NOT EXISTS publishing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  content JSONB NOT NULL, -- PostContent object
  platforms TEXT[] NOT NULL, -- Array of platform names
  scheduled_at TIMESTAMPTZ,

  -- Job status tracking
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, processing, published, failed, scheduled
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,

  -- Results tracking
  published_at TIMESTAMPTZ,
  last_error TEXT,
  last_error_details JSONB,

  -- Validation results
  validation_results JSONB, -- Array of validation check results

  -- Metadata
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create publishing_logs table for audit trail
CREATE TABLE IF NOT EXISTS publishing_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL,
  brand_id UUID NOT NULL,
  platform VARCHAR(50) NOT NULL, -- instagram, facebook, linkedin, twitter, google_business

  -- Status tracking per platform
  status VARCHAR(20) NOT NULL, -- pending, processing, published, failed, scheduled
  attempt_number INTEGER DEFAULT 1,

  -- Platform post details
  platform_post_id VARCHAR(255), -- ID returned by platform API
  platform_post_url TEXT, -- Direct link to published post

  -- Error tracking
  error_code VARCHAR(100),
  error_message TEXT,
  error_details JSONB,

  -- Metadata
  content_snapshot JSONB, -- Content that was published
  request_metadata JSONB, -- API request details for debugging
  response_metadata JSONB, -- API response details

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  FOREIGN KEY (job_id) REFERENCES publishing_jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE
);

-- Create platform_connections table for OAuth token persistence
CREATE TABLE IF NOT EXISTS platform_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  platform VARCHAR(50) NOT NULL, -- instagram, facebook, linkedin, twitter, google_business

  -- Account information
  account_id VARCHAR(255) NOT NULL, -- Platform-specific account identifier
  account_name VARCHAR(255),
  profile_picture TEXT,

  -- OAuth tokens
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,

  -- Connection status
  status VARCHAR(20) NOT NULL DEFAULT 'connected', -- connected, expired, revoked, disconnected

  -- Permissions and metadata
  permissions TEXT[], -- Array of granted permissions
  metadata JSONB, -- Platform-specific account metadata

  -- Tracking
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_verified_at TIMESTAMPTZ,

  FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE(brand_id, platform) -- One connection per platform per brand
);

-- Create platform_sync_logs table for analytics tracking
CREATE TABLE IF NOT EXISTS platform_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  platform VARCHAR(50) NOT NULL,

  -- Sync details
  sync_type VARCHAR(50) NOT NULL, -- full, incremental, manual
  status VARCHAR(20) NOT NULL, -- success, failed, partial

  -- Tracking
  items_synced INTEGER DEFAULT 0,
  items_failed INTEGER DEFAULT 0,

  -- Timing
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,

  -- Errors
  error_message TEXT,
  error_details JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_publishing_jobs_brand_status ON publishing_jobs(brand_id, status);
CREATE INDEX idx_publishing_jobs_scheduled ON publishing_jobs(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX idx_publishing_jobs_created ON publishing_jobs(brand_id, created_at DESC);
CREATE INDEX idx_publishing_jobs_retry ON publishing_jobs(status, retry_count) WHERE status = 'failed' AND retry_count < max_retries;

CREATE INDEX idx_publishing_logs_job ON publishing_logs(job_id);
CREATE INDEX idx_publishing_logs_platform ON publishing_logs(brand_id, platform, created_at DESC);
CREATE INDEX idx_publishing_logs_post_id ON publishing_logs(platform_post_id) WHERE platform_post_id IS NOT NULL;

CREATE INDEX idx_platform_connections_brand_platform ON platform_connections(brand_id, platform);
CREATE INDEX idx_platform_connections_status ON platform_connections(status) WHERE status = 'connected';
CREATE INDEX idx_platform_connections_expires ON platform_connections(token_expires_at) WHERE status = 'connected';

CREATE INDEX idx_platform_sync_logs_brand ON platform_sync_logs(brand_id, platform, created_at DESC);
CREATE INDEX idx_platform_sync_logs_status ON platform_sync_logs(status, created_at DESC);

-- Enable RLS on all tables
ALTER TABLE publishing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE publishing_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_sync_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for publishing_jobs
CREATE POLICY publishing_jobs_select_own_brand ON publishing_jobs
  FOR SELECT
  USING (
    brand_id IN (
      SELECT brand_id FROM brand_users
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY publishing_jobs_insert_own_brand ON publishing_jobs
  FOR INSERT
  WITH CHECK (
    brand_id IN (
      SELECT brand_id FROM brand_users
      WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY publishing_jobs_update_own_brand ON publishing_jobs
  FOR UPDATE
  USING (
    brand_id IN (
      SELECT brand_id FROM brand_users
      WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    brand_id IN (
      SELECT brand_id FROM brand_users
      WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY publishing_jobs_delete_admin ON publishing_jobs
  FOR DELETE
  USING (
    brand_id IN (
      SELECT brand_id FROM brand_users
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for publishing_logs
CREATE POLICY publishing_logs_select_own_brand ON publishing_logs
  FOR SELECT
  USING (
    brand_id IN (
      SELECT brand_id FROM brand_users
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY publishing_logs_insert_own_brand ON publishing_logs
  FOR INSERT
  WITH CHECK (
    brand_id IN (
      SELECT brand_id FROM brand_users
      WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- RLS Policies for platform_connections
CREATE POLICY platform_connections_select_own_brand ON platform_connections
  FOR SELECT
  USING (
    brand_id IN (
      SELECT brand_id FROM brand_users
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY platform_connections_insert_own_brand ON platform_connections
  FOR INSERT
  WITH CHECK (
    brand_id IN (
      SELECT brand_id FROM brand_users
      WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY platform_connections_update_own_brand ON platform_connections
  FOR UPDATE
  USING (
    brand_id IN (
      SELECT brand_id FROM brand_users
      WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    brand_id IN (
      SELECT brand_id FROM brand_users
      WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY platform_connections_delete_admin ON platform_connections
  FOR DELETE
  USING (
    brand_id IN (
      SELECT brand_id FROM brand_users
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for platform_sync_logs
CREATE POLICY platform_sync_logs_select_own_brand ON platform_sync_logs
  FOR SELECT
  USING (
    brand_id IN (
      SELECT brand_id FROM brand_users
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY platform_sync_logs_insert_own_brand ON platform_sync_logs
  FOR INSERT
  WITH CHECK (
    brand_id IN (
      SELECT brand_id FROM brand_users
      WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Create function to update publishing_jobs updated_at timestamp
CREATE OR REPLACE FUNCTION update_publishing_jobs_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER publishing_jobs_update_timestamp
  BEFORE UPDATE ON publishing_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_publishing_jobs_timestamp();

-- Create function to update platform_connections updated_at timestamp
CREATE OR REPLACE FUNCTION update_platform_connections_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER platform_connections_update_timestamp
  BEFORE UPDATE ON platform_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_platform_connections_timestamp();
