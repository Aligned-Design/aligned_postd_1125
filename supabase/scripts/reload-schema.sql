-- ============================================================================
-- PostgREST Schema Cache Reload Script
-- ============================================================================
-- 
-- PURPOSE:
-- After running migrations, PostgREST may serve stale schema metadata
-- (e.g., missing columns like content_items.content_type or 
-- publishing_jobs.connection_id). This script forces a schema reload.
--
-- WHEN TO RUN:
-- - After any migration that adds/modifies columns or tables
-- - If you see errors like "column X does not exist" after a migration
-- - After deploying new migrations to production
--
-- HOW TO RUN:
-- Option 1: Via Supabase CLI
--   supabase db run-sql -f supabase/scripts/reload-schema.sql
--
-- Option 2: Via psql
--   psql $DATABASE_URL -f supabase/scripts/reload-schema.sql
--
-- Option 3: Via Supabase Dashboard
--   1. Go to SQL Editor
--   2. Paste and execute: SELECT pg_notify('pgrst', 'reload schema');
--
-- ============================================================================

-- Notify PostgREST to reload its schema cache
SELECT pg_notify('pgrst', 'reload schema');

-- Confirm the notification was sent
DO $$
BEGIN
  RAISE NOTICE 'PostgREST schema reload notification sent successfully.';
  RAISE NOTICE 'The schema cache will be refreshed on the next PostgREST request.';
END $$;

