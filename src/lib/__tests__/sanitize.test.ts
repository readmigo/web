import { describe, it, expect } from 'vitest';
import { sanitizeHtml } from '../sanitize';

describe('sanitizeHtml', () => {
  it('strips script tags', () => {
    const input = '<p>Hello</p><script>alert("xss")</script>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('<script');
    expect(result).not.toContain('alert');
    expect(result).toContain('<p>Hello</p>');
  });

  it('allows basic HTML tags', () => {
    const input = '<h1>Title</h1><p>Paragraph with <strong>bold</strong> and <em>italic</em></p>';
    const result = sanitizeHtml(input);
    expect(result).toContain('<h1>');
    expect(result).toContain('<p>');
    expect(result).toContain('<strong>');
    expect(result).toContain('<em>');
  });

  it('removes event handlers', () => {
    const input = '<p onclick="alert(1)" onmouseover="steal()">Text</p>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('onclick');
    expect(result).not.toContain('onmouseover');
    expect(result).toContain('<p>Text</p>');
  });
});
