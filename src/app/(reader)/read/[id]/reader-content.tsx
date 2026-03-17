'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { ChapterReader, type ChapterReaderHandle } from '@/features/reader/components/chapter-reader';
import { ReaderToolbar } from '@/features/reader/components/reader-toolbar';
import { ReaderSettingsPanel } from '@/features/reader/components/reader-settings-panel';
import { TocPanel } from '@/features/reader/components/toc-panel';
import { SelectionBottomSheet } from '@/features/reader/components/selection-bottom-sheet';
import { HighlightOverlay } from '@/features/reader/components/highlight-overlay';
import { TranslationSheet } from '@/features/reader/components/translation-sheet';
import { ReadingStatsOverlay } from '@/features/reader/components/reading-stats-overlay';
import { ReaderGuideOverlay } from '@/features/reader/components/reader-guide-overlay';
import { ImageViewer } from '@/features/reader/components/image-viewer';
import { TTSControls, MiniTTSControls } from '@/features/reader/components/tts-controls';
import { TimelinePanel } from '@/features/reader/components/timeline-panel';
import { KeyboardShortcutsDialog } from '@/components/shared/keyboard-shortcuts-dialog';
import { useTranslations } from 'next-intl';
import { useReaderStore } from '@/features/reader/stores/reader-store';
import { useBookDetail } from '@/features/library/hooks/use-books';
import { useTTS } from '@/features/reader/hooks/use-tts';
import { useTTSHighlight } from '@/features/reader/hooks/use-tts-highlight';
import { processOfflineQueue } from '@/features/reader/hooks/use-highlights';
import {
  useKeyboardShortcuts,
  type KeyboardShortcut,
} from '@/lib/hooks/use-keyboard-shortcuts';
import { usePositionSync } from '@/features/reader/hooks/use-position-sync';
import type { SelectedText, TocItem } from '@/features/reader/types';
import { trackEvent } from '@/lib/analytics';
import { savePendingSession } from '@/features/reader/lib/pending-sessions';
import { useSession } from 'next-auth/react';
import { useAudioUsageTracker } from '@/features/subscription/hooks/use-audio-usage-tracker';
import { AudioLimitDialog } from '@/features/subscription/components/audio-limit-dialog';
import { PaywallView } from '@/features/subscription/components/paywall-view';

interface ReaderContentProps {
  bookId: string;
}

export function ReaderContent({ bookId }: ReaderContentProps) {
  // Debounced position sync (3s, matching iOS)
  usePositionSync(bookId);
  const readerRef = useRef<ChapterReaderHandle>(null);
  const [isReady, setIsReady] = useState(false);
  const [showTTSPanel, setShowTTSPanel] = useState(false);
  const [tocItems, setTocItems] = useState<TocItem[]>([]);
  const t = useTranslations('reader');

  // Initialize TTS
  const tts = useTTS();

  // Fetch book details
  const { data: book, isLoading: isLoadingBook } = useBookDetail(bookId);

  const {
    showToc,
    showSettings,
    selectedText,
    position,
    settings,
    highlights,
    toggleToc,
    toggleSettings,
    setSelectedText,
    addBookmark,
    removeHighlight,
    updateHighlightColor,
    updateHighlightStyle,
    updateHighlightPosition,
    syncHighlightsFromBackend,
    syncBookmarksFromBackend,
    startReadingSession,
    endReadingSession,
    updateReadingActivity,
    getLastPosition,
    getHighlightsForBook,
    flushPendingSessions,
  } = useReaderStore();

  const [showGuide, setShowGuide] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [translationText, setTranslationText] = useState<string | null>(null);
  const [imageViewerState, setImageViewerState] = useState<{ images: string[]; index: number } | null>(null);
  const [contentElement, setContentElement] = useState<HTMLElement | null>(null);
  const showControlsRef = useRef(false);
  const autoHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Audio limit dialog state
  const [showAudioLimitDialog, setShowAudioLimitDialog] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const { data: session } = useSession();
  const isGuest = !session?.user;

  const handleTTSLimitReached = useCallback(() => {
    tts.pause();
    setShowAudioLimitDialog(true);
  }, [tts]);

  const { dailySecondsUsed, dailyLimitSeconds } = useAudioUsageTracker({
    ttsState: tts.ttsState,
    onLimitReached: handleTTSLimitReached,
    onPauseTTS: () => tts.pause(),
  });

  // Keep ref in sync with state
  useEffect(() => {
    showControlsRef.current = showControls;
  }, [showControls]);

  // Navigation handlers
  const handlePrev = useCallback(() => {
    readerRef.current?.goPrev();
  }, []);

  const handleNext = useCallback(() => {
    readerRef.current?.goNext();
  }, []);

  const toggleControls = useCallback(() => {
    const willShow = !showControlsRef.current;
    setShowControls(willShow);
    if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
    if (willShow) {
      autoHideTimerRef.current = setTimeout(() => setShowControls(false), 3000);
    }
  }, []);

  // TTS handlers
  const handleStartTTS = useCallback(() => {
    if (tts.ttsState === 'idle') {
      const text = readerRef.current?.getCurrentPageText() ?? '';
      if (text.trim()) {
        trackEvent('tts_started', { book_id: bookId, book_title: book?.title });
        tts.speak(text);
      }
    }
    setShowTTSPanel(true);
  }, [tts, bookId, book?.title]);

  const handleToggleTTSPanel = useCallback(() => {
    setShowTTSPanel((prev) => !prev);
  }, []);

  const handleCloseTTSPanel = useCallback(() => {
    setShowTTSPanel(false);
  }, []);

  // Define keyboard shortcuts
  const shortcuts: KeyboardShortcut[] = useMemo(
    () => [
      // Navigation
      {
        key: 'ArrowRight',
        description: t('nextPage'),
        category: t('navigation'),
        action: handleNext,
      },
      {
        key: 'ArrowLeft',
        description: t('prevPage'),
        category: t('navigation'),
        action: handlePrev,
      },
      {
        key: ' ',
        description: t('nextPage'),
        category: t('navigation'),
        action: handleNext,
      },
      {
        key: ' ',
        shift: true,
        description: t('prevPage'),
        category: t('navigation'),
        action: handlePrev,
      },
      // Panels
      {
        key: 't',
        description: t('toggleToc'),
        category: t('panels'),
        action: toggleToc,
      },
      {
        key: ',',
        ctrl: true,
        description: t('openSettings'),
        category: t('panels'),
        action: toggleSettings,
      },
      // Bookmarks
      {
        key: 'd',
        ctrl: true,
        description: t('addBookmark'),
        category: t('bookmarks'),
        action: () => {
          if (position) {
            addBookmark({
              userBookId: bookId,
              cfi: `ch:${position.chapterIndex}:pg:${position.page}`,
              title: t('bookmarkLabel', { percent: Math.round(position.percentage * 100) }),
            });
          }
        },
      },
      // Font size
      {
        key: '=',
        ctrl: true,
        description: t('zoomIn'),
        category: t('display'),
        action: () => {
          const { updateSettings, settings } = useReaderStore.getState();
          updateSettings({ fontSize: Math.min(settings.fontSize + 2, 32) });
        },
      },
      {
        key: '-',
        ctrl: true,
        description: t('zoomOut'),
        category: t('display'),
        action: () => {
          const { updateSettings, settings } = useReaderStore.getState();
          updateSettings({ fontSize: Math.max(settings.fontSize - 2, 12) });
        },
      },
      // TTS
      {
        key: 'r',
        description: t('readCurrentPage'),
        category: t('tts'),
        action: handleStartTTS,
      },
      {
        key: 'p',
        description: t('togglePlayPause'),
        category: t('tts'),
        action: () => tts.togglePlayPause(),
      },
      {
        key: 's',
        shift: true,
        description: t('stopReading'),
        category: t('tts'),
        action: () => tts.stop(),
      },
      {
        key: 'ArrowRight',
        shift: true,
        description: t('nextSentence'),
        category: t('tts'),
        action: () => tts.nextSentence(),
      },
      {
        key: 'Escape',
        description: t('toggleControls'),
        category: t('navigation'),
        action: toggleControls,
      },
    ],
    [
      handleNext,
      handlePrev,
      toggleToc,
      toggleSettings,
      bookId,
      position,
      addBookmark,
      handleStartTTS,
      tts,
      toggleControls,
    ]
  );

  const { showHelp, setShowHelp } = useKeyboardShortcuts({
    enabled: true,
    shortcuts,
  });

  // Sync highlights and bookmarks from backend when book loads
  useEffect(() => {
    if (bookId) {
      // Sync from backend
      syncHighlightsFromBackend(bookId);
      syncBookmarksFromBackend(bookId);

      // Process any pending offline operations
      processOfflineQueue();
    }
  }, [bookId, syncHighlightsFromBackend, syncBookmarksFromBackend]);

  // Start reading session when component mounts
  useEffect(() => {
    if (bookId && isReady) {
      // Get last position or current position percentage
      const lastPos = getLastPosition(bookId);
      const startPercentage = lastPos?.percentage || position?.percentage || 0;
      startReadingSession(bookId, startPercentage);
    }

    // End reading session when component unmounts
    return () => {
      endReadingSession();
    };
  }, [bookId, isReady, startReadingSession, endReadingSession, getLastPosition]);

  // Show guide for first-time readers
  useEffect(() => {
    if (!isReady) return;
    const hasSeen = localStorage.getItem('hasSeenReaderGuide');
    if (!hasSeen) {
      setShowGuide(true);
    }
  }, [isReady]);

  // Update reading activity periodically (every 30 seconds)
  useEffect(() => {
    if (!isReady) return;

    const interval = setInterval(() => {
      updateReadingActivity();
    }, 30000);

    return () => clearInterval(interval);
  }, [isReady, updateReadingActivity]);

  // Handle page visibility change to save progress
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // User switched tabs or minimized - save progress
        endReadingSession();
      } else if (document.visibilityState === 'visible' && bookId) {
        // User came back - start new session
        startReadingSession(bookId, position?.percentage || 0);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [bookId, position?.percentage, startReadingSession, endReadingSession]);

  // Process offline queue when coming back online
  useEffect(() => {
    const handleOnline = () => {
      processOfflineQueue();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  // Flush any pending sessions saved from previous visits on mount,
  // and again whenever network connectivity is restored
  useEffect(() => {
    flushPendingSessions();

    const handleOnlineFlush = () => {
      flushPendingSessions();
    };

    window.addEventListener('online', handleOnlineFlush);
    return () => window.removeEventListener('online', handleOnlineFlush);
  }, [flushPendingSessions]);

  // Save session to localStorage on page close / unload for crash recovery
  // sendBeacon cannot carry auth headers, so we rely on localStorage + flush-on-mount
  useEffect(() => {
    const handleBeforeUnload = () => {
      const state = useReaderStore.getState();
      if (!state.currentSession) return;

      const durationSeconds = Math.floor(
        (Date.now() - state.currentSession.startTime) / 1000
      );
      if (durationSeconds < 10) return;

      // Use the existing snapshotRecordId so the pending entry is idempotent
      const sessionId = state.snapshotRecordId || crypto.randomUUID();
      savePendingSession({
        id: sessionId,
        payload: {
          bookId: state.currentSession.bookId,
          durationSeconds,
          sessionType: state.currentSessionType || 'READING',
          deviceId: localStorage.getItem('readmigo_device_id') || 'unknown',
          clientVersion: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
        },
        endpoint: '/reading/sessions',
        createdAt: Date.now(),
        retryCount: 0,
      });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Cleanup auto-hide timer on unmount
  useEffect(() => {
    return () => {
      if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
    };
  }, []);

  const handleReaderReady = useCallback(() => {
    setIsReady(true);
    // Capture content element for highlight overlay
    setContentElement(readerRef.current?.getContentElement() ?? null);
  }, []);

  const handleGuideComplete = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('hasSeenReaderGuide', 'true');
    }
    setShowGuide(false);
  }, []);

  const handleTextSelect = useCallback(
    (selection: SelectedText) => {
      setSelectedText(selection);
    },
    [setSelectedText]
  );

  const handleTocSelect = useCallback((href: string) => {
    readerRef.current?.goTo(href);
  }, []);

  const handleParagraphClick = useCallback((text: string) => {
    setTranslationText(text);
  }, []);

  const handleImageClick = useCallback((images: string[], index: number) => {
    setImageViewerState({ images, index });
  }, []);

  // Get highlights for the current book, filtered for HighlightOverlay
  const bookHighlights = useMemo(
    () => getHighlightsForBook(bookId).map((h) => ({
      id: h.id,
      selectedText: h.selectedText,
      color: h.color,
      style: h.style,
      paragraphIndex: h.paragraphIndex,
      charOffset: h.charOffset,
      charLength: h.charLength,
    })),
    [bookId, highlights, getHighlightsForBook],
  );

  const handleHighlightUpdate = useCallback(
    (highlightId: string, data: { selectedText: string; paragraphIndex: number; charOffset: number; charLength: number; startOffset: number; endOffset: number }) => {
      updateHighlightPosition(highlightId, bookId, data);
    },
    [bookId, updateHighlightPosition],
  );

  const handleHighlightColorChange = useCallback(
    (highlightId: string, color: 'yellow' | 'green' | 'blue' | 'pink' | 'purple' | 'orange') => {
      updateHighlightColor(highlightId, bookId, color);
    },
    [bookId, updateHighlightColor],
  );

  const handleHighlightStyleChange = useCallback(
    (highlightId: string, style: 'underline' | 'wavy' | 'background' | 'bold_line') => {
      updateHighlightStyle(highlightId, bookId, style);
    },
    [bookId, updateHighlightStyle],
  );

  const handleHighlightDelete = useCallback(
    (highlightId: string) => {
      removeHighlight(highlightId, bookId);
    },
    [bookId, removeHighlight],
  );

  // Re-capture contentElement on chapter navigation
  useEffect(() => {
    if (isReady && readerRef.current) {
      setContentElement(readerRef.current.getContentElement() ?? null);
    }
  }, [isReady, position?.chapterIndex]);

  // A12: TTS sentence/paragraph highlight
  useTTSHighlight(contentElement, tts.progress);


  // Loading state
  if (isLoadingBook) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    );
  }

  const bookTitle = book?.title || 'Loading...';
  const chapters = book?.chapters || [];

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Toolbar */}
      <ReaderToolbar
        bookTitle={bookTitle}
        bookId={bookId}
        onPrev={handlePrev}
        onNext={handleNext}
        onToggleTTS={handleStartTTS}
        isTTSActive={tts.ttsState === 'playing' || tts.ttsState === 'paused' || tts.ttsState === 'loading'}
        showControls={showControls}
        onToggleTimeline={() => setShowTimeline((v) => !v)}
        onNavigateToBookmark={(cfi) => {
          const match = cfi.match(/ch:(\d+)/);
          if (match) {
            const chapterIndex = parseInt(match[1]);
            const chapter = chapters[chapterIndex];
            if (chapter) readerRef.current?.goTo(chapter.id);
          }
        }}
      />

      {/* Reader */}
      <div
        className="relative flex-1"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const centerStart = rect.width / 3;
          const centerEnd = (rect.width * 2) / 3;
          if (x > centerStart && x < centerEnd) {
            toggleControls();
          }
        }}
      >
        <ChapterReader
          ref={readerRef}
          bookId={bookId}
          chapters={chapters}
          onReady={handleReaderReady}
          onTextSelect={handleTextSelect}
          onTocLoaded={setTocItems}
          onParagraphClick={handleParagraphClick}
          onImageClick={handleImageClick}
        />

        {/* Highlight overlay with drag handles */}
        <HighlightOverlay
          contentElement={contentElement}
          highlights={bookHighlights}
          onHighlightUpdate={handleHighlightUpdate}
          onHighlightDelete={handleHighlightDelete}
          onHighlightColorChange={handleHighlightColorChange}
          onHighlightStyleChange={handleHighlightStyleChange}
        />

        {/* Selection Bottom Sheet */}
        {selectedText && (
          <SelectionBottomSheet
            selection={selectedText}
            bookId={bookId}
            bookTitle={book?.title}
            authorName={book?.author}
            onClose={() => setSelectedText(null)}
          />
        )}

        {/* Paragraph Translation Sheet */}
        <TranslationSheet
          open={!!translationText}
          originalText={translationText || ''}
          bookId={bookId}
          onClose={() => setTranslationText(null)}
        />
      </div>

      {/* Side Panels */}
      {showToc && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={toggleToc}
          />
          <TocPanel
            items={tocItems}
            currentChapter={position?.chapterIndex}
            onSelect={handleTocSelect}
            onClose={toggleToc}
          />
        </>
      )}

      {showSettings && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={toggleSettings}
          />
          <ReaderSettingsPanel onClose={toggleSettings} />
        </>
      )}

      {showTimeline && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setShowTimeline(false)} />
          <TimelinePanel
            items={tocItems}
            currentChapter={position?.chapterIndex}
            totalProgress={position?.percentage || 0}
            onSelect={handleTocSelect}
            onClose={() => setShowTimeline(false)}
          />
        </>
      )}

      {/* Keyboard Shortcuts Help Dialog */}
      <KeyboardShortcutsDialog
        open={showHelp}
        onOpenChange={setShowHelp}
        shortcuts={shortcuts}
      />

      {/* Reading Stats Overlay */}
      <ReadingStatsOverlay
        bookId={bookId}
        totalChapters={tocItems.length}
        bookTitle={bookTitle}
      />

      {/* TTS Controls — full bottom bar */}
      {showTTSPanel && (
        <TTSControls tts={tts} onClose={handleCloseTTSPanel} bookId={bookId} />
      )}

      {/* Mini TTS pill — shown when active but panel is hidden */}
      {!showTTSPanel && (tts.ttsState === 'playing' || tts.ttsState === 'paused' || tts.ttsState === 'loading') && (
        <div className="fixed bottom-4 right-4 z-50">
          <MiniTTSControls tts={tts} onExpand={handleToggleTTSPanel} />
        </div>
      )}

      {/* First-time reader guide */}
      {showGuide && (
        <ReaderGuideOverlay
          onComplete={handleGuideComplete}
          onSkip={handleGuideComplete}
        />
      )}

      {/* Full-screen image viewer */}
      {imageViewerState && (
        <ImageViewer
          images={imageViewerState.images}
          initialIndex={imageViewerState.index}
          onClose={() => setImageViewerState(null)}
        />
      )}

      {/* Audio limit dialog — shown when TTS daily cap is reached */}
      <AudioLimitDialog
        open={showAudioLimitDialog}
        onDismiss={() => setShowAudioLimitDialog(false)}
        onUpgrade={() => setShowPaywall(true)}
        dailySecondsUsed={dailySecondsUsed}
        dailyLimitSeconds={dailyLimitSeconds}
        isGuest={isGuest}
      />

      {showPaywall && (
        <PaywallView
          trigger="audioLimitReached"
          onDismiss={() => setShowPaywall(false)}
        />
      )}
    </div>
  );
}
