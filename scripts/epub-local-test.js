const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  const errors = [];
  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error') errors.push(text);
    // Log any message that mentions our patch
    if (text.includes('Constrain') || text.includes('max-width')) {
      console.log('PATCH LOG:', text);
    }
  });

  console.log('Navigating to LOCAL reader...');
  await page.goto('http://localhost:3001/read/bcd814ba-3945-403f-b232-e88d732a981a', { waitUntil: 'networkidle', timeout: 60000 });
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

  // Check if our patch CSS is in the iframe
  const frames = await page.frames();
  for (const frame of frames) {
    if (frame === page.mainFrame()) continue;
    const patchCheck = await frame.evaluate(() => {
      const styles = document.querySelectorAll('style');
      const allCSS = [];
      for (const s of styles) {
        if (s.textContent.includes('max-width')) {
          allCSS.push(s.textContent.substring(0, 200));
        }
      }
      // Check all images
      const imgs = document.querySelectorAll('img');
      const imgStyles = [];
      for (const img of imgs) {
        const cs = window.getComputedStyle(img);
        imgStyles.push({
          maxWidth: cs.maxWidth,
          width: cs.width,
          naturalWidth: img.naturalWidth,
          renderedWidth: img.getBoundingClientRect().width,
        });
      }
      return {
        styleTags: allCSS,
        imgStyles,
        bodyScrollWidth: document.body.scrollWidth,
        htmlWidth: document.documentElement.style.width || window.getComputedStyle(document.documentElement).width,
        viewportWidth: window.innerWidth,
      };
    }).catch(e => ({ error: e.message }));
    console.log('Iframe patch check:', JSON.stringify(patchCheck, null, 2));
  }

  await page.screenshot({ path: '/tmp/epub-local-page1.png', fullPage: false });
  console.log('Page 1 saved');

  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/tmp/epub-local-page2.png', fullPage: false });
  console.log('Page 2 saved');

  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/tmp/epub-local-page3.png', fullPage: false });
  console.log('Page 3 saved');

  console.log('Errors:', errors.filter(e => !e.includes('404') && !e.includes('403') && !e.includes('500')).slice(0, 5));

  await browser.close();
  console.log('Done');
})();
