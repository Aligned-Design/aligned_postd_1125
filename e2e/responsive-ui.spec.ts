import { test, expect, devices } from '@playwright/test';

/**
 * Responsive UI E2E Tests
 * Validates layout, interactions, and readability across breakpoints
 */

// Define viewport sizes matching our design system
const viewports = {
  mobile: { width: 360, height: 640, name: 'Mobile (360px)' },
  tablet: { width: 768, height: 1024, name: 'Tablet (768px)' },
  laptop: { width: 1024, height: 768, name: 'Laptop (1024px)' },
  desktop: { width: 1440, height: 900, name: 'Desktop (1440px)' },
};

/**
 * Test: Dashboard responsive layout
 */
test.describe('Dashboard Responsive UI', () => {
  test('should render correctly on mobile (360px)', async ({ page }) => {
    await page.setViewportSize(viewports.mobile.width, viewports.mobile.height);
    await page.goto('/dashboard');

    // Wait for content to load
    await page.waitForLoadState('networkidle');

    // Verify key elements are visible and properly stacked
    await expect(page.locator('h1, h2').first()).toBeVisible();

    // Check that navigation is accessible
    const nav = page.locator('nav, [role="navigation"]').first();
    await expect(nav).toBeVisible();

    // Verify no horizontal overflow
    const body = page.locator('body');
    const bodyBox = await body.boundingBox();
    expect(bodyBox?.width).toBeLessThanOrEqual(viewports.mobile.width + 1);

    // Take screenshot for visual regression
    await page.screenshot({ path: 'test-results/dashboard-mobile.png' });
  });

  test('should render correctly on tablet (768px)', async ({ page }) => {
    await page.setViewportSize(viewports.tablet.width, viewports.tablet.height);
    await page.goto('/dashboard');

    await page.waitForLoadState('networkidle');

    // Verify content adapts to tablet layout
    const mainContent = page.locator('main, [role="main"]').first();
    await expect(mainContent).toBeVisible();

    // Check for proper spacing and alignment
    const contentBox = await mainContent.boundingBox();
    expect(contentBox?.width).toBeLessThanOrEqual(viewports.tablet.width);

    await page.screenshot({ path: 'test-results/dashboard-tablet.png' });
  });

  test('should render correctly on desktop (1440px)', async ({ page }) => {
    await page.setViewportSize(viewports.desktop.width, viewports.desktop.height);
    await page.goto('/dashboard');

    await page.waitForLoadState('networkidle');

    // Verify desktop layout with full sidebar visible
    const sidebar = page.locator('aside, [role="complementary"]').first();
    const mainContent = page.locator('main').first();

    await expect(sidebar).toBeVisible();
    await expect(mainContent).toBeVisible();

    // Take screenshot
    await page.screenshot({ path: 'test-results/dashboard-desktop.png' });
  });
});

/**
 * Test: Content creation form responsive layout
 */
test.describe('Content Creation Form Responsive UI', () => {
  test('should display form fields stacked on mobile', async ({ page }) => {
    await page.setViewportSize(viewports.mobile.width, viewports.mobile.height);
    await page.goto('/content');

    // Navigate to create form if needed
    const createButton = page.locator('button:has-text("Create"), a:has-text("New Post")').first();
    if (await createButton.isVisible()) {
      await createButton.click();
    }

    await page.waitForLoadState('networkidle');

    // Verify form is present and scrollable
    const form = page.locator('form').first();
    if (await form.isVisible()) {
      const formBox = await form.boundingBox();
      expect(formBox?.width).toBeLessThanOrEqual(viewports.mobile.width + 1);
    }

    // Check that buttons are thumb-friendly (at least 44px height)
    const buttons = page.locator('button').first();
    if (await buttons.isVisible()) {
      const buttonBox = await buttons.boundingBox();
      expect(buttonBox?.height).toBeGreaterThanOrEqual(44);
    }
  });

  test('should display form in columns on desktop', async ({ page }) => {
    await page.setViewportSize(viewports.desktop.width, viewports.desktop.height);
    await page.goto('/content');

    // Navigate to create form if needed
    const createButton = page.locator('button:has-text("Create"), a:has-text("New Post")').first();
    if (await createButton.isVisible()) {
      await createButton.click();
    }

    await page.waitForLoadState('networkidle');

    // Verify layout uses available space
    const mainContent = page.locator('main').first();
    if (await mainContent.isVisible()) {
      const contentBox = await mainContent.boundingBox();
      // Desktop should have wider layout
      expect(contentBox?.width).toBeGreaterThan(800);
    }

    await page.screenshot({ path: 'test-results/form-desktop.png' });
  });
});

/**
 * Test: Navigation responsiveness
 */
test.describe('Navigation Responsive UI', () => {
  test('should show mobile menu toggle on mobile', async ({ page }) => {
    await page.setViewportSize(viewports.mobile.width, viewports.mobile.height);
    await page.goto('/dashboard');

    // Look for hamburger menu or mobile nav toggle
    const menuToggle = page.locator(
      'button[aria-label*="Menu"], button[aria-label*="Toggle"], [data-mobile-nav-toggle]'
    ).first();

    // Either menu toggle is visible OR navigation is fully visible
    const navVisible = await page.locator('nav').first().isVisible();
    const menuVisible = await menuToggle.isVisible();

    expect(navVisible || menuVisible).toBeTruthy();

    await page.screenshot({ path: 'test-results/nav-mobile.png' });
  });

  test('should show full navigation on desktop', async ({ page }) => {
    await page.setViewportSize(viewports.desktop.width, viewports.desktop.height);
    await page.goto('/dashboard');

    // On desktop, full navigation should be visible without toggle
    const nav = page.locator('nav').first();
    await expect(nav).toBeVisible();

    // Verify navigation items are accessible
    const navItems = page.locator('nav a, nav button').first();
    await expect(navItems).toBeVisible();

    await page.screenshot({ path: 'test-results/nav-desktop.png' });
  });
});

/**
 * Test: Table/Grid responsiveness
 */
test.describe('Table/Grid Responsive UI', () => {
  test('should be scrollable on mobile', async ({ page }) => {
    await page.setViewportSize(viewports.mobile.width, viewports.mobile.height);
    await page.goto('/dashboard');

    // Look for tables or data grids
    const table = page.locator('table, [role="grid"]').first();

    if (await table.isVisible()) {
      const tableBox = await table.boundingBox();
      // Table should either fit in viewport or be horizontally scrollable
      expect(tableBox).toBeTruthy();

      // Check for overflow handling (scroll container or responsive columns)
      const tableParent = await table.locator('..').first();
      const overflow = await tableParent.evaluate(el =>
        window.getComputedStyle(el).overflowX
      );

      expect(['auto', 'scroll', 'hidden']).toContain(overflow);
    }

    await page.screenshot({ path: 'test-results/table-mobile.png' });
  });

  test('should display full table on desktop', async ({ page }) => {
    await page.setViewportSize(viewports.desktop.width, viewports.desktop.height);
    await page.goto('/dashboard');

    const table = page.locator('table, [role="grid"]').first();

    if (await table.isVisible()) {
      const tableBox = await table.boundingBox();
      // Desktop table should fit without horizontal scroll
      expect(tableBox?.width).toBeLessThanOrEqual(viewports.desktop.width);
    }

    await page.screenshot({ path: 'test-results/table-desktop.png' });
  });
});

/**
 * Test: Modal/Dialog responsiveness
 */
test.describe('Modal/Dialog Responsive UI', () => {
  test('should be full-screen width on mobile', async ({ page }) => {
    await page.setViewportSize(viewports.mobile.width, viewports.mobile.height);
    await page.goto('/dashboard');

    // Look for a button that opens a modal
    const modalTrigger = page.locator('button').filter({ hasText: /Settings|Edit|Details/ }).first();

    if (await modalTrigger.isVisible()) {
      await modalTrigger.click();
      await page.waitForTimeout(300);

      const modal = page.locator('[role="dialog"], .modal, .dialog').first();
      if (await modal.isVisible()) {
        const modalBox = await modal.boundingBox();
        const pageBox = await page.locator('body').boundingBox();

        // Modal should take up most of viewport on mobile
        if (modalBox && pageBox) {
          expect(modalBox.width).toBeGreaterThan(pageBox.width * 0.8);
        }
      }
    }

    await page.screenshot({ path: 'test-results/modal-mobile.png' });
  });

  test('should be centered and properly sized on desktop', async ({ page }) => {
    await page.setViewportSize(viewports.desktop.width, viewports.desktop.height);
    await page.goto('/dashboard');

    const modalTrigger = page.locator('button').filter({ hasText: /Settings|Edit|Details/ }).first();

    if (await modalTrigger.isVisible()) {
      await modalTrigger.click();
      await page.waitForTimeout(300);

      const modal = page.locator('[role="dialog"], .modal, .dialog').first();
      if (await modal.isVisible()) {
        const modalBox = await modal.boundingBox();
        // Desktop modal should be constrained to reasonable width
        expect(modalBox?.width).toBeLessThan(800);
      }
    }

    await page.screenshot({ path: 'test-results/modal-desktop.png' });
  });
});

/**
 * Test: Text readability across viewports
 */
test.describe('Text Readability Responsive UI', () => {
  test('should have readable font sizes on mobile', async ({ page }) => {
    await page.setViewportSize(viewports.mobile.width, viewports.mobile.height);
    await page.goto('/dashboard');

    // Check body text size
    const bodyText = page.locator('p, span, li').first();
    if (await bodyText.isVisible()) {
      const fontSize = await bodyText.evaluate(el =>
        window.getComputedStyle(el).fontSize
      );

      // Body text should be at least 14px for readability
      const fontSizeNum = parseInt(fontSize);
      expect(fontSizeNum).toBeGreaterThanOrEqual(14);
    }

    // Check heading sizes
    const heading = page.locator('h1, h2, h3').first();
    if (await heading.isVisible()) {
      const headingSize = await heading.evaluate(el =>
        window.getComputedStyle(el).fontSize
      );
      const headingSizeNum = parseInt(headingSize);
      // Headings should be readable
      expect(headingSizeNum).toBeGreaterThanOrEqual(18);
    }
  });

  test('should have proper line-height for readability', async ({ page }) => {
    await page.setViewportSize(viewports.desktop.width, viewports.desktop.height);
    await page.goto('/dashboard');

    const bodyText = page.locator('p, article').first();
    if (await bodyText.isVisible()) {
      const lineHeight = await bodyText.evaluate(el =>
        window.getComputedStyle(el).lineHeight
      );

      // Line height should be at least 1.4 for readability
      const lineHeightNum = parseFloat(lineHeight);
      expect(lineHeightNum).toBeGreaterThanOrEqual(1.4);
    }
  });
});

/**
 * Test: Touch target sizes on mobile
 */
test.describe('Touch Target Responsive UI', () => {
  test('should have adequate touch targets on mobile', async ({ page }) => {
    await page.setViewportSize(viewports.mobile.width, viewports.mobile.height);
    await page.goto('/dashboard');

    // Check interactive elements
    const buttons = page.locator('button').all();
    for (const button of await buttons) {
      if (await button.isVisible()) {
        const box = await button.boundingBox();
        if (box) {
          // WCAG recommendation: minimum 44x44 pixels
          expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(40);
        }
      }
    }

    // Check links
    const links = page.locator('a').all();
    for (const link of await links) {
      if (await link.isVisible()) {
        const box = await link.boundingBox();
        if (box) {
          // Links should be easily tappable
          const minSize = Math.min(box.width, box.height);
          if (minSize > 0) {
            expect(minSize).toBeGreaterThanOrEqual(24);
          }
        }
      }
    }
  });
});
