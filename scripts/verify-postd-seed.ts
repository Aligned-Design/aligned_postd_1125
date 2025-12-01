#!/usr/bin/env tsx
/**
 * POSTD Seed Verification Script
 * 
 * Verifies that minimal required data exists in Supabase:
 * - At least 1 tenant
 * - At least 1 brand
 * - At least 1 user_profile
 * - At least 1 brand_member
 * 
 * Usage:
 *   tsx scripts/verify-postd-seed.ts
 * 
 * Environment Variables Required:
 *   - VITE_SUPABASE_URL or SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

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

interface VerificationResult {
  table: string;
  count: number;
  status: 'PASS' | 'FAIL';
}

async function verifySeed() {
  console.log('🔍 POSTD Seed Verification\n');
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

  console.log(`\n🔗 Connecting to Supabase...`);
  console.log(`   URL: ${supabaseUrl}\n`);

  // Create Supabase client with service role
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const results: VerificationResult[] = [];

  try {
    // =========================
    // Verify Tenants
    // =========================
    const { count: tenantCount, error: tenantError } = await supabase
      .from('tenants')
      .select('*', { count: 'exact', head: true });

    if (tenantError) {
      throw new Error(`Failed to query tenants: ${tenantError.message}`);
    }

    results.push({
      table: 'tenants',
      count: tenantCount || 0,
      status: (tenantCount || 0) >= 1 ? 'PASS' : 'FAIL',
    });

    // =========================
    // Verify Brands
    // =========================
    const { count: brandCount, error: brandError } = await supabase
      .from('brands')
      .select('*', { count: 'exact', head: true });

    if (brandError) {
      throw new Error(`Failed to query brands: ${brandError.message}`);
    }

    results.push({
      table: 'brands',
      count: brandCount || 0,
      status: (brandCount || 0) >= 1 ? 'PASS' : 'FAIL',
    });

    // =========================
    // Verify User Profiles
    // =========================
    const { count: userProfileCount, error: userProfileError } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true });

    if (userProfileError) {
      throw new Error(`Failed to query user_profiles: ${userProfileError.message}`);
    }

    results.push({
      table: 'user_profiles',
      count: userProfileCount || 0,
      status: (userProfileCount || 0) >= 1 ? 'PASS' : 'FAIL',
    });

    // =========================
    // Verify Brand Members
    // =========================
    const { count: brandMemberCount, error: brandMemberError } = await supabase
      .from('brand_members')
      .select('*', { count: 'exact', head: true });

    if (brandMemberError) {
      throw new Error(`Failed to query brand_members: ${brandMemberError.message}`);
    }

    results.push({
      table: 'brand_members',
      count: brandMemberCount || 0,
      status: (brandMemberCount || 0) >= 1 ? 'PASS' : 'FAIL',
    });

    // =========================
    // Display Results
    // =========================
    console.log('📊 Verification Results:\n');

    // Calculate column widths for table
    const maxTableNameLength = Math.max(...results.map(r => r.table.length));
    const tableWidth = Math.max(maxTableNameLength + 2, 20);
    const countWidth = 10;
    const statusWidth = 8;

    // Print table header
    console.log(
      ' '.padEnd(tableWidth) +
      'Count'.padEnd(countWidth) +
      'Status'.padEnd(statusWidth)
    );
    console.log('-'.repeat(tableWidth + countWidth + statusWidth));

    // Print table rows
    for (const result of results) {
      const icon = result.status === 'PASS' ? '✅' : '❌';
      console.log(
        result.table.padEnd(tableWidth) +
        String(result.count).padEnd(countWidth) +
        `${icon} ${result.status}`.padEnd(statusWidth)
      );
    }

    // =========================
    // Final Verdict
    // =========================
    console.log('\n' + '='.repeat(60));

    const allPassed = results.every(r => r.status === 'PASS');
    const failedTables = results.filter(r => r.status === 'FAIL').map(r => r.table);

    if (allPassed) {
      console.log('✅ Verification passed');
      console.log('\n💡 All required data is present. POSTD is ready to use!');
      process.exit(0);
    } else {
      console.log('❌ Verification failed: missing data');
      console.log(`\n   Missing or insufficient data in: ${failedTables.join(', ')}`);
      console.log('\n💡 Run the seed script to create required data:');
      console.log('   tsx scripts/seed-minimal-postd.ts');
      process.exit(1);
    }
  } catch (error: any) {
    console.error('\n❌ Verification error:');
    console.error(`   ${error.message}`);
    if (error.details) {
      console.error(`   Details: ${error.details}`);
    }
    process.exit(1);
  }
}

// Run the verification
verifySeed();

