# POSTD Go-Live Playbook: Production Deployment & Rollback Procedures

> **Status:** ✅ Active – This is an active deployment playbook for POSTD production deployments.  
> **Last Updated:** 2025-01-20

**Version**: 1.0  
**Last Updated**: 2025-11-11  
**Status**: Ready for Review & Signoff  
**Target Go-Live Date**: [TO BE SCHEDULED]

---

## Executive Overview

This playbook provides step-by-step procedures for deploying POSTD to production, maintaining the system during launch, and rolling back if critical issues arise.

**Deployment Window**: Recommend Monday-Thursday, 09:00-17:00 EST (business hours)
**Estimated Downtime**: 5-15 minutes (with maintenance mode enabled)
**Rollback Time**: <5 minutes if needed

---

## 🔴 CRITICAL PRE-DEPLOYMENT CHECKLIST

**All items MUST be completed before deployment authorization**

### Security & Credentials
- [ ] OAuth CLIENT_ID/SECRET configured for all 6 platforms (Meta, Instagram, LinkedIn, Twitter, Google, TikTok)
- [ ] OAuth redirect URIs whitelisted on all platforms
- [ ] CORS policy tested in production environment
- [ ] Security headers verified (HSTS, CSP, X-Frame-Options)
- [ ] HTTPS certificates valid for domain (not expired)
- [ ] SSL/TLS 1.2+ enforced
- [ ] TokenVault encryption keys secure and backed up

### Environment & Configuration
- [ ] Production .env file complete and validated
- [ ] `npm run validate:env` passes with 0 errors
- [ ] Database credentials encrypted in vault
- [ ] API keys for all external services present
- [ ] Datadog API key configured
- [ ] SendGrid API key configured
- [ ] Sentry DSN configured (if using error tracking)
- [ ] NODE_ENV=production confirmed

### Infrastructure
- [ ] Database backup created and tested
- [ ] Redis backup created
- [ ] Database connection pool tested under load (>100 concurrent)
- [ ] Bull Queue tested with realistic job volume
- [ ] Health check endpoints responding (200 OK)
- [ ] Synthetic monitoring configured
- [ ] CDN/caching layer configured (if applicable)
- [ ] Rate limiting configured and tested

### Code & Builds
- [ ] Latest code committed and pushed to main branch
- [ ] Build successful: `pnpm run build`
- [ ] Type checking passed: `pnpm run typecheck`
- [ ] Linting passed: `pnpm run lint`
- [ ] Tests passed: `pnpm run test`
- [ ] Bundle size acceptable (<500KB gzipped)
- [ ] No deprecated APIs used

### Documentation & Communication
- [ ] Deployment plan reviewed by tech lead
- [ ] Rollback procedure tested and documented
- [ ] On-call schedule defined (24/7 for first week)
- [ ] Incident communication template prepared
- [ ] User announcement prepared (if applicable)
- [ ] Support team briefed on new features
- [ ] Monitoring alerts configured and tested

### Data Integrity
- [ ] Database migrations tested on staging
- [ ] Data backup and recovery plan documented
- [ ] GDPR/CCPA compliance verified
- [ ] PII not present in logs
- [ ] Audit table functional
- [ ] Data retention policies implemented

---

## 🟢 DEPLOYMENT PROCEDURE

### Phase 1: Pre-Flight Checks (30 minutes before deployment)

```bash
# 1. Verify git status is clean
git status
git log --oneline -5

# 2. Pull latest changes
git pull origin main

# 3. Run all validation scripts
npm run validate:env
npx tsx server/scripts/stack-activation-audit.ts
npx tsx server/scripts/phase5-activation-orchestrator.ts

# 4. Check application health
curl -H "Origin: https://aligned.com" http://localhost:8080/health
curl http://localhost:8080/api/ping

# 5. Verify database connectivity
npx tsx server/scripts/db-healthcheck.ts

# 6. Test OAuth endpoint
curl http://localhost:8080/api/oauth/meta
```

### Phase 2: Enable Maintenance Mode (5 minutes before deployment)

```bash
# 1. SSH into production server/Vercel environment
# 2. Set maintenance mode environment variable
export MAINTENANCE_MODE=true
export MAINTENANCE_MESSAGE="System maintenance in progress. We'll be back online shortly."

# 3. Deploy maintenance page (if not built-in)
# Users attempting to access the application will see a 503 Service Unavailable
```

### Phase 3: Production Deployment (Actual deployment)

**Option A: Vercel Deployment (Recommended)**

```bash
# 1. On your local machine, ensure main branch is up to date
git checkout main
git pull origin main

# 2. Create deployment
vercel --prod

# 3. Vercel will automatically:
#    - Run build: pnpm run build
#    - Run migrations: npm run db:migrate
#    - Deploy to production CDN
#    - Point traffic to new version

# 4. Monitor deployment in Vercel dashboard
# - Watch for build success (green checkmark)
# - Check deployment logs for errors
# - Verify preview URL responds
```

**Option B: Docker/Container Deployment**

```bash
# 1. Build Docker image
docker build -t alignedai:latest .

# 2. Push to registry
docker push your-registry/alignedai:latest

# 3. Update deployment manifest
kubectl set image deployment/alignedai \
  alignedai=your-registry/alignedai:latest

# 4. Monitor rollout
kubectl rollout status deployment/alignedai

# 5. If using Docker Compose
docker-compose -f docker-compose.prod.yml up -d
docker-compose logs -f
```

### Phase 4: Disable Maintenance Mode (Once deployment successful)

```bash
# 1. Verify application is responding
curl -I https://aligned.com/health

# 2. Check for errors in logs
tail -f logs/production.log | grep -i error

# 3. Disable maintenance mode
export MAINTENANCE_MODE=false

# 4. Smoke test the application
npm run test:smoke
```

---

## ✅ POST-DEPLOYMENT VERIFICATION (30 minutes)

### Immediate Checks (First 5 minutes)

```bash
# 1. Health endpoints
curl -I https://aligned.com/health                    # Expect: 200
curl -I https://aligned.com/api/ping                  # Expect: 200

# 2. Front-end loads
curl -I https://aligned.com/                          # Expect: 200 + HTML
curl -s https://aligned.com/ | grep -q "React"       # Expect: Found

# 3. API endpoints
curl -X OPTIONS https://aligned.com/api/posts \
  -H "Origin: https://aligned.com"                    # Expect: CORS headers

# 4. Database connectivity
curl https://aligned.com/api/auth/status              # Expect: 200

# 5. External integrations
curl -X GET https://aligned.com/api/oauth/meta \
  -H "X-Forwarded-For: 1.2.3.4"                       # Expect: redirect to Meta OAuth
```

### Short-Term Monitoring (Next 25 minutes)

**Watch for**:
- ✅ No 5xx errors in logs
- ✅ Response times <500ms p99
- ✅ Database queries <100ms
- ✅ Queue job processing working
- ✅ OAuth flows completing successfully
- ✅ Email notifications sending (if tested)
- ✅ Error tracking (Sentry) functional

**In Datadog/Monitoring**:
```
Dashboard: Production Health
├─ Request Rate: Should be >0 and consistent
├─ Error Rate: Should be <1%
├─ Latency (p99): Should be <500ms
├─ Database Queries: Monitor connection pool
├─ Queue Depth: Should be processing jobs
└─ OAuth Success Rate: Should be 100%
```

### Functional Tests

```bash
# 1. Test signup flow (if public)
POST https://aligned.com/api/auth/signup
{
  "email": "testuser@example.com",
  "password": "TestPassword123!"
}
# Expect: 201 Created, email verification sent

# 2. Test login
POST https://aligned.com/api/auth/login
{
  "email": "testuser@example.com",
  "password": "TestPassword123!"
}
# Expect: 200 OK, access token returned

# 3. Test OAuth redirect URI
GET https://aligned.com/api/oauth/meta/callback?code=test_code&state=test_state
# Expect: Valid state validation, proper error handling

# 4. Test protected API
GET https://aligned.com/api/connectors \
  -H "Authorization: Bearer {access_token}"
# Expect: 200 OK, user's connected platforms

# 5. Test error handling
GET https://aligned.com/api/nonexistent
# Expect: 404 Not Found with proper error response
```

---

## 🔄 ROLLBACK PROCEDURE

**Decision to Rollback**: If any of the following occur post-deployment:
- ❌ Error rate >5% for >5 minutes
- ❌ Response time p99 >2 seconds
- ❌ Database connectivity issues
- ❌ OAuth flows failing >10%
- ❌ Critical security vulnerability discovered
- ❌ Data integrity issues detected

### Rollback Steps (< 5 minutes)

**Option A: Vercel Rollback (Easiest)**

```bash
# 1. Go to Vercel dashboard
# 2. Navigate to Deployments
# 3. Find the previous stable deployment (usually <1 hour old)
# 4. Click "..." → "Promote to Production"
# 5. Confirm rollback

# This automatically reverts traffic to previous version
# Typical time: <1 minute
```

**Option B: Git + Revert Commit**

```bash
# 1. Identify the problematic commit
git log --oneline -10

# 2. Revert the commit
git revert <commit-hash>

# 3. Push to main
git push origin main

# 4. Deploy using same procedure as deployment
# Vercel will auto-deploy or trigger manual deployment

# Typical time: 3-5 minutes
```

**Option C: Feature Flag Toggle (Immediate)**

```bash
# 1. For bugs in specific features, toggle the feature flag
export FEATURE_FLAG_PROBLEMATIC_FEATURE=false

# 2. Restart application (if needed)
# 3. Users immediately get stable code path

# Typical time: <1 minute
# Note: Only applicable for specific features, not for infrastructure issues
```

### Post-Rollback Actions

```bash
# 1. Verify previous version is stable
curl https://aligned.com/health    # Expect: 200

# 2. Monitor error rates for 30 minutes
# - Error rate should drop below 1%
# - All health checks should pass

# 3. Alert team
# - Notify #incident channel
# - Document reason for rollback
# - Schedule incident review

# 4. Investigate root cause
# - Check logs for errors
# - Review deployment changes
# - Identify what caused the issue

# 5. Fix issue in new branch
git checkout -b fix/deployment-issue
# Make fixes...
git commit -m "fix: Address deployment issue"
git push origin fix/deployment-issue

# 6. Create PR for review
# - Require code review
# - Re-run all tests
# - Schedule new deployment attempt
```

---

## 📊 DEPLOYMENT SIGN-OFF CHECKLIST

### Tech Lead Sign-Off
- [ ] Code reviewed and approved
- [ ] All pre-flight checks passed
- [ ] Rollback procedure tested
- [ ] Monitoring configured and verified
- [ ] **Signature**: ________________  **Date**: ___________

### DevOps/Infrastructure Sign-Off
- [ ] Infrastructure changes tested
- [ ] Database backups created
- [ ] SSL/TLS certificates valid
- [ ] CDN/caching properly configured
- [ ] **Signature**: ________________  **Date**: ___________

### Product/Business Sign-Off
- [ ] Feature completeness verified
- [ ] User communication prepared
- [ ] Support team briefed
- [ ] **Signature**: ________________  **Date**: ___________

### Security Sign-Off
- [ ] Security headers configured
- [ ] OAuth properly implemented
- [ ] No hardcoded secrets in code
- [ ] Encryption keys secure
- [ ] **Signature**: ________________  **Date**: ___________

---

## 🚨 INCIDENT RESPONSE

### If Critical Issue Occurs During Deployment

1. **Immediate** (< 1 min):
   - Stop deploying (if still in progress)
   - Assess severity
   - Page on-call engineer

2. **Assessment** (1-5 min):
   - Check error logs in Datadog/Sentry
   - Verify database connectivity
   - Check if OAuth is working
   - Determine if rollback is needed

3. **Communication** (Immediate):
   - Post incident status in #incidents channel
   - Alert affected users (if customer-facing)
   - Start incident war room call (if critical)

4. **Resolution** (Based on severity):
   - **Critical**: Rollback immediately, investigate later
   - **High**: Fix in place if <30 min, otherwise rollback
   - **Medium**: Deploy fix after thorough testing
   - **Low**: Can wait until next scheduled maintenance

5. **Post-Incident** (Next business day):
   - Write incident report
   - Schedule incident review meeting
   - Implement preventive measures
   - Update runbooks and procedures

---

## 📋 MONITORING DURING FIRST 24 HOURS

### Monitoring Schedule

**Hour 0-1** (Immediately after deployment):
- [ ] Check error rate every 5 minutes
- [ ] Monitor database connection pool
- [ ] Watch OAuth success rate
- [ ] Monitor queue job backlog

**Hour 1-4** (First few hours):
- [ ] Check error rate every 15 minutes
- [ ] Monitor API latency
- [ ] Verify email sending (if applicable)
- [ ] Check background job processing

**Hour 4-24** (Rest of first day):
- [ ] Check error rate every 30 minutes
- [ ] Monitor for any data integrity issues
- [ ] Verify all core workflows working
- [ ] Check for memory leaks or resource issues

### Alert Thresholds

```
🔴 CRITICAL (Immediate Action):
- Error rate > 10%
- Uptime < 99%
- Database unavailable
- OAuth failing > 50%
- Response time p99 > 5s

🟡 WARNING (Investigate):
- Error rate > 5%
- Database slow (queries > 500ms)
- OAuth failing > 10%
- Queue backlog > 1000 jobs
- Response time p99 > 1s
```

---

## 🎓 Post-Launch Runbook

### Accessing Logs

**Datadog**:
```
- Go to Logs → Search
- Filter: env:production service:alignedai
- Sort by timestamp (newest first)
- Export for analysis if needed
```

**Application Logs**:
```bash
# SSH into production server
tail -f /var/log/alignedai/production.log

# Search for errors
grep ERROR /var/log/alignedai/production.log | tail -50

# Search for slow queries
grep "latencyMs.*>1000" /var/log/alignedai/production.log
```

### Common Issues & Solutions

| Issue | Symptoms | Solution |
|-------|----------|----------|
| High memory usage | Increasing memory, then crash | Restart application, check for memory leaks |
| Database timeout | Slow queries, 503 errors | Increase connection pool, optimize queries |
| OAuth failing | "Invalid state" errors | Verify OAuth credentials, check redirect URIs |
| Rate limiting | 429 errors from clients | Adjust rate limit thresholds |
| Queue backlog | Jobs not processing | Check worker status, increase concurrency |

---

## 📞 Escalation Path

**Issue Severity**: CRITICAL (Error rate > 10%, system down)
1. Page on-call engineer
2. If unresolved in 5 min: Page backend lead
3. If unresolved in 10 min: Rollback (execute rollback procedure above)
4. If unresolved in 15 min: Page CTO

**Issue Severity**: HIGH (Error rate 5-10%, degraded performance)
1. Alert on-call engineer
2. Investigate root cause
3. Deploy hotfix if possible
4. Otherwise rollback if no ETA on fix

**Issue Severity**: MEDIUM (Error rate 1-5%, specific feature broken)
1. Document issue
2. Alert team in Slack
3. Deploy fix within business hours
4. No urgent action required

---

## ✨ Post-Deployment Checklist (72 Hours)

- [ ] No critical errors in first 24 hours
- [ ] Error rate stabilized <0.5%
- [ ] Performance metrics are stable
- [ ] All OAuth flows working for all platforms
- [ ] Database performing normally
- [ ] Users haven't reported major issues
- [ ] Team is confident in deployment
- [ ] Schedule post-launch review meeting

---

**Document Status**: Ready for deployment
**Last Review**: 2025-11-11
**Next Update**: After first production deployment

