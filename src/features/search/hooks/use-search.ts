'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { trackEvent } from '@/lib/analytics';
import type { SearchResponse } from '../types';

export function useSearch(query: string, limit = 5) {
  return useQuery({
    queryKey: ['search', query, limit],
    queryFn: async () => {
      const response = await apiClient.get<SearchResponse>('/search', {
        params: { q: query, limit: String(limit) },
        skipAuth: true,
      });
      trackEvent('library_search_performed', {
        query,
        results_count: response.books?.items?.length ?? 0,
      });
      return response;
    },
    enabled: query.length >= 2,
    staleTime: 2 * 60 * 1000,
  });
}
