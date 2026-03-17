'use client';

import { useEffect, useRef, useCallback } from 'react';
import { apiClient } from '@/lib/api/client';
import { log } from '@/lib/logger';
import { useReaderStore } from '../stores/reader-store';

const DEBOUNCE_MS = 3000; // Aligned with iOS 3-second debounce

/**
 * Debounced reading position sync aligned with iOS ReadingProgressStore.
 * Syncs position to backend every 3 seconds (matching iOS behavior).
 * iOS uses: PATCH /reading/progress/{bookId}
 */
export function usePositionSync(bookId: string) {
  const position = useReaderStore((s) => s.position);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSyncedRef = useRef<string>('');

  const syncPosition = useCallback(async () => {
    if (!position || !bookId) return;

    const key = `${position.chapterIndex}:${position.page}:${position.percentage}`;
    if (key === lastSyncedRef.current) return;
    lastSyncedRef.current = key;

    try {
      await apiClient.patch(`/reading/progress/${bookId}`, {
        chapterIndex: position.chapterIndex,
        scrollPosition: position.percentage,
        cfi: `ch:${position.chapterIndex}:pg:${position.page}`,
        pageNumber: position.page,
        updatedAt: Date.now(),
      });
    } catch (err) {
      // Silently fail — will retry on next position change
      log.reader.debug('Position sync failed', err);
    }
  }, [bookId, position]);

  useEffect(() => {
    if (!position || !bookId) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(syncPosition, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [position, bookId, syncPosition]);

  // Sync on unmount (user leaves reader)
  useEffect(() => {
    return () => {
      syncPosition();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
