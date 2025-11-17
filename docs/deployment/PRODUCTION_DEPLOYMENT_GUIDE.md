# Production Deployment Guide: Aligned AI Platform

**Version:** 1.0
**Last Updated:** November 4, 2025
**Platform Version:** Aligned AI with PHASE 6 Media Management

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Setup](#environment-setup)
3. [Database Migration](#database-migration)
4. [Deployment Steps](#deployment-steps)
5. [Post-Deployment Verification](#post-deployment-verification)
6. [Monitoring & Maintenance](#monitoring--maintenance)
7. [Rollback Procedures](#rollback-procedures)
8. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

### Code Quality & Compilation
- [ ] All TypeScript errors resolved (`pnpm run typecheck` passes cleanly)
- [ ] Project builds successfully (`pnpm run build` completes without errors)
- [ ] No critical security vulnerabilities in dependencies
- [ ] Code follows style guidelines (lint warnings reviewed)

### PHASE 6 Media Management System
- [ ] Media service fully implemented with AI tagging
- [ ] Database schema created with RLS policies
- [ ] API endpoints tested and validated
- [ ] Storage quota system configured
- [ ] Duplicate detection with SHA256 hashing functional

### Environment Variables Prepared
- [ ] `VITE_SUPABASE_URL` - Your Supabase project URL
- [ ] `SUPABASE_ANON_KEY` - Public Supabase API key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Private service role key
- [ ] `ANTHROPIC_API_KEY` - Claude API key for AI features
- [ ] `FRONTEND_URL` - Production frontend URL
- [ ] Database backup configured

### Infrastructure Ready
- [ ] Supabase project created and configured
- [ ] PostgreSQL database accessible
- [ ] Storage buckets created for media assets
- [ ] Authentication configured in Supabase
- [ ] Email service configured (if using Supabase Auth)

---

## Environment Setup

### 1. Create Production Environment File

Create `.env.production` in the project root:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# AI Services
ANTHROPIC_API_KEY=sk-ant-...

# Frontend Configuration
VITE_API_URL=https://api.yourdomain.com
FRONTEND_URL=https://yourdomain.com

# Storage Configuration
STORAGE_BUCKET_PREFIX=tenant-
STORAGE_MAX_FILE_SIZE=104857600  # 100MB

# Media Processing
MEDIA_VARIANT_SIZES=150,400,800,1200
MEDIA_JPEG_QUALITY=85
DEFAULT_STORAGE_QUOTA=5368709120  # 5GB

# Features
ENABLE_AI_TAGGING=true
ENABLE_DUPLICATE_DETECTION=true
ENABLE_METADATA_EXTRACTION=true

# Performance
API_TIMEOUT=30000
DATABASE_POOL_SIZE=20
REDIS_URL=redis://your-redis-server:6379

# Monitoring
SENTRY_DSN=https://...
LOG_LEVEL=info

# Security
NODE_ENV=production
```

### 2. Verify Dependencies

```bash
# Install all dependencies
pnpm install

# Verify sharp and multer are installed
pnpm list sharp multer typescript-eslint

# Install missing browser automation tools if needed
pnpm exec playwright install chromium --with-deps
```

### 3. Build Application

```bash
# Clean previous builds
rm -rf dist/

# Run full build
pnpm run build

# Verify build artifacts
ls -lah dist/

# Verify no build errors
pnpm run typecheck
```

---

## Database Migration

### Step 1: Backup Current Database

```bash
# Create backup using Supabase CLI
supabase db pull > backup-$(date +%Y%m%d).sql

# Or use pg_dump directly
pg_dump postgresql://user:password@db.supabase.co:5432/postgres > backup.sql
```

### Step 2: Execute PHASE 6 Migration

**Option A: Via Supabase Dashboard (Recommended for Production)**

1. Go to https://app.supabase.com
2. Select your project
3. Navigate to **SQL Editor**
4. Click **New Query**
5. Name it: `PHASE_6_Migration_$(date +%Y%m%d)`
6. Copy contents of `server/migrations/006_media_tables.sql`
7. Review the SQL (verify table names and constraints)
8. Click **Run** and wait for completion

**Option B: Via Supabase CLI**

```bash
# Link your project
supabase link --project-ref your-project-ref

# Push migration
supabase db push --file server/migrations/006_media_tables.sql

# Verify migration
supabase db pull
```

**Option C: Via psql**

```bash
# Get connection string from Supabase Settings → Database
psql "postgresql://postgres.[project]:password@db.[region].supabase.co:5432/postgres" < server/migrations/006_media_tables.sql
```

### Step 3: Verify Migration Success

```sql
-- Check tables created
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('media_assets', 'media_usage_logs', 'storage_quotas');

-- Check indexes
SELECT indexname, tablename FROM pg_indexes
WHERE tablename LIKE 'media_%' OR tablename = 'storage_quotas';

-- Check RLS policies
SELECT schemaname, tablename, policyname FROM pg_policies
WHERE tablename IN ('media_assets', 'media_usage_logs', 'storage_quotas');
```

### Step 4: Configure Storage Quotas

For each brand/tenant in your system:

```sql
INSERT INTO storage_quotas (brand_id, tenant_id, limit_bytes, warning_threshold_percent)
VALUES
  ('brand-id-1', 'tenant-id-1', 5368709120, 80),  -- 5GB default
  ('brand-id-2', 'tenant-id-2', 5368709120, 80);
```

### Step 5: Create Storage Buckets

In Supabase Dashboard → Storage:

1. Click **New Bucket**
2. Name: `tenant-{tenant_id}`
3. Set to **Private**
4. Enable RLS policies
5. Create for each tenant in your system

---

## Deployment Steps

### 1. Frontend Deployment (Vercel/Netlify Recommended)

**Via Vercel:**

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod --env-file .env.production

# Verify deployment
vercel ls
```

**Via Netlify:**

```bash
# Build locally first
pnpm run build

# Deploy
netlify deploy --prod --dir dist
```

### 2. Server Deployment (Node.js Hosting)

**Via DigitalOcean App Platform:**

1. Connect GitHub repository
2. Configure environment variables from `.env.production`
3. Set build command: `pnpm install && pnpm run build`
4. Set run command: `node server/index.js`
5. Deploy and monitor

**Via Heroku:**

```bash
# Add Heroku remote
heroku git:remote -a your-app-name

# Set environment variables
heroku config:set VITE_SUPABASE_URL=... --app your-app-name

# Deploy
git push heroku main
```

**Via Docker (Recommended for Production):**

Create `Dockerfile`:

```dockerfile
FROM node:20-slim

WORKDIR /app

# Install dependencies
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --prod

# Copy built files
COPY dist ./dist
COPY server ./server

# Set environment
ENV NODE_ENV=production

# Expose port
EXPOSE 5000

# Start server
CMD ["node", "server/index.js"]
```

Build and push:

```bash
docker build -t aligned-ai:latest .
docker push your-registry/aligned-ai:latest

# Deploy to container service (AWS ECS, Google Cloud Run, etc.)
```

### 3. Verify Server is Running

```bash
# Check health endpoint
curl https://api.yourdomain.com/api/health

# Expected response:
# {"status":"ok","timestamp":"2025-01-15T10:30:00Z"}
```

---

## Post-Deployment Verification

### 1. Test Core Functionality

```bash
# Test media upload endpoint
curl -X POST https://api.yourdomain.com/api/media/upload \
  -F "files=@test-image.jpg" \
  -F "brandId=test-brand-123" \
  -F "category=graphics" \
  -H "Authorization: Bearer $AUTH_TOKEN"

# Test list assets
curl https://api.yourdomain.com/api/media/list \
  -H "Authorization: Bearer $AUTH_TOKEN"

# Test storage quota
curl https://api.yourdomain.com/api/media/storage/brand-123 \
  -H "Authorization: Bearer $AUTH_TOKEN"
```

### 2. Verify Database Connectivity

```bash
# Connect to Supabase and run
SELECT current_user, current_database, version();

# Should return your Postgres user and database info
```

### 3. Test Authentication Flow

1. Visit frontend URL
2. Attempt login with test credentials
3. Verify JWT token returned
4. Verify RLS policies work by attempting cross-brand access

### 4. Monitor Initial Traffic

```bash
# View server logs
tail -f /var/log/aligned-ai.log

# Check for errors
grep -i error /var/log/aligned-ai.log | head -20

# Monitor database connections
SELECT pid, usename, client_addr FROM pg_stat_activity;
```

### 5. Performance Baseline

Test response times:

```bash
# Upload latency test
time curl -X POST https://api.yourdomain.com/api/media/upload \
  -F "files=@image.jpg" \
  -F "brandId=test" \
  -F "category=images"

# Expected: <5 seconds for typical image
# Should include: upload, variant generation, AI tagging, metadata extraction
```

---

## Monitoring & Maintenance

### 1. Application Monitoring

**Set up error tracking (Sentry):**

```bash
# Install Sentry in server/index.ts
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

**Monitor key metrics:**

- API response times
- Database query performance
- Storage quota usage
- Failed uploads / AI tagging failures
- Authentication errors
- RLS policy violations

### 2. Database Maintenance

**Weekly:**
```sql
-- Check database size
SELECT pg_database.datname,
  pg_size_pretty(pg_database_size(pg_database.datname)) AS size
FROM pg_database WHERE datname = 'postgres';

-- Check table sizes
SELECT schemaname, tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

**Monthly:**
```sql
-- Rebuild indexes for optimization
REINDEX INDEX idx_media_assets_brand_id;
REINDEX INDEX idx_media_assets_created_at;
REINDEX INDEX idx_media_assets_ai_tags;

-- Vacuum and analyze
VACUUM ANALYZE media_assets;
VACUUM ANALYZE media_usage_logs;
VACUUM ANALYZE storage_quotas;
```

**Quarterly:**
```bash
# Full database backup
pg_dump postgresql://user:pass@db.co/postgres | gzip > backup-$(date +%Y%m%d).sql.gz

# Verify backup
file backup-*.sql.gz
```

### 3. Storage Quota Management

**Monitor storage usage:**

```bash
# Check total storage per brand
curl https://api.yourdomain.com/api/media/storage/brand-123 \
  -H "Authorization: Bearer $TOKEN"

# Expected response:
# {
#   "brand_id": "brand-123",
#   "total": 2147483648,
#   "limit": 5368709120,
#   "percentUsed": 40,
#   "status": "ok",
#   "categories": {
#     "images": 1073741824,
#     "videos": 1073741824,
#     "graphics": 0
#   }
# }
```

**Alert thresholds:**

- **Warning:** >80% quota usage
- **Critical:** >95% quota usage
- **Action:** Implement storage cleanup policy

### 4. SSL/HTTPS Maintenance

```bash
# Check certificate expiration (Let's Encrypt)
echo | openssl s_client -servername api.yourdomain.com \
  -connect api.yourdomain.com:443 2>/dev/null | openssl x509 -noout -dates

# Should show dates 3+ months away
# Set up auto-renewal before expiration
```

### 5. Dependency Security Updates

```bash
# Check for vulnerabilities
pnpm audit

# Update dependencies safely
pnpm update --interactive

# For critical security updates
pnpm install @package-name@latest
```

---

## Rollback Procedures

### Scenario 1: Code Rollback

If a deployment causes critical issues:

```bash
# Option A: Revert to previous commit
git revert HEAD
git push origin main

# Option B: Deploy previous tag
git checkout v1.0.0
pnpm run build
# Deploy previous version

# Option C: Switch traffic back to previous version
# (If using blue-green deployment)
vercel rollback
```

### Scenario 2: Database Rollback

If migration causes data corruption:

```bash
# Stop application immediately
systemctl stop aligned-ai

# Restore from backup
psql postgresql://user:pass@db.co/postgres < backup-20250104.sql

# Verify restoration
SELECT COUNT(*) FROM media_assets;

# Restart application
systemctl start aligned-ai
```

### Scenario 3: Partial Rollback

If only specific tables are affected:

```sql
-- Drop problematic tables
DROP TABLE IF EXISTS media_assets CASCADE;
DROP TABLE IF EXISTS media_usage_logs CASCADE;
DROP TABLE IF EXISTS storage_quotas CASCADE;

-- Re-run migration from backup
-- Or restore from point-in-time backup
```

### Communication Plan

- [ ] Notify users of planned downtime (24 hours notice)
- [ ] Post status on status page
- [ ] Document incident and resolution
- [ ] Post-incident review with team

---

## Troubleshooting

### Issue 1: "RLS Policy Violation" Errors

**Symptoms:** Users can't access their media assets

**Solution:**

```sql
-- Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables WHERE tablename = 'media_assets';

-- Check policy coverage
SELECT policyname, permissive, qual
FROM pg_policies WHERE tablename = 'media_assets';

-- Verify auth.uid() is available
SELECT auth.uid();

-- Check user brand assignments
SELECT * FROM brand_users WHERE user_id = auth.uid();
```

### Issue 2: Media Upload Fails with "Storage Quota Exceeded"

**Symptoms:** Uploads rejected with quota error

**Solution:**

```bash
# Check actual quota
curl https://api.yourdomain.com/api/media/storage/brand-123 \
  -H "Authorization: Bearer $TOKEN"

# Increase quota if needed
curl -X POST https://api.yourdomain.com/api/admin/quotas/brand-123 \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"limit_bytes": 10737418240}'  # 10GB
```

### Issue 3: AI Tagging Fails / Timeout

**Symptoms:** Upload succeeds but no AI tags generated

**Solution:**

```bash
# Check ANTHROPIC_API_KEY is set
echo $ANTHROPIC_API_KEY

# Test API connectivity
curl -X POST https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -d '{...}'

# Check rate limits
# Claude API: 10 req/min for free tier

# Retry upload
```

### Issue 4: Database Connection Pooling Issues

**Symptoms:** "Too many connections" errors after some traffic

**Solution:**

```bash
# Increase connection pool in .env
DATABASE_POOL_SIZE=30

# Check current connections
SELECT count(*) FROM pg_stat_activity;

# Kill idle connections
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle' AND state_change < now() - interval '1 hour';

# Restart application
systemctl restart aligned-ai
```

### Issue 5: Variant Generation Too Slow

**Symptoms:** Upload takes >5 seconds

**Solution:**

```bash
# Check image size (>5MB takes longer)
# Consider reducing MEDIA_JPEG_QUALITY (default 85)
MEDIA_JPEG_QUALITY=75

# Use async processing
# Queue variants for background processing
# Return success immediately, send variants separately

# Optimize variant sizes
MEDIA_VARIANT_SIZES=100,300,600,1000  # Smaller sizes = faster
```

### Issue 6: Permission Denied Creating Storage Buckets

**Symptoms:** Bucket creation fails in code

**Solution:**

```bash
# Use Supabase Dashboard to create buckets manually
# Or use service role key (has full permissions)

# Verify key permissions
curl -X GET https://your-project.supabase.co/rest/v1/ \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY"
```

---

## Support & Contact

- **Documentation:** See [PHASE_6_IMPLEMENTATION.md](./PHASE_6_IMPLEMENTATION.md)
- **API Reference:** See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)
- **Issues:** Report via GitHub Issues
- **Security:** Email security@yourdomain.com for vulnerabilities

---

## Deployment Checklist Summary

```
BEFORE DEPLOYMENT:
  ☐ All tests passing
  ☐ No TypeScript errors
  ☐ Build completes successfully
  ☐ Code reviewed and approved
  ☐ Environment variables verified
  ☐ Database backup created
  ☐ Maintenance window scheduled

DURING DEPLOYMENT:
  ☐ Notify users of maintenance
  ☐ Execute migration
  ☐ Deploy frontend
  ☐ Deploy backend
  ☐ Verify health endpoints
  ☐ Monitor error logs

AFTER DEPLOYMENT:
  ☐ Verify all endpoints responding
  ☐ Test core functionality
  ☐ Check database performance
  ☐ Review error logs
  ☐ Monitor metrics
  ☐ Communicate deployment complete
  ☐ Schedule post-incident review if issues occurred
```

---

**End of Production Deployment Guide**
