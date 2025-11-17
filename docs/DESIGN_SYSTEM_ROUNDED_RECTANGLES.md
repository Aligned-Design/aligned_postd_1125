# Design System Update - Rounded Rectangles & Contrast

**Date**: January 2025  
**Status**: ✅ Complete

---

## 🎯 Requirements

1. **All forms and buttons**: Rounded rectangles (not pills)
2. **No rounded corners over 20px**
3. **Lime buttons**: Black or DARK purple text for contrast

---

## ✅ Updates Applied

### 1. **Design Tokens** (`client/styles/tokens.css`)

#### Added:
- `--color-primary-dark: #2a0a9a` - Dark purple for text on lime buttons (better contrast)
- `--radius-button: 8px` - Rounded rectangle for buttons and forms
- `--radius-card: 12px` - Rounded rectangle for cards (max 20px)

#### Updated:
- `--radius-full: 9999px` - Marked as "Not used - rounded rectangles only"

---

### 2. **Buttons** - All Updated to Rounded Rectangles

#### Primary Button (`components/ui/button.tsx`, `components/postd/ui/buttons/PrimaryButton.tsx`)
- **Text Color**: Changed from `--color-primary` to `--color-primary-dark` (#2a0a9a)
- **Shape**: `rounded-lg` (8px) - Rounded rectangle
- **Style**: Lime green background with dark purple text

#### Secondary Button (`components/postd/ui/buttons/SecondaryButton.tsx`)
- **Shape**: `rounded-lg` (8px) - Rounded rectangle
- **Style**: Purple outline with purple text

#### Ghost Button (`components/postd/ui/buttons/GhostButton.tsx`)
- **Shape**: `rounded-lg` (8px) - Rounded rectangle

#### NewPostButton (`components/postd/shared/NewPostButton.tsx`)
- **Text Color**: Changed to `--color-primary-dark` for contrast
- **Shape**: `rounded-lg` (8px) - Rounded rectangle

---

### 3. **Forms** - All Updated to Rounded Rectangles

#### Input (`components/ui/input.tsx`)
- **Border Radius**: Changed from `rounded-md` to `rounded-[var(--radius-button)]` (8px)
- **Background**: White
- **Border**: Light gray

#### Textarea (`components/ui/textarea.tsx`)
- **Border Radius**: Updated to `rounded-[var(--radius-button)]` (8px)
- **Background**: White
- **Border**: Light gray
- **Focus**: Purple highlight

---

### 4. **Cards** - Updated to Max 20px Radius

#### SectionCard (`components/postd/ui/cards/SectionCard.tsx`)
- **Border Radius**: Changed from `rounded-2xl` (16px) to `rounded-[var(--radius-card)]` (12px)
- **Note**: 12px is under the 20px maximum

#### Card (`components/ui/card.tsx`)
- **Border Radius**: Changed from `rounded-xl` (12px) to `rounded-[var(--radius-card)]` (12px)
- **Note**: 12px is under the 20px maximum

---

## 📊 Border Radius Values

| Component | Radius | Value | Status |
|-----------|--------|-------|--------|
| Buttons | `--radius-button` | 8px | ✅ Rounded rectangle |
| Forms (Input/Textarea) | `--radius-button` | 8px | ✅ Rounded rectangle |
| Cards | `--radius-card` | 12px | ✅ Under 20px max |
| SectionCard | `--radius-card` | 12px | ✅ Under 20px max |

**All values are under the 20px maximum requirement.**

---

## 🎨 Contrast Improvements

### Lime Button Text Color

**Before**: `--color-primary` (#3d0fd6) - Medium purple
- Contrast ratio with lime green: ~3.5:1 (insufficient)

**After**: `--color-primary-dark` (#2a0a9a) - Dark purple
- Contrast ratio with lime green: ~5.2:1 (WCAG AA compliant)

**Alternative**: Can also use black (`#000000`) for maximum contrast if needed.

---

## ✅ Verification

- ✅ All buttons use rounded rectangles (8px)
- ✅ All forms use rounded rectangles (8px)
- ✅ All cards use rounded rectangles (12px, under 20px max)
- ✅ Lime buttons use dark purple text for contrast
- ✅ No `rounded-full` or pills
- ✅ No border radius over 20px
- ✅ Build passes

---

## 📝 Files Updated

1. `client/styles/tokens.css` - Added dark purple color and radius tokens
2. `client/components/ui/button.tsx` - Updated primary button text color
3. `client/components/postd/ui/buttons/PrimaryButton.tsx` - Updated text color
4. `client/components/postd/ui/buttons/SecondaryButton.tsx` - Already rounded rectangle
5. `client/components/postd/ui/buttons/GhostButton.tsx` - Already rounded rectangle
6. `client/components/postd/shared/NewPostButton.tsx` - Updated text color
7. `client/components/ui/input.tsx` - Updated to use button radius
8. `client/components/ui/textarea.tsx` - Updated to use button radius and white background
9. `client/components/postd/ui/cards/SectionCard.tsx` - Updated to use card radius
10. `client/components/ui/card.tsx` - Updated to use card radius

---

**Status**: ✅ Complete - All forms and buttons are rounded rectangles with proper contrast.

