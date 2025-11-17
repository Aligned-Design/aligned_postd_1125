-- PHASE 9 Feature 1: Client Settings Table
-- Stores email preferences, notification settings, and account preferences per client/brand

CREATE TABLE IF NOT EXISTS client_settings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  client_id TEXT NOT NULL,
  brand_id TEXT NOT NULL,

  -- Email Preferences
  email_preferences JSONB NOT NULL DEFAULT '{
    "approvalsNeeded": true,
    "approvalReminders": true,
    "publishFailures": true,
    "publishSuccess": false,
    "weeklyDigest": false,
    "dailyDigest": false,
    "reminderFrequency": "24h",
    "digestFrequency": "weekly",
    "maxEmailsPerDay": 20
  }'::jsonb,

  -- Account Preferences
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'es', 'fr', 'de')),

  -- Unsubscribe Management
  unsubscribe_token TEXT UNIQUE,
  unsubscribed_from_all BOOLEAN DEFAULT FALSE,
  unsubscribed_types TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_modified_by TEXT,

  -- Constraints
  UNIQUE(client_id, brand_id),
  FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_client_settings_brand ON client_settings(brand_id);
CREATE INDEX IF NOT EXISTS idx_client_settings_client_brand ON client_settings(client_id, brand_id);
CREATE INDEX IF NOT EXISTS idx_client_settings_unsubscribe_token ON client_settings(unsubscribe_token);
CREATE INDEX IF NOT EXISTS idx_client_settings_created_at ON client_settings(created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE client_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view settings for their brand
CREATE POLICY "brand_isolation_select" ON client_settings
  FOR SELECT USING (
    brand_id = current_setting('jwt.claims.brand_id', TRUE)::TEXT
    OR current_setting('jwt.claims.role', TRUE) = 'admin'
  );

-- RLS Policy: Users can only update settings for their brand
CREATE POLICY "brand_isolation_update" ON client_settings
  FOR UPDATE USING (
    brand_id = current_setting('jwt.claims.brand_id', TRUE)::TEXT
    OR current_setting('jwt.claims.role', TRUE) = 'admin'
  );

-- RLS Policy: Users can insert settings for their brand
CREATE POLICY "brand_isolation_insert" ON client_settings
  FOR INSERT WITH CHECK (
    brand_id = current_setting('jwt.claims.brand_id', TRUE)::TEXT
    OR current_setting('jwt.claims.role', TRUE) = 'admin'
  );

-- RLS Policy: Users can delete settings for their brand
CREATE POLICY "brand_isolation_delete" ON client_settings
  FOR DELETE USING (
    brand_id = current_setting('jwt.claims.brand_id', TRUE)::TEXT
    OR current_setting('jwt.claims.role', TRUE) = 'admin'
  );

-- Allow public access to unsubscribe endpoint (no auth required)
CREATE POLICY "public_unsubscribe_select" ON client_settings
  FOR SELECT USING (unsubscribe_token IS NOT NULL)
  WITH CHECK (TRUE);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_client_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_client_settings_updated_at
  BEFORE UPDATE ON client_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_client_settings_timestamp();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON client_settings TO authenticated;
GRANT SELECT ON client_settings TO anon; -- For unsubscribe endpoint
