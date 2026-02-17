import { test as base, expect, type Page, type Locator } from '@playwright/test';
import { TEST_BOOK_ID, MOCK_BOOK_DETAIL, MOCK_CHAPTER_CONTENT, MOCK_CHAPTER_HTML } from './mock-data';

interface ReaderFixtures {
  readerPage: ReaderPage;
}

class ReaderPage {
  readonly page: Page;
  readonly settingsPanel: Locator;
  readonly settingsButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.settingsPanel = page.locator('.fixed.inset-y-0.right-0.z-50.w-80');
    // Settings gear icon button in toolbar
    this.settingsButton = page.locator('button').filter({ has: page.locator('svg.lucide-settings') });
  }

  async goto() {
    await this.page.goto(`/read/${TEST_BOOK_ID}`);
    await this.waitForReady();
  }

  /** Wait for the reader page to finish loading */
  async waitForReady() {
    // Wait for loading indicator to disappear
    await expect(this.page.locator('text=正在加载书籍')).not.toBeVisible({ timeout: 15000 });
    // Small delay for rendering to settle
    await this.page.waitForTimeout(500);
  }

  async openSettings() {
    // The toolbar should be visible in non-focus mode
    await this.settingsButton.click({ timeout: 5000 });
    await expect(this.settingsPanel).toBeVisible();
  }

  async closeSettings() {
    // Click the backdrop overlay
    await this.page.locator('.fixed.inset-0.z-40').click();
    await expect(this.settingsPanel).not.toBeVisible();
  }

  /** Get the displayed value text next to a setting label */
  async getSettingValue(label: string): Promise<string> {
    const section = this.settingsPanel.locator('.space-y-3').filter({ hasText: label });
    return (await section.locator('.text-muted-foreground').textContent()) ?? '';
  }

  /** Click a segmented button option within a settings section */
  async clickOption(sectionLabel: string, optionText: string) {
    const section = this.settingsPanel.locator('.space-y-3').filter({ hasText: sectionLabel });
    await section.getByRole('button', { name: optionText, exact: true }).click();
  }

  /** Check if a button in a section has the 'secondary' variant (selected state) */
  async isOptionSelected(sectionLabel: string, optionText: string): Promise<boolean> {
    const section = this.settingsPanel.locator('.space-y-3').filter({ hasText: sectionLabel });
    const button = section.getByRole('button', { name: optionText, exact: true });
    const className = await button.getAttribute('class') ?? '';
    return className.includes('secondary') || className.includes('border-primary');
  }

  /** Click the + or - button for font size */
  async clickFontSizeButton(action: 'increase' | 'decrease') {
    const section = this.settingsPanel.locator('.space-y-3').filter({ hasText: '字体大小' });
    if (action === 'increase') {
      await section.locator('button').filter({ has: this.page.locator('svg.lucide-plus') }).click();
    } else {
      await section.locator('button').filter({ has: this.page.locator('svg.lucide-minus') }).click();
    }
  }

  /** Click the reset button */
  async resetSettings() {
    await this.settingsPanel.getByRole('button', { name: '重置默认设置' }).click();
  }

  /** Adjust a slider by pressing ArrowRight multiple times on the slider thumb */
  async adjustSlider(sectionLabel: string, steps: number) {
    const section = this.settingsPanel.locator('.space-y-3').filter({ hasText: sectionLabel });
    const slider = section.locator('[role="slider"]');
    await slider.click();
    for (let i = 0; i < steps; i++) {
      await slider.press('ArrowRight');
    }
  }
}

export const test = base.extend<ReaderFixtures>({
  readerPage: async ({ page }, use) => {
    // Mock API routes — book detail
    await page.route('**/api/proxy/books/' + TEST_BOOK_ID, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_BOOK_DETAIL),
      });
    });

    // Mock chapter content metadata
    await page.route('**/api/proxy/books/' + TEST_BOOK_ID + '/content/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_CHAPTER_CONTENT),
      });
    });

    // Mock the chapter HTML content URL (uses cdn.readmigo.app which is in CSP connect-src)
    await page.route('https://cdn.readmigo.app/test/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: MOCK_CHAPTER_HTML,
      });
    });

    // Mock highlights and bookmarks (return empty arrays)
    await page.route('**/api/proxy/reading/highlights**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] }),
      });
    });

    await page.route('**/api/proxy/reading/bookmarks**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] }),
      });
    });

    // Mock reading progress
    await page.route('**/api/proxy/reading/progress', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({ status: 200, body: JSON.stringify({ success: true }) });
      } else {
        await route.continue();
      }
    });

    // Mock auth session (returns empty session to prevent 500 errors)
    await page.route('**/api/auth/session', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}),
      });
    });

    // Mock bilingual chapter (may be called)
    await page.route('**/api/proxy/books/' + TEST_BOOK_ID + '/bilingual/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: null }),
      });
    });

    const readerPage = new ReaderPage(page);
    await use(readerPage);
  },
});

export { expect } from '@playwright/test';
