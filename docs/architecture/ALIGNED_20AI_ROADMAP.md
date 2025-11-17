Aligned‑20AI — Product Understanding & Roadmap (v1.0)
Last updated: Nov 7, 2025 • Owner: Lauren Foust • Status: Phase 9 → 10 transition

0) Product Vision & Principles
Purpose: A full‑stack AI SaaS for agencies and creative teams that automates content creation, review, and publishing while keeping humans in control.
North Star: "Ship on‑brand content with approval in minutes, not days—at scale."
Guiding Principles
* Human‑led, AI‑accelerated. AI proposes; people approve.
* Brand integrity first. Everything orbits the brand guide + embeddings.
* Clarity over complexity. Simple defaults up front; power options tucked away.
* Observable, auditable, secure. Every action is logged and explainable.
* Open yet modular. Integrations as first‑class citizens; replaceable parts.
Primary Users & Personas
* Agency Owner/Director: Needs multi‑brand visibility, billing, reliability.
* Brand/Content Manager: Plans calendars, reviews AI drafts, schedules posts.
* Client Approver (Stakeholder): Reviews/approves content in a view‑only portal.
* Creator (Photo/Video/Design): Uploads and curates assets, quick edits.
* Analyst/Strategist: Reads insights, runs experiments, informs next cycle.
Core Differentiators (vs typical AI content tools)
* Brand Fidelity Score (BFS) to enforce voice/tone/compliance gates.
* Typeform‑style Brand Intake → auto Brand Guide Snapshot + embeddings.
* Approval‑first workflow with audit trail and role‑based controls.
* Advisor Agent that ties analytics → next week’s plan with clear rationale.

1) Glossary (Working)
* Brand Guide Snapshot (BGS): Auto‑generated, human‑editable profile of tone, messaging pillars, taboo phrases, CTA styles, and compliance rules.
* Brand Embeddings: Vectorized representation (text + style signals) used to score draft content.
* BFS (Brand Fidelity Score): 0–1 score of alignment to BGS + compliance.
* Content Item: Atomic unit: social post, email, blog, ad, or page section.
* Workflow Gate: Required human checkpoints; block publish if failing.
* Advisor Insight: AI‑generated, analytics‑backed recommendation with confidence & rationale.

2) System Architecture (High‑Level)
Frontend: Vite + React + Tailwind; Builder.io for landing/marketing pages.Backend: Node.js + Express; Supabase/PostgreSQL (RLS); WebSockets for realtime; Job queue (e.g., BullMQ) for async tasks.AI Layer: Multi‑agent orchestrator (Doc/Design/Advisor). Embeddings store (Supabase pgvector). Prompt templates per brand.Integrations: OAuth providers (Meta, Instagram, LinkedIn, Google Business, YouTube, TikTok, Pinterest, Shopify, Mailchimp, Squarespace). Webhooks → event bus → queue.Observability: Sentry (errors), PostHog (product analytics), structured logs; health & queue dashboards.CI/CD: GitHub Actions (pnpm → typecheck → lint → test → build). Husky pre‑commit hooks. Branch protections.Security: RLS, RBAC, Zod input validation, CSRF/state validation, CSP, rate‑limits, secret rotation.
[Client Portal/Agency App]
   ↕ WebSockets/HTTPS
[Express API + Orchestrator] —— [Job Queue] —— [Workers: Gen/Publish/Analytics]
   │                               │
   ├── Supabase/Postgres (RLS, pgvector)
   ├── Object Storage (media)
   └── OAuth Providers + Webhooks → Event Bus

3) Data Model (Key Entities)
User(id, name, email, org_id, role) — RBAC enforced.Org(id, name, plan, billing_customer_id).Brand(id, org_id, name, handles, urls, bgs_id, embedding_vector).BrandGuideSnapshot (BGS)(id, brand_id, voice, taboo_phrases[], ctastyles[], compliance_rules[], keywords[], competitors[]).IntegrationAccount(id, brand_id, provider, scopes[], token_meta, status).Asset(id, brand_id, storage_url, type, tags[], ocr_text, metadata).ContentItem(id, brand_id, type, status, draft_json, bfs, approver_id, scheduled_at, published_at, platform_payload).ApprovalEvent(id, content_id, user_id, action, comment, timestamp, diffs).CalendarEvent(id, content_id, slot, platform, state).AnalyticsMetric(id, brand_id, source, metric, value, ts, dimension{}).AdvisorInsight(id, brand_id, title, rationale, linked_metrics[], action_json, confidence).AuditLog(id, actor, action, target, ts, ip, user_agent).

4) AI & BFS (Brand Fidelity Score)
Inputs to BFS (weighted components; tunable per brand):
1. Voice Similarity (0–1): Cosine similarity: embedding(text) vs brand embedding.
2. Terminology Match (0–1): Required phrases present; taboo phrases absent.
3. CTA Consistency (0–1): CTA structure and tone matches BGS patterns.
4. Compliance (0–1): Regex/policy rules (e.g., finance/medical disclaimers) pass.
5. Readability/Clarity (0–1): Target grade level; sentence variety; length window.
6. Toxicity/Policy (0–1): Safety/brand risk checks.
Formula (initial):BFS = 0.35*Voice + 0.20*Terminology + 0.15*CTA + 0.20*Compliance + 0.05*Readability + 0.05*Toxicity
Thresholds & Actions
* BFS ≥ 0.90: Auto‑approve optional (if brand allows) or “Fast‑Track Approve.”
* 0.80 ≤ BFS < 0.90: Requires human approval; shows fix suggestions.
* BFS < 0.80: Auto‑regenerate with targeted prompts (explain deltas).
Explainability: For each component, display excerpts, matched patterns, and suggested edits to raise the score.

5) End‑to‑End Workflows
5.1 Brand Onboarding
1. Client completes Typeform‑style intake (voice, pillars, no‑go words, disclaimers, competitors, audiences, goals) + connects social accounts.
2. Crawler parses website and recent posts → mines phrases, tone markers, CTAs.
3. System drafts BGS + generates embeddings; flags uncertainties for human review.
4. Brand Manager reviews/edits BGS, locks version v1 (versioned updates allowed).
Success Criteria: BGS v1 exists, BFS test on 3 sample drafts ≥ 0.85, all integrations green.
5.2 Content Planning & Generation
1. Manager picks timeframe, channels, and topics; seeds ideas or lets Advisor suggest.
2. Doc Agent drafts a batch (e.g., 20 posts) per platform constraints.
3. Each draft is scored (BFS), run through compliance & safety checks.
4. Low BFS items auto‑regenerate with component‑level guidance.
Success Criteria: Batch ready with median BFS ≥ 0.85; each item has rationale + variants.
5.3 Client Review & Approval
1. Client gets email/SMS/push → portal shows “Ready to Review.”
2. Client can Approve, Reject, or Comment; side‑by‑side before/after view.
3. Audit trail logs user, changes, and timestamps; notifications to Manager.
Success Criteria: Approval latency < 48h (target); all items have a clear status.
5.4 Scheduling & Publishing
1. Approved items drop onto unified calendar; drag‑and‑drop reschedule.
2. Advisor Agent proposes best times; user can override.
3. Publisher worker posts via platform APIs, retries on transient errors, confirms permalink.
Success Criteria: Publish success ≥ 99% across platforms; zero duplicate posts; permalinks captured; analytics ingestion within 60 minutes.
5.5 Analytics → Advisor Loop
1. Ingest metrics (reach, engagement, CTR, saves, follows, comments sentiment).
2. Advisor detects patterns (topic, headline, CTA, time‑of‑day) → suggests next cycle.
3. A/B test harness: variant generation, auto labeling, exportable results.
Success Criteria: Weekly Advisor brief with 3–5 prioritized actions; measurable lift over 4 weeks.

6) UX & UI Guidelines
* Design Language: Indigo/navy gradient hero, lime accents; ample whitespace; 12/16/24/32 spacing grid; rounded‑lg/2xl corners; gentle micro‑animations.
* Navigation: Left rail (Brands, Calendar, Content, Media, Analytics, Approvals, Settings). Top bar for brand switch + search.
* First‑Run: Guided setup checklist (connect accounts, upload assets, finish BGS, generate first batch).
* Calendar: Month/Week/List views; color codes — Draft (gray), In Review (amber), Approved (green), Scheduled (blue), Published (indigo).
* Review UI: BFS badge + component chips; inline fix suggestions; version history.
* Accessibility: WCAG AA; keyboard shortcuts; reduced‑motion mode.

7) API Surface (Representative)
Auth & Orgs
* POST /auth/login
* GET /orgs/:id — includes plan/limits
Brands & Guides
* POST /brands | GET /brands/:id
* POST /brands/:id/guide (create BGS) | GET /brands/:id/guide?version=v1
* POST /brands/:id/embed (recompute embeddings)
Assets
* POST /brands/:id/assets (upload; returns URL)
* GET /brands/:id/assets?tags=...
Generation
* POST /brands/:id/content:batch-generate (payload: timeframe, channels, topics)
* POST /content/:id:score → { bfs, components[] }
* POST /content/:id:regenerate (with hints)
Approvals
* POST /content/:id/approve | POST /content/:id/reject (comment)
* GET /content/:id/audit
Calendar & Publish
* POST /content/:id/schedule (slot/platform)
* POST /content/:id/publish (manual)
* Webhooks: /webhooks/provider/* (status updates)
Analytics & Advisor
* GET /brands/:id/analytics?range=...
* POST /brands/:id/advisor:brief (returns prioritized actions)
Admin
* GET /admin/health | GET /admin/queues | GET /admin/usage
All endpoints pass Zod validation and return standardized error envelopes.

8) Integrations & OAuth
* Providers: Instagram, Facebook/Meta, LinkedIn, Google Business, YouTube, TikTok, Pinterest, Shopify, Mailchimp, Squarespace.
* Token Handling: PKCE + state param; refresh tokens vaulted; token health monitor; proactive renewal; graceful degradation if expired.
* Publishing Contracts: Per‑platform payload mappers + rate limiters; content rules (length, aspect ratio, media types) enforced pre‑publish.
* Webhooks: Delivery verification (HMAC); idempotent handlers; DLQ for failures.

9) Security, Privacy, Compliance
* RLS & RBAC: Org/Brand scoping; least privilege roles (Owner, Manager, Creator, Approver, Viewer).
* Validation: Zod on every input; CSP; rate limiting; strict CORS; CSRF on portal forms.
* PII & Media: Bucket policies; signed URLs; expiring links for share views.
* Audit: Immutable AuditLog; export on request.
* Backups & DR: Daily DB snapshots; object storage versioning; runbook.
* Compliance Posture: SOC 2‑informed controls; regional data residency roadmap.

10) Observability & Quality Gates
* SLOs: 99.9% API uptime; <200ms p95 read; <1s p95 writes (non‑gen).
* Error Budget: 0.1% monthly; auto‑freeze deploys on burn alerts.
* CI Gates: typecheck, lint, unit (≥80%), integration smoke, e2e (critical flows), build‑green.
* Release Checklist: Migrations applied; feature flags set; rollback plan.

11) Multi‑Agent Orchestration (v1)
Doc Agent
* Inputs: BGS, topic intents, platform constraints, historical winners.
* Outputs: Drafts + variants + rationale; structured JSON per channel.
Design Agent
* Inputs: Asset library + brand colors/typography; text overlays.
* Outputs: Image compositions or layout specs; calls in‑app visual editor.
Advisor Agent
* Inputs: Analytics metrics; cohort deltas; competitor cues (optional).
* Outputs: Ranked opportunities, best‑time windows, topic/CTA playbook.
Control Loop (pseudo):
1. Generate → Score (BFS) → If <0.80 then Regenerate(with hints) → Re‑score.
2. After approval, schedule → publish → ingest analytics → Advisor brief.
3. Next cycle: seed generation with top signals.

12) Non‑Functional Requirements
* Performance: 100‑item batch generation < 3 min (async with progress UI).
* Scalability: Horizontal workers; queue back‑pressure; shard by org.
* Reliability: Exactly‑once publish via idempotency keys + outbox pattern.
* Usability: Time‑to‑first‑post ≤ 30 minutes from account creation.

13) Pricing & Packaging (Draft)
* Starter (1 Brand, 3 seats): Limited batch size, basic analytics.
* Pro (5 Brands, 10 seats): A/B testing, Advisor, custom BFS weights.
* Agency (20+ Brands, 25 seats): SSO, audit export, priority limits.
* Add‑ons: Extra brands/seats, premium analytics connectors.

14) Risks & Mitigations
* API Rate/Policy Changes: Abstract providers; fallbacks; monitoring.
* Voice Drift: Tighten BFS; periodic BGS review prompts; human spot checks.
* Client Over‑Automation: Enforce approval gates; clear status comms.
* Content Rejection Loops: Component‑level fix suggestions; variant generation.

15) Rollout Plan & KPIs
Pilot (1–3 friendly brands):
* KPIs: time‑to‑approval, median BFS, publish success %, weekly active approvers.
Beta (10–15 brands):
* KPIs: approval latency, Advisor adoption, content lift (engagement delta vs baseline), NPS from clients.
GA:
* KPIs: churn, time saved per brand/week, % auto‑fast‑tracked approvals, platform reliability.

16) Phase Plan (Macro → Current)
Phase 0–3 (Foundation): Auth, org/brand models, RBAC, storage, basic UI.Phase 4–5 (Brand & Gen): Intake → BGS → embeddings; Doc Agent v1; BFS v1.Phase 6–7 (Approvals & Calendar): Client portal, audit trail, calendar & scheduling.Phase 8 (Publishing): Provider mappers, retries, permalinks, analytics ingest.Phase 9 (Quality & Hardening): Zod everywhere; error envelopes; RLS audits; e2e tests.Phase 10 (Advisor & Analytics): Dashboard, insights, A/B framework; export.
Definition of Done (per phase)
* Tickets closed; CI green; migrations merged; docs updated; runbook amended.
* Demo script recorded; pilot brand verified; metrics tracked.

17) Phase 9 → 10 Transition — Detailed Checklist
A. Type‑Safe, Lint‑Clean, Build‑Green (P9)
* Zod schemas on all routes; super‑refine for cross‑field constraints.
* Error response spec (code/key/message/fields[]); consistent across API.
* RLS test suite: cannot cross‑org fetch; row‑level mutation rules enforced.
* BFS service unit tests (component fixtures; golden files).
* e2e smoke: Onboard → Generate → Review → Schedule → Publish → Ingest.
* Sentry alerts wired; PostHog events for each gate.
B. Client Workflow Automation (P10)
* Approval notifications: email + in‑app + optional SMS.
* Bulk approval with BFS guards; comment templates.
* Calendar drag‑drop with conflict checks; multi‑timezone.
* Advisor v1: best‑time windows + top‑topic suggestions.
* Analytics ingest mappers: Meta/IG/LinkedIn/GBP/YouTube (MVP set).
* Report exports (PDF/CSV) with brand styling.
C. Real‑time Publishing (P10)
* Job queue backoff & DLQ; idempotency keys; outbox for cross‑service publish.
* Webhook verifiers; status reconciliation loop; permalinks stored.
* Token health cron; pre‑flight checks; graceful degradation UI.

18) Acceptance Tests (Representative)
1. Onboard‑to‑First‑Draft: New brand completes intake → BGS v1 → generate 10 IG posts; median BFS ≥ 0.85; no server 5xx.
2. Approval Gate: Client rejects item for taboo word; system suggests fix; next draft BFS +0.1.
3. Schedule & Publish: Drag post to Thu 10am; publish success; permalink captured; analytics ingested ≤ 60m.
4. Advisor Loop: After 7 days, brief recommends top 3 topics; next batch autogenerates variants using signals.

19) UI Components (Core Library)
* Buttons (primary/secondary/ghost), Tabs, Modal, Sheet, Toast, Tooltip
* Cards (stat, list, media), BFS Badge, Status Chips, Timeline (audit)
* Calendar (month/week/list), Kanban (statuses), Rich Editor, Asset Picker
* Role Guard wrappers (Owner/Manager/Approver/Viewer)

20) Developer Runbook (Daily)
* pnpm dev (env: .env.local with provider sandbox keys)
* Start queue workers pnpm worker (concurrency via env)
* Use seed script to create Org/Brand and sample assets
* Verify health at /admin/health; queues at /admin/queues
* Smoke e2e via pnpm test:e2e:smoke

21) Next Actions (This Week)
* Lock error envelope & map all controllers
* Finish RLS policy tests for ContentItem/ApprovalEvent
* BFS explainability panel v1 (chips + diffs)
* Calendar drag‑drop collision rules
* Analytics mappers: IG + LinkedIn MVP
* Advisor v1: best‑time window using last 90 days
When this checklist is complete and CI is green, promote to Phase 10 and invite 2 pilot clients to the approval portal.
