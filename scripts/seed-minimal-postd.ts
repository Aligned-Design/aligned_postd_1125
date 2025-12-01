#!/usr/bin/env tsx
/**
 * POSTD Minimal Data Seeder
 * 
 * Seeds required minimal data for POSTD to function:
 * - One tenant
 * - One brand under that tenant
 * - One user_profile (linked to auth user)
 * - One brand_member linking user to brand as 'owner'
 * 
 * This script is idempotent - safe to re-run multiple times.
 * 
 * Usage:
 *   tsx scripts/seed-minimal-postd.ts
 * 
 * Environment Variables Required:
 *   - VITE_SUPABASE_URL or SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 *   - AUTH_USER_UUID (optional, will prompt if not set)
 *   - AUTH_USER_EMAIL (optional, will prompt if not set)
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

// Load .env files if they exist
function loadEnvFiles() {
  const envFiles = ['.env.local', '.env', '.env.development'];
  for (const file of envFiles) {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      for (const line of content.split('\n')) {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match && !process.env[match[1].trim()]) {
          process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
        }
      }
    }
  }
}

// Helper to prompt for input
function promptInput(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// Validate UUID format
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

async function seedMinimalData() {
  console.log('🌱 POSTD Minimal Data Seeder\n');
  console.log('='.repeat(60));

  // Load environment variables
  loadEnvFiles();

  // Get Supabase credentials
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing required environment variables:');
    console.error('   - SUPABASE_URL or VITE_SUPABASE_URL');
    console.error('   - SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  // Get auth user UUID and email
  let authUserUuid = process.env.AUTH_USER_UUID;
  let authUserEmail = process.env.AUTH_USER_EMAIL;

  // Prompt for auth user UUID if not provided
  if (!authUserUuid) {
    console.log('\n📝 Auth User UUID not found in environment.');
    authUserUuid = await promptInput('Enter the auth user UUID: ');
    if (!isValidUUID(authUserUuid)) {
      console.error('❌ Invalid UUID format');
      process.exit(1);
    }
  }

  // Prompt for auth user email if not provided
  if (!authUserEmail) {
    console.log('\n📝 Auth User Email not found in environment.');
    authUserEmail = await promptInput('Enter the auth user email: ');
    if (!isValidEmail(authUserEmail)) {
      console.error('❌ Invalid email format');
      process.exit(1);
    }
  }

  console.log(`\n🔗 Connecting to Supabase...`);
  console.log(`   URL: ${supabaseUrl}`);
  console.log(`   Auth User UUID: ${authUserUuid}`);
  console.log(`   Auth User Email: ${authUserEmail}\n`);

  // Create Supabase client with service role
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    // =========================
    // 1. Seed Tenant
    // =========================
    console.log('📦 Seeding tenant...');
    const tenantId = '11111111-1111-1111-1111-111111111111';
    
    const { data: tenantData, error: tenantError } = await supabase
      .from('tenants')
      .upsert(
        {
          id: tenantId,
          name: 'Aligned by Design',
          plan: 'pro',
        },
        {
          onConflict: 'id',
        }
      )
      .select();

    if (tenantError) {
      throw new Error(`Failed to seed tenant: ${tenantError.message}`);
    }

    console.log('✅ Tenant created');

    // =========================
    // 2. Seed Brand
    // =========================
    console.log('📦 Seeding brand...');
    const brandId = '22222222-2222-2222-2222-222222222222';

    const { data: brandData, error: brandError } = await supabase
      .from('brands')
      .upsert(
        {
          id: brandId,
          tenant_id: tenantId,
          name: 'Aligned by Design',
          slug: 'aligned-by-design',
        },
        {
          onConflict: 'id',
        }
      )
      .select();

    if (brandError) {
      throw new Error(`Failed to seed brand: ${brandError.message}`);
    }

    console.log('✅ Brand created');

    // =========================
    // 3. Seed User Profile
    // =========================
    console.log('📦 Seeding user profile...');

    const { data: userProfileData, error: userProfileError } = await supabase
      .from('user_profiles')
      .upsert(
        {
          id: authUserUuid,
          email: authUserEmail,
        },
        {
          onConflict: 'id',
        }
      )
      .select();

    if (userProfileError) {
      throw new Error(`Failed to seed user profile: ${userProfileError.message}`);
    }

    console.log('✅ User profile created');

    // =========================
    // 4. Seed Brand Member
    // =========================
    console.log('📦 Seeding brand member...');

    const { data: brandMemberData, error: brandMemberError } = await supabase
      .from('brand_members')
      .upsert(
        {
          user_id: authUserUuid,
          brand_id: brandId,
          role: 'owner',
        },
        {
          onConflict: 'user_id,brand_id',
        }
      )
      .select();

    if (brandMemberError) {
      throw new Error(`Failed to seed brand member: ${brandMemberError.message}`);
    }

    console.log('✅ Brand member created');

    // =========================
    // Success Summary
    // =========================
    console.log('\n' + '='.repeat(60));
    console.log('✅ Seed complete — POSTD minimal data available');
    console.log('='.repeat(60));
    console.log('\n📊 Summary:');
    console.log(`   Tenant ID: ${tenantId}`);
    console.log(`   Brand ID: ${brandId}`);
    console.log(`   User ID: ${authUserUuid}`);
    console.log(`   User Email: ${authUserEmail}`);
    console.log('\n💡 You can now log in and use POSTD!');

    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Seed failed:');
    console.error(`   ${error.message}`);
    if (error.details) {
      console.error(`   Details: ${error.details}`);
    }
    process.exit(1);
  }
}

// Run the seeder
seedMinimalData();

