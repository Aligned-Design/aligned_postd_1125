# Repository Health Improvements - 2025-01-16

**Goal**: Improve health score from 8.5 → 9.5/10  
**Status**: In Progress

---

## Tasks Completed

### 1. Documentation Archive ✅
- [x] Archive structure exists at `docs/archive/`
- [ ] Move outdated phase/migration/audit docs to archive
- [ ] Update docs index

### 2. Branding Migration ✅
- [x] localStorage keys updated (`postd_brand_id` with `aligned_brand_id` fallback)
- [ ] Update remaining legacy terms in codebase
- [ ] Update user-facing strings

### 3. ESLint Warnings Reduction
- [x] Current: 400 warnings
- [ ] Target: 300 warnings
- [ ] Fix easy wins (unused imports, unused vars, trivial types)

### 4. UX Polish (Error/Empty States)
- [ ] Audit client pages for missing error states
- [ ] Audit client pages for missing empty states
- [ ] Add loading skeletons where missing

### 5. Strict Mode Prep
- [ ] Fix easy TypeScript wins
- [ ] Avoid complex refactors

### 6. Logging Cleanup
- [ ] Replace `console.log` with structured logger
- [ ] Replace `console.warn` with structured logger
- [ ] Replace `console.error` with structured logger

### 7. Connector Safety ✅
- [x] GBP connector marked as "coming soon" in UI
- [x] ConnectorManager throws errors for GBP/Mailchimp
- [ ] Verify UI prevents activation

### 8. Health Report Update
- [ ] Update `POSTD_REPO_HEALTH_STATUS.md` with improvements
- [ ] Calculate new health score

---

## Files Modified

(To be updated as work progresses)

---

## Next Steps

1. Archive outdated documentation
2. Complete branding migration
3. Reduce ESLint warnings (400 → 300)
4. Add UX polish (error/empty states)
5. Prep strict mode (easy TS wins)
6. Clean up logging
7. Verify connector safety
8. Update health report

