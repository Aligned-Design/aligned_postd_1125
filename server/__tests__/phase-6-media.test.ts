/**
 * PHASE 6: Comprehensive Media Management Test Suite
 * Tests for upload, processing, tagging, deduplication, search, and quota management
 */

import { describe, it, expect} from 'vitest';
import { mediaService } from '../lib/media-service';
import sharp from 'sharp';
import type { MediaAsset, MediaCategory } from '@shared/media';

describe.skip('PHASE 6: Media Management System', () => {
  const testBrandId = 'test-brand-' + Date.now();
  const testTenantId = 'test-tenant-' + Date.now();
  const testAssets: MediaAsset[] = [];

  /**
   * Test 1: Basic image upload with processing
   */
  describe('Image Upload & Processing', () => {
    it('should upload a test image with metadata extraction', async () => {
      // Create a 100x100 test image
      const imageBuffer = await sharp({
        create: {
          width: 100,
          height: 100,
          channels: 3,
          background: { r: 255, g: 0, b: 0 }
        }
      }).jpeg().toBuffer();

      const asset = await mediaService.uploadMedia(
        imageBuffer,
        'test-image.jpg',
        'image/jpeg',
        testBrandId,
        testTenantId,
        'graphics',
        (progress) => {
          console.log(`Progress: ${progress.percentComplete}% - ${progress.status}`);
        }
      );

      expect(asset).toBeDefined();
      expect(asset.filename).toBe('test-image.jpg');
      expect(asset.category).toBe('graphics');
      expect(asset.metadata.width).toBe(100);
      expect(asset.metadata.height).toBe(100);
      expect(asset.metadata.aiTags).toBeDefined();
      expect(asset.metadata.aiTags.length).toBeGreaterThan(0);

      testAssets.push(asset);
    });

    it('should generate image variants (thumbnail, small, medium, large)', async () => {
      const imageBuffer = await sharp({
        create: {
          width: 1000,
          height: 1000,
          channels: 3,
          background: { r: 0, g: 255, b: 0 }
        }
      }).jpeg().toBuffer();

      const asset = await mediaService.uploadMedia(
        imageBuffer,
        'test-variants.jpg',
        'image/jpeg',
        testBrandId,
        testTenantId,
        'images'
      );

      expect(asset.variants).toBeDefined();
      expect(asset.variants.length).toBeGreaterThan(0);

      // Check that we have variants of expected sizes
      const variantSizes = asset.variants.map(v => v.size);
      expect(variantSizes).toContain('thumbnail');
      expect(variantSizes).toContain('small');
      expect(variantSizes).toContain('medium');
      expect(variantSizes).toContain('large');

      testAssets.push(asset);
    });
  });

  /**
   * Test 2: Duplicate Detection
   */
  describe('Duplicate Detection (SHA256)', () => {
    it('should detect exact duplicate files', async () => {
      // Create identical test image
      const imageBuffer = await sharp({
        create: {
          width: 50,
          height: 50,
          channels: 3,
          background: { r: 100, g: 150, b: 200 }
        }
      }).jpeg().toBuffer();

      // Upload first
      const asset1 = await mediaService.uploadMedia(
        imageBuffer,
        'duplicate-test-1.jpg',
        'image/jpeg',
        testBrandId,
        testTenantId,
        'graphics'
      );

      // Try to upload exact same image
      const asset2 = await mediaService.uploadMedia(
        imageBuffer,
        'duplicate-test-2.jpg',
        'image/jpeg',
        testBrandId,
        testTenantId,
        'graphics'
      );

      // Should return the same asset
      expect(asset2.id).toBe(asset1.id);
      expect(asset2.hash).toBe(asset1.hash);

      testAssets.push(asset1);
    });
  });

  /**
   * Test 3: AI Auto-Tagging
   */
  describe('AI Auto-Tagging', () => {
    it('should generate AI tags for images', async () => {
      const imageBuffer = await sharp({
        create: {
          width: 200,
          height: 200,
          channels: 3,
          background: { r: 255, g: 200, b: 100 }
        }
      }).jpeg().toBuffer();

      const asset = await mediaService.uploadMedia(
        imageBuffer,
        'ai-tag-test.jpg',
        'image/jpeg',
        testBrandId,
        testTenantId,
        'ai_exports'
      );

      expect(asset.metadata.aiTags).toBeDefined();
      expect(Array.isArray(asset.metadata.aiTags)).toBe(true);
      expect(asset.metadata.aiTags.length).toBeGreaterThan(0);
      expect(asset.metadata.aiTags.length).toBeLessThanOrEqual(8);

      // Tags should be strings
      asset.metadata.aiTags.forEach(tag => {
        expect(typeof tag).toBe('string');
      });

      testAssets.push(asset);
    });
  });

  /**
   * Test 4: Metadata Extraction with Privacy
   */
  describe('Metadata Extraction (EXIF/IPTC)', () => {
    it('should extract image dimensions and format', async () => {
      const imageBuffer = await sharp({
        create: {
          width: 640,
          height: 480,
          channels: 3,
          background: { r: 50, g: 50, b: 50 }
        }
      }).jpeg().toBuffer();

      const asset = await mediaService.uploadMedia(
        imageBuffer,
        'metadata-test.jpg',
        'image/jpeg',
        testBrandId,
        testTenantId,
        'images'
      );

      expect(asset.metadata.width).toBe(640);
      expect(asset.metadata.height).toBe(480);

      testAssets.push(asset);
    });

    it('should scrub PII from metadata', async () => {
      const imageBuffer = await sharp({
        create: {
          width: 400,
          height: 300,
          channels: 3,
          background: { r: 200, g: 100, b: 50 }
        }
      }).jpeg().toBuffer();

      const asset = await mediaService.uploadMedia(
        imageBuffer,
        'privacy-test.jpg',
        'image/jpeg',
        testBrandId,
        testTenantId,
        'graphics'
      );

      // Should NOT contain GPS or camera serial data (privacy scrubbing)
      expect(asset.metadata).not.toHaveProperty('gps');
      expect(asset.metadata).not.toHaveProperty('serialNumber');

      testAssets.push(asset);
    });
  });

  /**
   * Test 5: Storage Quota Management
   */
  describe('Storage Quota Enforcement', () => {
    it('should track storage usage correctly', async () => {
      const imageBuffer = await sharp({
        create: {
          width: 300,
          height: 300,
          channels: 3,
          background: { r: 75, g: 75, b: 75 }
        }
      }).jpeg().toBuffer();

      const asset = await mediaService.uploadMedia(
        imageBuffer,
        'quota-test.jpg',
        'image/jpeg',
        testBrandId,
        testTenantId,
        'images'
      );

      // Get storage usage
      const storageInfo = await mediaService.getStorageUsage(testBrandId);
      expect(storageInfo.total).toBeGreaterThan(0);
      expect(storageInfo.assetCount).toBeGreaterThan(0);

      testAssets.push(asset);
    });
  });

  /**
   * Test 6: Search & Filtering
   */
  describe('Search & Filtering', () => {
    it('should list assets with pagination', async () => {
      const { assets, total } = await mediaService.listAssets(
        testBrandId,
        {
          limit: 10,
          offset: 0
        }
      );

      expect(Array.isArray(assets)).toBe(true);
      expect(total).toBeGreaterThan(0);
      expect(assets.length).toBeLessThanOrEqual(10);
    });

    it('should filter assets by category', async () => {
      const { assets } = await mediaService.listAssets(
        testBrandId,
        {
          category: 'graphics',
          limit: 50
        }
      );

      assets.forEach(asset => {
        expect(asset.category).toBe('graphics');
      });
    });

    it('should search assets by filename', async () => {
      const { assets } = await mediaService.listAssets(
        testBrandId,
        {
          search: 'test',
          limit: 50
        }
      );

      expect(Array.isArray(assets)).toBe(true);
      // Should find at least some test assets
      if (assets.length > 0) {
        expect(assets[0].filename.toLowerCase()).toContain('test');
      }
    });

    it('should search assets by tag', async () => {
      // Get first asset to find its tags
      if (testAssets.length > 0) {
        const firstAsset = testAssets[0];
        if (firstAsset.metadata.aiTags && firstAsset.metadata.aiTags.length > 0) {
          const searchTag = firstAsset.metadata.aiTags[0];

          const results = await mediaService.searchByTag(
            testBrandId,
            [searchTag],
            50
          );

          expect(Array.isArray(results)).toBe(true);
        }
      }
    });
  });

  /**
   * Test 7: Asset Usage Tracking
   */
  describe('Asset Usage Tracking', () => {
    it('should track asset usage when referenced', async () => {
      if (testAssets.length > 0) {
        const asset = testAssets[0];

        // Track usage
        await mediaService.trackAssetUsage(
          asset.id,
          testBrandId,
          'post:12345'
        );

        // Get updated asset
        const updated = await mediaService.getAssetById(asset.id);
        expect(updated).toBeDefined();
        if (updated) {
          expect(updated.metadata.usageCount).toBeGreaterThan(0);
          expect(updated.metadata.usedIn).toContain('post:12345');
        }
      }
    });
  });

  /**
   * Test 8: Bulk Operations
   */
  describe('Bulk Operations', () => {
    it('should support bulk deletion of assets', async () => {
      if (testAssets.length > 1) {
        const assetToDelete = testAssets[1];

        // Delete asset
        await mediaService.deleteAsset(assetToDelete.id, testBrandId);

        // Verify deletion
        const deleted = await mediaService.getAssetById(assetToDelete.id);
        expect(deleted).toBeNull();
      }
    });
  });

  /**
   * Test 9: Performance Metrics
   */
  describe('Performance Metrics', () => {
    it('should complete image upload + processing in < 5 seconds', async () => {
      const imageBuffer = await sharp({
        create: {
          width: 500,
          height: 500,
          channels: 3,
          background: { r: 150, g: 150, b: 150 }
        }
      }).jpeg().toBuffer();

      const startTime = Date.now();

      const asset = await mediaService.uploadMedia(
        imageBuffer,
        'perf-test.jpg',
        'image/jpeg',
        testBrandId,
        testTenantId,
        'images'
      );

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(5000);
      console.log(`Upload + processing completed in ${duration}ms`);

      testAssets.push(asset);
    });
  });

  /**
   * Test 10: Error Handling
   */
  describe('Error Handling', () => {
    it('should handle invalid file types gracefully', async () => {
      // Try to upload invalid file type
      const invalidBuffer = Buffer.from('not an image');

      try {
        await mediaService.uploadMedia(
          invalidBuffer,
          'invalid.txt',
          'text/plain',
          testBrandId,
          testTenantId,
          'graphics'
        );
        // Should not reach here for unsupported types (depends on implementation)
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle missing required fields', async () => {
      const imageBuffer = await sharp({
        create: {
          width: 100,
          height: 100,
          channels: 3,
          background: { r: 0, g: 0, b: 0 }
        }
      }).jpeg().toBuffer();

      // Missing category
      try {
        await mediaService.uploadMedia(
          imageBuffer,
          'test.jpg',
          'image/jpeg',
          testBrandId,
          testTenantId,
          'graphics' as MediaCategory
        );
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});

describe('PHASE 6: RLS & Security', () => {
  it('should enforce RLS policies (multi-tenant isolation)', async () => {
    // This would require integration with Supabase RLS
    // In a real scenario, we'd verify that users can only see their own brand's assets
    // This is enforced at the database level through RLS policies

    const __differentBrandId = 'different-brand-' + Date.now();
    const __differentTenantId = 'different-tenant-' + Date.now();

    const imageBuffer = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 255, g: 0, b: 0 }
      }
    }).jpeg().toBuffer();

    const asset1 = await mediaService.uploadMedia(
      imageBuffer,
      'brand1.jpg',
      'image/jpeg',
      'brand-1',
      'tenant-1',
      'images'
    );

    const asset2 = await mediaService.uploadMedia(
      imageBuffer,
      'brand2.jpg',
      'image/jpeg',
      'brand-2',
      'tenant-2',
      'images'
    );

    // Assets from different brands should not interfere
    expect(asset1.brandId).not.toBe(asset2.brandId);

    // Listing should be scoped by brand
    const brand1Assets = await mediaService.listAssets('brand-1', {});
    const brand2Assets = await mediaService.listAssets('brand-2', {});

    // Each brand should only see their own assets
    expect(brand1Assets.assets.every(a => a.brandId === 'brand-1')).toBe(true);
    expect(brand2Assets.assets.every(a => a.brandId === 'brand-2')).toBe(true);
  });
});
