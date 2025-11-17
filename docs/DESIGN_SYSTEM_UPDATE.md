# Design System Update - Bright, Clean, Modern

**Date**: January 2025  
**Status**: ✅ Core Updates Complete

---

## 🎨 Design Philosophy

**Overall Look**: Bright, clean, modern. White/light backgrounds only. No random dark sections, dark forms, or dark cards.

---

## ✅ Updates Applied

### 1. **Design Tokens** (`client/styles/tokens.css`)

#### Added Colors:
- **Lime Green (CTA)**: `--color-lime-400`, `--color-lime-500`, `--color-lime-600`
- **Card Colors**: `--color-card-bg: #f9fafb`, `--color-card-border: #e5e7eb`
- **Button Radius**: `--radius-button: 8px` (rounded rectangle, not fully rounded)

---

### 2. **Buttons** - Updated to New Design

#### Primary Button (`components/ui/button.tsx`, `components/postd/ui/buttons/PrimaryButton.tsx`)
- **Style**: Lime Green background (`--color-lime-500`) with Purple text (`--color-primary`)
- **Hover**: Lighter lime (`--color-lime-400`)
- **Shape**: Rounded rectangle (`rounded-lg`, `--radius-button`)

#### Secondary Button (`components/postd/ui/buttons/SecondaryButton.tsx`)
- **Style**: Purple outline (`border-2 border-[var(--color-primary)]`) with Purple text
- **Background**: Transparent
- **Hover**: Light purple background (`--color-primary/10`)
- **Shape**: Rounded rectangle

#### Success Button (`components/ui/button.tsx`)
- **Style**: White background with Purple text + Purple border
- **Hover**: Light purple background tint

#### All Buttons
- **Shape**: Rounded rectangle (not fully rounded/pill-shaped)
- **Radius**: `rounded-lg` or `--radius-button` (8px)

---

### 3. **Cards & Containers** (`components/postd/ui/cards/SectionCard.tsx`, `components/ui/card.tsx`)

- **Background**: Very light gray (`--color-card-bg: #f9fafb`)
- **Border**: Soft gray (`--color-card-border: #e5e7eb`)
- **Shadow**: Soft shadow (`shadow-md`)
- **Corners**: Rounded (`rounded-2xl` or `rounded-xl`)

---

### 4. **Forms & Inputs** (`components/ui/input.tsx`)

- **Background**: White (`bg-white`)
- **Border**: Light gray (`border-[var(--color-card-border)]`)
- **Focus**: Purple highlight (`focus-visible:ring-[var(--color-primary)]`)
- **Removed**: All dark mode styles

---

### 5. **Global Styles** (`global.css`)

- **Body Background**: Always white (`bg-white`)
- **Dark Mode**: Disabled (removed all dark mode styles)
- **Text**: Dark text (black or purple) for readability

---

### 6. **Typography**

- **Headings**: Dark text (black or purple)
- **Body**: Dark grey text (`--color-foreground: #111827`)
- **No light-gray text on white backgrounds**

---

## 🎯 Color Palette

### Main Colors
- **White**: `#ffffff` - Main backgrounds
- **Very Light Gray**: `#f9fafb` - Cards/sections
- **Soft Gray Border**: `#e5e7eb` - Borders

### Accent Colors
- **Purple (Main Brand)**: `#3d0fd6` - Key components, text, borders
- **Lime Green (CTA)**: `#84cc16` - Primary buttons

---

## 📋 Component Updates Summary

| Component | Update |
|-----------|--------|
| Primary Button | Lime green bg + Purple text, rounded rectangle |
| Secondary Button | Purple outline + Purple text, rounded rectangle |
| Success Button | White bg + Purple text + Purple border |
| Cards | Light gray bg, soft border, rounded corners |
| Inputs | White bg, light border, purple focus |
| Global | White backgrounds, dark mode disabled |

---

## ⚠️ Remaining Work

### Components to Review for Dark Sections:
The following files were found with dark background references and should be reviewed:

1. `client/components/postd/integrations/CanvaIntegrationModal.tsx`
2. `client/components/postd/studio/StudioEntryScreen.tsx`
3. `client/components/postd/studio/TemplateCard.tsx`
4. `client/components/postd/onboarding/PostOnboardingTour.tsx`
5. `client/components/dashboard/MonthCalendarView.tsx`
6. `client/components/dashboard/ScheduleModal.tsx`
7. `client/components/ui/badge.tsx`
8. `client/components/dashboard/LibraryAssetDrawer.tsx`
9. `client/components/generation/GenerationResult.tsx`
10. `client/components/generation/PlatformSpecificPreview.tsx`
11. `client/components/integrations/IntegrationsManager.tsx`
12. `client/components/dashboard/EventEditorModal.tsx`
13. `client/components/dashboard/ElementSidebar.tsx`
14. `client/components/dashboard/SmartTagPreview.tsx`

**Action Required**: Review these files and replace any dark backgrounds with light alternatives.

---

## ✅ Verification

- ✅ Design tokens updated
- ✅ Button components updated (Primary, Secondary, Success)
- ✅ Cards updated
- ✅ Input components updated
- ✅ Global styles updated (white backgrounds, dark mode disabled)
- ✅ Rounded rectangle buttons implemented
- ✅ Build passes

---

## 📝 Notes

- **Navigation**: Purple sidebar is kept as-is (per requirements)
- **Active Items**: Green button highlight for active navigation items (to be implemented)
- **Modals**: Should use white/light-gray backgrounds with dark text
- **Spacing**: Standard padding (16–24px) maintained

---

**Status**: Core design system updates complete. Remaining work: Review and update components with dark backgrounds.

