# Design Agent HTTP 400 Fix

**Date:** January 2025  
**Issue:** HTTP 400 error when clicking "Generate Concepts" in Visual Concepts (Design Agent) modal

---

## Problem

The frontend was sending a request payload that didn't match the backend contract for `/api/ai/design`, causing a 400 Bad Request error.

**Root Causes:**
1. `brandId` could be `"default-brand"` (invalid UUID) when no brand was selected
2. Missing validation before sending request
3. Poor error handling - only showed "HTTP 400" without context
4. No client-side validation for required fields

---

## Solution

### 1. **Fixed Request Payload** (`DesignAiPanel.tsx`)

**Before:**
```tsx
const brandId = currentBrand?.id || "default-brand"; // ❌ Invalid UUID fallback

await generate({
  brandId, // Could be "default-brand"
  campaignName: formData.campaignName, // Could be empty string
  platform: formData.platform,
  format: formData.format,
  // ...
});
```

**After:**
```tsx
// ✅ Validate brandId exists
if (!currentBrand?.id) {
  toast({
    title: "Missing Brand Context",
    description: "Please select a brand before generating concepts.",
    variant: "destructive",
  });
  return;
}

// ✅ Validate required fields
if (!formData.campaignName?.trim()) {
  toast({ title: "Campaign Name Required", ... });
  return;
}

// ✅ Validate format enum
const validFormats = ["story", "feed", "reel", "short", "ad", "other"] as const;
if (!validFormats.includes(formData.format as any)) {
  toast({ title: "Invalid Format", ... });
  return;
}

// ✅ Send only valid data
await generate({
  brandId: currentBrand.id, // ✅ Always valid UUID
  campaignName: formData.campaignName.trim(),
  platform: formData.platform,
  format: formData.format as "story" | "feed" | "reel" | "short" | "ad" | "other",
  tone: formData.tone?.trim() || undefined, // ✅ Remove empty strings
  visualStyle: formData.visualStyle?.trim() || undefined,
  additionalContext: formData.additionalContext?.trim() || undefined,
});
```

---

### 2. **Enhanced Error Handling** (`useDesignAgent.ts`)

**Before:**
```tsx
if (!response.ok) {
  const error = await response.json().catch(() => ({ message: "Failed to generate concepts" }));
  throw new Error(error.message || `HTTP ${response.status}`); // ❌ Generic "HTTP 400"
}
```

**After:**
```tsx
// ✅ Pre-flight validation
if (!request.brandId) {
  throw new Error("Brand ID is required");
}

// ✅ UUID validation
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
if (!uuidRegex.test(request.brandId)) {
  throw new Error("Invalid brand ID format. Please select a valid brand.");
}

if (!response.ok) {
  let errorMessage = `HTTP ${response.status}`;
  
  try {
    const errorData = await response.json();
    
    // ✅ Extract meaningful error message
    if (errorData.message) {
      errorMessage = errorData.message;
    } else if (errorData.error) {
      errorMessage = errorData.error;
    }
    
    // ✅ Add context for common errors
    if (response.status === 400) {
      if (errorMessage.includes("brandId")) {
        errorMessage = "Missing or invalid brand context. Please select a brand.";
      } else if (errorMessage.includes("platform")) {
        errorMessage = "Platform is required. Please select a platform.";
      } else if (errorMessage.includes("format")) {
        errorMessage = "Format is required. Please select a format.";
      } else if (errorMessage.includes("Missing") || errorMessage.includes("required")) {
        errorMessage = `Missing required field: ${errorMessage}`;
      } else {
        errorMessage = `Invalid request: ${errorMessage}`;
      }
    } else if (response.status === 401) {
      errorMessage = "Authentication required. Please log in again.";
    } else if (response.status === 403) {
      errorMessage = "You don't have permission to generate designs for this brand.";
    } else if (response.status >= 500) {
      errorMessage = "Server error. Please try again in a moment.";
    }
  } catch (parseError) {
    if (response.status === 400) {
      errorMessage = "Invalid request. Please check your input and try again.";
    }
  }
  
  throw new Error(errorMessage);
}
```

---

### 3. **Improved Error UI** (`DesignAiPanel.tsx`)

**Before:**
```tsx
{isError && (
  <Card className="border-red-200 bg-red-50">
    <CardContent className="pt-6">
      <div className="flex items-center gap-2 text-red-700">
        <AlertTriangle className="w-5 h-5" />
        <p className="text-sm">
          {error?.message || "Failed to generate concepts. Please try again."}
        </p>
      </div>
      <Button onClick={handleGenerate} className="mt-4">
        <RefreshCw className="w-4 h-4 mr-2" />
        Retry
      </Button>
    </CardContent>
  </Card>
)}
```

**After:**
```tsx
{isError && (
  <Card className="border-red-200 bg-red-50">
    <CardContent className="pt-6">
      <div className="flex items-start gap-2 text-red-700">
        <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold mb-1">Failed to Generate Concepts</p>
          <p className="text-sm">
            {error?.message || "An unexpected error occurred. Please try again."}
          </p>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleGenerate}
        className="mt-4"
        disabled={isLoading}
      >
        <RefreshCw className="w-4 h-4 mr-2" />
        Retry
      </Button>
    </CardContent>
  </Card>
)}
```

---

## Backend Contract

**Endpoint:** `POST /api/ai/design`  
**Auth:** `authenticateUser` + `requireScope("ai:generate")`

**Request Schema** (from `shared/validation-schemas.ts`):
```typescript
{
  brandId: string (UUID, required),
  campaignName?: string (max 200 chars, optional),
  platform: string (required),
  format: "story" | "feed" | "reel" | "short" | "ad" | "other" (required),
  tone?: string (optional),
  visualStyle?: string (max 200 chars, optional),
  additionalContext?: string (max 1000 chars, optional),
  brandContext?: {
    tone?: string,
    values?: string[],
    targetAudience?: string,
    forbiddenPhrases?: string[],
    requiredDisclaimers?: string[],
    allowedToneDescriptors?: string[],
  } (optional)
}
```

**Response:**
```typescript
{
  variants: AiDesignVariant[],
  brandContext: AiAgentBrandContext,
  request: AiDesignGenerationRequest,
  metadata: AiAgentMetadata,
  warnings?: AiAgentWarning[],
}
```

---

## Files Changed

1. **`client/components/postd/studio/DesignAiPanel.tsx`**
   - Added `useToast` import
   - Added client-side validation before API call
   - Removed `"default-brand"` fallback
   - Added validation for brandId, campaignName, platform, format
   - Improved error display UI
   - Trim empty strings and convert to `undefined` for optional fields

2. **`client/components/postd/studio/hooks/useDesignAgent.ts`**
   - Added pre-flight validation (brandId, platform, format)
   - Added UUID format validation for brandId
   - Enhanced error parsing and messaging
   - Added context-specific error messages for 400, 401, 403, 500+ status codes

---

## Validation Flow

### Client-Side (Before API Call)
1. ✅ Check `currentBrand?.id` exists
2. ✅ Check `campaignName` is not empty (trimmed)
3. ✅ Check `platform` is selected
4. ✅ Check `format` is selected
5. ✅ Validate `format` matches backend enum
6. ✅ Validate `brandId` is valid UUID format

### API Call
1. ✅ Send only valid, trimmed data
2. ✅ Convert empty strings to `undefined` for optional fields
3. ✅ Ensure `brandId` is always a valid UUID

### Error Handling
1. ✅ Parse backend error response
2. ✅ Extract meaningful error message
3. ✅ Add context for common error types
4. ✅ Display user-friendly error in UI

---

## Testing Checklist

### ✅ Pre-Validation
- [x] No brand selected → Shows "Missing Brand Context" toast
- [x] Empty campaign name → Shows "Campaign Name Required" toast
- [x] No platform selected → Shows "Platform Required" toast
- [x] No format selected → Shows "Format Required" toast

### ✅ Request Payload
- [x] `brandId` is valid UUID (not "default-brand")
- [x] `campaignName` is trimmed and non-empty
- [x] `platform` is a string
- [x] `format` matches enum: "story" | "feed" | "reel" | "short" | "ad" | "other"
- [x] Optional fields (`tone`, `visualStyle`, `additionalContext`) are `undefined` if empty

### ✅ Error Handling
- [x] 400 errors show meaningful message (not just "HTTP 400")
- [x] Missing brandId → "Missing or invalid brand context"
- [x] Missing platform → "Platform is required"
- [x] Missing format → "Format is required"
- [x] 401 errors → "Authentication required"
- [x] 403 errors → "You don't have permission"
- [x] 500+ errors → "Server error"

### ✅ Success Flow
- [x] Valid request → Concepts generated and displayed
- [x] Variants render correctly
- [x] BFS scores display
- [x] "Use Prompt" button works

---

## Network Tab Verification

**Before Fix:**
```json
// Request body (causing 400)
{
  "brandId": "default-brand",  // ❌ Invalid UUID
  "campaignName": "",           // ❌ Empty string
  "platform": "instagram",
  "format": "feed"
}
```

**After Fix:**
```json
// Request body (valid)
{
  "brandId": "550e8400-e29b-41d4-a716-446655440000",  // ✅ Valid UUID
  "campaignName": "Fall Promotion",                    // ✅ Trimmed, non-empty
  "platform": "instagram",                            // ✅ Valid
  "format": "feed",                                    // ✅ Valid enum value
  "tone": undefined,                                   // ✅ Not sent if empty
  "visualStyle": undefined,                            // ✅ Not sent if empty
  "additionalContext": undefined                       // ✅ Not sent if empty
}
```

---

## Summary

**Status:** ✅ **FIXED**

**Changes:**
- ✅ Removed invalid `"default-brand"` fallback
- ✅ Added client-side validation for all required fields
- ✅ Added UUID format validation
- ✅ Enhanced error handling with meaningful messages
- ✅ Improved error UI display
- ✅ Trim empty strings and convert to `undefined`

**Result:**
- ✅ Request payload now matches backend contract
- ✅ HTTP 400 errors resolved
- ✅ Users see helpful error messages instead of "HTTP 400"
- ✅ Validation prevents invalid requests before API call

---

**Last Updated:** January 2025

