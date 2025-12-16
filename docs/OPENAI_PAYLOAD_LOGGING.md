# OpenAI Payload Logging Control

**Feature**: `OPENAI_PAYLOAD_PROOF` logging  
**Purpose**: Verify payload sanitization is working correctly in production  
**Added**: 2025-12-15 (commits `e6ccf8e`, `42f33f9`)

---

## What Gets Logged

Every OpenAI API call logs the following (NO sensitive data):

```json
{
  "message": "OPENAI_PAYLOAD_PROOF",
  "model": "gpt-5-mini",
  "hasTemperature": false,
  "temperatureValue": undefined,
  "hasPresencePenalty": false,
  "presencePenaltyValue": undefined,
  "hasFrequencyPenalty": false,
  "frequencyPenaltyValue": undefined,
  "messageCount": 2,
  "agentType": "doc",
  "endpoint": "generateWithChatCompletions"
}
```

**What is NOT logged**:
- ❌ Prompt content
- ❌ API keys
- ❌ User data
- ❌ Generated content

---

## Default Behavior

**✅ ENABLED by default** - Logs are active on all deployments unless explicitly disabled.

This allows verification that:
- gpt-5-mini payloads don't include unsupported parameters
- Sanitization is working correctly
- No "presence_penalty is not supported" errors

---

## How to Disable Logging

### Option 1: Vercel Environment Variable (Recommended)

1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add new variable:
   ```
   Name: OPENAI_PAYLOAD_DEBUG
   Value: false
   ```
3. Select environments: Production, Preview, Development (as needed)
4. Save
5. Redeploy

**Result**: No more `OPENAI_PAYLOAD_PROOF` logs in production

### Option 2: Local Development (.env)

Add to your `.env` file:
```bash
OPENAI_PAYLOAD_DEBUG=false
```

**Result**: No logs during local development

### Option 3: Completely Remove Logging (Code Change)

If you want to remove the logging code entirely after verification:

```bash
# Search for all OPENAI_PAYLOAD_PROOF logs
grep -r "OPENAI_PAYLOAD_PROOF" server/

# Files to edit:
# - server/lib/openai-client.ts (line ~234)
# - server/workers/ai-generation.ts (line ~269)
```

Delete the `if (process.env.OPENAI_PAYLOAD_DEBUG !== "false")` blocks.

---

## Recommended Timeline

### Week 1: Verification (Logging ON)
- ✅ Keep logging enabled
- Monitor for any "presence_penalty" errors
- Verify sanitization working correctly
- Check all agent types (doc, design, advisor)

### Week 2+: Steady State (Logging OFF)
- Set `OPENAI_PAYLOAD_DEBUG=false` in Vercel
- Keep sanitization code (DO NOT remove)
- Re-enable logging if debugging OpenAI issues

---

## Troubleshooting

### "Logs are too noisy"

**Immediate fix**: Set `OPENAI_PAYLOAD_DEBUG=false` in Vercel

**Why logs exist**: They prove the fix is working. After 24-48 hours of verification, it's safe to disable them.

### "I need to verify sanitization again"

**Re-enable logging**:
1. Remove `OPENAI_PAYLOAD_DEBUG` env var from Vercel, OR
2. Set `OPENAI_PAYLOAD_DEBUG=true`
3. Redeploy
4. Check logs

### "Logs show parameters still present for gpt-5-mini"

**This is a bug** - Either:
- Another call path bypasses sanitization
- Sanitization not applied
- Logging placed before sanitization

**Action**: Search for all `chat.completions.create` calls and verify they use the sanitizer.

---

## Log Analysis Queries

### Vercel Dashboard

**Find all payload logs**:
```
OPENAI_PAYLOAD_PROOF
```

**Find gpt-5-mini calls only**:
```
OPENAI_PAYLOAD_PROOF model:gpt-5-mini
```

**Find calls with penalties (should be none for gpt-5)**:
```
OPENAI_PAYLOAD_PROOF hasPresencePenalty:true
```

### CLI (vercel logs)

```bash
# Get logs from last hour
vercel logs [deployment] --since 1h > logs.txt

# Filter for payload proof
grep "OPENAI_PAYLOAD_PROOF" logs.txt

# Count by model
grep "OPENAI_PAYLOAD_PROOF" logs.txt | grep -o '"model":"[^"]*"' | sort | uniq -c
```

---

## Performance Impact

**Minimal** - Logging adds ~1-2ms per OpenAI call.

- Logger is async (non-blocking)
- Only logs metadata (no large payloads)
- Negligible impact on response time

**If you're concerned**: Disable after verification (see above).

---

## Related Files

- `server/lib/openai-client.ts` - Main OpenAI client with sanitization
- `server/workers/ai-generation.ts` - AI generation worker with sanitization
- `server/lib/openai-payload-sanitizer.ts` - Sanitization logic
- `docs/VERCEL_GPT5_FIX_VERIFICATION.md` - Verification checklist

---

## Summary

| Setting | Logs Enabled? | Use Case |
|---------|---------------|----------|
| Default (no env var) | ✅ YES | Initial verification, debugging |
| `OPENAI_PAYLOAD_DEBUG=false` | ❌ NO | Production after verification |
| `OPENAI_PAYLOAD_DEBUG=true` | ✅ YES | Re-enable for debugging |

**Recommendation**: Keep enabled for 24-48 hours after deployment, then disable with `OPENAI_PAYLOAD_DEBUG=false`.

