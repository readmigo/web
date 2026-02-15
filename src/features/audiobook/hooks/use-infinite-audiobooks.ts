'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type { AudiobooksResponse } from '../types';

interface InfiniteAudiobooksParams {
  language?: string;
  search?: string;
  limit?: number;
}

const DEFAULT_PAGE_SIZE = 20;

export function useInfiniteAudiobooks(params?: InfiniteAudiobooksParams) {
  const limit = params?.limit ?? DEFAULT_PAGE_SIZE;

  return useInfiniteQuery({
    queryKey: ['audiobooks', 'infinite', params],
    queryFn: async ({ pageParam = 1 }) => {
      const queryParams: Record<string, string> = {};
      if (params?.language) queryParams.language = params.language;
      if (params?.search) queryParams.search = params.search;
      queryParams.page = String(pageParam);
      queryParams.limit = String(limit);

      const response = await apiClient.get<AudiobooksResponse>('/audiobooks', {
        params: queryParams,
      });
      return response;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const loadedCount = allPages.reduce((sum, page) => sum + page.data.length, 0);
      if (loadedCount >= lastPage.total) {
        return undefined;
      }
      return allPages.length + 1;
    },
    staleTime: 5 * 60 * 1000,
  });
}
