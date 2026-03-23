'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { apiClient } from '@/lib/api/client';
import { log } from '@/lib/logger';
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
 * Skips request when user is not logged in
 */
export function useRecentlyListened(limit = 10) {
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;

  return useQuery({
    queryKey: ['audiobooks', 'recently-listened', limit],
    queryFn: async () => {
      const response = await apiClient.get<{ data: AudiobookWithProgress[] }>(
        '/audiobooks/recently-listened',
        { params: { limit: String(limit) }, noRedirectOn401: true }
      );
      return response.data || [];
    },
    enabled: isAuthenticated,
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
 * Falls back to audiobook-only data if user is not authenticated
 */
export function useAudiobookWithProgress(audiobookId: string | undefined) {
  return useQuery({
    queryKey: ['audiobook', audiobookId, 'with-progress'],
    queryFn: async () => {
      if (!audiobookId) {
        log.audiobook.debug('[detail] audiobookId is empty, skip fetch');
        return null;
      }
      log.audiobook.info('[detail] start loading audiobook', { audiobookId });
      try {
        log.audiobook.debug('[detail] trying /with-progress endpoint', { audiobookId });
        const response = await apiClient.get<{ data: AudiobookWithProgress }>(
          `/audiobooks/${audiobookId}/with-progress`,
          { noRedirectOn401: true }
        );
        log.audiobook.info('[detail] /with-progress succeeded', {
          audiobookId,
          hasData: !!response.data,
          title: response.data?.title,
        });
        return response.data;
      } catch (primaryError) {
        log.audiobook.warn('[detail] /with-progress failed, falling back', {
          audiobookId,
          error: primaryError instanceof Error ? primaryError.message : String(primaryError),
          status: (primaryError as { status?: number }).status,
        });
        try {
          log.audiobook.debug('[detail] trying fallback /audiobooks/{id}', { audiobookId });
          const response = await apiClient.get<{ data: Audiobook }>(
            `/audiobooks/${audiobookId}`,
            { noRedirectOn401: true }
          );
          log.audiobook.info('[detail] fallback succeeded', {
            audiobookId,
            hasData: !!response.data,
            title: response.data?.title,
          });
          return response.data as AudiobookWithProgress;
        } catch (fallbackError) {
          log.audiobook.error('[detail] fallback also failed', {
            audiobookId,
            error: fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
            status: (fallbackError as { status?: number }).status,
          });
          throw fallbackError;
        }
      }
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
          `/audiobooks/${audiobookId}/progress`,
          { noRedirectOn401: true }
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
