const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('Navigating to reader...');
  await page.goto('https://web.readmigo.app/read/bcd814ba-3945-403f-b232-e88d732a981a', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(10000);

  // Check iframe dimensions after re-expand
  const info = await page.evaluate(() => {
    const iframes = document.querySelectorAll('iframe');
    return Array.from(iframes).map(iframe => ({
      width: iframe.getBoundingClientRect().width,
      height: iframe.getBoundingClientRect().height,
    }));
  });
  console.log('Iframe dimensions:', JSON.stringify(info));

  // Take screenshot of page 1
  await page.screenshot({ path: '/tmp/epub-v3-page1.png', fullPage: false });
  console.log('Page 1 saved');

  // Press right
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/tmp/epub-v3-page2.png', fullPage: false });
  console.log('Page 2 saved');

  // Check iframe content
  const frames = await page.frames();
  for (const frame of frames) {
    if (frame === page.mainFrame()) continue;
    const content = await frame.evaluate(() => {
      return {
        bodyScrollWidth: document.body.scrollWidth,
        htmlWidth: document.documentElement.style.width,
        viewportWidth: window.innerWidth,
        contentPreview: document.body.innerText.substring(0, 300),
      };
    }).catch(e => ({ error: e.message }));
    console.log('Iframe after nav:', JSON.stringify(content, null, 2));
  }

  // Navigate more
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/tmp/epub-v3-page3.png', fullPage: false });
  console.log('Page 3 saved');

  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/tmp/epub-v3-page4.png', fullPage: false });
  console.log('Page 4 saved');

  await browser.close();
  console.log('Done');
})();
