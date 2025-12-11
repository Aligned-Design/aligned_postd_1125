-- ============================================================================
-- Brand Brain Tables Migration
-- ============================================================================
-- Creates tables for the Brand Brain AI system:
-- 1. brand_brain_state - Core brand memory/state
-- 2. brand_brain_examples - Learning examples from content
-- 3. brand_brain_events - Audit log for all Brand Brain operations
-- ============================================================================

-- ============================================================================
-- 1. BRAND BRAIN STATE
-- ============================================================================
-- Stores distilled brand memory derived from Brand Guide, user edits, and performance

CREATE TABLE IF NOT EXISTS brand_brain_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  
  -- Brand summary (model-ready description)
  summary JSONB NOT NULL DEFAULT '{
    "description": "",
    "businessType": null,
    "industry": null,
    "values": [],
    "targetAudience": null,
    "differentiators": [],
    "uvp": null
  }'::jsonb,
  
  -- Voice & tone rules
  voice_rules JSONB NOT NULL DEFAULT '{
    "tone": [],
    "formalityLevel": 50,
    "friendlinessLevel": 50,
    "confidenceLevel": 50,
    "voiceDescription": null,
    "writingRules": [],
    "avoidPhrases": [],
    "brandPhrases": [],
    "keyMessages": []
  }'::jsonb,
  
  -- Visual identity rules
  visual_rules JSONB NOT NULL DEFAULT '{
    "colors": [],
    "primaryFont": null,
    "secondaryFont": null,
    "photographyMustInclude": [],
    "photographyMustAvoid": [],
    "logoGuidelines": null,
    "visualNotes": null
  }'::jsonb,
  
  -- Brand Fidelity Score baseline (0-100)
  bfs_baseline NUMERIC(5,2) NOT NULL DEFAULT 80.00,
  
  -- Preferences (strictness, platforms, CTAs, etc.)
  preferences JSONB NOT NULL DEFAULT '{
    "strictnessLevel": "moderate",
    "preferredPlatforms": [],
    "defaultCtaStyle": null,
    "contentPillars": [],
    "platformGuidelines": {},
    "requiredDisclaimers": [],
    "requiredHashtags": []
  }'::jsonb,
  
  -- Version tracking
  version INTEGER NOT NULL DEFAULT 1,
  
  -- Timestamps
  last_refreshed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one state per brand
  CONSTRAINT brand_brain_state_brand_unique UNIQUE (brand_id)
);

-- Indexes for brand_brain_state
CREATE INDEX IF NOT EXISTS idx_brand_brain_state_brand_id ON brand_brain_state(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_brain_state_updated_at ON brand_brain_state(updated_at);

-- ============================================================================
-- 2. BRAND BRAIN EXAMPLES
-- ============================================================================
-- Stores positive/negative content examples for learning

CREATE TABLE IF NOT EXISTS brand_brain_examples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  
  -- Example classification
  example_type VARCHAR(20) NOT NULL CHECK (example_type IN ('POSITIVE', 'NEGATIVE', 'NEUTRAL')),
  
  -- Channel (instagram, email, linkedin, facebook, twitter, etc.)
  channel VARCHAR(50) NOT NULL,
  
  -- Content details (body, headline, cta, hashtags, mediaRefs)
  content JSONB NOT NULL DEFAULT '{
    "body": "",
    "headline": null,
    "cta": null,
    "hashtags": [],
    "mediaRefs": []
  }'::jsonb,
  
  -- Performance metrics (engagement, reach, clicks, etc.)
  performance JSONB DEFAULT NULL,
  
  -- Human notes/feedback
  notes TEXT,
  
  -- Source of the example
  source VARCHAR(30) NOT NULL DEFAULT 'system' CHECK (source IN ('user_feedback', 'analytics', 'manual', 'system')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for brand_brain_examples
CREATE INDEX IF NOT EXISTS idx_brand_brain_examples_brand_id ON brand_brain_examples(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_brain_examples_type ON brand_brain_examples(example_type);
CREATE INDEX IF NOT EXISTS idx_brand_brain_examples_channel ON brand_brain_examples(channel);
CREATE INDEX IF NOT EXISTS idx_brand_brain_examples_source ON brand_brain_examples(source);
CREATE INDEX IF NOT EXISTS idx_brand_brain_examples_created_at ON brand_brain_examples(created_at);

-- ============================================================================
-- 3. BRAND BRAIN EVENTS
-- ============================================================================
-- Audit log for all Brand Brain operations

CREATE TABLE IF NOT EXISTS brand_brain_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  
  -- Event type
  event_type VARCHAR(30) NOT NULL CHECK (event_type IN (
    'CONTEXT_BUILT',
    'CONTENT_EVALUATED',
    'EXAMPLE_ADDED',
    'STATE_UPDATED',
    'OUTCOME_REGISTERED',
    'STATE_REFRESHED'
  )),
  
  -- Source agent/feature
  source VARCHAR(100) NOT NULL,
  
  -- Input snapshot (what was passed in)
  input_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Result snapshot (what was produced)
  result_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Creator (user ID or 'system')
  created_by VARCHAR(255) NOT NULL DEFAULT 'system'
);

-- Indexes for brand_brain_events
CREATE INDEX IF NOT EXISTS idx_brand_brain_events_brand_id ON brand_brain_events(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_brain_events_type ON brand_brain_events(event_type);
CREATE INDEX IF NOT EXISTS idx_brand_brain_events_source ON brand_brain_events(source);
CREATE INDEX IF NOT EXISTS idx_brand_brain_events_created_at ON brand_brain_events(created_at);
CREATE INDEX IF NOT EXISTS idx_brand_brain_events_created_by ON brand_brain_events(created_by);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE brand_brain_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_brain_examples ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_brain_events ENABLE ROW LEVEL SECURITY;

-- brand_brain_state policies
CREATE POLICY "brand_brain_state_select" ON brand_brain_state
  FOR SELECT USING (
    brand_id::text = current_setting('jwt.claims.brand_id', TRUE)
    OR current_setting('jwt.claims.role', TRUE) = 'admin'
    OR current_setting('jwt.claims.role', TRUE) = 'service_role'
  );

CREATE POLICY "brand_brain_state_insert" ON brand_brain_state
  FOR INSERT WITH CHECK (
    brand_id::text = current_setting('jwt.claims.brand_id', TRUE)
    OR current_setting('jwt.claims.role', TRUE) IN ('admin', 'manager', 'service_role')
  );

CREATE POLICY "brand_brain_state_update" ON brand_brain_state
  FOR UPDATE USING (
    brand_id::text = current_setting('jwt.claims.brand_id', TRUE)
    OR current_setting('jwt.claims.role', TRUE) IN ('admin', 'manager', 'service_role')
  );

CREATE POLICY "brand_brain_state_delete" ON brand_brain_state
  FOR DELETE USING (
    current_setting('jwt.claims.role', TRUE) IN ('admin', 'service_role')
  );

-- brand_brain_examples policies
CREATE POLICY "brand_brain_examples_select" ON brand_brain_examples
  FOR SELECT USING (
    brand_id::text = current_setting('jwt.claims.brand_id', TRUE)
    OR current_setting('jwt.claims.role', TRUE) = 'admin'
    OR current_setting('jwt.claims.role', TRUE) = 'service_role'
  );

CREATE POLICY "brand_brain_examples_insert" ON brand_brain_examples
  FOR INSERT WITH CHECK (
    brand_id::text = current_setting('jwt.claims.brand_id', TRUE)
    OR current_setting('jwt.claims.role', TRUE) IN ('admin', 'manager', 'service_role')
  );

CREATE POLICY "brand_brain_examples_update" ON brand_brain_examples
  FOR UPDATE USING (
    brand_id::text = current_setting('jwt.claims.brand_id', TRUE)
    OR current_setting('jwt.claims.role', TRUE) IN ('admin', 'manager', 'service_role')
  );

CREATE POLICY "brand_brain_examples_delete" ON brand_brain_examples
  FOR DELETE USING (
    current_setting('jwt.claims.role', TRUE) IN ('admin', 'service_role')
  );

-- brand_brain_events policies
CREATE POLICY "brand_brain_events_select" ON brand_brain_events
  FOR SELECT USING (
    brand_id::text = current_setting('jwt.claims.brand_id', TRUE)
    OR current_setting('jwt.claims.role', TRUE) = 'admin'
    OR current_setting('jwt.claims.role', TRUE) = 'service_role'
  );

CREATE POLICY "brand_brain_events_insert" ON brand_brain_events
  FOR INSERT WITH CHECK (
    brand_id::text = current_setting('jwt.claims.brand_id', TRUE)
    OR current_setting('jwt.claims.role', TRUE) IN ('admin', 'manager', 'service_role')
  );

-- Events are immutable - no update policy

CREATE POLICY "brand_brain_events_delete" ON brand_brain_events
  FOR DELETE USING (
    current_setting('jwt.claims.role', TRUE) IN ('admin', 'service_role')
  );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp for brand_brain_state
CREATE OR REPLACE FUNCTION update_brand_brain_state_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_brand_brain_state_updated_at
  BEFORE UPDATE ON brand_brain_state
  FOR EACH ROW
  EXECUTE FUNCTION update_brand_brain_state_updated_at();

-- Auto-update updated_at timestamp for brand_brain_examples
CREATE OR REPLACE FUNCTION update_brand_brain_examples_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_brand_brain_examples_updated_at
  BEFORE UPDATE ON brand_brain_examples
  FOR EACH ROW
  EXECUTE FUNCTION update_brand_brain_examples_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE brand_brain_state IS 'Stores distilled brand memory for the Brand Brain AI system';
COMMENT ON TABLE brand_brain_examples IS 'Stores positive/negative content examples for Brand Brain learning';
COMMENT ON TABLE brand_brain_events IS 'Audit log for all Brand Brain operations';

COMMENT ON COLUMN brand_brain_state.summary IS 'Model-ready brand description including business type, values, audience';
COMMENT ON COLUMN brand_brain_state.voice_rules IS 'Voice and tone guidelines, writing rules, phrases to use/avoid';
COMMENT ON COLUMN brand_brain_state.visual_rules IS 'Visual identity rules including colors, fonts, photography style';
COMMENT ON COLUMN brand_brain_state.bfs_baseline IS 'Brand Fidelity Score baseline (0-100) for alignment evaluation';
COMMENT ON COLUMN brand_brain_state.preferences IS 'Brand preferences for content evaluation strictness, platforms, CTAs';

COMMENT ON COLUMN brand_brain_examples.example_type IS 'Classification: POSITIVE (good example), NEGATIVE (bad example), NEUTRAL';
COMMENT ON COLUMN brand_brain_examples.performance IS 'Performance metrics: engagement, reach, clicks, saves, shares, etc.';
COMMENT ON COLUMN brand_brain_examples.source IS 'Origin of example: user_feedback, analytics, manual, system';

COMMENT ON COLUMN brand_brain_events.event_type IS 'Type of operation: CONTEXT_BUILT, CONTENT_EVALUATED, EXAMPLE_ADDED, etc.';
COMMENT ON COLUMN brand_brain_events.input_snapshot IS 'Snapshot of input data for audit/debugging';
COMMENT ON COLUMN brand_brain_events.result_snapshot IS 'Snapshot of output data for audit/debugging';

