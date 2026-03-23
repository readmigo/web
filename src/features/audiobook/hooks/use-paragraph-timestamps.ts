'use client';

import { useQuery } from '@tanstack/react-query';
import { log } from '@/lib/logger';
import type { AudiobookChapter } from '../types';
import type { TimestampSegment } from './use-chapter-timestamps';

interface ParagraphMeta {
  timestamps: {
    word: string;
    startTime: number;
    endTime: number;
    charStart?: number;
    charEnd?: number;
  }[];
}

/**
 * Fetch timestamps from paragraph-level CDN meta files.
 * Each paragraph has a `timestampsUrl` pointing to a `_meta.json` file
 * with word-level timing data.
 *
 * Returns segments compatible with TimestampSegment[] used by
 * SubtitleLine and SyncedReaderView.
 */
export function useParagraphTimestamps(
  chapter: AudiobookChapter | null | undefined
) {
  const paragraphs = chapter?.paragraphs;
  const chapterId = chapter?.id;

  return useQuery({
    queryKey: ['paragraph-timestamps', chapterId],
    queryFn: async (): Promise<TimestampSegment[]> => {
      if (!paragraphs || paragraphs.length === 0) return [];

      const segments: TimestampSegment[] = [];
      let chapterTimeOffset = 0;

      for (const para of paragraphs) {
        if (!para.timestampsUrl) {
          // No timestamps — create a single segment from the paragraph duration
          chapterTimeOffset += para.duration;
          continue;
        }

        try {
          const res = await fetch(para.timestampsUrl, { mode: 'cors' });
          if (!res.ok) {
            chapterTimeOffset += para.duration;
            continue;
          }

          const meta: ParagraphMeta = await res.json();
          if (!meta.timestamps || meta.timestamps.length === 0) {
            chapterTimeOffset += para.duration;
            continue;
          }

          // Group words into sentence-like segments (~80 chars)
          let currentWords: { word: string; startTime: number; endTime: number }[] = [];
          let currentText = '';

          for (const word of meta.timestamps) {
            currentWords.push({
              word: word.word,
              startTime: chapterTimeOffset + word.startTime,
              endTime: chapterTimeOffset + word.endTime,
            });
            currentText += (currentText ? ' ' : '') + word.word;

            // Split at sentence boundaries or ~80 chars
            const endsWithPunctuation = /[.!?;。！？；]$/.test(word.word);
            if (endsWithPunctuation || currentText.length >= 80) {
              segments.push({
                startTime: currentWords[0].startTime,
                endTime: currentWords[currentWords.length - 1].endTime,
                text: currentText,
                words: currentWords,
              });
              currentWords = [];
              currentText = '';
            }
          }

          // Flush remaining words
          if (currentWords.length > 0) {
            segments.push({
              startTime: currentWords[0].startTime,
              endTime: currentWords[currentWords.length - 1].endTime,
              text: currentText,
              words: currentWords,
            });
          }

          chapterTimeOffset += para.duration;
        } catch (error) {
          log.audiobook.debug('[paragraphTimestamps] failed to fetch meta', {
            url: para.timestampsUrl,
            error: (error as Error).message,
          });
          chapterTimeOffset += para.duration;
        }
      }

      log.audiobook.info('[paragraphTimestamps] loaded', {
        chapterId,
        segmentCount: segments.length,
        paragraphCount: paragraphs.length,
      });

      return segments;
    },
    enabled: !!chapterId && !!paragraphs && paragraphs.length > 0,
    staleTime: 60 * 60 * 1000,
    retry: 1,
  });
}
