'use client';

import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type { Quote, QuotesResponse, QuoteTag } from '../types';

export function useDailyQuote() {
  return useQuery({
    queryKey: ['quotes', 'daily'],
    queryFn: () => apiClient.get<Quote>('/quotes/daily') as Promise<Quote>,
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

export function useTrendingQuotes() {
  return useQuery({
    queryKey: ['quotes', 'trending'],
    queryFn: () => apiClient.get<Quote[]>('/quotes/trending') as Promise<Quote[]>,
    staleTime: 10 * 60 * 1000,
  });
}

export function useQuoteTags() {
  return useQuery({
    queryKey: ['quotes', 'tags'],
    queryFn: () => apiClient.get<QuoteTag[]>('/quotes/tags') as Promise<QuoteTag[]>,
    staleTime: 30 * 60 * 1000,
  });
}

export function useInfiniteQuotes(params?: { tag?: string; search?: string }) {
  return useInfiniteQuery({
    queryKey: ['quotes', 'list', params],
    queryFn: async ({ pageParam = 1 }) => {
      const searchParams = new URLSearchParams();
      searchParams.set('page', String(pageParam));
      searchParams.set('limit', '20');
      if (params?.tag) searchParams.set('tag', params.tag);
      if (params?.search) searchParams.set('search', params.search);
      return apiClient.get<QuotesResponse>(`/quotes?${searchParams}`) as Promise<QuotesResponse>;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
  });
}

export function useToggleLike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ quoteId, isLiked }: { quoteId: string; isLiked: boolean }) => {
      if (isLiked) {
        await apiClient.delete(`/quotes/${quoteId}/like`);
      } else {
        await apiClient.post(`/quotes/${quoteId}/like`, {});
      }
      return { quoteId, newIsLiked: !isLiked };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
  });
}
