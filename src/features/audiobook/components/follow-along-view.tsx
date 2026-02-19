'use client';

import { useEffect, useRef, useMemo } from 'react';
import { BookOpen, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useChapterText } from '../hooks/use-chapter-text';
import { useWhispersyncFromAudiobook } from '../hooks/use-whispersync';
import { useAudioPlayerStore } from '../stores/audio-player-store';
import type { Audiobook } from '../types';

interface FollowAlongViewProps {
  audiobook: Audiobook;
}

/**
 * Estimates which paragraph is currently being read based on audio progress.
 * Uses linear interpolation: (currentTime / chapterDuration) * totalCharacters
 * to find the approximate character offset, then maps to the closest paragraph.
 */
function estimateCurrentParagraph(
  currentTime: number,
  chapterDuration: number,
  paragraphs: Array<{ index: number; text: string }>,
  totalCharacters: number
): number {
  if (paragraphs.length === 0 || chapterDuration <= 0) return 0;

  const progress = Math.min(1, currentTime / chapterDuration);
  const targetCharOffset = progress * totalCharacters;

  let accumulated = 0;
  for (let i = 0; i < paragraphs.length; i++) {
    accumulated += paragraphs[i].text.length;
    if (accumulated >= targetCharOffset) {
      return i;
    }
  }

  return paragraphs.length - 1;
}

export function FollowAlongView({ audiobook }: FollowAlongViewProps) {
  const t = useTranslations('audiobooks');
  const containerRef = useRef<HTMLDivElement>(null);
  const paragraphRefs = useRef<Map<number, HTMLParagraphElement>>(new Map());

  const { chapterIndex, currentTime, duration } = useAudioPlayerStore();
  const { book, hasBook, getBookChapterId } = useWhispersyncFromAudiobook(audiobook);

  // Get the book chapter ID for the current audio chapter
  const bookChapterId = getBookChapterId(chapterIndex);

  // Fetch chapter text
  const { data: chapterData, isLoading } = useChapterText(
    book?.id,
    bookChapterId
  );

  const paragraphs = chapterData?.paragraphs ?? [];
  const totalCharacters = chapterData?.totalCharacters ?? 0;

  // Estimate the current paragraph
  const currentParagraphIndex = useMemo(
    () => estimateCurrentParagraph(currentTime, duration, paragraphs, totalCharacters),
    [currentTime, duration, paragraphs, totalCharacters]
  );

  // Auto-scroll to current paragraph
  useEffect(() => {
    const el = paragraphRefs.current.get(currentParagraphIndex);
    if (el && containerRef.current) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentParagraphIndex]);

  // No associated ebook
  if (!hasBook || !bookChapterId) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
        <BookOpen className="h-10 w-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {t('followAlongUnavailable')}
        </p>
      </div>
    );
  }

  // Loading
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // No paragraphs found
  if (paragraphs.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
        <BookOpen className="h-10 w-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {t('followAlongNoContent')}
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-full overflow-y-auto px-6 py-4">
      {chapterData?.title && (
        <h3 className="mb-4 text-center text-lg font-semibold">{chapterData.title}</h3>
      )}
      <div className="mx-auto max-w-lg space-y-3">
        {paragraphs.map((para) => {
          const isCurrent = para.index === currentParagraphIndex;
          const isPast = para.index < currentParagraphIndex;

          return (
            <p
              key={para.index}
              ref={(el) => {
                if (el) paragraphRefs.current.set(para.index, el);
              }}
              className={`rounded-md px-2 py-1 text-sm leading-relaxed transition-all duration-300 ${
                isCurrent
                  ? 'bg-primary/10 text-foreground font-medium'
                  : isPast
                    ? 'text-muted-foreground/60'
                    : 'text-muted-foreground'
              }`}
            >
              {para.text}
            </p>
          );
        })}
      </div>
    </div>
  );
}
