Global AI Prompt:
Reference /docs/design-system/pages-reference.md and all \*.meta.json files under /src/pages/ to maintain consistent visuals, color hierarchy, and layout.

Never overwrite or remove existing sections, copy, or brand voice.

Use defined design tokens and page structure for new pages.

For every new page, generate its own .meta.json and update /docs/design-system/pages-reference.md.

Maintain identical button styles, card spacing, and typography rules across all routes.

Use the same navy/indigo hero with lime CTA for homepage; lighter neutral surfaces for subpages.

Instructions for builders and agents:

- Always load /docs/design-system/pages-reference.md first.
- Then load the relevant /src/pages/\*.meta.json for the target route.
- Merge visual tokens from pages-reference.md with the meta file values to produce final designs.
- Do not change copy or hierarchical structure; only update visual rules or assets.

Committing & Versioning

- Commit both the meta file and any design updates together.
- If an agent creates or updates a .meta.json file, it must include a short changelog entry in the JSON under the key "\_changelog" documenting the change and author.
