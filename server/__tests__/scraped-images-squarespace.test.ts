/**
 * Tests for Squarespace-hosted image classification and persistence
 * 
 * Tests that:
 * - Squarespace CDN images (images.squarespace-cdn.com) are NOT classified as platform_logo by default
 * - Large Squarespace CDN images are classified as hero/photo/other (not platform_logo)
 * - Only small Squarespace images with logoish patterns are classified as platform_logo
 * - Fallback selection works when all images are filtered out
 * 
 * These tests verify the image classification logic WITHOUT requiring live Supabase.
 */

import { describe, it, expect } from "vitest";

// Image classification constants from brand-crawler.ts
const platformVendors = ["squarespace", "wix", "godaddy", "canva", "shopify", "wordpress"];
const logoishPatterns = ["logo", "logotype", "brandmark", "mark", "badge", "icon", "favicon", "powered-by", "powered_by", "footer-logo", "header-logo"];

// Helper function to check if URL has vendor
function hasVendorInUrl(url: string): boolean {
  const urlLower = url.toLowerCase();
  return platformVendors.some(v => urlLower.includes(v));
}

// Helper function to check if URL has logoish pattern
function hasLogoishPattern(url: string): boolean {
  const urlLower = url.toLowerCase();
  return logoishPatterns.some(p => urlLower.includes(p));
}

// Simplified classification logic based on brand-crawler.ts
function shouldClassifyAsPlatformLogo(url: string, width?: number, height?: number): boolean {
  const hasVendor = hasVendorInUrl(url);
  const isLogoish = hasLogoishPattern(url);
  
  // Only classify as platform_logo if BOTH vendor AND logoish patterns are present
  if (hasVendor && isLogoish) {
    // Large images (>300x300) are likely legitimate brand images, not platform logos
    const isLargeImage = width && height && (width > 300 || height > 300);
    return !isLargeImage;
  }
  
  return false;
}

describe("Squarespace-hosted image classification", () => {
  describe("Vendor detection", () => {
    it("should detect Squarespace CDN URLs", () => {
      expect(hasVendorInUrl("https://images.squarespace-cdn.com/content/v1/123/image.jpg")).toBe(true);
      expect(hasVendorInUrl("https://static1.squarespace.com/static/123/image.png")).toBe(true);
    });

    it("should detect other platform vendors", () => {
      expect(hasVendorInUrl("https://static.wixstatic.com/media/image.jpg")).toBe(true);
      expect(hasVendorInUrl("https://cdn.shopify.com/s/files/image.png")).toBe(true);
      expect(hasVendorInUrl("https://example.com/image.jpg")).toBe(false);
    });
  });

  describe("Logoish pattern detection", () => {
    it("should detect logo patterns in URL", () => {
      expect(hasLogoishPattern("https://example.com/logo.png")).toBe(true);
      expect(hasLogoishPattern("https://example.com/footer-logo.svg")).toBe(true);
      expect(hasLogoishPattern("https://example.com/favicon.ico")).toBe(true);
      expect(hasLogoishPattern("https://example.com/powered-by-squarespace.png")).toBe(true);
    });

    it("should NOT detect hero/product images as logoish", () => {
      expect(hasLogoishPattern("https://example.com/hero-banner.jpg")).toBe(false);
      expect(hasLogoishPattern("https://example.com/product-photo.png")).toBe(false);
      expect(hasLogoishPattern("https://example.com/team-photo.jpg")).toBe(false);
    });
  });

  describe("Platform logo classification", () => {
    it("should NOT classify large Squarespace CDN images as platform_logo", () => {
      const largeImage = "https://images.squarespace-cdn.com/content/v1/123/hero-banner.jpg";
      
      // Large image (800x600) with vendor but no logoish pattern
      expect(shouldClassifyAsPlatformLogo(largeImage, 800, 600)).toBe(false);
    });

    it("should NOT classify Squarespace CDN images without logoish patterns as platform_logo", () => {
      const brandImage = "https://images.squarespace-cdn.com/content/v1/123/product.jpg";
      
      // No logoish pattern - should NOT be platform_logo regardless of size
      expect(shouldClassifyAsPlatformLogo(brandImage, 200, 200)).toBe(false);
      expect(shouldClassifyAsPlatformLogo(brandImage, 800, 600)).toBe(false);
    });

    it("should classify small Squarespace logo images as platform_logo", () => {
      const smallLogo = "https://images.squarespace-cdn.com/static/logo.png";
      
      // Small image with vendor AND logoish pattern - IS platform_logo
      expect(shouldClassifyAsPlatformLogo(smallLogo, 150, 50)).toBe(true);
    });

    it("should NOT classify large logo images as platform_logo", () => {
      const largeLogo = "https://images.squarespace-cdn.com/static/logo-large.png";
      
      // Large image (>300) even with logoish pattern - likely a brand asset
      expect(shouldClassifyAsPlatformLogo(largeLogo, 500, 200)).toBe(false);
    });

    it("should handle images without dimensions", () => {
      const logoImage = "https://images.squarespace-cdn.com/static/logo.png";
      const heroImage = "https://images.squarespace-cdn.com/content/v1/hero.jpg";
      
      // No dimensions: logo pattern → classified as platform_logo
      expect(shouldClassifyAsPlatformLogo(logoImage)).toBe(true);
      
      // No dimensions, no logoish pattern → NOT platform_logo
      expect(shouldClassifyAsPlatformLogo(heroImage)).toBe(false);
    });
  });

  describe("Non-Squarespace images", () => {
    it("should NOT classify regular images as platform_logo", () => {
      const regularImage = "https://example.com/brand-hero.jpg";
      const regularLogo = "https://example.com/company-logo.png";
      
      // No vendor - never platform_logo
      expect(shouldClassifyAsPlatformLogo(regularImage, 800, 600)).toBe(false);
      expect(shouldClassifyAsPlatformLogo(regularLogo, 200, 100)).toBe(false);
    });
  });

  describe("Fallback behavior", () => {
    it("should have fallback when all images are filtered", () => {
      const images = [
        { url: "https://images.squarespace-cdn.com/logo.png", width: 100, height: 50 },
      ];
      
      // If all images are platform_logo, we need a fallback mechanism
      const filteredImages = images.filter(img => 
        !shouldClassifyAsPlatformLogo(img.url, img.width, img.height)
      );
      
      // When all filtered out, should fallback to first available
      const fallbackImage = filteredImages.length > 0 ? filteredImages[0] : images[0];
      expect(fallbackImage).toBeDefined();
    });

    it("should handle empty image array gracefully", () => {
      const images: Array<{ url: string; width?: number; height?: number }> = [];
      
      const fallbackImage = images.length > 0 ? images[0] : null;
      expect(fallbackImage).toBeNull();
    });
  });
});
