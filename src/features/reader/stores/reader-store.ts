import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ReaderSettings, ReaderPosition, Highlight, Bookmark, SelectedText } from '../types';
import { apiClient } from '@/lib/api/client';
import { log } from '@/lib/logger';
import { addToOfflineQueue } from '../hooks/use-highlights';
import { buildParagraphKey } from '../utils/translation-hash';
import { trackEvent } from '@/lib/analytics';
import {
  savePendingSession,
  removePendingSession,
  flushPendingSessions as flushPendingSessionsUtil,
} from '../lib/pending-sessions';

function getDeviceId(): string {
  const key = 'readmigo_device_id';
  let deviceId = localStorage.getItem(key);
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(key, deviceId);
  }
  return deviceId;
}

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
  currentSessionType: 'READING' | 'TTS';
  bookStats: Record<string, BookReadingStats>;

  // Snapshot tracking — interval ID and shared session record ID
  snapshotIntervalId: ReturnType<typeof setInterval> | null;
  snapshotRecordId: string | null;

  // System appearance (runtime only, not persisted)
  systemIsDark: boolean;

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
  addBookmark: (bookmark: Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt' | 'syncedAt' | 'serverId'>) => void;
  removeBookmark: (id: string, bookId: string) => void;

  // Highlights
  addHighlight: (highlight: Omit<Highlight, 'id' | 'createdAt' | 'updatedAt' | 'syncedAt' | 'serverId'>) => void;
  removeHighlight: (id: string, bookId: string) => void;
  updateHighlightNote: (id: string, bookId: string, note: string) => void;
  updateHighlightColor: (id: string, bookId: string, color: Highlight['color']) => void;
  updateHighlightStyle: (id: string, bookId: string, style: Highlight['style']) => void;
  updateHighlightPosition: (id: string, bookId: string, data: {
    selectedText: string;
    startOffset: number;
    endOffset: number;
    paragraphIndex: number;
    charOffset: number;
    charLength: number;
  }) => void;

  // Reading session tracking
  startReadingSession: (bookId: string, currentPercentage: number) => void;
  updateReadingActivity: (wordsRead?: number) => void;
  endReadingSession: () => void;
  switchSessionType: (newType: 'READING' | 'TTS') => void;
  getBookStats: (bookId: string) => BookReadingStats | null;
  getLastPosition: (bookId: string) => ReaderPosition | null;
  getCurrentSessionDuration: () => number;

  // Pending session flush
  flushPendingSessions: () => Promise<void>;

  // System appearance
  setSystemIsDark: (isDark: boolean) => void;

  // Sync
  syncHighlightsFromBackend: (bookId: string) => Promise<void>;
  syncBookmarksFromBackend: (bookId: string) => Promise<void>;
  getHighlightsForBook: (bookId: string) => Highlight[];
  getBookmarksForBook: (bookId: string) => Bookmark[];
}

const defaultSettings: ReaderSettings = {
  fontSize: 26,
  fontFamily: 'Georgia',
  lineHeight: 1.6,
  theme: 'light',
  marginSize: 'medium',
  letterSpacing: 0,
  wordSpacing: 0,
  paragraphSpacing: 12,
  textAlign: 'justify',
  hyphenation: true,
  columnCount: 2,
  textIndent: 0,
  fontWeight: 'regular',
  appearanceMode: 'auto',
  readingMode: 'paginated',
  autoPageEnabled: false,
  autoPageInterval: 10,
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
      showReadingStats: false,
      selectedText: null,
      systemIsDark: false,
      translationStates: {},
      bookmarks: [],
      highlights: [],
      currentSession: null,
      currentSessionType: 'READING' as const,
      bookStats: {},
      snapshotIntervalId: null,
      snapshotRecordId: null,
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
        const now = new Date();
        const newBookmark: Bookmark = {
          ...bookmark,
          id: crypto.randomUUID(),
          createdAt: now,
          updatedAt: now,
        };

        trackEvent('bookmark_created', { book_id: bookmark.userBookId });

        // Optimistic update - add to local state immediately
        set((state) => ({
          bookmarks: [...state.bookmarks, newBookmark],
          pendingSync: new Set([...state.pendingSync, newBookmark.id]),
        }));

        // Sync to backend
        apiClient
          .post('/reading/bookmarks', {
            bookId: bookmark.userBookId,
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
            log.reader.error('Failed to sync bookmark to backend', error);
            // Add to offline queue for retry
            addToOfflineQueue({
              type: 'create_bookmark',
              data: {
                bookId: bookmark.userBookId,
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
          log.reader.error('Failed to delete bookmark from backend', error);
          // Add to offline queue for retry
          addToOfflineQueue({
            type: 'delete_bookmark',
            data: { bookmarkId: id, bookId },
          });
        });
      },

      // Highlight actions with backend sync
      addHighlight: (highlight) => {
        const now = new Date();
        const newHighlight: Highlight = {
          ...highlight,
          id: crypto.randomUUID(),
          createdAt: now,
          updatedAt: now,
        };

        trackEvent(highlight.note ? 'annotation_created' : 'highlight_created', {
          book_id: highlight.userBookId,
          color: highlight.color,
          text_length: highlight.selectedText.length,
        });

        // Optimistic update - add to local state immediately
        set((state) => ({
          highlights: [...state.highlights, newHighlight],
          pendingSync: new Set([...state.pendingSync, newHighlight.id]),
        }));

        // Sync to backend
        apiClient
          .post('/reading/highlights', {
            bookId: highlight.userBookId,
            cfiRange: highlight.cfiRange,
            selectedText: highlight.selectedText,
            color: highlight.color,
            style: highlight.style,
            note: highlight.note,
            isPublic: highlight.isPublic ?? false,
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
            log.reader.error('Failed to sync highlight to backend', error);
            // Add to offline queue for retry
            addToOfflineQueue({
              type: 'create_highlight',
              data: {
                bookId: highlight.userBookId,
                cfiRange: highlight.cfiRange,
                selectedText: highlight.selectedText,
                color: highlight.color,
                style: highlight.style,
                note: highlight.note,
                isPublic: highlight.isPublic ?? false,
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
          log.reader.error('Failed to delete highlight from backend', error);
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
          log.reader.error('Failed to update highlight note', error);
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
          log.reader.error('Failed to update highlight color', error);
          // Add to offline queue for retry
          addToOfflineQueue({
            type: 'update_highlight',
            data: { highlightId: id, bookId, color },
          });
        });
      },

      updateHighlightStyle: (id, bookId, style) => {
        // Optimistic update
        set((state) => ({
          highlights: state.highlights.map((h) =>
            h.id === id ? { ...h, style } : h
          ),
        }));

        // Sync to backend
        apiClient.patch(`/reading/highlights/${id}`, { style }).catch((error) => {
          log.reader.error('Failed to update highlight style', error);
          addToOfflineQueue({
            type: 'update_highlight',
            data: { highlightId: id, bookId, style },
          });
        });
      },

      updateHighlightPosition: (id, bookId, data) => {
        // Optimistic update
        set((state) => ({
          highlights: state.highlights.map((h) =>
            h.id === id
              ? {
                  ...h,
                  selectedText: data.selectedText,
                  startOffset: data.startOffset,
                  endOffset: data.endOffset,
                  paragraphIndex: data.paragraphIndex,
                  charOffset: data.charOffset,
                  charLength: data.charLength,
                }
              : h
          ),
        }));

        // Sync to backend
        apiClient
          .patch(`/reading/highlights/${id}`, {
            selectedText: data.selectedText,
            startOffset: data.startOffset,
            endOffset: data.endOffset,
            paragraphIndex: data.paragraphIndex,
            charOffset: data.charOffset,
            charLength: data.charLength,
          })
          .catch((error) => {
            log.reader.error('Failed to update highlight position', error);
            addToOfflineQueue({
              type: 'update_highlight',
              data: { highlightId: id, bookId, ...data },
            });
          });
      },

      // Reading session tracking
      startReadingSession: (bookId: string, currentPercentage: number) => {
        // Clear any previous snapshot interval before starting a new session
        const { snapshotIntervalId } = get();
        if (snapshotIntervalId) {
          clearInterval(snapshotIntervalId);
        }

        const now = Date.now();
        const snapshotId = crypto.randomUUID();

        set({
          currentSession: {
            bookId,
            startTime: now,
            lastActiveTime: now,
            wordsRead: 0,
            pagesRead: 0,
            startPercentage: currentPercentage,
          },
          snapshotRecordId: snapshotId,
        });

        trackEvent('reading_started', { book_id: bookId, source: 'library' });

        // Periodic snapshot — saves progress to localStorage every 5 minutes
        // Uses snapshotId so each write replaces the previous snapshot for this session
        const intervalId = setInterval(() => {
          const state = get();
          if (!state.currentSession) return;
          const durationSeconds = Math.floor((Date.now() - state.currentSession.startTime) / 1000);
          if (durationSeconds < 10) return;

          savePendingSession({
            id: state.snapshotRecordId!,
            payload: {
              bookId: state.currentSession.bookId,
              durationSeconds,
              sessionType: state.currentSessionType || 'READING',
              deviceId: getDeviceId(),
              clientVersion: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
            },
            endpoint: '/reading/sessions',
            createdAt: Date.now(),
            retryCount: 0,
          });
        }, 5 * 60 * 1000); // every 5 minutes

        set({ snapshotIntervalId: intervalId });
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
        const { currentSession, bookStats, position, snapshotIntervalId, snapshotRecordId } = get();
        if (!currentSession) return;

        // Stop snapshot interval
        if (snapshotIntervalId) {
          clearInterval(snapshotIntervalId);
        }

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
          snapshotIntervalId: null,
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

        trackEvent('reading_session_ended', {
          book_id: currentSession.bookId,
          duration_seconds: sessionDuration,
          pages_read: currentSession.pagesRead,
          chapter_index: position?.chapterIndex,
        });

        // Submit reading session to backend — localStorage first, then API
        if (sessionDuration >= 10) {
          const sessionId = snapshotRecordId || crypto.randomUUID();
          const payload = {
            bookId: currentSession.bookId,
            durationSeconds: sessionDuration,
            pagesRead: currentSession.pagesRead,
            sessionType: get().currentSessionType || 'READING',
            deviceId: getDeviceId(),
            clientVersion: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
          };

          // Persist locally first so it survives crashes and network failures
          savePendingSession({
            id: sessionId,
            payload,
            endpoint: '/reading/sessions',
            createdAt: now,
            retryCount: 0,
          });

          apiClient
            .post('/reading/sessions', payload)
            .then(() => {
              removePendingSession(sessionId);
            })
            .catch((error) => {
              log.reader.error('Failed to submit reading session', error);
              // Session stays in localStorage for retry on next flush
            });
        }

        // Sync reading progress to backend
        if (position) {
          apiClient
            .post('/reading/progress', {
              bookId: currentSession.bookId,
              cfi: `ch:${position.chapterIndex}:pg:${position.page}`,
              percentage: position.percentage,
              chapter: position.chapterIndex,
              readingTime: sessionDuration,
            })
            .catch((error) => {
              log.reader.error('Failed to sync reading progress', error);
            });
        }
      },

      switchSessionType: (newType: 'READING' | 'TTS') => {
        const { currentSessionType, currentSession, bookStats, position, snapshotIntervalId, snapshotRecordId } = get();
        if (currentSessionType === newType) return;

        if (currentSession) {
          const now = Date.now();
          const sessionDuration = Math.floor((now - currentSession.startTime) / 1000);
          const existingStats = bookStats[currentSession.bookId];

          const progressMade = position
            ? Math.max(0, position.percentage - currentSession.startPercentage)
            : 0;
          const estimatedWordsRead = Math.floor(progressMade * 25000);
          const totalWordsRead = (existingStats?.totalWordsRead || 0) + estimatedWordsRead;
          const totalTime = (existingStats?.totalReadingTime || 0) + sessionDuration;
          const sessionsCount = (existingStats?.sessionsCount || 0) + 1;
          const averageWpm = totalTime > 0 ? Math.round((totalWordsRead / totalTime) * 60) : 0;

          set({
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

          trackEvent('reading_session_ended', {
            book_id: currentSession.bookId,
            duration_seconds: sessionDuration,
            pages_read: currentSession.pagesRead,
            chapter_index: position?.chapterIndex,
            session_type: currentSessionType,
          });

          if (sessionDuration >= 10) {
            // Stop previous snapshot interval
            if (snapshotIntervalId) {
              clearInterval(snapshotIntervalId);
            }

            const sessionId = snapshotRecordId || crypto.randomUUID();
            const payload = {
              bookId: currentSession.bookId,
              durationSeconds: sessionDuration,
              pagesRead: currentSession.pagesRead,
              sessionType: currentSessionType,
              deviceId: getDeviceId(),
              clientVersion: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
            };

            // Persist locally first
            savePendingSession({
              id: sessionId,
              payload,
              endpoint: '/reading/sessions',
              createdAt: now,
              retryCount: 0,
            });

            apiClient
              .post('/reading/sessions', payload)
              .then(() => {
                removePendingSession(sessionId);
              })
              .catch((error) => {
                log.reader.error('Failed to submit reading session on switch', error);
                // Session stays in localStorage for retry
              });
          }

          // Start a fresh snapshot tracking for the new session type
          const newSnapshotId = crypto.randomUUID();
          const newStartTime = Date.now();
          const newIntervalId = setInterval(() => {
            const state = get();
            if (!state.currentSession) return;
            const durationSeconds = Math.floor((Date.now() - state.currentSession.startTime) / 1000);
            if (durationSeconds < 10) return;

            savePendingSession({
              id: state.snapshotRecordId!,
              payload: {
                bookId: state.currentSession.bookId,
                durationSeconds,
                sessionType: newType,
                deviceId: getDeviceId(),
                clientVersion: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
              },
              endpoint: '/reading/sessions',
              createdAt: Date.now(),
              retryCount: 0,
            });
          }, 5 * 60 * 1000);

          set({
            currentSession: {
              bookId: currentSession.bookId,
              startTime: newStartTime,
              lastActiveTime: newStartTime,
              wordsRead: 0,
              pagesRead: 0,
              startPercentage: position?.percentage || currentSession.startPercentage,
            },
            currentSessionType: newType,
            snapshotRecordId: newSnapshotId,
            snapshotIntervalId: newIntervalId,
          });

          trackEvent(newType === 'TTS' ? 'tts_session_started' : 'reading_session_started', {
            book_id: currentSession.bookId,
          });
        } else {
          set({ currentSessionType: newType });
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

      // Flush pending sessions to backend (called on mount and network recovery)
      flushPendingSessions: async () => {
        await flushPendingSessionsUtil();
      },

      // System appearance
      setSystemIsDark: (isDark) => set({ systemIsDark: isDark }),

      // Sync methods
      syncHighlightsFromBackend: async (bookId: string) => {
        set({ isSyncing: true });
        try {
          const response = await apiClient.get<{
            data: Array<{
              id: string;
              userBookId: string;
              bookId: string;
              chapterId?: string;
              cfiRange: string;
              selectedText: string;
              color: string;
              style: string;
              note?: string;
              startOffset?: number;
              endOffset?: number;
              paragraphIndex?: number;
              charOffset?: number;
              charLength?: number;
              createdAt: string;
              updatedAt: string;
              syncedAt?: string;
            }>;
          }>('/reading/highlights', { params: { bookId } });

          const serverHighlights: Highlight[] = (response.data || []).map(
            (h) => ({
              id: h.id,
              serverId: h.id,
              userBookId: h.userBookId || h.bookId,
              chapterId: h.chapterId,
              cfiRange: h.cfiRange,
              selectedText: h.selectedText,
              color: h.color as Highlight['color'],
              style: (h.style || 'background') as Highlight['style'],
              note: h.note,
              startOffset: h.startOffset,
              endOffset: h.endOffset,
              paragraphIndex: h.paragraphIndex,
              charOffset: h.charOffset,
              charLength: h.charLength,
              createdAt: new Date(h.createdAt),
              updatedAt: new Date(h.updatedAt),
              syncedAt: h.syncedAt ? new Date(h.syncedAt) : undefined,
            })
          );

          // Merge with local highlights (server is source of truth, but keep pending local ones)
          set((state) => {
            const pendingLocalHighlights = state.highlights.filter(
              (h) =>
                h.userBookId === bookId && state.pendingSync.has(h.id)
            );
            const otherBookHighlights = state.highlights.filter(
              (h) => h.userBookId !== bookId
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
          log.reader.error('Failed to sync highlights from backend', error);
          set({ isSyncing: false });
        }
      },

      syncBookmarksFromBackend: async (bookId: string) => {
        set({ isSyncing: true });
        try {
          const response = await apiClient.get<{
            data: Array<{
              id: string;
              userBookId: string;
              bookId: string;
              cfi: string;
              title: string;
              scrollPosition?: number;
              pageNumber?: number;
              excerpt?: string;
              createdAt: string;
              updatedAt: string;
              syncedAt?: string;
            }>;
          }>('/reading/bookmarks', { params: { bookId } });

          const serverBookmarks: Bookmark[] = (response.data || []).map(
            (b) => ({
              id: b.id,
              serverId: b.id,
              userBookId: b.userBookId || b.bookId,
              cfi: b.cfi,
              title: b.title,
              scrollPosition: b.scrollPosition,
              pageNumber: b.pageNumber,
              excerpt: b.excerpt,
              createdAt: new Date(b.createdAt),
              updatedAt: new Date(b.updatedAt),
              syncedAt: b.syncedAt ? new Date(b.syncedAt) : undefined,
            })
          );

          // Merge with local bookmarks
          set((state) => {
            const pendingLocalBookmarks = state.bookmarks.filter(
              (b) =>
                b.userBookId === bookId && state.pendingSync.has(b.id)
            );
            const otherBookBookmarks = state.bookmarks.filter(
              (b) => b.userBookId !== bookId
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
          log.reader.error('Failed to sync bookmarks from backend', error);
          set({ isSyncing: false });
        }
      },

      // Get highlights/bookmarks for a specific book
      getHighlightsForBook: (bookId: string) => {
        return get().highlights.filter((h) => h.userBookId === bookId);
      },

      getBookmarksForBook: (bookId: string) => {
        return get().bookmarks.filter((b) => b.userBookId === bookId);
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
