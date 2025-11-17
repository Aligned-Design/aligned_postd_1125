# 📋 THIS WEEK ACTION PLAN

**Deadline**: End of Week (Friday EOD)
**Goal**: Prepare for Phase 1 Kickoff (Monday Morning)
**Effort**: 8-10 hours total (distributed across team)

---

## PRIORITY 1: Team Alignment (3 hours)

### Monday Morning (30 min)

**Who**: Tech Lead + Engineering Leads + Product
**Meeting**: 30-minute sync

**Agenda**:
1. **Read** the 4 strategy docs (~15 min skimming)
   - API_INTEGRATION_STRATEGY.md
   - INTEGRATION_PRIORITY_MATRIX.md
   - CONNECTOR_SCAFFOLD.md
   - IMPLEMENTATION_KICKOFF.md

2. **Decide** 3 critical tech choices (~10 min decision):
   - [ ] Queue system: **Redis + Bull** (recommended) or RabbitMQ?
   - [ ] Key management: **AWS Secrets Manager + KMS** (recommended) or GCP/Vault?
   - [ ] Observability: **Datadog** (recommended) or Grafana/CloudWatch?

3. **Assign** owners per connector (~5 min):
   - [ ] Meta → _____ (backend engineer)
   - [ ] LinkedIn → _____ (backend engineer)
   - [ ] TikTok → _____ (backend engineer)
   - [ ] Google Business → _____ (backend engineer)
   - [ ] Mailchimp → _____ (backend engineer)

**Output**: Google Doc with decisions + owner assignments

---

### Monday Afternoon (1 hour)

**Who**: Backend tech lead + frontend tech lead
**Task**: Document decisions

- [ ] Create `.env.example` with all new environment variables (Redis, KMS, Datadog)
- [ ] Create feature flags in Supabase (integration_meta, integration_linkedin, etc.)
- [ ] Update README with new tech stack sections

**Output**: Updated .env.example, feature flags created

---

### Tuesday Morning (1.5 hours)

**Who**: Product + Engineering
**Task**: Stakeholder alignment

- [ ] Schedule 15-min sync with stakeholders
- [ ] Share prioritization matrix (why Meta before YouTube?)
- [ ] Confirm 8-week timeline is feasible
- [ ] Identify any holidays/PTO in next 8 weeks
- [ ] Get sign-off on "MVP scope" (5 connectors only, then iterate)

**Output**: Stakeholder sign-off in Slack

---

## PRIORITY 2: Cloud & Tooling Setup (4 hours)

### Tuesday Afternoon (2 hours)

**Who**: Ops / Infrastructure person
**Tasks**:

- [ ] **AWS Setup** (if KMS chosen):
  - Create AWS KMS key (or use existing)
  - Set up AWS Secrets Manager
  - Create IAM role for app (minimal permissions)
  - Document rotation policy (quarterly)

- [ ] **Redis Setup**:
  - Decide: Managed (Redis Cloud / ElastiCache) or Docker local?
  - If managed: Provision Redis instance, get connection string
  - If Docker: Update docker-compose.yml
  - Set retention policy (24h for local dev, 7d for prod)

- [ ] **Observability Setup** (if Datadog chosen):
  - Create free Datadog account (14-day trial)
  - Get API key
  - Add to `.env` (DATADOG_API_KEY, DATADOG_ENV)

**Output**: All credentials in `.env`, connections tested

---

### Wednesday Morning (2 hours)

**Who**: Connector owners (5 engineers)
**Task**: Create platform app registrations (parallel)

**Meta App** (Owner: Meta connector person):
- [ ] Create Meta Developer App
- [ ] Add "Facebook Login" product
- [ ] Set OAuth redirect URI: `https://localhost:3000/api/oauth/meta/callback`
- [ ] Get App ID, App Secret
- [ ] Create sandbox page + IG business account (for testing)
- [ ] Add to .env: META_CLIENT_ID, META_CLIENT_SECRET

**LinkedIn App** (Owner: LinkedIn person):
- [ ] Create LinkedIn app in Developer Portal
- [ ] Set OAuth redirect URI
- [ ] Get Client ID, Client Secret
- [ ] Create sandbox account for testing
- [ ] Add to .env: LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET

**TikTok App** (Owner: TikTok person):
- [ ] Create TikTok Developer app
- [ ] Get Client ID, Client Secret
- [ ] Request sandbox access (may take 1-2 days)
- [ ] Add to .env: TIKTOK_CLIENT_ID, TIKTOK_CLIENT_SECRET

**Google Business** (Owner: GBP person):
- [ ] Create GCP project
- [ ] Enable "Google My Business" API
- [ ] Create OAuth credentials
- [ ] Get Client ID, Client Secret
- [ ] Create sandbox business account (if available)
- [ ] Add to .env: GCP_CLIENT_ID, GCP_CLIENT_SECRET

**Mailchimp** (Owner: Mailchimp person):
- [ ] Create Mailchimp Developer app
- [ ] Get API key
- [ ] Create test audience (optional)
- [ ] Add to .env: MAILCHIMP_API_KEY

**Output**: All app credentials in `.env`, platforms accessible for testing

---

## PRIORITY 3: Documentation Review (2 hours)

### Wednesday Afternoon (1 hour)

**Who**: All engineers
**Task**: Read connector specs

- [ ] Each connector owner reads their spec:
  - CONNECTOR_SPECS_SHARED.md (all read)
  - CONNECTOR_SPECS_META.md (Meta owner)
  - [Similar for LinkedIn, TikTok, GBP, Mailchimp]

- [ ] Mark any questions / blockers in Google Doc

**Output**: Q&A doc with clarifications

---

### Thursday Morning (1 hour)

**Who**: Tech lead + connector owners
**Task**: Clarify questions

- [ ] 30-min sync to address Q&A doc
- [ ] Resolve any blockers
- [ ] Confirm readiness for Monday kickoff

**Output**: Q&A resolved, everyone confident

---

## PRIORITY 4: Environment & Build Test (1 hour)

### Thursday Afternoon (1 hour)

**Who**: All engineers
**Task**: Verify setup

- [ ] Pull latest code: `git pull origin main`
- [ ] Install new packages (if any): `npm install`
- [ ] Start Redis locally: `docker-compose up redis` (or connect to managed)
- [ ] Run build: `npm run build`
- [ ] Run tests: `npm test`
- [ ] Verify no new TypeScript errors: `npm run typecheck`
- [ ] Confirm feature flags in Supabase are created

**Output**: All devs can build + run locally by Friday

---

## DELIVERABLES BY END OF WEEK

✅ **Documentation** (All created):
- [x] API_INTEGRATION_STRATEGY.md
- [x] INTEGRATION_PRIORITY_MATRIX.md
- [x] CONNECTOR_SCAFFOLD.md
- [x] IMPLEMENTATION_KICKOFF.md
- [x] CONNECTOR_SPECS_SHARED.md
- [x] CONNECTOR_SPECS_META.md (+ similar for other platforms)
- [x] THIS_WEEK_ACTION_PLAN.md (this document)

✅ **Tech Decisions Made**:
- [ ] Queue system decided
- [ ] KMS decided
- [ ] Observability tool decided

✅ **Team Assigned**:
- [ ] Meta owner assigned
- [ ] LinkedIn owner assigned
- [ ] TikTok owner assigned
- [ ] GBP owner assigned
- [ ] Mailchimp owner assigned

✅ **Infrastructure Ready**:
- [ ] Redis provisioned/connected
- [ ] AWS KMS set up (if chosen)
- [ ] Datadog configured (if chosen)

✅ **Platform Apps Created**:
- [ ] Meta app registered + credentials in .env
- [ ] LinkedIn app registered + credentials in .env
- [ ] TikTok app registered + credentials in .env
- [ ] GBP app registered + credentials in .env
- [ ] Mailchimp app registered + credentials in .env

✅ **Local Environment Ready**:
- [ ] All engineers can build
- [ ] All engineers can run tests
- [ ] All engineers have .env with all credentials
- [ ] Redis running locally (or connected to managed)

---

## MONDAY KICKOFF MEETING (30 min)

**Time**: 9:00 AM Monday
**Attendees**: All engineers + tech lead

**Agenda**:
1. **Welcome** (2 min)
2. **Tech decisions recap** (2 min) - What we chose and why
3. **Owner assignments review** (2 min) - Confirm who owns what
4. **Week 1 goals** (5 min) - Database schema + infrastructure setup
5. **First blocker** (2 min) - Where to get help
6. **Questions** (15 min)

**Output**: Everyone leaves with clear Week 1 task + first PR to create

---

## SUCCESS CRITERIA (By Friday EOD)

- [x] All 4 strategy docs reviewed by team
- [ ] 3 tech decisions locked in (not optional)
- [ ] 5 connector owners assigned (clear ownership)
- [ ] All platform apps registered (Meta, LinkedIn, TikTok, GBP, Mailchimp)
- [ ] Redis + AWS KMS + Datadog ready to use
- [ ] All engineers can build + run locally
- [ ] Feature flags created in Supabase
- [ ] No blockers identified (or escalated + resolved)
- [ ] Team confident to start Monday morning

---

## TIMELINE

```
Monday:  AM - Team sync + decision, PM - Document decisions
Tuesday: AM - Stakeholder alignment, PM - Cloud setup
Wednesday: AM - App registrations (parallel), PM - Read specs
Thursday: AM - Q&A sync, PM - Environment test
Friday:  Final checklist, team ready for Monday kickoff
```

---

## ESCALATION PROCESS

**If any blocker found**:
1. Post in #engineering-alerts Slack
2. Tag tech lead + relevant owner
3. Aim to resolve same day (or by EOD Thursday)
4. Document resolution in Q&A Google Doc

**Common blockers**:
- "Platform app registration rejected" → Use sandbox/test account instead
- "Redis connection failing" → Check firewall rules + connection string
- "AWS KMS access denied" → Verify IAM role + permissions
- "TikTok sandbox delayed" → Use mock endpoints for now

---

## NEXT: MONDAY MORNING KICKOFF

**Agenda**: See above (30 min)

**Expected outcome**: Week 1 PR created for database schema

**What happens**: Begin building the connector infrastructure!

---

**Version**: 1.0
**Last Updated**: November 11, 2025
**Status**: Ready for Team Review

