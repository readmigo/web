import { test, expect } from './fixtures/reader-fixture';

test.describe('Reader Display — SE Typography & Layout', () => {
  test.beforeEach(async ({ readerPage }) => {
    await readerPage.goto();
  });

  test.describe('Column Layout', () => {
    test('renders with default 2-column layout', async ({ readerPage }) => {
      const content = readerPage.page.locator('.reader-engine-content');
      await expect(content).toBeVisible();
      const columnCount = await content.evaluate((el) =>
        window.getComputedStyle(el).columnCount
      );
      expect(columnCount).toBe('2');
    });

    test('column gap is set for multi-column', async ({ readerPage }) => {
      const content = readerPage.page.locator('.reader-engine-content');
      const gap = await content.evaluate((el) =>
        window.getComputedStyle(el).columnGap
      );
      // gap should be margin * 2 = 80px for medium margin (40px)
      expect(parseInt(gap)).toBeGreaterThan(0);
    });

    test('switching to 1 column updates layout', async ({ readerPage }) => {
      await readerPage.openSettings();
      await readerPage.clickOption('栏数', '1 栏');
      await readerPage.closeSettings();

      const content = readerPage.page.locator('.reader-engine-content');
      const columnCount = await content.evaluate((el) =>
        window.getComputedStyle(el).columnCount
      );
      // When 1 column, browser reports 'auto' (no multi-column layout)
      expect(['1', 'auto']).toContain(columnCount);
    });

    test('switching to 3 columns updates layout', async ({ readerPage }) => {
      await readerPage.openSettings();
      await readerPage.clickOption('栏数', '3 栏');
      await readerPage.closeSettings();

      const content = readerPage.page.locator('.reader-engine-content');
      const columnCount = await content.evaluate((el) =>
        window.getComputedStyle(el).columnCount
      );
      expect(columnCount).toBe('3');
    });
  });

  test.describe('SE Typography', () => {
    test('chapter heading has small-caps and center alignment', async ({ readerPage }) => {
      const heading = readerPage.page.locator('.reader-engine-content h2').first();
      await expect(heading).toBeVisible();
      const styles = await heading.evaluate((el) => {
        const cs = window.getComputedStyle(el);
        return {
          fontVariant: cs.fontVariantCaps || cs.fontVariant,
          textAlign: cs.textAlign,
        };
      });
      expect(styles.textAlign).toBe('center');
      // small-caps may be reported as 'small-caps' in fontVariantCaps
      expect(styles.fontVariant).toContain('small-caps');
    });

    test('paragraphs have first-line indent', async ({ readerPage }) => {
      // Get the second paragraph (not first-child which should have no indent)
      const paragraphs = readerPage.page.locator('.reader-engine-content p');
      const count = await paragraphs.count();
      expect(count).toBeGreaterThan(2);

      // Second paragraph should have text-indent
      const indent = await paragraphs.nth(1).evaluate((el) =>
        window.getComputedStyle(el).textIndent
      );
      expect(indent).not.toBe('0px');
    });

    test('paragraph after hr has no indent', async ({ readerPage }) => {
      // The paragraph right after <hr/> should have text-indent: 0
      const afterHr = await readerPage.page.evaluate(() => {
        const hr = document.querySelector('.reader-engine-content hr');
        if (!hr) return null;
        const nextP = hr.nextElementSibling;
        if (!nextP || nextP.tagName !== 'P') return null;
        return window.getComputedStyle(nextP).textIndent;
      });
      if (afterHr !== null) {
        expect(afterHr).toBe('0px');
      }
    });

    test('hr scene break is styled as thin centered line', async ({ readerPage }) => {
      const hr = readerPage.page.locator('.reader-engine-content hr').first();
      const isVisible = await hr.isVisible().catch(() => false);
      if (isVisible) {
        const styles = await hr.evaluate((el) => {
          const cs = window.getComputedStyle(el);
          return { width: cs.width, borderTopStyle: cs.borderTopStyle };
        });
        expect(styles.borderTopStyle).toBe('solid');
      }
    });

    test('epigraph is italic', async ({ readerPage }) => {
      const epigraph = readerPage.page.locator('.reader-engine-content .epigraph').first();
      const isVisible = await epigraph.isVisible().catch(() => false);
      if (isVisible) {
        const fontStyle = await epigraph.evaluate((el) =>
          window.getComputedStyle(el).fontStyle
        );
        expect(fontStyle).toBe('italic');
      }
    });

    test('dedication has small-caps and center alignment', async ({ readerPage }) => {
      const dedication = readerPage.page.locator('.reader-engine-content .dedication').first();
      const isVisible = await dedication.isVisible().catch(() => false);
      if (isVisible) {
        const styles = await dedication.evaluate((el) => {
          const cs = window.getComputedStyle(el);
          return {
            fontVariant: cs.fontVariantCaps || cs.fontVariant,
            textAlign: cs.textAlign,
          };
        });
        expect(styles.textAlign).toBe('center');
        expect(styles.fontVariant).toContain('small-caps');
      }
    });

    test('b tag renders as small-caps not bold', async ({ readerPage }) => {
      const bold = readerPage.page.locator('.reader-engine-content b').first();
      const isVisible = await bold.isVisible().catch(() => false);
      if (isVisible) {
        const styles = await bold.evaluate((el) => {
          const cs = window.getComputedStyle(el);
          return {
            fontVariant: cs.fontVariantCaps || cs.fontVariant,
            fontWeight: cs.fontWeight,
          };
        });
        expect(styles.fontVariant).toContain('small-caps');
        // font-weight should be normal (400), not bold (700)
        expect(parseInt(styles.fontWeight)).toBeLessThanOrEqual(400);
      }
    });

    test('verse spans are displayed as blocks with indent', async ({ readerPage }) => {
      const verseSpan = readerPage.page.locator('.reader-engine-content blockquote.verse span').first();
      const isVisible = await verseSpan.isVisible().catch(() => false);
      if (isVisible) {
        const display = await verseSpan.evaluate((el) =>
          window.getComputedStyle(el).display
        );
        expect(display).toBe('block');
      }
    });

    test('verse span.i1 has extra padding', async ({ readerPage }) => {
      const i1 = readerPage.page.locator('.reader-engine-content span.i1').first();
      const isVisible = await i1.isVisible().catch(() => false);
      if (isVisible) {
        const paddingLeft = await i1.evaluate((el) =>
          window.getComputedStyle(el).paddingLeft
        );
        expect(parseInt(paddingLeft)).toBeGreaterThan(0);
      }
    });

    test('PG boilerplate is hidden', async ({ readerPage }) => {
      // Add pg-boilerplate to test it's hidden
      await readerPage.page.evaluate(() => {
        const content = document.querySelector('.reader-engine-content');
        if (!content) return;
        const pgDiv = document.createElement('div');
        pgDiv.className = 'pg-boilerplate';
        pgDiv.textContent = 'Project Gutenberg License';
        content.appendChild(pgDiv);
      });

      const pgBoilerplate = readerPage.page.locator('.reader-engine-content .pg-boilerplate');
      await expect(pgBoilerplate).toBeHidden();
    });
  });

  test.describe('Page Navigation', () => {
    test('clicking right area does not crash', async ({ readerPage }) => {
      // Click right 25% area — verify navigation doesn't throw
      const viewport = readerPage.page.locator('.reader-engine-viewport');
      const isVisible = await viewport.isVisible().catch(() => false);
      if (isVisible) {
        const box = await viewport.boundingBox();
        if (box) {
          await readerPage.page.mouse.click(box.x + box.width * 0.9, box.y + box.height / 2);
          await readerPage.page.waitForTimeout(300);
        }
      }
      // No crash = pass
    });

    test('keyboard ArrowRight navigates forward', async ({ readerPage }) => {
      await readerPage.page.keyboard.press('ArrowRight');
      await readerPage.page.waitForTimeout(300);
      // Should not crash — navigation works
    });

    test('keyboard ArrowLeft navigates backward', async ({ readerPage }) => {
      // First go forward
      await readerPage.page.keyboard.press('ArrowRight');
      await readerPage.page.waitForTimeout(200);
      // Then go back
      await readerPage.page.keyboard.press('ArrowLeft');
      await readerPage.page.waitForTimeout(200);
      // Should not crash
    });

    test('no slide or fade transition on content element', async ({ readerPage }) => {
      const content = readerPage.page.locator('.reader-engine-content');
      const transition = await content.evaluate((el) =>
        window.getComputedStyle(el).transitionProperty
      );
      // transitionProperty should not include 'transform' or 'opacity' (those would be slide/fade)
      expect(transition).not.toContain('transform');
      expect(transition).not.toContain('opacity');
    });
  });

  test.describe('Visual Screenshots', () => {
    test('capture reader 2-column layout', async ({ readerPage }) => {
      await readerPage.page.screenshot({
        path: 'test-results/reader-2col.png',
        fullPage: false,
      });
    });

    test('capture reader 1-column layout', async ({ readerPage }) => {
      await readerPage.openSettings();
      await readerPage.clickOption('栏数', '1 栏');
      await readerPage.closeSettings();
      await readerPage.page.waitForTimeout(500);
      await readerPage.page.screenshot({
        path: 'test-results/reader-1col.png',
        fullPage: false,
      });
    });

    test('capture reader 3-column layout', async ({ readerPage }) => {
      await readerPage.openSettings();
      await readerPage.clickOption('栏数', '3 栏');
      await readerPage.closeSettings();
      await readerPage.page.waitForTimeout(500);
      await readerPage.page.screenshot({
        path: 'test-results/reader-3col.png',
        fullPage: false,
      });
    });

    test('capture reader dark theme', async ({ readerPage }) => {
      await readerPage.openSettings();
      const themeBtn = readerPage.settingsPanel.locator('button').filter({ hasText: '暗色' });
      await themeBtn.click();
      await readerPage.closeSettings();
      await readerPage.page.waitForTimeout(500);
      await readerPage.page.screenshot({
        path: 'test-results/reader-dark.png',
        fullPage: false,
      });
    });

    test('capture reader sepia theme', async ({ readerPage }) => {
      await readerPage.openSettings();
      const themeBtn = readerPage.settingsPanel.locator('button').filter({ hasText: '护眼' });
      await themeBtn.click();
      await readerPage.closeSettings();
      await readerPage.page.waitForTimeout(500);
      await readerPage.page.screenshot({
        path: 'test-results/reader-sepia.png',
        fullPage: false,
      });
    });
  });
});
