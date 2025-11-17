# Phase 5 - Code Reference Guide

Quick reference to verify each requirement in the codebase.

## 1. API Response Structure

**File:** `server/routes/advisor.ts`

**Lines 149-159** (Retry path):
```typescript
const response: AdvisorResponse = {
  insights,
  brandFidelityScore: retryComplianceResult.brandFidelityScore,  // ✅
  compliance: retryComplianceResult.compliance,                   // ✅
  rawModelInfo: { ... }
};
```

**Lines 168-178** (Normal path):
```typescript
const response: AdvisorResponse = {
  insights,
  brandFidelityScore: complianceResult.brandFidelityScore,  // ✅
  compliance: complianceResult.compliance,                   // ✅
  rawModelInfo: { ... }
};
```

## 2. Retry Logic

**File:** `server/routes/advisor.ts`

**Line 126:** Calculate BFS
```typescript
const complianceResult = calculateAdvisorBFS(insights, brand);
```

**Line 129:** Check if retry needed
```typescript
if (shouldRetryAdvisor(complianceResult) && attempt < maxAttempts) {
```

**File:** `server/lib/ai/advisorCompliance.ts`

**Line 117:** Threshold check
```typescript
return complianceResult.brandFidelityScore < 0.8;
```

**Line 161:** Log with retry flag
```typescript
logAdvisorCall(provider, latencyMs, retryComplianceResult.brandFidelityScore, true);
```

## 3. Provider Fallback

**File:** `server/routes/advisor.ts`

**Lines 182-191:**
```typescript
} catch (error) {
  if (attempt === maxAttempts) {
    throw error;
  }
  provider = provider === "openai" ? "anthropic" : "openai";
  console.log(`Attempt ${attempt} failed, trying provider: ${provider}`);
}
```

## 4. UI Elements

**File:** `client/components/postd/dashboard/widgets/AdvisorInsightsPanel.tsx`

**BFS Badge:** Lines 134-142
**Compliance Warning:** Lines 160-181
**Severity Styles:** Lines 15-20, applied at line 190
**Confidence:** Lines 197-201
**Recommended Actions:** Lines 206-215
**Category Badge:** Lines 218-221

## 5. Error Handling

**File:** `client/components/postd/dashboard/widgets/AdvisorInsightsPanel.tsx`

**Error State:** Lines 61-84
**Retry Button:** Line 78 calls `refetch()`

**File:** `server/routes/advisor.ts`

**Error Classification:** Lines 207-239

## 6. Empty State

**File:** `client/components/postd/dashboard/widgets/AdvisorInsightsPanel.tsx`

**Empty State:** Lines 87-109
**Condition:** `insights.length === 0 && !isLoading && !isError`

