'use client';

import { forwardRef } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { sanitizeHtml } from '@/lib/sanitize';
import type { ParsedMobiChapter } from '../../utils/mobi-parser';

interface MobiChapterContentProps {
  chapter: ParsedMobiChapter | null;
  fontSize: number;
  currentChapterIndex: number;
  totalChapters: number;
  onPreviousChapter: () => void;
  onNextChapter: () => void;
}

export const MobiChapterContent = forwardRef<
  HTMLDivElement,
  MobiChapterContentProps
>(function MobiChapterContent(
  {
    chapter,
    fontSize,
    currentChapterIndex,
    totalChapters,
    onPreviousChapter,
    onNextChapter,
  },
  ref
) {
  return (
    <>
      <div
        ref={ref}
        className="flex-1 overflow-y-auto p-6"
        style={{ fontSize: `${fontSize}px` }}
      >
        {chapter && (
          <article className="mx-auto max-w-3xl">
            <h2 className="mb-6 border-b pb-4 text-2xl font-semibold">
              {chapter.title}
            </h2>
            {/* Content is sanitized via DOMPurify in sanitizeHtml() from @/lib/sanitize */}
            <div
              className="mobi-content space-y-4 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(chapter.html) }}
              style={{
                lineHeight: '1.8',
              }}
            />

            {/* Chapter navigation at bottom */}
            <div className="mt-12 flex justify-between border-t pt-6">
              <Button
                variant="outline"
                onClick={onPreviousChapter}
                disabled={currentChapterIndex <= 0}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous Chapter
              </Button>
              <Button
                variant="outline"
                onClick={onNextChapter}
                disabled={currentChapterIndex >= totalChapters - 1}
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
    </>
  );
});
