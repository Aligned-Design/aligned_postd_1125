AI Instruction Header:
Always reference this document before editing or generating any page.
Use the colors, typography, and layout hierarchy defined here to ensure design consistency across all pages.
Do not overwrite copy or structure — update visuals only.

## Overview

This file is the single source-of-truth for page descriptions, design tokens, spacing rules, and high-level layout flow. Builder agents and humans must read this file first when generating or syncing pages. Maintain it alongside page-specific .meta.json files stored under /src/pages/.

## Design Tokens

Colors

- navy: #0b1a2b (primary dark background)
- indigo-900: #2a2f8f (hero deep indigo)
- indigo-700: #4f46e5 (primary brand indigo)
- indigo-500: #6366f1
- lime-500: #84cc16 (primary accent / CTA)
- lime-600: #65a30d
- neutral-900: #111827 (text high contrast)
- neutral-700: #374151
- neutral-300: #d1d5db (subtle borders)
- surface-100: #f8fafc (light surfaces)
- surface-800: #0f1724 (dark surfaces)

Typography

- Font family stack: Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial
- Scale (desktop):
  - h1: 36px / 48px line-height
  - h2: 28px / 36px
  - h3: 20px / 28px
  - body: 16px / 24px
  - small: 13px / 20px
- Weights: 700 (bold), 600 (semibold), 400 (regular)
- Button text: 14px / 20px, 600

Spacing (spacing token names)

- spacing-xs: 4px
- spacing-sm: 8px
- spacing-md: 16px
- spacing-lg: 24px
- spacing-xl: 40px
- container-max-width: 1200px

Radii & Elevation

- radius-sm: 6px
- radius-md: 12px
- radius-lg: 20px
- elevation-1: subtle shadow (0 1px 2px rgba(2,6,23,0.05))
- elevation-2: (0 6px 18px rgba(2,6,23,0.08))

Core Components (visual rules)

- Buttons: Primary (filled lime-500 on indigo hero or navy), Secondary (outline neutral-300 on surface); consistent corner radius-md and 12px vertical padding.
- Cards: use radius-md, elevation-1, consistent internal padding spacing-md; use neutral-700 for headings and neutral-900 for body copy.
- Badges: small caps, background surface-100 with border neutral-300 for light theme; reverse colors on dark surfaces.
- Grid: responsive 1 → 2 → 3 columns at breakpoints 480px, 768px, 1024px. Use consistent gutter spacing-md.

Layout Hierarchy / Page Flow (high-level patterns)

- Homepage (/)
  - Hero (hero-gradient): indigo → navy gradient background with large H1, supporting paragraph, and a lime CTA to the right or center. Include a subtle hero illustration or card gallery below the fold.
  - Features strip: 3–4 cards in a responsive grid, each card with icon, H3, and short description.
  - Social proof / Trust: logos row.
  - Pricing teaser: short pricing table with CTA to pricing page.
  - Footer CTA: small strip with CTA to sign up.

- Pricing (/pricing)
  - Hero (hero-simple): H1 and short blurb, emphasis on pricing tiers.
  - Pricing table: horizontally scrollable or responsive grid with primary CTA on preferred plan (lime). Include features list and microcopy.
  - FAQs and legal footnotes.

- Features (/features)
  - Content-first layout: modular sections each with a left/right split (media + copy).
  - Use neutral surfaces for secondary sections and hero-simple for primary.

- Dashboard (/dashboard)
  - App-shell layout with left nav, topbar, and content canvas.
  - Use surface-800 or navy backgrounds for chrome; content cards on surface-100 or neutral surfaces.
  - Maintain consistent padding and card spacings per tokens.

- Brand Intelligence (/brand-intelligence)
  - Primary tabs: Overview, Competitors, Audience, Content, Recommendations.
  - Each tab contains a responsive grid of cards; cards use the Card rules above and include badges for confidence/status.
  - Use moderate spacing and a small refresh control near the top-right of the main panel.

## Metadata and Authoritative Files

- This document is the canonical design reference. Agent workflows must consult it before producing visual or structural changes.
- For each route, there must be a small .meta.json file under /src/pages/ (see examples) which defines title, route, layout, theme, primaryAccent, purpose, and visualNotes. Agents should merge design intent from the meta file with tokens in this document when generating pages.

## Maintenance

- When adding a new visual pattern or token, update this file and version the change in git.
- Do not change copy or structure here; this file is visual and structural guidance only. For content changes, update page content sources (CMS or Markdown files) separately.

Appendix: Example component rules

- Hero CTA behavior: primary CTA on hero uses color lime-500 (#84cc16) with hover shade lime-600, focus outline 3px using indigo-500 at 20% alpha.
- Card image aspect ratios: 16:9 for feature images, 1:1 for avatars/logos.

End of document.
