'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useReaderStore } from '../stores/reader-store';
import type { TocItem, SelectedText, BilingualChapter } from '../types';
import { apiClient } from '@/lib/api/client';
import { useTranslate } from '../hooks/use-ai';
import { normalizeParagraphText, hashText } from '../utils/translation-hash';
import { sanitizeHtml } from '@/lib/sanitize';

interface EpubReaderProps {
  bookId?: string;
  url: string;
  onReady?: () => void;
  onLocationChange?: (cfi: string, percentage: number) => void;
  onTextSelect?: (selection: SelectedText) => void;
}

export function EpubReader({
  bookId,
  url,
  onReady,
  onLocationChange,
  onTextSelect,
}: EpubReaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<any>(null);
  const renditionRef = useRef<any>(null);
  const bilingualCacheRef = useRef<Map<number, Map<string, string>>>(new Map());
  const pendingTranslationRef = useRef<Set<string>>(new Set());
  const contentsRef = useRef<Map<any, number>>(new Map());
  const suppressSelectionRef = useRef(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toc, setToc] = useState<TocItem[]>([]);

  const {
    settings,
    position,
    setPosition,
    highlights,
    selectedText,
    markParagraphTranslated,
    clearParagraphTranslation,
    getParagraphTranslation,
    isParagraphTranslated,
  } = useReaderStore();

  const translateMutation = useTranslate();
  const bookIdRef = useRef<string | undefined>(bookId);
  const onTextSelectRef = useRef<typeof onTextSelect>(onTextSelect);
  const translationActionsRef = useRef({
    markParagraphTranslated,
    clearParagraphTranslation,
    getParagraphTranslation,
    isParagraphTranslated,
  });

  useEffect(() => {
    bookIdRef.current = bookId;
  }, [bookId]);

  useEffect(() => {
    onTextSelectRef.current = onTextSelect;
  }, [onTextSelect]);

  useEffect(() => {
    translationActionsRef.current = {
      markParagraphTranslated,
      clearParagraphTranslation,
      getParagraphTranslation,
      isParagraphTranslated,
    };
  }, [
    markParagraphTranslated,
    clearParagraphTranslation,
    getParagraphTranslation,
    isParagraphTranslated,
  ]);


  // Apply theme styles
  const getThemeStyles = useCallback(() => {
    const themes: Record<string, { body: Record<string, string> }> = {
      light: {
        body: {
          color: '#1a1a1a',
          background: '#ffffff',
        },
      },
      sepia: {
        body: {
          color: '#5b4636',
          background: '#f4ecd8',
        },
      },
      dark: {
        body: {
          color: '#e0e0e0',
          background: '#1a1a1a',
        },
      },
    };
    return themes[settings.theme] || themes.light;
  }, [settings.theme]);

  const LONG_PRESS_DELAY = 550;
  const DOUBLE_TAP_DELAY = 300;
  const MOVE_THRESHOLD = 10;

  const getChapterOrder = useCallback((contents: any) => {
    const index =
      typeof contents.sectionIndex === 'number'
        ? contents.sectionIndex
        : typeof contents.index === 'number'
        ? contents.index
        : null;
    if (typeof index !== 'number') return null;
    return index + 1;
  }, []);

  const isEligibleParagraph = useCallback((node: HTMLElement) => {
    if (!node.textContent?.trim()) return false;
    const excluded = node.querySelector(
      'img, svg, table, pre, code, iframe'
    );
    return !excluded;
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
    if (!node.dataset.originalHtml) {
      node.dataset.originalHtml = node.innerHTML;
    }
    if (!node.dataset.originalText) {
      node.dataset.originalText = node.textContent || '';
    }
  }, []);

  const applySwapAnimation = useCallback((node: HTMLElement) => {
    node.classList.add('rm-translation-swap');
    node.classList.add('rm-translation-fade');
    requestAnimationFrame(() => {
      node.classList.remove('rm-translation-fade');
    });
  }, []);

  const applyTranslationToNode = useCallback(
    (node: HTMLElement, translation: string) => {
      captureOriginalContent(node);
      node.textContent = translation;
      node.dataset.translated = 'true';
      applySwapAnimation(node);
    },
    [applySwapAnimation, captureOriginalContent]
  );

  const restoreParagraph = useCallback(
    (node: HTMLElement) => {
      if (node.dataset.originalHtml) {
        node.innerHTML = sanitizeHtml(node.dataset.originalHtml);
      }
      node.dataset.translated = 'false';
      applySwapAnimation(node);
    },
    [applySwapAnimation]
  );

  const fetchBilingualMap = useCallback(async (chapterOrder: number) => {
    const book = bookIdRef.current;
    if (!book) return null;
    const cached = bilingualCacheRef.current.get(chapterOrder);
    if (cached) return cached;

    try {
      const response = await apiClient.get<{ data: BilingualChapter }>(
        `/books/${book}/bilingual/chapters/${chapterOrder}`
      );
      const chapter = ((response as { data?: BilingualChapter }).data || response) as BilingualChapter;
      if (!chapter || !chapter.paragraphs) {
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
    } catch (error) {
      console.error('Failed to fetch bilingual chapter:', error);
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
          translationActionsRef.current.markParagraphTranslated(
            book,
            chapterOrder,
            textHash,
            result.translation
          );
        }
      } catch (error) {
        console.error('Failed to translate paragraph:', error);
      } finally {
        pendingTranslationRef.current.delete(key);
      }
    },
    [applyTranslationToNode, translateMutation]
  );

  const applyPersistedTranslations = useCallback(
    async (contents: any, chapterOrder: number) => {
      const book = bookIdRef.current;
      if (!book) return;
      const doc = contents.document as Document;
      const nodes = Array.from(
        doc.querySelectorAll('p, blockquote, figcaption')
      ) as HTMLElement[];
      const bilingualMap = await fetchBilingualMap(chapterOrder);

      nodes.forEach((node) => {
        if (!isEligibleParagraph(node)) return;
        const textHash = ensureParagraphHash(node);
        if (!textHash) return;
        if (
          !translationActionsRef.current.isParagraphTranslated(
            book,
            chapterOrder,
            textHash
          )
        ) {
          return;
        }

        const stored = translationActionsRef.current.getParagraphTranslation(
          book,
          chapterOrder,
          textHash
        );
        const translation = stored || bilingualMap?.get(textHash);
        if (translation) {
          applyTranslationToNode(node, translation);
          if (!stored) {
            translationActionsRef.current.markParagraphTranslated(
              book,
              chapterOrder,
              textHash,
              translation
            );
          }
        } else {
          requestAiTranslation(node, chapterOrder, textHash);
        }
      });
    },
    [
      applyTranslationToNode,
      ensureParagraphHash,
      fetchBilingualMap,
      isEligibleParagraph,
      requestAiTranslation,
    ]
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
        translationActionsRef.current.clearParagraphTranslation(
          book,
          chapterOrder,
          textHash
        );
        return;
      }

      const stored = translationActionsRef.current.getParagraphTranslation(
        book,
        chapterOrder,
        textHash
      );
      if (stored) {
        applyTranslationToNode(node, stored);
        return;
      }

      const bilingualMap = await fetchBilingualMap(chapterOrder);
      const translation = bilingualMap?.get(textHash);
      if (translation) {
        applyTranslationToNode(node, translation);
        translationActionsRef.current.markParagraphTranslated(
          book,
          chapterOrder,
          textHash,
          translation
        );
        return;
      }

      captureOriginalContent(node);
      requestAiTranslation(node, chapterOrder, textHash);
    },
    [
      applyTranslationToNode,
      captureOriginalContent,
      ensureParagraphHash,
      fetchBilingualMap,
      isEligibleParagraph,
      requestAiTranslation,
      restoreParagraph,
    ]
  );

  const injectContentStyles = useCallback((doc: Document) => {
    if (doc.getElementById('rm-translation-style')) return;
    const style = doc.createElement('style');
    style.id = 'rm-translation-style';
    style.textContent = `
      .rm-translation-paragraph { touch-action: manipulation; }
      .rm-translation-swap { transition: opacity 120ms ease; }
      .rm-translation-fade { opacity: 0.6; }
    `;
    doc.head?.appendChild(style);
  }, []);

  // Stable refs for callbacks used inside initBook effect (avoids re-init on callback identity change)
  const getChapterOrderRef = useRef(getChapterOrder);
  const injectContentStylesRef = useRef(injectContentStyles);
  const isEligibleParagraphRef = useRef(isEligibleParagraph);
  const ensureParagraphHashRef = useRef(ensureParagraphHash);
  const applyPersistedTranslationsRef = useRef(applyPersistedTranslations);
  const toggleParagraphTranslationRef = useRef(toggleParagraphTranslation);
  const restoreParagraphRef = useRef(restoreParagraph);
  const getThemeStylesRef = useRef(getThemeStyles);
  const settingsRef = useRef(settings);
  const positionRef = useRef(position);
  const setPositionRef = useRef(setPosition);
  const onLocationChangeRef = useRef(onLocationChange);
  const onReadyRef = useRef(onReady);

  useEffect(() => { getChapterOrderRef.current = getChapterOrder; }, [getChapterOrder]);
  useEffect(() => { injectContentStylesRef.current = injectContentStyles; }, [injectContentStyles]);
  useEffect(() => { isEligibleParagraphRef.current = isEligibleParagraph; }, [isEligibleParagraph]);
  useEffect(() => { ensureParagraphHashRef.current = ensureParagraphHash; }, [ensureParagraphHash]);
  useEffect(() => { applyPersistedTranslationsRef.current = applyPersistedTranslations; }, [applyPersistedTranslations]);
  useEffect(() => { toggleParagraphTranslationRef.current = toggleParagraphTranslation; }, [toggleParagraphTranslation]);
  useEffect(() => { restoreParagraphRef.current = restoreParagraph; }, [restoreParagraph]);
  useEffect(() => { getThemeStylesRef.current = getThemeStyles; }, [getThemeStyles]);
  useEffect(() => { settingsRef.current = settings; }, [settings]);
  useEffect(() => { positionRef.current = position; }, [position]);
  useEffect(() => { setPositionRef.current = setPosition; }, [setPosition]);
  useEffect(() => { onLocationChangeRef.current = onLocationChange; }, [onLocationChange]);
  useEffect(() => { onReadyRef.current = onReady; }, [onReady]);

  // Initialize EPUB
  useEffect(() => {
    let mounted = true;
    let resizeObserver: ResizeObserver | null = null;

    const initBook = async () => {
      if (!containerRef.current) return;

      try {
        // Dynamic import of epub.js
        const ePub = (await import('epubjs')).default;

        // Create book instance
        const book = ePub(url);
        bookRef.current = book;

        // Use explicit pixel dimensions to avoid epubjs column calculation bugs
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;

        // Create rendition
        const rendition = book.renderTo(containerRef.current, {
          width: containerWidth,
          height: containerHeight,
          spread: 'none',
          flow: 'paginated',
        });

        // Resize handler: update rendition when container dimensions change
        resizeObserver = new ResizeObserver((entries) => {
          for (const entry of entries) {
            const { width, height } = entry.contentRect;
            if (width > 0 && height > 0 && renditionRef.current) {
              renditionRef.current.resize(width, height);
            }
          }
        });
        resizeObserver.observe(containerRef.current);
        renditionRef.current = rendition;

        rendition.hooks.content.register((contents: any) => {
          const doc = contents.document as Document;
          const win = contents.window as Window | undefined;
          if (!doc?.body || !win) return;
          if (doc.body.dataset.rmTranslationReady === 'true') return;
          doc.body.dataset.rmTranslationReady = 'true';

          const chapterOrder = getChapterOrderRef.current(contents);
          if (!chapterOrder) return;
          contentsRef.current.set(contents, chapterOrder);

          injectContentStylesRef.current(doc);

          const paragraphNodes = Array.from(
            doc.querySelectorAll('p, blockquote, figcaption')
          ) as HTMLElement[];

          paragraphNodes.forEach((node) => {
            if (!isEligibleParagraphRef.current(node)) return;
            ensureParagraphHashRef.current(node);
          });

          void applyPersistedTranslationsRef.current(contents, chapterOrder);

          let longPressTimer: number | null = null;
          let longPressTriggered = false;
          let startX = 0;
          let startY = 0;
          let activeNode: HTMLElement | null = null;
          let lastTapTime = 0;
          let lastTapHash = '';
          let lastTapX = 0;
          let lastTapY = 0;

          const cancelLongPress = () => {
            if (longPressTimer) {
              win.clearTimeout(longPressTimer);
              longPressTimer = null;
            }
            longPressTriggered = false;
          };

          const getParagraphFromTarget = (target: EventTarget | null) => {
            if (!(target instanceof HTMLElement)) return null;
            const node = target.closest('p, blockquote, figcaption') as HTMLElement | null;
            if (!node || !isEligibleParagraphRef.current(node)) return null;
            return node;
          };

          const openParagraphMenu = (node: HTMLElement) => {
            const selection = win.getSelection();
            if (selection && selection.toString().trim()) return;

            if (node.dataset.translated === 'true') {
              restoreParagraphRef.current(node);
            }

            const range = doc.createRange();
            range.selectNodeContents(node);
            let cfiRange = '';
            try {
              cfiRange = contents.cfiFromRange(range);
            } catch (error) {
              console.error('Failed to create CFI from range:', error);
            }

            const rect = node.getBoundingClientRect();
            onTextSelectRef.current?.({
              text: node.textContent || '',
              cfiRange,
              rect,
              source: 'paragraph',
            });
          };

          const handlePointerDown = (event: PointerEvent) => {
            const node = getParagraphFromTarget(event.target);
            if (!node) return;
            activeNode = node;
            startX = event.clientX;
            startY = event.clientY;
            longPressTriggered = false;
            cancelLongPress();

            longPressTimer = win.setTimeout(() => {
              longPressTriggered = true;
              openParagraphMenu(node);
            }, LONG_PRESS_DELAY);
          };

          const handlePointerMove = (event: PointerEvent) => {
            if (!longPressTimer) return;
            const dx = Math.abs(event.clientX - startX);
            const dy = Math.abs(event.clientY - startY);
            if (dx > MOVE_THRESHOLD || dy > MOVE_THRESHOLD) {
              cancelLongPress();
            }
          };

          const handlePointerUp = (event: PointerEvent) => {
            if (longPressTimer) {
              win.clearTimeout(longPressTimer);
              longPressTimer = null;
            }

            if (!activeNode) return;
            if (longPressTriggered) {
              lastTapTime = 0;
              lastTapHash = '';
              activeNode = null;
              return;
            }

            if (event.pointerType === 'touch') {
              const textHash = ensureParagraphHashRef.current(activeNode);
              if (!textHash) {
                activeNode = null;
                return;
              }
              const now = Date.now();
              const dt = now - lastTapTime;
              const dx = Math.abs(event.clientX - lastTapX);
              const dy = Math.abs(event.clientY - lastTapY);
              const isDoubleTap =
                dt > 0 &&
                dt <= DOUBLE_TAP_DELAY &&
                dx <= MOVE_THRESHOLD &&
                dy <= MOVE_THRESHOLD &&
                lastTapHash === textHash;

              if (isDoubleTap) {
                win.getSelection()?.removeAllRanges();
                suppressSelectionRef.current = true;
                win.setTimeout(() => {
                  suppressSelectionRef.current = false;
                }, 100);
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
            win.getSelection()?.removeAllRanges();
            suppressSelectionRef.current = true;
            win.setTimeout(() => {
              suppressSelectionRef.current = false;
            }, 100);
            void toggleParagraphTranslationRef.current(node, chapterOrder);
          };

          const handleSelectionChange = () => {
            const selection = win.getSelection();
            if (selection && selection.toString().trim()) {
              cancelLongPress();
            }
          };

          doc.addEventListener('pointerdown', handlePointerDown);
          doc.addEventListener('pointermove', handlePointerMove);
          doc.addEventListener('pointerup', handlePointerUp);
          doc.addEventListener('pointercancel', handlePointerUp);
          doc.addEventListener('dblclick', handleDoubleClick);
          doc.addEventListener('selectionchange', handleSelectionChange);
        });

        // Load book
        await book.ready;

        // Get table of contents
        const navigation = await book.loaded.navigation;
        if (mounted && navigation.toc) {
          const tocItems: TocItem[] = navigation.toc.map((item: any) => ({
            id: item.id,
            href: item.href,
            label: item.label,
            subitems: item.subitems?.map((sub: any) => ({
              id: sub.id,
              href: sub.href,
              label: sub.label,
            })),
          }));
          setToc(tocItems);
        }

        // Apply initial settings
        const s = settingsRef.current;
        rendition.themes.default({
          body: {
            'font-size': `${s.fontSize}px`,
            'font-family': s.fontFamily,
            'line-height': `${s.lineHeight}`,
            ...getThemeStylesRef.current().body,
          },
          p: {
            'margin-bottom': '1em',
          },
        });

        // Display initial location
        const initialPosition = positionRef.current;
        if (initialPosition?.cfi) {
          await rendition.display(initialPosition.cfi);
        } else {
          await rendition.display();
        }

        // Mark as loaded immediately after display (don't wait for locations.generate)
        if (mounted) {
          setIsLoading(false);
          onReadyRef.current?.();
        }

        // Location change handler
        rendition.on('relocated', (location: any) => {
          if (mounted) {
            const cfi = location.start.cfi;
            const percentage = book.locations.percentageFromCfi(cfi) || 0;
            setPositionRef.current({
              cfi,
              percentage,
              chapter: location.start.index,
            });
            onLocationChangeRef.current?.(cfi, percentage);
          }
        });

        // Text selection handler
        rendition.on('selected', (cfiRange: string, contents: any) => {
          const selection = contents.window.getSelection();
          if (selection && selection.toString().trim()) {
            if (suppressSelectionRef.current) {
              suppressSelectionRef.current = false;
              selection.removeAllRanges();
              return;
            }
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            onTextSelect?.({
              text: selection.toString(),
              cfiRange,
              rect,
              source: 'selection',
            });
          }
        });

        // Generate locations in background for percentage tracking
        book.locations.generate(1024).catch(() => {});
      } catch (err) {
        console.error('Failed to load EPUB:', err);
        if (mounted) {
          setError('无法加载书籍，请稍后重试');
          setIsLoading(false);
        }
      }
    };

    initBook();

    return () => {
      mounted = false;
      resizeObserver?.disconnect();
      contentsRef.current.clear();
      bilingualCacheRef.current.clear();
      pendingTranslationRef.current.clear();
      if (renditionRef.current) {
        renditionRef.current.destroy();
      }
      if (bookRef.current) {
        bookRef.current.destroy();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  // Update settings when changed
  useEffect(() => {
    if (renditionRef.current) {
      renditionRef.current.themes.default({
        body: {
          'font-size': `${settings.fontSize}px`,
          'font-family': settings.fontFamily,
          'line-height': `${settings.lineHeight}`,
          ...getThemeStyles().body,
        },
      });
    }
  }, [settings, getThemeStyles]);

  // Apply highlights
  useEffect(() => {
    if (renditionRef.current) {
      // Clear existing highlights
      renditionRef.current.annotations.clear();

      // Add highlights
      highlights.forEach((highlight) => {
        const colors: Record<string, string> = {
          yellow: 'rgba(255, 235, 59, 0.4)',
          green: 'rgba(76, 175, 80, 0.4)',
          blue: 'rgba(33, 150, 243, 0.4)',
          pink: 'rgba(233, 30, 99, 0.4)',
          purple: 'rgba(156, 39, 176, 0.4)',
          orange: 'rgba(255, 152, 0, 0.4)',
        };

        renditionRef.current.annotations.highlight(
          highlight.cfiRange,
          { id: highlight.id },
          () => {
            // Handle click on highlight - could show detail panel
          },
          'highlight',
          { fill: colors[highlight.color] || colors.yellow }
        );
      });
    }
  }, [highlights]);

  useEffect(() => {
    if (selectedText) return;
    contentsRef.current.forEach((chapterOrder, contents) => {
      void applyPersistedTranslations(contents, chapterOrder);
    });
  }, [applyPersistedTranslations, selectedText]);

  // Navigation methods
  const goNext = useCallback(() => {
    renditionRef.current?.next();
  }, []);

  const goPrev = useCallback(() => {
    renditionRef.current?.prev();
  }, []);

  const goTo = useCallback((target: string) => {
    renditionRef.current?.display(target);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNext, goPrev]);

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
            <p className="text-sm text-muted-foreground">正在加载书籍...</p>
          </div>
        </div>
      )}
      <div
        ref={containerRef}
        className="h-full"
        style={{
          backgroundColor:
            settings.theme === 'dark'
              ? '#1a1a1a'
              : settings.theme === 'sepia'
              ? '#f4ecd8'
              : '#ffffff',
        }}
      />
      {/* Click areas for navigation */}
      <div
        className="absolute left-0 top-0 z-10 h-full w-1/4 cursor-pointer"
        onClick={goPrev}
      />
      <div
        className="absolute right-0 top-0 z-10 h-full w-1/4 cursor-pointer"
        onClick={goNext}
      />
    </div>
  );
}
