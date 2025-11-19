-- ============================================================================
-- MIGRATION 011: Add All Missing Brand Columns
-- Created: 2025-11-19
-- Description: Ensures brands table has ALL expected columns
-- ============================================================================

-- Add all potentially missing columns to brands table
ALTER TABLE public.brands
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#3b82f6',
  ADD COLUMN IF NOT EXISTS website_url TEXT,
  ADD COLUMN IF NOT EXISTS industry TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS tone_keywords TEXT[],
  ADD COLUMN IF NOT EXISTS compliance_rules TEXT,
  ADD COLUMN IF NOT EXISTS brand_kit JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS voice_summary TEXT,
  ADD COLUMN IF NOT EXISTS visual_summary TEXT,
  ADD COLUMN IF NOT EXISTS tenant_id UUID,
  ADD COLUMN IF NOT EXISTS workspace_id TEXT,
  ADD COLUMN IF NOT EXISTS created_by UUID,
  ADD COLUMN IF NOT EXISTS scraped_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS scraper_status TEXT DEFAULT 'never_run',
  ADD COLUMN IF NOT EXISTS intake_completed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS intake_completed_at TIMESTAMPTZ;

-- Ensure created_at and updated_at exist
ALTER TABLE public.brands
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Success message
SELECT 'All brand columns added successfully' AS result;

