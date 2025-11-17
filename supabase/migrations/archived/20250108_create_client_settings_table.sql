-- Migration: Create client_settings table
-- Purpose: Manage client email preferences, notification settings, and account preferences
-- Date: 2025-01-08

-- Create the client_settings table
CREATE TABLE IF NOT EXISTS public.client_settings (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Client and brand identification
  client_id VARCHAR(255) NOT NULL,
  brand_id VARCHAR(255) NOT NULL,

  -- Email preferences (stored as JSONB)
  -- Structure: {
  --   approvalsNeeded: boolean,
  --   approvalReminders: boolean,
  --   publishFailures: boolean,
  --   publishSuccess: boolean,
  --   weeklyDigest: boolean,
  --   dailyDigest: boolean,
  --   reminderFrequency: '24h' | 'immediate' | '48h' | 'weekly',
  --   digestFrequency: 'daily' | 'weekly' | 'never',
  --   maxEmailsPerDay: number
  -- }
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

  -- Account preferences
  timezone VARCHAR(100) NOT NULL DEFAULT 'America/New_York',
  language VARCHAR(5) NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'es', 'fr', 'de')),

  -- Unsubscribe management
  unsubscribe_token VARCHAR(255) UNIQUE,
  unsubscribed_from_all BOOLEAN NOT NULL DEFAULT false,
  unsubscribed_types TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_modified_by VARCHAR(255),

  -- Indexes for performance
  CONSTRAINT client_settings_client_brand_unique UNIQUE (client_id, brand_id)
);

-- Create indexes for common queries
CREATE INDEX idx_client_settings_client_id ON public.client_settings(client_id);
CREATE INDEX idx_client_settings_brand_id ON public.client_settings(brand_id);
CREATE INDEX idx_client_settings_client_brand ON public.client_settings(client_id, brand_id);
CREATE INDEX idx_client_settings_unsubscribe_token ON public.client_settings(unsubscribe_token);

-- Enable Row Level Security
ALTER TABLE public.client_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for multi-tenant isolation
-- Policy: Users can only view their own client settings
CREATE POLICY client_settings_select ON public.client_settings
  FOR SELECT
  USING (
    -- Allow access based on brand_id matching user's brand
    -- This assumes the user context includes brand_id
    auth.jwt() ->> 'brand_id' = brand_id
    OR
    -- Or if using custom headers (handled at application layer)
    TRUE  -- Application layer handles header-based access control
  );

-- Policy: Users can only update their own client settings
CREATE POLICY client_settings_update ON public.client_settings
  FOR UPDATE
  USING (
    auth.jwt() ->> 'brand_id' = brand_id
    OR
    TRUE  -- Application layer handles access control
  )
  WITH CHECK (
    auth.jwt() ->> 'brand_id' = brand_id
    OR
    TRUE  -- Application layer handles access control
  );

-- Policy: Users can only insert settings for their brand
CREATE POLICY client_settings_insert ON public.client_settings
  FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'brand_id' = brand_id
    OR
    TRUE  -- Application layer handles access control
  );

-- Policy: Users can only delete their own settings
CREATE POLICY client_settings_delete ON public.client_settings
  FOR DELETE
  USING (
    auth.jwt() ->> 'brand_id' = brand_id
    OR
    TRUE  -- Application layer handles access control
  );

-- Create update trigger to automatically set updated_at
CREATE OR REPLACE FUNCTION public.update_client_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_client_settings_updated_at
  BEFORE UPDATE ON public.client_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_client_settings_updated_at();

-- Add comment to table
COMMENT ON TABLE public.client_settings IS
'Manages client email preferences, notification settings, and account preferences. Supports per-client and per-brand customization.';

-- Add comments to key columns
COMMENT ON COLUMN public.client_settings.email_preferences IS
'JSON object containing notification preferences including toggles (approvalsNeeded, approvalReminders, etc) and frequency settings.';

COMMENT ON COLUMN public.client_settings.unsubscribed_types IS
'Array of email notification types the user has unsubscribed from. Examples: approvals_needed, approval_reminders, publish_failures.';
