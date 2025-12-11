/**
 * Image Classifier Tests
 * 
 * Tests for the unified image classification module that determines
 * whether images are logos, brand images, or icons.
 * 
 * @see server/lib/image-classifier.ts
 * @see shared/image-classification.ts
 */

import { describe, it, expect } from "vitest";
import {
  classifyImage,
  classifyImages,
  separateLogosAndBrandImages,
  ImageClassificationInput,
} from "../lib/image-classifier";

describe("Image Classifier", () => {
  describe("classifyImage", () => {
    describe("Logo Detection", () => {
      it("should classify image with 'logo' in filename as logo", () => {
        const input: ImageClassificationInput = {
          url: "https://example.com/images/company-logo.png",
          width: 200,
          height: 100,
        };

        const result = classifyImage(input);
        
        expect(result.role).toBe("logo");
        expect(result.category).toBe("logos");
        expect(result.shouldDisplay).toBe(true);
      });

      it("should classify image with 'logo' in alt text as logo", () => {
        const input: ImageClassificationInput = {
          url: "https://example.com/images/header-image.png",
          alt: "Company Logo",
          width: 150,
          height: 50,
        };

        const result = classifyImage(input);
        
        expect(result.role).toBe("logo");
        expect(result.category).toBe("logos");
      });

      it("should classify small image in header/nav as logo", () => {
        const input: ImageClassificationInput = {
          url: "https://example.com/brand.svg",
          width: 120,
          height: 40,
          inHeaderOrNav: true,
          sourceType: "svg",
        };

        const result = classifyImage(input);
        
        expect(result.role).toBe("logo");
        expect(result.confidence).toBeGreaterThan(0.5);
      });

      it("should NOT classify oversized 'logo' as logo (brand image instead)", () => {
        const input: ImageClassificationInput = {
          url: "https://example.com/logo-banner.jpg",
          width: 1200,
          height: 600,
        };

        const result = classifyImage(input);
        
        // Oversized logos should be reclassified as hero or brand_image
        expect(result.role).not.toBe("logo");
        expect(["hero", "brand_image"]).toContain(result.role);
      });
    });

    describe("Icon Detection", () => {
      it("should classify small images in icon path as icons", () => {
        const input: ImageClassificationInput = {
          url: "https://example.com/assets/icons/envelope.svg",
          width: 24,
          height: 24,
        };

        const result = classifyImage(input);
        
        expect(result.role).toBe("icon");
        expect(result.category).toBe("icons");
        expect(result.shouldDisplay).toBe(false);
      });

      it("should classify images with generic icon patterns as icons", () => {
        const input: ImageClassificationInput = {
          url: "https://example.com/images/phone-icon.png",
          alt: "Contact phone",
          width: 48,
          height: 48,
        };

        const result = classifyImage(input);
        
        expect(result.role).toBe("icon");
        expect(result.shouldDisplay).toBe(false);
      });

      it("should classify small square images as icons", () => {
        const input: ImageClassificationInput = {
          url: "https://example.com/images/service-1.png",
          width: 64,
          height: 64,
        };

        const result = classifyImage(input);
        
        expect(result.role).toBe("icon");
      });
    });

    describe("Social Icon Detection", () => {
      it("should classify Facebook icon as social_icon", () => {
        const input: ImageClassificationInput = {
          url: "https://example.com/images/facebook.svg",
          width: 32,
          height: 32,
        };

        const result = classifyImage(input);
        
        expect(result.role).toBe("social_icon");
        expect(result.shouldDisplay).toBe(false);
      });

      it("should classify Instagram icon as social_icon", () => {
        const input: ImageClassificationInput = {
          url: "https://example.com/social/instagram-icon.png",
          alt: "Follow us on Instagram",
          width: 40,
          height: 40,
        };

        const result = classifyImage(input);
        
        expect(result.role).toBe("social_icon");
      });
    });

    describe("Platform Logo Detection", () => {
      it("should classify 'Powered by Squarespace' badge as platform_logo", () => {
        const input: ImageClassificationInput = {
          url: "https://example.com/squarespace-logo.png",
          alt: "Powered by Squarespace",
          width: 100,
          height: 30,
        };

        const result = classifyImage(input);
        
        expect(result.role).toBe("platform_logo");
        expect(result.shouldDisplay).toBe(false);
      });

      it("should NOT classify large Squarespace CDN images as platform_logo", () => {
        const input: ImageClassificationInput = {
          url: "https://images.squarespace-cdn.com/content/v1/brand-hero.jpg",
          width: 1920,
          height: 1080,
        };

        const result = classifyImage(input);
        
        // Large images from platform CDNs are brand images, not platform logos
        expect(result.role).not.toBe("platform_logo");
        expect(result.shouldDisplay).toBe(true);
      });
    });

    describe("Partner Logo Detection", () => {
      it("should classify images in partner section as partner_logo", () => {
        const input: ImageClassificationInput = {
          url: "https://example.com/images/association-badge.png",
          width: 80,
          height: 80,
          inAffiliateOrPartnerSection: true,
        };

        const result = classifyImage(input);
        
        expect(result.role).toBe("partner_logo");
        expect(result.shouldDisplay).toBe(false);
      });

      it("should classify small images with partner patterns as partner_logo", () => {
        const input: ImageClassificationInput = {
          url: "https://example.com/certified-partner-badge.png",
          alt: "Certified Partner",
          width: 100,
          height: 50,
        };

        const result = classifyImage(input);
        
        expect(result.role).toBe("partner_logo");
      });
    });

    describe("Hero Image Detection", () => {
      it("should classify large images as hero", () => {
        const input: ImageClassificationInput = {
          url: "https://example.com/hero-banner.jpg",
          width: 1920,
          height: 800,
        };

        const result = classifyImage(input);
        
        expect(result.role).toBe("hero");
        expect(result.category).toBe("images");
        expect(result.shouldDisplay).toBe(true);
      });

      it("should classify images above fold as hero", () => {
        const input: ImageClassificationInput = {
          url: "https://example.com/main-image.jpg",
          width: 800,
          height: 600,
          inHeroOrAboveFold: true,
        };

        const result = classifyImage(input);
        
        expect(result.role).toBe("hero");
      });
    });

    describe("Team Photo Detection", () => {
      it("should classify team page images with team context as team", () => {
        const input: ImageClassificationInput = {
          url: "https://example.com/team/john-smith.jpg",
          alt: "John Smith - CEO",
          width: 400,
          height: 500,
          pageType: "team",
        };

        const result = classifyImage(input);
        
        expect(result.role).toBe("team");
        expect(result.shouldDisplay).toBe(true);
      });
    });

    describe("Brand Image Detection", () => {
      it("should classify medium-sized images as brand_image", () => {
        const input: ImageClassificationInput = {
          url: "https://example.com/about/office.jpg",
          width: 600,
          height: 400,
        };

        const result = classifyImage(input);
        
        expect(result.role).toBe("brand_image");
        expect(result.category).toBe("images");
        expect(result.shouldDisplay).toBe(true);
      });
    });

    describe("Priority Scoring", () => {
      it("should give logos highest display priority", () => {
        const logo: ImageClassificationInput = {
          url: "https://example.com/logo.png",
          width: 200,
          height: 100,
        };

        const hero: ImageClassificationInput = {
          url: "https://example.com/hero.jpg",
          width: 1920,
          height: 800,
        };

        const logoResult = classifyImage(logo);
        const heroResult = classifyImage(hero);
        
        expect(logoResult.displayPriority).toBeGreaterThan(heroResult.displayPriority);
      });

      it("should increase priority for images in header/nav", () => {
        const headerImage: ImageClassificationInput = {
          url: "https://example.com/brand.png",
          width: 150,
          height: 50,
          inHeaderOrNav: true,
        };

        const normalImage: ImageClassificationInput = {
          url: "https://example.com/brand.png",
          width: 150,
          height: 50,
        };

        const headerResult = classifyImage(headerImage);
        const normalResult = classifyImage(normalImage);
        
        expect(headerResult.displayPriority).toBeGreaterThan(normalResult.displayPriority);
      });
    });
  });

  describe("classifyImages", () => {
    it("should classify multiple images and sort by priority", () => {
      const inputs: ImageClassificationInput[] = [
        { url: "https://example.com/hero.jpg", width: 1920, height: 800 },
        { url: "https://example.com/logo.png", width: 200, height: 100 },
        { url: "https://example.com/icon.svg", width: 32, height: 32 },
      ];

      const results = classifyImages(inputs);
      
      // Should be sorted by priority (logo first, then hero, then icon)
      expect(results[0].role).toBe("logo");
      expect(results[1].role).toBe("hero");
      expect(results[2].role).toBe("icon");
    });
  });

  describe("separateLogosAndBrandImages", () => {
    it("should separate logos from brand images", () => {
      const inputs: ImageClassificationInput[] = [
        { url: "https://example.com/logo.png", width: 200, height: 100 },
        { url: "https://example.com/logo-alt.png", width: 150, height: 75 },
        { url: "https://example.com/hero.jpg", width: 1920, height: 800 },
        { url: "https://example.com/team.jpg", width: 400, height: 500, pageType: "team", alt: "Team member" },
      ];

      const classified = classifyImages(inputs);
      const { logos, brandImages, icons, excluded } = separateLogosAndBrandImages(classified);
      
      expect(logos.length).toBe(2);
      expect(brandImages.length).toBe(2);
      expect(icons.length).toBe(0);
      expect(excluded.length).toBe(0);
    });

    it("should respect maxLogos limit", () => {
      const inputs: ImageClassificationInput[] = [
        { url: "https://example.com/logo1.png", width: 200, height: 100 },
        { url: "https://example.com/logo2.png", width: 200, height: 100 },
        { url: "https://example.com/logo3.png", width: 200, height: 100 },
      ];

      const classified = classifyImages(inputs);
      const { logos, brandImages } = separateLogosAndBrandImages(classified, { maxLogos: 2 });
      
      expect(logos.length).toBe(2);
      // Extra logos go to brand images
      expect(brandImages.length).toBe(1);
    });

    it("should exclude icons and social icons from brandImages", () => {
      const inputs: ImageClassificationInput[] = [
        { url: "https://example.com/facebook.svg", width: 32, height: 32 },
        { url: "https://example.com/icons/phone.svg", width: 24, height: 24 },
        { url: "https://example.com/hero.jpg", width: 1920, height: 800 },
      ];

      const classified = classifyImages(inputs);
      const { logos, brandImages, icons, excluded } = separateLogosAndBrandImages(classified);
      
      expect(brandImages.length).toBe(1); // Only hero
      expect(icons.length).toBe(1); // Only ui_icon (phone)
      expect(excluded.length).toBe(2); // social_icon and ui_icon
    });
  });
});

describe("Classification Edge Cases", () => {
  it("should handle missing dimensions gracefully", () => {
    const input: ImageClassificationInput = {
      url: "https://example.com/image.jpg",
      // No width/height
    };

    const result = classifyImage(input);
    
    // Should default to "other" for unknown size
    expect(result).toBeDefined();
    expect(result.role).toBeDefined();
  });

  it("should handle empty alt text", () => {
    const input: ImageClassificationInput = {
      url: "https://example.com/logo.png",
      alt: "",
      width: 200,
      height: 100,
    };

    const result = classifyImage(input);
    
    // Should still detect logo from filename
    expect(result.role).toBe("logo");
  });

  it("should handle data URIs", () => {
    const input: ImageClassificationInput = {
      url: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjwvc3ZnPg==",
      width: 100,
      height: 100,
    };

    const result = classifyImage(input);
    
    expect(result).toBeDefined();
    // Data URIs with small size are likely icons
  });

  it("should prioritize logo signals over icon patterns for brand logos", () => {
    // Edge case: A logo that happens to have an icon-like pattern (e.g., "home-logo.svg")
    const input: ImageClassificationInput = {
      url: "https://example.com/home-logo.svg",
      alt: "Company Logo",
      width: 180,
      height: 60,
      inHeaderOrNav: true,
    };

    const result = classifyImage(input);
    
    // Logo signals (filename "logo", alt "Logo", inHeaderOrNav) should win
    expect(result.role).toBe("logo");
  });

  it("should correctly classify brand images from platform CDNs", () => {
    // Real-world case: Large brand image hosted on Squarespace CDN
    const input: ImageClassificationInput = {
      url: "https://images.squarespace-cdn.com/content/v1/5e1234567890/brand-lifestyle-photo.jpg",
      width: 1200,
      height: 800,
    };

    const result = classifyImage(input);
    
    // Should NOT be filtered as platform_logo (large images are brand images)
    expect(result.role).not.toBe("platform_logo");
    expect(result.shouldDisplay).toBe(true);
  });
});

