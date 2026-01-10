import { test, expect } from '@playwright/test';

test('switch between projects should preserve data', async ({ page }) => {
  await page.goto('https://nnm.quest/');

  // Clear storage for fresh test
  await page.evaluate(() => {
    Object.keys(localStorage).filter(k => k.startsWith('nexusmind')).forEach(k => localStorage.removeItem(k));
  });
  await page.reload();
  await page.waitForTimeout(3000);

  console.log('=== STEP 1: Create new project "asldfklsakf" ===');

  // Click New button
  const newBtn = page.locator('button.new-btn').first();
  await newBtn.click();
  await page.waitForTimeout(500);

  // Open project manager to rename
  const projectBtn = page.locator('button.project-btn').first();
  await projectBtn.click();
  await page.waitForTimeout(500);

  await page.screenshot({ path: 'test-results/switch-01-project-manager.png' });

  // Find the "New Knowledge Graph" project and click rename
  const projectItem = page.locator('text=New Knowledge Graph').first();
  if (await projectItem.isVisible()) {
    // Look for rename button or double-click to rename
    const renameBtn = page.locator('button[title*="Rename"], button:has-text("Rename")').first();
    if (await renameBtn.isVisible()) {
      await renameBtn.click();
    }
  }

  await page.waitForTimeout(500);
  await page.screenshot({ path: 'test-results/switch-02-rename.png' });

  // Close modal
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  console.log('=== STEP 2: Add nodes (simulate by checking current state) ===');

  // Get current project info
  const projectName1 = await page.locator('.project-name').first().textContent();
  console.log('Current project:', projectName1);

  // Check localStorage state
  const state1 = await page.evaluate(() => {
    const index = JSON.parse(localStorage.getItem('nexusmind:project-index') || '{}');
    return {
      builderProjects: index.builder?.map((p: any) => p.name),
      currentBuilder: index.currentBuilder,
    };
  });
  console.log('State after new project:', JSON.stringify(state1, null, 2));

  console.log('=== STEP 3: Save ===');
  const saveBtn = page.locator('button.save-btn').first();
  await saveBtn.click();
  await page.waitForTimeout(500);

  const state2 = await page.evaluate(() => {
    const index = JSON.parse(localStorage.getItem('nexusmind:project-index') || '{}');
    return {
      builderProjects: index.builder?.map((p: any) => ({ name: p.name, id: p.id })),
      currentBuilder: index.currentBuilder,
    };
  });
  console.log('State after save:', JSON.stringify(state2, null, 2));

  console.log('=== STEP 4: Switch to Demo project ===');

  // Open project manager
  await projectBtn.click();
  await page.waitForTimeout(500);

  // Click on Demo project
  const demoProject = page.locator('text=Demo Knowledge Graph').first();
  if (await demoProject.isVisible()) {
    await demoProject.click();
    console.log('Clicked Demo Knowledge Graph');
  }
  await page.waitForTimeout(1000);

  const projectName2 = await page.locator('.project-name').first().textContent();
  console.log('After switching to demo, project name:', projectName2);

  console.log('=== STEP 5: Switch back to original project ===');

  // Open project manager again
  await projectBtn.click();
  await page.waitForTimeout(500);

  await page.screenshot({ path: 'test-results/switch-03-before-switch-back.png' });

  // Check what projects are listed
  const projectList = await page.evaluate(() => {
    const index = JSON.parse(localStorage.getItem('nexusmind:project-index') || '{}');
    return index.builder?.map((p: any) => p.name);
  });
  console.log('Projects in list:', projectList);

  // Click on the user's project (New Knowledge Graph if not renamed)
  const userProject = page.locator('.project-item:has-text("New Knowledge Graph"), .project-item:has-text("asldfklsakf")').first();
  if (await userProject.isVisible()) {
    await userProject.click();
    console.log('Clicked user project');
  } else {
    console.log('User project not found in list!');
    // List all visible project items
    const items = await page.locator('.project-item').allTextContents();
    console.log('Visible project items:', items);
  }

  await page.waitForTimeout(1000);

  const projectName3 = await page.locator('.project-name').first().textContent();
  console.log('After switching back, project name:', projectName3);

  const state3 = await page.evaluate(() => {
    const index = JSON.parse(localStorage.getItem('nexusmind:project-index') || '{}');
    const state = localStorage.getItem('nexusmindgraph:state');
    return {
      builderProjects: index.builder?.map((p: any) => ({ name: p.name, id: p.id })),
      currentBuilder: index.currentBuilder,
      stateNodeCount: state ? JSON.parse(state).nodes?.length : 0,
    };
  });
  console.log('Final state:', JSON.stringify(state3, null, 2));

  await page.screenshot({ path: 'test-results/switch-04-final.png' });
});
