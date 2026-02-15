'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type { BookList } from '../types';

interface BookListsResponse {
  items: BookList[];
}

export function useBookLists() {
  return useQuery({
    queryKey: ['booklists'],
    queryFn: async () => {
      const response = await apiClient.get<BookListsResponse>('/booklists', {
        params: { page: '1', limit: '20' },
        skipAuth: true,
      });
      return response.items;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useBookListDetail(id: string) {
  return useQuery({
    queryKey: ['booklist', id],
    queryFn: async () => {
      const response = await apiClient.get<BookList>(
        `/booklists/${id}`,
        { skipAuth: true }
      );
      return response;
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
}
