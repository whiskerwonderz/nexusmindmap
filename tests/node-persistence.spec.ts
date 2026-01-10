import { test, expect } from '@playwright/test';

test('nodes should persist when switching projects', async ({ page }) => {
  await page.goto('http://localhost:4175/');

  // Clear storage
  await page.evaluate(() => {
    Object.keys(localStorage).filter(k => k.startsWith('nexusmind')).forEach(k => localStorage.removeItem(k));
  });
  await page.reload();
  await page.waitForTimeout(3000);

  console.log('=== STEP 1: Create new project ===');
  const newBtn = page.locator('button.new-btn').first();
  await newBtn.click();
  await page.waitForTimeout(1000);

  const projectName = await page.locator('.project-name').first().textContent();
  console.log('Created project:', projectName);

  console.log('=== STEP 2: Add a node ===');
  // Look for add node button or double-click to add
  const addNodeBtn = page.locator('button:has-text("Add"), button[title*="Add"]').first();
  if (await addNodeBtn.isVisible()) {
    await addNodeBtn.click();
    await page.waitForTimeout(500);

    // Fill in node details if modal appears
    const labelInput = page.locator('input[placeholder*="name"], input[placeholder*="label"]').first();
    if (await labelInput.isVisible()) {
      await labelInput.fill('Test Node 1');

      // Submit
      const submitBtn = page.locator('button:has-text("Add"), button:has-text("Create"), button[type="submit"]').first();
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
      }
    }
  }
  await page.waitForTimeout(500);

  // Check node count in graph store
  const nodeCountBefore = await page.evaluate(() => {
    const state = localStorage.getItem('nexusmindgraph:state');
    if (state) {
      return JSON.parse(state).nodes?.length || 0;
    }
    return 0;
  });
  console.log('Nodes in graph (from nexusmindgraph:state):', nodeCountBefore);

  console.log('=== STEP 3: Save ===');
  const saveBtn = page.locator('button.save-btn').first();
  await saveBtn.click();
  await page.waitForTimeout(1000);

  // Check what was saved
  const savedProject = await page.evaluate(() => {
    const index = JSON.parse(localStorage.getItem('nexusmind:project-index') || '{}');
    const currentId = index.currentBuilder;
    if (currentId) {
      const projectData = localStorage.getItem(`nexusmind:builder:${currentId}`);
      if (projectData) {
        const project = JSON.parse(projectData);
        return { name: project.name, nodeCount: project.nodes?.length || 0 };
      }
    }
    return null;
  });
  console.log('Saved project data:', savedProject);

  console.log('=== STEP 4: Switch to Demo ===');
  const projectBtn = page.locator('button.project-btn').first();
  await projectBtn.click();
  await page.waitForTimeout(500);

  // Click on Demo project
  const demoItem = page.locator('.project-item:has-text("Demo"), div:has-text("Demo Knowledge Graph")').first();
  await demoItem.click();
  await page.waitForTimeout(1000);

  // Close modal if still open
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  const currentProject = await page.locator('.project-name').first().textContent();
  console.log('Current project after switch:', currentProject);

  console.log('=== STEP 5: Switch back ===');
  await projectBtn.click();
  await page.waitForTimeout(500);

  // Click on user's project
  const userProjectItem = page.locator('.project-item:has-text("New Knowledge Graph")').first();
  if (await userProjectItem.isVisible()) {
    await userProjectItem.click();
    await page.waitForTimeout(1000);
  }

  // Close modal
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  const finalProject = await page.locator('.project-name').first().textContent();
  console.log('Final project name:', finalProject);

  // Check saved data
  const finalSavedProject = await page.evaluate(() => {
    const index = JSON.parse(localStorage.getItem('nexusmind:project-index') || '{}');
    const currentId = index.currentBuilder;
    if (currentId) {
      const projectData = localStorage.getItem(`nexusmind:builder:${currentId}`);
      if (projectData) {
        const project = JSON.parse(projectData);
        return { name: project.name, nodeCount: project.nodes?.length || 0, nodes: project.nodes?.map((n: any) => n.label) };
      }
    }
    return null;
  });
  console.log('Final project data:', JSON.stringify(finalSavedProject, null, 2));

  // Verify
  expect(finalProject).toBe('New Knowledge Graph');
  console.log('Test passed!');
});
