import { test, expect } from './fixtures/reader-fixture';

test.describe('Reader Settings Panel', () => {
  test.beforeEach(async ({ readerPage }) => {
    await readerPage.goto();
    await readerPage.openSettings();
  });

  test.describe('Panel interaction', () => {
    test('opens settings panel via toolbar gear icon', async ({ readerPage }) => {
      await expect(readerPage.settingsPanel).toBeVisible();
    });

    test('closes settings panel via backdrop click', async ({ readerPage }) => {
      await readerPage.closeSettings();
      await expect(readerPage.settingsPanel).not.toBeVisible();
    });

    test('closes settings panel via X button', async ({ readerPage }) => {
      const closeButton = readerPage.settingsPanel.locator('button').filter({
        has: readerPage.page.locator('svg.lucide-x'),
      });
      await closeButton.click();
      await expect(readerPage.settingsPanel).not.toBeVisible();
    });
  });

  test.describe('Basic settings', () => {
    test('font size increases from 26px to 28px when clicking +', async ({ readerPage }) => {
      const value = await readerPage.getSettingValue('字体大小');
      expect(value).toBe('26px');
      await readerPage.clickFontSizeButton('increase');
      const updated = await readerPage.getSettingValue('字体大小');
      expect(updated).toBe('28px');
    });

    test('font size decreases from 26px to 24px when clicking -', async ({ readerPage }) => {
      await readerPage.clickFontSizeButton('decrease');
      const updated = await readerPage.getSettingValue('字体大小');
      expect(updated).toBe('24px');
    });

    test('line height default shows 1.6', async ({ readerPage }) => {
      const value = await readerPage.getSettingValue('行距');
      expect(value).toBe('1.6');
    });

    test('font family switches to 无衬线', async ({ readerPage }) => {
      await readerPage.clickOption('字体', '无衬线');
      const selected = await readerPage.isOptionSelected('字体', '无衬线');
      expect(selected).toBe(true);
    });

    test('theme switches to 暗色', async ({ readerPage }) => {
      const themeBtn = readerPage.settingsPanel.locator('button').filter({ hasText: '暗色' });
      await themeBtn.click();
      await expect(themeBtn).toHaveClass(/border-primary/);
    });

    test('margin switches to 宽', async ({ readerPage }) => {
      await readerPage.clickOption('边距', '宽');
      const selected = await readerPage.isOptionSelected('边距', '宽');
      expect(selected).toBe(true);
    });
  });

  test.describe('Typography settings', () => {
    test('text align switches to 左对齐', async ({ readerPage }) => {
      await readerPage.clickOption('文本对齐', '左对齐');
      const selected = await readerPage.isOptionSelected('文本对齐', '左对齐');
      expect(selected).toBe(true);
    });

    test('hyphenation toggles from 开启 to 关闭', async ({ readerPage }) => {
      const section = readerPage.settingsPanel.locator('.space-y-3').filter({ hasText: '连字符' });
      const toggleBtn = section.getByRole('button', { name: '开启' });
      await toggleBtn.click();
      await expect(section.getByRole('button', { name: '关闭' })).toBeVisible();
    });

    test('font weight switches to 粗', async ({ readerPage }) => {
      await readerPage.clickOption('字重', '粗');
      const selected = await readerPage.isOptionSelected('字重', '粗');
      expect(selected).toBe(true);
    });

    test('column count switches to 2 栏', async ({ readerPage }) => {
      await readerPage.clickOption('栏数', '2 栏');
      const selected = await readerPage.isOptionSelected('栏数', '2 栏');
      expect(selected).toBe(true);
    });
  });

  test.describe('Slider settings', () => {
    test('letter spacing changes from default 0.0px', async ({ readerPage }) => {
      const initial = await readerPage.getSettingValue('字间距');
      expect(initial).toBe('0.0px');
      // step=0.5, press ArrowRight 3 times → 1.5px
      await readerPage.adjustSlider('字间距', 3);
      const updated = await readerPage.getSettingValue('字间距');
      expect(updated).not.toBe('0.0px');
    });

    test('word spacing changes from default 0px', async ({ readerPage }) => {
      const initial = await readerPage.getSettingValue('词间距');
      expect(initial).toBe('0px');
      // step=1, press ArrowRight 3 times → 3px
      await readerPage.adjustSlider('词间距', 3);
      const updated = await readerPage.getSettingValue('词间距');
      expect(updated).not.toBe('0px');
    });

    test('paragraph spacing changes from default 12px', async ({ readerPage }) => {
      const initial = await readerPage.getSettingValue('段间距');
      expect(initial).toBe('12px');
      // step=2, press ArrowRight 3 times → 18px
      await readerPage.adjustSlider('段间距', 3);
      const updated = await readerPage.getSettingValue('段间距');
      expect(updated).not.toBe('12px');
    });

    test('text indent changes from default 0.0em', async ({ readerPage }) => {
      const initial = await readerPage.getSettingValue('首行缩进');
      expect(initial).toBe('0.0em');
      // step=0.5, press ArrowRight 3 times → 1.5em
      await readerPage.adjustSlider('首行缩进', 3);
      const updated = await readerPage.getSettingValue('首行缩进');
      expect(updated).not.toBe('0.0em');
    });
  });

  test.describe('Appearance mode', () => {
    test('switches to 浅色 mode', async ({ readerPage }) => {
      await readerPage.clickOption('外观模式', '浅色');
      const selected = await readerPage.isOptionSelected('外观模式', '浅色');
      expect(selected).toBe(true);
    });

    test('switches to 深色 mode', async ({ readerPage }) => {
      await readerPage.clickOption('外观模式', '深色');
      const selected = await readerPage.isOptionSelected('外观模式', '深色');
      expect(selected).toBe(true);
    });

    test('default is 跟随系统', async ({ readerPage }) => {
      const selected = await readerPage.isOptionSelected('外观模式', '跟随系统');
      expect(selected).toBe(true);
    });
  });

  test.describe('Persistence', () => {
    test('font size persists after page reload', async ({ readerPage }) => {
      await readerPage.clickFontSizeButton('increase');
      const updated = await readerPage.getSettingValue('字体大小');
      expect(updated).toBe('28px');

      // Verify settings are persisted in localStorage (Zustand persist middleware)
      const stored = await readerPage.page.evaluate(() => {
        const raw = localStorage.getItem('reader-storage');
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed?.state?.settings?.fontSize;
      });
      expect(stored).toBe(28);

      // Reload and verify the settings panel still shows updated value
      await readerPage.page.reload();
      await readerPage.waitForReady();
      await readerPage.openSettings();

      const persisted = await readerPage.getSettingValue('字体大小');
      expect(persisted).toBe('28px');
    });
  });

  test.describe('Reset', () => {
    test('reset restores all settings to defaults', async ({ readerPage }) => {
      // Change multiple settings
      await readerPage.clickFontSizeButton('increase');
      await readerPage.clickOption('字体', '无衬线');
      await readerPage.clickOption('边距', '宽');
      await readerPage.clickOption('文本对齐', '左对齐');

      // Click reset
      await readerPage.resetSettings();

      // Verify all returned to defaults
      const fontSize = await readerPage.getSettingValue('字体大小');
      expect(fontSize).toBe('26px');

      const fontSelected = await readerPage.isOptionSelected('字体', '衬线');
      expect(fontSelected).toBe(true);

      const marginSelected = await readerPage.isOptionSelected('边距', '中');
      expect(marginSelected).toBe(true);

      const alignSelected = await readerPage.isOptionSelected('文本对齐', '两端');
      expect(alignSelected).toBe(true);
    });
  });
});
