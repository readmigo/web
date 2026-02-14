'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type { Book } from '../types';

interface CategoryBooksResponse {
  data: Book[];
  total: number;
  page: number;
}

const DEFAULT_PAGE_SIZE = 20;

export function useCategoryBooks(categoryId: string, limit?: number) {
  const pageSize = limit ?? DEFAULT_PAGE_SIZE;

  return useInfiniteQuery({
    queryKey: ['category-books', categoryId, pageSize],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await apiClient.get<CategoryBooksResponse>(
        `/categories/${categoryId}/books`,
        {
          params: {
            page: String(pageParam),
            limit: String(pageSize),
          },
          skipAuth: true,
        }
      );
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
    enabled: !!categoryId,
    staleTime: 5 * 60 * 1000,
  });
}
