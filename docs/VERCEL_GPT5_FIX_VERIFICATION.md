# Vercel GPT-5 Fix Verification Checklist

**Commits**: `e6ccf8e` (logging) + `42f33f9` (sanitization)  
**Date**: 2025-12-15  
**Purpose**: Verify gpt-5-mini no longer receives unsupported parameters

---

## ✅ Step 1: Confirm Vercel Deployment SHA

### Via Vercel Dashboard
1. Go to: https://vercel.com/[your-org]/[your-project]
2. Click **Deployments** tab
3. Find the latest deployment
4. Click into deployment details
5. Check **"Source"** section for commit SHA

**Expected SHA**: `42f33f9eb858c69da0ad4d231ff0023bbac37c73`  
**Short SHA**: `42f33f9`

### Via API (Alternative)
```bash
curl -H "Authorization: Bearer $VERCEL_TOKEN" \
  "https://api.vercel.com/v13/deployments?projectId=$PROJECT_ID&limit=1"
```

**❌ If SHA doesn't match**: You're testing the wrong code. Wait for deployment or trigger manual redeploy.

---

## ✅ Step 2: Search Production Logs for Payload Proof

### Via Vercel Dashboard
1. Go to: Deployments → [Latest] → **Logs**
2. Filter for: `OPENAI_PAYLOAD_PROOF`
3. Trigger a brand kit generation or brand summary in the UI
4. Refresh logs

### Expected Output (gpt-5-mini)
```json
{
  "message": "OPENAI_PAYLOAD_PROOF",
  "model": "gpt-5-mini",
  "hasTemperature": false,           // ✅ Must be false
  "temperatureValue": undefined,
  "hasPresencePenalty": false,       // ✅ Must be false
  "presencePenaltyValue": undefined,
  "hasFrequencyPenalty": false,      // ✅ Must be false
  "frequencyPenaltyValue": undefined,
  "messageCount": 2,
  "agentType": "doc"
}
```

### Expected Output (gpt-4o or other non-gpt-5 models)
```json
{
  "message": "OPENAI_PAYLOAD_PROOF",
  "model": "gpt-4o",
  "hasTemperature": true,            // ✅ Can be true
  "temperatureValue": 0.7,
  "hasPresencePenalty": true,        // ✅ Can be true
  "presencePenaltyValue": 0.1,
  "hasFrequencyPenalty": true,       // ✅ Can be true
  "frequencyPenaltyValue": 0.1,
  "messageCount": 2
}
```

### ❌ Red Flags
If you see this for gpt-5-mini:
```json
{
  "model": "gpt-5-mini",
  "hasPresencePenalty": true,  // ❌ BAD - still bypassing sanitizer
  "hasFrequencyPenalty": true  // ❌ BAD - still bypassing sanitizer
}
```

**This means**: Either:
- Logging is placed BEFORE sanitization (swap order)
- There's a 3rd call path we didn't find
- Sanitizer isn't being called

---

## ✅ Step 3: Confirm Old Errors Are Gone

### Search for Previous Error Messages

Filter Vercel logs for these exact strings:

1. **`presence_penalty is not supported`**
   - Expected: ❌ Zero occurrences after deployment

2. **`Only the default (1) value is supported`**
   - Expected: ❌ Zero occurrences after deployment

3. **`Unsupported value: 'temperature'`**
   - Expected: ❌ Zero occurrences after deployment

4. **`Retrying with Claude`** or **`Falling back to Claude`**
   - Expected: ✅ Rare (only if OpenAI is actually down)
   - Before fix: Frequent (every gpt-5-mini call)

### Time Window
- Check logs from deployment time forward
- Monitor for at least 30 minutes of active use
- Check across multiple agent types (doc, design, advisor)

---

## ✅ Step 4: Functional Verification

### Test Scenarios

#### Scenario A: Brand Kit Generation (uses gpt-5-mini by default)
1. Create a new brand
2. Enter website URL
3. Run onboarding crawler
4. Verify:
   - ✅ Brand kit generated successfully
   - ✅ No OpenAI errors in logs
   - ✅ `OPENAI_PAYLOAD_PROOF` shows sanitized payload

#### Scenario B: Brand Summary (uses doc agent)
1. Go to existing brand
2. Navigate to brand summary
3. Trigger AI generation
4. Verify:
   - ✅ Summary generated
   - ✅ No fallback to Claude (unless specified)
   - ✅ Logs show sanitized payload

#### Scenario C: Content Generation (design agent)
1. Create a new post
2. Use AI to generate content
3. Verify:
   - ✅ Content generated
   - ✅ No parameter errors

---

## ✅ Step 5: Performance Check

### Before Fix
- gpt-5-mini calls: ~2-3s (includes fallback to Claude)
- Error rate: 100% for gpt-5-mini

### After Fix
- gpt-5-mini calls: ~1-1.5s (direct response)
- Error rate: 0%

### How to Verify
1. Check average response times in Vercel Analytics
2. Compare before/after deployment timestamp
3. Look for reduction in total OpenAI API call volume (no retries)

---

## ✅ Step 6: Evidence Collection

### Take Screenshots
1. Vercel deployment showing commit SHA `42f33f9`
2. Logs showing `OPENAI_PAYLOAD_PROOF` with `false` for penalties/temperature
3. Logs showing **zero** "presence_penalty is not supported" errors
4. Successful brand kit generation in UI

### Export Log Samples
```bash
# Via Vercel CLI
vercel logs [deployment-url] --since 1h > logs-gpt5-fix-verification.txt
grep "OPENAI_PAYLOAD_PROOF" logs-gpt5-fix-verification.txt
grep "presence_penalty is not supported" logs-gpt5-fix-verification.txt
```

---

## 🚨 Troubleshooting

### Issue: Still seeing "presence_penalty is not supported"

**Possible causes**:
1. Old deployment still active (check SHA)
2. Vercel caching (clear cache, redeploy)
3. Another call path exists (search for `chat.completions.create` in codebase)

**Action**:
```bash
# Search for any other OpenAI call sites
cd /Users/krisfoust/Downloads/POSTD
grep -r "chat.completions.create" server/
grep -r "getOpenAIClient" server/
```

### Issue: OPENAI_PAYLOAD_PROOF shows parameters still present

**Cause**: Logging placed BEFORE sanitization

**Fix**: Swap order in code:
```typescript
// ❌ WRONG ORDER
logger.info("OPENAI_PAYLOAD_PROOF", payload);
const sanitized = sanitizeOpenAIPayload(payload);

// ✅ CORRECT ORDER
const sanitized = sanitizeOpenAIPayload(payload);
logger.info("OPENAI_PAYLOAD_PROOF", sanitized);
```

### Issue: No logs at all

**Possible causes**:
1. Logger not configured for production
2. Log level too high (only errors)
3. Deployment hasn't received traffic yet

**Action**: Trigger a brand kit generation manually

---

## 📊 Success Criteria

| Criteria | Status | Evidence |
|----------|--------|----------|
| Vercel SHA = 42f33f9 | ⏳ | Screenshot of deployment |
| OPENAI_PAYLOAD_PROOF logs present | ⏳ | Log samples |
| gpt-5-mini payloads sanitized | ⏳ | hasPresencePenalty=false |
| Zero "presence_penalty" errors | ⏳ | Log search results |
| Brand kit generation works | ⏳ | UI test |
| No unnecessary Claude fallbacks | ⏳ | Log analysis |

**All criteria must be ✅ before considering fix complete.**

---

## 📝 Notes

- Keep `OPENAI_PAYLOAD_PROOF` logs for 24-48 hours
- After verification, downgrade to debug level or gate behind env var
- Monitor error rates for 1 week to ensure stability
- Document any edge cases discovered

---

## 🔗 Related Documents

- [OpenAI Payload Sanitizer Code](../server/lib/openai-payload-sanitizer.ts)
- [OpenAI Payload Sanitizer Tests](../server/__tests__/openai-payload-sanitizer.test.ts)
- [Push Proof](./PUSH_PROOF.md)
- [Vercel Deployment Fix](../VERCEL_DEPLOYMENT_FIX.md)

