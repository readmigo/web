'use client';

import { useState, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  url: string;
  currentPage: number;
  scale: number;
  onPageChange?: (page: number) => void;
  onDocumentLoad?: (numPages: number) => void;
  className?: string;
}

export function PdfViewer({
  url,
  currentPage,
  scale,
  onPageChange,
  onDocumentLoad,
  className,
}: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleDocumentLoadSuccess = useCallback(
    ({ numPages: pages }: { numPages: number }) => {
      setNumPages(pages);
      setIsLoading(false);
      setError(null);
      onDocumentLoad?.(pages);
    },
    [onDocumentLoad]
  );

  const handleDocumentLoadError = useCallback((err: Error) => {
    console.error('PDF load error:', err);
    setIsLoading(false);
    setError('无法加载 PDF 文件');
  }, []);

  const handlePageClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!onPageChange || numPages === 0) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const isLeftSide = clickX < rect.width / 2;

      if (isLeftSide && currentPage > 1) {
        onPageChange(currentPage - 1);
      } else if (!isLeftSide && currentPage < numPages) {
        onPageChange(currentPage + 1);
      }
    },
    [onPageChange, currentPage, numPages]
  );

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div
      className={cn('relative flex h-full items-center justify-center', className)}
      onClick={handlePageClick}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      <Document
        file={url}
        onLoadSuccess={handleDocumentLoadSuccess}
        onLoadError={handleDocumentLoadError}
        loading={null}
        className="flex justify-center"
      >
        <Page
          pageNumber={currentPage}
          scale={scale}
          loading={null}
          renderTextLayer={true}
          renderAnnotationLayer={true}
          className="shadow-lg"
        />
      </Document>
    </div>
  );
}
