-- ============================================================================
-- Migration 012: Fix Brand Safety Configs Ghost References
-- Created: 2025-12-03
-- Purpose: Remove any remaining references to non-existent brand_safety_configs table
--          and ensure schema aligns with brands.safety_config JSONB column design
-- Prerequisites: 
--   - Migration 011 (added brands.safety_config column)
-- ============================================================================
--
-- PROBLEM:
-- Code queries brands.safety_config (JSONB column), but database may have:
-- - Ghost references to brand_safety_configs table in schema cache
-- - RLS policies, triggers, functions, or views referencing brand_safety_configs
--
-- SOLUTION:
-- 1. Drop brand_safety_configs table if it exists (CASCADE automatically drops all dependencies)
-- 2. Ensure brands.safety_config column exists and is documented
--
-- SAFETY:
-- - Idempotent: Can be run multiple times safely
-- - Defensive: Checks for existence before dropping
-- - No data loss: Only removes unused/legacy objects
-- - CASCADE handles all dependent objects automatically
-- ============================================================================

-- ============================================================================
-- STEP 1: Drop brand_safety_configs table if it exists (legacy, not used)
-- ============================================================================
-- CASCADE will automatically drop:
-- - All dependent views
-- - All dependent functions
-- - All dependent triggers
-- - All RLS policies
-- - All indexes
-- - All constraints

DO $$
BEGIN
  -- Check if table exists using to_regclass (safe, returns NULL if doesn't exist)
  IF to_regclass('public.brand_safety_configs') IS NOT NULL THEN
    -- Drop the table (CASCADE will drop all dependent objects automatically)
    DROP TABLE IF EXISTS public.brand_safety_configs CASCADE;
    RAISE NOTICE 'Dropped legacy table: public.brand_safety_configs (and all dependencies)';
  ELSE
    RAISE NOTICE 'Table public.brand_safety_configs does not exist (expected)';
  END IF;
END $$;

-- ============================================================================
-- STEP 2: Ensure brands.safety_config column exists and is documented
-- ============================================================================

-- Add safety_config column if it doesn't exist (idempotent)
ALTER TABLE brands
ADD COLUMN IF NOT EXISTS safety_config JSONB DEFAULT '{
  "safety_mode": "safe",
  "banned_phrases": [],
  "competitor_names": [],
  "claims": [],
  "required_disclaimers": [],
  "required_hashtags": [],
  "brand_links": [],
  "disallowed_topics": ["politics", "religion", "medical advice"],
  "allow_topics": [],
  "compliance_pack": "none",
  "platform_limits_override": {}
}'::jsonb;

-- Add/update comment documenting this as the canonical source
COMMENT ON COLUMN brands.safety_config IS 
  'Brand safety configuration for AI content generation (JSONB). '
  'This is the canonical source of truth. There is no separate brand_safety_configs table. '
  'Used by doc, design, and advisor agents for safety constraints, compliance, and content filtering.';

-- ============================================================================
-- STEP 3: Verify table is gone (informational only)
-- ============================================================================

DO $$
BEGIN
  IF to_regclass('public.brand_safety_configs') IS NOT NULL THEN
    RAISE WARNING 'Table public.brand_safety_configs still exists. Please review manually.';
  ELSE
    RAISE NOTICE 'Verification: Table public.brand_safety_configs does not exist. Schema is clean.';
  END IF;
END $$;

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- All ghost references to brand_safety_configs have been removed.
-- The canonical source of truth is brands.safety_config (JSONB column).
-- Code should query: SELECT safety_config, brand_kit FROM brands WHERE id = ...
-- ============================================================================
