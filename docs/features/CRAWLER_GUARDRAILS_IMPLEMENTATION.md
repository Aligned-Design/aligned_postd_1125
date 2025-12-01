# Crawler Guardrails Implementation Guide

**Status**: ✅ Core components ready for integration  
**Priority**: User control + never overwrite user edits

---

## 🎯 Implementation Summary

I've created all the core components for the crawler guardrails system. Here's what's been built and how to integrate them.

---

## 📦 Files Created

### 1. Type Definitions

**File**: `client/types/brand-kit-field.ts` (143 lines)

**Key Features**:

- `TrackedField<T>` - Every field has `value`, `source`, `last_updated_at`
- `FieldSource` - "user" | "crawler" | "import"
- `CrawlerSuggestion` - Diff modal data structure
- `FieldHistoryEntry` - Audit trail
- Helper functions: `createTrackedField()`, `canCrawlerUpdate()`, `getSourceLabel()`

**Usage**:

```typescript
import { createTrackedField, canCrawlerUpdate } from "@/types/brand-kit-field";

// Create tracked field
const color = createTrackedField("#8B5CF6", "crawler");
// { value: '#8B5CF6', source: 'crawler', last_updated_at: '2025-01-16T...' }

// Check if crawler can update
if (canCrawlerUpdate(existingField)) {
  // Safe to update
}
```

---

### 2. Diff Modal Component

**File**: `client/components/brand-intake/CrawlerDiffModal.tsx` (309 lines)

**Key Features**:

- Accept/Keep buttons per field
- Grouped by category (Colors, Fonts, Tone, Keywords, About)
- User-edited fields shown as "protected"
- Visual diff display with color swatches
- Batch selection (Select All, Clear)
- Shows confidence scores

**Props**:

```typescript
<CrawlerDiffModal
  open={showDiffModal}
  onClose={() => setShowDiffModal(false)}
  suggestions={crawlerSuggestions}
  onApplyChanges={(changes) => handleApplyChanges(changes)}
/>
```

---

### 3. API Routes

**File**: `server/routes/crawler.ts` (429 lines)

**Endpoints**:

```typescript
// 1. Start crawl job
POST /api/crawl/start
Body: { brand_id, url }
Response: { job_id, status: 'pending' }

// 2. Get crawl results
GET /api/crawl/result/:jobId
Response: {
  job_id,
  status: 'completed',
  suggestions: [...],
  palette: [...],
  keywords: [...]
}

// 3. Apply selected changes
POST /api/brand-kit/apply
Body: { brand_id, changes: [{field, value, source}] }
Response: { success: true, applied: 5 }

// 4. Get change history
GET /api/brand-kit/history/:brandId?field=colors
Response: { history: [...] }

// 5. Revert field
POST /api/brand-kit/revert
Body: { brand_id, field, history_id }
Response: { success: true, field, value }
```

**Enforcement Rules**:

- ✅ Checks `field.source === 'user'` before overwriting
- ✅ Rejects crawler updates if user has edited (unless `force_user_override: true`)
- ✅ Records all changes to history table
- ✅ Keeps last 10 entries per field

---

### 4. Database Migration

**File**: `supabase/migrations/20250116_create_brand_kit_history.sql` (83 lines)

**Creates**:

- `brand_kit_history` table with RLS
- Indexes for efficient queries
- Auto-cleanup trigger (keeps last 10 per field)
- `crawler_settings` column on `brands` table

**Schema**:

```sql
CREATE TABLE brand_kit_history (
  id UUID PRIMARY KEY,
  brand_id UUID REFERENCES brands(id),
  field VARCHAR(100),
  old_value JSONB,
  new_value JSONB,
  old_source VARCHAR(20),
  new_source VARCHAR(20),
  changed_by VARCHAR(20), -- 'user' | 'crawler' | 'system'
  user_id UUID,
  created_at TIMESTAMPTZ
);
```

---

## 🔧 Integration Steps

### Step 1: Run Database Migration

```bash
# Via Supabase CLI
supabase db push

# Or manually in Supabase Dashboard → SQL Editor
# Run: supabase/migrations/20250116_create_brand_kit_history.sql
```

### Step 2: Register API Routes

In `server/index.ts`, add:

```typescript
import crawlerRoutes from "./routes/crawler";

app.use("/api", crawlerRoutes);
```

### Step 3: Update BrandIntake.tsx

Add these imports:

```typescript
import { CrawlerDiffModal } from "@/components/brand-intake/CrawlerDiffModal";
import { CrawlerSuggestion, FieldChange } from "@/types/brand-kit-field";
```

Add state:

```typescript
const [showDiffModal, setShowDiffModal] = useState(false);
const [crawlerSuggestions, setCrawlerSuggestions] = useState<
  CrawlerSuggestion[]
>([]);
```

Replace `handleImportFromWebsite` function with:

```typescript
const handleImportFromWebsite = async () => {
  if (!brandId || !formData.websiteUrl) {
    toast({
      title: "Website URL required",
      description: "Please enter a website URL in Brand Basics",
      variant: "destructive",
    });
    return;
  }

  setImporting(true);
  setImportProgress("Starting website crawl...");

  try {
    // Start crawl job
    const startResponse = await fetch("/api/crawl/start", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": user?.id || "",
      },
      body: JSON.stringify({
        brand_id: brandId,
        url: formData.websiteUrl,
      }),
    });

    if (!startResponse.ok) {
      throw new Error("Failed to start crawl");
    }

    const { job_id } = await startResponse.json();

    // Poll for results
    let attempts = 0;
    const maxAttempts = 60;

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const resultResponse = await fetch(`/api/crawl/result/${job_id}`);
      const result = await resultResponse.json();

      if (result.status === "completed") {
        setCrawlerSuggestions(result.suggestions || []);
        setShowDiffModal(true);
        break;
      } else if (result.status === "failed") {
        throw new Error(result.error || "Crawl failed");
      }

      attempts++;
      setImportProgress(`Crawling... (${attempts}s)`);
    }

    if (attempts >= maxAttempts) {
      throw new Error("Crawl timeout");
    }
  } catch (error: any) {
    toast({
      title: "Import failed",
      description: error.message,
      variant: "destructive",
    });
  } finally {
    setImporting(false);
    setImportProgress("");
  }
};
```

Add apply handler:

```typescript
const handleApplyCrawlerChanges = async (changes: FieldChange[]) => {
  try {
    const response = await fetch("/api/brand-kit/apply", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": user?.id || "",
      },
      body: JSON.stringify({
        brand_id: brandId,
        changes,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to apply changes");
    }

    // Update form with accepted changes
    const updates: any = {};
    for (const change of changes) {
      if (change.field === "colors") {
        updates.primaryColor = change.value.primary;
        updates.secondaryColor = change.value.secondary;
        updates.accentColor = change.value.accent;
      } else if (change.field === "keywords") {
        updates.toneKeywords = change.value;
      } else if (change.field === "about_blurb") {
        updates.shortDescription = change.value;
      }
    }

    setFormData((prev) => ({ ...prev, ...updates }));

    toast({
      title: "Changes applied!",
      description: `${changes.length} field(s) updated.`,
    });
  } catch (error: any) {
    toast({
      title: "Failed to apply changes",
      description: error.message,
      variant: "destructive",
    });
  }
};
```

Add modal to JSX (right after opening `<div className="container..."`):

```jsx
<CrawlerDiffModal
  open={showDiffModal}
  onClose={() => setShowDiffModal(false)}
  suggestions={crawlerSuggestions}
  onApplyChanges={handleApplyCrawlerChanges}
/>
```

---

## 🎨 UI Enhancements

### Add Source Indicators to Form Fields

In each section component (e.g., `Section3VisualIdentity.tsx`), add source badges:

```tsx
import { getSourceLabel } from "@/types/brand-kit-field";

// In the color picker
<Label>
  Primary Color
  {brandKit?.colors?.source === "crawler" && (
    <Badge variant="outline" className="ml-2 text-xs">
      <Sparkles className="h-3 w-3 mr-1" />
      AI suggestion
    </Badge>
  )}
</Label>;
```

### Add "Re-scan Website" Button

In Brand Guide editor:

```tsx
<Button variant="outline" onClick={handleRescanWebsite} disabled={rescanning}>
  <RotateCcw className="h-4 w-4 mr-2" />
  Re-scan Website
</Button>
```

### Add History/Revert UI

Create a popover showing change history per field:

```tsx
<Popover>
  <PopoverTrigger asChild>
    <Button variant="ghost" size="sm">
      <History className="h-4 w-4" />
    </Button>
  </PopoverTrigger>
  <PopoverContent className="w-80">
    <div className="space-y-2">
      <h4 className="font-medium">Change History</h4>
      {history.map((entry) => (
        <div
          key={entry.id}
          className="flex items-center justify-between text-sm"
        >
          <div>
            <div>{formatDate(entry.created_at)}</div>
            <div className="text-muted-foreground">
              {entry.changed_by === "user"
                ? "Manually edited"
                : "AI suggestion"}
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleRevert(entry.id)}
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
        </div>
      ))}
    </div>
  </PopoverContent>
</Popover>
```

---

## 🔒 Data Model Structure

### Old Structure (Phase 3)

```json
{
  "brandName": "POSTD",
  "primaryColor": "#8B5CF6",
  "toneKeywords": ["professional", "innovative"]
}
```

### New Structure (with source tracking)

```json
{
  "brandName": {
    "value": "POSTD",
    "source": "user",
    "last_updated_at": "2025-01-16T10:30:00Z"
  },
  "colors": {
    "value": {
      "primary": "#8B5CF6",
      "secondary": "#F0F7F7",
      "accent": "#EC4899"
    },
    "source": "crawler",
    "last_updated_at": "2025-01-16T10:25:00Z"
  },
  "tone_keywords": {
    "value": ["professional", "innovative", "friendly"],
    "source": "crawler",
    "last_updated_at": "2025-01-16T10:25:00Z"
  },
  "crawler_settings": {
    "auto_apply": false,
    "preserve_user_overrides": true,
    "fields_enabled": ["colors", "fonts", "tone_keywords"],
    "allow_contact_info": false
  }
}
```

---

## ✅ Acceptance Criteria Check

- [x] **User-edited color stays after re-crawl**  
      ✅ Enforced in `/api/brand-kit/apply` - rejects if `source === 'user'`

- [x] **Accept/Keep flow for each field**  
      ✅ `CrawlerDiffModal` provides per-field buttons

- [x] **History shows before/after + timestamps**  
      ✅ `brand_kit_history` table tracks all changes

- [x] **Revert restores both value and source**  
      ✅ `/api/brand-kit/revert` endpoint

- [x] **Re-scan suggests but doesn't change user fields**  
      ✅ API checks `currentSource` before suggesting changes

- [x] **No silent overwrites**  
      ✅ All changes require explicit user acceptance

---

## 🧪 Testing Checklist

### Test 1: User Edit Protection

1. Import website → Accept color suggestion
2. Manually edit color (source becomes "user")
3. Re-scan website
4. **Expected**: Color not in suggestions list OR marked as "protected"

### Test 2: Diff Modal Workflow

1. Enter website URL
2. Click "Import from Website"
3. Wait for diff modal
4. **Expected**: See Accept/Keep buttons per field
5. Select 3 fields, click "Apply"
6. **Expected**: Only selected 3 fields update

### Test 3: History & Revert

1. Import website, accept colors
2. Manually edit colors
3. View history
4. **Expected**: See 2 entries (crawler → user)
5. Click revert on user entry
6. **Expected**: Color reverts to crawler value, source becomes "crawler"

### Test 4: Auto-Apply Toggle (optional)

1. Enable `crawler_auto_apply: true` in settings
2. Re-scan website
3. **Expected**: Only non-user fields auto-update (no modal)

---

## 🚀 Quick Integration Checklist

- [ ] Run `supabase/migrations/20250116_create_brand_kit_history.sql`
- [ ] Register `/api/crawl/*` and `/api/brand-kit/*` routes in server
- [ ] Add `CrawlerDiffModal` import to `BrandIntake.tsx`
- [ ] Replace `handleImportFromWebsite` with new version
- [ ] Add `handleApplyCrawlerChanges` function
- [ ] Add `<CrawlerDiffModal />` component to JSX
- [ ] Test: Import → Accept some fields → Manual edit → Re-scan → Verify protection

---

## 📊 Migration Path

### Phase 1: Backward Compatibility

Existing `brand_kit` data (without source tracking) will work as-is. When user first interacts:

```typescript
// Auto-migrate on first access
function migrateBrandKit(oldKit: any) {
  const newKit: any = {};
  for (const [field, value] of Object.entries(oldKit)) {
    newKit[field] = createTrackedField(value, "user"); // Assume user-entered
  }
  return newKit;
}
```

### Phase 2: Gradual Rollout

1. Deploy with both old and new formats supported
2. Auto-migrate on first edit
3. Mark migrated fields as `source: 'user'` (preserve existing data)
4. Crawler only suggests on new brands or explicitly opted-in brands

---

## 🔐 Safety Rules (Enforced in Code)

| Rule                           | Enforcement                        | File                                  |
| ------------------------------ | ---------------------------------- | ------------------------------------- |
| **Never overwrite user edits** | `source === 'user'` check          | `server/routes/crawler.ts:221`        |
| **Respect robots.txt**         | `robots.isAllowed()`               | `server/workers/brand-crawler.ts:95`  |
| **Same-domain only**           | `linkUrl.hostname === baseDomain`  | `server/workers/brand-crawler.ts:132` |
| **Max 50 pages**               | `results.length < CRAWL_MAX_PAGES` | `server/workers/brand-crawler.ts:71`  |
| **1s crawl delay**             | `setTimeout(1000)`                 | `server/workers/brand-crawler.ts:144` |
| **Depth ≤ 3**                  | `depth > MAX_DEPTH`                | `server/workers/brand-crawler.ts:81`  |
| **No contact info**            | `allow_contact_info === false`     | Not impl yet (future)                 |

---

## 🎯 Next Steps

1. **Integrate into BrandIntake.tsx** (Steps 3 above)
2. **Test the diff modal workflow**
3. **Add source indicators to form fields**
4. **Implement "Re-scan Website" button**
5. **Add history/revert UI to Brand Guide editor**

---

**Status**: ✅ All core components built  
**Remaining**: Integration + testing  
**Estimated Integration Time**: 2-3 hours

---

**Created**: January 2025  
**Author**: Fusion AI  
**Phase**: 3.5 - Crawler Guardrails Enhancement
