/**
 * Accessibility utilities for consistent WCAG 2.1 AA compliance
 * Provides ARIA, keyboard navigation, and semantic HTML helpers
 */

export interface AriaAttributes {
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
  "aria-pressed"?: boolean | "mixed";
  "aria-expanded"?: boolean;
  "aria-selected"?: boolean;
  "aria-disabled"?: boolean;
  "aria-hidden"?: boolean;
  role?: string;
}

/**
 * Generate aria attributes for icon buttons
 */
export function getIconButtonAttributes(label: string): AriaAttributes {
  return {
    "aria-label": label,
    role: "button",
  };
}

/**
 * Generate aria attributes for modal dialogs
 */
export function getModalAttributes(
  title: string,
  isDismissible: boolean = true
): AriaAttributes {
  // ✅ FIX: Use proper React AriaAttributes type
  return {
    role: "dialog",
    "aria-modal": true,
    "aria-labelledby": `modal-title-${title.replace(/\s+/g, "-").toLowerCase()}`,
    "aria-describedby": `modal-description-${title.replace(/\s+/g, "-").toLowerCase()}`,
  } as AriaAttributes;
}

/**
 * Generate aria attributes for disclosure widgets (expandable panels)
 */
export function getDisclosureAttributes(
  isExpanded: boolean,
  id: string
): AriaAttributes {
  // ✅ FIX: Use type assertion for aria attributes
  return {
    "aria-expanded": isExpanded,
    "aria-controls": `disclosure-content-${id}`,
  } as AriaAttributes;
}

/**
 * Generate aria attributes for status regions
 */
export function getStatusRegionAttributes(
  type: "status" | "alert" | "log" = "status"
): AriaAttributes {
  // ✅ FIX: Use type assertion for aria attributes
  return {
    role: type === "alert" ? "alert" : "status",
    "aria-live": type === "alert" ? "assertive" : "polite",
    "aria-atomic": true,
  } as AriaAttributes;
}

/**
 * Keyboard event handler for button-like elements
 * Supports Enter and Space keys
 */
export function handleKeyboardActivation(
  event: React.KeyboardEvent<HTMLElement>,
  onActivate: () => void
): void {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    onActivate();
  }
}

/**
 * Check if element should be keyboard accessible
 */
export function shouldBeFocusable(element: HTMLElement): boolean {
  return (
    element.tagName === "BUTTON" ||
    element.tagName === "A" ||
    element.tagName === "INPUT" ||
    element.tagName === "SELECT" ||
    element.tagName === "TEXTAREA" ||
    element.getAttribute("role") === "button" ||
    element.getAttribute("tabindex") === "0"
  );
}

/**
 * Focus management helpers
 */
export const focusUtils = {
  /**
   * Trap focus within a modal or dropdown
   */
  trapFocus(
    container: HTMLElement,
    onEscape: () => void
  ): (event: KeyboardEvent) => void {
    return (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onEscape();
        return;
      }

      if (event.key === "Tab") {
        const focusableElements = container.querySelectorAll(
          "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[
          focusableElements.length - 1
        ] as HTMLElement;

        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    };
  },

  /**
   * Restore focus to a previously focused element
   */
  restoreFocus(
    previouslyFocused: HTMLElement | null,
    fallback?: HTMLElement
  ): void {
    if (previouslyFocused && previouslyFocused.isConnected) {
      previouslyFocused.focus();
    } else if (fallback) {
      fallback.focus();
    }
  },
};

/**
 * Heading hierarchy validation
 * Ensures h1, h2, h3 sequence is correct
 */
export function validateHeadingHierarchy(root: Document): {
  valid: boolean;
  issues: string[];
} {
  const headings = Array.from(root.querySelectorAll("h1, h2, h3, h4, h5, h6"));
  const issues: string[] = [];
  let previousLevel = 0;

  headings.forEach((heading, index) => {
    const level = parseInt(heading.tagName[1]);
    if (level > previousLevel + 1) {
      issues.push(
        `Heading hierarchy issue at index ${index}: ${heading.tagName} follows ${previousLevel === 0 ? "no heading" : `h${previousLevel}`}`
      );
    }
    previousLevel = level;
  });

  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Color contrast checking (simplified WCAG calculation)
 * Returns luminance values for contrast ratio calculation
 */
export function getLuminance(hex: string): number {
  const rgb = parseInt(hex.slice(1), 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = (rgb >> 0) & 0xff;

  return (
    (0.299 * r + 0.587 * g + 0.114 * b) /
    255
  );
}

export function getContrastRatio(
  foreground: string,
  background: string
): number {
  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check WCAG AA compliance (4.5:1 for normal text, 3:1 for large text)
 */
export function checkContrastCompliance(
  foreground: string,
  background: string,
  isLargeText: boolean = false
): boolean {
  const ratio = getContrastRatio(foreground, background);
  const requiredRatio = isLargeText ? 3 : 4.5;
  return ratio >= requiredRatio;
}

/**
 * Semantic HTML utility to generate proper list items
 */
export function createAccessibleList(
  items: string[],
  ordered: boolean = false
): {
  tag: "ul" | "ol";
  children: Array<{ tag: "li"; children: string }>;
} {
  return {
    tag: ordered ? "ol" : "ul",
    children: items.map((item) => ({
      tag: "li",
      children: item,
    })),
  };
}
