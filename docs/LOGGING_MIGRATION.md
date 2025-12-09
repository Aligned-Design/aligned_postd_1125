# Logging Migration Guide

## Current State

- **Structured Logger**: `server/lib/logger.ts`
- **Files using logger**: 43
- **Files with raw console.log**: 73 (need migration)

## Logger API

```typescript
import { logger } from "../lib/logger";

// Available methods
logger.info("User logged in", { userId: "123", brandId: "456" });
logger.warn("Rate limit approaching", { requestsRemaining: 5 });
logger.error("Database connection failed", error, { brandId: "456" });
logger.debug("Debug info", { data }); // Only logs in development
```

## Output Format

All logs are JSON-structured for easy parsing:

```json
{
  "timestamp": "2025-12-09T19:00:00.000Z",
  "level": "info",
  "message": "User logged in",
  "context": {
    "userId": "123",
    "brandId": "456"
  }
}
```

## Migration Priority

### High Priority (Route files - 15 files)
These files handle production traffic and should be migrated first:

| File | console.log count | Priority |
|------|------------------|----------|
| `server/routes/auth.ts` | ~25 | HIGH |
| `server/routes/brand-guide.ts` | ~15 | HIGH |
| `server/routes/creative-studio.ts` | ~10 | HIGH |
| `server/routes/crawler.ts` | ~10 | MEDIUM |
| `server/routes/content-plan.ts` | ~8 | MEDIUM |
| Others | varies | LOW |

### Medium Priority (Lib files - ~30 files)
Background services and utilities.

### Low Priority (Scripts/Workers - ~28 files)
One-off scripts and development tools.

## Migration Steps

1. Add import: `import { logger } from "../lib/logger";`
2. Replace `console.log("message")` → `logger.info("message")`
3. Replace `console.error("message", error)` → `logger.error("message", error)`
4. Replace `console.warn("message")` → `logger.warn("message")`
5. Add context object with relevant IDs: `{ brandId, userId, requestId }`
6. Remove emoji prefixes (structured format replaces visual markers)

## Example Migration

**Before:**
```typescript
console.log("[Auth] 📥 Signup request received", { email });
console.error("[Auth] ❌ Missing required fields", { email, password });
```

**After:**
```typescript
logger.info("Signup request received", { email, endpoint: "auth/signup" });
logger.error("Missing required fields", undefined, { email, password, endpoint: "auth/signup" });
```

## Benefits

- **Consistent format**: All logs are JSON
- **Parseable**: Easy to ingest into logging services (Datadog, CloudWatch, etc.)
- **Contextual**: Always includes timestamp, level, and optional context
- **Debug control**: Debug logs only appear in development
- **Sentry-ready**: Error logs can be easily sent to Sentry

## Status

- [ ] Route files migration (15 files)
- [ ] Lib files migration (~30 files)
- [ ] Scripts/workers migration (~28 files)

**Estimated effort**: 2-3 hours for full migration
**Recommended approach**: One PR per category (routes, lib, scripts)

