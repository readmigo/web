'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { ChapterReader, type ChapterReaderHandle } from '@/features/reader/components/chapter-reader';
import { ReaderToolbar } from '@/features/reader/components/reader-toolbar';
import { ReaderSettingsPanel } from '@/features/reader/components/reader-settings-panel';
import { TocPanel } from '@/features/reader/components/toc-panel';
import { AiPanel } from '@/features/reader/components/ai-panel';
import { SelectionPopup } from '@/features/reader/components/selection-popup';
import { FocusMode } from '@/features/reader/components/focus-mode';
import { ReadingStatsOverlay } from '@/features/reader/components/reading-stats-overlay';
import { TTSControls, MiniTTSControls } from '@/features/reader/components/tts-controls';
import { KeyboardShortcutsDialog } from '@/components/shared/keyboard-shortcuts-dialog';
import { useReaderStore } from '@/features/reader/stores/reader-store';
import { useBookDetail } from '@/features/library/hooks/use-books';
import { useLearningStore } from '@/features/learning/stores/learning-store';
import { useTTS } from '@/features/reader/hooks/use-tts';
import { processOfflineQueue } from '@/features/reader/hooks/use-highlights';
import {
  useKeyboardShortcuts,
  type KeyboardShortcut,
} from '@/lib/hooks/use-keyboard-shortcuts';
import type { SelectedText, TocItem } from '@/features/reader/types';


interface ReaderContentProps {
  bookId: string;
}

export function ReaderContent({ bookId }: ReaderContentProps) {
  const readerRef = useRef<ChapterReaderHandle>(null);
  const [isReady, setIsReady] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [showTTSPanel, setShowTTSPanel] = useState(false);
  const [tocItems, setTocItems] = useState<TocItem[]>([]);

  // Initialize TTS
  const tts = useTTS();

  // Fetch book details
  const { data: book, isLoading: isLoadingBook } = useBookDetail(bookId);

  const {
    showToc,
    showSettings,
    showAiPanel,
    selectedText,
    position,
    settings,
    toggleToc,
    toggleSettings,
    toggleAiPanel,
    setShowAiPanel,
    setSelectedText,
    addBookmark,
    syncHighlightsFromBackend,
    syncBookmarksFromBackend,
    startReadingSession,
    endReadingSession,
    updateReadingActivity,
    getLastPosition,
  } = useReaderStore();

  const { addWord } = useLearningStore();

  // Navigation handlers
  const handlePrev = useCallback(() => {
    readerRef.current?.goPrev();
  }, []);

  const handleNext = useCallback(() => {
    readerRef.current?.goNext();
  }, []);

  // TTS handlers
  const handleStartTTS = useCallback(() => {
    // TODO: Get text from current page for TTS
    setShowTTSPanel(true);
  }, []);

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
        description: '下一页',
        category: '导航',
        action: handleNext,
      },
      {
        key: 'ArrowLeft',
        description: '上一页',
        category: '导航',
        action: handlePrev,
      },
      {
        key: ' ',
        description: '下一页',
        category: '导航',
        action: handleNext,
      },
      {
        key: ' ',
        shift: true,
        description: '上一页',
        category: '导航',
        action: handlePrev,
      },
      // Panels
      {
        key: 't',
        description: '切换目录',
        category: '面板',
        action: toggleToc,
      },
      {
        key: 'a',
        description: '切换AI面板',
        category: '面板',
        action: toggleAiPanel,
      },
      {
        key: ',',
        ctrl: true,
        description: '打开设置',
        category: '面板',
        action: toggleSettings,
      },
      // Reading modes
      {
        key: 'f',
        description: '进入专注模式',
        category: '阅读模式',
        action: () => setIsFocusMode(true),
      },
      {
        key: 'Escape',
        description: '退出专注模式',
        category: '阅读模式',
        action: () => setIsFocusMode(false),
      },
      // Bookmarks
      {
        key: 'd',
        ctrl: true,
        description: '添加书签',
        category: '书签',
        action: () => {
          if (position) {
            addBookmark({
              bookId,
              cfi: `ch:${position.chapterIndex}:pg:${position.page}`,
              title: `书签 - ${Math.round(position.percentage * 100)}%`,
            });
          }
        },
      },
      // Font size
      {
        key: '=',
        ctrl: true,
        description: '放大字体',
        category: '显示',
        action: () => {
          const { updateSettings, settings } = useReaderStore.getState();
          updateSettings({ fontSize: Math.min(settings.fontSize + 2, 32) });
        },
      },
      {
        key: '-',
        ctrl: true,
        description: '缩小字体',
        category: '显示',
        action: () => {
          const { updateSettings, settings } = useReaderStore.getState();
          updateSettings({ fontSize: Math.max(settings.fontSize - 2, 12) });
        },
      },
      // TTS
      {
        key: 'r',
        description: '朗读当前页',
        category: 'TTS',
        action: handleStartTTS,
      },
      {
        key: 'p',
        description: '暂停/继续朗读',
        category: 'TTS',
        action: () => tts.togglePlayPause(),
      },
      {
        key: 's',
        shift: true,
        description: '停止朗读',
        category: 'TTS',
        action: () => tts.stop(),
      },
    ],
    [
      handleNext,
      handlePrev,
      toggleToc,
      toggleAiPanel,
      toggleSettings,
      bookId,
      position,
      addBookmark,
      handleStartTTS,
      tts,
    ]
  );

  const { showHelp, setShowHelp } = useKeyboardShortcuts({
    enabled: !isFocusMode, // Disable shortcuts in focus mode (it handles its own)
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

  const handleTranslate = useCallback(() => {
    setShowAiPanel(true);
  }, [setShowAiPanel]);

  const handleExplain = useCallback(() => {
    setShowAiPanel(true);
  }, [setShowAiPanel]);

  const handleSpeak = useCallback(() => {
    if (selectedText) {
      const utterance = new SpeechSynthesisUtterance(selectedText.text);
      utterance.lang = 'en-US';
      speechSynthesis.speak(utterance);
    }
  }, [selectedText]);

  const handleAddWord = useCallback(() => {
    if (selectedText) {
      // Add word to vocabulary with basic info
      // In real app, would get AI explanation first
      addWord({
        word: selectedText.text.trim().split(/\s+/)[0],
        partOfSpeech: 'unknown',
        definition: '',
        translation: '',
        examples: [],
        bookId,
        bookTitle: book?.title,
        context: selectedText.text,
      });
    }
  }, [selectedText, addWord, bookId, book?.title]);

  // Loading state
  if (isLoadingBook) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">正在加载书籍...</p>
        </div>
      </div>
    );
  }

  const bookTitle = book?.title || 'Loading...';
  const chapters = book?.chapters || [];

  // Focus mode renders differently
  if (isFocusMode) {
    return (
      <FocusMode
        onExit={() => setIsFocusMode(false)}
        onPrev={handlePrev}
        onNext={handleNext}
        progress={(position?.percentage || 0) * 100}
        theme={settings.theme}
      >
        <ChapterReader
          ref={readerRef}
          bookId={bookId}
          chapters={chapters}
          onReady={handleReaderReady}
          onTextSelect={handleTextSelect}
          onTocLoaded={setTocItems}
        />
      </FocusMode>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <ReaderToolbar
        bookTitle={bookTitle}
        bookId={bookId}
        onPrev={handlePrev}
        onNext={handleNext}
        onToggleTTS={handleStartTTS}
        isTTSActive={tts.state.isPlaying || tts.state.isPaused}
      />

      {/* Reader */}
      <div className="relative flex-1">
        <ChapterReader
          ref={readerRef}
          bookId={bookId}
          chapters={chapters}
          onReady={handleReaderReady}
          onTextSelect={handleTextSelect}
          onTocLoaded={setTocItems}
        />

        {/* Selection Popup */}
        {selectedText && (
          <SelectionPopup
            selection={selectedText}
            bookId={bookId}
            onTranslate={handleTranslate}
            onExplain={handleExplain}
            onSpeak={handleSpeak}
            onAddWord={handleAddWord}
          />
        )}
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

      {showAiPanel && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setShowAiPanel(false)}
          />
          <AiPanel onClose={() => setShowAiPanel(false)} bookId={bookId} />
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

      {/* TTS Controls */}
      {showTTSPanel && (
        <div className="fixed bottom-4 right-4 z-50 w-80">
          <TTSControls tts={tts} onClose={handleCloseTTSPanel} />
        </div>
      )}

      {/* Mini TTS Controls - show when TTS is active but panel is hidden */}
      {!showTTSPanel && (tts.state.isPlaying || tts.state.isPaused) && (
        <div className="fixed bottom-4 right-4 z-50">
          <MiniTTSControls tts={tts} onExpand={handleToggleTTSPanel} />
        </div>
      )}
    </div>
  );
}
