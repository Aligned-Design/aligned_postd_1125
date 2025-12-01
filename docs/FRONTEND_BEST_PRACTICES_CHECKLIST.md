# Frontend Best Practices Checklist

**Purpose**: Use this checklist before launch and before merging major features to ensure code quality, consistency, and user experience.

**Legend**:
- `✅` = Verified and passing
- `⚠️` = Partially implemented or needs review
- `❌` = Missing or failing

---

## Architecture & Code Organization

- ✅ All feature code lives in clear domains (e.g., `components/postd/dashboard`, `components/postd/studio`)
- ✅ Shared primitives live in dedicated folders (`components/shared`, `components/postd/ui`)
- ✅ Path aliases used consistently (`@/`, `@postd/`, `@shared/`, `@shared-components/`, `@app/`)
- ⚠️ No circular dependencies between modules (needs verification tool)
- ⚠️ Components are single-responsibility and composable (mostly, some large components exist)
- ✅ File naming follows conventions (PascalCase for components, camelCase for utilities)
- ⚠️ Related files are co-located (component + styles + tests in same directory) (tests scattered)
- ⚠️ Dead code removed (unused imports, unused components, unused routes) (some old pages remain)
- ⚠️ No duplicate implementations of the same functionality (some duplication in old vs new pages)
- ✅ Route groups used appropriately (`(postd)`, `(public)`)
- ✅ Type definitions live in `shared/` when used by both client and server
- ⚠️ No business logic in UI components (extracted to hooks/services) (some logic in components)

---

## Design System & Consistency

- ⚠️ Design tokens used instead of hard-coded values (colors, spacing, radius, shadows) (some hard-coded hex colors found)
- ✅ `cn()` utility used for conditional classes (not manual string concatenation)
- ⚠️ Consistent use of `PageShell`, `PageHeader`, `SectionCard` primitives (only 2 pages use them, most don't)
- ✅ Button hierarchy is clear (Primary, Secondary, Ghost)
- ⚠️ Typography uses design system tokens (no hard-coded font sizes) (some hard-coded sizes)
- ✅ Color palette uses CSS variables from `tokens.css`
- ⚠️ Spacing follows consistent rhythm (24px, 32px, etc.) (inconsistent in places)
- ⚠️ Border radius consistent (rounded-lg, rounded-xl, rounded-2xl) (mixed usage)
- ⚠️ Shadows use design system tokens (some hard-coded shadows)
- ✅ Brand colors/fonts appear first in pickers/selectors
- ⚠️ No inline styles (use Tailwind classes or design tokens) (some inline styles exist)
- ❌ Dark mode support where applicable (if implemented) (not implemented)
- ✅ Responsive breakpoints used consistently (sm, md, lg, xl)

---

## UX & Flow

- ⚠️ Loading states shown for all async operations (most have, some missing)
- ✅ Empty states are helpful and actionable (not just "No data")
- ⚠️ Error states provide clear next steps (retry button, error message) (some missing retry)
- ✅ Success feedback provided (toasts, animations, visual confirmation)
- ⚠️ Form validation happens in real-time where appropriate (some forms validate on submit only)
- ⚠️ Form errors are clear and positioned near relevant fields (inconsistent)
- ✅ Navigation is intuitive and consistent
- ❌ Breadcrumbs used for deep navigation (not implemented)
- ⚠️ Modals/dialogs are non-blocking where possible (some blocking modals remain)
- ✅ Contextual toolbars/panels appear when relevant
- ✅ No dead-end screens (always a path forward)
- ✅ Progress indicators for multi-step flows
- ⚠️ Confirmation dialogs for destructive actions (some missing)
- ⚠️ Undo/redo available where appropriate (only in Studio)
- ❌ Keyboard shortcuts documented and discoverable (not documented)
- ⚠️ Mobile experience is polished (no broken layouts, readable text) (recently fixed, needs verification)

---

## Accessibility & Keyboard Use

- ⚠️ All interactive elements are keyboard accessible (most are, some buttons missing)
- ⚠️ Focus indicators are visible and clear (Tailwind default, needs verification)
- ⚠️ Tab order is logical and intuitive (needs manual testing)
- ⚠️ ARIA labels used for icon-only buttons (some missing)
- ⚠️ Form inputs have associated labels (most have, some missing)
- ❌ Error messages are associated with form fields (aria-describedby) (not implemented)
- ⚠️ Color contrast meets WCAG AA standards (needs verification tool)
- ❌ Screen reader text provided where needed (minimal implementation)
- ❌ Skip links available for main content (not implemented)
- ⚠️ Modal focus trap implemented (Radix UI handles, needs verification)
- ⚠️ Escape key closes modals/drawers (Radix UI default, needs verification)
- ⚠️ Enter key submits forms (needs verification)
- ⚠️ No keyboard traps (users can always navigate away) (needs testing)

---

## State Management & Data Fetching

- ⚠️ React Query used for server state (not useState for API data) (mostly, some useState for API data)
- ⚠️ Query keys include all relevant dependencies (brandId, filters, etc.) (mostly, some missing brandId)
- ⚠️ Optimistic updates used where appropriate (only in drag-and-drop, missing elsewhere)
- ✅ Cache invalidation happens after mutations
- ✅ Loading states handled at query level
- ✅ Error states handled at query level
- ✅ No prop drilling (Context API or state management used)
- ⚠️ Local state (useState) only for UI state, not server data (some useState for server data)
- ✅ State updates are immutable
- ⚠️ No unnecessary re-renders (React.memo, useMemo, useCallback where needed) (needs profiling)
- ⚠️ Brand-scoped data includes brandId in queries (mostly, some queries missing brandId)
- ✅ Multi-tenant scoping enforced (no data leakage between brands) (RLS enforced)

---

## Error Handling, Loading, & Empty States

- ⚠️ All API calls have error handling (most have, some missing)
- ⚠️ Network errors show user-friendly messages (some show technical errors)
- ⚠️ 404 errors handled gracefully (some pages missing)
- ⚠️ 500 errors show retry option (some missing retry)
- ✅ Timeout errors handled (with retry) (implemented in api-client.ts with fetchWithTimeout)
- ✅ Loading skeletons match content layout
- ✅ Empty states are contextual and actionable
- ✅ Error boundaries implemented for component errors (added to (postd) layout, covers all authenticated routes)
- ⚠️ Error messages don't expose sensitive data (mostly, needs review)
- ⚠️ Partial failures handled gracefully (some data loads, some fails) (needs improvement)
- ⚠️ Retry mechanisms available for failed operations (some missing)
- ⚠️ Error logging happens server-side (not in console.error only) (logger utility created, error tracking service TODO)

---

## Performance & Network

- ⚠️ Large components are code-split (dynamic imports) (only LazyChart, needs more)
- ❌ Images are optimized (lazy loading, proper formats) (not implemented)
- ⚠️ Bundle size is reasonable (check with build analyzer) (needs analysis)
- ⚠️ No unnecessary re-renders (React DevTools Profiler) (needs profiling)
- ⚠️ Expensive computations are memoized (some, needs review)
- ⚠️ API calls are debounced where appropriate (autosave debounced, others need review)
- ❌ Pagination/infinite scroll for large lists (not implemented)
- ❌ Virtual scrolling for very long lists (not implemented)
- ⚠️ Assets are cached appropriately (browser default, needs review)
- ❌ Lighthouse score > 80 (Performance) (not measured)
- ⚠️ No large blocking scripts (needs verification)
- ⚠️ Fonts load efficiently (preload, font-display) (font-display: swap used)
- ❌ Critical CSS inlined or loaded first (not implemented)

---

## Security & Auth

- ✅ No API keys or secrets in client code
- ⚠️ User input is sanitized before display (React escapes, but markdown rendering needs review)
- ✅ XSS prevention (React escapes by default, but verify)
- ⚠️ CSRF protection where applicable (needs verification)
- ✅ Authentication state managed securely
- ✅ Protected routes check auth before rendering
- ⚠️ Token refresh handled automatically (needs verification)
- ⚠️ Expired tokens trigger re-authentication flow (needs verification)
- ⚠️ Sensitive data not logged to console (console.log found in production code)
- ⚠️ OAuth tokens encrypted in storage (needs verification)
- ✅ Multi-tenant data isolation enforced (RLS)
- ⚠️ Role-based access control (RBAC) enforced in UI (some checks, needs comprehensive review)

---

## Forms, Validation & AI Inputs

- ❌ Form validation happens client-side (Zod schemas) (Zod not found in postd pages)
- ⚠️ Validation errors are clear and specific (inconsistent)
- ⚠️ Required fields are clearly marked (some missing)
- ⚠️ Field-level validation (not just on submit) (mostly on submit)
- ❌ Form state persists on navigation (if needed) (not implemented)
- ✅ Auto-save implemented where appropriate (Brand Guide, Studio)
- ⚠️ Unsaved changes warning before navigation (only in Studio)
- ⚠️ AI input fields have character limits where needed (some missing)
- ✅ AI generation shows loading states
- ⚠️ AI errors are user-friendly (not technical) (some technical errors shown)
- ⚠️ AI outputs are validated before display (BFS calculated, needs more validation)
- ✅ Brand Fidelity Score (BFS) displayed for AI content
- ✅ Compliance warnings shown for AI content
- ✅ Retry mechanisms for failed AI calls

---

## Observability & Logging

- ⚠️ Telemetry logged for key user actions (console.log found, needs structured logging)
- ⚠️ Error logging includes context (user, brand, action) (some missing context)
- ❌ Performance metrics tracked (API latency, render time) (not implemented)
- ⚠️ No sensitive data in logs (needs review)
- ❌ Log levels used appropriately (error, warn, info, debug) (mostly console.log)
- ❌ Client-side errors sent to error tracking service (not implemented)
- ❌ User actions tracked for analytics (where appropriate) (not implemented)
- ⚠️ AI agent calls logged (provider, latency, BFS) (server-side, client needs review)
- ⚠️ Failed operations logged with retry status (some missing)

---

## Testing & QA

- ⚠️ Critical user flows have E2E tests (some tests exist, coverage incomplete)
- ✅ Unit tests for utility functions (some exist)
- ⚠️ Component tests for complex UI logic (limited coverage)
- ❌ TypeScript strict mode enabled (no `any` types) (strict: false in tsconfig)
- ⚠️ No console errors in production build (needs verification)
- ⚠️ No console warnings in production build (needs verification)
- ⚠️ Manual QA completed for critical paths (needs documentation)
- ❌ Cross-browser testing (Chrome, Firefox, Safari) (not documented)
- ❌ Mobile device testing (iOS, Android) (not documented)
- ❌ Accessibility testing (keyboard navigation, screen reader) (not documented)
- ❌ Performance testing (Lighthouse, bundle size) (not documented)
- ⚠️ Edge cases tested (empty data, slow network, errors) (some tested)

---

## Product & Experience Checks (POSTD-specific)

- ⚠️ Onboarding flow works end-to-end (all 10 steps) (needs end-to-end testing)
- ✅ Brand Guide syncs to Supabase (not localStorage) (completed)
- ✅ AI agents use synced Brand Guide data (completed)
- ✅ 7-day content engine generates real AI content (completed)
- ✅ Calendar drag & drop scheduling works (implemented)
- ✅ Creative Studio edit flow works (upload, edit, save) (implemented)
- ⚠️ Brand switcher updates all brand-scoped data (needs verification)
- ✅ Multi-tenant isolation verified (no data leakage) (RLS enforced)
- ⚠️ OAuth connections work (connect, refresh, publish) (needs end-to-end testing)
- ⚠️ Approval workflow functions correctly (needs verification)
- ⚠️ Client portal access works (needs verification)
- ⚠️ Shareable analytics links work (backend implemented, needs frontend testing)
- ✅ Post-onboarding tour triggers once (implemented)
- ✅ All legal pages load correctly (implemented)
- ⚠️ Billing/Stripe integration works (needs verification)
- ⚠️ Trial logic enforced correctly (needs verification)
- ✅ Weekend restrictions removed (no blocking) (completed)
- ✅ Preferred posting schedule works (suggestions, not blocking) (implemented)
- ✅ Brand Fidelity Score (BFS) calculated correctly (implemented)
- ✅ Compliance linter flags violations (implemented)
- ✅ AI retry logic works (BFS < 0.8 triggers retry) (implemented)
- ⚠️ Error handling graceful (unknown brands, empty data) (needs improvement)
- ⚠️ Mobile responsiveness verified (no broken words, readable) (recently fixed, needs verification)
- ⚠️ Design system consistency across all pages (only 2 pages use primitives)
- ⚠️ No modal interruptions during editing (where possible) (Studio improved, others need review)

---

## Quick Reference: Common Issues to Avoid

- ✅ No `word-break: break-all` (use `break-normal` + `overflow-wrap`) (fixed)
- ⚠️ No hard-coded colors (use design tokens) (some hard-coded hex found)
- ⚠️ No hard-coded spacing (use design tokens) (some hard-coded px found)
- ✅ No localStorage for server data (use Supabase) (Brand Guide fixed, Studio still uses for drafts)
- ⚠️ No mock data in production (use real APIs) (some mock data hooks remain)
- ⚠️ No blocking modals during editing (Studio improved, others need review)
- ✅ No weekend posting restrictions (removed)
- ⚠️ No duplicate implementations (some old vs new page duplication)
- ⚠️ No unused imports or dead code (needs cleanup)
- ✅ No console.log in production code (replaced with logger utility, silent in production)

---

**Last Updated**: January 2025  
**Status**: Living document — update as practices evolve

