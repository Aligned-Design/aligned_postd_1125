# Contract Layer - Zod Schemas

**Purpose:** Runtime validation and type safety at system boundaries.

## Why Contracts?

1. **Runtime Safety**: TypeScript only validates at compile time. Zod validates at runtime.
2. **Single Source of Truth**: Types derived from schemas, not duplicated.
3. **Consistent Errors**: Validation errors follow standard format.
4. **API Boundaries**: Validate external data before it enters the system.

## Usage

### Validating API Responses

```typescript
import { BrandSchema } from '@/lib/contracts';

const response = await fetch('/api/brands/123');
const data = await response.json();

// Validate response
const brand = BrandSchema.parse(data);
// Now `brand` is type-safe AND runtime-validated
```

### Validating Form Inputs

```typescript
import { CreateBrandSchema } from '@/lib/contracts';

const result = CreateBrandSchema.safeParse(formData);

if (!result.success) {
  // Show validation errors
  console.error(result.error.format());
  return;
}

// result.data is validated and type-safe
await createBrand(result.data);
```

### Error Handling

```typescript
import { normalizeError } from '@/lib/contracts';

try {
  await somethingRisky();
} catch (error) {
  const { message, code } = normalizeError(error);
  toast.error(message);
}
```

## Available Schemas

### Auth (`auth.ts`)
- `UserProfileSchema` - User account data
- `SessionSchema` - Auth session
- `LoginCredentialsSchema` - Login form validation

### Brands (`brands.ts`)
- `BrandSchema` - Full brand object
- `CreateBrandSchema` - Create brand payload
- `UpdateBrandSchema` - Update brand payload
- `BrandGuideSchema` - Brand guide/kit data

### Content (`content.ts`)
- `ContentItemSchema` - Content item object
- `CreateContentSchema` - Create content payload
- `UpdateContentSchema` - Update content payload
- `ContentMetadataSchema` - Content metadata

### Errors (`errors.ts`)
- `ApiErrorSchema` - Standard error response
- `ApiSuccessSchema` - Standard success response
- `ErrorCode` - Common error code constants
- `normalizeError()` - Error normalization helper

## Deriving Types

```typescript
import { z } from 'zod';
import { BrandSchema } from '@/lib/contracts';

// Type automatically derived from schema
type Brand = z.infer<typeof BrandSchema>;
```

## Adding New Schemas

1. **Create schema file** in `client/lib/contracts/`
2. **Define Zod schemas:**
   ```typescript
   export const MySchema = z.object({
     id: z.string().uuid(),
     name: z.string().min(1),
   });
   
   export type MyType = z.infer<typeof MySchema>;
   ```
3. **Export from index.ts:**
   ```typescript
   export * from './my-schema';
   ```

## Best Practices

### ✅ DO

1. **Validate at boundaries** (API responses, form inputs, external data)
2. **Use `.safeParse()`** for user input to handle errors gracefully
3. **Use `.parse()`** for internal validation (throws on error)
4. **Derive types from schemas** (`z.infer<typeof Schema>`)

### ❌ DON'T

1. **Don't validate internal data** (already type-safe)
2. **Don't duplicate types** (derive from schemas)
3. **Don't skip validation** on external data (security risk)
4. **Don't use `any`** (defeats the purpose)

## Error Handling Pattern

```typescript
import { normalizeError } from '@/lib/contracts';
import { toast } from '@/hooks/use-toast';

async function handleAction() {
  try {
    await riskyOperation();
    toast.success("Success!");
  } catch (error) {
    const { message, code } = normalizeError(error);
    
    // Handle specific error codes
    if (code === 'QUOTA_EXCEEDED') {
      // Show upgrade modal
    } else {
      toast.error(message);
    }
  }
}
```

## Integration with API Layer

The API layer should use these schemas:

```typescript
// client/lib/api/brands.ts
import { BrandSchema } from '@/lib/contracts';

export async function getBrand(brandId: string) {
  const data = await apiGet(`/api/brands/${brandId}`);
  // Validate response at API boundary
  return BrandSchema.parse(data);
}
```

## Current Status

✅ **Core schemas implemented:**
- Auth (UserProfile, Session, LoginCredentials)
- Brands (Brand, CreateBrand, UpdateBrand, BrandGuide)
- Content (ContentItem, CreateContent, UpdateContent)
- Errors (ApiError, normalizeError)

📋 **Next steps:**
- Integrate validation into API layer
- Use in form validation with react-hook-form
- Add more domain-specific schemas as needed

