-- ============================================================================
-- Migration 004: Activate generation_logs Table
-- Created: 2025-01-20
-- Purpose: Move generation_logs from archived to active migrations
-- Reference: MVP_DATABASE_TABLE_AUDIT_REPORT.md - Section 4.7 Archived Tables
-- ============================================================================
--
-- STATUS: ACTIVE
-- The generation_logs table is actively used in server/routes/agents.ts
-- This migration ensures it exists in the active schema.
--
-- NOTE: Other tables from archived/20250117_create_agent_safety_tables.sql
-- (prompt_templates, agent_cache, content_review_queue) are NOT activated
-- as they are not found in the codebase.
-- ============================================================================

-- Generation Logs (AI generation audit trail)
CREATE TABLE IF NOT EXISTS generation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  agent TEXT NOT NULL, -- 'copywriter', 'creative', 'advisor'
  prompt_version TEXT,
  input JSONB NOT NULL,
  output JSONB NOT NULL,
  bfs_score DECIMAL(3,1),
  linter_results JSONB,
  approved BOOLEAN DEFAULT FALSE,
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  revision INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_generation_logs_brand_id ON generation_logs(brand_id);
CREATE INDEX IF NOT EXISTS idx_generation_logs_agent ON generation_logs(agent);
CREATE INDEX IF NOT EXISTS idx_generation_logs_approved ON generation_logs(approved);
CREATE INDEX IF NOT EXISTS idx_generation_logs_created_at ON generation_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_generation_logs_bfs_score ON generation_logs(bfs_score);

-- Enable RLS
ALTER TABLE generation_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view logs for brands they're members of
CREATE POLICY "Users can view generation logs for their brands"
  ON generation_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM brand_members
      WHERE brand_members.brand_id = generation_logs.brand_id
      AND brand_members.user_id = auth.uid()
    )
  );

-- RLS Policy: Service role can insert/update (via API)
-- Regular users cannot insert directly (only via API which uses service role)

-- Comments
COMMENT ON TABLE generation_logs IS 'AI generation audit trail - tracks all AI agent generation attempts';
COMMENT ON COLUMN generation_logs.agent IS 'Agent type: copywriter, creative, or advisor';
COMMENT ON COLUMN generation_logs.bfs_score IS 'Brand Fidelity Score (0-1)';
COMMENT ON COLUMN generation_logs.approved IS 'Whether the generation was approved by a human reviewer';

