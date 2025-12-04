# POSTD Backlog Tickets

## Security Hardening (DB)

### 🔒 Pin search_path on public.* functions
**Priority**: Medium  
**Status**: Backlog  
**Description**: Pin `search_path` on public schema functions (`is_brand_member`, `has_brand_role`, etc.) to prevent search_path injection attacks.

**Files Affected**:
- `supabase/migrations/001_bootstrap_schema.sql` (is_brand_member_text function)
- Any other functions in public schema

**Implementation**:
```sql
ALTER FUNCTION is_brand_member_text(brand_id_param TEXT) 
SET search_path = public;
```

---

### 🔒 Move pg_trgm + vector extensions out of public schema
**Priority**: Low  
**Status**: Backlog  
**Description**: Move `pg_trgm` and `vector` extensions to a dedicated schema (e.g., `extensions`) to improve security and organization.

**Files Affected**:
- Migration files that create extensions
- Code that references these extensions

---

### 🔒 Enable leaked password protection in Supabase Auth
**Priority**: Medium  
**Status**: Backlog  
**Description**: Enable Supabase Auth's leaked password protection feature to prevent users from using compromised passwords.

**Implementation**: Configure in Supabase Dashboard → Authentication → Policies

---

## API Cleanup

### 🔄 Unify /api/ai/doc → /api/agents/generate/doc
**Priority**: High  
**Status**: Backlog  
**Description**: Migrate all client calls from legacy `/api/ai/doc` endpoint to canonical `/api/agents/generate/doc` endpoint. Remove legacy endpoint once all clients are migrated.

**Files Affected**:
- `server/routes/doc-agent.ts` (legacy endpoint - mark for deprecation)
- Client components calling `/api/ai/doc`
- Update all references to use `/api/agents/generate/doc`

**Steps**:
1. Search for all references to `/api/ai/doc` in client code
2. Update to `/api/agents/generate/doc`
3. Test all updated components
4. Add deprecation notice to legacy endpoint
5. Remove legacy endpoint after migration complete

**Related**: See `LEGACY_ENDPOINT_TICKET.md` for details

---

## Agent System Enhancements

### 🤖 Apply same agent pattern to Design Agent
**Priority**: Medium  
**Status**: Backlog  
**Description**: Apply the same normalization, validation, and logging pattern used in Doc Agent to Design Agent for consistency.

**Tasks**:
- Normalize request contract (brand_id + input object)
- Add Zod validation with clear error messages
- Add fallback logic for schema cache errors
- Update smoke tests
- Update API documentation

---

### 🤖 Apply same agent pattern to Advisor Agent
**Priority**: Medium  
**Status**: Backlog  
**Description**: Apply the same normalization, validation, and logging pattern used in Doc Agent to Advisor Agent for consistency.

**Tasks**:
- Normalize request contract (brand_id + input object)
- Add Zod validation with clear error messages
- Add fallback logic for schema cache errors
- Update smoke tests
- Update API documentation

---

## Storage & Media

### 📦 Storage & brand-assets buckets audit
**Priority**: Medium  
**Status**: Backlog  
**Description**: Audit and align storage buckets (logos, brand images) with schema design. Ensure proper RLS policies and access controls.

**Tasks**:
- Verify bucket policies match schema design
- Check RLS policies on storage objects
- Ensure proper access controls
- Test upload/download flows
- Document bucket usage patterns

---

## Testing & Quality

### 🧪 Add integration tests for Doc Agent
**Priority**: Medium  
**Status**: Backlog  
**Description**: Add comprehensive integration tests for Doc Agent endpoint covering:
- Canonical request format
- Legacy request format (normalization)
- Schema cache error fallback
- OpenAI integration
- BFS calculation
- Content linter

---

### 🧪 Add integration tests for Design Agent
**Priority**: Low  
**Status**: Backlog  
**Description**: Add comprehensive integration tests for Design Agent endpoint.

---

### 🧪 Add integration tests for Advisor Agent
**Priority**: Low  
**Status**: Backlog  
**Description**: Add comprehensive integration tests for Advisor Agent endpoint.

---

## Documentation

### 📚 Update API documentation with canonical contracts
**Priority**: Low  
**Status**: Backlog  
**Description**: Ensure all API documentation reflects canonical request contracts (brand_id + input object) for all agents.

---

## Performance

### ⚡ Optimize brands.safety_config queries
**Priority**: Low  
**Status**: Backlog  
**Description**: Add indexes or optimize queries for `brands.safety_config` JSONB column if needed.

---

## Monitoring

### 📊 Add monitoring for schema cache errors
**Priority**: Low  
**Status**: Backlog  
**Description**: Add metrics/alerts for PostgREST schema cache errors to detect issues early.

---

**Last Updated**: 2025-12-04  
**Maintained By**: POSTD Engineering Team

