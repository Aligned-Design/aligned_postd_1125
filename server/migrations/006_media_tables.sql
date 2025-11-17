/**
 * PHASE 6: Media Management Database Schema
 * Supabase migration with RLS policies for multi-tenant safety
 */

-- Create media_assets table
CREATE TABLE IF NOT EXISTS media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  brand_id UUID NOT NULL,
  category VARCHAR(50) NOT NULL, -- graphics, images, logos, videos, ai_exports, client_uploads
  filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  path VARCHAR(500) NOT NULL, -- Supabase storage path
  file_size BIGINT NOT NULL,
  hash VARCHAR(64) NOT NULL UNIQUE, -- SHA256 for duplicate detection
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, archived, deleted
  metadata JSONB, -- { width, height, aiTags, detectedSubjects, dominantColors, etc }
  variants JSONB, -- Array of { size, width, height, path, url, fileSize }
  used_in TEXT[] DEFAULT ARRAY[]::text[], -- Array of usage references
  last_used TIMESTAMPTZ,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_media_assets_brand_id ON media_assets(brand_id, status);
CREATE INDEX idx_media_assets_category ON media_assets(brand_id, category);
CREATE INDEX idx_media_assets_hash ON media_assets(brand_id, hash);
CREATE INDEX idx_media_assets_created_at ON media_assets(brand_id, created_at DESC);
CREATE INDEX idx_media_assets_usage_count ON media_assets(brand_id, usage_count DESC);
CREATE INDEX idx_media_assets_ai_tags ON media_assets USING GIN(metadata -> 'aiTags');

-- Create media_usage_logs table for tracking reuse
CREATE TABLE IF NOT EXISTS media_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL,
  brand_id UUID NOT NULL,
  used_in VARCHAR(100) NOT NULL, -- post:123, email:456, etc
  used_by_user UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  FOREIGN KEY (asset_id) REFERENCES media_assets(id) ON DELETE CASCADE,
  FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE
);

CREATE INDEX idx_media_usage_logs_asset ON media_usage_logs(asset_id);
CREATE INDEX idx_media_usage_logs_brand ON media_usage_logs(brand_id, created_at DESC);

-- Create storage_quotas table for managing limits
CREATE TABLE IF NOT EXISTS storage_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL UNIQUE,
  tenant_id UUID NOT NULL,
  limit_bytes BIGINT NOT NULL DEFAULT 5368709120, -- 5GB default
  warning_threshold_percent INTEGER DEFAULT 80,
  hard_limit_percent INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX idx_storage_quotas_brand ON storage_quotas(brand_id);
CREATE INDEX idx_storage_quotas_tenant ON storage_quotas(tenant_id);

-- Enable RLS
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_quotas ENABLE ROW LEVEL SECURITY;

-- RLS Policies for media_assets - Users can only see their own brand's assets
CREATE POLICY media_assets_select_own_brand ON media_assets
  FOR SELECT
  USING (
    brand_id IN (
      SELECT brand_id FROM brand_users
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY media_assets_insert_own_brand ON media_assets
  FOR INSERT
  WITH CHECK (
    brand_id IN (
      SELECT brand_id FROM brand_users
      WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY media_assets_update_own_brand ON media_assets
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

CREATE POLICY media_assets_delete_own_brand ON media_assets
  FOR DELETE
  USING (
    brand_id IN (
      SELECT brand_id FROM brand_users
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for media_usage_logs
CREATE POLICY media_usage_logs_select_own_brand ON media_usage_logs
  FOR SELECT
  USING (
    brand_id IN (
      SELECT brand_id FROM brand_users
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY media_usage_logs_insert_own_brand ON media_usage_logs
  FOR INSERT
  WITH CHECK (
    brand_id IN (
      SELECT brand_id FROM brand_users
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for storage_quotas
CREATE POLICY storage_quotas_select_own ON storage_quotas
  FOR SELECT
  USING (
    brand_id IN (
      SELECT brand_id FROM brand_users
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY storage_quotas_update_admin ON storage_quotas
  FOR UPDATE
  USING (
    brand_id IN (
      SELECT brand_id FROM brand_users
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    brand_id IN (
      SELECT brand_id FROM brand_users
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create function to update media_assets updated_at timestamp
CREATE OR REPLACE FUNCTION update_media_assets_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER media_assets_update_timestamp
  BEFORE UPDATE ON media_assets
  FOR EACH ROW
  EXECUTE FUNCTION update_media_assets_timestamp();

-- Create function to auto-increment usage_count
CREATE OR REPLACE FUNCTION increment_asset_usage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE media_assets
  SET usage_count = usage_count + 1,
      last_used = NOW()
  WHERE id = NEW.asset_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER media_usage_log_trigger
  AFTER INSERT ON media_usage_logs
  FOR EACH ROW
  EXECUTE FUNCTION increment_asset_usage();
