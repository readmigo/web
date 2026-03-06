const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Navigating to reader...');
  await page.goto('https://web.readmigo.app/read/bcd814ba-3945-403f-b232-e88d732a981a', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(15000);

  const frames = await page.frames();
  for (const frame of frames) {
    if (frame === page.mainFrame()) continue;
    const check = await frame.evaluate(() => {
      // Check ALL style elements (both textContent and cssRules)
      const styles = document.querySelectorAll('style');
      const styleInfo = [];
      for (const s of styles) {
        const rules = [];
        try {
          for (const rule of s.sheet.cssRules) {
            if (rule.cssText.includes('max-width') || rule.cssText.includes('img') || rule.cssText.includes('svg')) {
              rules.push(rule.cssText);
            }
          }
        } catch(e) { rules.push('error: ' + e.message); }
        if (rules.length > 0) {
          styleInfo.push({ textContentLen: s.textContent.length, rules });
        }
      }

      // Check computed styles on all images
      const imgs = document.querySelectorAll('img');
      const imgInfo = [];
      for (const img of imgs) {
        const cs = window.getComputedStyle(img);
        const parent = img.parentElement;
        const parentCS = parent ? window.getComputedStyle(parent) : null;
        imgInfo.push({
          naturalWidth: img.naturalWidth,
          renderedWidth: img.getBoundingClientRect().width,
          maxWidth: cs.maxWidth,
          width: cs.width,
          display: cs.display,
          parentTag: parent ? parent.tagName : null,
          parentWidth: parentCS ? parentCS.width : null,
          parentMaxWidth: parentCS ? parentCS.maxWidth : null,
          inlineStyle: img.getAttribute('style') || 'none',
        });
      }

      // Check body/html dimensions and column settings
      const body = document.body;
      const bodyCS = window.getComputedStyle(body);
      const html = document.documentElement;
      const htmlCS = window.getComputedStyle(html);

      // Check Range-based text width (same as epubjs textWidth())
      const range = document.createRange();
      range.selectNodeContents(body);
      const rect = range.getBoundingClientRect();

      // Check body children widths
      const children = Array.from(body.children).slice(0, 5);
      const childInfo = children.map(ch => ({
        tag: ch.tagName,
        width: ch.getBoundingClientRect().width,
        scrollWidth: ch.scrollWidth,
        className: ch.className,
      }));

      return {
        styleRules: styleInfo,
        imgInfo,
        bodyWidth: bodyCS.width,
        bodyColumnWidth: bodyCS.columnWidth,
        bodyOverflow: bodyCS.overflowY,
        bodyPadding: `${bodyCS.paddingLeft} ${bodyCS.paddingRight}`,
        htmlWidth: htmlCS.width,
        htmlStyleWidth: html.style.width,
        iframeInnerWidth: window.innerWidth,
        rangeTextWidth: rect.width,
        bodyScrollWidth: body.scrollWidth,
        childInfo,
      };
    }).catch(e => ({ error: e.message }));
    console.log(JSON.stringify(check, null, 2));
  }

  await page.screenshot({ path: '/tmp/epub-deep-diag.png', fullPage: false });
  console.log('Done');
  await browser.close();
})();
