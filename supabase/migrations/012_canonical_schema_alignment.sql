-- ============================================================================
-- MIGRATION 012: Canonical Schema Alignment
-- Created: 2025-01-XX
-- Description: Aligns Supabase schema to canonical Postd schema
--              Ensures all app features have a clear home in the database
-- ============================================================================

-- Enable extension for gen_random_uuid (usually already enabled in Supabase)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

------------------------------------------------------------
-- 1. CORE IDENTITY & ACCESS
------------------------------------------------------------

-- Tenants table (workspace/tenant management)
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  plan TEXT DEFAULT 'free',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure brands table has all required columns
-- Note: brands table may already exist, so we use ALTER TABLE IF EXISTS pattern
DO $$
BEGIN
  -- Add tenant_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'brands' AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE brands ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL;
    
    -- If workspace_id exists, copy values to tenant_id
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'brands' AND column_name = 'workspace_id'
    ) THEN
      UPDATE brands SET tenant_id = workspace_id::uuid WHERE tenant_id IS NULL AND workspace_id IS NOT NULL;
    END IF;
  END IF;

  -- Keep workspace_id for backward compatibility (alias to tenant_id)
  -- But ensure tenant_id is the source of truth
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'brands' AND column_name = 'workspace_id'
  ) THEN
    -- Sync workspace_id with tenant_id if they differ
    UPDATE brands SET workspace_id = tenant_id::text WHERE workspace_id IS NULL AND tenant_id IS NOT NULL;
  END IF;

  -- Add created_by if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'brands' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE brands ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;

  -- Add website_url if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'brands' AND column_name = 'website_url'
  ) THEN
    ALTER TABLE brands ADD COLUMN website_url TEXT;
  END IF;

  -- Add scraped_at if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'brands' AND column_name = 'scraped_at'
  ) THEN
    ALTER TABLE brands ADD COLUMN scraped_at TIMESTAMPTZ;
  END IF;

  -- Add scraper_status if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'brands' AND column_name = 'scraper_status'
  ) THEN
    ALTER TABLE brands ADD COLUMN scraper_status TEXT DEFAULT 'never_run';
  END IF;

  -- Add workspace_id if it doesn't exist (backward compatibility alias to tenant_id)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'brands' AND column_name = 'workspace_id'
  ) THEN
    -- workspace_id can be TEXT or UUID depending on existing schema
    -- Check if we should use TEXT (for compatibility) or UUID
    ALTER TABLE brands ADD COLUMN workspace_id TEXT;
    
    -- Sync workspace_id with tenant_id for existing rows
    UPDATE brands SET workspace_id = tenant_id::text WHERE workspace_id IS NULL AND tenant_id IS NOT NULL;
  END IF;

  -- Add industry if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'brands' AND column_name = 'industry'
  ) THEN
    ALTER TABLE brands ADD COLUMN industry TEXT;
  END IF;

  -- Ensure brand_kit exists (JSONB)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'brands' AND column_name = 'brand_kit'
  ) THEN
    ALTER TABLE brands ADD COLUMN brand_kit JSONB DEFAULT '{}'::jsonb;
  END IF;

  -- Ensure voice_summary exists (can be TEXT or JSONB)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'brands' AND column_name = 'voice_summary'
  ) THEN
    ALTER TABLE brands ADD COLUMN voice_summary TEXT;
  END IF;

  -- Ensure visual_summary exists (can be TEXT or JSONB)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'brands' AND column_name = 'visual_summary'
  ) THEN
    ALTER TABLE brands ADD COLUMN visual_summary TEXT;
  END IF;

  -- Ensure slug exists and is unique
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'brands' AND column_name = 'slug'
  ) THEN
    ALTER TABLE brands ADD COLUMN slug TEXT UNIQUE;
  END IF;

  -- Ensure name is NOT NULL
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'brands' AND column_name = 'name' AND is_nullable = 'YES'
  ) THEN
    -- Update any NULL names first
    UPDATE brands SET name = 'Untitled Brand' WHERE name IS NULL;
    ALTER TABLE brands ALTER COLUMN name SET NOT NULL;
  END IF;
END $$;

-- Brand members table (CRITICAL for RLS and access control)
-- Ensure it references auth.users (not user_profiles)
CREATE TABLE IF NOT EXISTS brand_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, brand_id)
);

-- Fix brand_members if it references user_profiles instead of auth.users
DO $$
BEGIN
  -- Check if user_id references user_profiles
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
  END IF;
END $$;

------------------------------------------------------------
-- 2. MEDIA MANAGEMENT
------------------------------------------------------------

-- Media assets metadata
CREATE TABLE IF NOT EXISTS media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  category TEXT,
  filename TEXT NOT NULL,
  path TEXT NOT NULL,
  hash TEXT,
  mime_type TEXT,
  size_bytes BIGINT,
  used_in TEXT[] DEFAULT ARRAY[]::TEXT[],
  usage_count INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Media usage logs (audit trail)
CREATE TABLE IF NOT EXISTS media_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  used_in TEXT NOT NULL,
  used_by_user UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  context JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Storage quotas per brand
CREATE TABLE IF NOT EXISTS storage_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  limit_bytes BIGINT NOT NULL DEFAULT 5368709120, -- 5GB default
  used_bytes BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (brand_id)
);

------------------------------------------------------------
-- 3. PUBLISHING & OAUTH
------------------------------------------------------------

CREATE TABLE IF NOT EXISTS publishing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  content JSONB NOT NULL,
  platforms TEXT[] NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS publishing_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES publishing_jobs(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  status TEXT NOT NULL,
  platform_post_id TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Platform connections (update existing if needed)
DO $$
BEGIN
  -- Ensure platform_connections has status column (if using 'is_active', add status as alias)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'platform_connections' AND column_name = 'status'
  ) THEN
    -- Add status column, defaulting from is_active if it exists
    ALTER TABLE platform_connections ADD COLUMN status TEXT NOT NULL DEFAULT 'active';
    
    -- Migrate is_active to status if is_active exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'platform_connections' AND column_name = 'is_active'
    ) THEN
      UPDATE platform_connections SET status = CASE WHEN is_active THEN 'active' ELSE 'inactive' END;
    END IF;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS platform_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  sync_type TEXT NOT NULL,
  status TEXT NOT NULL,
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);

------------------------------------------------------------
-- 4. ANALYTICS & ADVISOR
------------------------------------------------------------

-- Analytics metrics (update existing to match canonical schema)
DO $$
BEGIN
  -- Check if analytics_metrics exists and has brand_id
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'analytics_metrics'
  ) THEN
    -- Add brand_id if it doesn't exist (currently may only have content_item_id)
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'analytics_metrics' AND column_name = 'brand_id'
    ) THEN
      ALTER TABLE analytics_metrics ADD COLUMN brand_id UUID REFERENCES brands(id) ON DELETE CASCADE;
      
      -- Try to populate brand_id from content_items if content_item_id exists
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'analytics_metrics' AND column_name = 'content_item_id'
      ) THEN
        UPDATE analytics_metrics am
        SET brand_id = ci.brand_id
        FROM content_items ci
        WHERE am.content_item_id = ci.id;
      END IF;
    END IF;

    -- Add date column if it doesn't exist
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
    END IF;

    -- Add metrics JSONB column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'analytics_metrics' AND column_name = 'metrics'
    ) THEN
      ALTER TABLE analytics_metrics ADD COLUMN metrics JSONB;
      
      -- Migrate existing columns to metrics JSONB
      ALTER TABLE analytics_metrics ADD COLUMN metrics_temp JSONB;
      UPDATE analytics_metrics SET metrics_temp = jsonb_build_object(
        'impressions', COALESCE(impressions, 0),
        'reach', COALESCE(reach, 0),
        'engagements', COALESCE(engagements, 0),
        'clicks', COALESCE(clicks, 0),
        'shares', COALESCE(shares, 0),
        'comments', COALESCE(comments, 0),
        'likes', COALESCE(likes, 0)
      );
      ALTER TABLE analytics_metrics DROP COLUMN IF EXISTS impressions;
      ALTER TABLE analytics_metrics DROP COLUMN IF EXISTS reach;
      ALTER TABLE analytics_metrics DROP COLUMN IF EXISTS engagements;
      ALTER TABLE analytics_metrics DROP COLUMN IF EXISTS clicks;
      ALTER TABLE analytics_metrics DROP COLUMN IF EXISTS shares;
      ALTER TABLE analytics_metrics DROP COLUMN IF EXISTS comments;
      ALTER TABLE analytics_metrics DROP COLUMN IF EXISTS likes;
      ALTER TABLE analytics_metrics RENAME COLUMN metrics_temp TO metrics;
    END IF;
  ELSE
    -- Create analytics_metrics if it doesn't exist
    CREATE TABLE analytics_metrics (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
      platform TEXT NOT NULL,
      date DATE NOT NULL,
      metrics JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (brand_id, platform, date)
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS analytics_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  sync_type TEXT NOT NULL,
  status TEXT NOT NULL,
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS analytics_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  metric TEXT NOT NULL,
  target NUMERIC NOT NULL,
  current NUMERIC NOT NULL DEFAULT 0,
  deadline DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS advisor_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  insight_id TEXT NOT NULL,
  category TEXT,
  type TEXT,
  feedback TEXT,
  previous_weight NUMERIC,
  new_weight NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auto_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  plan_data JSONB NOT NULL,
  confidence NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (brand_id, month)
);

------------------------------------------------------------
-- 5. APPROVALS, CLIENT SETTINGS & COMPLIANCE
------------------------------------------------------------

-- Client settings (update existing if needed)
DO $$
BEGIN
  -- Ensure client_settings references auth.users for client_id
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'client_settings'
  ) THEN
    -- Check if client_id references user_profiles
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
      -- Drop old constraint
      ALTER TABLE client_settings DROP CONSTRAINT IF EXISTS client_settings_client_id_fkey;
      -- Add new constraint to auth.users
      ALTER TABLE client_settings ADD CONSTRAINT client_settings_client_id_fkey
        FOREIGN KEY (client_id) REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;

    -- Add email_preferences if missing
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'client_settings' AND column_name = 'email_preferences'
    ) THEN
      ALTER TABLE client_settings ADD COLUMN email_preferences JSONB;
    END IF;

    -- Add timezone if missing
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'client_settings' AND column_name = 'timezone'
    ) THEN
      ALTER TABLE client_settings ADD COLUMN timezone TEXT DEFAULT 'America/Chicago';
    END IF;

    -- Add unsubscribe_token if missing
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'client_settings' AND column_name = 'unsubscribe_token'
    ) THEN
      ALTER TABLE client_settings ADD COLUMN unsubscribe_token TEXT;
    END IF;
  ELSE
    -- Create client_settings if it doesn't exist
    CREATE TABLE client_settings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      client_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
      brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
      email_preferences JSONB,
      timezone TEXT DEFAULT 'America/Chicago',
      unsubscribe_token TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (client_id, brand_id)
    );
  END IF;
END $$;

-- Post approvals (update existing if needed)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'post_approvals'
  ) THEN
    -- Ensure post_id is UUID (may be TEXT in some migrations)
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'post_approvals' AND column_name = 'post_id' AND data_type = 'text'
    ) THEN
      -- Add new UUID column
      ALTER TABLE post_approvals ADD COLUMN post_id_uuid UUID;
      -- Try to convert existing post_id to UUID (will be NULL for invalid)
      UPDATE post_approvals SET post_id_uuid = post_id::uuid WHERE post_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
      -- Drop old column and rename new one
      ALTER TABLE post_approvals DROP COLUMN post_id;
      ALTER TABLE post_approvals RENAME COLUMN post_id_uuid TO post_id;
    END IF;

    -- Ensure approved_by references auth.users
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'post_approvals' AND column_name = 'approved_by'
    ) THEN
      -- Check if it's TEXT and needs conversion
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'post_approvals' AND column_name = 'approved_by' AND data_type = 'text'
      ) THEN
        ALTER TABLE post_approvals ADD COLUMN approved_by_uuid UUID REFERENCES auth.users(id) ON DELETE SET NULL;
        UPDATE post_approvals SET approved_by_uuid = approved_by::uuid WHERE approved_by ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
        ALTER TABLE post_approvals DROP COLUMN approved_by;
        ALTER TABLE post_approvals RENAME COLUMN approved_by_uuid TO approved_by;
      END IF;
    ELSE
      ALTER TABLE post_approvals ADD COLUMN approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;

    -- Add rejection_reason if missing
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'post_approvals' AND column_name = 'rejection_reason'
    ) THEN
      ALTER TABLE post_approvals ADD COLUMN rejection_reason TEXT;
    END IF;
  ELSE
    -- Create post_approvals if it doesn't exist
    CREATE TABLE post_approvals (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
      post_id UUID,
      status TEXT NOT NULL DEFAULT 'pending',
      approved_at TIMESTAMPTZ,
      approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
      rejection_reason TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  END IF;
END $$;

-- Audit logs (update existing if needed)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'audit_logs'
  ) THEN
    -- Ensure user_id references auth.users
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
    END IF;

    -- Add metadata JSONB if missing (may be called changes)
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'audit_logs' AND column_name = 'metadata'
    ) THEN
      -- If changes exists, rename it to metadata
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'audit_logs' AND column_name = 'changes'
      ) THEN
        ALTER TABLE audit_logs RENAME COLUMN changes TO metadata;
      ELSE
        ALTER TABLE audit_logs ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
      END IF;
    END IF;
  ELSE
    -- Create audit_logs if it doesn't exist
    CREATE TABLE audit_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
      user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
      action TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      resource_id TEXT,
      metadata JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
  provider TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  idempotency_key TEXT,
  status TEXT NOT NULL DEFAULT 'received',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhook_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES webhook_events(id) ON DELETE CASCADE,
  attempt_number INTEGER NOT NULL,
  status TEXT NOT NULL,
  response_code INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS escalation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  rule_type TEXT NOT NULL,
  trigger_hours INTEGER NOT NULL,
  escalate_to_role TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS escalation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  approval_id UUID REFERENCES post_approvals(id) ON DELETE SET NULL,
  rule_id UUID REFERENCES escalation_rules(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

------------------------------------------------------------
-- 6. CONTENT & CREATIVE STUDIO
------------------------------------------------------------

-- Content items (update existing if needed)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'content_items'
  ) THEN
    -- Ensure type column exists (may be content_type)
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'content_items' AND column_name = 'type'
    ) THEN
      -- If content_type exists, rename it
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'content_items' AND column_name = 'content_type'
      ) THEN
        ALTER TABLE content_items RENAME COLUMN content_type TO type;
      ELSE
        ALTER TABLE content_items ADD COLUMN type TEXT NOT NULL DEFAULT 'post';
      END IF;
    END IF;

    -- Ensure content JSONB exists (may need to migrate from body)
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'content_items' AND column_name = 'content'
    ) THEN
      ALTER TABLE content_items ADD COLUMN content JSONB;
      
      -- Migrate body to content if body exists
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'content_items' AND column_name = 'body'
      ) THEN
        UPDATE content_items SET content = jsonb_build_object('body', body) WHERE content IS NULL AND body IS NOT NULL;
      END IF;
      
      -- Make content NOT NULL after migration
      ALTER TABLE content_items ALTER COLUMN content SET NOT NULL;
      ALTER TABLE content_items ALTER COLUMN content SET DEFAULT '{}'::jsonb;
    END IF;

    -- Ensure created_by references auth.users
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
    END IF;
  ELSE
    -- Create content_items if it doesn't exist
    CREATE TABLE content_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      content JSONB NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS scheduled_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  platforms TEXT[] NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (content_id, scheduled_at)
);

------------------------------------------------------------
-- 7. WORKFLOW & NOTIFICATIONS
------------------------------------------------------------

CREATE TABLE IF NOT EXISTS workflow_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  steps JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workflow_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES workflow_templates(id) ON DELETE SET NULL,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active',
  current_step INTEGER DEFAULT 0,
  context JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workflow_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID REFERENCES workflow_instances(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

------------------------------------------------------------
-- 8. BASIC INDEXES
------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_brand_members_user ON brand_members(user_id);
CREATE INDEX IF NOT EXISTS idx_brand_members_brand ON brand_members(brand_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_brand ON media_assets(brand_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_tenant ON media_assets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_publishing_jobs_brand ON publishing_jobs(brand_id);
CREATE INDEX IF NOT EXISTS idx_publishing_jobs_status ON publishing_jobs(status);
CREATE INDEX IF NOT EXISTS idx_analytics_metrics_brand_date ON analytics_metrics(brand_id, date);
CREATE INDEX IF NOT EXISTS idx_analytics_metrics_brand_platform ON analytics_metrics(brand_id, platform);
CREATE INDEX IF NOT EXISTS idx_content_items_brand ON content_items(brand_id);
CREATE INDEX IF NOT EXISTS idx_content_items_status ON content_items(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_content_brand ON scheduled_content(brand_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_content_scheduled_at ON scheduled_content(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_brands_tenant_id ON brands(tenant_id);
CREATE INDEX IF NOT EXISTS idx_brands_created_by ON brands(created_by);
CREATE INDEX IF NOT EXISTS idx_brands_website_url ON brands(website_url);
CREATE INDEX IF NOT EXISTS idx_brands_scraper_status ON brands(scraper_status);

------------------------------------------------------------
-- 9. BASIC RLS SKELETON (Additional policies)
------------------------------------------------------------

-- Enable RLS on new tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE publishing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE publishing_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE advisor_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_notifications ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies for new tables (brand-scoped access)
-- These are minimal - full policies should be in 20250120_enhanced_security_rls.sql

-- Media assets: brand members can view
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'media_assets'
      AND policyname = 'media_assets_select_if_member'
  ) THEN
    CREATE POLICY media_assets_select_if_member
      ON media_assets
      FOR SELECT
      USING (
        brand_id IN (
          SELECT brand_id
          FROM brand_members
          WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Publishing jobs: brand members can view
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'publishing_jobs'
      AND policyname = 'publishing_jobs_select_if_member'
  ) THEN
    CREATE POLICY publishing_jobs_select_if_member
      ON publishing_jobs
      FOR SELECT
      USING (
        brand_id IN (
          SELECT brand_id
          FROM brand_members
          WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Content items: brand members can view
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'content_items'
      AND policyname = 'content_items_select_if_member'
  ) THEN
    CREATE POLICY content_items_select_if_member
      ON content_items
      FOR SELECT
      USING (
        brand_id IN (
          SELECT brand_id
          FROM brand_members
          WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Analytics metrics: brand members can view
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'analytics_metrics'
      AND policyname = 'analytics_metrics_select_if_member'
  ) THEN
    CREATE POLICY analytics_metrics_select_if_member
      ON analytics_metrics
      FOR SELECT
      USING (
        brand_id IN (
          SELECT brand_id
          FROM brand_members
          WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Comments
COMMENT ON TABLE tenants IS 'Workspace/tenant management - each user/workspace has a tenant';
COMMENT ON TABLE brands IS 'Brand entities - core identity for content generation';
COMMENT ON TABLE brand_members IS 'User-brand relationships - CRITICAL for RLS and access control';
COMMENT ON TABLE media_assets IS 'Media files metadata - includes scraped images from crawler';
COMMENT ON TABLE publishing_jobs IS 'Content publishing queue - tracks posts scheduled for platforms';
COMMENT ON TABLE analytics_metrics IS 'Platform analytics data - aggregated by brand, platform, date';
COMMENT ON TABLE content_items IS 'Content pieces - posts, blogs, captions, etc.';
COMMENT ON COLUMN brands.website_url IS 'Website URL for brand - used by crawler';
COMMENT ON COLUMN brands.scraped_at IS 'Timestamp of last successful website scrape';
COMMENT ON COLUMN brands.scraper_status IS 'Status: never_run, running, completed, failed';
COMMENT ON COLUMN brands.created_by IS 'User ID who created the brand (from auth.users)';
COMMENT ON COLUMN brands.tenant_id IS 'Workspace/tenant this brand belongs to';

