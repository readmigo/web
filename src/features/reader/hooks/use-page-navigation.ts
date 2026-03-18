import { useEffect, useCallback } from 'react';
import type { Paginator } from '../engine/paginator';

/**
 * Wires keyboard navigation (ArrowLeft / ArrowRight / Space) and exposes
 * goNext / goPrev helpers that handle cross-chapter boundaries.
 */
export function usePageNavigation(
  paginatorRef: React.RefObject<Paginator | null>,
  currentIndexRef: React.RefObject<number>,
  chaptersLength: number,
  emitPosition: (chapterIdx: number, page: number, totalPages: number) => void,
  loadChapter: (index: number, goToLastPage?: boolean) => Promise<void>,
) {
  const goNext = useCallback(() => {
    if (!paginatorRef.current) return;
    if (!paginatorRef.current.isLastPage) {
      paginatorRef.current.nextPage();
      emitPosition(
        currentIndexRef.current,
        paginatorRef.current.currentPage,
        paginatorRef.current.totalPages,
      );
    } else if (currentIndexRef.current < chaptersLength - 1) {
      void loadChapter(currentIndexRef.current + 1);
    }
  }, [paginatorRef, currentIndexRef, chaptersLength, emitPosition, loadChapter]);

  const goPrev = useCallback(() => {
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
  }, [paginatorRef, currentIndexRef, emitPosition, loadChapter]);

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

  return { goNext, goPrev };
}
