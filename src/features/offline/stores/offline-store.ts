'use client';

import { create } from 'zustand';
import type { BookDetail } from '@/features/library/types';
import type {
  DownloadedBook,
  DownloadTask,
  OfflineSettings,
  OfflineStorageInfo,
} from '../types';
import { DEFAULT_OFFLINE_SETTINGS } from '../types';
import {
  saveChapter,
  getChapter,
  hasChapter,
  getBookChapterCount,
  getBookStorageSize,
  deleteBookChapters,
  clearAllChapters,
} from '../lib/offline-db';

const SETTINGS_KEY = 'readmigo-offline-settings';
const METADATA_KEY = 'readmigo-offline-books';
const MAX_CONCURRENT = 3;
const MAX_RETRIES = 3;

// MARK: - State

interface OfflineState {
  downloadedBooks: DownloadedBook[];
  downloadQueue: DownloadTask[];
  activeTaskIds: Set<string>;
  isOnline: boolean;
  settings: OfflineSettings;
  storageInfo: OfflineStorageInfo | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  downloadBook: (book: BookDetail) => Promise<void>;
  pauseDownload: (bookId: string) => void;
  resumeDownload: (bookId: string) => Promise<void>;
  cancelDownload: (bookId: string) => Promise<void>;
  deleteBook: (bookId: string) => Promise<void>;
  deleteAllOfflineContent: () => Promise<void>;
  isBookAvailableOffline: (bookId: string) => boolean;
  getOfflineChapter: (bookId: string, chapterId: string) => Promise<string | null>;
  predownloadNextChapters: (bookId: string, currentIndex: number, bookDetail: BookDetail) => Promise<void>;
  updateSettings: (settings: Partial<OfflineSettings>) => void;
  refreshStorageInfo: () => Promise<void>;
  reportOfflineDownload: (bookId: string) => Promise<void>;
  removeOfflineDownloadRecord: (bookId: string) => Promise<void>;
}

// MARK: - Helpers

function loadSettings(): OfflineSettings {
  if (typeof localStorage === 'undefined') return DEFAULT_OFFLINE_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULT_OFFLINE_SETTINGS, ...JSON.parse(raw) };
  } catch {/* ignore */}
  return DEFAULT_OFFLINE_SETTINGS;
}

function saveSettings(settings: OfflineSettings): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function loadPersistedBooks(): DownloadedBook[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(METADATA_KEY);
    if (raw) return JSON.parse(raw);
  } catch {/* ignore */}
  return [];
}

function persistBooks(books: DownloadedBook[]): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(METADATA_KEY, JSON.stringify(books));
}

async function getStorageInfo(): Promise<OfflineStorageInfo | null> {
  if (typeof navigator === 'undefined' || !navigator.storage?.estimate) return null;
  try {
    const { usage = 0, quota = 0 } = await navigator.storage.estimate();
    return {
      used: usage,
      quota,
      percentage: quota > 0 ? (usage / quota) * 100 : 0,
      offlineContentSize: usage,
    };
  } catch {
    return null;
  }
}

// Fetch chapter meta + HTML (mirrors iOS downloadChapter logic)
async function fetchChapterContent(bookId: string, chapterId: string, quality: string = 'high'): Promise<string> {
  const metaRes = await fetch(`/api/proxy/books/${bookId}/content/${chapterId}?quality=${quality}`, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!metaRes.ok) throw new Error(`Chapter meta fetch failed: ${metaRes.status}`);
  const meta = await metaRes.json();

  const contentUrl: string = meta.contentUrl;
  if (!contentUrl) throw new Error('No contentUrl in chapter meta');

  const htmlRes = await fetch(contentUrl);
  if (!htmlRes.ok) throw new Error(`HTML fetch failed: ${htmlRes.status}`);
  return htmlRes.text();
}

// MARK: - Store

export const useOfflineStore = create<OfflineState>()((set, get) => {
  // Internal queue processing (not exposed on state)
  async function processQueue(): Promise<void> {
    const state = get();
    if (!state.isOnline) return;

    // G9: Enforce WiFi-only setting — pause queue on cellular/unknown networks
    if (state.settings.downloadOnWifiOnly) {
      // navigator.connection is a non-standard Network Information API
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const conn = (navigator as any).connection;
      // Only block when we can positively identify a non-wifi connection type.
      // If type is undefined (unsupported browsers), we allow downloads to proceed.
      if (conn?.type && conn.type !== 'wifi' && conn.type !== 'ethernet') {
        return;
      }
    }

    const { settings, downloadQueue, activeTaskIds } = state;
    const queuedTasks = downloadQueue.filter((t) => t.status === 'queued');
    const slots = MAX_CONCURRENT - activeTaskIds.size;
    if (slots <= 0 || queuedTasks.length === 0) return;

    // Sort: tasks with no retries first
    const toStart = queuedTasks.slice(0, slots);

    for (const task of toStart) {
      set((s) => ({
        activeTaskIds: new Set([...s.activeTaskIds, task.id]),
        downloadQueue: s.downloadQueue.map((t) =>
          t.id === task.id ? { ...t, status: 'downloading' as const } : t
        ),
      }));

      executeTask(task, settings);
    }
  }

  async function executeTask(task: DownloadTask, settings: OfflineSettings): Promise<void> {
    try {
      // Skip if already cached
      const already = await hasChapter(task.bookId, task.chapterId);
      if (already) {
        completeTask(task.id, task.bookId);
        return;
      }

      const html = await fetchChapterContent(task.bookId, task.chapterId, settings.downloadQuality);
      await saveChapter(task.bookId, task.chapterId, html);
      completeTask(task.id, task.bookId);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Download failed';
      failTask(task.id, task.bookId, errorMsg);
    }
  }

  function completeTask(taskId: string, bookId: string): void {
    set((s) => ({
      activeTaskIds: new Set([...s.activeTaskIds].filter((id) => id !== taskId)),
      downloadQueue: s.downloadQueue.filter((t) => t.id !== taskId),
    }));

    updateBookProgress(bookId);
    processQueue();
  }

  function failTask(taskId: string, bookId: string, error: string): void {
    set((s) => {
      const idx = s.downloadQueue.findIndex((t) => t.id === taskId);
      if (idx === -1) return { activeTaskIds: new Set([...s.activeTaskIds].filter((id) => id !== taskId)) };

      const task = s.downloadQueue[idx];
      const newRetryCount = task.retryCount + 1;
      const canRetry = newRetryCount < MAX_RETRIES;

      const updatedQueue = s.downloadQueue.map((t) =>
        t.id === taskId
          ? { ...t, status: canRetry ? ('queued' as const) : ('failed' as const), retryCount: newRetryCount, errorMessage: error }
          : t
      );

      return {
        activeTaskIds: new Set([...s.activeTaskIds].filter((id) => id !== taskId)),
        downloadQueue: updatedQueue,
      };
    });

    updateBookProgress(bookId);
    processQueue();
  }

  async function updateBookProgress(bookId: string): Promise<void> {
    const state = get();
    const book = state.downloadedBooks.find((b) => b.bookId === bookId);
    if (!book) return;

    const downloadedCount = await getBookChapterCount(bookId);
    const sizeBytes = await getBookStorageSize(bookId);
    const queueTasks = get().downloadQueue.filter((t) => t.bookId === bookId);
    const hasFailed = queueTasks.some((t) => t.status === 'failed');
    const isComplete = downloadedCount >= book.totalChapters && queueTasks.length === 0;
    const isDownloading = queueTasks.some((t) => t.status === 'downloading' || t.status === 'queued');

    const status = isComplete
      ? 'completed'
      : hasFailed
        ? 'failed'
        : isDownloading
          ? 'downloading'
          : 'queued';

    const updatedBook: DownloadedBook = {
      ...book,
      downloadedChapters: downloadedCount,
      downloadedSizeBytes: sizeBytes,
      status: status as DownloadedBook['status'],
      downloadCompletedAt: isComplete ? Date.now() : book.downloadCompletedAt,
    };

    set((s) => ({
      downloadedBooks: s.downloadedBooks.map((b) => (b.bookId === bookId ? updatedBook : b)),
    }));

    persistBooks(get().downloadedBooks);

    // Report to server when complete
    if (isComplete) {
      get().reportOfflineDownload(bookId);
    }
  }

  return {
    downloadedBooks: [],
    downloadQueue: [],
    activeTaskIds: new Set(),
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    settings: DEFAULT_OFFLINE_SETTINGS,
    storageInfo: null,
    isInitialized: false,

    initialize: async () => {
      if (get().isInitialized) return;

      const settings = loadSettings();
      const downloadedBooks = loadPersistedBooks();
      const storageInfo = await getStorageInfo();

      // Reconcile: remove books whose chapters were cleared (e.g., storage cleared)
      const reconciledBooks = await Promise.all(
        downloadedBooks.map(async (book) => {
          if (book.status === 'completed') {
            const count = await getBookChapterCount(book.bookId);
            if (count === 0) {
              return { ...book, status: 'not_downloaded' as const, downloadedChapters: 0 };
            }
          }
          return book;
        })
      );

      set({
        settings,
        downloadedBooks: reconciledBooks.filter((b) => b.status !== 'not_downloaded'),
        storageInfo,
        isInitialized: true,
      });

      // Set up network listeners
      if (typeof window !== 'undefined') {
        window.addEventListener('online', () => {
          set({ isOnline: true });
          // Resume paused downloads on reconnect
          set((s) => ({
            downloadQueue: s.downloadQueue.map((t) =>
              t.status === 'paused' ? { ...t, status: 'queued' as const } : t
            ),
          }));
          processQueue();
        });
        window.addEventListener('offline', () => {
          set({ isOnline: false });
        });
      }
    },

    downloadBook: async (book: BookDetail) => {
      const state = get();

      // Check if already fully downloaded
      const existing = state.downloadedBooks.find((b) => b.bookId === book.id);
      if (existing?.status === 'completed') return;

      const now = Date.now();
      const { autoDeleteAfterDays } = state.settings;
      const expiresAt = autoDeleteAfterDays > 0
        ? now + autoDeleteAfterDays * 86400_000
        : undefined;

      const downloadedBook: DownloadedBook = {
        id: crypto.randomUUID(),
        bookId: book.id,
        title: book.title,
        author: book.author,
        coverUrl: book.coverUrl || undefined,
        totalChapters: book.chapters.length,
        downloadedChapters: 0,
        totalSizeBytes: (book.wordCount || 0) * 10,
        downloadedSizeBytes: 0,
        status: 'queued',
        priority: 1,
        downloadStartedAt: now,
        expiresAt,
      };

      set((s) => ({
        downloadedBooks: existing
          ? s.downloadedBooks.map((b) => (b.bookId === book.id ? downloadedBook : b))
          : [...s.downloadedBooks, downloadedBook],
      }));

      // Queue chapter tasks (null means "fetch all", [] means "fetch nothing yet")
      const existingChapterIds: string[] | null = existing
        ? await getBookChapterCount(book.id).then((n) => (n > 0 ? null : []))
        : [];

      const newTasks: DownloadTask[] = book.chapters
        .filter((ch) => !existingChapterIds || !existingChapterIds.includes(ch.id))
        .map((ch) => ({
          id: crypto.randomUUID(),
          bookId: book.id,
          chapterId: ch.id,
          status: 'queued' as const,
          retryCount: 0,
        }));

      set((s) => ({ downloadQueue: [...s.downloadQueue, ...newTasks] }));
      persistBooks(get().downloadedBooks);
      processQueue();
    },

    pauseDownload: (bookId: string) => {
      set((s) => ({
        downloadQueue: s.downloadQueue.map((t) =>
          t.bookId === bookId && (t.status === 'queued' || t.status === 'downloading')
            ? { ...t, status: 'paused' as const }
            : t
        ),
        downloadedBooks: s.downloadedBooks.map((b) =>
          b.bookId === bookId && b.status !== 'completed'
            ? { ...b, status: 'paused' as const }
            : b
        ),
      }));
      persistBooks(get().downloadedBooks);
    },

    resumeDownload: async (bookId: string) => {
      set((s) => ({
        downloadQueue: s.downloadQueue.map((t) =>
          t.bookId === bookId && t.status === 'paused'
            ? { ...t, status: 'queued' as const }
            : t
        ),
        downloadedBooks: s.downloadedBooks.map((b) =>
          b.bookId === bookId && b.status === 'paused'
            ? { ...b, status: 'downloading' as const }
            : b
        ),
      }));
      persistBooks(get().downloadedBooks);
      processQueue();
    },

    cancelDownload: async (bookId: string) => {
      set((s) => ({
        downloadQueue: s.downloadQueue.filter((t) => t.bookId !== bookId),
        activeTaskIds: new Set<string>([...s.activeTaskIds].filter((id) => {
          const task = s.downloadQueue.find((t) => t.id === id);
          return task?.bookId !== bookId;
        })),
        downloadedBooks: s.downloadedBooks.filter((b) => b.bookId !== bookId),
      }));
      await deleteBookChapters(bookId);
      persistBooks(get().downloadedBooks);
      get().refreshStorageInfo();
    },

    deleteBook: async (bookId: string) => {
      await get().cancelDownload(bookId);
      get().removeOfflineDownloadRecord(bookId);
    },

    deleteAllOfflineContent: async () => {
      set({ downloadQueue: [], activeTaskIds: new Set(), downloadedBooks: [] });
      await clearAllChapters();
      persistBooks([]);
      get().refreshStorageInfo();
    },

    isBookAvailableOffline: (bookId: string) => {
      return get().downloadedBooks.some((b) => b.bookId === bookId && b.status === 'completed');
    },

    getOfflineChapter: async (bookId: string, chapterId: string) => {
      return getChapter(bookId, chapterId);
    },

    predownloadNextChapters: async (bookId: string, currentIndex: number, bookDetail: BookDetail) => {
      const state = get();
      if (!state.isOnline) return;
      const { predownloadNextChapters } = state.settings;

      const start = currentIndex + 1;
      const end = Math.min(start + predownloadNextChapters, bookDetail.chapters.length);

      const newTasks: DownloadTask[] = [];
      for (let i = start; i < end; i++) {
        const chapter = bookDetail.chapters[i];
        const already = await hasChapter(bookId, chapter.id);
        const inQueue = state.downloadQueue.some(
          (t) => t.bookId === bookId && t.chapterId === chapter.id
        );
        if (!already && !inQueue) {
          newTasks.push({
            id: crypto.randomUUID(),
            bookId,
            chapterId: chapter.id,
            status: 'queued',
            retryCount: 0,
          });
        }
      }

      if (newTasks.length > 0) {
        set((s) => ({ downloadQueue: [...s.downloadQueue, ...newTasks] }));
        processQueue();
      }
    },

    updateSettings: (partial: Partial<OfflineSettings>) => {
      const newSettings = { ...get().settings, ...partial };
      set({ settings: newSettings });
      saveSettings(newSettings);
    },

    refreshStorageInfo: async () => {
      const info = await getStorageInfo();
      set({ storageInfo: info });
    },

    reportOfflineDownload: async (bookId: string) => {
      try {
        await fetch('/api/proxy/usage/offline-downloads', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookId }),
        });
      } catch {/* silent */}
    },

    removeOfflineDownloadRecord: async (bookId: string) => {
      try {
        await fetch(`/api/proxy/usage/offline-downloads/${bookId}`, {
          method: 'DELETE',
          credentials: 'same-origin',
        });
      } catch {/* silent */}
    },
  };
});
