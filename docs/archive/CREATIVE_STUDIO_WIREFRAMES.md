> **SUPERSEDED:** This document is historical. For the latest Creative Studio documentation, see [`CODEBASE_ARCHITECTURE_OVERVIEW.md`](../CODEBASE_ARCHITECTURE_OVERVIEW.md) (Creative Studio section).  
> **Archived per Phase 5 documentation cleanup (2025-01-20)**

---

# Creative Studio — Wireframes & Implementation Plan

**Date**: January 2025  
**Phases**: 2-3 Wireframes + Technical Implementation Plan

---

## 📐 Wireframes

### **1. Template Selection Screen**

```
┌─────────────────────────────────────────────────────────────────┐
│ [← Back]  Creative Studio                                       │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Create New Design                                              │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  ✨ Start from  │  │  📋 Choose      │  │  ⚪ Blank       │ │
│  │     AI          │  │     Template    │  │     Canvas      │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                                 │
│  ────────────────────────────────────────────────────────────  │
│                                                                 │
│  Recent Designs                                                 │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐                                   │
│  │[img]│ │[img]│ │[img]│ │[img]│                                   │
│  │Name │ │Name │ │Name │ │Name │                                   │
│  └────┘ └────┘ └────┘ └────┘                                   │
│                                                                 │
│  ────────────────────────────────────────────────────────────  │
│                                                                 │
│  Template Library                    [Search...] [Category ▼]  │
│                                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │          │ │          │ │          │ │          │          │
│  │ [Preview]│ │ [Preview]│ │ [Preview]│ │ [Preview]│          │
│  │          │ │          │ │          │ │          │          │
│  │ Quote    │ │ Product  │ │ Event    │ │ Blank   │          │
│  │ Post     │ │ Spotlight│ │ Announce │ │ Canvas  │          │
│  │          │ │          │ │          │ │          │          │
│  │ [Use]    │ │ [Use]    │ │ [Use]    │ │ [Use]    │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Key Features:**
- Three clear entry points (AI, Template, Blank)
- Recent designs carousel
- Visual template previews (not emojis)
- Search and category filters
- Format badges on templates

---

### **2. Canvas Editor Layout**

```
┌─────────────────────────────────────────────────────────────────┐
│ [←] Design Name  [💾 Saved]  [Save ▼]  [🚀 Publish]  [⋯]      │
└─────────────────────────────────────────────────────────────────┘
┌──┬──────────────────────────────────────────────┬──────────────┐
│  │                                              │              │
│T │         ┌──────────────────────────┐         │  Properties  │
│I │         │                          │         │  Panel       │
│S │         │                          │         │  (320px)     │
│L │         │      Canvas Area         │         │              │
│  │         │      (Centered)          │         │  [Element]   │
│─ │         │                          │         │  Properties] │
│+ │         │   [Selected Element]     │         │              │
│- │         │   [Floating Toolbar]     │         │  Font: Arial │
│  │         │                          │         │  Size: 24    │
│─ │         │                          │         │  Color: #    │
│↶ │         └──────────────────────────┘         │              │
│↷ │                                              │  Alignment   │
│🎨│         Grid & Rulers (optional)             │  Effects     │
│📋│                                              │              │
│✨│                                              │              │
└──┴──────────────────────────────────────────────┴──────────────┘
```

**Key Features:**
- Left toolbar (64px): Elements, Canvas controls, History, Utilities
- Canvas: Centered, maximum width, with optional grid/rulers
- Properties panel: Slides in from right when element selected (320px)
- Floating toolbar: Appears above selected element
- Simplified header: Back, Name, Save status, Actions

---

### **3. Inline AI Generation Drawer**

```
┌─────────────────────────────────────────────────────────────────┐
│ [←] Design Name  [💾 Saved]  [Save ▼]  [🚀 Publish]  [⋯]      │
└─────────────────────────────────────────────────────────────────┘
┌──┬──────────────────────────────────────────────┬──────────────┐
│  │                                              │              │
│  │         Canvas (existing design)             │              │
│  │                                              │              │
│  │ ───────────────────────────────────────────  │              │
│  │                                              │              │
│  │ ✨ Generate with AI                          │              │
│  │                                              │              │
│  │ What do you want to create?                  │              │
│  │ [Social Post] [Email] [Blog Header]         │              │
│  │                                              │              │
│  │ Topic: [________________________]            │              │
│  │ Platform: [Instagram ▼]                     │              │
│  │ Content Type: [Caption ▼]                   │              │
│  │                                              │              │
│  │ [Generate]                                   │              │
│  │                                              │              │
│  │ ── Variants ──                               │              │
│  │ ┌────────┐ ┌────────┐ ┌────────┐           │              │
│  │ │Variant1│ │Variant2│ │Variant3│           │              │
│  │ │[BFS:95]│ │[BFS:92]│ │[BFS:88]│           │              │
│  │ │[Use]   │ │[Use]   │ │[Use]   │           │              │
│  │ └────────┘ └────────┘ └────────┘           │              │
│  │                                              │              │
└──┴──────────────────────────────────────────────┴──────────────┘
```

**Key Features:**
- Inline panel (not modal) - slides up from bottom or appears in sidebar
- Simple form: Topic, Platform, Content Type
- Quick options: Pre-filled buttons for common use cases
- Variants displayed below form
- BFS badges visible
- "Use" button applies variant to canvas immediately

---

### **4. Flow Diagram: First Click → Edit → Save → Publish**

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER JOURNEY FLOW                            │
└─────────────────────────────────────────────────────────────────┘

1. ENTRY POINT
   ┌─────────────┐
   │ /studio     │
   └─────┬───────┘
         │
         ▼
   ┌─────────────────────┐
   │ Template Selection   │
   │ - AI / Template /    │
   │   Blank             │
   └─────┬───────────────┘
         │
         ▼
   ┌─────────────────────┐
   │ Choose Template     │
   │ (or start from AI)  │
   └─────┬───────────────┘
         │
         ▼
2. EDITING
   ┌─────────────────────┐
   │ Canvas Editor        │
   │ - Add elements       │
   │ - Edit properties    │
   │ - Arrange layout     │
   └─────┬───────────────┘
         │
         ▼
   ┌─────────────────────┐
   │ Auto-save           │
   │ (every 3 seconds)   │
   └─────┬───────────────┘
         │
         ▼
3. COMPLETION
   ┌─────────────────────┐
   │ Save Options        │
   │ - Save to Library    │
   │ - Save as Draft     │
   │ - Download          │
   └─────┬───────────────┘
         │
         ▼
   ┌─────────────────────┐
   │ Publish Options     │
   │ - Publish Now       │
   │ - Schedule          │
   │ - Send to Queue     │
   └─────┬───────────────┘
         │
         ▼
   ┌─────────────────────┐
   │ Success / Redirect  │
   │ - Content Queue     │
   │ - Calendar          │
   │ - Dashboard         │
   └─────────────────────┘
```

**Key Transitions:**
- **Entry → Edit**: Smooth transition, no page reload
- **Edit → Save**: Auto-save indicator, manual save dropdown
- **Save → Publish**: Clear hierarchy (Save first, then Publish)
- **Publish → Success**: Confirmation + redirect option

---

## 🔧 Technical Implementation Plan

### **Phase 1: Quick Wins (Current)**

#### **Components Created:**
1. `StudioHeader.tsx` - Simplified header
2. `FloatingToolbar.tsx` - Contextual toolbar
3. `TemplateCard.tsx` - Visual preview cards

#### **Files Modified:**
- `client/app/(postd)/studio/page.tsx` - Integrate new components
- `client/components/dashboard/CreativeStudioTemplateGrid.tsx` - Use new TemplateCard

#### **Changes:**
- Replace complex ActionButtonsHeader with simplified StudioHeader
- Add FloatingToolbar to canvas when element selected
- Update template cards to show visual previews
- Standardize spacing (24px, 32px tokens)
- Improve typography hierarchy

---

### **Phase 2: Flow Improvements**

#### **Component Changes:**

**New Components:**
1. `StudioLayout.tsx` - Main container with three-column layout
2. `StudioToolbar.tsx` - Left sidebar (64px, icon-only)
3. `StudioCanvas.tsx` - Enhanced canvas with grid/rulers
4. `StudioProperties.tsx` - Right panel (contextual, 320px)
5. `AiInlinePanel.tsx` - Inline AI generation (not modal)
6. `TemplateSelectionScreen.tsx` - Redesigned template selection
7. `RecentDesignsCarousel.tsx` - Recent designs display

**Modified Components:**
1. `CreativeStudioCanvas.tsx` - Add grid/rulers, floating toolbar integration
2. `CreativeStudioTemplateGrid.tsx` - Use new TemplateCard, add search/filters
3. `AiGenerationModal.tsx` - Convert to inline panel (or create new component)

**Removed/Deprecated:**
1. `ActionButtonsHeader.tsx` - Replaced by StudioHeader (keep for other pages)
2. Modal-based AI generation - Replace with inline panel

---

#### **File Structure:**

```
client/
├── app/(postd)/studio/
│   └── page.tsx (Main studio page - simplified)
│
├── components/postd/studio/
│   ├── StudioLayout.tsx (NEW)
│   ├── StudioHeader.tsx (Phase 1 - DONE)
│   ├── StudioToolbar.tsx (NEW)
│   ├── StudioCanvas.tsx (NEW - wrapper)
│   ├── StudioProperties.tsx (NEW)
│   ├── FloatingToolbar.tsx (Phase 1 - DONE)
│   ├── TemplateCard.tsx (Phase 1 - DONE)
│   ├── TemplateSelectionScreen.tsx (NEW)
│   ├── RecentDesignsCarousel.tsx (NEW)
│   ├── AiInlinePanel.tsx (NEW)
│   └── hooks/
│       ├── useStudioLayout.ts (NEW)
│       └── useRecentDesigns.ts (NEW)
│
└── components/dashboard/
    ├── CreativeStudioCanvas.tsx (MODIFY - add grid/rulers)
    ├── CreativeStudioTemplateGrid.tsx (MODIFY - use new TemplateCard)
    └── AiGenerationModal.tsx (DEPRECATE or convert to inline)
```

---

#### **Layout Transition:**

**Current Layout:**
```
Header (complex)
├── Left Sidebar (ElementSidebar)
├── Canvas (CreativeStudioCanvas)
└── Right Sidebar (BrandKit + Advisor)
```

**New Layout:**
```
StudioLayout
├── StudioHeader (simplified)
└── StudioContent
    ├── StudioToolbar (left, 64px)
    ├── StudioCanvas (center, flex-1)
    └── StudioProperties (right, 320px, contextual)
```

**Migration Strategy:**
1. Create `StudioLayout` component
2. Gradually move logic from `page.tsx` to layout components
3. Keep existing components as fallback during transition
4. Test each component in isolation before full integration

---

#### **State Management:**

**Current:**
- State in `page.tsx` (large component)
- LocalStorage for persistence
- No shared state management

**Proposed:**
- Create `useStudioLayout` hook for layout state
- Create `useRecentDesigns` hook for recent designs
- Keep design state in `page.tsx` (or move to context if needed)
- Add `useStudioDrafts` hook for draft management

---

#### **API Changes:**

**No API changes required for Phase 2.**

**Future API needs (Phase 3):**
- `/api/studio/drafts` - List user drafts
- `/api/studio/recent` - Recent designs
- `/api/studio/templates/favorites` - Favorite templates
- `/api/studio/autosave` - Autosave endpoint (optional)

---

#### **Impact on Existing Components:**

**Low Impact:**
- `CreativeStudioCanvas.tsx` - Add props for grid/rulers, floating toolbar
- `CreativeStudioBrandKit.tsx` - Move to Properties panel
- `CreativeStudioAdvisor.tsx` - Move to Properties panel or keep separate

**Medium Impact:**
- `CreativeStudioTemplateGrid.tsx` - Refactor to use new TemplateCard, add search/filters
- `ElementsDrawer.tsx` - May need updates for new toolbar integration

**High Impact:**
- `page.tsx` - Significant refactor to use new layout components
- `ActionButtonsHeader.tsx` - Replace with StudioHeader (but keep for other pages)

---

#### **Breaking Changes:**

**None expected** - All changes are additive or internal refactoring.

**Backward Compatibility:**
- Keep old components as fallback
- Gradual migration strategy
- Feature flags for new layout (optional)

---

### **Phase 3: Polish & Performance**

#### **Component Enhancements:**

1. **Micro-interactions:**
   - Add animations to element addition
   - Color transition animations
   - Save confirmation animations
   - Template selection animations

2. **Performance:**
   - Lazy load templates
   - Virtualize template grid for large lists
   - Optimize canvas rendering
   - Debounce autosave

3. **Accessibility:**
   - Keyboard shortcuts
   - ARIA labels
   - Focus management
   - Screen reader support

4. **Mobile Responsiveness:**
   - Stack toolbars vertically
   - Properties panel as bottom sheet
   - Touch-optimized controls
   - Responsive canvas

---

#### **Files to Add (Phase 3):**

```
client/components/postd/studio/
├── animations/
│   ├── ElementAddAnimation.tsx
│   ├── ColorTransition.tsx
│   └── SaveConfirmation.tsx
├── mobile/
│   ├── MobileToolbar.tsx
│   ├── MobilePropertiesSheet.tsx
│   └── TouchControls.tsx
└── accessibility/
    ├── KeyboardShortcuts.tsx
    └── FocusManager.tsx
```

---

## 📋 Implementation Checklist

### **Phase 1: Quick Wins** ✅
- [x] Create StudioHeader component
- [x] Create FloatingToolbar component
- [x] Create TemplateCard with visual previews
- [ ] Integrate StudioHeader into studio page
- [ ] Integrate FloatingToolbar into canvas
- [ ] Update template grid to use new TemplateCard
- [ ] Standardize spacing/typography
- [ ] Remove utility buttons from header
- [ ] Test and verify

### **Phase 2: Flow Improvements** (Next)
- [ ] Create StudioLayout component
- [ ] Create StudioToolbar component
- [ ] Create StudioProperties component
- [ ] Create AiInlinePanel component
- [ ] Create TemplateSelectionScreen component
- [ ] Create RecentDesignsCarousel component
- [ ] Refactor studio page to use new layout
- [ ] Add search/filters to template selection
- [ ] Convert AI modal to inline panel
- [ ] Test and verify

### **Phase 3: Polish** (Future)
- [ ] Add micro-interactions
- [ ] Performance optimizations
- [ ] Accessibility improvements
- [ ] Mobile responsiveness
- [ ] Test and verify

---

## 🎯 Success Criteria

**Phase 1:**
- Header simplified (max 5 buttons visible)
- Floating toolbar appears on element selection
- Template cards show visual previews
- Spacing/typography consistent

**Phase 2:**
- Three-column layout functional
- AI generation inline (not modal)
- Template selection with search/filters
- Recent designs visible
- Flow from entry → edit → save → publish smooth

**Phase 3:**
- Micro-interactions feel polished
- Performance: < 100ms interactions
- Mobile: Fully responsive
- Accessibility: WCAG AA compliant

---

## 🚀 Next Steps

1. **Complete Phase 1 integration** (current)
   - Integrate new components into studio page
   - Test and fix any issues
   - Verify spacing/typography consistency

2. **Begin Phase 2 planning**
   - Review wireframes with team
   - Confirm component structure
   - Set up new file structure

3. **Implement Phase 2**
   - Start with StudioLayout
   - Build components incrementally
   - Test each component before integration

4. **Phase 3 planning** (after Phase 2)
   - Prioritize polish items
   - Plan performance optimizations
   - Design mobile experience

---

**Document Status**: ✅ Complete — Ready for Phase 2 implementation

