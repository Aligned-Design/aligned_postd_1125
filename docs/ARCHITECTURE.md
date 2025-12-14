# POSTD Architecture

**Last Updated:** 2025-12-14  
**Status:** Canonical Reference

---

## Repository Structure

```
POSTD/
├── client/               # React frontend (Vite + TypeScript)
│   ├── pages/           # Route components
│   ├── components/      # Reusable UI components
│   ├── hooks/           # Custom React hooks
│   ├── contexts/        # Global state (Auth, Brand, User, Workspace)
│   └── lib/
│       ├── api/         # API client modules (DATA ACCESS LAYER)
│       ├── contracts/   # Zod validation schemas
│       └── guards/      # Route protection guards
├── server/              # Express backend (Node.js + TypeScript)
│   ├── routes/          # API route handlers
│   ├── lib/             # Services and utilities
│   ├── connectors/      # Platform adapters (Meta, LinkedIn, TikTok, GBP)
│   └── queue/           # Job queue processing (Bull + Redis)
├── shared/              # Types shared between client and server
├── supabase/            # Database migrations and RLS policies
├── docs/                # Documentation (this file)
└── scripts/             # Utility scripts (smoke tests, validation)
```

---

## Core Architectural Rules

### 1. Data Access Layer (Enforced)

**Rule:** UI components MUST NOT directly call Supabase, fetch, or other data sources.

**Pattern:**
```
UI Component → React Hook → client/lib/api/* → Server API / Supabase
```

**Implementation:**
- All data access goes through `client/lib/api/*` modules
- Modules organized by domain: `api/brands.ts`, `api/content.ts`, `api/auth.ts`, etc.
- React Query hooks wrap API calls for caching and state management
- **Enforcement:** Automated via `pnpm check:banned` (fails CI on violations)

**Example:**
```typescript
// ✅ CORRECT - Use API layer
import { listBrands } from '@/lib/api/brands';
const brands = await listBrands();

// ❌ WRONG - Direct Supabase call
import { supabase } from '@/lib/supabase';
const { data } = await supabase.from('brands').select();
```

See: `client/lib/api/DATA_ACCESS_COMPLIANCE.md`

---

### 2. Contract Validation (Zod)

**Rule:** All API boundaries MUST validate input/output with Zod schemas.

**Where:**
- `client/lib/contracts/*` - Client-side validation schemas
- `server/routes/*` - Server-side request/response validation
- `shared/*` - Shared type definitions

**Pattern:**
```typescript
// Define contract
export const BrandSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  tenant_id: z.string().uuid(),
});

// Validate at API boundary
const brand = BrandSchema.parse(req.body);
```

**Why:** Type safety + runtime validation prevents invalid data from entering the system.

---

### 3. Authentication & Authorization

**Pattern:** Supabase Auth + Row-Level Security (RLS)

**Auth Flow:**
1. User authenticates via Supabase Auth (OAuth 2.0)
2. JWT token stored in client session
3. All API requests include auth header
4. Server validates JWT + extracts user/tenant
5. Database RLS policies enforce data isolation

**Route Protection:**
- `client/lib/guards/` - Client-side route guards
- Protect sensitive routes with `RequireAuth` wrapper
- Check user roles/permissions before rendering

**Database Security:**
- **Every table** has `tenant_id` column (UUID)
- RLS policies enforce tenant isolation
- Service role key ONLY used server-side
- Public anon key safe for client use

---

### 4. Multi-Tenancy

**Rule:** All data queries MUST filter by `tenant_id`.

**Pattern:**
```typescript
// Server-side query
const brands = await supabase
  .from('brands')
  .select('*')
  .eq('tenant_id', tenantId); // ✅ ALWAYS filter

// Database RLS policy enforces this at DB level
CREATE POLICY "Users see only their tenant's brands"
  ON brands FOR SELECT
  USING (tenant_id = (SELECT tenant_id FROM auth.users WHERE id = auth.uid()));
```

**Enforcement:**
- RLS policies on ALL tables
- Middleware extracts tenant from JWT
- Client hooks automatically include tenant context

---

## Feature Folder Conventions

### Adding a New Feature

1. **API Contract** (`client/lib/contracts/`)
   ```typescript
   // contracts/my-feature.ts
   export const MyFeatureSchema = z.object({ /* ... */ });
   ```

2. **API Client** (`client/lib/api/`)
   ```typescript
   // api/my-feature.ts
   export async function getMyFeature(id: string) {
     return fetch(`/api/my-feature/${id}`).then(r => r.json());
   }
   ```

3. **React Hook** (`client/hooks/`)
   ```typescript
   // hooks/useMyFeature.ts
   export function useMyFeature(id: string) {
     return useQuery(['my-feature', id], () => getMyFeature(id));
   }
   ```

4. **UI Component** (`client/components/` or `client/pages/`)
   ```typescript
   // components/MyFeature.tsx
   export function MyFeature({ id }: Props) {
     const { data } = useMyFeature(id);
     return <div>{data?.name}</div>;
   }
   ```

5. **Server Route** (`server/routes/`)
   ```typescript
   // routes/my-feature.ts
   app.get('/api/my-feature/:id', async (req, res) => {
     const { id } = MyFeatureSchema.parse(req.params);
     const data = await supabase.from('my_feature').select().eq('id', id);
     res.json(data);
   });
   ```

6. **Tests** (`*.test.ts`)
   - Unit tests for API functions
   - Integration tests for routes
   - E2E tests for critical flows

---

## Guardrails in Place

### 1. Banned Terms Check
**Script:** `scripts/check-banned-terms.ts`  
**Command:** `pnpm check:banned`

**Blocks:**
- `@builder.io` (removed dependency)
- `Aligned-20AI` (old branding)
- Direct Supabase calls in UI (`.from`, `.auth`, `.storage`)

**Run automatically via:** `pnpm check` (pre-commit)

---

### 2. Lint Baseline Check
**Script:** `scripts/check-lint-baseline.ts`  
**Command:** `pnpm check:lint-baseline`

**Purpose:** Prevent lint warnings from increasing.

**Baseline:** `tools/lint-baseline.json`
- Current warnings: tracked
- Allowed increase: 0 (by default)
- Goal: reduce warnings over time

**Policy:** New code must not introduce new warnings.

---

### 3. Unified Check Command
**Command:** `pnpm check`

**Runs:**
1. `pnpm lint` - ESLint validation
2. `pnpm check:lint-baseline` - Baseline enforcement
3. `pnpm typecheck` - TypeScript compilation
4. `pnpm test` - Test suite
5. `pnpm check:banned` - Banned terms check

**Usage:** Run before every commit/PR.

---

## Tech Stack Summary

### Frontend
- **React 18** + **TypeScript** - UI framework
- **Vite** - Build tool and dev server
- **TailwindCSS 3** - Styling
- **React Router 6** - Client-side routing (SPA mode)
- **React Query** - Server state management
- **Radix UI** - Accessible component library
- **Zod** - Schema validation

### Backend
- **Node.js 24+** + **Express** - API server
- **TypeScript** - Type safety
- **Supabase (PostgreSQL)** - Database + Auth
- **Bull Queue** + **Redis** - Job processing
- **Socket.io** - Real-time updates

### AI Services
- **Anthropic Claude** - Content generation
- **OpenAI** - AI services

### Platform Connectors
- Meta (Instagram, Facebook)
- LinkedIn
- TikTok
- Google Business Profile
- Mailchimp

---

## Database Architecture

### Tables (High-Level)
- `tenants` - Multi-tenant workspace isolation
- `users` - User accounts (linked to Supabase Auth)
- `brands` - Brand profiles (1 tenant : N brands)
- `brand_kit` - Brand identity (colors, fonts, voice)
- `content_items` - Generated content posts
- `social_accounts` - Connected platform accounts
- `content_queue` - Scheduled publishing queue
- `analytics_events` - Performance tracking

### Key Patterns
- **UUID primary keys** for all tables
- **`tenant_id`** on ALL tables for RLS
- **`brand_id`** for brand-scoped resources
- **Timestamps:** `created_at`, `updated_at` (auto-managed)
- **Soft deletes:** `deleted_at` (nullable)
- **RLS policies** on every table

See: `supabase/migrations/` for full schema

---

## Real-Time Features

**Technology:** Socket.io

**Use Cases:**
- Live content generation progress
- Real-time collaboration updates
- Notification delivery
- Queue status updates

**Implementation:**
- Server: `server/index.ts` (Socket.io server)
- Client: `client/contexts/SocketContext.tsx`

---

## Job Queue (Background Processing)

**Technology:** Bull Queue + Redis

**Use Cases:**
- Content generation (AI calls)
- Social media publishing
- Image processing
- Email notifications
- Analytics aggregation

**Pattern:**
```typescript
// Enqueue job
await contentGenerationQueue.add('generate', { brandId, prompt });

// Worker processes job
contentGenerationQueue.process('generate', async (job) => {
  const { brandId, prompt } = job.data;
  const content = await generateContent(brandId, prompt);
  return content;
});
```

**Location:** `server/queue/`

---

## Routing Conventions

### Client-Side Routes
**File:** `client/App.tsx` (React Router 6)

**Pattern:**
```typescript
<Route path="/brands" element={<BrandsPage />} />
<Route path="/brands/:id" element={<BrandDetailPage />} />
<Route path="/studio" element={<CreativeStudioPage />} />
```

**Protection:**
```typescript
<Route element={<RequireAuth />}>
  <Route path="/dashboard" element={<Dashboard />} />
</Route>
```

### Server-Side Routes
**File:** `server/index.ts` (Express routes)

**Pattern:**
```typescript
app.get('/api/brands', listBrands);
app.post('/api/brands', createBrand);
app.get('/api/brands/:id', getBrand);
app.put('/api/brands/:id', updateBrand);
app.delete('/api/brands/:id', deleteBrand);
```

**Middleware:** Auth, tenant extraction, validation

---

## Environment Configuration

**Required:**
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Public key (client)
- `SUPABASE_SERVICE_KEY` - Service role key (server only)
- `ANTHROPIC_API_KEY` - AI generation
- `OPENAI_API_KEY` - AI services
- `REDIS_HOST` / `REDIS_PORT` - Queue infrastructure
- `TOKEN_VAULT_MASTER_SECRET` - Token encryption

**Optional:**
- `AWS_KMS_KEY_ID` - Enhanced encryption
- `DATADOG_API_KEY` - Monitoring

See: `docs/ENVIRONMENT_VARIABLES.md`

---

## Development Workflow

1. **Setup:** `pnpm install` + `.env` configuration
2. **Dev Server:** `pnpm dev` (port 8080)
3. **Make Changes:** Follow feature folder conventions
4. **Validate:** `pnpm check` (lint, type, test, banned)
5. **Commit:** Descriptive commit messages
6. **PR:** Open pull request for review

---

## Deployment

**Platforms:** Vercel (recommended) or Netlify

**Build:**
```bash
pnpm build
# Outputs:
# - dist/spa/       (client)
# - dist/server/    (server)
```

**Pre-Deploy Checklist:**
- [ ] `pnpm check` passes
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Security audit passed

See: `DEPLOYMENT_GUIDE.md`

---

## Testing Strategy

**Unit Tests:** Vitest (fast, isolated)
**E2E Tests:** Playwright (critical user flows)
**Smoke Tests:** `pnpm scraper:smoke`, `pnpm brand-experience:smoke`

**Coverage Goals:**
- API functions: 80%+
- React hooks: 70%+
- E2E flows: Core user journeys

**Run:** `pnpm test`

---

## Security Posture

- **Authentication:** Supabase Auth (OAuth 2.0)
- **Authorization:** RLS policies + tenant isolation
- **Token Encryption:** AES-256-GCM
- **Input Validation:** Zod schemas at all boundaries
- **CSP Headers:** Helmet.js (Express)
- **Audit Logging:** All mutations logged

---

## Further Reading

- **Development Guide:** `docs/DEVELOPMENT.md`
- **Migration History:** `docs/MIGRATIONS_AND_DECISIONS.md`
- **API Reference:** `POSTD_API_CONTRACT.md`
- **Supabase Schema:** `supabase/migrations/`

---

**Questions?** See `README.md` or `docs/DEVELOPMENT.md`.
