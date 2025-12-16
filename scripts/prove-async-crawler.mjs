#!/usr/bin/env node
/**
 * Async Crawler Proof Pack
 * 
 * Audit-grade verification script for async crawler system.
 * Provides commands and SQL to verify the entire flow works.
 * 
 * Usage: node scripts/prove-async-crawler.mjs
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

function header(text) {
  console.log(`\n${colors.bright}${colors.blue}${'='.repeat(80)}${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}  ${text}${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}${'='.repeat(80)}${colors.reset}\n`);
}

function section(text) {
  console.log(`\n${colors.bright}${colors.cyan}━━ ${text}${colors.reset}\n`);
}

function success(text) {
  console.log(`${colors.green}✓${colors.reset} ${text}`);
}

function warning(text) {
  console.log(`${colors.yellow}⚠${colors.reset} ${text}`);
}

function error(text) {
  console.log(`${colors.red}✗${colors.reset} ${text}`);
}

function code(text) {
  console.log(`${colors.cyan}${text}${colors.reset}`);
}

// Get git SHA
function getGitSHA() {
  try {
    return execSync('git rev-parse HEAD', { cwd: rootDir, encoding: 'utf-8' }).trim();
  } catch {
    return 'unknown';
  }
}

function getShortSHA() {
  try {
    return execSync('git rev-parse --short HEAD', { cwd: rootDir, encoding: 'utf-8' }).trim();
  } catch {
    return 'unknown';
  }
}

// Check env vars (presence only, no values)
function checkEnvVars() {
  const vars = [
    'CRON_SECRET',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
  ];

  const results = {};
  vars.forEach(varName => {
    results[varName] = !!process.env[varName];
  });

  return results;
}

// Main proof pack
header('ASYNC CRAWLER PROOF PACK');

section('1. Git Status');
const gitSHA = getGitSHA();
const shortSHA = getShortSHA();
success(`Current SHA: ${shortSHA} (${gitSHA})`);

section('2. Environment Variables (Presence Check)');
const envVars = checkEnvVars();
Object.entries(envVars).forEach(([name, present]) => {
  if (present) {
    success(`${name}: Present`);
  } else {
    warning(`${name}: Missing`);
  }
});

section('3. Canonical Status Flow');
console.log('Status transitions:');
code('  pending → processing → completed');
code('                     └→ failed');
console.log('\nStatus definitions:');
code('  - pending: Job queued, not claimed');
code('  - processing: Worker actively crawling');
code('  - completed: Success');
code('  - failed: Error or stale timeout');

section('4. File Verification');
const criticalFiles = [
  'server/lib/crawl-status.ts',
  'server/lib/crawler-job-service.ts',
  'server/routes/crawler.ts',
  'supabase/migrations/20241216_crawl_runs_async.sql',
];

criticalFiles.forEach(file => {
  const path = join(rootDir, file);
  if (existsSync(path)) {
    success(file);
  } else {
    error(`${file} - NOT FOUND`);
  }
});

section('5. Curl Commands (Manual Execution Required)');
console.log('Replace <YOUR_DOMAIN> and <YOUR_SECRET> with actual values:\n');

console.log('A) Start a crawl:');
code(`curl -X POST "https://<YOUR_DOMAIN>/api/crawl/start" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -d '{
    "url": "https://stripe.com",
    "brand_id": "YOUR_BRAND_UUID",
    "workspaceId": "YOUR_WORKSPACE_UUID"
  }'`);

console.log('\nExpected response:');
code(`{
  "runId": "abc-123-xyz",
  "status": "pending",
  "message": "Crawl job queued...",
  "pollUrl": "/api/crawl/status/abc-123-xyz"
}`);

console.log('\n\nB) Poll for status:');
code(`curl "https://<YOUR_DOMAIN>/api/crawl/status/abc-123-xyz" \\
  -H "Authorization: Bearer YOUR_TOKEN"`);

console.log('\nExpected response (while processing):');
code(`{
  "id": "abc-123-xyz",
  "status": "processing",
  "progress": 50,
  "startedAt": "2024-12-16T10:00:00Z",
  "finishedAt": null,
  "brandKit": null,
  "errorMessage": null
}`);

console.log('\n\nC) Manually trigger cron processor (requires CRON_SECRET):');
code(`curl -X POST "https://<YOUR_DOMAIN>/api/crawl/process-jobs?secret=<YOUR_SECRET>"`);

console.log('\nExpected response:');
code(`{
  "success": true,
  "message": "Crawl jobs processed",
  "timestamp": "2024-12-16T10:00:00Z"
}`);

section('6. Supabase SQL Verification');
console.log('Run these queries in Supabase SQL Editor:\n');

console.log('A) Verify crawl_runs table exists:');
code(`SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'crawl_runs'
) as table_exists;`);
console.log('Expected: table_exists = true\n');

console.log('\nB) Check most recent crawl run:');
code(`SELECT 
  id,
  brand_id,
  url,
  status,
  progress,
  error_message,
  created_at,
  updated_at,
  started_at,
  finished_at,
  runtime_info->>'worker_id' as worker_id
FROM crawl_runs
ORDER BY created_at DESC
LIMIT 1;`);
console.log('Expected: Most recent run with status/progress/timestamps\n');

console.log('\nC) Check for pending jobs:');
code(`SELECT COUNT(*) as pending_count
FROM crawl_runs
WHERE status = 'pending';`);
console.log('Expected: pending_count = 0 (if cron is working)\n');

console.log('\nD) Check for stale jobs:');
code(`SELECT 
  id,
  brand_id,
  url,
  status,
  updated_at,
  EXTRACT(EPOCH FROM (NOW() - updated_at))/60 as minutes_stale
FROM crawl_runs
WHERE status = 'processing'
  AND updated_at < NOW() - INTERVAL '10 minutes';`);
console.log('Expected: 0 rows (no stale jobs)\n');

console.log('\nE) Verify status transitions are valid:');
code(`SELECT 
  status,
  COUNT(*) as count
FROM crawl_runs
GROUP BY status
ORDER BY status;`);
console.log('Expected: Only valid statuses (pending, processing, completed, failed)\n');

section('7. Vercel Cron Configuration');
console.log('⚠️  CRITICAL: Vercel does NOT interpolate env vars in vercel.json\n');
console.log('Configure cron manually in Vercel Dashboard → Settings → Crons:\n');
code('  Path:     /api/crawl/process-jobs?secret=<PASTE_ACTUAL_SECRET>');
code('  Schedule: * * * * * (every minute)');
console.log('\nDo NOT use ${CRON_SECRET} in the path - it will be treated literally!');

section('8. Production Verification Checklist');
console.log('After deployment, verify:\n');
success('[ ] Vercel logs show /api/crawl/process-jobs → 200 OK every minute');
success('[ ] No 403 Forbidden responses (auth working)');
success('[ ] Create test crawl job via UI');
success('[ ] Watch crawl_runs row: status changes from pending → processing → completed');
success('[ ] Verify updated_at timestamp changes during processing (heartbeat works)');
success('[ ] Verify progress increases: 0 → 20 → 50 → 70 → 95 → 100');
success('[ ] UI completes onboarding without infinite spinner');
success('[ ] Check for stale jobs (should be 0)');
success('[ ] No duplicate processing (atomic claim working)');

section('9. Expected Timeline (Typical Crawl)');
code('T+0s:   Status=pending, progress=0');
code('T+5s:   Status=processing, progress=10   (claimed by worker)');
code('T+10s:  Status=processing, progress=20   (crawling...)');
code('T+15s:  Status=processing, progress=50   (extracting...)');
code('T+20s:  Status=processing, progress=70   (generating...)');
code('T+25s:  Status=processing, progress=95   (finalizing...)');
code('T+30s:  Status=completed, progress=100   (done!)');
console.log('\n⚠️  If updated_at stays frozen while progress changes, HEARTBEAT IS BROKEN!\n');

header('PROOF PACK COMPLETE');
console.log(`Generated at: ${new Date().toISOString()}`);
console.log(`Git SHA: ${shortSHA}`);
console.log('');

