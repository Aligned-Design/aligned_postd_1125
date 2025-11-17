/**
 * Brand Visual Identity Service
 * 
 * Extracts visual identity (colors, fonts, spacing) from brand kit for Creative Agent
 */

import { supabase } from "./supabase";

export interface BrandVisualIdentity {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    additional?: string[];
  };
  fonts: {
    heading: string;
    body: string;
    source?: "google" | "custom" | "system";
    customUrl?: string;
  };
  spacing: {
    baseUnit: number; // Usually 4px or 8px
    scale: Record<string, string>; // xs, sm, md, lg, xl, etc.
  };
  imagery: {
    style: "photo" | "illustration" | "mixed" | "minimal";
    subjects?: string[];
  };
}

/**
 * Get brand visual identity from brand kit
 */
export async function getBrandVisualIdentity(brandId: string): Promise<BrandVisualIdentity | null> {
  try {
    const { data: brand, error } = await supabase
      .from("brands")
      .select("brand_kit, visual_summary, primary_color, secondary_color, accent_color")
      .eq("id", brandId)
      .single();

    if (error || !brand) {
      console.warn(`[BrandVisualIdentity] Brand ${brandId} not found or error:`, error);
      return null;
    }

    const brandKit = (brand.brand_kit as any) || {};
    const visualSummary = (brand.visual_summary as any) || {};

    // Extract colors - priority: visual_summary > brand_kit > direct columns
    const primaryColor = 
      (visualSummary.colors && Array.isArray(visualSummary.colors) && visualSummary.colors[0]) ||
      brandKit.primaryColor ||
      brand.primary_color ||
      "#A76CF5";

    const secondaryColor = 
      (visualSummary.colors && Array.isArray(visualSummary.colors) && visualSummary.colors[1]) ||
      brandKit.secondaryColor ||
      brand.secondary_color ||
      "#F5C96C";

    const accentColor = 
      (visualSummary.colors && Array.isArray(visualSummary.colors) && visualSummary.colors[2]) ||
      brandKit.accentColor ||
      brand.accent_color ||
      "#06B6D4";

    // Extract fonts - priority: visual_summary > brand_kit
    const fonts = visualSummary.fonts || brandKit.fonts || {};
    const headingFont = 
      (Array.isArray(fonts) && fonts[0]) ||
      fonts.heading ||
      brandKit.fontFamily ||
      "Poppins";

    const bodyFont = 
      (Array.isArray(fonts) && fonts[1]) ||
      fonts.body ||
      brandKit.bodyFont ||
      "Inter";

    const fontSource = brandKit.fontSource || "google";
    const customFontUrl = brandKit.customFontUrl || "";

    // Extract imagery style
    const imageryStyle = 
      visualSummary.imageryStyle ||
      brandKit.imageryStyle ||
      "photo";

    const imagerySubjects = 
      visualSummary.imagerySubjects ||
      brandKit.imagerySubjects ||
      [];

    // Default spacing (4px base unit)
    const spacing = {
      baseUnit: 4,
      scale: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        "2xl": "48px",
        "3xl": "64px",
      },
    };

    return {
      colors: {
        primary: primaryColor,
        secondary: secondaryColor,
        accent: accentColor,
        additional: visualSummary.colors?.slice(3) || [],
      },
      fonts: {
        heading: headingFont,
        body: bodyFont,
        source: fontSource,
        customUrl: customFontUrl,
      },
      spacing,
      imagery: {
        style: imageryStyle as "photo" | "illustration" | "mixed" | "minimal",
        subjects: imagerySubjects,
      },
    };
  } catch (error) {
    console.error(`[BrandVisualIdentity] Error fetching visual identity:`, error);
    return null;
  }
}

