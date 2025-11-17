# Design Reference — Homepage (Aligned AI)

This document captures the visual and spacing standards used on the redesigned homepage. Use this as the canonical reference when applying the same system to other pages.

## Key Principles

- Rhythm: Dark → Light → Dark flow across the page.
- Containers: max-w-7xl, centered, consistent horizontal padding (px-6).
- Vertical spacing: Use py-20 between major sections for even rhythm.
- Grid: Use responsive grids with `items-stretch` and cards set to `h-full` to maintain even column heights.

## Color Tokens

- Dark hero gradient: linear-gradient(180deg, #071025 0%, #2b0f3a 60%)
- Accent (primary): #C9F06A (lime/chartreuse)
- Surface light: #F8FAFC (Tailwind gray-50 / used as bg-gray-50)
- Card background: white with subtle border `border-gray-100`
- Text (dark): `text-slate-900` for headings and primary copy
- Text (muted): `text-slate-600` for body copy on light surfaces

## Buttons (Global)

- Shape: rounded-3xl
- Size: default h-12, px-6
- Typography: font-semibold
- Primary (default): bg: #C9F06A, text: black, shadow on hover
- Secondary (outline): border + transparent fill on hover
- Use `Button` component with `variant="default"` or `variant="outline"` and `size="lg"`.

## Cards

- Radius: rounded-2xl
- Padding: p-6
- Border: border-gray-100
- Shadow: shadow-md for subtle lift
- Layout: Use `h-full` on cards inside grid + grid `items-stretch` for uniform heights

## Typography

- H1: text-5xl (md:6xl), font-extrabold, leading-tight
- H2: text-3xl (md:4xl), font-extrabold
- Body: text-lg, leading-relaxed, text-slate-600 on light surfaces

## Reviews / Testimonials

- Light surface (`bg-gray-50`) with white review cards
- Horizontal auto-scroll on desktop (snap points) and stacked layout on mobile
- Pause-on-hover for auto sliding

## Footer

- Dark background (use #071025), light text (text-slate-300)
- Balanced layout: brand logo left, nav center, social icons right

## Accessibility & Responsiveness

- Maintain contrast ratios >= 4.5 for body text
- Buttons have focus rings (focus-visible) and large touch targets (h-12)
- All interactive controls keyboard-accessible

## File references

- Homepage: client/pages/Index.tsx
- Buttons: client/components/ui/button.tsx
- Cards: client/components/ui/card.tsx
- Reviews carousel: client/components/reviews/ReviewsCarousel.tsx
- Footer: client/components/FooterNew.tsx

Use this file as the design standard when porting the homepage visual system to other pages.
