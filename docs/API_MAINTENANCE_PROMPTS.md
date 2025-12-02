# API Maintenance Prompts

This document contains reusable prompts for maintaining and fixing the API layer. Use these prompts when working on backend/API changes to ensure consistency with existing patterns and standards.

---

## 1️⃣ Ongoing API Maintenance Prompt

**Use this when you're doing any backend/API work now.**

You are maintaining and extending an API layer that has already been audited.

### IMPORTANT – READ THESE FIRST

Before changing ANYTHING:

1. Open and read:
   - `docs/API_SURFACE_MAP.md`
   - `docs/API_USAGE_AND_TESTING.md`
   - `docs/API_AUDIT_SUMMARY.md`

2. Understand:
   - The existing API conventions (methods, auth, responses)
   - Error handling pattern (AppError, error middleware)
   - Validation approach (Zod schemas)
   - How smoke tests are structured in `server/__tests__/api-smoke.test.ts`

Do NOT invent a new pattern unless absolutely necessary. Reuse what's already documented.

---

### GOAL

For the changes I'm about to request, you will:

- Reuse existing patterns for:
  - Routing
  - Validation
  - Error handling
  - Auth/permissions
  - Response shape

- Keep documentation and tests UP TO DATE:
  - Update `API_SURFACE_MAP.md` if routes are added/changed/removed
  - Update `API_USAGE_AND_TESTING.md` if usage/testing flows change
  - Add/adjust smoke tests when new critical endpoints are added

---

### WHEN MODIFYING OR ADDING ENDPOINTS

For every endpoint you touch:

1. **Routing & framework**
   - Follow the same framework already used (Express, etc.)
   - Place routes with the same structure and file organization as existing ones.

2. **Validation**
   - Use the same validation pattern (e.g. Zod schemas).
   - Reject bad input with a 4xx and a clear validation error payload.
   - Avoid `any` – keep types consistent with the rest of the codebase.

3. **Auth & permissions**
   - Apply the same auth middleware/guards used for similar endpoints.
   - If unsure, check how similar routes are protected and match that pattern.

4. **Responses**
   - Match the standardized response shape:
     - `{ ok: true, data: ... }` for success
     - `{ ok: false, error: { code, message, details? } }` for errors
   - Use appropriate HTTP status codes.

5. **Error handling**
   - Use the shared `AppError` and central error handler.
   - Do NOT add ad-hoc `res.status(...).json(...)` error patterns unless they follow the existing conventions.

6. **Tests**
   - If the endpoint is critical or part of an important flow:
     - Add or extend smoke tests in `server/__tests__/api-smoke.test.ts`
     - Verify success, validation failure, and unauthorized access (if applicable).

---

### DOCS & SUMMARY

After changes:

1. Update `docs/API_SURFACE_MAP.md` to reflect any new/changed/removed endpoints.

2. If relevant, update `docs/API_USAGE_AND_TESTING.md` with:
   - Example cURLs
   - Request/response examples
   - Notes about auth / headers.

3. Summarize what you changed at the bottom of `docs/API_AUDIT_SUMMARY.md` under a new dated section:
   - Files touched
   - Endpoints added/modified
   - Tests updated
   - Any TODOs needing a product/owner decision.

Keep changes minimal, consistent with existing patterns, and backward compatible unless I explicitly tell you otherwise.

---

## 2️⃣ "Fix This One Endpoint" Micro-Prompt

**Use this when something is off with a specific route.**

You paste this into Cursor, then below it paste the file or tell it the path + problem.

You are fixing and aligning ONE API endpoint with the existing API standards.

1. First, read:
   - `docs/API_SURFACE_MAP.md`
   - `docs/API_USAGE_AND_TESTING.md`
   - `docs/API_AUDIT_SUMMARY.md`

2. Then open the endpoint file I specify and:
   - Make sure it follows the existing patterns for:
     - Validation (Zod etc.)
     - Error handling (AppError + centralized middleware)
     - Auth/permissions (same as similar routes)
     - Response shape (`ok: true/false` structure)
   - Fix any obvious bugs or missing edge-case handling.

3. If the route signature or URL path changes:
   - Update `API_SURFACE_MAP.md` accordingly.
   - If needed, update `API_USAGE_AND_TESTING.md` with correct examples.

4. If this endpoint is covered by smoke tests:
   - Update/add tests in `server/__tests__/api-smoke.test.ts` so they reflect the corrected behavior.
   - Keep tests minimal and focused (success + 1–2 failure cases).

At the end, print a short markdown summary of:

- What changed
- Any files updated
- Any remaining TODOs that require a product/business decision.

---

## Quick Reference

- **API Surface Map**: `docs/API_SURFACE_MAP.md`
- **API Usage & Testing**: `docs/API_USAGE_AND_TESTING.md`
- **API Audit Summary**: `docs/API_AUDIT_SUMMARY.md`
- **Smoke Tests**: `server/__tests__/api-smoke.test.ts`

---

*Last updated: 2025-01-XX*

