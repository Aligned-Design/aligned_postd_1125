# Supabase Migration Deployment Guide

This guide covers deploying the `client_settings` table migration to your Supabase database.

## Migration Details

**File:** `supabase/migrations/20250108_create_client_settings_table.sql`

**Purpose:** Create the client_settings table to support persistent storage of client email preferences, notification settings, and account preferences.

**Tables Created:**
- `public.client_settings` - Manages client email preferences and notification settings

## Deployment Methods

### Method 1: Supabase Dashboard (Recommended - 2 minutes)

This is the easiest method and requires no CLI setup.

1. **Log in to Supabase:**
   - Visit: https://app.supabase.com
   - Sign in with your account

2. **Navigate to SQL Editor:**
   - Click "SQL Editor" in the left sidebar
   - Click "+ New Query" button

3. **Copy Migration SQL:**
   - Open: `supabase/migrations/20250108_create_client_settings_table.sql`
   - Copy the entire SQL content (the file contains ~130 lines of SQL)

4. **Execute Migration:**
   - Paste the SQL into the SQL Editor
   - Click the "Run" button
   - Wait for success confirmation

5. **Verify Deployment:**
   ```sql
   -- Verify table exists
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name = 'client_settings';

   -- Check table structure
   \d client_settings

   -- Test insertion
   INSERT INTO client_settings (client_id, brand_id)
   VALUES ('test-client', 'test-brand');
   ```

### Method 2: Supabase CLI (Requires Access Token)

This method uses the CLI for automated deployment.

1. **Generate Access Token:**
   - Visit: https://app.supabase.com/account/tokens
   - Click "Generate new token"
   - Give it a name like "Migration Deployment"
   - Copy the token

2. **Authenticate CLI:**
   ```bash
   supabase login
   # Paste your access token when prompted
   ```

3. **Link Project:**
   ```bash
   supabase link --project-ref xpzvtvycjsccaosahmgz
   # You'll be prompted to confirm linking
   ```

4. **Deploy Migration:**
   ```bash
   supabase db push
   ```

5. **Verify:**
   ```bash
   # Check migration status
   supabase migration list
   ```

### Method 3: Direct PostgreSQL Connection

For direct database access if you have the database password.

1. **Get Database Password:**
   - Log in to Supabase Dashboard
   - Go to Project Settings → Database
   - Copy the database password

2. **Connect via psql:**
   ```bash
   psql -h xpzvtvycjsccaosahmgz.supabase.co \
        -U postgres \
        -d postgres \
        -f supabase/migrations/20250108_create_client_settings_table.sql
   # Enter password when prompted
   ```

## After Deployment

### 1. Verify Table Creation

```sql
-- Check table exists
SELECT EXISTS(
  SELECT FROM information_schema.tables
  WHERE table_name = 'client_settings'
);

-- Check table structure
\d client_settings

-- List indexes
SELECT * FROM pg_indexes
WHERE tablename = 'client_settings';

-- List RLS policies
SELECT * FROM pg_policies
WHERE tablename = 'client_settings';
```

### 2. Test Basic Operations

```sql
-- Insert test record
INSERT INTO client_settings (client_id, brand_id)
VALUES ('test-client', 'test-brand')
RETURNING *;

-- Query with filters
SELECT * FROM client_settings
WHERE client_id = 'test-client' AND brand_id = 'test-brand';

-- Update preferences
UPDATE client_settings
SET email_preferences = jsonb_set(
  email_preferences,
  '{approvalsNeeded}',
  'false'::jsonb
)
WHERE client_id = 'test-client';
```

### 3. Run Tests

Once the migration is deployed, verify everything works with the test suite:

```bash
# Run client-settings tests (should pass now that table exists)
pnpm test server/__tests__/client-settings.test.ts

# Run all database service tests
pnpm test server/__tests__/database-services.test.ts

# Run full test suite
pnpm test
```

## Troubleshooting

### "Table already exists" Error
- **Cause:** Migration has already been applied
- **Solution:** This is safe - the SQL uses `IF NOT EXISTS` clause, so it won't recreate the table

### "Permission denied" Error
- **Cause:** Using wrong role or insufficient permissions
- **Solution:**
  - Use service role key (has admin privileges)
  - Or use database password with `postgres` user

### "RLS policies not working" Error
- **Cause:** RLS not properly enforced
- **Solution:**
  ```sql
  -- Enable RLS on table
  ALTER TABLE public.client_settings ENABLE ROW LEVEL SECURITY;

  -- Recreate policies if needed
  -- See migration file for policy definitions
  ```

### Tests Still Failing After Deployment
- **Cause:** Schema changes not reflected in application
- **Solution:**
  1. Clear any cached database connections
  2. Restart development server: `pnpm dev`
  3. Re-run tests: `pnpm test`

## Migration File Contents

The migration file (`supabase/migrations/20250108_create_client_settings_table.sql`) includes:

- **Table Definition:** `client_settings` with 13 columns
- **Indexes:** 4 indexes for query performance
  - `idx_client_settings_client_id`
  - `idx_client_settings_brand_id`
  - `idx_client_settings_client_brand`
  - `idx_client_settings_unsubscribe_token`

- **Row-Level Security:** 4 RLS policies for multi-tenant isolation
  - `client_settings_select`
  - `client_settings_update`
  - `client_settings_insert`
  - `client_settings_delete`

- **Triggers:** Automatic `updated_at` timestamp management
  - `trigger_client_settings_updated_at`

- **Constraints:**
  - Primary key: `id` (UUID)
  - Unique constraint: `(client_id, brand_id)` combination
  - Check constraint: `language` enum validation

## Next Steps

1. **Deploy** using one of the methods above
2. **Verify** deployment with test queries
3. **Run** test suite to confirm functionality
4. **Commit** to version control (already done)
5. **Review** `supabase/migrations/README.md` for migration best practices

## Additional Resources

- [Supabase Migrations Guide](https://supabase.com/docs/guides/migrations)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/current/)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Client Settings Schema](shared/client-settings.ts)

## Support

If you encounter issues:

1. Check the migration file syntax
2. Verify your Supabase project is accessible
3. Review error messages in Supabase dashboard
4. Check the troubleshooting section above
5. Review migration documentation in `supabase/migrations/README.md`
