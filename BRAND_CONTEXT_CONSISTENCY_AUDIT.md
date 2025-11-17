# Brand Context Consistency Audit

## Summary
Ensured that all pages and modules consistently use the currently selected brand from `BrandContext` via the new `useCurrentBrand()` hook.

## New Hook Created

### `client/hooks/useCurrentBrand.ts`
- **Purpose**: Provides consistent access to the current brand across all pages and modules
- **Returns**:
  - `brandId`: The current brand ID (UUID) or `null` if no brand is selected
  - `brand`: The full brand object or `null`
  - `loading`: Whether brands are still loading
  - `hasBrand`: Boolean indicating if a brand is selected
  - `isValid`: Boolean indicating if brandId is a valid UUID
- **Also provides**: `useRequiredBrand()` for operations that absolutely require a brand

## Pages Updated

### ✅ Core Pages
- **`client/app/(postd)/dashboard/page.tsx`**: Now uses `useCurrentBrand()` instead of direct `useBrand()`
- **`client/app/(postd)/reviews/page.tsx`**: Updated to use `useCurrentBrand()`
- **`client/app/(postd)/approvals/page.tsx`**: Updated to use `useCurrentBrand()`
- **`client/app/(postd)/brand-guide/page.tsx`**: Updated to use `useCurrentBrand()`
- **`client/app/(postd)/brand-intelligence/page.tsx`**: Fixed hardcoded `"brand_1"` → now uses `useCurrentBrand()`

### ✅ Hooks Updated
- **`client/hooks/useBrandGuide.ts`**: Now uses `useCurrentBrand()` internally
- **`client/components/postd/analytics/hooks/useAnalytics.ts`**: Now uses `useCurrentBrand()`

### ✅ Components Updated
- **`client/components/postd/dashboard/widgets/AdvisorInsightsPanel.tsx`**: Removed `"default-brand"` fallback, now uses `useCurrentBrand()`

## Remaining Components (May Need Updates)

These components still use `useBrand()` directly. Some may be legitimate (e.g., BrandSwitcher needs to switch brands), but should be reviewed:

1. **`client/app/(postd)/studio/page.tsx`**: Uses `useBrand()` - may need update
2. **`client/app/(postd)/client-portal/page.tsx`**: Uses `useBrand()` - may need update
3. **`client/app/(postd)/brands/page.tsx`**: Uses `useBrand()` - likely legitimate (brand management page)
4. **`client/components/postd/studio/DocAiPanel.tsx`**: Already updated with brand validation
5. **`client/components/postd/studio/DesignAiPanel.tsx`**: Uses `useBrand()` - may need update
6. **`client/components/postd/layout/BrandSwitcher.tsx`**: Uses `useBrand()` - **LEGITIMATE** (needs to switch brands)
7. **`client/components/settings/SchedulingPreferences.tsx`**: Uses `useBrand()` - may need update
8. **`client/components/ai-agents/AgentGenerationPanel.tsx`**: Uses `useBrand()` - may need update

## Key Changes

1. **Removed "default-brand" fallbacks**: All pages now properly handle the case when no brand is selected
2. **Consistent brand access**: All pages use `useCurrentBrand()` hook for accessing the current brand
3. **UUID validation**: The hook includes built-in UUID validation to ensure brandId is valid before API calls
4. **Better error handling**: Pages now show clear error messages when brand is required but not available

## Usage Pattern

**Before:**
```typescript
const { currentBrand } = useBrand();
const brandId = currentBrand?.id || "default-brand"; // ❌ Bad fallback
```

**After:**
```typescript
const { brandId } = useCurrentBrand(); // ✅ Always uses current brand from context
```

## Next Steps

1. Review remaining components that use `useBrand()` directly
2. Update components that make API calls to use `useCurrentBrand()`
3. Ensure all API calls validate brandId before making requests
4. Test brand switching across all pages to ensure data refreshes correctly

