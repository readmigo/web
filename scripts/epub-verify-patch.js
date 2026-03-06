const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ bypassCSP: true });
  const page = await context.newPage();

  console.log('Navigating to reader...');
  await page.goto('https://web.readmigo.app/read/bcd814ba-3945-403f-b232-e88d732a981a', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(12000);

  // Check if the patch CSS is present in the iframe
  const frames = await page.frames();
  for (const frame of frames) {
    if (frame === page.mainFrame()) continue;
    const check = await frame.evaluate(() => {
      // Look for our patch: img max-width rule added via addStylesheetRules
      const styles = document.querySelectorAll('style');
      const matchingStyles = [];
      for (const s of styles) {
        if (s.textContent.includes('max-width') && s.textContent.includes('important')) {
          matchingStyles.push(s.textContent.substring(0, 500));
        }
      }

      // Check image constraints
      const imgs = document.querySelectorAll('img');
      const imgInfo = [];
      for (const img of imgs) {
        const cs = window.getComputedStyle(img);
        imgInfo.push({
          naturalWidth: img.naturalWidth,
          renderedWidth: img.getBoundingClientRect().width,
          maxWidth: cs.maxWidth,
          computedWidth: cs.width,
        });
      }

      // Check column settings
      const body = document.body;
      const bodyCS = window.getComputedStyle(body);
      const html = document.documentElement;
      const htmlCS = window.getComputedStyle(html);

      return {
        patchStyles: matchingStyles,
        imgInfo,
        bodyWidth: bodyCS.width,
        htmlWidth: htmlCS.width,
        columnWidth: bodyCS.columnWidth || htmlCS.columnWidth,
        bodyScrollWidth: body.scrollWidth,
        iframeWidth: window.innerWidth,
      };
    }).catch(e => ({ error: e.message }));
    console.log('Patch verification:', JSON.stringify(check, null, 2));
  }

  await page.screenshot({ path: '/tmp/epub-patch-verify.png', fullPage: false });
  console.log('Screenshot saved');

  await browser.close();
  console.log('Done');
})();
