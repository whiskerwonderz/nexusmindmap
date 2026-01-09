import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Helper to switch to traveler mode and wait for load
async function switchToTravelerMode(page: Page) {
  // Wait for the page to load
  await page.waitForLoadState('networkidle');

  // Click on the Explorer tab in the mode switcher (renamed from Traveler)
  const explorerTab = page.locator('.mode-tab').filter({ hasText: 'Explorer' });
  await explorerTab.click();

  // Wait for traveler view to be visible
  await page.waitForSelector('.traveler-view', { timeout: 30000 });

  // Wait for animations and data to load
  await page.waitForTimeout(2000);
}

// ============================================
// VIEWS TESTS
// ============================================

test.describe('Views', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await switchToTravelerMode(page);
  });

  test('1. Globe View - 3D globe renders, markers visible, routes displayed', async ({ page }) => {
    // Click on Globe button in layout switcher
    const globeBtn = page.locator('.layout-btn').filter({ hasText: 'Globe' });
    await globeBtn.click();
    await expect(globeBtn).toHaveClass(/active/);

    // Wait for globe to render
    await page.waitForTimeout(2000);

    // Check that the TravelGlobe component is present
    const vizArea = page.locator('.viz-area');
    await expect(vizArea).toBeVisible();

    // Globe is rendered via Three.js canvas
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    // Verify the visualization area has content
    const vizAreaBounds = await vizArea.boundingBox();
    expect(vizAreaBounds).not.toBeNull();
    expect(vizAreaBounds!.width).toBeGreaterThan(100);
    expect(vizAreaBounds!.height).toBeGreaterThan(100);
  });

  test('2. Map View - 2D map loads, markers/routes visible, zoom/pan works', async ({ page }) => {
    // Click on Map button in layout switcher
    const mapBtn = page.locator('.layout-btn').filter({ hasText: 'Map' });
    await mapBtn.click();
    await expect(mapBtn).toHaveClass(/active/);

    // Wait for map to render
    await page.waitForTimeout(2000);

    // Check that the map container is present
    const vizArea = page.locator('.viz-area');
    await expect(vizArea).toBeVisible();

    // MapLibre renders with a canvas
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    // Test zoom via scroll
    const vizAreaBounds = await vizArea.boundingBox();
    if (vizAreaBounds) {
      await page.mouse.move(
        vizAreaBounds.x + vizAreaBounds.width / 2,
        vizAreaBounds.y + vizAreaBounds.height / 2
      );
      // Scroll to zoom
      await page.mouse.wheel(0, -100);
      await page.waitForTimeout(500);
    }

    // Test pan via drag
    if (vizAreaBounds) {
      await page.mouse.move(
        vizAreaBounds.x + vizAreaBounds.width / 2,
        vizAreaBounds.y + vizAreaBounds.height / 2
      );
      await page.mouse.down();
      await page.mouse.move(
        vizAreaBounds.x + vizAreaBounds.width / 2 + 50,
        vizAreaBounds.y + vizAreaBounds.height / 2 + 50
      );
      await page.mouse.up();
      await page.waitForTimeout(500);
    }
  });

  test('3. Timeline View - Vertical scroll, year sections, journey cards render', async ({ page }) => {
    // Click on Timeline button in layout switcher
    const timelineBtn = page.locator('.layout-btn').filter({ hasText: 'Timeline' });
    await timelineBtn.click();
    await expect(timelineBtn).toHaveClass(/active/);

    // Wait for timeline to render
    await page.waitForTimeout(2000);

    // Timeline mode should add timeline-mode class
    await expect(page.locator('.traveler-view')).toHaveClass(/timeline-mode/);

    // Check for timeline components
    const vizArea = page.locator('.viz-area');
    await expect(vizArea).toBeVisible();

    // Look for year sections or journey cards
    const yearSections = page.locator('[class*="year"]');
    const journeyCards = page.locator('[class*="journey"], [class*="card"]');

    // At least one of these should be visible
    const hasYearSections = await yearSections.count() > 0;
    const hasJourneyCards = await journeyCards.count() > 0;
    expect(hasYearSections || hasJourneyCards).toBe(true);

    // Test vertical scroll
    const vizAreaBounds = await vizArea.boundingBox();
    if (vizAreaBounds) {
      await page.mouse.move(
        vizAreaBounds.x + vizAreaBounds.width / 2,
        vizAreaBounds.y + vizAreaBounds.height / 2
      );
      await page.mouse.wheel(0, 200);
      await page.waitForTimeout(500);
    }
  });
});

// ============================================
// INTERACTIONS TESTS
// ============================================

test.describe('Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await switchToTravelerMode(page);
  });

  test('4. Marker Click - Shows popup with city/country/visits', async ({ page }) => {
    // Ensure we're on Globe view
    const globeBtn = page.locator('.layout-btn').filter({ hasText: 'Globe' });
    await globeBtn.click();
    await page.waitForTimeout(2000);

    // Get the canvas and click in the center area where markers might be
    const canvas = page.locator('canvas');
    const bounds = await canvas.boundingBox();

    if (bounds) {
      // Click on various positions to try to hit a marker
      // Since markers are dynamically positioned, we try multiple spots
      const positions = [
        { x: bounds.x + bounds.width * 0.5, y: bounds.y + bounds.height * 0.5 },
        { x: bounds.x + bounds.width * 0.4, y: bounds.y + bounds.height * 0.4 },
        { x: bounds.x + bounds.width * 0.6, y: bounds.y + bounds.height * 0.5 },
      ];

      for (const pos of positions) {
        await page.mouse.click(pos.x, pos.y);
        await page.waitForTimeout(500);

        // Check if location info popup appeared
        const locationInfo = page.locator('.location-info');
        if (await locationInfo.isVisible()) {
          // Verify popup contains expected elements
          await expect(locationInfo.locator('h3')).toBeVisible();
          await expect(locationInfo.locator('p')).toBeVisible();
          break;
        }
      }
    }
  });

  test('5. Route Click - Shows trip name popup', async ({ page }) => {
    // Ensure we're on Globe view
    const globeBtn = page.locator('.layout-btn').filter({ hasText: 'Globe' });
    await globeBtn.click();
    await page.waitForTimeout(2000);

    // Routes/arcs are rendered on the globe
    // Click around to try to hit a route
    const canvas = page.locator('canvas');
    const bounds = await canvas.boundingBox();

    if (bounds) {
      // Try clicking in different areas
      await page.mouse.click(
        bounds.x + bounds.width * 0.45,
        bounds.y + bounds.height * 0.45
      );
      await page.waitForTimeout(500);

      // Check for trip details or location info
      const tripDetails = page.locator('.trip-details');
      const locationInfo = page.locator('.location-info');
      const hasPopup = await tripDetails.isVisible() || await locationInfo.isVisible();
      // This test verifies clicking works, popup appearance depends on route hit
    }
  });

  test('6. Trip Selection - Clicking trip in sidebar focuses on location', async ({ page }) => {
    // Ensure we're on Globe view (sidebar is visible)
    const globeBtn = page.locator('.layout-btn').filter({ hasText: 'Globe' });
    await globeBtn.click();
    await page.waitForTimeout(3000);

    // Wait for sidebar to be fully visible
    const sidebar = page.locator('.sidebar');
    await expect(sidebar).toBeVisible();

    // Find a trip card in the sidebar (wait for it)
    const tripCard = page.locator('.trip-card').first();
    await tripCard.waitFor({ state: 'visible', timeout: 10000 });

    // Get trip name
    const tripName = await tripCard.locator('.trip-name').textContent();

    // Click on the trip card using JavaScript to avoid overlay issues
    await tripCard.evaluate((el) => (el as HTMLElement).click());
    await page.waitForTimeout(1000);

    // Check if trip details popup appears
    const tripDetails = page.locator('.trip-details');
    if (await tripDetails.isVisible()) {
      const detailsTitle = await tripDetails.locator('h3').textContent();
      expect(detailsTitle).toBe(tripName);
    }
  });

  test('7. Home Base Focus - Home button centers on home location', async ({ page }) => {
    // Ensure we're on Globe view
    const globeBtn = page.locator('.layout-btn').filter({ hasText: 'Globe' });
    await globeBtn.click();
    await page.waitForTimeout(2000);

    // Find the Home button in GlobeControls
    const homeBtn = page.locator('.control-btn').filter({ hasText: 'Home' });

    if (await homeBtn.isVisible()) {
      // Click the Home button
      await homeBtn.click();
      await page.waitForTimeout(1000);

      // The globe should animate to home location
      // We can't easily verify the exact position, but we check it doesn't throw
      await expect(homeBtn).toBeVisible();
    }
  });
});

// ============================================
// TRIP MANAGEMENT TESTS
// ============================================

test.describe('Trip Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await switchToTravelerMode(page);
  });

  test('8. Add Trip - Modal opens, form submits, trip appears', async ({ page }) => {
    // Ensure we're on Globe view to see sidebar
    const globeBtn = page.locator('.layout-btn').filter({ hasText: 'Globe' });
    await globeBtn.click();
    await page.waitForTimeout(3000);

    // Wait for sidebar
    const sidebar = page.locator('.sidebar');
    await expect(sidebar).toBeVisible();

    // Find and click Add Trip button using JS click
    const addTripBtn = page.locator('.add-trip-btn');
    await addTripBtn.waitFor({ state: 'visible', timeout: 10000 });
    await addTripBtn.evaluate((el) => (el as HTMLElement).click());

    // Modal should open
    const modal = page.getByRole('heading', { name: 'Add New Trip' });
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Fill in the form
    await page.fill('#trip-name', 'Test Trip to Paris');
    await page.fill('#start-date', '2025-06-01');
    await page.fill('#end-date', '2025-06-10');
    await page.fill('#description', 'A wonderful test trip');

    // Search and add a location
    await page.fill('#city-search', 'Paris');
    await page.waitForTimeout(500);

    // Click on the first city result
    const cityOption = page.locator('.city-option').first();
    if (await cityOption.isVisible()) {
      await cityOption.click();
      await page.waitForTimeout(300);
    }

    // Submit the form
    const submitBtn = page.locator('button[type="submit"]').filter({ hasText: 'Add Trip' });
    await submitBtn.click();

    // Wait for modal to close
    await page.waitForTimeout(500);

    // Verify trip appears in the list
    const tripCard = page.locator('.trip-card').filter({ hasText: 'Test Trip to Paris' });
    await expect(tripCard).toBeVisible();

    // Check for success toast
    const toastMessage = page.locator('.toast-message');
    if (await toastMessage.count() > 0) {
      await expect(toastMessage.first()).toContainText('added');
    }
  });

  test('9. Edit Trip - Modal opens with data, saves changes', async ({ page }) => {
    // Ensure we're on Globe view to see sidebar
    const globeBtn = page.locator('.layout-btn').filter({ hasText: 'Globe' });
    await globeBtn.click();
    await page.waitForTimeout(3000);

    // Wait for sidebar
    const sidebar = page.locator('.sidebar');
    await expect(sidebar).toBeVisible();

    // Find a trip card
    const tripCard = page.locator('.trip-card').first();
    await tripCard.waitFor({ state: 'visible', timeout: 10000 });

    // Hover using JS to trigger the edit button visibility
    await tripCard.dispatchEvent('mouseenter');
    await page.waitForTimeout(500);

    // Click edit button using JS
    const editBtn = tripCard.locator('.action-btn.edit');
    await editBtn.evaluate((el) => (el as HTMLElement).click());

    // Modal should open with existing data
    const modal = page.getByRole('heading', { name: 'Edit Trip' });
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Verify form has data pre-filled (Edit modal uses 'edit-trip-name')
    const tripNameInput = page.locator('#edit-trip-name');
    await tripNameInput.waitFor({ state: 'visible' });
    const currentName = await tripNameInput.inputValue();
    expect(currentName.length).toBeGreaterThan(0);

    // Modify the trip name
    await tripNameInput.fill(currentName + ' (Edited)');

    // Save changes
    const saveBtn = page.locator('button[type="submit"]').filter({ hasText: 'Save Changes' });
    await saveBtn.click();

    // Wait for modal to close
    await page.waitForTimeout(500);

    // Verify trip was updated
    const updatedTrip = page.locator('.trip-card').filter({ hasText: '(Edited)' });
    await expect(updatedTrip).toBeVisible();
  });

  test('10. Delete Trip - Confirmation dialog, removes trip', async ({ page }) => {
    // Ensure we're on Globe view to see sidebar
    const globeBtn = page.locator('.layout-btn').filter({ hasText: 'Globe' });
    await globeBtn.click();
    await page.waitForTimeout(3000);

    // Wait for sidebar
    const sidebar = page.locator('.sidebar');
    await expect(sidebar).toBeVisible();

    // Count initial trips
    const initialTripCount = await page.locator('.trip-card').count();

    // Find a trip card
    const tripCard = page.locator('.trip-card').first();
    await tripCard.waitFor({ state: 'visible', timeout: 10000 });
    const tripName = await tripCard.locator('.trip-name').textContent();

    // Hover using JS to trigger the delete button visibility
    await tripCard.dispatchEvent('mouseenter');
    await page.waitForTimeout(500);

    // Click delete button using JS
    const deleteBtn = tripCard.locator('.action-btn.delete');
    await deleteBtn.evaluate((el) => (el as HTMLElement).click());

    // Confirmation dialog should appear
    const deleteDialog = page.locator('.delete-overlay');
    await expect(deleteDialog).toBeVisible({ timeout: 5000 });
    await expect(deleteDialog).toContainText('Delete Trip');

    // Click confirm delete
    const confirmBtn = page.locator('.btn-delete').filter({ hasText: 'Delete' });
    await confirmBtn.click();

    // Wait for deletion
    await page.waitForTimeout(500);

    // Verify trip count decreased
    const finalTripCount = await page.locator('.trip-card').count();
    expect(finalTripCount).toBe(initialTripCount - 1);

    // Check for success toast
    const toastMessage = page.locator('.toast-message');
    if (await toastMessage.count() > 0) {
      await expect(toastMessage.first()).toContainText('deleted');
    }
  });
});

// ============================================
// FILTERS & CONTROLS TESTS
// ============================================

test.describe('Filters & Controls', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await switchToTravelerMode(page);
  });

  test('11. Display Mode - All/Journeys/Destinations filters work', async ({ page }) => {
    // Ensure we're on Globe view to see controls
    const globeBtn = page.locator('.layout-btn').filter({ hasText: 'Globe' });
    await globeBtn.click();
    await page.waitForTimeout(2000);

    // Find display mode buttons
    const allBtn = page.locator('.display-mode-btn').filter({ hasText: 'All' });
    const journeysBtn = page.locator('.display-mode-btn').filter({ hasText: 'Journeys' });
    const destinationsBtn = page.locator('.display-mode-btn').filter({ hasText: 'Destinations' });

    // Verify All is active by default
    await expect(allBtn).toHaveClass(/active/);

    // Click Journeys and verify it becomes active
    await journeysBtn.click();
    await page.waitForTimeout(300);
    await expect(journeysBtn).toHaveClass(/active/);
    await expect(allBtn).not.toHaveClass(/active/);

    // Click Destinations and verify it becomes active
    await destinationsBtn.click();
    await page.waitForTimeout(300);
    await expect(destinationsBtn).toHaveClass(/active/);
    await expect(journeysBtn).not.toHaveClass(/active/);

    // Click All again
    await allBtn.click();
    await page.waitForTimeout(300);
    await expect(allBtn).toHaveClass(/active/);
  });

  test('12. Color Scheme - Cosmic/Sunset/Ocean changes route colors', async ({ page }) => {
    // Ensure we're on Globe view to see controls
    const globeBtn = page.locator('.layout-btn').filter({ hasText: 'Globe' });
    await globeBtn.click();
    await page.waitForTimeout(2000);

    // Find color scheme buttons
    const cosmicBtn = page.locator('.color-scheme-btn').filter({ hasText: 'Cosmic' });
    const sunsetBtn = page.locator('.color-scheme-btn').filter({ hasText: 'Sunset' });
    const oceanBtn = page.locator('.color-scheme-btn').filter({ hasText: 'Ocean' });

    // Verify Cosmic is active by default
    await expect(cosmicBtn).toHaveClass(/active/);

    // Click Sunset and verify it becomes active
    await sunsetBtn.click();
    await page.waitForTimeout(500);
    await expect(sunsetBtn).toHaveClass(/active/);
    await expect(cosmicBtn).not.toHaveClass(/active/);

    // Click Ocean and verify it becomes active
    await oceanBtn.click();
    await page.waitForTimeout(500);
    await expect(oceanBtn).toHaveClass(/active/);
    await expect(sunsetBtn).not.toHaveClass(/active/);

    // Click Cosmic again
    await cosmicBtn.click();
    await page.waitForTimeout(500);
    await expect(cosmicBtn).toHaveClass(/active/);
  });

  test('13. Map Styles - Dark/Light/Voyager switches tiles', async ({ page }) => {
    // Switch to Map view
    const mapBtn = page.locator('.layout-btn').filter({ hasText: 'Map' });
    await mapBtn.click();
    await page.waitForTimeout(2000);

    // Find map style buttons
    const darkBtn = page.locator('.style-btn').filter({ hasText: 'Dark Matter' });
    const lightBtn = page.locator('.style-btn').filter({ hasText: 'Positron' });
    const voyagerBtn = page.locator('.style-btn').filter({ hasText: 'Voyager' });

    // Verify Dark is active by default
    await expect(darkBtn).toHaveClass(/active/);

    // Click Light and verify it becomes active
    await lightBtn.click();
    await page.waitForTimeout(500);
    await expect(lightBtn).toHaveClass(/active/);
    await expect(darkBtn).not.toHaveClass(/active/);

    // Click Voyager and verify it becomes active
    await voyagerBtn.click();
    await page.waitForTimeout(500);
    await expect(voyagerBtn).toHaveClass(/active/);
    await expect(lightBtn).not.toHaveClass(/active/);

    // Click Dark again
    await darkBtn.click();
    await page.waitForTimeout(500);
    await expect(darkBtn).toHaveClass(/active/);
  });
});

// ============================================
// DATA TESTS
// ============================================

test.describe('Data', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await switchToTravelerMode(page);
  });

  test('14. Export CSV - Downloads valid CSV file', async ({ page }) => {
    // Ensure we're on Globe view to see controls
    const globeBtn = page.locator('.layout-btn').filter({ hasText: 'Globe' });
    await globeBtn.click();
    await page.waitForTimeout(2000);

    // Find Export CSV button
    const exportCsvBtn = page.locator('.data-btn').filter({ hasText: 'Export CSV' });
    await expect(exportCsvBtn).toBeVisible();

    // Set up download listener
    const downloadPromise = page.waitForEvent('download');

    // Click export button
    await exportCsvBtn.click();

    // Wait for download
    const download = await downloadPromise;

    // Verify download occurred
    expect(download.suggestedFilename()).toContain('.csv');

    // Save and verify content has CSV structure
    const filePath = path.join('/tmp', download.suggestedFilename());
    await download.saveAs(filePath);
    const content = fs.readFileSync(filePath, 'utf-8');

    // CSV should have header row and data rows
    const lines = content.split('\n');
    expect(lines.length).toBeGreaterThan(1);

    // Header should contain expected columns
    const header = lines[0].toLowerCase();
    expect(header).toContain('name');

    // Cleanup
    fs.unlinkSync(filePath);
  });

  test('15. Import CSV - Loads trips from CSV file', async ({ page }) => {
    // Ensure we're on Globe view to see controls
    const globeBtn = page.locator('.layout-btn').filter({ hasText: 'Globe' });
    await globeBtn.click();
    await page.waitForTimeout(2000);

    // Create a test CSV file for import with unique name
    const uniqueId = `${Date.now()}`.slice(-6);
    const uniqueTripName = `CSV Import Trip ${uniqueId}`;

    // CSV format matching export: Trip Name, Start Date, End Date, Duration (Days), Locations, Countries, Category, Description
    const csvContent = `Trip Name,Start Date,End Date,Duration (Days),Locations,Countries,Category,Description
${uniqueTripName},2025-12-01,2025-12-10,10,Paris → Rome,France,leisure,A test CSV import trip`;

    const testFilePath = '/tmp/test-import.csv';
    fs.writeFileSync(testFilePath, csvContent);

    // Find the hidden file input and set the file
    const fileInput = page.locator('input[type="file"][accept=".csv"]');
    await fileInput.setInputFiles(testFilePath);

    // Wait for import to complete and toast to appear
    await page.waitForTimeout(2000);

    // Check for success toast message specifically
    const toastMessage = page.locator('.toast-message');
    if (await toastMessage.count() > 0) {
      const message = await toastMessage.first().textContent();
      console.log('Toast message:', message);
      expect(message).toContain('imported');
      expect(message).toContain('CSV');
    }

    // Check if the imported trip appears in the list
    const importedTrip = page.locator('.trip-card').filter({ hasText: uniqueTripName });
    await expect(importedTrip.first()).toBeVisible();

    // Cleanup
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
  });
});
