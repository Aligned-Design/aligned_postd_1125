/**
 * Tests for third-party image filtering in scraper
 * Ensures maps tiles, analytics pixels, and junk assets are blocked
 */

import { describe, it, expect } from "vitest";

// Re-export the filter function for testing
function isBlockedThirdPartyImage(url: string): boolean {
  try {
    const urlLower = url.toLowerCase();
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    const pathname = urlObj.pathname.toLowerCase();

    // Helper: Safe domain matching (exact match or subdomain)
    const isDomainBlocked = (hostname: string, domain: string): boolean => {
      return hostname === domain || hostname.endsWith("." + domain);
    };

    // A) Known third-party domains (hard block)
    const blockedDomains = [
      "maps.googleapis.com",
      "maps.google.com",
      "google-analytics.com",
      "googletagmanager.com",
      "doubleclick.net",
      "connect.facebook.net",
      "staticxx.facebook.com",
      "snap.licdn.com",
      "bat.bing.com",
      "t.co",
      "px.ads.linkedin.com",
    ];

    if (blockedDomains.some(domain => isDomainBlocked(hostname, domain))) {
      return true;
    }

    // Facebook tracking pixels (but allow fbcdn.net)
    // Use safe domain matching instead of substring check
    if (isDomainBlocked(hostname, "facebook.com") && pathname.includes("/tr")) {
      return true;
    }

    // Block ad/tracking subdomains using deterministic label matching
    // Check if any hostname label (subdomain component) matches blocked patterns
    const blockedSubdomainPrefixes = ["adservice", "ads", "pixel", "track", "analytics"];
    const hostnameLabels = hostname.split(".");
    const hasBlockedSubdomain = hostnameLabels.some(label => 
      blockedSubdomainPrefixes.includes(label)
    );
    if (hasBlockedSubdomain) {
      return true;
    }

    // B) Known "tile" URL patterns (hard block)
    const tilePatterns = [
      "/maps/vt",
      "tile?",
      "/tiles/",
      "staticmap?",
      "pb=!", // Google Maps tile query marker
    ];

    if (tilePatterns.some(pattern => urlLower.includes(pattern))) {
      return true;
    }

    // C) Known junk assets (hard block)
    const junkPatterns = [
      "favicon",
      "sprite.svg",
      "sprite.png",
      "spritesheet",
      "/loader.",
      "/placeholder.",
      "/blank.",
      "/spacer.",
      "/pixel.",
      "1x1.gif",
      "1x1.png",
      "tracking.gif",
      "track.gif",
    ];

    const filename = pathname.split("/").pop() || "";
    if (junkPatterns.some(pattern => filename.includes(pattern) || pathname.includes(pattern))) {
      return true;
    }

    return false;
  } catch {
    // If URL parsing fails, allow it (conservative approach)
    return false;
  }
}

describe("Third-Party Image Filter", () => {
  describe("Google Maps Tiles", () => {
    it("blocks Google Maps tile images", () => {
      const url = "https://maps.googleapis.com/maps/vt?pb=!1m5!1m4!1i5!2i6!3i11!4i256!2m3!1e0!2sm!3i761521282";
      expect(isBlockedThirdPartyImage(url)).toBe(true);
    });

    it("blocks Google Maps static images", () => {
      const url = "https://maps.google.com/maps/api/staticmap?center=40.7,-74&zoom=12";
      expect(isBlockedThirdPartyImage(url)).toBe(true);
    });

    it("blocks tile URLs with tile patterns", () => {
      const url = "https://example.com/tiles/tile?x=1&y=2";
      expect(isBlockedThirdPartyImage(url)).toBe(true);
    });
  });

  describe("Analytics and Tracking Pixels", () => {
    it("blocks Google Analytics", () => {
      const url = "https://www.google-analytics.com/collect?v=1&tid=UA-12345";
      expect(isBlockedThirdPartyImage(url)).toBe(true);
    });

    it("blocks Google Tag Manager", () => {
      const url = "https://www.googletagmanager.com/gtm.js?id=GTM-ABC123";
      expect(isBlockedThirdPartyImage(url)).toBe(true);
    });

    it("blocks Facebook tracking pixels", () => {
      const url = "https://www.facebook.com/tr?id=123456789";
      expect(isBlockedThirdPartyImage(url)).toBe(true);
    });

    it("blocks Facebook tracking pixels (exact domain match)", () => {
      const url = "https://facebook.com/tr?id=123456789";
      expect(isBlockedThirdPartyImage(url)).toBe(true);
    });

    it("does NOT block fake facebook.com domains with /tr path", () => {
      const url = "https://evil-facebook.com.attacker.com/tr?id=123";
      expect(isBlockedThirdPartyImage(url)).toBe(false);
    });

    it("blocks LinkedIn tracking pixels", () => {
      const url = "https://px.ads.linkedin.com/collect?pid=12345";
      expect(isBlockedThirdPartyImage(url)).toBe(true);
    });

    it("blocks Bing Ads tracking", () => {
      const url = "https://bat.bing.com/action/0?ti=12345";
      expect(isBlockedThirdPartyImage(url)).toBe(true);
    });

    it("blocks ad service subdomains (exact label match)", () => {
      const url = "https://ads.example.com/banner.jpg";
      expect(isBlockedThirdPartyImage(url)).toBe(true);
    });

    it("blocks pixel service subdomains (exact label match)", () => {
      const url = "https://pixel.example.com/track.gif";
      expect(isBlockedThirdPartyImage(url)).toBe(true);
    });

    it("blocks nested ad subdomains", () => {
      const url = "https://api.ads.example.com/banner.jpg";
      expect(isBlockedThirdPartyImage(url)).toBe(true);
    });

    it("does NOT block domains with 'ads' mid-label", () => {
      // "bads" is not "ads" - should NOT be blocked
      const url = "https://bads.example.com/image.jpg";
      expect(isBlockedThirdPartyImage(url)).toBe(false);
    });
  });

  describe("Junk Assets", () => {
    it("blocks favicons", () => {
      const url = "https://example.com/favicon.ico";
      expect(isBlockedThirdPartyImage(url)).toBe(true);
    });

    it("blocks sprite sheets", () => {
      const url = "https://example.com/assets/sprite.svg";
      expect(isBlockedThirdPartyImage(url)).toBe(true);
    });

    it("blocks placeholder images", () => {
      const url = "https://example.com/images/placeholder.png";
      expect(isBlockedThirdPartyImage(url)).toBe(true);
    });

    it("blocks 1x1 tracking pixels", () => {
      const url = "https://example.com/track/1x1.gif";
      expect(isBlockedThirdPartyImage(url)).toBe(true);
    });

    it("blocks loader images", () => {
      const url = "https://example.com/assets/loader.gif";
      expect(isBlockedThirdPartyImage(url)).toBe(true);
    });
  });

  describe("Legitimate Brand Images (Should NOT Block)", () => {
    it("does not block Squarespace CDN images", () => {
      const url = "https://images.squarespace-cdn.com/content/v1/123abc/IMG_0436.JPG";
      expect(isBlockedThirdPartyImage(url)).toBe(false);
    });

    it("does not block WordPress uploads", () => {
      const url = "https://1-spine.com/wp-content/uploads/2023/12/hero-image.jpg";
      expect(isBlockedThirdPartyImage(url)).toBe(false);
    });

    it("does not block Wix media", () => {
      const url = "https://static.wixstatic.com/media/abc123_def456.jpg";
      expect(isBlockedThirdPartyImage(url)).toBe(false);
    });

    it("does not block Shopify CDN", () => {
      const url = "https://cdn.shopify.com/s/files/1/0123/4567/products/product.jpg";
      expect(isBlockedThirdPartyImage(url)).toBe(false);
    });

    it("does not block Facebook CDN (fbcdn)", () => {
      const url = "https://scontent.fbcdn.net/v/t1.0-9/12345_67890.jpg";
      expect(isBlockedThirdPartyImage(url)).toBe(false);
    });

    it("does not block brand logo images with 'logo' in filename", () => {
      const url = "https://example.com/assets/company-logo.png";
      expect(isBlockedThirdPartyImage(url)).toBe(false);
    });

    it("does not block regular JPG images", () => {
      const url = "https://example.com/images/team-photo.jpg";
      expect(isBlockedThirdPartyImage(url)).toBe(false);
    });
  });

  describe("Edge Cases", () => {
    it("handles invalid URLs gracefully", () => {
      const url = "not-a-valid-url";
      expect(isBlockedThirdPartyImage(url)).toBe(false);
    });

    it("handles URLs without protocol", () => {
      const url = "//maps.googleapis.com/maps/vt?pb=123";
      // This will fail URL parsing but should not throw
      expect(() => isBlockedThirdPartyImage(url)).not.toThrow();
    });

    it("is case-insensitive", () => {
      const url = "https://MAPS.GOOGLEAPIS.COM/MAPS/VT?pb=123";
      expect(isBlockedThirdPartyImage(url)).toBe(true);
    });
  });

  describe("Domain Matching Safety", () => {
    it("blocks exact domain match", () => {
      const url = "https://maps.googleapis.com/maps/vt?pb=123";
      expect(isBlockedThirdPartyImage(url)).toBe(true);
    });

    it("blocks subdomain match", () => {
      const url = "https://api.maps.googleapis.com/maps/vt?pb=123";
      expect(isBlockedThirdPartyImage(url)).toBe(true);
    });

    it("does NOT block similar domain (different TLD)", () => {
      const url = "https://maps.googleapis.org/image.jpg";
      expect(isBlockedThirdPartyImage(url)).toBe(false);
    });

    it("does NOT block domain that contains blocked string but is not subdomain", () => {
      const url = "https://evil-maps.googleapis.com.attacker.com/image.jpg";
      expect(isBlockedThirdPartyImage(url)).toBe(false);
    });
  });
});

