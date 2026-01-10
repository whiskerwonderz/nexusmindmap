import { test, expect } from '@playwright/test';

test.describe('Save/Load functionality on nnm.quest', () => {
  test.beforeEach(async ({ page }) => {
    // Go to the main app (skip landing page)
    await page.goto('https://nnm.quest/');
    // Wait for app to load
    await page.waitForLoadState('networkidle');
  });

  test('should load the main app', async ({ page }) => {
    // Check if we're on the main app or redirected to landing
    const url = page.url();
    console.log('Current URL:', url);

    // Take screenshot
    await page.screenshot({ path: 'test-results/01-initial-load.png' });

    // Check for key UI elements
    const header = page.locator('header');
    await expect(header).toBeVisible({ timeout: 10000 });
  });

  test('should have working localStorage', async ({ page }) => {
    // Test localStorage is accessible
    const hasLocalStorage = await page.evaluate(() => {
      try {
        localStorage.setItem('test', 'value');
        const result = localStorage.getItem('test');
        localStorage.removeItem('test');
        return result === 'value';
      } catch {
        return false;
      }
    });

    console.log('localStorage accessible:', hasLocalStorage);
    expect(hasLocalStorage).toBe(true);
  });

  test('should save and retrieve project data', async ({ page }) => {
    // Wait for the app to fully initialize
    await page.waitForTimeout(2000);

    // Check current localStorage state
    const initialStorage = await page.evaluate(() => {
      const keys = Object.keys(localStorage).filter(k => k.startsWith('nexusmind'));
      return keys.map(k => ({ key: k, value: localStorage.getItem(k)?.substring(0, 100) }));
    });
    console.log('Initial storage keys:', JSON.stringify(initialStorage, null, 2));

    // Take screenshot of current state
    await page.screenshot({ path: 'test-results/02-before-save.png' });

    // Click the save button
    const saveBtn = page.locator('button[title*="Save"]');
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
      console.log('Clicked save button');
      await page.waitForTimeout(1000);
    } else {
      console.log('Save button not found');
    }

    // Check localStorage after save
    const afterSaveStorage = await page.evaluate(() => {
      const keys = Object.keys(localStorage).filter(k => k.startsWith('nexusmind'));
      return keys.map(k => ({ key: k, valueLength: localStorage.getItem(k)?.length }));
    });
    console.log('After save storage:', JSON.stringify(afterSaveStorage, null, 2));

    await page.screenshot({ path: 'test-results/03-after-save.png' });
  });

  test('should persist data after page reload', async ({ page }) => {
    // First, check what's in storage
    const beforeReload = await page.evaluate(() => {
      return Object.keys(localStorage).filter(k => k.startsWith('nexusmind'));
    });
    console.log('Keys before reload:', beforeReload);

    // Reload the page
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check storage after reload
    const afterReload = await page.evaluate(() => {
      return Object.keys(localStorage).filter(k => k.startsWith('nexusmind'));
    });
    console.log('Keys after reload:', afterReload);

    await page.screenshot({ path: 'test-results/04-after-reload.png' });

    // Verify keys persist
    expect(afterReload.length).toBeGreaterThanOrEqual(beforeReload.length);
  });

  test('should display saved project in project manager', async ({ page }) => {
    await page.waitForTimeout(2000);

    // Click on project button to open project manager
    const projectBtn = page.locator('button.project-btn, button[title*="project"]').first();
    if (await projectBtn.isVisible()) {
      await projectBtn.click();
      console.log('Opened project manager');
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'test-results/05-project-manager.png' });

      // Check if projects are listed
      const projectList = await page.locator('.project-list, .modal').textContent();
      console.log('Project manager content:', projectList?.substring(0, 200));
    }
  });

  test('debug: check all localStorage contents', async ({ page }) => {
    await page.waitForTimeout(2000);

    const allStorage = await page.evaluate(() => {
      const result: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          result[key] = value ? (value.length > 200 ? value.substring(0, 200) + '...' : value) : '';
        }
      }
      return result;
    });

    console.log('=== ALL LOCALSTORAGE ===');
    console.log(JSON.stringify(allStorage, null, 2));
  });
});
