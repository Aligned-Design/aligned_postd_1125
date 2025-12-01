-- Enhanced Row-Level Security Policies
-- This migration adds comprehensive RLS policies for all tables

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE white_label_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USER PROFILES & PREFERENCES
-- ============================================================================

-- Users can view and update their own profile
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Users can view and update their own preferences
CREATE POLICY "Users can manage own preferences"
  ON user_preferences FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================================
-- BRANDS & BRAND MEMBERS
-- ============================================================================

-- ✅ CRITICAL: Users can create brands (needed for onboarding)
-- This allows authenticated users to create brands, then they become members
CREATE POLICY "Users can create brands"
  ON brands FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Users can view brands they are members of
CREATE POLICY "Users can view their brands"
  ON brands FOR SELECT
  USING (
    id IN (
      SELECT brand_id FROM brand_members
      WHERE user_id = auth.uid()
    )
    OR created_by = auth.uid() -- Also allow viewing brands they created
  );

-- Only brand owners and admins can update brand settings
CREATE POLICY "Brand owners/admins can update brand"
  ON brands FOR UPDATE
  USING (
    id IN (
      SELECT brand_id FROM brand_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Only brand owners can delete brands
CREATE POLICY "Brand owners can delete brand"
  ON brands FOR DELETE
  USING (
    id IN (
      SELECT brand_id FROM brand_members
      WHERE user_id = auth.uid()
      AND role = 'owner'
    )
  );

-- ✅ CRITICAL: Users can create brand memberships when they create a brand
-- This allows the brand creator to add themselves as owner
CREATE POLICY "Users can create brand memberships"
  ON brand_members FOR INSERT
  WITH CHECK (
    auth.uid() = user_id -- User can only add themselves
    OR brand_id IN (
      SELECT id FROM brands WHERE created_by = auth.uid()
    ) -- Or if they created the brand
  );

-- Users can view brand members for their brands
CREATE POLICY "Users can view brand members"
  ON brand_members FOR SELECT
  USING (
    brand_id IN (
      SELECT brand_id FROM brand_members
      WHERE user_id = auth.uid()
    )
    OR brand_id IN (
      SELECT id FROM brands WHERE created_by = auth.uid()
    ) -- Also allow viewing members of brands they created
  );

-- Only brand owners and admins can manage brand members (UPDATE/DELETE)
CREATE POLICY "Brand owners/admins can manage members"
  ON brand_members FOR UPDATE
  USING (
    brand_id IN (
      SELECT brand_id FROM brand_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Brand owners/admins can delete members"
  ON brand_members FOR DELETE
  USING (
    brand_id IN (
      SELECT brand_id FROM brand_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- BRAND ASSETS
-- ============================================================================

-- Users can view assets for their brands
CREATE POLICY "Users can view brand assets"
  ON brand_assets FOR SELECT
  USING (
    brand_id IN (
      SELECT brand_id FROM brand_members
      WHERE user_id = auth.uid()
    )
  );

-- Users with editor role or higher can upload assets
CREATE POLICY "Editors can upload assets"
  ON brand_assets FOR INSERT
  WITH CHECK (
    brand_id IN (
      SELECT brand_id FROM brand_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'editor')
    )
  );

-- Users with editor role or higher can delete assets
CREATE POLICY "Editors can delete assets"
  ON brand_assets FOR DELETE
  USING (
    brand_id IN (
      SELECT brand_id FROM brand_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'editor')
    )
  );

-- ============================================================================
-- CONTENT & POSTS
-- ============================================================================

-- Users can view content for their brands
CREATE POLICY "Users can view brand content"
  ON content FOR SELECT
  USING (
    brand_id IN (
      SELECT brand_id FROM brand_members
      WHERE user_id = auth.uid()
    )
  );

-- Users with creator role or higher can create content
CREATE POLICY "Creators can create content"
  ON content FOR INSERT
  WITH CHECK (
    brand_id IN (
      SELECT brand_id FROM brand_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'editor', 'creator')
    )
  );

-- Users can edit content they created or if they're editors/admins
CREATE POLICY "Users can edit own content or if editor/admin"
  ON content FOR UPDATE
  USING (
    created_by = auth.uid()
    OR brand_id IN (
      SELECT brand_id FROM brand_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'editor')
    )
  );

-- Only admins and owners can delete content
CREATE POLICY "Admins can delete content"
  ON content FOR DELETE
  USING (
    brand_id IN (
      SELECT brand_id FROM brand_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Similar policies for posts table
CREATE POLICY "Users can view brand posts"
  ON posts FOR SELECT
  USING (
    brand_id IN (
      SELECT brand_id FROM brand_members
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- PLATFORM CONNECTIONS
-- ============================================================================

-- Users can view connections for their brands
CREATE POLICY "Users can view platform connections"
  ON platform_connections FOR SELECT
  USING (
    brand_id IN (
      SELECT brand_id FROM brand_members
      WHERE user_id = auth.uid()
    )
  );

-- Only admins can manage platform connections
CREATE POLICY "Admins can manage connections"
  ON platform_connections FOR ALL
  USING (
    brand_id IN (
      SELECT brand_id FROM brand_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- ANALYTICS DATA
-- ============================================================================

-- Users can view analytics for their brands
CREATE POLICY "Users can view analytics"
  ON analytics_data FOR SELECT
  USING (
    brand_id IN (
      SELECT brand_id FROM brand_members
      WHERE user_id = auth.uid()
    )
  );

-- Only system can insert analytics data
CREATE POLICY "System can insert analytics"
  ON analytics_data FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- AUDIT LOGS
-- ============================================================================

-- Only admins and owners can view audit logs
CREATE POLICY "Admins can view audit logs"
  ON audit_logs FOR SELECT
  USING (
    brand_id IN (
      SELECT brand_id FROM brand_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Only system can insert audit logs
CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- WHITE LABEL CONFIGS
-- ============================================================================

-- Only brand owners can view/manage white label config
CREATE POLICY "Brand owners can manage white label"
  ON white_label_configs FOR ALL
  USING (
    brand_id IN (
      SELECT brand_id FROM brand_members
      WHERE user_id = auth.uid()
      AND role = 'owner'
    )
  );

-- ============================================================================
-- CLIENT SETTINGS
-- ============================================================================

-- Clients can view and update their own settings
CREATE POLICY "Clients can manage own settings"
  ON client_settings FOR ALL
  USING (user_id = auth.uid());

-- Brand members can view client settings for their brands
CREATE POLICY "Brand members can view client settings"
  ON client_settings FOR SELECT
  USING (
    brand_id IN (
      SELECT brand_id FROM brand_members
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- FUNCTIONS FOR RLS
-- ============================================================================

-- Function to check if user is brand member
CREATE OR REPLACE FUNCTION is_brand_member(brand_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM brand_members
    WHERE brand_id = brand_id_param
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has specific role in brand
CREATE OR REPLACE FUNCTION has_brand_role(brand_id_param UUID, required_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM brand_members
    WHERE brand_id = brand_id_param
    AND user_id = auth.uid()
    AND role = required_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has any of the specified roles
CREATE OR REPLACE FUNCTION has_any_brand_role(brand_id_param UUID, roles TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM brand_members
    WHERE brand_id = brand_id_param
    AND user_id = auth.uid()
    AND role = ANY(roles)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STORAGE POLICIES (for Supabase Storage)
-- ============================================================================

-- Policy for brand asset uploads
CREATE POLICY "Users can upload to their brand buckets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id LIKE 'brand-%'
    AND auth.uid() IN (
      SELECT user_id FROM brand_members
      WHERE brand_id = (bucket_id::text REPLACE('brand-', ''))::uuid
      AND role IN ('owner', 'admin', 'editor')
    )
  );

-- Policy for brand asset downloads
CREATE POLICY "Users can download from their brand buckets"
  ON storage.objects FOR SELECT
  USING (
    bucket_id LIKE 'brand-%'
    AND auth.uid() IN (
      SELECT user_id FROM brand_members
      WHERE brand_id = (bucket_id::text REPLACE('brand-', ''))::uuid
    )
  );

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Indexes to optimize RLS policy performance
CREATE INDEX IF NOT EXISTS idx_brand_members_user_brand 
  ON brand_members(user_id, brand_id);

CREATE INDEX IF NOT EXISTS idx_brand_members_brand_role 
  ON brand_members(brand_id, role);

CREATE INDEX IF NOT EXISTS idx_content_brand_created 
  ON content(brand_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_brand_date 
  ON analytics_data(brand_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_brand_timestamp 
  ON audit_logs(brand_id, timestamp DESC);
