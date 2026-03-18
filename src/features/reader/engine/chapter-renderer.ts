import { sanitizeHtml } from '@/lib/sanitize';
import type { ReaderSettings } from './types';
import { generateBaseCSS } from './styles/base-styles';
import { generateSETypography } from './styles/se-typography';

export class ChapterRenderer {
  private root: HTMLElement;
  private settings: ReaderSettings;
  private styleEl: HTMLStyleElement | null = null;
  private viewport: HTMLDivElement | null = null;
  private content: HTMLDivElement | null = null;

  constructor(root: HTMLElement, settings: ReaderSettings) {
    this.root = root;
    this.settings = settings;
  }

  render(html: string): void {
    this.clear();

    this.styleEl = document.createElement('style');
    this.styleEl.textContent = generateBaseCSS(this.settings) + generateSETypography(this.settings);

    this.viewport = document.createElement('div');
    this.viewport.className = 'reader-engine-viewport';
    this.viewport.style.position = 'absolute';
    this.viewport.style.inset = '0';
    this.viewport.style.overflow = 'hidden';
    this.viewport.style.touchAction = 'none';

    this.content = document.createElement('div');
    this.content.className = 'reader-engine-content';
    // HTML is sanitized via sanitizeHtml before DOM insertion - safe against XSS
    const sanitized = sanitizeHtml(html);
    // eslint-disable-next-line no-unsanitized/property -- sanitized by sanitizeHtml above
    this.content.innerHTML = sanitized;

    this.viewport.appendChild(this.content);
    this.root.appendChild(this.styleEl);
    this.root.appendChild(this.viewport);
  }

  updateSettings(settings: ReaderSettings): void {
    this.settings = settings;
    if (this.styleEl) {
      this.styleEl.textContent = generateBaseCSS(this.settings) + generateSETypography(this.settings);
    }
  }

  clear(): void {
    // Clearing root by removing all children (safe - no untrusted content)
    while (this.root.firstChild) {
      this.root.removeChild(this.root.firstChild);
    }
    this.styleEl = null;
    this.viewport = null;
    this.content = null;
  }

  get contentElement(): HTMLDivElement | null {
    return this.content;
  }

  get viewportElement(): HTMLDivElement | null {
    return this.viewport;
  }
}
