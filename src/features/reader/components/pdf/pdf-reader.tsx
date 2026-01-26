'use client';

import { useState, useCallback, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize,
  Grid,
  Settings,
  Download,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure pdf.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFReaderProps {
  url: string;
  title?: string;
  onBack?: () => void;
}

export function PDFReader({ url, title = 'PDF Document', onBack }: PDFReaderProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
    setError(null);
  }, []);

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('PDF load error:', error);
    setError('Failed to load PDF document');
    setIsLoading(false);
  }, []);

  const goToPreviousPage = useCallback(() => {
    setPageNumber((prev) => Math.max(1, prev - 1));
  }, []);

  const goToNextPage = useCallback(() => {
    setPageNumber((prev) => Math.min(numPages, prev + 1));
  }, [numPages]);

  const goToPage = useCallback((page: number) => {
    setPageNumber(Math.max(1, Math.min(page, numPages)));
  }, [numPages]);

  const zoomIn = useCallback(() => {
    setScale((prev) => Math.min(3, prev + 0.25));
  }, []);

  const zoomOut = useCallback(() => {
    setScale((prev) => Math.max(0.5, prev - 0.25));
  }, []);

  const rotate = useCallback(() => {
    setRotation((prev) => (prev + 90) % 360);
  }, []);

  const progress = useMemo(() => {
    if (numPages === 0) return 0;
    return (pageNumber / numPages) * 100;
  }, [pageNumber, numPages]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowLeft':
      case 'PageUp':
        goToPreviousPage();
        break;
      case 'ArrowRight':
      case 'PageDown':
      case ' ':
        goToNextPage();
        break;
      case '+':
      case '=':
        zoomIn();
        break;
      case '-':
        zoomOut();
        break;
    }
  }, [goToPreviousPage, goToNextPage, zoomIn, zoomOut]);

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
          <span className="max-w-[200px] truncate font-medium">{title}</span>
        </div>

        {/* Center controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPreviousPage}
            disabled={pageNumber <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[80px] text-center text-sm">
            {pageNumber} / {numPages}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNextPage}
            disabled={pageNumber >= numPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={zoomOut} disabled={scale <= 0.5}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="min-w-[50px] text-center text-xs">
            {Math.round(scale * 100)}%
          </span>
          <Button variant="ghost" size="icon" onClick={zoomIn} disabled={scale >= 3}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={rotate}>
            <RotateCw className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowThumbnails(!showThumbnails)}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Sheet open={showSettings} onOpenChange={setShowSettings}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>PDF Settings</SheetTitle>
                <SheetDescription>Adjust display settings</SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Zoom Level</label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[scale * 100]}
                      min={50}
                      max={300}
                      step={25}
                      onValueChange={([value]) => setScale(value / 100)}
                    />
                    <span className="w-12 text-right text-sm">
                      {Math.round(scale * 100)}%
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Go to Page</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={1}
                      max={numPages}
                      value={pageNumber}
                      onChange={(e) => goToPage(parseInt(e.target.value, 10) || 1)}
                      className="w-full rounded-md border px-3 py-2 text-sm"
                    />
                    <Button onClick={() => goToPage(pageNumber)}>Go</Button>
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
      <div className="flex flex-1 overflow-hidden">
        {/* Thumbnails sidebar */}
        {showThumbnails && (
          <div className="w-48 overflow-y-auto border-r bg-muted/50 p-2">
            {Array.from({ length: numPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => {
                  setPageNumber(page);
                  setShowThumbnails(false);
                }}
                className={`mb-2 w-full rounded border p-1 transition-colors ${
                  page === pageNumber
                    ? 'border-primary bg-primary/10'
                    : 'border-transparent hover:bg-muted'
                }`}
              >
                <Document file={url} loading="">
                  <Page
                    pageNumber={page}
                    width={160}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                  />
                </Document>
                <span className="mt-1 block text-center text-xs">{page}</span>
              </button>
            ))}
          </div>
        )}

        {/* PDF viewer */}
        <div className="flex flex-1 items-center justify-center overflow-auto p-4">
          {isLoading && (
            <div className="flex flex-col items-center gap-4">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">Loading PDF...</p>
            </div>
          )}

          <Document
            file={url}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading=""
            className="flex justify-center"
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              rotate={rotation}
              loading=""
              className="shadow-lg"
            />
          </Document>
        </div>
      </div>
    </div>
  );
}

export default PDFReader;
