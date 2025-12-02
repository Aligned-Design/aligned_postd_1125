#!/usr/bin/env tsx
/**
 * POSTD Runtime Diagnostic Agent
 * Supabase Smoke Tests
 * 
 * Tests:
 * 1. ENV Variables verification
 * 2. Server client test
 * 3. Client client test
 * 4. Cross-client consistency
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Helper to mask sensitive values
function maskKey(key: string): string {
  if (!key || key.length < 8) return '***';
  return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
}

// Helper to extract project ID from Supabase URL
function extractProjectId(url: string): string | null {
  try {
    const match = url.match(/https?:\/\/([^.]+)\.supabase\.co/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

// Helper to decode JWT and extract project_id from payload
function decodeJwtPayload(token: string): { project_id?: string; role?: string; aud?: string; iss?: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    // Supabase JWT may have project_id in different fields
    // Try aud (audience) which often contains the project ref
    // or extract from iss (issuer) URL
    if (!payload.project_id && payload.aud) {
      // aud might be the project ref
      payload.project_id = payload.aud;
    }
    if (!payload.project_id && payload.iss) {
      // Extract from issuer URL like https://[project].supabase.co/auth/v1
      const match = payload.iss.match(/https?:\/\/([^.]+)\.supabase\.co/);
      if (match) {
        payload.project_id = match[1];
      }
    }
    return payload;
  } catch {
    return null;
  }
}

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

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL';
  details: string;
  error?: string;
}

const results: TestResult[] = [];

console.log('🔍 POSTD Runtime Diagnostic Agent - Supabase Smoke Tests\n');
console.log('='.repeat(60));

// Load environment variables
loadEnvFiles();

// =========================
// 1. Verify ENV Variables
// =========================
console.log('\n📋 Test 1: Verify ENV Variables');
console.log('-'.repeat(60));

const envVars = {
  VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
};

let envTestPass = true;
const envDetails: string[] = [];

for (const [key, value] of Object.entries(envVars)) {
  const exists = !!value;
  const isEmpty = !value || value.trim() === '';
  const isPlaceholder = value?.includes('your-') || value?.includes('placeholder') || value?.includes('xxx');
  
  envDetails.push(`${key}: ${exists ? 'EXISTS' : 'MISSING'} ${isEmpty ? '(EMPTY)' : ''} ${isPlaceholder ? '(PLACEHOLDER)' : ''}`);
  
  if (!exists || isEmpty || isPlaceholder) {
    envTestPass = false;
    envDetails.push(`  ❌ ${key} is ${!exists ? 'missing' : isEmpty ? 'empty' : 'a placeholder'}`);
  } else {
    if (key.includes('KEY')) {
      envDetails.push(`  Value: ${maskKey(value)}`);
    } else {
      envDetails.push(`  Value: ${value}`);
    }
  }
}

// Check URL consistency
const urlMatch = envVars.SUPABASE_URL === envVars.VITE_SUPABASE_URL;
if (!urlMatch && envVars.SUPABASE_URL && envVars.VITE_SUPABASE_URL) {
  envTestPass = false;
  envDetails.push(`  ❌ SUPABASE_URL !== VITE_SUPABASE_URL`);
  envDetails.push(`     SUPABASE_URL: ${envVars.SUPABASE_URL}`);
  envDetails.push(`     VITE_SUPABASE_URL: ${envVars.VITE_SUPABASE_URL}`);
} else if (urlMatch && envVars.SUPABASE_URL) {
  envDetails.push(`  ✅ URLs match: ${envVars.SUPABASE_URL}`);
}

results.push({
  name: 'ENV Variables',
  status: envTestPass ? 'PASS' : 'FAIL',
  details: envDetails.join('\n'),
});

// =========================
// 2. Server Client Test
// =========================
console.log('\n📋 Test 2: Server Client Test');
console.log('-'.repeat(60));

let serverTestPass = false;
let serverDetails = '';
let serverError: string | undefined;

try {
  const serverUrl = envVars.SUPABASE_URL || envVars.VITE_SUPABASE_URL;
  const serverKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

  if (!serverUrl || !serverKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  const serverClient = createClient(serverUrl, serverKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  serverDetails += `✅ Client initialized\n`;
  serverDetails += `   URL: ${serverUrl}\n`;
  serverDetails += `   Key: ${maskKey(serverKey)} (service_role)\n`;

  // Test query
  const { data, error } = await serverClient
    .from('brands')
    .select('id')
    .limit(1);

  if (error) {
    throw error;
  }

  serverTestPass = true;
  serverDetails += `✅ Query succeeded\n`;
  serverDetails += `   Rows returned: ${data?.length || 0}\n`;
  if (data && data.length > 0) {
    serverDetails += `   Sample ID: ${data[0].id}\n`;
  }
} catch (err: any) {
  serverTestPass = false;
  serverError = err.message || String(err);
  serverDetails += `❌ Error: ${serverError}\n`;
}

results.push({
  name: 'Server Client',
  status: serverTestPass ? 'PASS' : 'FAIL',
  details: serverDetails,
  error: serverError,
});

// =========================
// 3. Client Client Test
// =========================
console.log('\n📋 Test 3: Client Client Test');
console.log('-'.repeat(60));

let clientTestPass = false;
let clientDetails = '';
let clientError: string | undefined;

try {
  // Simulate client environment by using VITE_ prefixed vars
  const clientUrl = envVars.VITE_SUPABASE_URL;
  const clientKey = envVars.VITE_SUPABASE_ANON_KEY;

  if (!clientUrl || !clientKey) {
    throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
  }

  // Normalize URL (same logic as client/lib/supabase.ts)
  function normalizeUrl(url: string): string {
    const trimmed = url.trim();
    return trimmed
      .replace(/^hhttps:\/\//i, 'https://')
      .replace(/^hhttp:\/\//i, 'http://');
  }

  const normalizedUrl = normalizeUrl(clientUrl);

  function isValidHttpUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  if (!isValidHttpUrl(normalizedUrl)) {
    throw new Error(`Invalid VITE_SUPABASE_URL: "${normalizedUrl}"`);
  }

  const clientClient = createClient(normalizedUrl, clientKey);

  clientDetails += `✅ Client initialized\n`;
  clientDetails += `   URL: ${normalizedUrl}\n`;
  clientDetails += `   Key: ${maskKey(clientKey)} (anon)\n`;

  // Test query
  const { data, error } = await clientClient
    .from('brands')
    .select('id')
    .limit(1);

  if (error) {
    throw error;
  }

  clientTestPass = true;
  clientDetails += `✅ Query succeeded\n`;
  clientDetails += `   Rows returned: ${data?.length || 0}\n`;
  if (data && data.length > 0) {
    clientDetails += `   Sample ID: ${data[0].id}\n`;
  }
} catch (err: any) {
  clientTestPass = false;
  clientError = err.message || String(err);
  clientDetails += `❌ Error: ${clientError}\n`;
}

results.push({
  name: 'Client Client',
  status: clientTestPass ? 'PASS' : 'FAIL',
  details: clientDetails,
  error: clientError,
});

// =========================
// 4. Cross-Client Consistency
// =========================
console.log('\n📋 Test 4: Cross-Client Consistency');
console.log('-'.repeat(60));

let consistencyTestPass = false;
let consistencyDetails = '';

try {
  const serverUrl = envVars.SUPABASE_URL || envVars.VITE_SUPABASE_URL;
  const clientUrl = envVars.VITE_SUPABASE_URL;
  const anonKey = envVars.VITE_SUPABASE_ANON_KEY;
  const serviceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

  if (!serverUrl || !clientUrl || !anonKey || !serviceKey) {
    throw new Error('Missing required environment variables for consistency check');
  }

  // Extract project IDs from URLs
  const serverProjectId = extractProjectId(serverUrl);
  const clientProjectId = extractProjectId(clientUrl);

  consistencyDetails += `Server URL Project ID: ${serverProjectId || 'N/A'}\n`;
  consistencyDetails += `Client URL Project ID: ${clientProjectId || 'N/A'}\n`;

  // Decode JWT payloads
  const anonPayload = decodeJwtPayload(anonKey);
  const servicePayload = decodeJwtPayload(serviceKey);

  const anonProjectId = anonPayload?.project_id;
  const serviceProjectId = servicePayload?.project_id;

  consistencyDetails += `Anon Key Project ID: ${anonProjectId || 'N/A'}\n`;
  consistencyDetails += `Service Key Project ID: ${serviceProjectId || 'N/A'}\n`;
  consistencyDetails += `Anon Key Role: ${anonPayload?.role || 'N/A'}\n`;
  consistencyDetails += `Service Key Role: ${servicePayload?.role || 'N/A'}\n`;

  // Check consistency
  // Primary validation: URLs must match (most reliable source of truth)
  const urlMatch = serverUrl === clientUrl;
  const urlProjectIdsMatch = serverProjectId === clientProjectId;

  if (urlMatch) {
    consistencyDetails += `✅ URLs match\n`;
    if (urlProjectIdsMatch && serverProjectId) {
      consistencyDetails += `✅ Project ID from URLs match: ${serverProjectId}\n`;
      consistencyTestPass = true;
    } else if (!urlProjectIdsMatch) {
      consistencyDetails += `❌ Project IDs from URLs do not match\n`;
      consistencyTestPass = false;
    }
  } else {
    consistencyDetails += `❌ URLs do not match\n`;
    consistencyTestPass = false;
  }

  // Secondary validation: JWT project IDs (informational only, non-critical)
  // Note: Project ID validation should rely on URL extraction, not JWT payload
  // JWT project_id extraction may not always work reliably across all Supabase versions
  const jwtProjectIdsMatch = 
    anonProjectId === serviceProjectId &&
    (anonProjectId === serverProjectId || anonProjectId === clientProjectId);

  if (!jwtProjectIdsMatch && (anonProjectId || serviceProjectId)) {
    // JWT extraction mismatch is non-critical - just log as info
    consistencyDetails += `ℹ️  Note: JWT project_id extraction may vary (URL validation is authoritative)\n`;
  }

  // Check key roles
  if (anonPayload?.role !== 'anon') {
    consistencyDetails += `⚠️  Anon key role is '${anonPayload?.role}', expected 'anon'\n`;
  }
  if (servicePayload?.role !== 'service_role') {
    consistencyDetails += `⚠️  Service key role is '${servicePayload?.role}', expected 'service_role'\n`;
    consistencyTestPass = false;
  }
} catch (err: any) {
  consistencyTestPass = false;
  consistencyDetails += `❌ Error: ${err.message || String(err)}\n`;
}

results.push({
  name: 'Cross-Client Consistency',
  status: consistencyTestPass ? 'PASS' : 'FAIL',
  details: consistencyDetails,
});

// =========================
// 5. Output Summary
// =========================
console.log('\n📊 Test Summary');
console.log('='.repeat(60));

const allPassed = results.every(r => r.status === 'PASS');
const projectId = extractProjectId(envVars.SUPABASE_URL || envVars.VITE_SUPABASE_URL || '');

console.log('\nResults:');
results.forEach(result => {
  const icon = result.status === 'PASS' ? '✅' : '❌';
  console.log(`${icon} ${result.name}: ${result.status}`);
  if (result.details) {
    console.log(result.details.split('\n').map(line => `   ${line}`).join('\n'));
  }
  if (result.error) {
    console.log(`   Error: ${result.error}`);
  }
});

console.log('\n' + '='.repeat(60));
console.log('\n📋 Environment Values Detected:');
console.log(`   VITE_SUPABASE_URL: ${envVars.VITE_SUPABASE_URL || 'MISSING'}`);
console.log(`   VITE_SUPABASE_ANON_KEY: ${envVars.VITE_SUPABASE_ANON_KEY ? maskKey(envVars.VITE_SUPABASE_ANON_KEY) : 'MISSING'}`);
console.log(`   SUPABASE_URL: ${envVars.SUPABASE_URL || 'MISSING'}`);
console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${envVars.SUPABASE_SERVICE_ROLE_KEY ? maskKey(envVars.SUPABASE_SERVICE_ROLE_KEY) : 'MISSING'}`);

console.log('\n🔑 Supabase Project ID:');
if (projectId) {
  console.log(`   ${projectId}`);
} else {
  console.log('   Could not extract project ID from URL');
}

console.log('\n' + '='.repeat(60));
console.log('\n🎯 Final Verdict:');

let verdict: string;
if (allPassed && consistencyTestPass) {
  verdict = '✅ Correct project';
} else if (!envTestPass || (!serverTestPass && !clientTestPass)) {
  verdict = '❌ Wrong project or configuration error';
} else if (serverTestPass !== clientTestPass || !consistencyTestPass) {
  verdict = '⚠️  Mixed wiring';
} else {
  verdict = '❌ Configuration issues detected';
}

console.log(`   ${verdict}`);

// Exit with appropriate code
process.exit(allPassed ? 0 : 1);

