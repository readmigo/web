'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type { PopularSearch } from '../types';

export function usePopularSearches(limit = 10) {
  return useQuery({
    queryKey: ['popularSearches', limit],
    queryFn: async () => {
      const response = await apiClient.get<PopularSearch[]>(
        '/search/popular',
        {
          params: { limit: String(limit) },
          skipAuth: true,
        }
      );
      return response;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useTrendingSearches(limit = 10) {
  return useQuery({
    queryKey: ['trendingSearches', limit],
    queryFn: async () => {
      const response = await apiClient.get<PopularSearch[]>(
        '/search/trending',
        {
          params: { limit: String(limit) },
          skipAuth: true,
        }
      );
      return response;
    },
    staleTime: 5 * 60 * 1000,
  });
}
