-- Brand Kit History Table for audit trail and revert functionality
CREATE TABLE IF NOT EXISTS brand_kit_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  field VARCHAR(100) NOT NULL,
  old_value JSONB,
  new_value JSONB,
  old_source VARCHAR(20),
  new_source VARCHAR(20),
  changed_by VARCHAR(20) NOT NULL, -- 'user' | 'crawler' | 'system'
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX idx_brand_kit_history_brand_id ON brand_kit_history(brand_id);
CREATE INDEX idx_brand_kit_history_field ON brand_kit_history(brand_id, field);
CREATE INDEX idx_brand_kit_history_created_at ON brand_kit_history(created_at DESC);

-- RLS Policies
ALTER TABLE brand_kit_history ENABLE ROW LEVEL SECURITY;

-- Users can view history for their brands
CREATE POLICY "Users can view brand kit history"
  ON brand_kit_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM brand_members
      WHERE brand_members.brand_id = brand_kit_history.brand_id
      AND brand_members.user_id = auth.uid()
    )
  );

-- Service role can insert history (from API)
CREATE POLICY "Service role can insert history"
  ON brand_kit_history
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Users cannot delete history (immutable audit log)
-- Only service role can delete old entries during cleanup

-- Function to automatically cleanup old history entries
CREATE OR REPLACE FUNCTION cleanup_old_brand_kit_history()
RETURNS TRIGGER AS $$
BEGIN
  -- Keep only last 10 entries per field per brand
  DELETE FROM brand_kit_history
  WHERE id IN (
    SELECT id
    FROM brand_kit_history
    WHERE brand_id = NEW.brand_id
      AND field = NEW.field
    ORDER BY created_at DESC
    OFFSET 10
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to cleanup after insert
CREATE TRIGGER trigger_cleanup_brand_kit_history
  AFTER INSERT ON brand_kit_history
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_old_brand_kit_history();

-- Add crawler_settings to brands table (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'brands' AND column_name = 'crawler_settings'
  ) THEN
    ALTER TABLE brands ADD COLUMN crawler_settings JSONB DEFAULT '{
      "auto_apply": false,
      "preserve_user_overrides": true,
      "fields_enabled": ["colors", "fonts", "tone_keywords", "voice_summary", "keywords", "about_blurb"],
      "allow_contact_info": false
    }'::jsonb;
  END IF;
END $$;
