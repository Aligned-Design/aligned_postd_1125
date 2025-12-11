# POSTD Branding Guide

**Last Updated**: 2025-01-20  
**Status**: Active

---

## Current Product Name

**POSTD** is the official product name.

- **Internal codename**: Aligned-20ai (historical, being phased out)
- **User-facing**: POSTD
- **Domain**: postd.com (or your production domain)

---

## Branding Standards

### Product Name Usage

- ✅ **Use**: "POSTD", "POSTD Platform", "POSTD Platform for [use case]"
- ❌ **Avoid**: "Aligned", "AlignedAI", "aligned-20ai" (legacy names)

### Brand Guide Terminology

The client's brand profile (the central data object that powers AI) has multiple names depending on context:

| Context | Term to Use | Example |
|---------|-------------|---------|
| **User-Facing UI** | Brand Guide | "Review your Brand Guide" |
| **Marketing/Conceptual** | Brand Brain | "The AI-powered Brand Brain" |
| **Database/Code** | `brand_kit` | `brands.brand_kit` JSONB column |
| **React Hooks** | `brandGuide` | `const { brandGuide } = useBrandGuide()` |

**Deprecated Terms (do not use in new code or docs):**
- ❌ "Brand Profile" — Ambiguous, could mean user profile
- ❌ "Brand Kit" in user-facing UI — Sounds like a downloadable asset pack

**For complete Brand Guide documentation, see:** [Brand Guide Lifecycle](BRAND_GUIDE_LIFECYCLE.md)

### Code References

#### User-Agent Strings
- ✅ **Current**: `POSTDBot/1.0`
- ❌ **Legacy**: `AlignedAIBot/1.0` (being phased out)

#### localStorage Keys
- ✅ **Current**: `postd_brand_id`, `postd_*`
- ⚠️ **Legacy**: `aligned_brand_id` (supported for backward compatibility, will be removed after migration)

**Migration Strategy**:
- New code should use `postd_*` keys
- Existing code maintains backward compatibility with `aligned_*` keys
- Migration will be completed post-launch

#### File Paths & URLs
- ✅ **Current**: Use POSTD naming in new code
- ⚠️ **Legacy**: Some paths may still reference "aligned" or "aligned-20ai" (acceptable for now)

---

## Legacy References

### Where Legacy Names Still Exist

1. **localStorage Keys** (`aligned_brand_id`)
   - **Status**: Backward compatibility maintained
   - **Action**: New code uses `postd_brand_id`, old keys supported until migration complete
   - **Files**: `client/pages/onboarding/Screen2BusinessEssentials.tsx`, `Screen3BrandIntake.tsx`

2. **Repository Name** (`Aligned-20ai.posted`)
   - **Status**: Acceptable (internal only)
   - **Action**: No change needed (internal repository name)

3. **Comments & Documentation**
   - **Status**: Being updated incrementally
   - **Action**: Update when touching files, not a priority

### What NOT to Change

- **Database identifiers**: Do not rename existing columns/tables
- **API endpoints**: Do not break existing endpoints
- **Environment variables**: Keep existing var names (unless explicitly migrating)

---

## Migration Checklist

- [x] User agent updated to `POSTDBot/1.0`
- [x] New localStorage keys use `postd_*` prefix
- [ ] Remove `aligned_brand_id` fallback (post-launch)
- [ ] Update all user-visible strings to POSTD
- [ ] Update preview URLs (if applicable)

---

## Questions?

If you're unsure about a branding change:
1. Check if it's user-visible (prioritize these)
2. Check if it breaks backward compatibility (avoid these)
3. When in doubt, maintain backward compatibility

---

**See Also**:
- `POSTD_REPO_HEALTH_STATUS.md` - Branding migration status (H6)
- `POSTD_REPO_HEALTH_AND_CONNECTORS_AUDIT.md` - Full audit details

