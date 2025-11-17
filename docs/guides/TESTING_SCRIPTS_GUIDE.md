# Testing Scripts Quick Reference

**Added:** 12 test scripts + README documentation
**Location:** `/scripts/` directory
**Total Lines:** 607 lines of testing code

---

## What Was Added

### Package.json Scripts (12 new npm commands)

```json
{
  "test:db-connection": "Database connectivity test",
  "test:storage": "Storage bucket verification",
  "test:auth-setup": "Authentication configuration",
  "test:auth-hooks": "Auth lifecycle hooks",
  "test:rls-policies": "Row Level Security verification",
  "test:roles": "User role-based access control",
  "test:table-structure": "Database schema validation",
  "test:relations": "Foreign key relationships",
  "test:data-validation": "Data constraints verification",
  "test:brand": "Brand management system",
  "test:posts": "Content generation system",
  "test:analytics": "Analytics tracking system"
}
```

### Script Files Created (12 JavaScript files)

| Script | Purpose | Lines |
|--------|---------|-------|
| test-db.js | Database connection | 45 |
| test-storage.js | Storage buckets | 47 |
| test-auth.js | Authentication setup | 44 |
| test-auth-hooks.js | Auth hooks | 44 |
| test-rls.js | RLS policies | 45 |
| test-roles.js | User roles | 48 |
| test-tables.js | Table structure | 63 |
| test-relations.js | Foreign keys | 56 |
| test-validation.js | Data validation | 48 |
| test-brand.js | Brand system | 58 |
| test-posts.js | Posts system | 50 |
| test-analytics.js | Analytics system | 59 |

### Documentation

- **README.md** - 272 lines comprehensive guide
  - How to run each test
  - What each test checks
  - Troubleshooting guide
  - Exit codes and best practices

---

## Quick Start

### Run Individual Tests

```bash
# Test database connection
pnpm run test:db-connection

# Test authentication
pnpm run test:auth-setup

# Test database schema
pnpm run test:table-structure

# Test security
pnpm run test:rls-policies
```

### Run All Tests in Sequence

```bash
# Infrastructure
pnpm run test:db-connection && \
pnpm run test:storage && \
pnpm run test:auth-setup

# Schema
pnpm run test:table-structure && \
pnpm run test:relations

# Security
pnpm run test:rls-policies && \
pnpm run test:roles

# Features
pnpm run test:brand && \
pnpm run test:posts && \
pnpm run test:analytics
```

---

## Test Coverage

### Infrastructure (3 tests)
✅ Database connection
✅ Storage configuration
✅ Authentication setup

### Security (3 tests)
✅ RLS policies
✅ User roles
✅ Auth hooks

### Schema (3 tests)
✅ Table structure
✅ Foreign key relations
✅ Data validation

### Features (3 tests)
✅ Brand system
✅ Posts system
✅ Analytics system

---

## Environment Variables Required

Before running tests, ensure these are in your `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

---

## Test Output Examples

### ✅ Success
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

### ❌ Failure
```
❌ brand_users table not found
   Run: pnpm run test:auth-setup
```

---

## Recommended Testing Workflow

### 1. Pre-Deployment Testing

```bash
# Check infrastructure
pnpm run test:db-connection
pnpm run test:storage

# Check auth
pnpm run test:auth-setup
pnpm run test:rls-policies

# Check schema
pnpm run test:table-structure
```

### 2. Feature Testing

```bash
# Test business logic
pnpm run test:brand
pnpm run test:posts
pnpm run test:analytics
```

### 3. Validation Testing

```bash
# Verify constraints
pnpm run test:data-validation
pnpm run test:relations
pnpm run test:roles
```

---

## Common Issues & Solutions

### "Missing environment variables"
```bash
# Solution: Create .env.local
cp .env.example .env.local
# Then edit with your Supabase credentials
```

### "Connection refused"
```bash
# Solution: Verify Supabase project is active
# Check dashboard: app.supabase.com
# Verify VITE_SUPABASE_URL is correct
```

### "Table does not exist (PGRST116)"
```bash
# Solution: Run database migration
# File: server/migrations/006_media_tables.sql
# Follow: MIGRATION_GUIDE.md
```

### "Permission denied"
```bash
# Solution: Check RLS policies
pnpm run test:rls-policies
# Check user role assignment
pnpm run test:roles
```

---

## Test Statistics

- **Total Tests:** 12
- **Total Lines of Code:** 607
- **Average Test Time:** <2 seconds
- **Average Test Size:** 50 lines
- **Documentation:** 272 lines

---

## Integration with CI/CD

Add to your GitHub Actions workflow:

```yaml
- name: Run test suite
  run: |
    pnpm run test:db-connection
    pnpm run test:table-structure
    pnpm run test:rls-policies
    pnpm run test:auth-setup
```

---

## Manual Testing After Tests Pass

After all tests pass, verify manually:

```bash
# Start development server
pnpm run dev

# In another terminal, test API endpoints
curl http://localhost:5000/api/health

# Test media upload
curl -X POST http://localhost:5000/api/media/upload \
  -F "files=@test-image.jpg" \
  -F "brandId=test-brand" \
  -F "category=images"
```

---

## Adding Custom Tests

To add a new test:

1. Create file: `scripts/test-feature-name.js`
2. Add npm script to `package.json`:
   ```json
   "test:feature-name": "node scripts/test-feature-name.js"
   ```
3. Use provided template from `scripts/README.md`

---

## Documentation References

- Full guide: [scripts/README.md](scripts/README.md)
- Deployment: [PRODUCTION_DEPLOYMENT_GUIDE.md](PRODUCTION_DEPLOYMENT_GUIDE.md)
- Database migration: [MIGRATION_GUIDE.md](/tmp/MIGRATION_GUIDE.md)
- Implementation: [PHASE_6_IMPLEMENTATION.md](PHASE_6_IMPLEMENTATION.md)
- Audit summary: [PROJECT_AUDIT_SUMMARY.md](PROJECT_AUDIT_SUMMARY.md)

---

## Support Commands

```bash
# View all test commands
npm run

# Get help on a specific test
cat scripts/README.md

# Check environment variables
echo $VITE_SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY

# Test database manually
psql postgresql://user:pass@db.supabase.co:5432/postgres
```

---

## Next Steps

1. ✅ Set up environment variables in `.env.local`
2. ✅ Run `pnpm run test:db-connection` to verify setup
3. ✅ Run full test suite before deployment
4. ✅ Address any failing tests following troubleshooting guide
5. ✅ Deploy to production with confidence!

---

**Created:** November 4, 2025
**Status:** Ready for use
**Maintenance:** Scripts are self-documenting and easy to extend
