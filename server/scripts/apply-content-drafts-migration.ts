/**
 * Apply content_drafts migration to Supabase
 * Run with: pnpm tsx server/scripts/apply-content-drafts-migration.ts
 */

import { supabase } from "../lib/supabase";
import * as fs from "fs";
import * as path from "path";

async function applyMigration() {
  console.log("🚀 Applying migration 017_create_content_drafts.sql...\n");

  // Check current state
  const { data: existingTable, error: checkError } = await supabase
    .from("content_drafts")
    .select("id")
    .limit(1);

  if (!checkError) {
    console.log("✅ content_drafts table already exists!");
    console.log("   No migration needed.\n");
    return;
  }

  if (!checkError.message.includes("does not exist")) {
    console.log("⚠️  Unexpected error:", checkError.message);
  }

  console.log("📋 Table doesn't exist yet. Migration needs to be applied manually.\n");
  console.log("═".repeat(70));
  console.log("\n🔧 MANUAL STEPS TO APPLY MIGRATION:\n");
  console.log("1. Open Supabase Dashboard SQL Editor:");
  console.log("   https://supabase.com/dashboard/project/nsrlgwimixkgwlqrpbxq/sql/new\n");
  console.log("2. Copy and paste the SQL from:");
  console.log("   supabase/migrations/017_create_content_drafts.sql\n");
  console.log("3. Click 'Run' to execute\n");
  console.log("═".repeat(70));
  
  // Read and display the migration for easy copy
  const migrationPath = path.join(process.cwd(), "supabase/migrations/017_create_content_drafts.sql");
  const sql = fs.readFileSync(migrationPath, "utf8");
  
  console.log("\n📄 MIGRATION SQL (copy this):\n");
  console.log("─".repeat(70));
  console.log(sql);
  console.log("─".repeat(70));
}

applyMigration()
  .then(() => {
    console.log("\n✅ Done!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("\n❌ Error:", err);
    process.exit(1);
  });

