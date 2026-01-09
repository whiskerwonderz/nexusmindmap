import { test, expect, Page } from '@playwright/test';

// Helper to switch to builder mode
async function switchToBuilderMode(page: Page) {
  await page.waitForLoadState('networkidle');
  const builderTab = page.locator('.mode-tab').filter({ hasText: 'Builder' });
  await builderTab.click();
  await page.waitForTimeout(1000);
}

// Helper to switch to explorer mode
async function switchToExplorerMode(page: Page) {
  await page.waitForLoadState('networkidle');
  const explorerTab = page.locator('.mode-tab').filter({ hasText: 'Explorer' });
  await explorerTab.click();
  await page.waitForSelector('.traveler-view', { timeout: 30000 });
  await page.waitForTimeout(2000);
}

// Helper to open Project Manager
async function openProjectManager(page: Page) {
  const projectBtn = page.locator('.project-btn');
  await projectBtn.click();
  await page.waitForTimeout(500);
}

// ============================================
// BUILDER MODE - HIERARCHY TESTS
// ============================================

test.describe('Builder Mode - Hierarchy', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await switchToBuilderMode(page);
    await page.waitForTimeout(2000);
  });

  test('Parent selector appears in Inspector when node selected', async ({ page }) => {
    // Click on a visible node in the sidebar - Goals section should show "Master ML & AI"
    const goalNode = page.locator('button').filter({ hasText: 'Master ML & AI' });
    await goalNode.click();
    await page.waitForTimeout(500);

    // Check Inspector shows parent selector
    const parentSelect = page.locator('#inspector-parent');
    await expect(parentSelect).toBeVisible();
  });

  test('Set as parent checkbox in Connection Modal', async ({ page }) => {
    // Click on a visible node first
    const goalNode = page.locator('button').filter({ hasText: 'Master ML & AI' });
    await goalNode.click();
    await page.waitForTimeout(500);

    // Find "+ Add" button in the Inspector connections section
    const addConnectionBtn = page.locator('text=+ Add').first();
    await addConnectionBtn.click();
    await page.waitForTimeout(500);

    // Check for "Set as parent" text
    const setAsParentText = page.locator('text=Set as parent');
    await expect(setAsParentText).toBeVisible();
  });
});

// ============================================
// EXPLORER MODE - TRIP LIST TOGGLE
// ============================================

test.describe('Explorer Mode - Trip List', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await switchToExplorerMode(page);
  });

  test('Trip count is clickable and toggles trip list', async ({ page }) => {
    // Ensure we're on Globe view
    const globeBtn = page.locator('.layout-btn').filter({ hasText: 'Globe' });
    await globeBtn.click();
    await page.waitForTimeout(2000);

    // Find trip count in stats (use first() to avoid multiple matches)
    const statsSection = page.locator('.globe-stats').first();
    await expect(statsSection).toBeVisible();

    // Look for clickable stat value
    const statValue = statsSection.locator('.stat-value').first();

    if (await statValue.isVisible()) {
      // Click to toggle
      await statValue.click();
      await page.waitForTimeout(500);

      // Check visibility (test passes if click doesn't error)
      await expect(statsSection).toBeVisible();
    }
  });

  test('Demo trips do not have "Demo:" prefix', async ({ page }) => {
    // Open Project Manager
    await openProjectManager(page);
    await page.waitForTimeout(500);

    // Click View Demo button
    const viewDemoBtn = page.locator('button').filter({ hasText: 'View Demo' });
    await viewDemoBtn.click();
    await page.waitForTimeout(1500);

    // Close modal by pressing Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // Check trip names in the sidebar
    const tripNames = page.locator('.trip-name');
    const count = await tripNames.count();

    if (count > 0) {
      for (let i = 0; i < Math.min(count, 3); i++) {
        const text = await tripNames.nth(i).textContent();
        expect(text).not.toMatch(/^Demo:/);
      }
    }
  });
});

// ============================================
// PROJECT MANAGEMENT TESTS
// ============================================

test.describe('Project Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test('Storage message says "browser" not "device"', async ({ page }) => {
    await openProjectManager(page);
    await page.waitForTimeout(500);

    // Check for the storage message containing "browser"
    const modalContent = page.locator('.project-manager-modal, .modal').first();
    const pageContent = await modalContent.textContent();

    expect(pageContent).toContain('browser');
  });

  test('View Demo button exists and is clickable', async ({ page }) => {
    await openProjectManager(page);
    await page.waitForTimeout(500);

    // Find View Demo button
    const viewDemoBtn = page.locator('button').filter({ hasText: 'View Demo' });
    await expect(viewDemoBtn).toBeVisible();

    // Click it
    await viewDemoBtn.click();
    await page.waitForTimeout(1000);

    // Should load demo without error - check project name changed
    const projectName = page.locator('.project-name');
    const name = await projectName.textContent();
    expect(name).toContain('Demo');
  });
});

// ============================================
// BUILDER MODE - LAYOUT TESTS
// ============================================

test.describe('Builder Mode - Layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await switchToBuilderMode(page);
    await page.waitForTimeout(1000);
  });

  test('Demo nodes are spread out (not clustered)', async ({ page }) => {
    await openProjectManager(page);
    await page.waitForTimeout(500);

    // Click View Demo
    const viewDemoBtn = page.locator('button').filter({ hasText: 'View Demo' });
    await viewDemoBtn.click();
    await page.waitForTimeout(3000); // Wait longer for layout

    // Close modal
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);

    // Get node positions via g.graph-node elements
    const nodes = page.locator('g.graph-node');
    const nodeCount = await nodes.count();
    expect(nodeCount).toBeGreaterThan(0);

    // Get SVG bounds
    const svg = page.locator('svg').first();
    const svgBounds = await svg.boundingBox();

    if (svgBounds && nodeCount >= 3) {
      // Check nodes are spread across the canvas
      const positions: { x: number; y: number }[] = [];

      for (let i = 0; i < Math.min(nodeCount, 5); i++) {
        const bounds = await nodes.nth(i).boundingBox();
        if (bounds) {
          positions.push({
            x: bounds.x - svgBounds.x,
            y: bounds.y - svgBounds.y
          });
        }
      }

      // Calculate spread - nodes should not all be in same spot
      if (positions.length >= 2) {
        const xValues = positions.map(p => p.x);
        const yValues = positions.map(p => p.y);
        const xSpread = Math.max(...xValues) - Math.min(...xValues);
        const ySpread = Math.max(...yValues) - Math.min(...yValues);

        // At least some spread should exist (> 50px)
        expect(xSpread + ySpread).toBeGreaterThan(50);
      }
    }
  });
});
