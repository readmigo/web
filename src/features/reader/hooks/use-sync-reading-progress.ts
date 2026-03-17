'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

const SYNC_QUEUE_KEY = 'readmigo-progress-sync-queue';

interface ProgressSyncItem {
  bookId: string;
  percentage: number;
  chapterIndex: number;
  page: number;
  lastReadAt: number; // epoch ms
}

// ─── Queue helpers (pure localStorage, no React) ────────────────────────────

function loadQueue(): ProgressSyncItem[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SYNC_QUEUE_KEY);
    return raw ? (JSON.parse(raw) as ProgressSyncItem[]) : [];
  } catch {
    return [];
  }
}

function saveQueue(items: ProgressSyncItem[]): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(items));
  } catch {
    // localStorage quota exceeded — silently ignore
  }
}

function enqueue(item: ProgressSyncItem): void {
  const queue = loadQueue();
  // Replace any existing entry for the same book so we never queue stale data
  const filtered = queue.filter((q) => q.bookId !== item.bookId);
  saveQueue([...filtered, item]);
}

function dequeueBook(bookId: string): void {
  const queue = loadQueue().filter((q) => q.bookId !== bookId);
  saveQueue(queue);
}

// ─── API call ────────────────────────────────────────────────────────────────

async function pushProgressToServer(item: ProgressSyncItem): Promise<void> {
  await apiClient.patch(`/reading/progress/${item.bookId}`, {
    chapterIndex: item.chapterIndex,
    scrollPosition: item.percentage,
    cfi: `ch:${item.chapterIndex}:pg:${item.page}`,
    pageNumber: item.page,
    updatedAt: item.lastReadAt,
  });
}

// ─── Flush all queued items ───────────────────────────────────────────────────

async function flushQueue(): Promise<void> {
  const queue = loadQueue();
  if (queue.length === 0) return;

  await Promise.allSettled(
    queue.map(async (item) => {
      try {
        await pushProgressToServer(item);
        dequeueBook(item.bookId);
      } catch {
        // Keep item in queue for the next online event
      }
    })
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

interface SyncProgressOptions {
  bookId: string;
  percentage: number;
  chapterIndex: number;
  page: number;
}

/**
 * Handles syncing local reading progress to the server when the reader
 * unmounts (e.g., user closes the reader).
 *
 * When offline, the progress item is placed in a localStorage queue.
 * The next time the browser goes online the queue is flushed automatically.
 *
 * Usage: call `syncOnClose(options)` imperatively (e.g., in a reader cleanup
 * effect), or rely on the auto-flush that happens when connectivity resumes.
 */
export function useSyncReadingProgress() {
  const queryClient = useQueryClient();
  const isFlushing = useRef(false);

  const flush = useCallback(async () => {
    if (isFlushing.current) return;
    isFlushing.current = true;
    try {
      await flushQueue();
      // Refresh library data so UI reflects updated progress
      queryClient.invalidateQueries({ queryKey: ['continueReading'] });
    } finally {
      isFlushing.current = false;
    }
  }, [queryClient]);

  // Auto-flush when the browser comes back online
  useEffect(() => {
    const handleOnline = () => {
      void flush();
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [flush]);

  /**
   * Call this when the reader closes to attempt an immediate sync.
   * If the request fails (offline), the item is saved to the queue.
   */
  const syncOnClose = useCallback(
    async ({ bookId, percentage, chapterIndex, page }: SyncProgressOptions) => {
      const item: ProgressSyncItem = {
        bookId,
        percentage,
        chapterIndex,
        page,
        lastReadAt: Date.now(),
      };

      if (!navigator.onLine) {
        enqueue(item);
        return;
      }

      try {
        await pushProgressToServer(item);
        // Dequeue in case there was a stale entry from a previous offline session
        dequeueBook(bookId);
        queryClient.invalidateQueries({ queryKey: ['continueReading'] });
      } catch {
        // Network error despite onLine — persist for retry
        enqueue(item);
      }
    },
    [queryClient]
  );

  return { syncOnClose };
}
