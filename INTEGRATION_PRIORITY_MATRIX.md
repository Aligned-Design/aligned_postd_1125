# 🎯 Integration Prioritization Matrix & Implementation Checklists

**Date**: November 11, 2025
**Purpose**: Visualize ROI vs. effort; identify quick wins and high-impact integrations
**Version**: 1.0

---

## QUICK REFERENCE: Priority Summary

```
TIER 1 (MVP - Ship Now)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 Meta (FB + IG):         Score 8.3 | 4-6w effort | 70% user demand
🔴 LinkedIn:               Score 8.2 | 3-4w effort | B2B essential
🟡 TikTok:                 Score 7.8 | 4-6w effort | Rising demand
🟡 Google Business Profile: Score 8.1 | 2-3w effort | Local brands
🟢 Mailchimp:              Score 7.7 | 1-2w effort | Email follow-ups

TIER 2 (Growth - Phases 2-3)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🟢 Canva:                  Score 8.1 | 2-3w effort | Design + templates
🔴 Shopify:                Score 8.2 | 3-5w effort | Product tagging + CTAs
🔴 YouTube/Shorts:         Score 7.8 | 3-4w effort | Video powerhouse
🟡 GA4:                    Score 7.9 | 2-3w effort | Performance tracking
🟡 Cloudinary:             Score 7.8 | 2-3w effort | Image transforms
🟡 Pinterest:              Score 7.6 | 3-4w effort | Visual brands
🟢 Slack:                  Score 7.6 | 1-2w effort | Notifications
🟡 Airtable:               Score 7.7 | 2-3w effort | Content calendar

TIER 3 (Roadmap - Monitor / Defer)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚫ Reddit:                 Score 6.3 | Defer Q4
⚫ Threads:                Score 5.4 | Monitor Q1 2026
⚫ HubSpot CRM:            Score 7.0 | Enterprise phase
⚫ Salesforce:             Score 6.2 | Enterprise phase
(And others with lower ROI)
```

---

## SECTION 1: IMPACT vs. EFFORT SCATTER

```
                          EFFORT (Weeks)
                  1-2w        2-3w        3-4w        4-6w
         ┌─────────────┬─────────────┬─────────────┬─────────────┐
HIGH     │  🟢 Slack   │  🟢 Canva   │  🔴 YouTube │  🔴 Meta    │
IMPACT   │  🟢 Mailch. │  🟡 Cloudry │  🟡 LI Ads  │  🔴 TikTok  │
(Score   │             │  🟡 GA4     │  🟡 Pinterest   │  🟡 GBP    │
 8+)     │             │  🟡 Airtbl  │  🔴 Shopify │             │
         ├─────────────┼─────────────┼─────────────┼─────────────┤
MEDIUM   │             │             │  🟡 Reddit  │  ⚫ Salesfrce│
IMPACT   │             │             │             │  ⚫ HubSpot  │
(Score   │             │             │             │             │
 6-7)    │             │             │             │             │
         └─────────────┴─────────────┴─────────────┴─────────────┘

LEGEND:
🔴 Must-have (TIER 1)
🟡 Strong candidate (TIER 2)
🟢 Quick win (low effort)
⚫ Defer / Roadmap
```

---

## SECTION 2: DETAILED SCORING BREAKDOWN

### TIER 1: Must-Have Foundations

#### 🔴 Meta (Facebook + Instagram)
```
Metric              Score   Rationale
────────────────────────────────────────────────────────────
User Demand         10/10   70% of agencies + SMBs use it
Differentiation     9/10    Core social platform; AI integrations unique
Maintenance         7/10    Good API docs; quarterly breaking changes
Speed-to-Value      6/10    OAuth + Graph API complex; 4-6w
────────────────────────────────────────────────────────────
FINAL SCORE         8.3/10
────────────────────────────────────────────────────────────

Implementation Checklist:
 □ OAuth flow (App Login → access token → accounts)
 □ Account fetching (Pages, IG Business accounts)
 □ Post creation (Feed, Stories, Reels, Carousels)
 □ Token refresh (manual + auto-refresh queue)
 □ Webhook handling (app deauthorized, permissions_change)
 □ Synthetic health checks (weekly)
 □ Error recovery (401/403 → reconnect flow)
 □ Product tagging (IG Shopping)
 □ Analytics (post insights, engagement metrics)
 □ Rate limit handling (450/3600 bucket)
 □ Tests (10+ scenarios)

Known Gotchas:
 • Requires Business Account (not personal)
 • Rate limits are bucket-based (not per-endpoint)
 • Reels do not support product tags via API (yet)
 • Stories and Ads Manager not accessible to third-party apps
```

#### 🔴 LinkedIn
```
Metric              Score   Rationale
────────────────────────────────────────────────────────────
User Demand         9/10    B2B essential; high engagement
Differentiation     8/10    Advisor AI can read posts + analyze tone
Maintenance         8/10    Stable API; good versioning
Speed-to-Value      7/10    Straightforward OAuth; 3-4w
────────────────────────────────────────────────────────────
FINAL SCORE         8.2/10
────────────────────────────────────────────────────────────

Implementation Checklist:
 □ OAuth (sign-in-with-linkedin flow)
 □ Fetch org + personal accounts
 □ Post creation (articles, updates)
 □ Scheduled publishing
 □ Token refresh (valid 60 days)
 □ Webhook (account or org changes)
 □ Analytics (post stats, engagement)
 □ Error handling (401 → reconnect)
 □ Tests

Known Gotchas:
 • No trending audio support
 • Article posting requires ugc_post permission
 • Scheduled posts have date restrictions (future only)
 • Rate limits: 100 POST calls / 600s per access token
```

#### 🟡 TikTok
```
Metric              Score   Rationale
────────────────────────────────────────────────────────────
User Demand         9/10    Viral platform; growing agency demand
Differentiation     8/10    Video + trending audio = unique angle
Maintenance         6/10    Frequent API changes; sandbox limitations
Speed-to-Value      5/10    Complex upload flow; 4-6w
────────────────────────────────────────────────────────────
FINAL SCORE         7.8/10
────────────────────────────────────────────────────────────

Implementation Checklist:
 □ OAuth (auth code → access token)
 □ User account fetch
 □ Video upload (chunked) to /video/upload
 □ Video publish (with metadata, hashtags)
 □ Scheduled publishing (if available)
 □ Token refresh (valid 1 year, but refresh early)
 □ Analytics (video stats, engagement)
 □ Error handling
 □ Tests (sandbox only; real account needed)

Known Gotchas:
 • Sandbox has severe limitations; real account testing difficult
 • Video upload is a separate API (not Graph-based)
 • Chunked upload requires exponential backoff
 • Trending audio: CML (Commercial Music Library) has restricted access
 • Rate limits: 100 calls / 5 min
 • No hashtag API (must be in caption)
```

#### 🟡 Google Business Profile
```
Metric              Score   Rationale
────────────────────────────────────────────────────────────
User Demand         8/10    Local + retail brands; reviews matter
Differentiation     7/10    GBP + review response = local authority
Maintenance         9/10    Stable; minimal breaking changes
Speed-to-Value      8/10    Straightforward API; 2-3w
────────────────────────────────────────────────────────────
FINAL SCORE         8.1/10
────────────────────────────────────────────────────────────

Implementation Checklist:
 □ OAuth (Google Sign-In)
 □ Location account fetch
 □ Post creation (event, offer, product, post types)
 □ Review reading + responding
 □ Photos upload
 □ Token refresh
 □ Analytics (views, actions)
 □ Error handling
 □ Tests

Known Gotchas:
 • Requires Business Profile verification
 • Limited to 1 location per account (multi-location = multiple OAuth)
 • Post scheduling limited to 30 days
 • Rate limits: 10 QPS per user
```

#### 🟢 Mailchimp
```
Metric              Score   Rationale
────────────────────────────────────────────────────────────
User Demand         7/10    Email follow-ups; CTA clicks
Differentiation     8/10    Social → email nurture pipeline
Maintenance         9/10    REST API; stable; good docs
Speed-to-Value      7/10    OAuth simple; 1-2w
────────────────────────────────────────────────────────────
FINAL SCORE         7.7/10
────────────────────────────────────────────────────────────

Implementation Checklist:
 □ OAuth (authorize → access token)
 □ Audience (list) fetch
 □ Newsletter send (to list)
 □ Template creation
 □ Merge tags (name, platform, content title)
 □ Unsubscribe handling
 □ Webhook (bounce, unsubscribe, complaint)
 □ Error handling
 □ Tests

Known Gotchas:
 • Rate limits: 10 requests / second
 • Audiences require name + email minimum
 • Personalization via merge tags (not dynamic rendering)
 • No scheduling; publishes immediately
```

---

### TIER 2: High-Impact Growth

#### 🟢 Canva
```
Metric              Score   Rationale
────────────────────────────────────────────────────────────
User Demand         7/10    Designers love it; brand templates
Differentiation     9/10    AI + Canva templates = huge UX win
Maintenance         9/10    Stable API; predictable versioning
Speed-to-Value      8/10    Import → preview → queue; 2-3w
────────────────────────────────────────────────────────────
FINAL SCORE         8.1/10
────────────────────────────────────────────────────────────

Implementation Checklist:
 □ OAuth (brand verification)
 □ Team templates fetch
 □ Brand colors + fonts sync
 □ Export designs to Library
 □ Publish hooks (when design saved → queue for posting)
 □ Error handling
 □ Tests

Known Gotchas:
 • Brand verification required
 • Export formats: PNG, PDF, etc. (vary by plan)
 • API rate limits: 50 requests / minute
 • No real-time collab via API
```

#### 🔴 Shopify
```
Metric              Score   Rationale
────────────────────────────────────────────────────────────
User Demand         8/10    E-comm brands; product CTAs critical
Differentiation     9/10    Social posting + product tagging = conversion
Maintenance         9/10    REST + GraphQL; very stable
Speed-to-Value      6/10    Product sync complex; 3-5w
────────────────────────────────────────────────────────────
FINAL SCORE         8.2/10
────────────────────────────────────────────────────────────

Implementation Checklist:
 □ OAuth (app installation → API token)
 □ Product fetch (collections, variants, pricing)
 □ Inventory sync
 □ Build product catalog for tagging
 □ Post creation with product tags
 □ Link generation (UTM, discount codes)
 □ Order / sales conversion tracking
 □ Error handling
 □ Tests

Known Gotchas:
 • Rate limits: 2 req/s for custom apps
 • GraphQL vs REST (choose based on query complexity)
 • Product data is large (pagination required)
 • Variant pricing varies by market
 • Discount code generation requires separate permissions
```

#### 🔴 YouTube / Shorts
```
Metric              Score   Rationale
────────────────────────────────────────────────────────────
User Demand         8/10    Video is king; Shorts growing fast
Differentiation     8/10    Long-form + Shorts from one platform
Maintenance         8/10    Google API; well-documented
Speed-to-Value      6/10    Upload + metadata complex; 3-4w
────────────────────────────────────────────────────────────
FINAL SCORE         7.8/10
────────────────────────────────────────────────────────────

Implementation Checklist:
 □ OAuth (YouTube Data API v3)
 □ Channel fetch
 □ Video upload (resumable upload)
 □ Metadata (title, description, tags, thumbnail)
 □ Playlist management
 □ Scheduled publishing
 □ Analytics (views, engagement, revenue)
 □ Shorts-specific handling
 □ Error handling
 □ Tests

Known Gotchas:
 • Resumable upload required for large files
 • Rate limits: 10,000 quota / 24h (not per-request)
 • Shorts requires minimum length + aspect ratio
 • Copyright detection (Content ID) blocks some uploads
 • Analytics delayed 24-48h
```

---

## SECTION 3: Implementation Sequencing

### Timeline Gantt Chart (Simplified)

```
PHASE 1: Foundation (Weeks 1-8)
┌────────────────────────────────────────────────────────────────┐
│ Week 1-2: Infrastructure + DB       [██░░░░░░░░░░░░░░░░]      │
│ Week 3-4: Meta Connector            [██░░░░░░░░░░░░░░░░]      │
│ Week 5-6: LinkedIn + TikTok         [████░░░░░░░░░░░░░░]      │
│ Week 7  : GBP + Mailchimp           [██░░░░░░░░░░░░░░░░]      │
│ Week 8  : Health Dashboard + Tests  [██░░░░░░░░░░░░░░░░]      │
└────────────────────────────────────────────────────────────────┘

PHASE 2: Growth (Weeks 9-20)
┌────────────────────────────────────────────────────────────────┐
│ Week 9-10: YouTube + Canva          [████░░░░░░░░░░░░░░]      │
│ Week 11-12: Shopify + GA4           [████░░░░░░░░░░░░░░]      │
│ Week 13-14: Pinterest + Slack       [████░░░░░░░░░░░░░░]      │
│ Week 15-16: Capability Matrix + UI  [████░░░░░░░░░░░░░░]      │
│ Week 17-20: Advanced Features + UX  [████░░░░░░░░░░░░░░]      │
└────────────────────────────────────────────────────────────────┘

PHASE 3: Enterprise (Weeks 21+)
┌────────────────────────────────────────────────────────────────┐
│ Tier 3 Integrations + Custom Connectors (Ongoing)              │
└────────────────────────────────────────────────────────────────┘
```

---

## SECTION 4: Quick-Win Checklist (First 2 Weeks)

**Goal**: Set foundation so all future connectors follow same pattern.

```
WEEK 1: Architecture Setup
 □ Database migration (connections, publish_jobs, webhook_events tables)
 □ TokenVault implementation (encryption, KMS integration)
 □ ConnectorManager scaffolding
 □ Connector interface + types definition
 □ Error handling framework (retryable vs. unretryable)
 □ Redis/Bull queue setup (or RabbitMQ alternative)
 □ Logging + monitoring setup (Datadog / Grafana)

WEEK 2: Infrastructure & Scaffolding
 □ OAuth callback handler (generic POST /api/oauth/callback)
 □ Connection CRUD endpoints (/api/connections)
 □ Health check endpoint (synthetic pings)
 □ Webhook receiver (generic POST /api/webhooks/:platform)
 □ Token refresh scheduler (cron job)
 □ Error recovery UI (Reconnect modal)
 □ Observability dashboard skeleton

SUCCESS CRITERIA:
 ✅ Database schema deployed and migrated
 ✅ Token encryption/decryption tested end-to-end
 ✅ Generic OAuth flow works for 1 platform (Meta)
 ✅ Publishing job can be enqueued and dequeued
 ✅ Mock tests for all happy paths
```

---

## SECTION 5: Per-Integration Implementation Checklists

### Meta Connector (Weeks 3-4)

```
OAUTH FLOW
 □ Generate Meta App ID + App Secret
 □ Implement /api/auth/meta/start (generates auth URL)
 □ Implement /api/auth/meta/callback (exchanges code for token)
 □ Store token in TokenVault (encrypted)
 □ Update connection status to 'healthy'

ACCOUNT FETCHING
 □ Fetch Facebook Pages (GET /me/accounts)
 □ Fetch Instagram Business Accounts
 □ Map external IDs to internal account records
 □ Store in connections table

PUBLISHING
 □ POST /api/connections/{connId}/post
 □ Validate idempotency key
 □ Check token freshness (refresh if needed)
 □ Call Meta Graph API (/me/feed POST)
 □ Handle media upload (if needed)
 □ Store external post ID + permalink
 □ Return result to UI

RETRY + ERROR HANDLING
 □ Implement retry logic (4 attempts, exponential backoff)
 □ Handle 429 (rate limit) → backoff
 □ Handle 401 (auth) → mark connection 'attention'
 □ Handle 403 (permission) → mark connection 'attention'
 □ Handle 500/502/503 → retry
 □ Handle 4xx (client error) → mark failed, no retry
 □ Log all errors with error code

TOKEN REFRESH
 □ Implement refresh token flow (GET /me?fields=access_token)
 □ Schedule auto-refresh at T-7d before expiry
 □ Update expires_at in DB
 □ Handle refresh failures → mark connection 'attention'

WEBHOOKS
 □ Subscribe to app_deauthorized, permissions_changed events
 □ Validate webhook signature (X-Hub-Signature)
 □ On deauthorized → mark connection 'revoked'
 □ On permissions_changed → fetch new scopes, compare
 □ Pause related jobs
 □ Notify user

ANALYTICS
 □ Fetch post insights (impressions, engagement, reach)
 □ Store in analytics table
 □ Expose to Advisor AI

TESTS
 □ Mock Meta Graph API responses
 □ Unit test each function (auth, publish, refresh, etc.)
 □ Integration test (OAuth → publish → verify)
 □ Error scenarios (401, 429, timeout, etc.)
 □ Rate limit test (ensure backoff works)

DOCUMENTATION
 □ README (setup, scopes, rate limits, troubleshooting)
 □ Runbook (common errors + fixes)
 □ API reference (public endpoints)
```

### LinkedIn Connector (Weeks 5-6)

```
[Same structure as Meta, but:
- OAuth via LinkedIn's OAuth2 endpoint
- Fetch org + personal accounts
- Use /v2/me + /v2/organizations endpoints
- Article vs. update posting (different APIs)
- No webhooks available (poll instead)
- Different rate limits (100/600s)]
```

### TikTok Connector (Weeks 5-6)

```
[Same structure, but:
- OAuth via TikTok API (different flow)
- Fetch account + creator info
- Video upload is separate endpoint (chunked)
- Scheduled publishing support (if available)
- Error handling for upload failures (bandwidth intensive)
- No webhooks; synthetic health checks essential]
```

---

## SECTION 6: Success Metrics (KPIs)

### Phase 1 Success

```
Functional KPIs
├─ 5 connectors live (Meta, LinkedIn, TikTok, GBP, Mailchimp)
├─ 95% publish success rate (first attempt)
├─ <5% token refresh failures
├─ <2% unrecoverable errors (DLQ size)
└─ 100% webhook delivery (no lost events)

Performance KPIs
├─ Publish latency: <500ms p95
├─ Token refresh latency: <200ms p95
├─ Health check latency: <300ms p95
└─ Queue processing: <1s per job p95

Reliability KPIs
├─ 99.5% uptime (platform API calls)
├─ 100% audit trail (every action logged)
├─ 0 token leaks (encryption verified)
└─ 0 data loss (DLQ → recovery path)

User KPIs
├─ >70% of users connect 1st platform
├─ >40% of users connect 2+ platforms
├─ >20% of users publish multi-platform weekly
└─ <2% support tickets per platform
```

### Phase 2 Success

```
Functional KPIs
├─ 8+ connectors live
├─ Capability matrix rendering correctly
├─ Multi-platform "Create Post" modal working
├─ Cross-platform analytics aggregating
└─ Advisor AI insights > 80% relevance

User Engagement
├─ >50% of users post weekly
├─ >30% of users use multi-platform scheduling
├─ >15% of users leverage Advisor recommendations
└─ Churn reduced by >20% vs. Phase 1
```

---

## SECTION 7: Rollback & Incident Procedures

### If Integration Breaks

```
LEVEL 1: Minor Issue (API latency, low error rate)
─────────────────────────────────────────────────
Action:
 1. Alert fires (error rate >5%)
 2. Check partner status page
 3. If not their outage, investigate locally
 4. Log incident in Slack #incidents
 5. Implement fix or feature flag to disable
 6. Monitor for 15 min before closing

LEVEL 2: Moderate Issue (auth broken, high error rate)
────────────────────────────────────────────────────
Action:
 1. Alert fires (error rate >20% or auth failure)
 2. Feature flag: disable for all new publishes
 3. Pause related jobs in queue
 4. Notify users via in-app banner
 5. Investigate root cause
 6. Page on-call if >30 min unresolved
 7. Once fixed, gradual rollout via feature flag

LEVEL 3: Critical Issue (tokens compromised, data loss)
──────────────────────────────────────────────────────
Action:
 1. Page on-call immediately
 2. Disable connector completely (feature flag off)
 3. Notify all affected users (email + SMS)
 4. Begin incident post-mortem
 5. Audit logs for any leaked data
 6. Implement corrective action
 7. Security review before re-enabling
```

---

## Next Steps

1. **Alignment Meeting**: Review prioritization, confirm Phase 1 scope
2. **Design Review**: Approve DB schema + token strategy
3. **Start Week 1**: Infrastructure setup + Meta connector scaffolding
4. **Weekly Syncs**: Track progress, unblock issues

---

**Version**: 1.0
**Last Updated**: November 11, 2025
**Owner**: Engineering Team
**Next Review**: When Phase 1 scope locked

