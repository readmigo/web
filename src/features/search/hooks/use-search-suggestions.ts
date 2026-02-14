'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type { SearchSuggestion } from '../types';

export function useSearchSuggestions(query: string, limit = 5) {
  return useQuery({
    queryKey: ['searchSuggestions', query, limit],
    queryFn: async () => {
      const response = await apiClient.get<SearchSuggestion[]>(
        '/search/suggestions',
        {
          params: { q: query, limit: String(limit) },
          skipAuth: true,
        }
      );
      return response;
    },
    enabled: query.length >= 2,
    staleTime: 2 * 60 * 1000,
  });
}
