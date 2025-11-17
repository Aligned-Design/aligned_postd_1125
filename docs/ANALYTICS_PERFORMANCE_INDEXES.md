# Analytics Performance Indexes

## Recommended Database Indexes

To optimize analytics query performance, the following indexes should be created in Supabase:

### 1. Analytics Metrics Table

```sql
-- Primary lookup: brand_id + date range
CREATE INDEX IF NOT EXISTS idx_analytics_metrics_brand_date 
ON analytics_metrics(brand_id, date DESC);

-- Platform-specific queries
CREATE INDEX IF NOT EXISTS idx_analytics_metrics_brand_platform_date 
ON analytics_metrics(brand_id, platform, date DESC);

-- Post-specific lookups
CREATE INDEX IF NOT EXISTS idx_analytics_metrics_post_id 
ON analytics_metrics(post_id) WHERE post_id IS NOT NULL;

-- Composite for summary queries
CREATE INDEX IF NOT EXISTS idx_analytics_metrics_brand_platform 
ON analytics_metrics(brand_id, platform) 
INCLUDE (date, metrics);
```

### 2. Scheduled Content Table (for search and analytics)

```sql
-- Brand + status for approval queries
CREATE INDEX IF NOT EXISTS idx_scheduled_content_brand_status 
ON scheduled_content(brand_id, status, updated_at DESC);

-- Platform filtering
CREATE INDEX IF NOT EXISTS idx_scheduled_content_brand_platform 
ON scheduled_content(brand_id, platform, scheduled_for DESC);

-- Full-text search on headline/body
CREATE INDEX IF NOT EXISTS idx_scheduled_content_search 
ON scheduled_content USING gin(to_tsvector('english', coalesce(headline, '') || ' ' || coalesce(body, '')));
```

### 3. Social Posts Table

```sql
-- Brand + platform for filtering
CREATE INDEX IF NOT EXISTS idx_social_posts_brand_platform 
ON social_posts(brand_id, platform, created_at DESC);

-- Status filtering
CREATE INDEX IF NOT EXISTS idx_social_posts_brand_status 
ON social_posts(brand_id, status, created_at DESC);
```

### 4. Media Assets Table

```sql
-- Already exists: idx_media_assets_brand_id
-- Already exists: idx_media_assets_category
-- Already exists: idx_media_assets_ai_tags (GIN index)

-- Add search optimization
CREATE INDEX IF NOT EXISTS idx_media_assets_filename_search 
ON media_assets USING gin(to_tsvector('english', filename));
```

### 5. Analytics Sync Logs

```sql
-- Track sync status efficiently
CREATE INDEX IF NOT EXISTS idx_analytics_sync_logs_brand_platform 
ON analytics_sync_logs(brand_id, platform, started_at DESC);

-- Status filtering
CREATE INDEX IF NOT EXISTS idx_analytics_sync_logs_status 
ON analytics_sync_logs(status, started_at DESC) 
WHERE status IN ('completed', 'failed');
```

## Query Optimization Notes

1. **Date Range Queries**: Always use indexed date columns with `>=` and `<=` for range queries
2. **Limit Results**: Use `.limit()` early in queries to reduce data transfer
3. **Select Specific Columns**: Only select needed columns, not `*`
4. **Cache Aggregations**: Summary metrics are cached for 5 minutes
5. **Batch Operations**: Use `Promise.all()` for parallel queries when possible

## Monitoring

Monitor query performance using:
- Supabase Dashboard → Database → Query Performance
- Look for queries taking > 500ms
- Check index usage with `EXPLAIN ANALYZE`

## Cache Invalidation

Cache is automatically invalidated when:
- Analytics sync completes (`syncPlatformData` endpoint)
- Manual cache clear via `analyticsCache.clear()`
- TTL expiration (5 min for summaries, 15 min for insights)

