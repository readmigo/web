'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type {
  AuthorDetail,
  AuthorListResponse,
  AuthorListItem,
} from '../types';

// Query keys
export const authorKeys = {
  all: ['authors'] as const,
  lists: () => [...authorKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) =>
    [...authorKeys.lists(), filters] as const,
  details: () => [...authorKeys.all, 'detail'] as const,
  detail: (id: string) => [...authorKeys.details(), id] as const,
};

// Fetch author detail
export function useAuthor(authorId: string) {
  return useQuery({
    queryKey: authorKeys.detail(authorId),
    queryFn: async () => {
      return apiClient.get<AuthorDetail>(`/authors/${authorId}`, {
        skipAuth: true,
      });
    },
    enabled: !!authorId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Fetch authors list
export function useAuthors(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
}) {
  return useQuery({
    queryKey: authorKeys.list(params || {}),
    queryFn: async () => {
      const queryParams: Record<string, string> = {};
      if (params?.page) queryParams.page = String(params.page);
      if (params?.pageSize) queryParams.pageSize = String(params.pageSize);
      if (params?.search) queryParams.search = params.search;

      return apiClient.get<AuthorListResponse>('/authors', {
        params: queryParams,
        skipAuth: true,
      });
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Follow/unfollow author
export function useFollowAuthor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      authorId,
      follow,
    }: {
      authorId: string;
      follow: boolean;
    }) => {
      if (follow) {
        return apiClient.post(`/authors/${authorId}/follow`);
      } else {
        return apiClient.delete(`/authors/${authorId}/follow`);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: authorKeys.detail(variables.authorId),
      });
    },
  });
}

// Like/unlike quote
export function useLikeQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      quoteId,
      like,
    }: {
      quoteId: string;
      authorId: string;
      like: boolean;
    }) => {
      if (like) {
        return apiClient.post(`/quotes/${quoteId}/like`);
      } else {
        return apiClient.delete(`/quotes/${quoteId}/like`);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: authorKeys.detail(variables.authorId),
      });
    },
  });
}

// Featured/popular authors for homepage
export function useFeaturedAuthors(limit: number = 6) {
  return useQuery({
    queryKey: [...authorKeys.lists(), 'featured', limit],
    queryFn: async () => {
      return apiClient.get<AuthorListItem[]>('/authors/featured', {
        params: { limit: String(limit) },
        skipAuth: true,
      });
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
