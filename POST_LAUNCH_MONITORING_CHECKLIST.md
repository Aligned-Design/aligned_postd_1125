# Post-Launch Monitoring Checklist

**Launch Date:** TBD  
**Monitoring Period:** 24 hours post-deployment  
**Status:** Ready for deployment

---

## Pre-Deployment Verification

### Environment Variables
- [ ] `VITE_SUPABASE_URL` set in Vercel
- [ ] `VITE_SUPABASE_ANON_KEY` set in Vercel
- [ ] `VITE_SENTRY_DSN` set (if using Sentry)
- [ ] `VITE_POSTHOG_KEY` set (if using PostHog)
- [ ] `VITE_APP_URL` set to production domain

### Database
- [ ] Supabase tables verified:
  - [ ] `content_items` (Creative Studio fallback)
  - [ ] `publishing_jobs` (scheduling)
  - [ ] `brands`, `users`, `organizations` (core tables)
  - [ ] `advisor_feedback` (brand intelligence)
  - [ ] `media_assets`, `media_usage_logs` (media tracking)

### API Routes
- [ ] All routes registered in `server/index.ts`
- [ ] Authentication middleware active
- [ ] RBAC scopes enforced
- [ ] CORS configured for production domain

---

## Post-Deployment Monitoring (First 24 Hours)

### Hour 0-1: Initial Health Check

**Vercel Logs:**
- [ ] Check deployment succeeded
- [ ] Verify no build errors
- [ ] Check for immediate runtime errors
- [ ] Verify environment variables loaded

**Application Health:**
- [ ] Visit production URL - app loads
- [ ] Login flow works
- [ ] Dashboard loads without errors
- [ ] No console errors in browser

**Key Endpoints:**
- [ ] `GET /health` returns 200
- [ ] `GET /api/ping` returns 200
- [ ] `POST /api/dashboard` returns 200 (with auth)
- [ ] `GET /api/studio` returns 200 (with auth)

---

### Hour 1-6: User Flow Verification

**Creative Studio:**
- [ ] `/studio` page loads
- [ ] "Start from AI" opens modal
- [ ] "Blank Canvas" creates design
- [ ] Template selection works
- [ ] Save to library works (`POST /api/studio/save`)
- [ ] Update design works (`PUT /api/studio/:id`)
- [ ] Schedule works (`POST /api/studio/:id/schedule`)
- [ ] Autosave works without errors

**Client Portal:**
- [ ] `/client-portal` page loads
- [ ] Dashboard data loads (`GET /api/client-portal/dashboard`)
- [ ] Approve content works (`POST /api/client-portal/content/:id/approve`)
- [ ] Reject content works (`POST /api/client-portal/content/:id/reject`)
- [ ] Media upload works (`POST /api/client-portal/media/upload`)

**Dashboard:**
- [ ] `/dashboard` page loads
- [ ] Data fetches correctly (`POST /api/dashboard`)
- [ ] Charts render
- [ ] KPIs display
- [ ] No infinite loading states

**Admin:**
- [ ] `/admin` page loads (admin users only)
- [ ] Overview loads (`GET /api/admin/overview`)
- [ ] Tenants list loads (`GET /api/admin/tenants`)
- [ ] Users list loads (`GET /api/admin/users`)

---

### Hour 6-12: Error Monitoring

**Vercel Function Logs:**
- [ ] Check for 4xx errors (client errors)
- [ ] Check for 5xx errors (server errors)
- [ ] Monitor error rate (< 1% is good)
- [ ] Check for authentication failures
- [ ] Check for rate limiting triggers

**Supabase Logs:**
- [ ] Check for database connection errors
- [ ] Monitor query performance
- [ ] Check for timeout errors
- [ ] Verify RLS policies working

**Sentry/Error Tracking:**
- [ ] Check for uncaught exceptions
- [ ] Monitor error frequency
- [ ] Check for new error types
- [ ] Verify error grouping works

**Browser Console:**
- [ ] Check for client-side errors
- [ ] Monitor network request failures
- [ ] Check for CORS errors
- [ ] Verify no memory leaks

---

### Hour 12-24: Performance & Stability

**Performance Metrics:**
- [ ] Page load times (< 3s for first load)
- [ ] API response times (< 500ms average)
- [ ] Time to interactive (< 5s)
- [ ] Bundle size within limits

**User Experience:**
- [ ] No infinite spinners
- [ ] No broken images
- [ ] Forms submit correctly
- [ ] Navigation works smoothly
- [ ] Mobile responsiveness verified

**Data Integrity:**
- [ ] Designs save correctly
- [ ] Media uploads persist
- [ ] Approvals process correctly
- [ ] Scheduled posts created
- [ ] No data loss reported

---

## Critical Alerts (Immediate Action Required)

### Red Flags (Stop Everything)
- [ ] Database connection failures
- [ ] Authentication completely broken
- [ ] Data loss or corruption
- [ ] Security breach detected
- [ ] Complete application failure

### Yellow Flags (Monitor Closely)
- [ ] Error rate > 5%
- [ ] API response times > 2s
- [ ] Memory usage increasing
- [ ] Unusual traffic patterns
- [ ] Specific feature broken

---

## Monitoring Tools

### Vercel
- **Dashboard:** https://vercel.com/dashboard
- **Logs:** Real-time function logs
- **Analytics:** Performance metrics
- **Alerts:** Configure email/Slack alerts

### Supabase
- **Dashboard:** https://supabase.com/dashboard
- **Logs:** Database query logs
- **Metrics:** Connection pool, query performance
- **Alerts:** Configure for errors

### Sentry (if enabled)
- **Dashboard:** https://sentry.io
- **Issues:** Error tracking
- **Performance:** Transaction monitoring
- **Alerts:** Configure for critical errors

### Browser DevTools
- **Console:** Client-side errors
- **Network:** API call monitoring
- **Performance:** Load time analysis
- **Application:** LocalStorage/SessionStorage

---

## Response Plan

### Immediate Response (< 15 minutes)
1. **Identify Issue:** Check logs, error messages
2. **Assess Impact:** How many users affected?
3. **Quick Fix:** Can we hotfix immediately?
4. **Rollback:** If critical, rollback to previous deployment

### Short-Term Response (< 1 hour)
1. **Root Cause:** Identify underlying issue
2. **Fix Development:** Implement proper fix
3. **Test Fix:** Verify fix works
4. **Deploy Fix:** Push to production

### Long-Term Response (< 24 hours)
1. **Post-Mortem:** Document what happened
2. **Prevention:** Add safeguards
3. **Monitoring:** Improve alerting
4. **Documentation:** Update runbooks

---

## Success Criteria

### Hour 1
- ✅ Application loads
- ✅ No critical errors
- ✅ Basic flows work

### Hour 6
- ✅ All major features functional
- ✅ Error rate < 1%
- ✅ No user complaints

### Hour 24
- ✅ Stable operation
- ✅ Performance acceptable
- ✅ No data issues
- ✅ Ready for full launch

---

## Contacts

**On-Call Engineer:** TBD  
**Backend Lead:** TBD  
**Frontend Lead:** TBD  
**DevOps:** TBD

---

## Notes

- Keep this checklist updated with actual issues encountered
- Document any workarounds or temporary fixes
- Update monitoring thresholds based on real data
- Share learnings with team post-launch

---

**Last Updated:** January 2025  
**Next Review:** Post-launch

