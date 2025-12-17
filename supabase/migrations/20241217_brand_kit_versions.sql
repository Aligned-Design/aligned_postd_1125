-- Brand Kit Versioning System
-- Tracks all changes to brand_kit data for audit and rollback

CREATE TABLE IF NOT EXISTS brand_kit_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id TEXT NOT NULL,
  tenant_id UUID,
  
  -- Version tracking
  version_number INTEGER NOT NULL,
  
  -- Content
  brand_kit JSONB NOT NULL,
  
  -- Change tracking
  changed_fields TEXT[], -- Array of field paths that changed (e.g., ['colors.primary', 'logos'])
  change_summary TEXT, -- Human-readable summary
  
  -- Source tracking
  source TEXT NOT NULL, -- 'crawler', 'manual_edit', 'api_import', 'ai_refinement'
  created_by UUID, -- User ID who made the change (null for automated)
  created_by_email TEXT, -- For audit trail
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  crawl_run_id UUID, -- Link to crawl_runs if from crawler
  
  -- Validation status
  validated BOOLEAN DEFAULT FALSE, -- User confirmed this version
  validated_at TIMESTAMPTZ,
  validated_by UUID,
  
  CONSTRAINT brand_kit_versions_brand_version_unique UNIQUE (brand_id, version_number)
);

-- Indexes for common queries
CREATE INDEX idx_brand_kit_versions_brand ON brand_kit_versions(brand_id, version_number DESC);
CREATE INDEX idx_brand_kit_versions_tenant ON brand_kit_versions(tenant_id);
CREATE INDEX idx_brand_kit_versions_source ON brand_kit_versions(source);
CREATE INDEX idx_brand_kit_versions_created ON brand_kit_versions(created_at DESC);
CREATE INDEX idx_brand_kit_versions_validated ON brand_kit_versions(brand_id, validated) WHERE validated = true;

-- Function to get current version number for a brand
CREATE OR REPLACE FUNCTION get_next_brand_kit_version(p_brand_id TEXT)
RETURNS INTEGER AS $$
DECLARE
  current_version INTEGER;
BEGIN
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO current_version
  FROM brand_kit_versions
  WHERE brand_id = p_brand_id;
  
  RETURN current_version;
END;
$$ LANGUAGE plpgsql;

-- Function to get the latest validated version (or latest if none validated)
CREATE OR REPLACE FUNCTION get_active_brand_kit_version(p_brand_id TEXT)
RETURNS UUID AS $$
DECLARE
  version_id UUID;
BEGIN
  -- Try to get latest validated version
  SELECT id INTO version_id
  FROM brand_kit_versions
  WHERE brand_id = p_brand_id
    AND validated = true
  ORDER BY version_number DESC
  LIMIT 1;
  
  -- If no validated version, get latest
  IF version_id IS NULL THEN
    SELECT id INTO version_id
    FROM brand_kit_versions
    WHERE brand_id = p_brand_id
    ORDER BY version_number DESC
    LIMIT 1;
  END IF;
  
  RETURN version_id;
END;
$$ LANGUAGE plpgsql;

-- Function to compare two versions and extract changed fields
CREATE OR REPLACE FUNCTION compare_brand_kit_versions(
  p_old_kit JSONB,
  p_new_kit JSONB
)
RETURNS TEXT[] AS $$
DECLARE
  changed_fields TEXT[] := ARRAY[]::TEXT[];
  old_keys TEXT[];
  new_keys TEXT[];
  key TEXT;
BEGIN
  -- Get all keys from both versions
  SELECT ARRAY_AGG(DISTINCT k) INTO old_keys
  FROM jsonb_object_keys(p_old_kit) k;
  
  SELECT ARRAY_AGG(DISTINCT k) INTO new_keys
  FROM jsonb_object_keys(p_new_kit) k;
  
  -- Check each key for changes
  FOR key IN SELECT DISTINCT unnest(COALESCE(old_keys, ARRAY[]::TEXT[]) || COALESCE(new_keys, ARRAY[]::TEXT[]))
  LOOP
    -- Key added
    IF p_old_kit->key IS NULL AND p_new_kit->key IS NOT NULL THEN
      changed_fields := array_append(changed_fields, key || ' (added)');
    -- Key removed
    ELSIF p_old_kit->key IS NOT NULL AND p_new_kit->key IS NULL THEN
      changed_fields := array_append(changed_fields, key || ' (removed)');
    -- Key modified
    ELSIF p_old_kit->key IS DISTINCT FROM p_new_kit->key THEN
      changed_fields := array_append(changed_fields, key);
    END IF;
  END LOOP;
  
  RETURN changed_fields;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update brands table with latest version
CREATE OR REPLACE FUNCTION sync_brand_kit_to_brands()
RETURNS TRIGGER AS $$
BEGIN
  -- Update brands table with the new version's brand_kit
  -- Only if this is the latest version for this brand
  IF NEW.version_number = (
    SELECT MAX(version_number)
    FROM brand_kit_versions
    WHERE brand_id = NEW.brand_id
  ) THEN
    UPDATE brands
    SET 
      brand_kit = NEW.brand_kit,
      updated_at = NEW.created_at
    WHERE id = NEW.brand_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER brand_kit_versions_sync_to_brands
AFTER INSERT ON brand_kit_versions
FOR EACH ROW
EXECUTE FUNCTION sync_brand_kit_to_brands();

COMMENT ON TABLE brand_kit_versions IS 'Versioned brand kit data for audit trail and rollback capability';
COMMENT ON COLUMN brand_kit_versions.version_number IS 'Sequential version number starting at 1';
COMMENT ON COLUMN brand_kit_versions.source IS 'Origin of this version: crawler, manual_edit, api_import, ai_refinement';
COMMENT ON COLUMN brand_kit_versions.changed_fields IS 'Array of top-level fields that changed from previous version';
COMMENT ON COLUMN brand_kit_versions.validated IS 'User has reviewed and confirmed this version is correct';

