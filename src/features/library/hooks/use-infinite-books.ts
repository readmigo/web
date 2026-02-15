'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type { Book } from '../types';

interface InfiniteBooksParams {
  category?: string;
  difficulty?: number;
  search?: string;
  limit?: number;
}

interface DiscoverBookItem {
  book: Book;
  scores?: {
    final: number;
    quality: number;
    popularity: number;
    freshness: number;
  };
  source?: string;
}

interface BooksApiResponse {
  books?: DiscoverBookItem[];
  items?: Book[];
  data?: Book[];
  total: number;
  page: number;
  pageSize?: number;
  hasMore?: boolean;
}

interface BooksPage {
  data: Book[];
  total: number;
  page: number;
}

const DEFAULT_PAGE_SIZE = 20;

export function useInfiniteBooks(params?: InfiniteBooksParams) {
  const limit = params?.limit ?? DEFAULT_PAGE_SIZE;

  return useInfiniteQuery({
    queryKey: ['books', 'infinite', params],
    queryFn: async ({ pageParam = 1 }) => {
      const queryParams: Record<string, string> = {};
      if (params?.category) queryParams.category = params.category;
      if (params?.difficulty) queryParams.difficulty = String(params.difficulty);
      if (params?.search) queryParams.search = params.search;
      queryParams.page = String(pageParam);
      queryParams.pageSize = String(limit);

      const response = await apiClient.get<BooksApiResponse>('/recommendation/discover', {
        params: queryParams,
        skipAuth: true,
      });
      // /recommendation/discover returns { books: [{ book, scores, source }] }
      const books = response.books
        ? response.books.map((item) => item.book)
        : response.items ?? response.data ?? [];
      return {
        data: books,
        total: response.total ?? 0,
        page: response.page ?? pageParam,
      } as BooksPage;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const loadedCount = allPages.reduce((sum, page) => sum + (page.data?.length ?? 0), 0);
      if (loadedCount >= lastPage.total) {
        return undefined;
      }
      return allPages.length + 1;
    },
    staleTime: 5 * 60 * 1000,
  });
}
