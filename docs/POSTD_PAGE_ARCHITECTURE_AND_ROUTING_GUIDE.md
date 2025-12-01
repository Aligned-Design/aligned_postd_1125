# POSTD Page Architecture & Routing Guide

**Purpose:**  
This document defines how POSTD pages are structured, where new pages should live, and how routing must be updated. It exists to prevent duplicate/legacy pages and keep the UI consistent.

---

## 1. High-Level Rules

1. **Authenticated app pages**  
   - Must live under:  
     `client/app/(postd)/<feature>/page.tsx`

2. **Public/marketing/legal/blog pages**  
   - Must live under:  
     `client/app/(public)/<section>/page.tsx`

3. **`client/pages/` is *not* for new feature work**  
   - This directory is reserved for:
     - `client/pages/Index.tsx` (landing)
     - `client/pages/Pricing.tsx`
     - `client/pages/Onboarding.tsx`
     - `client/pages/NotFound.tsx`
     - `client/pages/onboarding/*` (onboarding step screens)
     - `_legacy/` and `_experiments/` subdirectories

4. **Routing must be documented**
   - Every routed page must be:
     - Registered in the main router (`client/App.tsx` or equivalent)
     - Described in `CLIENT_ROUTING_MAP.md`
     - Reflected in any sitemap / IA docs

---

## 2. Directory Structure

### 2.1 Authenticated App Pages

All core POSTD app surfaces live here:

```txt
client/
  app/
    (postd)/
      dashboard/
        page.tsx
      calendar/
        page.tsx
      queue/
        page.tsx
      studio/
        page.tsx
      campaigns/
        page.tsx
      brands/
        page.tsx
      brand-intake/
        page.tsx
      brand-guide/
        page.tsx
      brand-snapshot/
        page.tsx
      brand-intelligence/
        page.tsx
      analytics/
        page.tsx
      reporting/
        page.tsx
      paid-ads/
        page.tsx
      library/
        page.tsx
      client-portal/
        page.tsx
      events/
        page.tsx
      reviews/
        page.tsx
      linked-accounts/
        page.tsx
      settings/
        page.tsx
      client-settings/
        page.tsx
      billing/
        page.tsx
      insights-roi/
        page.tsx
      admin/
        page.tsx
      _experiments/
        BatchCreativeStudio.tsx
        AdminBilling.tsx
```

**When adding a new authenticated feature:**
- Create `client/app/(postd)/<feature>/page.tsx`
- Do NOT create `client/pages/<Feature>.tsx`

### 2.2 Public Pages

Public marketing + legal + blog live here:

```txt
client/
  app/
    (public)/
      blog/
        page.tsx
        [slug]/
          page.tsx
      legal/
        privacy-policy/
          page.tsx
        terms/
          page.tsx
        cookies/
          page.tsx
        data-deletion/
          page.tsx
        acceptable-use/
          page.tsx
        refunds/
          page.tsx
        api-policy/
          page.tsx
        ai-disclosure/
          page.tsx
        security/
          page.tsx
```

---

## 3. `client/pages/` – What's Allowed

`client/pages/` is a compatibility/legacy folder. Only the following are allowed here:

- `Index.tsx` – landing route `/`
- `Pricing.tsx` – `/pricing`
- `Onboarding.tsx` – `/onboarding`
- `NotFound.tsx` – `*` catch-all
- `onboarding/Screen*.tsx` – step screens used by `Onboarding.tsx`
- `_legacy/*` – archived, unused pages
- `_experiments/*` – experimental/scratch pages that are not routed in production

**Rules:**
- Do not add new production features to `client/pages/`.
- Any page under `client/pages/` that is no longer routed should be moved into `client/pages/_legacy/`.

---

## 4. Standard Page Structure (App Pages)

All new `client/app/(postd)` pages should follow a consistent structure:

- Use the shared layout components:
  - `PageShell`
  - `PageHeader`
  - Shared `Card`, `Section`, etc.
- Use standardized states:
  - `LoadingState`
  - `ErrorState`
  - `EmptyState`
- Use typed API hooks and utilities:
  - e.g. `useDashboardData`, `useAnalytics`
- Use logging helpers:
  - `logError`, `logWarning` (not `console.log`/`console.error`)

**Example skeleton:**

```typescript
// client/app/(postd)/example-feature/page.tsx

import { PageShell, PageHeader } from "@/components/postd/layout";
import { LoadingState, ErrorState, EmptyState } from "@/components/postd/states";
import { useExampleFeatureData } from "@/hooks/useExampleFeatureData";
import { logError } from "@/lib/logging";

export default function ExampleFeaturePage() {
  const { data, isLoading, isError, error } = useExampleFeatureData();

  if (isLoading) return <LoadingState label="Loading example feature" />;
  if (isError) {
    logError("Failed to load example feature", { error });
    return <ErrorState title="Something went wrong" />;
  }
  if (!data || data.length === 0) {
    return (
      <PageShell>
        <PageHeader title="Example Feature" subtitle="Nothing here yet" />
        <EmptyState
          title="No items yet"
          description="Start by creating your first item."
        />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Example Feature"
        subtitle="Manage your example entities here."
      />
      {/* Main content goes here */}
    </PageShell>
  );
}
```

---

## 5. How to Add a New Page (End-to-End)

When you add a new POSTD page, follow this sequence:

1. **Create the page file**
   - Authenticated: `client/app/(postd)/<feature>/page.tsx`
   - Public: `client/app/(public)/<section>/page.tsx`

2. **Wire it into routing**
   - Open `client/App.tsx` (or the main routing file).
   - Add a new `<Route>` pointing to the new page component.
   - Ensure it is behind the correct auth/role guard.

3. **Update docs**
   - Add the route to `CLIENT_ROUTING_MAP.md`:
     - Path
     - Component
     - Auth requirements (public vs authenticated vs admin)
   - If applicable, update the sitemap / IA doc.

4. **Check conventions**
   - Uses `PageShell` + `PageHeader`
   - Uses shared states (`LoadingState`, `ErrorState`, `EmptyState`)
   - Uses logging helpers (`logError`, `logWarning`)

5. **Run checks**
   - `pnpm lint`
   - `pnpm build`
   - Manually hit the route in a dev build and confirm it loads with no console errors.

---

## 6. Experiments & Legacy Pages

### 6.1 Experiments

Experimental UIs should be clearly marked and isolated:

- Place them under:
  - `client/app/(postd)/_experiments/` or
  - `client/pages/_experiments/`
- Add a banner comment at the top:

```typescript
// EXPERIMENTAL PAGE
// Not wired into production routing.
// If you plan to ship this, integrate it into app/(postd) routing,
// add proper guards, and update CLIENT_ROUTING_MAP.md and the sitemap.
```

- Do not ship experiments without:
  - Product approval
  - Routing wired
  - Docs updated

### 6.2 Legacy / Archived Pages

When a page is removed from routing but kept temporarily:

- Move it into `client/pages/_legacy/` (mirroring its original name)
- Add a banner comment:

```typescript
// LEGACY PAGE (archived)
// This page is no longer routed or imported.
// Canonical implementation lives under client/app/(postd)/... (if applicable).
// Safe to delete after one or two stable releases.
```

- Ensure there are no imports from `_legacy` in active code.

---

## 7. Routing & Sitemap Alignment

Whenever you change routes:

1. **Update the router**
   - `client/App.tsx` (or equivalent) must reflect the actual routes and any aliases.

2. **Update `CLIENT_ROUTING_MAP.md`**
   - Add/change/remove the route entry.
   - Note any aliases (e.g. `/queue` and `/content-queue` both map to Content Queue).
   - For aliases, call out which path is canonical.

3. **Update sitemap / IA docs**
   - User-facing navigation docs should list only the canonical routes.

---

## 8. "Do Not Do This" Checklist

To avoid future chaos:

- ❌ Do NOT add new feature pages directly under `client/pages/`.
- ❌ Do NOT reintroduce `@postd/layout/AppShell` or old `@/components/dashboard/**` wrappers.
- ❌ Do NOT add routes without updating `CLIENT_ROUTING_MAP.md`.
- ❌ Do NOT leave experimental pages in locations that look like shipped features.
- ❌ Do NOT keep multiple competing implementations of the same page in different directories.

**If in doubt:**
- Put new app pages in `client/app/(postd)/...`
- Put public pages in `client/app/(public)/...`
- Archive old things in `_legacy/`
- Mark experiments explicitly in `_experiments/`

---

This guide is the source of truth for POSTD page structure and routing. Any new page or route should conform to this document.

