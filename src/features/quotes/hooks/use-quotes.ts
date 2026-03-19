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

export function useQuote(id: string) {
  return useQuery({
    queryKey: ['quotes', id],
    queryFn: () => apiClient.get<Quote>(`/quotes/${id}`) as Promise<Quote>,
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useInfiniteQuotes(params?: {
  tag?: string;
  search?: string;
  authorId?: string;
  bookId?: string;
}) {
  return useInfiniteQuery({
    queryKey: ['quotes', 'list', params],
    queryFn: async ({ pageParam = 1 }) => {
      const searchParams = new URLSearchParams();
      searchParams.set('page', String(pageParam));
      searchParams.set('limit', '20');
      if (params?.tag) searchParams.set('tag', params.tag);
      if (params?.search) searchParams.set('search', params.search);
      if (params?.authorId) searchParams.set('authorId', params.authorId);
      if (params?.bookId) searchParams.set('bookId', params.bookId);
      return apiClient.get<QuotesResponse>(`/quotes?${searchParams}`) as Promise<QuotesResponse>;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
  });
}

export function useFavoriteQuotes() {
  return useInfiniteQuery({
    queryKey: ['quotes', 'favorites'],
    queryFn: async ({ pageParam = 1 }) =>
      apiClient.get<QuotesResponse>(
        `/quotes/favorites?page=${pageParam}&limit=20`,
      ) as Promise<QuotesResponse>,
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
