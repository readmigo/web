import DOMPurify, { type Config } from 'isomorphic-dompurify';

const SANITIZE_CONFIG: Config = {
  ALLOWED_TAGS: [
    'p',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'span',
    'div',
    'em',
    'strong',
    'a',
    'img',
    'ul',
    'ol',
    'li',
    'br',
    'blockquote',
    'table',
    'thead',
    'tbody',
    'tr',
    'td',
    'th',
    'pre',
    'code',
    'sup',
    'sub',
    'hr',
    'figure',
    'figcaption',
    'b',
    'i',
    'u',
    'small',
    'abbr',
    'cite',
    'dl',
    'dt',
    'dd',
    'ruby',
    'rt',
    'rp',
  ],
  ALLOWED_ATTR: [
    'href',
    'src',
    'alt',
    'title',
    'target',
    'rel',
    'class',
    'id',
    'lang',
    'dir',
    'width',
    'height',
    'colspan',
    'rowspan',
  ],
  FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'textarea', 'select', 'button', 'style', 'link', 'meta'],
  FORBID_ATTR: ['onerror', 'onclick', 'onload', 'onmouseover', 'onfocus', 'onblur', 'onsubmit', 'onchange', 'oninput', 'onkeydown', 'onkeyup', 'onkeypress'],
  ALLOW_DATA_ATTR: false,
};

/**
 * Sanitize untrusted HTML to prevent XSS attacks.
 * Allows basic content tags (p, headings, lists, tables, etc.)
 * and strips scripts, iframes, forms, event handlers, and other dangerous elements.
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, SANITIZE_CONFIG) as string;
}
