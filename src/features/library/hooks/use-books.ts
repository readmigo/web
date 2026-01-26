'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type { Book, BookDetail } from '../types';

interface BooksParams {
  category?: string;
  difficulty?: number;
  page?: number;
  limit?: number;
  search?: string;
}

interface BooksResponse {
  data: Book[];
  total: number;
  page: number;
}

export function useBooks(params?: BooksParams) {
  return useQuery({
    queryKey: ['books', params],
    queryFn: async () => {
      // Convert params to string record for API
      const queryParams: Record<string, string> = {};
      if (params?.category) queryParams.category = params.category;
      if (params?.difficulty) queryParams.difficulty = String(params.difficulty);
      if (params?.page) queryParams.page = String(params.page);
      if (params?.limit) queryParams.limit = String(params.limit);
      if (params?.search) queryParams.search = params.search;

      const response = await apiClient.get<BooksResponse>('/books', {
        params: Object.keys(queryParams).length > 0 ? queryParams : undefined,
        skipAuth: true, // Books API is public
      });
      return response;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useBookDetail(bookId: string) {
  return useQuery({
    queryKey: ['book', bookId],
    queryFn: async () => {
      const response = await apiClient.get<{ data: BookDetail }>(
        `/books/${bookId}`,
        { skipAuth: true } // Books API is public
      );
      return response.data;
    },
    enabled: !!bookId,
    staleTime: 10 * 60 * 1000,
  });
}

export function useRecommendedBooks() {
  return useQuery({
    queryKey: ['books', 'recommended'],
    queryFn: async () => {
      const response = await apiClient.get<{ data: Book[] }>(
        '/books/recommended',
        { skipAuth: true } // Books API is public
      );
      return response.data;
    },
  });
}

export function usePopularBooks() {
  return useQuery({
    queryKey: ['books', 'popular'],
    queryFn: async () => {
      const response = await apiClient.get<{ data: Book[] }>(
        '/books/popular',
        { skipAuth: true } // Books API is public
      );
      return response.data;
    },
  });
}

export async function getBookById(id: string): Promise<BookDetail | null> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/books/${id}`,
      { next: { revalidate: 3600 } }
    );
    if (!response.ok) return null;
    const data = await response.json();
    return data.data;
  } catch {
    return null;
  }
}
