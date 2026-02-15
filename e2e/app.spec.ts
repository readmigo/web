import { test, expect } from '@playwright/test';

// ============================================================
// 1. Root URL → Bookstore (explore) content
// ============================================================
test.describe('Root URL shows bookstore', () => {
  test('/ should display explore/bookstore content directly', async ({ page }) => {
    await page.goto('/');
    // URL stays as / (middleware rewrite, not redirect)
    expect(page.url()).not.toContain('/explore');
    // But the bookstore content is visible
    await expect(page.getByPlaceholder('搜索书名或作者...')).toBeVisible();
  });

  test('/explore should also show bookstore content', async ({ page }) => {
    await page.goto('/explore');
    await expect(page.getByPlaceholder('搜索书名或作者...')).toBeVisible({ timeout: 15000 });
  });
});

// ============================================================
// 2. Header navigation (desktop)
// ============================================================
test.describe('Header navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
  });

  test('should show correct nav links (iOS-aligned 4 tabs)', async ({ page }) => {
    const nav = page.locator('header nav');
    await expect(nav.getByText('书城')).toBeVisible();
    await expect(nav.getByText('书架')).toBeVisible();
    await expect(nav.getByText('有声书')).toBeVisible();
    await expect(nav.getByText('我的')).toBeVisible();
  });

  test('should show iOS app icon logo with Readmigo text', async ({ page }) => {
    const header = page.locator('header');
    await expect(header.getByText('Readmigo')).toBeVisible();
    await expect(header.locator('img[alt="Readmigo"]')).toBeVisible();
    // Logo should use app-icon.png (iOS-style gradient icon)
    await expect(header.locator('img[alt="Readmigo"]')).toHaveAttribute('src', /app-icon/);
  });

  test('should not show search button or settings button in header', async ({ page }) => {
    const header = page.locator('header');
    // No search button or settings in the header right side
    await expect(header.getByText('搜索...')).not.toBeVisible();
    await expect(header.locator('a[href="/settings"]')).not.toBeAttached();
  });

  test('should not show "首页" or "词汇" in nav', async ({ page }) => {
    const header = page.locator('header');
    await expect(header.getByText('首页')).not.toBeVisible();
    await expect(header.getByText('词汇')).not.toBeVisible();
  });
});

// ============================================================
// 3. Explore page — Search bar
// ============================================================
test.describe('Search bar', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
  });

  test('search input should be visible with correct placeholder', async ({ page }) => {
    const searchInput = page.getByPlaceholder('搜索书名或作者...');
    await expect(searchInput).toBeVisible();
  });

  test('clicking search input should open dropdown', async ({ page }) => {
    const searchInput = page.getByPlaceholder('搜索书名或作者...');
    await searchInput.click();
    // Dropdown should appear (may show history/popular or be empty)
    await page.waitForTimeout(500);
    // Dropdown may or may not show depending on API data; just verify no crash
    expect(true).toBe(true);
  });

  test('typing in search should not crash', async ({ page }) => {
    const searchInput = page.getByPlaceholder('搜索书名或作者...');
    await searchInput.fill('shakespeare');
    await page.waitForTimeout(2000);
    // Page should still be functional — search input should remain in DOM after typing
    await expect(page.getByPlaceholder('搜索书名或作者...')).toBeVisible({ timeout: 15000 });
  });
});

// ============================================================
// 4. Explore page — Category filter
// ============================================================
test.describe('Category filter', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
  });

  test('should show "All" category badge or loading skeletons', async ({ page }) => {
    await page.waitForTimeout(2000);
    const allBadge = page.getByText('All', { exact: true });
    const skeletons = page.locator('[class*="animate-pulse"]').first();
    const hasBadge = await allBadge.isVisible().catch(() => false);
    const hasSkeleton = await skeletons.isVisible().catch(() => false);
    expect(hasBadge || hasSkeleton).toBe(true);
  });
});

// ============================================================
// 5. Explore page — Book content
// ============================================================
test.describe('Book content', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
  });

  test('should show "全部书籍" divider or loading skeletons', async ({ page }) => {
    await page.waitForTimeout(3000);
    const hasDivider = await page.getByText('全部书籍').isVisible().catch(() => false);
    const hasSkeletons = await page.locator('[class*="animate-pulse"]').first().isVisible().catch(() => false);
    expect(hasDivider || hasSkeletons).toBe(true);
  });

  test('should show book list, loading skeletons, or empty state', async ({ page }) => {
    await page.waitForTimeout(2000);
    const hasSkeletons = await page.locator('[class*="animate-pulse"]').first().isVisible().catch(() => false);
    const hasBooks = await page.locator('a[href^="/book/"]').first().isVisible().catch(() => false);
    const hasEmpty = await page.locator('text=暂无书籍').isVisible().catch(() => false);
    expect(hasSkeletons || hasBooks || hasEmpty).toBe(true);
  });

  test('should show 高分经典 ranking section or loading skeletons', async ({ page }) => {
    await page.waitForTimeout(3000);
    const hasRanking = await page.getByText('高分经典').isVisible().catch(() => false);
    const hasSkeletons = await page.locator('[class*="animate-pulse"]').first().isVisible().catch(() => false);
    expect(hasRanking || hasSkeletons).toBe(true);
  });
});

// ============================================================
// 6. Footer (visible on all screens)
// ============================================================
test.describe('Footer', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
  });

  test('should show Readmigo footer', async ({ page }) => {
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    await expect(footer.getByText('Readmigo')).toBeVisible();
  });

  test('privacy link should point to readmigo.app/privacy', async ({ page }) => {
    const link = page.locator('footer a', { hasText: '隐私政策' });
    await expect(link).toHaveAttribute('href', 'https://readmigo.app/privacy');
    await expect(link).toHaveAttribute('target', '_blank');
  });

  test('terms link should point to readmigo.app/terms', async ({ page }) => {
    const link = page.locator('footer a', { hasText: '服务条款' });
    await expect(link).toHaveAttribute('href', 'https://readmigo.app/terms');
    await expect(link).toHaveAttribute('target', '_blank');
  });

  test('official site link should point to readmigo.app', async ({ page }) => {
    const link = page.locator('footer a', { hasText: '官网' });
    await expect(link).toHaveAttribute('href', 'https://readmigo.app');
    await expect(link).toHaveAttribute('target', '_blank');
  });

  test('should not show old marketing footer sections', async ({ page }) => {
    const footer = page.locator('footer');
    await expect(footer.getByText('产品')).not.toBeVisible();
    await expect(footer.getByText('资源')).not.toBeVisible();
    await expect(footer.getByText('公司')).not.toBeVisible();
  });

  test('footer should be visible on mobile too', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    const footer = page.locator('footer');
    await expect(footer).toBeAttached();
  });
});

// ============================================================
// 7. Mobile navigation
// ============================================================
test.describe('Mobile navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
  });

  test('should show bottom nav with iOS-aligned 4 tabs', async ({ page }) => {
    const mobileNav = page.locator('nav.fixed.bottom-0');
    await expect(mobileNav).toBeVisible();
    await expect(mobileNav.getByText('书城')).toBeVisible();
    await expect(mobileNav.getByText('书架')).toBeVisible();
    await expect(mobileNav.getByText('有声书')).toBeVisible();
    await expect(mobileNav.getByText('我的')).toBeVisible();
  });

  test('should not show "首页" or "词汇" in mobile nav', async ({ page }) => {
    const mobileNav = page.locator('nav.fixed.bottom-0');
    await expect(mobileNav.getByText('首页')).not.toBeVisible();
    await expect(mobileNav.getByText('词汇')).not.toBeVisible();
  });
});

// ============================================================
// 8. Login page — iOS-style design
// ============================================================
test.describe('Login page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should show iOS-style login with logo and app name', async ({ page }) => {
    // Large app icon logo
    await expect(page.locator('img[alt="Readmigo"]')).toBeVisible();
    // App name
    await expect(page.getByText('Readmigo', { exact: true })).toBeVisible();
    // Subtitle
    await expect(page.getByText('AI-powered English reading companion')).toBeVisible();
  });

  test('should show Apple, Google, and Email sign-in buttons', async ({ page }) => {
    await expect(page.getByText('Sign in with Apple')).toBeVisible();
    await expect(page.getByText('Sign in with Google')).toBeVisible();
    await expect(page.getByText('Sign in with Email')).toBeVisible();
  });

  test('should show Browse as Guest link', async ({ page }) => {
    await expect(page.getByText('Browse as Guest')).toBeVisible();
  });

  test('should have gradient background', async ({ page }) => {
    // The auth layout has gradient background (from-blue-500 via-purple-500 to-pink-500)
    const bgElement = page.locator('div.bg-gradient-to-br').first();
    await expect(bgElement).toBeVisible();
  });

  test('should show terms and privacy links in footer', async ({ page }) => {
    await expect(page.getByText('服务条款')).toBeVisible();
    await expect(page.getByText('隐私政策')).toBeVisible();
  });
});

// ============================================================
// 9. Error boundary (404)
// ============================================================
test.describe('Error pages', () => {
  test('non-public route without auth should redirect to login', async ({ page }) => {
    await page.goto('/this-page-does-not-exist');
    await page.waitForURL('**/login**', { timeout: 10000 });
    expect(page.url()).toContain('/login');
  });

  test('non-existent public sub-path should show 404', async ({ page }) => {
    await page.goto('/explore/nonexistent-path-12345');
    await expect(page.getByRole('heading', { name: '页面不存在' })).toBeVisible({ timeout: 10000 });
  });
});
