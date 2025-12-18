-- Fix brand_kit_versions.brand_id type mismatch
-- Changes brand_id from TEXT to UUID to match brands.id

-- Drop the trigger temporarily
DROP TRIGGER IF EXISTS brand_kit_versions_sync_to_brands ON brand_kit_versions;

-- Drop dependent objects
DROP INDEX IF EXISTS idx_brand_kit_versions_brand;
DROP INDEX IF EXISTS idx_brand_kit_versions_validated;

-- Alter the column type (this will fail if there are non-UUID text values)
-- If brands with TEXT IDs exist, they need to be migrated first
ALTER TABLE brand_kit_versions
ALTER COLUMN brand_id TYPE UUID USING brand_id::UUID;

-- Recreate indexes
CREATE INDEX idx_brand_kit_versions_brand ON brand_kit_versions(brand_id, version_number DESC);
CREATE INDEX idx_brand_kit_versions_validated ON brand_kit_versions(brand_id, validated) WHERE validated = true;

-- Update the function to accept UUID
CREATE OR REPLACE FUNCTION get_next_brand_kit_version(p_brand_id UUID)
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

-- Update the function to accept UUID
CREATE OR REPLACE FUNCTION get_active_brand_kit_version(p_brand_id UUID)
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

-- Recreate the trigger (function remains the same, types now match)
CREATE TRIGGER brand_kit_versions_sync_to_brands
AFTER INSERT ON brand_kit_versions
FOR EACH ROW
EXECUTE FUNCTION sync_brand_kit_to_brands();

COMMENT ON COLUMN brand_kit_versions.brand_id IS 'UUID reference to brands.id (changed from TEXT to UUID for type consistency)';

