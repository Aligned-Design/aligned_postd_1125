# Schema Type Mapping - TypeScript ↔ Database

**Quick Reference:** Which TypeScript types map to which database tables

---

## 🎯 Core Tables

### `brands` table

**TypeScript Types:**
```typescript
// shared/brand-guide.ts
export interface BrandGuide {
  id: string;
  brandId: string;
  brandName: string;
  identity: { name, businessType, industryKeywords, competitors };
  voiceAndTone: { tone, friendlinessLevel, formalityLevel, ... };
  visualIdentity: { colors, typography, photographyStyle, logoUrl };
  contentRules: { platformGuidelines, preferredPlatforms, ... };
  approvedAssets?: { uploadedPhotos, ... };
  // ... stored in brand_kit JSONB column
}
```

**Database Columns:**
- `id` → `BrandGuide.id`
- `name` → `BrandGuide.brandName`
- `brand_kit` (JSONB) → entire `BrandGuide` object
- `voice_summary` (TEXT/JSONB) → `BrandGuide.voiceAndTone` subset
- `visual_summary` (TEXT/JSONB) → `BrandGuide.visualIdentity` subset
- `tone_keywords` (TEXT[]) → `BrandGuide.voiceAndTone.tone`
- `logo_url` → `BrandGuide.visualIdentity.logoUrl`
- `primary_color` → `BrandGuide.visualIdentity.colors[0]`

**Normalization Function:**
```typescript
normalizeBrandGuide(legacy: any): BrandGuide
// Converts database row to TypeScript BrandGuide
```

---

### `brand_members` table

**TypeScript Types:**
```typescript
// No explicit interface in code yet
// Inferred from database operations:
interface BrandMemberRecord {
  id: string;
  brand_id: string;
  user_id: string; // FK to auth.users
  role: 'owner' | 'admin' | 'member';
  created_at: string;
  updated_at: string;
}
```

**Database Columns:**
- All columns map 1:1 to interface
- `user_id` references `auth.users(id)` NOT `user_profiles(id)`

---

### `media_assets` table

**TypeScript Types:**
```typescript
// server/lib/media-db-service.ts
export interface MediaAssetRecord {
  id: string;
  tenant_id: string;
  brand_id: string;
  category?: "graphics" | "images" | "logos" | "videos" | "ai_exports" | "client_uploads";
  filename: string;
  mime_type: string;
  path: string;
  size_bytes: number; // ✅ NOT file_size
  hash?: string;
  metadata?: Record<string, unknown>;
  used_in?: string[];
  usage_count: number;
  created_at: string;
  updated_at: string;
}

// server/routes/media.ts
interface MediaAsset {
  id: string;
  brandId: string;        // Mapped from brand_id (camelCase)
  filename: string;
  mimeType: string;       // Mapped from mime_type
  size: number;           // Mapped from size_bytes
  url: string;            // Generated, not in DB
  bucketPath: string;     // Mapped from path
  category?: string;
  createdAt: string;
  updatedAt: string;
}
```

**Mapping Function:**
```typescript
// server/routes/media.ts
function mapAssetRecord(record: MediaAssetRecord): MediaAsset {
  return {
    id: record.id,
    brandId: record.brand_id,        // snake_case → camelCase
    filename: record.filename,
    mimeType: record.mime_type,      // snake_case → camelCase
    size: record.size_bytes,         // renamed
    url: generateUrl(record.path),
    bucketPath: record.path,
    category: record.category,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}
```

---

### `storage_quotas` table

**TypeScript Types:**
```typescript
// server/lib/media-db-service.ts
export interface StorageQuotaRecord {
  id: string;
  brand_id: string;
  tenant_id: string;
  limit_bytes: number;
  warning_threshold_percent: number;
  hard_limit_percent: number;
  created_at: string;
  updated_at: string;
}

export interface StorageUsageStats {
  totalUsedBytes: number;
  quotaLimitBytes: number;
  percentageUsed: number;
  isWarning: boolean;
  isHardLimit: boolean;
  assetCount: number;
}
```

**Database Columns:**
- All `StorageQuotaRecord` fields map 1:1
- `StorageUsageStats` is computed from aggregating `media_assets.size_bytes`

---

### `content_items` table

**TypeScript Types:**
```typescript
// server/lib/content-planning-service.ts
export interface ContentPlanItem {
  id: string;
  title: string;
  description: string;
  platform: string;
  contentType: string;
  suggestedDate: string;
  tags: string[];
  priority: number;
}

// client/components/content/ContentPreviewModal.tsx
export interface ContentPreviewItem {
  id: string;
  type: "social" | "email" | "blog" | "ad";
  platform?: string;
  title: string;
  body: string;
  media?: Array<{ url: string; alt?: string }>;
  scheduledFor?: string;
  status: "draft" | "scheduled" | "published";
}
```

**Database Columns (NEW SCHEMA):**
- `id` → `ContentPlanItem.id`, `ContentPreviewItem.id`
- `title` → `title`
- `type` → `ContentPreviewItem.type` (was `content_type` in old schema)
- `content` (JSONB) → Contains `{ text, media, metadata }` (was `body` in old schema)
- `platform` → `platform`
- `status` → `status`
- `scheduled_for` → `scheduledFor`
- `created_at`, `updated_at`

**⚠️ Schema Migration Note:**
Old schema had `body` (TEXT) + `content_type` (TEXT).  
New schema has `content` (JSONB) + `type` (TEXT).  
Code should use new schema.

---

### `scheduled_content` table

**TypeScript Types:**
```typescript
// Inferred from database operations:
interface ScheduledContentRecord {
  id: string;
  brand_id: string;
  content_id: string; // FK to content_items
  scheduled_at: string;
  platforms: string[];
  status: 'scheduled' | 'published' | 'failed' | 'cancelled';
  created_at: string;
  updated_at: string;
}
```

**Database Columns:**
- All columns map 1:1 to interface

---

### `analytics_metrics` table

**TypeScript Types:**
```typescript
// OLD (flat schema):
interface OldAnalyticsMetric {
  id: string;
  brand_id: string;
  platform: string;
  post_id?: string;
  impressions: number;
  reach: number;
  engagements: number;
  clicks: number;
  shares: number;
  comments: number;
  likes: number;
  recorded_at: string;
}

// NEW (JSONB schema):
interface NewAnalyticsMetric {
  id: string;
  brand_id: string;
  date: string;
  platform: string;
  metrics: {
    impressions: number;
    reach: number;
    engagement: number;
    clicks: number;
    shares: number;
    comments: number;
    likes: number;
    [key: string]: number; // Extensible
  };
  created_at: string;
  updated_at: string;
}
```

**Database Columns (NEW SCHEMA):**
- `id`, `brand_id`, `date`, `platform`
- `metrics` (JSONB) → Consolidated all metric fields
- Old flat columns (`impressions`, `reach`, etc.) may still exist during migration

**⚠️ Schema Migration Note:**
Migration 012 adds `metrics` JSONB column.  
Code should write to `metrics` JSONB, not flat columns.

---

### `milestones` table

**TypeScript Types:**
```typescript
// Inferred from client/pages/onboarding/Screen8CalendarPreview.tsx
interface Milestone {
  id: string;
  workspace_id: string;
  key: string; // e.g., "first_brand_created", "first_post_scheduled"
  unlocked_at: string;
  acknowledged_at?: string;
  created_at: string;
  updated_at: string;
}
```

**Database Columns:**
- All columns map 1:1 to interface

---

## 🔄 Common Mapping Patterns

### Snake Case ↔ Camel Case

**Database (snake_case):**
```sql
brand_id, user_id, created_at, updated_at, 
mime_type, size_bytes, content_type
```

**TypeScript (camelCase):**
```typescript
brandId, userId, createdAt, updatedAt,
mimeType, sizeBytes, contentType
```

**Mapping is done in service layers:**
- `server/lib/*-db-service.ts`
- `server/routes/*.ts` (in `mapAssetRecord`, etc.)

---

### JSONB Columns → Nested Objects

**Database:**
```sql
brand_kit JSONB DEFAULT '{}'::jsonb
```

**TypeScript:**
```typescript
interface BrandGuide {
  identity: { ... };
  voiceAndTone: { ... };
  visualIdentity: { ... };
  contentRules: { ... };
}
```

**Stored in DB as:**
```json
{
  "identity": { "name": "...", "businessType": "..." },
  "voiceAndTone": { "tone": [...], "friendlinessLevel": 50 },
  ...
}
```

---

### TEXT[] Arrays → TypeScript Arrays

**Database:**
```sql
tone_keywords TEXT[]
platforms TEXT[]
used_in TEXT[]
```

**TypeScript:**
```typescript
tone_keywords: string[]
platforms: string[]
used_in: string[]
```

**Querying:**
```typescript
// Insert
.insert({ tone_keywords: ["friendly", "professional"] })

// Query with array contains
.contains('tone_keywords', ['friendly'])
```

---

## 🚨 Common Pitfalls

### 1. **Using wrong column names**
❌ `file_size` → ✅ `size_bytes`  
❌ `content_type` → ✅ `type`  
❌ `body` → ✅ `content` (JSONB)

### 2. **Mixing snake_case and camelCase**
Always use snake_case in SQL queries:
```typescript
// ❌ Wrong
.select('brandId, createdAt')

// ✅ Correct
.select('brand_id, created_at')
.then(rows => rows.map(r => ({ brandId: r.brand_id, ... })))
```

### 3. **Forgetting JSONB casting**
```typescript
// ❌ Wrong
.update({ brand_kit: myObject })

// ✅ Correct
.update({ brand_kit: JSON.stringify(myObject) })
// Or use Supabase's automatic JSONB handling
.update({ brand_kit: myObject }) // Supabase client handles this
```

### 4. **Not handling NULL vs empty array**
```typescript
// Database returns NULL for empty TEXT[]
const keywords = row.tone_keywords || [];
```

---

## 📚 Full Type Definitions

**See these files for complete type definitions:**

1. **`shared/brand-guide.ts`** - BrandGuide interface
2. **`server/lib/media-db-service.ts`** - MediaAssetRecord, StorageQuotaRecord
3. **`server/routes/media.ts`** - MediaAsset (domain type)
4. **`server/lib/content-planning-service.ts`** - ContentPlanItem
5. **`client/components/content/ContentPreviewModal.tsx`** - ContentPreviewItem
6. **`server/lib/preferences-db-service.ts`** - UserPreferencesRecord

---

## ✅ Best Practices

1. **Define database record interfaces** with `*Record` suffix
   ```typescript
   export interface MediaAssetRecord { ... }
   ```

2. **Define domain types** without `Record` suffix
   ```typescript
   interface MediaAsset { ... } // Used in API responses
   ```

3. **Create mapping functions** in service or route layers
   ```typescript
   function mapAssetRecord(record: MediaAssetRecord): MediaAsset { ... }
   ```

4. **Always validate JSONB structure** when reading from DB
   ```typescript
   const brandKit = row.brand_kit;
   if (!brandKit?.identity) {
     throw new Error('Invalid brand_kit structure');
   }
   ```

5. **Use Zod schemas** for runtime validation
   ```typescript
   // shared/validation-schemas.ts
   export const MediaUploadSchema = z.object({
     filename: z.string(),
     mimeType: z.string(),
     size: z.number().positive(),
   });
   ```

---

**For complete database schema extraction:**  
See `SCHEMA_EXTRACTION_REPORT.md` (2549 lines, all 64 tables)

**For schema health summary:**  
See `SCHEMA_EXTRACTION_EXECUTIVE_SUMMARY.md`

