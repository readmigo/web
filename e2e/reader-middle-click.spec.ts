import { test, expect } from './fixtures/reader-fixture';

test.describe('Reader middle-area click toggles controls', () => {
  test.beforeEach(async ({ readerPage }) => {
    // Skip onboarding overlay and reader guide
    await readerPage.page.addInitScript(() => {
      localStorage.setItem('readmigo_onboarding_completed', 'true');
      localStorage.setItem('hasSeenReaderGuide', 'true');
    });
    await readerPage.goto();
  });

  test('clicking middle area shows toolbar, not translation popup', async ({ readerPage }) => {
    const { page } = readerPage;

    // Get the reader container
    const readerContainer = page.locator('.relative.flex-1').first();
    await expect(readerContainer).toBeVisible();
    const box = await readerContainer.boundingBox();
    expect(box).toBeTruthy();

    // Toolbar should be hidden initially
    const toolbar = page.locator('[data-testid="reader-toolbar"]');
    await expect(toolbar).toHaveClass(/-translate-y-full/);

    // Click the exact center of the reader area
    const centerX = box!.x + box!.width / 2;
    const centerY = box!.y + box!.height / 2;
    await page.mouse.click(centerX, centerY);

    // Toolbar should become visible
    await expect(toolbar).toHaveClass(/translate-y-0/, { timeout: 3000 });

    // Wait past the paragraph click timer (350ms) to ensure no translation sheet opens
    await page.waitForTimeout(500);
    const translationSheet = page.locator('[role="dialog"]');
    await expect(translationSheet).not.toBeVisible();
  });

  test('clicking middle area again hides toolbar', async ({ readerPage }) => {
    const { page } = readerPage;

    const readerContainer = page.locator('.relative.flex-1').first();
    const box = await readerContainer.boundingBox();
    expect(box).toBeTruthy();

    const toolbar = page.locator('[data-testid="reader-toolbar"]');
    const centerX = box!.x + box!.width / 2;
    const centerY = box!.y + box!.height / 2;

    // First click — show toolbar
    await page.mouse.click(centerX, centerY);
    await expect(toolbar).toHaveClass(/translate-y-0/, { timeout: 3000 });

    // Second click — hide toolbar
    await page.mouse.click(centerX, centerY);
    await expect(toolbar).toHaveClass(/-translate-y-full/, { timeout: 3000 });
  });

  test('clicking left side does NOT show toolbar', async ({ readerPage }) => {
    const { page } = readerPage;

    const readerContainer = page.locator('.relative.flex-1').first();
    const box = await readerContainer.boundingBox();
    expect(box).toBeTruthy();

    const toolbar = page.locator('[data-testid="reader-toolbar"]');

    // Click on left edge (10% of width) — page navigation zone
    const leftX = box!.x + box!.width * 0.1;
    const centerY = box!.y + box!.height / 2;
    await page.mouse.click(leftX, centerY);

    // Toolbar should stay hidden
    await page.waitForTimeout(500);
    await expect(toolbar).toHaveClass(/-translate-y-full/);
  });
});
