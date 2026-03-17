'use client';

import { useMemo } from 'react';
import { useContinueReading } from './use-user-library';
import { useReaderStore } from '@/features/reader/stores/reader-store';
import type { UserBook } from '../types';

/**
 * Merges cloud "continue reading" data with locally persisted reading progress
 * from the reader store (localStorage).
 *
 * Merge strategy: for each book present in the cloud list, if the local
 * bookStats entry has a more recent `lastReadAt` timestamp, the local
 * progress percentage is used instead of the cloud value.
 *
 * Books that only exist locally (no cloud record) are intentionally excluded
 * because we lack the full `Book` metadata required to render a card.
 */
export function useMergedReadingProgress(): {
  data: UserBook[] | undefined;
  isLoading: boolean;
} {
  const { data: cloudBooks, isLoading } = useContinueReading();
  const bookStats = useReaderStore((s) => s.bookStats);

  const merged = useMemo<UserBook[] | undefined>(() => {
    if (!cloudBooks) return undefined;

    const result = cloudBooks.map((userBook): UserBook => {
      const localStats = bookStats[userBook.bookId];
      if (!localStats) return userBook;

      const cloudLastReadAt = userBook.lastReadAt
        ? new Date(userBook.lastReadAt).getTime()
        : 0;
      const localLastReadAt = localStats.lastReadAt;

      // Local progress is more recent — override cloud progress
      if (localLastReadAt > cloudLastReadAt && localStats.lastPosition) {
        const localProgress = Math.round(localStats.lastPosition.percentage);
        return {
          ...userBook,
          progress: localProgress,
          lastReadAt: new Date(localLastReadAt),
        };
      }

      return userBook;
    });

    // Sort by lastReadAt descending so the most recently read book is first
    return result.sort((a, b) => {
      const aTime = a.lastReadAt ? new Date(a.lastReadAt).getTime() : 0;
      const bTime = b.lastReadAt ? new Date(b.lastReadAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [cloudBooks, bookStats]);

  return { data: merged, isLoading };
}
