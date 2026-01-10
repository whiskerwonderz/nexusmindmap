import { test, expect } from '@playwright/test';

test('debug save/load flow', async ({ page }) => {
  // Clear all storage first
  await page.goto('http://localhost:4175/');
  await page.evaluate(() => {
    Object.keys(localStorage).filter(k => k.startsWith('nexusmind')).forEach(k => localStorage.removeItem(k));
  });

  console.log('=== STEP 1: Fresh load ===');
  await page.reload();
  await page.waitForTimeout(3000);

  const step1Storage = await page.evaluate(() => {
    return Object.keys(localStorage).filter(k => k.startsWith('nexusmind'));
  });
  console.log('Keys after fresh load:', step1Storage);

  // Get current project name
  const projectName1 = await page.locator('.project-name').first().textContent();
  console.log('Current project name:', projectName1);

  console.log('\n=== STEP 2: Create new project ===');
  // Click "+ New" button
  const newBtn = page.locator('button.new-btn, button:has-text("New")').first();
  if (await newBtn.isVisible()) {
    await newBtn.click();
    await page.waitForTimeout(1000);
    console.log('Clicked New button');
  }

  const projectName2 = await page.locator('.project-name').first().textContent();
  console.log('New project name:', projectName2);

  const step2Storage = await page.evaluate(() => {
    return Object.keys(localStorage).filter(k => k.startsWith('nexusmind'));
  });
  console.log('Keys after new project:', step2Storage);

  console.log('\n=== STEP 3: Click Save ===');
  const saveBtn = page.locator('button.save-btn, button[title*="Save"]').first();
  if (await saveBtn.isVisible()) {
    await saveBtn.click();
    await page.waitForTimeout(1000);
    console.log('Clicked Save button');
  }

  const step3Storage = await page.evaluate(() => {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('nexusmind'));
    return keys.map(k => ({ key: k, length: localStorage.getItem(k)?.length }));
  });
  console.log('Storage after save:', JSON.stringify(step3Storage, null, 2));

  // Get the project index
  const projectIndex = await page.evaluate(() => {
    return localStorage.getItem('nexusmind:project-index');
  });
  console.log('Project index:', projectIndex);

  console.log('\n=== STEP 4: Reload page ===');
  await page.reload();
  await page.waitForTimeout(3000);

  const projectName3 = await page.locator('.project-name').first().textContent();
  console.log('Project name after reload:', projectName3);

  const step4Storage = await page.evaluate(() => {
    return Object.keys(localStorage).filter(k => k.startsWith('nexusmind'));
  });
  console.log('Keys after reload:', step4Storage);

  const projectIndex2 = await page.evaluate(() => {
    return localStorage.getItem('nexusmind:project-index');
  });
  console.log('Project index after reload:', projectIndex2);

  // Check if project names match
  console.log('\n=== RESULT ===');
  console.log('Project before reload:', projectName2);
  console.log('Project after reload:', projectName3);
  console.log('Match:', projectName2 === projectName3);

  await page.screenshot({ path: 'test-results/debug-final.png' });
});
