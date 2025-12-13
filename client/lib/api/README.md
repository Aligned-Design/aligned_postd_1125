# Client API Layer

**Purpose:** Single source of truth for all data access from the client.

## Rules

### ✅ DO

1. **Use API functions for ALL data access**
   ```typescript
   import { listBrands, getBrand } from '@/lib/api';
   
   const brands = await listBrands();
   const brand = await getBrand(brandId);
   ```

2. **Create domain-specific API modules**
   - `auth.ts` - Authentication operations
   - `brands.ts` - Brand management
   - `content.ts` - Content operations
   - `connections.ts` - Platform connections
   - `publishing.ts` - Publishing & scheduling

3. **Export through index.ts**
   ```typescript
   // In client/lib/api/index.ts
   export * from './brands';
   export * from './content';
   ```

4. **Use with React Query in hooks**
   ```typescript
   import { useQuery } from '@tanstack/react-query';
   import { listBrands } from '@/lib/api';
   
   export function useBrands() {
     return useQuery({
       queryKey: ['brands'],
       queryFn: () => listBrands(),
     });
   }
   ```

### ❌ DON'T

1. **NO direct Supabase imports in UI components**
   ```typescript
   // ❌ BAD
   import { supabase } from '@/lib/supabase';
   const { data } = await supabase.from('brands').select();
   
   // ✅ GOOD
   import { listBrands } from '@/lib/api';
   const brands = await listBrands();
   ```

2. **NO direct fetch in components**
   ```typescript
   // ❌ BAD
   const response = await fetch('/api/brands');
   
   // ✅ GOOD
   import { listBrands } from '@/lib/api';
   const brands = await listBrands();
   ```

3. **NO mixing of patterns**
   - Pick ONE pattern and stick to it
   - We use: API functions + React Query hooks

## Architecture

```
UI Components
     ↓
React Query Hooks (optional, for caching)
     ↓
client/lib/api/* (THIS LAYER)
     ↓
client/lib/api.ts (HTTP client with auth)
     ↓
Backend API (/api/*)
     ↓
Supabase/Database
```

## Adding New Endpoints

1. **Add function to appropriate domain file:**
   ```typescript
   // client/lib/api/brands.ts
   export async function updateBrand(
     brandId: string,
     payload: UpdateBrandPayload
   ): Promise<Brand> {
     return apiPut(`/api/brands/${brandId}`, payload);
   }
   ```

2. **Export from index.ts:**
   ```typescript
   // client/lib/api/index.ts
   export * from './brands';
   ```

3. **Use in components:**
   ```typescript
   import { updateBrand } from '@/lib/api';
   
   await updateBrand(brandId, { name: 'New Name' });
   ```

## Migration Checklist

When you find direct Supabase/fetch usage:

- [ ] Create API function in appropriate domain file
- [ ] Update imports to use API function
- [ ] Remove direct Supabase/fetch call
- [ ] Test the change
- [ ] Verify no other usage of old pattern

## Benefits

1. **Single source of truth** - all API calls in one place
2. **Consistent error handling** - handled in API layer
3. **Easy to mock** - mock API functions, not Supabase
4. **Type safety** - typed request/response
5. **Caching** - works seamlessly with React Query
6. **Testability** - isolated, unit-testable functions

## Current Status

✅ **Completed:**
- API layer structure created
- Domain APIs: auth, brands, content, connections, publishing
- BrandContext refactored to use API layer
- TanStack Query already in use

⚠️ **Remaining work:**
- 3-4 pages still import Supabase directly (low priority)
- Most components already use proper pattern
- ~90% compliance achieved

