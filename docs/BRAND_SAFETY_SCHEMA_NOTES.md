# Brand Safety Configuration Schema Design

## Current Intended Design

### Source of Truth
**`brands.safety_config` (JSONB column)**

The brand safety configuration is stored as a JSONB column directly on the `brands` table. This is the canonical source of truth for all safety-related settings used by AI agents.

### Schema Structure

```sql
ALTER TABLE brands
ADD COLUMN IF NOT EXISTS safety_config JSONB DEFAULT '{
  "safety_mode": "safe",
  "banned_phrases": [],
  "competitor_names": [],
  "claims": [],
  "required_disclaimers": [],
  "required_hashtags": [],
  "brand_links": [],
  "disallowed_topics": ["politics", "religion", "medical advice"],
  "allow_topics": [],
  "compliance_pack": "none",
  "platform_limits_override": {}
}'::jsonb;
```

### Code Usage

All AI agents (doc, design, advisor) read safety configuration from:

```typescript
const { data: brandData } = await supabase
  .from("brands")
  .select("safety_config, brand_kit")
  .eq("id", brand_id)
  .single();

const safetyConfig = brandData?.safety_config as BrandSafetyConfig;
```

### Related Data

- **`brands.brand_kit`** (JSONB): Brand voice, tone, personality, and visual identity
- **`generation_logs`**: Audit trail for AI generations (references `brands.id`)
- **`content_review_queue`**: Human-in-the-loop review queue (references `brands.id`)

### Legacy Design (Deprecated)

**There is NO separate `brand_safety_configs` table in the current design.**

Any references to `brand_safety_configs` as a separate table are legacy and should be removed. The migration `012_fix_brand_safety_configs_ghost.sql` ensures all such references are eliminated.

### Migration History

1. **Migration 011** (`011_add_missing_tables_and_columns.sql`): Added `brands.safety_config` column
2. **Migration 012** (`012_fix_brand_safety_configs_ghost.sql`): Removes any ghost references to `brand_safety_configs` table

### RLS Policies

The `brands` table RLS policies control access to `safety_config`:
- Users can read `safety_config` for brands they're members of
- Only brand admins/owners can update `safety_config`
- Service role has full access for API operations

### TypeScript Interface

```typescript
export interface BrandSafetyConfig {
  safety_mode: SafetyMode;
  banned_phrases: string[];
  competitor_names: string[];
  claims: string[];
  required_disclaimers: string[];
  required_hashtags: string[];
  brand_links: string[];
  disallowed_topics: string[];
  allow_topics: string[];
  compliance_pack: CompliancePack;
  platform_limits_override?: {
    instagram?: { max_hashtags?: number; max_chars?: number };
    linkedin?: { max_chars?: number };
    facebook?: { max_chars?: number };
    twitter?: { max_chars?: number };
  };
}
```

