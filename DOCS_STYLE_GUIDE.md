# POSTD Documentation Style Guide

**Version:** 1.0  
**Last Updated:** 2025-01-20  
**Status:** Active Standard

---

## Purpose

This guide establishes consistent formatting, style, and structure standards for all POSTD documentation. Following these guidelines ensures documentation is professional, navigable, and maintainable.

---

## Branding Standards

### Product Name

- **Always use**: `POSTD` (all caps)
- **Never use**: "Aligned-20AI", "Aligned-20ai", "Aligned AI", "AlignedAI", or generic "Aligned"

### Product References

- ✅ **Correct**: "the POSTD app", "the POSTD dashboard", "POSTD platform"
- ❌ **Incorrect**: "the tool", "the app", "Aligned dashboard", "the platform"

### Historical References

For historical documents (archived docs, legacy audit reports):

- Keep original naming in context if historically important
- **Always add a note at the top**:

  ```markdown
  > **Note:** This is a historical document that refers to the product under its former name "Aligned-20AI". The product is now called **POSTD**. Some technical details may be outdated.
  ```

---

## Document Structure

### Heading Hierarchy

Use a consistent 3-level hierarchy for most documents:

```markdown
# Document Title (H1 - Only one per document)

## Main Section (H2 - Major topics)

### Subsection (H3 - Details within a section)

#### Sub-subsection (H4 - Rare, only if deeply nested)
```

**Guidelines:**
- Use `#` only for the document title
- Use `##` for main sections
- Use `###` for subsections
- Avoid going deeper than H4
- Never skip heading levels (e.g., don't use H3 without an H2 above it)

### Document Header

Every document should start with:

```markdown
# Document Title

**Version:** X.X (if applicable)  
**Last Updated:** YYYY-MM-DD  
**Status:** Active | Historical | Deprecated
```

---

## Formatting Standards

### Dates

- **Format**: `YYYY-MM-DD` (e.g., `2025-01-20`)
- **Examples**: 
  - ✅ "Last Updated: 2025-01-20"
  - ❌ "Last Updated: January 20, 2025" or "1/20/25"

### Code Formatting

- **Inline code**: Use backticks: `` `variableName` ``
- **Code blocks**: Use fenced code blocks with language:

  ````markdown
  ```typescript
  const example = "code";
  ```
  ````

- **File paths**: Use inline code: `` `path/to/file.ts` ``
- **Commands**: Use inline code or code blocks: `` `pnpm install` ``

### Lists

**Use bullet lists for:**
- Unordered items
- Feature lists
- Options or choices

**Use numbered lists for:**
- Step-by-step instructions
- Sequential processes
- Prioritized items

**Use tables for:**
- Comparison data
- Status tracking
- Reference information (file lists, endpoints, etc.)

### Emphasis

- **Bold** (`**text**`): For important terms, status labels, key concepts
- *Italic* (`*text*`): For emphasis, titles of documents/features
- **Bold + Italic**: Rare, for extremely important warnings

### Status Labels

Use consistent status indicators:

- ✅ **ACTIVE** - Current, authoritative documentation
- 🟡 **SUPPORTING** - Reference material, still useful
- 🕒 **HISTORICAL** - Historical, superseded, or completed work logs
- 🔴 **DEPRECATED** - Should be removed or consolidated
- ⚠️ **WARNING** - Potential issues or outdated information

---

## Content Standards

### Tone

- **Clear and direct**: Avoid unnecessary jargon
- **Professional but approachable**: Technical but not intimidating
- **Action-oriented**: Use active voice ("Create the file" not "The file should be created")
- **Neutral**: Avoid marketing language, stay factual

### Technical Writing

- **Be specific**: Avoid vague terms like "soon", "eventually", "might"
- **Use examples**: Show, don't just tell
- **Define acronyms**: On first use: "API (Application Programming Interface)"
- **Link to related docs**: Use markdown links for cross-references

### Documentation Levels

Documentation serves different audiences:

1. **Entry-level**: README, Quick Start guides - assume no prior knowledge
2. **Intermediate**: Feature guides, API docs - assume basic familiarity
3. **Advanced**: Architecture docs, implementation details - assume expertise

Make the level clear in the document header or introduction.

---

## Code Examples

### Best Practices

- Include context: Show where code fits
- Add comments: Explain non-obvious parts
- Show expected output: Include example responses/results
- Keep it current: Ensure examples work with current codebase

### Example Format

````markdown
```typescript
// Example: Creating a brand workspace
import { createBrand } from '@/lib/brand-service';

const brand = await createBrand({
  name: 'Example Brand',
  tenantId: user.tenantId,
});

// Result: { id: 'uuid', name: 'Example Brand', ... }
```
````

---

## Links and References

### Internal Links

- Use relative paths: `[Link Text](./path/to/doc.md)`
- Link to specific sections: `[Section Name](./doc.md#section-name)`
- Verify links work before committing

### External Links

- Include full URLs: `[Link Text](https://example.com)`
- Consider adding "(external)" label for clarity
- Note if link requires authentication

### File References

- Use code formatting: `` See `server/index.ts` for implementation ``
- Include line numbers if specific: `` See `server/index.ts:42-50` ``
- Link to files when possible

---

## Tables

Use tables for structured data:

**Standard Table Format:**

```markdown
| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Data 1   | Data 2   | Data 3   |
| Data 4   | Data 5   | Data 6   |
```

**Guidelines:**
- Align columns consistently
- Use clear, descriptive headers
- Keep tables narrow (prefer multiple small tables over one wide table)
- Add table captions if needed: `*Table 1: Endpoint Summary*`

---

## Status and Versioning

### Document Status

Include status in document header:

- **Active**: Current, maintained documentation
- **Historical**: Kept for reference, may be outdated
- **Deprecated**: Scheduled for removal
- **Draft**: Work in progress

### Version Numbers

For API docs and formal specifications:

- **Format**: Semantic versioning (e.g., `v1.0`, `v2.3`)
- **Location**: Document header
- **Changelog**: Include version history section if breaking changes

---

## Special Sections

### Warnings and Notes

Use blockquotes for special notices:

```markdown
> ⚠️ **Warning**: This operation cannot be undone.

> 💡 **Tip**: You can also use keyboard shortcuts.

> 📝 **Note**: This feature requires API access.
```

### TODO Sections

If a document has incomplete sections:

```markdown
## Open Questions / TODO

- [ ] Item 1 - Description
- [ ] Item 2 - Description
```

Or consolidate into `DOCS_TODO_BACKLOG.md` if appropriate.

---

## Common Patterns

### API Documentation

```markdown
## Endpoint Name

**Method**: `GET|POST|PUT|DELETE`  
**Path**: `/api/endpoint`  
**Auth Required**: Yes/No  
**Brand Scope**: Yes/No

### Description

Brief description of what this endpoint does.

### Request

```typescript
interface Request {
  // Request body/params
}
```

### Response

```typescript
interface Response {
  // Response structure
}
```

### Example

\`\`\`bash
curl -X GET /api/endpoint
\`\`\`
```

### Feature Documentation

```markdown
## Feature Name

**Status**: ✅ Active | ⏳ In Progress | 🕒 Historical  
**Version**: X.X  
**Last Updated**: YYYY-MM-DD

### Overview

What this feature does and why it exists.

### Usage

How to use this feature.

### Implementation Details

Technical details for developers.
```

---

## Checklists and Status Tracking

### Using Checklists

- Use markdown checkboxes for task lists: `- [ ] Task`
- Use completed checkboxes for done items: `- [x] Task`
- Keep checklists actionable and specific

### Status Tables

```markdown
| Component | Status | Notes |
|-----------|--------|-------|
| Feature A | ✅ Complete | Implemented in v1.0 |
| Feature B | ⏳ In Progress | Expected v1.1 |
| Feature C | 🔴 Blocked | Waiting on dependency |
```

---

## File Naming Conventions

### Markdown Files

- Use `UPPER_SNAKE_CASE` for root-level docs: `API_DOCUMENTATION.md`
- Use `UPPER_SNAKE_CASE` or `PascalCase` for feature docs: `FEATURE_NAME.md` or `FeatureName.md`
- Use `kebab-case` for guides: `setup-guide.md`
- Be descriptive: Avoid generic names like `README_2.md`

### Directory Structure

```
docs/
├── README.md                    # Index for docs/ folder
├── guides/                      # User/developer guides
├── api/                         # API documentation
├── architecture/                # Architecture docs
├── features/                    # Feature documentation
├── phases/                      # Phase implementation docs
└── archive/                     # Historical/superseded docs
```

---

## Review and Maintenance

### Before Publishing

- [ ] Follows heading hierarchy
- [ ] Uses POSTD branding consistently
- [ ] All links work
- [ ] Code examples are tested
- [ ] Date format is consistent (YYYY-MM-DD)
- [ ] Status labels are accurate
- [ ] No TODO markers (unless in dedicated section)

### Regular Maintenance

- Review quarterly for accuracy
- Update when features change
- Remove obsolete information
- Archive outdated documentation
- Update "Last Updated" dates

---

## Examples

### Good Document Structure

```markdown
# Feature Name

**Version:** 1.0  
**Last Updated:** 2025-01-20  
**Status:** ✅ Active

## Overview

Brief description of the feature.

## Usage

### Step 1: Basic Usage

Instructions...

## Implementation

Technical details...

## API Reference

See [API Documentation](./api/feature.md) for endpoint details.

## Related Documentation

- [Related Feature](./other-feature.md)
- [API Contract](../POSTD_API_CONTRACT.md)
```

---

## Questions or Updates

If you have questions about this style guide or suggestions for improvement:

1. Review this document for existing guidance
2. Check similar documents for patterns
3. Update this guide if you establish a new pattern that should be standard

---

**Remember**: Consistency is key. When in doubt, match the style of similar, well-maintained documents in the repository.

