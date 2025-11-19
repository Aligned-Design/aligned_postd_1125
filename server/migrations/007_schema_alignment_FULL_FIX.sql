-- ============================================================================
-- MIGRATION 007: Full Schema Alignment Fix
-- Created: 2025-11-19
-- Description: Comprehensive fix for all schema mismatches between migrations
--              and code expectations. This migration is SAFE and IDEMPOTENT.
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- PART 1: BRANDS TABLE — Complete Definition
-- ============================================================================
-- Issue: brands table was never explicitly created in migrations
-- Fix: Create with all expected columns

CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#3b82f6',
  website_url TEXT,
  industry TEXT,
  description TEXT,
  tone_keywords TEXT[],
  compliance_rules TEXT,
  brand_kit JSONB DEFAULT '{}'::jsonb,
  voice_summary TEXT,              -- NOTE: Changed from JSONB to TEXT per migration 012
  visual_summary TEXT,             -- NOTE: Changed from JSONB to TEXT per migration 012
  tenant_id UUID,
  workspace_id TEXT,               -- Backward compatibility alias
  created_by UUID,
  scraped_at TIMESTAMPTZ,
  scraper_status TEXT DEFAULT 'never_run',
  intake_completed BOOLEAN DEFAULT FALSE,
  intake_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add missing columns to existing brands table
DO $$
BEGIN
  -- Add tenant_id if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'brands' AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE brands ADD COLUMN tenant_id UUID;
  END IF;

  -- Add created_by if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'brands' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE brands ADD COLUMN created_by UUID;
  END IF;

  -- Add website_url if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'brands' AND column_name = 'website_url'
  ) THEN
    ALTER TABLE brands ADD COLUMN website_url TEXT;
  END IF;

  -- Add scraped_at if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'brands' AND column_name = 'scraped_at'
  ) THEN
    ALTER TABLE brands ADD COLUMN scraped_at TIMESTAMPTZ;
  END IF;

  -- Add scraper_status if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'brands' AND column_name = 'scraper_status'
  ) THEN
    ALTER TABLE brands ADD COLUMN scraper_status TEXT DEFAULT 'never_run';
  END IF;

  -- Add workspace_id if missing (backward compatibility)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'brands' AND column_name = 'workspace_id'
  ) THEN
    ALTER TABLE brands ADD COLUMN workspace_id TEXT;
  END IF;

  -- Add logo_url if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'brands' AND column_name = 'logo_url'
  ) THEN
    ALTER TABLE brands ADD COLUMN logo_url TEXT;
  END IF;

  -- Add primary_color if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'brands' AND column_name = 'primary_color'
  ) THEN
    ALTER TABLE brands ADD COLUMN primary_color TEXT DEFAULT '#3b82f6';
  END IF;

  -- Add description if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'brands' AND column_name = 'description'
  ) THEN
    ALTER TABLE brands ADD COLUMN description TEXT;
  END IF;

  -- Fix voice_summary type: If it's JSONB, we keep it. Production uses TEXT.
  -- Migration 002 added it as JSONB, but 012 expects TEXT
  -- We'll prefer TEXT for consistency with production
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'brands' AND column_name = 'voice_summary' AND data_type = 'jsonb'
  ) THEN
    -- Convert JSONB to TEXT (store as JSON string)
    ALTER TABLE brands ALTER COLUMN voice_summary TYPE TEXT USING voice_summary::text;
  END IF;

  -- Fix visual_summary type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'brands' AND column_name = 'visual_summary' AND data_type = 'jsonb'
  ) THEN
    ALTER TABLE brands ALTER COLUMN visual_summary TYPE TEXT USING visual_summary::text;
  END IF;
END $$;

-- Add foreign keys if they don't exist
DO $$
BEGIN
  -- tenant_id FK
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'brands_tenant_id_fkey'
  ) THEN
    -- Only add FK if tenants table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenants') THEN
      ALTER TABLE brands ADD CONSTRAINT brands_tenant_id_fkey
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL;
    END IF;
  END IF;

  -- created_by FK
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'brands_created_by_fkey'
  ) THEN
    ALTER TABLE brands ADD CONSTRAINT brands_created_by_fkey
      FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes for brands
CREATE INDEX IF NOT EXISTS idx_brands_slug ON brands(slug);
CREATE INDEX IF NOT EXISTS idx_brands_tenant_id ON brands(tenant_id);
CREATE INDEX IF NOT EXISTS idx_brands_created_by ON brands(created_by);
CREATE INDEX IF NOT EXISTS idx_brands_website_url ON brands(website_url);
CREATE INDEX IF NOT EXISTS idx_brands_scraper_status ON brands(scraper_status);
CREATE INDEX IF NOT EXISTS idx_brands_created_at ON brands(created_at);
CREATE INDEX IF NOT EXISTS idx_brands_updated_at ON brands(updated_at);

-- ============================================================================
-- PART 2: BRAND_MEMBERS TABLE — Fix Foreign Keys
-- ============================================================================
-- Issue: user_id references user_profiles instead of auth.users
-- Fix: Drop old FK, add correct FK to auth.users

DO $$
BEGIN
  -- Check if brand_members exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'brand_members') THEN
    
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
      -- Drop the old foreign key
      ALTER TABLE brand_members DROP CONSTRAINT IF EXISTS brand_members_user_id_fkey;
      
      -- Add new foreign key to auth.users
      ALTER TABLE brand_members ADD CONSTRAINT brand_members_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
      
      RAISE NOTICE 'Fixed brand_members.user_id FK to reference auth.users';
    END IF;

    -- Add updated_at column if missing
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'brand_members' AND column_name = 'updated_at'
    ) THEN
      ALTER TABLE brand_members ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
      RAISE NOTICE 'Added updated_at column to brand_members';
    END IF;

    -- Ensure role has a default
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'brand_members' AND column_name = 'role' AND column_default IS NULL
    ) THEN
      ALTER TABLE brand_members ALTER COLUMN role SET DEFAULT 'member';
    END IF;

  END IF;
END $$;

-- ============================================================================
-- PART 3: CONTENT_ITEMS TABLE — Align Schema
-- ============================================================================
-- Issue: Migration 009 uses flat structure, Migration 012 uses JSONB
-- Fix: Rename content_type → type, migrate body → content JSONB

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_items') THEN
    
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

    -- Migrate body TEXT to content JSONB
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'content_items' AND column_name = 'body'
    ) THEN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'content_items' AND column_name = 'content'
      ) THEN
        -- Add content column as JSONB
        ALTER TABLE content_items ADD COLUMN content JSONB;
        
        -- Migrate body to content.body
        UPDATE content_items SET content = jsonb_build_object('body', body)
        WHERE content IS NULL AND body IS NOT NULL;
        
        -- Set default for content
        ALTER TABLE content_items ALTER COLUMN content SET DEFAULT '{}'::jsonb;
        ALTER TABLE content_items ALTER COLUMN content SET NOT NULL;
        
        -- Optionally drop body column (or keep for backward compatibility)
        -- ALTER TABLE content_items DROP COLUMN body;
        
        RAISE NOTICE 'Migrated body TEXT → content JSONB in content_items';
      END IF;
    END IF;

    -- Fix created_by FK if it references user_profiles
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'content_items'
      AND kcu.column_name = 'created_by'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage ccu
        WHERE ccu.constraint_name = tc.constraint_name
        AND ccu.table_name = 'user_profiles'
      )
    ) THEN
      ALTER TABLE content_items DROP CONSTRAINT IF EXISTS content_items_created_by_fkey;
      ALTER TABLE content_items ADD CONSTRAINT content_items_created_by_fkey
        FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
      RAISE NOTICE 'Fixed content_items.created_by FK to reference auth.users';
    END IF;

    -- Fix approved_by FK if it references user_profiles
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'content_items' AND column_name = 'approved_by'
    ) THEN
      IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'content_items'
        AND kcu.column_name = 'approved_by'
        AND tc.constraint_type = 'FOREIGN KEY'
        AND EXISTS (
          SELECT 1 FROM information_schema.constraint_column_usage ccu
          WHERE ccu.constraint_name = tc.constraint_name
          AND ccu.table_name = 'user_profiles'
        )
      ) THEN
        ALTER TABLE content_items DROP CONSTRAINT IF EXISTS content_items_approved_by_fkey;
        ALTER TABLE content_items ADD CONSTRAINT content_items_approved_by_fkey
          FOREIGN KEY (approved_by) REFERENCES auth.users(id) ON DELETE SET NULL;
        RAISE NOTICE 'Fixed content_items.approved_by FK to reference auth.users';
      END IF;
    END IF;

  END IF;
END $$;

-- ============================================================================
-- PART 4: POST_APPROVALS TABLE — Type Alignment
-- ============================================================================
-- Issue: TEXT vs UUID for id, brand_id, post_id, approved_by
-- Fix: Only fix if current production is TEXT (otherwise skip)

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'post_approvals') THEN
    
    -- Check if id is TEXT (if so, skip conversion as it may break existing data)
    -- Production schema check: if TEXT, leave as-is unless user explicitly wants migration
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'post_approvals' AND column_name = 'id' AND data_type = 'text'
    ) THEN
      RAISE NOTICE 'post_approvals.id is TEXT. Skipping conversion to UUID (requires manual migration if needed).';
    END IF;

    -- Add rejection_reason if missing
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'post_approvals' AND column_name = 'rejection_reason'
    ) THEN
      ALTER TABLE post_approvals ADD COLUMN rejection_reason TEXT;
      RAISE NOTICE 'Added rejection_reason to post_approvals';
    END IF;

  END IF;
END $$;

-- ============================================================================
-- PART 5: ANALYTICS_METRICS TABLE — Align Schema
-- ============================================================================
-- Issue: Flat columns vs JSONB metrics field
-- Fix: Add brand_id, date, migrate flat columns to metrics JSONB

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'analytics_metrics') THEN
    
    -- Add brand_id if missing
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'analytics_metrics' AND column_name = 'brand_id'
    ) THEN
      ALTER TABLE analytics_metrics ADD COLUMN brand_id UUID;
      
      -- Try to populate brand_id from content_items if content_item_id exists
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'analytics_metrics' AND column_name = 'content_item_id'
      ) THEN
        UPDATE analytics_metrics am
        SET brand_id = ci.brand_id
        FROM content_items ci
        WHERE am.content_item_id = ci.id AND am.brand_id IS NULL;
      END IF;
      
      -- Add FK constraint
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'brands') THEN
        ALTER TABLE analytics_metrics ADD CONSTRAINT analytics_metrics_brand_id_fkey
          FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;
      END IF;
      
      RAISE NOTICE 'Added brand_id to analytics_metrics';
    END IF;

    -- Add date if missing
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'analytics_metrics' AND column_name = 'date'
    ) THEN
      ALTER TABLE analytics_metrics ADD COLUMN date DATE;
      
      -- Populate from recorded_at if it exists
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'analytics_metrics' AND column_name = 'recorded_at'
      ) THEN
        UPDATE analytics_metrics SET date = recorded_at::date WHERE date IS NULL;
      END IF;
      
      RAISE NOTICE 'Added date to analytics_metrics';
    END IF;

    -- Migrate flat columns to metrics JSONB
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'analytics_metrics' AND column_name = 'metrics'
    ) THEN
      -- Check if flat columns exist
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'analytics_metrics' AND column_name = 'impressions'
      ) THEN
        ALTER TABLE analytics_metrics ADD COLUMN metrics JSONB;
        
        -- Migrate flat columns to JSONB
        UPDATE analytics_metrics SET metrics = jsonb_build_object(
          'impressions', COALESCE(impressions, 0),
          'reach', COALESCE(reach, 0),
          'engagements', COALESCE(engagements, 0),
          'clicks', COALESCE(clicks, 0),
          'shares', COALESCE(shares, 0),
          'comments', COALESCE(comments, 0),
          'likes', COALESCE(likes, 0)
        ) WHERE metrics IS NULL;
        
        -- Make metrics NOT NULL
        ALTER TABLE analytics_metrics ALTER COLUMN metrics SET NOT NULL;
        
        -- Optionally drop old columns (or keep for backward compatibility)
        -- ALTER TABLE analytics_metrics DROP COLUMN IF EXISTS impressions;
        -- ALTER TABLE analytics_metrics DROP COLUMN IF EXISTS reach;
        -- etc.
        
        RAISE NOTICE 'Migrated flat columns → metrics JSONB in analytics_metrics';
      END IF;
    END IF;

  END IF;
END $$;

-- ============================================================================
-- PART 6: AUDIT_LOGS TABLE — Fix Foreign Keys
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
    
    -- Fix user_id FK if it references user_profiles
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'audit_logs'
      AND kcu.column_name = 'user_id'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage ccu
        WHERE ccu.constraint_name = tc.constraint_name
        AND ccu.table_name = 'user_profiles'
      )
    ) THEN
      ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey;
      ALTER TABLE audit_logs ADD CONSTRAINT audit_logs_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
      RAISE NOTICE 'Fixed audit_logs.user_id FK to reference auth.users';
    END IF;

  END IF;
END $$;

-- ============================================================================
-- PART 7: CLIENT_SETTINGS TABLE — Fix Foreign Keys
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'client_settings') THEN
    
    -- Fix client_id FK if it references user_profiles
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'client_settings'
      AND kcu.column_name = 'client_id'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage ccu
        WHERE ccu.constraint_name = tc.constraint_name
        AND ccu.table_name = 'user_profiles'
      )
    ) THEN
      ALTER TABLE client_settings DROP CONSTRAINT IF EXISTS client_settings_client_id_fkey;
      -- Note: client_id may be VARCHAR, so only add FK if it's UUID
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'client_settings' AND column_name = 'client_id' AND data_type = 'uuid'
      ) THEN
        ALTER TABLE client_settings ADD CONSTRAINT client_settings_client_id_fkey
          FOREIGN KEY (client_id) REFERENCES auth.users(id) ON DELETE SET NULL;
        RAISE NOTICE 'Fixed client_settings.client_id FK to reference auth.users';
      ELSE
        RAISE NOTICE 'client_settings.client_id is not UUID, skipping FK constraint';
      END IF;
    END IF;

  END IF;
END $$;

-- ============================================================================
-- PART 8: Add Indexes for Performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_content_items_brand_id ON content_items(brand_id);
CREATE INDEX IF NOT EXISTS idx_content_items_status ON content_items(status);
CREATE INDEX IF NOT EXISTS idx_content_items_created_by ON content_items(created_by);
CREATE INDEX IF NOT EXISTS idx_analytics_metrics_brand_date ON analytics_metrics(brand_id, date);
CREATE INDEX IF NOT EXISTS idx_analytics_metrics_platform ON analytics_metrics(platform);

-- ============================================================================
-- PART 9: Add Updated_At Triggers
-- ============================================================================

-- Create or replace the update_updated_at function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for tables that have updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_brands_updated_at'
  ) THEN
    CREATE TRIGGER update_brands_updated_at
      BEFORE UPDATE ON brands
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_brand_members_updated_at'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'brand_members' AND column_name = 'updated_at'
    ) THEN
      CREATE TRIGGER update_brand_members_updated_at
        BEFORE UPDATE ON brand_members
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_content_items_updated_at'
  ) THEN
    CREATE TRIGGER update_content_items_updated_at
      BEFORE UPDATE ON content_items
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ============================================================================
-- PART 10: Comments for Documentation
-- ============================================================================

COMMENT ON TABLE brands IS 'Brand entities - core identity for content generation (aligned schema v007)';
COMMENT ON COLUMN brands.tenant_id IS 'Workspace/tenant this brand belongs to (UUID FK to tenants.id)';
COMMENT ON COLUMN brands.workspace_id IS 'Backward compatibility alias for tenant_id (TEXT)';
COMMENT ON COLUMN brands.created_by IS 'User who created the brand (UUID FK to auth.users.id)';
COMMENT ON COLUMN brands.website_url IS 'Brand website URL for crawler scraping';
COMMENT ON COLUMN brands.scraped_at IS 'Timestamp of last successful website scrape';
COMMENT ON COLUMN brands.scraper_status IS 'Crawler status: never_run, running, completed, failed';
COMMENT ON COLUMN brands.voice_summary IS 'Voice & tone summary (TEXT, migrated from JSONB)';
COMMENT ON COLUMN brands.visual_summary IS 'Visual identity summary (TEXT, migrated from JSONB)';

COMMENT ON TABLE brand_members IS 'User-brand access control - CRITICAL for RLS (aligned schema v007)';
COMMENT ON COLUMN brand_members.user_id IS 'User ID from auth.users (NOT user_profiles)';

COMMENT ON TABLE content_items IS 'Content pieces - posts, blogs, captions (aligned schema v007)';
COMMENT ON COLUMN content_items.type IS 'Content type (renamed from content_type)';
COMMENT ON COLUMN content_items.content IS 'Content data as JSONB (migrated from body TEXT)';

-- ============================================================================
-- END OF MIGRATION 007
-- ============================================================================

-- Final notice
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 007 completed successfully';
  RAISE NOTICE '📊 Schema is now aligned with backend expectations';
  RAISE NOTICE '🔍 Run SCHEMA_AUDIT_REPORT.md for verification details';
END $$;

