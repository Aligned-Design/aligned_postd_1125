# POSTD Design Tokens Usage Guide

> **Status:** ✅ Active – This is an active guide for POSTD design tokens.  
> **Last Updated:** 2025-01-20

This guide explains how to use the POSTD design tokens system to maintain visual consistency across all components.

## 📋 Overview

All visual properties (colors, spacing, typography, shadows, etc.) must come from the centralized tokens system. **No ad-hoc hex codes, pixel values, or shadow definitions are allowed.**

### Token System Files

- **`client/lib/tokens.ts`** — TypeScript object with all token definitions (for component imports)
- **`client/styles/tokens.css`** — CSS custom properties file (for Tailwind and stylesheets)
- **`client/global.css`** — Imports the tokens.css file automatically

## 🎨 Token Categories

### 1. Colors

#### Primary Brand

```css
/* CSS */
background: var(--color-primary); /* #3D0FD6 */
background: var(--color-primary-light); /* #7C3AED */
background: var(--color-primary-lighter); /* #A855F7 */
```

```typescript
// TypeScript
import { tokens } from "@/lib/tokens";
const color = tokens.colors.primary; // '#3D0FD6'
```

#### Semantic Colors

```css
--color-success: #12b76a; /* For approved, published states */
--color-warning: #f59e0b; /* For pending, review states */
--color-error: #dc2626; /* For failed, error states */
--color-info: #2563eb; /* For informational states */
```

#### Neutral Colors

```css
--color-foreground: #111827; /* Text color (light mode) */
--color-surface: #f9fafb; /* Card/panel background */
--color-border: #e5e7eb; /* Borders, dividers */
--color-subtle: #9ca3af; /* Secondary text */
--color-muted: #6b7280; /* Tertiary text */
```

#### Scale Colors (Slate, Gray, Blue, Green, Red, Orange, Amber)

```css
--color-slate-50: #f8fafc; /* Lightest */
--color-slate-900: #0f172a; /* Darkest */
/* Similar scales for gray, blue, green, red, orange, amber */
```

#### Dark Mode Support

```css
--color-dark-bg: #0f172a; /* Dark background */
--color-dark-surface: #1e293b; /* Dark surface */
--color-dark-foreground: #f1f5f9; /* Dark text */
```

### 2. Spacing (4px Base Unit)

```css
--spacing-xs: 4px; /* Extra small padding/margin */
--spacing-sm: 8px; /* Small */
--spacing-md: 16px; /* Medium (default) */
--spacing-lg: 24px; /* Large */
--spacing-xl: 32px; /* Extra large */
--spacing-2xl: 40px; /* 2x large */
--spacing-3xl: 48px; /* 3x large */
--spacing-4xl: 64px; /* 4x large */
```

**Usage in Tailwind:**

```html
<div class="p-[var(--spacing-md)]">
  <!-- 16px padding -->
  <div class="gap-[var(--spacing-sm)]"><!-- 8px gap --></div>
</div>
```

### 3. Typography

#### Font Family

```css
--font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

#### Font Sizes

```css
--font-size-h1: 32px; /* Page headings */
--font-size-h2: 24px; /* Section headings */
--font-size-h3: 20px; /* Subsection headings */
--font-size-body-lg: 16px; /* Large body text */
--font-size-body: 14px; /* Default body text */
--font-size-body-sm: 12px; /* Small body text */
--font-size-label: 12px; /* Labels, badges */
```

#### Font Weights

```css
--font-weight-normal: 400; /* Regular text */
--font-weight-medium: 500; /* Emphasized text */
--font-weight-semibold: 600; /* Section headings */
--font-weight-bold: 700; /* Strong emphasis */
--font-weight-black: 900; /* Page headings */
```

#### Line Height

```css
--line-height-tight: 1.2; /* Headings */
--line-height-normal: 1.5; /* Body text (default) */
--line-height-relaxed: 1.75; /* For long-form content */
```

#### Letter Spacing

```css
--letter-spacing-tight: -0.02em; /* Headings (tighter) */
--letter-spacing-normal: 0em; /* Body text */
--letter-spacing-wide: 0.02em; /* Captions, labels */
```

### 4. Border Radius

```css
--radius-sm: 4px; /* Badges, small buttons */
--radius-md: 6px; /* Input fields */
--radius-lg: 8px; /* Cards, buttons (default) */
--radius-xl: 12px; /* Modals, large components */
--radius-2xl: 16px; /* Panels, large components */
--radius-full: 9999px; /* Fully rounded (pills) */
```

### 5. Shadows (Elevation System)

```css
--shadow-none: none; /* No shadow */
--shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05); /* Subtle lift */
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05); /* Small cards */
--shadow-base: ...; /* Default cards */
--shadow-md: ...; /* Elevated cards, popovers */
--shadow-lg: ...; /* Modals, tooltips */
--shadow-xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25); /* Large modals */
```

### 6. Animations

```css
--animation-easing: cubic-bezier(0.4, 0, 0.2, 1); /* Standard easing */
--animation-duration-quick: 150ms; /* UI feedback */
--animation-duration-normal: 300ms; /* Page transitions */
--animation-duration-slow: 500ms; /* Enter/exit */
```

## 🔧 How to Use Tokens

### In Tailwind CSS (Preferred)

Use CSS custom property syntax with Tailwind:

```html
<!-- Color -->
<button class="bg-[var(--color-primary)] text-white">Click</button>

<!-- Spacing -->
<div class="p-[var(--spacing-md)] gap-[var(--spacing-sm)]">Content</div>

<!-- Border radius -->
<div class="rounded-[var(--radius-lg)]">Card</div>

<!-- Shadow -->
<div class="shadow-[var(--shadow-md)]">Elevated</div>

<!-- Typography -->
<h1 class="text-[var(--font-size-h1)] font-[var(--font-weight-bold)]">
  Heading
</h1>
```

### In React Components (TypeScript)

```typescript
import { tokens } from '@/lib/tokens';
import { cn } from '@/lib/utils';

function MyComponent() {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)]",
        "bg-[var(--color-surface)]",
        "p-[var(--spacing-md)]",
        "shadow-[var(--shadow-md)]"
      )}
    >
      <h3 className={cn(
        "text-[var(--font-size-h3)]",
        "font-[var(--font-weight-semibold)]",
        "text-[var(--color-foreground)]"
      )}>
        {tokens.colors.primary}
      </h3>
    </div>
  );
}
```

### In CSS/SCSS Files

```css
.my-component {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
  box-shadow: var(--shadow-md);
  font-family: var(--font-family);
  font-size: var(--font-size-body);
  color: var(--color-foreground);
  transition: background-color var(--animation-duration-normal)
    var(--animation-easing);
}

.my-component:hover {
  background: var(--color-gray-100);
}

@media (prefers-color-scheme: dark) {
  .my-component {
    background: var(--color-dark-surface);
    border-color: var(--color-slate-600);
    color: var(--color-dark-foreground);
  }
}
```

## 📦 Refactored Components

The following components have been refactored to consume tokens only:

| Component      | Status         | Location                          |
| -------------- | -------------- | --------------------------------- |
| Button         | ✅ Refactored  | `client/components/ui/button.tsx` |
| Card           | ✅ Refactored  | `client/components/ui/card.tsx`   |
| Badge          | ✅ Refactored  | `client/components/ui/badge.tsx`  |
| Input          | ✅ Refactored  | `client/components/ui/input.tsx`  |
| Toast (Sonner) | ✅ Refactored  | `client/components/ui/sonner.tsx` |
| Modal          | 🔄 In progress | `client/components/ui/dialog.tsx` |
| Tabs           | 🔄 Pending     | `client/components/ui/tabs.tsx`   |
| Table          | 🔄 Pending     | `client/components/ui/table.tsx`  |

## 🎯 Migration Checklist

When refactoring an existing component:

- [ ] Identify all hardcoded colors, spacing, and dimensions
- [ ] Replace with corresponding token variables
- [ ] Add dark mode support using `dark:` prefix
- [ ] Add focus/hover states using semantic colors
- [ ] Update shadows to use token elevation system
- [ ] Use token-based font sizes and weights
- [ ] Test in both light and dark modes
- [ ] Add Storybook story with theme variants

## ❌ What NOT To Do

```typescript
// ❌ WRONG - Ad-hoc hex code
<div className="bg-[#FF0000]">Content</div>

// ❌ WRONG - Arbitrary pixel values
<div className="p-[17px] gap-[23px]">Content</div>

// ❌ WRONG - Custom shadow
<div className="shadow-[0_4px_12px_rgba(0,0,0,0.2)]">Content</div>

// ❌ WRONG - Direct font values
<h1 className="text-[28px] font-[750]">Heading</h1>
```

## ✅ What TO Do

```typescript
// ✅ RIGHT - Token-based colors
<div className="bg-[var(--color-error)]">Content</div>

// ✅ RIGHT - Token-based spacing
<div className="p-[var(--spacing-lg)] gap-[var(--spacing-md)]">Content</div>

// ✅ RIGHT - Token-based shadows
<div className="shadow-[var(--shadow-md)]">Content</div>

// ✅ RIGHT - Token-based typography
<h1 className="text-[var(--font-size-h1)] font-[var(--font-weight-bold)]">Heading</h1>
```

## 🌙 Dark Mode

All components automatically support dark mode via CSS custom properties. The system uses:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --color-foreground: #f1f5f9; /* Light text */
    --color-surface: #1e293b; /* Dark surface */
    --color-border: #475569; /* Dark borders */
  }
}
```

In components, use `dark:` prefixes:

```html
<div class="bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface)]">
  <p
    class="text-[var(--color-foreground)] dark:text-[var(--color-dark-foreground)]"
  >
    This works in both themes
  </p>
</div>
```

## 📚 Additional Resources

- **Design System Spec**: `/docs/DESIGN_SYSTEM.md`
- **Figma Components**: [Link to Figma library]
- **Storybook**: (To be deployed at `/storybook`)
- **Color Contrast**: All colors meet WCAG AA standards

## 🚀 Next Steps

1. Continue refactoring remaining components (Modal, Tabs, Table, etc.)
2. Set up Storybook with token visualizations
3. Create snapshot tests for each refactored component
4. Audit entire codebase for ad-hoc styles
5. Document component-specific token overrides

---

**Last Updated**: November 2025
**Maintained By**: Design System Team
