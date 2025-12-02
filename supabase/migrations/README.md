# Supabase Database Migrations

This directory contains versioned SQL migrations that define the complete database schema for the POSTD platform.

## Migration Files

| # | File | Purpose | 
|---|------|---------|
| 001 | `001_auth_and_users.sql` | Authentication & user profiles |
| 002 | `002_brands_and_agencies.sql` | Multi-tenant brand structure |
| 003 | `003_content_and_posts.sql` | Content management |
| 004 | `004_analytics_and_metrics.sql` | Analytics tracking |
| 005 | `005_integrations.sql` | Platform integrations |
| 006 | `006_approvals_and_workflows.sql` | Approval workflows |
| 007 | `007_client_portal_and_audit.sql` | Client portal & audit |
| 008 | `008_indexes_and_views.sql` | Performance optimization |

## Applying Migrations

### Supabase Dashboard
1. Navigate to SQL Editor
2. Copy and paste each migration file in order
3. Execute the SQL script

### Supabase CLI
```bash
supabase link --project-ref your-project-ref
supabase db push
```

### Local Development
```bash
supabase start
supabase db reset
```

### Using psql
```bash
psql "postgresql://[user]:[password]@[host]:5432/[database]" -f 001_auth_and_users.sql
# Repeat for each migration in order
```

## Database Architecture

### Multi-Tenancy
- **Brands**: Agencies or sub-brands (self-referential)
- **Brand Members**: Role-based access control
- **Row Level Security**: Brand isolation enforced at database level

### Key Tables

**Authentication**
- user_profiles, user_preferences

**Multi-Tenant**
- brands, brand_members, brand_assets, white_label_configs

**Content**
- content, posts, post_approvals

**Analytics**
- analytics_data, analytics_metrics, sync_events, analytics_sync_logs

**Integrations**
- platform_connections, integration_events, webhook_logs

**Workflows**
- approval_requests, approval_threads, workflow_templates, workflow_instances

**Client Portal**
- client_settings, client_comments, client_media, audit_logs, notifications

## Role-Based Access Control

| Role | Permissions |
|------|-------------|
| Owner | All + manage members |
| Admin | Create, edit, approve, integrate |
| Editor | Create, edit, request approval |
| Viewer | Read only |

## Performance Features

### Composite Indexes
Optimized for common query patterns on:
- Content filtering by brand/status/date
- Analytics queries by brand/date/platform
- Brand member lookups by role

### Useful Views
- v_brand_analytics_summary
- v_pending_approvals
- v_content_publishing_status
- v_user_activity
- v_sync_health
- v_workflow_completion_rate
- v_client_portal_activity
- mv_daily_analytics_summary (materialized)

### Automatic Triggers
All tables update `updated_at` timestamp automatically.

## Security

### Row Level Security (RLS)
All tables enforce RLS policies that:
- Check user membership in brand via brand_members table
- Restrict data access to brands user is member of
- Enforce role-based permissions

### Token Management
Platform connections securely store:
- OAuth access tokens
- Optional refresh tokens
- Token expiration tracking

## Backup & Recovery

### Automated Backups
Enable in Supabase Dashboard → Project Settings → Database

### Manual Backup
```bash
pg_dump "postgresql://[user]:[password]@[host]:5432/[database]" > backup.sql
```

## Troubleshooting

### RLS Policy Errors
- Verify user is authenticated (auth.uid() returns value)
- Check user has brand_members entry
- Test policy in SQL editor

### Foreign Key Constraint Error
- Ensure migrations applied in order
- Verify all referenced tables exist

### Performance Issues
- Run ANALYZE to update statistics
- Check index usage with EXPLAIN ANALYZE
- Refresh materialized views if stale

## Adding New Migrations

1. Create file: `0XX_description.sql`
2. Include RLS policies
3. Add indexes
4. Test with `supabase db reset`
5. Update this README

## Related Documentation

- Supabase: https://supabase.com/docs
- PostgreSQL: https://www.postgresql.org/docs/
- Row Level Security: https://supabase.com/docs/guides/auth/row-level-security
