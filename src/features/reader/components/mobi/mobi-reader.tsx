'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  ChevronLeft,
  ChevronRight,
  Settings,
  List,
  ZoomIn,
  ZoomOut,
  User,
  BookOpen,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  parseMobiFile,
  parseMobiFromUrl,
  type ParsedMobiDocument,
  type ParsedMobiChapter,
} from '../../utils/mobi-parser';

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
      <div className="flex h-14 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
          <span className="max-w-[200px] truncate font-medium">
            {title || document?.metadata.title || 'Document'}
          </span>
        </div>

        {/* Center controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPreviousChapter}
            disabled={currentChapterIndex <= 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[100px] text-center text-sm">
            {currentChapterIndex + 1} / {document?.chapters.length || 0}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNextChapter}
            disabled={
              !document || currentChapterIndex >= document.chapters.length - 1
            }
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={decreaseFontSize}
            disabled={fontSize <= 12}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="min-w-[40px] text-center text-xs">{fontSize}px</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={increaseFontSize}
            disabled={fontSize >= 32}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>

          {/* Metadata */}
          <Sheet open={showMetadata} onOpenChange={setShowMetadata}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <BookOpen className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Book Information</SheetTitle>
                <SheetDescription>MOBI metadata</SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Title</label>
                  <p className="text-sm">{document?.metadata.title || 'Unknown'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Author</label>
                  <p className="text-sm">{document?.metadata.author || 'Unknown'}</p>
                </div>
                {document?.metadata.publisher && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Publisher</label>
                    <p className="text-sm">{document.metadata.publisher}</p>
                  </div>
                )}
                {document?.metadata.isbn && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">ISBN</label>
                    <p className="text-sm">{document.metadata.isbn}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Language</label>
                  <p className="text-sm">{document?.metadata.language || 'en'}</p>
                </div>
                {document?.metadata.description && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Description</label>
                    <p className="text-sm">{document.metadata.description}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Chapters</label>
                  <p className="text-sm">{document?.chapters.length || 0}</p>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Chapter list */}
          <Sheet open={showChapterList} onOpenChange={setShowChapterList}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <List className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle>Chapters</SheetTitle>
                <SheetDescription>
                  {document?.chapters.length || 0} chapters
                </SheetDescription>
              </SheetHeader>
              <div className="mt-4 max-h-[80vh] overflow-y-auto">
                {document?.chapters.map((chapter, index) => (
                  <button
                    key={chapter.id}
                    onClick={() => goToChapter(index)}
                    className={`w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted ${
                      index === currentChapterIndex
                        ? 'bg-primary/10 font-medium text-primary'
                        : ''
                    }`}
                  >
                    <span className="mr-2 text-muted-foreground">
                      {index + 1}.
                    </span>
                    {chapter.title}
                  </button>
                ))}
              </div>
            </SheetContent>
          </Sheet>

          {/* Settings */}
          <Sheet open={showSettings} onOpenChange={setShowSettings}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Reading Settings</SheetTitle>
                <SheetDescription>Customize your reading experience</SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Font Size</label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[fontSize]}
                      min={12}
                      max={32}
                      step={2}
                      onValueChange={([value]) => setFontSize(value)}
                    />
                    <span className="w-12 text-right text-sm">{fontSize}px</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Go to Chapter</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={1}
                      max={document?.chapters.length || 1}
                      value={currentChapterIndex + 1}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (val >= 1 && val <= (document?.chapters.length || 1)) {
                          goToChapter(val - 1);
                        }
                      }}
                      className="w-full rounded-md border px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-muted">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Content area */}
      <div
        ref={contentRef}
        className="flex-1 overflow-y-auto p-6"
        style={{ fontSize: `${fontSize}px` }}
      >
        {currentChapter && (
          <article className="mx-auto max-w-3xl">
            <h2 className="mb-6 border-b pb-4 text-2xl font-semibold">
              {currentChapter.title}
            </h2>
            <div
              className="mobi-content space-y-4 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: currentChapter.html }}
              style={{
                lineHeight: '1.8',
              }}
            />

            {/* Chapter navigation at bottom */}
            <div className="mt-12 flex justify-between border-t pt-6">
              <Button
                variant="outline"
                onClick={goToPreviousChapter}
                disabled={currentChapterIndex <= 0}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous Chapter
              </Button>
              <Button
                variant="outline"
                onClick={goToNextChapter}
                disabled={
                  !document ||
                  currentChapterIndex >= document.chapters.length - 1
                }
              >
                Next Chapter
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </article>
        )}
      </div>

      {/* Custom styles for MOBI content */}
      <style jsx global>{`
        .mobi-content p {
          text-indent: 2em;
          margin: 0.8em 0;
        }
        .mobi-content img {
          max-width: 100%;
          height: auto;
        }
        .mobi-content h1, .mobi-content h2, .mobi-content h3 {
          margin-top: 1.5em;
          margin-bottom: 0.5em;
        }
      `}</style>
    </div>
  );
}

export default MobiReader;
