/**
 * Direct Migration Application Script
 * Applies all database migrations via Supabase client
 *
 * Usage:
 *   npx ts-node server/utils/apply-migrations.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const migrationFiles = [
  "001_auth_and_users.sql",
  "002_brands_and_agencies.sql",
  "003_content_and_posts.sql",
  "004_analytics_and_metrics.sql",
  "005_integrations.sql",
  "006_approvals_and_workflows.sql",
  "007_client_portal_and_audit.sql",
  "008_indexes_and_views.sql",
];

async function applyMigrations() {
  console.log("🚀 Starting database migration application...\n");

  let successCount = 0;
  let failureCount = 0;

  for (const file of migrationFiles) {
    const filePath = path.join(process.cwd(), "supabase", "migrations", file);

    try {
      const sql = fs.readFileSync(filePath, "utf-8");

      console.log(`⏳ Applying ${file}...`);

      // Execute the SQL
      const { error } = await supabase.rpc('exec', { sql });

      if (error) {
        console.error(`   ❌ Failed: ${error.message}`);
        failureCount++;
      } else {
        console.log(`   ✅ Applied successfully`);
        successCount++;
      }
    } catch (err) {
      console.error(`   ❌ Error reading file: ${err}`);
      failureCount++;
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ Success: ${successCount}/${migrationFiles.length}`);
  console.log(`❌ Failed: ${failureCount}/${migrationFiles.length}`);

  if (failureCount === 0) {
    console.log("\n✨ All migrations applied successfully!\n");
    return 0;
  } else {
    console.log("\n⚠️  Some migrations failed. Check the errors above.\n");
    return 1;
  }
}

applyMigrations()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error("Migration error:", err);
    process.exit(1);
  });
