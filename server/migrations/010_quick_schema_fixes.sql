-- ============================================================================
-- MIGRATION 010: Quick Schema Fixes
-- Created: 2025-11-19
-- Description: Minimal fixes for schema alignment smoke test failures
-- ============================================================================

-- Fix 1: Add missing intake columns to brands
ALTER TABLE public.brands
  ADD COLUMN IF NOT EXISTS intake_completed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS intake_completed_at TIMESTAMPTZ;

-- Fix 2: Add updated_at to brand_members if missing
ALTER TABLE public.brand_members
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Fix 3: Ensure brand_members references auth.users (not user_profiles)
DO $$
BEGIN
  -- Check if user_id FK references user_profiles
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'brand_members'
    AND kcu.column_name = 'user_id'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND EXISTS (
      SELECT 1 FROM information_schema.constraint_column_usage ccu
      WHERE ccu.constraint_name = tc.constraint_name
      AND ccu.table_name = 'user_profiles'
    )
  ) THEN
    -- Drop old FK
    ALTER TABLE brand_members DROP CONSTRAINT IF EXISTS brand_members_user_id_fkey;
    -- Add new FK to auth.users
    ALTER TABLE brand_members ADD CONSTRAINT brand_members_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    RAISE NOTICE 'Fixed brand_members.user_id FK to reference auth.users';
  END IF;
END $$;

-- Fix 4: Add missing columns to content_items
DO $$
BEGIN
  -- Rename content_type to type if needed
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_items' AND column_name = 'content_type'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'content_items' AND column_name = 'type'
    ) THEN
      ALTER TABLE content_items RENAME COLUMN content_type TO type;
      RAISE NOTICE 'Renamed content_type → type in content_items';
    END IF;
  END IF;

  -- Add content JSONB column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_items' AND column_name = 'content'
  ) THEN
    ALTER TABLE content_items ADD COLUMN content JSONB DEFAULT '{}'::jsonb;
    
    -- Migrate body to content if body exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'content_items' AND column_name = 'body'
    ) THEN
      UPDATE content_items SET content = jsonb_build_object('body', body)
      WHERE content = '{}'::jsonb AND body IS NOT NULL;
    END IF;
    
    ALTER TABLE content_items ALTER COLUMN content SET NOT NULL;
    RAISE NOTICE 'Added content JSONB column to content_items';
  END IF;
END $$;

-- Fix 5: Ensure storage_quotas has all columns
ALTER TABLE public.storage_quotas
  ADD COLUMN IF NOT EXISTS warning_threshold_percent INTEGER DEFAULT 80,
  ADD COLUMN IF NOT EXISTS hard_limit_percent INTEGER DEFAULT 100,
  ADD COLUMN IF NOT EXISTS used_bytes BIGINT NOT NULL DEFAULT 0;

-- Fix 6: Add brand_id and date to analytics_metrics if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'analytics_metrics' AND column_name = 'brand_id'
  ) THEN
    ALTER TABLE analytics_metrics ADD COLUMN brand_id UUID;
    
    -- Try to populate from content_items if content_item_id exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'analytics_metrics' AND column_name = 'content_item_id'
    ) THEN
      UPDATE analytics_metrics am
      SET brand_id = ci.brand_id
      FROM content_items ci
      WHERE am.content_item_id = ci.id AND am.brand_id IS NULL;
    END IF;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'analytics_metrics' AND column_name = 'date'
  ) THEN
    ALTER TABLE analytics_metrics ADD COLUMN date DATE;
  END IF;

  -- Add metrics JSONB if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'analytics_metrics' AND column_name = 'metrics'
  ) THEN
    ALTER TABLE analytics_metrics ADD COLUMN metrics JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Quick schema fixes applied successfully';
END $$;

