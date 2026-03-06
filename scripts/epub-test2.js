const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ bypassCSP: false });
  const page = await context.newPage();

  // Clear cache
  await context.clearCookies();

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  console.log('Navigating to reader...');
  await page.goto('https://web.readmigo.app/read/bcd814ba-3945-403f-b232-e88d732a981a', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(10000);

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
  await page.screenshot({ path: '/tmp/epub-v4-page1.png', fullPage: false });
  console.log('Page 1 saved');

  // Press right
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/tmp/epub-v4-page2.png', fullPage: false });
  console.log('Page 2 saved');

  // Check iframe after nav
  const frames = await page.frames();
  for (const frame of frames) {
    if (frame === page.mainFrame()) continue;
    const content = await frame.evaluate(() => {
      return {
        bodyScrollWidth: document.body.scrollWidth,
        htmlWidth: document.documentElement.style.width || window.getComputedStyle(document.documentElement).width,
        viewportWidth: window.innerWidth,
        contentPreview: document.body.innerText.substring(0, 200),
      };
    }).catch(e => ({ error: e.message }));
    console.log('Iframe after nav:', JSON.stringify(content, null, 2));
  }

  // Navigate more
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/tmp/epub-v4-page3.png', fullPage: false });
  console.log('Page 3 saved');

  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/tmp/epub-v4-page4.png', fullPage: false });
  console.log('Page 4 saved');

  if (errors.length > 0) {
    console.log('Errors:', errors.slice(0, 5));
  }

  await browser.close();
  console.log('Done');
})();
