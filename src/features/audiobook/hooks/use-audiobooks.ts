'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type {
  Audiobook,
  AudiobookListItem,
  AudiobookWithProgress,
  AudiobookProgress,
  AudiobooksQueryParams,
  AudiobooksResponse,
  StartAudiobookRequest,
  UpdateProgressRequest,
} from '../types';

// ============ Query Hooks ============

/**
 * Fetch list of audiobooks with pagination and filters
 */
export function useAudiobooks(params?: AudiobooksQueryParams) {
  return useQuery({
    queryKey: ['audiobooks', params],
    queryFn: async () => {
      const queryParams: Record<string, string> = {};
      if (params?.page) queryParams.page = String(params.page);
      if (params?.limit) queryParams.limit = String(params.limit);
      if (params?.bookId) queryParams.bookId = params.bookId;
      if (params?.hasBookSync !== undefined) queryParams.hasBookSync = String(params.hasBookSync);
      if (params?.language) queryParams.language = params.language;
      if (params?.search) queryParams.search = params.search;
      if (params?.sortBy) queryParams.sortBy = params.sortBy;
      if (params?.sortOrder) queryParams.sortOrder = params.sortOrder;

      const response = await apiClient.get<AudiobooksResponse>('/audiobooks', {
        params: Object.keys(queryParams).length > 0 ? queryParams : undefined,
      });
      return response;
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch available audiobook languages
 */
export function useAudiobookLanguages() {
  return useQuery({
    queryKey: ['audiobooks', 'languages'],
    queryFn: async () => {
      const response = await apiClient.get<{ data: string[] }>('/audiobooks/languages');
      return response.data || [];
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

/**
 * Fetch user's recently listened audiobooks
 */
export function useRecentlyListened(limit = 10) {
  return useQuery({
    queryKey: ['audiobooks', 'recently-listened', limit],
    queryFn: async () => {
      const response = await apiClient.get<{ data: AudiobookWithProgress[] }>(
        '/audiobooks/recently-listened',
        { params: { limit: String(limit) } }
      );
      return response.data || [];
    },
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Fetch audiobook by ID with all chapters
 */
export function useAudiobook(audiobookId: string | undefined) {
  return useQuery({
    queryKey: ['audiobook', audiobookId],
    queryFn: async () => {
      if (!audiobookId) return null;
      const response = await apiClient.get<{ data: Audiobook }>(`/audiobooks/${audiobookId}`);
      return response.data;
    },
    enabled: !!audiobookId,
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Fetch audiobook with user's progress
 */
export function useAudiobookWithProgress(audiobookId: string | undefined) {
  return useQuery({
    queryKey: ['audiobook', audiobookId, 'with-progress'],
    queryFn: async () => {
      if (!audiobookId) return null;
      const response = await apiClient.get<{ data: AudiobookWithProgress }>(
        `/audiobooks/${audiobookId}/with-progress`
      );
      return response.data;
    },
    enabled: !!audiobookId,
    staleTime: 60 * 1000,
  });
}

/**
 * Fetch audiobook associated with a specific book (for Whispersync)
 */
export function useAudiobookByBookId(bookId: string | undefined) {
  return useQuery({
    queryKey: ['audiobook', 'book', bookId],
    queryFn: async () => {
      if (!bookId) return null;
      try {
        const response = await apiClient.get<{ data: Audiobook }>(`/audiobooks/book/${bookId}`);
        return response.data;
      } catch {
        // 404 is expected if no audiobook exists for this book
        return null;
      }
    },
    enabled: !!bookId,
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Fetch user's progress for an audiobook
 */
export function useAudiobookProgress(audiobookId: string | undefined) {
  return useQuery({
    queryKey: ['audiobook', audiobookId, 'progress'],
    queryFn: async () => {
      if (!audiobookId) return null;
      try {
        const response = await apiClient.get<{ data: AudiobookProgress }>(
          `/audiobooks/${audiobookId}/progress`
        );
        return response.data;
      } catch {
        return null;
      }
    },
    enabled: !!audiobookId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

// ============ Mutation Hooks ============

/**
 * Start listening to an audiobook
 */
export function useStartAudiobook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      audiobookId,
      request,
    }: {
      audiobookId: string;
      request?: StartAudiobookRequest;
    }) => {
      const response = await apiClient.post<{ data: AudiobookProgress }>(
        `/audiobooks/${audiobookId}/start`,
        request || {}
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['audiobook', variables.audiobookId, 'progress'],
      });
      queryClient.invalidateQueries({
        queryKey: ['audiobooks', 'recently-listened'],
      });
    },
  });
}

/**
 * Update listening progress
 */
export function useUpdateAudiobookProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      audiobookId,
      request,
    }: {
      audiobookId: string;
      request: UpdateProgressRequest;
    }) => {
      const response = await apiClient.post<{ data: AudiobookProgress }>(
        `/audiobooks/${audiobookId}/progress`,
        request
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['audiobook', variables.audiobookId, 'progress'],
      });
    },
  });
}
