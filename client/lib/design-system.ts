/**
 * Design System Utilities
 * 
 * Single source of truth for design system helpers used across Postd.
 * This file exports utilities for working with the design tokens and styling.
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind classes with conditional logic.
 * Combines clsx and tailwind-merge for optimal class handling.
 * 
 * @example
 * cn("base-class", { "conditional": isActive }, className)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Design token helpers
 * These can be expanded to include theme utilities, color helpers, etc.
 */

/**
 * Get a CSS variable value for a design token
 * @param token - The design token name (e.g., "color-primary", "spacing-md")
 * @returns The CSS variable reference string
 */
export function token(token: string): string {
  return `var(--${token})`;
}

/**
 * Get a color token value
 * @param color - The color token name (e.g., "primary", "success")
 * @returns The CSS variable reference string
 */
export function color(color: string): string {
  return token(`color-${color}`);
}

/**
 * Get a spacing token value
 * @param size - The spacing size (e.g., "xs", "md", "lg")
 * @returns The CSS variable reference string
 */
export function spacing(size: string): string {
  return token(`spacing-${size}`);
}

/**
 * Get a radius token value
 * @param size - The radius size (e.g., "sm", "md", "lg")
 * @returns The CSS variable reference string
 */
export function radius(size: string): string {
  return token(`radius-${size}`);
}

