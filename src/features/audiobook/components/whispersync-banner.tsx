'use client';

import Link from 'next/link';
import { Headphones, BookOpen, ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { formatDuration } from '../stores/audio-player-store';
import type { Audiobook } from '../types';
import type { BookDetail } from '@/features/library/types';

interface WhispersyncToAudiobookProps {
  audiobook: Audiobook;
  currentBookChapterId?: string;
  audioChapterIndex?: number;
}

/**
 * Banner shown in the ebook reader when an associated audiobook exists.
 * "Listen to this chapter" prompt.
 */
export function WhispersyncToAudiobook({
  audiobook,
  currentBookChapterId,
  audioChapterIndex,
}: WhispersyncToAudiobookProps) {
  const t = useTranslations('audiobooks');

  const targetChapter =
    audioChapterIndex !== undefined
      ? audiobook.chapters[audioChapterIndex]
      : null;

  return (
    <Link
      href={`/audiobooks/${audiobook.id}`}
      className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 transition-colors hover:bg-primary/10"
    >
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
        <Headphones className="h-4 w-4 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{t('listenToChapter')}</p>
        {targetChapter && (
          <p className="truncate text-xs text-muted-foreground">
            {targetChapter.title} · {formatDuration(targetChapter.duration)}
          </p>
        )}
      </div>
      <ArrowRight className="h-4 w-4 flex-shrink-0 text-primary" />
    </Link>
  );
}

interface WhispersyncToBookProps {
  book: BookDetail;
  currentAudioChapterIndex: number;
  bookChapterId?: string;
}

/**
 * Banner shown in the audiobook player when an associated ebook exists.
 * "Read this chapter" prompt.
 */
export function WhispersyncToBook({
  book,
  currentAudioChapterIndex,
  bookChapterId,
}: WhispersyncToBookProps) {
  const t = useTranslations('audiobooks');

  const readUrl = bookChapterId
    ? `/read/${book.id}?chapter=${bookChapterId}`
    : `/read/${book.id}`;

  const bookChapter = bookChapterId
    ? book.chapters.find((ch) => ch.id === bookChapterId)
    : null;

  return (
    <Link
      href={readUrl}
      className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 transition-colors hover:bg-primary/10"
    >
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
        <BookOpen className="h-4 w-4 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{t('readThisChapter')}</p>
        {bookChapter && (
          <p className="truncate text-xs text-muted-foreground">
            {bookChapter.title}
          </p>
        )}
      </div>
      <ArrowRight className="h-4 w-4 flex-shrink-0 text-primary" />
    </Link>
  );
}
