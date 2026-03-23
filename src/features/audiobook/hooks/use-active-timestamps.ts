'use client';

import { useChapterTimestamps, type TimestampSegment } from './use-chapter-timestamps';
import { useParagraphTimestamps } from './use-paragraph-timestamps';
import type { AudiobookChapter } from '../types';

/**
 * Unified hook: tries API timestamps first, falls back to paragraph CDN timestamps.
 */
export function useActiveTimestamps(
  audiobookId: string | undefined,
  chapterIndex: number | undefined,
  currentChapter: AudiobookChapter | null | undefined
): {
  data: TimestampSegment[] | null | undefined;
  isLoading: boolean;
  isError: boolean;
} {
  const isParagraphMode = !currentChapter?.audioUrl
    && currentChapter?.paragraphs
    && currentChapter.paragraphs.length > 0;

  // API-based timestamps (for non-paragraph chapters)
  const apiResult = useChapterTimestamps(
    isParagraphMode ? undefined : audiobookId,
    isParagraphMode ? undefined : chapterIndex
  );

  // CDN paragraph-based timestamps
  const paraResult = useParagraphTimestamps(
    isParagraphMode ? currentChapter : undefined
  );

  if (isParagraphMode) {
    return {
      data: paraResult.data,
      isLoading: paraResult.isLoading,
      isError: paraResult.isError,
    };
  }

  return {
    data: apiResult.data,
    isLoading: apiResult.isLoading,
    isError: apiResult.isError,
  };
}
