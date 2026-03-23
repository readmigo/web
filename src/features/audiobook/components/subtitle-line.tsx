'use client';

import { useMemo } from 'react';
import { useActiveTimestamps } from '../hooks/use-active-timestamps';
import { useAudioPlayerStore } from '../stores/audio-player-store';

interface SubtitleLineProps {
  audiobookId: string;
  chapterIndex: number;
  currentTime: number;
}

/**
 * Single-line subtitle display showing the current segment text.
 * Mirrors iOS AudiobookPlayerView subtitle section.
 * Tap to expand to full lyrics view.
 */
export function SubtitleLine({ audiobookId, chapterIndex, currentTime }: SubtitleLineProps) {
  const currentChapter = useAudioPlayerStore((s) => s.currentChapter);
  const { data: segments } = useActiveTimestamps(audiobookId, chapterIndex, currentChapter);

  const currentText = useMemo(() => {
    if (!segments || segments.length === 0) return null;

    // Binary search for current segment
    let lo = 0;
    let hi = segments.length - 1;
    let result = -1;

    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      const seg = segments[mid];
      if (currentTime >= seg.startTime && currentTime < seg.endTime) {
        return seg.text;
      }
      if (currentTime < seg.startTime) {
        hi = mid - 1;
      } else {
        result = mid;
        lo = mid + 1;
      }
    }

    return result >= 0 ? segments[result].text : segments[0].text;
  }, [segments, currentTime]);

  if (!currentText) {
    return (
      <div className="flex h-14 items-center justify-center">
        <span className="text-sm text-muted-foreground/50">···</span>
      </div>
    );
  }

  return (
    <div className="flex h-14 items-center justify-center overflow-hidden">
      <p className="line-clamp-2 text-center text-sm leading-relaxed text-foreground/80 transition-opacity duration-150">
        {currentText}
      </p>
    </div>
  );
}
