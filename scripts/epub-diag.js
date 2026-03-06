const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('Navigating to reader...');
  await page.goto('https://web.readmigo.app/read/bcd814ba-3945-403f-b232-e88d732a981a', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(8000);

  const iframes = await page.frames();
  for (const frame of iframes) {
    if (frame === page.mainFrame()) continue;
    const details = await frame.evaluate(() => {
      const body = document.body;
      const html = document.documentElement;

      const images = Array.from(document.querySelectorAll('img, svg'));
      const imgInfo = images.map(img => {
        const rect = img.getBoundingClientRect();
        return {
          tag: img.tagName,
          width: rect.width,
          height: rect.height,
          naturalWidth: img.naturalWidth || 0,
          naturalHeight: img.naturalHeight || 0,
          src: img.src ? img.src.substring(0, 100) : '',
          className: (img.className || '').toString().substring(0, 100),
        };
      });

      const wideElements = [];
      const allElements = document.querySelectorAll('*');
      for (const el of allElements) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 1300) {
          wideElements.push({
            tag: el.tagName,
            className: (el.className || '').toString().substring(0, 80),
            width: rect.width,
            id: (el.id || '').substring(0, 50),
          });
        }
      }

      const relevantCSS = [];
      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules) {
            const text = rule.cssText;
            if (text.includes('column') || text.includes('max-width') || text.includes('overflow') || text.includes('img')) {
              relevantCSS.push(text.substring(0, 300));
            }
          }
        } catch(e) {}
      }

      return {
        images: imgInfo,
        wideElements: wideElements.slice(0, 10),
        relevantCSS: relevantCSS.slice(0, 20),
        bodyScrollWidth: body.scrollWidth,
        bodyClientWidth: body.clientWidth,
        htmlScrollWidth: html.scrollWidth,
        htmlClientWidth: html.clientWidth,
      };
    }).catch(e => ({ error: e.message }));
    console.log(JSON.stringify(details, null, 2));
  }

  await browser.close();
  console.log('Done');
})();
