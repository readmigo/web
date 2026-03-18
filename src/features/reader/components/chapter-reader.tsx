'use client';

import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useTranslations } from 'next-intl';
import type { TocItem, SelectedText } from '../types';
import type { Chapter } from '@/features/library/types';
import { useChapterLoader } from '../hooks/use-chapter-loader';
import { usePageNavigation } from '../hooks/use-page-navigation';
import { useTextSelection } from '../hooks/use-text-selection';
import { useTranslationInteraction } from '../hooks/use-translation-interaction';

export interface ChapterReaderHandle {
  goTo: (chapterId: string) => void;
  goNext: () => void;
  goPrev: () => void;
  getCurrentPageText: () => string;
  getContentElement: () => HTMLElement | null;
  getCurrentChapterId: () => string | undefined;
}

interface ChapterReaderProps {
  bookId: string;
  chapters: Chapter[];
  initialChapterIndex?: number;
  onReady?: () => void;
  onTextSelect?: (selection: SelectedText) => void;
  onTocLoaded?: (toc: TocItem[]) => void;
  onParagraphClick?: (text: string) => void;
  /** Called when a reader-engine image is clicked. Provides all image srcs in the chapter and the clicked index. */
  onImageClick?: (images: string[], index: number) => void;
}

export const ChapterReader = forwardRef<ChapterReaderHandle, ChapterReaderProps>(
  function ChapterReader({ bookId, chapters, initialChapterIndex, onReady, onTextSelect, onTocLoaded, onParagraphClick, onImageClick }, ref) {
    const t = useTranslations('reader');
    const bookIdRef = useRef(bookId);
    useEffect(() => { bookIdRef.current = bookId; }, [bookId]);
    const suppressSelectionRef = useRef(false);

    // --- Translation & interaction gestures ---
    const { setupInteractions, cleanupRef, clearCaches } = useTranslationInteraction(
      { bookIdRef, suppressSelectionRef },
      onTextSelect,
      onParagraphClick,
      onImageClick,
    );

    // --- Chapter loading, renderer, paginator, settings ---
    const {
      containerRef,
      rendererRef,
      paginatorRef,
      currentIndexRef,
      isLoading,
      error,
      themeColors,
      loadChapter,
      emitPosition,
    } = useChapterLoader(
      bookId,
      chapters,
      initialChapterIndex,
      setupInteractions,
      cleanupRef,
      clearCaches,
      onReady,
      onTocLoaded,
    );

    // --- Keyboard & page navigation ---
    const { goNext, goPrev } = usePageNavigation(
      paginatorRef,
      currentIndexRef,
      chapters.length,
      emitPosition,
      loadChapter,
    );

    // --- Text selection detection ---
    useTextSelection(rendererRef, chapters, currentIndexRef, suppressSelectionRef, onTextSelect);

    // --- Imperative handle ---
    useImperativeHandle(ref, () => ({
      goTo: (chapterId: string) => {
        const idx = chapters.findIndex((ch) => ch.id === chapterId);
        if (idx !== -1) void loadChapter(idx);
      },
      goNext,
      goPrev,
      getCurrentPageText: () => {
        if (!containerRef.current) return '';
        const nodes = containerRef.current.querySelectorAll('p, blockquote, figcaption, h1, h2, h3, h4');
        return Array.from(nodes)
          .map((n) => (n as HTMLElement).innerText || n.textContent || '')
          .filter((txt) => txt.trim().length > 0)
          .join('\n\n');
      },
      getContentElement: () => rendererRef.current?.contentElement ?? null,
      getCurrentChapterId: () => chapters[currentIndexRef.current]?.id,
    }), [chapters, goNext, goPrev, loadChapter, containerRef, rendererRef, currentIndexRef]);

    // --- Render ---

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
              <p className="text-sm text-muted-foreground">{t('loadingChapter')}</p>
            </div>
          </div>
        )}
        <div
          ref={containerRef}
          className="relative h-full"
          style={{ backgroundColor: themeColors.background }}
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
  },
);
