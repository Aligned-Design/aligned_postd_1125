# Aligned AI Platform - Testing Scripts

Comprehensive test suite for validating Supabase configuration, database setup, and system functionality.

## Available Tests

### Core Infrastructure Tests

#### `test:db-connection`
Tests basic database connectivity to Supabase.

```bash
pnpm run test:db-connection
```

**Checks:**
- VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set
- Connection to Supabase database succeeds
- Basic query execution works

---

#### `test:storage`
Verifies Supabase Storage is configured and accessible.

```bash
pnpm run test:storage
```

**Checks:**
- Storage API is accessible
- Lists all available storage buckets
- Confirms required buckets exist (or prompts to create)

---

### Authentication & Security Tests

#### `test:auth-setup`
Validates Supabase Authentication configuration.

```bash
pnpm run test:auth-setup
```

**Checks:**
- VITE_SUPABASE_URL and SUPABASE_ANON_KEY are set
- Auth system is enabled
- Session management works

---

#### `test:auth-hooks`
Tests authentication hooks for user lifecycle management.

```bash
pnpm run test:auth-hooks
```

**Checks:**
- Auth hooks are configured
- User creation triggers are set up
- Email templates are available (if using email auth)

---

#### `test:rls-policies`
Verifies Row Level Security policies are active.

```bash
pnpm run test:rls-policies
```

**Checks:**
- RLS is enabled on protected tables
- Policies are properly configured
- Access control is enforced

---

#### `test:roles`
Validates user role-based access control.

```bash
pnpm run test:roles
```

**Checks:**
- brand_users table exists
- Role assignments are functioning
- Role hierarchy is correct (admin > manager > viewer)

---

### Database Schema Tests

#### `test:table-structure`
Validates all required tables are created.

```bash
pnpm run test:table-structure
```

**Checks:**
- tenants table exists
- brands table exists
- brand_users table exists
- media_assets table exists (PHASE 6)
- media_usage_logs table exists (PHASE 6)
- storage_quotas table exists (PHASE 6)

---

#### `test:relations`
Verifies foreign key relationships are configured.

```bash
pnpm run test:relations
```

**Checks:**
- media_assets → brands relationship
- brand_users → brands relationship
- brand_users → tenants relationship
- Cascade delete rules are set

---

#### `test:data-validation`
Tests data validation rules and constraints.

```bash
pnpm run test:data-validation
```

**Checks:**
- NOT NULL constraints
- UNIQUE constraints
- Foreign key constraints
- Type validation

---

### Feature-Specific Tests

#### `test:brand`
Validates brand management system.

```bash
pnpm run test:brand
```

**Checks:**
- brands table is accessible
- brand_users table is accessible
- Multi-tenant isolation is configured
- Brand-to-user relationships work

---

#### `test:posts`
Tests content generation and posts system.

```bash
pnpm run test:posts
```

**Checks:**
- posts table exists (if configured)
- Content generation system is ready
- Post metadata is tracked

---

#### `test:analytics`
Validates analytics tracking system.

```bash
pnpm run test:analytics
```

**Checks:**
- analytics_metrics table exists
- analytics_events table exists
- analytics_sessions table exists
- Metrics collection is working

---

## Quick Start

### Run All Tests

```bash
# Run core infrastructure tests
pnpm run test:db-connection
pnpm run test:storage
pnpm run test:auth-setup

# Run security tests
pnpm run test:rls-policies
pnpm run test:roles

# Run schema tests
pnpm run test:table-structure
pnpm run test:relations
pnpm run test:data-validation

# Run feature tests
pnpm run test:brand
pnpm run test:posts
pnpm run test:analytics
```

### Recommended Test Order

1. **Environment Setup**
   ```bash
   pnpm run test:db-connection
   pnpm run test:auth-setup
   ```

2. **Database Schema**
   ```bash
   pnpm run test:table-structure
   pnpm run test:relations
   ```

3. **Security**
   ```bash
   pnpm run test:rls-policies
   pnpm run test:roles
   ```

4. **Storage**
   ```bash
   pnpm run test:storage
   ```

5. **Features**
   ```bash
   pnpm run test:brand
   pnpm run test:posts
   pnpm run test:analytics
   ```

---

## Test Output Examples

### ✅ Successful Test
```
🔌 Testing database connection...
✅ Database connection successful
   Supabase URL: https://xxxxx.supabase.co
```

### ⚠️ Warning (Non-blocking)
```
⚠️  posts table not found
   Posts table setup is optional
```

### ❌ Failed Test
```
❌ brand_users table not found
   Run: pnpm run test:auth-setup
```

---

## Environment Variables Required

Create a `.env.local` file with:

```env
# Required for all tests
VITE_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Optional
ANTHROPIC_API_KEY=sk-ant-...
FRONTEND_URL=http://localhost:5173
```

---

## Troubleshooting

### Missing Environment Variables
**Error:** `Missing environment variables`

**Solution:**
```bash
# Create .env.local with required variables
cp .env.example .env.local
# Edit .env.local and add your Supabase credentials
```

---

### Connection Refused
**Error:** `Failed to connect to database`

**Solution:**
1. Verify VITE_SUPABASE_URL is correct
2. Check internet connectivity
3. Verify Supabase project is active (check dashboard)

---

### RLS Policy Errors
**Error:** `Permission denied` or `RLS policy violation`

**Solution:**
1. Run database migration: `server/migrations/006_media_tables.sql`
2. Verify RLS policies are enabled
3. Check user is assigned to a brand

---

### Tables Not Found
**Error:** `Table does not exist` (PGRST116)

**Solution:**
1. Run database migration in Supabase dashboard
2. Verify migration completed successfully
3. Check migrations folder: `server/migrations/`

---

## Script Development

### Adding New Tests

Create a new file in the `scripts/` directory:

```bash
touch scripts/test-your-feature.js
```

**Template:**
```javascript
#!/usr/bin/env node

/**
 * Test Feature Name
 * Verifies your feature is working
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFeature() {
  try {
    console.log('🔍 Testing feature...');

    // Your test logic here

    console.log('✅ Feature working');
    process.exit(0);
  } catch (err) {
    console.error('❌ Feature test failed:', err.message);
    process.exit(1);
  }
}

testFeature();
```

Then add to `package.json`:
```json
"test:your-feature": "node scripts/test-your-feature.js"
```

---

## Exit Codes

- **0** - Test passed successfully
- **1** - Test failed with error
- **2** - Configuration missing

---

## Best Practices

1. **Run tests in order** - Start with db-connection, then progress to feature tests
2. **Check environment first** - Ensure .env.local is set up before running tests
3. **Review output carefully** - Some tests may show warnings (⚠️) which are non-blocking
4. **Run before deployment** - Always run full test suite before deploying to production

---

## Performance Notes

- Tests complete in <2 seconds each (database is fast with indexes)
- No test data is created or modified
- All tests are read-only (except validation test which attempts insert)
- Safe to run repeatedly without side effects

---

## Support

For issues with tests:

1. Check environment variables are set: `echo $VITE_SUPABASE_URL`
2. Verify Supabase project is active in dashboard
3. Review test output for specific error messages
4. Check documentation in [PRODUCTION_DEPLOYMENT_GUIDE.md](../PRODUCTION_DEPLOYMENT_GUIDE.md)

---

**Last Updated:** November 4, 2025
