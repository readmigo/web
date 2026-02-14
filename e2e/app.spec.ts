import { test, expect } from '@playwright/test';

test.describe('Homepage redirect', () => {
  test('should redirect / to /explore', async ({ page }) => {
    await page.goto('/');
    await page.waitForURL('**/explore');
    expect(page.url()).toContain('/explore');
  });
});

test.describe('Header navigation', () => {
  test('should show correct nav links on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/explore');

    const nav = page.locator('header nav');
    await expect(nav.getByText('探索')).toBeVisible();
    await expect(nav.getByText('书架')).toBeVisible();
    await expect(nav.getByText('词汇')).toBeVisible();
    await expect(nav.getByText('有声书')).toBeVisible();
  });

  test('should not show "首页" in nav', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/explore');

    const nav = page.locator('header nav');
    await expect(nav.getByText('首页')).not.toBeVisible();
  });

  test('should not show "登录" button in header', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/explore');

    const header = page.locator('header');
    await expect(header.getByText('登录')).not.toBeVisible();
  });
});

test.describe('Footer', () => {
  test('should show minimal footer on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/explore');

    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    await expect(footer.getByText('Readmigo')).toBeVisible();
  });

  test('privacy link should point to readmigo.app/privacy', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/explore');

    const link = page.locator('footer a', { hasText: '隐私政策' });
    await expect(link).toHaveAttribute('href', 'https://readmigo.app/privacy');
    await expect(link).toHaveAttribute('target', '_blank');
  });

  test('terms link should point to readmigo.app/terms', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/explore');

    const link = page.locator('footer a', { hasText: '服务条款' });
    await expect(link).toHaveAttribute('href', 'https://readmigo.app/terms');
    await expect(link).toHaveAttribute('target', '_blank');
  });

  test('official site link should point to readmigo.app', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/explore');

    const link = page.locator('footer a', { hasText: '官网' });
    await expect(link).toHaveAttribute('href', 'https://readmigo.app');
    await expect(link).toHaveAttribute('target', '_blank');
  });

  test('should not show old marketing footer sections', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/explore');

    const footer = page.locator('footer');
    await expect(footer.getByText('产品')).not.toBeVisible();
    await expect(footer.getByText('资源')).not.toBeVisible();
    await expect(footer.getByText('公司')).not.toBeVisible();
  });
});

test.describe('Mobile navigation', () => {
  test('should show bottom nav on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/explore');

    const mobileNav = page.locator('nav.fixed.bottom-0');
    await expect(mobileNav).toBeVisible();
    await expect(mobileNav.getByText('探索')).toBeVisible();
    await expect(mobileNav.getByText('书架')).toBeVisible();
    await expect(mobileNav.getByText('词汇')).toBeVisible();
    await expect(mobileNav.getByText('有声书')).toBeVisible();
  });

  test('should not show "首页" in mobile nav', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/explore');

    const mobileNav = page.locator('nav.fixed.bottom-0');
    await expect(mobileNav.getByText('首页')).not.toBeVisible();
  });
});
