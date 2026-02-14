'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  parseMobiFile,
  parseMobiFromUrl,
  type ParsedMobiDocument,
} from '../../utils/mobi-parser';
import { MobiToolbar } from './mobi-toolbar';
import { MobiChapterContent } from './mobi-chapter-content';

interface MobiReaderProps {
  url?: string;
  file?: File;
  title?: string;
  onBack?: () => void;
}

export function MobiReader({
  url,
  file,
  title,
  onBack,
}: MobiReaderProps) {
  const [document, setDocument] = useState<ParsedMobiDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [fontSize, setFontSize] = useState(18);
  const [showChapterList, setShowChapterList] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Load document
  useEffect(() => {
    async function loadDocument() {
      setIsLoading(true);
      setError(null);

      try {
        let doc: ParsedMobiDocument;

        if (url) {
          doc = await parseMobiFromUrl(url);
        } else if (file) {
          const buffer = await file.arrayBuffer();
          doc = await parseMobiFile(buffer);
        } else {
          throw new Error('No file or URL provided');
        }

        setDocument(doc);
      } catch (err) {
        console.error('Failed to load MOBI:', err);
        setError(err instanceof Error ? err.message : 'Failed to load document');
      } finally {
        setIsLoading(false);
      }
    }

    loadDocument();
  }, [url, file]);

  const currentChapter = useMemo(() => {
    return document?.chapters[currentChapterIndex] || null;
  }, [document, currentChapterIndex]);

  const progress = useMemo(() => {
    if (!document || document.chapters.length === 0) return 0;
    return ((currentChapterIndex + 1) / document.chapters.length) * 100;
  }, [document, currentChapterIndex]);

  const goToPreviousChapter = useCallback(() => {
    setCurrentChapterIndex((prev) => Math.max(0, prev - 1));
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, []);

  const goToNextChapter = useCallback(() => {
    if (document) {
      setCurrentChapterIndex((prev) =>
        Math.min(document.chapters.length - 1, prev + 1)
      );
      if (contentRef.current) {
        contentRef.current.scrollTop = 0;
      }
    }
  }, [document]);

  const goToChapter = useCallback((index: number) => {
    setCurrentChapterIndex(index);
    setShowChapterList(false);
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, []);

  const increaseFontSize = useCallback(() => {
    setFontSize((prev) => Math.min(32, prev + 2));
  }, []);

  const decreaseFontSize = useCallback(() => {
    setFontSize((prev) => Math.max(12, prev - 2));
  }, []);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
        case 'PageUp':
          goToPreviousChapter();
          break;
        case 'ArrowRight':
        case 'PageDown':
          goToNextChapter();
          break;
        case '+':
        case '=':
          increaseFontSize();
          break;
        case '-':
          decreaseFontSize();
          break;
      }
    },
    [goToPreviousChapter, goToNextChapter, increaseFontSize, decreaseFontSize]
  );

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="mb-4 text-lg text-red-500">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading MOBI file...</p>
      </div>
    );
  }

  return (
    <div
      className="flex h-full flex-col bg-background"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* Toolbar */}
      <MobiToolbar
        title={title}
        documentTitle={document?.metadata.title}
        onBack={onBack}
        currentChapterIndex={currentChapterIndex}
        totalChapters={document?.chapters.length || 0}
        fontSize={fontSize}
        onPreviousChapter={goToPreviousChapter}
        onNextChapter={goToNextChapter}
        onIncreaseFontSize={increaseFontSize}
        onDecreaseFontSize={decreaseFontSize}
        onFontSizeChange={setFontSize}
        onGoToChapter={goToChapter}
        showMetadata={showMetadata}
        onShowMetadataChange={setShowMetadata}
        metadata={document?.metadata}
        showChapterList={showChapterList}
        onShowChapterListChange={setShowChapterList}
        chapters={document?.chapters || []}
        showSettings={showSettings}
        onShowSettingsChange={setShowSettings}
      />

      {/* Progress bar */}
      <div className="h-1 bg-muted">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Content area */}
      <MobiChapterContent
        ref={contentRef}
        chapter={currentChapter}
        fontSize={fontSize}
        currentChapterIndex={currentChapterIndex}
        totalChapters={document?.chapters.length || 0}
        onPreviousChapter={goToPreviousChapter}
        onNextChapter={goToNextChapter}
      />
    </div>
  );
}

export default MobiReader;
