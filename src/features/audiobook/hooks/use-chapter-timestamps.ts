'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

export interface WordTimestamp {
  startTime: number;
  endTime: number;
  word: string;
}

export interface TimestampSegment {
  startTime: number;
  endTime: number;
  text: string;
  words?: WordTimestamp[];
}

interface TimestampsResponse {
  segments: TimestampSegment[];
}

export function useChapterTimestamps(
  audiobookId: string | undefined,
  chapterIndex: number | undefined
) {
  return useQuery({
    queryKey: ['audiobook-timestamps', audiobookId, chapterIndex],
    queryFn: async () => {
      if (!audiobookId || chapterIndex === undefined) return null;
      const res = await apiClient.get<TimestampsResponse>(
        `/audiobooks/${audiobookId}/chapters/${chapterIndex}/timestamps`
      );
      return res.segments;
    },
    enabled: !!audiobookId && chapterIndex !== undefined,
    staleTime: 60 * 60 * 1000,
    retry: 1,
  });
}
