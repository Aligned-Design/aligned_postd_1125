# Implementation Plan: Webhooks, Automation Tests, BFS ML, Escalations, OAuth Extensions

**Status**: 🔵 In Progress
**Timeline**: Phase 1 (1-2 weeks), Phase 2 (2-3 weeks)
**Target**: Production-ready, zero TypeScript errors, ≥70% test coverage

---

## Phase 1 (Option A): Complete Partial Features

### 1A: Webhook Integrations

**Goal**: Full webhook event handling with retry/backoff, dead-letter logging, and idempotency

**Scope**:
- Implement idempotent webhook handlers for Zapier, Make, Slack, HubSpot
- Add exponential backoff retry with configurable max attempts (default: 5)
- Persist webhook events and attempts with status tracking
- Dead-letter storage for failed events after max retries
- Webhook signature verification (HMAC-SHA256)
- Event deduplication via idempotency keys

**Files to Create/Modify**:
- `supabase/migrations/webhook_events.sql` - Events table with status/attempts
- `supabase/migrations/webhook_attempts.sql` - Retry history with backoff
- `server/lib/webhook-handler.ts` - Core handler logic with retry/backoff
- `server/routes/webhooks.ts` - Webhook endpoints for providers
- `server/lib/webhook-retry-scheduler.ts` - Background retry task
- `shared/webhooks.ts` - Types and validation (Zod)
- `server/__tests__/webhook-handler.test.ts` - Unit tests
- `server/__tests__/webhook-integration.test.ts` - Integration tests

**API Routes**:
- `POST /api/webhooks/zapier` - Zapier event receiver (idempotent)
- `POST /api/webhooks/make` - Make event receiver (idempotent)
- `POST /api/webhooks/slack` - Slack event receiver
- `POST /api/webhooks/hubspot` - HubSpot event receiver
- `GET /api/webhooks/status/:eventId` - Query event status
- `GET /api/webhooks/logs?provider=zapier&status=failed&limit=50` - Event logs

**Database Schema**:
```sql
-- webhook_events
id UUID PRIMARY KEY
brand_id TEXT
provider TEXT ('zapier'|'make'|'slack'|'hubspot')
event_type TEXT
payload JSONB
idempotency_key TEXT UNIQUE
status TEXT ('pending'|'processing'|'delivered'|'failed'|'dead_letter')
attempt_count INT DEFAULT 0
max_attempts INT DEFAULT 5
last_error TEXT
created_at TIMESTAMP
updated_at TIMESTAMP
delivered_at TIMESTAMP

-- webhook_attempts
id UUID PRIMARY KEY
event_id UUID REFERENCES webhook_events
attempt_number INT
status TEXT ('success'|'failed')
error TEXT
response_code INT
backoff_ms INT
created_at TIMESTAMP
```

**Definitions of Done**:
- ✅ Idempotent handlers with idempotency_key deduplication
- ✅ Exponential backoff (base: 2s, max: 5min)
- ✅ Dead-letter after 5 failed attempts with alert
- ✅ HMAC-SHA256 signature verification for all providers
- ✅ Event log queryable and filterable
- ✅ Unit tests: retry logic, backoff calc, idempotency, signature verification
- ✅ Integration tests: happy path, retry, dead-letter, audit logging
- ✅ Zero TypeScript errors, ESLint clean
- ✅ Performance: webhook delivery < 500ms p95

---

### 1B: Automation E2E Tests

**Goal**: Comprehensive end-to-end tests for AI generation → brand application → scheduling pipeline

**Scope**:
- Test full automation flow: AI generates content → applies brand guide → schedules post
- Cover happy path, error cases, and recovery scenarios
- Mock AI responses for deterministic testing
- Validate brand fidelity scoring in automation flow
- Test scheduling with time zones and date calculations
- Validate audit logs for each step

**Files to Create/Modify**:
- `server/__tests__/automation-e2e.test.ts` - Full E2E test suite (400+ lines)
- `server/__tests__/fixtures/automation-fixtures.ts` - Mock AI responses, timezones
- `server/__tests__/fixtures/brand-guide-fixtures.ts` - Sample brand guides
- `server/lib/automation-pipeline.ts` - Orchestration logic (extract if needed)
- Update `client/__tests__/integration.test.ts` - Add E2E flow validation

**Test Cases**:
1. ✅ Happy Path: AI generates → BFS passes → brand applied → post scheduled
2. ✅ BFS Failure: AI generates → BFS fails → regeneration requested
3. ✅ Brand Application Failure: Brand guide mismatch → fallback/rollback
4. ✅ Scheduling Conflict: Time slot unavailable → suggest alternative
5. ✅ Timezone Handling: Verify scheduling respects brand + client timezone
6. ✅ Audit Trail: All steps logged with metadata (AI model, BFS score, brand rules applied)
7. ✅ Concurrent Requests: Multiple posts processed in parallel
8. ✅ Cancellation: User cancels mid-automation → cleanup verified

**Definitions of Done**:
- ✅ 400+ lines of deterministic E2E tests
- ✅ 8+ test cases covering happy path + failures
- ✅ CI green, no flakes (runs 5x, 100% pass rate)
- ✅ Fixtures for AI, brand guides, timezones, scheduling
- ✅ Audit log validation for each step
- ✅ Code coverage ≥80% for automation pipeline
- ✅ Zero TypeScript errors
- ✅ Test execution time < 30s (includes setup)

---

## Phase 2 (Option B): Enhance Existing Features

### 2A: Brand Fidelity Score ML Enhancement

**Goal**: Augment existing BFS (1-5 scoring) with ML-based tone detection

**Scope**:
- Add lightweight ML tone classifier (use pre-trained embeddings, e.g., OpenAI or local)
- Measure semantic similarity between AI content and brand tone
- Expose BFS score + rationale in UI (score breakdown)
- Configurable score thresholds per brand (default: 0.80)
- Cache BFS results per post for 1 hour

**Files to Create/Modify**:
- `server/lib/brand-fidelity-scorer.ts` - Augment existing (add ML tone module)
- `server/lib/tone-classifier.ts` - ML-based tone matching (new)
- `shared/brand-fidelity.ts` - Enhanced types (include `scoreBreakdown`, `toneSimilarity`)
- `server/__tests__/tone-classifier.test.ts` - Unit tests
- `server/__tests__/brand-fidelity-scorer.test.ts` - Update existing tests

**BFS Enhancements**:
```typescript
interface BFSResult {
  score: number; // 0.0-1.0
  passed: boolean; // score >= threshold
  scoreBreakdown: {
    toneAlignment: number; // ML-based
    terminologyMatch: number;
    compliance: number;
    ctaFit: number;
    platformFit: number;
    toneSimilarity: number; // NEW: cosine similarity
  };
  issues: Array<{
    type: 'tone'|'terminology'|'compliance'|'cta'|'platform';
    severity: 'error'|'warning';
    message: string;
    suggestion: string;
  }>;
}
```

**Tone Classifier Logic**:
- Use OpenAI embeddings API or local model (e.g., sentence-transformers)
- Compare AI content embedding with brand voice embedding
- Return cosine similarity (0.0-1.0)
- Cache embeddings per brand voice (TTL: 7 days)

**Definitions of Done**:
- ✅ BFS scores consistent ±0.05 across 10 runs (same content)
- ✅ Tone ML component adds <100ms latency
- ✅ UI displays score + breakdown (tone, terminology, compliance, etc.)
- ✅ Guardrail: blocks off-brand posts (score < threshold) with option to override
- ✅ Unit tests: embedding caching, similarity calc, threshold logic
- ✅ Integration tests: BFS with AI-generated content
- ✅ Feature flag: `features.bfsML` (default: true)
- ✅ Zero TypeScript errors

---

### 2B: Workflow Escalation & Time-Based Notifications

**Goal**: Auto-escalate pending approvals after 48h/96h; send reminders with brand-aware timing

**Scope**:
- Escalation rules: 48h → reminder email/Slack; 96h → escalate to next role
- Per-brand timing overrides (some brands want 24h escalation)
- Respect client notification preferences (do not escalate if opt-out)
- Time zone aware (compare approval start time + duration in client's timezone)
- Scheduled background job (cron-like, runs every hour)

**Files to Create/Modify**:
- `supabase/migrations/escalation_rules.sql` - Store per-brand rules
- `supabase/migrations/extend_audit_logs.sql` - Add escalation events
- `server/lib/escalation-scheduler.ts` - Main scheduler logic (new)
- `server/routes/escalations.ts` - Manual trigger + config endpoints (new)
- `shared/escalations.ts` - Types and validation (Zod)
- `server/__tests__/escalation-scheduler.test.ts` - Unit tests
- `server/__tests__/escalation-integration.test.ts` - Integration tests

**Database Schema**:
```sql
-- escalation_rules (per brand)
id UUID PRIMARY KEY
brand_id TEXT UNIQUE
reminder_after_hours INT DEFAULT 48
escalate_after_hours INT DEFAULT 96
escalation_target_role TEXT ('internal_reviewer'|'client'|'admin')
override_client_prefs BOOLEAN DEFAULT false
enabled BOOLEAN DEFAULT true
created_at TIMESTAMP
updated_at TIMESTAMP
```

**Escalation Logic**:
1. Fetch pending approvals where `created_at < NOW() - escalation_rule.reminder_after_hours`
2. Check if approval is still pending (status != approved/rejected)
3. Check client notification preferences for escalation emails
4. If 48h threshold: send reminder email + Slack (if integrated)
5. If 96h threshold: escalate to next role + notify escalation target
6. Create audit log entry with escalation metadata

**Definitions of Done**:
- ✅ 48h reminder flow works; email/Slack sent
- ✅ 96h escalation flow works; post reassigned + audit logged
- ✅ Per-brand timing overrides honored
- ✅ Client notification prefs respected (no emails if opted out)
- ✅ Time zone aware (use client.timezone for calculations)
- ✅ Background job runs reliably every hour (cron)
- ✅ Unit tests: time calculations, escalation logic, role reassignment
- ✅ Integration tests: 48h/96h flows, audit logging
- ✅ Feature flag: `features.workflowEscalation` (default: true)
- ✅ Zero TypeScript errors

---

### 2C: Extend OAuth Wizard for TikTok, YouTube, Pinterest

**Goal**: Add TikTok, YouTube, YouTube Business, and Pinterest to OAuth connection wizard

**Scope**:
- Implement OAuth 2.0 PKCE flow for each platform
- Validate requested scopes
- Add reconnect flow (refresh tokens + health checks)
- Display connection status and token expiry
- Test token validity on reconnect

**Files to Create/Modify**:
- `server/lib/oauth-manager.ts` - Augment existing (add TikTok, YouTube, Pinterest)
- `server/lib/oauth-providers/tiktok-oauth.ts` - TikTok provider (new)
- `server/lib/oauth-providers/youtube-oauth.ts` - YouTube provider (new)
- `server/lib/oauth-providers/pinterest-oauth.ts` - Pinterest provider (new)
- `client/components/publishing/ConnectionWizard.tsx` - Update UI (add new platforms)
- `shared/oauth.ts` - Extend types
- `server/__tests__/oauth-manager.test.ts` - Update tests

**OAuth Platform Details**:

| Platform | Flow | Scopes | Token Lifetime |
|----------|------|--------|-----------------|
| TikTok | PKCE | `video.list,video.create,user.info.read` | 24h refresh token |
| YouTube | PKCE | `youtube,youtube.readonly` | Long-lived (manual refresh) |
| Pinterest | PKCE | `boards:read,pins:create,user:read` | 365 days |

**Definitions of Done**:
- ✅ TikTok OAuth flow works (PKCE, state validation, token exchange)
- ✅ YouTube OAuth flow works (PKCE, refresh token management)
- ✅ Pinterest OAuth flow works (PKCE, scopes validated)
- ✅ UI displays 8 platforms: Instagram, Facebook, LinkedIn, Twitter, Google Business, TikTok, YouTube, Pinterest
- ✅ Reconnect flow: refresh tokens, verify token validity, display expiry
- ✅ Error states: invalid scopes, revoked tokens, network errors
- ✅ Unit tests: OAuth flow logic, scope validation, token refresh
- ✅ Integration tests: full connect → disconnect → reconnect flow
- ✅ Feature flag: `features.oauthExtended` (default: true)
- ✅ Zero TypeScript errors

---

## Cross-Cutting Concerns

### Feature Flags

```typescript
// config/features.ts
export const FEATURE_FLAGS = {
  webhooks: process.env.FEATURE_WEBHOOKS !== 'false', // default: true
  automationE2E: process.env.FEATURE_AUTOMATION_E2E !== 'false', // default: true
  bfsML: process.env.FEATURE_BFS_ML !== 'false', // default: true
  workflowEscalation: process.env.FEATURE_WORKFLOW_ESCALATION !== 'false', // default: true
  oauthExtended: process.env.FEATURE_OAUTH_EXTENDED !== 'false', // default: true
};
```

### Telemetry & Monitoring

**Counters** (emit every webhook, escalation, BFS calc):
- `webhooks.received{provider,status}` - Webhook events received
- `webhooks.delivered{provider}` - Successfully delivered
- `webhooks.failed{provider,error_type}` - Failed deliveries
- `webhooks.dead_letter{provider}` - Dead-letter queue
- `bfs.calculated{brand,passed}` - BFS calculations
- `escalations.sent{brand,type}` - Escalation reminders/handoffs
- `oauth.connected{platform}` - OAuth connections
- `oauth.disconnected{platform}` - OAuth disconnections

**Timers**:
- `webhook.delivery.latency` - End-to-end webhook delivery time
- `bfs.calculation_time` - BFS scoring latency
- `escalation.scheduler_duration` - Escalation job runtime

**Gauges**:
- `pending.approvals{brand}` - Count of pending approvals
- `webhook.backlog{provider}` - Queued webhook retries
- `oauth.tokens.expiring_soon` - Tokens expiring within 7 days

**Alerts** (Datadog/Sentry):
- Webhook failure rate > 5% per 10 minutes → Page on-call
- BFS calculation latency > 1s (p95) → Alert
- Escalation job fails → Immediate alert
- Dead-letter queue growth > 100 events → Alert

---

## Testing Strategy

### Coverage Requirements
- **Unit**: 85% for webhooks, escalations, BFS ML
- **Integration**: 70% for E2E flows
- **E2E**: Deterministic, no flakes, <30s execution

### Test Structure
```
server/__tests__/
├── webhook-handler.test.ts (unit: retry, backoff, idempotency)
├── webhook-integration.test.ts (integration: handlers, audit)
├── automation-e2e.test.ts (E2E: full pipeline)
├── escalation-scheduler.test.ts (unit: timing, rules)
├── escalation-integration.test.ts (integration: email, escalation)
├── tone-classifier.test.ts (unit: embedding, similarity)
├── brand-fidelity-scorer.test.ts (update: add ML tests)
├── oauth-manager.test.ts (update: add TikTok/YouTube/Pinterest)
├── fixtures/
│   ├── automation-fixtures.ts
│   ├── brand-guide-fixtures.ts
│   └── oauth-fixtures.ts
```

---

## Deliverables Checklist

### Phase 1A (Webhooks)
- [ ] Migration files (webhook_events, webhook_attempts)
- [ ] `server/lib/webhook-handler.ts` (450 lines)
- [ ] `server/routes/webhooks.ts` (400 lines)
- [ ] `server/lib/webhook-retry-scheduler.ts` (200 lines)
- [ ] `shared/webhooks.ts` (150 lines, Zod validation)
- [ ] Unit tests (300 lines)
- [ ] Integration tests (400 lines)
- [ ] `pnpm typecheck` passes with 0 errors
- [ ] `pnpm build` succeeds
- [ ] `pnpm test webhooks` all green

### Phase 1B (Automation E2E)
- [ ] `server/__tests__/automation-e2e.test.ts` (500 lines)
- [ ] `server/__tests__/fixtures/automation-fixtures.ts` (200 lines)
- [ ] 8+ test cases with >80% coverage
- [ ] CI passes, no flakes
- [ ] `pnpm test automation` all green

### Phase 2A (BFS ML)
- [ ] `server/lib/tone-classifier.ts` (300 lines)
- [ ] Update `server/lib/brand-fidelity-scorer.ts` (200 lines added)
- [ ] Unit tests (250 lines)
- [ ] BFS consistency validated (±0.05)
- [ ] `pnpm test bfs` all green

### Phase 2B (Escalations)
- [ ] Migration file (escalation_rules)
- [ ] `server/lib/escalation-scheduler.ts` (350 lines)
- [ ] `server/routes/escalations.ts` (200 lines)
- [ ] Unit tests (300 lines)
- [ ] Integration tests (400 lines)
- [ ] Cron job scheduling verified
- [ ] `pnpm test escalation` all green

### Phase 2C (OAuth Extensions)
- [ ] Update `server/lib/oauth-manager.ts` (300 lines added)
- [ ] `server/lib/oauth-providers/tiktok-oauth.ts` (150 lines)
- [ ] `server/lib/oauth-providers/youtube-oauth.ts` (150 lines)
- [ ] `server/lib/oauth-providers/pinterest-oauth.ts` (150 lines)
- [ ] Update `client/components/publishing/ConnectionWizard.tsx` (150 lines)
- [ ] Unit tests (300 lines)
- [ ] Integration tests (400 lines)
- [ ] `pnpm test oauth` all green

### Final Validation
- [ ] `pnpm typecheck` → 0 errors
- [ ] `pnpm lint` → 0 warnings
- [ ] `pnpm build` → success
- [ ] `pnpm test` → all suites pass
- [ ] Test coverage ≥70% overall
- [ ] CHANGELOG updated
- [ ] Feature flags documented
- [ ] Telemetry dashboard configured

---

## Timeline Estimate

| Phase | Task | Duration | Start | End |
|-------|------|----------|-------|-----|
| 1A | Webhook Implementation | 3 days | Day 1 | Day 3 |
| 1A | Webhook Testing | 2 days | Day 4 | Day 5 |
| 1B | Automation E2E Tests | 3 days | Day 6 | Day 8 |
| 1B | E2E Test Validation | 1 day | Day 9 | Day 9 |
| **Phase 1 Total** | | **9 days** | | |
| 2A | BFS ML Enhancement | 2 days | Day 10 | Day 11 |
| 2A | BFS ML Testing | 1 day | Day 12 | Day 12 |
| 2B | Escalation Implementation | 2 days | Day 13 | Day 14 |
| 2B | Escalation Testing | 1.5 days | Day 15 | Day 16 |
| 2C | OAuth Extensions | 2 days | Day 17 | Day 18 |
| 2C | OAuth Testing | 1.5 days | Day 19 | Day 20 |
| **Phase 2 Total** | | **10 days** | | |
| **GRAND TOTAL** | | **19 days** | | |

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Webhook delivery rate too high (DoS) | Rate limit: 10 req/s per brand, queue overages |
| BFS ML latency impacts UX | Cache results, async background processing, timeout fallback |
| Escalation scheduler race conditions | Distributed lock (Redis/DB), idempotent operations |
| OAuth token refresh fails | Graceful degradation, user re-auth prompt, audit alert |
| Test flakiness (timing-dependent) | Fixed time (jest.useFakeTimers), deterministic fixtures |

---

## Success Criteria (All Required)

1. ✅ Zero TypeScript/ESLint errors
2. ✅ All tests pass with >70% coverage
3. ✅ CI green (no flakes, all suites pass 5x)
4. ✅ Performance: webhook delivery <500ms p95, BFS <1s p95
5. ✅ Telemetry configured and visible
6. ✅ Feature flags working (can disable any feature)
7. ✅ Production build succeeds
8. ✅ Documentation updated (CHANGELOG, runbook)
9. ✅ All DoD items signed off

---

**Generated**: 2025-11-05
**Status**: Ready for Phase 1 Implementation
**Next Step**: Start 1A (Webhook Integrations)
