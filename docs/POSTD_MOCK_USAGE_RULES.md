# POSTD Mock Usage Rules

**Purpose**: Clear rules for when and how mocks/demos can be used in POSTD.  
**Status**: Enforced - Any violation in production paths is treated as a bug.  
**Last Updated**: 2025-01-20

---

## Why This Exists

POSTD had a history of demo/mock data in production routes. We've removed them and want to keep it that way. This doc sets the rules so we never reintroduce fake data into production code paths. Production code must use real data, honest empty states, or clearly marked "coming soon" UI.

---

## Golden Rules

- **Mocks are for tests and demos. Not production.**
- **If a feature isn't wired yet, show "coming soon" or an honest empty state. Never fake data.**
- **If you need demo experience, use Storybook, fixtures, or dev-only playground routes.**
- **Honest emptiness is better than fake fullness.**

---

## Where Mocks ARE Allowed

### ✅ Test Files
- `__tests__/` directories
- `*.test.ts`, `*.test.tsx`, `*.spec.ts` files
- `vitest.setup.ts` and test configuration files
- Test fixtures in `server/__tests__/fixtures.ts` or `__tests__/fixtures/`

**Example**: 
```typescript
// ✅ ALLOWED: server/__tests__/fixtures.ts
export const MOCK_BRAND_DATA = { ... };
```

### ✅ Storybook Stories
- `.stories.tsx` files
- Storybook-specific mock data files

**Example**:
```typescript
// ✅ ALLOWED: client/components/ui/button.stories.tsx
export default {
  component: Button,
  args: { children: "Mock Storybook Button" }
};
```

### ✅ Dev Scripts
- Files in `server/scripts/*` (seed scripts, demo data generators)
- Development-only utilities

**Example**:
```typescript
// ✅ ALLOWED: server/scripts/seed-demo-data.ts
const demoBrands = [ ... ];
```

### ✅ Dev-Only Playground Routes
- Routes clearly marked as dev-only (e.g., `/_dev/`, `/_playground/`)
- Not linked from main navigation
- Clearly documented as dev/demo only

---

## Where Mocks Are NOT Allowed

### ❌ Production Routes
- **Any file under `client/app/(postd)/**`** (real app routes)
- All pages: `/dashboard`, `/library`, `/analytics`, `/billing`, `/reviews`, `/events`, etc.

### ❌ Production API Routes
- **Any `server/routes/**` that serves real tenants**
- Routes like `/api/billing/status`, `/api/media/list`, `/api/events`, etc.

### ❌ Shared Production Components
- **Components in `client/components/dashboard/**`** used by production routes
- **Shared libraries** used by production code paths

### ❌ Production Jobs & Workers
- **Files in `server/workers/**`**
- **Files matching `server/lib/*-job.ts`** (performance tracking, analytics jobs, etc.)

**Rule of thumb**: If it can touch real tenant data or is reachable by real users in production, it must not use mock/fake/demo data.

---

## Acceptable "Not Ready Yet" Patterns

When a feature isn't implemented yet, use these patterns instead of mocks:

### ✅ API Returns Empty Array
```typescript
// ✅ GOOD: Return empty array
const reports = await fetchReports();
if (!reports || reports.length === 0) {
  return { reports: [] };
}
```

### ✅ UI Shows "Coming Soon"
```typescript
// ✅ GOOD: Show honest "coming soon" state
{!hasFeature && (
  <div className="text-center py-12">
    <h3>Feature Coming Soon</h3>
    <p>This feature is in development and will be available soon.</p>
  </div>
)}
```

### ✅ API Returns Controlled Error
```typescript
// ✅ GOOD: Return 501 or clear error
if (!isImplemented) {
  return res.status(501).json({ 
    error: "Feature not yet implemented",
    comingSoon: true 
  });
}
```

### ✅ Job Returns null and Logs Warning
```typescript
// ✅ GOOD: Log warning, return null (don't use mock)
console.warn("Feature not yet implemented", { contentId });
return null;
```

**Remember**: Honest emptiness is better than fake fullness. Users trust you more when you're transparent.

---

## Patterns That Are Now BANNED

These patterns were removed and must not be reintroduced:

### ❌ Hard-Coded Demo Arrays
```typescript
// ❌ BANNED: Hard-coded demo data in production routes
const MOCK_REPORTS = [{ id: "1", name: "Demo Report" }, ...];
export default function Reporting() {
  const [reports] = useState(MOCK_REPORTS); // ❌ NO
}
```

### ❌ MOCK_* Exports in Production
```typescript
// ❌ BANNED: Mock exports imported into production components
import { MOCK_BRAND_GUIDE } from "@/types/review"; // ❌ NO
```

### ❌ Unsplash Placeholder URLs
```typescript
// ❌ BANNED: Unsplash URLs as placeholders
const imageUrl = `https://images.unsplash.com/photo-...`; // ❌ NO

// ✅ GOOD: SVG data URI placeholder
const imageUrl = `data:image/svg+xml,${encodeURIComponent(`<svg>...</svg>`)}`;
```

### ❌ USE_MOCKS Feature Flags
```typescript
// ❌ BANNED: Feature flags that enable mocks in production
if (process.env.USE_MOCKS === "true") {
  return mockData; // ❌ NO
}
```

### ❌ Mock Fallbacks in Error Handling
```typescript
// ❌ BANNED: Fall back to mock data on error
catch (error) {
  return getMockData(); // ❌ NO
}

// ✅ GOOD: Show error state
catch (error) {
  setError("Failed to load data");
  return null;
}
```

---

## How To Add New Mocks The Right Way

### For Tests
1. Put mock data in `server/__tests__/fixtures.ts` or component-specific `__tests__/fixtures/`
2. Import only in test files: `import { MOCK_BRAND } from "./fixtures";`
3. Add comment: `// TEST ONLY: Mock data for tests`

### For Storybook
1. Define mock data inside `.stories.tsx` files
2. Don't export mock data from shared component files
3. Keep stories self-contained

### For Dev Playgrounds
1. Create routes under a clearly marked path: `/_dev/playground` or `/_demo/example`
2. Add to route file: `// DEV ONLY: Not accessible in production`
3. Don't link from main navigation
4. Gate behind environment check if needed: `if (NODE_ENV !== "development") return null;`

### Marking Mock Functions
Always add clear comments:
```typescript
/**
 * @deprecated DO NOT USE IN PRODUCTION - Test/demo only
 * This function is kept for testing purposes but must never be called in production code paths.
 */
export function generateMockAssets() { ... }
```

---

## Enforcement & Checks

We run regular audits to catch violations:

### Automated Checks
- **No-Mock Regression Sweeps**: Searches for `mock`, `MOCK_`, `fake`, `demo`, `Unsplash` in production paths
- **Type checking**: Catches type errors that might indicate mock usage
- **Linter rules**: Flags suspicious patterns

### Manual Audits
- **Live vs Mock Audit** (`docs/POSTD_LIVE_VS_MOCK_AUDIT.md`): Comprehensive review of all mock usage
- **Go-Live Checklist** (`docs/GO_LIVE_CHECKLIST.md`): Pre-deployment verification

### What Happens If You Violate
- Any `PROD_PATH` mock usage discovered in audits is treated as a **bug**
- Must be fixed before production deploy
- Will be flagged in code review

---

## Common Questions

**Q: Can I use mock data during local development?**  
A: Yes, but keep it in dev scripts or clearly marked dev-only routes. Never in production route components.

**Q: What if the API isn't ready yet?**  
A: Show "coming soon" UI, return empty arrays, or return controlled errors. Never fake the response.

**Q: Can I use placeholder images?**  
A: Yes, but use SVG data URIs (inline), not external Unsplash URLs. See `client/app/(postd)/events/page.tsx` for the pattern.

**Q: What about demo data for onboarding?**  
A: Onboarding should create real brands/assets. If you need demos, create them in seed scripts, not in production onboarding flow.

**Q: Can I export mock data for Storybook?**  
A: Yes, but mark it clearly: `// STORYBOOK ONLY: Do not import in production routes`

---

## TL;DR

- **Mocks live in tests, stories, and dev scripts.**
- **Production code either uses real data or honest empty/error/coming-soon states.**
- **No Unsplash placeholders. No fake metrics. No demo invoices.**
- **If it's not ready, say so. Users trust transparency.**

---

**Related Docs**:
- `docs/GO_LIVE_CHECKLIST.md` - Pre-deployment verification
- `docs/POSTD_LIVE_VS_MOCK_AUDIT.md` - Complete audit report
- `POSTD_NO_MOCK_REGRESSION_REPORT.md` - Latest sweep results

