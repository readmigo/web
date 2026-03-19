import { test as base, expect, type Page } from '@playwright/test';

const TEST_BOOK_ID = 'pagination-book-001';

// Generate enough content to span multiple pages
function generateLongHtml(): string {
  const paragraphs: string[] = [];
  for (let i = 0; i < 60; i++) {
    paragraphs.push(
      `<p>Paragraph ${i + 1}: In my younger and more vulnerable years my father gave me some advice ` +
      `that I have been turning over in my mind ever since. Whenever you feel like criticizing anyone, ` +
      `just remember that all the people in this world have not had the advantages that you have had. ` +
      `He did not say any more, but we have always been unusually communicative in a reserved way, ` +
      `and I understood that he meant a great deal more than that.</p>`
    );
  }
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body><h2>Chapter 1</h2>${paragraphs.join('\n')}</body></html>`;
}

const LONG_HTML = generateLongHtml();

const MOCK_BOOK = {
  id: TEST_BOOK_ID,
  title: 'Pagination Test Book',
  author: 'Test Author',
  coverUrl: '',
  description: 'Book for pagination testing',
  language: 'en',
  category: 'fiction',
  wordCount: 50000,
  epubUrl: '',
  estimatedReadTime: 120,
  tags: [],
  chapters: [
    { id: 'ch-1', title: 'Chapter 1', href: 'ch-1', order: 1, wordCount: 5000 },
  ],
};

interface PaginationFixtures {
  readerPage: Page;
}

const test = base.extend<PaginationFixtures>({
  readerPage: async ({ page }, use) => {
    // Mock all API routes
    await page.route(`**/api/proxy/books/${TEST_BOOK_ID}`, async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_BOOK) });
    });
    await page.route(`**/api/proxy/books/${TEST_BOOK_ID}/content/**`, async (route) => {
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({
          id: 'ch-1', title: 'Chapter 1', order: 1,
          contentUrl: 'https://cdn.readmigo.app/test/chapters/ch-1.html',
          wordCount: 5000, previousChapterId: null, nextChapterId: null,
        }),
      });
    });
    await page.route('https://cdn.readmigo.app/test/**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'text/html', body: LONG_HTML });
    });
    await page.route('**/api/proxy/reading/highlights**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) });
    });
    await page.route('**/api/proxy/reading/bookmarks**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) });
    });
    await page.route('**/api/proxy/reading/progress', async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify({ success: true }) });
    });
    await page.route('**/api/auth/session', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
    });
    await page.route(`**/api/proxy/books/${TEST_BOOK_ID}/bilingual/**`, async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: null }) });
    });

    await page.addInitScript(() => {
      localStorage.setItem('hasSeenReaderGuide', 'true');
      localStorage.setItem('readmigo_onboarding_completed', 'true');
    });

    await page.goto(`/read/${TEST_BOOK_ID}`);
    await page.waitForSelector('.reader-engine-content', { timeout: 15000 });
    await page.waitForTimeout(500);

    await use(page);
  },
});

/** Get visible paragraph texts within the viewport */
async function getVisibleParagraphs(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const content = document.querySelector('.reader-engine-content');
    const viewport = document.querySelector('.reader-engine-viewport');
    if (!content || !viewport) return [];
    const vRect = viewport.getBoundingClientRect();
    const paragraphs = content.querySelectorAll('p');
    const visible: string[] = [];
    for (const p of paragraphs) {
      const pRect = p.getBoundingClientRect();
      // Paragraph is visible if it overlaps with viewport
      if (pRect.right > vRect.left && pRect.left < vRect.right &&
          pRect.bottom > vRect.top && pRect.top < vRect.bottom) {
        visible.push((p.textContent || '').substring(0, 40));
      }
    }
    return visible;
  });
}

test.describe('Reader Pagination — No Blank Pages', () => {
  test('content is visible after forward page turn', async ({ readerPage: page }) => {
    const initialTexts = await getVisibleParagraphs(page);
    expect(initialTexts.length).toBeGreaterThan(0);

    // Navigate forward
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(300);

    const afterTexts = await getVisibleParagraphs(page);
    // Must have visible content (not blank)
    expect(afterTexts.length, 'Page 2 should have visible paragraphs').toBeGreaterThan(0);
    // Content should differ from page 1
    expect(afterTexts[0]).not.toBe(initialTexts[0]);
  });

  test('multiple forward page turns all show content', async ({ readerPage: page }) => {
    for (let turn = 1; turn <= 5; turn++) {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(200);

      const texts = await getVisibleParagraphs(page);
      expect(texts.length, `Page ${turn + 1} should have visible paragraphs`).toBeGreaterThan(0);
    }
  });

  test('clicking right navigation area shows content', async ({ readerPage: page }) => {
    // The right click area is the right 25% of the reader area
    const viewport = await page.locator('.reader-engine-viewport').boundingBox();
    expect(viewport).not.toBeNull();

    await page.mouse.click(viewport!.x + viewport!.width * 0.9, viewport!.y + viewport!.height / 2);
    await page.waitForTimeout(300);

    const texts = await getVisibleParagraphs(page);
    expect(texts.length, 'After click navigation, content should be visible').toBeGreaterThan(0);
  });

  test('forward then backward navigation shows content', async ({ readerPage: page }) => {
    // Go forward 3 pages
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(200);
    }

    // Go back 2 pages
    for (let i = 0; i < 2; i++) {
      await page.keyboard.press('ArrowLeft');
      await page.waitForTimeout(200);
    }

    const texts = await getVisibleParagraphs(page);
    expect(texts.length, 'After forward+backward nav, content should be visible').toBeGreaterThan(0);
  });

  test('content element does not have overflow:hidden', async ({ readerPage: page }) => {
    const overflow = await page.evaluate(() => {
      const el = document.querySelector('.reader-engine-content');
      return el ? window.getComputedStyle(el).overflow : null;
    });
    expect(overflow).not.toBe('hidden');
  });
});
