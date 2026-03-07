'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { ChapterReader, type ChapterReaderHandle } from '@/features/reader/components/chapter-reader';
import { ReaderToolbar } from '@/features/reader/components/reader-toolbar';
import { ReaderSettingsPanel } from '@/features/reader/components/reader-settings-panel';
import { TocPanel } from '@/features/reader/components/toc-panel';
import { SelectionBottomSheet } from '@/features/reader/components/selection-bottom-sheet';
import { TranslationSheet } from '@/features/reader/components/translation-sheet';
import { ReadingStatsOverlay } from '@/features/reader/components/reading-stats-overlay';
import { TTSControls, MiniTTSControls } from '@/features/reader/components/tts-controls';
import { KeyboardShortcutsDialog } from '@/components/shared/keyboard-shortcuts-dialog';
import { useTranslations } from 'next-intl';
import { useReaderStore } from '@/features/reader/stores/reader-store';
import { useBookDetail } from '@/features/library/hooks/use-books';
import { useTTS } from '@/features/reader/hooks/use-tts';
import { processOfflineQueue } from '@/features/reader/hooks/use-highlights';
import {
  useKeyboardShortcuts,
  type KeyboardShortcut,
} from '@/lib/hooks/use-keyboard-shortcuts';
import { usePositionSync } from '@/features/reader/hooks/use-position-sync';
import type { SelectedText, TocItem } from '@/features/reader/types';

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
    toggleToc,
    toggleSettings,
    setSelectedText,
    addBookmark,
    syncHighlightsFromBackend,
    syncBookmarksFromBackend,
    startReadingSession,
    endReadingSession,
    updateReadingActivity,
    getLastPosition,
  } = useReaderStore();

  const [showControls, setShowControls] = useState(false);
  const [translationText, setTranslationText] = useState<string | null>(null);
  const showControlsRef = useRef(false);
  const autoHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        tts.speak(text);
      }
    }
    setShowTTSPanel(true);
  }, [tts]);

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
              bookId,
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

  // Cleanup auto-hide timer on unmount
  useEffect(() => {
    return () => {
      if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
    };
  }, []);

  const handleReaderReady = useCallback(() => {
    setIsReady(true);
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
        />

        {/* Selection Bottom Sheet */}
        {selectedText && (
          <SelectionBottomSheet
            selection={selectedText}
            bookId={bookId}
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
    </div>
  );
}
