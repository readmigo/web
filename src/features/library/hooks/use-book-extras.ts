'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type { ReadingGuide, BookContext } from '../types';

export function useReadingGuide(bookId: string) {
  return useQuery({
    queryKey: ['book', bookId, 'reading-guide'],
    queryFn: async () => {
      const response = await apiClient.get<{ data: ReadingGuide }>(
        `/book/${bookId}/reading-guide`,
        { skipAuth: true }
      );
      return response.data;
    },
    enabled: !!bookId,
    staleTime: 10 * 60 * 1000,
  });
}

export function useBookContext(bookId: string) {
  return useQuery({
    queryKey: ['book', bookId, 'context'],
    queryFn: async () => {
      const response = await apiClient.get<{ data: BookContext }>(
        `/book/${bookId}/context`,
        { skipAuth: true }
      );
      return response.data;
    },
    enabled: !!bookId,
    staleTime: 10 * 60 * 1000,
  });
}
