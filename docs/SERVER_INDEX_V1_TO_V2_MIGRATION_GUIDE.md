# Server Entry Point Migration Guide: index.ts → index-v2.ts

**Date:** 2025-01-20  
**Purpose:** Guide for migrating from legacy `server/index.ts` to current `server/index-v2.ts`

---

## Overview

POSTD has two server entry points:

1. **`server/index.ts`** - ⚠️ **DEPRECATED** - Legacy entry point
2. **`server/index-v2.ts`** - ✅ **CURRENT** - Active entry point

All new development should use `index-v2.ts`. The legacy `index.ts` is kept for backward compatibility only and will be removed in a future version.

---

## Why index-v2.ts Exists

`server/index-v2.ts` was created to address several issues in the original `index.ts`:

1. **Environment Validation:** Validates Supabase credentials on startup
2. **Better Error Handling:** Improved error handling and logging
3. **Cleaner Architecture:** More organized route mounting
4. **Security:** Enhanced security middleware and validation

---

## Which Entry Point is Used Where?

### Development
- **Command:** `pnpm dev`
- **Uses:** `server/index-v2.ts` (via `pnpm dev:server` script)
- **Port:** 3000

### Production
- **Command:** `pnpm start` or `pnpm start:v2`
- **Uses:** `dist/server/node-build-v2.mjs` (built from `index-v2.ts`)
- **Entry Point:** `server/node-build-v2.ts`

### Legacy (NOT RECOMMENDED)
- **Command:** `pnpm start:legacy`
- **Uses:** `dist/server/node-build.mjs` (built from `index.ts`)
- **Status:** ⚠️ Deprecated - Only for emergency fallback

---

## Migration Steps

### For Local Development

**Before:**
```bash
# If you were manually running the legacy server
node server/index.ts
```

**After:**
```bash
# Use the standard dev command (uses index-v2.ts)
pnpm dev
```

### For Custom Scripts

**Before:**
```typescript
import { createServer } from './server/index';
```

**After:**
```typescript
import { createServer } from './server/index-v2';
```

### For Production Builds

**Before:**
```json
{
  "start": "node dist/server/node-build.mjs"
}
```

**After:**
```json
{
  "start": "NODE_ENV=production node dist/server/node-build-v2.mjs"
}
```

---

## Key Differences

### Environment Variable Validation

**index.ts (Legacy):**
- No startup validation
- Fails at runtime if env vars missing

**index-v2.ts (Current):**
- Validates `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` on startup
- Throws clear error messages if missing
- Tests Supabase connection before accepting requests

### Error Handling

**index.ts (Legacy):**
- Basic error handling
- Less structured error responses

**index-v2.ts (Current):**
- Enhanced error middleware
- Structured error responses
- Better logging

### Route Organization

**index.ts (Legacy):**
- Mixed route mounting
- Some commented-out legacy routes

**index-v2.ts (Current):**
- Clean route organization
- All routes properly mounted
- No commented-out code

---

## Breaking Changes

### Removed Middleware

The following middleware functions have been removed:

- `optionalAuthForOnboarding` - Removed in High Priority Cleanup (2025-01-20)
  - **Migration:** Use `authenticateUser` for all authenticated routes
  - **For public routes:** Exclude from auth middleware in route definition

### Route Changes

- `/api/client` - Removed (use `/api/client-portal` instead)
- `/api/client/share-links/:token` - Removed (use `/api/client-portal/share-links/:token`)

---

## Verification

After migrating, verify:

1. **Server Starts:** `pnpm dev` should start without errors
2. **Environment Variables:** Check that all required env vars are set
3. **Routes Work:** Test key endpoints (e.g., `/api/health`, `/api/ping`)
4. **Supabase Connection:** Verify database operations work

---

## Rollback Plan

If you need to rollback to the legacy entry point:

1. Use `pnpm start:legacy` (NOT RECOMMENDED)
2. Note: Legacy entry point may have security issues
3. Report any issues that require rollback

---

## Timeline

- **2025-01-20:** Migration guide created
- **Future:** `server/index.ts` will be removed once all usage is migrated

---

## Related Files

- `server/index.ts` - Legacy entry point (deprecated)
- `server/index-v2.ts` - Current entry point
- `server/node-build-v2.ts` - Production build entry
- `package.json` - Script definitions

---

## Questions?

If you encounter issues during migration:

1. Check this guide
2. Review `server/index-v2.ts` for current patterns
3. Check `REPO_HEALTH_FIXES_APPLIED.md` for recent changes

---

**Last Updated:** 2025-01-20  
**Maintained By:** POSTD Engineering Team

