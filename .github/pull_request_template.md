## Summary

<!-- Brief description of what this PR does -->

## Type of Change

- [ ] 🐛 Bug fix (non-breaking change that fixes an issue)
- [ ] ✨ New feature (non-breaking change that adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to change)
- [ ] 📚 Documentation update
- [ ] 🔧 Refactor (no functional changes)
- [ ] 🧪 Test update

## Related Issues

<!-- Link any related issues: Fixes #123 -->

---

## Release / Merge Health ✅

Before requesting review, confirm all checks pass:

### Required Checks

- [ ] `pnpm typecheck` — TypeScript passes
- [ ] `pnpm test` — Unit tests pass
- [ ] `pnpm lint` — No linting errors

### Brand Health Checks

Run these with at least one real brand to verify scraper and content pipeline integrity:

```bash
# Get a real brand ID
pnpm brands:list

# Scraper health (brand kit, colors, images, no duplicates)
SCRAPER_TEST_BRAND_ID_1=<real_brand_uuid> pnpm scraper:smoke

# Content pipeline health (brand guide, content queue, media assets)
BRAND_EXPERIENCE_TEST_BRAND_ID=<real_brand_uuid> pnpm brand-experience:smoke
```

- [ ] `pnpm scraper:smoke` — Scraper health passes for at least 1 real brand
- [ ] `pnpm brand-experience:smoke` — Content pipeline passes for at least 1 real brand

### Optional E2E (non-blocking)

- [ ] `pnpm e2e` — E2E tests pass (or reviewed failures)

---

## Checklist

- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my code
- [ ] I have commented my code where necessary
- [ ] My changes generate no new TypeScript errors
- [ ] I have added tests that prove my fix/feature works (if applicable)
- [ ] I have tested with real brand data (no mocks in production flows)

---

## Screenshots / Demo

<!-- If applicable, add screenshots or video demonstrating the changes -->

## Additional Notes

<!-- Any other context or notes for reviewers -->

