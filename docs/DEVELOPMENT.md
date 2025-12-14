# POSTD Development Guide

**Last Updated:** 2025-12-14  
**Status:** Canonical Reference

---

## Requirements

- **Node.js:** 24.0.0 or higher
- **pnpm:** 10.14.0+ (preferred package manager)
- **Supabase Account:** For database access
- **API Keys:** OpenAI, Anthropic Claude

---

## Quick Setup

### 1. Install Dependencies

```bash
# Clone repository
git clone <repository-url>
cd POSTD

# Install dependencies
pnpm install
```

### 2. Configure Environment

Create `.env` file in project root:

```bash
# Database (Supabase)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# AI Services
ANTHROPIC_API_KEY=your-anthropic-key
OPENAI_API_KEY=your-openai-key

# Infrastructure
REDIS_HOST=localhost
REDIS_PORT=6379
TOKEN_VAULT_MASTER_SECRET=your-master-secret

# Optional
NODE_ENV=development
PORT=3000
```

See `docs/ENVIRONMENT_VARIABLES.md` for complete variable reference.

### 3. Verify Setup

```bash
# Validate environment configuration
pnpm validate:env

# Test Supabase connection
pnpm verify:supabase

# Run full validation suite
pnpm check
```

### 4. Start Development Server

```bash
pnpm dev
```

Application available at: `http://localhost:8080`

---

## Development Commands

### Core Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server (client + server on port 8080) |
| `pnpm build` | Build for production (client + server + vercel-server) |
| `pnpm start` | Start production server |
| `pnpm test` | Run test suite (Vitest) |
| `pnpm typecheck` | TypeScript type checking |
| `pnpm lint` | Lint code (ESLint) |
| `pnpm lint:fix` | Auto-fix linting issues |
| `pnpm format.fix` | Auto-fix code formatting (Prettier) |

### Validation Commands

| Command | Description |
|---------|-------------|
| `pnpm check` | **Run before every commit** (lint + typecheck + test + banned terms) |
| `pnpm check:banned` | Check for banned terms/patterns |
| `pnpm check:lint-baseline` | Verify lint warnings don't increase |
| `pnpm validate:env` | Validate environment variables |
| `pnpm validate:security` | Run security checks |
| `pnpm verify:supabase` | Test Supabase connection |

### Smoke Test Commands

| Command | Description |
|---------|-------------|
| `pnpm scraper:smoke` | Scraper + brand kit health check |
| `pnpm brand-experience:smoke` | Content pipeline E2E verification |
| `pnpm brands:list` | List brands in database |

### Utility Commands

| Command | Description |
|---------|-------------|
| `pnpm backfill:brand-kit` | Backfill missing brand_kit data |
| `pnpm audit:customer` | Customer-facing experience audit |
| `pnpm security:check` | Run security audit (npm audit + validation) |

---

## How to Add a Feature

Follow this exact pattern to maintain consistency and quality:

### Step 1: Create Contract Schema

**File:** `client/lib/contracts/my-feature.ts`

```typescript
import { z } from 'zod';

export const MyFeatureSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  tenant_id: z.string().uuid(),
  created_at: z.string().datetime(),
});

export type MyFeature = z.infer<typeof MyFeatureSchema>;
```

**Why:** Defines the shape of data at the boundary (runtime validation + TypeScript types).

---

### Step 2: Create API Client Module

**File:** `client/lib/api/my-feature.ts`

```typescript
import { MyFeature, MyFeatureSchema } from '@/lib/contracts/my-feature';

export async function listMyFeatures(): Promise<MyFeature[]> {
  const response = await fetch('/api/my-features');
  if (!response.ok) throw new Error('Failed to fetch features');
  const data = await response.json();
  return z.array(MyFeatureSchema).parse(data);
}

export async function getMyFeature(id: string): Promise<MyFeature> {
  const response = await fetch(`/api/my-features/${id}`);
  if (!response.ok) throw new Error('Failed to fetch feature');
  const data = await response.json();
  return MyFeatureSchema.parse(data);
}

export async function createMyFeature(input: Omit<MyFeature, 'id' | 'created_at'>): Promise<MyFeature> {
  const response = await fetch('/api/my-features', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error('Failed to create feature');
  const data = await response.json();
  return MyFeatureSchema.parse(data);
}
```

**Why:** Centralizes all API calls in one place (no direct fetch in UI).

---

### Step 3: Create React Hook

**File:** `client/hooks/useMyFeature.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listMyFeatures, getMyFeature, createMyFeature } from '@/lib/api/my-feature';

export function useMyFeatures() {
  return useQuery({
    queryKey: ['my-features'],
    queryFn: listMyFeatures,
  });
}

export function useMyFeature(id: string) {
  return useQuery({
    queryKey: ['my-feature', id],
    queryFn: () => getMyFeature(id),
    enabled: !!id,
  });
}

export function useCreateMyFeature() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createMyFeature,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-features'] });
    },
  });
}
```

**Why:** Abstracts data fetching logic (caching, loading states, error handling).

---

### Step 4: Create UI Component

**File:** `client/components/MyFeatureList.tsx`

```typescript
import { useMyFeatures } from '@/hooks/useMyFeature';
import { Card } from '@/components/ui/card';

export function MyFeatureList() {
  const { data: features, isLoading, error } = useMyFeatures();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="space-y-4">
      {features?.map((feature) => (
        <Card key={feature.id}>
          <h3>{feature.name}</h3>
        </Card>
      ))}
    </div>
  );
}
```

**Why:** Component focuses on presentation only (no data fetching logic).

---

### Step 5: Create Server Route

**File:** `server/routes/my-feature.ts`

```typescript
import { Router, Request, Response } from 'express';
import { MyFeatureSchema } from '../../client/lib/contracts/my-feature';
import { supabase } from '../lib/supabase';

const router = Router();

router.get('/api/my-features', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id; // From auth middleware
    if (!tenantId) return res.status(401).json({ error: 'Unauthorized' });

    const { data, error } = await supabase
      .from('my_features')
      .select('*')
      .eq('tenant_id', tenantId); // ✅ ALWAYS filter by tenant

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching features:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/api/my-features', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) return res.status(401).json({ error: 'Unauthorized' });

    // Validate input
    const input = MyFeatureSchema.omit({ id: true, created_at: true }).parse(req.body);

    const { data, error } = await supabase
      .from('my_features')
      .insert({ ...input, tenant_id: tenantId })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('Error creating feature:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
```

**Register in `server/index.ts`:**
```typescript
import myFeatureRoutes from './routes/my-feature';
app.use(myFeatureRoutes);
```

---

### Step 6: Add Tests

**File:** `client/lib/api/my-feature.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { listMyFeatures } from './my-feature';

describe('listMyFeatures', () => {
  it('fetches and validates features', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ id: '123', name: 'Test', tenant_id: '456', created_at: '2025-01-01T00:00:00Z' }],
    });

    const features = await listMyFeatures();
    expect(features).toHaveLength(1);
    expect(features[0].name).toBe('Test');
  });

  it('throws on failed fetch', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false });
    await expect(listMyFeatures()).rejects.toThrow('Failed to fetch features');
  });
});
```

---

## Code Style Guidelines

### TypeScript

- **Strict mode enabled:** No `any` types
- **Explicit return types:** For all functions
- **Named exports:** Prefer named exports over default exports

### React

- **Functional components:** Use hooks (no class components)
- **TypeScript props:** Always type component props
- **Composition:** Small, reusable components

### Styling

- **TailwindCSS:** Primary styling approach
- **Utility-first:** Use Tailwind classes directly
- **Component variants:** Use `class-variance-authority` for complex variations
- **Responsive:** Mobile-first design

### Naming Conventions

- **Files:** `kebab-case.ts`, `PascalCase.tsx` (components)
- **Functions:** `camelCase`
- **Components:** `PascalCase`
- **Constants:** `UPPER_SNAKE_CASE`
- **Types:** `PascalCase`

---

## Debugging Tips

### Frontend Debugging

```typescript
// Use React Query DevTools
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

<ReactQueryDevtools initialIsOpen={false} />
```

### Backend Debugging

```typescript
// Add logging
console.log('[DEBUG]', { userId, tenantId, data });

// Use breakpoints
debugger;
```

### Database Debugging

```bash
# Direct Supabase SQL console
# https://app.supabase.com/project/YOUR_PROJECT/sql/

# Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'your_table';
```

---

## Common Issues

### Issue: TypeScript errors after pulling latest

**Solution:**
```bash
pnpm install
pnpm typecheck
```

### Issue: Port 8080 already in use

**Solution:**
```bash
# Kill process using port 8080
lsof -ti:8080 | xargs kill -9

# Or use different port
PORT=3001 pnpm dev
```

### Issue: Supabase connection fails

**Solution:**
```bash
# Verify credentials
pnpm verify:supabase

# Check .env file
cat .env | grep SUPABASE
```

### Issue: Redis connection fails

**Solution:**
```bash
# Start Redis locally
redis-server

# Or use Docker
docker run -d -p 6379:6379 redis:7-alpine
```

---

## Git Workflow

### Branch Naming

- **Features:** `feature/my-feature-name`
- **Fixes:** `fix/bug-description`
- **Chores:** `chore/task-description`

### Commit Messages

```
feat: add MyFeature component
fix: resolve brand selection bug
chore: update dependencies
docs: improve setup guide
```

### Before Committing

```bash
# Run full validation
pnpm check

# Should output:
# ✅ Lint: PASS
# ✅ Lint baseline: PASS
# ✅ TypeScript: PASS
# ✅ Tests: PASS
# ✅ Banned terms: PASS
```

### Pull Request Checklist

- [ ] `pnpm check` passes
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No console errors in browser
- [ ] Tested locally in dev mode
- [ ] No regressions in related features

---

## Testing Guidelines

### Unit Tests (Vitest)

```typescript
import { describe, it, expect } from 'vitest';

describe('MyFunction', () => {
  it('should do something', () => {
    expect(myFunction()).toBe(expected);
  });
});
```

**Run:** `pnpm test`

### E2E Tests (Playwright)

```typescript
import { test, expect } from '@playwright/test';

test('user can create brand', async ({ page }) => {
  await page.goto('/brands');
  await page.click('text=New Brand');
  await page.fill('input[name="name"]', 'Test Brand');
  await page.click('button[type="submit"]');
  await expect(page.locator('text=Test Brand')).toBeVisible();
});
```

**Run:** `pnpm e2e`

### Smoke Tests

```bash
# Test scraper + brand kit pipeline
SCRAPER_TEST_BRAND_ID_1=<uuid> pnpm scraper:smoke

# Test content generation flow
BRAND_EXPERIENCE_TEST_BRAND_ID=<uuid> pnpm brand-experience:smoke
```

---

## Performance Optimization

### Frontend

- **Code splitting:** Use `React.lazy()` for large components
- **Image optimization:** Use WebP format, lazy loading
- **Bundle size:** Monitor with `pnpm build` output
- **React Query caching:** Configure stale time appropriately

### Backend

- **Database indexes:** Add indexes for frequently queried columns
- **Query optimization:** Use `.select()` to fetch only needed fields
- **Caching:** Use Redis for frequently accessed data
- **Rate limiting:** Protect expensive endpoints

---

## Security Best Practices

### Client-Side

- ❌ Never store secrets in client code
- ❌ Never use service role key in client
- ✅ Use anon key for Supabase (RLS protects data)
- ✅ Validate all user input with Zod

### Server-Side

- ✅ Always validate JWT tokens
- ✅ Always filter by `tenant_id`
- ✅ Validate all inputs with Zod
- ✅ Use parameterized queries (prevent SQL injection)
- ✅ Log all mutations for audit trail

---

## Deployment

### Pre-Deployment Checklist

```bash
# Validate everything
pnpm check

# Build production bundles
pnpm build

# Test production build locally
pnpm start
```

### Environment Variables (Production)

Ensure all required variables are set in Vercel/Netlify:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`
- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `REDIS_HOST`
- `REDIS_PORT`
- `TOKEN_VAULT_MASTER_SECRET`

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

See: `DEPLOYMENT_GUIDE.md` for full instructions

---

## Further Reading

- **Architecture:** `docs/ARCHITECTURE.md`
- **Migration History:** `docs/MIGRATIONS_AND_DECISIONS.md`
- **API Contract:** `POSTD_API_CONTRACT.md`
- **Environment Setup:** `docs/ENVIRONMENT_VARIABLES.md`

---

**Questions?** See `README.md` or open an issue.

