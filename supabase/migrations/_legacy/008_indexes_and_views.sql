-- ============================================================================
-- MIGRATION 008: Indexes & Views (Additive)
-- Created: 2025-01-01
-- Description: Add useful indexes for brand intake tracking
-- ============================================================================

-- Additional indexes for intake workflow
CREATE INDEX IF NOT EXISTS idx_brands_intake_completed ON brands(intake_completed);
CREATE INDEX IF NOT EXISTS idx_brands_intake_completed_at ON brands(intake_completed_at);

-- GRANT SELECT ON all views to authenticated users
-- Views will be added as needed
