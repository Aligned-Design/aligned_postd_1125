/**
 * Script to apply RLS hardening migration via Supabase service role
 * 
 * Usage: npx tsx scripts/apply-rls-migration.ts
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function applyMigration() {
  console.log('🔐 Applying RLS Hardening Migration...');
  console.log(`📍 Target: ${SUPABASE_URL}`);
  console.log('');

  // Read the migration file
  const migrationPath = path.join(__dirname, '../supabase/migrations/016_enforce_rls_hardening.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
  
  // Split by major steps (each DROP/CREATE block)
  // We'll execute each step individually to get better error reporting
  const steps = [
    // Step 1: Enable RLS
    `
    ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
    ALTER TABLE brand_members ENABLE ROW LEVEL SECURITY;
    ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
    ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;
    ALTER TABLE publishing_jobs ENABLE ROW LEVEL SECURITY;
    ALTER TABLE scheduled_content ENABLE ROW LEVEL SECURITY;
    ALTER TABLE publishing_logs ENABLE ROW LEVEL SECURITY;
    ALTER TABLE post_approvals ENABLE ROW LEVEL SECURITY;
    `,
    
    // Step 2: Drop old brands policies
    `
    DROP POLICY IF EXISTS "Brand members can view brands" ON brands;
    DROP POLICY IF EXISTS "Brand members can manage brands" ON brands;
    DROP POLICY IF EXISTS "Users can view own brands" ON brands;
    DROP POLICY IF EXISTS "Brands select policy" ON brands;
    DROP POLICY IF EXISTS "Brands all policy" ON brands;
    DROP POLICY IF EXISTS "Authenticated users can create brands" ON brands;
    DROP POLICY IF EXISTS "Brand admins can update brands" ON brands;
    DROP POLICY IF EXISTS "Brand admins can delete brands" ON brands;
    `,
    
    // Step 2b: Create brands SELECT policy
    `
    CREATE POLICY "Brand members can view brands"
      ON brands FOR SELECT
      USING (
        auth.uid() IS NOT NULL
        AND (
          EXISTS (
            SELECT 1 FROM brand_members
            WHERE brand_members.brand_id = brands.id
            AND brand_members.user_id = auth.uid()
          )
          OR created_by = auth.uid()
        )
      );
    `,
    
    // Step 2c: Create brands INSERT policy
    `
    CREATE POLICY "Authenticated users can create brands"
      ON brands FOR INSERT
      WITH CHECK (auth.uid() IS NOT NULL);
    `,
    
    // Step 2d: Create brands UPDATE policy
    `
    CREATE POLICY "Brand admins can update brands"
      ON brands FOR UPDATE
      USING (
        auth.uid() IS NOT NULL
        AND (
          EXISTS (
            SELECT 1 FROM brand_members
            WHERE brand_members.brand_id = brands.id
            AND brand_members.user_id = auth.uid()
            AND brand_members.role IN ('owner', 'admin')
          )
          OR created_by = auth.uid()
        )
      );
    `,
    
    // Step 2e: Create brands DELETE policy
    `
    CREATE POLICY "Brand admins can delete brands"
      ON brands FOR DELETE
      USING (
        auth.uid() IS NOT NULL
        AND (
          EXISTS (
            SELECT 1 FROM brand_members
            WHERE brand_members.brand_id = brands.id
            AND brand_members.user_id = auth.uid()
            AND brand_members.role IN ('owner', 'admin')
          )
          OR created_by = auth.uid()
        )
      );
    `,
    
    // Step 3: Drop old brand_members policies
    `
    DROP POLICY IF EXISTS "Users can view their brand memberships" ON brand_members;
    DROP POLICY IF EXISTS "Admins can manage brand members" ON brand_members;
    DROP POLICY IF EXISTS "Brand members select policy" ON brand_members;
    DROP POLICY IF EXISTS "Brand members all policy" ON brand_members;
    DROP POLICY IF EXISTS "Users can view brand memberships" ON brand_members;
    DROP POLICY IF EXISTS "Brand admins can add members" ON brand_members;
    DROP POLICY IF EXISTS "Brand admins can update members" ON brand_members;
    DROP POLICY IF EXISTS "Brand admins can remove members" ON brand_members;
    `,
    
    // Step 3b: Create brand_members SELECT policy
    `
    CREATE POLICY "Users can view brand memberships"
      ON brand_members FOR SELECT
      USING (
        auth.uid() IS NOT NULL
        AND (
          user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM brand_members bm2
            WHERE bm2.brand_id = brand_members.brand_id
            AND bm2.user_id = auth.uid()
            AND bm2.role IN ('owner', 'admin')
          )
        )
      );
    `,
    
    // Step 3c: Create brand_members INSERT policy
    `
    CREATE POLICY "Brand admins can add members"
      ON brand_members FOR INSERT
      WITH CHECK (
        auth.uid() IS NOT NULL
        AND (
          EXISTS (
            SELECT 1 FROM brand_members bm2
            WHERE bm2.brand_id = brand_members.brand_id
            AND bm2.user_id = auth.uid()
            AND bm2.role IN ('owner', 'admin')
          )
          OR EXISTS (
            SELECT 1 FROM brands
            WHERE brands.id = brand_members.brand_id
            AND brands.created_by = auth.uid()
          )
        )
      );
    `,
    
    // Step 3d: Create brand_members UPDATE policy
    `
    CREATE POLICY "Brand admins can update members"
      ON brand_members FOR UPDATE
      USING (
        auth.uid() IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM brand_members bm2
          WHERE bm2.brand_id = brand_members.brand_id
          AND bm2.user_id = auth.uid()
          AND bm2.role IN ('owner', 'admin')
        )
      );
    `,
    
    // Step 3e: Create brand_members DELETE policy
    `
    CREATE POLICY "Brand admins can remove members"
      ON brand_members FOR DELETE
      USING (
        auth.uid() IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM brand_members bm2
          WHERE bm2.brand_id = brand_members.brand_id
          AND bm2.user_id = auth.uid()
          AND bm2.role IN ('owner', 'admin')
        )
      );
    `,
    
    // Step 4: Drop old content_items policies
    `
    DROP POLICY IF EXISTS "Brand members can view content items" ON content_items;
    DROP POLICY IF EXISTS "Brand members can manage content items" ON content_items;
    DROP POLICY IF EXISTS "Content items select policy" ON content_items;
    DROP POLICY IF EXISTS "Content items all policy" ON content_items;
    DROP POLICY IF EXISTS "Brand members can create content items" ON content_items;
    DROP POLICY IF EXISTS "Brand members can update content items" ON content_items;
    DROP POLICY IF EXISTS "Brand admins can delete content items" ON content_items;
    `,
    
    // Step 4b: Create content_items SELECT policy
    `
    CREATE POLICY "Brand members can view content items"
      ON content_items FOR SELECT
      USING (
        auth.uid() IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM brand_members
          WHERE brand_members.brand_id = content_items.brand_id
          AND brand_members.user_id = auth.uid()
        )
      );
    `,
    
    // Step 4c: Create content_items INSERT policy
    `
    CREATE POLICY "Brand members can create content items"
      ON content_items FOR INSERT
      WITH CHECK (
        auth.uid() IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM brand_members
          WHERE brand_members.brand_id = content_items.brand_id
          AND brand_members.user_id = auth.uid()
        )
      );
    `,
    
    // Step 4d: Create content_items UPDATE policy
    `
    CREATE POLICY "Brand members can update content items"
      ON content_items FOR UPDATE
      USING (
        auth.uid() IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM brand_members
          WHERE brand_members.brand_id = content_items.brand_id
          AND brand_members.user_id = auth.uid()
        )
      );
    `,
    
    // Step 4e: Create content_items DELETE policy
    `
    CREATE POLICY "Brand admins can delete content items"
      ON content_items FOR DELETE
      USING (
        auth.uid() IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM brand_members
          WHERE brand_members.brand_id = content_items.brand_id
          AND brand_members.user_id = auth.uid()
          AND brand_members.role IN ('owner', 'admin', 'editor')
        )
      );
    `,
    
    // Step 5: Drop old media_assets policies
    `
    DROP POLICY IF EXISTS "Brand members can view media assets" ON media_assets;
    DROP POLICY IF EXISTS "Brand members can insert media assets" ON media_assets;
    DROP POLICY IF EXISTS "Brand members can update media assets" ON media_assets;
    DROP POLICY IF EXISTS "Media assets select policy" ON media_assets;
    DROP POLICY IF EXISTS "Brand admins can delete media assets" ON media_assets;
    `,
    
    // Step 5b: Create media_assets SELECT policy
    `
    CREATE POLICY "Brand members can view media assets"
      ON media_assets FOR SELECT
      USING (
        auth.uid() IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM brand_members
          WHERE brand_members.brand_id = media_assets.brand_id
          AND brand_members.user_id = auth.uid()
        )
      );
    `,
    
    // Step 5c: Create media_assets INSERT policy
    `
    CREATE POLICY "Brand members can insert media assets"
      ON media_assets FOR INSERT
      WITH CHECK (
        auth.uid() IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM brand_members
          WHERE brand_members.brand_id = media_assets.brand_id
          AND brand_members.user_id = auth.uid()
        )
      );
    `,
    
    // Step 5d: Create media_assets UPDATE policy
    `
    CREATE POLICY "Brand members can update media assets"
      ON media_assets FOR UPDATE
      USING (
        auth.uid() IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM brand_members
          WHERE brand_members.brand_id = media_assets.brand_id
          AND brand_members.user_id = auth.uid()
        )
      );
    `,
    
    // Step 5e: Create media_assets DELETE policy
    `
    CREATE POLICY "Brand admins can delete media assets"
      ON media_assets FOR DELETE
      USING (
        auth.uid() IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM brand_members
          WHERE brand_members.brand_id = media_assets.brand_id
          AND brand_members.user_id = auth.uid()
          AND brand_members.role IN ('owner', 'admin')
        )
      );
    `,
    
    // Step 6: Drop old publishing_jobs policies
    `
    DROP POLICY IF EXISTS "Brand members can view publishing jobs" ON publishing_jobs;
    DROP POLICY IF EXISTS "Publishing jobs select policy" ON publishing_jobs;
    DROP POLICY IF EXISTS "Publishing jobs all policy" ON publishing_jobs;
    DROP POLICY IF EXISTS "Brand members can create publishing jobs" ON publishing_jobs;
    DROP POLICY IF EXISTS "Brand members can update publishing jobs" ON publishing_jobs;
    DROP POLICY IF EXISTS "Brand admins can delete publishing jobs" ON publishing_jobs;
    `,
    
    // Step 6b: Create publishing_jobs SELECT policy
    `
    CREATE POLICY "Brand members can view publishing jobs"
      ON publishing_jobs FOR SELECT
      USING (
        auth.uid() IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM brand_members
          WHERE brand_members.brand_id = publishing_jobs.brand_id
          AND brand_members.user_id = auth.uid()
        )
      );
    `,
    
    // Step 6c: Create publishing_jobs INSERT policy
    `
    CREATE POLICY "Brand members can create publishing jobs"
      ON publishing_jobs FOR INSERT
      WITH CHECK (
        auth.uid() IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM brand_members
          WHERE brand_members.brand_id = publishing_jobs.brand_id
          AND brand_members.user_id = auth.uid()
        )
      );
    `,
    
    // Step 6d: Create publishing_jobs UPDATE policy
    `
    CREATE POLICY "Brand members can update publishing jobs"
      ON publishing_jobs FOR UPDATE
      USING (
        auth.uid() IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM brand_members
          WHERE brand_members.brand_id = publishing_jobs.brand_id
          AND brand_members.user_id = auth.uid()
        )
      );
    `,
    
    // Step 6e: Create publishing_jobs DELETE policy
    `
    CREATE POLICY "Brand admins can delete publishing jobs"
      ON publishing_jobs FOR DELETE
      USING (
        auth.uid() IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM brand_members
          WHERE brand_members.brand_id = publishing_jobs.brand_id
          AND brand_members.user_id = auth.uid()
          AND brand_members.role IN ('owner', 'admin')
        )
      );
    `,
    
    // Step 7: Drop old scheduled_content policies
    `
    DROP POLICY IF EXISTS "Brand members can view scheduled content" ON scheduled_content;
    DROP POLICY IF EXISTS "Brand members can manage scheduled content" ON scheduled_content;
    DROP POLICY IF EXISTS "Scheduled content select policy" ON scheduled_content;
    DROP POLICY IF EXISTS "Brand members can create scheduled content" ON scheduled_content;
    DROP POLICY IF EXISTS "Brand members can update scheduled content" ON scheduled_content;
    DROP POLICY IF EXISTS "Brand members can delete scheduled content" ON scheduled_content;
    `,
    
    // Step 7b: Create scheduled_content SELECT policy
    `
    CREATE POLICY "Brand members can view scheduled content"
      ON scheduled_content FOR SELECT
      USING (
        auth.uid() IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM brand_members
          WHERE brand_members.brand_id = scheduled_content.brand_id
          AND brand_members.user_id = auth.uid()
        )
      );
    `,
    
    // Step 7c: Create scheduled_content INSERT policy
    `
    CREATE POLICY "Brand members can create scheduled content"
      ON scheduled_content FOR INSERT
      WITH CHECK (
        auth.uid() IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM brand_members
          WHERE brand_members.brand_id = scheduled_content.brand_id
          AND brand_members.user_id = auth.uid()
        )
      );
    `,
    
    // Step 7d: Create scheduled_content UPDATE policy
    `
    CREATE POLICY "Brand members can update scheduled content"
      ON scheduled_content FOR UPDATE
      USING (
        auth.uid() IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM brand_members
          WHERE brand_members.brand_id = scheduled_content.brand_id
          AND brand_members.user_id = auth.uid()
        )
      );
    `,
    
    // Step 7e: Create scheduled_content DELETE policy
    `
    CREATE POLICY "Brand members can delete scheduled content"
      ON scheduled_content FOR DELETE
      USING (
        auth.uid() IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM brand_members
          WHERE brand_members.brand_id = scheduled_content.brand_id
          AND brand_members.user_id = auth.uid()
        )
      );
    `,
    
    // Step 8: Drop old publishing_logs policies
    `
    DROP POLICY IF EXISTS "Brand members can view publishing logs" ON publishing_logs;
    DROP POLICY IF EXISTS "Brand members can create publishing logs" ON publishing_logs;
    `,
    
    // Step 8b: Create publishing_logs SELECT policy
    `
    CREATE POLICY "Brand members can view publishing logs"
      ON publishing_logs FOR SELECT
      USING (
        auth.uid() IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM brand_members
          WHERE brand_members.brand_id = publishing_logs.brand_id
          AND brand_members.user_id = auth.uid()
        )
      );
    `,
    
    // Step 8c: Create publishing_logs INSERT policy
    `
    CREATE POLICY "Brand members can create publishing logs"
      ON publishing_logs FOR INSERT
      WITH CHECK (
        auth.role() = 'service_role'
        OR (
          auth.uid() IS NOT NULL
          AND EXISTS (
            SELECT 1 FROM brand_members
            WHERE brand_members.brand_id = publishing_logs.brand_id
            AND brand_members.user_id = auth.uid()
          )
        )
      );
    `,
    
    // Step 9: Drop old post_approvals policies
    `
    DROP POLICY IF EXISTS "Brand members can view post approvals" ON post_approvals;
    DROP POLICY IF EXISTS "Brand members can manage post approvals" ON post_approvals;
    DROP POLICY IF EXISTS "Brand members can create post approvals" ON post_approvals;
    DROP POLICY IF EXISTS "Brand members can update post approvals" ON post_approvals;
    `,
    
    // Step 9b: Create post_approvals SELECT policy
    `
    CREATE POLICY "Brand members can view post approvals"
      ON post_approvals FOR SELECT
      USING (
        auth.uid() IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM brand_members
          WHERE brand_members.brand_id = post_approvals.brand_id
          AND brand_members.user_id = auth.uid()
        )
      );
    `,
    
    // Step 9c: Create post_approvals INSERT policy
    `
    CREATE POLICY "Brand members can create post approvals"
      ON post_approvals FOR INSERT
      WITH CHECK (
        auth.uid() IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM brand_members
          WHERE brand_members.brand_id = post_approvals.brand_id
          AND brand_members.user_id = auth.uid()
        )
      );
    `,
    
    // Step 9d: Create post_approvals UPDATE policy
    `
    CREATE POLICY "Brand members can update post approvals"
      ON post_approvals FOR UPDATE
      USING (
        auth.uid() IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM brand_members
          WHERE brand_members.brand_id = post_approvals.brand_id
          AND brand_members.user_id = auth.uid()
        )
      );
    `,
  ];

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i].trim();
    const stepNum = i + 1;
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: step });
      
      if (error) {
        // If exec_sql doesn't exist, we need to use a different approach
        if (error.code === 'PGRST202') {
          console.log(`⚠️  Step ${stepNum}: exec_sql RPC not available - need to run SQL directly in Supabase console`);
          console.log('');
          console.log('Please copy the contents of supabase/migrations/016_enforce_rls_hardening.sql');
          console.log('and execute in Supabase SQL Editor: https://supabase.com/dashboard/project/nsrlgwimixkgwlqrpbxq/sql');
          process.exit(1);
        }
        
        console.log(`❌ Step ${stepNum}: ${error.message}`);
        failCount++;
      } else {
        console.log(`✅ Step ${stepNum}: Success`);
        successCount++;
      }
    } catch (err: any) {
      console.log(`❌ Step ${stepNum}: ${err.message}`);
      failCount++;
    }
  }

  console.log('');
  console.log('════════════════════════════════════════');
  console.log(`✅ Successful steps: ${successCount}`);
  console.log(`❌ Failed steps: ${failCount}`);
  console.log('════════════════════════════════════════');
  
  if (failCount > 0) {
    console.log('');
    console.log('⚠️  Some steps failed. You may need to run the migration manually.');
    console.log('   Copy supabase/migrations/016_enforce_rls_hardening.sql to Supabase SQL Editor.');
  }
}

applyMigration().catch(console.error);

