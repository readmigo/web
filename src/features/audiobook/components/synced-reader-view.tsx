'use client';

import { useEffect, useRef, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTranslations } from 'next-intl';
import { useChapterTimestamps, type TimestampSegment } from '../hooks/use-chapter-timestamps';

function binarySearchSegment(
  segments: TimestampSegment[],
  currentTime: number
): number {
  let lo = 0;
  let hi = segments.length - 1;
  let result = -1;

  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const seg = segments[mid];
    if (currentTime >= seg.startTime && currentTime < seg.endTime) {
      return mid;
    }
    if (currentTime < seg.startTime) {
      hi = mid - 1;
    } else {
      result = mid;
      lo = mid + 1;
    }
  }

  return result;
}

function binarySearchWord(
  words: { startTime: number; endTime: number; word: string }[],
  currentTime: number
): number {
  let lo = 0;
  let hi = words.length - 1;
  let result = -1;

  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const w = words[mid];
    if (currentTime >= w.startTime && currentTime < w.endTime) {
      return mid;
    }
    if (currentTime < w.startTime) {
      hi = mid - 1;
    } else {
      result = mid;
      lo = mid + 1;
    }
  }

  return result;
}

interface SyncedReaderViewProps {
  audiobookId: string;
  chapterIndex: number;
  currentTime: number;
  isActive: boolean;
  onSeek: (time: number) => void;
}

interface SyncState {
  segmentIndex: number;
  wordIndex: number;
}

export function SyncedReaderView({
  audiobookId,
  chapterIndex,
  currentTime,
  isActive,
  onSeek,
}: SyncedReaderViewProps) {
  const t = useTranslations('audiobooks');
  const { data: segments, isLoading, isError } = useChapterTimestamps(audiobookId, chapterIndex);

  const syncState = useRef<SyncState>({ segmentIndex: -1, wordIndex: -1 });
  const segmentRefs = useRef<Map<number, HTMLElement>>(new Map());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentTimeRef = useRef<number>(currentTime);

  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  const updateHighlight = useCallback(() => {
    if (!segments || segments.length === 0) return;

    const time = currentTimeRef.current;
    const newSegIdx = binarySearchSegment(segments, time);

    if (newSegIdx !== syncState.current.segmentIndex) {
      syncState.current.segmentIndex = newSegIdx;
      syncState.current.wordIndex = -1;

      const el = segmentRefs.current.get(newSegIdx);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    if (newSegIdx >= 0) {
      const seg = segments[newSegIdx];
      if (seg.words && seg.words.length > 0) {
        const newWordIdx = binarySearchWord(seg.words, time);
        syncState.current.wordIndex = newWordIdx;
      }
    }
  }, [segments]);

  useEffect(() => {
    if (!isActive || !segments) return;

    intervalRef.current = setInterval(updateHighlight, 100);

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive, segments, updateHighlight]);

  useEffect(() => {
    syncState.current = { segmentIndex: -1, wordIndex: -1 };
    segmentRefs.current.clear();
  }, [chapterIndex]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        {t('loadingLyrics')}
      </div>
    );
  }

  if (isError || !segments || segments.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        {t('chapterTextUnavailable')}
      </div>
    );
  }

  const currentSegIdx = syncState.current.segmentIndex;
  const currentWordIdx = syncState.current.wordIndex;

  return (
    <ScrollArea className="h-[calc(85vh-200px)]">
      <div className="space-y-3 p-4">
        {segments.map((seg, segIdx) => {
          const isCurrent = segIdx === currentSegIdx;

          return (
            <button
              key={segIdx}
              ref={(el) => {
                if (el) {
                  segmentRefs.current.set(segIdx, el);
                } else {
                  segmentRefs.current.delete(segIdx);
                }
              }}
              onClick={() => onSeek(seg.startTime)}
              className={[
                'w-full rounded-lg px-3 py-2 text-left text-sm leading-relaxed transition-colors',
                isCurrent
                  ? 'bg-primary/10 text-foreground'
                  : 'text-muted-foreground hover:bg-muted',
              ].join(' ')}
            >
              {seg.words && seg.words.length > 0 ? (
                <span>
                  {seg.words.map((w, wIdx) => (
                    <span
                      key={wIdx}
                      className={
                        isCurrent && wIdx === currentWordIdx
                          ? 'font-semibold text-primary'
                          : undefined
                      }
                    >
                      {w.word}
                      {wIdx < seg.words!.length - 1 ? ' ' : ''}
                    </span>
                  ))}
                </span>
              ) : (
                seg.text
              )}
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );
}
