-- API Health Dashboard Views
-- Creates views for visualizing connector health, performance, and errors

-- ============================================================================
-- 1. Connector Health Summary
-- Shows overall health status of all connectors per tenant
-- ============================================================================

CREATE OR REPLACE VIEW api_connector_health_summary AS
SELECT
  c.tenant_id,
  cp.platform_name,
  COUNT(c.id) as total_connections,
  COUNT(CASE WHEN c.health_status = 'healthy' THEN 1 END) as healthy_count,
  COUNT(CASE WHEN c.health_status = 'warning' THEN 1 END) as warning_count,
  COUNT(CASE WHEN c.health_status = 'critical' THEN 1 END) as critical_count,
  ROUND(100.0 * COUNT(CASE WHEN c.health_status = 'healthy' THEN 1 END) / NULLIF(COUNT(*), 0), 2) as health_percentage,
  AVG(EXTRACT(EPOCH FROM (NOW() - c.last_health_check))) as avg_check_age_seconds,
  MAX(c.last_health_check) as last_check_time,
  COUNT(CASE WHEN c.token_expires_at < NOW() + INTERVAL '24 hours' THEN 1 END) as tokens_expiring_soon
FROM connections c
JOIN connector_platforms cp ON c.platform_id = cp.id
GROUP BY c.tenant_id, cp.platform_name;

-- ============================================================================
-- 2. Recent API Errors
-- Shows recent errors grouped by platform and error type
-- ============================================================================

CREATE OR REPLACE VIEW api_recent_errors AS
SELECT
  pje.created_at,
  c.tenant_id,
  cp.platform_name,
  pje.error_code,
  pje.is_retryable,
  COUNT(*) as error_count,
  MAX(pje.error_message) as latest_error_message
FROM publish_job_errors pje
JOIN publish_jobs pj ON pje.publish_job_id = pj.id
JOIN connections c ON pj.connection_id = c.id
JOIN connector_platforms cp ON c.platform_id = cp.id
WHERE pje.created_at > NOW() - INTERVAL '24 hours'
GROUP BY
  DATE_TRUNC('hour', pje.created_at),
  c.tenant_id,
  cp.platform_name,
  pje.error_code,
  pje.is_retryable
ORDER BY pje.created_at DESC;

-- ============================================================================
-- 3. Token Health Status
-- Shows token expiration status for all connections
-- ============================================================================

CREATE OR REPLACE VIEW api_token_health AS
SELECT
  c.id as connection_id,
  c.tenant_id,
  cp.platform_name,
  c.display_name,
  c.token_expires_at,
  NOW() as current_time,
  EXTRACT(EPOCH FROM (c.token_expires_at - NOW())) / 3600 as hours_until_expiry,
  CASE
    WHEN c.token_expires_at IS NULL THEN 'no_expiry'
    WHEN c.token_expires_at < NOW() THEN 'expired'
    WHEN c.token_expires_at < NOW() + INTERVAL '1 day' THEN 'expiring_soon'
    WHEN c.token_expires_at < NOW() + INTERVAL '7 days' THEN 'expiring_week'
    ELSE 'healthy'
  END as token_status,
  c.last_token_refresh
FROM connections c
JOIN connector_platforms cp ON c.platform_id = cp.id
WHERE c.status = 'active'
ORDER BY c.token_expires_at ASC NULLS LAST;

-- ============================================================================
-- 4. Publishing Performance Metrics
-- Shows p95 latency, success rate, and throughput per platform
-- ============================================================================

CREATE OR REPLACE VIEW api_publish_performance AS
SELECT
  c.tenant_id,
  cp.platform_name,
  COUNT(pj.id) as total_jobs,
  COUNT(CASE WHEN pj.status = 'published' THEN 1 END) as published_count,
  COUNT(CASE WHEN pj.status = 'failed' THEN 1 END) as failed_count,
  COUNT(CASE WHEN pj.status = 'dlq' THEN 1 END) as dlq_count,
  ROUND(100.0 * COUNT(CASE WHEN pj.status = 'published' THEN 1 END) / NULLIF(COUNT(*), 0), 2) as success_rate,
  MAX(EXTRACT(EPOCH FROM (pj.updated_at - pj.created_at))) * 1000 as max_latency_ms,
  MIN(EXTRACT(EPOCH FROM (pj.updated_at - pj.created_at))) * 1000 as min_latency_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (pj.updated_at - pj.created_at))) * 1000 as p95_latency_ms,
  NOW() - MAX(pj.created_at) as time_since_last_publish
FROM connections c
JOIN connector_platforms cp ON c.platform_id = cp.id
LEFT JOIN publish_jobs pj ON c.id = pj.connection_id
WHERE pj.created_at > NOW() - INTERVAL '24 hours'
GROUP BY c.tenant_id, cp.platform_name;

-- ============================================================================
-- 5. Dead Letter Queue Status
-- Shows jobs stuck in DLQ with their reasons
-- ============================================================================

CREATE OR REPLACE VIEW api_dlq_status AS
SELECT
  pj.id,
  pj.tenant_id,
  cp.platform_name,
  pj.dlq_reason,
  pj.dlq_at,
  NOW() - pj.dlq_at as time_in_dlq,
  pj.attempt_count,
  pj.last_error_code,
  pj.last_error_message,
  pj.created_at,
  AGE(NOW(), pj.created_at) as job_age
FROM publish_jobs pj
JOIN connections c ON pj.connection_id = c.id
JOIN connector_platforms cp ON c.platform_id = cp.id
WHERE pj.status = 'dlq'
ORDER BY pj.dlq_at DESC;

-- ============================================================================
-- 6. Health Check Latency Trends
-- Shows health check latency over time for performance tracking
-- ============================================================================

CREATE OR REPLACE VIEW api_health_check_trends AS
SELECT
  c.tenant_id,
  cp.platform_name,
  DATE_TRUNC('hour', chl.created_at) as check_hour,
  COUNT(*) as check_count,
  AVG(chl.latency_ms) as avg_latency_ms,
  MAX(chl.latency_ms) as max_latency_ms,
  MIN(chl.latency_ms) as min_latency_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY chl.latency_ms) as p95_latency_ms,
  COUNT(CASE WHEN chl.status = 'healthy' THEN 1 END) as healthy_checks,
  COUNT(CASE WHEN chl.status = 'warning' THEN 1 END) as warning_checks,
  COUNT(CASE WHEN chl.status = 'critical' THEN 1 END) as critical_checks
FROM connection_health_log chl
JOIN connections c ON chl.connection_id = c.id
JOIN connector_platforms cp ON c.platform_id = cp.id
WHERE chl.created_at > NOW() - INTERVAL '7 days'
GROUP BY
  c.tenant_id,
  cp.platform_name,
  DATE_TRUNC('hour', chl.created_at)
ORDER BY check_hour DESC;

-- ============================================================================
-- 7. Connector Readiness Status
-- Shows which connectors are ready for production per tenant
-- ============================================================================

CREATE OR REPLACE VIEW api_connector_readiness AS
SELECT
  c.tenant_id,
  cp.platform_name,
  COUNT(c.id) as active_connections,
  COUNT(CASE WHEN c.health_status = 'healthy' THEN 1 END) as healthy_connections,
  COUNT(CASE WHEN c.status = 'attention' THEN 1 END) as connections_needing_attention,
  CASE
    WHEN COUNT(c.id) = 0 THEN 'not_configured'
    WHEN COUNT(CASE WHEN c.status = 'attention' THEN 1 END) > 0 THEN 'needs_attention'
    WHEN ROUND(100.0 * COUNT(CASE WHEN c.health_status = 'healthy' THEN 1 END) / COUNT(*), 2) < 80 THEN 'degraded'
    ELSE 'production_ready'
  END as readiness_status,
  MAX(c.last_health_check) as last_health_check,
  COUNT(CASE WHEN c.token_expires_at < NOW() + INTERVAL '7 days' AND c.token_expires_at IS NOT NULL THEN 1 END) as tokens_expiring_this_week
FROM connector_platforms cp
LEFT JOIN connections c ON cp.id = c.platform_id
WHERE cp.is_enabled = true
GROUP BY c.tenant_id, cp.platform_name;

-- ============================================================================
-- 8. API Analytics Summary
-- Shows publishing volume and engagement metrics per platform
-- ============================================================================

CREATE OR REPLACE VIEW api_analytics_summary AS
SELECT
  c.tenant_id,
  cp.platform_name,
  COUNT(DISTINCT pj.id) as total_posts,
  COUNT(DISTINCT c.id) as active_accounts,
  SUM(COALESCE(pja.views, 0)) as total_views,
  SUM(COALESCE(pja.likes, 0)) as total_likes,
  SUM(COALESCE(pja.comments, 0)) as total_comments,
  SUM(COALESCE(pja.shares, 0)) as total_shares,
  ROUND(AVG(COALESCE(pja.engagement_rate, 0)), 2) as avg_engagement_rate,
  MAX(pj.publish_at) as last_post_time,
  COUNT(CASE WHEN pj.publish_at > NOW() - INTERVAL '24 hours' THEN 1 END) as posts_in_last_24h
FROM connections c
JOIN connector_platforms cp ON c.platform_id = cp.id
LEFT JOIN publish_jobs pj ON c.id = pj.connection_id AND pj.status = 'published'
LEFT JOIN publish_job_analytics pja ON pj.id = pja.publish_job_id
GROUP BY c.tenant_id, cp.platform_name;

-- ============================================================================
-- Grant permissions
-- ============================================================================

GRANT SELECT ON api_connector_health_summary TO authenticated;
GRANT SELECT ON api_recent_errors TO authenticated;
GRANT SELECT ON api_token_health TO authenticated;
GRANT SELECT ON api_publish_performance TO authenticated;
GRANT SELECT ON api_dlq_status TO authenticated;
GRANT SELECT ON api_health_check_trends TO authenticated;
GRANT SELECT ON api_connector_readiness TO authenticated;
GRANT SELECT ON api_analytics_summary TO authenticated;

-- ============================================================================
-- Indexes for performance
-- ============================================================================

CREATE INDEX idx_connection_health_log_created ON connection_health_log(created_at DESC);
CREATE INDEX idx_publish_job_errors_created ON publish_job_errors(created_at DESC);
CREATE INDEX idx_publish_jobs_publish_at ON publish_jobs(publish_at DESC) WHERE status = 'published';
CREATE INDEX idx_publish_job_analytics_snapshot ON publish_job_analytics(snapshot_date DESC);

-- ============================================================================
-- Done - All health dashboard views created
-- ============================================================================

-- To query these views from Supabase:
-- SELECT * FROM api_connector_health_summary WHERE tenant_id = 'your-tenant-id';
-- SELECT * FROM api_recent_errors WHERE tenant_id = 'your-tenant-id';
-- SELECT * FROM api_token_health WHERE tenant_id = 'your-tenant-id';
-- SELECT * FROM api_connector_readiness WHERE tenant_id = 'your-tenant-id';
