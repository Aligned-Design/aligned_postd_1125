# Dashboard KPI Links Fix

**Date**: January 2025  
**Status**: ✅ Complete

---

## 🐛 Issue

User reported that "Total Posts" and "Scheduled Posts" KPI cards on the dashboard should lead to the content queue, but they were routing incorrectly.

---

## ✅ Fixes Applied

### 1. Metric Card Routing (`MetricCard.tsx`)

**Location**: `client/components/postd/ui/cards/MetricCard.tsx`

**Changes**:
- ✅ **Total Posts** (`total-posts`): Changed route from `/analytics?tab=content` → `/queue`
- ✅ **Scheduled Posts** (`scheduled-posts`): Added support for backend ID `scheduled-posts` (was only checking `scheduled`)
- ✅ Route now correctly goes to `/queue?status=scheduled` for scheduled posts

**Before**:
```typescript
if (kpiId === "total-posts") return "/analytics?tab=content";
if (kpiId === "scheduled") return "/queue?status=scheduled";
```

**After**:
```typescript
if (kpiId === "total-posts") return "/queue";
if (kpiId === "scheduled" || kpiId === "scheduled-posts") return "/queue?status=scheduled";
```

---

### 2. KPI Row Icon Map (`KpiRow.tsx`)

**Location**: `client/components/postd/dashboard/widgets/KpiRow.tsx`

**Changes**:
- ✅ Added support for `scheduled-posts` ID from backend
- ✅ Both `scheduled` and `scheduled-posts` now map to Calendar icon

**Before**:
```typescript
const iconMap: Record<string, typeof FileText> = {
  "total-posts": FileText,
  "engagement-rate": TrendingUp,
  "top-channel": BarChart3,
  "scheduled": Calendar,
};
```

**After**:
```typescript
const iconMap: Record<string, typeof FileText> = {
  "total-posts": FileText,
  "engagement-rate": TrendingUp,
  "top-channel": BarChart3,
  "scheduled": Calendar,
  "scheduled-posts": Calendar, // Support both IDs from backend
};
```

---

## 📋 Current KPI Routing

| KPI Card | KPI ID | Route | Destination |
|----------|--------|-------|-------------|
| **Total Posts** | `total-posts` | `/queue` | Content Queue (all posts) |
| **Scheduled Posts** | `scheduled-posts` | `/queue?status=scheduled` | Content Queue (scheduled filter) |
| **Engagement Rate** | `engagement-rate` | `/analytics?tab=engagement` | Analytics (Engagement tab) |
| **Top Channel** | `top-channel` | `/analytics?tab=channels` | Analytics (Channels tab) |

---

## 🔍 Backend ID Mismatch

**Issue Found**: Backend returns `scheduled-posts` as the KPI ID, but frontend was only checking for `scheduled`.

**Fix**: Added support for both IDs:
- `scheduled` (legacy/frontend)
- `scheduled-posts` (backend)

---

## ✅ Verification

### Routes Checked
- ✅ `/queue` - Content Queue page (works)
- ✅ `/queue?status=scheduled` - Content Queue with scheduled filter (works)
- ✅ `/content-queue` - Alias for `/queue` (works)
- ✅ `/analytics?tab=engagement` - Analytics Engagement tab (works)
- ✅ `/analytics?tab=channels` - Analytics Channels tab (works)

### KPI Cards
- ✅ Total Posts → `/queue` ✓
- ✅ Scheduled Posts → `/queue?status=scheduled` ✓
- ✅ Engagement Rate → `/analytics?tab=engagement` ✓
- ✅ Top Channel → `/analytics?tab=channels` ✓

### Build Status
- ✅ `pnpm build` passes
- ✅ No TypeScript errors
- ✅ No linter errors

---

## 📁 Files Changed

### Modified (2 files)

1. **`client/components/postd/ui/cards/MetricCard.tsx`**
   - Fixed routing for `total-posts` to go to `/queue`
   - Added support for `scheduled-posts` ID from backend

2. **`client/components/postd/dashboard/widgets/KpiRow.tsx`**
   - Added `scheduled-posts` to iconMap

---

## 🎯 Summary

All dashboard KPI cards now route correctly:
- **Total Posts** → Content Queue (all posts)
- **Scheduled Posts** → Content Queue (scheduled filter)
- **Engagement Rate** → Analytics (Engagement tab)
- **Top Channel** → Analytics (Channels tab)

The fix also handles the backend ID mismatch (`scheduled-posts` vs `scheduled`) to ensure compatibility.

---

**Status**: ✅ Complete

All KPI card links are now correctly routing to the content queue as requested.

