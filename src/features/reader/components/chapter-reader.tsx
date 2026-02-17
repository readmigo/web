'use client';

import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import {
  ChapterRenderer,
  Paginator,
  THEMES,
  watchSystemAppearance,
  resolveTheme,
  DEFAULT_THEME_MAPPING,
} from '@readmigo/reader-engine';
import type { ReaderSettings as EngineSettings } from '@readmigo/reader-engine';
import { useReaderStore } from '../stores/reader-store';
import type { TocItem, SelectedText, BilingualChapter } from '../types';
import type { Chapter } from '@/features/library/types';
import { apiClient } from '@/lib/api/client';
import { useTranslate } from '../hooks/use-ai';
import { normalizeParagraphText, hashText } from '../utils/translation-hash';
import { sanitizeHtml } from '@/lib/sanitize';

export interface ChapterReaderHandle {
  goTo: (chapterId: string) => void;
  goNext: () => void;
  goPrev: () => void;
}

interface ChapterReaderProps {
  bookId: string;
  chapters: Chapter[];
  initialChapterIndex?: number;
  onReady?: () => void;
  onTextSelect?: (selection: SelectedText) => void;
  onTocLoaded?: (toc: TocItem[]) => void;
}

interface ChapterContentResponse {
  id: string;
  title: string;
  order: number;
  contentUrl: string;
  wordCount?: number;
  previousChapterId?: string | null;
  nextChapterId?: string | null;
}

/** Maps web settings to reader-engine settings. */
function mapSettings(
  s: ReturnType<typeof useReaderStore.getState>['settings'],
  systemIsDark: boolean,
): EngineSettings {
  const marginMap = { small: 20, medium: 40, large: 60 } as const;
  const fontMap = {
    serif: 'Georgia, serif',
    'sans-serif': '"Helvetica Neue", Helvetica, Arial, sans-serif',
    monospace: 'monospace',
  } as const;
  const resolvedTheme = resolveTheme(s.appearanceMode, DEFAULT_THEME_MAPPING, systemIsDark);
  return {
    fontSize: s.fontSize,
    fontFamily: fontMap[s.fontFamily] || 'Georgia, serif',
    lineHeight: s.lineHeight,
    letterSpacing: s.letterSpacing,
    wordSpacing: s.wordSpacing,
    paragraphSpacing: s.paragraphSpacing,
    textAlign: s.textAlign,
    hyphenation: s.hyphenation,
    theme: resolvedTheme,
    readingMode: 'paginated',
    margin: marginMap[s.marginSize] || 40,
    columnCount: s.columnCount,
    textIndent: s.textIndent,
    fontWeight: s.fontWeight,
    pageTransition: 'slide',
    transitionDuration: 300,
    swipeEnabled: true,
    autoPageInterval: null,
  };
}

export const ChapterReader = forwardRef<ChapterReaderHandle, ChapterReaderProps>(
  function ChapterReader({ bookId, chapters, initialChapterIndex, onReady, onTextSelect, onTocLoaded }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<ChapterRenderer | null>(null);
    const paginatorRef = useRef<Paginator | null>(null);
    const currentIndexRef = useRef<number>(initialChapterIndex ?? 0);
    const bilingualCacheRef = useRef<Map<number, Map<string, string>>>(new Map());
    const pendingTranslationRef = useRef<Set<string>>(new Set());
    const suppressSelectionRef = useRef(false);
    const loadingChapterRef = useRef(false);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const {
      settings,
      position,
      systemIsDark,
      setPosition,
      setSystemIsDark,
      markParagraphTranslated,
      clearParagraphTranslation,
      getParagraphTranslation,
      isParagraphTranslated,
    } = useReaderStore();

    const translateMutation = useTranslate();
    const bookIdRef = useRef(bookId);
    const onTextSelectRef = useRef(onTextSelect);
    const onTocLoadedRef = useRef(onTocLoaded);
    const onReadyRef = useRef(onReady);
    const settingsRef = useRef(settings);

    useEffect(() => { bookIdRef.current = bookId; }, [bookId]);
    useEffect(() => { onTextSelectRef.current = onTextSelect; }, [onTextSelect]);
    useEffect(() => { onTocLoadedRef.current = onTocLoaded; }, [onTocLoaded]);
    useEffect(() => { onReadyRef.current = onReady; }, [onReady]);
    useEffect(() => { settingsRef.current = settings; }, [settings]);

    const systemIsDarkRef = useRef(systemIsDark);
    useEffect(() => { systemIsDarkRef.current = systemIsDark; }, [systemIsDark]);

    // Watch system appearance for auto mode
    useEffect(() => {
      const { isDark, cleanup } = watchSystemAppearance((dark: boolean) => {
        setSystemIsDark(dark);
      });
      setSystemIsDark(isDark);
      return cleanup;
    }, [setSystemIsDark]);

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

    const LONG_PRESS_DELAY = 550;
    const DOUBLE_TAP_DELAY = 300;
    const MOVE_THRESHOLD = 10;

    // --- Translation helpers ---

    const isEligibleParagraph = useCallback((node: HTMLElement) => {
      if (!node.textContent?.trim()) return false;
      return !node.querySelector('img, svg, table, pre, code, iframe');
    }, []);

    const ensureParagraphHash = useCallback((node: HTMLElement) => {
      if (node.dataset.textHash) return node.dataset.textHash;
      const normalized = normalizeParagraphText(node.textContent || '');
      if (!normalized) return null;
      const hash = hashText(normalized);
      node.dataset.textHash = hash;
      node.classList.add('rm-translation-paragraph');
      return hash;
    }, []);

    const captureOriginalContent = useCallback((node: HTMLElement) => {
      if (!node.dataset.originalHtml) node.dataset.originalHtml = node.textContent || '';
      if (!node.dataset.originalText) node.dataset.originalText = node.textContent || '';
    }, []);

    const applySwapAnimation = useCallback((node: HTMLElement) => {
      node.classList.add('rm-translation-swap');
      node.classList.add('rm-translation-fade');
      requestAnimationFrame(() => { node.classList.remove('rm-translation-fade'); });
    }, []);

    const applyTranslationToNode = useCallback(
      (node: HTMLElement, translation: string) => {
        captureOriginalContent(node);
        node.textContent = translation;
        node.dataset.translated = 'true';
        applySwapAnimation(node);
      },
      [applySwapAnimation, captureOriginalContent],
    );

    const restoreParagraph = useCallback(
      (node: HTMLElement) => {
        // Restore original text content (stored as plain text, safe to set)
        if (node.dataset.originalText) {
          node.textContent = node.dataset.originalText;
        }
        node.dataset.translated = 'false';
        applySwapAnimation(node);
      },
      [applySwapAnimation],
    );

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
        console.error('Failed to fetch bilingual chapter:', err);
        return null;
      }
    }, []);

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
          const result = await translateMutation.mutateAsync({
            text: originalText,
            targetLanguage: 'zh',
            bookId: book,
          });
          if (result?.translation) {
            applyTranslationToNode(node, result.translation);
            translationActionsRef.current.markParagraphTranslated(book, chapterOrder, textHash, result.translation);
          }
        } catch (err) {
          console.error('Failed to translate paragraph:', err);
        } finally {
          pendingTranslationRef.current.delete(key);
        }
      },
      [applyTranslationToNode, translateMutation],
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
      [applyTranslationToNode, ensureParagraphHash, fetchBilingualMap, isEligibleParagraph, requestAiTranslation],
    );

    const toggleParagraphTranslation = useCallback(
      async (node: HTMLElement, chapterOrder: number) => {
        const book = bookIdRef.current;
        if (!book) return;
        if (!isEligibleParagraph(node)) return;
        const textHash = ensureParagraphHash(node);
        if (!textHash) return;

        if (node.dataset.translated === 'true') {
          restoreParagraph(node);
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
      [applyTranslationToNode, captureOriginalContent, ensureParagraphHash, fetchBilingualMap, isEligibleParagraph, requestAiTranslation, restoreParagraph],
    );

    // Stable refs for callbacks used in loadChapter
    const isEligibleParagraphRef = useRef(isEligibleParagraph);
    const ensureParagraphHashRef = useRef(ensureParagraphHash);
    const applyPersistedTranslationsRef = useRef(applyPersistedTranslations);
    const toggleParagraphTranslationRef = useRef(toggleParagraphTranslation);
    const restoreParagraphRef = useRef(restoreParagraph);

    useEffect(() => { isEligibleParagraphRef.current = isEligibleParagraph; }, [isEligibleParagraph]);
    useEffect(() => { ensureParagraphHashRef.current = ensureParagraphHash; }, [ensureParagraphHash]);
    useEffect(() => { applyPersistedTranslationsRef.current = applyPersistedTranslations; }, [applyPersistedTranslations]);
    useEffect(() => { toggleParagraphTranslationRef.current = toggleParagraphTranslation; }, [toggleParagraphTranslation]);
    useEffect(() => { restoreParagraphRef.current = restoreParagraph; }, [restoreParagraph]);

    // --- Chapter loading ---

    const fetchChapterHtml = useCallback(async (chapterId: string): Promise<string> => {
      const res = await apiClient.get<ChapterContentResponse>(
        `/books/${bookIdRef.current}/content/${chapterId}`,
        { skipAuth: true },
      );
      const contentUrl = res.contentUrl;
      const htmlRes = await fetch(contentUrl);
      if (!htmlRes.ok) throw new Error(`Failed to fetch chapter HTML: ${htmlRes.status}`);
      return htmlRes.text();
    }, []);

    const emitPosition = useCallback((chapterIdx: number, page: number, totalPages: number) => {
      const totalChapters = chapters.length || 1;
      const chapterProgress = totalPages > 1 ? page / (totalPages - 1) : 1;
      const overallProgress = (chapterIdx + chapterProgress) / totalChapters;
      setPosition({
        chapterIndex: chapterIdx,
        page,
        percentage: Math.min(1, overallProgress),
      });
    }, [chapters.length, setPosition]);

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
        if (isEligibleParagraphRef.current(node)) ensureParagraphHashRef.current(node);
      });

      // Apply persisted translations
      void applyPersistedTranslationsRef.current(contentEl, chapterOrder);

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
        if (!node || !isEligibleParagraphRef.current(node)) return null;
        return node;
      };

      const openParagraphMenu = (node: HTMLElement) => {
        const selection = window.getSelection();
        if (selection && selection.toString().trim()) return;
        if (node.dataset.translated === 'true') restoreParagraphRef.current(node);
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
          const textHash = ensureParagraphHashRef.current(activeNode);
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
            void toggleParagraphTranslationRef.current(activeNode, chapterOrder);
            lastTapTime = 0;
            lastTapHash = '';
          } else {
            lastTapTime = now;
            lastTapHash = textHash;
            lastTapX = event.clientX;
            lastTapY = event.clientY;
          }
        }
        activeNode = null;
      };

      const handleDoubleClick = (event: MouseEvent) => {
        const node = getParagraphFromTarget(event.target);
        if (!node) return;
        event.preventDefault();
        event.stopPropagation();
        window.getSelection()?.removeAllRanges();
        suppressSelectionRef.current = true;
        setTimeout(() => { suppressSelectionRef.current = false; }, 100);
        void toggleParagraphTranslationRef.current(node, chapterOrder);
      };

      const handleSelectionChange = () => {
        const selection = window.getSelection();
        if (selection && selection.toString().trim()) cancelLongPress();
      };

      contentEl.addEventListener('pointerdown', handlePointerDown);
      contentEl.addEventListener('pointermove', handlePointerMove);
      contentEl.addEventListener('pointerup', handlePointerUp);
      contentEl.addEventListener('pointercancel', handlePointerUp);
      contentEl.addEventListener('dblclick', handleDoubleClick);
      document.addEventListener('selectionchange', handleSelectionChange);

      return () => {
        contentEl.removeEventListener('pointerdown', handlePointerDown);
        contentEl.removeEventListener('pointermove', handlePointerMove);
        contentEl.removeEventListener('pointerup', handlePointerUp);
        contentEl.removeEventListener('pointercancel', handlePointerUp);
        contentEl.removeEventListener('dblclick', handleDoubleClick);
        document.removeEventListener('selectionchange', handleSelectionChange);
      };
    }, [LONG_PRESS_DELAY, DOUBLE_TAP_DELAY, MOVE_THRESHOLD]);

    // Cleanup ref for interaction listeners
    const cleanupInteractionsRef = useRef<(() => void) | null>(null);

    const loadChapter = useCallback(async (index: number, goToLastPage = false) => {
      if (!containerRef.current || !chapters.length || loadingChapterRef.current) return;
      if (index < 0 || index >= chapters.length) return;

      loadingChapterRef.current = true;
      setIsLoading(true);

      try {
        const chapter = chapters[index];
        const html = await fetchChapterHtml(chapter.id);

        // Clean up previous interaction listeners
        cleanupInteractionsRef.current?.();
        cleanupInteractionsRef.current = null;

        // Create/reuse renderer
        const engineSettings = mapSettings(settingsRef.current, systemIsDarkRef.current);
        if (!rendererRef.current) {
          rendererRef.current = new ChapterRenderer(containerRef.current, engineSettings);
        } else {
          rendererRef.current.updateSettings(engineSettings);
        }

        // ChapterRenderer.render() internally sanitizes HTML via DOMPurify
        rendererRef.current.render(html);

        // Set up paginator
        const viewport = rendererRef.current.viewportElement;
        const content = rendererRef.current.contentElement;
        if (viewport && content) {
          paginatorRef.current = new Paginator(viewport, content, {
            margin: engineSettings.margin,
            gap: engineSettings.margin * 2,
          });

          if (goToLastPage) {
            paginatorRef.current.goToEnd();
          }

          paginatorRef.current.onPageChange = (state) => {
            emitPosition(index, state.currentPage, state.totalPages);
          };

          currentIndexRef.current = index;
          emitPosition(index, paginatorRef.current.currentPage, paginatorRef.current.totalPages);
        }

        // Set up interactions (translation, selection, gestures)
        const chapterOrder = chapter.order;
        if (content) {
          cleanupInteractionsRef.current = setupInteractions(content, chapterOrder);
        }

        setIsLoading(false);
        setError(null);
      } catch (err) {
        console.error('Failed to load chapter:', err);
        setError('无法加载章节，请稍后重试');
        setIsLoading(false);
      } finally {
        loadingChapterRef.current = false;
      }
    }, [chapters, fetchChapterHtml, emitPosition, setupInteractions]);

    // Expose navigation handle
    useImperativeHandle(ref, () => ({
      goTo: (chapterId: string) => {
        const idx = chapters.findIndex((ch) => ch.id === chapterId);
        if (idx !== -1) void loadChapter(idx);
      },
      goNext: () => {
        if (!paginatorRef.current) return;
        if (!paginatorRef.current.isLastPage) {
          paginatorRef.current.nextPage();
          emitPosition(
            currentIndexRef.current,
            paginatorRef.current.currentPage,
            paginatorRef.current.totalPages,
          );
        } else if (currentIndexRef.current < chapters.length - 1) {
          void loadChapter(currentIndexRef.current + 1);
        }
      },
      goPrev: () => {
        if (!paginatorRef.current) return;
        if (!paginatorRef.current.isFirstPage) {
          paginatorRef.current.prevPage();
          emitPosition(
            currentIndexRef.current,
            paginatorRef.current.currentPage,
            paginatorRef.current.totalPages,
          );
        } else if (currentIndexRef.current > 0) {
          void loadChapter(currentIndexRef.current - 1, true);
        }
      },
    }), [chapters, emitPosition, loadChapter]);

    // Initialize: load first chapter and emit TOC
    useEffect(() => {
      if (!chapters.length) return;

      // Emit TOC from chapters
      const tocItems: TocItem[] = chapters.map((ch) => ({
        id: ch.id,
        href: ch.id,
        label: ch.title,
      }));
      onTocLoadedRef.current?.(tocItems);

      // Load initial chapter (use last position if available)
      const lastPos = position;
      const startIndex = lastPos?.chapterIndex ?? initialChapterIndex ?? 0;
      const validIndex = Math.min(startIndex, chapters.length - 1);
      void loadChapter(validIndex).then(() => {
        onReadyRef.current?.();
      });

      return () => {
        cleanupInteractionsRef.current?.();
        cleanupInteractionsRef.current = null;
        rendererRef.current?.clear();
        rendererRef.current = null;
        paginatorRef.current = null;
        bilingualCacheRef.current.clear();
        pendingTranslationRef.current.clear();
      };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bookId, chapters]);

    // Update settings when changed
    useEffect(() => {
      if (!rendererRef.current) return;
      const engineSettings = mapSettings(settings, systemIsDark);
      rendererRef.current.updateSettings(engineSettings);
      if (paginatorRef.current) {
        paginatorRef.current.recalculate();
        emitPosition(
          currentIndexRef.current,
          paginatorRef.current.currentPage,
          paginatorRef.current.totalPages,
        );
      }
    }, [settings, systemIsDark, emitPosition]);

    // Handle resize
    useEffect(() => {
      if (!containerRef.current) return;
      const observer = new ResizeObserver(() => {
        if (paginatorRef.current) {
          paginatorRef.current.recalculate();
        }
      });
      observer.observe(containerRef.current);
      return () => observer.disconnect();
    }, []);

    // Text selection handler
    useEffect(() => {
      const handleSelectionUp = () => {
        if (suppressSelectionRef.current) return;
        const selection = window.getSelection();
        if (!selection || !selection.toString().trim()) return;
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        onTextSelectRef.current?.({
          text: selection.toString(),
          rect,
          source: 'selection',
        });
      };

      document.addEventListener('mouseup', handleSelectionUp);
      return () => document.removeEventListener('mouseup', handleSelectionUp);
    }, []);

    // Keyboard navigation
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'ArrowRight' || e.key === ' ') {
          e.preventDefault();
          if (!paginatorRef.current) return;
          if (!paginatorRef.current.isLastPage) {
            paginatorRef.current.nextPage();
            emitPosition(currentIndexRef.current, paginatorRef.current.currentPage, paginatorRef.current.totalPages);
          } else if (currentIndexRef.current < chapters.length - 1) {
            void loadChapter(currentIndexRef.current + 1);
          }
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          if (!paginatorRef.current) return;
          if (!paginatorRef.current.isFirstPage) {
            paginatorRef.current.prevPage();
            emitPosition(currentIndexRef.current, paginatorRef.current.currentPage, paginatorRef.current.totalPages);
          } else if (currentIndexRef.current > 0) {
            void loadChapter(currentIndexRef.current - 1, true);
          }
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [chapters.length, emitPosition, loadChapter]);

    // Get theme background color (use resolved theme for auto mode)
    const resolvedThemeName = resolveTheme(settings.appearanceMode, DEFAULT_THEME_MAPPING, systemIsDark);
    const themeColors = THEMES[resolvedThemeName] || THEMES.light;

    if (error) {
      return (
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-muted-foreground">{error}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="relative h-full">
        {isLoading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/80">
            <div className="flex flex-col items-center gap-4">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">正在加载章节...</p>
            </div>
          </div>
        )}
        <div
          ref={containerRef}
          className="h-full"
          style={{ backgroundColor: themeColors.background }}
        />
        {/* Click areas for navigation */}
        <div
          className="absolute left-0 top-0 z-10 h-full w-1/4 cursor-pointer"
          onClick={() => {
            if (!paginatorRef.current) return;
            if (!paginatorRef.current.isFirstPage) {
              paginatorRef.current.prevPage();
              emitPosition(currentIndexRef.current, paginatorRef.current.currentPage, paginatorRef.current.totalPages);
            } else if (currentIndexRef.current > 0) {
              void loadChapter(currentIndexRef.current - 1, true);
            }
          }}
        />
        <div
          className="absolute right-0 top-0 z-10 h-full w-1/4 cursor-pointer"
          onClick={() => {
            if (!paginatorRef.current) return;
            if (!paginatorRef.current.isLastPage) {
              paginatorRef.current.nextPage();
              emitPosition(currentIndexRef.current, paginatorRef.current.currentPage, paginatorRef.current.totalPages);
            } else if (currentIndexRef.current < chapters.length - 1) {
              void loadChapter(currentIndexRef.current + 1);
            }
          }}
        />
      </div>
    );
  },
);
