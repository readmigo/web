import { useCallback, useRef, useEffect } from 'react';
import type { SelectedText } from '../types';

const LONG_PRESS_DELAY = 550;
const MOVE_THRESHOLD = 10;

// --- Paragraph helpers ---

function isEligibleParagraph(node: HTMLElement): boolean {
  if (!node.textContent?.trim()) return false;
  return !node.querySelector('img, svg, table, pre, code, iframe');
}

// --- Hook ---

export interface TranslationInteractionRefs {
  /** Ref to current bookId */
  bookIdRef: React.RefObject<string>;
  /** Ref that suppresses selection events after double-tap translation */
  suppressSelectionRef: React.MutableRefObject<boolean>;
}

/**
 * Returns a `setupInteractions` callback that wires long-press paragraph menu
 * and image click on a content element.
 *
 * The returned cleanup ref stores the latest teardown function so the caller
 * can dispose listeners when a new chapter loads.
 */
export function useTranslationInteraction(
  refs: TranslationInteractionRefs,
  onTextSelect?: (selection: SelectedText) => void,
  onParagraphClick?: (text: string) => void,
  onImageClick?: (images: string[], index: number) => void,
) {
  const cleanupRef = useRef<(() => void) | null>(null);

  const onTextSelectRef = useRef(onTextSelect);
  const onParagraphClickRef = useRef(onParagraphClick);
  const onImageClickRef = useRef(onImageClick);
  useEffect(() => { onTextSelectRef.current = onTextSelect; }, [onTextSelect]);
  useEffect(() => { onParagraphClickRef.current = onParagraphClick; }, [onParagraphClick]);
  useEffect(() => { onImageClickRef.current = onImageClick; }, [onImageClick]);

  // --- setupInteractions ---

  const setupInteractions = useCallback((contentEl: HTMLElement, _chapterOrder: number) => {
    // Touch & click interactions
    let longPressTimer: ReturnType<typeof setTimeout> | null = null;
    let longPressTriggered = false;
    let startX = 0;
    let startY = 0;
    let activeNode: HTMLElement | null = null;

    const cancelLongPress = () => {
      if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
      longPressTriggered = false;
    };

    const getParagraphFromTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return null;
      const node = target.closest('p, blockquote, figcaption') as HTMLElement | null;
      if (!node || !isEligibleParagraph(node)) return null;
      return node;
    };

    const openParagraphMenu = (node: HTMLElement) => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim()) return;
      const rect = node.getBoundingClientRect();
      onTextSelectRef.current?.({ text: node.textContent || '', rect, source: 'paragraph' });
    };

    const handlePointerDown = (event: PointerEvent) => {
      const node = getParagraphFromTarget(event.target);
      if (!node) return;
      activeNode = node;
      startX = event.clientX;
      startY = event.clientY;
      longPressTriggered = false;
      cancelLongPress();
      longPressTimer = setTimeout(() => {
        longPressTriggered = true;
        openParagraphMenu(node);
      }, LONG_PRESS_DELAY);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!longPressTimer) return;
      if (Math.abs(event.clientX - startX) > MOVE_THRESHOLD || Math.abs(event.clientY - startY) > MOVE_THRESHOLD) {
        cancelLongPress();
      }
    };

    const handlePointerUp = () => {
      if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
      if (!activeNode) return;
      if (longPressTriggered) { activeNode = null; return; }

      const tappedNode = activeNode;
      activeNode = null;
      onParagraphClickRef.current?.(tappedNode.textContent?.trim() || '');
    };

    const handleClick = (event: MouseEvent) => {
      if (event.button !== 0) return;
      const cRect = contentEl.getBoundingClientRect();
      const relX = event.clientX - cRect.left;
      if (relX > cRect.width / 3 && relX < (cRect.width * 2) / 3) return;
      const node = getParagraphFromTarget(event.target);
      if (!node) return;
      const selection = window.getSelection();
      if (selection && selection.toString().trim()) return;
      onParagraphClickRef.current?.(node.textContent?.trim() || '');
    };

    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim()) cancelLongPress();
    };

    // Image click — opens the full-screen viewer
    const handleImgClick = (event: MouseEvent) => {
      if (!(event.target instanceof HTMLImageElement)) return;
      const allImgs = Array.from(contentEl.querySelectorAll('img')) as HTMLImageElement[];
      const srcs = allImgs.map((img) => img.src).filter(Boolean);
      if (!srcs.length) return;
      const clickedSrc = (event.target as HTMLImageElement).src;
      const index = srcs.indexOf(clickedSrc);
      onImageClickRef.current?.(srcs, Math.max(0, index));
      event.stopPropagation();
    };

    contentEl.addEventListener('pointerdown', handlePointerDown);
    contentEl.addEventListener('pointermove', handlePointerMove);
    contentEl.addEventListener('pointerup', handlePointerUp);
    contentEl.addEventListener('pointercancel', handlePointerUp);
    contentEl.addEventListener('click', handleClick);
    contentEl.addEventListener('click', handleImgClick);
    document.addEventListener('selectionchange', handleSelectionChange);

    return () => {
      contentEl.removeEventListener('pointerdown', handlePointerDown);
      contentEl.removeEventListener('pointermove', handlePointerMove);
      contentEl.removeEventListener('pointerup', handlePointerUp);
      contentEl.removeEventListener('pointercancel', handlePointerUp);
      contentEl.removeEventListener('click', handleClick);
      contentEl.removeEventListener('click', handleImgClick);
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- refs are stable, listed for readability
  }, []);

  /** No-op for backwards compatibility. */
  const clearCaches = useCallback(() => {}, []);

  return { setupInteractions, cleanupRef, clearCaches };
}
