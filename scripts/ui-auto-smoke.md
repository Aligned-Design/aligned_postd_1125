# UI Smoke Test Automation

This document describes the minimal UI smoke test automation for POSTD. These tests verify that the API endpoints work correctly and that the seeded data is accessible.

## Overview

The smoke tests verify:
- API endpoints return data without PostgREST 401/403 errors
- `brandId` resolves correctly
- Session is stable
- Seeded data is accessible

## Prerequisites

1. Dev server running: `pnpm dev`
2. Seeded data exists (run `tsx scripts/seed-minimal-postd.ts`)
3. User is authenticated (get JWT token from login)

## Test Script

Create a test script: `scripts/ui-smoke-test.ts`

```typescript
#!/usr/bin/env tsx
/**
 * UI Smoke Test
 * 
 * Tests API endpoints programmatically to verify UI flows work.
 * 
 * Usage:
 *   tsx scripts/ui-smoke-test.ts
 * 
 * Environment Variables:
 *   - VITE_SUPABASE_URL or SUPABASE_URL
 *   - AUTH_USER_EMAIL
 *   - AUTH_USER_PASSWORD (for login)
 *   - BRAND_ID (optional, will use seeded brand if not provided)
 */

import * as fs from 'fs';
import * as path from 'path';

// Load .env files
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
  endpoint: string;
  status: 'PASS' | 'FAIL';
  statusCode?: number;
  error?: string;
}

async function runSmokeTests() {
  loadEnvFiles();

  const baseUrl = process.env.DEV_SERVER_URL || 'http://localhost:8080';
  const email = process.env.AUTH_USER_EMAIL;
  const password = process.env.AUTH_USER_PASSWORD;
  const brandId = process.env.BRAND_ID || '22222222-2222-2222-2222-222222222222'; // Seeded brand ID

  if (!email || !password) {
    console.error('❌ Missing AUTH_USER_EMAIL or AUTH_USER_PASSWORD');
    process.exit(1);
  }

  console.log('🧪 POSTD UI Smoke Tests\n');
  console.log('='.repeat(60));
  console.log(`Base URL: ${baseUrl}`);
  console.log(`Brand ID: ${brandId}\n`);

  const results: TestResult[] = [];

  // Step 1: Login to get JWT token
  console.log('🔐 Step 1: Authenticating...');
  let authToken: string | null = null;

  try {
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      authToken = loginData.token || loginData.access_token;
      console.log('✅ Authentication successful\n');
    } else {
      console.error(`❌ Login failed: ${loginResponse.status} ${loginResponse.statusText}`);
      process.exit(1);
    }
  } catch (error: any) {
    console.error(`❌ Login error: ${error.message}`);
    process.exit(1);
  }

  if (!authToken) {
    console.error('❌ No auth token received');
    process.exit(1);
  }

  // Step 2: Test API endpoints
  console.log('📡 Step 2: Testing API endpoints...\n');

  const endpoints = [
    {
      name: 'Get Brand',
      method: 'GET',
      url: `/api/brands/${brandId}`,
      requiresAuth: true,
    },
    {
      name: 'Get Brand Guide',
      method: 'GET',
      url: `/api/brand-guide/${brandId}`,
      requiresAuth: true,
    },
    {
      name: 'Get Dashboard Data',
      method: 'POST',
      url: `/api/dashboard`,
      requiresAuth: true,
      body: { brandId, timeRange: '30d' },
    },
    {
      name: 'Get Content Queue',
      method: 'GET',
      url: `/api/content?brandId=${brandId}`,
      requiresAuth: true,
    },
    {
      name: 'Get Campaigns',
      method: 'GET',
      url: `/api/campaigns?brandId=${brandId}`,
      requiresAuth: true,
    },
  ];

  for (const endpoint of endpoints) {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (endpoint.requiresAuth && authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const options: RequestInit = {
        method: endpoint.method,
        headers,
      };

      if (endpoint.body) {
        options.body = JSON.stringify(endpoint.body);
      }

      const response = await fetch(`${baseUrl}${endpoint.url}`, options);
      const statusCode = response.status;

      if (statusCode >= 200 && statusCode < 300) {
        results.push({
          endpoint: endpoint.name,
          status: 'PASS',
          statusCode,
        });
        console.log(`✅ ${endpoint.name}: ${statusCode}`);
      } else if (statusCode === 401 || statusCode === 403) {
        results.push({
          endpoint: endpoint.name,
          status: 'FAIL',
          statusCode,
          error: `PostgREST ${statusCode} - Authentication/Authorization error`,
        });
        console.log(`❌ ${endpoint.name}: ${statusCode} (Auth error)`);
      } else {
        const errorText = await response.text().catch(() => 'Unknown error');
        results.push({
          endpoint: endpoint.name,
          status: 'FAIL',
          statusCode,
          error: errorText.substring(0, 100),
        });
        console.log(`❌ ${endpoint.name}: ${statusCode}`);
      }
    } catch (error: any) {
      results.push({
        endpoint: endpoint.name,
        status: 'FAIL',
        error: error.message,
      });
      console.log(`❌ ${endpoint.name}: ${error.message}`);
    }
  }

  // Step 3: Verify brandId resolution
  console.log('\n🔍 Step 3: Verifying brandId resolution...');
  try {
    const response = await fetch(`${baseUrl}/api/brands/${brandId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const brand = await response.json();
      if (brand.id === brandId) {
        console.log('✅ Brand ID resolves correctly');
        results.push({
          endpoint: 'Brand ID Resolution',
          status: 'PASS',
        });
      } else {
        console.log('❌ Brand ID mismatch');
        results.push({
          endpoint: 'Brand ID Resolution',
          status: 'FAIL',
          error: 'Returned brand ID does not match requested ID',
        });
      }
    } else {
      console.log(`❌ Brand ID resolution failed: ${response.status}`);
      results.push({
        endpoint: 'Brand ID Resolution',
        status: 'FAIL',
        statusCode: response.status,
      });
    }
  } catch (error: any) {
    console.log(`❌ Brand ID resolution error: ${error.message}`);
    results.push({
      endpoint: 'Brand ID Resolution',
      status: 'FAIL',
      error: error.message,
    });
  }

  // Step 4: Verify session stability
  console.log('\n🔒 Step 4: Verifying session stability...');
  try {
    // Make multiple requests with the same token
    const requests = Array(3).fill(null).map(() =>
      fetch(`${baseUrl}/api/brands/${brandId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      })
    );

    const responses = await Promise.all(requests);
    const allOk = responses.every(r => r.ok);

    if (allOk) {
      console.log('✅ Session is stable (3 consecutive requests succeeded)');
      results.push({
        endpoint: 'Session Stability',
        status: 'PASS',
      });
    } else {
      console.log('❌ Session instability detected');
      results.push({
        endpoint: 'Session Stability',
        status: 'FAIL',
        error: 'Some requests failed with same token',
      });
    }
  } catch (error: any) {
    console.log(`❌ Session stability error: ${error.message}`);
    results.push({
      endpoint: 'Session Stability',
      status: 'FAIL',
      error: error.message,
    });
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Results Summary:\n');

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;

  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Total: ${results.length}\n`);

  if (failed > 0) {
    console.log('Failed tests:');
    results
      .filter(r => r.status === 'FAIL')
      .forEach(r => {
        console.log(`  - ${r.endpoint}`);
        if (r.error) console.log(`    Error: ${r.error}`);
        if (r.statusCode) console.log(`    Status: ${r.statusCode}`);
      });
  }

  console.log('\n' + '='.repeat(60));

  if (failed === 0) {
    console.log('✅ All smoke tests passed!');
    process.exit(0);
  } else {
    console.log('❌ Some smoke tests failed');
    process.exit(1);
  }
}

// Run tests
runSmokeTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
```

## Manual Test Checklist

If you prefer to test manually:

1. **Start dev server**: `pnpm dev`
2. **Login**: Navigate to login page and authenticate
3. **Test endpoints** (using browser DevTools or curl):
   - `GET /api/brands/:brandId` - Should return brand data
   - `GET /api/brand-guide/:brandId` - Should return brand guide
   - `POST /api/dashboard` - Should return dashboard data
   - `GET /api/content?brandId=:brandId` - Should return content items
   - `GET /api/campaigns?brandId=:brandId` - Should return campaigns

4. **Verify**:
   - No 401/403 errors
   - `brandId` resolves correctly
   - Session token works for multiple requests

## Expected Results

All endpoints should:
- Return 200 status codes
- Include valid JSON responses
- Not return PostgREST authentication errors
- Resolve `brandId` correctly
- Maintain session stability

## Troubleshooting

- **401/403 errors**: Check RLS policies and user authentication
- **Brand not found**: Verify seed script ran successfully
- **Session expired**: Check token expiration and refresh logic
- **CORS errors**: Verify dev server CORS configuration

