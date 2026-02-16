import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ReaderSettings, ReaderPosition, Highlight, Bookmark, SelectedText } from '../types';
import { apiClient } from '@/lib/api/client';
import { addToOfflineQueue } from '../hooks/use-highlights';
import { buildParagraphKey } from '../utils/translation-hash';

// Reading session for tracking time and progress
interface ReadingSession {
  bookId: string;
  startTime: number;
  lastActiveTime: number;
  wordsRead: number;
  pagesRead: number;
  startPercentage: number;
}

// Per-book reading statistics
interface BookReadingStats {
  bookId: string;
  totalReadingTime: number; // in seconds
  totalWordsRead: number;
  lastReadAt: number;
  lastPosition: ReaderPosition | null;
  sessionsCount: number;
  averageWpm: number;
}

interface ReaderState {
  // Settings
  settings: ReaderSettings;

  // Current position
  position: ReaderPosition | null;

  // UI state
  showToc: boolean;
  showSettings: boolean;
  showAiPanel: boolean;
  showReadingStats: boolean;

  // Selection
  selectedText: SelectedText | null;

  // Paragraph translation state
  translationStates: Record<string, { translation?: string; updatedAt: number }>;

  // Bookmarks & Highlights
  bookmarks: Bookmark[];
  highlights: Highlight[];

  // Reading session tracking
  currentSession: ReadingSession | null;
  bookStats: Record<string, BookReadingStats>;

  // Sync state
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  pendingSync: Set<string>;
}

interface ReaderActions {
  // Settings
  updateSettings: (settings: Partial<ReaderSettings>) => void;
  resetSettings: () => void;

  // Position
  setPosition: (position: ReaderPosition) => void;

  // UI
  toggleToc: () => void;
  toggleSettings: () => void;
  toggleAiPanel: () => void;
  setShowAiPanel: (show: boolean) => void;
  toggleReadingStats: () => void;

  // Selection
  setSelectedText: (selection: SelectedText | null) => void;

  // Paragraph translation state
  markParagraphTranslated: (
    bookId: string,
    chapterOrder: number,
    textHash: string,
    translation?: string
  ) => void;
  clearParagraphTranslation: (
    bookId: string,
    chapterOrder: number,
    textHash: string
  ) => void;
  getParagraphTranslation: (
    bookId: string,
    chapterOrder: number,
    textHash: string
  ) => string | undefined;
  isParagraphTranslated: (
    bookId: string,
    chapterOrder: number,
    textHash: string
  ) => boolean;

  // Bookmarks
  addBookmark: (bookmark: Omit<Bookmark, 'id' | 'createdAt'>) => void;
  removeBookmark: (id: string, bookId: string) => void;

  // Highlights
  addHighlight: (highlight: Omit<Highlight, 'id' | 'createdAt'>) => void;
  removeHighlight: (id: string, bookId: string) => void;
  updateHighlightNote: (id: string, bookId: string, note: string) => void;
  updateHighlightColor: (id: string, bookId: string, color: Highlight['color']) => void;

  // Reading session tracking
  startReadingSession: (bookId: string, currentPercentage: number) => void;
  updateReadingActivity: (wordsRead?: number) => void;
  endReadingSession: () => void;
  getBookStats: (bookId: string) => BookReadingStats | null;
  getLastPosition: (bookId: string) => ReaderPosition | null;
  getCurrentSessionDuration: () => number;

  // Sync
  syncHighlightsFromBackend: (bookId: string) => Promise<void>;
  syncBookmarksFromBackend: (bookId: string) => Promise<void>;
  getHighlightsForBook: (bookId: string) => Highlight[];
  getBookmarksForBook: (bookId: string) => Bookmark[];
}

const defaultSettings: ReaderSettings = {
  fontSize: 16,
  fontFamily: 'serif',
  lineHeight: 1.6,
  theme: 'light',
  marginSize: 'medium',
};

const MAX_TRANSLATIONS_PER_BOOK = 1000;

export const useReaderStore = create<ReaderState & ReaderActions>()(
  persist(
    (set, get) => ({
      // Initial state
      settings: defaultSettings,
      position: null,
      showToc: false,
      showSettings: false,
      showAiPanel: false,
      showReadingStats: false,
      selectedText: null,
      translationStates: {},
      bookmarks: [],
      highlights: [],
      currentSession: null,
      bookStats: {},
      isSyncing: false,
      lastSyncedAt: null,
      pendingSync: new Set<string>(),

      // Settings actions
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),

      resetSettings: () =>
        set({ settings: defaultSettings }),

      // Position actions
      setPosition: (position) => {
        const { currentSession, bookStats } = get();

        // Update book stats with latest position
        if (currentSession && position) {
          const existingStats = bookStats[currentSession.bookId];
          set({
            position,
            bookStats: {
              ...bookStats,
              [currentSession.bookId]: {
                ...(existingStats || {
                  bookId: currentSession.bookId,
                  totalReadingTime: 0,
                  totalWordsRead: 0,
                  sessionsCount: 0,
                  averageWpm: 0,
                }),
                lastReadAt: Date.now(),
                lastPosition: position,
              },
            },
          });
        } else {
          set({ position });
        }
      },

      // UI actions
      toggleToc: () =>
        set((state) => ({ showToc: !state.showToc })),

      toggleSettings: () =>
        set((state) => ({ showSettings: !state.showSettings })),

      toggleAiPanel: () =>
        set((state) => ({ showAiPanel: !state.showAiPanel })),

      setShowAiPanel: (show) =>
        set({ showAiPanel: show }),

      toggleReadingStats: () =>
        set((state) => ({ showReadingStats: !state.showReadingStats })),

      // Selection actions
      setSelectedText: (selection) =>
        set({ selectedText: selection }),

      // Paragraph translation actions
      markParagraphTranslated: (bookId, chapterOrder, textHash, translation) =>
        set((state) => {
          const key = buildParagraphKey(bookId, chapterOrder, textHash);
          const next = {
            ...state.translationStates,
            [key]: {
              translation,
              updatedAt: Date.now(),
            },
          };

          const bookPrefix = `${bookId}:`;
          const bookKeys = Object.keys(next).filter((k) => k.startsWith(bookPrefix));
          if (bookKeys.length > MAX_TRANSLATIONS_PER_BOOK) {
            const sorted = bookKeys
              .map((k) => ({ key: k, updatedAt: next[k]?.updatedAt || 0 }))
              .sort((a, b) => a.updatedAt - b.updatedAt);
            const excess = sorted.length - MAX_TRANSLATIONS_PER_BOOK;
            for (let i = 0; i < excess; i += 1) {
              delete next[sorted[i].key];
            }
          }

          return { translationStates: next };
        }),

      clearParagraphTranslation: (bookId, chapterOrder, textHash) =>
        set((state) => {
          const key = buildParagraphKey(bookId, chapterOrder, textHash);
          if (!state.translationStates[key]) {
            return state;
          }
          const next = { ...state.translationStates };
          delete next[key];
          return { translationStates: next };
        }),

      getParagraphTranslation: (bookId, chapterOrder, textHash) => {
        const key = buildParagraphKey(bookId, chapterOrder, textHash);
        return get().translationStates[key]?.translation;
      },

      isParagraphTranslated: (bookId, chapterOrder, textHash) => {
        const key = buildParagraphKey(bookId, chapterOrder, textHash);
        return Boolean(get().translationStates[key]);
      },

      // Bookmark actions with backend sync
      addBookmark: (bookmark) => {
        const newBookmark: Bookmark = {
          ...bookmark,
          id: crypto.randomUUID(),
          createdAt: new Date(),
        };

        // Optimistic update - add to local state immediately
        set((state) => ({
          bookmarks: [...state.bookmarks, newBookmark],
          pendingSync: new Set([...state.pendingSync, newBookmark.id]),
        }));

        // Sync to backend
        apiClient
          .post('/reading/bookmarks', {
            bookId: bookmark.bookId,
            cfi: bookmark.cfi,
            title: bookmark.title,
          })
          .then((response) => {
            // Update local ID with server ID
            const serverBookmark = (response as { data: { id: string } }).data;
            set((state) => ({
              bookmarks: state.bookmarks.map((b) =>
                b.id === newBookmark.id
                  ? { ...b, id: serverBookmark.id }
                  : b
              ),
              pendingSync: new Set(
                [...state.pendingSync].filter((id) => id !== newBookmark.id)
              ),
            }));
          })
          .catch((error) => {
            console.error('Failed to sync bookmark to backend:', error);
            // Add to offline queue for retry
            addToOfflineQueue({
              type: 'create_bookmark',
              data: {
                bookId: bookmark.bookId,
                cfi: bookmark.cfi,
                title: bookmark.title,
              },
            });
          });
      },

      removeBookmark: (id, bookId) => {
        // Optimistic update - remove from local state immediately
        set((state) => ({
          bookmarks: state.bookmarks.filter((b) => b.id !== id),
        }));

        // Sync to backend
        apiClient.delete(`/reading/bookmarks/${id}`).catch((error) => {
          console.error('Failed to delete bookmark from backend:', error);
          // Add to offline queue for retry
          addToOfflineQueue({
            type: 'delete_bookmark',
            data: { bookmarkId: id, bookId },
          });
        });
      },

      // Highlight actions with backend sync
      addHighlight: (highlight) => {
        const newHighlight: Highlight = {
          ...highlight,
          id: crypto.randomUUID(),
          createdAt: new Date(),
        };

        // Optimistic update - add to local state immediately
        set((state) => ({
          highlights: [...state.highlights, newHighlight],
          pendingSync: new Set([...state.pendingSync, newHighlight.id]),
        }));

        // Sync to backend
        apiClient
          .post('/reading/highlights', {
            bookId: highlight.bookId,
            cfiRange: highlight.cfiRange,
            text: highlight.text,
            color: highlight.color,
            note: highlight.note,
          })
          .then((response) => {
            // Update local ID with server ID
            const serverHighlight = (response as { data: { id: string } }).data;
            set((state) => ({
              highlights: state.highlights.map((h) =>
                h.id === newHighlight.id
                  ? { ...h, id: serverHighlight.id }
                  : h
              ),
              pendingSync: new Set(
                [...state.pendingSync].filter((id) => id !== newHighlight.id)
              ),
            }));
          })
          .catch((error) => {
            console.error('Failed to sync highlight to backend:', error);
            // Add to offline queue for retry
            addToOfflineQueue({
              type: 'create_highlight',
              data: {
                bookId: highlight.bookId,
                cfiRange: highlight.cfiRange,
                text: highlight.text,
                color: highlight.color,
                note: highlight.note,
              },
            });
          });
      },

      removeHighlight: (id, bookId) => {
        // Optimistic update - remove from local state immediately
        set((state) => ({
          highlights: state.highlights.filter((h) => h.id !== id),
        }));

        // Sync to backend
        apiClient.delete(`/reading/highlights/${id}`).catch((error) => {
          console.error('Failed to delete highlight from backend:', error);
          // Add to offline queue for retry
          addToOfflineQueue({
            type: 'delete_highlight',
            data: { highlightId: id, bookId },
          });
        });
      },

      updateHighlightNote: (id, bookId, note) => {
        // Optimistic update
        set((state) => ({
          highlights: state.highlights.map((h) =>
            h.id === id ? { ...h, note } : h
          ),
        }));

        // Sync to backend
        apiClient.patch(`/reading/highlights/${id}`, { note }).catch((error) => {
          console.error('Failed to update highlight note:', error);
          // Add to offline queue for retry
          addToOfflineQueue({
            type: 'update_highlight',
            data: { highlightId: id, bookId, note },
          });
        });
      },

      updateHighlightColor: (id, bookId, color) => {
        // Optimistic update
        set((state) => ({
          highlights: state.highlights.map((h) =>
            h.id === id ? { ...h, color } : h
          ),
        }));

        // Sync to backend
        apiClient.patch(`/reading/highlights/${id}`, { color }).catch((error) => {
          console.error('Failed to update highlight color:', error);
          // Add to offline queue for retry
          addToOfflineQueue({
            type: 'update_highlight',
            data: { highlightId: id, bookId, color },
          });
        });
      },

      // Reading session tracking
      startReadingSession: (bookId: string, currentPercentage: number) => {
        const now = Date.now();
        set({
          currentSession: {
            bookId,
            startTime: now,
            lastActiveTime: now,
            wordsRead: 0,
            pagesRead: 0,
            startPercentage: currentPercentage,
          },
        });
      },

      updateReadingActivity: (wordsRead?: number) => {
        const { currentSession } = get();
        if (!currentSession) return;

        set({
          currentSession: {
            ...currentSession,
            lastActiveTime: Date.now(),
            wordsRead: currentSession.wordsRead + (wordsRead || 0),
          },
        });
      },

      endReadingSession: () => {
        const { currentSession, bookStats, position } = get();
        if (!currentSession) return;

        const now = Date.now();
        const sessionDuration = Math.floor((now - currentSession.startTime) / 1000);
        const existingStats = bookStats[currentSession.bookId];

        // Calculate reading progress
        const progressMade = position
          ? Math.max(0, position.percentage - currentSession.startPercentage)
          : 0;

        // Estimate words read based on progress (assuming ~250 words per percentage point)
        const estimatedWordsRead = Math.floor(progressMade * 25000); // ~250k words per book

        const totalWordsRead = (existingStats?.totalWordsRead || 0) + estimatedWordsRead;
        const totalTime = (existingStats?.totalReadingTime || 0) + sessionDuration;
        const sessionsCount = (existingStats?.sessionsCount || 0) + 1;

        // Calculate average WPM
        const averageWpm = totalTime > 0 ? Math.round((totalWordsRead / totalTime) * 60) : 0;

        set({
          currentSession: null,
          bookStats: {
            ...bookStats,
            [currentSession.bookId]: {
              bookId: currentSession.bookId,
              totalReadingTime: totalTime,
              totalWordsRead,
              lastReadAt: now,
              lastPosition: position,
              sessionsCount,
              averageWpm,
            },
          },
        });

        // Sync reading progress to backend
        if (position) {
          apiClient
            .post('/reading/progress', {
              bookId: currentSession.bookId,
              cfi: position.cfi,
              percentage: position.percentage,
              chapter: position.chapter,
              readingTime: sessionDuration,
            })
            .catch((error) => {
              console.error('Failed to sync reading progress:', error);
            });
        }
      },

      getBookStats: (bookId: string) => {
        return get().bookStats[bookId] || null;
      },

      getLastPosition: (bookId: string) => {
        return get().bookStats[bookId]?.lastPosition || null;
      },

      getCurrentSessionDuration: () => {
        const { currentSession } = get();
        if (!currentSession) return 0;
        return Math.floor((Date.now() - currentSession.startTime) / 1000);
      },

      // Sync methods
      syncHighlightsFromBackend: async (bookId: string) => {
        set({ isSyncing: true });
        try {
          const response = await apiClient.get<{
            data: Array<{
              id: string;
              bookId: string;
              cfiRange: string;
              text: string;
              color: string;
              note?: string;
              createdAt: string;
            }>;
          }>('/reading/highlights', { params: { bookId } });

          const serverHighlights: Highlight[] = (response.data || []).map(
            (h) => ({
              id: h.id,
              bookId: h.bookId,
              cfiRange: h.cfiRange,
              text: h.text,
              color: h.color as Highlight['color'],
              note: h.note,
              createdAt: new Date(h.createdAt),
            })
          );

          // Merge with local highlights (server is source of truth, but keep pending local ones)
          set((state) => {
            const pendingLocalHighlights = state.highlights.filter(
              (h) =>
                h.bookId === bookId && state.pendingSync.has(h.id)
            );
            const otherBookHighlights = state.highlights.filter(
              (h) => h.bookId !== bookId
            );

            return {
              highlights: [
                ...otherBookHighlights,
                ...serverHighlights,
                ...pendingLocalHighlights,
              ],
              isSyncing: false,
              lastSyncedAt: new Date(),
            };
          });
        } catch (error) {
          console.error('Failed to sync highlights from backend:', error);
          set({ isSyncing: false });
        }
      },

      syncBookmarksFromBackend: async (bookId: string) => {
        set({ isSyncing: true });
        try {
          const response = await apiClient.get<{
            data: Array<{
              id: string;
              bookId: string;
              cfi: string;
              title: string;
              createdAt: string;
            }>;
          }>('/reading/bookmarks', { params: { bookId } });

          const serverBookmarks: Bookmark[] = (response.data || []).map(
            (b) => ({
              id: b.id,
              bookId: b.bookId,
              cfi: b.cfi,
              title: b.title,
              createdAt: new Date(b.createdAt),
            })
          );

          // Merge with local bookmarks
          set((state) => {
            const pendingLocalBookmarks = state.bookmarks.filter(
              (b) =>
                b.bookId === bookId && state.pendingSync.has(b.id)
            );
            const otherBookBookmarks = state.bookmarks.filter(
              (b) => b.bookId !== bookId
            );

            return {
              bookmarks: [
                ...otherBookBookmarks,
                ...serverBookmarks,
                ...pendingLocalBookmarks,
              ],
              isSyncing: false,
              lastSyncedAt: new Date(),
            };
          });
        } catch (error) {
          console.error('Failed to sync bookmarks from backend:', error);
          set({ isSyncing: false });
        }
      },

      // Get highlights/bookmarks for a specific book
      getHighlightsForBook: (bookId: string) => {
        return get().highlights.filter((h) => h.bookId === bookId);
      },

      getBookmarksForBook: (bookId: string) => {
        return get().bookmarks.filter((b) => b.bookId === bookId);
      },
    }),
    {
      name: 'reader-storage',
      partialize: (state) => ({
        settings: state.settings,
        bookmarks: state.bookmarks,
        highlights: state.highlights,
        bookStats: state.bookStats,
        translationStates: state.translationStates,
      }),
    }
  )
);
