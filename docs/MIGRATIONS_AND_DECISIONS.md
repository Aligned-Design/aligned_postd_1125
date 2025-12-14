# POSTD Migrations and Decisions

**Last Updated:** 2025-12-14  
**Status:** Canonical Reference

This document captures durable architectural decisions and migrations that affect future development. This is the **only** place for historical "why we did X" documentation.

---

## Decision Log

### D1: Builder.io Removal (2025-12-13)

**Decision:** Remove Builder.io CMS integration completely.

**Rationale:**
- Builder.io was not actively used in production
- Added unnecessary complexity and dependencies
- Content generation handled directly by AI services (Anthropic Claude, OpenAI)
- No external CMS needed for current product vision

**What Changed:**
- Removed all `@builder.io/*` packages from dependencies
- Deleted `server/routes/builder.ts` and `server/routes/builder-router.ts`
- Removed Builder.io-specific functions from `server/workers/ai-generation.ts`
- Updated routes to use `generateWithAI()` directly
- Cleaned CSP headers (removed `cdn.builder.io`)

**Impact:**
- Net reduction of 6,094 lines of code
- Simplified content generation pipeline
- Removed external service dependency

**Enforcement:**
- Banned terms check blocks `@builder.io` in code (`pnpm check:banned`)
- CI fails if Builder.io references found in active code

**Reference:** `BUILDER_IO_REMOVAL_COMPLETE.md` (archived)

---

### D2: Data Access Layer Enforcement (2025-12-13)

**Decision:** Enforce single data access layer pattern - no direct Supabase calls in UI.

**Rationale:**
- Prevents data access logic from leaking into UI components
- Enables centralized caching strategy (React Query)
- Makes testing easier (mock API layer, not Supabase)
- Consistent error handling and validation
- Future-proof for potential backend changes

**Pattern:**
```
UI Component → React Hook → client/lib/api/* → Server API / Supabase
```

**What Changed:**
- Created `client/lib/api/` directory with domain-organized modules
  - `api/brands.ts`
  - `api/content.ts`
  - `api/auth.ts`
  - etc.
- Refactored `BrandContext.tsx` to use `listBrands()` from API layer
- Added compliance documentation: `client/lib/api/DATA_ACCESS_COMPLIANCE.md`

**Compliance Status:**
- Before: ~70% compliant
- After: 100% compliant
- Verified: Zero direct Supabase calls in UI (`rg "supabase\.(from|auth|storage)" client/`)

**Enforcement:**
- Banned terms check blocks `.from`, `.auth`, `.storage` in UI directories
- CI fails on violations
- Pre-commit hook available (optional)

**Reference:** `client/lib/api/DATA_ACCESS_COMPLIANCE.md`

---

### D3: Contract Validation with Zod (Ongoing)

**Decision:** Use Zod for runtime validation at all API boundaries.

**Rationale:**
- TypeScript provides compile-time safety, but no runtime validation
- API boundaries need both type checking AND data validation
- Zod provides single source of truth for types + validation
- Prevents invalid data from entering system
- Self-documenting schemas

**Pattern:**
```typescript
// Define schema
export const BrandSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  tenant_id: z.string().uuid(),
});

// Use for validation
const brand = BrandSchema.parse(data); // Throws if invalid

// Use for types
export type Brand = z.infer<typeof BrandSchema>;
```

**Where Applied:**
- `client/lib/contracts/*` - Client-side schemas
- `server/routes/*` - Server-side validation
- `shared/*` - Shared type definitions

**Status:** Partially implemented, ongoing migration

**Next Steps:**
- Add Zod validation to all remaining API routes
- Standardize error handling for validation failures

---

### D4: Lint Baseline Policy (2025-12-13)

**Decision:** Implement lint warning baseline to prevent warning accumulation.

**Rationale:**
- Existing codebase had accumulated lint warnings
- Zero-warning policy unrealistic for large codebase
- Baseline prevents new warnings from being introduced
- Encourages gradual improvement over time

**Implementation:**
- Baseline file: `tools/lint-baseline.json`
- Script: `scripts/check-lint-baseline.ts`
- Command: `pnpm check:lint-baseline`
- Included in: `pnpm check` (pre-commit validation)

**Policy:**
- New code MUST NOT introduce new warnings
- Warnings below baseline are celebrated (update baseline)
- Warnings above baseline fail CI
- Allowed increase: 0 (by default)

**Baseline Update Process:**
1. Run `pnpm lint` to get current count
2. If count decreased, update `tools/lint-baseline.json`
3. Document reason in commit message
4. Never increase baseline without justification

**Goal:** Reduce warnings to zero over time through incremental improvements.

---

### D5: Banned Terms Policy (2025-12-13)

**Decision:** Automated enforcement of banned patterns/terms in codebase.

**Rationale:**
- Prevent reintroduction of removed dependencies (Builder.io)
- Enforce consistent branding (POSTD, not Aligned-20AI)
- Block known anti-patterns (direct Supabase in UI)
- Catch deprecated patterns early (fail CI, not in PR review)

**Banned Patterns:**
1. **Old branding:** `Aligned-20AI`, `Aligned Design`, `aligned-20`
2. **Removed dependencies:** `@builder.io`, `builder.io`
3. **Builder.io env vars:** `BUILDER_`, `VITE_BUILDER`
4. **Direct Supabase in UI:** (partially enforced, see D2)

**Implementation:**
- Script: `scripts/check-banned-terms.ts`
- Command: `pnpm check:banned`
- Included in: `pnpm check` (pre-commit validation)
- Uses ripgrep (fast) or grep (fallback)

**Exclusions:**
- `docs/` - Historical documentation allowed
- `*.md` files - Markdown documentation
- `CHANGELOG*` - Change logs
- `src_ARCHIVED/` - Archived code

**Adding New Banned Terms:**
1. Update `BANNED_PATTERNS` in `scripts/check-banned-terms.ts`
2. Specify pattern (regex), name, severity (error/warning)
3. Test: `pnpm check:banned`
4. Document decision here

---

### D6: Product Naming (2025-12-13)

**Decision:** Official product name is "POSTD" (formerly Aligned-20AI).

**Rationale:**
- Simpler, more memorable brand
- Aligned-20AI was interim name during development
- POSTD better reflects product mission (social posting platform)

**What Changed:**
- Updated all user-facing documentation
- Updated code comments with product references
- Banned old branding in active code (`pnpm check:banned`)

**Historical References:**
- Old documentation may still reference "Aligned-20AI"
- This is acceptable for historical context
- New code/docs MUST use "POSTD"

---

### D7: Unified Check Command (2025-12-13)

**Decision:** Single `pnpm check` command runs all validation.

**Rationale:**
- Developers shouldn't need to remember multiple commands
- Ensures consistent validation before commits
- Fast feedback loop (run locally before CI)
- Prevents common mistakes (forgot to run lint, typecheck, etc.)

**Command Composition:**
```bash
pnpm check = 
  pnpm lint &&
  pnpm check:lint-baseline &&
  pnpm typecheck &&
  pnpm test &&
  pnpm check:banned
```

**Usage:**
- **Before every commit:** `pnpm check`
- **Before opening PR:** `pnpm check`
- **CI runs:** `pnpm check` (enforced)

**Exit Code:**
- `0` - All checks passed ✅
- `1` - One or more checks failed ❌

**Policy:** No commits should be pushed if `pnpm check` fails.

---

### D8: Multi-Tenancy Architecture (Original Design)

**Decision:** Every table has `tenant_id` for workspace isolation.

**Rationale:**
- Support multi-brand agencies (1 tenant, N brands)
- Data isolation for security and compliance
- Scalable to SaaS model
- Prevent data leakage between tenants

**Implementation:**
- **Database:** `tenant_id UUID` column on ALL tables
- **RLS Policies:** Enforce tenant isolation at database level
- **Server Middleware:** Extract tenant from JWT, inject into queries
- **Client Context:** `WorkspaceContext` provides tenant to all components

**Pattern:**
```sql
-- RLS Policy Example
CREATE POLICY "Users see only their tenant's data"
  ON brands FOR SELECT
  USING (tenant_id = (SELECT tenant_id FROM auth.users WHERE id = auth.uid()));
```

**Enforcement:**
- All queries MUST filter by `tenant_id`
- RLS policies provide defense-in-depth
- Server validates tenant matches JWT claim

**Impact:** Core architectural constraint, affects all new features.

---

### D9: Schema Naming Conventions (Clarified 2025-12-13)

**Decision:** Standardized table and column naming.

**Tables:**
- Plural, snake_case: `content_items`, `social_accounts`
- Avoid ambiguous names: use `content_items` not `content`

**Columns:**
- snake_case: `tenant_id`, `created_at`, `brand_id`
- UUIDs for all primary keys and foreign keys
- Timestamps: `created_at`, `updated_at`, `deleted_at`
- Soft deletes: nullable `deleted_at`

**Why:**
- PostgreSQL convention (snake_case)
- Clarity and consistency
- Matches Supabase patterns

---

### D10: Authentication Flow (Original Design)

**Decision:** Supabase Auth + Row-Level Security (RLS) for authentication.

**Rationale:**
- Supabase Auth handles OAuth 2.0 flows (Google, GitHub, etc.)
- RLS provides database-level security (defense-in-depth)
- JWT tokens contain user metadata (user_id, tenant_id)
- Minimizes custom auth code (security critical, best to use proven solution)

**Flow:**
1. User authenticates via Supabase Auth
2. JWT token issued with claims: `user_id`, `tenant_id`, `email`
3. Client stores token, includes in all requests
4. Server validates JWT, extracts claims
5. Database RLS policies enforce permissions

**Keys:**
- **Anon Key:** Safe for client use (public key)
- **Service Key:** Server-only (full database access, bypasses RLS)

**Policy:** Never expose service key to client.

---

## Migration History (Database)

### M1: Initial Schema (Migration 001)

**Date:** 2025-11-01 (approximate)

**Created Tables:**
- `tenants` - Workspace isolation
- `users` - User accounts
- `brands` - Brand profiles
- `brand_kit` - Brand identity (colors, fonts, voice)
- `content_items` - Generated content
- `social_accounts` - Connected platforms
- `content_queue` - Scheduled publishing

**Key Decisions:**
- UUID primary keys
- `tenant_id` on all tables
- Soft deletes (`deleted_at`)
- Timestamps auto-managed by database

### M2: Brand Kit Expansion (Migration 005)

**Date:** 2025-11-15 (approximate)

**Changes:**
- Added `brand_voice` to `brand_kit`
- Added `target_audience` to `brand_kit`
- Added `content_pillars` (JSONB) to `brand_kit`

**Rationale:** Support richer brand identity for AI content generation.

### M3: Analytics Events (Migration 008)

**Date:** 2025-11-20 (approximate)

**Created:**
- `analytics_events` table for performance tracking

**Schema:**
- Stores post performance metrics (likes, comments, shares, reach)
- Links to `content_items` via `content_id`
- Platform-specific metrics in JSONB column

**Rationale:** Enable analytics dashboard and AI insights.

---

## Deprecations

### Deprecated: Direct Supabase Calls in UI (2025-12-13)

**Status:** Banned (enforced by `pnpm check:banned`)

**Use Instead:** `client/lib/api/*` modules

### Deprecated: Builder.io (2025-12-13)

**Status:** Removed completely

**Use Instead:** Direct AI generation (`generateWithAI()`)

### Deprecated: "Aligned-20AI" Branding (2025-12-13)

**Status:** Banned in active code

**Use Instead:** "POSTD"

---

## Future Decisions to Document Here

When making significant architectural decisions, add them to this log with:

1. **Decision ID:** D# (next sequential number)
2. **Title:** Brief description
3. **Date:** When decision was made
4. **Rationale:** Why this decision was necessary
5. **What Changed:** Concrete changes made
6. **Impact:** How this affects future development
7. **Enforcement:** How decision is enforced (if applicable)

**Example Template:**
```markdown
### D#: Decision Title (YYYY-MM-DD)

**Decision:** [What was decided]

**Rationale:** [Why this decision was made]

**What Changed:** [Concrete changes]

**Impact:** [How this affects future work]

**Enforcement:** [How decision is enforced, if applicable]
```

---

## Further Reading

- **Architecture:** `docs/ARCHITECTURE.md`
- **Development Guide:** `docs/DEVELOPMENT.md`
- **API Contract:** `POSTD_API_CONTRACT.md`

---

**Questions?** If unsure whether a decision belongs here, ask: "Will future developers need to know WHY we did this?" If yes, document it.

