'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type { BookList } from '../types';

interface BookListsResponse {
  data: BookList[];
}

interface BookListDetailResponse {
  data: BookList;
}

export function useBookLists() {
  return useQuery({
    queryKey: ['book-lists'],
    queryFn: async () => {
      const response = await apiClient.get<BookListsResponse>('/book-lists', {
        skipAuth: true,
      });
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useBookListDetail(id: string) {
  return useQuery({
    queryKey: ['book-list', id],
    queryFn: async () => {
      const response = await apiClient.get<BookListDetailResponse>(
        `/book-lists/${id}`,
        { skipAuth: true }
      );
      return response.data;
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
}
