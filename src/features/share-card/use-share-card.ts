'use client';

import { useState, useCallback, useRef } from 'react';
import type { ShareCardTheme, ShareCardContent } from './types';
import { SHARE_CARD_THEMES } from './types';

interface UseShareCardOptions {
  content: ShareCardContent;
}

export interface UseShareCardReturn {
  theme: ShareCardTheme;
  setTheme: (theme: ShareCardTheme) => void;
  cardRef: React.RefObject<HTMLDivElement | null>;
  copyText: () => Promise<void>;
  saveAsImage: () => Promise<void>;
  shareCard: () => Promise<void>;
  canShare: boolean;
  isSaving: boolean;
}

/**
 * Draws the share card onto a canvas and returns it.
 * Uses the Canvas 2D API to avoid adding external dependencies.
 */
async function renderCardToCanvas(
  cardEl: HTMLDivElement,
  theme: ShareCardTheme,
  content: ShareCardContent,
): Promise<HTMLCanvasElement> {
  const CARD_W = 750;
  const CARD_H = 1000;
  const PADDING = 60;
  const cfg = SHARE_CARD_THEMES[theme];

  const canvas = document.createElement('canvas');
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  // --- Background ---
  ctx.fillStyle = cfg.backgroundColor;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // Subtle inner gradient overlay for depth
  const grad = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
  grad.addColorStop(0, 'rgba(255,255,255,0.08)');
  grad.addColorStop(1, 'rgba(0,0,0,0.06)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // Thin accent border (left edge)
  ctx.fillStyle = cfg.accentColor;
  ctx.fillRect(PADDING - 20, PADDING, 4, CARD_H - PADDING * 2);

  // --- Opening quotation mark ---
  ctx.font = `bold 120px Georgia, serif`;
  ctx.fillStyle = cfg.accentColor;
  ctx.globalAlpha = 0.6;
  ctx.fillText('\u201C', PADDING, PADDING + 90);
  ctx.globalAlpha = 1;

  // --- Quote text ---
  const text = content.text;
  const charCount = text.length;
  let fontSize = 36;
  if (charCount > 200) fontSize = 26;
  else if (charCount > 100) fontSize = 30;
  else if (charCount > 60) fontSize = 34;

  ctx.font = `italic ${fontSize}px Georgia, serif`;
  ctx.fillStyle = cfg.textColor;

  const maxWidth = CARD_W - PADDING * 2 - 20;
  const lineHeight = fontSize * 1.6;
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);

  const textBlockStart = PADDING + 120;
  lines.forEach((line, i) => {
    ctx.fillText(line, PADDING + 4, textBlockStart + i * lineHeight);
  });

  const textBlockEnd = textBlockStart + lines.length * lineHeight;

  // --- Divider ---
  const dividerY = textBlockEnd + 30;
  ctx.strokeStyle = cfg.accentColor;
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PADDING, dividerY);
  ctx.lineTo(CARD_W - PADDING, dividerY);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // --- Author & Book ---
  let metaY = dividerY + 40;
  if (content.author) {
    ctx.font = `600 28px -apple-system, sans-serif`;
    ctx.fillStyle = cfg.textColor;
    ctx.fillText(`\u2014 ${content.author}`, PADDING, metaY);
    metaY += 40;
  }
  if (content.bookTitle) {
    ctx.font = `22px -apple-system, sans-serif`;
    ctx.fillStyle = cfg.secondaryColor;
    // Truncate long titles
    let title = content.bookTitle;
    while (ctx.measureText(title).width > maxWidth && title.length > 10) {
      title = title.slice(0, -1);
    }
    if (title !== content.bookTitle) title += '\u2026';
    ctx.fillText(title, PADDING, metaY);
  }

  // --- Watermark ---
  ctx.font = `600 22px -apple-system, sans-serif`;
  ctx.fillStyle = cfg.accentColor;
  ctx.globalAlpha = 0.7;
  ctx.fillText('Readmigo', CARD_W - PADDING - ctx.measureText('Readmigo').width, CARD_H - PADDING);
  ctx.globalAlpha = 1;

  return canvas;
}

export function useShareCard({ content }: UseShareCardOptions): UseShareCardReturn {
  const [theme, setTheme] = useState<ShareCardTheme>('light');
  const [isSaving, setIsSaving] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const canShare = typeof navigator !== 'undefined' && Boolean(navigator.share);

  const buildShareText = useCallback((): string => {
    const parts: string[] = [`\u201C${content.text}\u201D`];
    if (content.author) parts.push(`\u2014 ${content.author}`);
    if (content.bookTitle) parts.push(content.bookTitle);
    parts.push('via Readmigo');
    return parts.join('\n');
  }, [content]);

  const copyText = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(buildShareText());
    } catch {
      // Silently fail — caller can show toast if needed
    }
  }, [buildShareText]);

  const saveAsImage = useCallback(async () => {
    if (!cardRef.current) return;
    setIsSaving(true);
    try {
      const canvas = await renderCardToCanvas(cardRef.current, theme, content);
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = 'readmigo-quote.png';
      a.click();
    } catch (err) {
      console.error('Failed to save image:', err);
    } finally {
      setIsSaving(false);
    }
  }, [cardRef, theme, content]);

  const shareCard = useCallback(async () => {
    if (!canShare) return;
    try {
      await navigator.share({ text: buildShareText() });
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Share failed:', err);
      }
    }
  }, [canShare, buildShareText]);

  return {
    theme,
    setTheme,
    cardRef,
    copyText,
    saveAsImage,
    shareCard,
    canShare,
    isSaving,
  };
}
