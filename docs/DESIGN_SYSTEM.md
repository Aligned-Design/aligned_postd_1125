# POSTD Design System

> **Status:** ✅ Active – This is an active reference for POSTD design system.  
> **Last Updated:** 2025-01-20

Complete reference for the POSTD design system, including colors, typography, spacing, animations, and component guidelines.

## Table of Contents

1. [Colors](#colors)
2. [Typography](#typography)
3. [Spacing & Sizing](#spacing--sizing)
4. [Shadows](#shadows)
5. [Z-Index Scale](#z-index-scale)
6. [Animations](#animations)
7. [Glassmorphism](#glassmorphism)
8. [CSS Variables](#css-variables)

---

## Colors

### Primary Brand Colors

#### Indigo (Primary)
Deep indigo is the main brand color used for UI elements, headings, and text.

```css
--color-indigo-900: #1f2937  /* Darkest indigo */
--color-indigo-800: #2d3748  /* Dark indigo */
--color-indigo-700: #3730a3  /* Deep indigo (primary) */
--color-indigo-600: #4f46e5  /* Indigo */
--color-indigo-500: #6366f1  /* Medium indigo */
--color-indigo-400: #818cf8  /* Light indigo */
--color-indigo-300: #a5b4fc  /* Lighter indigo */
--color-indigo-200: #c7d2fe  /* Very light indigo */
--color-indigo-100: #edeeff  /* Pale indigo (backgrounds) */
```

**Usage:**
- Buttons and CTAs (indigo-600, indigo-700)
- Headings and primary text (indigo-900, indigo-800)
- Backgrounds and borders (indigo-100, indigo-200)

#### Lime (Accent)
Bright lime is used for CTAs, highlights, and uptrends.

```css
--color-lime-500: #84cc16  /* Lime */
--color-lime-400: #b9f227  /* Bright lime (accent - primary) */
--color-lime-300: #cff25a  /* Light lime */
--color-lime-200: #e4fc7b  /* Very light lime */
--color-lime-100: #f2fce4  /* Pale lime (backgrounds) */
```

**Usage:**
- Primary CTA buttons (lime-400)
- Success states and positive indicators (lime-500)
- Accent backgrounds (lime-100, lime-200)

#### Blue (Complementary)
Light blue complements indigo in UI elements.

```css
--color-blue-600: #2563eb  /* Blue */
--color-blue-500: #3b82f6  /* Light blue */
--color-blue-400: #60a5fa  /* Lighter blue */
--color-blue-300: #93c5fd  /* Very light blue */
--color-blue-100: #dbeafe  /* Pale blue (backgrounds) */
```

### Semantic Colors

#### Slate (Neutral)
For text, borders, and neutral UI elements.

```css
--color-slate-900: #0f172a  /* Darkest slate (main text) */
--color-slate-800: #1e293b  /* Dark slate */
--color-slate-700: #334155  /* Medium slate */
--color-slate-600: #475569  /* Medium-light slate (body text) */
--color-slate-500: #64748b  /* Light slate */
--color-slate-400: #94a3b8  /* Lighter slate */
--color-slate-200: #e2e8f0  /* Very light slate (borders) */
--color-slate-100: #f1f5f9  /* Pale slate (backgrounds) */
```

#### Status Colors

```css
--color-success: #10b981   /* Green (success) */
--color-warning: #f59e0b   /* Amber (warning) */
--color-error: #ef4444     /* Red (error) */
--color-info: #0ea5e9      /* Cyan (info) */
```

---

## Typography

### Font Families

```css
--font-family-display: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
--font-family-body: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
```

System fonts provide fast loading and excellent readability across platforms.

### Font Weights

```css
--font-weight-normal: 400      /* Regular */
--font-weight-medium: 500      /* Medium */
--font-weight-semibold: 600    /* Semibold */
--font-weight-bold: 700        /* Bold */
--font-weight-extrabold: 800   /* Extrabold */
--font-weight-black: 900       /* Black */
```

### Usage Guidelines

- **Headings (H1-H2)**: 800-900 weight, indigo-900 color
- **Subheadings (H3-H4)**: 700-800 weight, indigo-800 color
- **Body Text**: 400 weight, slate-700 color
- **Labels & Buttons**: 600-700 weight, slate-900 color
- **Captions**: 400-500 weight, slate-600 color

---

## Spacing & Sizing

### 8pt Base Grid

All spacing values follow an 8pt grid system for consistency and alignment.

```css
--spacing-1: 0.5rem  /* 8px */
--spacing-2: 1rem    /* 16px */
--spacing-3: 1.5rem  /* 24px */
--spacing-4: 2rem    /* 32px */
--spacing-5: 2.5rem  /* 40px */
--spacing-6: 3rem    /* 48px */
--spacing-8: 4rem    /* 64px */
```

### Border Radius

```css
--radius-sm: 8px      /* Small (buttons, inputs) */
--radius-md: 12px     /* Medium (cards) */
--radius-lg: 16px     /* Large (containers) */
--radius-xl: 24px     /* Extra large (hero sections) */
--radius-full: 9999px /* Fully rounded (circles, pills) */
```

### Responsive Spacing

Spacing adjusts automatically based on screen size:

| Breakpoint | Section Padding | Card Padding |
|-----------|-----------------|--------------|
| Mobile (< 640px) | 24px (var(--spacing-3)) | 16px (var(--spacing-2)) |
| Tablet (641-1024px) | 32px (var(--spacing-4)) | 24px (var(--spacing-3)) |
| Desktop (> 1025px) | 48px (var(--spacing-6)) | 32px (var(--spacing-4)) |

---

## Shadows

```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.10);
--shadow-lg: 0 8px 30px rgba(37, 37, 91, 0.06);  /* Glass card shadow */
--shadow-xl: 0 20px 50px rgba(37, 37, 91, 0.10);
--shadow-none: none;
```

**Usage:**
- Cards and containers: `--shadow-lg`
- Hover states on cards: `--shadow-xl`
- Subtle borders: `--shadow-sm`
- Elevated modals: `--shadow-xl` or `--shadow-lg`

---

## Z-Index Scale

A consistent z-index scale ensures proper layering of UI elements.

```css
--z-hide: -1;       /* Hidden elements */
--z-auto: 0;        /* Default stacking context */
--z-base: 1;        /* Base elements */
--z-docked: 10;     /* Header, footer */
--z-dropdown: 100;  /* Dropdowns, popovers */
--z-sticky: 500;    /* Sticky elements */
--z-fixed: 1000;    /* Fixed overlays, modals */
--z-modal: 1040;    /* Modal backdrop + content */
--z-tooltip: 1100;  /* Tooltips (highest) */
```

---

## Animations

All animations are GPU-accelerated and optimized for performance. Durations range from 200-400ms for snappy feedback.

### Animation Categories

#### 1. Background & Gradient Animations (Infinite Loops)

**Gradient Shift** (8s)
- Subtle background gradient animation
- Used in hero sections
- Continuous flowing effect

**Pulse Glow** (3s)
- Soft pulsing opacity effect
- Used for glowing orbs and highlights
- Creates ambient lighting effect

**Float Soft** (4s)
- Gentle floating animation
- Used for decorative elements
- Subtle up/down movement (-8px range)

**Reflect Sweep** (3s)
- Light reflection sweep across glass surfaces
- Creates realistic glass refraction effect
- Horizontal translate animation

#### 2. Entrance Animations (One-time)

**Slide Up** (0.6s)
- Content slides up from below while fading in
- Used for hero section copy
- Default easing: `ease-out`

**Fade In Up** (0.7s)
- Content fades in while sliding up slightly
- Used for cards and sections
- Smoother than slide-up

**Fade In** (0.3s)
- Simple opacity fade-in
- Used for overlays and background images

#### 3. Expansion & Disclosure (Accordion)

**Slide Down** (0.2s)
- Content slides down from above
- Used for accordion open
- Reveals height smoothly

**Slide Up Collapse** (0.2s)
- Content slides up while collapsing
- Used for accordion close
- Mirror of slide-down

#### 4. Interaction Animations (Hover, Focus)

**Scale Pulse** (0.2s)
- Element pulses with slight scale increase (1.0 → 1.05)
- Used for button hover states
- Snappy feedback

**Lift** (0.3s)
- Element lifts up with shadow increase
- Used for card hover states
- Creates depth and elevation

#### 5. Attention-Seeking Animations

**Shimmer** (2s infinite)
- Horizontal shimmer effect across element
- Used for loading states and skeleton screens
- Indicates loading activity

**Bounce** (0.6s)
- Elastic bounce animation
- Used for attention-grabbing elements
- Multiple bounce keyframes for realism

**Pulse** (2s infinite)
- Simple opacity pulse
- Used for loading indicators and notifications

#### 6. Data Visualization Animations

**Sparkline Draw** (0.4s)
- Sparkline animates from left to right
- Used for chart visualizations
- Reveals data progressively

**Bar Reveal** (0.5s)
- Chart bars animate upward from baseline
- Used in analytics charts
- Height animation with opacity

#### 7. Rotation Animations

**Rotate** (1s infinite)
- Continuous 360° rotation
- Used for loading spinners and refresh icons

**Chevron Rotate** (0.2s)
- Accordion chevron/arrow rotation
- Used for expand/collapse indicators

#### 8. Stagger & Sequence

**Stagger Effect**
- Sequential animation of multiple elements
- Each element delays 100ms from previous
- Apply via CSS class: `.animate-stagger-{0-4}`

```jsx
{items.map((item, idx) => (
  <div key={idx} className={`animate-fade-in-up animate-stagger-${idx}`}>
    {item}
  </div>
))}
```

### Animation Performance

All animations follow performance best practices:

1. **Use transforms** (translate, scale, rotate) instead of position/size changes
   - GPU-accelerated, smooth 60fps

2. **Use opacity** for fade effects
   - Cheap operation, no layout recalculation

3. **Prefer CSS animations** over JavaScript
   - Smoother, better battery life on mobile

4. **Keep durations 200-400ms**
   - Fast feedback, prevents slowness

5. **Avoid animating width/height**
   - Causes layout thrashing
   - Use `scale()` or `max-height` instead

### Accessibility

All animations respect the `prefers-reduced-motion` media query:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Glassmorphism

The design system uses glassmorphism effects for modern, premium-looking UI.

### Glass Background

```css
--glass-bg: rgba(255, 255, 255, 0.55);        /* Standard glass */
--glass-bg-light: rgba(255, 255, 255, 0.40);  /* Lighter glass */
--glass-bg-lighter: rgba(255, 255, 255, 0.25);/* Lightest glass */
```

### Glass Border

```css
--glass-border: rgba(255, 255, 255, 0.12);      /* Subtle border */
--glass-border-light: rgba(255, 255, 255, 0.20);/* Light border */
--glass-border-hover: rgba(99, 102, 241, 0.30); /* Indigo tint on hover */
```

### Overlay Gradients

```css
--overlay-subtle: rgba(99, 102, 241, 0.05);   /* Very subtle overlay */
--overlay-light: rgba(99, 102, 241, 0.10);    /* Light overlay */
--overlay-medium: rgba(99, 102, 241, 0.15);   /* Medium overlay */
```

### Glass Card Example

```jsx
<div className="glass-card">
  {/* Content */}
</div>
```

CSS:
```css
.glass-card {
  background: var(--glass-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);  /* Safari support */
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
}

.glass-card:hover {
  background: rgba(255, 255, 255, 0.65);
  border-color: var(--glass-border-hover);
  box-shadow: var(--shadow-lg);
  transition: all 300ms ease;
}
```

---

## CSS Variables

All design tokens are available as CSS custom properties. Import `client/styles/tokens.css` in your main CSS file to access them globally.

### Available in All Components

```jsx
// Use CSS variables in components
<div style={{ color: 'var(--color-indigo-600)' }}>
  Indigo text
</div>

// Use Tailwind classes (variables are integrated)
<div className="bg-blue-100 text-indigo-900">
  Light blue background with dark indigo text
</div>
```

### Responsive Media Queries

```css
/* Mobile-first approach */
@media (max-width: 640px) {
  /* Mobile styles - smaller spacing, touch-optimized */
}

@media (min-width: 641px) and (max-width: 1024px) {
  /* Tablet styles */
}

@media (min-width: 1025px) {
  /* Desktop styles - generous spacing */
}
```

---

## Utility Classes

### Text Utilities

```css
.text-primary    /* color: slate-900, font-weight: semibold */
.text-secondary  /* color: slate-600, font-weight: medium */
.text-subtle     /* color: slate-500, font-weight: medium */
.text-accent     /* color: indigo-600, font-weight: bold */
.text-highlight  /* color: lime-500, font-weight: bold */
```

### Transition Utilities

```css
.transition-fast   /* all 150ms ease */
.transition-base   /* all 200ms ease */
.transition-slow   /* all 300ms ease */
.transition-slower /* all 400ms ease */

.transition-opacity   /* opacity 200ms ease */
.transition-transform /* transform 200ms ease */
.transition-colors    /* colors 200ms ease */
.transition-shadow    /* box-shadow 200ms ease */
```

### Animation Utility Classes

```css
.animate-gradient-shift     /* 8s infinite */
.animate-pulse-glow        /* 3s infinite */
.animate-float-soft        /* 4s infinite */
.animate-slide-up          /* 0.6s forwards */
.animate-fade-in-up        /* 0.7s forwards */
.animate-lift              /* 0.3s forwards */
/* ... and more */
```

---

## Implementation Examples

### Color Usage

```jsx
// Button with primary color
<button className="bg-indigo-600 text-white hover:bg-indigo-700">
  Primary Action
</button>

// CTA button with accent color
<button className="bg-lime-400 text-slate-900 hover:bg-lime-500">
  Start Free Trial
</button>

// Card background
<div className="bg-slate-100 rounded-lg p-6">
  <h3 className="text-indigo-900 font-bold">Card Title</h3>
  <p className="text-slate-600">Card content</p>
</div>
```

### Spacing Usage

```jsx
// Using CSS variables
<div style={{ padding: 'var(--spacing-4)', marginBottom: 'var(--spacing-3)' }}>
  Content with consistent spacing
</div>

// Using Tailwind classes
<div className="p-8 mb-6">
  Content with 32px padding and 24px bottom margin
</div>
```

### Animation Usage

```jsx
// Entrance animation
<div className="animate-slide-up">
  Content that slides up on mount
</div>

// Hover animation
<div className="hover:animate-lift transition-all duration-300">
  Element that lifts on hover
</div>

// Infinite animation
<div className="animate-pulse-glow">
  Glowing element
</div>
```

---

## Browser Support

- **Modern browsers** (Chrome, Firefox, Safari, Edge) - Full support
- **CSS Variables**: IE 11+ (with fallbacks)
- **Backdrop Filter** (glassmorphism): Chrome 76+, Firefox 103+, Safari 9+
- **Animations**: All modern browsers, graceful degradation with `prefers-reduced-motion`

---

## Future Enhancements

- [ ] Dark mode color palette
- [ ] Additional animation types (carousel, parallax)
- [ ] Accessibility token documentation
- [ ] Figma design tokens integration
- [ ] Storybook component library

---

## Questions?

Refer to [COMPONENTS.md](COMPONENTS.md) for component-specific documentation or [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) for setup instructions.
