'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

interface DanmakuItem {
  id: string;
  content: string;
  createdAt: string;
}

interface DanmakuListResponse {
  items: DanmakuItem[];
  total: number;
}

export function useDanmaku(audiobookId?: string, chapterNumber?: number) {
  return useQuery({
    queryKey: ['danmaku', audiobookId, chapterNumber],
    queryFn: async () => {
      const response = await apiClient.get<DanmakuListResponse>(
        `/audiobooks/${audiobookId}/chapters/${chapterNumber}/danmaku`
      );
      return response;
    },
    enabled: !!audiobookId && chapterNumber !== undefined,
    staleTime: 0, // Always refetch on page open
  });
}

export function useSendDanmaku() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      audiobookId,
      chapterNumber,
      content,
    }: {
      audiobookId: string;
      chapterNumber: number;
      content: string;
    }) => {
      const response = await apiClient.post<DanmakuItem>(
        `/audiobooks/${audiobookId}/chapters/${chapterNumber}/danmaku`,
        { content }
      );
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['danmaku', variables.audiobookId, variables.chapterNumber],
      });
    },
  });
}
