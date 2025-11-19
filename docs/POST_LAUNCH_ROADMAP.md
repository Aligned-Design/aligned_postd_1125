# Post-Launch Roadmap

**Purpose**: This document explicitly acknowledges items that are **intentionally deferred** from the v1 launch. These are not bugs or oversights—they are scheduled for future phases.

**Status**: ✅ **Approved for v1 launch without these items**

---

## 🎯 Deferred Items (P1/P2 - Not Launch Blockers)

### 1. Canva Connector
**Status**: Deferred unless needed for a specific pilot  
**Priority**: P1 (if pilot requires it)  
**Rationale**: Not required for core v1 functionality. Can be added when a specific client/pilot needs it.

---

### 2. Test TypeScript Errors (~399 errors in test files)
**Status**: Scheduled for dedicated "test typing" pass  
**Priority**: P2  
**Rationale**: Test files don't affect production builds. Options:
- Add separate `tsconfig.tests.json` with relaxed types
- Fix as part of dedicated test infrastructure improvement
- Not blocking production deployment

**Action Items**:
- [ ] Create `tsconfig.tests.json` with appropriate test-only types
- [ ] OR: Run full test typing cleanup pass (dedicated sprint)

---

### 3. Advanced Performance Work
**Status**: Post-launch optimization  
**Priority**: P1 (after initial user feedback)

#### 3a. Pagination / Infinite Scroll / Virtualization
- **When**: After we have real data volumes to optimize for
- **Rationale**: Current lists are manageable. Optimize when we see actual usage patterns.

#### 3b. Lighthouse Optimization (> 80 targets)
- **When**: Post-launch performance audit
- **Rationale**: Current performance is acceptable. Full Lighthouse pass comes after launch metrics.

**Action Items**:
- [ ] Run Lighthouse audit on production
- [ ] Identify top 3 performance bottlenecks
- [ ] Implement pagination/virtualization where needed
- [ ] Target: Lighthouse score > 80 across all pages

---

### 4. Full Observability
**Status**: Post-launch enhancement  
**Priority**: P1 (after initial production issues)

#### 4a. Visual Dashboards
- **When**: After we have production data to visualize
- **Rationale**: Need real usage patterns before building dashboards.

#### 4b. Client-Side Error Tracking (Sentry, etc.)
- **When**: After launch (if error patterns emerge)
- **Rationale**: Current logging is sufficient for v1. Add full error tracking when we see production issues.

**Action Items**:
- [ ] Evaluate Sentry vs. other error tracking services
- [ ] Set up client-side error tracking
- [ ] Create error alerting rules
- [ ] Build observability dashboards

---

### 5. Dark Mode
**Status**: Post-launch feature  
**Priority**: P2  
**Rationale**: Current light-mode design is complete and polished. Dark mode is a nice-to-have, not a requirement.

**Action Items**:
- [ ] Design dark mode color palette
- [ ] Implement theme switcher
- [ ] Test all components in dark mode
- [ ] Add user preference persistence

---

### 6. Global Keyboard Shortcuts
**Status**: Post-launch enhancement  
**Priority**: P2  
**Rationale**: Current keyboard navigation (Tab, Enter, ESC) is sufficient. Power-user shortcuts can come later.

**Action Items**:
- [ ] Define keyboard shortcut scheme
- [ ] Implement global shortcut handler
- [ ] Add shortcut help modal
- [ ] Test accessibility of shortcuts

---

### 7. Full WCAG Audit
**Status**: Post-launch compliance pass  
**Priority**: P1 (compliance requirement)  
**Rationale**: P0 A11y basics are complete (labels, ARIA, keyboard access). Full WCAG 2.1 AA audit comes after launch.

**Current A11y Status**:
- ✅ Form labels and ARIA attributes
- ✅ Keyboard navigation (Tab, Enter, ESC)
- ✅ Focus management in modals
- ✅ Basic screen reader support

**Action Items**:
- [ ] Run full WCAG 2.1 AA audit (automated + manual)
- [ ] Fix any P1 compliance issues
- [ ] Document accessibility features
- [ ] Add accessibility statement

---

### 8. ESLint & TypeScript Hard-Mode on Backend
**Status**: Post-launch code quality improvement  
**Priority**: P2 (after v1 is stable)  
**Rationale**: Backend code currently has relaxed ESLint rules (`no-explicit-any: off`) for v1 launch. This allows backend to be "a little messy" but working. Once v1 is stable, we should tighten these rules.

**Current ESLint Overrides** (intentional for v1):
- `server/**`: `@typescript-eslint/no-explicit-any: off`
- `server/scripts/**`, `server/utils/**`: `@typescript-eslint/no-explicit-any: off`, `@typescript-eslint/no-require-imports: off`
- Frontend keeps stricter rules: `@typescript-eslint/no-explicit-any: warn`

**Action Items**:
- [ ] Remove ESLint overrides for `server/**` (change `no-explicit-any` from `off` to `warn`)
- [ ] Fix all `any` types in backend code (replace with proper types)
- [ ] Remove `no-require-imports: off` from scripts/utils (migrate to ES modules)
- [ ] Update `eslint.config.js` to remove legacy overrides
- [ ] Run full lint pass and fix all new warnings
- [ ] Document the baseline commit for future reference

**Baseline Commit**: `chore: stabilize lint/typecheck for v1 launch`

---

## 📋 Launch Decision Matrix

| Item | Launch Blocker? | Reason |
|------|----------------|--------|
| Canva Connector | ❌ No | Not required for core functionality |
| Test TS Errors | ❌ No | Doesn't affect production builds |
| Performance Optimization | ❌ No | Current performance is acceptable |
| Full Observability | ❌ No | Basic logging is sufficient for v1 |
| Dark Mode | ❌ No | Nice-to-have, not required |
| Global Shortcuts | ❌ No | Current keyboard nav is sufficient |
| Full WCAG Audit | ❌ No | P0 A11y basics are complete |
| ESLint Hard-Mode | ❌ No | Backend relaxed rules are intentional for v1 |

**Conclusion**: ✅ **All deferred items are non-blocking for v1 launch**

---

## 🚀 Post-Launch Priorities (First 30 Days)

1. **Monitor Production**
   - Watch for real user errors
   - Track performance metrics
   - Identify top user pain points

2. **Quick Wins** (Week 1-2)
   - Fix any critical bugs found in production
   - Address user feedback on UX friction
   - Performance hotfixes if needed

3. **Infrastructure** (Week 2-4)
   - Set up error tracking (Sentry)
   - Create observability dashboards
   - Run Lighthouse audit

4. **Feature Enhancements** (Month 2+)
   - Canva connector (if pilot requires)
   - Dark mode (if user demand)
   - Global keyboard shortcuts
   - Full WCAG audit

---

## 📝 Notes

- **This is not a backlog of bugs**—these are intentional deferrals
- **All items are tracked** and will be prioritized based on user feedback
- **Launch is approved** without these items
- **No guilt required**—these are scheduled, not ignored

---

**Last Updated**: 2025-01-18  
**Status**: ✅ Approved for v1 launch

