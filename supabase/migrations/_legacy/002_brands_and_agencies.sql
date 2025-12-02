-- ============================================================================
-- MIGRATION 002: Brands & Agency Management (Additive)
-- Created: 2025-01-01
-- Description: Add intake fields to existing brand structure
-- ============================================================================

-- Add brand intake fields to existing brands table
ALTER TABLE brands ADD COLUMN IF NOT EXISTS brand_kit JSONB DEFAULT '{}'::jsonb;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS voice_summary JSONB DEFAULT '{}'::jsonb;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS visual_summary JSONB DEFAULT '{}'::jsonb;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS intake_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS intake_completed_at TIMESTAMP WITH TIME ZONE;

-- Tables already exist in current schema - no CREATE statements needed
-- All existing tables (brand_members, brand_assets, white_label_configs) are preserved
-- with their current structure and RLS policies
