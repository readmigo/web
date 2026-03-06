'use client';

import { useQuery, useMutation, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type {
  PostcardsResponse,
  PostcardTemplate,
  Postcard,
  CreatePostcardRequest,
} from '../types';

export function usePostcards() {
  return useInfiniteQuery({
    queryKey: ['postcards', 'mine'],
    queryFn: ({ pageParam = 1 }) =>
      apiClient.get<PostcardsResponse>(
        `/postcards/mine?page=${pageParam}&limit=20`,
      ) as Promise<PostcardsResponse>,
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.postcards.length + (lastPage.page - 1) * lastPage.limit < lastPage.total
        ? lastPage.page + 1
        : undefined,
    staleTime: 60 * 1000,
  });
}

export function usePostcardTemplates() {
  return useQuery({
    queryKey: ['postcards', 'templates'],
    queryFn: () =>
      apiClient.get<PostcardTemplate[]>('/postcards/templates') as Promise<PostcardTemplate[]>,
    staleTime: 24 * 60 * 60 * 1000, // 24h cache
  });
}

export function useCreatePostcard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePostcardRequest) =>
      apiClient.post<{ postcard: Postcard }>('/postcards', data) as Promise<{ postcard: Postcard }>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['postcards', 'mine'] });
    },
  });
}

export function useDeletePostcard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/postcards/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['postcards', 'mine'] });
    },
  });
}
