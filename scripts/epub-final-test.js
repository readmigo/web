const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  console.log('Navigating to reader...');
  await page.goto('https://web.readmigo.app/read/bcd814ba-3945-403f-b232-e88d732a981a', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(15000);

  // Check iframe dimensions
  const info = await page.evaluate(() => {
    const iframes = document.querySelectorAll('iframe');
    return Array.from(iframes).map(iframe => ({
      width: iframe.getBoundingClientRect().width,
      height: iframe.getBoundingClientRect().height,
    }));
  });
  console.log('Iframe dimensions:', JSON.stringify(info));

  // Take screenshot of page 1
  await page.screenshot({ path: '/tmp/epub-final-page1.png', fullPage: false });
  console.log('Page 1 saved');

  // Navigate to next page
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/tmp/epub-final-page2.png', fullPage: false });
  console.log('Page 2 saved');

  // Navigate more
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/tmp/epub-final-page3.png', fullPage: false });
  console.log('Page 3 saved');

  // Test TOC panel - click the TOC button (list icon in toolbar)
  const tocButton = await page.$('button:has(svg)');
  // Try to find the TOC toggle button by looking for the list icon
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const ariaLabel = await btn.getAttribute('aria-label');
    const text = await btn.innerText();
    if (ariaLabel?.includes('目录') || ariaLabel?.includes('toc') || text.includes('目录')) {
      await btn.click();
      break;
    }
  }
  await page.waitForTimeout(1000);

  // Try keyboard shortcut for TOC
  await page.keyboard.press('t');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/epub-final-toc.png', fullPage: false });
  console.log('TOC screenshot saved');

  await browser.close();
  console.log('Done');
})();
