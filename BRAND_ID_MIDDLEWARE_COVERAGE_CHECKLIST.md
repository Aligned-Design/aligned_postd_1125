# Brand ID Middleware Coverage Checklist

**Status**: 🔄 IN PROGRESS  
**Goal**: Apply `validateBrandId` / `validateBrandIdFormat` middleware to ALL brand-aware routes

---

## ✅ Completed Routes

- [x] `brand-guide.ts` - All 6 routes use `validateBrandId`
- [x] `content-items.ts` - GET route uses `validateBrandId`
- [x] `creative-studio.ts` - POST /save uses `validateBrandIdFormat`, GET / uses `validateBrandId`
- [x] `crawler.ts` - POST /start uses `validateBrandIdFormat` (allows temp IDs)

---

## ✅ Recently Completed

- [x] `analytics-v2.ts` - All 4 routes now use `validateBrandId` (GET /overview, /engagement-trend, /content-performance, /top-posts)
- [x] `approvals-v2.ts` - GET /pending and GET /history use `validateBrandId`; other routes get brandId from DB records (kept assertBrandAccess with comments)
- [x] `media-v2.ts` - GET / and GET /storage-usage use `validateBrandId`; routes with :assetId get brandId from DB (kept assertBrandAccess with comments)
- [x] `brand-intelligence.ts` - GET /:brandId handler updated to use validated brandId; middleware applied in index.ts route registration
- [x] `brands.ts` - No routes with :brandId (GET / lists all, POST / creates new) - no middleware needed
- [x] `calendar.ts` - GET /:brandId uses `validateBrandId`
- [x] `dashboard.ts` - POST /api/dashboard handler updated; middleware applied in index.ts route registration
- [x] `doc-agent.ts` - POST /api/ai/doc handler updated; middleware applied in index.ts route registration
- [x] `design-agent.ts` - POST /api/ai/design handler updated; middleware applied in index.ts route registration

---

## ⏳ Pending Routes (Lower Priority - May Not Need Updates)

- [x] `doc-agent.ts` - ✅ Updated (POST /api/ai/doc)
- [x] `design-agent.ts` - ✅ Updated (POST /api/ai/design)
- [x] `dashboard.ts` - ✅ Updated (POST /api/dashboard)
- [x] `calendar.ts` - ✅ Updated (GET /:brandId)
- [ ] `agents.ts` - Check for brandId usage
- [ ] `onboarding.ts` - Check for brandId usage (may need `validateBrandIdFormat`)
- [ ] `workflow.ts` - Check for brandId usage
- [ ] `publishing.ts` - Check for brandId usage
- [ ] `orchestration.ts` - Check for brandId usage
- [ ] `content-plan.ts` - Check for brandId usage
- [ ] `content-packages.ts` - Check for brandId usage
- [ ] `brand-members.ts` - Check for brandId usage
- [ ] `brand-posting-schedule.ts` - Check for brandId usage
- [ ] `client-portal.ts` - Check for brandId usage
- [ ] `client-settings.ts` - Check for brandId usage
- [ ] `reviews.ts` - Check for brandId usage
- [ ] `search.ts` - Check for brandId usage
- [ ] `notifications.ts` - Check for brandId usage
- [ ] `media.ts` - Check for brandId usage (legacy)
- [ ] `media-management.ts` - Check for brandId usage
- [ ] `integrations.ts` - Check for brandId usage
- [ ] `analytics.ts` - Check for brandId usage (legacy v1)
- [ ] `approvals.ts` - Check for brandId usage (legacy v1)
- [ ] `webhooks.ts` - Check for brandId usage
- [ ] `publishing-router.ts` - Check for brandId usage
- [ ] `bulk-approvals.ts` - Check for brandId usage
- [ ] `escalations.ts` - Check for brandId usage
- [ ] `preferences.ts` - Check for brandId usage
- [ ] `white-label.ts` - Check for brandId usage
- [ ] `audit.ts` - Check for brandId usage
- [ ] `admin.ts` - Check for brandId usage
- [ ] `advisor.ts` - Check for brandId usage
- [ ] `ai-sync.ts` - Check for brandId usage
- [ ] `brand-guide-generate.ts` - Check for brandId usage

---

## Decision Matrix

### Use `validateBrandId` (full validation + access check):
- ✅ Brand dashboards
- ✅ Analytics
- ✅ Content items / queue
- ✅ Creative Studio (GET routes)
- ✅ Media library
- ✅ Brand intelligence
- ✅ Approvals
- ✅ Brand guide
- ✅ Any route that requires authenticated brand access

### Use `validateBrandIdFormat` (format only, no access check):
- ✅ Crawler routes (onboarding with temp IDs)
- ✅ Creative Studio POST /save (may have temp IDs in body)
- ✅ Onboarding routes (if they accept temp IDs)
- ✅ Any route with custom access logic that only needs format validation

---

## Notes

- Routes with `:brandId` in URL params → Use `validateBrandId`
- Routes with `brandId` in query params → Use `validateBrandId`
- Routes with `brandId` in body → Use `validateBrandId` (or `validateBrandIdFormat` if temp IDs allowed)
- Routes that accept temp IDs (`brand_<timestamp>`) → Use `validateBrandIdFormat`

---

**Last Updated**: 2025-01-20

