import { test, expect } from './fixtures/reader-fixture';

test('settings panel shows column count option', async ({ readerPage }) => {
  await readerPage.goto();
  await readerPage.openSettings();

  // Check if column count section is visible (may need scroll)
  const columnSection = readerPage.settingsPanel.locator('.space-y-3').filter({ hasText: '栏数' });

  // First check if it exists in DOM
  const exists = await columnSection.count();
  console.log('Column section exists:', exists > 0);

  if (exists > 0) {
    // Scroll into view
    await columnSection.scrollIntoViewIfNeeded();
    await expect(columnSection).toBeVisible();

    // Check all 3 buttons
    const btn1 = columnSection.getByRole('button', { name: '1 栏' });
    const btn2 = columnSection.getByRole('button', { name: '2 栏' });
    const btn3 = columnSection.getByRole('button', { name: '3 栏' });

    await expect(btn1).toBeVisible();
    await expect(btn2).toBeVisible();
    await expect(btn3).toBeVisible();

    console.log('All 3 column buttons visible');

    // Screenshot
    await readerPage.page.screenshot({ path: 'test-results/settings-columns.png' });
  } else {
    // Check scroll area
    const scrollArea = readerPage.settingsPanel.locator('.overflow-y-auto');
    const info = await scrollArea.evaluate(el => ({
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
      overflowY: window.getComputedStyle(el).overflowY,
    }));
    console.log('Scroll area info:', JSON.stringify(info));
    throw new Error('Column section not found in settings panel');
  }
});
