# Runtime API Wiring Fix

**Date:** 2025-12-15  
**Branch:** fix/reality-check-remediation  
**Status:** 🔍 **IN PROGRESS**

## Root Cause Investigation

### What We Found

**Configuration (Correct):**
- `pnpm dev` runs `concurrently "npm:dev:client" "npm:dev:server"`
- `dev:server` runs `PORT=3000 tsx server/index-v2.ts`
- `dev:client` runs `vite` (port 8080)
- Vite proxies `/api/*` to `http://localhost:3000`
- Health endpoint `/health` exists and responds

**Code (Correct):**
- All 8 routes ARE registered in `server/index-v2.ts` (lines 244-251)
- All imports present (lines 131-138)
- Routes verified in git (committed, no diffs)
- Unit tests pass (using `createServer()` from index-v2.ts)

**Runtime Behavior (INCONSISTENT):**
1. **Direct execution works:**
   ```bash
   PORT=3001 pnpm tsx server/index-v2.ts
   curl http://localhost:3001/api/metrics/ai/snapshot
   # Returns: 401 UNAUTHORIZED (✅ route exists!)
   ```

2. **Via `pnpm dev` fails:**
   ```bash
   pnpm dev  # starts both servers
   curl http://localhost:3000/api/metrics/ai/snapshot
   # Returns: 404 NOT FOUND (❌ route missing!)
   ```

3. **Health endpoint works in both:**
   ```bash
   curl http://localhost:3000/health
   # Returns: {"status":"ok"} (✅ server responding)
   ```

### Hypothesis

The routes are correctly defined but not being registered at runtime when started via `pnpm dev`. Possible causes:

1. **Module resolution issue** - tsx may be resolving a different version of the file
2. **Build/cache issue** - Stale build artifacts
3. **Import order issue** - Router modules failing to load
4. **Environment difference** - Different env vars between direct and dev execution

## Fix Applied

### Improved Smoke Test (Phase 2 Complete)

**File:** `scripts/smoke-test-endpoints.sh`

**Improvements:**
1. ✅ Waits for `/health` endpoint to respond (max 30s)
2. ✅ Tests directly against backend port (3000)
3. ✅ Treats 401/403/400 as SUCCESS (route exists)
4. ✅ Only treats 404 as FAILURE (route missing)
5. ✅ Better error reporting

**Commit:** test: make runtime smoke test wait for API readiness

## Next Steps (Phase 3 - TBD)

### Option A: Clear Build Artifacts
```bash
rm -rf node_modules/.vite
rm -rf dist
pnpm install
pnpm dev
```

### Option B: Check for Multiple Server Instances
```bash
lsof -i :3000  # Check if port is already in use
pkill -f "server/index"  # Kill any stale processes
```

### Option C: Add Explicit Route Logging
Add logging to `createServer()` to verify routes are being registered:
```typescript
console.log("Registering /api/metrics...");
app.use("/api/metrics", authenticateUser, aiMetricsRouter);
```

### Option D: Check tsx Cache
```bash
# Clear tsx cache
rm -rf ~/.tsx
pnpm dev
```

## Proof Commands

**What Works:**
```bash
# Unit tests
pnpm test restored-endpoints  # ✅ 12 tests pass
pnpm test ai-rewrite          # ✅ 10 tests pass

# Direct server execution
PORT=3001 pnpm tsx server/index-v2.ts &
curl http://localhost:3001/api/metrics/ai/snapshot
# Returns: 401 (✅ route exists)
```

**What Fails:**
```bash
# Via pnpm dev
pnpm dev &
sleep 5
curl http://localhost:3000/api/metrics/ai/snapshot
# Returns: 404 (❌ route missing)
```

## Status

- ✅ Routes correctly defined in code
- ✅ Imports present
- ✅ Unit tests pass
- ✅ Direct execution works
- ❌ pnpm dev execution fails
- ✅ Smoke test improved with readiness check

**Next:** Debug why `pnpm dev` doesn't register the routes despite them being in the code.

