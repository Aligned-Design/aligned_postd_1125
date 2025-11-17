-- Create milestones table for tracking user achievements
-- This table stores one-time milestone unlocks per workspace

CREATE TABLE IF NOT EXISTS milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id TEXT NOT NULL,
  key TEXT NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Ensure each milestone can only be unlocked once per workspace
  CONSTRAINT unique_workspace_milestone UNIQUE (workspace_id, key)
);

-- Add index for efficient lookups
CREATE INDEX idx_milestones_workspace ON milestones(workspace_id);
CREATE INDEX idx_milestones_key ON milestones(key);
CREATE INDEX idx_milestones_unlocked_at ON milestones(unlocked_at DESC);

-- Add RLS (Row Level Security) policies
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read milestones for their workspace
CREATE POLICY "Users can read own workspace milestones"
  ON milestones FOR SELECT
  USING (true); -- TODO: Add proper workspace auth check

-- Policy: System can insert milestones
CREATE POLICY "System can insert milestones"
  ON milestones FOR INSERT
  WITH CHECK (true); -- TODO: Add service role check

-- Policy: Users can update their own milestones (acknowledge)
CREATE POLICY "Users can acknowledge milestones"
  ON milestones FOR UPDATE
  USING (true); -- TODO: Add proper workspace auth check

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_milestones_updated_at
  BEFORE UPDATE ON milestones
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE milestones IS 'Tracks user milestone achievements and celebrations';
COMMENT ON COLUMN milestones.workspace_id IS 'Reference to the workspace that unlocked the milestone';
COMMENT ON COLUMN milestones.key IS 'Milestone identifier (e.g., onboarding_complete, first_publish)';
COMMENT ON COLUMN milestones.unlocked_at IS 'When the milestone was first unlocked';
COMMENT ON COLUMN milestones.acknowledged_at IS 'When the user acknowledged/viewed the milestone celebration';
