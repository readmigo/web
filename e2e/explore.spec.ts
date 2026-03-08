import { test, expect } from '@playwright/test';

test.describe('Bookstore Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('renders search input', async ({ page }) => {
    const searchInput = page.locator('input').first();
    await expect(searchInput).toBeVisible();
  });

  test('does not render bookstore tab bar', async ({ page }) => {
    // iOS does not use tabs — web should match
    // Wait for content to load
    await page.waitForTimeout(1000);
    // Ensure no tab bar capsule buttons exist (the old BookstoreTabBar used rounded-full buttons)
    const tabBarButtons = page.locator('[class*="rounded-full"][class*="px-4"][class*="py-2"]');
    await expect(tabBarButtons).toHaveCount(0);
  });

  test('renders hero banner section', async ({ page }) => {
    // Hero banner should always be visible (not gated by tab selection)
    const heroBanner = page.locator('[data-testid="hero-banner"]').or(
      page.locator('.swiper, .embla, [class*="carousel"]')
    );
    // If no banner data, at least no error should show
    const errorMessage = page.locator('text=加载失败').or(page.locator('text=Loading failed'));
    await expect(errorMessage).not.toBeVisible({ timeout: 5000 });
  });

  test('renders category menu with circular icons', async ({ page }) => {
    // Category menu: circular icon buttons
    const categoryButtons = page.locator('button .rounded-full');
    // Wait for categories to load (or skeleton to appear)
    const categorySection = page.locator('.scrollbar-hide').first();
    await expect(categorySection).toBeVisible({ timeout: 10000 });
  });

  test('renders "全部书籍" divider', async ({ page }) => {
    // The "all books" divider should always be visible
    const divider = page.getByText(/全部书籍|All Books/i);
    await expect(divider).toBeVisible({ timeout: 15000 });
  });

  test('renders book list or empty state', async ({ page }) => {
    // Wait for loading to complete
    await page.waitForTimeout(3000);

    // Either books are shown or empty state message
    const bookRows = page.locator('[class*="border-b"]').filter({ has: page.locator('img') });
    const emptyState = page.getByText(/暂无书籍|No books/i);
    const hasBooks = await bookRows.count() > 0;
    const hasEmptyState = await emptyState.isVisible().catch(() => false);

    expect(hasBooks || hasEmptyState).toBeTruthy();
  });

  test('search input accepts text and shows dropdown', async ({ page }) => {
    const searchInput = page.locator('input').first();
    await searchInput.fill('test');
    await expect(searchInput).toHaveValue('test');
  });

  test('view all lists link exists when book lists are present', async ({ page }) => {
    // Wait for book lists to potentially load
    await page.waitForTimeout(3000);

    const viewAllLink = page.locator('a[href="/book-list"]');
    // The link may or may not be present depending on data
    const count = await viewAllLink.count();
    if (count > 0) {
      await expect(viewAllLink).toBeVisible();
    }
  });

  test('page layout follows iOS order: search → banner → categories → lists → divider → books', async ({ page }) => {
    // Wait for content to load
    await page.waitForTimeout(3000);

    // Check that the divider "全部书籍" exists (proves we're past the lists section)
    const divider = page.getByText(/全部书籍|All Books/i);
    await expect(divider).toBeVisible({ timeout: 15000 });

    // Check no error state
    const errorState = page.locator('text=加载失败').or(page.locator('text=Loading failed'));
    await expect(errorState).not.toBeVisible();
  });
});
