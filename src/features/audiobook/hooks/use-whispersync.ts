'use client';

import { useMemo } from 'react';
import { useAudiobookByBookId, useAudiobookWithProgress } from './use-audiobooks';
import { useBookDetail } from '@/features/library/hooks/use-books';
import type { Audiobook, AudiobookChapter } from '../types';
import type { BookDetail, Chapter } from '@/features/library/types';

interface WhispersyncMapping {
  /** Audiobook chapter index → Book chapter ID */
  audioToBook: Map<number, string>;
  /** Book chapter ID → Audiobook chapter index */
  bookToAudio: Map<string, number>;
}

interface WhispersyncFromBook {
  audiobook: Audiobook | null;
  isLoading: boolean;
  hasAudiobook: boolean;
  /** Get the audiobook chapter index for a given book chapter ID */
  getAudioChapterIndex: (bookChapterId: string) => number | undefined;
  mapping: WhispersyncMapping | null;
}

interface WhispersyncFromAudiobook {
  book: BookDetail | null;
  isLoading: boolean;
  hasBook: boolean;
  /** Get the book chapter ID for a given audiobook chapter index */
  getBookChapterId: (audioChapterIndex: number) => string | undefined;
  mapping: WhispersyncMapping | null;
}

/**
 * Build chapter mapping between audiobook and ebook
 */
function buildMapping(chapters: AudiobookChapter[]): WhispersyncMapping {
  const audioToBook = new Map<number, string>();
  const bookToAudio = new Map<string, number>();

  chapters.forEach((chapter, index) => {
    if (chapter.bookChapterId) {
      audioToBook.set(index, chapter.bookChapterId);
      bookToAudio.set(chapter.bookChapterId, index);
    }
  });

  return { audioToBook, bookToAudio };
}

/**
 * Hook for Whispersync when starting from a book (e.g. in the reader).
 * Checks if the book has an associated audiobook.
 */
export function useWhispersyncFromBook(bookId: string | undefined): WhispersyncFromBook {
  const { data: audiobook, isLoading } = useAudiobookByBookId(bookId);

  const mapping = useMemo(() => {
    if (!audiobook) return null;
    return buildMapping(audiobook.chapters);
  }, [audiobook]);

  const getAudioChapterIndex = (bookChapterId: string) => {
    return mapping?.bookToAudio.get(bookChapterId);
  };

  return {
    audiobook: audiobook ?? null,
    isLoading,
    hasAudiobook: !!audiobook,
    getAudioChapterIndex,
    mapping,
  };
}

/**
 * Hook for Whispersync when starting from an audiobook (e.g. in the player).
 * Checks if the audiobook has an associated ebook.
 */
export function useWhispersyncFromAudiobook(
  audiobook: Audiobook | null
): WhispersyncFromAudiobook {
  const bookId = audiobook?.bookId;
  const { data: book, isLoading } = useBookDetail(bookId ?? '');

  const mapping = useMemo(() => {
    if (!audiobook) return null;
    return buildMapping(audiobook.chapters);
  }, [audiobook]);

  const getBookChapterId = (audioChapterIndex: number) => {
    return mapping?.audioToBook.get(audioChapterIndex);
  };

  return {
    book: bookId ? (book ?? null) : null,
    isLoading: bookId ? isLoading : false,
    hasBook: !!bookId && !!book,
    getBookChapterId,
    mapping,
  };
}
