-- PHASE 9 Feature 2: Post Approvals Table
-- Tracks approval status for posts (approve/reject) with atomic bulk operations

CREATE TABLE IF NOT EXISTS post_approvals (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  brand_id TEXT NOT NULL,
  post_id TEXT NOT NULL,

  -- Approval Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),

  -- Approval Details
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by TEXT,
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejected_by TEXT,
  locked BOOLEAN DEFAULT FALSE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  UNIQUE(brand_id, post_id),
  FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE
);

-- Create indexes for common queries and filtering
CREATE INDEX IF NOT EXISTS idx_post_approvals_brand ON post_approvals(brand_id);
CREATE INDEX IF NOT EXISTS idx_post_approvals_brand_status ON post_approvals(brand_id, status);
CREATE INDEX IF NOT EXISTS idx_post_approvals_brand_post ON post_approvals(brand_id, post_id);
CREATE INDEX IF NOT EXISTS idx_post_approvals_approved_by ON post_approvals(approved_by);
CREATE INDEX IF NOT EXISTS idx_post_approvals_rejected_by ON post_approvals(rejected_by);
CREATE INDEX IF NOT EXISTS idx_post_approvals_created_at ON post_approvals(created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE post_approvals ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view approvals for their brand
CREATE POLICY "brand_isolation_select" ON post_approvals
  FOR SELECT USING (
    brand_id = current_setting('jwt.claims.brand_id', TRUE)::TEXT
    OR current_setting('jwt.claims.role', TRUE) = 'admin'
  );

-- RLS Policy: Users can only update approvals for their brand
CREATE POLICY "brand_isolation_update" ON post_approvals
  FOR UPDATE USING (
    brand_id = current_setting('jwt.claims.brand_id', TRUE)::TEXT
    OR current_setting('jwt.claims.role', TRUE) = 'admin'
  );

-- RLS Policy: Users can insert approvals for their brand
CREATE POLICY "brand_isolation_insert" ON post_approvals
  FOR INSERT WITH CHECK (
    brand_id = current_setting('jwt.claims.brand_id', TRUE)::TEXT
    OR current_setting('jwt.claims.role', TRUE) = 'admin'
  );

-- RLS Policy: Users can delete approvals for their brand
CREATE POLICY "brand_isolation_delete" ON post_approvals
  FOR DELETE USING (
    brand_id = current_setting('jwt.claims.brand_id', TRUE)::TEXT
    OR current_setting('jwt.claims.role', TRUE) = 'admin'
  );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_post_approvals_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_post_approvals_updated_at
  BEFORE UPDATE ON post_approvals
  FOR EACH ROW
  EXECUTE FUNCTION update_post_approvals_timestamp();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON post_approvals TO authenticated;
