import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

async function applyMigrations() {
  console.log("🚀 Applying all migrations to Supabase...\n");

  try {
    // Read the combined migrations file
    const migrationsDir = path.join(process.cwd(), "supabase", "migrations");
    const migrationFiles = [
      "001_auth_and_users.sql",
      "002_brands_and_agencies.sql",
      "003_content_and_posts.sql",
      "004_analytics_and_metrics.sql",
      "005_integrations.sql",
      "006_approvals_and_workflows.sql",
      "007_client_portal_and_audit.sql",
      "008_indexes_and_views.sql"
    ];

    let totalSize = 0;
    let allSQL = "";

    console.log("📝 Reading migration files...\n");
    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, "utf-8");
      allSQL += sql + "\n\n";
      totalSize += sql.length;
      console.log(`   ✓ ${file} (${sql.split('\n').length} lines)`);
    }

    console.log(`\n📊 Total: ${migrationFiles.length} files, ${totalSize} bytes\n`);
    console.log("🔄 Executing migrations...\n");

    // Try to execute as a single query first
    const { data, error } = await supabase.rpc("exec", { sql: allSQL });

    if (error) {
      console.error(`❌ Error: ${error.message}`);

      // If exec function doesn't exist, try a workaround
      if (error.code === "42883" || error.message.includes("exec")) {
        console.log("\n📌 Note: Supabase exec() function not available.");
        console.log("   Please apply migrations manually via SQL Editor:");
        console.log("   1. Go to Supabase Dashboard → SQL Editor");
        console.log("   2. Create new query and paste the combined migrations");
        console.log("   3. Click RUN\n");

        // Copy to clipboard
        const copied = require("child_process").execSync(`echo "${allSQL.replace(/"/g, '\\"')}" | pbcopy`, { encoding: 'utf-8' });
        console.log("✅ Migrations have been copied to clipboard!");
        return 0;
      }

      throw error;
    }

    console.log("✅ Successfully applied all migrations!");
    return 0;
  } catch (error) {
    console.error("Migration error:", error instanceof Error ? error.message : error);
    return 1;
  }
}

applyMigrations().then(code => process.exit(code));
