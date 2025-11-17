/**
 * Theme Configuration
 * 
 * Defines theme structure for white-label branding per brand/agency.
 */

export interface ThemeConfig {
  name: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  radiusScale?: "default" | "rounded" | "pill";
}

export interface BrandTheme extends ThemeConfig {
  brandId: string;
}

export interface AgencyTheme extends ThemeConfig {
  agencyId: string;
}

/**
 * Get theme config from brand data
 */
export function getBrandTheme(brand: {
  id: string;
  name: string;
  logo_url?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  accent_color?: string | null;
}): BrandTheme {
  return {
    brandId: brand.id,
    name: brand.name,
    logoUrl: brand.logo_url || undefined,
    primaryColor: brand.primary_color || "#8B5CF6",
    secondaryColor: brand.secondary_color || "#6366F1",
    accentColor: brand.accent_color || "#A855F7",
    backgroundColor: "#FFFFFF",
    textColor: "#1F2937",
    radiusScale: "default",
  };
}

/**
 * Apply theme to CSS variables
 */
export function applyTheme(theme: ThemeConfig) {
  const root = document.documentElement;
  
  // Color tokens
  root.style.setProperty("--color-primary", theme.primaryColor);
  root.style.setProperty("--color-secondary", theme.secondaryColor);
  root.style.setProperty("--color-accent", theme.accentColor);
  root.style.setProperty("--color-background", theme.backgroundColor);
  root.style.setProperty("--color-foreground", theme.textColor);
  
  // Brand-specific primary (for backward compatibility)
  root.style.setProperty("--brand-primary", theme.primaryColor);
  
  // Radius scale
  if (theme.radiusScale === "rounded") {
    root.style.setProperty("--radius-sm", "0.5rem");
    root.style.setProperty("--radius-md", "0.75rem");
    root.style.setProperty("--radius-lg", "1rem");
    root.style.setProperty("--radius-xl", "1.5rem");
  } else if (theme.radiusScale === "pill") {
    root.style.setProperty("--radius-sm", "9999px");
    root.style.setProperty("--radius-md", "9999px");
    root.style.setProperty("--radius-lg", "9999px");
    root.style.setProperty("--radius-xl", "9999px");
  } else {
    // Default
    root.style.setProperty("--radius-sm", "0.25rem");
    root.style.setProperty("--radius-md", "0.5rem");
    root.style.setProperty("--radius-lg", "0.75rem");
    root.style.setProperty("--radius-xl", "1rem");
  }
}

/**
 * Reset theme to defaults
 */
export function resetTheme() {
  const root = document.documentElement;
  root.style.removeProperty("--color-primary");
  root.style.removeProperty("--color-secondary");
  root.style.removeProperty("--color-accent");
  root.style.removeProperty("--color-background");
  root.style.removeProperty("--color-foreground");
  root.style.removeProperty("--brand-primary");
  root.style.removeProperty("--radius-sm");
  root.style.removeProperty("--radius-md");
  root.style.removeProperty("--radius-lg");
  root.style.removeProperty("--radius-xl");
}

