import { useCallback, useRef, useEffect } from 'react';
import type { SelectedText, BilingualChapter } from '../types';
import { apiClient } from '@/lib/api/client';
import { log } from '@/lib/logger';
import { normalizeParagraphText, hashText } from '../utils/translation-hash';
import { useReaderStore } from '../stores/reader-store';

const LONG_PRESS_DELAY = 550;
const DOUBLE_TAP_DELAY = 300;
const MOVE_THRESHOLD = 10;

// --- Paragraph helpers ---

function isEligibleParagraph(node: HTMLElement): boolean {
  if (!node.textContent?.trim()) return false;
  return !node.querySelector('img, svg, table, pre, code, iframe');
}

function ensureParagraphHash(node: HTMLElement): string | null {
  if (node.dataset.textHash) return node.dataset.textHash;
  const normalized = normalizeParagraphText(node.textContent || '');
  if (!normalized) return null;
  const hash = hashText(normalized);
  node.dataset.textHash = hash;
  node.classList.add('rm-translation-paragraph');
  return hash;
}

function captureOriginalContent(node: HTMLElement) {
  if (!node.dataset.originalHtml) node.dataset.originalHtml = node.textContent || '';
  if (!node.dataset.originalText) node.dataset.originalText = node.textContent || '';
}

function applySwapAnimation(node: HTMLElement) {
  node.classList.add('rm-translation-swap');
  node.classList.add('rm-translation-fade');
  requestAnimationFrame(() => { node.classList.remove('rm-translation-fade'); });
}

function applyTranslationToNode(node: HTMLElement, translation: string) {
  captureOriginalContent(node);
  node.textContent = translation;
  node.dataset.translated = 'true';
  applySwapAnimation(node);
}

function restoreParagraphNode(node: HTMLElement) {
  if (node.dataset.originalText) {
    node.textContent = node.dataset.originalText;
  }
  node.dataset.translated = 'false';
  applySwapAnimation(node);
}

// --- Hook ---

export interface TranslationInteractionRefs {
  /** Ref to current bookId */
  bookIdRef: React.RefObject<string>;
  /** Ref that suppresses selection events after double-tap translation */
  suppressSelectionRef: React.MutableRefObject<boolean>;
}

/**
 * Returns a `setupInteractions` callback that wires translation gestures
 * (double-tap / double-click / long-press) and image click on a content element.
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
  const { bookIdRef, suppressSelectionRef } = refs;

  const bilingualCacheRef = useRef<Map<number, Map<string, string>>>(new Map());
  const pendingTranslationRef = useRef<Set<string>>(new Set());
  const cleanupRef = useRef<(() => void) | null>(null);

  const onTextSelectRef = useRef(onTextSelect);
  const onParagraphClickRef = useRef(onParagraphClick);
  const onImageClickRef = useRef(onImageClick);
  useEffect(() => { onTextSelectRef.current = onTextSelect; }, [onTextSelect]);
  useEffect(() => { onParagraphClickRef.current = onParagraphClick; }, [onParagraphClick]);
  useEffect(() => { onImageClickRef.current = onImageClick; }, [onImageClick]);

  const {
    markParagraphTranslated,
    clearParagraphTranslation,
    getParagraphTranslation,
    isParagraphTranslated,
  } = useReaderStore();

  const translationActionsRef = useRef({
    markParagraphTranslated,
    clearParagraphTranslation,
    getParagraphTranslation,
    isParagraphTranslated,
  });
  useEffect(() => {
    translationActionsRef.current = {
      markParagraphTranslated,
      clearParagraphTranslation,
      getParagraphTranslation,
      isParagraphTranslated,
    };
  }, [markParagraphTranslated, clearParagraphTranslation, getParagraphTranslation, isParagraphTranslated]);

  // --- Bilingual / AI translation ---

  const fetchBilingualMap = useCallback(async (chapterOrder: number) => {
    const book = bookIdRef.current;
    if (!book) return null;
    const cached = bilingualCacheRef.current.get(chapterOrder);
    if (cached) return cached;
    try {
      const response = await apiClient.get<{ data: BilingualChapter }>(
        `/books/${book}/bilingual/chapters/${chapterOrder}`,
      );
      const chapter = ((response as { data?: BilingualChapter }).data || response) as BilingualChapter;
      if (!chapter?.paragraphs) {
        const empty = new Map<string, string>();
        bilingualCacheRef.current.set(chapterOrder, empty);
        return empty;
      }
      const map = new Map<string, string>();
      chapter.paragraphs.forEach((para) => {
        const normalized = normalizeParagraphText(para.en?.raw || '');
        if (!normalized) return;
        map.set(hashText(normalized), para.zh);
      });
      bilingualCacheRef.current.set(chapterOrder, map);
      return map;
    } catch (err) {
      log.reader.error('Failed to fetch bilingual chapter', err);
      return null;
    }
  }, [bookIdRef]);

  const requestAiTranslation = useCallback(
    async (node: HTMLElement, chapterOrder: number, textHash: string) => {
      const book = bookIdRef.current;
      if (!book) return;
      const key = `${book}:${chapterOrder}:${textHash}`;
      if (pendingTranslationRef.current.has(key)) return;
      const originalText = node.dataset.originalText || node.textContent || '';
      if (!originalText.trim()) return;

      pendingTranslationRef.current.add(key);
      try {
        const result = await apiClient.post<{ translation: string }>(
          '/translate',
          { text: originalText, targetLanguage: 'zh', bookId: book },
        );
        const translation = (result as { translation?: string }).translation;
        if (translation) {
          applyTranslationToNode(node, translation);
          translationActionsRef.current.markParagraphTranslated(book, chapterOrder, textHash, translation);
        }
      } catch (err) {
        log.reader.error('Failed to translate paragraph', err);
      } finally {
        pendingTranslationRef.current.delete(key);
      }
    },
    [bookIdRef],
  );

  const applyPersistedTranslations = useCallback(
    async (contentEl: HTMLElement, chapterOrder: number) => {
      const book = bookIdRef.current;
      if (!book) return;
      const nodes = Array.from(contentEl.querySelectorAll('p, blockquote, figcaption')) as HTMLElement[];
      const bilingualMap = await fetchBilingualMap(chapterOrder);

      nodes.forEach((node) => {
        if (!isEligibleParagraph(node)) return;
        const textHash = ensureParagraphHash(node);
        if (!textHash) return;
        if (!translationActionsRef.current.isParagraphTranslated(book, chapterOrder, textHash)) return;

        const stored = translationActionsRef.current.getParagraphTranslation(book, chapterOrder, textHash);
        const translation = stored || bilingualMap?.get(textHash);
        if (translation) {
          applyTranslationToNode(node, translation);
          if (!stored) {
            translationActionsRef.current.markParagraphTranslated(book, chapterOrder, textHash, translation);
          }
        } else {
          requestAiTranslation(node, chapterOrder, textHash);
        }
      });
    },
    [bookIdRef, fetchBilingualMap, requestAiTranslation],
  );

  const toggleParagraphTranslation = useCallback(
    async (node: HTMLElement, chapterOrder: number) => {
      const book = bookIdRef.current;
      if (!book) return;
      if (!isEligibleParagraph(node)) return;
      const textHash = ensureParagraphHash(node);
      if (!textHash) return;

      if (node.dataset.translated === 'true') {
        restoreParagraphNode(node);
        translationActionsRef.current.clearParagraphTranslation(book, chapterOrder, textHash);
        return;
      }

      const stored = translationActionsRef.current.getParagraphTranslation(book, chapterOrder, textHash);
      if (stored) { applyTranslationToNode(node, stored); return; }

      const bilingualMap = await fetchBilingualMap(chapterOrder);
      const translation = bilingualMap?.get(textHash);
      if (translation) {
        applyTranslationToNode(node, translation);
        translationActionsRef.current.markParagraphTranslated(book, chapterOrder, textHash, translation);
        return;
      }

      captureOriginalContent(node);
      requestAiTranslation(node, chapterOrder, textHash);
    },
    [bookIdRef, fetchBilingualMap, requestAiTranslation],
  );

  // Stable refs for use inside setupInteractions closure
  const applyPersistedRef = useRef(applyPersistedTranslations);
  const toggleRef = useRef(toggleParagraphTranslation);
  useEffect(() => { applyPersistedRef.current = applyPersistedTranslations; }, [applyPersistedTranslations]);
  useEffect(() => { toggleRef.current = toggleParagraphTranslation; }, [toggleParagraphTranslation]);

  // --- setupInteractions ---

  const setupInteractions = useCallback((contentEl: HTMLElement, chapterOrder: number) => {
    // Inject translation CSS
    const style = document.createElement('style');
    style.textContent = `
      .rm-translation-paragraph { touch-action: manipulation; }
      .rm-translation-swap { transition: opacity 120ms ease; }
      .rm-translation-fade { opacity: 0.6; }
    `;
    contentEl.prepend(style);

    // Hash all paragraphs
    const paragraphs = Array.from(contentEl.querySelectorAll('p, blockquote, figcaption')) as HTMLElement[];
    paragraphs.forEach((node) => {
      if (isEligibleParagraph(node)) ensureParagraphHash(node);
    });

    // Apply persisted translations
    void applyPersistedRef.current(contentEl, chapterOrder);

    // Touch & click interactions for translation
    let longPressTimer: ReturnType<typeof setTimeout> | null = null;
    let longPressTriggered = false;
    let startX = 0;
    let startY = 0;
    let activeNode: HTMLElement | null = null;
    let lastTapTime = 0;
    let lastTapHash = '';
    let lastTapX = 0;
    let lastTapY = 0;

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
      if (node.dataset.translated === 'true') restoreParagraphNode(node);
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

    const handlePointerUp = (event: PointerEvent) => {
      if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
      if (!activeNode) return;
      if (longPressTriggered) { lastTapTime = 0; lastTapHash = ''; activeNode = null; return; }

      if (event.pointerType === 'touch') {
        // Skip paragraph translation if tap is in the middle zone (toggleControls area)
        const cRect = contentEl.getBoundingClientRect();
        const relX = event.clientX - cRect.left;
        if (relX > cRect.width / 3 && relX < (cRect.width * 2) / 3) {
          activeNode = null;
          return;
        }

        const textHash = ensureParagraphHash(activeNode);
        if (!textHash) { activeNode = null; return; }
        const now = Date.now();
        const dt = now - lastTapTime;
        const dx = Math.abs(event.clientX - lastTapX);
        const dy = Math.abs(event.clientY - lastTapY);
        const isDoubleTap = dt > 0 && dt <= DOUBLE_TAP_DELAY && dx <= MOVE_THRESHOLD && dy <= MOVE_THRESHOLD && lastTapHash === textHash;

        if (isDoubleTap) {
          window.getSelection()?.removeAllRanges();
          suppressSelectionRef.current = true;
          setTimeout(() => { suppressSelectionRef.current = false; }, 100);
          void toggleRef.current(activeNode, chapterOrder);
          lastTapTime = 0;
          lastTapHash = '';
        } else {
          lastTapTime = now;
          lastTapHash = textHash;
          lastTapX = event.clientX;
          lastTapY = event.clientY;
          // Fire single-tap callback after double-tap window expires
          const tappedNode = activeNode;
          setTimeout(() => {
            if (lastTapHash === textHash) {
              onParagraphClickRef.current?.(tappedNode.textContent?.trim() || '');
            }
          }, DOUBLE_TAP_DELAY + 50);
        }
      }
      activeNode = null;
    };

    let clickTimer: ReturnType<typeof setTimeout> | null = null;

    const handleClick = (event: MouseEvent) => {
      if (event.button !== 0) return;
      const cRect = contentEl.getBoundingClientRect();
      const relX = event.clientX - cRect.left;
      if (relX > cRect.width / 3 && relX < (cRect.width * 2) / 3) return;
      const node = getParagraphFromTarget(event.target);
      if (!node) return;
      const selection = window.getSelection();
      if (selection && selection.toString().trim()) return;
      if (clickTimer) { clearTimeout(clickTimer); clickTimer = null; }
      clickTimer = setTimeout(() => {
        clickTimer = null;
        onParagraphClickRef.current?.(node.textContent?.trim() || '');
      }, DOUBLE_TAP_DELAY + 50);
    };

    const handleDoubleClick = (event: MouseEvent) => {
      if (clickTimer) { clearTimeout(clickTimer); clickTimer = null; }
      const node = getParagraphFromTarget(event.target);
      if (!node) return;
      event.preventDefault();
      event.stopPropagation();
      window.getSelection()?.removeAllRanges();
      suppressSelectionRef.current = true;
      setTimeout(() => { suppressSelectionRef.current = false; }, 100);
      void toggleRef.current(node, chapterOrder);
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
    contentEl.addEventListener('dblclick', handleDoubleClick);
    contentEl.addEventListener('click', handleImgClick);
    document.addEventListener('selectionchange', handleSelectionChange);

    return () => {
      contentEl.removeEventListener('pointerdown', handlePointerDown);
      contentEl.removeEventListener('pointermove', handlePointerMove);
      contentEl.removeEventListener('pointerup', handlePointerUp);
      contentEl.removeEventListener('pointercancel', handlePointerUp);
      contentEl.removeEventListener('click', handleClick);
      contentEl.removeEventListener('dblclick', handleDoubleClick);
      contentEl.removeEventListener('click', handleImgClick);
      document.removeEventListener('selectionchange', handleSelectionChange);
      if (clickTimer) clearTimeout(clickTimer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- refs are stable, listed for readability
  }, []);

  /** Clear bilingual cache & pending translations (call on unmount). */
  const clearCaches = useCallback(() => {
    bilingualCacheRef.current.clear();
    pendingTranslationRef.current.clear();
  }, []);

  return { setupInteractions, cleanupRef, clearCaches };
}
