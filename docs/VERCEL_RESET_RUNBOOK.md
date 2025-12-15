# Vercel Deployment Reset & Verification Runbook

**Purpose**: Prove the live site serves the exact code you think it does, with no stale caching.

**Problem**: "The deployed site doesn't match my latest code changes"

**Solution**: Deploy proof marker + fresh build verification

---

## 🔍 Quick Verification (Check Current Deployment)

**Step 1**: Open your production site in browser

**Step 2**: Look in the **bottom-right corner** for:
```
🔍 <short-sha>-<build-id>
```

**Step 3**: Click the marker to expand details:
- SHA: Git commit hash (short)
- Build: Build timestamp
- ID: Unique build identifier

**Step 4**: Compare SHA to your local repo:
```bash
git rev-parse --short HEAD
```

**If they match**: ✅ Site is current  
**If they don't match**: ⚠️ Follow "Force Fresh Deployment" below

---

## 🚨 Force Fresh Deployment (When Site is Stale)

### Option 1: Redeploy with Cache Disabled (Recommended)

1. **Go to Vercel Dashboard**
   - Navigate to your project
   - Go to "Deployments" tab
   - Find the production deployment

2. **Click ⋯ (three dots)** next to the deployment

3. **Select "Redeploy"**

4. **⚠️ CRITICAL**: **UNCHECK** "Use existing Build Cache"
   ```
   [ ] Use existing Build Cache   ← MUST BE UNCHECKED
   ```

5. **Click "Redeploy"**

6. **Wait for deployment** to complete

7. **Verify**: Check the deploy proof marker on the live site

---

### Option 2: Empty Commit + Push (Alternative)

If Vercel UI redeploy doesn't work, force a new commit:

```bash
# Make an empty commit
git commit --allow-empty -m "chore: force Vercel redeploy"

# Push to main
git push origin main
```

Vercel will automatically deploy the new commit.

---

### Option 3: Nuclear Reset (Last Resort)

If the above don't work:

1. **Delete `.vercel` cache** (in Vercel Dashboard → Settings → General → Clear Cache)
2. **Create a new deployment** from scratch
3. **Verify environment variables** are set correctly

---

## ✅ Verification Checklist

After deploying, verify these in order:

### 1. Build Succeeded
- [ ] Vercel build logs show "Build Completed"
- [ ] No errors in build logs

### 2. Deploy Proof Visible
- [ ] Open production URL
- [ ] Deploy proof marker visible in bottom-right corner
- [ ] Click marker to see expanded details

### 3. SHA Matches
```bash
# Get local SHA
git rev-parse --short HEAD

# Compare to deploy proof SHA on live site
```
- [ ] SHAs match

### 4. Build Time Recent
- [ ] Build timestamp in deploy proof is within last hour

### 5. Hard Refresh Browser
- [ ] Open incognito/private window
- [ ] Visit production URL
- [ ] Deploy proof still shows correct SHA

---

## 🐛 Common Causes of "Stale" Behavior

### 1. Wrong Branch Deployed
**Problem**: Vercel is deploying from a different branch

**Check**:
- Vercel Dashboard → Settings → Git
- Confirm "Production Branch" is set to `main` (or your primary branch)

**Fix**: Update production branch in Vercel settings

---

### 2. Viewing Preview Deployment
**Problem**: You're viewing a preview deployment, not production

**Check**: URL should be your production domain, not:
- `*.vercel.app` (unless that IS your production)
- `-<branch-name>-*.vercel.app`
- `-git-*-*.vercel.app`

**Fix**: Visit your actual production domain

---

### 3. Browser Cache
**Problem**: Browser is showing cached version

**Fix**:
- Open **incognito/private window**
- Or hard refresh: `Cmd+Shift+R` (Mac) / `Ctrl+Shift+R` (Windows)

---

### 4. `dist/` Not Updated Locally
**Problem**: Vite build didn't regenerate dist/

**Verify**:
```bash
# Run proof build
pnpm run proof:build
```

**Expected output**:
- `dist/` deleted
- Build completes
- New file timestamps shown

---

### 5. Build Meta Not Generated
**Problem**: `build-meta.json` not created before Vite build

**Check**: Build logs should show:
```
✅ Build metadata generated:
   buildTime: 2025-12-15T...
   gitSha: abc1234
```

**Fix**: Ensure `build:meta` runs before `build:client` in package.json:
```json
"build": "npm run build:meta && npm run build:client && ..."
```

---

### 6. Vercel Build Cache Stale
**Problem**: Vercel reused old build cache

**Fix**: Redeploy with "Use existing Build Cache" **UNCHECKED**

---

## 🔧 Local Development Verification

Before deploying, verify locally:

### 1. Generate Build Metadata
```bash
pnpm run build:meta
```

**Expected output**:
```
✅ Build metadata generated:
   buildTime: 2025-12-15T10:30:00.000Z
   gitSha: abc1234
   buildId: xyz5678
   → client/src/build-meta.json
```

### 2. Run Full Build
```bash
pnpm run build
```

**Expected**: Build completes without errors

### 3. Run Proof Build (All-in-One)
```bash
pnpm run proof:build
```

**This script**:
- Deletes `dist/`
- Runs full build
- Shows newest files in `dist/`
- Prints `dist/index.html` hash

**Expected output**:
```
🔍 Verifying dist/ build freshness
📁 dist/ exists, capturing state...
🗑️  Deleting dist/...
   ✅ dist/ deleted
🔨 Running build...
   ✅ Build completed
✅ Verifying dist/ output...
   ✅ dist/ created with 5 files
📦 Newest files in dist/:
   1. assets/index-abc123.js
      mtime: 2025-12-15T10:30:05.000Z
🔐 dist/index.html hash: a1b2c3d4...
✅ Verification complete: dist/ was freshly built
```

---

## 📋 Deployment SOP (Standard Operating Procedure)

**Use this checklist for every production deployment:**

### Pre-Deploy
- [ ] All changes committed to git
- [ ] Working tree clean (`git status`)
- [ ] Typecheck passes (`pnpm typecheck`)
- [ ] Build passes locally (`pnpm run build`)
- [ ] Proof build verifies dist/ changed (`pnpm run proof:build`)

### Deploy
- [ ] Push to main branch (`git push origin main`)
- [ ] Verify Vercel starts build (check dashboard or GitHub webhook)
- [ ] Monitor build logs (no errors)
- [ ] Build completes successfully

### Post-Deploy
- [ ] Open production site in **incognito window**
- [ ] Verify deploy proof marker visible
- [ ] Click marker, verify SHA matches `git rev-parse --short HEAD`
- [ ] Verify build timestamp is recent (within last hour)
- [ ] Test critical functionality works

---

## 🔍 Deploy Proof Marker Details

### Location
- Bottom-right corner of the page
- Fixed position, always visible
- Z-index 9999 (above everything)

### Format (Collapsed)
```
🔍 abc1234-xyz5678
```
- `abc1234` = Short git SHA (7 chars)
- `xyz5678` = Random build ID (8 chars)

### Format (Expanded - Click to Toggle)
```
🔍 DEPLOY_PROOF
SHA: abc1234
Build: Dec 15, 10:30 AM
ID: xyz5678
Full: abc1234567890abcd...
```

### CSS
- Semi-transparent background
- Monospace font
- Subtle but visible
- Survives minification (inline styles)

### Data Attribute
HTML element includes:
```html
<div data-deploy-proof="abc1234-xyz5678" ...>
```

Can be queried in DevTools:
```javascript
document.querySelector('[data-deploy-proof]').dataset.deployProof
// "abc1234-xyz5678"
```

---

## 🚀 One-Command Deployment Proof

To verify everything locally before deploying:

```bash
pnpm run proof:build
```

This single command:
1. ✅ Deletes `dist/`
2. ✅ Generates build metadata (`build:meta`)
3. ✅ Runs full build (`build:client`, `build:server`, `build:vercel-server`)
4. ✅ Verifies `dist/` was created
5. ✅ Shows newest files and hashes

**If this passes**: You're ready to deploy ✅

---

## 🎯 Success Criteria

**You have successfully deployed when**:

1. ✅ Build completes in Vercel without errors
2. ✅ Deploy proof marker visible on live site
3. ✅ SHA in deploy proof matches `git rev-parse --short HEAD`
4. ✅ Build timestamp is recent (within last hour)
5. ✅ Incognito window shows same deploy proof
6. ✅ Your changes are visible on the live site

---

## 📞 Troubleshooting Contacts

**If deploy proof marker is not visible**:
1. Check browser console for errors
2. Verify `DeployProof` component is imported in `App.tsx`
3. Verify `build-meta.json` was generated (check build logs)
4. Check if component was tree-shaken (minification issue)

**If SHA is "unknown"**:
- Git is not available in Vercel build environment
- Check Vercel build logs for git-related errors
- Verify `.git` folder is not in `.vercelignore`

**If build ID is missing**:
- `generate-build-meta.ts` script didn't run
- Check `package.json` build script order
- Ensure `build:meta` runs before `build:client`

---

**Document Version**: 1.0  
**Last Updated**: 2025-12-15  
**Author**: AI Assistant (Deploy Proof System Implementation)

